// Application Express — Mikado Deco
// ----------------------------------
// Assemble les middlewares et les routeurs dans l'ordre qui compte pour Express :
//   1. redirections héritées (/v3/*)
//   2. routes HTML rendues côté serveur (sitemaps, fiche produit, collections,
//      catalogue, pages statiques avec chrome)  → routes/seo.js, routes/pages.js
//   3. fichiers statiques de v3/ (sauf gabarits ; en prod, dist/ est servi avant la fonction)
//   4. CORS + corps JSON (rawBody conservé pour la signature des webhooks)
//   5. API JSON, panier, formulaires                 → routes/api.js, cart.js, forms.js
//   6. 404 (HTML avec chrome, ou markdown pour les agents)
//   7. gestionnaire d'erreurs global                → lib/http-errors.js
// Le code métier vit dans lib/ ; ce fichier ne fait que composer.
require('dotenv').config({ quiet: true });   // dotenv ≥ 17 écrit sinon une ligne « injecting env » à chaque démarrage (bruit dans les logs Vercel)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createErrorHandler } = require('./lib/http-errors');   // Express 5 : les promesses rejetées arrivent d'elles-mêmes au gestionnaire
const { DIST_DIR, V3_DIR } = require('./lib/paths');
const { PAGES_MANIFEST, PORT } = require('./lib/config');
const { hashedAssetsEnabled } = require('./lib/assets');
const { chromeReady, injectChrome } = require('./lib/render/chrome');
const { renderPage } = require('./lib/render/layout');
const { navigationReady } = require('./lib/render/navigation');
const { acceptsHtmlExplicitly, sendMarkdown, markdown404 } = require('./lib/render/agents');
const { requestLogger } = require('./lib/request-log');

const app = express();

// Journal JSON par requête + en-tête Server-Timing (durée totale, appels Shopify) : premier
// middleware, pour que tout ce qui suit soit mesuré. Voir lib/request-log.js.
app.use(requestLogger());

// Vercel place 1 proxy devant l'app → la vraie IP client est dans X-Forwarded-For.
// Sans ça, req.ip = IP du proxy (tous les clients confondus) et express-rate-limit
// lève une erreur de validation. Indispensable pour le rate-limit des formulaires.
app.set('trust proxy', 1);

// The Mikado Deco storefront (v3/) is served at the site root.
// Old /v3/* links 301-redirect to the clean root path for backward-compat.
app.use('/v3', (req, res) => res.redirect(301, req.url && req.url !== '/' ? req.url : '/'));

// ─── Pages rendues côté serveur ───────────────────────────
app.use(require('./routes/seo'));
app.use(require('./routes/pages'));

// ─── Statique, CORS, JSON ─────────────────────────────────
// En production, Vercel sert les fichiers de dist/ (copie de v3/ sans les gabarits) avant
// d'appeler la fonction ; ce middleware vaut donc surtout en local et pour les fichiers
// embarqués dans la fonction. Les gabarits (role: template) ne sont jamais servis bruts :
// ils n'ont de sens que rendus par leur route → 404 avec chrome.
// Après `npm run build` en local, les assets hachés de dist/assets sont servis comme Vercel le fait
// en production (immutable). Sur Vercel, dist/ n'est pas dans la fonction : le CDN s'en charge avant.
if (fs.existsSync(path.join(DIST_DIR, 'assets'))) app.use('/assets', express.static(path.join(DIST_DIR, 'assets'), { immutable: true, maxAge: '1y', index: false }));
const TEMPLATE_PATHS = new Set(PAGES_MANIFEST.pages.filter((p) => p.role === 'template' && p.dir !== 'templates').map((p) => '/' + p.file));
const serveStatic = express.static(V3_DIR);
// Les sources JS/CSS ne sont servies brutes qu'en l'absence de build (dév) : en production, elles
// n'existent que regroupées et hachées dans dist/assets (ADR 0011) → 404 sur /shell.mjs, /styles.css…
const isFrontSource = (p) => /\.(m?js|css)$/.test(p);
app.use((req, res, next) => ((TEMPLATE_PATHS.has(req.path) || (isFrontSource(req.path) && hashedAssetsEnabled())) ? next() : serveStatic(req, res, next)));
app.use(cors({ origin: process.env.BASE_URL || `http://localhost:${PORT}` }));
// Capture le corps brut (req.rawBody) pour la vérification HMAC des webhooks
// Shopify (calculée sur le body brut, pas le JSON parsé). Comportement JSON
// identique pour tous les autres endpoints.
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));

// ─── API ──────────────────────────────────────────────────
app.use(require('./routes/api'));
app.use(require('./routes/cart'));
app.use(require('./routes/forms'));

// ─── 404 : 404.html avec chrome SSR (Vercel route les URL inconnues ici via
// { handle: error } → /api/index.js). Agents sans text/html : markdown court.
app.use(async (req, res) => {
  await Promise.all([chromeReady, navigationReady]);
  res.status(404);
  res.vary('Accept');
  if (!acceptsHtmlExplicitly(req)) return sendMarkdown(res, markdown404(req.path));
  let raw;
  try { raw = renderPage('404.html'); }
  catch { return res.status(404).send('Not found'); }
  res.set('Content-Type', 'text/html; charset=utf-8');
  return res.send(injectChrome(raw, '404.html'));   // non-hero → solide
});

// ─── Erreurs : dernier middleware (voir lib/http-errors.js) ──
app.use(createErrorHandler({
  renderHtml: () => injectChrome(renderPage('500.html'), '500.html'),
}));

module.exports = app;
