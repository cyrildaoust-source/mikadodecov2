#!/usr/bin/env node
/**
 * Build — Mikado Deco
 * -------------------
 * Produit `dist/`, le dossier que Vercel sert en statique (vercel.json → outputDirectory).
 * Il contient UNIQUEMENT les fichiers servis tels quels : feuilles de style, modules
 * JavaScript, données JSON publiques, images, polices, robots.txt, llms.txt, favicons…
 * Les pages HTML n'y sont pas : ce sont des gabarits que le serveur Express lit (via
 * `functions.includeFiles` de vercel.json) et rend avec le chrome, les métadonnées et
 * le nonce CSP. Seules les pages déclarées `role: stub` dans data/pages.manifest.json
 * (redirections sans chrome) sont copiées telles quelles.
 *
 * Conséquence : toute URL qui ne correspond pas à un fichier de dist/ arrive au serveur,
 * qui décide (page rendue, API, redirection, 404). Plus de double routage à maintenir.
 *
 *   node scripts/build.mjs            # écrit ./dist
 *   node scripts/build.mjs --out X    # autre dossier (tests)
 */
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'v3');
const argIndex = process.argv.indexOf('--out');
const OUT = argIndex > 0 ? process.argv[argIndex + 1] : join(ROOT, 'dist');
const manifest = JSON.parse(readFileSync(join(ROOT, 'data', 'pages.manifest.json'), 'utf8'));
const STUBS = new Set(manifest.pages.filter((p) => p.role === 'stub' && p.dir !== 'templates').map((p) => p.file));

// Exclus : gabarits HTML (rendus par le serveur), fichiers de travail, sauvegardes, dossiers cachés.
export function keep(rel) {
  const base = rel.split(sep).pop();
  if (base.startsWith('.')) return false;                        // .DS_Store, .claude…
  if (/\.bak(-|$)/.test(base)) return false;                     // designers-data.json.bak-…
  if (base.endsWith('.md')) return false;                        // documentation
  if (base.endsWith('.html')) return STUBS.has(rel);             // seulement les stubs
  return true;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const rel = relative(SRC, abs);
    if (statSync(abs).isDirectory()) { if (!name.startsWith('.')) walk(abs, out); continue; }
    if (keep(rel)) out.push(rel);
  }
  return out;
}

export function build(out = OUT) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const files = walk(SRC);
  let bytes = 0;
  for (const rel of files) {
    const from = join(SRC, rel), to = join(out, rel);
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to);
    bytes += statSync(from).size;
  }
  return { files, bytes };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { files, bytes } = build();
  const kinds = {};
  for (const f of files) { const ext = f.split('.').pop(); kinds[ext] = (kinds[ext] || 0) + 1; }
  console.log(`dist/ : ${files.length} fichiers, ${(bytes / 1024 / 1024).toFixed(1)} Mo — ${Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')}`);
}
