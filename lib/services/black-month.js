// Pièces du Black Month (lib/black-month.js), gardées 15 minutes par instance. Lecture rapide : le cron du catalogue
// (toutes les 10 min) les précalcule dans Blob ; sans lecture récente, interrogation directe de Shopify. Sans réponse,
// la page garde son bandeau : l'opération ne bloque jamais le site.
const { cached, del } = require('../cache');
const { active, offerFromStored, readOffer } = require('../black-month');
const { fetchPromoForVariant, getCollectionProducts } = require('./catalog');
const store = require('./catalog-index-store');

const OFFER_TTL = 15 * 60_000;
const STORED_MAX_AGE = 30 * 60_000;
const BLOB_NAME = 'black-month.json';
const index = () => require('./catalog-scope').getCatalogIndex();   // chargé ici : catalog-scope dépend de catalog

const readLive = () => readOffer({
  collectionIds: async handle => ((await getCollectionProducts(handle, 100)) || {}).items?.map(p => p.id) || [],
  getIndex: index,
  probe: fetchPromoForVariant,
});
async function readStored() {
  if (!store.blobConfigured()) return null;
  const doc = await store.readJson(BLOB_NAME).catch(error => { console.warn('[black-month] Blob', error.message); return null; });
  if (!doc || !(Date.now() - doc.builtAt < STORED_MAX_AGE)) return null;
  return offerFromStored(doc, await index());
}
function getBlackMonth() {
  if (!active()) return Promise.resolve(null);
  return cached('black-month:offer', async () => (await readStored()) || readLive(), OFFER_TTL);
}
// Appelé par le cron du catalogue, après la construction de l'index.
async function storeBlackMonth() {
  if (!active() || !store.blobConfigured()) return null;
  const offer = await readLive();
  await store.writeJson(BLOB_NAME, { builtAt: Date.now(), productIds: offer.productIds, eligible: [...offer.eligible] });
  del('black-month:offer');
  return offer.pieces.length;
}
module.exports = { getBlackMonth, storeBlackMonth };
