// Données structurées Product/Offer d'une fiche, rendues côté serveur.
// L'offre décrit la variante affichée : même prix, prix barré et disponibilité que la page, et porte
// les conditions de livraison et de retour communes à toutes les fiches (data/offer-policy.json,
// tirées des CGV) : Google les exige pour reconnaître une « fiche de marchand » complète.
const fs = require('fs');
const path = require('path');
const POLICY = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'offer-policy.json'), 'utf8'));
const SCHEMA = (name) => 'https://schema.org/' + name;

// Livraison : un tarif unique vers un seul pays (CGV art. 4).
function shippingDetails(p = POLICY.shipping) {
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: p.rate, currency: p.currency },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: p.country },
  };
}
// Retour : fenêtre finie de n jours, renvoi par la poste ou en boutique, frais à la charge du client (CGV art. 2).
function merchantReturnPolicy(r = POLICY.returns) {
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: r.country,
    returnPolicyCategory: SCHEMA('MerchantReturnFiniteReturnWindow'),
    merchantReturnDays: r.days,
    returnMethod: r.methods.map(SCHEMA),
    returnFees: SCHEMA(r.fees),
  };
}

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
      shippingDetails: shippingDetails(),
      hasMerchantReturnPolicy: merchantReturnPolicy(),
    },
  };
}

module.exports = { merchantReturnPolicy, productJsonLd, shippingDetails, validGtin };
