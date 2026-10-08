// État de navigation (règles, fil d'Ariane, cartes SSR) chargé depuis les modules partagés de v3/.
// Extrait de server.js (phase 1 du plan d'architecture, octobre 2026) — code déplacé, pas réécrit.
const fs = require('fs');
const path = require('path');
const { ORIGIN } = require('../config');
const { getDesigners } = require('../designers');
const { V3_DIR } = require('../paths');
const { ogEscape } = require('./og');

// Une seule règle de hiérarchie et un seul BreadcrumbList, visibles avant le JS.
// État de navigation partagé (rempli par navigationReady) : les autres modules lisent
// nav.navigation / nav.navigationRules / nav.productCardHTML / nav.priceLabelS.
const nav = { navigation: null, navigationRules: null, productCardHTML: null, priceLabelS: null };
const navigationReady = Promise.all([import('../../v3/navigation.mjs'), import('../../v3/product-card.mjs'), import('../../v3/format.mjs')]).then(([m, cards, format]) => {
  nav.navigation = m;
  nav.productCardHTML = cards.productCardHTML;
  nav.priceLabelS = format.priceLabel;
  nav.navigationRules = m.createNavigation(
    JSON.parse(fs.readFileSync(path.join(V3_DIR, 'navigation-data.json'), 'utf8')),
    JSON.parse(fs.readFileSync(path.join(V3_DIR, 'mega-menu-brands.json'), 'utf8')).brands,
    getDesigners()
  );
});
function injectNavigation(html, trail, currentURL, source = '') {
  html = html.replace(/(<div[^>]* data-breadcrumb>)<\/div>/, (_, open) => open + nav.navigation.breadcrumbHTML(trail) + '</div>');
  html = html.replace('<div data-selection-return></div>', () => '<div data-selection-return>' + nav.navigation.returnLinkHTML(source) + '</div>');
  const ld = JSON.stringify(nav.navigation.breadcrumbData(trail, currentURL)).replace(/</g, '\\u003c');
  return html.replace('</head>', () => '<script type="application/ld+json" id="navigation-breadcrumb">' + ld + '</script>\n</head>');
}
// Pages de contenu : fil rendu par le serveur, avec son JSON-LD (audit du 24 septembre).
const HOME = { label: 'Accueil', href: '/' };
const CONTENT_TRAILS = {
  'journal.html': [HOME, { label: 'Le journal' }],
  'studio.html': [HOME, { label: 'Mikado Studio' }],
  'materiaux.html': [HOME, { label: 'Matières' }],
  'rendez-vous.html': [HOME, { label: 'Rendez-vous' }],
  'contact.html': [HOME, { label: 'Contact' }],
  'nuancier-fermob.html': [HOME, { label: 'Marques', href: '/marques.html' }, { label: 'Fermob', href: '/collections/fermob' }, { label: 'Nuancier Fermob' }],
  'mentions-legales.html': [HOME, { label: 'Mentions légales' }],
  'conditions-generales-de-vente.html': [HOME, { label: 'Conditions générales de vente' }],
  'politique-cookies.html': [HOME, { label: 'Politique cookies' }],
  'politique-et-vie-privee.html': [HOME, { label: 'Politique de confidentialité' }],
};
function contentPageTrail(rel, html) {
  if (CONTENT_TRAILS[rel]) return CONTENT_TRAILS[rel];
  const article = /^journal\/[^/]+\.html$/.test(rel) && html.match(/<h1 class="article__title">([^<]+)<\/h1>/);
  if (article) return [HOME, { label: 'Le journal', href: '/journal.html' }, { label: article[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"') }];
  return null;
}
function listingNavigation(html, req, hints = {}) {
  const url = new URL(req.originalUrl, ORIGIN);
  return injectNavigation(html, nav.navigation.listingTrail(url, nav.navigationRules, hints), url.pathname + url.search);
}
// Les grilles paginées/triées sont calculées sur le jeu complet dans le navigateur.
// Ne pas présenter la première tranche SSR comme la page N ou comme un tri global.
function canRenderInitialGrid(req) {
  return !(Number(req.query.page) > 1 || (req.query.sort && req.query.sort !== 'pop'));
}
// Les curseurs parcourent les lots rendus sur le serveur, y compris sans JS.
function listingPagination(html, req, pageInfo = {}) {
  if (!canRenderInitialGrid(req)) return html;
  const params = new URLSearchParams();
  for (const key of ['designer', 'brand', 'tag', 'cats', 'q', 'cursor']) {
    if (typeof req.query[key] === 'string' && req.query[key]) params.set(key, req.query[key]);
  }
  const href = () => req.path + (params.size ? '?' + params : '');
  const links = [];
  if (params.has('cursor')) {
    const canonical = ogEscape(ORIGIN + href());
    html = html.replace(/<link rel="canonical"[^>]*>/i, () => `<link rel="canonical" href="${canonical}" />`)
      .replace(/<meta property="og:url"[^>]*>/i, () => `<meta property="og:url" content="${canonical}" />`);
    params.delete('cursor');
    links.push(`<a class="plp-page" href="${ogEscape(href())}#grille">Revenir au début</a>`);
  }
  if (pageInfo.hasNextPage && pageInfo.endCursor) {
    params.set('cursor', pageInfo.endCursor);
    links.push(`<a class="plp-page" href="${ogEscape(href())}#grille">Voir plus de produits</a>`);
  }
  if (links.length) html = html.replace('<nav class="plp-pagination" data-pagination aria-label="Pagination" hidden></nav>',
    () => `<nav class="plp-pagination" data-pagination aria-label="Pagination">${links.join('')}</nav>`);
  return html;
}
// Carte complète dès le serveur, bouton de sélection compris : le navigateur la garde
// telle quelle (plus de reconstruction des grilles) et ajuste seulement le libellé des
// articles déjà dans le panier (syncCardLabels, product-grid.mjs).
function plpCardSsr(p, source = '') {
  return nav.productCardHTML(p, {source});
}
// Toutes les pages de marque ont le même bandeau, avec ou sans photo qualifiée.
const brandBanner = (html, handle) => nav.navigationRules.collections[handle]?.kind === 'brand' && !html.includes('subhero--brand')
  ? html.replace('<section class="subhero"', '<section class="subhero subhero--brand"') : html;

module.exports = { brandBanner, canRenderInitialGrid, contentPageTrail, injectNavigation, listingNavigation, listingPagination, nav, navigationReady, plpCardSsr };
