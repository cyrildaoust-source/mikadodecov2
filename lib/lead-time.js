// Délais de livraison des articles sur commande — Mikado Deco (ADR 0015)
// ----------------------------------------------------------------------
// Un seul endroit décide du délai annoncé d'une fiche hors stock, à partir de données que
// chaque fiche porte déjà (marque, collections, tags, métachamp) et d'une table de règles
// par marque et famille (data/lead-times.json). Aucune saisie fiche par fiche.
//
// La table donne le délai de la MARQUE vers Mikado (article en stock chez elle) ; le site ajoute
// la marge Mikado et affiche le résultat en jours ouvrés quand c'est court, en semaines sinon.
//
// Résolution, du plus précis au plus général :
//   1. métachamp custom.lead_time de la fiche (exception par fiche : délai de la MARQUE vers Mikado en texte libre,
//      « 6-10 semaines », « 10 jours ouvrés » ; la marque livre jusqu'à la boutique → le site ajoute 2–3 jours ouvrés de réception
//      et d'envoi (margin.metafieldDays) ; « sur demande » affiché tel quel)
//   2. tag delai-long → « délai sur demande »
//   3. marque + sous-catégorie (handle de collection)   ex. Vitra + canapes
//   4. marque + famille                                  ex. Vitra + sieges
//   5. marque                                            ex. Vitra
//   6. défaut de la table
// Le stock Mikado (« 2–3 jours ») se décide ailleurs, au panier, sur le stock réel de la variante.
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./paths');

const SCHEMA = 'mikado.lead-times@1';
const ON_REQUEST = 'délai sur demande';
// Promesse pour un article EN STOCK Mikado (décision de Cyril, 12 oct. 2026) : préparation + poste.
// Le front (v3/product-card.mjs, v3/pdp-view.mjs) porte le même texte en dur, faute de pouvoir importer ce module.
const IN_STOCK_RANGE = [2, 3];
const IN_STOCK = IN_STOCK_RANGE[0] + '–' + IN_STOCK_RANGE[1] + ' jours';
const DASH = '–';
const BUSINESS_DAYS_PER_WEEK = 5;

const validRange = (r) => {
  if (!Array.isArray(r) || r.length !== 2) return null;
  const [a, b] = r.map(Number);
  return Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= a ? [a, b] : null;
};
// Une règle de la table : { days: [a,b] } ou { weeks: [a,b] } → délai fournisseur en jours ouvrés.
const supplierDays = (rule) => {
  if (!rule || typeof rule !== 'object') return null;
  const d = validRange(rule.days), w = validRange(rule.weeks);
  if (d) return d;
  if (w) return [w[0] * BUSINESS_DAYS_PER_WEEK, w[1] * BUSINESS_DAYS_PER_WEEK];
  return null;
};

let RULES = { margin: [3, 4], marginWeeks: [1, 1], metafieldMargin: [2, 3], maxBusinessDays: 15, default: [10, 15], brands: {} };
try {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'lead-times.json'), 'utf8'));
  if (raw.schema !== SCHEMA) throw new Error(`schéma ${raw.schema || 'absent'} (attendu ${SCHEMA})`);
  RULES = {
    margin: validRange(raw.margin?.days) || [3, 4],
    marginWeeks: validRange(raw.margin?.weeks) || [1, 1],
    metafieldMargin: validRange(raw.margin?.metafieldDays) || [2, 3],   // réception + envoi, le délai de la marque allant jusqu'à la boutique
    maxBusinessDays: Number.isInteger(raw.display?.maxBusinessDays) ? raw.display.maxBusinessDays : 15,
    default: supplierDays(raw.default) || [10, 15],
    brands: raw.brands || {},
  };
} catch (e) { console.warn('[lead-time] table ignorée :', e.message); }

// Délai client à partir du délai fournisseur (jours ouvrés) : marge Mikado, puis affichage.
// Court → « 5–7 jours ouvrés » ; long → semaines (jours ouvrés / 5, arrondis vers le haut).
function customer(supplier, rule) {
  const weekly = rule && !rule.days && rule.weeks;
  const [m0, m1] = weekly ? RULES.marginWeeks.map((w) => w * BUSINESS_DAYS_PER_WEEK) : RULES.margin;
  const days = [supplier[0] + m0, supplier[1] + m1];
  if (days[1] <= RULES.maxBusinessDays) return { range: days, unit: 'jours ouvrés' };
  const weeks = days.map((d) => Math.ceil(d / BUSINESS_DAYS_PER_WEEK));
  return { range: weeks, unit: 'semaines' };
}

// Libellé lisible : [5, 7] jours ouvrés → « 5–7 jours ouvrés », [6, 6] semaines → « 6 semaines ».
function label(range, unit = 'semaines') {
  const [a, b] = range;
  const n = a === b ? String(a) : `${a}${DASH}${b}`;
  const one = a === b && a === 1;
  if (unit === 'jours') return `${n} ${one ? 'jour' : 'jours'}`;
  if (unit === 'jours ouvrés') return `${n} ${one ? 'jour ouvré' : 'jours ouvrés'}`;
  return `${n} ${one ? 'semaine' : 'semaines'}`;
}

// Texte libre d'un métachamp → plage (délai de la marque vers Mikado) ; « sur demande » → demande ; sinon null.
function parse(text) {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return null;
  if (/demande|nous consulter|sur devis/.test(t)) return { onRequest: true };
  const m = t.match(/(\d+)\s*(?:[-–à]\s*(\d+))?\s*(semaine|jour|mois)/);
  if (!m) return null;
  let a = Number(m[1]), b = Number(m[2] || m[1]);
  if (m[3] === 'mois') { a *= 4; b *= 4; }
  const unit = m[3] === 'jour' ? (/ouvr/.test(t) ? 'jours ouvrés' : 'jours') : 'semaines';
  return a <= b ? { range: [a, b], unit } : null;
}

const norm = (s) => String(s || '').trim().toLowerCase();
const result = (c, source) => ({ onRequest: false, range: c.range, unit: c.unit, label: label(c.range, c.unit), source });

// Délai d'une fiche sur commande. `collections` = handles des collections de la fiche.
function leadTimeFor({ vendor, collections = [], tags = [], leadTime = '' } = {}) {
  const exception = parse(leadTime);
  if (exception?.onRequest) return { onRequest: true, label: ON_REQUEST, source: 'metafield' };
  if (exception) {
    // Délai de la marque jusqu'à la boutique (décision de Cyril du 14 oct. 2026) + 2–3 jours ouvrés de réception et d'envoi.
    // Jours calendaires → jours ouvrés (5/7, arrondis vers le haut). En semaines, la plage reste en semaines : borne basse
    // arrondie vers le bas, borne haute vers le haut (« 6-10 semaines » → 6–11), jamais moins que la marque.
    const weekly = exception.unit === 'semaines';
    const toBusiness = (d) => (exception.unit === 'jours' ? Math.ceil(d * BUSINESS_DAYS_PER_WEEK / 7) : d);
    const supplier = weekly ? exception.range.map((w) => w * BUSINESS_DAYS_PER_WEEK) : exception.range.map(toBusiness);
    const days = [supplier[0] + RULES.metafieldMargin[0], supplier[1] + RULES.metafieldMargin[1]];
    if (weekly) return result({ range: [Math.floor(days[0] / BUSINESS_DAYS_PER_WEEK), Math.ceil(days[1] / BUSINESS_DAYS_PER_WEEK)], unit: 'semaines' }, 'metafield');
    if (days[1] <= RULES.maxBusinessDays) return result({ range: days, unit: 'jours ouvrés' }, 'metafield');
    return result({ range: days.map((d) => Math.ceil(d / BUSINESS_DAYS_PER_WEEK)), unit: 'semaines' }, 'metafield');
  }
  if ((tags || []).some((t) => /^delai[-_ ]?long$/i.test(t))) return { onRequest: true, label: ON_REQUEST, source: 'tag' };
  const brandKey = Object.keys(RULES.brands).find((k) => norm(k) === norm(vendor));
  const brand = brandKey ? RULES.brands[brandKey] : null;
  if (brand) {
    for (const handle of collections) {            // sous-catégorie ou famille, dans l'ordre des collections de la fiche
      const s = supplierDays(brand[handle]);
      if (s) return result(customer(s, brand[handle]), 'brand+' + handle);
    }
    const s = supplierDays(brand);
    if (s) return result(customer(s, brand), 'brand');
  }
  return result(customer(RULES.default, { weeks: true }), 'default');
}

// Le plus long de plusieurs délais (envoi groupé) : une demande l'emporte, sinon la borne haute en jours.
const days = (lt) => (lt.unit === 'semaines' ? lt.range[1] * 7 : lt.range[1] * (lt.unit === 'jours ouvrés' ? 7 / 5 : 1));
function longest(list) {
  const items = list.filter(Boolean);
  if (!items.length) return null;
  const request = items.find((lt) => lt.onRequest);
  if (request) return request;
  return items.reduce((a, b) => (days(b) > days(a) ? b : a));
}

// Retrait en boutique (demande de Cyril du 17 oct. 2026). Le point de retrait Shopify annonce « prêt sous 24 h » pour tout
// le magasin ; le site, lui, suit le stock : en stock → prêt sous 24 h ; à commander → le délai de la marque jusqu'à la
// boutique (métachamp custom.lead_time, SANS la marge d'expédition : la boutique prévient dès l'arrivée) ; sans
// métachamp ou « sur demande » → délai confirmé après commande. Jamais « 24 h » pour un article sans stock.
const PICKUP_READY = 'Retrait en boutique : prêt sous 24 h';
const PICKUP_TBC = 'Retrait en boutique : délai confirmé après commande';
function pickupFor({ inStock = false, leadTime = '' } = {}) {
  if (inStock) return { ready: true, confirmed: true, days: 1, label: PICKUP_READY };
  const parsed = parse(leadTime);
  if (!parsed || parsed.onRequest) return { ready: false, confirmed: false, days: null, label: PICKUP_TBC };
  const { range, unit } = parsed;
  const days = unit === 'semaines' ? range[1] * 7 : unit === 'jours ouvrés' ? Math.ceil(range[1] * 7 / BUSINESS_DAYS_PER_WEEK) : range[1];
  return { ready: false, confirmed: true, days, label: 'Retrait en boutique : ' + label(range, unit) };
}
// Retrait d'une commande : l'article le plus long ; un délai à confirmer l'emporte.
function longestPickup(list) {
  const items = list.filter(Boolean);
  if (!items.length) return null;
  return items.find((p) => !p.confirmed) || items.reduce((a, b) => ((b.days ?? 0) > (a.days ?? 0) ? b : a));
}

const defaultLabel = () => leadTimeFor({}).label;
// Libellé de carte d'un article hors stock : « Livraison 5–7 jours ouvrés » ou « Sur commande · délai sur demande ».
const onOrderLabel = (lt) => (lt.onRequest ? 'Sur commande · ' + ON_REQUEST : 'Livraison ' + lt.label);
module.exports = { IN_STOCK, IN_STOCK_RANGE, ON_REQUEST, PICKUP_READY, PICKUP_TBC, SCHEMA, defaultLabel, label, leadTimeFor, longest, longestPickup, onOrderLabel, parse, pickupFor };
