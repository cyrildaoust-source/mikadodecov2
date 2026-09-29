const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const { imageIdentity, selectInitialVariant, latestVariantSelection } = require('../v3/product-variant');
const variants = [
  { id: 'gid://shopify/ProductVariant/1', image: 'https://cdn.shopify.com/blue.png?v=1&width=1400' },
  { id: 'gid://shopify/ProductVariant/2', image: 'https://cdn.shopify.com/orange.png?v=2&width=1400' },
];
const coverUrl = 'https://cdn.shopify.com/orange.png?v=2&width=600&format=webp';
test('cover association wins over a stale first-variant default without changing variant order', () => {
  const original = JSON.stringify(variants);
  assert.equal(selectInitialVariant(variants, { coverUrl, defaultId: variants[0].id }), variants[1]);
  assert.equal(JSON.stringify(variants), original);
});
test('valid explicit ID wins, invalid ID falls back to the cover', () => {
  for (const requestedId of ['1', variants[0].id]) assert.equal(selectInitialVariant(variants, { requestedId, coverUrl }), variants[0]);
  assert.equal(selectInitialVariant(variants, { requestedId: '999', coverUrl }), variants[1]);
});
test('ambiguous, absent and unassociated cover use a deterministic existing default', () => {
  const duplicate = [...variants, { id: '3', image: variants[1].image }];
  assert.equal(selectInitialVariant(duplicate, { coverUrl }), variants[0]);
  assert.equal(selectInitialVariant(variants, { coverUrl: '', defaultId: variants[1].id }), variants[1]);
  assert.equal(selectInitialVariant([], { coverUrl }), null);
  assert.equal(selectInitialVariant(variants, { coverUrl: 'https://cdn.shopify.com/other.png' }), variants[0]);
});
test('an unavailable cover or default gives way to the first available variant, unless requested', () => {
  const stock = [{ ...variants[0], available: true }, { ...variants[1], available: false }, { id: 'gid://shopify/ProductVariant/3', available: true }];
  assert.equal(selectInitialVariant(stock, { coverUrl }), stock[0]);
  assert.equal(selectInitialVariant(stock, { coverUrl, fallback: false }), stock[0]);
  assert.equal(selectInitialVariant(stock, { coverUrl: '', defaultId: stock[1].id }), stock[0]);
  assert.equal(selectInitialVariant(stock, { requestedId: '2', coverUrl }), stock[1]);
  const soldOut = stock.map(v => ({ ...v, available: false }));
  assert.equal(selectInitialVariant(soldOut, { coverUrl }), soldOut[1]);
  assert.equal(selectInitialVariant([{ id: '9', availableForSale: false }, { id: '10', availableForSale: true }]).id, '10');
});
test('normalization ignores Shopify delivery transforms, preserves other resource identity', () => {
  assert.equal(imageIdentity({ url: coverUrl }), imageIdentity(variants[1].image));
  assert.notEqual(imageIdentity('https://example.org/image?id=1'), imageIdentity('https://example.org/image?id=2'));
  assert.notEqual(imageIdentity(coverUrl), imageIdentity('https://cdn.shopify.com/orange2.png'));
});
test('the same module loads in the browser and selects the same variant', () => {
  const context = vm.createContext({ URL });
  vm.runInContext(readFileSync(require.resolve('../v3/product-variant'), 'utf8'), context);
  assert.equal(context.MikadoProductVariant.selectInitialVariant(variants, { coverUrl }), variants[1]);
});
test('late image loading cannot overwrite the most recent variant or commit early', async () => {
  const pending = new Map(), committed = [];
  const select = latestVariantSelection(v => new Promise(resolve => pending.set(v.id, resolve)), v => committed.push(v.id));
  const first = select(variants[0]), last = select(variants[1]);
  assert.deepEqual(committed, []);
  pending.get(variants[1].id)(); assert.equal(await last, true);
  pending.get(variants[0].id)(); assert.equal(await first, false);
  assert.deepEqual(committed, [variants[1].id]);
});
test('failed image leaves the entire current selection intact', async () => {
  const committed = [];
  const select = latestVariantSelection(async () => { throw new Error('image unavailable'); }, v => committed.push(v));
  assert.equal(await select(variants[0]), false);
  assert.deepEqual(committed, []);
});
