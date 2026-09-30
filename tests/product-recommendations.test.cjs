const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const {
  MAX_RECOMMENDATIONS, selectRangeCollections, identityTerms,
  functionalCompanion, selectProductRecommendations,
} = require('../lib/product-recommendations');

const collection = { id: 'gid://shopify/Collection/palissade', handle: 'palissade', title: 'Palissade' };
const product = {
  id: 'origin', name: 'Chaise Palissade', brand: 'HAY', productType: 'Chaise', tags: ['palissade', 'chaise'],
  collectionRefs: [collection, { id: 'brand', handle: 'hay', title: 'HAY' }, { id: 'chairs', handle: 'chaises', title: 'Chaises' }],
};
const card = (id, overrides = {}) => ({
  id, handle: id, name: `Produit ${id}`, brand: 'HAY', productType: 'Table', tags: [],
  image: `/${id}.jpg`, variantId: `variant-${id}`, available: true, ...overrides,
});

test('les deux rubriques gardent la formulation éditoriale validée', () => {
  const html = readFileSync(require.resolve('../v3/produit.html'), 'utf8');
  assert.match(html, />Pour compléter votre achat<\/h2>/);
  assert.match(html, />De la même famille<\/h2>/);
  assert.doesNotMatch(html, /Ce qui va avec votre achat|Vous aimerez aussi/);
});

test('la gamme vient d’une collection ou d’un tag de modèle, jamais de la marque ou de la famille', () => {
  assert.deepEqual(selectRangeCollections(product).map(c => c.handle), ['palissade']);
  assert.deepEqual(identityTerms(product), ['palissade']);
  assert.deepEqual(identityTerms({ name: 'Lampe portable Flowerpot VP9', brand: '&Tradition', productType: 'Lampe de table', tags: ['flowerpot', 'vp9', 'lampe-portable'] }), ['flowerpot', 'vp9']);
  assert.deepEqual(identityTerms({ name: 'Chaise CH24 Soft', brand: 'Carl Hansen & Søn', productType: 'Chaise', tags: ['ch24-soft', 'chaise'] }), ['ch24 soft', 'ch24']);
  assert.deepEqual(identityTerms({ name: 'Banc à manger Toní Bankski', brand: 'Fatboy', productType: 'Banc', tags: ['toni-bankski'] }), ['toni bankski', 'toni', 'bankski']);
});

test('une relation fonctionnelle automatique exige aussi la même gamme', () => {
  const cushion = card('cushion', { name: 'Coussin Palissade', productType: 'Coussin', recommendationCollectionIds: [collection.id] });
  const generic = card('generic', { name: 'Coussin décoratif', productType: 'Coussin' });
  assert.equal(functionalCompanion(product, cushion, new Set([collection.id])), true);
  assert.equal(functionalCompanion(product, generic, new Set([collection.id])), false);
  assert.equal(functionalCompanion({ ...product, productType: 'Table', name: 'Table Aalto 90A', tags: ['aalto'] }, card('extendable', { name: 'Table à rallonge Aalto 97', productType: 'Table', tags: ['aalto'] }), new Set()), false);
});

test('curation, gamme et repli Shopify gardent leur priorité et leur rubrique', () => {
  const curatedComp = card('curated-comp');
  const curatedRelated = card('curated-related', { name: 'Table Palissade', tags: ['palissade'] });
  const cushion = card('cushion', { name: 'Coussin Palissade', productType: 'Coussin', recommendationCollectionIds: [collection.id] });
  const table = card('table', { name: 'Table Palissade', recommendationCollectionIds: [collection.id] });
  const autoComp = card('auto-comp');
  const autoRange = card('auto-range', { name: 'Fauteuil Palissade', tags: ['palissade'] });
  const autoRelated = card('auto-related');
  const result = selectProductRecommendations({
    product,
    curatedComplementary: [curatedComp], curatedRelated: [curatedRelated],
    range: [cushion, table, curatedRelated],
    automaticComplementary: [autoComp], automaticRelated: [autoRelated, autoRange],
  });
  assert.deepEqual(result.complementary.map(p => [p.id, p.recommendationSource]), [
    ['curated-comp', 'curated'], ['cushion', 'range-functional'], ['auto-comp', 'shopify-complementary'],
  ]);
  assert.deepEqual(result.related.map(p => [p.id, p.recommendationSource]), [
    ['curated-related', 'curated'], ['table', 'same-range'], ['auto-range', 'shopify-same-range'], ['auto-related', 'shopify-related'],
  ]);
});

test('indisponibles, produit courant et doublons sont exclus ; chaque rubrique reste bornée', () => {
  const candidates = Array.from({ length: 12 }, (_, index) => card(`p${index}`));
  const result = selectProductRecommendations({
    product,
    curatedComplementary: [card('origin'), card('sold-out', { available: false }), candidates[0], candidates[0], ...candidates.slice(1)],
    curatedRelated: [candidates[0], ...Array.from({ length: 12 }, (_, index) => card(`r${index}`))],
  });
  assert.equal(result.complementary.length, MAX_RECOMMENDATIONS);
  assert.equal(result.related.length, MAX_RECOMMENDATIONS);
  assert.equal(new Set([...result.complementary, ...result.related].map(p => p.id)).size, MAX_RECOMMENDATIONS * 2);
  assert.ok([...result.complementary, ...result.related].every(p => p.available && p.id !== product.id));
});
