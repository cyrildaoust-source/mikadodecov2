// Chrome SSR (header/footer) : injection dans une page, données site embarquées, gabarits de repli.
// Extrait de server.js (phase 1 du plan d'architecture, octobre 2026) — code déplacé, pas réécrit.
const fs = require('fs');
const path = require('path');
const cache = require('../cache');
const { PRODUITS_TEMPLATE, PRODUIT_TEMPLATE, activeForRel, isNonHero } = require('../config');
const { V3_DIR } = require('../paths');
const { getActiveBrands, getMenu, getPromos } = require('../services/catalog');
const { acceptsHtmlExplicitly, markdown404, sendMarkdown } = require('./agents');
const { addNonce } = require('../csp');
const { rewriteAssets } = require('../assets');
const { requestNonce } = require('../request-log');

// ─── CHROME SSR ────────────────────────────────────────
// chrome-template.js est ESM + pur → importable en Node via import() dynamique.
// Chargé une seule fois, mémorisé. Repli gracieux si non prêt (cold start très tôt).
let _chrome = null;
const chromeReady = import('../../v3/chrome-template.js')
  .then((m) => { _chrome = m; })
  .catch((e) => { console.warn('[chrome-ssr] import échoué:', e.message); _chrome = null; });
// ─── Données du site écrites dans chaque page ──────────
// Menu, marques actives, promotions, réglages du méga menu et version : le navigateur
// les lit dans la page au lieu de 5 appels réseau à chaque chargement. Seules les
// valeurs déjà en cache serveur sont écrites ; sur Vercel, une valeur absente est
// préparée pour la page suivante. Le navigateur garde son appel réseau en secours.
const SITE_STATIC = {
  config: JSON.parse(fs.readFileSync(path.join(V3_DIR, 'mega-menu-config.json'), 'utf8')),
  brandsFile: JSON.parse(fs.readFileSync(path.join(V3_DIR, 'mega-menu-brands.json'), 'utf8')),
};
const SITE_CACHED = { menu: ['menu', getMenu], brands: ['brands:active', getActiveBrands], promos: ['promos', getPromos] };
const siteWarmAt = {};
function siteData() {
  const raw = process.env.VERCEL_GIT_COMMIT_SHA || '';
  const data = { build: raw ? raw.slice(0, 7) : 'dev', ...SITE_STATIC };
  const now = Date.now();
  for (const [key, [cacheKey, load]] of Object.entries(SITE_CACHED)) {
    const entry = cache.peek(cacheKey);
    // Au plus 10 min après expiration (les pages elles-mêmes restent 10 min au CDN).
    if (entry && entry.expiry + 10 * 60_000 > now && !(key === 'menu' && !entry.data?.ok)) data[key] = entry.data;
    else if (process.env.VERCEL && now - (siteWarmAt[key] || 0) > 60_000) { siteWarmAt[key] = now; load().catch(() => {}); }
  }
  return data;
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
  if (!out.includes('id="site-data"')) {
    out = out.replace(/<\/body>/i, () => '<script type="application/json" id="site-data">' + JSON.stringify(siteData()).replace(/</g, '\\u003c') + '</script>\n</body>');
  }
  if (!/cormorant-garamond-latin-600/.test(out)) {
    out = out.replace(/<\/head>/i,
      '  <link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/cormorant-garamond-latin-600-normal.woff2">\n</head>');
  }
  // Script d'en-tête commun (remplace les gestionnaires inline interdits par la CSP) :
  //  - feuilles de style chargées en `media="print"` (Typekit) : basculées en `all` une fois
  //    chargées — l'équivalent de l'ancien onload="this.media='all'" ;
  //  - images en erreur avant que shared.js ne soit prêt : mises en file dans window.__imgErrors,
  //    traitées par bindImageFallbacks() (data-fallback="…" remplace onerror="…").
  if (!out.includes('id="mikado-head"')) {
    out = out.replace(/<\/head>/i, () => HEAD_SCRIPT + '\n</head>');
  }
  // Références aux sources front → noms hachés de dist/assets (ADR 0010 ; inactif sans build).
  out = rewriteAssets(out);
  // Nonce de la requête sur chaque script inline exécutable (CSP sans 'unsafe-inline').
  return addNonce(out, requestNonce());
}
const HEAD_SCRIPT = '<script id="mikado-head">(function(){'
  + 'for(var l of document.querySelectorAll(\'link[rel="stylesheet"][media="print"]\')){if(l.sheet){l.media="all"}else{l.addEventListener("load",function(){l.media="all"},{once:true})}}'
  + 'window.__imgErrors=[];document.addEventListener("error",function(e){var t=e.target;if(t&&t.tagName==="IMG"&&t.dataset.fallback){window.__imgErrors.push(t)}},true)'
  + '})()</script>';
function sendTemplate(res, file) {
  // Template générique inchangé (pas de paramètre / introuvable / erreur). Jamais 500.
  // Passe par injectChrome → chrome SSR aussi sur les replis. Synchrone : si _chrome
  // n'est pas encore prêt (tout 1er hit post-cold-start), injectChrome renvoie le
  // HTML brut (repli = comportement actuel, hydraté client) — dégradation acceptée.
  try {
    res.set('Content-Type', 'text/html; charset=utf-8');
    const rel = path.relative(V3_DIR, file); // 'produit.html' / 'produits.html'
    return res.send(injectChrome(fs.readFileSync(file, 'utf8'), rel));
  } catch (e) {
    return res.sendFile(file);
  }
}
const sendProduitTemplate  = (res) => sendTemplate(res, PRODUIT_TEMPLATE);
const sendProduitsTemplate = (res) => sendTemplate(res, PRODUITS_TEMPLATE);
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
    const rel = path.relative(V3_DIR, file);
    const raw = fs.readFileSync(file, 'utf8').replace('</head>', '  <meta name="robots" content="noindex,follow" />\n</head>');
    return res.send(injectChrome(raw, rel));
  } catch (e) { return res.status(404).send('Not found'); }
}

module.exports = { chromeReady, injectChrome, send404Shell, sendProduitTemplate, sendProduitsTemplate };
