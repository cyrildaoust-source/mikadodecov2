const { brands } = require('../v3/mega-menu-brands.json');
const slugify = value => String(value ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const brandName = slug => brands.find(brand => slugify(brand.name) === slug)?.name || slug;

// Intersection après les règles de collection (notamment tables intérieur / extérieur).
// Remplit le lot en suivant les curseurs, même si les premiers produits sont
// d'autres marques. Ne dépend pas des filtres activés dans Search & Discovery.
async function brandCollectionPage({ first, after, brand }, fetchPage) {
  const limit = Math.max(1, Math.min(100, parseInt(first) || 50));
  const items = [];
  const visited = new Set();
  let cursor = after || null;
  let collection;
  let pageInfo;
  do {
    if (visited.has(cursor)) throw new Error('Collection cursor did not advance');
    visited.add(cursor);
    const page = await fetchPage(limit - items.length, cursor);
    if (!page) return null;
    collection ||= page.collection;
    items.push(...page.items.filter(product => slugify(product.brand) === brand));
    pageInfo = page.pageInfo;
    if (pageInfo?.hasNextPage && !pageInfo.endCursor) throw new Error('Missing collection cursor');
    cursor = pageInfo?.hasNextPage ? pageInfo.endCursor : null;
  } while (cursor && items.length < limit);
  return { collection, items, pageInfo, brand: { slug: brand, name: brandName(brand) } };
}

module.exports = { brandCollectionPage, brandName };
