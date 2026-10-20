// Opération de Noël — Mikado Deco (ADR 0016)
// ------------------------------------------
// Un seul endroit décide de tout ce qui est saisonnier : la fenêtre d'affichage (section de
// l'accueil, texte de saison de la page Idées cadeaux — jamais la barre d'annonce ni d'emballage cadeau,
// décisions de Cyril du 20 octobre 2026), le repère « Livré avant Noël » calculé ARTICLE PAR ARTICLE à partir de son
// délai (lib/lead-time.js) et la fenêtre d'échange des cadeaux. Réglages : bloc `noel` de
// data/campaigns.json (décisions de Cyril des 12 et 13 octobre 2026). `enabled: false` éteint tout.
//
// Le repère n'est jamais une promesse globale (« commandez avant le 18 ») : il n'apparaît que si le
// délai HAUT de l'article, plus une marge de sécurité, fait arriver le colis au plus tard à la date
// `deliveryBy`. Il disparaît donc de lui-même, article par article, à mesure que Noël approche :
// un article en stock (2–3 jours) le garde jusqu'au 19 décembre, un article à 3–4 semaines le perd
// fin novembre. Les pages sont cachées quelques minutes à l'edge : la marge de sécurité couvre ce délai.
//
// Horloge : `MIKADO_CLOCK` (date ISO) remplace Date.now() — pour les tests et pour montrer la saison
// sur une Preview avant la date de lancement. Jamais défini en production.
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./paths');
const { IN_STOCK_RANGE } = require('./lead-time');

const DAY = 86_400_000;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const BRUSSELS = 'Europe/Brussels';
const DAY_LABEL = new Intl.DateTimeFormat('fr-BE', { day: 'numeric', month: 'long', timeZone: BRUSSELS });

const stamp = (value, label) => {
  const t = Date.parse(value);
  if (!Number.isFinite(t)) throw new Error(`${label} invalide (${value})`);
  return t;
};
// Une date seule (YYYY-MM-DD) se lit à Bruxelles : début ou fin de journée (heure d'hiver).
const dayStart = (value, label) => { if (!DATE_ONLY.test(String(value))) throw new Error(`${label} : date YYYY-MM-DD attendue`); return stamp(value + 'T00:00:00+01:00', label); };
const dayEnd = (value, label) => { if (!DATE_ONLY.test(String(value))) throw new Error(`${label} : date YYYY-MM-DD attendue`); return stamp(value + 'T23:59:59+01:00', label); };

function parseConfig(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('bloc `noel` absent de campaigns.json');
  const config = {
    enabled: raw.enabled === true,
    startsAt: stamp(raw.startsAt, 'startsAt'),
    endsAt: stamp(raw.endsAt, 'endsAt'),
    deliveryBy: dayEnd(raw.deliveryBy, 'deliveryBy'),
    deliveryByLabel: DAY_LABEL.format(new Date(dayStart(raw.deliveryBy, 'deliveryBy') + 12 * 3600_000)),
    safetyDays: Number.isInteger(raw.safetyDays) && raw.safetyDays >= 0 ? raw.safetyDays : 2,
    deliveryBadge: raw.deliveryBadge === true,
    exchange: null,
  };
  if (config.endsAt <= config.startsAt) throw new Error('endsAt doit suivre startsAt');
  if (raw.exchange && typeof raw.exchange === 'object') {
    const from = dayStart(raw.exchange.from, 'exchange.from'), until = dayEnd(raw.exchange.until, 'exchange.until');
    if (until <= from) throw new Error('exchange.until doit suivre exchange.from');
    config.exchange = { from, until, fromLabel: DAY_LABEL.format(new Date(from + 12 * 3600_000)), untilLabel: DAY_LABEL.format(new Date(until - 12 * 3600_000)) };
  }
  return config;
}

let CONFIG = { enabled: false, startsAt: 0, endsAt: 0, deliveryBy: 0, deliveryByLabel: '', safetyDays: 2, deliveryBadge: false, exchange: null };
try {
  CONFIG = parseConfig(JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'campaigns.json'), 'utf8')).noel);
} catch (e) { console.warn('[noel] configuration ignorée :', e.message); }

// Instant courant, ou l'horloge imposée par MIKADO_CLOCK (tests, Preview).
function now() {
  const clock = process.env.MIKADO_CLOCK;
  if (clock) { const t = Date.parse(clock); if (Number.isFinite(t)) return t; }
  return Date.now();
}
const active = (at = now()) => CONFIG.enabled && at >= CONFIG.startsAt && at < CONFIG.endsAt;
// Repère « Livré avant Noël » : saison active ET interrupteur `deliveryBadge` (éteint par Cyril le 13 octobre 2026).
const badgeActive = (at = now(), cfg = CONFIG) => cfg.enabled && at >= cfg.startsAt && at < cfg.endsAt && cfg.deliveryBadge;
// Fenêtre d'échange des cadeaux (geste commercial en boutique) : texte affiché tant qu'elle court.
const exchangeOpen = (at = now()) => Boolean(CONFIG.enabled && CONFIG.exchange && at >= CONFIG.exchange.from - 30 * DAY && at <= CONFIG.exchange.until);

const addDays = (t, n) => t + n * DAY;
function addBusinessDays(t, n) {
  let d = new Date(t), left = n;
  while (left > 0) { d = new Date(d.getTime() + DAY); const wd = d.getUTCDay(); if (wd !== 0 && wd !== 6) left--; }
  return d.getTime();
}
// Date d'arrivée AU PLUS TARD d'un article commandé à `at` : null = pas de délai connu (sur demande).
// `leadTime` null = article en stock Mikado (IN_STOCK_RANGE jours) ; sinon le résultat de leadTimeFor().
function arrival(leadTime, at = now()) {
  if (!leadTime) return addDays(at, IN_STOCK_RANGE[1]);
  if (leadTime.onRequest || !Array.isArray(leadTime.range)) return null;
  const top = leadTime.range[1];
  if (leadTime.unit === 'jours ouvrés') return addBusinessDays(at, top);
  if (leadTime.unit === 'jours') return addDays(at, top);
  return addDays(at, top * 7);                                   // semaines
}
// « Livré avant Noël » pour cet article, commandé maintenant ?
function deliverable(leadTime, at = now()) {
  if (!active(at)) return false;
  const eta = arrival(leadTime, at);
  return eta !== null && addDays(eta, CONFIG.safetyDays) <= CONFIG.deliveryBy;
}
// Les deux états d'une fiche (la carte et la fiche choisissent selon le stock réel de la variante) ;
// null hors saison ou repère éteint, pour ne rien écrire dans les réponses le reste de l'année.
function flagsFor(leadTime, at = now(), cfg = CONFIG) {
  if (!badgeActive(at, cfg)) return null;
  return { inStock: deliverable(null, at), onOrder: deliverable(leadTime, at) };
}
const config = () => CONFIG;

module.exports = { active, arrival, badgeActive, config, deliverable, exchangeOpen, flagsFor, now, parseConfig };
