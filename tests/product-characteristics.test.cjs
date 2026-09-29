const { test } = require('node:test');
const assert = require('node:assert/strict');
const { formatCapacityLitres } = require('../lib/shopify/product-mapper');
const { PRODUCT_QUERY } = require('../lib/shopify/queries');

test('capacity keeps the native decimal value and receives a French client unit', () => {
  assert.equal(formatCapacityLitres('1.3'), '1,3 L');
  assert.equal(formatCapacityLitres('0.25'), '0,25 L');
  assert.equal(formatCapacityLitres('carton de 6'), '');
  assert.equal(formatCapacityLitres('0'), '');
});

test('the PDP query requests every additional characteristic rendered by the mapper', () => {
  for (const key of ['capacity_l', 'martindale', 'certifications', 'tests_and_standards']) {
    assert.match(PRODUCT_QUERY, new RegExp(`key: "${key}"`));
  }
});

test('import placeholders stay hidden; care, collection and manufacturer published under other keys are shown', () => {
  const { mapProduct } = require('../lib/shopify/product-mapper');
  const node = {
    id: 'gid://shopify/Product/1', handle: 'tabouret', title: 'Tabouret', vendor: 'Pols Potten', productType: 'Tabouret', tags: [],
    images: { edges: [] }, variants: { edges: [] }, priceRange: { minVariantPrice: { amount: '10' }, maxVariantPrice: { amount: '10' } },
    metafields: [
      { key: 'origin', value: 'Non renseigné' }, { key: 'weight', value: ' - ' },
      { key: 'care_instructions', value: 'Nettoyer avec un chiffon doux.' },
      { key: 'collection_name', value: 'Zig Zag' }, { key: 'manufacturer', value: 'Pols Potten' },
    ],
  };
  const product = mapProduct(node, { full: true });
  assert.equal(product.origin, '');
  assert.equal(product.weight, '');
  assert.equal(product.entretien, 'Nettoyer avec un chiffon doux.');
  assert.equal(product.collection, 'Zig Zag');
  for (const key of ['care_instructions', 'collection_name', 'manufacturer']) assert.match(PRODUCT_QUERY, new RegExp(`key: "${key}"`));
});
