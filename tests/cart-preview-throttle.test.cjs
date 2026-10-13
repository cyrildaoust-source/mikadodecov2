// Aperçu du panier quand Shopify limite le débit (« Throttled ») : 429 + Retry-After, jamais un 500
// (alerte Vercel du 12 octobre 2026 : 657 réponses 500 sur /api/index, toutes « Cart preview error: Throttled »).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const realFetch = global.fetch;
let server, base, mode = 'throttled';
before(async () => {
  process.env.SHOPIFY_STORE_DOMAIN = 'throttle.test';
  process.env.SHOPIFY_STOREFRONT_TOKEN = 'test';
  global.fetch = async (url, options) => {
    if (!String(url).includes('throttle.test')) return realFetch(url, options);
    const { query } = JSON.parse(options.body);
    assert.match(query, /mutation CartCreate|CartPreview/);
    if (mode === 'throttled') return Response.json({ errors: [{ message: 'Throttled', extensions: { code: 'THROTTLED' } }] });
    if (mode === 'broken') return Response.json({ errors: [{ message: 'Variable $lines of type [CartLineInput!]! was provided invalid value' }] });
    return Response.json({ data: { cartCreate: { cart: { checkoutUrl: 'https://throttle.test/c', cost: { subtotalAmount: { amount: '10' }, totalAmount: { amount: '10' } }, discountAllocations: [], lines: { edges: [] } }, userErrors: [] } } });
  };
  server = require('../server').listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { global.fetch = realFetch; await new Promise((r) => server.close(r)); });
const preview = () => realFetch(base + '/api/cart/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ variantId: 'gid://shopify/ProductVariant/1', qty: 1 }] }) });

test('Shopify limite le débit → 429 avec Retry-After, pas de 500 ; le navigateur garde ses totaux locaux', async () => {
  mode = 'throttled';
  const r = await preview();
  assert.equal(r.status, 429);
  assert.equal(r.headers.get('retry-after'), '5');
  assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await r.json(), { error: 'too_many_requests' });
});
test('une vraie erreur reste un 500 en no-store', async () => {
  mode = 'broken';
  const r = await preview();
  assert.equal(r.status, 500);
  assert.equal(r.headers.get('cache-control'), 'no-store');
});
test('quand Shopify répond, l’aperçu revient normalement', async () => {
  mode = 'ok';
  const r = await preview();
  assert.equal(r.status, 200);
  assert.equal((await r.json()).total, 10);
});
