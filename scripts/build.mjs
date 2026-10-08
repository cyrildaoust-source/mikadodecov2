#!/usr/bin/env node
/**
 * Build — Mikado Deco
 * -------------------
 * Produit `dist/`, le dossier que Vercel sert en statique (vercel.json → outputDirectory).
 *
 * 1. Copie de v3/ : feuilles de style, modules, données JSON publiques, images, polices,
 *    robots.txt, llms.txt, favicons… SANS les pages HTML (gabarits lus par le serveur, qui les
 *    rend avec le chrome, les métadonnées et le nonce CSP ; seuls les `stub` du manifeste sont
 *    copiés), sans .md, sauvegardes .bak, fichiers cachés.
 * 2. Assets hachés (ADR 0010) : esbuild regroupe et minifie chaque module référencé par le HTML
 *    (lib/assets.js → entries()) dans dist/assets/<nom>.<version>.js (+ chunks partagés,
 *    sourcemaps) et chaque feuille de style dans dist/assets/<nom>.<version>.css. La version est
 *    le hachage des sources front ; le serveur la recalcule et réécrit les références au rendu.
 *
 * Toute URL qui ne correspond pas à un fichier de dist/ arrive au serveur, qui décide.
 *
 *   node scripts/build.mjs            # écrit ./dist
 *   node scripts/build.mjs --out X    # autre dossier (tests)
 */
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as esbuild } from 'esbuild';

const require = createRequire(import.meta.url);
const assets = require('../lib/assets.js');

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

// Les imports absolus (`/shared.js`, `@import url("/mega-menu.css")`) désignent des fichiers de
// v3/ ; les ressources servies telles quelles (/fonts, /images) restent des URL externes au bundle.
const racineV3 = {
  name: 'racine-v3',
  setup(b) {
    // Filtre = expression Go (pas de lookahead) : on écarte les URL « //hôte » dans le rappel.
    b.onResolve({ filter: /^\// }, (args) => {
      if (args.kind === 'entry-point' || args.path.startsWith('//')) return undefined;   // chemins absolus du disque / URL « //hôte »
      if (/^\/(fonts|images)\//.test(args.path)) return { path: args.path, external: true };
      return { path: join(SRC, args.path) };
    });
  },
};

export async function bundleAssets(out) {
  const { js, css } = assets.entries();
  const version = assets.assetsVersion();
  const outdir = join(out, 'assets');
  const asEntries = (list, ext) => Object.fromEntries(list.map((p) => [p.slice(1).replace(ext, ''), join(SRC, p)]));
  const common = { bundle: true, minify: true, charset: 'utf8', legalComments: 'none', outdir, entryNames: `[dir]/[name].${version}`, plugins: [racineV3], logLevel: 'warning' };
  // JS : un bundle par entrée, code partagé découpé en chunks ; es2022 car les pages utilisent `await` au niveau module.
  await esbuild({ ...common, entryPoints: asEntries(js, /\.m?js$/), splitting: true, format: 'esm', platform: 'browser', target: ['es2022'], sourcemap: true, chunkNames: 'chunks/[name]-[hash]' });   // chunks : référencés par les bundles seulement → hachage de contenu
  // CSS : @import fusionnés ; les url() vers des hôtes externes ou des data: restent telles quelles.
  await esbuild({ ...common, entryPoints: asEntries(css, /\.css$/), external: ['https://*', 'http://*', 'data:*'] });
  const built = { ...assets.manifest(), builtAt: new Date().toISOString() };
  writeFileSync(join(outdir, 'manifest.json'), JSON.stringify(built, null, 2) + '\n');
  return built;
}

export async function build(out = OUT) {
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
  const bundled = await bundleAssets(out);
  return { files, bytes, bundled };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { files, bytes, bundled } = await build();
  const kinds = {};
  for (const f of files) { const ext = f.split('.').pop(); kinds[ext] = (kinds[ext] || 0) + 1; }
  console.log(`dist/ : ${files.length} fichiers, ${(bytes / 1024 / 1024).toFixed(1)} Mo — ${Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')}`);
  console.log(`assets ${bundled.version} : ${Object.keys(bundled.js).length} entrées JS, ${Object.keys(bundled.css).length} feuilles de style → dist/assets/`);
}
