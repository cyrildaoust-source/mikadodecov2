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
const { V3_DIR } = require('./lib/paths');
const { PAGES_MANIFEST, PORT } = require('./lib/config');
const { chromeReady, injectChrome } = require('./lib/render/chrome');
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
const TEMPLATE_PATHS = new Set(PAGES_MANIFEST.pages.filter((p) => p.role === 'template' && p.dir !== 'templates').map((p) => '/' + p.file));
const serveStatic = express.static(V3_DIR);
app.use((req, res, next) => (TEMPLATE_PATHS.has(req.path) ? next() : serveStatic(req, res, next)));
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
  try { raw = fs.readFileSync(path.join(V3_DIR, '404.html'), 'utf8'); }
  catch { return res.status(404).send('Not found'); }
  res.set('Content-Type', 'text/html; charset=utf-8');
  return res.send(injectChrome(raw, '404.html'));   // non-hero → solide
});

// ─── Erreurs : dernier middleware (voir lib/http-errors.js) ──
app.use(createErrorHandler({
  renderHtml: () => injectChrome(fs.readFileSync(path.join(V3_DIR, '500.html'), 'utf8'), '500.html'),
}));

module.exports = app;
