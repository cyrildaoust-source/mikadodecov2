// Black Month 2026 — Mikado Deco (demande de Cyril du 9 novembre 2026)
// ---------------------------------------------------------------------
// Un seul endroit décide de l'opération : la fenêtre d'affichage (bloc `blackMonth` de data/campaigns.json,
// extinction automatique le 29 novembre au matin), le compte à rebours et les pièces réellement remisées.
//
// Les pièces ne sont jamais listées en dur : la remise automatique de Shopify (instance promotions) porte la
// liste des variantes, qui change pendant l'opération. Le site interroge Shopify (aperçu de panier) pour chaque
// variante EN STOCK de la collection de l'offre et ne retient que celles où la remise « Black Month » s'applique.
//
// Règles d'affichage du prix (instance promotions, 9 novembre 2026) :
// - prix remisé = prix normal actuel de Shopify − 20 %, arrondi au centime comme le panier ;
// - variante à moins de 200 € : jamais de prix remisé seul (faux au panier pour un achat isolé), seulement
//   « −20 % dès 200 € de mobilier » ;
// - pas de prix barré tiré d'un historique : le prix barré est le prix normal actuel.
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./paths');
const { now } = require('./christmas');

const DAY = 86_400_000;
const BRUSSELS = 'Europe/Brussels';
const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'campaigns.json'), 'utf8')).blackMonth || {};
const config = {
  enabled: raw.enabled === true,
  startsAt: Date.parse(raw.startsAt),
  endsAt: Date.parse(raw.endsAt),
  lastDay: raw.lastDay,
  collection: raw.collection,
  discountTitle: String(raw.discountTitle || 'Black Month'),
  percent: Number(raw.percent) || 20,
  minimum: Number(raw.minimum) || 200,
  heroImage: raw.heroImage || '',
  heroImageAlt: raw.heroImageAlt || '',
};
const PAGE = '/collections/' + config.collection;

// Opération terminée : la page de l'offre redirige vers Promotions (audit SEO du 10 novembre 2026 :
// pas de page périmée dans l'index).
function ended(at = now()) {
  return Number.isFinite(config.endsAt) && at >= config.endsAt;
}
function active(at = now()) {
  return config.enabled && Number.isFinite(config.startsAt) && Number.isFinite(config.endsAt) && at >= config.startsAt && at < config.endsAt;
}
// Jours restants, dernier jour compris (à Bruxelles) : 1 le 28 novembre.
const brusselsDay = t => new Intl.DateTimeFormat('en-CA', { timeZone: BRUSSELS }).format(new Date(t));
function daysLeft(at = now()) {
  const today = Date.parse(brusselsDay(at) + 'T00:00:00Z'), last = Date.parse(config.lastDay + 'T00:00:00Z');
  return Math.max(0, Math.round((last - today) / DAY) + 1);
}
function countdown(at = now()) {
  const n = daysLeft(at);
  return n <= 1 ? 'Dernier jour' : `Plus que ${n} jours`;
}
const isOffer = title => typeof title === 'string' && title.toLowerCase().includes(config.discountTitle.toLowerCase());
const cents = n => Math.round(n * 100) / 100;
// Prix d'une variante remisée : remisé et économie seulement à partir du minimum.
function offerPrice(price) {
  if (!Number.isFinite(price) || price < config.minimum) return { price, sale: null, saving: null };
  const sale = cents(price * (1 - config.percent / 100));
  return { price, sale, saving: cents(price - sale) };
}

// Pièces de l'offre, de la plus chère à la moins chère : la variante remisée la plus chère de chaque fiche.
// products : fiches de l'index commun ({ card, variants }) ; eligible : identifiants de variantes remisées.
function offerPieces(products, eligible) {
  return products.flatMap(product => {
    const variants = product.variants.filter(v => eligible.has(v.id));
    if (!variants.length) return [];
    const variant = variants.reduce((a, b) => (b.price > a.price ? b : a));
    return [{ product, variant, ...offerPrice(variant.price) }];
  }).sort((a, b) => b.price - a.price);
}

// Variantes à interroger : en stock, disponibles, avec un prix.
const candidates = products => products.flatMap(p => p.variants.filter(v => v.available && typeof v.qty === 'number' && v.qty > 0 && Number.isFinite(v.price)));

// Lecture complète (Shopify) : membres de la collection, fiches de l'index, puis sonde de chaque variante en stock.
// Bornée à 3 aperçus de panier en vol (alerte « Throttled » du 12 octobre 2026). Le résultat est gardé 15 min.
async function readOffer({ collectionIds, getIndex, probe }) {
  const [ids, index] = await Promise.all([collectionIds(config.collection), getIndex()]);
  const byId = new Map(index.products.map(p => [p.card.id, p]));
  const products = ids.map(id => byId.get(id)).filter(Boolean);
  const queue = candidates(products), eligible = new Set();
  let i = 0;
  const worker = async () => { while (i < queue.length) { const v = queue[i++]; if (isOffer(await probe(v.id))) eligible.add(v.id); } };
  await Promise.all(Array.from({ length: Math.min(3, queue.length) }, worker));
  return { pieces: offerPieces(products, eligible), eligible };
}

module.exports = { PAGE, active, ended, config, countdown, daysLeft, isOffer, offerPieces, offerPrice, readOffer };
