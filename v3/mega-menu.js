/* ============================================================
   Mikado Deco · Mega menu controller (V2.1)
   - Mobilier  : Shopify-driven (menu(handle:"main-menu"))
   - Marques   : fully hardcoded from /mega-menu-brands.json
                 (15 brands + featured collections + flat designer list)
   - Side panel "Coup de cœur" from /mega-menu-config.json (restored)
   Top-level NAV labels/hrefs live in shared.js as the fallback so
   the chrome renders instantly with no flash.
   ============================================================ */

import { escapeHtml, slugify } from "/shared.js";

const OPEN_DELAY  = 60;
const CLOSE_DELAY = 200;

// Noms d'affichage premium des familles Mobilier (le libelle Shopify differe du nom de la page).
// Handle/URL inchanges -> hrefs + SEO intacts. Le mega-menu ET le drawer lisent ce menu -> coherence.
const FAM_LABEL = { sieges: "Assises", outdoor: "Jardin" };
// Ordre d affichage des colonnes du mega Mobilier (equilibrage visuel : grandes familles reparties,
// petites en bas). Presentation uniquement — l ordre semantique du menu Shopify est inchange.
const MOBILIER_ORDER = ["sieges", "luminaires", "decoration", "outdoor", "tables", "accessoires", "rangement"];
function mobIdx(cat) {
  const h = (cat.url || "").replace(/^.*\/collections\//, "").replace(/[/?#].*$/, "");
  const i = MOBILIER_ORDER.indexOf(h);
  return i < 0 ? 999 : i;
}

let config     = null;   // mega-menu-config.json (side panel)
let brandsData = null;   // mega-menu-brands.json (Marques hardcode)
let activeBrands = [];   // /api/brands — marques dérivées des produits publiés
let menu       = null;   // /api/menu (Mobilier only)
let stageEl    = null;

const TOP = { mobilier: null };

// --- public ---------------------------------------------------

export async function initMegaMenu() {
  stageEl = document.querySelector("[data-mm-stage]");
  if (!stageEl) return;
  try {
    const [menuRes, cfgRes, brandsRes, activeRes] = await Promise.all([
      fetch("/api/menu",                  { cache: "no-store"    }).then((r) => r.json()).catch(() => ({ ok: false, items: [] })),
      fetch("/mega-menu-config.json",     { cache: "no-cache" }).then((r) => r.json()).catch(() => ({})),
      fetch("/mega-menu-brands.json",     { cache: "no-cache" }).then((r) => r.json()).catch(() => ({ brands: [], designers: [] })),
      fetch("/api/brands",                { cache: "no-store"    }).then((r) => r.json()).catch(() => []),
    ]);
    menu       = menuRes;
    relabelFamilies(menu);
    config     = cfgRes      || {};
    brandsData = brandsRes   || { brands: [], designers: [] };
    activeBrands = Array.isArray(activeRes) ? activeRes : [];
    indexTopItems(menu.items || []);
    hydrateMobilier();
    hydrateMarques();
    hydrateDesigners();
    hydrateDrawer();
    bindHover();
    bindKeyboard();
    bindFocus();
    bindDrawerAccordions();
  } catch (e) {
    console.warn("[mega-menu] init failed:", e.message);
  }
}

function relabelFamilies(m) {
  const items = (m && m.items) || [];
  const mob = items.find((it) => (it.title || "").trim().toLowerCase() === "mobilier");
  if (!mob || !mob.items) return;
  for (const f of mob.items) {
    const handle = (f.url || "").replace(/^.*\/collections\//, "").replace(/[/?#].*$/, "");
    if (handle && FAM_LABEL[handle]) f.title = FAM_LABEL[handle];
  }
}

function indexTopItems(items) {
  for (const it of items) {
    const key = (it.title || "").trim().toLowerCase();
    if (key === "mobilier") TOP.mobilier = it;
  }
}

// --- shared side panel render ---------------------------------

// Editorial side panel (.mm-side) shared as-is by all three megas: the
// "Coup de cœur" (Mobilier/Marques) and the "Designer du mois" (Designers)
// are the SAME visual component — only the data differs.
function sideHTML({ label, image, imageAlt, title, lead, ctaHref, ctaLabel, imgOnError }) {
  if (!image) return "";
  const onerr = imgOnError ? ` onerror="this.remove()"` : "";
  return `
    <aside class="mm-side">
      <div class="mm-side__label">${escapeHtml(label || "")}</div>
      <div class="mm-side__rule" aria-hidden="true"></div>
      <img class="mm-side__visual" src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt || "")}" loading="lazy"${onerr} />
      ${title ? `<div class="mm-side__title">${escapeHtml(title)}</div>` : ""}
      ${lead  ? `<p class="mm-side__lead">${escapeHtml(lead)}</p>` : ""}
      ${ctaHref ? `<a class="mm-side__cta" href="${escapeHtml(ctaHref)}">${escapeHtml(ctaLabel || "")} →</a>` : ""}
    </aside>`;
}

function coupDeCoeurHTML(megaKey) {
  const cdc = config?.[megaKey]?.coupDeCoeur;
  if (!cdc || !cdc.image) return "";
  return sideHTML({
    label: cdc.label || "Coup de cœur du moment",
    image: cdc.image,
    imageAlt: cdc.imageAlt || "",
    title: cdc.title,
    lead: cdc.lead,
    ctaHref: cdc.ctaHref,
    ctaLabel: cdc.ctaLabel || "Lire l'article",
  });
}

// --- Mobilier mega (Shopify-driven, unchanged) ----------------

function hydrateMobilier() {
  const panel = stageEl.querySelector('[data-mm-panel="mobilier"]');
  if (!panel) return;
  const top = TOP.mobilier;
  if (!top || !top.items?.length) { panel.innerHTML = ""; return; }
  const ordered = top.items.slice().sort((x, y) => mobIdx(x) - mobIdx(y));
  const colsHtml = ordered.map((cat) => {
    const subs = (cat.items || []).map((sub) =>
      `<li><a href="${escapeHtml(sub.url)}">${escapeHtml(sub.title)}</a></li>`
    ).join("");
    return `
      <div class="mm-col">
        <a class="mm-col__head" href="${escapeHtml(cat.url)}">${escapeHtml(cat.title)}</a>
        <ul class="mm-col__list">${subs}</ul>
      </div>`;
  }).join("");
  panel.innerHTML = `
    <div class="mm-mega mm-mega--mobilier">
      <div class="mm-mega__cols">${colsHtml}</div>
      ${coupDeCoeurHTML("mobilier")}
    </div>`;
}

// --- Marques mega (V2.1: fully hardcoded) ---------------------

function hydrateMarques() {
  const panel = stageEl.querySelector('[data-mm-panel="marques"]');
  if (!panel) return;
  const curatedHref = {};
  for (const b of (brandsData?.brands || [])) if (b.name && b.href) curatedHref[b.name.toLowerCase()] = b.href;
  // Marques masquées du dropdown méga-menu (restent sur /marques.html) — ex. nom très long.
  const HIDDEN_FROM_MENU = new Set(["compagnie de provence"]);
  const brands = (activeBrands || [])
    .filter((b) => !HIDDEN_FROM_MENU.has((b.name || "").toLowerCase()))
    .map((b) => ({
      name: b.name,
      href: curatedHref[b.name.toLowerCase()] || `/produits.html?brand=${b.slug}`,
    }));
  if (!brands.length) { panel.innerHTML = ""; return; }

  // V2.2: featured sub-collections retired from the rendered mega
  // (kept in the JSON for future revival). Brand cards now hold just
  // the brand name → collection page.
  const brandCards = brands.map((b) => `
      <div class="mm-brand">
        <a class="mm-brand__name" href="${escapeHtml(b.href)}">${escapeHtml(b.name)}</a>
      </div>`).join("");

  // Same shell as Mobilier/Designers: navigable content left, editorial
  // .mm-side right. Designers now live only in their own mega (removed here).
  panel.innerHTML = `
    <div class="mm-mega mm-mega--marques">
      <div class="mm-marques__col">
        <div class="mm-col__head">Nos marques</div>
        <div class="mm-brands-grid">${brandCards}</div>
        <a class="mm-marques__all" href="/marques.html">Toutes les marques →</a>
      </div>
      ${coupDeCoeurHTML("marques")}
    </div>`;
}

// --- Designers mega · À la une (left) + "Designer du mois" .mm-side
//     (right). Same shell/structure as Mobilier & Marques. -------------

function hydrateDesigners() {
  const panel = stageEl.querySelector('[data-mm-panel="designers"]');
  if (!panel) return;
  const designers = brandsData?.designers || [];
  const duMois    = config?.designers?.duMois;
  // Nothing to show → leave empty so open() skips it; the top-level
  // "Designers" trigger still navigates to /designers.html (graceful).
  if (!designers.length && !duMois) { panel.innerHTML = ""; return; }

  // À la une — the curated flat list (the same one the Marques mega used
  // to hold), 2 columns, one click to each designer's filtered PLP.
  const desHtml = designers.map((d) =>
    `<a href="/produits.html?designer=${slugify(d)}">${escapeHtml(d)}</a>`
  ).join("");
  const left = designers.length ? `
      <div class="mm-marques__col">
        <div class="mm-col__head">À la une</div>
        <div class="mm-des-flat">${desHtml}</div>
        <a class="mm-marques__all" href="/designers.html">Tous les designers →</a>
      </div>` : "";

  // Designer du mois — the SAME editorial component as the coup de cœur.
  const side = duMois ? sideHTML({
    label: "Designer du mois",
    image: duMois.photo,
    imageAlt: duMois.name || "",
    title: duMois.name,
    lead: duMois.lead,
    ctaHref: duMois.slug ? `/produits.html?designer=${duMois.slug}` : "",
    ctaLabel: duMois.ctaLabel || "Voir ses pièces",
    imgOnError: true,
  }) : "";

  panel.innerHTML = `
    <div class="mm-mega mm-mega--designers">
      ${left}
      ${side}
    </div>`;
}

// --- mobile drawer hydration ---------------------------------

function hydrateDrawer() {
  const mobSub = document.querySelector('[data-drawer-sub="mobilier"]');
  if (mobSub && TOP.mobilier?.items?.length) {
    const links = TOP.mobilier.items.map((c) =>
      `<li><a href="${escapeHtml(c.url)}">${escapeHtml(c.title)}</a></li>`
    ).join("");
    mobSub.innerHTML = links + `<li><a href="/collections/all" style="font-style:italic">Voir tout le mobilier →</a></li>`;
  }
  // Marques drawer: 15 brands, name only — featured collections skipped
  // on mobile (V2.1 decision: drawer is already long).
  const brSub = document.querySelector('[data-drawer-sub="marques"]');
  if (brSub && brandsData?.brands?.length) {
    const byName = new Map(brandsData.brands.map((b) => [b.name, b]));
    const names  = brandsData.drawerBrands?.length ? brandsData.drawerBrands : brandsData.brands.map((b) => b.name);
    const links  = names.map((n) => byName.get(n)).filter(Boolean).map((b) =>
      `<li><a href="${escapeHtml(b.href)}">${escapeHtml(b.name)}</a></li>`
    ).join("");
    brSub.innerHTML = links + `<li><a href="/marques.html" style="font-style:italic">Toutes les marques →</a></li>`;
  }
  // Designers drawer : même liste "À la une" que le méga desktop (brandsData.designers),
  // un lien par créateur vers sa PLP filtrée, + "Tous les designers →".
  const desSub   = document.querySelector('[data-drawer-sub="designers"]');
  const desNames = brandsData?.drawerDesigners?.length ? brandsData.drawerDesigners : (brandsData?.designers || []);
  if (desSub && desNames.length) {
    const links = desNames.map((d) =>
      `<li><a href="/produits.html?designer=${slugify(d)}">${escapeHtml(d)}</a></li>`
    ).join("");
    desSub.innerHTML = links + `<li><a href="/designers.html" style="font-style:italic">Tous les designers →</a></li>`;
  }
  // Drawer footer reuses the Mobilier coup de cœur as the bottom
  // editorial block (single source of truth, same JSON as desktop).
  const foot = document.querySelector("[data-drawer-foot]");
  const cdc  = config?.mobilier?.coupDeCoeur;
  if (foot && (cdc?.title || cdc?.ctaHref)) {
    const href  = cdc.ctaHref || "";
    const label = escapeHtml(cdc.label || "Coup de cœur du moment");
    const title = escapeHtml(cdc.title || cdc.ctaLabel || "Lire l'article");
    foot.innerHTML = `
      <div class="drawer__foot-label">${label}</div>
      ${href ? `<a class="drawer__foot-compact" href="${escapeHtml(href)}">${title} →</a>`
             : `<span class="drawer__foot-compact">${title}</span>`}`;
  }
}

// --- desktop hover/keyboard interactions ----------------------

let openKey = null;
let openTimer = null;
let closeTimer = null;
let mmChromeTimer = null;
// Garde le header « solide » (blanc) tant que le méga-menu est ouvert, et pendant
// son fondu de fermeture (0,18 s) → pas de header transparent sous un menu encore visible.
function setChromeMega(on) {
  const chrome = document.querySelector("[data-chrome]");
  if (!chrome) return;
  clearTimeout(mmChromeTimer);
  if (on) chrome.classList.add("chrome--mm");
  else mmChromeTimer = setTimeout(() => chrome.classList.remove("chrome--mm"), 220);
}

function bindHover() {
  document.querySelectorAll("[data-mm-trigger]").forEach((t) => {
    const key = t.dataset.mmTrigger;
    t.addEventListener("mouseenter", () => scheduleOpen(key));
    t.addEventListener("mouseleave", () => scheduleClose());
    t.addEventListener("focus", () => open(key));
  });
  stageEl.addEventListener("mouseenter", () => cancelTimers());
  stageEl.addEventListener("mouseleave", () => scheduleClose());
}

function scheduleOpen(key) {
  cancelTimers();
  openTimer = setTimeout(() => open(key), OPEN_DELAY);
}
function scheduleClose() {
  cancelTimers();
  closeTimer = setTimeout(close, CLOSE_DELAY);
}
function cancelTimers() {
  clearTimeout(openTimer); openTimer = null;
  clearTimeout(closeTimer); closeTimer = null;
}

function open(key) {
  if (!stageEl || openKey === key) return;
  const panel = stageEl.querySelector(`[data-mm-panel="${key}"]`);
  if (!panel) return;
  if (!panel.innerHTML.trim()) { openTimer = setTimeout(() => open(key), 60); return; }   // panneau pas encore hydrate (course au 1er survol) -> on reessaie ; cancelTimers() (mouseleave) stoppe
  stageEl.querySelectorAll(".mm-panel").forEach((p) => p.classList.remove("is-active"));
  panel.classList.add("is-active");
  stageEl.dataset.mmKey = key;
  stageEl.classList.add("is-open");
  setChromeMega(true);
  setExpanded(key, true);
  openKey = key;
}

function close() {
  if (!stageEl || !openKey) return;
  stageEl.classList.remove("is-open");
  setChromeMega(false);
  setExpanded(openKey, false);
  openKey = null;
}

function setExpanded(key, val) {
  const t = document.querySelector(`[data-mm-trigger="${key}"]`);
  t?.setAttribute("aria-expanded", val ? "true" : "false");
}

function bindKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openKey) {
      const t = document.querySelector(`[data-mm-trigger="${openKey}"]`);
      close();
      t?.focus();
    }
  });
}

function bindFocus() {
  document.addEventListener("focusin", (e) => {
    if (!openKey) return;
    const trigger = document.querySelector(`[data-mm-trigger="${openKey}"]`);
    if (!stageEl.contains(e.target) && e.target !== trigger) close();
  });
}

// --- mobile drawer accordions --------------------------------

function bindDrawerAccordions() {
  document.querySelectorAll(".drawer__group").forEach((g) => {
    const head = g.querySelector(".drawer__group-head");
    if (!head) return;
    head.addEventListener("click", () => {
      const willOpen = g.dataset.open !== "true";
      document.querySelectorAll(".drawer__group").forEach((other) => {
        other.dataset.open = "false";
        other.querySelector(".drawer__group-head")?.setAttribute("aria-expanded", "false");
      });
      if (willOpen) {
        g.dataset.open = "true";
        head.setAttribute("aria-expanded", "true");
      }
    });
  });
}
