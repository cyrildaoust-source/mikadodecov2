const test = require('node:test');
const assert = require('node:assert/strict');
const { seoMeta } = require('../lib/seo-meta');

const facets = { brand: [{ value: 'hay', label: 'HAY', count: 18 }, { value: 'vitra', label: 'Vitra', count: 40 }, { value: 'fermob', label: 'Fermob', count: 60 }], category: [{ value: 'sieges', label: 'Assises', count: 50 }, { value: 'luminaires', label: 'Luminaires', count: 30 }] };

test('a category describes its real content: count and main brands', () => {
  const meta = seoMeta({ label: 'Chaises' }, { total: 196, facets });
  assert.equal(meta.title, 'Chaises design à Bruxelles · Mikado Deco');
  assert.equal(meta.description, 'Chaises : 196 pièces de design signées Fermob, Vitra et HAY. Conseil en boutique à Uccle, livraison en Belgique.');
});

test('a brand page names its families; a category filtered by brand gets its own title', () => {
  assert.equal(seoMeta({ label: 'Vitra', collectionKind: 'brand' }, { total: 123, facets }).description, 'Vitra chez Mikado Deco : 123 pièces, assises et luminaires. Conseil en boutique à Uccle, livraison en Belgique.');
  assert.equal(seoMeta({ label: 'Chaises' }, { total: 18, facets }, { brandName: 'HAY' }).title, 'Chaises HAY · Mikado Deco');
});

test('an editorial description always wins and stays under 160 characters', () => {
  const meta = seoMeta({ label: 'Luminaires', ogDescription: 'Une lumière pour lire. '.repeat(12) }, { total: 9, facets });
  assert.ok(meta.description.length <= 160);
  assert.match(meta.description, /^Une lumière pour lire\./);
});
