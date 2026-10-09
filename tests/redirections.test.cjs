const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { CACHE_CONTROL, SCHEMA, lookupRedirect, redirectTarget, redirectionStats } = require('../lib/redirections');

// Table des redirections des anciennes fiches (ADR 0014) : chargée depuis data/redirections.json
// (livrée par l'importateur), appliquée par /produit.html?handle= et /products/<handle> SEULEMENT
// quand aucune fiche publiée ne porte le handle. Shopify est simulé : `published` dit quels handles
// ont une fiche. Les handles d'exemple sont pris dans la table elle-même, un handle neuf par cas
// (la lecture d'une fiche est mise en cache par handle).
const TABLE = require('../data/redirections.json');
const toHandle = TABLE.redirections.filter((e) => e.status === 301 && !e.to.startsWith('/'));
const toPath = TABLE.redirections.filter((e) => e.status === 301 && e.to.startsWith('/'));
const gone = TABLE.redirections.filter((e) => e.status === 410);
const [r1, r2, r3] = toHandle;
const [p1] = toPath;
const [g1, g2, g3] = gone;

const realFetch = global.fetch;
let server, base;
let shopifyDown = false;
const published = new Set();
const productQueries = [];
const orange = 'https://cdn.shopify.com/orange.png?v=2';
const product = { id: 'gid://shopify/Product/100', handle: 'x', title: 'Lampe republiée', vendor: 'Test', productType: 'lampe', description: 'Lampe test', tags: [], availableForSale: true, totalInventory: 3,
  featuredImage: { url: orange }, images: { edges: [{ node: { url: orange } }] }, collections: { edges: [] }, metafields: [],
  priceRange: { minVariantPrice: { amount: '189' }, maxVariantPrice: { amount: '189' } },
  variants: { edges: [{ node: { id: 'gid://shopify/ProductVariant/1', title: 'Orange', price: { amount: '189' }, quantityAvailable: 2, availableForSale: true, image: { url: orange }, selectedOptions: [] } }] } };

before(async () => {
  process.env.SHOPIFY_STORE_DOMAIN = 'redirections.test';
  process.env.SHOPIFY_STOREFRONT_TOKEN = 'test';
  global.fetch = async (url, options) => {
    if (!String(url).includes('redirections.test')) return realFetch(url, options);
    if (shopifyDown) return new Response('Service Unavailable', { status: 503 });
    const { query, variables } = JSON.parse(options.body);
    if (/query ProductRecommendations\(/.test(query)) return Response.json({ data: { complementary: [], related: [], rangeCollections: [], search: { nodes: [] } } });
    if (/query GetProduct\(/.test(query)) {
      productQueries.push(variables.handle);
      return Response.json({ data: { product: published.has(variables.handle) ? { ...product, handle: variables.handle } : null } });
    }
    return Response.json({ data: {} });   // menu, marques, promotions… : rien, le chrome a ses replis
  };
  server = require('../server').listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { global.fetch = realFetch; await new Promise((r) => server.close(r)); });

const get = (path, accept = 'text/html') => realFetch(base + path, { headers: { accept }, redirect: 'manual' });

test('la table est chargée au schéma attendu : toutes les entrées 301/410 de l’importateur, aucune erreur', () => {
  const stats = redirectionStats();
  assert.equal(stats.schema, SCHEMA);
  assert.equal(stats.error, null);
  assert.equal(stats.entries, toHandle.length + toPath.length + gone.length, 'une entrée retenue par ligne valide de la table');
  assert.equal(stats.entries, TABLE.counts['301'] + TABLE.counts['410'], 'les compteurs de l’importateur correspondent');
  assert.ok(r3 && p1 && g3, 'la table a assez d’exemples de chaque sorte pour ces tests');
});

test('lookupRedirect / redirectTarget : handle publié → fiche, chemin → tel quel, 410 sans cible, inconnu → null', () => {
  assert.deepEqual(lookupRedirect(r1.from), { status: 301, to: r1.to });
  assert.equal(redirectTarget(lookupRedirect(r1.from)), '/produit.html?handle=' + encodeURIComponent(r1.to));
  assert.deepEqual(lookupRedirect(p1.from), { status: 301, to: p1.to });
  assert.equal(redirectTarget(lookupRedirect(p1.from)), p1.to);
  assert.match(p1.to, /^\/collections\/[a-z0-9-]+$/);
  assert.deepEqual(lookupRedirect(g1.from), { status: 410 });
  assert.equal(lookupRedirect('handle-qui-n-existe-pas-du-tout'), null);
  assert.equal(lookupRedirect(''), null);
  assert.equal(lookupRedirect(undefined), null);
  assert.equal(CACHE_CONTROL, 'public, max-age=300, s-maxage=3600');
});

test('/produit.html?handle=<ancien> sans fiche publiée → 301 vers la nouvelle fiche, cache court', async () => {
  const res = await get('/produit.html?handle=' + r1.from);
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), '/produit.html?handle=' + encodeURIComponent(r1.to));
  assert.equal(res.headers.get('cache-control'), CACHE_CONTROL);
  assert.ok(productQueries.includes(r1.from), 'la fiche a bien été cherchée dans Shopify avant la table');
});

test('/produit.html?handle=<ancien> dont la cible est un chemin → 301 vers ce chemin', async () => {
  const res = await get('/produit.html?handle=' + p1.from);
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), p1.to);
  assert.equal(res.headers.get('cache-control'), CACHE_CONTROL);
});

test('/produit.html?handle=<retiré> → 410 : shell du site, noindex, texte 410, markdown pour les agents', async () => {
  const res = await get('/produit.html?handle=' + g1.from);
  assert.equal(res.status, 410);
  assert.match(res.headers.get('content-type'), /text\/html/);
  assert.equal(res.headers.get('cache-control'), CACHE_CONTROL);
  assert.match(res.headers.get('vary') || '', /Accept/);
  const html = await res.text();
  assert.match(html, /<meta name="robots" content="noindex,follow" \/>/);
  assert.doesNotMatch(html, /rel="canonical"/, 'pas de canonical sur une page retirée');
  assert.match(html, /<h1[^>]*>Cette pièce n'est plus proposée<\/h1>/);
  assert.match(html, /id="site-header"/, 'le chrome est là');
  const md = await get('/produit.html?handle=' + g1.from, '*/*');
  assert.equal(md.status, 410);
  assert.match(md.headers.get('content-type'), /text\/markdown/);
  assert.match(await md.text(), /^# 410 — Cette pièce n'est plus proposée/);
});

test('un handle hors table sans fiche reste un 404 (rien ne change pour lui)', async () => {
  const res = await get('/produit.html?handle=handle-qui-n-existe-pas-du-tout');
  assert.equal(res.status, 404);
  assert.equal(res.headers.get('cache-control'), 'public, s-maxage=60, stale-while-revalidate=600');
});

test('UNE FICHE PUBLIÉE PASSE AVANT LA TABLE : un ancien handle republié sert sa fiche en 200', async () => {
  published.add(r2.from);
  const res = await get('/produit.html?handle=' + r2.from);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Lampe republiée/);
});

test('/products/<ancien> sans fiche → UN SEUL saut vers la cible de la table (fiche ou chemin), 410 si retirée', async () => {
  const a = await get('/products/' + r1.from);
  assert.equal(a.status, 301);
  assert.equal(a.headers.get('location'), '/produit.html?handle=' + encodeURIComponent(r1.to));
  assert.equal(a.headers.get('cache-control'), CACHE_CONTROL);
  const b = await get('/products/' + p1.from);
  assert.equal(b.status, 301);
  assert.equal(b.headers.get('location'), p1.to);
  const c = await get('/products/' + g2.from);
  assert.equal(c.status, 410);
  assert.match(await c.text(), /plus proposée/);
});

test('/products/<handle> : une fiche publiée passe avant la table (même pour une entrée 410) ; hors table, aucun appel Shopify', async () => {
  published.add(g3.from);
  const a = await get('/products/' + g3.from);
  assert.equal(a.status, 301);
  assert.equal(a.headers.get('location'), '/produit.html?handle=' + encodeURIComponent(g3.from), 'vers SA fiche, pas de 410');
  const before = productQueries.length;
  const b = await get('/products/handle-qui-n-existe-pas-du-tout');
  assert.equal(b.status, 301);
  assert.equal(b.headers.get('location'), '/produit.html?handle=handle-qui-n-existe-pas-du-tout');
  assert.equal(productQueries.length, before, 'un handle hors table ne coûte pas d’appel Shopify');
});

test('Shopify indisponible : aucun doute tranché par la table — /products garde son saut d’avant, /produit.html répond 503', async () => {
  shopifyDown = true;
  try {
    const a = await get('/products/' + r3.from);
    assert.equal(a.status, 301);
    assert.equal(a.headers.get('location'), '/produit.html?handle=' + encodeURIComponent(r3.from));
    const b = await get('/produit.html?handle=' + r3.from);
    assert.equal(b.status, 503);
  } finally { shopifyDown = false; }
});
