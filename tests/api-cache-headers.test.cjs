const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

// vercel.json ne force plus `cache-control: no-store` sur /api/* : chaque endpoint
// pose son propre en-tête. Ce test fige le contrat sur le vrai serveur, avec un
// Shopify simulé : les réponses stables sont cachables à l'edge (s-maxage +
// stale-while-revalidate), les erreurs, les 404 courts et les POST ne le sont pas.
const realFetch = global.fetch;
let server, base;

before(async () => {
  process.env.SHOPIFY_STORE_DOMAIN = 'cache-headers.test';
  process.env.SHOPIFY_STOREFRONT_TOKEN = 'test';
  global.fetch = async (url, options) => {
    assert.equal(new URL(url).hostname, 'cache-headers.test');
    const { query } = JSON.parse(options.body);
    if (/query GetVendors\(/.test(query)) {
      return Response.json({ data: { products: { edges: [{ node: { vendor: 'Vitra' } }, { node: { vendor: 'Muuto' } }], pageInfo: { hasNextPage: false, endCursor: null } } } });
    }
    if (/query GetMainMenu/.test(query)) return Response.json({ data: { menu: { items: [] } } });
    if (/product\(handle:/.test(query)) return Response.json({ data: { product: null } });
    return Response.json({ data: {} });          // tout le reste : forme inattendue → la route échoue
  };
  server = require('../server').listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { global.fetch = realFetch; await new Promise((r) => server.close(r)); });

const cacheOf = async (path, init) => { const res = await realFetch(base + path, init); return { status: res.status, cache: res.headers.get('cache-control') }; };

test('/api/brands : cachable longtemps (les marques changent rarement)', async () => {
  assert.deepEqual(await cacheOf('/api/brands'), { status: 200, cache: 'public, s-maxage=1800, stale-while-revalidate=86400' });
});

test('/api/menu : cachable 5 min quand Shopify répond', async () => {
  assert.deepEqual(await cacheOf('/api/menu'), { status: 200, cache: 'public, s-maxage=300, stale-while-revalidate=3600' });
});

test('/api/product/<handle inconnu> : 404 gardé 60 s à l’edge (pas de ré-invocation à chaque robot)', async () => {
  assert.deepEqual(await cacheOf('/api/product/n-existe-pas'), { status: 404, cache: 'public, s-maxage=60' });
});

test('/api/products : une erreur amont répond 500 en no-store (jamais cachée)', async () => {
  assert.deepEqual(await cacheOf('/api/products?paginated=1&limit=1'), { status: 500, cache: 'no-store' });
});

test('POST /api/cart/preview : no-store explicite', async () => {
  const r = await cacheOf('/api/cart/preview', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: [] }) });
  assert.deepEqual(r, { status: 200, cache: 'no-store' });
});

test('/api/build : no-store (déjà le cas, inchangé)', async () => {
  assert.equal((await cacheOf('/api/build')).cache, 'no-store');
});
