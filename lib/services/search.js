const {parseSearch} = require('../search-intent');
const {searchQuery,scopedSearchQuery,readSearchCatalog,searchCatalog} = require('../search-catalog');
const {VARIANT_QUERY: CHAIR_VARIANT_QUERY} = require('../chair-catalog');
const {PRODUCT_CARD_FIELDS} = require('../shopify/queries');
const {shopifyFetch} = require('../shopify/client');
const {mapProduct,shopifyResize,CARD_IMAGE_WIDTH} = require('../shopify/product-mapper');

const GLOBAL_SEARCH_QUERY = searchQuery(PRODUCT_CARD_FIELDS);
const SCOPED_SEARCH_QUERY = scopedSearchQuery(PRODUCT_CARD_FIELDS);
const searchIndexes = new Map(), searchLoading = new Map();
let searchEpoch = 0;
async function getSearchIndex(intent) {
  const core=intent.scopeQuery||intent.core;
  const key=(intent.scopeQuery?'scope:':'text:')+core.toLowerCase(), previous=searchIndexes.get(key);
  if(previous?.expires>Date.now())return previous.products;
  if(searchLoading.has(key))return searchLoading.get(key);
  const epoch=searchEpoch;
  const pending=readSearchCatalog(
    async after=>(await shopifyFetch(intent.scopeQuery?SCOPED_SEARCH_QUERY:GLOBAL_SEARCH_QUERY,{q:core,after})).search,
    node=>{const card=mapProduct(node);card.variants.forEach(v=>{v.image=shopifyResize(v.image,CARD_IMAGE_WIDTH);});return card;},
    async(handle,after)=>(await shopifyFetch(CHAIR_VARIANT_QUERY,{handle,after})).product?.variants,
  ).then(products=>{
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
  const [{DISPLAY_PAGE_SIZE},products]=await Promise.all([import('../../v3/catalog-pagination.mjs'),intent.issues.length||intent.needsCategory?[]:getSearchIndex(intent)]);
  return searchCatalog(products,input,DISPLAY_PAGE_SIZE);
}

function clearSearchCache() { searchEpoch++; searchIndexes.clear(); searchLoading.clear(); }
module.exports = { getSearchPage, clearSearchCache };
