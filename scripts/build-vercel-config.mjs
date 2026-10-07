#!/usr/bin/env node
/**
 * vercel.json ← data/pages.manifest.json
 * ---------------------------------------
 * Le routage Vercel doit envoyer vers la fonction (api/index.js) exactement les
 * pages que le serveur rend avec le chrome (`ssr: true` dans le manifeste) et les
 * alias agents (`aliases`). Avant, ces listes étaient recopiées à la main dans
 * server.js ET dans vercel.json : un oubli = 404 en production uniquement.
 *
 * Ce script réécrit UNIQUEMENT les deux règles concernées dans vercel.json, en
 * place, sans toucher au reste du fichier (formatage d'une règle par ligne conservé).
 *
 *   node scripts/build-vercel-config.mjs          # met vercel.json à jour
 *   node scripts/build-vercel-config.mjs --check  # code 1 si vercel.json n'est pas à jour (CI)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = join(ROOT, 'data', 'pages.manifest.json');
const VERCEL_PATH = join(ROOT, 'vercel.json');

export function expectedRules(manifest) {
  const ssrPages = manifest.pages.filter((p) => p.ssr).map((p) => p.file.replace(/\.html$/, ''));
  const aliases = Object.keys(manifest.aliases).filter((k) => k.startsWith('/')).map((k) => k.slice(1));
  return {
    pages: `{ "src": "/(${ssrPages.join('|')})\\\\.html$", "dest": "/api/index.js" },`,
    aliases: `{ "src": "/(${aliases.join('|')})", "dest": "/api/index.js" },`,
  };
}

// Les deux règles existantes, repérées par leur forme (pas par leur contenu).
const PAGES_RULE = /\{ "src": "\/\([a-z0-9|-]+\)\\\\\.html\$", "dest": "\/api\/index\.js" \},/;
const ALIASES_RULE = /\{ "src": "\/\([a-z|-]+\)", "dest": "\/api\/index\.js" \},/;

export function rebuild(vercelText, manifest) {
  const rules = expectedRules(manifest);
  if (!PAGES_RULE.test(vercelText)) throw new Error('vercel.json : règle des pages SSR introuvable (forme attendue : { "src": "/(a|b)\\\\.html$", "dest": "/api/index.js" })');
  if (!ALIASES_RULE.test(vercelText)) throw new Error('vercel.json : règle des alias agents introuvable (forme attendue : { "src": "/(about|privacy)", "dest": "/api/index.js" })');
  return vercelText.replace(PAGES_RULE, rules.pages).replace(ALIASES_RULE, rules.aliases);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const current = readFileSync(VERCEL_PATH, 'utf8');
  const next = rebuild(current, manifest);
  JSON.parse(next);                                   // le résultat doit rester un JSON valide
  if (process.argv.includes('--check')) {
    if (next === current) { console.log('vercel.json est aligné sur data/pages.manifest.json.'); process.exit(0); }
    console.error('vercel.json n\'est PAS aligné sur data/pages.manifest.json. Lancer : node scripts/build-vercel-config.mjs');
    const { pages, aliases } = expectedRules(manifest);
    console.error('attendu :\n  ' + pages + '\n  ' + aliases);
    process.exit(1);
  }
  if (next === current) console.log('vercel.json déjà à jour.');
  else { writeFileSync(VERCEL_PATH, next); console.log('vercel.json mis à jour depuis data/pages.manifest.json.'); }
}
