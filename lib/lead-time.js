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
//   1. métachamp custom.lead_time de la fiche (exception, texte libre AFFICHÉ TEL QUEL : « 6 semaines », « 10 jours », « sur demande »)
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
const IN_STOCK = '2–3 jours';
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

let RULES = { margin: [3, 4], marginWeeks: [1, 1], maxBusinessDays: 15, default: [10, 15], brands: {} };
try {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'lead-times.json'), 'utf8'));
  if (raw.schema !== SCHEMA) throw new Error(`schéma ${raw.schema || 'absent'} (attendu ${SCHEMA})`);
  RULES = {
    margin: validRange(raw.margin?.days) || [3, 4],
    marginWeeks: validRange(raw.margin?.weeks) || [1, 1],
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

// Texte libre d'un métachamp → plage affichée telle quelle ; « sur demande » → demande ; sinon null.
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
  if (exception) return result(exception, 'metafield');
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

const defaultLabel = () => leadTimeFor({}).label;
// Libellé de carte d'un article hors stock : « Livraison 5–7 jours ouvrés » ou « Sur commande · délai sur demande ».
const onOrderLabel = (lt) => (lt.onRequest ? 'Sur commande · ' + ON_REQUEST : 'Livraison ' + lt.label);
module.exports = { IN_STOCK, ON_REQUEST, SCHEMA, defaultLabel, label, leadTimeFor, longest, onOrderLabel, parse };
