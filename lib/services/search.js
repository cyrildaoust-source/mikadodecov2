const {parseSearch} = require('../search-intent');
const {searchQuery,scopedSearchQuery,readSearchCatalog,searchCatalog,searchURL,prepareSearchProduct} = require('../search-catalog');
const {VARIANT_QUERY: CHAIR_VARIANT_QUERY} = require('../chair-catalog');
const {PRODUCT_CARD_FIELDS} = require('../shopify/queries');
const {shopifyFetch} = require('../shopify/client');
const {mapProduct,shopifyResize,CARD_IMAGE_WIDTH} = require('../shopify/product-mapper');

const GLOBAL_SEARCH_QUERY = searchQuery(PRODUCT_CARD_FIELDS);
const SCOPED_SEARCH_QUERY = scopedSearchQuery(PRODUCT_CARD_FIELDS);
const searchIndexes = new Map(), searchLoading = new Map();
let searchEpoch = 0;
// Recherche rapide (31 octobre 2026 : 5 à 19 s par recherche) : Shopify ne renvoie que les fiches pertinentes
// (identifiant et description, dans son ordre), les variantes viennent de l'index commun du catalogue déjà en
// mémoire. Sans index (construction en cours), lecture complète d'origine ci-dessous.
const SEARCH_IDS_QUERY = `query SearchIds($q: String!, $after: String) { search(query: $q, first: 250, after: $after, types: [PRODUCT], prefix: LAST, unavailableProducts: HIDE) { nodes { ... on Product { id description } } pageInfo { hasNextPage endCursor } } }`;
const SCOPED_IDS_QUERY = `query ScopedSearchIds($q: String!, $after: String) { search: products(query: $q, first: 250, after: $after, sortKey: BEST_SELLING) { nodes { id description } pageInfo { hasNextPage endCursor } } }`;
const preparedByIndex = new WeakMap();
async function searchHits(intent, core) {
  const hits = [], cursors = new Set();
  let after = null;
  do {
    if (cursors.has(after) || cursors.size >= 40) throw new Error('Search cursor did not advance');
    cursors.add(after);
    const page = (await shopifyFetch(intent.scopeQuery ? SCOPED_IDS_QUERY : SEARCH_IDS_QUERY, { q: core, after })).search;
    if (!page?.nodes || !page.pageInfo) throw new Error('Search unavailable');
    hits.push(...page.nodes.filter(n => n?.id));
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  return hits;
}
async function indexedSearch(intent, core) {
  const { getCatalogIndex } = require('./catalog-scope');   // chargé ici : catalog-scope dépend de catalog, qui dépend de ce module
  const [index, hits] = await Promise.all([getCatalogIndex(), searchHits(intent, core)]);
  return joinIndexHits(index, hits);
}
// Fiches de l'index dans l'ordre de Shopify, préparées une fois par construction de l'index (copies : l'index
// commun des listes n'est jamais modifié).
function joinIndexHits(index, hits) {
  let byId = preparedByIndex.get(index);
  if (!byId) preparedByIndex.set(index, byId = { products: new Map(index.products.map(p => [p.card.id, p])), prepared: new Map() });
  return hits.flatMap(({ id, description }) => {
    if (!byId.prepared.has(id)) {
      const product = byId.products.get(id);
      if (!product) return [];   // fiche publiée depuis la dernière construction de l'index (≤ 20 min)
      const copy = structuredClone(product);
      copy.card.description = description || '';
      byId.prepared.set(id, prepareSearchProduct(copy));
    }
    return [byId.prepared.get(id)];
  });
}
async function getSearchIndex(intent) {
  const core=intent.scopeQuery||intent.core;
  const key=(intent.scopeQuery?'scope:':'text:')+core.toLowerCase(), previous=searchIndexes.get(key);
  if(previous?.expires>Date.now())return previous.products;
  if(searchLoading.has(key))return searchLoading.get(key);
  const epoch=searchEpoch;
  const pending=indexedSearch(intent,core).catch(error=>{
    if(!/Index en préparation/.test(error.message))console.warn('[search] index',error.message);
    return readSearchCatalog(
    async after=>(await shopifyFetch(intent.scopeQuery?SCOPED_SEARCH_QUERY:GLOBAL_SEARCH_QUERY,{q:core,after})).search,
    node=>{const card=mapProduct(node);card.variants.forEach(v=>{v.image=shopifyResize(v.image,CARD_IMAGE_WIDTH);});return card;},
    async(handle,after)=>(await shopifyFetch(CHAIR_VARIANT_QUERY,{handle,after})).product?.variants,
  );}).then(products=>{
    if(epoch===searchEpoch) {
      // Borné : les anciennes recherches ne s'accumulent pas dans la fonction.
      searchIndexes.delete(key);while(searchIndexes.size>=12)searchIndexes.delete(searchIndexes.keys().next().value);
      searchIndexes.set(key,{products,expires:Date.now()+300000});
    }
    return products;
  }).finally(()=>{if(searchLoading.get(key)===pending)searchLoading.delete(key);});
  searchLoading.set(key,pending);return pending;
}
async function getSearchPage(input) {
  const intent=parseSearch(input.q,input.omit);
  // Un seul mot de matière ou de couleur (« verre », « noir », « cuir ») : les fiches qui le portent, avec le
  // critère quand il trouve quelque chose, sans lui sinon (jamais plus « 0 modèle, précisez »).
  const wordOnly=intent.needsCategory&&!intent.issues.length&&!intent.omitted.length;
  const [{DISPLAY_PAGE_SIZE},products]=await Promise.all([import('../../v3/catalog-pagination.mjs'),intent.issues.length||intent.needsCategory&&!wordOnly?[]:getSearchIndex(wordOnly?{...intent,core:intent.q,scopeQuery:null}:intent)]);
  if(!wordOnly)return searchCatalog(products,input,DISPLAY_PAGE_SIZE);
  let data=searchCatalog(products,input,DISPLAY_PAGE_SIZE);
  if(!data.total) {
    const wide=searchCatalog(products,{...input,omit:intent.criteria.map(c=>c.id).join(',')},DISPLAY_PAGE_SIZE),state={...wide.state,omit:data.state.omit};
    data={...wide,state,criteria:data.criteria,resultsUrl:searchURL(intent.q,state)};
  }
  return {...data,needsCategory:false,suggestions:[]};
}

function clearSearchCache() { searchEpoch++; searchIndexes.clear(); searchLoading.clear(); }
module.exports = { getSearchPage, clearSearchCache, joinIndexHits };
