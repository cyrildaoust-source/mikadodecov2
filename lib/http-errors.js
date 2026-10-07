// Gestion des erreurs HTTP — Mikado Deco
// ----------------------------------------
// Deux pièces, toutes deux branchées dans server.js :
//
// Express 5 transmet lui-même les promesses rejetées des handlers à next(err) : plus besoin
// du patch installAsyncErrorForwarding() qu'Express 4 imposait (retiré au passage à la v5).
//
// createErrorHandler({ renderHtml }) — le dernier middleware de l'application.
//    Il journalise une ligne JSON (lib/log.js) puis répond proprement :
//    - JSON `{ error }` pour /api/* ou quand le client préfère application/json ;
//    - sinon la page 500.html habillée du chrome (renderHtml), ou un texte brut
//      si même ce rendu échoue.
//    Le statut vient de `err.status` quand il est légitime (400 d'express.json,
//    413 trop volumineux…), 500 sinon. Le message interne n'est JAMAIS renvoyé
//    au client : il ne vit que dans le log.

const { logEvent, shortStack } = require('./log');


const ERROR_CODES = { 400: 'bad_request', 403: 'forbidden', 404: 'not_found', 413: 'payload_too_large', 415: 'unsupported_media_type', 429: 'too_many_requests' };

function statusOf(error) {
  const candidate = Number(error?.status || error?.statusCode);
  return Number.isInteger(candidate) && candidate >= 400 && candidate < 600 ? candidate : 500;
}

function wantsJson(req) {
  if (String(req.path || req.originalUrl || '').startsWith('/api/')) return true;
  const accept = String(req.headers?.accept || '');
  if (!accept) return false;
  return accept.includes('application/json') && !accept.includes('text/html');
}

function createErrorHandler({ renderHtml, log = logEvent } = {}) {
  // Les 4 paramètres sont obligatoires : c'est à leur nombre qu'Express
  // reconnaît un middleware d'erreur.
  return function errorHandler(err, req, res, next) {
    const status = statusOf(err);
    log(status >= 500 ? 'error' : 'warn', {
      msg: err?.message || String(err),
      status,
      method: req.method,
      path: req.originalUrl || req.url,
      requestId: req.headers?.['x-vercel-id'] || null,
      stack: status >= 500 ? shortStack(err) : undefined,
    });
    if (res.headersSent) return next(err);                 // réponse déjà partie : on laisse Express fermer
    res.status(status).set('Cache-Control', 'no-store');
    if (wantsJson(req)) return res.json({ error: ERROR_CODES[status] || 'server_error' });
    let html = null;
    if (typeof renderHtml === 'function') {
      try { html = renderHtml(status, req); } catch { html = null; }
    }
    if (html) return res.type('html').send(html);
    return res.type('text').send(status >= 500 ? 'Une erreur est survenue. Réessayez dans un instant.' : 'Requête invalide.');
  };
}

module.exports = { createErrorHandler, statusOf, wantsJson };
