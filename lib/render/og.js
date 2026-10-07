// Aides au rendu <head> : échappement, URL absolues, Open Graph, en-têtes de cache des pages.
// Extrait de server.js (phase 1 du plan d'architecture, octobre 2026) — code déplacé, pas réécrit.
const { ORIGIN } = require('../config');

const ogEscape = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// URL absolue (les URLs Shopify CDN le sont déjà ; les chemins /images/… non ;
// une URL protocole-relative //host/… reçoit https:).
const absUrl = (u) => {
  if (!u) return '';
  const s = String(u);
  if (/^https?:\/\//i.test(s)) return s;
  if (s.charAt(0) === '/' && s.charAt(1) === '/') return 'https:' + s;
  return ORIGIN + (s.charAt(0) === '/' ? s : '/' + s);
};
// Description OG : espaces normalisés, tronquée ~200 (échappement plus tard).
function ogDesc(s) {
  let d = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  if (d.length > 200) d = d.slice(0, 199).trimEnd() + '…';
  return d;
}
// Enrichit le <head> d'un template : title + meta description + Open Graph +
// Twitter + canonical. Échappement attribut HTML. Retire le ratio
// og:image:width/height en dur (photos produit / bandeaux / portraits ne sont
// pas en 1.91:1). Mécanisme commun aux 3 types de page partageable.
// NB : les valeurs sont injectées via une FONCTION de remplacement (pas une
// chaîne) — String.replace interprète $$, $&, $`, $' dans une chaîne de
// remplacement ; une description/bio Shopify contenant « $$ » ou « 50$&… »
// corromprait le <head>. La forme `() => …` neutralise totalement ces motifs.
function renderWithOg(templateHtml, { title, description, image, url }) {
  const T = ogEscape(title), D = ogEscape(description), I = ogEscape(image), U = ogEscape(url);
  let html = templateHtml
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${T}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, () => `<meta name="description" content="${D}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, () => `<meta property="og:title" content="${T}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, () => `<meta property="og:description" content="${D}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, () => `<meta property="og:url" content="${U}" />`)
    .replace(/<meta property="og:image" content="[^"]*"\s*\/>/, () => `<meta property="og:image" content="${I}" />`)
    // Le ratio en dur (1200×630) ne correspond pas aux visuels → on le retire.
    .replace(/\s*<meta property="og:image:width" content="[^"]*"\s*\/>/, '')
    .replace(/\s*<meta property="og:image:height" content="[^"]*"\s*\/>/, '')
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, () => `<meta name="twitter:title" content="${T}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, () => `<meta name="twitter:description" content="${D}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/, () => `<meta name="twitter:image" content="${I}" />`);
  // Canonical propre (URL sans params de filtre/from) : remplace un
  // <link rel="canonical"> statique s'il existe, sinon l'injecte juste après
  // og:url. (Les templates posent aussi le canonical en JS, qui réutilise ce
  // même tag via querySelector → jamais de double canonical.)
  if (/<link rel="canonical"[^>]*>/i.test(html)) {
    html = html.replace(/<link rel="canonical"[^>]*>/i, () => `<link rel="canonical" href="${U}" />`);
  } else {
    html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, (m) => `${m}\n  <link rel="canonical" href="${U}" />`);
  }
  return html;
}
function temporaryUnavailable(res) {
  return res.status(503).set('Cache-Control', 'no-store').set('Retry-After', '60');
}
function ogCache(res) {
  res.set('Content-Type', 'text/html; charset=utf-8');
  // Liste d'origine servie faute d'index (démarrage) : ne pas la figer au CDN.
  if (res.locals.scopeFallback) return res.set('Cache-Control', 'no-store');
  res.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
}

module.exports = { absUrl, ogCache, ogDesc, ogEscape, renderWithOg, temporaryUnavailable };
