const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

// /api/health : l'état de la fonction pour un moniteur externe (phase 5.2).
const realFetch = global.fetch;
let server, base, shopifyDown = false;

before(async () => {
  process.env.SHOPIFY_STORE_DOMAIN = 'health.test';
  process.env.SHOPIFY_STOREFRONT_TOKEN = 'test';
  global.fetch = async (url) => {
    assert.equal(new URL(url).hostname, 'health.test');
    if (shopifyDown) return new Response('', { status: 503 });
    return Response.json({ data: { shop: { name: 'Mikado Deco' } } });
  };
  server = require('../server').listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { global.fetch = realFetch; await new Promise((r) => server.close(r)); });

test('Shopify joignable → 200 ok, avec version, index, cache, jamais caché', async () => {
  const res = await realFetch(base + '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.shopify, 'ok');
  assert.equal(body.build, 'dev');
  assert.equal(typeof body.uptimeS, 'number');
  assert.deepEqual(body.index, { loaded: false });
  assert.equal(typeof body.cache.size, 'number');
  assert.equal(body.cache.max, 500);
});

test('Shopify en panne → 503 degraded, le message est dans la réponse', async () => {
  shopifyDown = true;
  try {
    const res = await realFetch(base + '/api/health');
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.status, 'degraded');
    assert.match(body.shopify, /^down: /);
  } finally { shopifyDown = false; }
});
