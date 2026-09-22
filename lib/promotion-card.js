const { variantPresentation } = require('./catalog-filters');

// Une remise sur une finition ne doit jamais être associée au prix, au lien
// ou à la photo de la première variante non remisée du modèle.
function promotionCard(product) {
  const discounted = (product.variants || []).filter(v => v.price > 0 && v.compareAtPrice > v.price + 0.5);
  if (!discounted.length) return product; // offres automatiques au panier, dont Panton
  const chosen = discounted.find(v => v.available && v.qty > 0)
    || discounted.find(v => v.available) || discounted[0];
  const finishLabel = (chosen.options || []).map(o => o.value).filter(v => v && v !== 'Default Title').join(' · ')
    || (chosen.title === 'Default Title' ? '' : chosen.title);
  return { ...product, ...variantPresentation({ ...chosen, finishLabel }, product) };
}
module.exports = { promotionCard };
