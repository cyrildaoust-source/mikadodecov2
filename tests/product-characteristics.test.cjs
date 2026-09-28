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
