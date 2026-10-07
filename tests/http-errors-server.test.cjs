const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

// Le vrai serveur (server.js), avec le gestionnaire d'erreurs global branché.
// Un corps JSON invalide fait lever express.json() AVANT toute route : c'est le
// chemin d'erreur le plus simple à déclencher de l'extérieur, et il passait
// auparavant par la réponse par défaut d'Express (HTML brut, pile en dev).
let server, base;
before(async () => {
  process.env.SHOPIFY_STORE_DOMAIN = 'errors.test';
  process.env.SHOPIFY_STOREFRONT_TOKEN = 'test';
  server = require('../server').listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise((r) => server.close(r)); });

test('un corps JSON invalide sur /api/contact donne un 400 { error: "bad_request" } sans cache', async () => {
  const res = await fetch(base + '/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{oups' });
  assert.equal(res.status, 400);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.match(res.headers.get('content-type'), /application\/json/);
  assert.deepEqual(await res.json(), { error: 'bad_request' });
});

test('une URL inconnue reste un 404 (le gestionnaire d’erreurs ne capte pas les 404 normaux)', async () => {
  const res = await fetch(base + '/api/cette-route-n-existe-pas', { headers: { accept: 'text/html' } });
  assert.equal(res.status, 404);
});
