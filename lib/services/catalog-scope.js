// Index du catalogue (par portée et global) : construction, fraîcheur, pages filtrées.
// Extrait de server.js (phase 1 du plan d'architecture, octobre 2026) — code déplacé, pas réécrit.
const zlib = require('node:zlib');
const { filterParams, parseFilters } = require('../catalog-filters');
const { PARTS: INDEX_PARTS, buildCatalogIndex, packIndex, scopeProducts, unpackIndex } = require('../catalog-index');
const { VARIANT_QUERY: CHAIR_VARIANT_QUERY, catalogueQuery, filterCatalog, readScopeCatalog, scopeQuery } = require('../chair-catalog');
const { acceptProduct, categoryScope, indexedCollections, memberSources } = require('../filter-scopes');
const { shopifyFetch } = require('../shopify/client');
const { CARD_IMAGE_WIDTH, mapProduct, shopifyResize } = require('../shopify/product-mapper');
const { PRODUCT_CARD_FIELDS } = require('../shopify/queries');
const cache = require('../cache');
const { ORIGIN } = require('../config');
const { getCollections } = require('./catalog');

// ─── SHOPIFY: PRODUCTS QUERY ───────────────────────────
// Metafields must be enabled in Shopify admin → Settings → Custom data → Products
// Namespaces used: "custom" — keys: designer, year, material, dimensions, lead_time, subcategory
// Sélection de champs du node produit, factorisée en fragment pour être SOURCE
// UNIQUE : PRODUCTS_QUERY (catalogue/PLP/sitemap) ET SEARCH_QUERY (page ?q=)
// l'utilisent → mapProduct lit exactement les mêmes champs des deux côtés (aucun
// risque de carte incomplète sur la page de résultats). Toute évolution de carte
// se fait ICI, une seule fois.




const SCOPE_QUERY = scopeQuery(PRODUCT_CARD_FIELDS);
// Index filtrable par collection (Chaises et les sous-catégories) : toute la collection
// et toutes ses variantes, calculés une fois et frais 5 min. Un seul chargement à la fois
// par collection ; /api/revalidate vide ces index.
const scopeLoading = new Map();
const SCOPE_FRESH = 5 * 60_000, SCOPE_STALE = 30 * 60_000;
function loadScopeIndex(handle) {
  if (!scopeLoading.has(handle)) scopeLoading.set(handle, readScopeCatalog(
    async after => (await shopifyFetch(SCOPE_QUERY, { handle, after })).collection,
    node => {
      const card = mapProduct(node);
      card.variants.forEach(variant => { variant.image = shopifyResize(variant.image, CARD_IMAGE_WIDTH); });
      return card;
    },
    async (productHandle, after) => (await shopifyFetch(CHAIR_VARIANT_QUERY, { handle: productHandle, after })).product?.variants,
  ).then(data => { cache.setEntry('catalog:index:' + handle, { data, expiry: Date.now() + SCOPE_FRESH }); return data; })
    .finally(() => { scopeLoading.delete(handle); }));
  return scopeLoading.get(handle);
}
async function getScopeIndex(handle) {
  const entry = cache.peek('catalog:index:' + handle), now = Date.now();
  if (entry && entry.expiry > now) return entry.data;
  const load = loadScopeIndex(handle);
  // Index expiré depuis peu : le visiteur reçoit la version précédente pendant que la
  // collection se relit (plusieurs secondes pour les plus grandes). Au-delà de 30 min,
  // ou si la relecture échoue longtemps, la page attend des données fraîches.
  if (entry && now - entry.expiry < SCOPE_STALE) { load.catch(error => console.warn('[catalog-refresh]', handle, error.message)); return entry.data; }
  return load;
}
// ─── Index commun des pages filtrées ───────────────────
// Tout le catalogue publié (fiches, variantes, filtres) et l'appartenance aux familles
// et sous-catégories. Sur Vercel, une fonction le construit (~1 min) derrière
// /index-catalogue/<partie>.json, que le CDN garde 15 min puis renouvelle en arrière-plan ;
// les autres instances le lisent au CDN. Hors Vercel (dev, tests), il est construit ici.
const CATALOGUE_QUERY = catalogueQuery(PRODUCT_CARD_FIELDS);
const INDEX_FRESH = 5 * 60_000, INDEX_STALE = 24 * 60 * 60_000, INDEX_WAIT = 4000, INDEX_RETRY = 10_000;
let indexEntry = null, indexPending = null, indexFailedAt = 0, indexBuilding = null, indexResponse = null;
function indexCard(node) {
  const card = mapProduct(node);
  card.variants.forEach(variant => { variant.image = shopifyResize(variant.image, CARD_IMAGE_WIDTH); });
  delete card.description; // inutile aux listes ; allège l'index
  return card;
}
const buildIndexNow = () => buildCatalogIndex({ fetch: shopifyFetch, catalogueQuery: CATALOGUE_QUERY, variantQuery: CHAIR_VARIANT_QUERY, mapProduct: indexCard, handles: indexedCollections() });
function indexSourceURL() {
  if (process.env.CATALOG_INDEX_URL) return process.env.CATALOG_INDEX_URL;
  if (!process.env.VERCEL) return null;
  return (process.env.VERCEL_ENV === 'production' ? ORIGIN : 'https://' + process.env.VERCEL_URL) + '/index-catalogue';
}
async function fetchIndex(base) {
  const headers = {};
  // Les previews sont protégées : la fonction utilise le secret d'automatisation du projet.
  if (process.env.VERCEL_ENV !== 'production' && process.env.VERCEL_AUTOMATION_BYPASS_SECRET) headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const texts = await Promise.all(['membres', ...Array.from({ length: INDEX_PARTS }, (_, i) => String(i))].map(async part => {
    const response = await fetch(`${base}/${part}.json`, { headers });
    if (!response.ok) throw new Error(`Index ${part} HTTP ${response.status}`);
    return response.text();
  }));
  return unpackIndex(texts[0], texts.slice(1));
}
// Hors Vercel, même chemin que le CDN (allègement puis recollage) pour tester le transport.
async function buildIndexLocally() {
  const packed = packIndex(await buildIndexNow());
  return unpackIndex(packed.membres, packed.parts);
}
function refreshIndex() {
  if (!indexPending) {
    const url = indexSourceURL();
    indexPending = (url ? fetchIndex(url) : buildIndexLocally())
      .then(index => { indexEntry = { index, fetchedAt: Date.now() }; return index; })
      .catch(error => { indexFailedAt = Date.now(); console.warn('[catalog-index] lecture impossible', error.message); throw error; })
      .finally(() => { indexPending = null; });
  }
  return indexPending;
}
// patient : attendre la construction complète (sitemap, lu par les robots et mis en cache).
async function getCatalogIndex({ patient = false } = {}) {
  const now = Date.now();
  if (indexEntry && now - indexEntry.fetchedAt < INDEX_FRESH) return indexEntry.index;
  if (indexEntry && now - indexEntry.index.builtAt < INDEX_STALE) {
    // Version précédente servie tout de suite ; la suivante arrive en arrière-plan.
    if (now - indexFailedAt > INDEX_RETRY) refreshIndex().catch(error => console.warn('[catalog-index] relecture', error.message));
    return indexEntry.index;
  }
  if (!indexPending && now - indexFailedAt < INDEX_RETRY) throw new Error('Index indisponible (échec récent)');
  const pending = refreshIndex();
  pending.catch(() => {});
  if (patient) return pending;
  // Premier chargement après un déploiement : la page n'attend pas la construction complète.
  let timer;
  try {
    return await Promise.race([pending, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Index en préparation')), INDEX_WAIT); })]);
  } finally { clearTimeout(timer); }
}
const INDEX_PART_NAMES = new Set(['membres', ...Array.from({ length: INDEX_PARTS }, (_, i) => String(i))]);
async function scopeCollectionInfo(scope) {
  if (scope.kind !== 'subcategory' && scope.kind !== 'collection') return { handle: scope.handle, title: scope.label, description: scope.sub };
  try {
    const c = (await getCollections()).find(item => item.handle === scope.handle);
    return { handle: scope.handle, title: c?.name || scope.label, description: c?.description || '' };
  } catch { return { handle: scope.handle, title: scope.label, description: '' }; }
}
async function scopeProductsFor(scope) {
  try { return scopeProducts(await getCatalogIndex(), scope, { acceptProduct, memberSources, categoryScope }); }
  catch (error) {
    if (scope.fallback !== 'collection') throw error;
    console.warn('[catalog-index] liste directe', scope.handle, error.message);
    return (await getScopeIndex(scope.handle)).products;
  }
}
// Résultats mémorisés par liste et par combinaison de filtres (la page non filtrée
// revient le plus souvent) ; ils se renouvellent avec l'index.
const scopePageMemo = new WeakMap();
async function getScopePage(scope, query) {
  const [products, collection, { DISPLAY_PAGE_SIZE }] = await Promise.all([scopeProductsFor(scope), scopeCollectionInfo(scope), import('../../v3/catalog-pagination.mjs')]);
  let memo = scopePageMemo.get(products);
  if (!memo) scopePageMemo.set(products, memo = new Map());
  const key = filterParams(parseFilters(query)).toString();
  let result = memo.get(key);
  if (!result) {
    result = filterCatalog(products, query, DISPLAY_PAGE_SIZE, { categories: scope.categories });
    if (memo.size >= 200) memo.delete(memo.keys().next().value);
    memo.set(key, result);
  }
  return { scope, collection, ...result };
}
// Partie d'index servie par /index-catalogue/<part>.json : construite au plus une fois
// par INDEX_FRESH, gzippée à la demande et mémorisée par instance (état privé du module).
async function indexPart(part) {
  if (!INDEX_PART_NAMES.has(part)) return null;
  if (!indexResponse || Date.now() - indexResponse.builtAt > INDEX_FRESH) {
    indexBuilding ||= buildIndexNow()
      .then(index => { const packed = packIndex(index); return { builtAt: index.builtAt, count: index.products.length, texts: { membres: packed.membres, ...Object.fromEntries(packed.parts.map((text, i) => [String(i), text])) }, gzip: {} }; })
      .finally(() => { indexBuilding = null; });
    indexResponse = await indexBuilding;
  }
  const gzip = indexResponse.gzip[part] ||= zlib.gzipSync(indexResponse.texts[part]);
  return { gzip, builtAt: indexResponse.builtAt, count: indexResponse.count };
}

// État de l'index pour /api/health : date de construction, âge, nombre de produits.
function indexStatus() {
  if (!indexEntry) return { loaded: false };
  const builtAt = indexEntry.index.builtAt;
  return { loaded: true, builtAt: new Date(builtAt).toISOString(), ageS: Math.round((Date.now() - builtAt) / 1000), products: indexEntry.index.products.length };
}

module.exports = { INDEX_PART_NAMES, getCatalogIndex, getScopePage, indexPart, indexStatus };
