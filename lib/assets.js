// Assets front hachés — Mikado Deco (ADR 0010)
// ------------------------------------------------
// Le HTML du dépôt référence les SOURCES : <script type="module" src="/pages/produits.js">,
// import { initShell } from "/shared.js", <link href="/styles.css">. Au build (scripts/build.mjs),
// esbuild regroupe et minifie ces entrées dans dist/assets/<nom>.<version>.(js|css), que Vercel
// sert avec `Cache-Control: immutable` (un an). Au rendu, le serveur réécrit les références vers
// ces noms (rewriteAssets, appelé par injectChrome).
//
// La VERSION est le hachage du contenu de toutes les sources front (v3/*.js, *.mjs, *.css,
// v3/pages/*.js — exactement ce que vercel.json embarque dans la fonction). Le build et le
// serveur la calculent chacun depuis les mêmes fichiers : aucun manifeste à transporter entre
// le build et le runtime, et un déploiement qui ne touche ni JS ni CSS garde les caches
// navigateur intacts (même version → mêmes URL).
//
// En local sans `npm run build`, rien n'est réécrit : le site tourne sur les sources.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DIST_DIR, ROOT_DIR, TEMPLATES_DIR, V3_DIR } = require('./paths');

const PREFIX = '/assets/';
// [sous-dossier de v3, fichiers retenus] — à garder aligné sur `functions.includeFiles` de vercel.json.
const SOURCE_DIRS = [['', /\.(m?js|css)$/], ['pages', /\.js$/]];
// Où chercher les références : les pages HTML, et le code serveur qui injecte du HTML au rendu
// (ex. lib/chair-catalog-page.js écrit `<script type="module" src="/chair-catalog.js">`).
const HTML_DIRS = [V3_DIR, TEMPLATES_DIR, path.join(V3_DIR, 'journal')];
const CODE_DIRS = [path.join(ROOT_DIR, 'lib'), path.join(ROOT_DIR, 'lib', 'render'), path.join(ROOT_DIR, 'lib', 'services'), path.join(ROOT_DIR, 'routes')];
// Références de modules dans le HTML : attribut src, import statique, import() dynamique.
const REF_JS = /((?:\ssrc=|\bfrom\s*|\bimport\(\s*)["'])(\/[A-Za-z0-9_./-]+\.m?js)(["'])/g;
const REF_CSS = /(<link[^>]*\shref=")(\/[A-Za-z0-9_./-]+\.css)(")/g;

function frontSources() {
  const out = [];
  for (const [dir, re] of SOURCE_DIRS) {
    const abs = path.join(V3_DIR, dir);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs)) {
      if (re.test(name) && fs.statSync(path.join(abs, name)).isFile()) out.push(dir ? `${dir}/${name}` : name);
    }
  }
  return out.sort();
}

let _version;
function assetsVersion() {
  if (_version) return _version;
  const h = crypto.createHash('sha256');
  for (const rel of frontSources()) {
    h.update(rel); h.update('\0');
    h.update(fs.readFileSync(path.join(V3_DIR, rel))); h.update('\0');
  }
  return (_version = h.digest('hex').slice(0, 10));
}

// Entrées du bundle = tout module ou feuille de style référencé par le HTML (fichiers, ou chaînes du
// code serveur) et qui existe dans v3/. Un module seulement importé par un autre module n'est pas
// une entrée : il est regroupé.
let _entries;
function entries() {
  if (_entries) return _entries;
  const js = new Set(), css = new Set();
  const scan = (text) => {
    for (const m of text.matchAll(REF_JS)) if (fs.existsSync(path.join(V3_DIR, m[2]))) js.add(m[2]);
    for (const m of text.matchAll(REF_CSS)) if (fs.existsSync(path.join(V3_DIR, m[2]))) css.add(m[2]);
  };
  for (const [dirs, ext] of [[HTML_DIRS, /\.html$/], [CODE_DIRS, /\.js$/]]) {
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      for (const name of fs.readdirSync(dir)) if (ext.test(name)) scan(fs.readFileSync(path.join(dir, name), 'utf8'));
    }
  }
  return (_entries = { js: [...js].sort(), css: [...css].sort() });
}

const hashedName = (p, ext) => `${PREFIX}${p.slice(1).replace(/\.(m?js|css)$/, '')}.${assetsVersion()}.${ext}`;

function assetUrl(p) {
  const { js, css } = entries();
  if (js.includes(p)) return hashedName(p, 'js');
  if (css.includes(p)) return hashedName(p, 'css');
  return p;
}

// Actif sur Vercel (le build a produit dist/assets) ou en local après `npm run build` de la même
// version. ASSETS_HASHED=0|1 force (tests, dépannage). Vérification locale mémorisée 2 s.
let _enabled, _enabledAt = 0;
function hashedAssetsEnabled() {
  if (process.env.ASSETS_HASHED === '0') return false;
  if (process.env.ASSETS_HASHED === '1' || process.env.VERCEL === '1') return true;
  const now = Date.now();
  if (now - _enabledAt < 2000) return _enabled;
  _enabledAt = now;
  try { _enabled = JSON.parse(fs.readFileSync(path.join(DIST_DIR, 'assets', 'manifest.json'), 'utf8')).version === assetsVersion(); }
  catch { _enabled = false; }
  return _enabled;
}

function rewriteAssets(html, enabled = hashedAssetsEnabled()) {
  if (!enabled) return html;
  return html
    .replace(REF_JS, (_m, a, p, b) => a + assetUrl(p) + b)
    .replace(REF_CSS, (_m, a, p, b) => a + assetUrl(p) + b);
}

function manifest() {
  const { js, css } = entries();
  return {
    version: assetsVersion(),
    js: Object.fromEntries(js.map((p) => [p, hashedName(p, 'js')])),
    css: Object.fromEntries(css.map((p) => [p, hashedName(p, 'css')])),
  };
}

module.exports = { PREFIX, assetUrl, assetsVersion, entries, frontSources, hashedAssetsEnabled, manifest, rewriteAssets };
