require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');                 // natif — vérif HMAC des webhooks Shopify
const rateLimit = require('express-rate-limit');   // rate-limit anti-abus (in-memory, best-effort)

// ─── SHOPIFY STOREFRONT API ────────────────────────────
const SHOPIFY_STORE   = process.env.SHOPIFY_STORE_DOMAIN;    // e.g. mystore.myshopify.com
const SHOPIFY_TOKEN   = process.env.SHOPIFY_STOREFRONT_TOKEN; // public Storefront API token
const SHOPIFY_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10';
const SHOPIFY_URL     = SHOPIFY_STORE
  ? `https://${SHOPIFY_STORE}/api/${SHOPIFY_VERSION}/graphql.json`
  : null;

if (!SHOPIFY_URL || !SHOPIFY_TOKEN) {
  console.warn('Shopify non configure — SHOPIFY_STORE_DOMAIN ou SHOPIFY_STOREFRONT_TOKEN manquant dans .env\n');
}

async function shopifyFetch(query, variables = {}) {
  if (!SHOPIFY_URL) throw new Error('Shopify non configure — verifiez SHOPIFY_STORE_DOMAIN dans .env');
  const res = await fetch(SHOPIFY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify API ${res.status}: ${res.statusText}`);
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors.map(e => e.message).join('; '));
  return data;
}

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
// Pour l'instant : Outdoor (Jardin). Les autres s'ajouteront quand leurs pages sont prêtes.
const FAMILLES_RICHES = { outdoor: 'famille.html', sieges: 'famille-assises.html' };
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
};
function activeForRel(rel) {
  if (!rel) return '';
  if (rel.startsWith('journal/')) return 'Le journal';
  return REL_ACTIVE[rel] || '';
}
function injectChrome(html, rel) {
  if (!_chrome) return html;                 // module pas prêt → repli (page sans chrome SSR, hydratée client)
  const active = activeForRel(rel);          // nav active en SSR (anti-glissement du soulignement)
  // Header solide pré-rendu pour les pages non-hero (anti flash blanc-sur-blanc).
  const headerHtml = isNonHero(rel)
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
// SEO · Fil d'Ariane JSON-LD (BreadcrumbList) reflétant la hiérarchie VISIBLE du
// site : « Accueil › Le catalogue › <page> » (mêmes mots que le H1 /produits.html
// et le repli du fil d'Ariane PDP). Injecté en SSR sur PDP / collection / créateur
// → crawlable sans JS. Dernier maillon = page courante (avec son URL propre).
function breadcrumbTag(name, url) {
  const ld = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Accueil", "item": ORIGIN + "/" },
      { "@type": "ListItem", "position": 2, "name": "Le catalogue", "item": ORIGIN + "/produits.html" },
      { "@type": "ListItem", "position": 3, "name": String(name), "item": url }
    ]
  };
  return '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>';
}
// SEO/SSR · formatage prix miroir de shared.js (euro/priceLabel), fr-BE, 0 décimale.
const euroS = (n) => (n || n === 0)
  ? new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
  : '';
const priceLabelS = (p) => {
  const min = p.priceMin != null ? p.priceMin : p.price;
  const max = p.priceMax != null ? p.priceMax : p.price;
  if (min != null && max != null && max - min > 0.5) return 'À partir de ' + euroS(min);
  return euroS(min);
};
// SEO/SSR · Carte produit rendue CÔTÉ SERVEUR pour les grilles (lot 4). Miroir crawlable
// de productCard (shared.js) : lien média + marque + lien nom + dispo + prix ; SANS le
// bouton « Ajouter au panier » (interactif, posé par le JS). Injectée dans [data-grid] →
// donne à Google des LIENS produit crawlables + du maillage interne (complète le sitemap).
function plpCardSsr(p) {
  const href = p.handle ? '/produit.html?handle=' + encodeURIComponent(p.handle) : '';
  if (!href) return '';
  const avail = p.inStock
    ? '<div class="pcard__avail"><span class="pcard__dot pcard__dot--stock" aria-hidden="true"></span>À voir en boutique</div>'
    : '<div class="pcard__avail"><span class="pcard__dot pcard__dot--order" aria-hidden="true"></span>' + (p.longDelay ? 'Sur commande · délai sur demande' : 'Livraison ' + ogEscape(p.leadTimeLabel || '3-4 semaines')) + '</div>';
  return '<div class="pcard">'
    + '<a class="pcard__media" href="' + href + '" aria-label="' + ogEscape(p.name || '') + '">'
    + (p.image ? '<img class="main" src="' + ogEscape(p.image) + '" alt="' + ogEscape(p.name || '') + '" loading="lazy" decoding="async" />' : '')
    + '</a>'
    + '<div class="pcard__brand">' + ogEscape(p.brand || '') + '</div>'
    + '<div class="pcard__row"><a class="pcard__name" href="' + href + '">' + ogEscape(p.name || '') + '</a></div>'
    + avail
    + '<div class="pcard__price">' + priceLabelS(p) + '</div>'
    + '</div>';
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
    : '<dl class="pdp-specs">' + g.rows.map((r) => '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(String(r[1])) + '</dd></div>').join('') + '</dl>';
  const shown = groups.filter((g) => g.key === 'description' ? !!g.text : g.rows.length > 0);
  if (!shown.length) return '';
  return '<section class="section pdp-section pdp-acc" data-accordion>' + shown.map((g, i) =>
    '<div class="pdp-acc__item"><h2 class="catalogue-head serif pdp-acc__head"><button type="button" class="pdp-acc__btn" id="pdp-acc-btn-' + g.key + '" aria-controls="pdp-acc-panel-' + g.key + '" aria-expanded="' + (i === 0 ? 'true' : 'false') + '"><span class="pdp-acc__label">' + esc(g.label) + '</span><span class="pdp-acc__chevron" aria-hidden="true">▾</span></button></h2>'
    + '<div class="pdp-acc__panel" id="pdp-acc-panel-' + g.key + '" role="region" aria-labelledby="pdp-acc-btn-' + g.key + '"' + (i === 0 ? '' : ' hidden') + '>' + panelBody(g) + '</div></div>'
  ).join('') + '</section>';
}
function pdpSsrBlock(p) {
  const rawImg = p.firstImageRaw || (p.images && p.images[0]) || '';
  const img = rawImg ? rawImg + (rawImg.includes('?') ? '&' : '?') + 'width=1000' : '';
  // Lien créateur si le designer a une page (même règle que produit.html : slug connu)
  // → +maillage interne crawlable vers les 247 pages créateur (2ᵉ levier de l'audit).
  const dslug = p.designer ? slugifyS(p.designer) : '';
  const designerEl = !p.designer ? ''
    : (dslug && getDesigners().some(d => String(d.slug || '').toLowerCase() === dslug))
      ? '<a class="pdp__designer pdp__designer--link" href="/produits.html?designer=' + encodeURIComponent(dslug) + '">' + ogEscape(p.designer) + '</a>'
      : '<span class="pdp__designer">' + ogEscape(p.designer) + '</span>';
  return '<div class="pdp">'
    + '<div class="pdp__gallery"><div class="pdp__main-wrap" style="aspect-ratio:1/1">'
    + (img ? '<img class="pdp__main" src="' + ogEscape(img) + '" alt="' + ogEscape(p.name || '') + '" width="1000" height="1000" fetchpriority="high" decoding="async" />' : '')
    + '</div></div>'
    + '<div class="pdp__info">'
    + (p.brand ? '<span class="pdp__brand">' + ogEscape(p.brand) + '</span>' : '')
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
// Soft-404 → vraie 404 : produit/collection/designer inexistant renvoie le shell avec
// <meta robots noindex> + statut 404 (fini l'indexation Google de pages mortes/dupliquées).
function send404Shell(res, file) {
  res.status(404);
  res.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
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
app.get('/products/:handle', (req, res) => {
  const handle = String(req.params.handle || '');
  res.redirect(301, '/produit.html?handle=' + encodeURIComponent(handle));
});

// ─── Fiche produit : /produit.html?handle=<handle> (B7) ─
app.get('/produit.html', async (req, res) => {
  const handle = req.query.handle;
  if (!handle) return sendProduitTemplate(res);
  try {
    await _chromeReady;
    const product = await getProductByHandle(handle);
    // Miss stable (produit inexistant/dépublié) : on cache aussi le repli pour
    // ne pas ré-invoquer la fonction à chaque bot. (Les erreurs Shopify partent
    // dans le catch ci-dessous, sans cache.)
    if (!product) { return send404Shell(res, PRODUIT_TEMPLATE); }

    const name     = product.name || 'Produit';
    const brand    = product.brand || '';
    const designer = product.designer || '';
    const title = `${name} · Mikado Deco`;
    const description = ogDesc(`${name}${brand ? ' — ' + brand : ''}. `
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
      + '\n' + breadcrumbTag(name, url);
    let out = html.replace('</head>', ldTag + '\n</head>');
    // SSR lot 1 · contenu produit (nom/prix/dispo) à la place du squelette → crawlable sans JS.
    out = out.replace(/<!--PDP-SSR-START-->[\s\S]*?<!--PDP-SSR-END-->/, () => pdpSsrBlock(product));
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
    return sendProduitTemplate(res);
  }
});

// ─── Collection / marque : /collections/<handle> ───────
// Nom + description + image via getCollections() (caché). Image par priorité :
// bandeau de marque statique (BRAND_HEADERS) → image Shopify de la collection →
// og-default. Collection inconnue → template générique inchangé (jamais 500).
app.get('/collections/:handle', async (req, res) => {
  const handle = String(req.params.handle || '').toLowerCase();
  // Page famille riche (Jardin/Outdoor…) : sert le template dédié + chrome SSR.
  if (FAMILLES_RICHES[handle]) {
    try {
      await _chromeReady;
      res.set('Content-Type', 'text/html; charset=utf-8');
      return res.send(injectChrome(fs.readFileSync(path.join(__dirname, 'v3', FAMILLES_RICHES[handle]), 'utf8'), FAMILLES_RICHES[handle]));
    } catch (e) { /* repli sur le template générique ci-dessous */ }
  }
  try {
    await _chromeReady;
    const collections = await getCollections();
    const col = collections.find((c) => c.handle === handle);
    // Miss stable (handle hors catalogue, ex. /collections/all) : repli cachable.
    if (!col) { if (COLLECTION_ALIASES.has(handle)) { ogCache(res); return sendProduitsTemplate(res); } return send404Shell(res, PRODUITS_TEMPLATE); }

    const name = col.name || 'Catalogue';
    const title = `${name} · Mikado Deco`;
    const description = ogDesc(
      col.description && col.description.trim()
        ? col.description
        : `${name} chez Mikado Deco — sélection design. Retrait à Uccle, livraison en Belgique.`
    );
    const image = BRAND_HEADERS.has(handle)
      ? `${ORIGIN}/images/brands/headers/${handle}-1920.jpg`
      : (col.image ? absUrl(col.image) : OG_DEFAULT);
    const url = ORIGIN + '/collections/' + encodeURIComponent(handle);

    let html = renderWithOg(fs.readFileSync(PRODUITS_TEMPLATE, 'utf8'), { title, description, image, url });
    html = html.replace('</head>', breadcrumbTag(name, url) + '\n</head>');
    // SSR lot 2 · H1 + sous-titre = nom/description de la collection (crawlable sans JS ;
    // le script inline vide ces génériques pour les users → zéro régression de flash).
    html = html.replace('<h1 data-plp-title>Le catalogue</h1>', () => '<h1 data-plp-title>' + ogEscape(name) + '</h1>');
    html = html.replace('<p data-plp-sub>Mobilier de design, choisi pièce par pièce.</p>', () => '<p data-plp-sub>' + ogEscape(description) + '</p>');
    // SSR chantier 3 · grille de la collection (catégorie OU marque = collection Shopify) crawlable.
    try {
      const cp = await getCollectionProducts(handle, 24);
      const gi = (cp && cp.items) || [];
      if (gi.length) {
        const cards = gi.map(plpCardSsr).filter(Boolean).join('');
        html = html.replace('<div class="pgrid" data-grid></div>', () => '<div class="pgrid" data-grid data-ssr="1">' + cards + '</div>');
      }
    } catch (e) { console.warn('[coll-grid-ssr]', e.message); }
    html = injectChrome(html, 'produits.html');
    ogCache(res);
    return res.send(html);
  } catch (err) {
    console.warn('[og-collection]', err.message);
    return sendProduitsTemplate(res);
  }
});

// ─── Créateur : /produits.html?designer=<slug> ─────────
// Nom + bio + portrait via designers-data.json (caché). Sans ?designer (ou
// modes catalogue / ?cats= / ?brand=) → template générique. Designer inconnu →
// template générique. ~29 créateurs sans photo → repli og-default.
app.get('/produits.html', async (req, res) => {
  const slug = req.query.designer ? String(req.query.designer).toLowerCase() : '';
  if (!slug) {
    // Catalogue de base (lot 4) : SSR de la 1re page de grille (24 produits) → liens
    // produit crawlables dans le HTML (maillage interne + découverte, complète le sitemap).
    // Le module remplace ensuite la grille (garde data-ssr côté produits.html) : 0 doublon/flash.
    try {
      await _chromeReady;
      const { items } = await getProductsPage(24, null, null, null, null, null);
      let html = fs.readFileSync(PRODUITS_TEMPLATE, 'utf8');
      if (items && items.length) {
        const cards = items.map(plpCardSsr).filter(Boolean).join('');
        html = html.replace('<div class="pgrid" data-grid></div>', () => '<div class="pgrid" data-grid data-ssr="1">' + cards + '</div>');
      }
      html = injectChrome(html, 'produits.html');
      ogCache(res);
      return res.send(html);
    } catch (e) {
      console.warn('[plp-ssr]', e.message);
      return sendProduitsTemplate(res);
    }
  }
  try {
    await _chromeReady;
    const designer = getDesigners().find((d) => String(d.slug || '').toLowerCase() === slug);
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
    html = html.replace('</head>', breadcrumbTag(name, url) + '\n</head>');
    // SSR lot 3 · classe créateur (masque le subhero « Le catalogue » → un seul H1) +
    // hero nom/bio/portrait injecté (crawlable sans JS ; le module le remplace ensuite).
    html = html.replace('<html lang="fr">', '<html lang="fr" class="plp-designer">');
    html = html.replace('<div class="wrap" data-designer-hero></div>', () => '<div class="wrap" data-designer-hero>' + designerHeroSsr(designer) + '</div>');
    // SSR chantier 3 · grille des pièces du créateur (tags designer) crawlable.
    try {
      const dp = await getProductsPage(24, null, designer.tags || [], null, null, null);
      const gi = (dp && dp.items) || [];
      if (gi.length) {
        const cards = gi.map(plpCardSsr).filter(Boolean).join('');
        html = html.replace('<div class="pgrid" data-grid></div>', () => '<div class="pgrid" data-grid data-ssr="1">' + cards + '</div>');
      }
    } catch (e) { console.warn('[designer-grid-ssr]', e.message); }
    html = injectChrome(html, 'produits.html');
    ogCache(res);
    return res.send(html);
  } catch (err) {
    console.warn('[og-designer]', err.message);
    return sendProduitsTemplate(res);
  }
});

// ─── SEO: sitemap dynamique ────────────────────────────
// Remplace l'ancien v3/sitemap.xml statique (~24 URLs, sans produits) par un
// sitemap généré : toutes les fiches produit (walk paginé, getProducts() étant
// plafonné à 250) + collections + créateurs indexables + articles + pages
// statiques. URLs absolues et canoniques (aucun paramètre de filtre, seulement
// ?handle= et ?designer=). Caché 6 h. Routé vers la fonction dans vercel.json.
app.get('/sitemap.xml', async (req, res) => {
  try {
    const xml = await cached('sitemap:xml', async () => {
      const urls = [];
      const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const add = (loc, priority) => urls.push(`  <url><loc>${esc(loc)}</loc><priority>${priority}</priority></url>`);

      // a) Pages statiques
      const STATIC = [
        ['/', '1.0'], ['/produits.html', '0.9'], ['/marques.html', '0.8'],
        ['/designers.html', '0.7'], ['/materiaux.html', '0.7'], ['/selection.html', '0.6'],
        ['/studio.html', '0.6'], ['/rendez-vous.html', '0.7'], ['/contact.html', '0.6'],
        ['/journal.html', '0.6'], ['/nuancier-fermob.html', '0.6'],
        ['/mentions-legales.html', '0.3'], ['/conditions-generales-de-vente.html', '0.3'],
        ['/politique-et-vie-privee.html', '0.3'], ['/politique-cookies.html', '0.3'],
      ];
      STATIC.forEach(([p, pr]) => add(ORIGIN + p, pr));

      // b) TOUTES les fiches produit — walk paginé (getProducts() plafonné à 250)
      let after = null;
      for (let i = 0; i < 60; i++) { // garde-fou
        const { items, pageInfo } = await getProductsPage(100, after, null, null);
        (items || []).forEach((prod) => {
          if (prod.handle) add(ORIGIN + '/produit.html?handle=' + encodeURIComponent(prod.handle), '0.8');
        });
        if (!pageInfo || !pageInfo.hasNextPage) break;
        after = pageInfo.endCursor;
      }

      // c) Collections
      (await getCollections()).forEach((c) => {
        if (c.handle) add(ORIGIN + '/collections/' + encodeURIComponent(c.handle), '0.6');
      });

      // d) Créateurs — uniquement les indexables (champ `hidden` dans
      //    designers-data.json) pour éviter le thin content / les fiches masquées.
      getDesigners().forEach((d) => {
        if (d && d.slug && !d.hidden) add(ORIGIN + '/produits.html?designer=' + encodeURIComponent(d.slug), '0.5');
      });

      // e) Articles du journal (HTML pré-rendus)
      try {
        fs.readdirSync(path.join(__dirname, 'v3', 'journal'))
          .filter((f) => f.endsWith('.html'))
          .forEach((f) => add(ORIGIN + '/journal/' + f, '0.5'));
      } catch (e) { /* dossier absent du bundle → includeFiles v3/journal/** */ }

      return `<?xml version="1.0" encoding="UTF-8"?>\n`
           + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
           + urls.join('\n') + `\n</urlset>\n`;
    }, 6 * 60 * 60 * 1000); // cache 6 h

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
    return res.send(xml);
  } catch (err) {
    console.warn('[sitemap]', err.message);
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
function resolveSsrRel(p) {
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
  await _chromeReady;
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
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=0, must-revalidate');
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
const PRODUCT_CARD_FIELDS = `
  fragment ProductCardFields on Product {
    id
    handle
    title
    vendor
    productType
    description
    tags
    availableForSale
    totalInventory
    collections(first: 20) {
      edges { node { handle } }
    }
    featuredImage { url altText }
    images(first: 8) {
      edges { node { url altText } }
    }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    compareAtPriceRange { minVariantPrice { amount currencyCode } }
    variants(first: 250) {
      edges {
        node {
          id
          title
          price { amount currencyCode }
          compareAtPrice { amount }
          availableForSale
          selectedOptions { name value }
          image { url altText }
        }
      }
    }
    metafields(identifiers: [
      { namespace: "custom", key: "designer" }
      { namespace: "custom", key: "year" }
      { namespace: "custom", key: "material" }
      { namespace: "custom", key: "dimensions" }
      { namespace: "custom", key: "lead_time" }
      { namespace: "custom", key: "subcategory" }
    ]) {
      key
      value
    }
  }
`;

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys = BEST_SELLING) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey) {
      pageInfo { hasNextPage endCursor }
      edges {
        cursor
        node { ...ProductCardFields }
      }
    }
  }
  ${PRODUCT_CARD_FIELDS}
`;

// ─── SHOPIFY: SEARCH QUERY (page « tous les résultats » /produits.html?q=) ──
// Recherche plein-texte NATIVE Shopify (tolérante aux fautes, préfixe sur le
// dernier mot). Réutilise EXACTEMENT le fragment ProductCardFields → mapProduct
// lit les mêmes champs que pour le catalogue. `search.pageInfo.endCursor` est un
// vrai curseur Shopify → repassé tel quel en ?cursor= par le front (transparent).
const SEARCH_QUERY = `
  query Search($q: String!, $first: Int!, $after: String) {
    search(query: $q, first: $first, after: $after,
           types: [PRODUCT], prefix: LAST, unavailableProducts: HIDE) {
      edges { node { ... on Product { ...ProductCardFields } } }
      pageInfo { hasNextPage endCursor }
    }
  }
  ${PRODUCT_CARD_FIELDS}
`;

// Filet de sécurité de la page ?q= : `search` (plein-texte) est parfois MOINS
// tolérant aux fautes que `predictiveSearch` (ex. transposition « fermbo » →
// « fermob » : l'overlay matche, `search` renvoie 0). Quand `search` rend une 1re
// page VIDE, on récupère par ID EXACT (nodes) les produits que l'overlay a su
// matcher → la page de résultats n'est jamais « Aucun résultat » sur une faute que
// l'overlay a corrigée (cohérence overlay ↔ page). Réutilise ProductCardFields
// → cartes complètes. (PREDICTIVE_QUERY est défini plus bas, avec la route.)
const SEARCH_FALLBACK_QUERY = `
  query SearchFallback($ids: [ID!]!) {
    nodes(ids: $ids) { ... on Product { ...ProductCardFields } }
  }
  ${PRODUCT_CARD_FIELDS}
`;

// Boutique-de-quartier delivery promise: a single, honest baseline applies
// to anything that has to be ordered from a supplier (which is most of the
// catalog). Items physically in stock at the boutique are flagged via the
// Shopify inventory and shipped fast. Anything genuinely outside this
// promise (Fermob peak season, Kriptonite, Charolles, Treku, etc.) gets a
// `delai-long` product tag in Shopify → we fall back to a generic
// "délai sur demande" line and confirm by mail/phone after the order.
const DELIVERY_DEFAULT = '3-4 semaines';
const DELIVERY_LONG    = 'délai sur demande';

// Map fine-grained Shopify product types (Fermob/HAY use FR labels) to the
// 6 top-level frontend categories. Anything unmatched falls through to "objets".
const CATEGORY_MAP = {
  assises:    ['chaise', 'chaise haute', 'fauteuil', 'fauteuil à bascule', 'banc', 'tabouret', 'pouf', 'repose-pieds'],
  tables:     ['table', 'table basse', 'table à rallonge'],
  luminaires: ['applique', 'lampadaire', 'lampe baladeuse', 'lampe de bureau', 'lampe de chevet', 'lampe de table', 'lampe à pince', 'pied de lampe'],
  rangements: ['caisse de rangement', 'patère'],
  exterieur:  ['accessoires de grill extérieur', 'housse de protection', 'jardinière'],
};
const TYPE_TO_CATEGORY = Object.entries(CATEGORY_MAP).reduce((acc, [cat, types]) => {
  types.forEach(t => { acc[t] = cat; });
  return acc;
}, {});

// Shopify's CDN resizes + reformats images on the fly via URL params, but
// does NOTHING by default: it hands us the full-res original. For product
// CARDS (1:1, rendered ≈300px CSS / 600px retina) that's megabytes wasted.
// shopifyResize() appends `width=<w>&format=webp` so the CDN returns a
// card-sized WebP instead. Two gotchas baked in here:
//   1. `format=webp` is REQUIRED — `width=` alone still serves JPEG.
//   2. These URLs already carry a `?v=…` cache-buster, so we must join with
//      `&` when a query already exists (`?` otherwise), never blindly with `?`.
// Only cdn.shopify.com URLs are touched; local /images/… assets pass through
// untouched. The PDP gallery (images[]) + variant images resize to
// PDP_IMAGE_WIDTH, and the gallery thumbnail strip (thumbs[]) to PDP_THUMB_WIDTH
// — the most-visited page no longer ships multi-MB originals.
function shopifyResize(url, width) {
  if (!url || typeof url !== 'string' || !url.includes('cdn.shopify.com')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}width=${width}&format=webp`;
}

// Target width (px) for the 1:1 product-card thumbnail. ~300px CSS box on the
// PLP/home grids, doubled for retina. Bumping this is the single knob for card
// image sharpness vs. weight.
const CARD_IMAGE_WIDTH = 600;

// PDP gallery widths. PDP_IMAGE_WIDTH = the DEFAULT (src) width of the main
// product image; the front layers a srcset on top (800/1280/2048w) so large
// retina desktops stay sharp and phones stay light — this 1400px value is just
// the no-srcset fallback. Gallery images[] AND variant images resize to it (the
// front's URL matching strips the query, so any width still matches).
// PDP_THUMB_WIDTH = the 74px thumbnail strip under the main (×~3 for retina).
const PDP_IMAGE_WIDTH = 1400;
const PDP_THUMB_WIDTH = 240;

function mapProduct(node, opts = {}) {
  // `full` adds PDP-only fields (gallery thumbs[]) that list endpoints don't read,
  // so PLP/home/collection payloads stay lean. firstImageRaw stays ungated (1 url).
  const full = opts.full === true;
  const meta = {};
  (node.metafields || []).filter(Boolean).forEach(m => { if (m) meta[m.key] = m.value; });
  const variant = node.variants.edges[0]?.node;
  // `price` is the first variant's price (what gets stored in the cart when
  // adding from a product card). `priceMin` / `priceMax` come from Shopify's
  // priceRange and cover every variant. The front-end shows "À partir de"
  // when priceMin < priceMax.
  const price    = parseFloat(variant?.price?.amount || node.priceRange.minVariantPrice.amount);
  const priceMin = parseFloat(node.priceRange.minVariantPrice.amount);
  const priceMax = parseFloat(node.priceRange.maxVariantPrice?.amount || node.priceRange.minVariantPrice.amount);
  const _caMin = parseFloat(node.compareAtPriceRange?.minVariantPrice?.amount || 0);
  const compareAt = _caMin > priceMin + 0.5 ? _caMin : null;
  // Tags: use "badge:nouveau", "badge:limite", "badge:bestseller", "featured" conventions
  const badgeTag = node.tags.find(t => t.startsWith('badge:'))?.replace('badge:', '') || null;
  const rawType  = (node.productType || '').toLowerCase().trim();
  return {
    id:          node.id,
    handle:      node.handle || '',
    variantId:   variant?.id || null,
    name:        node.title,
    brand:       node.vendor || '',
    designer:    meta.designer    || '',
    year:        meta.year        ? parseInt(meta.year) : null,
    category:    TYPE_TO_CATEGORY[rawType] || 'objets',
    productType: rawType,
    subcategory: meta.subcategory || node.tags.find(t => t.startsWith('sub:'))?.replace('sub:', '') || '',
    material:    meta.material    || meta.materiaux || '',
    dimensions:  meta.dimensions  || '',
    // Caractéristiques PDP additionnelles (métafields custom.* — vides tant que
    // l'importer Shopify n'a pas créé+rempli les définitions ; lues seulement par
    // PRODUCT_QUERY → s'affichent toutes seules une fois remplies, sans déploiement).
    usage:       meta.usage       || '',
    entretien:   meta.entretien   || '',
    origin:      meta.origin      || '',
    weight:      meta.weight      || '',
    warranty:    meta.warranty    || '',
    lightingType:            meta.lighting_type            || '',
    lightSourceType:         meta.light_source_type         || '',
    ledType:                 meta.led_type                  || '',
    power:                   meta.power_w                   || '',
    voltage:                 meta.voltage_v                 || '',
    colorTemperature:        meta.color_temperature_k       || '',
    dimming:                 meta.dimming                   || '',
    batteryRuntime:          meta.battery_runtime           || '',
    chargingTime:            meta.charging_time             || '',
    cableDetails:            meta.cable_details             || '',
    ipRating:                meta.ip_rating                 || '',
    safetyClass:             meta.safety_class              || '',
    energyLabel:             meta.energy_label              || '',
    lightSourceReplaceable:  meta.light_source_replaceable  || '',
    constructionMaterials:   meta.construction_materials    || '',
    infosElectriques:        meta.infos_electriques          || '',
    price,
    priceMin,
    priceMax,
    compareAt,
    // Availability badge — "À voir en boutique" when the article is
    // physically present (regardless of finish/colour — it's an invitation
    // to come see the model, not a real-time stock count). Anything else
    // ships from the supplier under the standard promise.
    inStock:     (typeof node.totalInventory === 'number') && node.totalInventory > 0,
    longDelay:   node.tags.some(t => /^delai[-_ ]?long$/i.test(t)),
    leadTimeLabel: node.tags.some(t => /^delai[-_ ]?long$/i.test(t)) ? DELIVERY_LONG : DELIVERY_DEFAULT,
    // Raw Shopify tags exposed so the front can react to product flags
    // (e.g. `delai-long`, `badge:nouveau`) without an extra API.
    tags:        node.tags || [],
    // Shopify collection handles this product belongs to. Lets the front
    // render true collection pages (Mobilier d'extérieur…) instead of
    // tag-filtered catalog views.
    collections: (node.collections?.edges || []).map(e => e?.node?.handle).filter(Boolean),
    // (kept for backward compat with the PDP metafield — separate from brand lead-time)
    leadTime:    meta.lead_time   || '',
    description: node.description || '',
    // Card thumbnail → card-width WebP. The full-res original still feeds the
    // PDP through images[]/variant images below (left untouched on purpose).
    image:       shopifyResize(node.featuredImage?.url || node.images?.edges?.[0]?.node?.url || '', CARD_IMAGE_WIDTH),
    // image2 = first image that isn't the featured one — used for on-hover swap.
    // Dedup runs on the RAW urls; only the chosen url is resized afterwards.
    image2:      (() => {
      const featured = node.featuredImage?.url;
      const imgs = (node.images?.edges || []).map(e => e?.node?.url).filter(Boolean);
      const second = imgs.find(u => u !== featured) || imgs[1] || null;
      return second ? shopifyResize(second, CARD_IMAGE_WIDTH) : null;
    })(),
    // images = ordered list for the PDP gallery main image — resized webp. Stays
    // index-parallel to thumbs[] below (same source/order/filter) so the front
    // maps a clicked thumbnail back to its full-width image by index.
    images:      (node.images?.edges || []).map(e => shopifyResize(e?.node?.url, PDP_IMAGE_WIDTH)).filter(Boolean),
    // thumbs[] (gallery strip, ~8 urls/produit) n'est lu que par la PDP → gated
    // derrière `full` pour ne pas alourdir les réponses liste (PLP/accueil/collections).
    ...(full ? { thumbs: (node.images?.edges || []).map(e => shopifyResize(e?.node?.url, PDP_THUMB_WIDTH)).filter(Boolean) } : {}),
    // firstImageRaw = première image NON redimensionnée (1 url, ungated). La route
    // SSR OG/JSON-LD s'en sert : elle veut un JPEG (scrapers sociaux gèrent mal le
    // WebP en og:image) à sa propre largeur — découplé de images[] (webp galerie).
    firstImageRaw: (node.images?.edges?.[0]?.node?.url) || '',
    // variants = all variants with their selected options, used by the PDP variant picker.
    // Variant image resized to PDP_IMAGE_WIDTH — SAME width as the gallery, so the
    // front's URL matching (active thumb / variant switch) keeps resolving.
    variants:    (node.variants?.edges || []).map(e => e?.node).filter(Boolean).map(v => ({
      id: v.id,
      title: v.title,
      sku: v.sku || '',
      price: parseFloat(v.price?.amount),
      compareAtPrice: parseFloat(v.compareAtPrice?.amount) || null,
      available: v.availableForSale,
      // Vrai stock disponible (Storefront) — distinct de availableForSale qui reste
      // true en oversell (inventoryPolicy: CONTINUE). null si le scope ne l'expose pas.
      qty: v.quantityAvailable ?? null,
      options: (v.selectedOptions || []).map(o => ({ name: o.name, value: o.value })),
      image: shopifyResize(v.image?.url || null, PDP_IMAGE_WIDTH),
    })),
    badge:       badgeTag,
    available:   node.availableForSale && (variant?.availableForSale ?? true),
    featured:    node.tags.some(t => t.toLowerCase() === 'featured'),
  };
}

// Maps ONE product reference (from a Search & Discovery recommendation
// metafield) to the card shape productCard() expects. Lighter than mapProduct:
// only the fields a card renders (image resized to card width, price range,
// first-variant id for add-to-cart, availability). The relations themselves
// live in Shopify — nothing here is hardcoded.
function mapProductRef(n) {
  if (!n) return null;
  const v = n.variants?.nodes?.[0];
  const tags = n.tags || [];
  const longDelay = tags.some(t => /^delai[-_ ]?long$/i.test(t));
  const featured = n.featuredImage?.url;
  const imgs = (n.images?.nodes || []).map(i => i?.url).filter(Boolean);
  const second = imgs.find(u => u !== featured) || imgs[1] || null;
  const priceMin = parseFloat(n.priceRange?.minVariantPrice?.amount ?? v?.price?.amount ?? 0);
  const priceMax = parseFloat(n.priceRange?.maxVariantPrice?.amount ?? priceMin);
  const _caMinR = parseFloat(n.compareAtPriceRange?.minVariantPrice?.amount || 0);
  const compareAt = _caMinR > priceMin + 0.5 ? _caMinR : null;
  // Parité visuelle avec les cartes du catalogue : on émet les MÊMES champs que
  // productCard lit via mapProduct — disponibilité/délai HONNÊTES (longDelay /
  // leadTimeLabel, sinon un article delai-long afficherait à tort « Livraison
  // 3-4 semaines »), image de survol (image2) et badge éditorial. Seul le badge
  // « X finitions » est omis : le calculer imposerait variants(first:250) ×
  // jusqu'à 24 références, un coût Storefront disproportionné pour cette section.
  return {
    id:        n.id,
    handle:    n.handle || '',
    variantId: v?.id || null,
    name:      n.title,
    brand:     n.vendor || '',
    price:     parseFloat(v?.price?.amount ?? priceMin),
    priceMin,
    priceMax,
    compareAt,
    image:     shopifyResize(featured || '', CARD_IMAGE_WIDTH),
    image2:    second ? shopifyResize(second, CARD_IMAGE_WIDTH) : null,
    badge:     tags.find(t => t.startsWith('badge:'))?.replace('badge:', '') || null,
    inStock:   (typeof n.totalInventory === 'number') && n.totalInventory > 0,
    longDelay,
    leadTimeLabel: longDelay ? DELIVERY_LONG : DELIVERY_DEFAULT,
    available: n.availableForSale && (v?.availableForSale ?? true),
  };
}

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
    try {
      const match = (await getActiveBrands()).find((b) => b.slug === brandSlug);
      if (match) vendorClause = `vendor:"${match.name.replace(/["\\]/g, '')}"`;
    } catch (e) { /* résolution impossible → pas de filtre marque (repli) */ }
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
const VENDORS_QUERY = `
  query GetVendors($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges { node { vendor } }
      pageInfo { hasNextPage endCursor }
    }
  }`;

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
const COLLECTIONS_QUERY = `
  query GetCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          image { url altText }
          metafields(identifiers: [
            { namespace: "custom", key: "country" }
            { namespace: "custom", key: "city" }
            { namespace: "custom", key: "founded" }
            { namespace: "custom", key: "website" }
            { namespace: "custom", key: "tagline" }
            { namespace: "custom", key: "color" }
            { namespace: "custom", key: "featured" }
          ]) {
            key
            value
          }
        }
      }
    }
  }
`;

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
    website:     meta.website   || '',
    image:       node.image?.url || null,
    color:       meta.color     || '#d4c5b0',
    featured:    meta.featured  === 'true',
    order:       index,
  };
}

async function getCollections() {
  return cached('collections', async () => {
    // Shopify shop currently has 147 collections; 250 leaves headroom
    // without needing pagination.
    const data = await shopifyFetch(COLLECTIONS_QUERY, { first: 250 });
    return data.collections.edges
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
const PREDICTIVE_QUERY = `
  query Predictive($q: String!) {
    predictiveSearch(query: $q, limit: 8, limitScope: EACH,
                     types: [PRODUCT, COLLECTION],
                     unavailableProducts: HIDE) {
      products {
        id handle title vendor productType
        featuredImage { url altText }
        priceRange { minVariantPrice { amount currencyCode } }
      }
      collections { id handle title }
    }
  }
`;

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
    res.set('Cache-Control', 'public, max-age=60');
    res.json(data);
  } catch (err) {
    console.error('Predictive error:', err.message);
    res.status(500).json({ error: 'Recherche indisponible.' });
  }
});

// ─── SHOPIFY: MAIN MENU QUERY ──────────────────────────
// Drives the site nav top-level + the Mobilier mega menu sub-items
// + the Marques dropdown. Handle "main-menu" is the default Shopify
// "Menu principal" (Online Store → Navigation). Cyril edits libellés
// / ordre / sub-items from the Shopify admin; the site picks it up
// at the next /api/menu cache refresh (5 min TTL).
const MENU_QUERY = `
  query GetMainMenu {
    menu(handle: "main-menu") {
      items {
        title
        url
        items {
          title
          url
          items {
            title
            url
          }
        }
      }
    }
  }
`;

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
const COLLECTION_PRODUCTS_QUERY = `
  query GetCollectionProducts($handle: String!, $first: Int!, $after: String, $filters: [ProductFilter!]) {
    collection(handle: $handle) {
      title
      description
      image { url altText }
      products(first: $first, after: $after, filters: $filters) {
        pageInfo { hasNextPage endCursor }
        edges {
          cursor
          node {
            id
            handle
            title
            vendor
            productType
            description
            tags
            availableForSale
            totalInventory
            collections(first: 20) { edges { node { handle } } }
            featuredImage { url altText }
            images(first: 8) { edges { node { url altText } } }
            priceRange {
              minVariantPrice { amount currencyCode }
              maxVariantPrice { amount currencyCode }
            }
            compareAtPriceRange { minVariantPrice { amount currencyCode } }
            variants(first: 250) {
              edges {
                node {
                  id
                  title
                  price { amount currencyCode }
                  compareAtPrice { amount }
                  availableForSale
                  selectedOptions { name value }
                  image { url altText }
                }
              }
            }
            metafields(identifiers: [
              { namespace: "custom", key: "designer" }
              { namespace: "custom", key: "year" }
              { namespace: "custom", key: "material" }
              { namespace: "custom", key: "dimensions" }
              { namespace: "custom", key: "lead_time" }
              { namespace: "custom", key: "subcategory" }
            ]) { key value }
          }
        }
      }
    }
  }
`;

async function getCollectionProducts(handle, first, after, tag) {
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
      pageInfo: c.products.pageInfo,
    };
  });
}

// ─── SHOPIFY: SINGLE PRODUCT BY HANDLE ─────────────────
// Used by the PDP at /produit?handle=<h>. Before this endpoint the
// PDP could only render products from /api/products (capped at 250)
// — anything beyond the cap rendered "introuvable". This query goes
// straight to Shopify by handle, so the catalog cap no longer gates
// individual product pages.
const PRODUCT_QUERY = `
  query GetProduct($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      vendor
      productType
      description
      tags
      availableForSale
      totalInventory
      collections(first: 20) { edges { node { handle } } }
      featuredImage { url altText }
      images(first: 30) { edges { node { url altText } } }
      priceRange {
        minVariantPrice { amount currencyCode }
        maxVariantPrice { amount currencyCode }
      }
      compareAtPriceRange { minVariantPrice { amount currencyCode } }
      variants(first: 250) {
        edges {
          node {
            id
            title
            sku
            price { amount currencyCode }
            compareAtPrice { amount }
            availableForSale
            quantityAvailable
            selectedOptions { name value }
            image { url altText }
          }
        }
      }
      metafields(identifiers: [
        { namespace: "custom", key: "designer" }
        { namespace: "custom", key: "year" }
        { namespace: "custom", key: "material" }
        { namespace: "custom", key: "dimensions" }
        { namespace: "custom", key: "lead_time" }
        { namespace: "custom", key: "subcategory" }
        { namespace: "custom", key: "usage" }
        { namespace: "custom", key: "entretien" }
        { namespace: "custom", key: "origin" }
        { namespace: "custom", key: "weight" }
        { namespace: "custom", key: "warranty" }
        { namespace: "custom", key: "lighting_type" }
        { namespace: "custom", key: "light_source_type" }
        { namespace: "custom", key: "led_type" }
        { namespace: "custom", key: "power_w" }
        { namespace: "custom", key: "voltage_v" }
        { namespace: "custom", key: "color_temperature_k" }
        { namespace: "custom", key: "dimming" }
        { namespace: "custom", key: "battery_runtime" }
        { namespace: "custom", key: "charging_time" }
        { namespace: "custom", key: "cable_details" }
        { namespace: "custom", key: "ip_rating" }
        { namespace: "custom", key: "safety_class" }
        { namespace: "custom", key: "energy_label" }
        { namespace: "custom", key: "light_source_replaceable" }
        { namespace: "custom", key: "construction_materials" }
        { namespace: "custom", key: "materiaux" }
        { namespace: "custom", key: "infos_electriques" }
      ]) { key value }
      # Recommandations gérées côté Shopify (app Search & Discovery), stockées en
      # métafields list.product_reference et lues dynamiquement — rien de hardcodé.
      complementary: metafield(namespace: "shopify--discovery--product_recommendation", key: "complementary_products") {
        references(first: 12) { nodes { ...RecoCard } }
      }
      related: metafield(namespace: "shopify--discovery--product_recommendation", key: "related_products") {
        references(first: 12) { nodes { ...RecoCard } }
      }
    }
  }
  fragment RecoCard on Product {
    id
    handle
    title
    vendor
    availableForSale
    totalInventory
    tags
    featuredImage { url altText }
    images(first: 4) { nodes { url } }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    compareAtPriceRange { minVariantPrice { amount currencyCode } }
    variants(first: 1) { nodes { id availableForSale price { amount } } }
  }
`;

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
app.get('/api/collection/:handle/products', async (req, res) => {
  try {
    const { handle } = req.params;
    const { cursor, limit, tag } = req.query;
    const payload = await getCollectionProducts(handle, limit, cursor, tag);
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
  console.log('Cache cleared via /api/revalidate');
  res.json({ revalidated: true });
});

// ─── SHOPIFY: CART CREATE MUTATION ─────────────────────
const CART_CREATE_MUTATION = `
  mutation CartCreate(
    $lines:      [CartLineInput!]!
    $note:       String
    $attributes: [AttributeInput!]
  ) {
    cartCreate(input: {
      lines:      $lines
      note:       $note
      attributes: $attributes
    }) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ─── SHOPIFY: CART PREVIEW (totals + discount allocations) ─────────
// Same shape as CartCreate, but we ask for cost + discountAllocations so
// the front-end can show Shopify's actual price after automatic discounts
// (e.g. "Buy 5 get 1 free") before the customer hits checkout.
const CART_PREVIEW_MUTATION = `
  mutation CartPreview($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        cost {
          subtotalAmount { amount currencyCode }
          totalAmount    { amount currencyCode }
        }
        discountAllocations {
          discountedAmount { amount currencyCode }
          ... on CartAutomaticDiscountAllocation { title }
          ... on CartCodeDiscountAllocation      { code  }
          ... on CartCustomDiscountAllocation    { title }
        }
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              cost {
                subtotalAmount { amount currencyCode }
                totalAmount    { amount currencyCode }
              }
              discountAllocations {
                discountedAmount { amount currencyCode }
                ... on CartAutomaticDiscountAllocation { title }
                ... on CartCodeDiscountAllocation      { code  }
                ... on CartCustomDiscountAllocation    { title }
              }
              merchandise { ... on ProductVariant { id product { tags } } }
            }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

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
    const variantIds = [...new Set(products.map((p) => p.variantId).filter(Boolean))];
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
    // « Hors promotions » (gid 694454944073) = tout le catalogue MOINS ces tags.
    // Le minimum des remises BXGY (900/1800 €) porte sur CETTE collection, pas
    // sur le total du panier — le front calcule sa barre de progression dessus.
    const GIFT_EXCLUDE_TAGS = new Set(['promo', 'promotion', 'sale', 'promo-siege-ete-2026']);
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

// ─── API: CREATE CART → SHOPIFY CHECKOUT ───────────────
// Body: { items: [{ variantId, qty }], customer: { prenom, nom, email, telephone, projet, message } }
// Returns: { checkoutUrl } — redirect the browser to this URL
app.post('/api/cart/create', cartLimiter, async (req, res) => {
  try {
    const { items, customer } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'La selection est vide.' });
    }

    const lines = items.map(item => ({
      merchandiseId: item.variantId,
      quantity:      Math.max(1, Math.min(10, parseInt(item.qty) || 1)),
      // Ligne cadeau (offre Panton) : marquée par un attribut _gift (préfixe _
      // = masqué au client) — retrouvable dans la commande côté admin.
      ...(item.gift ? { attributes: [{ key: '_gift', value: String(item.gift).slice(0, 40) }] } : {}),
    }));

    // Pass customer context as cart note + attributes
    // (visible in Shopify admin → Orders → Notes / Attributes)
    const noteParts = [];
    if (customer?.prenom || customer?.nom) {
      noteParts.push(`Client: ${[customer.prenom, customer.nom].filter(Boolean).join(' ')}`);
    }
    if (customer?.telephone) noteParts.push(`Tel: ${customer.telephone}`);
    if (customer?.projet)    noteParts.push(`Projet: ${customer.projet}`);
    if (customer?.message)   noteParts.push(`Message: ${customer.message.substring(0, 500)}`);

    const attributes = [];
    if (customer?.prenom)    attributes.push({ key: 'Prenom',    value: customer.prenom });
    if (customer?.nom)       attributes.push({ key: 'Nom',       value: customer.nom });
    if (customer?.email)     attributes.push({ key: 'Email',     value: customer.email });
    if (customer?.telephone) attributes.push({ key: 'Telephone', value: customer.telephone });
    if (customer?.projet)    attributes.push({ key: 'Projet',    value: customer.projet });

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

// ─── API: NEWSLETTER → SHOPIFY ─────────────────────────
// Subscribes an email to the Shopify customer list (tagged "newsletter")
// via the storefront's classic customer form handler. No Admin API needed.
// Body: { email }
app.post('/api/newsletter', formLimiter, async (req, res) => {
  try {
    if (String(req.body?.hp_field || '').trim()) return res.json({ ok: true }); // honeypot anti-bot (faux succès)

    const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 200);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'email_invalid' });
    }
    if (!SHOPIFY_STORE) {
      console.log('[newsletter] (no Shopify configured)', email);
      return res.json({ ok: true });
    }
    // Best-effort: post to Shopify's classic storefront customer form handler.
    // (Reliable customer-list signup needs the Admin API; the storefront form
    // handler is theme/online-store dependent. We never lose the lead: on any
    // failure we still log + optionally forward to a webhook.)
    let shopifyOk = false;
    try {
      const form = new URLSearchParams();
      form.set('form_type', 'customer');
      form.set('utf8', '✓');
      form.set('contact[email]', email);
      form.set('contact[tags]', 'newsletter,v3-footer');
      const r = await fetch(`https://${SHOPIFY_STORE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'mikadodeco-newsletter' },
        body: form.toString(),
        redirect: 'manual',
      });
      shopifyOk = r.status >= 200 && r.status < 400; // 302 = success
      console.log('[newsletter]', JSON.stringify({ ts: new Date().toISOString(), email, shopifyStatus: r.status, shopifyOk }));
    } catch (e) {
      console.warn('[newsletter] shopify post failed:', e.message);
    }

    // Always capture the lead, even if Shopify declined.
    if (process.env.NEWSLETTER_WEBHOOK_URL || process.env.CONTACT_WEBHOOK_URL) {
      try {
        await fetch(process.env.NEWSLETTER_WEBHOOK_URL || process.env.CONTACT_WEBHOOK_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'newsletter', email, shopifyOk, ts: new Date().toISOString() }),
        });
      } catch (e) { console.warn('[newsletter] webhook failed:', e.message); }
    }

    res.json({ ok: true, shopify: shopifyOk });
  } catch (err) {
    console.error('[newsletter] error:', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// 404 : sert 404.html avec chrome SSR + status 404 (Vercel route les URL inconnues
// ici via { handle: error } → /api/index.js). Dernier middleware enregistré.
app.use(async (req, res) => {
  await _chromeReady;
  let raw;
  try { raw = fs.readFileSync(path.join(__dirname, 'v3', '404.html'), 'utf8'); }
  catch { return res.status(404).send('Not found'); }
  res.status(404).set('Content-Type', 'text/html; charset=utf-8');
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
