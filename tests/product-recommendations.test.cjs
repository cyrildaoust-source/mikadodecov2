const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { buildRecommendationContext, rangeAffinity, recommendProducts } = require('../lib/product-recommendations');

const card = (id, overrides = {}) => ({
  id, handle: id, variantId: `variant-${id}`, name: id, brand: 'Marque',
  productType: 'objet', category: 'objets', tags: [], collections: [],
  available: true, image: `/${id}.jpg`, ...overrides,
});

test('les recommandations curées gardent la priorité et les doublons sont retirés', () => {
  const product = card('source');
  const first = card('premier');
  const duplicate = card('double');
  const unavailable = card('indisponible', { available: false });
  const result = recommendProducts({
    product,
    curatedComplementary: [first, product, unavailable, duplicate],
    curatedRelated: [duplicate, card('lie')],
    automaticRelated: [first, card('auto')],
  });
  assert.deepEqual(result.withPurchase.map(p => p.id), ['premier', 'double']);
  assert.deepEqual(result.completePurchase.map(p => p.id), ['lie', 'auto']);
});

test('une collection, un tag ou un titre de modèle identifie la gamme sans handle codé en dur', () => {
  const source = card('source', { name: 'Table Rivage 180', productType: 'table', collections: ['rivage'], tags: ['rivage'] });
  const chair = card('chaise', { name: 'Chaise Rivage', productType: 'chaise', collections: ['rivage'], tags: ['rivage'] });
  const table = card('table', { name: 'Table Rivage ronde', productType: 'table', collections: ['tables'], tags: ['rivage'] });
  const noise = card('bruit', { name: 'Table Sans rapport', productType: 'table', collections: ['tables'], tags: ['metal'] });
  const context = buildRecommendationContext([source, chair, table, noise]);
  assert.ok(rangeAffinity(source, chair, context).score > 0);
  assert.ok(rangeAffinity(source, table, context).score > 0);
  assert.equal(rangeAffinity(source, noise, context).score, 0);
  const result = recommendProducts({ product: source, catalog: [source, chair, table, noise] });
  assert.equal(result.withPurchase[0].id, 'chaise');
  assert.equal(result.completePurchase[0].id, 'table');
});

test('les accessoires fonctionnels de la même marque complètent le bon type', () => {
  const chair = card('chaise', { name: 'Chaise Nord', productType: 'chaise' });
  const cushion = card('coussin', { name: 'Coussin Nord', productType: 'coussin' });
  const otherBrand = card('autre', { name: 'Coussin Nord', brand: 'Autre', productType: 'coussin' });
  const result = recommendProducts({ product: chair, catalog: [chair, cushion, otherBrand] });
  assert.deepEqual(result.withPurchase.map(p => p.id), ['coussin']);
});

test('une housse explicitement prévue pour une autre pièce ou dimension est écartée', () => {
  const table = card('table', { name: 'Table Rivage 65 x 65 cm', productType: 'table', tags: ['rivage'] });
  const wrongFurniture = card('fauteuil', { name: 'Housse Rivage pour fauteuil', productType: 'housse de protection', tags: ['rivage'] });
  const wrongSize = card('taille', { name: 'Housse Rivage table 83 cm', productType: 'housse de protection', tags: ['rivage'] });
  const right = card('bonne', { name: 'Housse Rivage table 65 cm', productType: 'housse de protection', tags: ['rivage'] });
  const result = recommendProducts({ product: table, catalog: [table, wrongFurniture, wrongSize, right] });
  assert.deepEqual(result.withPurchase.map(p => p.id), ['bonne']);
});

test('le repli Shopify vient après les règles et chaque rubrique est plafonnée', () => {
  const source = card('source', { name: 'Vase Halo', productType: 'vase' });
  const range = Array.from({ length: 10 }, (_, i) => card(`range-${i}`, { name: `Vase Halo ${i}`, productType: 'vase', tags: ['halo'] }));
  const automatic = Array.from({ length: 10 }, (_, i) => card(`auto-${i}`, { brand: 'Autre' }));
  const result = recommendProducts({ product: source, catalog: [source, ...range], automaticRelated: automatic, limit: 4 });
  assert.equal(result.completePurchase.length, 4);
  assert.ok(result.completePurchase.every(p => p.id.startsWith('range-')));
});

test('une fiche, une image ou une variante absente ne peut pas être recommandée', () => {
  const source = card('source');
  const result = recommendProducts({
    product: source,
    automaticRelated: [card('sans-image', { image: '' }), card('sans-variante', { variantId: null }), card('valide')],
  });
  assert.deepEqual(result.completePurchase.map(p => p.id), ['valide']);
});

test('la fiche demande les deux intents Storefront et affiche les intitulés validés', () => {
  const queries = fs.readFileSync(require.resolve('../lib/shopify/queries'), 'utf8');
  const template = fs.readFileSync(require.resolve('../v3/produit.html'), 'utf8');
  assert.match(queries, /productRecommendations\(productHandle: \$handle, intent: COMPLEMENTARY\)/);
  assert.match(queries, /productRecommendations\(productHandle: \$handle, intent: RELATED\)/);
  assert.match(template, />Ce qui va avec votre achat</);
  assert.match(template, />Pour compléter votre achat</);
});
