// Index du catalogue dans Vercel Blob — ADR 0002, étape 2 (variante plan Hobby)
// ------------------------------------------------------------------------------
// Avant : chaque instance de la fonction relisait l'index sur le CDN de son propre
// endpoint /index-catalogue/<partie>.json ; CDN froid (déploiement, 24 h sans visite)
// → construction dans la requête d'un visiteur (13 à 60 s), et deux rendus possibles
// d'une même URL (liste de repli puis liste indexée).
//
// Maintenant : une route protégée (POST /api/cron/catalog-index, appelée toutes les
// 30 min par .github/workflows/warm-cache.yml — le Cron Vercel du plan Hobby ne permet
// qu'une exécution par jour) construit l'index et l'écrit ici, en 1 + PARTS fichiers
// JSON publics plus un `meta.json` (date, nombre de produits, URL des parties). Toutes
// les instances le lisent en un `list` + quelques `fetch` (~200 ms) au lieu de le
// reconstruire. Sans token Blob (dev, tests, Blob indisponible), rien ne change :
// l'ancien chemin reste en repli (catalog-scope.js).
//
// Les URL Blob sont publiques : c'est la même donnée que /index-catalogue aujourd'hui.
// `cacheControlMaxAge` = 60 s (minimum Blob) : une réécriture est visible en une minute.
const PREFIX = 'catalog-index/';
const CACHE_MAX_AGE = 60;
const WRITE_OPTIONS = { access: 'public', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: CACHE_MAX_AGE, contentType: 'application/json; charset=utf-8' };

let sdk = null;
const blob = () => sdk || (sdk = require('@vercel/blob'));

function blobConfigured(env = process.env) {
  return Boolean(env.BLOB_READ_WRITE_TOKEN);
}

const partNames = (parts) => ['membres', ...Array.from({ length: parts }, (_, i) => String(i))];

// Écrit les parties empaquetées (packIndex) puis meta.json ; renvoie le contenu de meta.
async function writeIndex(packed, meta, { put = (...a) => blob().put(...a) } = {}) {
  const files = [['membres', packed.membres], ...packed.parts.map((text, i) => [String(i), text])];
  const results = await Promise.all(files.map(([name, body]) => put(`${PREFIX}${name}.json`, body, WRITE_OPTIONS)));
  const urls = Object.fromEntries(results.map((r, i) => [files[i][0], r.url]));
  const metaDoc = { version: 1, ...meta, parts: packed.parts.length, urls, writtenAt: new Date().toISOString() };
  await put(`${PREFIX}meta.json`, JSON.stringify(metaDoc), WRITE_OPTIONS);
  return metaDoc;
}

// meta.json du store, ou null s'il n'y a pas encore d'index.
async function readMeta({ list = (...a) => blob().list(...a), fetch = globalThis.fetch } = {}) {
  const { blobs = [] } = await list({ prefix: `${PREFIX}meta.json`, limit: 5 });
  const entry = blobs.find((b) => b.pathname === `${PREFIX}meta.json`);
  if (!entry) return null;
  const response = await fetch(entry.url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Index Blob meta HTTP ${response.status}`);
  const meta = await response.json();
  if (meta?.version !== 1 || !meta.urls || !Number.isInteger(meta.parts)) throw new Error('Index Blob : meta invalide');
  return meta;
}

// L'index complet (déballé par `unpack`, c.-à-d. unpackIndex) et son meta, ou null.
async function readIndex({ unpack, list, fetch = globalThis.fetch } = {}) {
  const meta = await readMeta({ list, fetch });
  if (!meta) return null;
  const texts = await Promise.all(partNames(meta.parts).map(async (name) => {
    const url = meta.urls[name];
    if (!url) throw new Error(`Index Blob : partie ${name} absente du meta`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Index Blob ${name} HTTP ${response.status}`);
    return response.text();
  }));
  return { index: unpack(texts[0], texts.slice(1)), meta };
}

module.exports = { PREFIX, CACHE_MAX_AGE, blobConfigured, writeIndex, readMeta, readIndex, partNames };
