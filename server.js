require('dotenv').config();
const { shopifyFetch, SHOPIFY_STORE } = require('./lib/shopify/client');
const { mapProduct, mapProductRef, shopifyResize, CARD_IMAGE_WIDTH } = require('./lib/shopify/product-mapper');
const { getSearchPage, clearSearchCache } = require('./lib/services/search');
const { SITEMAP_PRODUCTS_QUERY, PRODUCT_CARD_FIELDS, PRODUCTS_QUERY, SEARCH_QUERY, SEARCH_FALLBACK_QUERY, VENDORS_QUERY, COLLECTIONS_QUERY, PREDICTIVE_QUERY, MENU_QUERY, COLLECTION_PRODUCTS_QUERY, PRODUCT_QUERY, CART_CREATE_MUTATION, CART_PREVIEW_MUTATION } = require('./lib/shopify/queries');
const { normalizeItems, getDeliveryEstimate, realProject } = require('./lib/delivery-estimate');
const express = require('express');
const { promotionCard } = require('./lib/promotion-card');
const { selectInitialVariant } = require('./v3/product-variant');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');                 // natif — vérif HMAC des webhooks Shopify
const rateLimit = require('express-rate-limit');   // rate-limit anti-abus (in-memory, best-effort)
const { families, seatingIcons, PAGE_SIZE: FAMILY_PAGE_SIZE, renderFamilyPage, renderSeatingPage } = require('./lib/family-pages');
const { collectionHero: getCollectionHero, injectCollectionHero } = require('./lib/editorial-media');
const { tableSources, tablePage, isOutdoor, isTable } = require('./lib/table-collections');
const { brandCollectionPage, brandName } = require('./lib/collection-brand');
const { adminClient, subscribeInShopify, notifyByEmail } = require('./lib/newsletter');
const { photoStyle, imageAtWidth } = require('./lib/editorial-media');
const { landing: catalogLanding, isCatalogLanding, renderCatalogLanding } = require('./lib/catalog-landing');
const { chairQuery, VARIANT_QUERY: CHAIR_VARIANT_QUERY, readChairCatalog, filterCatalog } = require('./lib/chair-catalog');
const { renderChairCatalog } = require('./lib/chair-catalog-page');
const chairViewReady = import('./v3/catalog-filters-view.mjs');
const {parseSearch} = require('./lib/search-intent');
const {searchCatalog} = require('./lib/search-catalog');
const {renderSearchPage} = require('./lib/search-page');
const searchViewReady = import('./v3/search-view.mjs');

// ─── SHOPIFY STOREFRONT API ────────────────────────────
// ─── CACHE (5 min TTL) ─────────────────────────────────
const _cache = {};
async function cached(key, fetcher, ttl = 300_000) {
  const now = Date.now();
  if (_cache[key] && _cache[key].expiry > now) return _cache[key].data;
  const data = await fetcher();
  _cache[key] = { data, expiry: now + ttl };
  return data;
}

const app  = express();
const PORT = process.env.PORT || 4000;

// Vercel place 1 proxy devant l'app → la vraie IP client est dans X-Forwarded-For.
// Sans ça, req.ip = IP du proxy (tous les clients confondus) et express-rate-limit
// lève une erreur de validation. Indispensable pour le rate-limit ci-dessous.
app.set('trust proxy', 1);

// The Mikado Deco storefront (v3/) is served at the site root.
// Old /v3/* links 301-redirect to the clean root path for backward-compat.
app.use('/v3', (req, res) => res.redirect(301, req.url && req.url !== '/' ? req.url : '/'));
// ─── SSR OPEN GRAPH (FICHES PRODUIT · COLLECTIONS/MARQUES · CRÉATEURS) ──
// Les robots d'aperçu social (WhatsApp/iMessage/Messenger/FB…) n'exécutent
// PAS le JS — un lien partagé doit donc déjà porter, dans le <head>, le bon
// titre + la bonne image. On enrichit ici le <head> côté serveur (title,
// description, Open Graph, Twitter, canonical) à partir des données Shopify /
// designers-data.json ; le corps de la page continue de s'hydrater en JS à
// l'identique (galerie, grille, fiche créateur, panier, JSON-LD client).
// Cache edge (s-maxage) → quasi-CDN après le 1er hit. vercel.json route
// /produit.html?handle=…, /collections/<handle> et /produits.html?designer=…
// vers cette fonction ; les autres modes tombent sur le fichier statique.
const ORIGIN = 'https://www.mikadodeco.be';
const OG_DEFAULT = ORIGIN + '/images/og-default.jpg';
const PRODUIT_TEMPLATE  = path.join(__dirname, 'v3', 'produit.html');
const PRODUITS_TEMPLATE = path.join(__dirname, 'v3', 'produits.html');
// Familles « Mobilier » qui ont une page catégorie riche dédiée (hero + sections).
// Jardin et Assises conservent leurs compositions éditoriales validées.
const FAMILLES_RICHES = { outdoor: 'famille.html', sieges: 'famille-assises.html' };
const FAMILY_TEMPLATE = path.join(__dirname, 'templates', 'family-page.html');
// Marques disposant d'un bandeau header (miroir EXACT de la map HEADERS de
// v3/produits.html). Pour elles, l'image OG = le bandeau de marque statique.
const BRAND_HEADERS = new Set(['fatboy', 'ferm-living', 'tradition', 'vitra', 'string-furniture', 'muuto', 'blomus', 'assouline', 'airborne', 'artek']);

// ─── CHROME SSR ────────────────────────────────────────
// chrome-template.js est ESM + pur → importable en Node via import() dynamique.
// Chargé une seule fois, mémorisé. Repli gracieux si non prêt (cold start très tôt).
let _chrome = null;
const _chromeReady = import('./v3/chrome-template.js')
  .then((m) => { _chrome = m; })
  .catch((e) => { console.warn('[chrome-ssr] import échoué:', e.message); _chrome = null; });
// product-specs.mjs (ESM pur) importé comme le chrome → rendu SSR de l'accordéon specs.
let _specs = null;
const _specsReady = import('./v3/product-specs.mjs')
  .then((m) => { _specs = m; })
  .catch((e) => { console.warn('[specs-ssr] import échoué:', e.message); _specs = null; });

// Pages NON-hero (transparentNav:false) : header rendu DÉJÀ solide en SSR pour
// éviter le flash blanc-sur-blanc (cf. styles.css .chrome color:on-dark par défaut).
// Toute page absente de ce Set est hero (transparent over-hero, bindChrome gère le scroll).
const NON_HERO = new Set([
  'produit.html', 'contact.html', 'selection.html', 'journal.html',
  'nuancier-fermob.html', '404.html', 'mentions-legales.html',
  'conditions-generales-de-vente.html', 'politique-cookies.html',
  'politique-et-vie-privee.html',
]);
// Les articles du journal sont tous non-hero (transparentNav:false).
function isNonHero(rel) {
  if (!rel) return false;
  if (rel.startsWith('journal/')) return true;   // v3/journal/*.html
  return NON_HERO.has(rel);
}

// Injecte le chrome dans #site-header / #site-footer d'une page HTML.
// - rel : chemin relatif à v3/ (ex. 'contact.html', 'journal/and-tradition.html'),
//   sert à décider l'état solide. undefined → header transparent par défaut.
// - IDEMPOTENT par construction : la regex ne matche qu'un conteneur VIDE
//   (<div id="site-header"></div>) → un 2e passage ne re-matche pas.
// Nav active pour le SSR du chrome : mappe le fichier (rel) -> libelle NAV_TOP, pour que le
// soulignement d actif soit deja pose au 1er paint (plus d animation apres hydratation).
// produit/produits.html laisses vides (contexte catalogue/designer resolu client-side).
const REL_ACTIVE = {
  'marques.html': 'Marques', 'designers.html': 'Designers',
  'journal.html': 'Le journal', 'nuancier-fermob.html': 'Le journal',
  'studio.html': 'Mikado Studio',
  'famille.html': 'Mobilier', 'famille-assises.html': 'Mobilier', 'famille-tables.html': 'Mobilier',
  'family-page.html': 'Mobilier',
};
function activeForRel(rel) {
  if (!rel) return '';
  if (rel.startsWith('journal/')) return 'Le journal';
  return REL_ACTIVE[rel] || '';
}
function injectChrome(html, rel, solidHeader = false) {
  if (!_chrome) return html;                 // module pas prêt → repli (page sans chrome SSR, hydratée client)
  const active = activeForRel(rel);          // nav active en SSR (anti-glissement du soulignement)
  // Header solide pré-rendu pour les pages non-hero (anti flash blanc-sur-blanc).
  const headerHtml = (isNonHero(rel) || solidHeader)
    ? _chrome.chromeHTML(active).replace('<header class="chrome"', '<header class="chrome chrome--solid"')
    : _chrome.chromeHTML(active);
  const footerHtml = _chrome.footerHTML();
  let out = html
    .replace(/(<div id="site-header"[^>]*>)\s*(<\/div>)/i,
             (_m, open, close) => `${open}${headerHtml}${close}`)
    .replace(/(<div id="site-footer"[^>]*>)\s*(<\/div>)/i,
             (_m, open, close) => `${open}${footerHtml}${close}`);
  // Pages non-hero (header solide) : poser `has-topnav` sur le <body> DÈS le SSR,
  // comme `chrome--solid` l'est déjà. Sinon initShell (shared.js) l'ajoute trop
  // tard et le contenu `.page` saute de +116px (padding-top) au 1er paint.
  // Tous les templates non-hero ont un <body> nu (vérifié) ; le classList.add
  // côté client devient un no-op idempotent.
  if (isNonHero(rel)) {
    out = out.replace(/<body(\s*)>/i, '<body class="has-topnav">');
  }
  // Preload du serif d affichage (Cormorant 600) — evite le FOUT des titres sur les
  // pages qui ne le portent pas deja dans leur <head>. Idempotent (skip si deja present).
  if (!/cormorant-garamond-latin-600/.test(out)) {
    out = out.replace(/<\/head>/i,
      '  <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/cormorant-garamond-latin-600-normal.woff2">\n</head>');
  }
  return out;
}

const ogEscape = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// URL absolue (les URLs Shopify CDN le sont déjà ; les chemins /images/… non ;
// une URL protocole-relative //host/… reçoit https:).
const absUrl = (u) => {
  if (!u) return '';
  const s = String(u);
  if (/^https?:\/\//i.test(s)) return s;
  if (s.charAt(0) === '/' && s.charAt(1) === '/') return 'https:' + s;
  return ORIGIN + (s.charAt(0) === '/' ? s : '/' + s);
};
// Description OG : espaces normalisés, tronquée ~200 (échappement plus tard).
function ogDesc(s) {
  let d = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  if (d.length > 200) d = d.slice(0, 199).trimEnd() + '…';
  return d;
}
// Enrichit le <head> d'un template : title + meta description + Open Graph +
// Twitter + canonical. Échappement attribut HTML. Retire le ratio
// og:image:width/height en dur (photos produit / bandeaux / portraits ne sont
// pas en 1.91:1). Mécanisme commun aux 3 types de page partageable.
// NB : les valeurs sont injectées via une FONCTION de remplacement (pas une
// chaîne) — String.replace interprète $$, $&, $`, $' dans une chaîne de
// remplacement ; une description/bio Shopify contenant « $$ » ou « 50$&… »
// corromprait le <head>. La forme `() => …` neutralise totalement ces motifs.
function renderWithOg(templateHtml, { title, description, image, url }) {
  const T = ogEscape(title), D = ogEscape(description), I = ogEscape(image), U = ogEscape(url);
  let html = templateHtml
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${T}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, () => `<meta name="description" content="${D}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, () => `<meta property="og:title" content="${T}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, () => `<meta property="og:description" content="${D}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, () => `<meta property="og:url" content="${U}" />`)
    .replace(/<meta property="og:image" content="[^"]*"\s*\/>/, () => `<meta property="og:image" content="${I}" />`)
    // Le ratio en dur (1200×630) ne correspond pas aux visuels → on le retire.
    .replace(/\s*<meta property="og:image:width" content="[^"]*"\s*\/>/, '')
    .replace(/\s*<meta property="og:image:height" content="[^"]*"\s*\/>/, '')
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, () => `<meta name="twitter:title" content="${T}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, () => `<meta name="twitter:description" content="${D}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/, () => `<meta name="twitter:image" content="${I}" />`);
  // Canonical propre (URL sans params de filtre/from) : remplace un
  // <link rel="canonical"> statique s'il existe, sinon l'injecte juste après
  // og:url. (Les templates posent aussi le canonical en JS, qui réutilise ce
  // même tag via querySelector → jamais de double canonical.)
  if (/<link rel="canonical"[^>]*>/i.test(html)) {
    html = html.replace(/<link rel="canonical"[^>]*>/i, () => `<link rel="canonical" href="${U}" />`);
  } else {
    html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, (m) => `${m}\n  <link rel="canonical" href="${U}" />`);
  }
  return html;
}
// Une seule règle de hiérarchie et un seul BreadcrumbList, visibles avant le JS.
let navigation, navigationRules, productCardHTML;
const _navigationReady = Promise.all([import('./v3/navigation.mjs'), import('./v3/product-card.mjs')]).then(([m, cards]) => {
  navigation = m;
  productCardHTML = cards.productCardHTML;
  navigationRules = m.createNavigation(
    JSON.parse(fs.readFileSync(path.join(__dirname, 'v3/navigation-data.json'), 'utf8')),
    JSON.parse(fs.readFileSync(path.join(__dirname, 'v3/mega-menu-brands.json'), 'utf8')).brands,
    getDesigners()
  );
});
function injectNavigation(html, trail, currentURL, source = '') {
  html = html.replace(/(<div[^>]* data-breadcrumb>)<\/div>/, (_, open) => open + navigation.breadcrumbHTML(trail) + '</div>');
  html = html.replace('<div data-selection-return></div>', () => '<div data-selection-return>' + navigation.returnLinkHTML(source) + '</div>');
  const ld = JSON.stringify(navigation.breadcrumbData(trail, currentURL)).replace(/</g, '\\u003c');
  return html.replace('</head>', () => '<script type="application/ld+json" id="navigation-breadcrumb">' + ld + '</script>\n</head>');
}
function listingNavigation(html, req, hints = {}) {
  const url = new URL(req.originalUrl, ORIGIN);
  return injectNavigation(html, navigation.listingTrail(url, navigationRules, hints), url.pathname + url.search);
}
// Les grilles paginées/triées sont calculées sur le jeu complet dans le navigateur.
// Ne pas présenter la première tranche SSR comme la page N ou comme un tri global.
function canRenderInitialGrid(req) {
  return !(Number(req.query.page) > 1 || (req.query.sort && req.query.sort !== 'pop'));
}
// Les curseurs parcourent les lots rendus sur le serveur, y compris sans JS.
function listingPagination(html, req, pageInfo = {}) {
  if (!canRenderInitialGrid(req)) return html;
  const params = new URLSearchParams();
  for (const key of ['designer', 'brand', 'tag', 'cats', 'q', 'cursor']) {
    if (typeof req.query[key] === 'string' && req.query[key]) params.set(key, req.query[key]);
  }
  const href = () => req.path + (params.size ? '?' + params : '');
  const links = [];
  if (params.has('cursor')) {
    const canonical = ogEscape(ORIGIN + href());
    html = html.replace(/<link rel="canonical"[^>]*>/i, () => `<link rel="canonical" href="${canonical}" />`)
      .replace(/<meta property="og:url"[^>]*>/i, () => `<meta property="og:url" content="${canonical}" />`);
    params.delete('cursor');
    links.push(`<a class="plp-page" href="${ogEscape(href())}#grille">Revenir au début</a>`);
  }
  if (pageInfo.hasNextPage && pageInfo.endCursor) {
    params.set('cursor', pageInfo.endCursor);
    links.push(`<a class="plp-page" href="${ogEscape(href())}#grille">Voir plus de produits</a>`);
  }
  if (links.length) html = html.replace('<nav class="plp-pagination" data-pagination aria-label="Pagination" hidden></nav>',
    () => `<nav class="plp-pagination" data-pagination aria-label="Pagination">${links.join('')}</nav>`);
  return html;
}
function temporaryUnavailable(res) {
  return res.status(503).set('Cache-Control', 'no-store').set('Retry-After', '60');
}
// SEO/SSR · formatage prix miroir de shared.js, en conservant les centimes utiles.
const euroS = (n) => (n || n === 0)
  ? new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2 }).format(n)
  : '';
const priceLabelS = (p) => {
  if (p.priceIsExact) return euroS(p.price);
  const min = p.priceMin != null ? p.priceMin : p.price;
  const max = p.priceMax != null ? p.priceMax : p.price;
  if (min != null && max != null && max - min > 0.5) return 'À partir de ' + euroS(min);
  return euroS(min);
};
// Shared HTML keeps server-rendered and browser cards in sync.
// Selection controls are enabled only once the browser cart is bound.
function plpCardSsr(p, source = '') {
  return productCardHTML(p, {source, interactive: false});
}

// SEO/SSR · slugify miroir de shared.js (accents/ø/æ) — pour le lien créateur SSR.
const slugifyS = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/ø/g, 'o').replace(/æ/g, 'ae')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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
function pdpSsrBlock(p, sourceURL) {
  const selected = selectInitialVariant(p.variants, { requestedId: sourceURL?.searchParams.get('variant'), coverUrl: p.image || p.firstImageRaw, fallback: false });
  if (selected) p = {...p, price: selected.price, priceMin: selected.price, priceMax: selected.price, compareAt: selected.compareAtPrice};
  const rawImg = selected?.image || p.firstImageRaw || (p.images && p.images[0]) || '';
  const img = shopifyResize(rawImg, 1000);
  // Lien créateur si le designer a une page (même règle que produit.html : slug connu)
  // → +maillage interne crawlable vers les 247 pages créateur (2ᵉ levier de l'audit).
  const dslug = p.designer ? slugifyS(p.designer) : '';
  const designerEl = !p.designer ? ''
    : (dslug && getDesigners().some(d => String(d.slug || '').toLowerCase() === dslug && !d.hidden))
      ? '<a class="pdp__designer pdp__designer--link" href="/produits.html?designer=' + encodeURIComponent(dslug) + '">' + ogEscape(p.designer) + '</a>'
      : '<span class="pdp__designer">' + ogEscape(p.designer) + '</span>';
  return '<div class="pdp">'
    + '<div class="pdp__gallery"><div class="pdp__main-wrap" style="aspect-ratio:1/1">'
    + (img ? '<img class="pdp__main" src="' + ogEscape(img) + '" alt="' + ogEscape(p.name || '') + '" width="1000" height="1000" fetchpriority="high" decoding="async" />' : '')
    + '</div></div>'
    + '<div class="pdp__info">'
    + (p.brand ? '<a class="pdp__brand" href="' + ogEscape(navigation.productBrandDestination(p, sourceURL, navigationRules)) + '">' + ogEscape(p.brand) + '</a>' : '')
    + '<h1 class="pdp__name">' + ogEscape(p.name || 'Produit') + '</h1>'
    + designerEl
    + '<div class="pdp__price">' + priceLabelS(p) + '</div>'
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
function sendTemplate(res, file) {
  // Template générique inchangé (pas de paramètre / introuvable / erreur). Jamais 500.
  // Passe par injectChrome → chrome SSR aussi sur les replis. Synchrone : si _chrome
  // n'est pas encore prêt (tout 1er hit post-cold-start), injectChrome renvoie le
  // HTML brut (repli = comportement actuel, hydraté client) — dégradation acceptée.
  try {
    res.set('Content-Type', 'text/html; charset=utf-8');
    const rel = path.relative(path.join(__dirname, 'v3'), file); // 'produit.html' / 'produits.html'
    return res.send(injectChrome(fs.readFileSync(file, 'utf8'), rel));
  } catch (e) {
    return res.sendFile(file);
  }
}
const sendProduitTemplate  = (res) => sendTemplate(res, PRODUIT_TEMPLATE);
const sendProduitsTemplate = (res) => sendTemplate(res, PRODUITS_TEMPLATE);
// Alias de collection VOLONTAIRES (pas des miss) → catalogue complet, jamais 404.
const COLLECTION_ALIASES = new Set(['all', 'frontpage']);
// ─── AGENT READINESS · négociation text/markdown + 404 lisibles par les agents ──
// Les agents IA (ChatGPT, Claude, Perplexity…) demandent souvent `Accept:
// text/markdown` (convention acceptmarkdown.com) et n'annoncent pas text/html.
// On leur sert alors une version markdown sobre de la page (titre, description,
// titres, paragraphes, liens absolus) ; les navigateurs, qui annoncent
// explicitement text/html, reçoivent l'HTML inchangé. `Vary: Accept` est
// OBLIGATOIRE dès qu'une URL varie selon Accept, sinon le CDN Vercel peut
// servir la variante HTML en cache à un agent (ou l'inverse). res.vary() AJOUTE
// la valeur (ne remplace pas le `Vary: Origin` posé par cors).
const AGENT_LINKS = `\n\n---\n\n- Sitemap : ${ORIGIN}/sitemap.xml\n- Guide agents : ${ORIGIN}/llms.txt\n`
  + `- Catalogue : ${ORIGIN}/produits.html\n- Marques : ${ORIGIN}/marques.html\n- Contact : ${ORIGIN}/contact.html\n`;
// Préférence EXPLICITE pour le markdown (q > text/html, ou text/html absent).
// `*/*` seul (curl, monitoring) reste sur l'HTML : on ne change rien pour eux.
const wantsMarkdown = (req) => req.accepts(['text/html', 'text/markdown']) === 'text/markdown';
// 404 : un navigateur annonce toujours text/html en clair ; un agent ou un
// outil envoie `*/*` (ou rien) → corps markdown court avec des liens de reprise.
const acceptsHtmlExplicitly = (req) => /text\/html/i.test(String(req.headers.accept || ''));
function sendMarkdown(res, md) {
  res.vary('Accept');
  res.set('Content-Type', 'text/markdown; charset=utf-8');
  return res.send(md);
}
const markdown404 = (reqPath) =>
  `# 404 — Page introuvable\n\nAucune page à l'adresse ${String(reqPath).replace(/[`\n\r]/g, '')} sur ${ORIGIN}.\n\n`
  + `Où chercher ensuite :${AGENT_LINKS}`;
// Conversion HTML → markdown sans dépendance : on part du <main> de la page
// AVANT injection du chrome (nav/pied/panier exclus), scripts/styles retirés,
// titres/listes/gras/liens convertis, entités décodées. Pas de rendu de nœuds
// imbriqués complexes : c'est un extrait fidèle, pas un rendu exhaustif.
function htmlToMarkdown(html, url) {
  const grp = (re) => { const m = html.match(re); return m ? m[1] : ''; };
  const dec = (s) => String(s || '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
  const title = dec(grp(/<title[^>]*>([\s\S]*?)<\/title>/i)).replace(/\s+/g, ' ').trim();
  const desc  = dec(grp(/<meta\s+name="description"\s+content="([^"]*)"/i)).trim();
  let body = grp(/<main[^>]*>([\s\S]*?)<\/main>/i) || grp(/<body[^>]*>([\s\S]*?)<\/body>/i) || html;
  body = body
    .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<img\b[^>]*\balt="([^"]*)"[^>]*>/gi, (_, a) => (a ? ` ${a} ` : ''))
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    // Titre sur UNE ligne : un <br> ou un retour dans le <h1> casserait l'en-tête markdown.
    .replace(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, h, t) => `\n\n${'#'.repeat(+h[1])} ${t.replace(/<br\s*\/?>|\s+/gi, ' ').trim()}\n\n`)
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, '_$2_')
    .replace(/<a\b[^>]*\bhref="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, t) => {
      const label = t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      return label ? `[${label}](${absUrl(href)})` : '';
    })
    .replace(/<\/(p|div|section|article|header|footer|ul|ol|tr|blockquote|figure|figcaption)>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ');
  body = dec(body).replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return `# ${title || 'Mikado Deco'}\n\n${desc ? '> ' + desc + '\n\n' : ''}Source : ${url}\n\n${body}${AGENT_LINKS}`;
}

// Soft-404 → vraie 404 : produit/collection/designer inexistant renvoie le shell avec
// <meta robots noindex> + statut 404 (fini l'indexation Google de pages mortes/dupliquées).
// Agents (pas de text/html annoncé) : corps markdown court au lieu du shell HTML.
function send404Shell(res, file) {
  res.status(404);
  res.vary('Accept');
  res.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  if (res.req && !acceptsHtmlExplicitly(res.req)) return sendMarkdown(res, markdown404(res.req.path));
  res.set('Content-Type', 'text/html; charset=utf-8');
  try {
    const rel = path.relative(path.join(__dirname, 'v3'), file);
    const raw = fs.readFileSync(file, 'utf8').replace('</head>', '  <meta name="robots" content="noindex,follow" />\n</head>');
    return res.send(injectChrome(raw, rel));
  } catch (e) { return res.status(404).send('Not found'); }
}
function ogCache(res) {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
}
// designers-data.json mis en cache module — on ne mémorise QUE le succès non
// vide : un échec de lecture transitoire (cold start, bundle partiel) renvoie
// [] sans être figé, et la lecture suivante réessaie (≠ d'un [] collant).
let _designers = null;
function getDesigners() {
  if (_designers) return _designers;
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'v3', 'designers-data.json'), 'utf8'));
    const arr = Array.isArray(data) ? data : (data.designers || []);
    if (arr.length) _designers = arr;
    return arr;
  } catch (e) {
    return [];
  }
}
// ─── SEO · 301 /products/<handle> → /produit.html?handle=<handle> ─────────────
// Les pages de l'online store Shopify (shop.mikadodeco.be) canonisent vers le domaine
// primaire en gardant LEUR structure d'URL Shopify : www.mikadodeco.be/products/<handle>.
// Or ce site headless sert les fiches sur /produit.html?handle=<handle> → sans cette
// redirection, la canonique tombe sur un 404 = cul-de-sac SEO (le shop est noindex ET sa
// cible canonique est morte). On redirige en UN SEUL saut vers la vraie fiche, handle
// préservé. Un handle inexistant → 301 → /produit.html qui renvoie un VRAI 404
// (send404Shell), donc pas de soft-404. Redirect RELATIF (fonctionne sur www + Preview).
// Placé AVANT le catch-all app.get(/.*/). Les collections Shopify canonisent déjà vers
// /collections/<handle> qui EXISTE ici (route ci-dessous) → rien à faire pour elles.
app.get('/products/:handle', async (req, res) => {
  await _navigationReady;
  const handle = String(req.params.handle || '');
  res.redirect(301, navigation.productHref({ handle }, navigation.sourceSelection(new URL(req.originalUrl, ORIGIN)), req.query.variant) || '/produits.html');
});

// ─── Fiche produit : /produit.html?handle=<handle> (B7) ─
app.get('/produit.html', async (req, res) => {
  const handle = req.query.handle;
  if (!handle && req.query.id) {
    await _navigationReady;
    const id = String(req.query.id).match(/^(?:gid:\/\/shopify\/Product\/)?([0-9]+)$/)?.[1];
    if (!id) return send404Shell(res, PRODUIT_TEMPLATE);
    try {
      const data = await cached('product-handle:' + id, () => shopifyFetch(
        'query ProductHandle($id: ID!) { node(id: $id) { ... on Product { handle } } }',
        { id: 'gid://shopify/Product/' + id }
      ));
      if (!data.node?.handle) return send404Shell(res, PRODUIT_TEMPLATE);
      return res.redirect(301, navigation.productHref({ handle: data.node.handle }, navigation.sourceSelection(new URL(req.originalUrl, ORIGIN)), req.query.variant));
    } catch (error) { return temporaryUnavailable(res).send('Cette fiche est momentanément indisponible. Veuillez réessayer.'); }
  }
  if (!handle) return sendProduitTemplate(res);
  try {
    await Promise.all([_chromeReady, _navigationReady]);
    const product = await getProductByHandle(handle);
    // Miss stable (produit inexistant/dépublié) : on cache aussi le repli pour
    // ne pas ré-invoquer la fonction à chaque bot. (Les erreurs Shopify partent
    // dans le catch ci-dessous, sans cache.)
    if (!product) { return send404Shell(res, PRODUIT_TEMPLATE); }

    const name     = product.name || 'Produit';
    const brand    = product.brand || '';
    const designer = product.designer || '';
    const title = product.seoTitle || `${name} · Mikado Deco`;
    const description = ogDesc(product.seoDescription || product.description ||
      `${name}${brand ? ' — ' + brand : ''}. `
      + (designer ? `Dessiné par ${designer}. ` : '')
      + 'Pièce design à voir en boutique à Uccle, livraison en Belgique.');
    // Première image produit NON redimensionnée (firstImageRaw), en absolu, en
    // ajoutant &width=1200 → JPEG (pas de format=webp : meilleur support og:image
    // par les scrapers sociaux). images[] est désormais en webp pour la galerie,
    // donc on ne le réutilise plus ici. Repli og-default.
    const raw = product.firstImageRaw || '';
    const image = raw ? raw + (raw.includes('?') ? '&' : '?') + 'width=1200' : OG_DEFAULT;
    const url = ORIGIN + '/produit.html?handle=' + encodeURIComponent(handle);

    const html = renderWithOg(fs.readFileSync(PRODUIT_TEMPLATE, 'utf8'), { title, description, image, url });
    // SEO · Product JSON-LD en SSR (remplace l'IIFE JS de produit.html) — un seul
    // schéma, visible des crawlers sans exécution JS. Prix/dispo depuis le produit.
    const ld = {
      "@context": "https://schema.org", "@type": "Product", "name": name,
      ...(brand ? { brand: { "@type": "Brand", "name": brand } } : {}),
      // Description produit (texte brut Shopify). Échappement JSON assuré par
      // JSON.stringify (+ le remplacement `<`→< ci-dessous anti-</script>) ;
      // surtout PAS escapeHtml, qui corromprait le JSON avec des entités HTML.
      ...(product.description ? { description: product.description } : {}),
      ...(image ? { image } : {}),
      "itemCondition": "https://schema.org/NewCondition",
      "offers": {
        "@type": "Offer", "priceCurrency": "EUR",
        ...(product.priceMin != null ? { price: String(product.priceMin) } : {}),
        "availability": "https://schema.org/" + (product.inStock ? "InStock" : (product.available ? "BackOrder" : "OutOfStock")),
        "url": url
      }
    };
    const ldTag = `<script type="application/ld+json">` + JSON.stringify(ld).replace(/</g, '\\u003c') + `</script>`
      ;
    let out = html.replace('</head>', ldTag + '\n</head>');
    out = injectNavigation(out, navigation.productTrail(product, new URL(req.originalUrl, ORIGIN), navigationRules), url, navigation.sourceSelection(new URL(req.originalUrl, ORIGIN)));
    // SSR lot 1 · contenu produit (nom/prix/dispo) à la place du squelette → crawlable sans JS.
    out = out.replace(/<!--PDP-SSR-START-->[\s\S]*?<!--PDP-SSR-END-->/, () => pdpSsrBlock(product, new URL(req.originalUrl, ORIGIN)));
    // SSR chantier 5 · recos « Complétez avec » / « Vous aimerez aussi » crawlables
    // (maillage interne ; piloté par les métafields Search & Discovery — jamais hardcodé).
    const recoSsr = (list, grid, wrap) => {
      const cards = (list || []).map(plpCardSsr).filter(Boolean).join('');
      if (!cards) return;
      out = out.replace('<div class="pgrid" ' + grid + '></div>', () => '<div class="pgrid" ' + grid + '>' + cards + '</div>');
      out = out.replace('<section class="section" ' + wrap + ' style="display:none">', () => '<section class="section" ' + wrap + '>');
    };
    recoSsr(product.complementary, 'data-complementary', 'data-complementary-wrap');
    recoSsr(product.related, 'data-related', 'data-related-wrap');
    out = injectChrome(out, 'produit.html');     // ← non-hero → header solide
    ogCache(res);
    return res.send(out);
  } catch (err) {
    console.warn('[og-produit]', err.message);
    return sendProduitTemplate(temporaryUnavailable(res));
  }
});

// ─── Collection / marque : /collections/<handle> ───────
// Nom + description + image via getCollections() (caché). Image par priorité :
// bandeau de marque statique (BRAND_HEADERS) → image Shopify de la collection →
// og-default. Collection inconnue → template générique inchangé (jamais 500).
app.get('/collections/:handle', async (req, res) => {
  const handle = String(req.params.handle || '').toLowerCase();
  if (handle === 'chaises') return sendChairCatalog(req, res);
  if (COLLECTION_ALIASES.has(handle)) {
    await _navigationReady;
    return res.redirect(301, navigation.selectionURL(req.originalUrl) || '/produits.html');
  }
  const brand = typeof req.query.brand === 'string' ? req.query.brand.trim().toLowerCase() : '';
  // Page famille riche (Jardin/Outdoor…) : sert le template dédié + chrome SSR.
  if (FAMILLES_RICHES[handle] && !brand) {
    try {
      await Promise.all([_chromeReady, _navigationReady]);
      res.set('Content-Type', 'text/html; charset=utf-8');
      let html = fs.readFileSync(path.join(__dirname, 'v3', FAMILLES_RICHES[handle]), 'utf8');
      if (handle === 'sieges') {
        // Une fiche dépubliée ou en panne ne bloque pas la sélection restante.
        const results = await Promise.allSettled(seatingIcons.handles.map(getProductByHandle));
        const items = results.flatMap(result => result.status === 'fulfilled' && result.value ? [result.value] : []);
        html = renderSeatingPage(html, items, items.map(p => plpCardSsr(p, req.originalUrl)).filter(Boolean).join(''));
        if (results.some(result => result.status === 'rejected')) res.set('Cache-Control', 'no-store');
        else ogCache(res);
      }
      return res.send(injectChrome(listingNavigation(html, req), FAMILLES_RICHES[handle]));
    } catch (e) { /* repli sur le template générique ci-dessous */ }
  }
  if (Object.hasOwn(families, handle) && !brand) {
    await Promise.all([_chromeReady, _navigationReady]);
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : '';
    const featuredPromise = Promise.allSettled((families[handle].featured?.handles || []).map(getProductByHandle));
    let payload = null;
    let failed = false;
    try {
      payload = await getCollectionProducts(handle, FAMILY_PAGE_SIZE, cursor || null);
      failed = !payload;
    } catch (error) {
      failed = true;
      console.warn('[family-products]', handle, error.message);
    }
    const items = payload?.items || [];
    const featuredResults = await featuredPromise;
    const featuredItems = featuredResults.flatMap(result => result.status === 'fulfilled' && result.value && isTable(result.value) && !isOutdoor(result.value) ? [result.value] : []);
    let html = renderFamilyPage(fs.readFileSync(FAMILY_TEMPLATE, 'utf8'), handle, {
      items, pageInfo: payload?.pageInfo || {}, cursor, failed,
      cards: items.map(p => plpCardSsr(p, req.originalUrl)).filter(Boolean).join(''),
      featuredItems, featuredCards: featuredItems.map(p => plpCardSsr(p, req.originalUrl)).filter(Boolean).join(''),
    });
    html = listingNavigation(html, req);
    res.set('Content-Type', 'text/html; charset=utf-8');
    // Ne pas conserver une panne de Shopify dans le cache de la page.
    if (failed) temporaryUnavailable(res);
    else if (featuredResults.some(result => result.status === 'rejected')) res.set('Cache-Control', 'no-store');
    else ogCache(res);
    return res.send(injectChrome(html, 'family-page.html'));
  }
  try {
    await Promise.all([_chromeReady, _navigationReady]);
    const richFamilies = {
      sieges: { title: 'Assises', hero: '/images/familles/assises/hero.webp' },
      outdoor: { title: 'Jardin', hero: '/images/familles/jardin/1.webp' },
    };
    const family = Object.hasOwn(families, handle) ? families[handle] : Object.hasOwn(richFamilies, handle) ? richFamilies[handle] : null;
    const col = family ? { name: family.title, description: family.description } : (await getCollections()).find(c => c.handle === handle);
    // Miss stable (handle hors catalogue, ex. /collections/all) : repli cachable.
    if (!col) return send404Shell(res, PRODUITS_TEMPLATE);

    const tag = typeof req.query.tag === 'string' ? req.query.tag : null;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null;
    let cp = null, failed = false;
    try { cp = await collectionProductsFor(handle, 24, cursor, tag, brand); }
    catch (error) { failed = true; console.warn('[collection-selection]', error.message); }
    const brandLabel = cp?.brand?.name || brandName(brand);
    const brandPhoto = family?.brands?.find(item => item.slug === brand);
    // Le bandeau Luminaires montre déjà une scène Artek large, adaptée à ce format.
    const useFamilyPhoto = handle === 'luminaires' && brand === 'artek';
    const legacyPhotos = {
      sieges: { 'carl-hansen-son': 'assises/brand-carlhansen', artek: 'assises/brand-artek', vitra: 'assises/brand-vitra', hay: 'assises/brand-hay' },
      outdoor: { fermob: 'jardin/20', hay: 'jardin/21', fatboy: 'jardin/22', tradition: 'jardin/23' },
    };
    const legacyBrandPhoto = Object.hasOwn(legacyPhotos, handle) && Object.hasOwn(legacyPhotos[handle], brand) ? legacyPhotos[handle][brand] : null;
    const familyImage = family ? imageAtWidth((useFamilyPhoto ? family.hero : brandPhoto?.image) || (legacyBrandPhoto ? '/images/familles/' + legacyBrandPhoto + '.webp' : family.hero), 2000) : null;
    const collectionHero = family ? {
      brand: false, editorial: true, img: familyImage, srcset: familyImage,
      alt: brandPhoto || legacyBrandPhoto ? family.title + ' · ' + brandLabel : family.heroAlt || family.title,
      style: photoStyle(!useFamilyPhoto && brandPhoto ? { position: brandPhoto.heroPosition || brandPhoto.position, mobilePosition: brandPhoto.mobilePosition } : legacyBrandPhoto ? {} : { position: family.heroPosition, mobilePosition: family.heroMobilePosition }),
    } : getCollectionHero(handle);
    const collectionName = navigationRules.collections[handle]?.label || col.name || 'Catalogue';
    const name = collectionName + (brand ? ' · ' + brandLabel : '');
    const title = `${name} · Mikado Deco`;
    const description = ogDesc(
      brand ? `Les créations ${brandLabel} de notre sélection « ${collectionName} ».` : col.description && col.description.trim()
        ? col.description
        : `${name} chez Mikado Deco — sélection design. Retrait à Uccle, livraison en Belgique.`
    );
    const image = collectionHero ? absUrl(collectionHero.img) : BRAND_HEADERS.has(handle)
      ? `${ORIGIN}/images/brands/headers/${handle}-1920.jpg`
      : (col.image ? absUrl(col.image) : OG_DEFAULT);
    const collectionUrl = '/collections/' + encodeURIComponent(handle);
    const url = ORIGIN + collectionUrl + (brand ? '?brand=' + encodeURIComponent(brand) : '');

    let html = renderWithOg(fs.readFileSync(PRODUITS_TEMPLATE, 'utf8'), { title, description, image, url });
    html = injectCollectionHero(html, collectionHero);
    html = listingNavigation(html, req, { title: collectionName, brandName: brandLabel });
    if (brand) {
      const context = { handle, collectionName, brand: { slug: brand, name: brandLabel }, title: name, description };
      html = html.replace('id="collection-context-initial">null</script>', () => 'id="collection-context-initial">' + JSON.stringify(context).replace(/</g, '\\u003c') + '</script>');

    }
    // SSR lot 2 · H1 + sous-titre = nom/description de la collection (crawlable sans JS ;
    // le script inline vide ces génériques pour les users → zéro régression de flash).
    html = html.replace('<h1 data-plp-title>Le catalogue</h1>', () => '<h1 data-plp-title' + (brand ? ' data-context' : '') + '>' + ogEscape(name) + '</h1>');
    html = html.replace('<p data-plp-sub>Mobilier de design, choisi pièce par pièce.</p>', () => '<p data-plp-sub>' + ogEscape(description) + '</p>');
    // SSR chantier 3 · grille de la collection (catégorie OU marque = collection Shopify) crawlable.
    try {
      if (!cp) throw new Error('Collection unavailable');
      const gi = (cp && cp.items) || [];
      if (gi.length && canRenderInitialGrid(req)) {
        const cards = gi.map(product => plpCardSsr(product, req.originalUrl)).filter(Boolean).join('');
        html = html.replace('<div class="pgrid" data-grid></div>', () => '<div class="pgrid" data-grid data-ssr="1">' + cards + '</div>');
      }
      if (brand) {
        if (!gi.length) html = html.replace('<div class="pgrid" data-grid></div>', () => `<div class="pgrid" data-grid data-ssr="1"><p class="plp-empty">Aucun produit pour cette marque dans cette catégorie. <a href="${collectionUrl}">Revenir à ${ogEscape(collectionName)}</a>.</p></div>`);
      }
      html = listingPagination(html, req, cp.pageInfo);
      // Une collection vide reste accessible au client, mais hors de l’index.
      // Une panne ne doit jamais déclencher ce signal : elle passe en 503.
      if (!gi.length && !cursor && !brand && !tag && col.hasProducts === false) {
        res.set('X-Robots-Tag', 'noindex, follow');
        html = html.replace('</head>', '<meta name="robots" content="noindex,follow" />\n</head>');
      }
    } catch (e) {
      failed = true;
      html = html.replace('<div class="pgrid" data-grid></div>', '<div class="pgrid" data-grid><p class="plp-empty">Impossible de charger cette sélection. Veuillez réessayer.</p></div>');
      console.warn('[coll-grid-ssr]', e.message);
    }
    html = injectChrome(html, 'produits.html', Boolean(collectionHero));
    if (failed) temporaryUnavailable(res);
    else ogCache(res);
    return res.send(html);
  } catch (err) {
    console.warn('[og-collection]', err.message);
    return sendProduitsTemplate(temporaryUnavailable(res));
  }
});

// ─── Créateur : /produits.html?designer=<slug> ─────────
// Nom + bio + portrait via designers-data.json (caché). Sans ?designer (ou
// modes catalogue / ?cats= / ?brand=) → template générique. Designer inconnu →
// template générique. ~29 créateurs sans photo → repli og-default.
app.get('/produits.html', async (req, res) => {
  if (typeof req.query.q === 'string' && req.query.q.trim() && Object.keys(req.query).every(key => ['q','omit','page','sort'].includes(key))) return sendSearchPage(req,res);
  if (typeof req.query.coll === 'string' && /^[a-z0-9-]+$/.test(req.query.coll) && req.query.coll !== 'all') {
    const query = new URLSearchParams(Object.entries(req.query).filter(([key, value]) => key !== 'coll' && typeof value === 'string'));
    return res.redirect(302, '/collections/' + req.query.coll + (query.size ? '?' + query : ''));
  }
  const slug = req.query.designer ? String(req.query.designer).toLowerCase() : '';
  if (!slug) {
    // Catalogue de base (lot 4) : SSR de la 1re page de grille (24 produits) → liens
    // produit crawlables dans le HTML (maillage interne + découverte, complète le sitemap).
    // Le module remplace ensuite la grille (garde data-ssr côté produits.html) : 0 doublon/flash.
    const brand = typeof req.query.brand === 'string' ? req.query.brand.trim().toLowerCase() : '';
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    let html = fs.readFileSync(PRODUITS_TEMPLATE, 'utf8');
    const landingRequest = isCatalogLanding(req.query);
    // Quatre choix explicites chargés en parallèle de la grille. Une fiche
    // indisponible n'est jamais remplacée par une meilleure vente arbitraire.
    const iconsPromise = Promise.allSettled((landingRequest ? catalogLanding.icons.handles : []).map(getProductByHandle));
    let failed = false, gridFailed = false, brandItems = [], pageInfo = {};
    try {
      await Promise.all([_chromeReady, _navigationReady]);
      const page = await getProductsPage(24, req.query.cursor || null, req.query.tag ? [req.query.tag] : null, req.query.cats, brand, q);
      const { items } = page;
      pageInfo = page.pageInfo;
      brandItems = items;
      if (items && items.length && canRenderInitialGrid(req)) {
        const cards = items.map(product => plpCardSsr(product, req.originalUrl)).filter(Boolean).join('');
        html = html.replace('<div class="pgrid" data-grid></div>', () => '<div class="pgrid" data-grid data-ssr="1">' + cards + '</div>');
      } else if (brand) {
        html = html.replace('<div class="pgrid" data-grid></div>', '<div class="pgrid" data-grid data-ssr="1"><p class="plp-empty">Aucun produit pour cette sélection.</p></div>');
      }
    } catch (e) {
      failed = true;
      gridFailed = true;
      html = html.replace('<div class="pgrid" data-grid></div>', '<div class="pgrid" data-grid><p class="plp-empty">Impossible de charger cette sélection. Veuillez réessayer.</p></div>');
      console.warn('[plp-ssr]', e.message);
    }
    if (landingRequest) {
      const results = await iconsPromise;
      const iconItems = results.flatMap(result => result.status === 'fulfilled' && result.value ? [result.value] : []);
      if (results.some(result => result.status === 'rejected')) failed = true;
      html = renderCatalogLanding(html, {
        iconItems, iconCards: iconItems.map(p => plpCardSsr(p, req.originalUrl)).filter(Boolean).join(''),
        discoveryHidden: Boolean(req.query.cats || req.query.tag || Number(req.query.page) > 1),
        continuation: Number.parseInt(req.query.page, 10) > 1,
      });
      html = renderWithOg(html, {
        title: 'Mobilier & objets de design · Mikado Deco', description: catalogLanding.description,
        image: catalogLanding.hero.image, url: ORIGIN + '/produits.html',
      });
    }
    if (brand) {
      const name = brandName(brand, brandItems.map(product => ({ name: product.brand })));
      const title = q ? `Résultats pour « ${q} » · ${name}` : name;
      const description = `Toutes les pièces ${name} de notre catalogue.`;
      const url = ORIGIN + '/produits.html?' + new URLSearchParams(Object.entries(req.query).filter(([, value]) => typeof value === 'string'));
      html = renderWithOg(html, { title: title + ' · Mikado Deco', description, image: OG_DEFAULT, url });
      html = html.replace('id="collection-context-initial">null</script>', () => 'id="collection-context-initial">' + JSON.stringify({ brand: { slug: brand, name } }).replace(/</g, '\\u003c') + '</script>');
      html = html.replace('<h1 data-plp-title>Le catalogue</h1>', () => '<h1 data-plp-title data-context>' + ogEscape(title) + '</h1>');
      html = html.replace('<p data-plp-sub>Mobilier de design, choisi pièce par pièce.</p>', () => '<p data-plp-sub>' + ogEscape(description) + '</p>');
    }
    html = listingPagination(html, req, pageInfo);
    if (gridFailed) temporaryUnavailable(res);
    else if (failed) res.set('Cache-Control', 'no-store');
    else ogCache(res);
    html = listingNavigation(html, req, { brandName: brandItems.find(p => navigation.navigationSlug(p.brand) === brand)?.brand || brandName(brand) });
    return res.send(injectChrome(html, 'produits.html'));
  }
  try {
    await Promise.all([_chromeReady, _navigationReady]);
    const designer = getDesigners().find((d) => String(d.slug || '').toLowerCase() === slug && !d.hidden);
    // Miss stable (slug inconnu) : repli cachable.
    if (!designer) { return send404Shell(res, PRODUITS_TEMPLATE); }

    const name = designer.name || 'Créateur';
    const title = `${name} · Mikado Deco`;
    const description = ogDesc(
      designer.bio && designer.bio.trim()
        ? designer.bio
        : `Les pièces signées ${name} chez Mikado Deco. Retrait à Uccle, livraison en Belgique.`
    );
    const image = designer.photo ? absUrl(designer.photo) : OG_DEFAULT;
    const url = ORIGIN + '/produits.html?designer=' + encodeURIComponent(designer.slug || slug);

    let html = renderWithOg(fs.readFileSync(PRODUITS_TEMPLATE, 'utf8'), { title, description, image, url });
    html = listingNavigation(html, req);
    // SSR lot 3 · classe créateur (masque le subhero « Le catalogue » → un seul H1) +
    // hero nom/bio/portrait injecté (crawlable sans JS ; le module le remplace ensuite).
    html = html.replace('<html lang="fr">', '<html lang="fr" class="plp-designer">');
    html = html.replace('<div class="wrap" data-designer-hero></div>', () => '<div class="wrap" data-designer-hero>' + designerHeroSsr(designer) + '</div>');
    // SSR chantier 3 · grille des pièces du créateur (tags designer) crawlable.
    try {
      const dp = await getProductsPage(24, req.query.cursor || null, designer.tags || [], null, req.query.brand || null, req.query.q || null);
      const gi = (dp && dp.items) || [];
      if (gi.length && canRenderInitialGrid(req)) {
        const cards = gi.map(p => plpCardSsr(p, req.originalUrl)).filter(Boolean).join('');
        html = html.replace('<div class="pgrid" data-grid></div>', () => '<div class="pgrid" data-grid data-ssr="1">' + cards + '</div>');
      }
      html = listingPagination(html, req, dp.pageInfo);
    } catch (e) {
      console.warn('[designer-grid-ssr]', e.message);
      return sendProduitsTemplate(temporaryUnavailable(res));
    }
    html = injectChrome(html, 'produits.html');
    ogCache(res);
    return res.send(html);
  } catch (err) {
    console.warn('[og-designer]', err.message);
    return sendProduitsTemplate(temporaryUnavailable(res));
  }
});

// ─── SEO: sitemap = INDEX instantané → pages (statique) + produits (walk) ──
// /sitemap.xml était UN fichier généré par un walk paginé de tout le catalogue
// Shopify (~3 300 URLs). À froid (cache serverless vide) ce walk dépasse le
// budget de la fonction → connexion coupée (curl : http=000), et crawlers/agents
// concluent « pas de sitemap ». On sert désormais un sitemapindex qui répond
// immédiatement et pointe vers deux sitemaps : les pages (statique, avec
// lastmod) et les produits/collections (walk caché 6 h). Aucune URL perdue ;
// les 3 chemins sont routés vers la fonction dans vercel.json.
const SM_ESC = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Une date de démarrage serveur ne constitue pas une date de modification.
const SM_STATIC = [
  ['/', '1.0'], ['/produits.html', '0.9'], ['/marques.html', '0.8'],
  ['/designers.html', '0.7'], ['/materiaux.html', '0.7'], ['/selection.html', '0.6'],
  ['/studio.html', '0.6'], ['/rendez-vous.html', '0.7'], ['/contact.html', '0.6'],
  ['/journal.html', '0.6'], ['/nuancier-fermob.html', '0.6'],
  ['/mentions-legales.html', '0.3'], ['/conditions-generales-de-vente.html', '0.3'],
  ['/politique-et-vie-privee.html', '0.3'], ['/politique-cookies.html', '0.3'],
];
const smUrl = (loc, priority, lastmod) =>
  `  <url><loc>${SM_ESC(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<priority>${priority}</priority></url>`;
const smUrlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?>\n`
  + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` + urls.join('\n') + `\n</urlset>\n`;
function sendXml(res, xml) {
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.set('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
  return res.send(xml);
}

app.get('/sitemap.xml', (req, res) => sendXml(res,
  `<?xml version="1.0" encoding="UTF-8"?>\n`
  + `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + `  <sitemap><loc>${ORIGIN}/sitemap-pages.xml</loc></sitemap>\n`
  + `  <sitemap><loc>${ORIGIN}/sitemap-products.xml</loc></sitemap>\n`
  + `</sitemapindex>\n`));

// Pages statiques + créateurs indexables + articles : aucun appel Shopify → instantané.
app.get('/sitemap-pages.xml', (req, res) => {
  const urls = [];
  SM_STATIC.forEach(([p, pr]) => urls.push(smUrl(ORIGIN + p, pr)));
  // Créateurs — uniquement les indexables (champ `hidden` dans designers-data.json)
  // pour éviter le thin content / les fiches masquées.
  getDesigners().forEach((d) => {
    if (d && d.slug && !d.hidden) urls.push(smUrl(ORIGIN + '/produits.html?designer=' + encodeURIComponent(d.slug), '0.5'));
  });
  // Articles du journal (HTML pré-rendus)
  try {
    fs.readdirSync(path.join(__dirname, 'v3', 'journal'))
      .filter((f) => f.endsWith('.html'))
      .forEach((f) => urls.push(smUrl(ORIGIN + '/journal/' + f, '0.5')));
  } catch (e) { /* dossier absent du bundle → includeFiles v3/journal/** */ }
  return sendXml(res, smUrlset(urls));
});

// Le sitemap ne lit que les handles : les champs de carte et les 250 variantes
// par produit rendent le parcours complet trop lent lors d'un démarrage à froid.


// Toutes les fiches visibles par le canal Storefront + collections.
// URLs canoniques (seulement ?handle=). Caché 6 h.
app.get('/sitemap-products.xml', async (req, res) => {
  try {
    const xml = await cached('sitemap:products', async () => {
      const urls = [];
      let after = null;
      for (let i = 0; i < 60; i++) { // garde-fou
        const { nodes, pageInfo } = (await shopifyFetch(SITEMAP_PRODUCTS_QUERY, { after })).products;
        (nodes || []).forEach((prod) => {
          if (prod.handle) urls.push(smUrl(ORIGIN + '/produit.html?handle=' + encodeURIComponent(prod.handle), '0.8'));
        });
        if (!pageInfo || !pageInfo.hasNextPage) break;
        if (i === 59) throw new Error('Catalogue trop grand pour le sitemap actuel');
        if (!pageInfo.endCursor) throw new Error('Curseur Shopify manquant pendant le parcours du sitemap');
        after = pageInfo.endCursor;
      }
      (await getCollections()).forEach((c) => {
        // Les familles éditoriales et les sélections composites ont leurs propres sources.
        const composed = Object.hasOwn(families, c.handle) || Object.hasOwn(FAMILLES_RICHES, c.handle) || ['chaises', 'tables-outdoor', 'promotions'].includes(c.handle);
        if (c.handle && (c.hasProducts !== false || composed)) urls.push(smUrl(ORIGIN + '/collections/' + encodeURIComponent(c.handle), '0.6'));
      });
      return smUrlset(urls);
    }, 6 * 60 * 60 * 1000); // cache 6 h
    return sendXml(res, xml);
  } catch (err) {
    console.warn('[sitemap-products]', err.message);
    return res.status(500).send('');
  }
});

// ─── SSR CHROME pour les pages HTML statiques ──────────
// Liste blanche des pages racine servies en statique aujourd'hui (hors 3 routes
// templatées et hors article.html = stub de redirection sans #site-header).
const SSR_PAGES = new Set([
  'index.html', 'marques.html', 'designers.html', 'studio.html',
  'materiaux.html', 'rendez-vous.html', 'contact.html', 'selection.html',
  'journal.html', 'nuancier-fermob.html', '404.html', 'mentions-legales.html',
  'conditions-generales-de-vente.html', 'politique-cookies.html',
  'politique-et-vie-privee.html',
]);
// Alias « pages de confiance » attendus par les agents IA (/about, /privacy) :
// servis en 200 (pas de saut de redirection) avec le contenu des pages
// existantes, qui portent leur propre <link rel="canonical"> → pas de doublon.
// Routés vers la fonction dans vercel.json.
const AGENT_ALIASES = { '/about': 'studio.html', '/privacy': 'politique-et-vie-privee.html' };
function resolveSsrRel(p) {
  if (AGENT_ALIASES[p]) return AGENT_ALIASES[p];
  if (p === '/') return 'index.html';
  if (p.endsWith('.html')) {
    const rel = p.slice(1);
    if (SSR_PAGES.has(rel)) return rel;
    if (/^journal\/[^/]+\.html$/.test(rel)) return rel;  // articles du journal
  }
  return null;
}
// APRÈS les 3 routes templatées + le sitemap, AVANT express.static. Ne capte que
// SSR_PAGES + articles journal ; tout le reste passe à next() (static/api).
// SEO/SSR · Index MARQUES crawlable : rend les vraies cartes marque (lien + logo + nom)
// dans [data-brandgrid] à la place des squelettes. Données getActiveBrands + liens curés
// de mega-menu-brands.json. Le module re-render ensuite (grid.innerHTML) → hydratation.
async function injectBrandsIndex(html) {
  const active = await getActiveBrands();
  let curated = { brands: [] };
  try { curated = JSON.parse(fs.readFileSync(path.join(__dirname, 'v3', 'mega-menu-brands.json'), 'utf8')); } catch (e) {}
  const hrefByName = {};
  for (const b of (curated.brands || [])) if (b.name && b.href) hrefByName[b.name.toLowerCase()] = b.href;
  const brands = (active || []).slice().sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  if (!brands.length) return html;
  const cards = brands.map((b) => {
    const slug = b.slug || slugifyS(b.name);
    const safe = ogEscape(b.name);
    const href = hrefByName[b.name.toLowerCase()] || ('/produits.html?brand=' + slug);
    return '<a class="brandcard" href="' + href + '">'
      + '<span class="brandcard__origin">Europe</span>'
      + '<div><img class="brandcard__logo" src="/images/brands/' + slug + '.svg" alt="' + safe + '" loading="lazy" onerror="this.outerHTML=\'<span class=&quot;brandcard__name&quot;>' + safe + '</span>\'" /></div>'
      + '</a>';
  }).join('');
  // Bloc squelette exact (4 lignes) → on remplace juste le contenu, on garde </div>.
  const skelBlock = '<div class="brandgrid" data-brandgrid>\n'
    + Array(4).fill('      <div class="brandcard"><div class="pcard__skel" style="aspect-ratio:1/1"></div></div>').join('\n');
  html = html.replace(skelBlock, () => '<div class="brandgrid" data-brandgrid>\n      ' + cards);
  html = html.replace('<span class="plp-count" data-brand-count></span>', () => '<span class="plp-count" data-brand-count>' + brands.length + ' marques</span>');
  return html;
}

// SEO/SSR · Index DESIGNERS crawlable : featured + annuaire A-Z (noms + liens ?designer=).
// Miroir du render de designers.html. Le module re-render ensuite → hydratation.
function injectDesignersIndex(html) {
  const esc = ogEscape;
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const FOLD = { 'Ø':'O','Œ':'O','Æ':'A','Å':'A','Ł':'L','Đ':'D','Þ':'T','ẞ':'S' };
  const bucketOf = (d) => {
    let ch = (d.sortKey || d.name || '').trim().charAt(0).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    ch = FOLD[ch] || ch;
    return /[A-Z]/.test(ch) ? ch : '#';
  };
  const brandsHTML = (d) => (d.brands || []).map((b, i) => {
    const href = d.brandHrefs && d.brandHrefs[i];
    return href ? '<a href="' + esc(href) + '">' + esc(b) + '</a>' : '<span>' + esc(b) + '</span>';
  }).join('<span class="designer-card__brand-sep" aria-hidden="true"> · </span>');
  const photoHTML = (d) => d.photo
    ? '<picture><source type="image/webp" srcset="' + esc(String(d.photo).replace(/\.jpg$/, '-640.webp')) + '" /><img class="designer-card__photo" src="' + esc(d.photo) + '" width="640" height="800" alt="' + esc(d.name) + '" loading="lazy" /></picture>'
    : '<div class="designer-card__photo" aria-hidden="true"></div>';
  const featuredCardHTML = (d) => '<article class="designer-card designer-card--lg" id="' + esc(d.slug) + '">'
    + photoHTML(d) + '<h3 class="designer-card__name">' + esc(d.name) + '</h3>'
    + '<div class="designer-card__brands">' + brandsHTML(d) + '</div>'
    + '<a class="designer-card__link" href="/produits.html?designer=' + encodeURIComponent(d.slug) + '" aria-label="Voir les produits de ' + esc(d.name) + '"></a></article>';

  const all = getDesigners().filter((d) => !d.hidden);
  all.sort((a, b) => (a.sortKey || a.name).localeCompare(b.sortKey || b.name, 'fr', { sensitivity: 'base' }));
  if (!all.length) return html;
  const featured = all.filter((d) => d.featured);
  const featuredSlugs = new Set(featured.map((d) => d.slug));
  const featHtml = featured.map(featuredCardHTML).join('');

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
      return '<li class="az-name"' + id + '><a href="/produits.html?designer=' + encodeURIComponent(d.slug) + '">' + esc(d.sortKey || d.name) + '</a></li>';
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
function injectHomeRails(html, items) {
  const render = (arr) => arr.map(plpCardSsr).filter(Boolean).join('');
  const r1 = render(items.slice(0, 4)), r2 = render(items.slice(4, 8));
  if (r1) html = html.replace(
    '<div class="prow prow--4" data-products data-count="4" data-sort="new">\n      ' + HOME_SKEL,
    () => '<div class="prow prow--4" data-products data-count="4" data-sort="new">\n      ' + r1);
  if (r2) html = html.replace(
    '<div class="prow prow--4" data-products data-count="4">\n      ' + HOME_SKEL,
    () => '<div class="prow prow--4" data-products data-count="4">\n      ' + r2);
  return html;
}

// Les anciens liens du répertoire par famille reviennent à la famille.
// Le clic sur une carte marque mène directement au catalogue à deux filtres.
app.get('/marques.html', (req, res, next) => {
  if (!Object.hasOwn(req.query, 'collection')) return next();
  const handle = req.query.collection;
  return res.redirect(302, typeof handle === 'string' && /^[a-z0-9-]+$/.test(handle)
    ? '/collections/' + handle : '/marques.html');
});

app.get(/.*/, async (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/_vercel/')) return next();
  const rel = resolveSsrRel(req.path);
  if (!rel) return next();                              // pas une page SSR → static/api gèrent
  const root = path.join(__dirname, 'v3');
  const file = path.join(root, rel);
  if (!file.startsWith(root + path.sep)) return next(); // anti path-traversal
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); }
  catch { return next(); }                              // inexistant → 404 normal
  if (!/id="site-header"/.test(raw)) return next();     // page hors-shell → ne pas toucher
  await Promise.all([_chromeReady, _navigationReady]);
  // SSR des rails produits de l'accueil (liens crawlables + fin des squelettes au 1er paint).
  if (rel === 'index.html') {
    try {
      const { items } = await getProductsPage(24, null, null, null, null, null);
      raw = injectHomeRails(raw, (items || []).filter((p) => p.image));
    } catch (e) { console.warn('[home-rails]', e.message); }
  }
  if (rel === 'marques.html') {
    try { raw = await injectBrandsIndex(raw); } catch (e) { console.warn('[brands-index]', e.message); }
  }
  if (rel === 'designers.html') {
    try { raw = injectDesignersIndex(raw); } catch (e) { console.warn('[designers-index]', e.message); }
  }
  if (['marques.html', 'designers.html'].includes(rel)) raw = listingNavigation(raw, req);
  res.set('Cache-Control', 'public, max-age=0, must-revalidate');
  res.vary('Accept');
  // Agents demandant text/markdown : extrait markdown du contenu de page (AVANT
  // injectChrome → sans nav/pied/panier). Navigateurs : HTML inchangé.
  if (wantsMarkdown(req)) return sendMarkdown(res, htmlToMarkdown(raw, ORIGIN + req.path));
  res.set('Content-Type', 'text/html; charset=utf-8');
  return res.send(injectChrome(raw, rel));
});

app.use(express.static(path.join(__dirname, 'v3')));
app.use(cors({ origin: process.env.BASE_URL || `http://localhost:${PORT}` }));
// Capture le corps brut (req.rawBody) pour la vérification HMAC des webhooks
// Shopify (calculée sur le body brut, pas le JSON parsé). Comportement JSON
// identique pour tous les autres endpoints.
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));

// ─── RATE-LIMIT ANTI-ABUS (in-memory, best-effort par instance serverless) ──
// CAVEAT serverless : sur Vercel le store est par-instance et remis à zéro à
// chaque cold start ; plusieurs instances ne partagent pas le compteur. Stoppe
// le spam naïf (matraquage d'une instance chaude), pas une attaque distribuée.
// Version distribuée (Vercel KV / Upstash) = évolution ultérieure si besoin.
const formLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,           // 10 min
  max: 5,                             // 5 soumissions / IP / fenêtre (contact, newsletter)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});
const cartLimiter = rateLimit({
  windowMs: 60 * 1000,                // 1 min
  max: 30,                            // 30 calculs panier / IP / min (le front debounce déjà)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});

// ─── SHOPIFY: PRODUCTS QUERY ───────────────────────────
// Metafields must be enabled in Shopify admin → Settings → Custom data → Products
// Namespaces used: "custom" — keys: designer, year, material, dimensions, lead_time, subcategory
// Sélection de champs du node produit, factorisée en fragment pour être SOURCE
// UNIQUE : PRODUCTS_QUERY (catalogue/PLP/sitemap) ET SEARCH_QUERY (page ?q=)
// l'utilisent → mapProduct lit exactement les mêmes champs des deux côtés (aucun
// risque de carte incomplète sur la page de résultats). Toute évolution de carte
// se fait ICI, une seule fois.




const CHAIR_QUERY = chairQuery(PRODUCT_CARD_FIELDS);
async function sendSearchPage(req,res) {
  const [,view]=await Promise.all([_chromeReady,searchViewReady,_navigationReady]);let data;
  try {data=await getSearchPage(req.query);}
  catch(error) {console.warn('[search-page]',error.message);data={...searchCatalog([],req.query),error:true};res.status(503);}
  let html=renderSearchPage(fs.readFileSync(PRODUITS_TEMPLATE,'utf8'),data,view,plpCardSsr);
  html=renderWithOg(html,{title:'Votre recherche · Mikado Deco',description:'Trouvez votre pièce de design par finition, dimensions, capacité et budget.',url:ORIGIN+data.resultsUrl,image:OG_DEFAULT});
  html=html.replace('</head>','<meta name="robots" content="noindex,follow">\n</head>');
  return res.set('Cache-Control','no-store').send(injectChrome(html,'produits.html',true));
}
app.get('/api/search',async(req,res)=>{
  res.set('Cache-Control','no-store');
  if(typeof req.query.q!=='string'||!req.query.q.trim())return res.status(400).json({error:'Indiquez votre recherche.'});
  try {res.json(await getSearchPage(req.query));}
  catch(error){console.warn('[search-api]',error.message);res.status(503).json({error:'Recherche momentanément indisponible.'});}
});
let chairLoading = null;
async function getChairIndex() {
  return cached('chairs:index', async () => {
    if (!chairLoading) chairLoading = readChairCatalog(
      async after => (await shopifyFetch(CHAIR_QUERY, { after })).collection,
      node => {
        const card = mapProduct(node);
        card.variants.forEach(variant => { variant.image = shopifyResize(variant.image, CARD_IMAGE_WIDTH); });
        return card;
      },
      async (handle, after) => (await shopifyFetch(CHAIR_VARIANT_QUERY, { handle, after })).product?.variants,
    ).finally(() => { chairLoading = null; });
    return chairLoading;
  });
}
async function getChairPage(query) {
  const [{collection,products},{DISPLAY_PAGE_SIZE}] = await Promise.all([getChairIndex(),import('./v3/catalog-pagination.mjs')]);
  return {collection,...filterCatalog(products,query,DISPLAY_PAGE_SIZE)};
}
async function sendChairCatalog(req,res) {
  await Promise.all([_chromeReady,_navigationReady]);
  const view = await chairViewReady;
  let data;
  try { data = await getChairPage(req.query); }
  catch(error) {
    console.warn('[chair-catalog]',error.message);
    data = {...filterCatalog([],req.query),error:true};
  }
  const url = ORIGIN + view.chairURL(data.state);
  let html = fs.readFileSync(PRODUITS_TEMPLATE,'utf8');
  const photo = getCollectionHero('chaises');
  html = renderChairCatalog(html,data,view,plpCardSsr);
  html = injectCollectionHero(html,photo);
  html = renderWithOg(html,{title:'Chaises de design · Mikado Deco',description:'Trouvez votre chaise par marque, prix, couleur, matière et usage. Une sélection de design chez Mikado, à Uccle.',image:photo?.img || OG_DEFAULT,url});
  html = listingNavigation(html,req,{title:'Chaises',brandName:data.state.brand.length===1 ? data.facets.brand.find(b=>b.value===data.state.brand[0])?.label : ''});
  if (data.error) {
    html = html.replace(view.emptyChairs(),`<p class="plp-empty">Impossible de charger les chaises pour le moment. <a href="${ogEscape(req.originalUrl)}">Réessayer</a>.</p>`);
    res.status(503).set('Cache-Control','no-store');
  } else {
    const {state}=data;
    const filtered = state.q || state.brand.length>1 || state.color.length || state.material.length || state.usage.length || state.feature.length || state.stock || state.tag || state.sort!=='pop' || state.min!==null || state.max!==null || state.seat_min!==null || state.seat_max!==null;
    if(filtered) html = html.replace('</head>','<meta name="robots" content="noindex,follow">\n</head>');
    // Les informations de prix et de stock se renouvellent via le cache de données.
    res.set('Cache-Control','no-store');
  }
  return res.send(injectChrome(html,'produits.html',data.state.page===1));
}
app.get('/api/catalog/chaises',async (req,res)=>{
  try { res.set('Cache-Control','no-store').json(await getChairPage(req.query)); }
  catch(error) { console.warn('[chair-api]',error.message);res.status(503).json({error:'Les chaises ne peuvent pas être chargées. Réessayez.'}); }
});

// ─── SHOPIFY: SEARCH QUERY (page « tous les résultats » /produits.html?q=) ──
// Recherche plein-texte NATIVE Shopify (tolérante aux fautes, préfixe sur le
// dernier mot). Réutilise EXACTEMENT le fragment ProductCardFields → mapProduct
// lit les mêmes champs que pour le catalogue. `search.pageInfo.endCursor` est un
// vrai curseur Shopify → repassé tel quel en ?cursor= par le front (transparent).


// Filet de sécurité de la page ?q= : `search` (plein-texte) est parfois MOINS
// tolérant aux fautes que `predictiveSearch` (ex. transposition « fermbo » →
// « fermob » : l'overlay matche, `search` renvoie 0). Quand `search` rend une 1re
// page VIDE, on récupère par ID EXACT (nodes) les produits que l'overlay a su
// matcher → la page de résultats n'est jamais « Aucun résultat » sur une faute que
// l'overlay a corrigée (cohérence overlay ↔ page). Réutilise ProductCardFields
// → cartes complètes. (PREDICTIVE_QUERY est défini plus bas, avec la route.)


// Boutique-de-quartier delivery promise: a single, honest baseline applies
// to anything that has to be ordered from a supplier (which is most of the
// catalog). Items physically in stock at the boutique are flagged via the
// Shopify inventory and shipped fast. Anything genuinely outside this
// promise (Fermob peak season, Kriptonite, Charolles, Treku, etc.) gets a
// `delai-long` product tag in Shopify → we fall back to a generic
// "délai sur demande" line and confirm by mail/phone after the order.
// Legacy: returns up to 250 products as a flat array. Kept untouched
// because home/selection/produit pages + getBrands/getPromos all read
// this shape directly. The new paginated mode lives in getProductsPage.
async function getProducts() {
  return cached('products', async () => {
    const data = await shopifyFetch(PRODUCTS_QUERY, { first: 250, after: null, query: null });
    return data.products.edges.map(({ node }) => mapProduct(node));
  });
}

// Paginated catalog used by the PLP. Cached per (first, after, tags)
// so each "Voir plus" click is sub-5ms after the first warm-up.
// `tags` (comma-separated) becomes a Shopify GraphQL query string
// `tag:foo OR tag:bar OR ...` — used by /produits.html?designer=<slug>
// to filter on a list of historical tag variants.
// Category panel (/produits.html) — handle → Shopify query clause, hardcoded
// from chantiers/filtrage-catalogue/data/category-filters.json (36 categories,
// alphabetical). `cats` (comma-separated handles) becomes the OR of the
// clauses below — same mechanism as `tags`. Unknown handles are ignored.
const CATEGORY_FILTERS = {
  'accessoires-jardin': '(product_type:"Arrosoir" OR product_type:"Mangeoire à oiseaux")',
  'appliques': '(product_type:"Applique")',
  'bains-de-soleil-transats': '(product_type:"Bain de soleil" OR product_type:"Transat" OR product_type:"Hamac")',
  'bougeoirs-bougies-photophores': '(product_type:"Bougeoir" OR product_type:"Bougie" OR product_type:"Bougie parfumée" OR product_type:"Photophore" OR product_type:"Chandelier" OR product_type:"Petite bougie parfumée")',
  'brasero-barbecue': '(product_type:"Brasero" OR product_type:"Barbecue" OR product_type:"Gril" OR product_type:"Accessoires de grill extérieur")',
  'bureaux': '(product_type:"Bureau")',
  'cache-pots-jardinieres': '(product_type:"Cache-pot" OR product_type:"Cache-pot grand" OR product_type:"Cache-pot moyen" OR product_type:"Cache-pot petit" OR product_type:"Cache-pot stoneware" OR product_type:"Jardinière")',
  'canapes': '(product_type:"Canapé" OR product_type:"Banquette")',
  'chaises': '(product_type:"Chaise" OR product_type:"Chaise de bar" OR product_type:"Chaise enfant" OR product_type:"Chaise haute")',
  'chaises-longues': '(product_type:"Chaise longue" OR product_type:"Bain de soleil" OR product_type:"Transat")',
  'commodes-et-buffets': '(product_type:"Commode" OR product_type:"Buffet")',
  'coussins-plaids-tapis': '(product_type:"Coussin" OR product_type:"Tapis" OR product_type:"Couvre-lit" OR product_type:"Plaid")',
  'couverts': '(product_type:"Couverts" OR product_type:"Couteau" OR product_type:"Couteau de table" OR product_type:"Fourchette" OR product_type:"Fourchette de table" OR product_type:"Cuiller" OR product_type:"Cuiller de table" OR product_type:"Cuillère" OR product_type:"Cuillère de service" OR product_type:"Cuillère de table")',
  'dessertes-et-chariots': '(product_type:"Desserte" OR product_type:"Chariot")',
  'etageres-et-bibliotheques': '(vendor:"String Furniture" OR product_type:"Étagère" OR product_type:"Etagère" OR product_type:"Bibliothèque")',
  'fauteuils': '(product_type:"Fauteuil")',
  'lampadaires': '(product_type:"Lampadaire")',
  'lampes-de-bureau': '(product_type:"Lampe de bureau" OR product_type:"Lampe à pince")',
  'lampes-de-table': '(product_type:"Lampe" OR product_type:"Lampe de table" OR product_type:"Lampe de chevet")',
  'lampes-nomades': '(product_type:"Lampe baladeuse")',
  'miroirs': '(product_type:"Miroir" OR product_type:"Miroir cosmétique" OR product_type:"Miroir cosmétique LED" OR product_type:"Miroir cosmétique LED mural")',
  'mugs-tasses-cafe': '(product_type:"Mug" OR product_type:"Mug à café" OR product_type:"Mug à cappuccino" OR product_type:"Mug à latte" OR product_type:"Mug à thé" OR product_type:"Tasse" OR product_type:"Cafétière" OR product_type:"Cafétière espresso")',
  'objets-decoratifs-cadres': '(product_type:"Cadre" OR product_type:"Figurine" OR product_type:"Mobile" OR product_type:"Centre de table" OR product_type:"Cube décoratif" OR product_type:"Horloge")',
  'paniers-et-corbeilles': '(product_type:"Panier" OR product_type:"Panier de rangement" OR product_type:"Corbeille" OR product_type:"Caisse de rangement")',
  'parasols-ombrages': '(product_type:"Parasol" OR product_type:"Paravent")',
  'pateres-et-porte-manteaux': '(product_type:"Patère" OR product_type:"Patère murale" OR product_type:"Cintre" OR product_type:"Porte-manteau")',
  'sieges-de-bureau': '(product_type:"Chaise de bureau" OR product_type:"Fauteuil de bureau" OR product_type:"Siège de bureau")',
  'suspensions': '(product_type:"Suspension")',
  'tables-basses-et-tables-dappoint': '(product_type:"Table basse" OR product_type:"Table d\'appoint" OR product_type:"Table de chevet" OR product_type:"Sellette")',
  'tables-de-cafe': '(product_type:"Table de café" OR product_type:"Table de bistro" OR title:Bistro)',
  'tables-de-salle-a-manger': '(product_type:"Table à manger" OR product_type:"Table de salle à manger" OR product_type:"Mange-debout")',
  'tabourets-et-bancs': '(product_type:"Tabouret" OR product_type:"Tabouret de bar" OR product_type:"Banc" OR product_type:"Repose-pieds")',
  'ustensiles-cuisine': '(product_type:"Casserole" OR product_type:"Cocotte" OR product_type:"Faitout" OR product_type:"Bloc couteaux" OR product_type:"Coupe-fromage" OR product_type:"Plateau")',
  'vaisselle-assiettes': '(product_type:"Assiette" OR product_type:"Assiette creuse" OR product_type:"Assiette plate" OR product_type:"Assiette à dessert" OR product_type:"Bol" OR product_type:"Bol de service" OR product_type:"Plat" OR product_type:"Saladier" OR product_type:"Coupelle")',
  'vases': '(product_type:"Vase")',
  'verres-carafes': '(product_type:"Verre" OR product_type:"Carafe" OR product_type:"Carafe isotherme" OR product_type:"Pichet" OR product_type:"Pichet à eau" OR product_type:"Pichet à lait" OR product_type:"Flûte" OR product_type:"Flûte à champagne" OR product_type:"Decanter" OR product_type:"Huilier")',
};

async function getProductsPage(first, after, tags, cats, brand, q) {
  const f   = Math.max(1, Math.min(100, parseInt(first) || 50));
  const a   = after || null;
  const tagList = Array.isArray(tags)
    ? tags
    : (tags ? String(tags).split(',').map((s) => s.trim()).filter(Boolean) : []);
  const catList = Array.isArray(cats)
    ? cats
    : (cats ? String(cats).split(',').map((s) => s.trim()).filter(Boolean) : []);
  // Map category handles → their hardcoded clause; drop unknown handles.
  const catClauses = catList.map((h) => CATEGORY_FILTERS[h]).filter(Boolean);
  const sortedTags = [...tagList].sort();
  const sortedCats = catList.filter((h) => CATEGORY_FILTERS[h]).sort();
  const tagQuery = tagList.length ? tagList.map((t) => `tag:${t}`).join(' OR ') : '';
  const catQuery = catClauses.length ? catClauses.join(' OR ') : '';
  // Filtre MARQUE : slug (?brand=<slug>) → vendor exact via getActiveBrands (déjà en cache)
  // → clause vendor:"…". Rend la page marque rapide (le serveur ne renvoie QUE la marque).
  const brandSlug = brand ? String(brand).trim() : '';
  let vendorClause = '';
  if (brandSlug) {
    const match = (await getActiveBrands()).find((b) => b.slug === brandSlug);
    if (!match) return { items: [], pageInfo: { hasNextPage: false, endCursor: null } };
    vendorClause = `vendor:"${match.name.replace(/["\\]/g, '')}"`;
  }
  // tags (designer), cats (catalog panel) et vendor (marque) — indépendants ;
  // s'ils coexistent, on les intersecte (AND).
  const parts = [];
  if (tagQuery)     parts.push(`(${tagQuery})`);
  if (catQuery)     parts.push(`(${catQuery})`);
  if (vendorClause) parts.push(vendorClause);
  // ── RECHERCHE (native Shopify `search`, plein-texte, tolérante aux fautes) ──
  // Remplace l'ancien moteur maison (tokenizer/re-rank/fenêtre) : la recherche
  // native gère préfixes courts, fautes de frappe et pertinence. `after` = curseur
  // Shopify opaque (repassé par le front en ?cursor=). Cache par (terme, curseur,
  // taille de page) — chaque chunk du walk front est mémorisé séparément.
  const term = q ? String(q).replace(/["\\]/g, ' ').trim().slice(0, 120) : '';
  if (term) {
    if (brandSlug) {
      return brandCollectionPage({ first: f, after: a, brand: brandSlug, tag: term }, async (size, cursor) => ({
        collection: {}, ...await getProductsPage(size, cursor, tags, cats, null, term),
      }));
    }
    return cached(`search:${term.toLowerCase()}:${a || 'first'}:${f}`, async () => {
      const data = await shopifyFetch(SEARCH_QUERY, { q: term, first: f, after: a });
      let items = (data.search.edges || []).map(({ node }) => mapProduct(node));
      let pageInfo = data.search.pageInfo;
      // 1re page vide ? → filet predictive (cf. SEARCH_FALLBACK_QUERY) : on récupère
      // par ID exact les produits que l'overlay a su matcher (faute que `search`
      // ne corrige pas, ex. « fermbo »). Predictive n'est pas paginable → 1 page.
      if (!a && items.length === 0) {
        const ps = (await shopifyFetch(PREDICTIVE_QUERY, { q: term })).predictiveSearch;
        const ids = [...new Set((ps.products || []).map((p) => p.id).filter(Boolean))];
        if (ids.length) {
          const fb = await shopifyFetch(SEARCH_FALLBACK_QUERY, { ids });
          items = (fb.nodes || []).filter(Boolean).map((node) => mapProduct(node));
          pageInfo = { hasNextPage: false, endCursor: null };
        }
      }
      return { items, pageInfo };
    });
  }

  // ── CATALOGUE (best-selling, curseur Shopify) ─────────────────────────────
  const query = parts.length ? parts.join(' AND ') : null;
  const key = `products:page:${f}:${a || 'first'}`
            + (sortedTags.length ? ':tags-' + sortedTags.join(',') : '')
            + (sortedCats.length ? ':cats-' + sortedCats.join(',') : '')
            + (vendorClause ? ':brand-' + brandSlug : '');
  return cached(key, async () => {
    const data  = await shopifyFetch(PRODUCTS_QUERY, { first: f, after: a, query, sortKey: 'BEST_SELLING' });
    const items = data.products.edges.map(({ node }) => mapProduct(node));
    return { items, pageInfo: data.products.pageInfo };
  });
}

// ─── BRANDS: DERIVED FROM product.vendor ───────────────
// Brands are inferred from the vendor field on each product (HAY, Vitra, &Tradition…).
// To enrich a brand with metadata (country, founded, tagline, logo, website, color),
// create a Shopify Page named "brand:<vendor>" — not implemented yet, see TODO below.
async function getBrands() {
  return cached('brands', async () => {
    const products = await getProducts();
    const byVendor = new Map();
    for (const p of products) {
      const key = p.brand?.trim();
      if (!key) continue;
      const slug = key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const entry = byVendor.get(key) || {
        id:          `brand:${slug}`,
        brandKey:    key,
        name:        key,
        country:     '',
        city:        '',
        founded:     null,
        tagline:     '',
        description: '',
        website:     '',
        logo:        null,
        color:       '#d4c5b0',
        featured:    false,
        productCount: 0,
      };
      entry.productCount += 1;
      byVendor.set(key, entry);
    }
    return [...byVendor.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((b, i) => ({ ...b, order: i }));
  });
}

// ─── MARQUES DYNAMIQUES ────────────────────────────────
// Liste dérivée du vendor de TOUS les produits publiés (le Storefront ne renvoie
// que les produits publiés online). Requête LÉGÈRE (vendor seul) → contourne le
// plafond 250 de getProducts(). Une marque apparaît dès qu'elle a des produits
// publiés, disparaît sinon. Cache 30 min (le walk = ~24 requêtes légères).


async function getActiveBrands() {
  return cached('brands:active', async () => {
    const counts = new Map();
    let after = null;
    for (let guard = 0; guard < 80; guard++) {          // borne dure (80×250 = 20000 produits max)
      const data = await shopifyFetch(VENDORS_QUERY, { first: 250, after });
      for (const { node } of (data?.products?.edges || [])) {
        const v = (node.vendor || '').trim();
        if (v) counts.set(v, (counts.get(v) || 0) + 1);
      }
      if (!data?.products?.pageInfo?.hasNextPage) break;
      after = data.products.pageInfo.endCursor;
    }
    return [...counts.entries()]
      .map(([name, productCount]) => ({
        name,
        slug: name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        productCount,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  }, 1_800_000);   // TTL 30 min — les marques changent rarement
}

// ─── SHOPIFY: COLLECTIONS QUERY ────────────────────────
// Real Shopify collections (product lines like Palissade, Bistro, Luxembourg…).
// Optional metafields: custom.country, custom.city, custom.founded, custom.website,
// custom.tagline, custom.color, custom.featured

function mapCollection(node, index) {
  const meta = {};
  (node.metafields || []).filter(Boolean).forEach(m => { if (m) meta[m.key] = m.value; });
  const slug = node.id.split('/').pop().toLowerCase();
  return {
    id:          node.id,
    handle:      node.handle || '',
    slug,
    key:         node.title,
    name:        node.title,
    country:     meta.country   || '',
    city:        meta.city      || '',
    founded:     meta.founded   ? parseInt(meta.founded) : null,
    tagline:     meta.tagline   || '',
    description: node.description || '',
    hasProducts: node.products ? node.products.edges.length > 0 : null,
    website:     meta.website   || '',
    image:       node.image?.url || null,
    color:       meta.color     || '#d4c5b0',
    featured:    meta.featured  === 'true',
    order:       index,
  };
}

async function getCollections() {
  return cached('collections', async () => {
    const edges = [], seen = new Set();
    let after = null;
    do {
      const data = await shopifyFetch(COLLECTIONS_QUERY, { first: 250, after });
      edges.push(...data.collections.edges);
      if (!data.collections.pageInfo?.hasNextPage) break;
      after = data.collections.pageInfo.endCursor;
      if (!after || seen.has(after)) throw new Error('Curseur collections Shopify invalide');
      seen.add(after);
    } while (true);
    return edges
      .map(({ node }, i) => mapCollection(node, i))
      // Exclude Shopify's built-in "All" / "Home page" collections
      .filter(c => !['all', 'frontpage'].includes(c.handle));
  });
}

// ─── API: GET PRODUCTS ─────────────────────────────────
// Two modes:
//   GET /api/products                              → legacy array (≤ 250 products)
//     consumed by home (main.js), selection, produit, internal getPromos
//   GET /api/products?paginated=1&limit=50&cursor= → { items, pageInfo }
//     consumed by the new PLP at /produits.html
// The legacy shape is contractual — 4 callers depend on it.
app.get('/api/products', async (req, res) => {
  try {
    const { paginated, cursor, limit, tags, cats, brand, q } = req.query;
    if (paginated || cursor || limit || tags || cats || brand || q) {
      const page = await getProductsPage(limit, cursor, tags, cats, brand, q);
      return res.json(page);
    }
    const products = await getProducts();
    res.json(products);
  } catch (err) {
    console.error('Products error:', err.message);
    res.status(500).json({ error: 'Impossible de charger les produits.' });
  }
});

// ─── API: GET BRANDS ───────────────────────────────────
// Derived from product.vendor — returns one entry per unique vendor.
app.get('/api/brands', async (req, res) => {
  try {
    const brands = await getActiveBrands();
    res.json(brands);
  } catch (err) {
    console.error('Brands error:', err.message);
    res.status(500).json({ error: 'Impossible de charger les marques.' });
  }
});

// ─── SHOPIFY: PREDICTIVE SEARCH (overlay instantané, dès la 1re lettre) ──
// searchableFields laissé PAR DÉFAUT (TITLE, PRODUCT_TYPE, VARIANT_TITLE,
// VENDOR) — ne pas le passer explicitement (sinon on écrase le set par défaut →
// vendor/product_type cassent). Pas de `types` sur products/collections (aucune
// suggestion « QUERY » côté store). Produits + collections en 1 appel.


// Les nœuds predictiveSearch.products n'ont PAS la forme de PRODUCTS_QUERY (pas
// de variants/metafields) → mapper léger dédié (ne PAS réutiliser mapProduct).
// price = priceMin = priceMax → priceLabel() n'affiche jamais « À partir de ».
function mapPredictiveProduct(n) {
  const amt = parseFloat(n.priceRange?.minVariantPrice?.amount || 0);
  return {
    handle: n.handle || '', name: n.title || '', brand: n.vendor || '',
    productType: (n.productType || '').toLowerCase(),
    image: n.featuredImage?.url || '',
    price: amt, priceMin: amt, priceMax: amt, compareAt: null,
  };
}

async function getPredictive(q) {
  // Les débuts de mots et les noms seuls gardent l'autocomplétion native légère.
  // Dès qu'une demande comporte des critères, toute la sélection est vérifiée.
  if (typeof q === 'string' && q.trim().length >= 2 && parseSearch(q).criteria.some(c=>!['text','brand'].includes(c.kind))) {
    const {items,...data}=await getSearchPage({q});
    return {...data,products:items.slice(0,8),brands:[],categories:[],resultsUrl:data.resultsUrl+'#grille'};
  }
  const term = String(q || '').replace(/["\\]/g, ' ').trim().slice(0, 80);
  if (!term) return { products: [], brands: [], categories: [] };
  return cached('predictive:' + term.toLowerCase(), async () => {
    const ps = (await shopifyFetch(PREDICTIVE_QUERY, { q: term })).predictiveSearch;
    // Une collection est une MARQUE si son handle/titre matche un vendor actif.
    // On renvoie alors l'objet MARQUE canonique {name, slug} de getActiveBrands
    // (pas le handle brut : le store publie p.ex. 2 collections « Fermob »
    // fermob + fermob-1) + on DÉDUPLIQUE par slug → une seule chip par marque.
    const brandsRef = await getActiveBrands();                 // [{name, slug, productCount}]
    const bySlug = new Map(brandsRef.map((b) => [b.slug, b]));
    const byName = new Map(brandsRef.map((b) => [b.name.toLowerCase(), b]));
    const seen = new Set();
    const brands = [], categories = [];
    for (const c of (ps.collections || [])) {
      const b = bySlug.get(c.handle) || byName.get((c.title || '').toLowerCase());
      if (b) { if (!seen.has(b.slug)) { seen.add(b.slug); brands.push({ name: b.name, slug: b.slug }); } }
      else   { categories.push({ handle: c.handle, name: c.title }); }
    }
    return { products: (ps.products || []).map(mapPredictiveProduct), brands, categories };
  }, 120_000);   // TTL court (2 min)
}

// ─── API: RECHERCHE PRÉDICTIVE (overlay instantané) ────
app.get('/api/predictive', async (req, res) => {
  try {
    const data = await getPredictive(req.query.q);
    res.set('Cache-Control', data.resultsUrl ? 'no-store' : 'public, max-age=60');
    res.json(data);
  } catch (err) {
    console.error('Predictive error:', err.message);
    res.status(503).set('Cache-Control','no-store').json({ error: 'Recherche indisponible.' });
  }
});

// ─── SHOPIFY: MAIN MENU QUERY ──────────────────────────
// Drives the site nav top-level + the Mobilier mega menu sub-items
// + the Marques dropdown. Handle "main-menu" is the default Shopify
// "Menu principal" (Online Store → Navigation). Cyril edits libellés
// / ordre / sub-items from the Shopify admin; the site picks it up
// at the next /api/menu cache refresh (5 min TTL).


// Shopify returns absolute URLs on the *primary* domain
// (shop.mikadodeco.be/...). Rewrite to bare paths so the front
// uses them directly and the JSON works on any environment.
function rewriteMenuUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    return u.pathname + u.search + u.hash;
  } catch { return url; }
}

function mapMenuItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((it) => ({
    title: it.title || '',
    url:   rewriteMenuUrl(it.url),
    items: mapMenuItems(it.items),
  }));
}

async function getMenu() {
  return cached('menu', async () => {
    const data = await shopifyFetch(MENU_QUERY);
    const items = mapMenuItems(data?.menu?.items || []);
    return { ok: true, items };
  });
}

// ─── API: MAIN MENU ────────────────────────────────────
// Used by the nav widget (mega menu + dropdown). On upstream failure
// returns { ok: false, items: [] } — the client falls back to its
// hardcoded top-level. We never 500 on this endpoint: the nav is
// global and must not surface as a broken request.
app.get('/api/menu', async (req, res) => {
  try {
    res.json(await getMenu());
  } catch (err) {
    console.warn('Menu fetch failed:', err.message);
    res.json({ ok: false, items: [] });
  }
});

// ─── API: GET COLLECTIONS ──────────────────────────────
// Real Shopify collections (product lines: Palissade, Bistro, Luxembourg…).
app.get('/api/collections', async (req, res) => {
  try {
    const collections = await getCollections();
    res.json(collections);
  } catch (err) {
    console.error('Collections error:', err.message);
    res.status(500).json({ error: 'Impossible de charger les collections.' });
  }
});

// ─── SHOPIFY: COLLECTION PRODUCTS QUERY ────────────────
// Drives /collections/<handle> pages. We query Shopify directly by
// handle so the products are pre-filtered server-side — the V1 bug
// (PLP grid empty on most collections) came from client-side filtering
// a too-small 250-product window.


async function getCollectionChunk(handle, first, after, tag) {
  const f   = Math.max(1, Math.min(100, parseInt(first) || 50));
  const a   = after || null;
  const t   = (tag || '').trim() || null;
  const key = `collection:${handle}:${t ? `tag-${t}:` : ''}${f}:${a || 'first'}`;
  return cached(key, async () => {
    // Shopify's ProductFilter list — empty = no filter, [{ tag }] =
    // server-side tag filtering. Caching by tag prevents the V2 issue
    // where "Voir plus" on a tag had to scroll past unrelated products.
    const filters = t ? [{ tag: t }] : [];
    const data = await shopifyFetch(COLLECTION_PRODUCTS_QUERY, { handle, first: f, after: a, filters });
    const c = data.collection;
    if (!c) return null;
    const items = c.products.edges.map(({ node }) => mapProduct(node));
    return {
      collection: {
        handle,
        title:       c.title || '',
        description: c.description || '',
        image:       c.image?.url || null,
      },
      items,
      edges: c.products.edges.map((edge, index) => ({ cursor: edge.cursor, product: items[index] })),
      pageInfo: c.products.pageInfo,
    };
  });
}

async function getCollectionProducts(handle, first, after, tag) {
  if (tableSources(handle)) {
    const limit = Math.max(1, Math.min(100, parseInt(first) || 50));
    return cached(`table-scope-v1:${handle}:${limit}:${after || ''}:${tag || ''}`, () =>
      tablePage({ handle, first: limit, after }, (source, size, cursor) => getCollectionChunk(source, size, cursor, tag)));
  }
  const chunk = await getCollectionChunk(handle, first, after, tag);
  if (!chunk) return null;
  const { edges, ...payload } = chunk;
  return payload;
}

// ─── SHOPIFY: SINGLE PRODUCT BY HANDLE ─────────────────
// Used by the PDP at /produit?handle=<h>. Before this endpoint the
// PDP could only render products from /api/products (capped at 250)
// — anything beyond the cap rendered "introuvable". This query goes
// straight to Shopify by handle, so the catalog cap no longer gates
// individual product pages.


async function getProductByHandle(handle) {
  const h = String(handle || '').trim();
  if (!h) return null;
  return cached(`product:${h}`, async () => {
    const data = await shopifyFetch(PRODUCT_QUERY, { handle: h });
    const node = data.product;
    if (!node) return null;
    const product = mapProduct(node, { full: true });
    // Recommandations Search & Discovery (métafields list.product_reference)
    // mappées dans la forme de carte du site. Écarte : entrées sans image, la
    // self-référence, et les doublons — y compris un produit listé À LA FOIS en
    // complémentaire et en similaire (il n'apparaît alors que dans « Complétez
    // avec »). Brouillons/dépubliés absents (la Storefront API ne renvoie que les
    // produits actifs — c'est voulu).
    const seen = new Set([node.id]);
    const toCards = (mf) => (mf?.references?.nodes || []).map(mapProductRef)
      .filter(r => r && r.image && !seen.has(r.id) && (seen.add(r.id), true));
    product.complementary = toCards(node.complementary);
    product.related       = toCards(node.related);
    return product;
  });
}

// ─── API: GET PRODUCT BY HANDLE ────────────────────────
// GET /api/product/:handle
// 404 when the handle does not exist in Shopify (or is unpublished
// on the Storefront API channel).
app.get('/api/product/:handle', async (req, res) => {
  try {
    const product = await getProductByHandle(req.params.handle);
    if (!product) return res.status(404).json({ error: 'product_not_found' });
    res.json(product);
  } catch (err) {
    console.error('Product fetch error:', err.message);
    res.status(500).json({ error: 'Impossible de charger ce produit.' });
  }
});

// ─── API: GET COLLECTION PRODUCTS ──────────────────────
// GET /api/collection/:handle/products?cursor=...&limit=50&tag=<tag>
// Returns { collection: { title, description, image }, items, pageInfo }
// `tag` is an optional Shopify ProductFilter — when present, only
// products carrying that tag are returned (paginated server-side).
// 404 when the handle does not exist in Shopify.
// Page « Promotions » vivante : fusionne la collection Shopify « promotions »
// (curation manuelle, prioritaire) avec les produits portant une remise
// automatique ACTIVE (sonde getPromos). Chaque produit est estampillé du handle
// « promotions » (le PLP re-filtre par p.collections côté client). Pagination :
// la fusion ne concerne que la 1re page (les offres actives sont peu nombreuses).
async function getPromotionsProducts(first, after) {
  const base = await getCollectionProducts('promotions', first, after);
  const stamp = (p) => ({ ...promotionCard(p), collections: [...new Set([...(p.collections || []), 'promotions'])] });
  if (after) return base && { ...base, items: base.items.map(stamp) };
  let promoItems = [];
  try {
    // Sonde bornée : à froid elle peut prendre ~10 s (un panier-test par
    // variante) — on sert la page vite et on la laisse finir en arrière-plan.
    const promosBounded = Promise.race([getPromos(), new Promise((r) => setTimeout(r, 2500, null))]);
    const [promos, products] = await Promise.all([promosBounded, getProducts()]);
    if (promos) promoItems = products.filter((p) => p.variantId && promos[p.variantId]);
    else console.warn('[promotions-page] sonde froide — page servie sans fusion (cache en chauffe)');
  } catch (e) { console.warn('[promotions-page]', e.message); }
  const items = (base?.items || []).map(stamp);
  const seen = new Set(items.map((p) => p.id));
  for (const p of promoItems) if (!seen.has(p.id)) { seen.add(p.id); items.push(stamp(p)); }
  return {
    collection: base?.collection || { handle: 'promotions', title: 'Promotions', description: '', image: null },
    items,
    pageInfo: (base?.items || []).length ? base.pageInfo : { hasNextPage: false, endCursor: null },
  };
}
const collectionProductsFor = (handle, first, after, tag, brand) => {
  const fetchPage = (size, cursor, source = handle) => source === 'promotions'
    ? getPromotionsProducts(size, cursor) : getCollectionProducts(source, size, cursor, tag);
  const slug = typeof brand === 'string' ? brand.trim().toLowerCase() : '';
  return slug ? brandCollectionPage({ handle, first, after, brand: slug, tag: tag || '' }, fetchPage) : fetchPage(first, after);
};

app.get('/api/collection/:handle/products', async (req, res) => {
  try {
    const { handle } = req.params;
    const { cursor, limit, tag, brand } = req.query;
    const payload = await collectionProductsFor(handle, limit, cursor, tag, brand);
    if (!payload) return res.status(404).json({ error: 'collection_not_found' });
    res.json(payload);
  } catch (err) {
    console.error('Collection products error:', err.message);
    res.status(500).json({ error: 'Impossible de charger la collection.' });
  }
});

// ─── API: VITRA CHAIRS (scraped data) ─────────────────
// Run `npm run scrape` to regenerate data/vitra-chairs.json
const VITRA_JSON = path.join(__dirname, 'data/vitra-chairs.json');

app.get('/api/vitra', (req, res) => {
  if (!fs.existsSync(VITRA_JSON)) {
    return res.status(404).json({ error: 'Vitra data not found. Run: npm run scrape' });
  }
  try {
    const raw = fs.readFileSync(VITRA_JSON, 'utf8');
    const { products, scraped_at, count } = JSON.parse(raw);

    // Optional filters
    let filtered = products;
    const { q, min, max } = req.query;
    if (q) {
      const term = q.toLowerCase();
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(term) ||
        p.designer?.toLowerCase().includes(term) ||
        p.colours?.some(c => c.includes(term))
      );
    }
    if (min) filtered = filtered.filter(p => p.price >= parseFloat(min));
    if (max) filtered = filtered.filter(p => p.price <= parseFloat(max));

    res.json({ scraped_at, total: count, count: filtered.length, products: filtered });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read Vitra data.' });
  }
});

// ─── API: BUILD INFO (cache busting) ───────────────────
// Exposes the current build SHA so the client can append it as a
// query-string to long-cached asset URLs (e.g. /images/brands/*.svg
// served with `Cache-Control: immutable`). Each Vercel deploy gets
// a new SHA → ?v=... changes → browser re-fetches without manual
// cache clears. Falls back to "dev" outside Vercel.
app.get('/api/build', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const raw = process.env.VERCEL_GIT_COMMIT_SHA || '';
  res.json({ sha: raw ? raw.slice(0, 7) : 'dev' });
});

// ─── AUTH REVALIDATE ───────────────────────────────────
// Accepte (a) un webhook Shopify signé (HMAC-SHA256 sur le corps brut) OU
// (b) un token porteur pour les revalidations manuelles. Sinon 401.
// Fail-closed : si aucun secret n'est configuré, toute requête tombe en 401.
function verifyShopifyHmac(req) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  const sent   = req.get('X-Shopify-Hmac-Sha256');
  if (!secret || !sent || !req.rawBody) return false;
  const digest = crypto.createHmac('sha256', secret).update(req.rawBody).digest('base64');
  const a = Buffer.from(digest);
  const b = Buffer.from(sent);
  return a.length === b.length && crypto.timingSafeEqual(a, b); // comparaison constante
}
function hasValidToken(req) {
  const token = process.env.REVALIDATE_TOKEN;
  if (!token) return false;
  const sent = (req.get('authorization') || '').replace(/^Bearer\s+/i, '') || String(req.query.token || '');
  if (!sent) return false;
  const a = Buffer.from(sent);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b); // comparaison constante
}

// ─── API: REVALIDATE CACHE ─────────────────────────────
// Call this from a Shopify webhook (Products/update, Collections/update)
// Setup in Shopify admin → Settings → Notifications → Webhooks
// Auth : HMAC Shopify (webhook) OU Authorization: Bearer <REVALIDATE_TOKEN> (manuel).
app.post('/api/revalidate', (req, res) => {
  if (!verifyShopifyHmac(req) && !hasValidToken(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  delete _cache['products'];
  delete _cache['brands'];
  delete _cache['collections'];
  delete _cache['promos'];
  delete _cache['menu'];
  delete _cache['chairs:index'];
  clearSearchCache();
  console.log('Cache cleared via /api/revalidate');
  res.json({ revalidated: true });
});

// ─── SHOPIFY: CART CREATE MUTATION ─────────────────────


// ─── SHOPIFY: CART PREVIEW (totals + discount allocations) ─────────
// Same shape as CartCreate, but we ask for cost + discountAllocations so
// the front-end can show Shopify's actual price after automatic discounts
// (e.g. "Buy 5 get 1 free") before the customer hits checkout.


// ─── PROMO DISCOVERY ────────────────────────────────────
// Probes each variant with a "test cart" of qty=100 to surface any Shopify
// automatic discount that applies. Used by /api/promos to drive the red
// promo badge on product cards and on the PDP.
async function fetchPromoForVariant(variantId) {
  try {
    const data = await shopifyFetch(CART_PREVIEW_MUTATION, {
      lines: [{ merchandiseId: variantId, quantity: 100 }],
    });
    const cart = data.cartCreate?.cart;
    if (!cart) return null;
    const titleOf = (d) => d.title || d.code;
    const cartLevel = (cart.discountAllocations || []).map(titleOf);
    const lineLevel = (cart.lines?.edges || []).flatMap((e) =>
      (e.node.discountAllocations || []).map(titleOf)
    );
    return [...cartLevel, ...lineLevel].find(Boolean) || null;
  } catch (e) {
    console.warn('[promo] probe failed for', variantId, e.message);
    return null;
  }
}

// Parallel probe with bounded concurrency. ~12 in-flight requests is well
// under Shopify's Storefront rate limit and finishes a 200-product probe in
// roughly 2-4 seconds on cold cache. Result cached as 'promos' (5 min TTL).
async function getPromos() {
  return cached('promos', async () => {
    const products = await getProducts();
    // La sonde couvre le top ~250 (getProducts) — un produit remisé hors de ce
    // cap n'aurait JAMAIS de badge (constaté 02/09 : les −10 % Junior/Classic/
    // Amoebe/Visiona). On sonde donc AUSSI la collection « promotions »
    // (curation par tag neutre offre-en-cours) : y taguer un produit lui donne
    // badge + place dans l'onglet, même hors meilleures ventes.
    let curated = [];
    try { curated = ((await getCollectionProducts('promotions', 100)) || {}).items || []; }
    catch (e) { /* collection absente → sonde standard seule */ }
    const variantIds = [...new Set([...products, ...curated].map((p) => p.variantId).filter(Boolean))];
    const map = {};
    let i = 0;
    const concurrency = 12;
    async function worker() {
      while (i < variantIds.length) {
        const vid = variantIds[i++];
        const title = await fetchPromoForVariant(vid);
        if (title) map[vid] = title;
      }
    }
    await Promise.all(Array(Math.min(concurrency, variantIds.length)).fill(0).map(worker));
    return map;
  });
}

// ─── API: PROMOS (variantId → discount title) ──────────
app.get('/api/promos', async (req, res) => {
  try {
    res.json(await getPromos());
  } catch (err) {
    console.error('Promos error:', err.message);
    res.status(500).json({ error: 'Impossible de charger les promotions.' });
  }
});

// ─── API: CART PREVIEW (totals + discounts) ────────────
// Body: { items: [{ variantId, qty }] }
// Returns: { subtotal, total, discount, discounts: [{title, amount}], lines: [{variantId, qty, subtotal, total, discount}] }
// NOTE: every call creates an orphan Shopify cart that auto-expires after
// ~10 days. Debounce on the client to keep volume sane.
app.post('/api/cart/preview', cartLimiter, async (req, res) => {
  try {
    const items = req.body?.items;
    if (!Array.isArray(items) || items.length === 0) return res.json({ subtotal: 0, total: 0, discount: 0, discounts: [], lines: [] });
    const lines = items.map(item => ({
      merchandiseId: item.variantId,
      quantity:      Math.max(1, Math.min(99, parseInt(item.qty) || 1)),
    }));
    const data = await shopifyFetch(CART_PREVIEW_MUTATION, { lines });
    const result = data.cartCreate;
    if (result.userErrors?.length) return res.status(400).json({ error: result.userErrors[0].message });
    const cart = result.cart;
    const titleOf = (d) => d.title || d.code || 'Remise';
    // Éligibilité « offre cadeau » par ligne : miroir de la collection Shopify
    // « Catalogue — paliers cadeaux » (gid 694454944073) : prix > 0 SAUF tag
    // `exclu-paliers` (03/09 : chaise Panton sortie du calcul — son 5+1 est
    // financé par Vitra et ne doit pas être remplacé par les cadeaux Mikado).
    const GIFT_EXCLUDE_TAGS = new Set(['exclu-paliers']);
    const isEligible = (tags) => !(tags || []).some((t) => GIFT_EXCLUDE_TAGS.has(String(t).toLowerCase()));
    // Cart-level discounts (e.g. code "WELCOME10")
    const cartDiscounts = (cart.discountAllocations || []).map(d => ({
      title:  titleOf(d),
      amount: parseFloat(d.discountedAmount.amount),
    }));
    // Shopify can split one client-side line into several internal lines
    // (e.g. a "buy 5 get 1 free" rule yields one qty=5 line + one qty=1 free
    // line for the same variantId). We aggregate the internal lines per
    // variantId so the cart UI can show one clean row per variant with the
    // exact promo title(s) and the post-discount price.
    const internalLines = (cart.lines?.edges || []).map(e => e.node);
    const lineDiscounts = {}; // variantId → total discount (legacy field)
    const allLineDiscountObjs = [];
    // Per-variant aggregation: subtotal, total, discount, discount titles, qty
    const byVariant = new Map();
    for (const n of internalLines) {
      const vid = n.merchandise?.id || null;
      const lineSub = parseFloat(n.cost.subtotalAmount.amount);
      const lineTot = parseFloat(n.cost.totalAmount.amount);
      const lineDiscount = Math.max(0, lineSub - lineTot);
      const qty = parseInt(n.quantity) || 0;
      if (vid && lineDiscount > 0) lineDiscounts[vid] = (lineDiscounts[vid] || 0) + lineDiscount;
      if (vid) {
        const agg = byVariant.get(vid) || { subtotal: 0, total: 0, discount: 0, qty: 0, titles: new Set(), tags: (n.merchandise?.product?.tags) || [] };
        agg.subtotal += lineSub;
        agg.total    += lineTot;
        agg.discount += lineDiscount;
        agg.qty      += qty;
        for (const d of (n.discountAllocations || [])) {
          const amt = parseFloat(d.discountedAmount.amount);
          if (amt > 0) {
            const t = titleOf(d);
            if (t) agg.titles.add(t);
          }
        }
        byVariant.set(vid, agg);
      }
      for (const d of (n.discountAllocations || [])) {
        const amt = parseFloat(d.discountedAmount.amount);
        if (amt > 0) allLineDiscountObjs.push({ title: titleOf(d), amount: amt });
      }
    }
    // Summary list, aggregated by title, used to render "Remise · X: -Y €" rows
    const byTitle = {};
    [...cartDiscounts, ...allLineDiscountObjs].forEach(d => {
      if (d.amount <= 0) return;
      byTitle[d.title] = (byTitle[d.title] || 0) + d.amount;
    });
    const discounts = Object.entries(byTitle).map(([title, amount]) => ({ title, amount }));
    const discount  = discounts.reduce((s, d) => s + d.amount, 0);
    // Per-variant payload — client renders one row per variant with the
    // original/final price split and the promo title(s) underneath.
    // discountPct is rounded to 1 decimal; the client checks ≥ 99 to flip
    // the row into the "GRATUIT" visual treatment.
    const linesOut = items.map(item => {
      const agg = byVariant.get(item.variantId);
      if (!agg) {
        const qty = Math.max(1, Math.min(99, parseInt(item.qty) || 1));
        return { variantId: item.variantId, qty, subtotal: 0, total: 0, discount: 0, discountPct: 0, discountTitles: [], eligible: false };
      }
      const pct = agg.subtotal > 0 ? (agg.discount / agg.subtotal) * 100 : 0;
      return {
        variantId:      item.variantId,
        qty:            agg.qty,
        subtotal:       agg.subtotal,
        total:          agg.total,
        discount:       agg.discount,
        discountPct:    Math.round(pct * 10) / 10,
        discountTitles: [...agg.titles],
        eligible:       isEligible(agg.tags),
      };
    });
    // Cart cost totals (post-discount, pre-shipping/tax)
    const subtotalDisplayed = parseFloat(cart.cost.subtotalAmount.amount) + discount; // pre-discount, for "Sous-total"
    const total             = parseFloat(cart.cost.totalAmount.amount);
    res.json({ subtotal: subtotalDisplayed, total, discount, discounts, lineDiscounts, lines: linesOut });
  } catch (err) {
    console.error('Cart preview error:', err.message);
    res.status(500).json({ error: 'Erreur lors du calcul du panier.' });
  }
});

// Fresh availability for the exact variants and total quantities in the cart.
app.post('/api/cart/delivery', cartLimiter, async (req, res) => {
  try {
    const items = normalizeItems(req.body?.items);
    res.json(await getDeliveryEstimate(items, shopifyFetch));
  } catch (err) {
    res.status(400).json({ error: 'Impossible de vérifier le délai. Réessayez avant de payer.' });
  }
});

// ─── API: CREATE CART → SHOPIFY CHECKOUT ───────────────
// Body: { items: [{ variantId, qty }], customer: { prenom, nom, email, telephone, projet, message } }
// Returns: { checkoutUrl } — redirect the browser to this URL
app.post('/api/cart/create', cartLimiter, async (req, res) => {
  try {
    const { customer } = req.body;
    const items = normalizeItems(req.body?.items);
    const delivery = await getDeliveryEstimate(items, shopifyFetch);
    const project = realProject(customer?.projet);
    const checkedAt = new Date().toISOString();

    const lines = items.map(item => ({
      merchandiseId: item.variantId,
      quantity:      item.qty,
      // Ligne cadeau (offre Panton) : marquée par un attribut _gift (préfixe _
      // = masqué au client) — retrouvable dans la commande côté admin.
      attributes: [
        ...(item.gift ? [{ key: '_gift', value: String(item.gift).slice(0, 40) }] : []),
        ...(delivery.lines.find(l => l.variantId === item.variantId)?.label
          ? [{ key: 'Délai estimé', value: delivery.lines.find(l => l.variantId === item.variantId).label }] : []),
      ],
    }));

    // Pass customer context as cart note + attributes
    // (visible in Shopify admin → Orders → Notes / Attributes)
    const noteParts = delivery.label ? [`Délai estimé de la commande : ${delivery.label} (envoi groupé).`, 'Mode de réception : voir le mode choisi au paiement dans la commande Shopify.'] : [];
    if (customer?.prenom || customer?.nom) {
      noteParts.push(`Client: ${[customer.prenom, customer.nom].filter(Boolean).join(' ')}`);
    }
    if (customer?.telephone) noteParts.push(`Tel: ${customer.telephone}`);
    if (project) noteParts.push(`Projet: ${project}`);
    if (customer?.message)   noteParts.push(`Message: ${customer.message.substring(0, 500)}`);

    const attributes = delivery.label ? [{ key: 'Délai estimé', value: delivery.label }, { key: 'Stock vérifié le', value: checkedAt }] : [];
    if (customer?.prenom)    attributes.push({ key: 'Prenom',    value: customer.prenom });
    if (customer?.nom)       attributes.push({ key: 'Nom',       value: customer.nom });
    if (customer?.email)     attributes.push({ key: 'Email',     value: customer.email });
    if (customer?.telephone) attributes.push({ key: 'Telephone', value: customer.telephone });
    if (project) attributes.push({ key: 'Projet', value: project });

    const data = await shopifyFetch(CART_CREATE_MUTATION, {
      lines,
      note:       noteParts.length ? noteParts.join('\n') : undefined,
      attributes: attributes.length ? attributes : undefined,
    });

    const result = data.cartCreate;
    if (result.userErrors?.length) {
      return res.status(400).json({ error: result.userErrors[0].message });
    }

    // Shopify returns checkoutUrl on the store's *primary* domain. The headless
    // storefront owns www.mikadodeco.be (served by Vercel), so checkout must run
    // on a Shopify-pointed subdomain. If SHOPIFY_CHECKOUT_DOMAIN is set (e.g.
    // shop.mikadodeco.be → CNAME shops.myshopify.com, set as Shopify primary),
    // force the checkout host to it so the redirect lands on Shopify, not Vercel.
    let checkoutUrl = result.cart.checkoutUrl;
    if (process.env.SHOPIFY_CHECKOUT_DOMAIN) {
      try {
        const u = new URL(checkoutUrl);
        u.host = process.env.SHOPIFY_CHECKOUT_DOMAIN;
        checkoutUrl = u.toString();
      } catch (_) { /* keep Shopify's original URL on parse failure */ }
    }

    res.json({ checkoutUrl });

  } catch (err) {
    console.error('Cart create error:', err.message);
    res.status(500).json({ error: err.message || 'Erreur lors de la creation du panier.' });
  }
});

// ─── CONTACT FORM ──────────────────────────────────────
// Body: { name, email, telephone?, projet?, message }
// Validates server-side, logs structured payload, returns 200.
// Wire up nodemailer / a webhook later — the endpoint contract stays the same.
app.post('/api/contact', formLimiter, async (req, res) => {
  try {
    // Honeypot anti-bot : champ masqué qu'un humain ne remplit jamais. Si rempli
    // → faux succès silencieux (on ne révèle pas le piège, on ne traite rien).
    if (String(req.body?.hp_field || '').trim()) return res.json({ ok: true });

    const { name = '', email = '', telephone = '', projet = '', message = '', source = 'website' } = req.body || {};

    const cleanName    = String(name).trim().slice(0, 120);
    const cleanEmail   = String(email).trim().toLowerCase().slice(0, 200);
    const cleanPhone   = String(telephone).trim().slice(0, 40);
    const cleanProjet  = String(projet).trim().slice(0, 80);
    const cleanMessage = String(message).trim().slice(0, 4000);

    if (!cleanName)    return res.status(400).json({ error: 'name_required' });
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'email_invalid' });
    }
    if (!cleanMessage || cleanMessage.length < 4) {
      return res.status(400).json({ error: 'message_too_short' });
    }

    const submission = {
      ts:       new Date().toISOString(),
      name:     cleanName,
      email:    cleanEmail,
      telephone:cleanPhone || null,
      projet:   cleanProjet || null,
      message:  cleanMessage,
      source,
      ua:       String(req.headers['user-agent'] || '').slice(0, 200),
    };

    // Structured log — surfaces in Vercel logs (filet de sécurité si l'e-mail échoue).
    console.log('[contact]', JSON.stringify(submission));
    let delivered = false;   // au moins un canal de notification a réussi ?

    // Notification e-mail via Resend (si configuré). Reply-To = client → réponse directe.
    if (process.env.RESEND_API_KEY) {
      const to      = process.env.CONTACT_TO   || 'shop@mikadodeco.be';
      const from    = process.env.CONTACT_FROM || 'Mikado Deco (site) <no-reply@mikadodeco.be>';
      const subject = `Nouvelle demande — ${cleanProjet || 'Contact'} — ${cleanName}`;
      const text = [
        `Nom : ${cleanName}`,
        `E-mail : ${cleanEmail}`,
        cleanPhone  ? `Téléphone : ${cleanPhone}` : null,
        cleanProjet ? `Objet : ${cleanProjet}`    : null,
        `Source : ${source}`,
        `Reçu : ${submission.ts}`,
        '',
        cleanMessage,
      ].filter((l) => l !== null).join('\n');
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ from, to, reply_to: cleanEmail, subject, text }),
        });
        if (r.ok) { delivered = true; }
        else {
          const detail = await r.text().catch(() => '');
          console.warn('[contact] resend failed:', r.status, detail.slice(0, 300));
        }
      } catch (e) {
        console.warn('[contact] resend error:', e.message);
      }
    }

    // If a CONTACT_WEBHOOK_URL is set, forward (Slack, Discord, Zapier, etc.)
    if (process.env.CONTACT_WEBHOOK_URL) {
      try {
        const wr = await fetch(process.env.CONTACT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission),
        });
        if (wr.ok) delivered = true;
      } catch (e) {
        console.warn('[contact] webhook failed:', e.message);
      }
    }

    // Honnêteté : si un canal de notification est configuré mais que l'envoi a échoué, on
    // ne ment pas au client (« envoyé ») → il verra un message + un repli (tél/e-mail direct).
    const hasChannel = !!(process.env.RESEND_API_KEY || process.env.CONTACT_WEBHOOK_URL);
    if (hasChannel && !delivered) return res.status(502).json({ error: 'delivery_failed' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[contact] error:', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// One-time merchant authorization for the installed newsletter app. The resulting
// offline token is copied into Vercel as SHOPIFY_ADMIN_TOKEN; this route then closes.
const NEWSLETTER_OAUTH_COOKIE = '__Host-mikado-newsletter-oauth';
const NEWSLETTER_OAUTH_REDIRECT = 'https://www.mikadodeco.be/api/shopify/newsletter/callback';
const newsletterOAuthHeaders = (res) => res.set({
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
});
const newsletterOAuthReady = () =>
  process.env.SHOPIFY_ADMIN_DOMAIN === 'cqnfzf-qb.myshopify.com' &&
  !!process.env.SHOPIFY_ADMIN_CLIENT_ID && !!process.env.SHOPIFY_ADMIN_CLIENT_SECRET;
app.get('/api/shopify/newsletter/connect', formLimiter, (req, res) => {
  newsletterOAuthHeaders(res);
  if (process.env.SHOPIFY_ADMIN_TOKEN) return res.status(410).send('Connexion déjà terminée.');
  if (!newsletterOAuthReady()) return res.status(503).send('Application non configurée.');
  const state = crypto.randomBytes(32).toString('hex');
  res.cookie(NEWSLETTER_OAUTH_COOKIE, state, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000,
  });
  const params = new URLSearchParams({
    client_id: process.env.SHOPIFY_ADMIN_CLIENT_ID,
    scope: 'read_customers,write_customers',
    redirect_uri: NEWSLETTER_OAUTH_REDIRECT,
    state,
  });
  return res.redirect('https://cqnfzf-qb.myshopify.com/admin/oauth/authorize?' + params);
});
app.get('/api/shopify/newsletter/callback', formLimiter, async (req, res) => {
  newsletterOAuthHeaders(res);
  if (process.env.SHOPIFY_ADMIN_TOKEN) return res.status(410).send('Connexion déjà terminée.');
  if (!newsletterOAuthReady()) return res.status(503).send('Application non configurée.');
  const params = new URL(req.originalUrl, ORIGIN).searchParams;
  const keys = [...params.keys()];
  if (new Set(keys).size !== keys.length) return res.status(400).send('Paramètres dupliqués.');
  const state = params.get('state') || '';
  const cookieState = String(req.headers.cookie || '').split(';').map(part => part.trim())
    .find(part => part.startsWith(NEWSLETTER_OAUTH_COOKIE + '='))?.slice(NEWSLETTER_OAUTH_COOKIE.length + 1) || '';
  const a = Buffer.from(state), b = Buffer.from(cookieState);
  if (!state || a.length !== b.length || !crypto.timingSafeEqual(a, b))
    return res.status(403).send('Session de connexion invalide.');
  res.clearCookie(NEWSLETTER_OAUTH_COOKIE, { secure: true, sameSite: 'lax', path: '/' });
  const shop = params.get('shop');
  const code = params.get('code');
  const hmac = params.get('hmac');
  if (shop !== 'cqnfzf-qb.myshopify.com' || !code || !/^[a-f0-9]{64}$/i.test(hmac || ''))
    return res.status(400).send('Réponse Shopify invalide.');
  const message = [...params.entries()].filter(([key]) => key !== 'hmac')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => key + '=' + value).join('&');
  const expected = crypto.createHmac('sha256', process.env.SHOPIFY_ADMIN_CLIENT_SECRET)
    .update(message).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hmac.toLowerCase())))
    return res.status(403).send('Signature Shopify invalide.');
  try {
    const tokenResponse = await fetch('https://cqnfzf-qb.myshopify.com/admin/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: process.env.SHOPIFY_ADMIN_CLIENT_ID,
        client_secret: process.env.SHOPIFY_ADMIN_CLIENT_SECRET,
        code,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!tokenResponse.ok) return res.status(502).send('Échange du jeton refusé par Shopify (' + tokenResponse.status + ').');
    const data = await tokenResponse.json();
    if (!data.access_token || data.expires_in || !(data.scope || '').split(',').includes('write_customers'))
      return res.status(502).send('Jeton Shopify ou autorisations inattendus.');
    const safeToken = String(data.access_token).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return res.type('html').send('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Connexion Shopify</title><body><h1>Connexion Shopify autorisée</h1><p>Copiez ce jeton une seule fois dans Vercel, variable SHOPIFY_ADMIN_TOKEN pour Production et Preview. Ne le partagez pas.</p><textarea id="shopify-token" readonly rows="3" cols="90">' + safeToken + '</textarea></body></html>');
  } catch (error) {
    console.warn('[newsletter-oauth] token exchange failed:', error.name);
    return res.status(502).send('Connexion Shopify momentanément indisponible.');
  }
});

// ─── API: NEWSLETTER → SHOPIFY ─────────────────────────
// Abonne l'adresse dans Shopify (Admin API, consentement e-mail + tags). Sans jeton
// Admin ou en cas d'échec, la boutique reçoit l'adresse par e-mail. Le visiteur ne
// voit « inscrit » que si l'un des deux enregistrements a réussi.
// Body: { email }
app.post('/api/newsletter', formLimiter, async (req, res) => {
  try {
    if (String(req.body?.hp_field || '').trim()) return res.json({ ok: true }); // honeypot anti-bot (faux succès)

    const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 200);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'email_invalid' });
    }
    let saved = null, reason = 'application Shopify non configurée';
    const admin = adminClient();
    if (admin) {
      try { saved = await subscribeInShopify(email, admin); }
      catch (e) { reason = e.message; console.warn('[newsletter] shopify failed:', e.message); }
    }
    if (!saved) {
      try { if (await notifyByEmail(email, reason)) saved = 'email'; }
      catch (e) { console.warn('[newsletter] email failed:', e.message); }
    }
    if (process.env.NEWSLETTER_WEBHOOK_URL) {
      try {
        const r = await fetch(process.env.NEWSLETTER_WEBHOOK_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'newsletter', email, saved, ts: new Date().toISOString() }),
        });
        if (r.ok) saved ||= 'webhook';
      } catch (e) { console.warn('[newsletter] webhook failed:', e.message); }
    }
    console.log('[newsletter]', JSON.stringify({ ts: new Date().toISOString(), saved }));
    if (!saved) return res.status(502).json({ error: 'delivery_failed' });
    res.json({ ok: true, saved });
  } catch (err) {
    console.error('[newsletter] error:', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// 404 : sert 404.html avec chrome SSR + status 404 (Vercel route les URL inconnues
// ici via { handle: error } → /api/index.js). Dernier middleware enregistré.
app.use(async (req, res) => {
  await Promise.all([_chromeReady, _navigationReady]);
  res.status(404);
  res.vary('Accept');
  // Agents/outils (pas de text/html annoncé) : corps markdown court + liens de reprise.
  if (!acceptsHtmlExplicitly(req)) return sendMarkdown(res, markdown404(req.path));
  let raw;
  try { raw = fs.readFileSync(path.join(__dirname, 'v3', '404.html'), 'utf8'); }
  catch { return res.status(404).send('Not found'); }
  res.set('Content-Type', 'text/html; charset=utf-8');
  return res.send(injectChrome(raw, '404.html'));   // non-hero → solide
});

// ─── START (only when run directly, not when imported by Vercel) ──
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  Mikado Deco — serveur demarre`);
    console.log(`  http://localhost:${PORT}\n`);
  });
}

module.exports = app;
