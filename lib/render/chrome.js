// Chrome SSR (header/footer) : injection dans une page, données site embarquées, gabarits de repli.
// Extrait de server.js (phase 1 du plan d'architecture, octobre 2026) — code déplacé, pas réécrit.
const fs = require('fs');
const path = require('path');
const cache = require('../cache');
const { activeForRel, isNonHero } = require('../config');
const { renderPage } = require('./layout');
const { V3_DIR } = require('../paths');
const { getActiveBrands, getMenu, getPromos } = require('../services/catalog');
const { acceptsHtmlExplicitly, markdown404, markdown410, sendMarkdown } = require('./agents');
const { CACHE_CONTROL: REDIRECT_CACHE_CONTROL } = require('../redirections');
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
  // comme `chrome--solid` l'est déjà. Sinon initShell (shell.mjs) l'ajoute trop
  // tard et le contenu `.page` saute de +116px (padding-top) au 1er paint.
  // Tous les templates non-hero ont un <body> nu (vérifié) ; le classList.add
  // côté client devient un no-op idempotent.
  if (isNonHero(rel)) {
    out = out.replace(/<body(\s*)>/i, '<body class="has-topnav">');
  }
  // Données du site (menu, marques, promotions, version) écrites dans la page : le navigateur
  // les lit sans appel réseau (siteData() de site-data.mjs). Idempotent.
  if (!out.includes('id="site-data"')) {
    out = out.replace(/<\/body>/i, () => '<script type="application/json" id="site-data">' + JSON.stringify(siteData()).replace(/</g, '\\u003c') + '</script>\n</body>');
  }
  // Références aux sources front → noms hachés de dist/assets (ADR 0010 ; inactif sans build).
  out = rewriteAssets(out);
  // Nonce de la requête sur chaque script inline exécutable (CSP sans 'unsafe-inline').
  return addNonce(out, requestNonce());
}
function sendTemplate(res, rel) {
  // Gabarit générique (pas de paramètre / introuvable / erreur), rendu par le layout unique puis
  // habillé du chrome. Jamais 500 : en cas d'échec de rendu, un texte brut.
  try {
    res.set('Content-Type', 'text/html; charset=utf-8');
    return res.send(injectChrome(renderPage(rel), rel));
  } catch (e) {
    console.warn('[template]', rel, e.message);
    return res.status(500).type('text/plain').send('Page momentanément indisponible.');
  }
}
const sendProduitTemplate  = (res) => sendTemplate(res, 'produit.html');
const sendProduitsTemplate = (res) => sendTemplate(res, 'produits.html');
// Soft-404 → vraie 404 : produit/collection/designer inexistant renvoie le shell avec
// <meta robots noindex> + statut 404 (fini l'indexation Google de pages mortes/dupliquées).
// Agents (pas de text/html annoncé) : corps markdown court au lieu du shell HTML.
function sendStatusShell(res, status, rel, cacheControl, markdown, fallback) {
  res.status(status);
  res.vary('Accept');
  res.set('Cache-Control', cacheControl);
  if (res.req && !acceptsHtmlExplicitly(res.req)) return sendMarkdown(res, markdown(res.req.path));
  res.set('Content-Type', 'text/html; charset=utf-8');
  try {
    return res.send(injectChrome(renderPage(rel, { robots: 'noindex,follow' }), rel));
  } catch (e) { return res.status(status).send(fallback); }
}
// Court : une fiche remise en ligne (ou une collection republiée) réapparaît en une minute
// — l'edge Vercel n'offre pas de purge par URL, et les 404 ne pèsent rien en trafic.
const send404Shell = (res, rel) => sendStatusShell(res, 404, rel, 'public, s-maxage=60, stale-while-revalidate=600', markdown404, 'Not found');
// Fiche retirée pour de bon (entrée 410 de la table des redirections, ADR 0014) : même shell
// (noindex, chrome, markdown pour les agents) sur le gabarit 410.html, cache de la table.
const sendGoneShell = (res) => sendStatusShell(res, 410, '410.html', REDIRECT_CACHE_CONTROL, markdown410, 'Gone');

module.exports = { chromeReady, injectChrome, send404Shell, sendGoneShell, sendProduitTemplate, sendProduitsTemplate };
