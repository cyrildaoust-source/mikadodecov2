const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { splitAndTraditionMedia } = require('../lib/andtradition-media');
const photo = { url: 'https://cdn.shopify.com/VP7-133089A170-OFF.png', altText: 'Black & White pattern' };
const drawing = { url: 'https://cdn.shopify.com/flowerpot-vp7_black_white_pattern.rs.jpg', altText: 'Suspension Flowerpot VP7 - dessin technique officiel' };
const ambience = { url: 'https://cdn.shopify.com/lifestyle.jpg', altText: 'Flowerpot en situation' };
const images = [photo, drawing, ambience].map(node => ({ node }));
test('uses reviewed role despite misleading finish filename and preserves photo order', () => {
  assert.deepEqual(splitAndTraditionMedia({ vendor: '&Tradition', images: { edges: images } }), { photos: [photo, ambience], dimensions: [drawing] });
  assert.deepEqual(splitAndTraditionMedia({ vendor: 'Another brand', images: { edges: images } }), { photos: [photo, drawing, ambience], dimensions: [] });
});
test('deduplicates drawings with different CDN parameters, including unlabelled copies', () => {
  const copy = { url: drawing.url + '?width=400' };
  assert.deepEqual(splitAndTraditionMedia({ vendor: 'AndTradition', images: { edges: [...images, { node: copy }] } }), { photos: [photo, ambience], dimensions: [drawing] });
});
const realFetch = global.fetch;
let server, base;
before(async () => {
  process.env.SHOPIFY_STORE_DOMAIN = 'andtradition-test.invalid';
  process.env.SHOPIFY_STOREFRONT_TOKEN = 'local-test-only';
  global.fetch = async (url, options) => {
    assert.equal(new URL(url).hostname, 'andtradition-test.invalid');
    const { variables } = JSON.parse(options.body);
    return Response.json({ data: { product: {
      id: 'gid://shopify/Product/10178757984585', handle: variables.handle,
      title: 'Suspension Flowerpot VP7', vendor: '&Tradition', productType: 'Suspension',
      description: 'Une suspension.', tags: [], availableForSale: true,
      images: { edges: images }, featuredImage: photo,
      priceRange: { minVariantPrice: { amount: '399' }, maxVariantPrice: { amount: '499' } },
      variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/1', title: 'Black & White pattern', price: { amount: '499' }, image: photo, selectedOptions: [], availableForSale: true } }] },
      metafields: [{ key: 'dimensions', value: 'Ø 37 × H 27 cm' }],
    } } });
  };
  const app = require('../server');
  await import('../v3/product-specs.mjs');
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { global.fetch = realFetch; await new Promise(resolve => server.close(resolve)); });
test('API separates dimensions from gallery, thumbnails and card hover, retaining variant image', async () => {
  const res = await realFetch(base + '/api/product/suspension-flowerpot-vp7');
  assert.equal(res.status, 200);
  const body = await res.json(), p = body.product || body;
  assert.equal(p.images.length, 2); assert.equal(p.thumbs.length, 2); assert.equal(p.dimensionImages.length, 1);
  assert.ok(p.image2.startsWith(ambience.url)); assert.ok(p.variants[0].image.startsWith(photo.url));
  assert.ok(p.dimensionImages[0].url.startsWith(drawing.url)); assert.ok(!p.images.some(u => u.startsWith(drawing.url)));
});
test('server renders drawing inside Dimensions, outside gallery', async () => {
  const res = await realFetch(base + '/produit.html?handle=suspension-flowerpot-vp7'), html = await res.text();
  assert.equal(res.status, 200);
  assert.match(html, /id="pdp-acc-panel-dimensions"[^>]*>[\s\S]*?<figure class="pdp-dimension-image">/);
  const gallery = html.split('<div class="pdp__gallery">')[1].split('<div class="pdp__info">')[0];
  assert.ok(!gallery.includes(drawing.url));
});
