const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const assets = require('../lib/assets');

// Assets front hachés (ADR 0010) : version = hachage des sources, entrées découvertes dans le HTML,
// réécriture des références au rendu. Ces tests ne dépendent pas d'un build.
const ROOT = join(__dirname, '..');

test('la version est stable, courte, et change avec le contenu des sources', () => {
  const v = assets.assetsVersion();
  assert.match(v, /^[0-9a-f]{10}$/);
  assert.equal(assets.assetsVersion(), v, 'mémorisée');
  const sources = assets.frontSources();
  assert.ok(sources.includes('shared.js') && sources.includes('styles.css') && sources.includes('pages/produits.js'), 'sources front présentes');
  assert.ok(!sources.some((s) => s.startsWith('journal/')), 'journal/articles.data.mjs (données de build) n’est pas une source front');
});

test('les sources front sont toutes embarquées dans la fonction Vercel (sinon le serveur calculerait une autre version)', () => {
  const cfg = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
  const globs = cfg.functions['api/index.js'].includeFiles.replace(/^\{|\}$/g, '').split(',');
  const covered = (rel) => globs.some((g) => {
    const re = new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$');
    return re.test('v3/' + rel);
  });
  for (const rel of assets.frontSources()) assert.ok(covered(rel), `${rel} absent de includeFiles`);
});

test('les entrées sont les modules et feuilles de style référencés par le HTML', () => {
  const { js, css } = assets.entries();
  for (const p of ['/shared.js', '/main.js', '/family-page.js', '/pages/produits.js', '/pages/produit.js', '/nuancier-fermob.js']) assert.ok(js.includes(p), `${p} attendu`);
  assert.ok(!js.includes('/product-card.mjs'), 'un module seulement importé par d’autres modules n’est pas une entrée (il est regroupé)');
  assert.deepEqual(css, ['/nuancier-fermob.css', '/styles.css']);
});

test('assetUrl : nom haché pour une entrée, inchangé sinon', () => {
  const v = assets.assetsVersion();
  assert.equal(assets.assetUrl('/pages/produits.js'), `/assets/pages/produits.${v}.js`);
  assert.equal(assets.assetUrl('/shared.js'), `/assets/shared.${v}.js`);
  assert.equal(assets.assetUrl('/styles.css'), `/assets/styles.${v}.css`);
  assert.equal(assets.assetUrl('/product-card.mjs'), '/product-card.mjs');
  assert.equal(assets.assetUrl('/images/x.png'), '/images/x.png');
});

test('rewriteAssets : src, import statique, import() et <link> réécrits ; le reste intact ; passif si désactivé', () => {
  const v = assets.assetsVersion();
  const html = [
    '<link rel="stylesheet" href="/styles.css" />',
    '<link rel="stylesheet" href="https://use.typekit.net/gqc3ska.css" media="print" />',
    '<link rel="preload" as="font" href="/fonts/cormorant.woff2">',
    '<script type="module" src="/pages/produits.js"></script>',
    '<script type="module">import { initShell } from "/shared.js"; import(\'/nuancier-fermob.js\'); initShell();</script>',
    '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>',
    '<script type="application/json" id="x">{"from":"/shared.js"}</script>',
    '<img src="/images/a.webp"><a href="/produits.html">x</a>',
  ].join('\n');
  const out = assets.rewriteAssets(html, true);
  assert.ok(out.includes(`href="/assets/styles.${v}.css"`));
  assert.ok(out.includes(`src="/assets/pages/produits.${v}.js"`));
  assert.ok(out.includes(`from "/assets/shared.${v}.js"`));
  assert.ok(out.includes(`import('/assets/nuancier-fermob.${v}.js')`));
  assert.ok(out.includes('href="https://use.typekit.net/gqc3ska.css"') && out.includes('href="/fonts/cormorant.woff2"') && out.includes('unpkg.com/leaflet'));
  assert.ok(out.includes('{"from":"/shared.js"}'), 'un JSON qui contient "from" n’est pas un import');
  assert.ok(out.includes('<img src="/images/a.webp"><a href="/produits.html">'));
  assert.equal(assets.rewriteAssets(html, false), html, 'désactivé : HTML intact');
});

test('hashedAssetsEnabled : forcé par ASSETS_HASHED, actif sur Vercel', () => {
  const saved = { ...process.env };
  try {
    process.env.ASSETS_HASHED = '0'; process.env.VERCEL = '1';
    assert.equal(assets.hashedAssetsEnabled(), false, 'ASSETS_HASHED=0 l’emporte');
    delete process.env.ASSETS_HASHED;
    assert.equal(assets.hashedAssetsEnabled(), true, 'sur Vercel, le build a produit dist/assets');
    delete process.env.VERCEL; process.env.ASSETS_HASHED = '1';
    assert.equal(assets.hashedAssetsEnabled(), true);
  } finally { for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k]; Object.assign(process.env, saved); }
});
