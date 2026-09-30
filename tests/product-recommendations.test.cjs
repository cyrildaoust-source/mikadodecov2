const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const {
  MAX_RECOMMENDATIONS, selectRangeCollections, identityTerms,
  role, functionalCompanion, sameUniverse, universeSearchQueries, sceneSearchQueries,
  selectProductRecommendations,
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
  assert.equal(MAX_RECOMMENDATIONS, 4);
  const html = readFileSync(require.resolve('../v3/produit.html'), 'utf8');
  assert.match(html, />Complétez avec<\/h2>/);
  assert.match(html, />Vous aimerez aussi<\/h2>/);
  assert.doesNotMatch(html, /Ce qui va avec votre achat|Pour compléter vos achats|Dans la même famille|De la même famille/);
});

test('la fiche interroge Storefront pour le même type et le même univers', () => {
  const queries = readFileSync(require.resolve('../lib/shopify/queries'), 'utf8');
  const server = readFileSync(require.resolve('../server'), 'utf8');
  assert.match(queries, /sameType: products\(first: 12, query: \$sameTypeQuery/);
  assert.match(queries, /sameUniverse: products\(first: 16, query: \$sameUniverseQuery/);
  assert.match(server, /sameTypeQuery: universeQueries\.sameType/);
  assert.match(server, /sameUniverseQuery: universeQueries\.sameUniverse/);
  assert.match(server, /universe: toCards/);
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

test('compléter une table compose une scène variée au lieu d’aligner les assises', () => {
  const table = { ...product, name: 'Table Luxembourg', brand: 'Fermob', productType: 'Table', tags: ['luxembourg', 'exterieur'] };
  const chair = card('chair', { name: 'Chaise Luxembourg', brand: 'Fermob', productType: 'Chaise', tags: ['luxembourg'] });
  const armchair = card('armchair', { name: 'Chaise avec accoudoirs Luxembourg', brand: 'Fermob', productType: 'Chaise', tags: ['luxembourg'] });
  const bench = card('bench', { name: 'Banc Luxembourg', brand: 'Fermob', productType: 'Banc', tags: ['luxembourg'] });
  const barChair = card('bar-chair', { name: 'Chaise de bar Luxembourg', brand: 'Fermob', productType: 'Chaise de bar', tags: ['luxembourg'] });
  const loungeChair = card('lounge-chair', { name: 'Fauteuil bas Luxembourg', brand: 'Fermob', productType: 'Fauteuil', tags: ['luxembourg'] });
  const unrelated = card('unrelated', { name: 'Chaise Bistro', brand: 'Fermob', productType: 'Chaise', tags: ['bistro'] });
  assert.equal(functionalCompanion(table, chair, new Set()), true);
  assert.equal(functionalCompanion(table, armchair, new Set()), true);
  assert.equal(functionalCompanion(table, barChair, new Set()), false);
  assert.equal(functionalCompanion(table, loungeChair, new Set()), false);
  assert.equal(functionalCompanion(table, unrelated, new Set()), false);
  assert.equal(functionalCompanion(chair, table, new Set()), true);
  const selected = selectProductRecommendations({
    product: table,
    searched: [bench, chair, armchair],
    scene: {
      seating: [unrelated],
      dishware: [
        card('bowl', { name: 'Bol chromé', brand: 'Pols Potten', productType: 'Bol' }),
        card('plate', { name: 'Assiette Kastehelmi', brand: 'Iittala', productType: 'Assiette' }),
      ],
      drinkware: [card('glass', { name: 'Verre à eau Ripple', brand: 'Ferm Living', productType: 'Verre à eau' })],
      textiles: [card('placemat', { name: 'Set de table Basics', brand: 'Fermob', productType: 'Set de table', tags: ['exterieur'] })],
      lighting: [
        card('lamp-base', { name: 'Pied Déporté Balad', brand: 'Fermob', productType: 'Pied de lampe', tags: ['exterieur'] }),
        card('lamp', { name: 'Lampe baladeuse Balad', brand: 'Fermob', productType: 'Lampe baladeuse', tags: ['exterieur'] }),
      ],
    },
  });
  assert.deepEqual(selected.complementary.map(item => item.id), ['chair', 'plate', 'glass', 'lamp']);
  assert.deepEqual(selected.complementary.map(item => item.recommendationSource), [
    'range-functional', 'scene-composition', 'scene-composition', 'scene-composition',
  ]);
});

test('les recherches de scène sont contextuelles et ne codent aucun produit', () => {
  const outdoor = sceneSearchQueries({ ...product, name: 'Table Luxembourg', productType: 'Table', tags: ['exterieur'] });
  assert.match(outdoor.sceneSeating, /product_type:Chaise/);
  assert.match(outdoor.sceneSeating, /tag:exterieur/);
  assert.match(outdoor.sceneDishware, /product_type:Assiette/);
  assert.match(outdoor.sceneDrinkware, /product_type:"Verre à eau"/);
  assert.match(outdoor.sceneTextiles, /product_type:"Set de table"/);
  assert.match(outdoor.sceneLighting, /tag:exterieur/);
  assert.equal(outdoor.includeTableScene, true);
  assert.equal(outdoor.includeOutdoorLighting, true);
  assert.doesNotMatch(Object.values(outdoor).join(' '), /luxembourg|fermob|gid:\/\/shopify\/Product/);
  const chairQueries = sceneSearchQueries(product);
  assert.equal(chairQueries.includeTableScene, false);
  assert.equal(chairQueries.includeOutdoorLighting, false);
  assert.ok(Object.entries(chairQueries)
    .filter(([, value]) => typeof value === 'string')
    .every(([, query]) => query.includes('__mikado_aucune_scene__')));
});

test('les arts de la table associent les contenants qui servent ensemble', () => {
  const glass = { ...product, name: 'Verre à eau Ripple', brand: 'Ferm Living', productType: 'Verre à eau', tags: ['ripple'] };
  const jug = card('jug', { name: 'Pichet à eau Ripple', brand: 'Ferm Living', productType: 'Pichet à eau', tags: ['ripple'] });
  const otherJug = card('other-jug', { name: 'Pichet Still', brand: 'Ferm Living', productType: 'Pichet à eau', tags: ['still'] });
  assert.equal(functionalCompanion(glass, jug, new Set()), true);
  assert.equal(functionalCompanion(glass, otherJug, new Set()), false);
});

test('le dernier filet rapproche le même type puis le même univers sans produit codé en dur', () => {
  const poster = { ...product, name: 'Affiche 90 ans Artek', brand: 'Artek', productType: 'Affiche', tags: [] };
  const otherPoster = card('poster-2', { name: 'Affiche 80 ans Artek', brand: 'Artek', productType: 'Affiche' });
  const officeChair = { ...product, name: 'Chaise de bureau Rival', brand: 'Artek', productType: 'Chaise de bureau', tags: [] };
  const diningChair = card('chair', { name: 'Chaise 66', brand: 'Artek', productType: 'Chaise' });
  const glass = { ...product, name: 'Verre à liqueur Tutu', brand: 'Ichendorf Milano', productType: 'Verre à liqueur', tags: [] };
  const waterGlass = card('water-glass', { name: 'Verre à eau Milano', brand: 'Ichendorf Milano', productType: 'Verre à eau' });
  assert.equal(sameUniverse(poster, otherPoster), true);
  assert.equal(role({ name: 'Affiche Tabouret 60', productType: 'Affiche' }), 'wall-decor');
  assert.equal(role({ name: 'Guirlande Hoopik', productType: 'Guirlande' }), 'lamp');
  assert.equal(role({ name: 'Essuie de main', productType: 'Essuie de main' }), 'bath-textile');
  assert.equal(role({ name: 'Arrosoir Antila', productType: 'Arrosoir' }), 'garden-accessory');
  assert.equal(sameUniverse(officeChair, diningChair), true);
  assert.equal(sameUniverse(glass, waterGlass), true);
  assert.equal(sameUniverse(poster, diningChair), false);
  assert.equal(sameUniverse(
    { name: 'Outils', productType: 'Accessoire' },
    { name: 'Bouchon à vin', productType: 'Accessoire' },
  ), false);

  const queries = universeSearchQueries(glass);
  assert.match(queries.sameType, /product_type:"Verre à liqueur"/);
  assert.match(queries.sameUniverse, /product_type:"Verre à eau"/);
  assert.doesNotMatch(`${queries.sameType} ${queries.sameUniverse}`, /gid:\/\/shopify\/Product|tutu|milano/i);

  const selected = selectProductRecommendations({
    product: glass,
    universe: [waterGlass],
    automaticRelated: [card('automatic')],
  });
  assert.deepEqual(selected.related.map(item => [item.id, item.recommendationSource]), [
    ['water-glass', 'same-universe'],
    ['automatic', 'shopify-related'],
  ]);

  const shared = card('shared', { productType: 'Verre à eau' });
  const sectionPriority = selectProductRecommendations({
    product: glass,
    universe: [shared],
    automaticComplementary: [shared],
  });
  assert.deepEqual(sectionPriority.complementary.map(item => item.id), ['shared']);
  assert.deepEqual(sectionPriority.related, []);
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
