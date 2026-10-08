// Constantes et réglages du site (origine, gabarits, familles riches, campagnes, pages SSR).
// Extrait de server.js (phase 1 du plan d'architecture, octobre 2026) — code déplacé, pas réécrit.
const fs = require('fs');
const path = require('path');
const { DATA_DIR, V3_DIR } = require('./paths');

// Inventaire des pages HTML (une seule source, aussi lue par scripts/build.mjs pour savoir
// quoi publier en statique) : rôle, servie avec le chrome ou non, header solide, nav active.
const PAGES_MANIFEST = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'pages.manifest.json'), 'utf8'));
const PAGES = new Map(PAGES_MANIFEST.pages.map((p) => [p.file, p]));

const PORT = process.env.PORT || 4000;
// ─── SSR OPEN GRAPH (FICHES PRODUIT · COLLECTIONS/MARQUES · CRÉATEURS) ──
// Les robots d'aperçu social (WhatsApp/iMessage/Messenger/FB…) n'exécutent
// PAS le JS — un lien partagé doit donc déjà porter, dans le <head>, le bon
// titre + la bonne image. On enrichit ici le <head> côté serveur (title,
// description, Open Graph, Twitter, canonical) à partir des données Shopify /
// designers-data.json ; le corps de la page continue de s'hydrater en JS à
// l'identique (galerie, grille, fiche créateur, panier, JSON-LD client).
// Cache edge (s-maxage) → quasi-CDN après le 1er hit. vercel.json route
// /produit.html?handle=…, /collections/<handle> et /produits.html?designer=…
// vers cette fonction ; les autres modes tombent sur le fichier statique.
const ORIGIN = 'https://www.mikadodeco.be';
const OG_DEFAULT = ORIGIN + '/images/og-default.jpg';
// Familles « Mobilier » qui ont une page catégorie riche dédiée (hero + sections).
// Jardin et Assises conservent leurs compositions éditoriales validées.
const FAMILLES_RICHES = { outdoor: 'famille.html', sieges: 'famille-assises.html' };
// Les bandeaux de marque proviennent uniquement de data/brand-heroes.json.
// BRAND_HERO_REVIEW=1 rend aussi les candidats dans une preview locale ; ils
// restent invisibles en production tant que le gate éditorial ne les qualifie pas.
const BRAND_HERO_REVIEW = process.env.BRAND_HERO_REVIEW === '1';
// Campaign collections are created in Shopify before their products are made
// public. Storefront API omits a collection while every member is still a
// draft, so keep the standard collection shell available during that handoff.
// As soon as Shopify publishes the products, the regular query below replaces
// this empty state with the usual product cards and configurators.
// Source unique : data/campaigns.json (voir sa _note).
const CAMPAIGNS = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'campaigns.json'), 'utf8'));
const CAMPAIGN_COLLECTIONS = CAMPAIGNS.collections;
// Textes de page tenus par le site, quel que soit le texte de la collection Shopify.
// Promotions (demande du 4 octobre) : une phrase générale qui ne met aucune offre
// en avant ; le détail de chaque offre figure sur ses cartes et ses fiches.
const COLLECTION_TEXTS = CAMPAIGNS.collectionTexts;
// Shopify schedules the actual Home Stories discounts. The storefront uses
// the same dates to expose the campaign in the generic Promotions catalogue,
// without tagging the products early (which would advertise a discount before
// Shopify starts applying it) or leaving an expired offer there afterwards.
const HOME_STORIES_PROMOTION = {
  handle: CAMPAIGNS.promotions[0].handle,
  startsAt: Date.parse(CAMPAIGNS.promotions[0].startsAt),
  endsAt: Date.parse(CAMPAIGNS.promotions[0].endsAt),
};
const homeStoriesPromotionActive = (now = Date.now()) =>
  now >= HOME_STORIES_PROMOTION.startsAt && now < HOME_STORIES_PROMOTION.endsAt;
// Header solide dès le serveur (anti flash blanc-sur-blanc) pour les pages sans hero :
// `hero: false` dans le manifeste. Toute page inconnue est hero (header transparent,
// bindChrome gère le scroll). Les articles du journal suivent la règle `journal`.
function isNonHero(rel) {
  if (!rel) return false;
  if (rel.startsWith('journal/')) return PAGES_MANIFEST.journal.hero === false;
  const page = PAGES.get(rel);
  return page ? page.hero === false : false;
}
// Entrée de nav active pour le SSR du chrome (libellé NAV_TOP) : le soulignement est
// déjà posé au 1er paint. produit/produits laissés vides (contexte résolu côté client).
function activeForRel(rel) {
  if (!rel) return '';
  if (rel.startsWith('journal/')) return PAGES_MANIFEST.journal.active || '';
  return PAGES.get(rel)?.active || '';
}
// Alias de collection VOLONTAIRES (pas des miss) → catalogue complet, jamais 404.
const COLLECTION_ALIASES = new Set(['all', 'frontpage']);
// Collections de marque publiées en double dans Shopify : une seule adresse par marque.
const BRAND_COLLECTION_ALIASES = { 'fermob-1': 'fermob', volta: 'volta-mobiles' };
// Collections de travail publiées par erreur dans Shopify : jamais servies au public.
const INTERNAL_COLLECTION = /^claude-/;
// ─── SSR CHROME pour les pages HTML statiques ──────────
// Pages servies par la route générique avec le chrome (`ssr: true` dans le manifeste).
// Aucune page HTML n'est publiée en statique (sauf les stubs) : toute URL .html arrive ici.
const SSR_PAGES = new Set(PAGES_MANIFEST.pages.filter((p) => p.ssr).map((p) => p.file));
// Alias « pages de confiance » attendus par les agents IA (/about, /privacy) :
// servis en 200 (pas de saut de redirection) avec le contenu des pages
// existantes, qui portent leur propre <link rel="canonical"> → pas de doublon.
const AGENT_ALIASES = Object.fromEntries(Object.entries(PAGES_MANIFEST.aliases).filter(([k]) => k.startsWith('/')));
function resolveSsrRel(p) {
  if (AGENT_ALIASES[p]) return AGENT_ALIASES[p];
  if (p === '/') return 'index.html';
  if (p.endsWith('.html')) {
    const rel = p.slice(1);
    if (SSR_PAGES.has(rel)) return rel;
    if (/^journal\/[^/]+\.html$/.test(rel)) return rel;  // articles du journal
  }
  return null;
}

module.exports = { PAGES_MANIFEST, SSR_PAGES, BRAND_COLLECTION_ALIASES, BRAND_HERO_REVIEW, CAMPAIGN_COLLECTIONS, COLLECTION_ALIASES, COLLECTION_TEXTS, FAMILLES_RICHES, HOME_STORIES_PROMOTION, INTERNAL_COLLECTION, OG_DEFAULT, ORIGIN, PORT, activeForRel, homeStoriesPromotionActive, isNonHero, resolveSsrRel };
