const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

// POST /api/cron/catalog-index : fail-closed (401 sans le bon jeton), 503 si Blob n'est pas
// configuré. La construction elle-même (Shopify + Blob) est couverte par les tests du store
// et vérifiée en vrai sur le serveur local avant mise en ligne.
const realFetch = global.fetch;
let server, base;
before(async () => {
  process.env.SHOPIFY_STORE_DOMAIN = 'index-route.test';
  process.env.SHOPIFY_STOREFRONT_TOKEN = 'test';
  process.env.CATALOG_INDEX_SECRET = 'secret-de-test';
  delete process.env.BLOB_READ_WRITE_TOKEN;
  global.fetch = async () => Response.json({ data: {} });
  server = require('../server').listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { global.fetch = realFetch; await new Promise((r) => server.close(r)); });

const post = (headers = {}) => realFetch(base + '/api/cron/catalog-index', { method: 'POST', headers });

test('sans jeton, mauvais jeton ou jeton en query : 401, jamais de construction', async () => {
  for (const headers of [{}, { authorization: 'Bearer faux' }, { authorization: 'secret-de-test' }]) {
    const res = await post(headers);
    assert.equal(res.status, 401, JSON.stringify(headers));
    assert.equal(res.headers.get('cache-control'), 'no-store');
  }
  assert.equal((await realFetch(base + '/api/cron/catalog-index?token=secret-de-test', { method: 'POST' })).status, 401);
});

test('bon jeton mais Blob non configuré : 503 explicite', async () => {
  const res = await post({ authorization: 'Bearer secret-de-test' });
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: 'blob_not_configured' });
});

test('GET /index-catalogue/<inconnu>.json reste un 404 ; /api/health expose la source de l’index', async () => {
  assert.equal((await realFetch(base + '/index-catalogue/zzz.json')).status, 404);
  const health = await (await realFetch(base + '/api/health')).json();
  assert.ok('index' in health);
});

test('Cron Vercel : GET avec Authorization: Bearer <CRON_SECRET> est accepté ; sans jeton, 401 (21 octobre 2026)', async () => {
  process.env.CRON_SECRET = 'cron-de-test';
  try {
    assert.equal((await realFetch(base + '/api/cron/catalog-index')).status, 401);
    const r = await realFetch(base + '/api/cron/catalog-index', { headers: { Authorization: 'Bearer cron-de-test' } });
    assert.notEqual(r.status, 401, 'le jeton du Cron Vercel ouvre la route');
  } finally { delete process.env.CRON_SECRET; }
});
test('vercel.json : la reconstruction de l’index est planifiée toutes les 10 minutes par le Cron Vercel', () => {
  const cfg = require('../vercel.json');
  assert.deepEqual(cfg.crons, [{ path: '/api/cron/catalog-index', schedule: '*/10 * * * *' }]);
});
