// Titre et description SEO des listes filtrables (catégories, familles, marques, gammes).
// Une description éditoriale (famille, créateur, collection Shopify) prime toujours ;
// sinon la description décrit réellement la page : nombre de pièces, marques ou familles.
const { listingTitle } = require('./render/seo');

const SHOP = 'Conseil en boutique à Uccle, livraison en Belgique.';
const MAX = 160;

const pieces = n => `${n} pièce${n > 1 ? 's' : ''}`;
const listFr = items => items.length < 2 ? items.join('') : items.slice(0, -1).join(', ') + ' et ' + items.at(-1);
const top = (facet = [], n) => facet.filter(f => f.count > 0 && f.value !== 'inconnu').sort((a, b) => b.count - a.count).slice(0, n).map(f => f.label);
const clip = text => text.length <= MAX ? text : text.slice(0, MAX - 1).replace(/\s+\S*$/, '') + '…';

function seoMeta(scope, data, { brandName = '', editorial = '' } = {}) {
  const label = scope.label, total = data.total || 0;
  if (brandName) return {
    title: `${label} ${brandName} · Mikado Deco`,
    description: clip(`${label} ${brandName} : ${pieces(total)} de design chez Mikado Deco. ${SHOP}`),
  };
  const title = scope.ogTitle || listingTitle(label, scope.collectionKind === 'brand' ? 'brand' : 'family');
  if (editorial || scope.ogDescription) return { title, description: clip(editorial || scope.ogDescription) };
  if (scope.collectionKind === 'brand') {
    const families = top(data.facets?.category, 3).map(f => f.toLowerCase());
    return { title, description: clip(`${label} chez Mikado Deco : ${pieces(total)}${families.length ? ', ' + listFr(families) : ''}. ${SHOP}`) };
  }
  const brands = top(data.facets?.brand, 4);
  return { title, description: clip(`${label} : ${pieces(total)} de design${brands.length ? ' signées ' + listFr(brands) : ''}. ${SHOP}`) };
}

module.exports = { seoMeta };
