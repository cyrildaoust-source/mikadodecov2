import { escapeHtml, priceLabel } from './format.mjs';
import { megaMenuBrands, fetchBrands } from './shared.js';
import { selectionURL, productHref } from './navigation.mjs';
import { searchCriteria, searchNotes, searchSuggestions } from './search-view.mjs';

export function createSearchDrawer() {
  const root = document.querySelector("[data-search]");
  if (!root) return;
  // Le champ vit désormais DANS la barre de nav (pas dans l'overlay) → document.
  const input = document.querySelector("[data-search-input]");
  const results = root.querySelector("[data-search-results]");
  const suggest = root.querySelector("[data-search-suggest]");
  let lastFocus = null, timer = null, lastTerm = "", featLoaded = false, pendingSearch = null, searchGeneration = 0;
  const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
  const pdpHref = (p, source) => escapeHtml(productHref(p, typeof source === "string" ? source : ""));
  const row = (p, source) => `<a class="sr__row" href="${pdpHref(p, source)}"><img class="sr__thumb" src="${escapeHtml(p.image || "")}" alt="" loading="lazy" /><span class="sr__info"><span class="sr__brand">${escapeHtml(p.brand || "")}</span><span class="sr__name">${escapeHtml(p.name || "")}</span>${p.finishLabel ? `<span class="sr__finish">${escapeHtml(p.finishLabel)}</span>` : ''}</span><span class="sr__price">${priceLabel(p)}</span></a>`;
  // Liens marque « curés » (mega-menu-brands.json, même schéma que marques.html) :
  // clé = nom en minuscules → href /collections/<handle>. Repli ?brand=<slug> si
  // absent. hrefByName persiste (bindSearch appelé une seule fois) → chargé 1×.
  // Promesse MÉMOÏSÉE (même patron que loadBrandHandles) : tout appelant qui
  // `await loadBrandHrefs()` attend la MÊME promesse → hrefByName est garanti
  // rempli avant de peindre les chips (pas de course sur un flag booléen qui
  // résout avant la fin du fetch). Repli ?brand= si le JSON échoue.
  let hrefByName = {}, _brandHrefsP = null;
  const loadBrandHrefs = () => {
    if (!_brandHrefsP) {
      _brandHrefsP = megaMenuBrands()
        .then((j) => { for (const b of (j.brands || [])) if (b.name && b.href) hrefByName[b.name.toLowerCase()] = b.href; })
        .catch(() => { /* repli ?brand= */ });
    }
    return _brandHrefsP;
  };
  const brandHref = (b) => hrefByName[(b.name || "").toLowerCase()] || `/produits.html?brand=${encodeURIComponent(b.slug)}`;
  const catHref   = (c) => `/collections/${encodeURIComponent(c.handle)}`;
  // Belle saison (avril→sept) = extérieur ; sinon intérieur. Le tag EST la saison →
  // la clé de cache serveur (getProductsPage, keyée par tags) se régénère seule.
  const seasonTag = () => { const m = new Date().getMonth() + 1; return (m >= 4 && m <= 9) ? "exterieur" : "interieur"; };
  const chip  = (label, href) => `<a class="sr__chip" href="${href}">${escapeHtml(label)}</a>`;
  const grp   = (lab, inner) => inner ? `<div class="sr__grp"><div class="sr__lab">${lab}</div>${inner}</div>` : "";
  const chips = (arr, href) => arr?.length ? `<div class="sr__chips">${arr.map((x) => chip(x.name, href(x))).join("")}</div>` : "";
  const showSuggest = () => { if (suggest) suggest.hidden = false; if (results) { results.hidden = true; results.innerHTML = ""; } };
  const showResults = () => { if (suggest) suggest.hidden = true; if (results) results.hidden = false; };
  // État vide : produits de saison (data-search-feat) + marques populaires
  // (data-search-brands). Gardes de présence : .innerHTML sur un slot absent
  // relançait un re-fetch en boucle (featLoaded jamais posé).
  const loadFeat = async () => {
    const featSlot   = root.querySelector("[data-search-feat]");
    const brandsSlot = root.querySelector("[data-search-brands]");
    if (featLoaded || !featSlot || !brandsSlot) return;
    featLoaded = true;
    try {
      // loadBrandHrefs() dans le Promise.all → hrefByName rempli AVANT de peindre
      // les chips (chips marque curées, pas de repli ?brand= dû à une course).
      const [, feat, brands] = await Promise.all([
        loadBrandHrefs(),
        fetch(`/api/products?paginated=1&limit=4&tags=${seasonTag()}`).then((r) => r.json()),
        fetchBrands(),
      ]);
      // « Populaires » = plus gros catalogues d'abord (productCount desc, champ
      // exposé par /api/brands) → le label ne montre plus les 6 premières A→Z.
      const brandList = (Array.isArray(brands) ? brands : [])
        .slice().sort((a, b) => (b.productCount || 0) - (a.productCount || 0)).slice(0, 6);
      featSlot.innerHTML   = (Array.isArray(feat.items) ? feat.items : []).map(row).join("");
      brandsSlot.innerHTML = `<div class="sr__chips">${brandList.map((b) => chip(b.name, brandHref(b))).join("")}</div>`;
    } catch (e) { featLoaded = false; }
  };
  function open() {
    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add("search-locked");   // le header bascule en mode recherche
    showSuggest(); loadBrandHrefs(); loadFeat();
    // On mesure APRÈS le reflow (bandeau masqué, champ inline affiché) pour que le
    // panneau de résultats descende pile sous la barre de nav.
    requestAnimationFrame(() => {
      const nav = document.querySelector(".nav__inner");
      const top = nav ? nav.getBoundingClientRect().bottom : 68;
      root.style.setProperty("--search-top", top + "px");
      if (input) input.focus();
    });
    document.addEventListener("keydown", onKey, true);
  }
  function close() {
    clearTimeout(timer); pendingSearch?.abort(); searchGeneration++;
    results.removeAttribute('aria-busy');
    root.hidden = true;
    document.body.classList.remove("search-locked");   // le menu se remet
    document.removeEventListener("keydown", onKey, true);
    if (input) { input.value = ""; lastTerm = ""; }
    showSuggest();
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  const gotoResults = () => { const t = input.value.trim(); if (t) location.href = `/produits.html?q=${encodeURIComponent(t)}`; };
  const render = (term, d) => {
    const source = selectionURL(d.resultsUrl) || '/produits.html?q=' + encodeURIComponent(term);
    let label = `Voir tous les résultats pour « ${term} »`;
    if (d.resultsUrl) label = d.total === 1 ? 'Voir le modèle' : d.total > 1 ? `Voir les ${d.total} modèles` : 'Modifier ma recherche';
    const all = `<a class="sr__all" href="${escapeHtml(source)}">${escapeHtml(label)} →</a>`;
    const intent = searchCriteria(d) + searchNotes(d);
    if (!(d.products?.length || d.brands?.length || d.categories?.length)) {
      results.innerHTML = `${intent}${d.needsCategory?'':'<p class="searchd__empty">Aucun modèle ne réunit tous ces critères.</p>'}${searchSuggestions(d)}${all}`; return;
    }
    // À 1 caractère, le signal utile = les COLLECTIONS (marques + catégories) ; les
    // produits sont trop bruités → on n'en montre que 2 max. Dès 2 car., tout.
    const prods = term.length <= 1 ? (d.products || []).slice(0, 2) : (d.products || []);
    results.innerHTML = intent
      + grp("Marques",    chips(d.brands, brandHref))
      + grp("Catégories", chips(d.categories, catHref))
      + grp(d.family || "Produits", prods.map(p => row(p, source)).join(""))
      + all;
  };
  const run = async (term) => {
    const request = ++searchGeneration;
    pendingSearch?.abort(); pendingSearch = new AbortController();
    results.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(`/api/predictive?q=${encodeURIComponent(term)}`, { signal: pendingSearch.signal });
      if (!response.ok) throw new Error('search unavailable');
      const d = await response.json();
      if (!Array.isArray(d.products)) throw new Error('invalid search');
      if (request !== searchGeneration || root.hidden || input.value.trim() !== term) return;
      render(term, d);
    } catch (e) {
      if (e.name === 'AbortError' || request !== searchGeneration || root.hidden || input.value.trim() !== term) return;
      results.innerHTML = '<p class="searchd__hint" role="status">La recherche est momentanément indisponible.</p><button type="button" class="btn btn--outline" data-search-retry>Réessayer</button>';
      results.querySelector('[data-search-retry]').addEventListener('click', () => run(term));
    } finally { if (request === searchGeneration) results.removeAttribute('aria-busy'); }
  };
  if (input) {
    input.addEventListener("input", () => {
      const term = input.value.trim();
      if (term === lastTerm) return;
      clearTimeout(timer);
      pendingSearch?.abort(); searchGeneration++; results.removeAttribute('aria-busy');
      if (term.length < 1) { showSuggest(); lastTerm = ""; return; }
      lastTerm = term;
      showResults();
      results.innerHTML = `<p class="searchd__hint">Recherche…</p>`;
      timer = setTimeout(() => run(term), 220);
    });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); gotoResults(); } });
  }
  // La croix vit dans le header (hors overlay) + le backdrop dans l'overlay → document.
  document.querySelectorAll("[data-search-close]").forEach((b) => b.addEventListener("click", close));
  return { open, close };
}

