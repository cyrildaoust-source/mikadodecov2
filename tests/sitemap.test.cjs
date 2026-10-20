const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const realFetch = global.fetch;
const cursors = [];
let server, base;

before(async () => {
  process.env.SHOPIFY_STORE_DOMAIN = 'sitemap-test.invalid';
  process.env.SHOPIFY_STOREFRONT_TOKEN = 'local-test-only';
  global.fetch = async (url, options) => {
    if (!String(url).includes('sitemap-test.invalid')) return realFetch(url, options);
    const { query, variables } = JSON.parse(options.body);
    if (query.includes('query SitemapProducts(')) {
      assert.match(query, /products\(first: 250, after: \$after\)/);
      assert.doesNotMatch(query, /variants|images|metafields/);
      cursors.push(variables.after);
      const last = variables.after === 'next-page';
      return Response.json({ data: { products: {
        nodes: last ? [{ handle: 'deuxieme-produit' }] : [{ handle: 'premier-produit' }],
        pageInfo: { hasNextPage: !last, endCursor: last ? null : 'next-page' },
      } } });
    }
    if (query.includes('query GetCollections(')) {
      return Response.json({ data: { collections: { edges: [
        { node: { id: 'gid://shopify/Collection/1', handle: 'assises', title: 'Assises' } },
      ] } } });
    }
    throw new Error('Requête Shopify inattendue dans le sitemap');
  };
  server = require('../server').listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  global.fetch = realFetch;
  await new Promise(resolve => server.close(resolve));
});

test('le sitemap couvre toutes les pages produit avec une requête légère', async () => {
  const response = await realFetch(base + '/sitemap-products.xml');
  const xml = await response.text();
  assert.equal(response.status, 200);
  assert.deepEqual(cursors, [null, 'next-page']);
  assert.match(xml, /produit\.html\?handle=premier-produit/);
  assert.match(xml, /produit\.html\?handle=deuxieme-produit/);
  assert.match(xml, /collections\/assises/);
});

test('sitemap-pages : la liste et les priorités viennent du manifeste ; une page `index: false` en est absente', async () => {
  const { SITEMAP_PAGES } = require('../lib/config');
  const response = await realFetch(base + '/sitemap-pages.xml');
  const xml = await response.text();
  assert.equal(response.status, 200);
  for (const { loc, priority } of SITEMAP_PAGES) assert.ok(xml.includes(`<loc>https://www.mikadodeco.be${loc}</loc><priority>${priority}</priority>`), loc);
  assert.ok(SITEMAP_PAGES.length >= 13, `${SITEMAP_PAGES.length} pages`);
  assert.match(xml, /<loc>https:\/\/www\.mikadodeco\.be\/<\/loc><priority>1\.0<\/priority>/, 'l’accueil s’écrit « / »');
  assert.match(xml, /produits\.html<\/loc><priority>0\.9/); assert.match(xml, /mentions-legales\.html<\/loc><priority>0\.3/);
  assert.doesNotMatch(xml, /selection\.html/, 'la sélection (panier, noindex) est hors sitemap');
  assert.doesNotMatch(xml, /journal/, 'journal retiré du site (20 octobre 2026)');
  assert.ok(xml.includes('<loc>https://www.mikadodeco.be/collections/idees-cadeaux</loc><priority>0.7</priority>'), 'Idées cadeaux, liée toute l’année, est dans le sitemap (audit du 20 octobre 2026)');
  assert.doesNotMatch(xml, /<lastmod>/, 'pas de date inventée pour les pages statiques');
});

test('journal retiré (Cyril, 20 octobre 2026) : page, articles et ancien stub répondent 410 avec le shell, hors sitemap, hors navigation', async () => {
  for (const p of ['/journal.html', '/journal', '/journal/fermob.html', '/journal/fermob', '/article.html?slug=fermob']) {
    const response = await realFetch(base + p, { headers: { Accept: 'text/html' } });
    assert.equal(response.status, 410, p);
    const html = await response.text();
    assert.match(html, /Cette page n'existe plus/, p);
    assert.match(html, /noindex/, p);
    assert.match(html, /id="site-header"/, p + ' : le chrome est là');
  }
  const home = await (await realFetch(base + '/', { headers: { Accept: 'text/html' } })).text();
  assert.doesNotMatch(home, /journal\.html|Le journal|\/journal\//, 'ni menu, ni tiroir, ni pied de page, ni coup de cœur');
});
