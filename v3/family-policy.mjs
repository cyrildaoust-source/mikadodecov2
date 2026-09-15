// Sélection éditoriale : un tag de recherche ne suffit pas à faire une icône.
// Décision de Cyril du 14/09/2026 ; à conserver jusqu'à correction du tag Shopify.
export const ICON_TAGS = ['icone', 'icone-design'];
const excludedIconHandles = new Set(['chaise-hay-aac-26']);

export function isFamilyIcon(product) {
  return !!product?.handle && !excludedIconHandles.has(product.handle)
    && ICON_TAGS.some(tag => (product.tags || []).includes(tag));
}

export function uniqueProducts(products) {
  const seen = new Set();
  return (products || []).filter(product => {
    const key = product?.handle || product?.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Mélangé une seule fois à l'ouverture de la page ; jamais pendant la lecture.
export function shuffledProducts(products, random = Math.random) {
  const result = uniqueProducts(products);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
