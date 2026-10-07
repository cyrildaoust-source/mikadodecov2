// Constantes et réglages du site (origine, gabarits, familles riches, campagnes, pages SSR).
// Extrait de server.js (phase 1 du plan d'architecture, octobre 2026) — code déplacé, pas réécrit.
const path = require('path');
const { TEMPLATES_DIR, V3_DIR } = require('./paths');

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
const PRODUIT_TEMPLATE  = path.join(V3_DIR, 'produit.html');
const PRODUITS_TEMPLATE = path.join(V3_DIR, 'produits.html');
// Familles « Mobilier » qui ont une page catégorie riche dédiée (hero + sections).
// Jardin et Assises conservent leurs compositions éditoriales validées.
const FAMILLES_RICHES = { outdoor: 'famille.html', sieges: 'famille-assises.html' };
const FAMILY_TEMPLATE = path.join(TEMPLATES_DIR, 'family-page.html');
// Les bandeaux de marque proviennent uniquement de data/brand-heroes.json.
// BRAND_HERO_REVIEW=1 rend aussi les candidats dans une preview locale ; ils
// restent invisibles en production tant que le gate éditorial ne les qualifie pas.
const BRAND_HERO_REVIEW = process.env.BRAND_HERO_REVIEW === '1';
// Campaign collections are created in Shopify before their products are made
// public. Storefront API omits a collection while every member is still a
// draft, so keep the standard collection shell available during that handoff.
// As soon as Shopify publishes the products, the regular query below replaces
// this empty state with the usual product cards and configurators.
const CAMPAIGN_COLLECTIONS = {
  'vitra-home-stories-for-winter': {
    name: 'Home Stories for Winter',
    heroDescription: 'Du 1er octobre 2026 au 31 janvier 2027, le repose-pieds est offert pour l’achat d’un fauteuil Grand Relax, Repos ou Grand Repos, dans la même configuration que le fauteuil.',
    description: 'Du 1er octobre 2026 au 31 janvier 2027, pour l’achat d’un fauteuil Vitra Grand Relax, Repos ou Grand Repos, le repose-pieds est offert dans la même configuration que le fauteuil : l’Ottoman, ou la Panchina pour le Repos et le Grand Repos.',
    image: 'https://cdn.shopify.com/s/files/1/0958/8441/1209/collections/hero.webp?v=1790627815',
    imageAlt: 'Vitra Home Stories for Winter — Grand Relax et Ottoman assorti',
    gridTitle: 'Les fauteuils de l’offre',
    terms: [
      'Offre valable du 1er octobre 2026 au 31 janvier 2027 inclus.',
      'Un repose-pieds offert par fauteuil, dans la même configuration que le fauteuil : l’Ottoman pour le Grand Relax ; l’Ottoman ou la Panchina, au choix, pour le Repos et le Grand Repos.',
      'La valeur du repose-pieds est déduite automatiquement dans le panier.',
      'Offre non cumulable avec une autre remise.',
      'Pour une commande passée avant le 27 novembre 2026, une livraison avant Noël est probablement possible pour certaines configurations, sous réserve de confirmation.',
    ],
  },
};
// Textes de page tenus par le site, quel que soit le texte de la collection Shopify.
// Promotions (demande du 4 octobre) : une phrase générale qui ne met aucune offre
// en avant ; le détail de chaque offre figure sur ses cartes et ses fiches.
const COLLECTION_TEXTS = {
  promotions: {
    heroDescription: 'Pièces en déstockage et offres du moment, dans la limite des quantités disponibles.',
    description: 'Pièces de design en déstockage et offres du moment chez Mikado Deco, dans la limite des quantités disponibles. Boutique à Uccle, livraison en Belgique.',
    gridTitle: 'Toutes les offres',
  },
};
// Shopify schedules the actual Home Stories discounts. The storefront uses
// the same dates to expose the campaign in the generic Promotions catalogue,
// without tagging the products early (which would advertise a discount before
// Shopify starts applying it) or leaving an expired offer there afterwards.
const HOME_STORIES_PROMOTION = {
  handle: 'vitra-home-stories-for-winter',
  startsAt: Date.parse('2026-10-01T00:00:00+02:00'),
  endsAt: Date.parse('2027-02-01T00:00:00+01:00'),
};
const homeStoriesPromotionActive = (now = Date.now()) =>
  now >= HOME_STORIES_PROMOTION.startsAt && now < HOME_STORIES_PROMOTION.endsAt;
// Pages NON-hero (transparentNav:false) : header rendu DÉJÀ solide en SSR pour
// éviter le flash blanc-sur-blanc (cf. styles.css .chrome color:on-dark par défaut).
// Toute page absente de ce Set est hero (transparent over-hero, bindChrome gère le scroll).
const NON_HERO = new Set([
  '500.html',
  'produit.html', 'contact.html', 'selection.html', 'journal.html',
  'nuancier-fermob.html', '404.html', 'mentions-legales.html',
  'conditions-generales-de-vente.html', 'politique-cookies.html',
  'politique-et-vie-privee.html',
]);
// Les articles du journal sont tous non-hero (transparentNav:false).
function isNonHero(rel) {
  if (!rel) return false;
  if (rel.startsWith('journal/')) return true;   // v3/journal/*.html
  return NON_HERO.has(rel);
}
// Injecte le chrome dans #site-header / #site-footer d'une page HTML.
// - rel : chemin relatif à v3/ (ex. 'contact.html', 'journal/and-tradition.html'),
//   sert à décider l'état solide. undefined → header transparent par défaut.
// - IDEMPOTENT par construction : la regex ne matche qu'un conteneur VIDE
//   (<div id="site-header"></div>) → un 2e passage ne re-matche pas.
// Nav active pour le SSR du chrome : mappe le fichier (rel) -> libelle NAV_TOP, pour que le
// soulignement d actif soit deja pose au 1er paint (plus d animation apres hydratation).
// produit/produits.html laisses vides (contexte catalogue/designer resolu client-side).
const REL_ACTIVE = {
  'marques.html': 'Marques', 'designers.html': 'Designers',
  'journal.html': 'Le journal', 'nuancier-fermob.html': 'Le journal',
  'studio.html': 'Mikado Studio',
  'famille.html': 'Mobilier', 'famille-assises.html': 'Mobilier', 'famille-tables.html': 'Mobilier',
  'family-page.html': 'Mobilier',
};
function activeForRel(rel) {
  if (!rel) return '';
  if (rel.startsWith('journal/')) return 'Le journal';
  return REL_ACTIVE[rel] || '';
}
// Alias de collection VOLONTAIRES (pas des miss) → catalogue complet, jamais 404.
const COLLECTION_ALIASES = new Set(['all', 'frontpage']);
// Collections de marque publiées en double dans Shopify : une seule adresse par marque.
const BRAND_COLLECTION_ALIASES = { 'fermob-1': 'fermob', volta: 'volta-mobiles' };
// Collections de travail publiées par erreur dans Shopify : jamais servies au public.
const INTERNAL_COLLECTION = /^claude-/;
// ─── SSR CHROME pour les pages HTML statiques ──────────
// Liste blanche des pages racine servies en statique aujourd'hui (hors 3 routes
// templatées et hors article.html = stub de redirection sans #site-header).
const SSR_PAGES = new Set([
  'index.html', 'marques.html', 'designers.html', 'studio.html',
  'materiaux.html', 'rendez-vous.html', 'contact.html', 'selection.html',
  'journal.html', 'nuancier-fermob.html', '404.html', 'mentions-legales.html',
  'conditions-generales-de-vente.html', 'politique-cookies.html',
  'politique-et-vie-privee.html',
]);
// Alias « pages de confiance » attendus par les agents IA (/about, /privacy) :
// servis en 200 (pas de saut de redirection) avec le contenu des pages
// existantes, qui portent leur propre <link rel="canonical"> → pas de doublon.
// Routés vers la fonction dans vercel.json.
const AGENT_ALIASES = { '/about': 'studio.html', '/privacy': 'politique-et-vie-privee.html' };
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

module.exports = { BRAND_COLLECTION_ALIASES, BRAND_HERO_REVIEW, CAMPAIGN_COLLECTIONS, COLLECTION_ALIASES, COLLECTION_TEXTS, FAMILLES_RICHES, FAMILY_TEMPLATE, HOME_STORIES_PROMOTION, INTERNAL_COLLECTION, OG_DEFAULT, ORIGIN, PORT, PRODUITS_TEMPLATE, PRODUIT_TEMPLATE, activeForRel, homeStoriesPromotionActive, isNonHero, resolveSsrRel };
