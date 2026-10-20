const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeItems, estimateDelivery, getDeliveryEstimate, realProject } = require('../lib/delivery-estimate');
const id = n => `gid://shopify/ProductVariant/${n}`;
const item = (n, qty = 1) => ({ variantId: id(n), qty });
const stock = (n, quantityAvailable, extra = {}) => ({ id: id(n), quantityAvailable, requiresShipping: true, ...extra });
test('short ETA requires enough physical stock for every unit', () => {
  assert.equal(estimateDelivery([item(1, 2)], [stock(1, 2)]).label, '2–3 jours');
  assert.equal(estimateDelivery([item(1, 3)], [stock(1, 2)]).label, '3–4 semaines');
});
test('backorders, negative and unknown inventory never promise immediate availability', () => {
  for (const qty of [0, -3, null, undefined]) {
    assert.equal(estimateDelivery([item(1)], [stock(1, qty, { availableForSale: true })]).label, '3–4 semaines');
  }
});
test('mixed carts and split gift lines use aggregated quantities', () => {
  assert.equal(estimateDelivery([item(1), item(2)], [stock(1, 8), stock(2, 0)]).label, '3–4 semaines');
  assert.equal(estimateDelivery([item(1), item(1)], [stock(1, 1)]).label, '3–4 semaines');
});
test('digital items do not postpone physical delivery', () => {
  assert.equal(estimateDelivery([item(1), item(2)], [stock(1, 1), stock(2, null, { requiresShipping: false })]).label, '2–3 jours');
  assert.equal(estimateDelivery([item(2)], [stock(2, null, { requiresShipping: false })]).label, null);
});
test('invalid or missing variants fail instead of receiving an invented estimate', () => {
  for (const items of [[], [item(1, 0)], [item(1, 100)], [item(1, 1.5)], [{variantId:'invalid'}]]) assert.throws(() => normalizeItems(items), (e) => e.status === 400);
  assert.throws(() => estimateDelivery([item(1)], [null]));
  assert.equal(normalizeItems([item(1, 12)])[0].qty, 12);
});
test('inventory is fetched freshly and only for the exact variants', async () => {
  let calls = 0;
  const fetch = async (_, { ids }) => { calls++; assert.deepEqual(ids, [id(1)]); return { nodes: [stock(1, calls === 1 ? 2 : 0)] }; };
  assert.equal((await getDeliveryEstimate([item(1)], fetch)).label, '2–3 jours');
  assert.equal((await getDeliveryEstimate([item(1)], fetch)).label, '3–4 semaines');
});
test('old placeholder notes are ignored while real project notes survive', () => {
  assert.equal(realProject('Livraison: À confirmer au paiement'), '');
  assert.equal(realProject('Aménagement salon'), 'Aménagement salon');
});

// Délais par règles (ADR 0015) : hors stock, chaque ligne porte le délai de SA fiche ; l'envoi groupé prend le plus long.
const product = (extra = {}) => ({ vendor: 'Marque test', tags: [], collections: { nodes: [] }, ...extra });
test('a line out of stock takes the lead time of its product: metafield exception, delai-long tag, or the default', () => {
  const lines = estimateDelivery([item(1), item(2), item(3)], [
    stock(1, 0, { product: product({ metafield: { value: '8-10 semaines' } }) }),
    stock(2, 0, { product: product({ tags: ['delai-long'] }) }),
    stock(3, 0, { product: product() }),
  ]).lines;
  assert.deepEqual(lines.map(l => l.label), ['8–11 semaines', 'délai sur demande', '3–4 semaines']);
});
test('the grouped shipment announces the longest lead time; stock lines stay 2–3 jours', () => {
  const r = estimateDelivery([item(1), item(2)], [stock(1, 5, { product: product() }), stock(2, 0, { product: product({ metafield: { value: '6 semaines' } }) })]);
  assert.deepEqual([r.label, r.onOrder, r.lines[0].label, r.lines[1].label], ['6–7 semaines', true, '2–3 jours', '6–7 semaines']);
  assert.equal(estimateDelivery([item(1), item(2)], [stock(1, 0, { product: product({ metafield: { value: '2-3 semaines' } }) }), stock(2, 0, { product: product({ tags: ['delai-long'] }) })]).label, 'délai sur demande');
});
test('the stock query also fetches what the lead-time rules need', () => {
  const { VARIANT_STOCK_QUERY } = require('../lib/delivery-estimate');
  for (const part of ['product {', 'vendor', 'tags', 'collections(first: 20)', 'metafield(namespace: "custom", key: "lead_time")']) assert.ok(VARIANT_STOCK_QUERY.includes(part), part);
});

test('le retrait en boutique suit le stock réel de chaque ligne, puis l’article le plus long pour la commande', () => {
  const r = estimateDelivery([item(1), item(2), item(3), item(4)], [
    stock(1, 5, { product: product({ metafield: { value: '8-10 semaines' } }) }),   // en stock : prêt sous 24 h, quoi que dise le métachamp
    stock(2, 0, { product: product({ metafield: { value: '8-10 semaines' } }) }),   // à commander : le même délai que la livraison
    stock(3, 0, { product: product({ tags: ['delai-long'] }) }),                     // sur demande : confirmé après commande
    stock(4, 0, { product: product() }),                                             // règle par défaut : comme la livraison
  ]);
  assert.deepEqual(r.lines.map(l => l.pickup), ['Retrait en boutique : prêt sous 24 h', 'Retrait en boutique : 8–11 semaines', 'Retrait en boutique : délai confirmé après commande', 'Retrait en boutique : 3–4 semaines']);
  assert.deepEqual(r.lines.map(l => l.pickupStatus), ['ready', 'delay', 'tbc', 'delay']);
  assert.equal(r.pickup, 'Retrait en boutique : délai confirmé après commande', 'un délai à confirmer l’emporte');
  assert.equal(r.pickupStatus, 'tbc');
  assert.ok(!('pickupInfo' in r.lines[0]), 'rien d’interne dans la réponse');
  const stocked = estimateDelivery([item(1), item(2)], [stock(1, 5, { product: product() }), stock(2, 0, { product: product({ metafield: { value: '3 semaines' } }) })]);
  assert.equal(stocked.pickup, 'Retrait en boutique : 3–4 semaines', 'identique au délai de livraison de la commande');
  assert.equal(stocked.pickup.replace('Retrait en boutique : ', ''), stocked.label);
  assert.equal(estimateDelivery([item(1)], [stock(1, 2, { product: product() })]).pickup, 'Retrait en boutique : prêt sous 24 h');
});
