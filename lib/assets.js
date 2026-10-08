// Assets front hachés — Mikado Deco (ADR 0010)
// ------------------------------------------------
// Le HTML du dépôt référence les SOURCES : <script type="module" src="/pages/produits.js">,
// import { initShell } from "/shell.mjs", <link href="/styles.css">. Au build (scripts/build.mjs),
// esbuild regroupe et minifie ces entrées dans dist/assets/<nom>.<version>.(js|css), que Vercel
// sert avec `Cache-Control: immutable` (un an). Au rendu, le serveur réécrit les références vers
// ces noms (rewriteAssets, appelé par injectChrome).
//
// La VERSION est le hachage du contenu de toutes les sources front (v3/*.js, *.mjs, *.css,
// v3/pages/*.js), calculé par le build. Le build l'écrit dans build/assets-manifest.json, que
// vercel.json embarque dans la fonction : c'est là que le serveur la lit. (Il ne peut pas la
// recalculer lui-même sur Vercel : les .js embarqués y sont recompilés ESM → CommonJS, leurs
// octets ne sont plus ceux du dépôt — constaté le 8 octobre, 404 sur tous les assets.)
// Un déploiement qui ne touche ni JS ni CSS garde la même version → mêmes URL → caches intacts.
//
// Sans manifeste (local sans `npm run build`), rien n'est réécrit : le site tourne sur les sources.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DIST_DIR, ROOT_DIR, TEMPLATES_DIR, V3_DIR } = require('./paths');

const PREFIX = '/assets/';
const BUILD_MANIFEST = path.join(ROOT_DIR, 'build', 'assets-manifest.json');   // écrit par scripts/build.mjs, embarqué dans la fonction
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

// Hachage des sources (ce que le build calcule).
function computeSourcesVersion() {
  const h = crypto.createHash('sha256');
  for (const rel of frontSources()) {
    h.update(rel); h.update('\0');
    h.update(fs.readFileSync(path.join(V3_DIR, rel))); h.update('\0');
  }
  return h.digest('hex').slice(0, 10);
}

// Manifeste laissé par le dernier build (null s'il n'y en a pas). Relu au plus toutes les 2 s en local.
let _built, _builtAt = 0;
function builtManifest() {
  const now = Date.now();
  if (_built !== undefined && (process.env.VERCEL === '1' || now - _builtAt < 2000)) return _built;
  _builtAt = now;
  try { _built = JSON.parse(fs.readFileSync(BUILD_MANIFEST, 'utf8')); if (!/^[0-9a-f]{10}$/.test(_built.version)) _built = null; }
  catch { _built = null; }
  return _built;
}

// Version servie : celle du build s'il y en a un, sinon celle des sources (build à venir, tests).
function assetsVersion() {
  const built = builtManifest();
  return built ? built.version : computeSourcesVersion();
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

// Actif dès qu'un build a laissé son manifeste (Vercel : embarqué dans la fonction ; local : après
// `npm run build`). ASSETS_HASHED=0|1 force (tests, dépannage).
function hashedAssetsEnabled() {
  if (process.env.ASSETS_HASHED === '0') return false;
  if (process.env.ASSETS_HASHED === '1') return true;
  return builtManifest() !== null;
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

module.exports = { BUILD_MANIFEST, DIST_DIR, PREFIX, assetUrl, assetsVersion, builtManifest, computeSourcesVersion, entries, frontSources, hashedAssetsEnabled, manifest, rewriteAssets };
