const { brands } = require('../v3/mega-menu-brands.json');
const families = require('../data/family-pages.json');
const { isTable, isOutdoor } = require('./table-collections');
const slugify = value => String(value ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const brandName = slug => brands.find(brand => slugify(brand.name) === slug)?.name || slug;
const EXTRA_FAMILIES = {
  sieges: ['chaises', 'fauteuils', 'canapes', 'sieges-de-bureau', 'chaises-longues', 'tabourets-et-bancs'],
  outdoor: ['chaises-outdoor', 'tables-outdoor', 'bancs-outdoor', 'bains-de-soleil-transats', 'parasols-ombrages', 'brasero-barbecue', 'accessoires-jardin'],
};
const PREFIX = 'family-brand-v1.';

// Intersection après les règles de collection (notamment tables intérieur / extérieur).
// Remplit le lot en suivant les curseurs, même si les premiers produits sont
// d'autres marques. Ne dépend pas des filtres activés dans Search & Discovery.
async function brandCollectionPage({ handle, first, after, brand, tag = '' }, fetchPage) {
  const limit = Math.max(1, Math.min(100, parseInt(first) || 50));
  const children = Object.hasOwn(families, handle) ? families[handle].categories.map(item => item.handle)
    : Object.hasOwn(EXTRA_FAMILIES, handle) ? EXTRA_FAMILIES[handle] : [];
  const sources = [handle, ...children.filter(child => handle !== 'tables' || child !== 'tables-outdoor')];
  const items = [];
  const visited = new Set();
  let cursor = after || null;
  let source = 0;
  if (after?.startsWith(PREFIX)) {
    const state = JSON.parse(Buffer.from(after.slice(PREFIX.length), 'base64url').toString());
    if (state.handle !== handle || state.brand !== brand || state.tag !== tag || !Number.isInteger(state.source) || state.source < 0 || state.source >= sources.length || !(state.cursor === null || typeof state.cursor === 'string')) throw new Error('Invalid family brand cursor');
    ({ source, cursor } = state);
  }
  let collection;
  do {
    const key = source + ':' + (cursor || '');
    if (visited.has(key)) throw new Error('Collection cursor did not advance');
    visited.add(key);
    const page = await fetchPage(limit - items.length, cursor, sources[source]);
    if (!page) {
      source++; cursor = null;
      continue;
    }
    collection ||= { ...page.collection, ...(handle ? { handle, title: families[handle]?.title || ({ sieges: 'Assises', outdoor: 'Jardin' })[handle] || page.collection.title } : {}) };
    items.push(...page.items.filter(product => slugify(product.brand) === brand
      && (handle !== 'tables' || isTable(product) && !isOutdoor(product))
      // Une fiche peut appartenir à sa famille et à plusieurs enfants. La
      // première collection dans cet ordre en est l'unique source.
      && !sources.slice(0, source).some(previous => (product.collections || []).includes(previous)))
      .map(product => handle ? { ...product, collections: [...new Set([...(product.collections || []), handle])] } : product));
    const pageInfo = page.pageInfo;
    if (pageInfo?.hasNextPage && !pageInfo.endCursor) throw new Error('Missing collection cursor');
    cursor = pageInfo?.hasNextPage ? pageInfo.endCursor : null;
    if (!cursor) source++;
  } while (source < sources.length && items.length < limit);
  const hasNextPage = source < sources.length;
  const endCursor = hasNextPage ? PREFIX + Buffer.from(JSON.stringify({ handle, brand, tag, source, cursor })).toString('base64url') : null;
  return collection ? { collection, items, pageInfo: { hasNextPage, endCursor }, brand: { slug: brand, name: brandName(brand) } } : null;
}

module.exports = { brandCollectionPage, brandName };
