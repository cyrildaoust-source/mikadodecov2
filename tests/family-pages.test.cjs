const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { families, seatingIcons, nextPageUrl, renderFamilyPage } = require('../lib/family-pages');
const template = fs.readFileSync(path.join(__dirname, '../templates/family-page.html'), 'utf8');
const realFetch = global.fetch;
const requests = [];
const productRequests = [];
let server, base;
const nextCursor = 'opaque+/=cursor';

function product(id) {
  return {
    id: `gid://shopify/Product/${id}`, handle: `family-product-${id}`, title: `Produit ${id}`,
    vendor: 'Mikado', productType: 'table', description: '', tags: [],
    availableForSale: true, totalInventory: 1, collections: { edges: [] },
    images: { edges: [{ node: { url: 'https://cdn.shopify.com/example.jpg' } }] },
    priceRange: { minVariantPrice: { amount: '199' }, maxVariantPrice: { amount: '199' } },
    variants: { edges: [{ node: { id: `gid://shopify/ProductVariant/${id}`, title: 'Bois', price: { amount: '199' }, availableForSale: true, quantityAvailable: 1, selectedOptions: [{ name: 'Finition', value: 'Bois' }] } }] },
    metafields: [],
  };
}

before(async () => {
  process.env.SHOPIFY_STORE_DOMAIN = 'family-test.invalid';
  process.env.SHOPIFY_STOREFRONT_TOKEN = 'local-test-only';
  global.fetch = async (url, options) => {
    assert.equal(new URL(url).hostname, 'family-test.invalid', 'No real upstream calls');
    const { query, variables } = JSON.parse(options.body);
    if (/query GetCollections\(/.test(query)) return Response.json({ data: { collections: { edges: [{ node: { id: 'gid://shopify/Collection/1', handle: 'verres-carafes', title: 'Verres et carafes' } }] } } });
    if (/query GetProduct\(/.test(query)) {
      productRequests.push(variables.handle);
      // Une chaise dépubliée et une requête en panne ne bloquent pas le catalogue.
      if (variables.handle === 'chaise-standard') return Response.json({ data: { product: null } });
      if (variables.handle === 'artek-domus-chair') return new Response('Unavailable', { status: 503 });
      return Response.json({ data: { product: { ...product(100), handle: variables.handle } } });
    }
    assert.match(query, /query GetCollectionProducts/);
    requests.push(variables);
    if (variables.after === 'unavailable') return new Response('Unavailable', { status: 503 });
    if (variables.after === 'missing') return Response.json({ data: { collection: null } });
    const isTables = variables.handle === 'tables';
    const start = variables.after?.startsWith('edge:') ? Number(variables.after.slice(5)) + 1 : 1;
    const ids = variables.after === 'empty' ? [] : variables.after && !variables.after.startsWith('edge:') ? [25, 26] : Array.from({ length: Math.min(variables.first, isTables ? 31 - start : variables.first) }, (_, i) => start + i);
    const hasNextPage = isTables ? ids.at(-1) < 30 && (!variables.after || variables.after.startsWith('edge:')) : !variables.after;
    return Response.json({ data: { collection: {
      title: families[variables.handle]?.title || 'Verres et carafes', description: '', image: null,
      products: { edges: ids.map(id => ({ cursor: 'edge:' + id, node: { ...product(id), tags: isTables && id <= 3 ? ['exterieur'] : [] } })), pageInfo: { hasNextPage, endCursor: isTables ? 'edge:' + ids.at(-1) : variables.after ? 'end' : nextCursor } },
    } } });
  };
  const app = require('../server');
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  global.fetch = realFetch;
  await new Promise(resolve => server.close(resolve));
});

function seed(html) {
  return JSON.parse(html.match(/<script type="application\/json" id="family-initial">([\s\S]*?)<\/script>/)[1]);
}
const page = async suffix => {
  const response = await realFetch(base + suffix, { headers: { Accept: 'text/html' } });
  return { response, html: await response.text() };
};

test('all five family routes render 24 crawlable products, navigation and metadata', async () => {
  const expected = { tables: 4, luminaires: 6, decoration: 6, rangement: 5, accessoires: 5 };
  for (const [handle, count] of Object.entries(expected)) {
    const { response, html } = await page('/collections/' + handle);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('cache-control'), /s-maxage/);
    assert.ok(html.includes(`<h1 class="fam-hero__title">${families[handle].title}</h1>`));
    assert.ok(html.includes(`href="https://www.mikadodeco.be/collections/${handle}"`));
    assert.match(html, /BreadcrumbList/);
    assert.match(html, /<header class="chrome/);
    assert.match(html, /<footer/);
    assert.equal((html.match(/class="home-rc"/g) || []).length, count);
    assert.equal((html.split('data-grid>')[1].split('</section>')[0].match(/class="pcard"/g) || []).length, 24);
    assert.ok(html.includes('/produit.html?handle=family-product-24'));
    assert.match(html, /data-more href=/);
    assert.doesNotMatch(html, /\[\[[A-Z_]+\]\]/);
    assert.equal(seed(html).items.length, 24);
    assert.equal(seed(html).pageSize, 24);
  }
  assert.ok(requests.every(request => request.first <= 25), 'bounded queries including one item of lookahead');
});

test('chairs belong to Assises only, and unavailable models do not block the selection', async () => {
  const beforeRequests = productRequests.length;
  const { html } = await page('/collections/tables');
  assert.equal(productRequests.length, beforeRequests, 'Tables never fetches the curated chairs');
  assert.doesNotMatch(html, /Les chaises iconiques|handle=chaise-panton/);
  assert.equal(seed(html).items.length, 24);
  assert.equal(seed(html).items[0].handle, 'family-product-4', 'outdoor prefix is excluded before SSR');
  assert.equal(seed(html).featuredItems.length, 4);
  assert.match(html, /Notre sélection de tables/);
  const assises = await page('/collections/sieges');
  assert.equal(assises.response.status, 200);
  assert.equal(assises.response.headers.get('cache-control'), 'no-store');
  assert.match(assises.html, /Les chaises iconiques/);
  assert.ok(assises.html.indexOf('Nos catégories') < assises.html.indexOf('data-icones-sec'));
  assert.ok(assises.html.indexOf('data-icones-sec') < assises.html.indexOf('Par pièce'));
  const initial = JSON.parse(assises.html.match(/id="seating-icons-initial">([\s\S]*?)<\/script>/)[1]);
  assert.equal(initial.items.length, 2);
  assert.ok(initial.items.every(item => !['chaise-standard', 'artek-domus-chair'].includes(item.handle)));
  assert.deepEqual(productRequests.slice(beforeRequests), seatingIcons.handles);
  assert.ok(assises.html.includes('/produit.html?handle=chaise-panton'));
  const arts = await page('/collections/accessoires');
  assert.doesNotMatch(arts.html, /data-icones-sec|id="family-icons"/);
  assert.ok(arts.html.indexOf('id="grille"') < arts.html.indexOf('id="family-brands"'));
});

test('glass inspiration and server-rendered destination preserve the glassware filter', async () => {
  assert.equal(families.accessoires.inspiration.items[2].href, '/collections/verres-carafes?tag=verrerie');
  const { response, html } = await page('/collections/verres-carafes?tag=verrerie');
  assert.equal(response.status, 200);
  assert.deepEqual(requests.at(-1).filters, [{ tag: 'verrerie' }]);
  assert.match(html, /data-ssr="1"/);
  assert.ok(html.includes('/produit.html?handle=family-product-24'));
});

test('opaque cursor is encoded, sent upstream and final page remains accessible without JS', async () => {
  const url = nextPageUrl('tables', { hasNextPage: true, endCursor: nextCursor });
  assert.equal(url, '/collections/tables?cursor=opaque%2B%2F%3Dcursor#grille');
  const { html, response } = await page(url);
  assert.equal(response.status, 200);
  assert.equal(requests.at(-1).after, nextCursor);
  assert.deepEqual(seed(html).items.map(item => item.handle), ['family-product-25', 'family-product-26']);
  assert.ok(html.includes('/produit.html?handle=family-product-26'));
  assert.match(html, /Revenir au début/);
  assert.doesNotMatch(html, /data-more href=/);
  assert.equal(nextPageUrl('tables', { hasNextPage: true }), null);
});

test('empty collection and upstream failure are distinct; failures are not cached', async () => {
  const empty = await page('/collections/tables?cursor=empty');
  assert.match(empty.html, /Cette sélection se prépare/);
  assert.equal(seed(empty.html).failed, false);
  assert.doesNotMatch(empty.html, /data-more href=/);
  for (const cursor of ['unavailable', 'missing']) {
    const { response, html } = await page('/collections/tables?cursor=' + cursor);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match(html, /Les produits ne sont pas disponibles/);
    assert.match(html, /Réessayer/);
    assert.equal(seed(html).failed, true);
    assert.match(html, /Nos catégories/);
  }
});

test('bootstrap JSON cannot close its script and excludes PDP-only data', () => {
  const name = '</script><img src=x onerror=alert(1)> & "test"';
  const html = renderFamilyPage(template, 'tables', { items: [{ handle: 'safe', name, images: ['unnecessary'], description: 'unnecessary', variants: [{ options: [{ name: 'Couleur', value: 'Bleu' }], image: 'unnecessary' }] }] });
  assert.ok(!html.includes(name));
  const item = seed(html).items[0];
  assert.equal(item.name, name);
  assert.equal(item.images, undefined);
  assert.equal(item.description, undefined);
  assert.deepEqual(item.variants, [{ options: [{ name: 'Couleur', value: 'Bleu' }] }]);
});

test('category and brand media use existing local assets or the allowed Shopify CDN', () => {
  for (const family of Object.values(families)) {
    for (const url of [family.hero, ...family.categories.map(item => item.image), ...family.inspiration.items.map(item => item.image), ...family.brands.map(item => item.image)]) {
      if (url.startsWith('/')) assert.ok(fs.existsSync(path.join(__dirname, '../v3', url)), url);
      else assert.equal(new URL(url).hostname, 'cdn.shopify.com');
    }
    for (const brand of family.brands) assert.ok(fs.existsSync(path.join(__dirname, '../v3/images/brands', brand.slug + '.svg')));
    for (const category of family.categories) assert.match(category.handle, /^[a-z0-9-]+$/);
  }
});

test('icon curation excludes only the rejected AAC 26 and requires an editorial tag', async () => {
  const { isFamilyIcon, uniqueProducts } = await import('../v3/family-policy.mjs');
  assert.equal(isFamilyIcon({ handle: 'chaise-hay-aac-26', tags: ['icone', 'icone-design'] }), false);
  assert.equal(isFamilyIcon({ handle: 'another-hay', brand: 'HAY', tags: ['icone'] }), true);
  assert.equal(isFamilyIcon({ handle: 'chair', tags: ['icone-design'] }), true);
  assert.equal(isFamilyIcon({ handle: 'chair', tags: ['badge:bestseller'] }), false);
  assert.equal(isFamilyIcon(null), false);
  assert.equal(uniqueProducts([{ handle: 'one' }, { id: 1, handle: 'one' }, null, { handle: 'two' }]).length, 2);
});
