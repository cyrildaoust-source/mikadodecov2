// Données structurées du magasin (data/store.json) : une seule source pour l'accueil, la page contact et
// Mikado Studio, insérée à la place du jeton <!--STORE-JSONLD--> du <template data-head> (lib/render/layout.js).
const store = require('../data/store.json');
const { ORIGIN } = require('./config');

const STORE_ID = ORIGIN + '/#magasin';

function storeNode() {
  return {
    '@type': 'FurnitureStore',
    '@id': STORE_ID,
    name: store.name,
    legalName: store.legalName,
    vatID: store.vatID,
    description: store.description,
    url: ORIGIN + '/',
    image: ORIGIN + '/images/og-default.jpg',
    logo: ORIGIN + '/apple-touch-icon.png',
    telephone: store.telephone,
    email: store.email,
    priceRange: store.priceRange,
    address: { '@type': 'PostalAddress', ...store.address },
    geo: { '@type': 'GeoCoordinates', ...store.geo },
    hasMap: store.map,
    openingHoursSpecification: store.hours.map(h => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
    contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer service', telephone: store.telephone, email: store.email, availableLanguage: store.languages, areaServed: 'BE' }],
    sameAs: store.sameAs,
  };
}

// Mikado Studio : le service de conseil, rendu par le magasin.
function studioNode() {
  return {
    '@type': 'Service',
    '@id': ORIGIN + '/studio.html#service',
    name: 'Mikado Studio',
    serviceType: 'Conseil en aménagement intérieur',
    description: "Conseil en aménagement de Mikado Deco à Uccle : séance d'une heure, plan d'aménagement ou accompagnement complet.",
    url: ORIGIN + '/studio.html',
    areaServed: { '@type': 'AdministrativeArea', name: 'Bruxelles' },
    provider: { '@id': STORE_ID },
  };
}

function storeJsonLd({ studio = false } = {}) {
  const graph = studio ? [storeNode(), studioNode()] : [storeNode()];
  return `<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)}\n</script>`;
}

module.exports = { STORE_ID, storeJsonLd, storeNode };
