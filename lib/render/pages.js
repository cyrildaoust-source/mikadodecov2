// Composition SSR des pages : fiche produit, index marques/designers, rails accueil, nuancier, catalogue par portée, recherche.
// Extrait de server.js (phase 1 du plan d'architecture, octobre 2026) — code déplacé, pas réécrit.
const fs = require('fs');
const path = require('path');
const { selectInitialVariant } = require('../../v3/product-variant');
const { landing: catalogLanding, renderCatalogLanding } = require('../catalog-landing');
const { filterCatalog } = require('../chair-catalog');
const { markCatalogueSection, pageTitle, renderChairCatalog, renderFamilyCatalog } = require('../chair-catalog-page');
const { brandHero: getBrandHero, collectionHero: getCollectionHero, injectCollectionHero } = require('../editorial-media');
const { families, renderFamilyPage, renderSeatingPage, seatingIcons } = require('../family-pages');
const { searchCatalog } = require('../search-catalog');
const { renderSearchPage } = require('../search-page');
const { seoMeta } = require('../seo-meta');
const { getSearchPage } = require('../services/search');
const { shopifyResize } = require('../shopify/product-mapper');
const { isOutdoor, isTable } = require('../table-collections');
const { BRAND_HERO_REVIEW, FAMILLES_RICHES, OG_DEFAULT, ORIGIN } = require('../config');
const { renderPage } = require('./layout');
const { pageTitle: siteTitle } = require('./seo');   // ≠ pageTitle du catalogue (chair-catalog-page) : « Mobilier · HAY »
const { getDesigners } = require('../designers');
const { V3_DIR } = require('../paths');
const { getActiveBrands, getProductByHandle } = require('../services/catalog');
const { getCatalogIndex, getScopePage } = require('../services/catalog-scope');
const { chromeReady, injectChrome } = require('./chrome');
const { brandBanner, listingNavigation, nav, navigationReady, plpCardSsr } = require('./navigation');
const { absUrl, ogDesc, ogEscape, renderWithOg } = require('./og');

const chairViewReady = import('../../v3/catalog-filters-view.mjs');
const searchViewReady = import('../../v3/search-view.mjs');
// product-specs.mjs (ESM pur) importé comme le chrome → rendu SSR de l'accordéon specs.
let _specs = null;
// Fiche produit complète : même balisage que le navigateur (pdp-view.mjs).
let _pdpView = null;
const _pdpViewReady = import('../../v3/pdp-view.mjs').then((m) => { _pdpView = m.pdpView; }).catch((e) => console.warn('[pdp-ssr] import échoué:', e.message));
const _specsReady = import('../../v3/product-specs.mjs')
  .then((m) => { _specs = m; })
  .catch((e) => { console.warn('[specs-ssr] import échoué:', e.message); _specs = null; });
// Nuancier Fermob : page complète dès le serveur (première couleur ouverte) et
// couleurs dans la page ; auparavant la zone vide se remplissait après le JS (saut de 0,65).
const NUANCIER_COLORS = JSON.parse(fs.readFileSync(path.join(V3_DIR, 'nuancier-fermob.data.json'), 'utf8'));
const _nuancierView = import('../../v3/nuancier-view.mjs');
async function injectNuancier(html) {
  const { nuancierHTML } = await _nuancierView;
  const { slugify } = await import('../../v3/format.mjs');
  const first = NUANCIER_COLORS[0];
  return html.replace('<div id="nf-root"></div>', () => `<div id="nf-root" class="nf-root" data-ssr="${ogEscape(slugify(first.name))}">${nuancierHTML(NUANCIER_COLORS, first)}</div>`
    + '<script type="application/json" id="nf-data">' + JSON.stringify(NUANCIER_COLORS).replace(/</g, '\\u003c') + '</script>');
}
// SEO/SSR · Contenu produit rendu CÔTÉ SERVEUR, injecté à la place du squelette
// (entre <!--PDP-SSR-START/END-->). Reprend les vraies classes (.pdp__brand/__name/
// __designer/__price) → 1er paint fidèle ; le module JS remplace ensuite tout
// [data-pdp] en innerHTML (même mécanisme que le squelette → aucun doublon). Donne aux
// crawlers marque+nom+créateur(lien)+prix SANS JS. La dispo et la description sont déjà
// dans le JSON-LD Product (on n'affiche PAS la dispo ici : son libellé exact — « À voir
// en boutique » / « Sur commande » / « Indisponible » — dépend de la variante côté JS).
// SEO/SSR · Accordéon caractéristiques (dimensions/matériaux/technique…) rendu serveur,
// miroir de produit.html. buildProductSpecGroups = source unique (product-specs.mjs).
// La Référence/SKU (par variante) est ajoutée par le JS, pas ici. Le module re-render l'accordéon.
function specAccordionSsr(p) {
  if (!_specs || !_specs.buildProductSpecGroups) return '';
  const esc = ogEscape;
  const groups = _specs.buildProductSpecGroups(p);
  const panelBody = (g) => g.key === 'description'
    ? '<p class="pdp-desc">' + esc(g.text) + '</p>'
    : '<dl class="pdp-specs">' + g.rows.map((r) => '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(String(r[1])) + '</dd></div>').join('') + '</dl>' + _specs.renderDimensionImages(g, esc);
  const shown = groups.filter((g) => g.key === 'description' ? !!g.text : (g.rows.length > 0 || g.images?.length > 0));
  if (!shown.length) return '';
  return '<section class="section pdp-section pdp-acc" data-accordion>' + shown.map((g, i) =>
    '<div class="pdp-acc__item"><h2 class="catalogue-head serif pdp-acc__head"><button type="button" class="pdp-acc__btn" id="pdp-acc-btn-' + g.key + '" aria-controls="pdp-acc-panel-' + g.key + '" aria-expanded="' + (i === 0 ? 'true' : 'false') + '"><span class="pdp-acc__label">' + esc(g.label) + '</span><span class="pdp-acc__chevron" aria-hidden="true">▾</span></button></h2>'
    + '<div class="pdp-acc__panel" id="pdp-acc-panel-' + g.key + '" role="region" aria-labelledby="pdp-acc-btn-' + g.key + '"' + (i === 0 ? '' : ' hidden') + '>' + panelBody(g) + '</div></div>'
  ).join('') + '</section>';
}
// Fiche complète (galerie, coloris, achat, disponibilité, garanties, caractéristiques),
// avec les données que le navigateur réutilise sans relecture (#product-initial).
function pdpServed(product, sourceURL) {
  const designerSlug = nav.navigation.designerSlug(product.designer, getDesigners());
  const brandHref = product.brand ? nav.navigation.productBrandDestination(product, sourceURL, nav.navigationRules) : '';
  if (!_pdpView) return null;
  const view = _pdpView(product, { requestedVariant: sourceURL.searchParams.get('variant'), selectInitialVariant, brandHref, designerSlug });
  return { html: view.html, data: { ...product, designerSlug, brandHref } };
}
function pdpSsrBlock(p, sourceURL) {
  const selected = selectInitialVariant(p.variants, { requestedId: sourceURL?.searchParams.get('variant'), coverUrl: p.image || p.firstImageRaw, fallback: false });
  if (selected) p = {...p, price: selected.price, priceMin: selected.price, priceMax: selected.price, compareAt: selected.compareAtPrice};
  const rawImg = selected?.image || p.firstImageRaw || (p.images && p.images[0]) || '';
  const img = shopifyResize(rawImg, 1000);
  // Lien créateur si le designer a une page (même règle que produit.html : slug connu)
  // → +maillage interne crawlable vers les 247 pages créateur (2ᵉ levier de l'audit).
  const dslug = nav.navigation.designerSlug(p.designer, getDesigners());
  const designerEl = !p.designer ? ''
    : dslug
      ? '<a class="pdp__designer pdp__designer--link" href="/produits.html?designer=' + encodeURIComponent(dslug) + '">' + ogEscape(p.designer) + '</a>'
      : '<span class="pdp__designer">' + ogEscape(p.designer) + '</span>';
  return '<div class="pdp">'
    + '<div class="pdp__gallery"><div class="pdp__main-wrap" style="aspect-ratio:1/1">'
    + (img ? '<img class="pdp__main" src="' + ogEscape(img) + '" alt="' + ogEscape(p.name || '') + '" width="1000" height="1000" fetchpriority="high" decoding="async" />' : '')
    + '</div></div>'
    + '<div class="pdp__info">'
    + (p.brand ? '<a class="pdp__brand" href="' + ogEscape(nav.navigation.productBrandDestination(p, sourceURL, nav.navigationRules)) + '">' + ogEscape(p.brand) + '</a>' : '')
    + '<h1 class="pdp__name">' + ogEscape(p.name || 'Produit') + '</h1>'
    + designerEl
    + '<div class="pdp__price">' + nav.priceLabelS(p) + '</div>'
    + '</div></div>'
    + specAccordionSsr(p);
}
// SEO/SSR · Hero créateur (nom + bio + portrait) injecté dans [data-designer-hero]
// (miroir de renderDesignerHero, hors bloc « Édité par »). Le module le remplace ensuite.
function designerHeroSsr(d) {
  const photo = d.photo
    ? '<picture><source type="image/webp" srcset="' + ogEscape(String(d.photo).replace(/\.jpg$/, '-640.webp')) + '" /><img class="designer-hero__photo" src="' + ogEscape(d.photo) + '" width="640" height="800" alt="' + ogEscape(d.name || '') + '" fetchpriority="high" /></picture>'
    : '';
  const bio = d.bio ? '<p class="designer-hero__bio">' + ogEscape(d.bio) + '</p>' : '';
  return '<div class="designer-hero">' + photo
    + '<div class="designer-hero__body">'
    + '<h1 class="designer-hero__name serif">' + ogEscape(d.name || '') + '</h1>'
    + bio + '</div></div>';
}
// APRÈS les 3 routes templatées + le sitemap, AVANT express.static. Ne capte que
// SSR_PAGES + articles journal ; tout le reste passe à next() (static/api).
// SEO/SSR · Index MARQUES crawlable : rend les vraies cartes marque (lien + logo + nom)
// dans [data-brandgrid] à la place des squelettes, avec les liens de getActiveBrands.
// Le navigateur conserve ces cartes sans les recréer.
async function injectBrandsIndex(html) {
  const { brandCardHTML } = await import('../../v3/brand-card.mjs');
  const active = await getActiveBrands();
  const brands = (active || []).slice().sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  if (!brands.length) return html;
  const version = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || 'dev';
  const cards = brands.map(b => brandCardHTML(b, { imageUrl: url => `${url}?v=${encodeURIComponent(version)}` })).join('');
  // Bloc squelette exact (4 lignes) → on remplace juste le contenu, on garde </div>.
  const skelBlock = '<div class="brandgrid" data-brandgrid>\n'
    + Array(4).fill('      <div class="brandcard"><div class="pcard__skel" style="aspect-ratio:1/1"></div></div>').join('\n');
  html = html.replace(skelBlock, () => '<div class="brandgrid" data-brandgrid data-ssr="1">\n      ' + cards);
  html = html.replace('<span class="plp-count" data-brand-count></span>', () => '<span class="plp-count" data-brand-count>' + brands.length + ' marques</span>');
  return html;
}
// Créateurs qui portent au moins un produit publié (tags de l'index commun du catalogue).
// null si l'index est indisponible : l'appelant garde alors la liste complète.
async function activeDesignerSlugs({ patient = false } = {}) {
  let tags;
  try { tags = new Set((await getCatalogIndex({ patient })).products.flatMap(p => p.card.tags || [])); }
  catch (e) { console.warn('[designers] index', e.message); return null; }
  return new Set(getDesigners()
    .filter(d => d && d.slug && !d.hidden && (d.tags?.length ? d.tags : [d.slug]).some(t => tags.has(t)))
    .map(d => d.slug));
}
// SEO/SSR · Index DESIGNERS crawlable : featured + annuaire A-Z (noms + liens ?designer=).
// Seuls les créateurs qui ont des produits en ligne y figurent (décision du 1er octobre) ;
// une fiche réapparaît d'elle-même quand un de ses produits revient.
function injectDesignersIndex(html, active) {
  const esc = ogEscape;
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const FOLD = { 'Ø':'O','Œ':'O','Æ':'A','Å':'A','Ł':'L','Đ':'D','Þ':'T','ẞ':'S' };
  const bucketOf = (d) => {
    let ch = (d.sortKey || d.name || '').trim().charAt(0).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    ch = FOLD[ch] || ch;
    return /[A-Z]/.test(ch) ? ch : '#';
  };
  const brandsHTML = (d) => (d.brands || []).map(b => '<a href="' + esc(nav.navigation.brandHref(b, nav.navigationRules)) + '">' + esc(b) + '</a>').join('<span class="designer-card__brand-sep" aria-hidden="true"> · </span>');
  const photoHTML = (d) => d.photo
    ? '<picture><source type="image/webp" srcset="' + esc(String(d.photo).replace(/\.jpg$/, '-640.webp')) + '" /><img class="designer-card__photo" src="' + esc(d.photo) + '" width="640" height="800" alt="' + esc(d.name) + '" loading="lazy" /></picture>'
    : '<div class="designer-card__photo" aria-hidden="true"></div>';
  const featuredCardHTML = (d) => '<article class="designer-card designer-card--lg" id="' + esc(d.slug) + '">'
    + photoHTML(d) + '<h3 class="designer-card__name">' + esc(d.name) + '</h3>'
    + '<div class="designer-card__brands">' + brandsHTML(d) + '</div>'
    + '<a class="designer-card__link" href="/produits.html?designer=' + encodeURIComponent(d.slug) + '" aria-label="Voir les produits de ' + esc(d.name) + '"></a></article>';

  const all = getDesigners().filter((d) => !d.hidden && (!active || active.has(d.slug)));
  all.sort((a, b) => (a.sortKey || a.name).localeCompare(b.sortKey || b.name, 'fr', { sensitivity: 'base' }));
  if (!all.length) return html;
  const featured = all.filter((d) => d.featured);
  const featuredSlugs = new Set(featured.map((d) => d.slug));
  const featHtml = featured.map(featuredCardHTML).join('');

  // Deux créateurs de même nom de famille (Aino et Alvar Aalto) : nom complet pour les distinguer.
  const keyCount = {};
  for (const d of all) { const k = (d.sortKey || d.name).toLowerCase(); keyCount[k] = (keyCount[k] || 0) + 1; }
  const azLabel = (d) => keyCount[(d.sortKey || d.name).toLowerCase()] > 1 ? d.name : (d.sortKey || d.name);
  const groups = {};
  for (const d of all) { const k = bucketOf(d); (groups[k] = groups[k] || []).push(d); }
  const bar = ALPHA.map((L) => groups[L]
    ? '<a class="az-bar__letter" href="#letter-' + L + '">' + L + '</a>'
    : '<span class="az-bar__letter is-empty" aria-hidden="true">' + L + '</span>');
  if (groups['#']) bar.push('<a class="az-bar__letter" href="#letter-num">#</a>');
  const letters = Object.keys(groups).sort((a, b) => a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b, 'fr'));
  const idxHtml = letters.map((L) => {
    const anchor = L === '#' ? 'letter-num' : 'letter-' + L;
    const names = groups[L].map((d) => {
      const id = featuredSlugs.has(d.slug) ? '' : ' id="' + esc(d.slug) + '"';
      return '<li class="az-name"' + id + '><a href="/produits.html?designer=' + encodeURIComponent(d.slug) + '">' + esc(azLabel(d)) + '</a></li>';
    }).join('');
    return '<div class="az-group"><h3 class="az-letter" id="' + anchor + '">' + L + '</h3><ul class="az-names">' + names + '</ul></div>';
  }).join('');

  html = html.replace('<div class="designer-grid" data-featured-grid></div>', () => '<div class="designer-grid" data-featured-grid>' + featHtml + '</div>');
  html = html.replace('<nav class="az-bar" data-az-bar aria-label="Index alphabétique des designers"></nav>', () => '<nav class="az-bar" data-az-bar aria-label="Index alphabétique des designers">' + bar.join('') + '</nav>');
  html = html.replace('<div class="az-index" data-az-index></div>', () => '<div class="az-index" data-az-index>' + idxHtml + '</div>');
  html = html.replace('<span class="plp-count" data-designer-count></span>', () => '<span class="plp-count" data-designer-count>' + all.length + ' designers</span>');
  return html;
}
// SEO/SSR · Remplit les 2 rails produits de l'accueil (Nouveautés + Meilleures ventes)
// à la place des squelettes. Miroir de loadRows (main.js) : même flux paginé, tranches
// séquentielles [0..4] puis [4..8], filtrées sur p.image. Réutilise plpCardSsr ; le module
// JS repeint ensuite (host.innerHTML) → hydratation, 0 doublon. Conteneurs distingués par
// data-sort="new" (Nouveautés) vs sans (Meilleures ventes).
const HOME_SKEL = "<div class=\"pcard\"><div class=\"pcard__skel\"></div></div><div class=\"pcard\"><div class=\"pcard__skel\"></div></div><div class=\"pcard\"><div class=\"pcard__skel\"></div></div><div class=\"pcard\"><div class=\"pcard__skel\"></div></div>";
function injectHomeRails(html, { nouveautes, best }) {
  const render = (arr) => arr.map(plpCardSsr).filter(Boolean).join('');
  const r1 = render(nouveautes), r2 = render(best);
  if (r1) html = html.replace(
    '<div class="prow prow--4" data-products data-count="4" data-sort="new">\n      ' + HOME_SKEL,
    () => '<div class="prow prow--4" data-products data-count="4" data-sort="new">\n      ' + r1);
  if (r2) html = html.replace(
    '<div class="prow prow--4" data-products data-count="4">\n      ' + HOME_SKEL,
    () => '<div class="prow prow--4" data-products data-count="4">\n      ' + r2);
  return html;
}
async function sendSearchPage(req,res) {
  const [,view]=await Promise.all([chromeReady,searchViewReady,navigationReady]);let data;
  try {data=await getSearchPage(req.query);}
  catch(error) {console.warn('[search-page]',error.message);data={...searchCatalog([],req.query),error:true};res.status(503);}
  let html=renderSearchPage(renderPage('produits.html'),data,view,plpCardSsr);
  html=listingNavigation(html,req);
  html=renderWithOg(html,{title:siteTitle('Votre recherche'),description:'Trouvez votre pièce de design par finition, dimensions, capacité et budget.',url:ORIGIN+data.resultsUrl,image:OG_DEFAULT});
  html=html.replace('</head>','<meta name="robots" content="noindex,follow">\n</head>');
  return res.set('Cache-Control','no-store').send(injectChrome(html,'produits.html',true));
}
function isFilteredState(state) {
  return Boolean(state.q || state.category.length || state.brand.length > 1 || state.color.length || state.material.length || state.usage.length || state.feature.length || state.stock || state.tag || state.sort !== 'pop' || state.min !== null || state.max !== null || state.seat_min !== null || state.seat_max !== null);
}
async function familyScopeHTML(req, scope, data, view) {
  const handle = scope.handle;
  if (FAMILLES_RICHES[handle]) {
    let html = renderPage(FAMILLES_RICHES[handle]);
    if (handle === 'sieges') {
      const results = await Promise.allSettled(seatingIcons.handles.map(getProductByHandle));
      const items = results.flatMap(result => result.status === 'fulfilled' && result.value ? [result.value] : []);
      html = renderSeatingPage(html, items, items.map(p => plpCardSsr(p, req.originalUrl)).filter(Boolean).join(''));
    }
    return { html: renderFamilyCatalog(html, data, view, plpCardSsr), page: FAMILLES_RICHES[handle] };
  }
  const featuredResults = await Promise.allSettled((families[handle].featured?.handles || []).map(getProductByHandle));
  const featuredItems = featuredResults.flatMap(result => result.status === 'fulfilled' && result.value && isTable(result.value) && !isOutdoor(result.value) ? [result.value] : []);
  // « Les icônes » : mêmes règles que le navigateur (family-policy.mjs), lues dans l'index.
  let iconCards = null;
  try {
    const [index, { isFamilyIcon }] = await Promise.all([getCatalogIndex(), import('../../v3/family-policy.mjs')]);
    const inFamily = new Set(index.members[handle] || []);
    iconCards = index.products.filter(p => inFamily.has(p.card.id) && isFamilyIcon(p.card)).slice(0, 30).map(p => plpCardSsr(p.card, req.originalUrl)).join('');
  } catch { /* le navigateur les chargera */ }
  const html = renderFamilyPage(renderPage('family-page.html'), handle, {
    featuredItems, featuredCards: featuredItems.map(p => plpCardSsr(p, req.originalUrl)).filter(Boolean).join(''), cards: ' ', iconCards,
  });
  return { html: renderFamilyCatalog(html, data, view, plpCardSsr), page: 'family-page.html' };
}
async function catalogueScopeHTML(req, data, view) {
  const results = await Promise.allSettled(catalogLanding.icons.handles.map(getProductByHandle));
  const iconItems = results.flatMap(result => result.status === 'fulfilled' && result.value ? [result.value] : []);
  let html = renderChairCatalog(renderPage('produits.html'), data, view, plpCardSsr);
  html = renderCatalogLanding(html, { iconItems, iconCards: iconItems.map(p => plpCardSsr(p, req.originalUrl)).filter(Boolean).join('') });
  // Même titre que le navigateur (« Mobilier · HAY » quand une marque est choisie).
  html = html.replace(/(<h1 class="fam-hero__title" id="catalogue-title" data-plp-title data-context>)[^<]*(<\/h1>)/, (_, open, close) => open + ogEscape(pageTitle(data)) + close);
  return { html: markCatalogueSection(html), page: 'produits.html' };
}
// Retourne false quand la page doit reprendre sa liste d'origine (index indisponible).
async function sendScopeCatalog(req,res,scope) {
  await Promise.all([chromeReady,navigationReady]);
  const view = await chairViewReady;
  let data;
  try { data = await getScopePage(scope, req.query); }
  catch(error) {
    console.warn('[catalog]',scope.handle,error.message);
    if (scope.fallback === 'legacy') return false;
    data = {scope,...filterCatalog([],req.query),error:true};
  }
  // Catalogue filtré sur une seule marque : la page de la marque est l'URL à indexer.
  const brandPage = scope.kind === 'catalogue' && data.state.brand.length === 1 && data.state.page === 1 && !isFilteredState(data.state)
    && nav.navigationRules.collections[data.state.brand[0]]?.kind === 'brand' ? '/collections/' + data.state.brand[0] : null;
  const url = ORIGIN + (brandPage || view.scopeURL(scope,data.state));
  const brandName = data.state.brand.length===1 ? data.facets.brand.find(b=>b.value===data.state.brand[0])?.label : '';
  let html, page = 'produits.html', photo = null;
  if (scope.kind === 'family') ({ html, page } = await familyScopeHTML(req, scope, data, view));
  else if (scope.kind === 'catalogue') ({ html, page } = await catalogueScopeHTML(req, data, view));
  else if (scope.kind === 'designer') {
    // Même présentation que la page créateur d'origine : portrait et biographie.
    const designer = getDesigners().find(d => d.slug === scope.fixed.designer);
    html = renderChairCatalog(renderPage('produits.html'),data,view,plpCardSsr)
      .replace('<html lang="fr" class="plp-collection"', '<html lang="fr" class="plp-designer"')
      // Le bandeau générique est masqué sur une page créateur : son titre ne doit pas doubler le H1 du portrait.
      .replace(/<h1 data-plp-title data-context>([^<]*)<\/h1>/, '<p data-plp-title data-context>$1</p>')
      // Le portrait porte le nom sur chaque page : pas de titre compact (vide et doublon dès la page 2).
      .replace(/<div class="chair-catalog__compact wrap">[\s\S]*?<\/div>/, '')
      .replace('<div class="wrap" data-designer-hero></div>', () => '<div class="wrap" data-designer-hero>' + (designer ? designerHeroSsr(designer) : '') + '</div>');
    photo = designer?.photo ? { img: designer.photo } : null;
  }
  else {
    photo = getBrandHero(scope.handle, { includeCandidates: BRAND_HERO_REVIEW }) || getCollectionHero(scope.handle);
    html = brandBanner(injectCollectionHero(renderChairCatalog(renderPage('produits.html'),data,view,plpCardSsr),photo), scope.handle);
  }
  const image = scope.kind === 'family' ? absUrl(families[scope.handle]?.hero || (scope.handle === 'sieges' ? '/images/familles/assises/hero.webp' : '/images/familles/jardin/1.webp'))
    : scope.kind === 'catalogue' ? catalogLanding.hero.image
    : photo?.img ? absUrl(photo.img) : OG_DEFAULT;
  // Marques, gammes et sélections : description Shopify de la collection, comme avant.
  const editorial = scope.kind === 'collection' ? data.collection?.description : scope.kind === 'designer' ? scope.ogDescription : '';
  const { title, description } = seoMeta(scope, data, { brandName, editorial: editorial ? ogDesc(editorial) : '' });
  html = renderWithOg(html,{title,description,image,url});
  html = listingNavigation(html,req,{title:['catalogue','designer'].includes(scope.kind) ? undefined : scope.label,brandName});
  if (data.error) {
    html = html.replace(view.emptyState(scope),`<p class="plp-empty">${ogEscape(scope.unavailable)} <a href="${ogEscape(req.originalUrl)}">Réessayer</a>.</p>`);
    res.status(503).set({'Cache-Control':'no-store','Retry-After':'60'});
  } else {
    // Filtres, ou sélection sans aucun modèle (créateur ou collection vide) : hors de l'index.
    if(isFilteredState(data.state) || !data.total) { res.set('X-Robots-Tag','noindex, follow'); html = html.replace('</head>','<meta name="robots" content="noindex,follow">\n</head>'); }
    // Page cachable à l'edge : 2 min servies telles quelles, puis l'ancienne page reste servie
    // pendant que l'edge la régénère en arrière-plan (jusqu'à 24 h). Le prix et le stock sont
    // reconfirmés au panier (/api/cart/preview, no-store) : la fraîcheur à la seconde ici ne
    // protégeait de rien et coûtait 1 à 2 s de rendu à chaque visite. Pages filtrées : 1 min.
    res.set('Cache-Control', isFilteredState(data.state)
      ? 'public, s-maxage=60, stale-while-revalidate=3600'
      : 'public, s-maxage=120, stale-while-revalidate=86400');
  }
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(injectChrome(html,page,data.state.page===1));
  return true;
}

module.exports = { activeDesignerSlugs, designerHeroSsr, injectBrandsIndex, injectDesignersIndex, injectHomeRails, injectNuancier, pdpServed, pdpSsrBlock, sendScopeCatalog, sendSearchPage };
