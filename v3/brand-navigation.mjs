// Fonctions communes, sans DOM : une fiche garde la catégorie d'où elle vient.
export function listingContext(url) {
  const params = url.searchParams;
  const match = url.pathname.match(/^\/collections\/([a-z0-9-]+)\/?$/);
  const handle = match?.[1] || params.get('coll');
  if (handle && handle !== 'all' && /^[a-z0-9-]+$/.test(handle)) {
    return params.get('brand') ? `coll-brand:${handle}:${params.get('brand')}` : `coll:${handle}`;
  }
  if (params.get('designer')) return 'designer:' + params.get('designer');
  if (params.get('brand')) return 'brand:' + params.get('brand');
  return '';
}

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
