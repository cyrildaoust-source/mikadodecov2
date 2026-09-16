const { brands } = require('../v3/mega-menu-brands.json');
const families = require('../data/family-pages.json');
const { isTable, isOutdoor } = require('./table-collections');
const slugify = value => String(value ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const brandName = (slug, active = []) => brands.find(brand => slugify(brand.name) === slug)?.name
  || active.find(brand => slugify(brand.name) === slug)?.name
  || slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
const EXTRA_FAMILIES = {
  sieges: ['chaises', 'fauteuils', 'canapes', 'sieges-de-bureau', 'chaises-longues', 'tabourets-et-bancs'],
  outdoor: ['chaises-outdoor', 'tables-outdoor', 'bancs-outdoor', 'bains-de-soleil-transats', 'parasols-ombrages', 'brasero-barbecue', 'accessoires-jardin'],
};
const PREFIX = 'family-brand-v1.';
function collectionSources(handle) {
  const children = Object.hasOwn(families, handle) ? families[handle].categories.map(item => item.handle)
    : Object.hasOwn(EXTRA_FAMILIES, handle) ? EXTRA_FAMILIES[handle] : [];
  return [handle, ...children.filter(child => handle !== 'tables' || child !== 'tables-outdoor')];
}
const inFamily = (handle, product) => handle !== 'tables' || isTable(product) && !isOutdoor(product);

// Intersection après les règles de collection (notamment tables intérieur / extérieur).
// Remplit le lot en suivant les curseurs, même si les premiers produits sont
// d'autres marques. Ne dépend pas des filtres activés dans Search & Discovery.
async function brandCollectionPage({ handle, first, after, brand, tag = '' }, fetchPage) {
  const limit = Math.max(1, Math.min(100, parseInt(first) || 50));
  const sources = collectionSources(handle);
  const items = [];
  const visited = new Set();
  let cursor = after || null;
  let source = 0;
  let offset = 0;
  if (after?.startsWith(PREFIX)) {
    const state = JSON.parse(Buffer.from(after.slice(PREFIX.length), 'base64url').toString());
    if (state.handle !== handle || state.brand !== brand || state.tag !== tag || !Number.isInteger(state.source) || state.source < 0 || state.source >= sources.length || !Number.isInteger(state.offset) || state.offset < 0 || state.offset > 100 || !(state.cursor === null || typeof state.cursor === 'string')) throw new Error('Invalid family brand cursor');
    ({ source, cursor, offset } = state);
  }
  let collection;
  const result = hasNextPage => ({ collection, items, pageInfo: { hasNextPage,
    endCursor: hasNextPage ? PREFIX + Buffer.from(JSON.stringify({ handle, brand, tag, source, cursor, offset })).toString('base64url') : null },
    brand: { slug: brand, name: brandName(brand, items.map(product => ({ name: product.brand }))) } });
  do {
    const key = source + ':' + (cursor || '');
    if (visited.has(key)) throw new Error('Collection cursor did not advance');
    visited.add(key);
    // Même lot de 100 pour SSR et API : cache partagé et moins d'allers-retours
    // pour les marques rares. L'offset conserve la place exacte dans ce lot.
    const page = await fetchPage(100, cursor, sources[source]);
    if (!page) {
      source++; cursor = null; offset = 0;
      continue;
    }
    collection ||= { ...page.collection, ...(handle ? { handle, title: families[handle]?.title || ({ sieges: 'Assises', outdoor: 'Jardin' })[handle] || page.collection.title } : {}) };
    for (; offset < page.items.length; offset++) {
      const product = page.items[offset];
      if (slugify(product.brand) === brand
      && inFamily(handle, product)
      // Une fiche peut appartenir à sa famille et à plusieurs enfants. La
      // première collection dans cet ordre en est l'unique source.
      && !sources.slice(0, source).some(previous => (product.collections || []).includes(previous))) {
        if (items.length === limit) return result(true);
        items.push(handle ? { ...product, collections: [...new Set([...(product.collections || []), handle])] } : product);
      }
    }
    const pageInfo = page.pageInfo;
    if (pageInfo?.hasNextPage && !pageInfo.endCursor) throw new Error('Missing collection cursor');
    cursor = pageInfo?.hasNextPage ? pageInfo.endCursor : null;
    offset = 0;
    if (!cursor) source++;
  } while (source < sources.length);
  return collection ? result(false) : null;
}

module.exports = { brandCollectionPage, brandName };
