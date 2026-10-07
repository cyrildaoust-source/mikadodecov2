// Journal des requêtes + Server-Timing — Mikado Deco
// ---------------------------------------------------
// Un middleware Express (le premier de la chaîne) qui, pour chaque requête :
//  - ouvre un contexte AsyncLocalStorage où lib/shopify/client.js compte ses appels
//    et leur durée (recordShopifyCall) ;
//  - pose l'en-tête `Server-Timing` juste avant l'envoi des en-têtes
//    (`total;dur=…, shopify;dur=…;desc="N appel(s)"`), lisible dans l'onglet Réseau
//    des DevTools sans aucun outil ;
//  - écrit une ligne JSON à la fin (lib/log.js) : méthode, chemin, statut, durée,
//    appels Shopify, identifiant de requête Vercel. Les fichiers statiques servis en
//    local (css, js, images, fonts…) ne sont pas journalisés : sur Vercel ils ne
//    passent pas par la fonction, et en local ils noieraient le journal.
const { AsyncLocalStorage } = require('node:async_hooks');
const { logEvent } = require('./log');

const als = new AsyncLocalStorage();
const STATIC_FILE = /\.(css|js|mjs|map|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|eot|txt)(\?.*)?$/i;

// Appelé par le client Shopify : ne fait rien hors d'une requête (scripts, tests unitaires).
function recordShopifyCall(ms) {
  const store = als.getStore();
  if (store) { store.shopifyCalls++; store.shopifyMs += ms; }
}

function currentTiming() { return als.getStore() || null; }

function serverTimingHeader(store, totalMs) {
  const parts = [`total;dur=${totalMs.toFixed(1)}`];
  if (store.shopifyCalls) parts.push(`shopify;dur=${store.shopifyMs.toFixed(1)};desc="${store.shopifyCalls} appel(s)"`);
  return parts.join(', ');
}

function requestLogger({ log = logEvent, skip = (req) => STATIC_FILE.test(req.path) } = {}) {
  return function requestLog(req, res, next) {
    const t0 = performance.now();
    const store = { shopifyCalls: 0, shopifyMs: 0 };
    als.run(store, () => {
      const writeHead = res.writeHead;
      res.writeHead = function patchedWriteHead(...args) {
        if (!res.headersSent) {
          const existing = res.getHeader('Server-Timing');
          const timing = serverTimingHeader(store, performance.now() - t0);
          res.setHeader('Server-Timing', existing ? `${existing}, ${timing}` : timing);
        }
        return writeHead.apply(this, args);
      };
      res.on('finish', () => {
        if (skip(req)) return;
        log(res.statusCode >= 500 ? 'error' : 'info', {
          msg: 'request',
          method: req.method,
          path: req.originalUrl || req.url,
          status: res.statusCode,
          ms: Math.round(performance.now() - t0),
          shopifyCalls: store.shopifyCalls,
          shopifyMs: Math.round(store.shopifyMs),
          requestId: req.headers['x-vercel-id'] || undefined,
        });
      });
      next();
    });
  };
}

module.exports = { requestLogger, recordShopifyCall, currentTiming, serverTimingHeader };
