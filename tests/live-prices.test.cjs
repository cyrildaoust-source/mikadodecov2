const { test } = require('node:test');
const assert = require('node:assert/strict');
// Prix vivants des cartes de liste (21 octobre 2026) : une promo terminée dans Shopify ne doit plus s'afficher,
// même si l'index du catalogue n'est pas encore reconstruit.
process.env.SHOPIFY_STORE_DOMAIN = 'live-prices.test'; process.env.SHOPIFY_STOREFRONT_TOKEN = 'test';
const realFetch = global.fetch;
const shop = {
  'gid://shopify/ProductVariant/1': { price: '59.00', compareAtPrice: '59.00', tags: [] },              // promo terminée (Ripple)
  'gid://shopify/ProductVariant/2': { price: '32.00', compareAtPrice: '42.00', tags: ['alignement-concurrent'] }, // promo en cours
  'gid://shopify/ProductVariant/3': { price: '75.00', compareAtPrice: null, tags: ['promotion'] },       // balisée, sans prix barré
};
let calls = 0;
global.fetch = async (url, options) => {
  if (!String(url).includes('live-prices.test')) return realFetch(url, options);
  calls++;
  const { variables } = JSON.parse(options.body);
  return Response.json({ data: { nodes: variables.ids.map((id) => shop[id] ? { id, price: { amount: shop[id].price }, compareAtPrice: shop[id].compareAtPrice ? { amount: shop[id].compareAtPrice } : null, availableForSale: true, product: { tags: shop[id].tags } } : null) } });
};
const { withLivePrices, stillPromoted } = require('../lib/live-prices');
const card = (n, price, compareAt) => ({ handle: 'p' + n, variantId: 'gid://shopify/ProductVariant/' + n, price, compareAt, priceIsExact: true, finishChoices: [{ variantId: 'gid://shopify/ProductVariant/' + n, price, compareAt }] });

test('les cartes prennent le prix et le prix barré actuels de Shopify ; une promo terminée perd son prix barré', async () => {
  const out = await withLivePrices([card(1, 45, 59), card(2, 32, 42)]);
  assert.deepEqual(out.map((c) => [c.handle, c.price, c.compareAt]), [['p1', 59, null], ['p2', 32, 42]]);
  assert.equal(out[0].finishChoices[0].compareAt, null, 'les finitions au survol aussi');
});
test('page Promotions : tri sur toute la liste avant la pagination (balise retirée = fiche retirée ; rien de changé = même liste)', async () => {
  const product = (n) => ({ card: { variantId: 'gid://shopify/ProductVariant/' + n } });
  const list = [product(1), product(2), product(3)];
  assert.deepEqual((await stillPromoted(list)).map((p) => p.card.variantId.slice(-1)), ['2', '3']);
  const promoted = [product(2), product(3)];
  assert.equal(await stillPromoted(promoted), promoted, 'même objet : la mémoire des pages reste valable');
});
test('mémoire de 60 s : pas de nouvel appel pour les mêmes finitions ; panne Shopify = cartes de l’index inchangées', async () => {
  const before = calls; await withLivePrices([card(2, 32, 42)]); assert.equal(calls, before);
  const saved = global.fetch; global.fetch = async () => { throw new Error('panne'); };
  try { const out = await withLivePrices([card(9, 10, 20)]); assert.deepEqual([out[0].price, out[0].compareAt], [10, 20]); } finally { global.fetch = saved; }
});
