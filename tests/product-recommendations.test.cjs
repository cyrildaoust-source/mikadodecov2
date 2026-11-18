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
  // La fiche est lue par lib/services/catalog.js (getProductByHandle) depuis le découpage de server.js.
  const server = readFileSync(require.resolve('../lib/services/catalog'), 'utf8');
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
  assert.deepEqual(identityTerms({ name: 'Patins feutre', brand: 'Artek', productType: 'Accessoire', tags: ['artek', 'aalto', 'protection-sol'] }), ['aalto']);
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
  assert.equal(role({ name: 'Ouvre-bouteille Virgula Divina', productType: 'Ouvre-bouteille' }), 'bar-accessory');
  assert.equal(role({ name: 'Aimant Magnet Dots', productType: 'Aimant' }), 'desk-space');
  assert.equal(role({ name: 'Sous-main Repad', productType: 'Sous-main' }), 'desk-space');
  assert.equal(role({ name: 'Panier Bakkie Lace', productType: 'Panier' }), 'entry-storage');
  assert.equal(role({ name: 'Cartes postales', productType: 'Accessoire', tags: ['papeterie'] }), 'desk-space');
  assert.equal(role({ name: 'Bobèche Nagel', productType: 'Accessoire', tags: ['bobeche'] }), 'candle-holder');
  assert.equal(role({ name: 'Patins feutre', productType: 'Accessoire', tags: ['protection-sol'] }), 'furniture-care');
  assert.equal(sameUniverse(officeChair, diningChair), true);
  assert.equal(sameUniverse(glass, waterGlass), true);
  assert.equal(sameUniverse(
    { name: 'Ouvre-bouteille Virgula Divina', productType: 'Ouvre-bouteille' },
    { name: 'Bouchon à vin Lilly', productType: 'Bouchon à vin' },
  ), true);
  assert.equal(sameUniverse(
    { name: 'Aimant Magnet Dots', productType: 'Aimant' },
    { name: 'Sous-main Repad', productType: 'Sous-main' },
  ), true);
  assert.equal(sameUniverse(
    { name: 'Panier Bakkie Lace', productType: 'Panier' },
    { name: 'Panier Restore', productType: 'Panier de rangement' },
  ), true);
  assert.equal(sameUniverse(poster, diningChair), false);
  assert.equal(sameUniverse(
    { name: 'Outils', productType: 'Accessoire' },
    { name: 'Bouchon à vin', productType: 'Accessoire' },
  ), false);

  const queries = universeSearchQueries(glass);
  assert.match(queries.sameType, /product_type:"Verre à liqueur"/);
  assert.match(queries.sameUniverse, /product_type:"Verre à eau"/);
  assert.doesNotMatch(`${queries.sameType} ${queries.sameUniverse}`, /gid:\/\/shopify\/Product|tutu|milano/i);
  assert.match(universeSearchQueries({ productType: 'Ouvre-bouteille' }).sameUniverse, /product_type:"Bouchon à vin"/);
  assert.match(universeSearchQueries({ productType: 'Aimant' }).sameUniverse, /product_type:"Sous-main"/);
  assert.match(universeSearchQueries({ productType: 'Panier' }).sameUniverse, /product_type:"Panier de rangement"/);

  const selected = selectProductRecommendations({
    product: glass,
    universe: [waterGlass],
    automaticRelated: [card('figurine', { productType: 'Figurine' }), card('automatic', { productType: 'Verre à vin' })],
  });
  // Le repli Shopify reste dans l'univers de la fiche (18 novembre 2026 : pas de figurine sous un verre).
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
  const curatedComp = card('curated-comp', { brand: 'Vitra' });
  const curatedRelated = card('curated-related', { name: 'Table Palissade', tags: ['palissade'] });
  const cushion = card('cushion', { name: 'Coussin Palissade', productType: 'Coussin', recommendationCollectionIds: [collection.id] });
  const table = card('table', { name: 'Table Palissade', recommendationCollectionIds: [collection.id] });
  const autoComp = card('auto-comp', { brand: 'Iittala' });
  const autoRange = card('auto-range', { name: 'Fauteuil Palissade', tags: ['palissade'] });
  const autoRelated = card('auto-related', { brand: 'Vitra', productType: 'Chaise' });
  const result = selectProductRecommendations({
    product,
    curatedComplementary: [curatedComp], curatedRelated: [curatedRelated],
    range: [cushion, table, curatedRelated],
    automaticComplementary: [autoComp], automaticRelated: [autoRelated, autoRange],
  });
  assert.deepEqual(result.complementary.map(p => [p.id, p.recommendationSource]), [
    ['curated-comp', 'curated'], ['cushion', 'range-functional'], ['table', 'range-functional'], ['auto-comp', 'shopify-complementary'],
  ]);
  // La gamme a sa rubrique « De la même collection » ; « Vous aimerez aussi » garde les alternatives.
  assert.deepEqual(result.sameRange.map(p => [p.id, p.recommendationSource]), [['auto-range', 'shopify-same-range']]);
  assert.deepEqual(result.related.map(p => [p.id, p.recommendationSource]), [
    ['curated-related', 'curated'], ['auto-related', 'shopify-related'],
  ]);
});

test('les choix automatiques diversifient les marques sans casser la gamme ni la curation', () => {
  const result = selectProductRecommendations({
    product,
    range: [
      card('range-1', { name: 'Table Palissade', tags: ['palissade'] }),
      card('range-2', { name: 'Banc Palissade', tags: ['palissade'] }),
      card('range-3', { name: 'Fauteuil Palissade', tags: ['palissade'] }),
    ],
    universe: [
      card('same-brand', { brand: 'HAY', productType: 'Chaise' }),
      card('vitra', { brand: 'Vitra', productType: 'Chaise' }),
      card('iittala', { brand: 'Iittala', productType: 'Chaise' }),
    ],
  });
  assert.deepEqual(result.complementary.map(item => item.id), ['range-1']);
  assert.deepEqual(result.sameRange.map(item => item.id), ['range-2', 'range-3']);
  assert.deepEqual(result.related.map(item => item.brand), ['Vitra', 'Iittala', 'HAY']);

  const curated = selectProductRecommendations({
    product,
    curatedRelated: ['a', 'b', 'c', 'd'].map(id => card(`curated-${id}`)),
    universe: [card('vitra', { brand: 'Vitra', productType: 'Chaise' })],
  });
  assert.equal(curated.related.length, 4);
  assert.ok(curated.related.every(item => item.brand === 'HAY' && item.recommendationSource === 'curated'));
});

test('la diversité ne vide jamais une rubrique ni ne passe avant l’usage intérieur ou extérieur', () => {
  const outdoorChair = { ...product, tags: ['palissade', 'chaise', 'exterieur'] };
  const cushions = ['a', 'b', 'c', 'd'].map(id => card(`coussin-${id}`, { name: `Coussin Palissade ${id}`, productType: 'Coussin', tags: ['palissade', 'exterieur'] }));
  const result = selectProductRecommendations({
    product: outdoorChair,
    range: cushions,
    universe: [
      card('vitra-interieur', { brand: 'Vitra', productType: 'Chaise' }),
      card('fermob-jardin', { brand: 'Fermob', productType: 'Chaise', tags: ['exterieur'] }),
      card('fatboy-jardin', { brand: 'Fatboy', productType: 'Chaise', tags: ['jardin'] }),
      card('iittala-interieur', { brand: 'Iittala', productType: 'Chaise' }),
    ],
  });
  // Les quatre coussins de la gamme restent proposés : rien d'autre ne les remplace.
  assert.deepEqual(result.complementary.map(item => item.id), cushions.map(item => item.id));
  // Pour une chaise de jardin, les chaises de jardin d'autres marques passent d'abord.
  assert.deepEqual(result.related.slice(0, 2).map(item => item.id), ['fermob-jardin', 'fatboy-jardin']);
});

test('une assise et une table vont ensemble seulement si elles sont toutes deux pliantes ou toutes deux fixes', () => {
  const palissade = { ...product, tags: ['palissade', 'exterieur'] };
  const bistroTable = card('bistro-table', { brand: 'Fermob', name: 'Table Bistro Ø 77 cm', productType: 'Table', tags: ['exterieur', 'pliante', 'table-pliante'] });
  const calvi = card('calvi', { brand: 'Fermob', name: 'Table Calvi 160 x 80 cm', productType: 'Table', tags: ['exterieur'] });
  const fixed = selectProductRecommendations({ product: palissade, automaticComplementary: [bistroTable, calvi] });
  assert.deepEqual(fixed.complementary.map(item => item.id), ['calvi']);
  const bistroChair = { id: 'bistro-chair', name: 'Chaise Bistro', brand: 'Fermob', productType: 'Chaise', tags: ['bistro', 'pliante', 'exterieur'] };
  const folding = selectProductRecommendations({ product: bistroChair, automaticComplementary: [calvi, bistroTable] });
  assert.deepEqual(folding.complementary.map(item => item.id), ['bistro-table']);
  // Un choix fait à la main dans Shopify reste prioritaire.
  const curated = selectProductRecommendations({ product: palissade, curatedComplementary: [bistroTable] });
  assert.deepEqual(curated.complementary.map(item => item.id), ['bistro-table']);
});

test('« Vous aimerez aussi » garde deux pièces de la gamme au plus, même choisies à la main', () => {
  const outdoorChair = { ...product, tags: ['palissade', 'exterieur'] };
  const curatedRange = ['chaise', 'banc', 'canape', 'longue', 'fauteuil', 'tabouret'].map(id => card(`palissade-${id}`, { name: `${id} Palissade`, productType: 'Chaise', tags: ['palissade', 'exterieur'] }));
  const result = selectProductRecommendations({
    product: outdoorChair,
    curatedRelated: curatedRange,
    universe: [
      card('fermob-luxembourg', { brand: 'Fermob', name: 'Chaise Luxembourg', productType: 'Chaise', tags: ['exterieur'] }),
      card('fatboy-paletti', { brand: 'Fatboy', name: 'Fauteuil Paletti Lounge', productType: 'Fauteuil', tags: ['exterieur'] }),
    ],
  });
  assert.deepEqual(result.related.map(item => item.id), ['palissade-chaise', 'palissade-banc', 'fermob-luxembourg', 'fatboy-paletti']);
  // Le reste de la gamme passe dans « De la même collection ».
  const alone = selectProductRecommendations({ product: outdoorChair, curatedRelated: curatedRange, range: curatedRange });
  assert.equal(alone.related.length, 2);
  assert.equal(alone.sameRange.length, 4);
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

test('autres créations du créateur : types variés, ni la fiche ni ses déclinaisons, rien de déjà proposé', () => {
  const { designerPieces } = require('../lib/product-recommendations');
  const card = (id, name, type, designer = 'Verner Panton', extra = {}) => ({ id, name, productType: type, designer, image: 'x.jpg', available: true, variants: [{ id: id + 'v', searchWords: ['a'] }], description: 'long', ...extra });
  const product = { id: 'p0', name: 'Suspension Flowerpot VP1', designer: 'Verner Panton' };
  const cards = [card('p0', 'Suspension Flowerpot VP1', 'Suspension'), card('p1', 'Suspension Flowerpot VP2', 'Suspension'),
    card('p2', 'Chaise Panton', 'Chaise'), card('p3', 'Chaise Panton Classic', 'Chaise'), card('p4', 'Lampe Panthella', 'Lampe de table'),
    card('p5', 'Figurine Panton Cubes', 'Figurine'), card('p6', 'Fauteuil Cone', 'Fauteuil', 'Verner Panton', { available: false }),
    card('p7', 'Chaise Eames', 'Chaise', 'Charles & Ray Eames'), card('p8', 'Applique VP8', 'Applique')];
  const picked = designerPieces(product, cards, new Set(['p8']));
  assert.deepEqual(picked.map(c => c.id), ['p2', 'p4', 'p5', 'p3']);
  assert.equal(picked[0].description, undefined); assert.equal(picked[0].variants[0].searchWords, undefined);
  assert.deepEqual(designerPieces({ id: 'x', name: 'Vase' }, cards), []);
});

test('une collection au nom du créateur n’est pas une gamme ; les déclinaisons ne reviennent pas en alternatives', () => {
  const eames = { id: 'dsr', name: 'Chaise Eames Plastic DSR', brand: 'Vitra', designer: 'Charles & Ray Eames', productType: 'Chaise', tags: ['eames'],
    collectionRefs: [{ id: 'c-eames', handle: 'eames', title: 'Eames' }] };
  assert.deepEqual(selectRangeCollections(eames), []);
  const panton = { id: 'pan', name: 'Chaise Panton', brand: 'Vitra', designer: 'Verner Panton', productType: 'Chaise', tags: ['black-month-mobilier', 'idees-cadeaux', 'terrasse', 'salle-a-manger'],
    collectionRefs: [{ id: 'bm', handle: 'black-month-mobilier', title: 'Black Month mobilier' }, { id: 'ic', handle: 'idees-cadeaux', title: 'Idées cadeaux' }, { id: 'te', handle: 'terrasse', title: 'Terrasse' }, { id: 'sm', handle: 'salle-a-manger', title: 'Salle à manger' }] };
  assert.deepEqual(selectRangeCollections(panton), []);
  assert.equal(identityTerms(eames).includes('eames'), false);
  const elephant = card('elephant', { name: 'Tabouret Eames Elephant', brand: 'Vitra', productType: 'Tabouret', tags: ['eames'] });
  assert.deepEqual(selectProductRecommendations({ product: eames, range: [elephant], searched: [elephant] }).sameRange, []);
  const sofa = { id: 's1', name: 'Canapé Develius Mellow 3 places', brand: '&Tradition', productType: 'Canapé', tags: ['develius'], collectionRefs: [] };
  const variant = card('s2', { name: 'Canapé Develius Mellow 2 places', brand: '&Tradition', productType: 'Canapé', tags: ['develius'] });
  const other = card('rico', { name: 'Canapé Rico', brand: 'Ferm Living', productType: 'Canapé' });
  const result = selectProductRecommendations({ product: sofa, universe: [variant, other], range: [variant] });
  assert.deepEqual(result.sameRange.map(c => c.id), ['s2']);
  assert.deepEqual(result.related.map(c => c.id), ['rico']);
});

test('couverts, rayons et matières ne passent pas pour une table ou une gamme ; le mobilier enfant reste entre enfants', () => {
  const { isKids } = require('../lib/product-recommendations');
  assert.equal(role({ productType: 'Couteau de table', name: 'Couteau de table Scandia' }), 'cutlery');
  assert.equal(role({ productType: 'Cuillère de table', name: 'Cuillère de table Scandia' }), 'cutlery');
  assert.equal(role({ productType: 'Centre de table', name: 'Centre de table Canova' }), 'decor-object');
  assert.equal(role({ productType: 'Service de table', name: 'Service de table enfant Giro Kids' }), 'dishware');
  const barro = { id: 'b1', name: 'Assiette Barro (Lot de 2) Ø 18 cm', brand: 'HAY', productType: 'Assiette', tags: ['arts-de-la-table', 'barro', 'ceramique'],
    collectionRefs: [{ id: 'acc', handle: 'accessoires', title: 'Arts de la table' }, { id: 'va', handle: 'vaisselle-assiettes', title: 'Vaisselle & assiettes' }] };
  assert.deepEqual(selectRangeCollections(barro), []);
  assert.deepEqual(identityTerms(barro), ['barro']);
  const scandia = { id: 'sc', name: 'Couverts Scandia Coffret 24 pièces', brand: 'Iittala', productType: 'Couverts', tags: ['couverts', 'scandia'],
    collectionRefs: [{ id: 'cv', handle: 'couverts', title: 'Couverts' }] };
  assert.deepEqual(selectRangeCollections(scandia), []);
  const flake = { id: 'f', name: 'Élément de canapé central XL Flake Corduroy Velvet', brand: 'HKliving', productType: 'Élément de canapé', tags: ['corduroy-velvet', 'flake'] };
  assert.deepEqual(identityTerms(flake), ['flake']);
  // Une collection partagée par plusieurs marques n'est pas une gamme.
  const other = card('ich', { name: 'Bouteille Animal Farm', brand: 'Ichendorf Milano', productType: 'Bouteille', recommendationCollectionIds: ['ra'] });
  const ranged = { ...barro, collectionRefs: [{ id: 'ra', handle: 'barro-et-cie', title: 'Barro et cie' }], name: 'Assiette Barro et cie' };
  assert.deepEqual(selectProductRecommendations({ product: ranged, range: [other] }).sameRange, []);
  // Table enfant : des assises enfant, jamais une chaise adulte ; pas de verres à vin.
  const kidsTable = { id: 'kt', name: 'Table enfant Aalto 90A H60', brand: 'Artek', productType: 'Table', tags: ['enfant', 'mobilier-enfant'] };
  assert.equal(isKids(kidsTable), true);
  const adultChair = card('aac', { name: 'Chaise AAC 22', brand: 'HAY', productType: 'Chaise' });
  const kidChair = card('n65', { name: 'Chaise enfant N65', brand: 'Artek', productType: 'Chaise', tags: ['enfant'] });
  const kidStool = card('ne60', { name: 'Tabouret enfant NE60', brand: 'Artek', productType: 'Tabouret', tags: ['enfant'] });
  const adultTable = card('bistro', { name: 'Table Bistro Ø 77 cm', brand: 'Fermob', productType: 'Table' });
  const kidTable2 = card('slope', { name: 'Table enfant Slope', brand: 'Ferm Living', productType: 'Table enfant', tags: ['enfant'] });
  const result = selectProductRecommendations({ product: kidsTable, scene: { seating: [adultChair, kidChair, kidStool] }, universe: [adultTable, kidTable2] });
  assert.deepEqual(result.complementary.map(c => c.id).sort(), ['n65', 'ne60']);
  assert.deepEqual(result.related.map(c => c.id), ['slope']);
  const scene = sceneSearchQueries(kidsTable);
  assert.match(scene.sceneSeating, /tag:enfant/);
  assert.equal(scene.sceneDrinkware.includes('Verre'), false);
  assert.match(universeSearchQueries(kidsTable).sameUniverse, /Table enfant.*AND tag:enfant$/);
  // Et l'inverse : une chaise adulte ne propose pas une chaise junior.
  const panton = { id: 'pan', name: 'Chaise Panton', brand: 'Vitra', productType: 'Chaise', tags: [] };
  const junior = card('jr', { name: 'Chaise Panton Junior', brand: 'Vitra', productType: 'Chaise enfant' });
  assert.deepEqual(selectProductRecommendations({ product: panton, universe: [junior, adultChair] }).related.map(c => c.id), ['aac']);
});

test('rayons au nom du type, cotes et studios de marque ; alternatives proches en prix et en style', () => {
  const { designerPieces, designerIsBrand, similarPieces } = require('../lib/product-recommendations');
  const roll = { id: 'r', name: 'Porte-rouleau Bunny & Carrot', brand: 'Alessi', productType: 'Porte-rouleau', tags: [],
    collectionRefs: [{ id: 'pr', handle: 'porte-rouleaux', title: 'Porte-rouleaux' }] };
  assert.deepEqual(selectRangeCollections(roll), []);
  const side = { id: 's', name: "Table d'appoint à plateau 30 × 30 cm H44", brand: 'HAY', productType: "Table d'appoint", tags: ['h44'] };
  assert.equal(identityTerms(side).includes('h44'), false);
  const pot = { id: 'm', name: 'Pot Mus Très grand', brand: 'Ferm Living', productType: 'Pot', tags: [] };
  assert.equal(identityTerms(pot).some(term => term.includes('tres')), false);
  assert.equal(role({ productType: 'Miniature', name: 'Miniature Eames La Chaise' }), 'decor-object');
  assert.equal(role({ productType: 'Tasse à cappuccino', name: 'Tasse à cappuccino Solare' }), 'cup');
  assert.equal(designerIsBrand({ brand: 'Fermob', designer: 'Studio Fermob' }), true);
  assert.equal(designerIsBrand({ brand: 'Fermob', designer: 'Pascal Mourgue' }), false);
  assert.deepEqual(designerPieces({ id: 'u', name: 'Lampe Ulli', brand: 'Fermob', designer: 'Studio Fermob' }, [card('x', { designer: 'Studio Fermob' })]), []);
  const vase = { id: 'v0', name: 'Vase Conical Grand', brand: 'HAY', productType: 'Vase', price: 60, tags: ['scandinave'] };
  const v = (id, name, brand, price, tags = []) => card(id, { name, brand, productType: 'vase', price, tags });
  const cards = [v('v1', 'Vase Gleam Petit', 'HKliving', 15), v('v2', 'Vase Steps Grand', 'Pols Potten', 65, ['scandinave']),
    v('v3', 'Vase Steps Petit', 'Pols Potten', 30), v('v4', 'Vase Aalto 16 cm', 'Iittala', 70, ['scandinave']),
    v('v5', 'Vase Conical Petit', 'HAY', 40), card('l1', { name: 'Lampe Pao', brand: 'HAY', productType: 'Lampe', price: 60 })];
  assert.deepEqual(similarPieces(vase, cards).map(c => c.id), ['v2', 'v4', 'v1']);
});

test('même marque, même type, même modèle = même gamme, même quand le modèle porte le nom du créateur', () => {
  const { sameModel, modelPieces, similarPieces } = require('../lib/product-recommendations');
  const table = { id: 't0', name: 'Table enfant Aalto 90A Ø 100 cm H60', brand: 'Artek', productType: 'Table', designer: 'Alvar Aalto', tags: ['enfant'] };
  const other = card('t1', { name: 'Table enfant Aalto 81C 75 × 75 cm', brand: 'Artek', productType: 'table', tags: ['enfant'] });
  const vase = card('v1', { name: 'Vase Aalto 12 cm', brand: 'Iittala', productType: 'vase' });
  assert.equal(sameModel(table, other), true);
  assert.equal(sameModel(table, vase), false);
  assert.deepEqual(modelPieces(table, [other, vase]).map(c => c.id), ['t1']);
  assert.deepEqual(similarPieces(table, [other]), []);
  assert.deepEqual(selectProductRecommendations({ product: table, searched: [other] }).sameRange.map(c => c.id), ['t1']);
});
