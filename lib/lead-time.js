// Délais de livraison des articles sur commande — Mikado Deco (ADR 0015)
// ----------------------------------------------------------------------
// Un seul endroit décide du délai annoncé d'une fiche hors stock, à partir de données que
// chaque fiche porte déjà (marque, collections, tags, métachamp) et d'une table de règles
// par marque et famille (data/lead-times.json). Aucune saisie fiche par fiche.
//
// Résolution, du plus précis au plus général :
//   1. métachamp custom.lead_time de la fiche (exception, texte libre : « 6 semaines », « 10 jours », « sur demande »)
//   2. tag delai-long → « délai sur demande »
//   3. marque + sous-catégorie (handle de collection)   ex. Vitra + canapes
//   4. marque + famille                                  ex. Vitra + sieges
//   5. marque                                            ex. Vitra
//   6. défaut de la table                                3–4 semaines
// Le stock Mikado (« 1–2 jours ») se décide ailleurs, au panier, sur le stock réel de la variante.
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./paths');

const SCHEMA = 'mikado.lead-times@1';
const ON_REQUEST = 'délai sur demande';
const DASH = '–';

let RULES = { default: [3, 4], brands: {} };
try {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'lead-times.json'), 'utf8'));
  if (raw.schema !== SCHEMA) throw new Error(`schéma ${raw.schema || 'absent'} (attendu ${SCHEMA})`);
  RULES = { default: validRange(raw.default) || [3, 4], brands: raw.brands || {} };
} catch (e) { console.warn('[lead-time] table ignorée :', e.message); }

function validRange(r) {
  if (!Array.isArray(r) || r.length !== 2) return null;
  const [a, b] = r.map(Number);
  return Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= a ? [a, b] : null;
}

// Libellé lisible d'une plage : [2, 3] → « 2–3 semaines », [6, 6] → « 6 semaines ».
function label(range, unit = 'semaines') {
  const [a, b] = range;
  const n = a === b ? String(a) : `${a}${DASH}${b}`;
  if (unit === 'jours') return `${n} ${a === b && a === 1 ? 'jour' : 'jours'}`;
  return `${n} ${a === b && a === 1 ? 'semaine' : 'semaines'}`;
}

// Texte libre d'un métachamp → plage ; « sur demande » → demande ; sinon null.
function parse(text) {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return null;
  if (/demande|nous consulter|sur devis/.test(t)) return { onRequest: true };
  const m = t.match(/(\d+)\s*(?:[-–à]\s*(\d+))?\s*(semaine|jour|mois)/);
  if (!m) return null;
  let a = Number(m[1]), b = Number(m[2] || m[1]);
  if (m[3] === 'mois') { a *= 4; b *= 4; }
  const unit = m[3] === 'jour' ? 'jours' : 'semaines';
  return a <= b ? { range: [a, b], unit } : null;
}

const norm = (s) => String(s || '').trim().toLowerCase();

// Délai d'une fiche sur commande. `collections` = handles des collections de la fiche.
function leadTimeFor({ vendor, collections = [], tags = [], leadTime = '' } = {}) {
  const exception = parse(leadTime);
  if (exception?.onRequest) return { onRequest: true, label: ON_REQUEST, source: 'metafield' };
  if (exception) return { onRequest: false, range: exception.range, unit: exception.unit, label: label(exception.range, exception.unit), source: 'metafield' };
  if ((tags || []).some((t) => /^delai[-_ ]?long$/i.test(t))) return { onRequest: true, label: ON_REQUEST, source: 'tag' };
  const brandKey = Object.keys(RULES.brands).find((k) => norm(k) === norm(vendor));
  const brand = brandKey ? RULES.brands[brandKey] : null;
  if (brand) {
    for (const handle of collections) {            // sous-catégorie ou famille, dans l'ordre des collections de la fiche
      const r = validRange(brand[handle]);
      if (r) return { onRequest: false, range: r, unit: 'semaines', label: label(r), source: 'brand+' + handle };
    }
    const r = validRange(brand.default);
    if (r) return { onRequest: false, range: r, unit: 'semaines', label: label(r), source: 'brand' };
  }
  return { onRequest: false, range: RULES.default, unit: 'semaines', label: label(RULES.default), source: 'default' };
}

// Le plus long de plusieurs délais (envoi groupé) : une demande l'emporte, sinon la borne haute en jours.
const days = (lt) => (lt.unit === 'jours' ? lt.range[1] : lt.range[1] * 7);
function longest(list) {
  const items = list.filter(Boolean);
  if (!items.length) return null;
  const request = items.find((lt) => lt.onRequest);
  if (request) return request;
  return items.reduce((a, b) => (days(b) > days(a) ? b : a));
}

const defaultLabel = () => label(RULES.default);
module.exports = { ON_REQUEST, SCHEMA, defaultLabel, label, leadTimeFor, longest, parse };
