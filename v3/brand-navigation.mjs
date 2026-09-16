export { listingContext } from './navigation.mjs';

export function productBrandHref(slug, brandMap, from = '') {
  if (!slug) return '/produits.html';
  const selection = from.match(/^coll-brand:([a-z0-9-]+):([a-z0-9-]+)$/);
  const collection = from.match(/^coll:([a-z0-9-]+)$/);
  const handle = selection?.[1] || collection?.[1];
  if (handle && !Object.values(brandMap).includes(handle)) {
    return `/collections/${encodeURIComponent(handle)}?brand=${encodeURIComponent(slug)}`;
  }
  return brandMap[slug] ? `/collections/${brandMap[slug]}` : `/produits.html?brand=${encodeURIComponent(slug)}`;
}
