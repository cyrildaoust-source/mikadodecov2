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
let vendorsUnavailable = false;
const nextCursor = 'opaque+/=cursor';
const activeNames = ['&Tradition', 'Alessi', 'Anglepoise', 'Artek', 'Avolt', 'Blomus', 'Carl Hansen & Søn', 'Compagnie de Provence', 'Esteban', 'Ester & Erik', 'Fatboy', 'Ferm Living', 'Fermob', 'HAY', 'HKliving', 'Ichendorf Milano', 'Iittala', 'LIND DNA', 'Marimekko', 'Muuto', 'Pols Potten', 'Relaxound', 'Serax', 'Stoff Nagel', 'String Furniture', 'Tiptoe', 'Vitra', 'Volta Mobiles'];
const brandSlug = name => name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function product(id) {
  return {
    id: `gid://shopify/Product/${id}`, handle: `family-product-${id}`, title: `Produit ${id}`,
    vendor: id % 3 === 0 ? 'Artek' : 'HAY', productType: 'table', description: '', tags: [],
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
    if (/query GetVendors\(/.test(query)) return vendorsUnavailable ? new Response('Unavailable', { status: 503 }) : Response.json({ data: { products: { edges: activeNames.map(vendor => ({ node: { vendor } })), pageInfo: { hasNextPage: false, endCursor: null } } } });
    if (/query GetProducts\(/.test(query)) {
      const name = variables.query?.match(/vendor:"([^"]+)"/)?.[1];
      assert.ok(name, 'A brand request must never become an unfiltered catalogue query');
      return Response.json({ data: { products: { edges: [{ node: { ...product(1), vendor: name } }], pageInfo: { hasNextPage: false, endCursor: null } } } });
    }
    if (/query Search\(/.test(query)) {
      const start = Number(variables.after || 0), end = Math.min(135, start + variables.first);
      return Response.json({ data: { search: { edges: Array.from({ length: end - start }, (_, i) => ({ node: { ...product(start + i), vendor: start + i < 120 ? 'Artek' : 'HAY' } })), pageInfo: { hasNextPage: end < 135, endCursor: String(end) } } } });
    }
    if (/query GetCollections\(/.test(query)) return Response.json({ data: { collections: { edges: [{ node: { id: 'gid://shopify/Collection/1', handle: 'verres-carafes', title: 'Verres et carafes' } }] } } });
    if (/query GetProduct\(/.test(query)) {
      productRequests.push(variables.handle);
      // Une chaise dépubliée et une requête en panne ne bloquent pas le catalogue.
      if (variables.handle === 'chaise-standard') return Response.json({ data: { product: null } });
      if (variables.handle === 'chaise-hay-rey-chair') return new Response('Unavailable', { status: 503 });
      return Response.json({ data: { product: { ...product(100), handle: variables.handle } } });
    }
    assert.match(query, /query GetCollectionProducts/);
    requests.push(variables);
    if (variables.after === 'unavailable') return new Response('Unavailable', { status: 503 });
    if (variables.after === 'missing') return Response.json({ data: { collection: null } });
    const isTables = ['tables', 'tables-de-salle-a-manger', 'tables-de-cafe', 'tables-basses-et-tables-dappoint'].includes(variables.handle);
    const start = variables.after?.startsWith('edge:') ? Number(variables.after.slice(5)) + 1 : 1;
    const ids = variables.after === 'empty' ? [] : variables.after && !variables.after.startsWith('edge:') ? [25, 26] : Array.from({ length: Math.min(variables.first, isTables ? 31 - start : variables.first) }, (_, i) => start + i);
    const hasNextPage = isTables ? ids.at(-1) < 30 && (!variables.after || variables.after.startsWith('edge:')) : !variables.after;
    return Response.json({ data: { collection: {
      title: families[variables.handle]?.title || 'Verres et carafes', description: '', image: null,
      products: { edges: ids.map(id => ({ cursor: 'edge:' + id, node: { ...product(id), ...(id % 11 === 0 ? { vendor: 'Carl Hansen & Søn' } : {}), tags: isTables && id <= 3 ? ['exterieur'] : [] } })), pageInfo: { hasNextPage, endCursor: isTables ? 'edge:' + ids.at(-1) : variables.after ? 'end' : nextCursor } },
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
  assert.ok(initial.items.every(item => !['chaise-standard', 'chaise-hay-rey-chair'].includes(item.handle)));
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

test('all 28 family brand cards preserve their family in the destination', async () => {
  for (const handle of [...Object.keys(families), 'sieges', 'outdoor']) {
    const { html } = await page('/collections/' + handle);
    const links = [...html.matchAll(/class="bcard" href="([^"]+)"/g)].map(match => match[1]);
    assert.equal(links.length, 4, handle);
    assert.ok(html.includes('href="/marques.html?collection=' + handle + '"'), 'Every family links to all of its brands');
    for (const link of links) {
      const url = new URL(link, base);
      assert.equal(url.pathname, '/collections/' + handle);
      assert.ok(url.searchParams.get('brand'));
      assert.equal(url.searchParams.get('tag'), null, 'collection membership covers every outdoor tag');
    }
  }
});

test('failed brand resolution never returns the unfiltered catalogue', async () => {
  vendorsUnavailable = true;
  try {
    const api = await realFetch(base + '/api/products?paginated=1&brand=hay');
    assert.equal(api.status, 500);
    const { html, response } = await page('/produits.html?brand=hay');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match(html, /<h1 data-plp-title data-context>HAY<\/h1>/);
    assert.match(html, /Impossible de charger cette sélection/);
    assert.doesNotMatch(html, /class="pcard__brand"/);
  } finally { vendorsUnavailable = false; }
});

test('all active brands filter the generic catalogue from the first HTML response', async () => {
  for (const name of activeNames) {
    const slug = brandSlug(name);
    const { html } = await page('/produits.html?brand=' + slug);
    const context = JSON.parse(html.match(/id="collection-context-initial">(.*?)<\/script>/s)[1]);
    assert.equal(context.brand.name, name);
    assert.equal(context.brand.slug, slug);
    assert.ok(html.includes('from=brand%3A' + slug));
    const api = await (await realFetch(base + '/api/products?paginated=1&brand=' + slug)).json();
    assert.ok(api.items.length && api.items.every(product => product.brand === name), name);
  }
  const unknown = await page('/produits.html?brand=unknown-brand');
  assert.match(unknown.html, /Aucun produit pour cette sélection/);
  assert.doesNotMatch(unknown.html, /class="pcard__brand"/);
});

test('unlisted brand names and all contextual brand directories retain the category', async () => {
  const carl = await page('/collections/sieges?brand=carl-hansen-son');
  assert.match(carl.html, /Assises · Carl Hansen &amp; Søn/);
  for (const handle of [...Object.keys(families), 'sieges', 'outdoor']) {
    const { html } = await page('/marques.html?collection=' + handle);
    const context = JSON.parse(html.match(/id="brands-context-initial">(.*?)<\/script>/s)[1]);
    assert.equal(context.collection.handle, handle);
    assert.ok(context.brands.some(brand => brand.slug === 'carl-hansen-son'));
    const links = [...html.split('<script type="module">')[0].matchAll(/class="brandcard" href="([^"]+)"/g)].map(match => match[1]);
    assert.equal(links.length, context.brands.length);
    assert.ok(links.every(link => link.startsWith('/collections/' + handle + '?brand=')));
    const api = await (await realFetch(base + '/api/collection/' + handle + '/brands')).json();
    assert.deepEqual(api, context);
  }
  const legacy = await realFetch(base + '/produits.html?coll=sieges&brand=hay', { redirect: 'manual' });
  assert.equal(legacy.headers.get('location'), '/collections/sieges?brand=hay');
});

test('brand search fills sparse pages without returning another vendor', async () => {
  const first = await (await realFetch(base + '/api/products?paginated=1&brand=hay&q=chair&limit=8')).json();
  assert.equal(first.items.length, 8);
  assert.ok(first.items.every(product => product.brand === 'HAY'));
  const next = await (await realFetch(base + '/api/products?paginated=1&brand=hay&q=chair&limit=8&cursor=' + encodeURIComponent(first.pageInfo.endCursor))).json();
  assert.equal(next.items.length, 7);
  assert.equal(next.pageInfo.hasNextPage, false);
  assert.equal(new Set([...first.items, ...next.items].map(product => product.handle)).size, 15);
});

test('product brand links preserve every category and brand, with a global fallback for global visits', async () => {
  const { listingContext, productBrandHref } = await import('../v3/brand-navigation.mjs');
  const brandMap = Object.fromEntries(activeNames.map(name => [brandSlug(name), brandSlug(name)]));
  const handles = [...Object.keys(families), 'sieges', 'outdoor', ...Object.values(families).flatMap(family => family.categories.map(category => category.handle))];
  for (const handle of handles) for (const name of activeNames) {
    const slug = brandSlug(name);
    const href = '/collections/' + handle + '?brand=' + slug;
    assert.equal(productBrandHref(slug, brandMap, listingContext(new URL(href, base))), href);
    assert.equal(productBrandHref(slug, brandMap, 'coll:' + handle), href);
    assert.equal(listingContext(new URL('/produits.html?coll=' + handle + '&brand=' + slug, base)), 'coll-brand:' + handle + ':' + slug);
  }
  assert.equal(productBrandHref('hay', brandMap, 'coll:hay'), '/collections/hay');
  assert.equal(productBrandHref('new-brand', brandMap), '/produits.html?brand=new-brand');
});

test('brand directory deduplicates child-only products, separates outdoor tables and fails on broken cursors', async () => {
  const { collectionBrands } = require('../lib/collection-brand');
  const chair = { id: 'chair', handle: 'chair', brand: 'Carl Hansen & Søn' };
  const sources = { sieges: [chair], chaises: [chair, { id: 'hay', brand: 'HAY' }] };
  const result = await collectionBrands('sieges', async (_, __, handle) => ({ collection: { handle }, items: sources[handle] || [], pageInfo: {} }));
  assert.deepEqual(result.brands.map(brand => [brand.name, brand.productCount]), [['Carl Hansen & Søn', 1], ['HAY', 1]]);
  const tables = await collectionBrands('tables', async (_, __, handle) => ({ collection: { handle }, items: handle === 'tables' ? [
    { id: 'in', brand: 'Artek', productType: 'Table', tags: [] },
    { id: 'out', brand: 'Fermob', productType: 'Table', tags: ['exterieur'] },
  ] : [], pageInfo: {} }));
  assert.deepEqual(tables.brands.map(brand => brand.name), ['Artek']);
  await assert.rejects(collectionBrands('sieges', async () => ({ collection: {}, items: [], pageInfo: { hasNextPage: true, endCursor: 'stuck' } })), /did not advance/);
});

test('family brand destinations show the intersection in SSR, metadata and breadcrumb', async () => {
  for (const handle of [...Object.keys(families), 'sieges', 'outdoor']) {
    const { response, html } = await page('/collections/' + handle + '?brand=artek');
    assert.equal(response.status, 200);
    assert.doesNotMatch(html, /data-family=/, 'filtered destination is the catalogue for this family');
    const context = JSON.parse(html.match(/id="collection-context-initial">(.*?)<\/script>/s)[1]);
    assert.equal(context.handle, handle);
    assert.equal(context.brand.name, 'Artek');
    assert.ok(html.includes(`<h1 data-plp-title data-context>${context.collectionName} · Artek</h1>`));
    assert.ok(html.includes(`href="https://www.mikadodeco.be/collections/${handle}?brand=artek"`));
    assert.ok(html.includes(`href="/collections/${handle}">${context.collectionName}</a>`));
    assert.match(html, /<span aria-current="page">Artek<\/span>/);
    assert.match(html, /class="pcard__brand">Artek/);
    assert.ok(html.includes('from=coll-brand%3A' + handle + '%3Aartek'), 'product links retain the family and brand before hydration');
    assert.doesNotMatch(html, /class="pcard__brand">HAY/);
    assert.match(html, /<header class="chrome chrome--solid"/);
    assert.doesNotMatch(html, /width="undefined"|height="undefined"/);
  }
});

test('brand pagination fills sparse lots, keeps table policy and transmits material tags', async () => {
  const first = await (await realFetch(base + '/api/collection/tables/products?brand=artek&limit=2')).json();
  assert.deepEqual(first.items.map(item => item.handle), ['family-product-6', 'family-product-9']);
  assert.ok(first.items.every(item => item.brand === 'Artek'));
  const next = await (await realFetch(base + '/api/collection/tables/products?brand=artek&limit=2&cursor=' + encodeURIComponent(first.pageInfo.endCursor))).json();
  assert.deepEqual(next.items.map(item => item.handle), ['family-product-12', 'family-product-15']);
  const glass = await (await realFetch(base + '/api/collection/verres-carafes/products?brand=artek&tag=verrerie&limit=2')).json();
  assert.ok(glass.items.every(item => item.brand === 'Artek'));
  assert.deepEqual(requests.at(-1).filters, [{ tag: 'verrerie' }]);
  const empty = await page('/collections/tables?brand=unknown-brand');
  assert.match(empty.html, /Aucun produit pour cette marque/);
  assert.doesNotMatch(empty.html, /class="pcard__brand"/);
  const failed = await page('/collections/tables?brand=artek&cursor=unavailable');
  assert.equal(failed.response.headers.get('cache-control'), 'no-store');
  assert.match(failed.html, /Tables · Artek/);
  assert.match(failed.html, /Impossible de charger cette sélection/);
  assert.doesNotMatch(failed.html, /class="pcard__brand"/);
});

test('brand intersection never skips matching products and rejects broken continuations', async () => {
  const { brandCollectionPage } = require('../lib/collection-brand');
  const products = Array.from({ length: 90 }, (_, index) => ({ handle: 'p' + index, brand: index < 12 || index % 2 ? 'HAY' : 'Artek' }));
  const fetchPage = async (first, after) => {
    const start = Number(after || 0);
    const end = Math.min(products.length, start + first);
    return { collection: { handle: 'luminaires' }, items: products.slice(start, end), pageInfo: { hasNextPage: end < products.length, endCursor: String(end) } };
  };
  let after = null, found = [];
  do {
    const result = await brandCollectionPage({ first: 7, after, brand: 'artek' }, fetchPage);
    found.push(...result.items.map(item => item.handle));
    after = result.pageInfo.hasNextPage ? result.pageInfo.endCursor : null;
  } while (after);
  assert.deepEqual(found, products.filter(item => item.brand === 'Artek').map(item => item.handle));
  await assert.rejects(brandCollectionPage({ first: 2, brand: 'artek' }, async () => ({ collection: {}, items: [], pageInfo: { hasNextPage: true, endCursor: 'stuck' } })), /did not advance/);
});

test('family brand selections include child-only products once across every cursor', async () => {
  const { brandCollectionPage } = require('../lib/collection-brand');
  const shared = { handle: 'shared', brand: 'HAY', collections: ['luminaires', 'lampes-de-table'] };
  const childOnly = { handle: 'child', brand: 'HAY', collections: ['lampes-de-table', 'lampes-de-bureau'] };
  const sourceItems = {
    luminaires: [shared], 'lampes-de-table': [shared, childOnly], 'lampes-de-bureau': [childOnly],
    lampadaires: [{ handle: 'floor', brand: 'HAY', collections: ['lampadaires'] }],
  };
  const fetchPage = async (first, cursor, source) => {
    const list = sourceItems[source] || [];
    const start = Number(cursor || 0), end = Math.min(list.length, start + first);
    return { collection: { handle: source, title: source }, items: list.slice(start, end), pageInfo: { hasNextPage: end < list.length, endCursor: String(end) } };
  };
  let after = null, found = [];
  do {
    const result = await brandCollectionPage({ handle: 'luminaires', first: 1, after, brand: 'hay' }, fetchPage);
    assert.equal(result.collection.handle, 'luminaires');
    assert.ok(result.items.every(item => item.collections.includes('luminaires')));
    found.push(...result.items.map(item => item.handle));
    after = result.pageInfo.endCursor;
    if (after) await assert.rejects(brandCollectionPage({ handle: 'luminaires', first: 1, after, brand: 'artek' }, fetchPage), /Invalid family brand cursor/);
  } while (after);
  assert.deepEqual(found, ['shared', 'child', 'floor']);
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

test('curated collection hero agrees across bootstrap, social preview and no-JS fallback', async () => {
  const { collectionHero } = require('../lib/editorial-media');
  const expected = collectionHero('verres-carafes');
  const { html } = await page('/collections/verres-carafes');
  const initial = JSON.parse(html.match(/id="collection-hero-initial">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(initial, expected);
  assert.match(html, /<header class="chrome chrome--solid"/);
  assert.ok(html.includes(`content="${expected.img.replace(/&/g, '&amp;')}"`));
  const fallback = html.match(/<noscript><img class="subhero__img editorial-photo"[^>]*>/)[0];
  assert.ok(fallback.includes(`width="${expected.width}" height="${expected.height}"`));
  assert.ok(fallback.includes(expected.style));
  assert.match(fallback, /sizes="100vw"/);
});

test('editorial curation has distinct photographs, safe focal points and known sources', () => {
  const { collectionHeroes, collectionHero, photoStyle, injectCollectionHero } = require('../lib/editorial-media');
  const imageKey = image => new URL(image, 'https://www.mikadodeco.be').pathname;
  assert.equal(Object.keys(collectionHeroes).length, 39);
  assert.equal(new Set(Object.values(collectionHeroes).map(photo => imageKey(photo.image))).size, 39);
  for (const [handle, photo] of Object.entries(collectionHeroes)) {
    assert.match(photo.sourceProduct, /^[a-z0-9-]+$/);
    assert.equal(new URL(photo.image).hostname, 'cdn.shopify.com');
    assert.doesNotMatch(photo.image, /chatgpt|generated/i);
    assert.ok(photo.width >= 1000 && photo.height > 0, handle);
    assert.match(photo.position, /^(100|\d{1,2})% (100|\d{1,2})%$/);
    const hero = collectionHero(handle);
    assert.ok(hero.srcset.endsWith(photo.width + 'w'));
    assert.ok(!hero.srcset.includes('undefined'));
  }
  for (const family of Object.values(families)) {
    const images = [family.hero, ...family.categories.map(item => item.image), ...family.inspiration.items.map(item => item.image), ...family.brands.map(item => item.image)].map(imageKey);
    assert.equal(new Set(images).size, images.length, family.title + ': no reused photograph within a page');
  }
  assert.equal(collectionHero('vitra'), null, 'brand headers keep their own treatment');
  assert.equal(collectionHero('__proto__'), null);
  assert.equal(injectCollectionHero('unchanged template', null), 'unchanged template');
  assert.equal(photoStyle({ position: '0; background:url(https://untrusted.invalid)' }), '--photo-position:50% 50%;--photo-position-mobile:50% 50%');
});
