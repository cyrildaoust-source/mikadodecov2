const { variantPresentation } = require('./catalog-filters');

// Choix stable parmi les seules variantes remisées : disponible, en stock,
// puis prix le plus bas. À prix égal, conserver la finition éditoriale actuelle.
function promotionVariantCard(product) {
  const discounted = (product.variants || []).filter(v => v.id
    && Number.isFinite(v.price) && v.price >= 0
    && Number.isFinite(v.compareAtPrice) && v.compareAtPrice > v.price);
  if (!discounted.length) return product; // Les offres conditionnelles gardent leur propre affichage.
  const stock = v => typeof v.qty === 'number' && v.qty > 0;
  const chosen = discounted.sort((a, b) => Number(b.available === true) - Number(a.available === true)
    || Number(stock(b)) - Number(stock(a))
    || a.price - b.price
    || Number(b.id === product.variantId) - Number(a.id === product.variantId)
    || a.id.localeCompare(b.id))[0];
  let image = chosen.image;
  if (image) {
    try {
      const url = new URL(image);
      if (url.hostname === 'cdn.shopify.com') {
        url.searchParams.set('width', '600');
        url.searchParams.set('format', 'webp');
        image = url.href;
      }
    } catch { /* Les images locales gardent leur URL. */ }
  }
  const finishLabel = chosen.title === 'Default Title' ? '' : chosen.title;
  return {
    ...product,
    ...variantPresentation({ ...chosen, image, finishLabel }, product),
    priceMin: chosen.price,
    priceMax: chosen.price,
  };
}

module.exports = { promotionVariantCard };
