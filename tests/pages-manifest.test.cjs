const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');

// data/pages.manifest.json est la seule liste des pages HTML : le serveur (lib/config.js)
// et vercel.json (scripts/build-vercel-config.mjs) en dérivent. Ces tests empêchent
// la dérive dans les deux sens : page oubliée dans le manifeste, ou vercel.json pas régénéré.
const ROOT = join(__dirname, '..');
const manifest = JSON.parse(readFileSync(join(ROOT, 'data', 'pages.manifest.json'), 'utf8'));
const files = (p) => p.dir === 'templates' ? join(ROOT, 'templates', p.file) : join(ROOT, 'v3', p.file);

test('chaque page du manifeste existe, une seule fois, avec des champs valides', () => {
  const seen = new Set();
  for (const p of manifest.pages) {
    assert.ok(existsSync(files(p)), `${p.file} n'existe pas`);
    assert.ok(!seen.has(p.file), `${p.file} en double`); seen.add(p.file);
    assert.ok(['page', 'template', 'stub'].includes(p.role), `${p.file} : role inconnu ${p.role}`);
    assert.equal(typeof p.ssr, 'boolean', `${p.file} : ssr doit être booléen`);
    assert.equal(typeof p.hero, 'boolean', `${p.file} : hero doit être booléen`);
    assert.equal(typeof p.active, 'string', `${p.file} : active doit être une chaîne`);
  }
});

test('toute page HTML de v3/ est déclarée dans le manifeste (ajouter la ligne, puis régénérer vercel.json)', () => {
  const declared = new Set(manifest.pages.filter((p) => p.dir !== 'templates').map((p) => p.file));
  const onDisk = readdirSync(join(ROOT, 'v3')).filter((f) => f.endsWith('.html'));
  const missing = onDisk.filter((f) => !declared.has(f));
  assert.deepEqual(missing, [], `pages absentes du manifeste : ${missing.join(', ')}`);
});

test('les pages servies avec le chrome (ssr) ont bien un conteneur #site-header ; les stubs non', () => {
  for (const p of manifest.pages) {
    const html = readFileSync(files(p), 'utf8');
    if (p.ssr || p.role === 'template') assert.match(html, /id="site-header"/, `${p.file} : pas de #site-header`);
    if (p.role === 'stub') assert.doesNotMatch(html, /id="site-header"/, `${p.file} : un stub ne porte pas le chrome`);
  }
});

test('lib/config.js lit le manifeste : pages SSR, header solide, entrée active, alias', () => {
  const { SSR_PAGES, isNonHero, activeForRel, resolveSsrRel } = require('../lib/config');
  assert.deepEqual([...SSR_PAGES].sort(), manifest.pages.filter((p) => p.ssr).map((p) => p.file).sort());
  assert.equal(isNonHero('contact.html'), true);
  assert.equal(isNonHero('index.html'), false);
  assert.equal(isNonHero('journal/un-article.html'), true);
  assert.equal(isNonHero('page-inconnue.html'), false);        // défaut : hero (header transparent)
  assert.equal(activeForRel('marques.html'), 'Marques');
  assert.equal(activeForRel('family-page.html'), 'Mobilier');
  assert.equal(activeForRel('journal/un-article.html'), 'Le journal');
  assert.equal(activeForRel('contact.html'), '');
  assert.equal(resolveSsrRel('/about'), 'studio.html');
  assert.equal(resolveSsrRel('/'), 'index.html');
  assert.equal(resolveSsrRel('/produit.html'), null);           // gabarit : route dédiée, pas la générique
  assert.equal(resolveSsrRel('/journal/x.html'), 'journal/x.html');
});

test('vercel.json est aligné sur le manifeste (sinon : node scripts/build-vercel-config.mjs)', () => {
  const out = execFileSync(process.execPath, [join(ROOT, 'scripts', 'build-vercel-config.mjs'), '--check'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  assert.match(out, /aligné/);
});
