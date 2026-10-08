// Layout unique — Mikado Deco (ADR 0012)
// --------------------------------------
// Une seule enveloppe HTML pour tout le site : templates/layout.html porte le <head> commun
// (icônes, Open Graph, Twitter, canonical, polices, feuille de style, script d'en-tête) et le
// squelette du corps (conteneurs du chrome). Chaque page n'est plus qu'un FRAGMENT :
//
//   <!--page {"title":"…","description":"…","canonical":"/contact.html","image":"/images/og-default.jpg"} -->
//   <template data-head> …balises propres à la page (préchargements, JSON-LD, feuille dédiée)… </template>
//   <main …>…</main>
//   <script type="module" src="/pages/contact.js"></script>
//
// renderPage(rel, overrides) assemble le fragment dans le layout. Les routes dynamiques (fiche,
// collections, familles) passent title/description/image/url en overrides, puis continuent de
// travailler sur le HTML complet comme avant (renderWithOg, remplacements de corps, injectChrome).
const fs = require('fs');
const path = require('path');
const { PAGES_MANIFEST, ORIGIN } = require('../config');
const { TEMPLATES_DIR, V3_DIR } = require('../paths');

const LAYOUT_FILE = path.join(TEMPLATES_DIR, 'layout.html');
const OG_DEFAULT_IMAGE = '/images/og-default.jpg';
const META_RE = /^\s*<!--page\s+(\{[\s\S]*?\})\s*-->\s*/;
const HEAD_RE = /^\s*<template data-head>([\s\S]*?)<\/template>\s*/;

const escapeAttr = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const absUrl = (u) => {
  if (!u) return '';
  const s = String(u);
  if (/^\[\[[A-Z_]+\]\]$/.test(s)) return s;             // jeton d'un gabarit ([[URL]], [[IMAGE]]) : rempli plus tard, déjà absolu
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return 'https:' + s;
  return ORIGIN + (s.startsWith('/') ? s : '/' + s);
};

// Fichier d'une page du manifeste (v3/ ou templates/), ou d'un article du journal.
function fragmentPath(rel) {
  const entry = PAGES_MANIFEST.pages.find((p) => p.file === rel);
  return path.join(entry && entry.dir === 'templates' ? TEMPLATES_DIR : V3_DIR, rel);
}

// Fragment lu et découpé ; mémorisé tant que le fichier ne change pas (mtime) — sur Vercel il
// ne change jamais, en local on peut éditer une page sans relancer le serveur.
const _cache = new Map();
function loadFragment(rel) {
  const file = fragmentPath(rel);
  const mtime = fs.statSync(file).mtimeMs;
  const hit = _cache.get(file);
  if (hit && hit.mtime === mtime) return hit.fragment;
  let src = fs.readFileSync(file, 'utf8');
  let meta = {};
  const m = src.match(META_RE);
  if (m) {
    try { meta = JSON.parse(m[1]); } catch (e) { throw new Error(`${rel} : en-tête <!--page …--> invalide (${e.message})`); }
    src = src.slice(m[0].length);
  }
  let head = '';
  const h = src.match(HEAD_RE);
  if (h) { head = h[1].replace(/^\n+|\s+$/g, ''); src = src.slice(h[0].length); }
  const fragment = { meta, head, body: src.replace(/\s+$/, ''), file };
  _cache.set(file, { mtime, fragment });
  return fragment;
}

let _layout;
function layout() {
  // Mémorisé une fois : le layout ne change qu'avec un déploiement.
  return _layout || (_layout = fs.readFileSync(LAYOUT_FILE, 'utf8'));
}

// Page complète. `overrides` : title, description, image, url (ou canonical), robots, ogType.
function renderPage(rel, overrides = {}) {
  const { meta, head, body } = loadFragment(rel);
  const data = { ...meta, ...overrides };
  const title = data.title || 'Mikado Deco';
  const description = data.description || '';
  const url = absUrl(data.url || data.canonical || ('/' + rel));
  const image = absUrl(data.image || OG_DEFAULT_IMAGE);
  const isDefaultImage = image.endsWith(OG_DEFAULT_IMAGE);
  const noindex = /noindex/i.test(data.robots || '');          // une page non indexable ne déclare pas de canonical
  const values = {
    title: escapeAttr(title),
    description: escapeAttr(description),
    url: escapeAttr(url),
    image: escapeAttr(image),
    ogType: escapeAttr(data.ogType || 'website'),
    canonical: noindex ? '' : `\n  <link rel="canonical" href="${escapeAttr(url)}" />`,
    robots: data.robots ? `\n  <meta name="robots" content="${escapeAttr(data.robots)}" />` : '',
    imageDims: isDefaultImage ? '\n  <meta property="og:image:width" content="1200" />\n  <meta property="og:image:height" content="630" />' : '',
    head: head ? '  ' + head.split('\n').join('\n') + '\n' : '',
    content: body,
  };
  // Fonction de remplacement : un « $& » dans une description ne corrompt jamais la page.
  return layout().replace(/\{\{(\w+)\}\}/g, (_m, key) => (key in values ? values[key] : ''));
}

module.exports = { OG_DEFAULT_IMAGE, absUrl, fragmentPath, loadFragment, renderPage };
