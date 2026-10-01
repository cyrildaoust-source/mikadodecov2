const test = require('node:test');
const assert = require('node:assert/strict');
const { validGtin, productJsonLd } = require('../lib/product-jsonld');

test('GTIN is published only with a valid check digit', () => {
  assert.equal(validGtin('5710441451938'), '5710441451938');
  assert.equal(validGtin('5710441451939'), '');
  assert.equal(validGtin('VIT-21059200'), '');
  assert.equal(validGtin(''), '');
  assert.equal(validGtin('96385074'), '96385074');
});

test('Product JSON-LD describes the shown variant with SKU, GTIN, EUR price, stock, image and URL', () => {
  const product = { name: 'Palissade', brand: 'HAY', description: 'Chaise', priceMin: 300 };
  const variant = { sku: 'HAY-AF591-A235', barcode: '5710441451938', price: 329, compareAtPrice: 399, qty: 0, available: true };
  const ld = productJsonLd(product, variant, { url: 'https://www.mikadodeco.be/produit.html?handle=palissade', image: 'https://cdn/x.jpg', seller: 'Mikado Deco' });
  assert.equal(ld.sku, 'HAY-AF591-A235');
  assert.equal(ld.gtin, '5710441451938');
  assert.equal(ld.brand.name, 'HAY');
  assert.equal(ld.image, 'https://cdn/x.jpg');
  assert.equal(ld.url, 'https://www.mikadodeco.be/produit.html?handle=palissade');
  assert.deepEqual([ld.offers.price, ld.offers.priceCurrency, ld.offers.availability], ['329', 'EUR', 'https://schema.org/BackOrder']);
  assert.equal(ld.offers.priceSpecification.price, '399');
  assert.equal(ld.offers.seller.name, 'Mikado Deco');
});

test('Without a resolved variant, the offer falls back to the product price and omits SKU and GTIN', () => {
  const ld = productJsonLd({ name: 'Repos', priceMin: 4590, inStock: false, available: true }, null, { url: 'u' });
  assert.equal(ld.offers.price, '4590');
  assert.equal(ld.sku, undefined);
  assert.equal(ld.gtin, undefined);
  assert.equal(ld.offers.availability, 'https://schema.org/BackOrder');
});
