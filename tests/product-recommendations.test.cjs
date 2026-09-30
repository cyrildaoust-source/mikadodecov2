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
  assert.deepEqual(identityTerms({ name: 'Verre à eau Ripple', brand: 'Ferm Living', productType: 'Verre à eau', tags: ['ripple'], collectionRefs: [{ id: 'glasses', handle: 'verres-a-eau', title: 'Verres à eau' }] }), ['ripple']);
});

test('une relation fonctionnelle automatique exige aussi la même gamme', () => {
  const cushion = card('cushion', { name: 'Coussin Palissade', productType: 'Coussin', recommendationCollectionIds: [collection.id] });
  const generic = card('generic', { name: 'Coussin décoratif', productType: 'Coussin' });
  assert.equal(functionalCompanion(product, cushion, new Set([collection.id])), true);
  assert.equal(functionalCompanion(product, generic, new Set([collection.id])), false);
  assert.equal(functionalCompanion({ ...product, productType: 'Table', name: 'Table Aalto 90A', tags: ['aalto'] }, card('extendable', { name: 'Table à rallonge Aalto 97', productType: 'Table', tags: ['aalto'] }), new Set()), false);
});

test('compléter compose un ensemble de mobilier cohérent, sans mélanger les gammes', () => {
  const table = { ...product, name: 'Table Luxembourg', brand: 'Fermob', productType: 'Table', tags: ['luxembourg'] };
  const chair = card('chair', { name: 'Chaise Luxembourg', brand: 'Fermob', productType: 'Chaise', tags: ['luxembourg'] });
  const armchair = card('armchair', { name: 'Chaise avec accoudoirs Luxembourg', brand: 'Fermob', productType: 'Chaise', tags: ['luxembourg'] });
  const barChair = card('bar-chair', { name: 'Chaise de bar Luxembourg', brand: 'Fermob', productType: 'Chaise de bar', tags: ['luxembourg'] });
  const loungeChair = card('lounge-chair', { name: 'Fauteuil bas Luxembourg', brand: 'Fermob', productType: 'Fauteuil', tags: ['luxembourg'] });
  const unrelated = card('unrelated', { name: 'Chaise Bistro', brand: 'Fermob', productType: 'Chaise', tags: ['bistro'] });
  assert.equal(functionalCompanion(table, chair, new Set()), true);
  assert.equal(functionalCompanion(table, armchair, new Set()), true);
  assert.equal(functionalCompanion(table, barChair, new Set()), false);
  assert.equal(functionalCompanion(table, loungeChair, new Set()), false);
  assert.equal(functionalCompanion(table, unrelated, new Set()), false);
  assert.equal(functionalCompanion(chair, table, new Set()), true);
  const selected = selectProductRecommendations({ product: table, searched: [
    card('bench', { name: 'Banc Luxembourg', brand: 'Fermob', productType: 'Banc', tags: ['luxembourg'] }),
    chair,
    armchair,
  ] });
  assert.deepEqual(selected.complementary.map(item => item.id), ['chair', 'armchair', 'bench']);
});

test('les arts de la table associent les contenants qui servent ensemble', () => {
  const glass = { ...product, name: 'Verre à eau Ripple', brand: 'Ferm Living', productType: 'Verre à eau', tags: ['ripple'] };
  const jug = card('jug', { name: 'Pichet à eau Ripple', brand: 'Ferm Living', productType: 'Pichet à eau', tags: ['ripple'] });
  const otherJug = card('other-jug', { name: 'Pichet Still', brand: 'Ferm Living', productType: 'Pichet à eau', tags: ['still'] });
  assert.equal(functionalCompanion(glass, jug, new Set()), true);
  assert.equal(functionalCompanion(glass, otherJug, new Set()), false);
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
    ['curated-comp', 'curated'], ['cushion', 'range-functional'], ['table', 'range-functional'], ['auto-comp', 'shopify-complementary'],
  ]);
  assert.deepEqual(result.related.map(p => [p.id, p.recommendationSource]), [
    ['curated-related', 'curated'], ['auto-range', 'shopify-same-range'], ['auto-related', 'shopify-related'],
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
