/* produits.html · script de page (ex-inline, sorti dans ce fichier en octobre 2026 : cache navigateur,
   syntaxe vérifiée par npm run check, prêt pour une CSP sans 'unsafe-inline').
   Comportement identique : un module inline s'exécute lui aussi après l'analyse du document. */
import { initShell } from "/shell.mjs";
import { fetchProducts, fetchCollections, fetchPromos, applyPromos, loadNavigation, paintBreadcrumb } from "/catalog-data.mjs";
import { productCard, restoreSelectionPosition } from "/product-grid.mjs";
import { slugify, escapeHtml } from "/format.mjs";
import { bindFamilyRails } from "/family-rail.js";
const catalogueLanding = document.querySelector('[data-catalogue-landing]');
const landingTitle = catalogueLanding?.querySelector('[data-plp-title]').textContent;
const landingDescription = catalogueLanding?.querySelector('[data-plp-sub]').textContent;
const catalogueIconSeed = catalogueLanding ? JSON.parse(document.querySelector('#catalogue-icons-initial').textContent) : null;
const catalogueIconRail = catalogueLanding?.querySelector('[data-catalogue-icons]');
function paintCatalogueIcons(source) {
  if (!catalogueIconRail || catalogueIconRail.dataset.source === source) return;
  catalogueIconRail.innerHTML = catalogueIconSeed.items.map(p => productCard(p, source)).join('');
  catalogueIconRail.dataset.source = source;
}
if (catalogueLanding) {
  paintCatalogueIcons(location.pathname + location.search);
  bindFamilyRails(catalogueLanding);
  if (catalogueIconRail) restoreSelectionPosition(catalogueIconRail);
}
// initShell is called below — the active nav entry depends on the route
// (designer / brand / mobilier), so it waits until the URL is parsed.

import { listingTrail, brandHref } from '/navigation.mjs';
import { walkCatalog, sortCatalog, catalogPagination, DISPLAY_PAGE_SIZE } from '/catalog-pagination.mjs';
const navigation = await loadNavigation();
const COLL_TITLES = Object.fromEntries(Object.entries(navigation.collections).map(([h, c]) => [h, c.label]));
const BRAND_HANDLES = new Set(Object.entries(navigation.collections).filter(([, c]) => c.kind === 'brand').map(([h]) => h));
const grid = document.querySelector("[data-grid]");

// Toggle colonnes (mobile) — persistant en localStorage.
const colsToggle = document.querySelector("[data-cols-toggle]");
if (grid && colsToggle) {
  const setCols = (c) => {
    grid.dataset.cols = c;
    const pg = document.querySelector("[data-pop-grid]");   // la bande "populaires" est aussi un .pgrid
    if (pg) pg.dataset.cols = c;
    try { localStorage.setItem("plp-cols", c); } catch (e) {}
    colsToggle.querySelectorAll(".cols-btn").forEach((b) =>
      b.setAttribute("aria-pressed", b.dataset.cols === c ? "true" : "false"));
    // 1↔2 colonnes change fortement la hauteur de page : si on était scrollé bas,
    // ne pas laisser l'utilisateur « dans le vide » sous le footer (no-op sinon).
    requestAnimationFrame(() => {
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY > maxY) window.scrollTo(0, Math.max(0, maxY));
    });
  };
  let saved = "2"; try { if (localStorage.getItem("plp-cols") === "1") saved = "1"; } catch (e) {}
  setCols(saved);
  colsToggle.addEventListener("click", (e) => {
    const b = e.target.closest(".cols-btn"); if (b) setCols(b.dataset.cols);
  });
}
const popGrid = document.querySelector("[data-pop-grid]");
const popSection = document.querySelector("[data-pop-section]");
const countEl = document.querySelector("[data-plp-count]");
const catalogLoadingEl = document.querySelector("[data-plp-loading]");
const brandSel = document.querySelector("[data-filter-brand]");
const sortSel = document.querySelector("[data-sort]");
const chipsBar = document.querySelector("[data-chips]");
const paginationEl = document.querySelector("[data-pagination]");
const titleEl = document.querySelector("[data-plp-title]");
const subEl = document.querySelector("[data-plp-sub]");
const gridTitle = document.querySelector("[data-grid-title]");
const breadcrumbEl = document.querySelector("[data-breadcrumb]");
const pieceCountEl = document.querySelector("[data-piece-count]");
const designerHeroEl = document.querySelector("[data-designer-hero]");

const params = new URLSearchParams(location.search);
const collectionContext = JSON.parse(document.querySelector('#collection-context-initial').textContent);
// Pretty Shopify-style URL: /collections/<handle> sets the coll filter
// from the path. Falls back to ?coll= for backward-compat with anywhere
// we still build URLs that way.
const prettyCollMatch = location.pathname.match(/^\/collections\/(.+?)\/?$/);
const rawColl = prettyCollMatch ? decodeURIComponent(prettyCollMatch[1]) : (params.get("coll") || "");
// "all" is the Shopify CATALOG-type item ("Mobilier" in the mega
// menu) — there is no actual /collections/all on Storefront. Treat
// it as no collection filter so we fall back to the paginated
// catalog endpoint and keep the chips visible.
const collFromPath = rawColl === "all" ? "" : rawColl;
let ALL = [];
let COLLECTIONS_BY_HANDLE = {};
let COLLECTION_META = null; // set by /api/collection/:handle/products payload
// Pagination numérotée : on récupère TOUT le jeu filtré par chunks serveur
// (PAGE_SIZE = chunk du walk, cursor existant), puis on pagine côté client
// par tranches de DISPLAY_PAGE_SIZE. L'API Storefront n'expose pas de total ;
// ce walk donne le compte exact. Les premiers produits restent consultables
// pendant le chargement ; les numéros attendent le total définitif.
const PAGE_SIZE = 250;          // chunk de fetch demandé (le serveur le borne à 100)
let TOTAL_PAGES = 1;            // recalculé à chaque render()
// V4 (pagination numérotée) : on charge TOUT le jeu filtré dans ALL via le
// walk (cursor serveur, chunks de PAGE_SIZE), puis on pagine côté client
// par tranches de DISPLAY_PAGE_SIZE (state.page). Le tri couvre tout le set.
// Les filtres client (brand/tag) opèrent sur ALL complet. Catégorie (cats)
// et collection/designer sont filtrés côté serveur (jeu déjà restreint).
// V3 (chantier pages-designers-produits): ?designer=<slug> resolves
// to a tag-OR list against /api/products?tags=... — the designer
// metadata (name + tags) is fetched from /designers-data.json
// before the first product fetch.
const designerSlug = params.get("designer") || "";

// Active nav entry — mirrors the breadcrumb level (same BRAND_HANDLES test):
// a designer slug -> "Designers"; a brand (?brand= or /collections/<brand
// handle>) -> "Marques"; everything else (catalogue, ?cat, ?tag, a Mobilier
// collection like /collections/chaises) -> "Mobilier".
const activeNav = designerSlug
  ? "Designers"
  : ((params.get("brand") && !collFromPath) || BRAND_HANDLES.has(collFromPath)) ? "Marques" : "Mobilier";
initShell({ active: activeNav, transparentNav: !!catalogueLanding || !window.__hero?.editorial });

// Catégories (36, alphabétique) — handle + libellé pour le panneau multi-
// sélection. Le filtrage est SERVEUR (?cats=<handles> → clauses Shopify dans
// server.js) ; on ne garde ici que de quoi peindre les cases.
const CATEGORIES = Object.entries(navigation.collections).filter(([, c]) => c.kind === 'subcategory' && c.catalogFilter !== false).map(([h, c]) => ({ h, t: c.label })).sort((a, b) => a.t.localeCompare(b.t, 'fr'));
const CAT_HANDLES = new Set(CATEGORIES.map((c) => c.h));

const state = { coll: collFromPath, cats: (params.get("cats") || "").split(",").map((s) => s.trim()).filter((h) => CAT_HANDLES.has(h)), brand: params.get("brand") || "", tag: params.get("tag") || "", sort: ["pop", "asc", "desc", "az"].includes(params.get("sort")) ? params.get("sort") : "pop", page: Math.max(1, parseInt(params.get("page"), 10) || 1), loading: false, incomplete: false, designer: null, q: params.get("q") || "" };

// Instant paint before the /api/collection/<handle>/products fetch
// resolves. On ANY collection page: blank the description (V2.1 —
// avoids the default "Mobilier de design…" flash) and hide chips.
// Title is set from the hardcoded map when known (V1.1 — avoids
// the "Le catalogue" flash). Both get silently overwritten by the
// Shopify payload when it arrives.
if (state.coll && !collectionContext) {
  subEl.textContent = "";
  chipsBar.style.display = "none";
  if (COLL_TITLES[state.coll]) {
    titleEl.textContent = COLL_TITLES[state.coll];
  }
}
// Designer page: hide chips and blank the subtitle until the
// designer record is resolved (loadInitial sets the real title).
if (designerSlug) {
  subEl.textContent = "";
  chipsBar.style.display = "none";
  // (The default grid title "Tout le catalogue" is already cleared at parse
  // time by the inline script next to the grid-head — see above — so no
  // flash; loadInitial() sets "Les pièces de {name}" once resolved.)
}

const popScore = (p) => (p.featured ? 2 : 0) + (p.badge === "bestseller" ? 1 : 0);
function base() {
  let list = ALL.slice();
  if (state.coll) list = list.filter((p) => Array.isArray(p.collections) && p.collections.includes(state.coll));
  // Catégorie : filtrée côté SERVEUR (?cats=) — plus de filtre client ici.
  if (state.brand) list = list.filter((p) => slugify(p.brand) === state.brand);
  if (state.tag) list = list.filter((p) => Array.isArray(p.tags) && p.tags.includes(state.tag));
  return list;
}
const applySort = list => sortCatalog(list, state.sort);
// Construit l'URL reflétant l'état actif. Préserve TOUS les params de
// désignation (designer, coll/path, cats, brand, tag) + la page (?page=N,
// retirée à la page 1 → URL propre). page=1 ⇒ pas de param (canonical OK).
function buildURL() {
  const q = new URLSearchParams();
  // When the URL is already /collections/<handle>, don't echo coll in
  // the query string (it's in the path already).
  const collInPath = /^\/collections\//.test(location.pathname);
  if (state.coll && !collInPath) q.set("coll", state.coll);
  if (designerSlug) q.set("designer", designerSlug);
  if (state.q) q.set("q", state.q);
  if (state.cats.length) q.set("cats", state.cats.join(","));
  if (state.brand) q.set("brand", state.brand);
  if (state.tag) q.set("tag", state.tag);
  if (state.page > 1) q.set("page", String(state.page));
  if (state.sort !== "pop") q.set("sort", state.sort);
  const cursor = new URLSearchParams(location.search).get("cursor");
  if (cursor) q.set("cursor", cursor);
  return location.pathname + (q.toString() ? "?" + q : "");
}
function writeURL(push) {
  const url = buildURL();
  if (push) history.pushState(null, "", url);
  else history.replaceState(null, "", url + location.hash);
}
// Conserve le nom existant : les appelants (marque, catégories) veulent un
// replaceState (changement de filtre = pas de nouvelle entrée d'historique).
function syncURL() { writeURL(false); }
function render() {
  const all = base();
  countEl.textContent = state.loading || state.incomplete ? "" : `${all.length} pièce${all.length > 1 ? "s" : ""}`;
  // Designer page hides the filterbar (and its count) — mirror the count
  // next to the "Les pièces de …" grid title instead.
  if (pieceCountEl) pieceCountEl.textContent = (state.designer && state.designer.name) ? countEl.textContent : "";

  // Always-on "most popular" strip (top 4), independent of the chosen
  // sort. Suppressed on a designer page — there, the whole grid IS that
  // designer's pieces, so a "most popular" split would only fragment it.
  // Pas de bande « populaires » quand une catégorie est filtrée → grille
  // nette (façon Vitra). Sinon, top 4 du catalogue comme avant.
  const showPop = !catalogueLanding && all.length > 4 && !state.designer && !state.cats.length && !state.brand && !state.coll && !state.tag && !state.q && state.sort === "pop";
  if (popSection) popSection.style.display = showPop ? "" : "none";
  const pop = showPop ? all.slice(0, 4) : [];   // les 4 premiers de `all` = top ventes (serveur best-selling)
  if (showPop) {
    const popKey = pop.map((p) => p.id).join(",") + buildURL();
    if (popGrid.dataset.key !== popKey) {
      popGrid.innerHTML = pop.map(p => productCard(p, buildURL())).join("");
      popGrid.dataset.key = popKey;
    }
  }

  const popIds = new Set(pop.map((p) => p.id));
  // Tri appliqué à TOUT le set filtré (mainList complet) AVANT le slice :
  // l'ordre couvre l'ensemble, pas seulement la page courante.
  const mainList = applySort(all.filter((p) => !popIds.has(p.id)));
  // Pagination client : on borne la page à [1, totalPages] puis on n'affiche
  // que la tranche demandée — REMPLACE le contenu de la grille (plus d'accumul.).
  const pagination = catalogPagination(mainList.length, { ...state, pageSize: DISPLAY_PAGE_SIZE });
  TOTAL_PAGES = pagination.totalPages;
  state.page = pagination.page;
  if (catalogueLanding && catalogueLanding.hasAttribute('data-catalogue-continuation') !== (state.page > 1)) {
    catalogueLanding.toggleAttribute('data-catalogue-continuation', state.page > 1);
    window.dispatchEvent(new Event('catalogue:layout'));
  }
  const discovery = catalogueLanding?.querySelector('[data-catalogue-discovery]');
  if (discovery) {
    discovery.hidden = Boolean(state.cats.length || state.tag || state.page > 1);
    if (!discovery.hidden) paintCatalogueIcons(buildURL());
  }
  const pageSlice = mainList.slice((state.page - 1) * DISPLAY_PAGE_SIZE, state.page * DISPLAY_PAGE_SIZE);
  // Designer pages get a dedicated empty message — "élargir les
  // filtres" doesn't apply when the URL itself selects the slice.
  const emptyMsg = state.loading ? GRID_SKELETON : state.incomplete ? `<p class="plp-empty">Cette page n’a pas pu être chargée entièrement. Réessayez.</p>` : state.q
    ? `<p class="plp-empty">Aucun résultat pour « ${escapeHtml(state.q)} ». Essayez un autre mot-clé.</p>`
    : state.coll && state.brand
    ? `<p class="plp-empty">Aucune pièce de cette marque n’est disponible dans cette catégorie pour le moment. <a href="/collections/${encodeURIComponent(state.coll)}">Revenir à ${escapeHtml(collectionContext?.collectionName || COLL_TITLES[state.coll] || 'la catégorie')}</a>.</p>`
    : state.designer
    ? `<p class="plp-empty">Aucun produit pour ce designer pour le moment. <a href="/designers.html" style="color:var(--accent-ink)">Retour aux designers →</a></p>`
    : state.coll && collectionContext?.pendingMessage
    ? `<p class="plp-empty">${escapeHtml(collectionContext.pendingMessage)}</p>`
    : `<p class="plp-empty">Aucune pièce ne correspond. Essayez d'élargir les filtres.</p>`;
  // Repeinture idempotente : on ne recrée les cartes (donc les <img>) que si
  // la tranche visible a changé — sinon les chunks progressifs feraient
  // clignoter des images identiques. Compteur/pagination/applyPromos restent.
  const gridKey = (pageSlice.length ? pageSlice.map((p) => p.id).join(",") : "__empty__" + state.loading + state.incomplete) + buildURL();
  if (grid.dataset.key !== gridKey) {
    grid.innerHTML = pageSlice.length ? pageSlice.map(p => productCard(p, buildURL())).join("") : emptyMsg;
    grid.dataset.key = gridKey;
  }
  renderPagination(pagination);
  // Designer page: the grid title names the créateur ("Les pièces de …").
  // An introuvable slug (name === null) leaves it blank — the hero already
  // says "Designer introuvable".
  gridTitle.textContent = state.designer
    ? (state.designer.name ? `Les pièces de ${state.designer.name}` : "")
    : collectionContext?.gridTitle || ((showPop || catalogueLanding) ? "Tout le catalogue" : "Le catalogue");


  // Header + filterbar adapt to the active filter:
  //   ?coll  → collection title/description from Shopify (chips hidden)
  //   ?brand → brand name + standard subtitle
  //   else   → default "Le catalogue"
  // Collection metadata: prefer the per-handle payload (always
   // current) over the global /api/collections cache (subset).
  const collFromMeta = COLLECTION_META && COLLECTION_META.handle === state.coll
    ? { name: COLLECTION_META.title, description: COLLECTION_META.description }
    : null;
  const coll = collFromMeta || (state.coll ? COLLECTIONS_BY_HANDLE[state.coll] : null);
  const brandName = state.brand ? (collectionContext?.brand?.name || ALL.find((p) => slugify(p.brand) === state.brand)?.brand || navigation.brands[state.brand]?.label || "Marque introuvable") : "";
  if (state.q) {
    titleEl.textContent = `Résultats pour « ${state.q} »${brandName ? " · " + brandName : ""}`;
    subEl.textContent = "";
  } else if (state.coll && brandName) {
    const familyName = COLL_TITLES[state.coll] || collectionContext?.collectionName || coll?.name || state.coll;
    titleEl.textContent = `${familyName} · ${brandName}`;
    subEl.textContent = `Les créations ${brandName} de notre sélection « ${familyName} ».`;
  } else if (coll) {
    titleEl.textContent = COLL_TITLES[state.coll] || coll.name;
    subEl.textContent = collectionContext?.description || coll.description || "";
  } else if (state.designer?.name) {
    titleEl.textContent = `Produits de ${state.designer.name}`;
    subEl.textContent = `Sélection de pièces designées par ${state.designer.name}.`;
  } else if (state.designer && !state.designer.name) {
    titleEl.textContent = "Designer introuvable";
    subEl.textContent = "";
  } else if (brandName) {
    titleEl.textContent = brandName;
    subEl.textContent = "Toutes les pièces de la maison.";
  } else if (state.coll) {
    // Collection page — payload not (yet) available. Title from
    // the hardcoded map if known, else generic fallback.
    // Description stays empty until Shopify responds (V2.1).
    titleEl.textContent = COLL_TITLES[state.coll] || "Le catalogue";
    subEl.textContent = "";
  } else {
    titleEl.textContent = landingTitle || "Le catalogue";
    subEl.textContent = landingDescription || "Mobilier de design, choisi pièce par pièce.";
  }
  if (state.coll && state.brand) gridTitle.textContent = titleEl.textContent;
  paintBreadcrumb(listingTrail(new URL(buildURL(), location.origin), navigation, { title: COLL_TITLES[state.coll] || coll?.name || titleEl.textContent, brandName }));
  // Hide categorical chips when we're inside a curated view (collection
  // or tag) — they don't make sense and dilute the page identity.
  chipsBar.style.display = (state.coll || state.tag || state.designer) ? "none" : "";

  applyPromos(PROMOS);
  if (!state.loading && !state.incomplete) restoreSelectionPosition();
}

// ── Contrôle de pagination ─────────────────────────────────────────────
// Fenêtre autour de la page courante : 1 … (courante±2) … N. Si ≤ 7 pages,
// on les montre toutes. "…" marque les trous.
function pageItems(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out = [1];
  const left = Math.max(2, cur - 2);
  const right = Math.min(total - 1, cur + 2);
  if (left > 2) out.push("…");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < total - 1) out.push("…");
  out.push(total);
  return out;
}
function renderPagination({ totalPages, status, page: cur }) {
  if (!paginationEl) return;
  const key = `${status}:${cur}:${totalPages}`;
  if (paginationEl.dataset.key === key) return;
  paginationEl.dataset.key = key;
  if (status !== 'ready') {
    paginationEl.hidden = false;
    paginationEl.innerHTML = status === 'loading'
      ? '<span class="plp-count" role="status">Chargement des pages…</span>'
      : '<span class="plp-count" role="status">Pages indisponibles.</span><button class="plp-page" type="button" data-retry-catalog>Réessayer</button>';
    return;
  }
  if (totalPages <= 1) { paginationEl.hidden = true; paginationEl.innerHTML = ""; return; }
  paginationEl.hidden = false;
  const prevOff = cur <= 1, nextOff = cur >= totalPages;
  const numbers = pageItems(cur, totalPages).map((it) =>
    it === "…"
      ? `<span class="plp-page__ellipsis" aria-hidden="true">…</span>`
      : `<button type="button" class="plp-page${it === cur ? " is-current" : ""}" data-page="${it}"${it === cur ? ' aria-current="page"' : ""}>${it}</button>`
  ).join("");
  paginationEl.innerHTML =
    `<button type="button" class="plp-page plp-page--nav" data-page="${cur - 1}"${prevOff ? " disabled" : ""} aria-label="Page précédente">‹ Précédent</button>`
  + `<span class="plp-pagination__numbers">${numbers}</span>`
  + `<span class="plp-pagination__mobile">Page ${cur} / ${totalPages}</span>`
  + `<button type="button" class="plp-page plp-page--nav" data-page="${cur + 1}"${nextOff ? " disabled" : ""} aria-label="Page suivante">Suivant ›</button>`;
}
// Navigation client-side : aucune requête réseau (slice de ALL déjà chargé).
function scrollToGrid() {
  const head = document.querySelector(".grid-head");
  if (head) head.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? "instant" : "smooth", block: "start" });
}
function goToPage(n) {
  if (state.loading || state.incomplete) return;
  const target = Math.max(1, Math.min(n, TOTAL_PAGES));
  if (target === state.page) return;
  state.page = target;
  writeURL(true);
  render();      // pushState → le bouton retour navigue page N→N-1…
  scrollToGrid();
  // a11y : le <nav> a été reconstruit (innerHTML) → le focus était tombé sur
  // <body>. On le rend au bouton de la page courante (porte aria-current).
  const curBtn = paginationEl && paginationEl.querySelector(".plp-page.is-current");
  if (curBtn) curBtn.focus({ preventScroll: true });
}

let PROMOS = {};

// Build the endpoint URL for the active route + cursor. Any
// collection filter (from /collections/<handle> path or ?coll=
// legacy query) hits the dedicated server-side endpoint;
// /produits.html without filter hits /api/products?paginated=1.
// V2.1: `state.tag` is forwarded to the server when on a
// collection — Shopify ProductFilter narrows the result set
// upstream instead of the client filtering a partial batch.
function endpointFor(cursor) {
  const q = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (cursor) q.set("cursor", cursor);
  if (state.coll) {
    if (state.tag) q.set("tag", state.tag);
    if (state.brand) q.set("brand", state.brand);
    return `/api/collection/${encodeURIComponent(state.coll)}/products?${q}`;
  }
  // V3 designer route: OR-tag query against /api/products. Tags are
  // resolved from /designers-data.json so a single ?designer=<slug>
  // can capture multiple historical tag variants (e.g. bouroullec,
  // ronan-bouroullec, erwan-bouroullec for the duo). Unknown slugs
  // get a sentinel tag that matches nothing, so the grid stays
  // empty and the "introuvable" header is the only message.
  if (state.designer) {
    q.set("paginated", "1");
    q.set("tags", state.designer.tags?.length
      ? state.designer.tags.join(",")
      : "__no_designer_match__");
    if (state.brand) q.set("brand", state.brand);
    if (state.q) q.set("q", state.q);
    return `/api/products?${q}`;
  }
  // Catalogue : filtrage catégorie + MARQUE côté serveur.
  q.set("paginated", "1");
  if (state.cats.length) q.set("cats", state.cats.join(","));
  if (state.brand) q.set("brand", state.brand);   // filtre marque (vendor) côté serveur → page marque rapide
  if (state.tag) q.set("tags", state.tag);
  if (state.q) q.set("q", state.q);   // recherche → filtre serveur RELEVANCE
  return `/api/products?${q}`;
}

async function fetchPage(cursor) {
  const r = await fetch(endpointFor(cursor));
  if (r.status === 404) return { _notFound: true };
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

// Resolve ?designer=<slug> to { slug, name, tags } before the first
 // product fetch. If the slug isn't in designers-data.json we keep
 // state.designer = null + show a friendly empty state.
async function resolveDesigner() {
  if (!designerSlug) return;
  // Sentinel used whenever the slug can't be resolved (unknown slug OR
  // designers-data.json unreachable). Keeps endpointFor() on the
  // "__no_designer_match__" branch — never leaks the full catalogue — and
  // drives the coherent "Designer introuvable" state, which matters because
  // the .plp-designer flag has already (irreversibly) hidden the subhero /
  // filterbar / popular strip from the URL alone.
  const notFound = () => { state.designer = { slug: designerSlug, name: null, tags: [] }; };
  try {
    const [r, nav] = await Promise.all([fetch("/designers-data.json", { cache: "no-cache" }), loadNavigation().catch(() => ({ brands: {} }))]);
    if (!r.ok) { notFound(); return; }
    const data = await r.json();
    const d = (data.designers || []).find((x) => x.slug === designerSlug && !x.hidden);
    if (d) {
      // V3.1: also carry the editorial fields so the designer-hero
      // (portrait + bio + "Édité par") can render without a second fetch.
      state.designer = {
        slug: d.slug, name: d.name,
        tags: (d.tags && d.tags.length) ? d.tags : [d.slug],
        photo: d.photo || "", bio: d.bio || "",
        brands: d.brands || [], brandHrefs: (d.brands || []).map((b) => brandHref(b, nav)),
      };
    } else {
      // Slug not found → flag with a name=null sentinel so render()
      // can switch to "Aucun produit pour ce designer".
      notFound();
    }
  } catch (e) {
    notFound();
    console.warn("[plp] designers-data unavailable:", e.message);
  }
}

// Designer-hero header — portrait + name + bio + "Édité par : <marques>".
// Replaces the reserved skeleton injected at parse. Only runs on
// ?designer=<slug> pages; clears the slot if the record is unavailable.
function renderDesignerHero() {
  if (!designerHeroEl) return;
  const d = state.designer;
  if (!d) { designerHeroEl.innerHTML = ""; return; }   // data unavailable → drop skeleton
  if (!d.name) {
    designerHeroEl.innerHTML =
      `<div class="designer-hero designer-hero--empty">`
    +   `<div class="designer-hero__body">`
    +     `<h1 class="designer-hero__name serif">Designer introuvable</h1>`
    +     `<p class="designer-hero__bio">Ce créateur n'existe pas ou n'est plus référencé. `
    +       `<a href="/designers.html">Voir tous les designers →</a></p>`
    +   `</div>`
    + `</div>`;
    return;
  }
  const brands = (d.brands || []).map((b, i) => {
    const href = d.brandHrefs?.[i];
    return href
      ? `<a href="${escapeHtml(href)}">${escapeHtml(b)}</a>`
      : `<span>${escapeHtml(b)}</span>`;
  }).join('<span class="designer-hero__brand-sep" aria-hidden="true"> · </span>');
  const editor = brands
    ? `<p class="designer-hero__editor"><span class="designer-hero__editor-label">Édité par&nbsp;:</span> ${brands}</p>`
    : "";
  const bio = d.bio ? `<p class="designer-hero__bio">${escapeHtml(d.bio)}</p>` : "";
  const photo = d.photo
    ? `<picture><source type="image/webp" srcset="${escapeHtml(d.photo.replace(/\.jpg$/, "-640.webp"))}" /><img class="designer-hero__photo" src="${escapeHtml(d.photo)}" width="640" height="800" alt="${escapeHtml(d.name)}" fetchpriority="high" /></picture>`
    : "";
  designerHeroEl.innerHTML =
    `<div class="designer-hero">`
  +   photo
  +   `<div class="designer-hero__body">`
  +     `<h1 class="designer-hero__name serif">${escapeHtml(d.name)}</h1>`
  +     bio
  +     editor
  +   `</div>`
  + `</div>`;
}

// Même inventaire publié que le répertoire et le méga menu : les nouvelles marques restent accessibles.
async function populateBrandSelect() {
  try {
    const r = await fetch("/api/brands", { cache: "no-cache" });
    if (!r.ok) return;
    const data = await r.json();
    const brands = (data || [])
      .map((b) => ({ name: b.name, value: b.slug || slugify(b.name) }))
      .filter((b) => b.name && b.value)
      .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
    const frag = document.createDocumentFragment();
    for (const b of brands) {
      const o = document.createElement("option");
      o.value = b.value; o.textContent = b.name;
      if (b.value === state.brand) o.selected = true;
      frag.appendChild(o);
    }
    brandSel.appendChild(frag);
  } catch (e) {
    console.warn("[plp] marques publiées indisponibles:", e.message);
  }
}

// Récupère TOUT le jeu filtré : on suit le cursor existant par chunks de
// PAGE_SIZE jusqu'à hasNextPage=false, en concaténant les items (filtrés
// p.image). Les curseurs sont suivis jusqu’au bout ; un curseur répété est une erreur.
// (Ancien plafond retiré : il ne doit jamais tronquer silencieusement le catalogue.)
// Retourne { items, collection, complete } ou
// { _notFound } si la 1re requête tombe sur une collection inconnue.

// Jeton de génération : chaque walk l'incrémente ; au retour, on n'applique
// le résultat que s'il est encore le plus récent (un re-walk de catégorie /
// un changement de filtre supersède un walk en vol — pas de clobber, pas de
// toggle perdu silencieusement).
let walkGen = 0;
const GRID_SKELETON = Array.from({ length: 12 }, () => '<div class="pcard"><div class="pcard__skel"></div></div>').join("");
// onChunk(itemsSoFar, collection) — appelé après CHAQUE page chargée, pour un
// rendu progressif (1er paint dès le 1er chunk). _notFound (1re requête sur
// collection inconnue) revient AVANT tout onChunk → l'appelant gère.
function walkAll(onChunk) {
  const generation = walkGen;
  return walkCatalog(fetchPage, onChunk, new URLSearchParams(location.search).get('cursor'), () => generation === walkGen);
}
function renderLoadStatus() {
  if (state.loading || state.incomplete) renderPagination(catalogPagination(0, state));
  if (!catalogLoadingEl) return;
  catalogLoadingEl.hidden = !state.incomplete && !state.loading;
  catalogLoadingEl.innerHTML = state.incomplete
    ? 'Chargement incomplet. <button class="plp-page" type="button" data-retry-catalog>Réessayer</button>'
    : 'Chargement des produits…';
}
catalogLoadingEl?.addEventListener('click', event => {
  if (event.target.closest('[data-retry-catalog]')) loadInitial();
});

async function loadInitial() {
  const myGen = ++walkGen;
  try {
    await resolveDesigner();
    renderDesignerHero();
    // Anti-flash: name the créateur as soon as the (~15ms) designer record
    // is in, well before the products land.
    if (state.designer) {
      gridTitle.textContent = state.designer.name ? `Les pièces de ${state.designer.name}` : "";
    }
    sortSel.value = state.sort;

    // Squelette ou cartes SSR pendant le chargement progressif.
    state.loading = true; state.incomplete = false; renderLoadStatus();   // compteur masqué pendant le walk (pas d'incrément visible)
    // Si la grille est pré-rendue côté serveur (data-ssr : liens produit crawlables),
    // on la GARDE comme état de chargement au lieu du squelette → pas de flash
    // cartes→squelette→cartes. Le 1er render la remplacera normalement.
    if (grid.dataset.ssr === "1") { grid.removeAttribute("data-ssr"); }
    else { grid.innerHTML = GRID_SKELETON; }
    grid.dataset.key = ""; // invalide la clé idempotente → le 1er render reconstruit
    grid.setAttribute("aria-busy", "true");

    let painted = false;
    const res = await walkAll((itemsSoFar, coll) => {
      if (myGen !== walkGen) return;          // un re-walk a pris le relais
      if (coll) COLLECTION_META = coll;
      ALL = itemsSoFar;
      render();                                // peint la 1re page dès le 1er chunk
      if (!painted) { grid.removeAttribute("aria-busy"); painted = true; }
      if (catalogLoadingEl) catalogLoadingEl.hidden = false;
    });
    if (myGen !== walkGen) return; // un re-walk (catégorie) a pris le relais
    state.loading = false;   // walk fini → le compteur final s'affiche d'un coup

    if (res._notFound) {
      paintBreadcrumb([{ label: 'Accueil', href: '/' }, { label: 'Catalogue', href: '/produits.html' }, { label: 'Collection introuvable' }]);
      if (catalogLoadingEl) catalogLoadingEl.hidden = true;
      titleEl.textContent = "Collection introuvable";
      subEl.textContent = "";
      grid.innerHTML = `<p class="plp-empty">Cette collection n'existe pas ou plus. <a href="/produits.html" style="color:var(--accent-ink)">Retour au catalogue →</a></p>`;
      grid.dataset.key = ""; // contenu non-carte → invalide la clé idempotente
      grid.removeAttribute("aria-busy");
      if (paginationEl) { paginationEl.hidden = true; paginationEl.innerHTML = ""; }
      popSection.style.display = "none";
      chipsBar.style.display = "none";
      countEl.textContent = "";
      return;
    }
    state.incomplete = !res.complete;
    if (res.collection) COLLECTION_META = res.collection;
    ALL = res.items;
    render();              // rendu final (set complet : compteur/pagination définitifs)
    grid.removeAttribute("aria-busy");
    renderLoadStatus();
    writeURL(false);       // normalise l'URL (clamp / retrait de ?page) sans nouvelle entrée

    // Background, after the grid is already up — neither blocks first paint:
    populateBrandSelect();
    fetchCollections()
      .then((colls) => {
        (colls || []).forEach((c) => { if (c.handle) COLLECTIONS_BY_HANDLE[c.handle] = c; });
        render(); // backfill collection title/description if one matched
      })
      .catch((e) => console.warn("[plp] collections indisponibles:", e.message));
  } catch (e) {
    state.loading = false;
    state.incomplete = true; renderLoadStatus();
    grid.innerHTML = `<p class="plp-empty">Impossible de charger le catalogue. Réessayez.</p>`;
    grid.dataset.key = ""; // contenu non-carte → invalide la clé idempotente
    grid.removeAttribute("aria-busy");
    console.warn(e);
  }
}

// Re-walk complet (nouveau jeu serveur après changement de catégorie ?cats=).
// L'appelant (applyCats) a déjà posé state.page = 1 + l'URL (sans page). Le
// jeton de génération garantit qu'un toggle plus récent supersède celui-ci
// (ancien comportement : `if (state.loading) return` perdait le 2e toggle).
async function reloadGrid() {
  const myGen = ++walkGen;
  state.loading = true; state.incomplete = false; renderLoadStatus();   // compteur masqué pendant le re-walk catégorie
  grid.setAttribute("aria-busy", "true");
  if (catalogLoadingEl) catalogLoadingEl.hidden = false;
  try {
    const res = await walkAll((itemsSoFar) => {
      if (myGen !== walkGen) return;
      ALL = itemsSoFar;
      render();                                // rendu progressif au changement de catégorie
    });
    if (myGen !== walkGen) return; // un toggle plus récent a pris le relais
    state.incomplete = !res.complete;
    ALL = (res && res.items) || [];
    state.loading = false;
    render();
  } catch (e) {
    if (myGen === walkGen) { ALL = []; state.loading = false; render(); } // jamais de grille périmée sous la nouvelle URL
    console.warn("[plp] reloadGrid:", e.message);
  } finally {
    if (myGen === walkGen) { grid.removeAttribute("aria-busy"); renderLoadStatus(); }
  }
}

loadInitial();

// Navigation pagination (délégation) + bouton retour (popstate).
if (paginationEl) {
  paginationEl.addEventListener("click", (e) => {
    if (e.target.closest('[data-retry-catalog]')) { loadInitial(); return; }
    const btn = e.target.closest("button[data-page]");
    if (!btn || btn.disabled) return;
    const n = parseInt(btn.getAttribute("data-page"), 10);
    if (n) goToPage(n);
  });
}
window.addEventListener("popstate", () => {
  const p = new URLSearchParams(location.search);
  const urlCats = (p.get("cats") || "").split(",").map((s) => s.trim()).filter((h) => CAT_HANDLES.has(h)).join(",");
  const urlBrand = p.get("brand") || "";
  const urlTag = p.get("tag") || "";
  // Back/Forward a franchi un changement de FILTRE (cats/brand/tag) : l'état
  // mémoire (et ALL, et les contrôles) ne correspond plus à l'URL. On
  // ré-initialise depuis l'URL par un rechargement — comportement d'avant la
  // pagination, garantit grille/URL/contrôles cohérents. Rare (il faut
  // paginer PUIS changer un filtre PUIS revenir en arrière).
  if (urlCats !== state.cats.join(",") || urlBrand !== state.brand || urlTag !== state.tag) {
    location.reload();
    return;
  }
  // Seule la PAGE a changé → re-slice instantané de ALL, aucune requête : on
  // conserve le contexte et rétablit la composition de la page demandée.
  state.sort = ["pop", "asc", "desc", "az"].includes(p.get("sort")) ? p.get("sort") : "pop";
  sortSel.value = state.sort;
  state.page = Math.max(1, parseInt(p.get("page"), 10) || 1);
  render();
});

// Background promo fetch — re-applies to the current grid (and to every
// subsequent render via the applyPromos call inside render()).
fetchPromos().then((map) => {
  PROMOS = map;
  applyPromos(PROMOS);
}).catch((e) => console.warn("[v3] promos unavailable:", e.message));

// ── Panneau Catégorie (multi-sélection, filtrage serveur) ──────────────
// N'existe que sur le catalogue : en mode collection / marque / designer /
// tag, la filterbar (donc le déclencheur) est déjà masquée par render().
const catTrigger = document.querySelector("[data-cat-trigger]");
const catPanel   = document.querySelector("[data-cat-panel]");
const catGrid    = document.querySelector("[data-cat-grid]");
const catCount   = document.querySelector("[data-cat-count]");
const catChips   = document.querySelector("[data-cat-chips]");
const CHIP_LABELS = new Map(CATEGORIES.map((c) => [c.h, c.t]));   // libellés des chips
if (catGrid && !state.coll && !state.tag && !state.designer) {
  catGrid.innerHTML = CATEGORIES.map((c) =>
    `<label class="cat-opt"><input type="checkbox" class="cat-opt__box" value="${c.h}"${state.cats.includes(c.h) ? " checked" : ""} /><span class="cat-opt__label">${escapeHtml(c.t)}</span></label>`
  ).join("");

  const renderChips = () => {
    if (!catChips) return;
    if (!state.cats.length) { catChips.hidden = true; catChips.innerHTML = ""; return; }
    catChips.hidden = false;
    catChips.innerHTML = state.cats.map((h) =>
      `<button type="button" class="plp-chip" data-chip-remove="${escapeHtml(h)}">${escapeHtml(CHIP_LABELS.get(h) || h)} <span class="plp-chip__x" aria-hidden="true">&times;</span></button>`
    ).join("") + `<button type="button" class="plp-chip plp-chip--clear" data-cat-clear>Tout effacer</button>`;
  };
  const syncTrigger = () => {
    const n = state.cats.length;
    catCount.hidden = n === 0;
    catCount.textContent = n ? ` · ${n}` : "";
    catTrigger.classList.toggle("is-active", n > 0);
    renderChips();
  };
  syncTrigger();

  const setOpen = (open) => {
    catPanel.hidden = !open;
    catTrigger.setAttribute("aria-expanded", open ? "true" : "false");
  };
  catTrigger.addEventListener("click", (e) => { e.stopPropagation(); setOpen(catPanel.hidden); });
  document.querySelectorAll("[data-cat-close]").forEach((b) => b.addEventListener("click", () => setOpen(false)));
  // Fermer au clic en dehors (déclencheur et panneau restent cliquables).
  document.addEventListener("click", (e) => {
    if (catPanel.hidden) return;
    if (catPanel.contains(e.target) || catTrigger.contains(e.target)) return;
    setOpen(false);
  });

  // Débounce : cocher plusieurs cases d'affilée → un seul fetch serveur.
  let catTimer = null;
  const applyCats = () => {
    state.page = 1;            // nouveau sous-ensemble → page 1
    syncTrigger(); syncURL();  // URL sans ?page (page=1)
    clearTimeout(catTimer);
    catTimer = setTimeout(reloadGrid, 220);
  };
  catGrid.addEventListener("change", (e) => {
    const box = e.target.closest(".cat-opt__box"); if (!box) return;
    const h = box.value;
    if (box.checked) { if (!state.cats.includes(h)) state.cats.push(h); }
    else state.cats = state.cats.filter((x) => x !== h);
    applyCats();
  });
  const clearCats = () => {
    if (!state.cats.length) return;
    state.cats = [];
    catGrid.querySelectorAll(".cat-opt__box").forEach((b) => { b.checked = false; });
    applyCats();
  };
  document.querySelector("[data-cat-clear]").addEventListener("click", clearCats);   // bouton du panneau
  if (catChips) catChips.addEventListener("click", (e) => {
    if (e.target.closest("[data-cat-clear]")) { clearCats(); return; }   // "Tout effacer"
    const rm = e.target.closest("[data-chip-remove]"); if (!rm) return;
    const h = rm.dataset.chipRemove;
    state.cats = state.cats.filter((x) => x !== h);
    const box = catGrid.querySelector(`.cat-opt__box[value="${(window.CSS && CSS.escape) ? CSS.escape(h) : h}"]`);
    if (box) box.checked = false;
    applyCats();
  });
}

// La marque est filtrée côté serveur : repartir de la nouvelle URL charge
// sa sélection complète et conserve le retour navigateur vers la précédente.
brandSel.addEventListener("change", () => {
  const url = new URL(location.href);
  if (brandSel.value) url.searchParams.set("brand", brandSel.value);
  else url.searchParams.delete("brand");
  url.searchParams.delete("page");
  url.searchParams.delete("cursor");
  url.hash = "";
  location.assign(url.pathname + url.search);
});
sortSel.addEventListener("change", () => { state.sort = sortSel.value; state.page = 1; syncURL(); render(); });
