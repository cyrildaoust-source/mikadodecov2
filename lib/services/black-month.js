// Pièces du Black Month lues dans Shopify (lib/black-month.js), gardées 15 minutes. Sans réponse, la page
// garde son bandeau et sa grille standard : l'opération ne bloque jamais le site.
const { cached } = require('../cache');
const { active, readOffer } = require('../black-month');
const { fetchPromoForVariant, getCollectionProducts } = require('./catalog');

const OFFER_TTL = 15 * 60_000;
function getBlackMonth() {
  if (!active()) return Promise.resolve(null);
  return cached('black-month:offer', () => {
    const { getCatalogIndex } = require('./catalog-scope');   // chargé ici : catalog-scope dépend de catalog
    return readOffer({
      collectionIds: async handle => ((await getCollectionProducts(handle, 100)) || {}).items?.map(p => p.id) || [],
      getIndex: () => getCatalogIndex(),
      probe: fetchPromoForVariant,
    });
  }, OFFER_TTL);
}
module.exports = { getBlackMonth };
