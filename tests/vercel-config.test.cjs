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
  for (const part of ['data/**', 'templates/**', 'v3/*.html', 'v3/*.mjs', 'v3/*.json', 'v3/journal/**']) assert.ok(fn.includeFiles.includes(part), `includeFiles doit couvrir ${part}`);
  assert.equal(fn.maxDuration, undefined, 'maxDuration héritée du projet (Fluid compute, 300 s) : ne pas la plafonner ici');
});

test('vercel.json : tout ce qui n’est pas un fichier statique va au serveur ; en-têtes de sécurité et cache des médias', () => {
  assert.deepEqual(cfg.rewrites, [{ source: '/(.*)', destination: '/api/index' }]);
  const all = cfg.headers.find((h) => h.source === '/(.*)');
  const keys = all.headers.map((h) => h.key);
  for (const k of ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy', 'Strict-Transport-Security']) assert.ok(keys.includes(k), k);
  assert.ok(!keys.includes('Content-Security-Policy'), 'la CSP vient du serveur (nonce), pas de vercel.json');
  const media = cfg.headers.find((h) => /png\|jpg/.test(h.source));
  assert.equal(media.headers[0].value, 'public, max-age=31536000, immutable');
  const code = cfg.headers.find((h) => /css\|js/.test(h.source));
  assert.equal(code.headers[0].value, 'public, max-age=0, must-revalidate', 'CSS/JS revalidés à chaque fois (pas encore de hash dans le nom)');
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
  assert.equal(by['/collections'].permanent, false, '/collections → 302 comme avant');
  assert.equal(by['/nos-marques/vitra/'].destination, '/collections/vitra', 'variante avec barre finale (l’ancienne règle acceptait /?)');
  for (const r of cfg.redirects) if (r.source !== '/collections') assert.equal(r.permanent, true, r.source);
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
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test('le dépôt ne porte plus le générateur de routes hérité', () => {
  assert.ok(!existsSync(join(ROOT, 'scripts', 'build-vercel-config.mjs')));
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['build:vercel'], undefined);
  assert.equal(pkg.scripts.build, 'node scripts/build.mjs');
});
