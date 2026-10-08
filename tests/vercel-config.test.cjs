const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync, readdirSync, statSync, mkdtempSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { execFileSync } = require('node:child_process');

// Configuration Vercel moderne (ADR 0009) : plus de `builds`/`routes`, un build qui ne publie
// que les fichiers statiques, tout le reste au serveur. Ces tests figent le contrat.
const ROOT = join(__dirname, '..');
const cfg = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(ROOT, 'data', 'pages.manifest.json'), 'utf8'));

test('vercel.json : configuration moderne, build vers dist/, fonction avec ses gabarits et données', () => {
  assert.equal(cfg.builds, undefined, 'plus de `builds` hérité');
  assert.equal(cfg.routes, undefined, 'plus de `routes` hérité');
  assert.equal(cfg.buildCommand, 'npm run build');
  assert.equal(cfg.outputDirectory, 'dist');
  const fn = cfg.functions['api/index.js'];
  for (const part of ['data/**', 'templates/**', 'v3/*.html', 'v3/*.js', 'v3/*.mjs', 'v3/*.css', 'v3/*.json', 'v3/pages/**', 'v3/journal/**']) assert.ok(fn.includeFiles.includes(part), `includeFiles doit couvrir ${part}`);
  assert.equal(fn.maxDuration, undefined, 'maxDuration héritée du projet (Fluid compute, 300 s) : ne pas la plafonner ici');
  const excluded = (fn.excludeFiles || '').replace(/^\{|\}$/g, '').split(',');
  assert.ok(excluded.includes('dist/**'), 'dist/** exclu de la fonction : le build le produit avant le tracé (sinon 327 Mo > 250 Mo, vu le 8 oct.)');
  assert.ok(excluded.includes('v3/images/**') && excluded.includes('v3/fonts/**'), 'images et polices servies par le CDN depuis dist/, jamais lues par le serveur : hors de la fonction (−163 Mo)');
});

test('vercel.json : tout ce qui n’est pas un fichier statique va au serveur ; en-têtes de sécurité et cache des médias', () => {
  assert.deepEqual(cfg.rewrites, [{ source: '/(.*)', destination: '/api/index' }]);
  const all = cfg.headers.find((h) => h.source === '/(.*)');
  const keys = all.headers.map((h) => h.key);
  for (const k of ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy', 'Strict-Transport-Security']) assert.ok(keys.includes(k), k);
  assert.ok(!keys.includes('Content-Security-Policy'), 'la CSP vient du serveur (nonce), pas de vercel.json');
  const media = cfg.headers.find((h) => /png\|jpg/.test(h.source));
  assert.equal(media.headers[0].value, 'public, max-age=31536000, immutable');
  const hashed = cfg.headers.find((h) => h.source === '/assets/(.*)');
  assert.equal(hashed.headers[0].value, 'public, max-age=31536000, immutable', 'assets hachés : un an, immutable (ADR 0010)');
  assert.ok(!cfg.headers.some((h) => /css\|js/.test(h.source)), 'plus de règle CSS/JS à part : le défaut Vercel (max-age=0, must-revalidate) suffit pour les sources');
});

test('vercel.json : les redirections historiques sont toutes là, avec le bon statut', () => {
  const by = Object.fromEntries(cfg.redirects.map((r) => [r.source, r]));
  assert.equal(by['/article.html'].destination, '/journal/:slug.html');
  assert.equal(by['/article.html'].has[0].key, 'slug');
  for (const src of ['/nos-produits/:path*', '/passez-commande/:path*']) assert.equal(by[src].destination, '/produits.html');
  assert.equal(by['/nos-marques/:path*'].destination, '/marques.html');
  assert.equal(by['/nos-marques/vitra'].destination, '/collections/vitra');
  assert.equal(by['/prendre-rendez-vous/:path*'].destination, '/rendez-vous.html');
  assert.equal(by['/contact'].destination, '/contact.html');
  assert.equal(by['/v3/:path*'].destination, '/:path*');
  assert.equal(by['/collections'].statusCode, 302, '/collections → 302 comme avant');
  assert.equal(by['/nos-marques/vitra/'].destination, '/collections/vitra', 'variante avec barre finale (l’ancienne règle acceptait /?)');
  for (const r of cfg.redirects) {
    assert.equal(r.permanent, undefined, `${r.source} : \`permanent\` donnerait 308/307 ; on fixe statusCode`);
    if (r.source !== '/collections') assert.equal(r.statusCode, 301, r.source);
  }
});

test('npm run build : dist/ ne contient que les fichiers statiques (pas de gabarit HTML, pas de fichier de travail)', () => {
  const out = mkdtempSync(join(tmpdir(), 'mikado-dist-'));
  try {
    execFileSync(process.execPath, [join(ROOT, 'scripts', 'build.mjs'), '--out', out], { stdio: 'pipe' });
    const files = []; (function walk(d) { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : files.push(p.slice(out.length + 1)); } })(out);
    const html = files.filter((f) => f.endsWith('.html'));
    const stubs = manifest.pages.filter((p) => p.role === 'stub').map((p) => p.file);
    assert.deepEqual(html.sort(), stubs.sort(), 'seuls les stubs du manifeste sont des HTML statiques');
    for (const must of ['styles.css', 'shared.js', 'product-card.mjs', 'pages/produits.js', 'mega-menu-brands.json', 'robots.txt', 'llms.txt', 'favicon.ico', 'logomikado.svg']) assert.ok(files.includes(must), `${must} manquant`);
    assert.ok(files.some((f) => f.startsWith('images/')) && files.some((f) => f.startsWith('fonts/')));
    assert.ok(!files.some((f) => /\.(md|bak)/.test(f) || f.split('/').some((seg) => seg.startsWith('.'))), 'aucun fichier de travail');
    assert.ok(!files.some((f) => f.startsWith('journal/') && f.endsWith('.html')), 'les articles sont rendus par le serveur');
    // Assets hachés (ADR 0010) : une entrée par module référencé dans le HTML, une par feuille de style, un manifeste de la même version que le serveur.
    const { assetsVersion, entries } = require('../lib/assets');
    const built = JSON.parse(readFileSync(join(out, 'assets', 'manifest.json'), 'utf8'));
    assert.equal(built.version, assetsVersion(), 'le build et le serveur calculent la même version');
    for (const p of entries().js) assert.ok(files.includes(`assets/${p.slice(1).replace(/\.m?js$/, '')}.${built.version}.js`), `bundle manquant pour ${p}`);
    for (const p of entries().css) assert.ok(files.includes(`assets/${p.slice(1).replace(/\.css$/, '')}.${built.version}.css`), `feuille manquante pour ${p}`);
    assert.ok(files.some((f) => f.startsWith('assets/chunks/') && f.endsWith('.js')), 'le code partagé (shared.js…) est découpé en chunks');
    assert.ok(files.some((f) => f.startsWith('assets/') && f.endsWith('.js.map')), 'sourcemaps présentes');
    const styles = readFileSync(join(out, `assets/styles.${built.version}.css`), 'utf8');
    assert.ok(!/@import/.test(styles) && /\.mm-/.test(styles), 'mega-menu.css est fusionné dans styles (plus d’@import en cascade)');
    assert.ok(/url\(\/fonts\//.test(styles), 'les url(/fonts/…) restent absolues');
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test('le dépôt ne porte plus le générateur de routes hérité', () => {
  assert.ok(!existsSync(join(ROOT, 'scripts', 'build-vercel-config.mjs')));
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['build:vercel'], undefined);
  assert.equal(pkg.scripts.build, 'node scripts/build.mjs');
});
