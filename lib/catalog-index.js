// Index commun des pages filtrées : tout le catalogue publié (fiches, variantes et
// données de filtre) dans l'ordre des ventes, et l'appartenance aux familles et
// sous-catégories. Il est construit en arrière-plan puis gardé par le CDN
// (/index-catalogue/<partie>.json) : aucune page n'attend la relecture de Shopify.
const { readScopeCatalog } = require('./chair-catalog');
const { variantSearchWords } = require('./catalog-filters');
const { imageIdentity } = require('../v3/product-variant');

const MEMBERS_QUERY = `query CollectionMembers($handle: String!, $after: String) {
  collection(handle: $handle) { products(first: 250, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes { id }
  } }
}`;

async function pool(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; results[i] = await task(items[i]); }
  }));
  return results;
}

async function readMembers(fetch, handle) {
  const ids = [], cursors = new Set();
  let after = null;
  do {
    if (cursors.has(after)) throw new Error('Member cursor did not advance');
    cursors.add(after);
    const collection = (await fetch(MEMBERS_QUERY, { handle, after })).collection;
    if (!collection) return null;
    ids.push(...collection.products.nodes.map(n => n.id));
    after = collection.products.pageInfo.hasNextPage ? collection.products.pageInfo.endCursor : null;
    if (collection.products.pageInfo.hasNextPage && !after) throw new Error('Missing member cursor');
  } while (after);
  return ids;
}

// fetch(query, variables) : transport Shopify ; mapProduct : carte commune du site.
async function buildCatalogIndex({ fetch, catalogueQuery, variantQuery, mapProduct, handles }) {
  const started = Date.now();
  const [catalogue, members] = await Promise.all([
    readScopeCatalog(
      async after => ({ handle: 'catalogue', title: 'Catalogue', products: (await fetch(catalogueQuery, { after })).products }),
      mapProduct,
      async (handle, after) => (await fetch(variantQuery, { handle, after })).product?.variants,
    ),
    pool(handles, 6, handle => readMembers(fetch, handle)),
  ]);
  return {
    version: 1, builtAt: Date.now(), buildMs: Date.now() - started,
    products: catalogue.products,
    members: Object.fromEntries(handles.map((h, i) => [h, members[i]]).filter(([, ids]) => ids)),
  };
}

// Produits d'une page filtrée, dans l'ordre des ventes, avec leurs catégories.
// Calculé une fois par version d'index et par page.
const scopeCache = new WeakMap();
function scopeProducts(index, scope, { acceptProduct, memberSources, categoryScope }) {
  let byScope = scopeCache.get(index);
  if (!byScope) scopeCache.set(index, byScope = new Map());
  if (byScope.has(scope.handle)) return byScope.get(scope.handle);
  const sets = new Map();
  const membersOf = handle => {
    if (!sets.has(handle)) sets.set(handle, index.members[handle] ? new Set(index.members[handle]) : null);
    return sets.get(handle);
  };
  // Appartenance à une page : l'une de ses collections, puis ses règles propres.
  const belongs = target => {
    const sets = memberSources(target).map(membersOf);
    if (target.kind !== 'catalogue' && target.kind !== 'designer' && !sets[0]) return null;
    const present = sets.filter(Boolean);
    return card => (!present.length || present.some(set => set.has(card.id))) && acceptProduct(target, card, membersOf);
  };
  const inScope = belongs(scope);
  if (!inScope) throw new Error('Collection absente de l\'index : ' + scope.handle);
  const categories = (scope.categories || []).map(c => [c.value, belongs(categoryScope(scope, c.value))]).filter(([, test]) => test);
  let products = index.products.flatMap(p => {
    if (!inScope(p.card)) return [];
    return categories.length ? [{ ...p, category: categories.filter(([, test]) => test(p.card)).map(([value]) => value) }] : [p];
  });
  // Ordre choisi dans Shopify pour la collection (marques, Nouveautés…).
  if (scope.order === 'collection') {
    const position = new Map((index.members[scope.members] || []).map((id, i) => [id, i]));
    products = products.sort((a, b) => (position.get(a.card.id) ?? 1e9) - (position.get(b.card.id) ?? 1e9));
  }
  byScope.set(scope.handle, products);
  return products;
}

// Transport vers le CDN, qui ne garde pas les réponses trop lourdes (26 Mo bruts ;
// essai du 24 septembre : 6 Mo gardés, 18 Mo refusés). L'index est donc allégé
// (variantes en double, galeries, mots de recherche recalculables, préfixe des
// images) puis découpé en parties d'environ 3 Mo. Les parties se recollent par
// identifiant, dans l'ordre des ventes porté par la partie « membres ».
const PARTS = 4;
const CDN_PREFIX = 'https://cdn.shopify.com/s/files/1/0958/8441/1209/files/';
const CDN_TOKEN = '@cdn/';
const partOf = id => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % PARTS; };
const DEFAULTS = { compareAtPrice: null, partialFinish: false, searchFacts: null, appearance: [] };
function packProduct(p) {
  const { variants: _duplicate, firstImageRaw: _raw, description: _text, ...card } = p.card;
  // Seule la vue de survol lit la galerie : garder ses premières candidates, hors
  // photos de finitions (mêmes règles que variantHoverImage).
  const variantImages = new Set(p.card.variants.map(v => imageIdentity(v.image)).filter(Boolean));
  card.images = (card.images || []).filter(url => { const id = imageIdentity(url); return id && !variantImages.has(id); }).slice(0, 3);
  const variants = p.variants.map(({ searchWords: _words, sku: _sku, ...v }) => {
    for (const [key, value] of Object.entries(DEFAULTS)) if (JSON.stringify(v[key]) === JSON.stringify(value)) delete v[key];
    return v;
  });
  return { ...p, card, variants };
}
const encode = value => JSON.stringify(value).replaceAll(CDN_PREFIX, CDN_TOKEN);
function packIndex(index) {
  const parts = Array.from({ length: PARTS }, () => []);
  for (const p of index.products) parts[partOf(p.card.id)].push(packProduct(p));
  const head = { version: index.version, builtAt: index.builtAt, buildMs: index.buildMs, parts: PARTS, order: index.products.map(p => p.card.id), members: index.members };
  return { membres: encode(head), parts: parts.map((products, part) => encode({ version: index.version, builtAt: index.builtAt, part, products })) };
}
function unpackIndex(membres, parts) {
  const decode = text => JSON.parse(text.replaceAll(CDN_TOKEN, CDN_PREFIX));
  const head = decode(membres);
  if (head?.version !== 1 || !Array.isArray(head.order) || !head.members || head.parts !== parts.length) throw new Error('Index invalide');
  const byId = new Map();
  for (const text of parts) {
    const part = decode(text);
    if (part?.version !== 1 || !Array.isArray(part.products)) throw new Error('Partie d\'index invalide');
    for (const p of part.products) {
      for (const v of p.variants) {
        for (const [key, value] of Object.entries(DEFAULTS)) if (!(key in v)) v[key] = structuredClone(value);
        v.searchWords = variantSearchWords(p.card, v);
      }
      p.card.variants = p.variants;
      byId.set(p.card.id, p);
    }
  }
  // Parties issues de constructions voisines : une fiche absente attend la suivante.
  return { version: 1, builtAt: head.builtAt, members: head.members, products: head.order.map(id => byId.get(id)).filter(Boolean) };
}

module.exports = { buildCatalogIndex, scopeProducts, packIndex, unpackIndex, PARTS, MEMBERS_QUERY };
