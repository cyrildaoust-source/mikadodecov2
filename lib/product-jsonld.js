// Données structurées Product/Offer d'une fiche, rendues côté serveur.
// L'offre décrit la variante affichée : même prix, prix barré et disponibilité que la page.

// GTIN-8, 12, 13 ou 14 avec clé de contrôle valide ; sinon rien (jamais de code approximatif).
function validGtin(code) {
  const digits = String(code || '').replace(/\s+/g, '');
  if (!/^(\d{8}|\d{12,14})$/.test(digits)) return '';
  const body = digits.slice(0, -1).split('').reverse();
  const sum = body.reduce((total, d, i) => total + Number(d) * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === Number(digits.at(-1)) ? digits : '';
}

function productJsonLd(product, variant, { url, image, seller }) {
  const price = variant ? variant.price : product.priceMin;
  const was = variant?.compareAtPrice;
  const inStock = variant ? (typeof variant.qty === 'number' && variant.qty > 0) : product.inStock;
  const available = variant ? variant.available !== false : product.available;
  const gtin = validGtin(variant?.barcode);
  return {
    '@context': 'https://schema.org', '@type': 'Product', name: product.name || 'Produit',
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    ...(variant?.sku ? { sku: variant.sku } : {}),
    ...(gtin ? { gtin } : {}),
    // Texte brut Shopify : l'échappement est celui de JSON.stringify, jamais des entités HTML.
    ...(product.description ? { description: product.description } : {}),
    ...(image ? { image } : {}),
    url,
    itemCondition: 'https://schema.org/NewCondition',
    offers: {
      '@type': 'Offer', priceCurrency: 'EUR',
      ...(price != null && !Number.isNaN(price) ? { price: String(price) } : {}),
      ...(was != null && price != null && was > price ? { priceSpecification: { '@type': 'UnitPriceSpecification', priceType: 'https://schema.org/StrikethroughPrice', price: String(was), priceCurrency: 'EUR' } } : {}),
      availability: 'https://schema.org/' + (inStock ? 'InStock' : (available ? 'BackOrder' : 'OutOfStock')),
      itemCondition: 'https://schema.org/NewCondition',
      url,
      ...(seller ? { seller: { '@type': 'Organization', name: seller } } : {}),
    },
  };
}

module.exports = { validGtin, productJsonLd };
