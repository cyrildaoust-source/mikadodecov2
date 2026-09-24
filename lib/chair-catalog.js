const { buildFilterProduct, filterCatalog } = require('./catalog-filters');

const FILTER_FIELDS = [
  'custom.material','custom.materiaux','custom.dimensions','custom.usage',
  'custom.width_cm','custom.depth_cm','custom.height_cm','custom.seat_height_cm','custom.search_facts',
  'custom.has_armrests','custom.stackable','custom.foldable',
  'shopify.furniture-fixture-material','shopify.material','shopify.chair-features',
];
const identifiers = fields => fields.map(field=>{const [namespace,key]=field.split('.');return `{ namespace: "${namespace}", key: "${key}" }`;}).join('\n');
const variantExtra = `pageInfo { hasNextPage endCursor }
  edges { node { quantityAvailable
    filterMetafields: metafields(identifiers: [${identifiers(['custom.color_family','custom.material_family','custom.search_facts'])}]) {
      namespace key type value
    }
  } }`;

// Requête générique : toute collection filtrable (Chaises, puis les sous-catégories).
function scopeQuery(cardFragment) {
  return `${cardFragment.replace('variants(first: 250)', 'variants(first: 100)')}
    query CollectionCatalog($handle: String!, $after: String) {
      collection(handle: $handle) {
        handle title description
        products(first: 50, after: $after, sortKey: BEST_SELLING) {
          pageInfo { hasNextPage endCursor }
          edges { node {
            ...ProductCardFields
            variants(first: 100) { ${variantExtra} }
            filterMetafields: metafields(identifiers: [${identifiers(FILTER_FIELDS)}]) {
              namespace key type value references(first: 30) { nodes { ... on Metaobject { handle fields { key value } } } }
            }
          } }
        }
      }
    }`;
}
const VARIANT_QUERY = `query ChairVariants($handle: String!, $after: String) {
  product(handle: $handle) { variants(first: 250, after: $after) {
    ${variantExtra}
    edges { node { id title price { amount currencyCode } compareAtPrice { amount }
      availableForSale selectedOptions { name value } image { url altText }
    } }
  } }
}`;

const chairQuery = scopeQuery;

async function readChairCatalog(fetchPage, mapProduct, fetchVariants) {
  const products = [], seenProducts = new Set(), cursors = new Set();
  let after = null, collection;
  do {
    if(cursors.has(after)) throw new Error('Collection cursor did not advance');
    cursors.add(after);
    const data = await fetchPage(after);
    if(!data?.products?.edges || !data.products.pageInfo) throw new Error('Collection unavailable');
    collection = {handle:data.handle,title:data.title,description:data.description};
    for(const {node} of data.products.edges) {
      if(seenProducts.has(node.id)) continue;
      const vc = new Set();
      while(node.variants.pageInfo?.hasNextPage) {
        const cursor = node.variants.pageInfo.endCursor;
        if(!cursor || vc.has(cursor) || !fetchVariants) throw new Error('Incomplete variants');
        vc.add(cursor);
        const more = await fetchVariants(node.handle,cursor);
        if(!more?.edges || !more.pageInfo) throw new Error('Variants unavailable');
        node.variants.edges.push(...more.edges);node.variants.pageInfo=more.pageInfo;
      }
      seenProducts.add(node.id);
      const card = mapProduct(node);
      if(card.image && card.variants.length) products.push(buildFilterProduct(node,card));
    }
    if(!data.products.pageInfo.hasNextPage) break;
    after=data.products.pageInfo.endCursor;
    if(!after) throw new Error('Missing collection cursor');
  } while(true);
  return {collection,products};
}

module.exports = {scopeQuery,chairQuery,VARIANT_QUERY,readChairCatalog,readScopeCatalog:readChairCatalog,filterCatalog,FILTER_FIELDS};
