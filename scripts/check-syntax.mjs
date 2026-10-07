#!/usr/bin/env node
/**
 * Vérification de syntaxe — Mikado Deco
 * -------------------------------------
 * Parse chaque fichier JavaScript du projet (`node --check`, CommonJS comme ESM,
 * la détection de module de Node ≥ 22.7 reconnaît les `import` dans les .js) et
 * chaque fichier JSON (données, menus, vercel.json, package.json).
 *
 * Zéro dépendance. Lancé par `npm run check` et par la CI avant `npm test` :
 * une faute de frappe dans un module que les tests ne chargent pas (page
 * front, script, JSON de données) est attrapée ici au lieu d'en production.
 *
 * Sortie : la liste des fichiers en erreur avec le message de Node, puis un
 * total. Code de sortie 1 s'il y a au moins une erreur.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const ROOTS = ['server.js', 'api', 'lib', 'scripts', 'tests', 'v3', 'data', 'templates'];
const EXTRA_JSON = ['package.json', 'vercel.json'];
const SKIP_DIRS = new Set(['node_modules', 'images', 'fonts', '.git']);
const JS_EXT = new Set(['.js', '.mjs', '.cjs']);

function walk(entry, out) {
  let stat;
  try { stat = statSync(entry); } catch { return out; }           // racine absente (ex. templates/) → ignorée
  if (!stat.isDirectory()) { out.push(entry); return out; }
  for (const name of readdirSync(entry)) {
    if (SKIP_DIRS.has(name)) continue;
    walk(join(entry, name), out);
  }
  return out;
}

const files = ROOTS.flatMap((root) => walk(root, []));
const jsFiles = files.filter((f) => JS_EXT.has(extname(f)));
const jsonFiles = files.filter((f) => extname(f) === '.json').concat(EXTRA_JSON);

let failed = 0;
for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (error) {
    failed++;
    console.error(`✖ ${file}\n${String(error.stderr || error.message).trim()}\n`);
  }
}
for (const file of jsonFiles) {
  try {
    JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    failed++;
    console.error(`✖ ${file} : ${error.message}`);
  }
}

console.log(`${jsFiles.length} fichiers JS et ${jsonFiles.length} fichiers JSON vérifiés — ${failed} erreur(s).`);
process.exit(failed ? 1 : 0);
