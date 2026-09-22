const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeItems, estimateDelivery, getDeliveryEstimate, realProject } = require('../lib/delivery-estimate');
const id = n => `gid://shopify/ProductVariant/${n}`;
const item = (n, qty = 1) => ({ variantId: id(n), qty });
const stock = (n, quantityAvailable, extra = {}) => ({ id: id(n), quantityAvailable, requiresShipping: true, ...extra });
test('short ETA requires enough physical stock for every unit', () => {
  assert.equal(estimateDelivery([item(1, 2)], [stock(1, 2)]).label, '1–2 jours');
  assert.equal(estimateDelivery([item(1, 3)], [stock(1, 2)]).label, '3–4 semaines');
});
test('backorders, negative and unknown inventory never promise immediate availability', () => {
  for (const qty of [0, -3, null, undefined]) {
    assert.equal(estimateDelivery([item(1)], [stock(1, qty, { availableForSale: true })]).label, '3–4 semaines');
  }
});
test('mixed carts and split gift lines use aggregated quantities', () => {
  assert.equal(estimateDelivery([item(1), item(2)], [stock(1, 8), stock(2, 0)]).label, '3–4 semaines');
  assert.equal(estimateDelivery([item(1), { ...item(1), gift: 'offer' }], [stock(1, 1)]).label, '3–4 semaines');
});
test('digital items do not postpone physical delivery', () => {
  assert.equal(estimateDelivery([item(1), item(2)], [stock(1, 1), stock(2, null, { requiresShipping: false })]).label, '1–2 jours');
  assert.equal(estimateDelivery([item(2)], [stock(2, null, { requiresShipping: false })]).label, null);
});
test('invalid or missing variants fail instead of receiving an invented estimate', () => {
  for (const items of [[], [item(1, 0)], [item(1, 100)], [item(1, 1.5)], [{variantId:'invalid'}]]) assert.throws(() => normalizeItems(items));
  assert.throws(() => estimateDelivery([item(1)], [null]));
  assert.equal(normalizeItems([item(1, 12)])[0].qty, 12);
});
test('inventory is fetched freshly and only for the exact variants', async () => {
  let calls = 0;
  const fetch = async (_, { ids }) => { calls++; assert.deepEqual(ids, [id(1)]); return { nodes: [stock(1, calls === 1 ? 2 : 0)] }; };
  assert.equal((await getDeliveryEstimate([item(1)], fetch)).label, '1–2 jours');
  assert.equal((await getDeliveryEstimate([item(1)], fetch)).label, '3–4 semaines');
});
test('old placeholder notes are ignored while real project notes survive', () => {
  assert.equal(realProject('Livraison: À confirmer au paiement'), '');
  assert.equal(realProject('Aménagement salon'), 'Aménagement salon');
});
