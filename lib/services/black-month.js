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
// Pièce réduite aux champs du bandeau « Les grandes pièces » (lib/render/black-month.js, pieceHTML).
const light = ({ product, variant, price, sale, saving }) => ({
  product: { card: { id: product.card.id, handle: product.card.handle, name: product.card.name, brand: product.card.brand, image: product.card.image } },
  variant: { id: variant.id, image: variant.image }, price, sale, saving,
});
// Accueil : nombre de pièces et 8 plus grandes, lus dans Blob en une fraction de seconde (sans l'index du catalogue,
// pas encore chargé au démarrage d'une instance) ; sinon tirés de la lecture complète.
function getBlackMonthHome() {
  if (!active()) return Promise.resolve(null);
  return cached('black-month:home', async () => {
    const doc = store.blobConfigured() ? await store.readJson(BLOB_NAME).catch(() => null) : null;
    if (doc && Date.now() - doc.builtAt < STORED_MAX_AGE && Array.isArray(doc.top)) return { count: doc.count, pieces: doc.top };
    const offer = await getBlackMonth();
    if (!offer) throw new Error('pièces indisponibles');   // rien gardé en cache : réessayé à la visite suivante
    return { count: offer.pieces.length, pieces: offer.pieces.slice(0, 8) };
  }, 5 * 60_000);
}
function getBlackMonth() {
  if (!active()) return Promise.resolve(null);
  return cached('black-month:offer', async () => (await readStored()) || readLive(), OFFER_TTL);
}
// Appelé par le cron du catalogue, après la construction de l'index.
async function storeBlackMonth() {
  if (!active() || !store.blobConfigured()) return null;
  const offer = await readLive();
  // `top` : de quoi afficher « Les grandes pièces » sur l'accueil sans attendre l'index (démarrage à froid).
  await store.writeJson(BLOB_NAME, { builtAt: Date.now(), productIds: offer.productIds, eligible: [...offer.eligible], count: offer.pieces.length, top: offer.pieces.slice(0, 8).map(light) });
  del('black-month:offer'); del('black-month:home');
  return offer.pieces.length;
}
module.exports = { getBlackMonth, getBlackMonthHome, storeBlackMonth };
