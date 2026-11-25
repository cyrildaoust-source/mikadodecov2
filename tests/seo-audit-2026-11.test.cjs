// Corrections de l'audit SEO du 10 novembre 2026 : titres de liste uniformes, textes de marque,
// H1 d'accueil stable, page Black Month redirigée vers Promotions une fois l'opération finie.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { listingTitle } = require('../lib/render/seo');
const { brandText, brandAboutHTML, injectBrandAbout } = require('../lib/brand-texts');
const { filterScope } = require('../lib/filter-scopes');
const bm = require('../lib/black-month');

test('titre de liste : le même modèle pour tous les chemins de rendu', () => {
  assert.equal(listingTitle('Vitra', 'brand'), 'Vitra à Bruxelles · Mikado Deco');
  assert.equal(listingTitle('Luminaires', 'family'), 'Luminaires design à Bruxelles · Mikado Deco');
  assert.equal(listingTitle('Chaises', 'subcategory'), 'Chaises design à Bruxelles · Mikado Deco');
  assert.equal(listingTitle('Nouveautés'), 'Nouveautés · Mikado Deco');
  assert.equal(listingTitle(''), 'Mikado Deco');
  const families = fs.readFileSync(path.join(__dirname, '..', 'lib/family-pages.js'), 'utf8');
  assert.doesNotMatch(families, /' · Mikado Deco'/, 'page famille : titre composé à la main');
});

test('textes de marque : intro de 160 caractères au plus, bloc « À propos » échappé, une seule fois', () => {
  const { brands } = require('../data/brand-texts.json');
  for (const [handle, text] of Object.entries(brands)) {
    assert.ok(text.intro && text.intro.length <= 160, `${handle} : intro absente ou trop longue`);
    assert.ok(text.title && text.paragraphs.length >= 2, `${handle} : titre ou paragraphes manquants`);
    assert.ok(filterScope(handle)?.collectionKind === 'brand', `${handle} : pas une marque du registre`);
  }
  const vitra = filterScope('vitra');
  assert.equal(vitra.sub, brandText('vitra').intro, 'sous-titre du bandeau');
  assert.equal(vitra.ogDescription, brandText('vitra').intro, 'description SEO');
  const block = brandAboutHTML('tradition');
  assert.match(block, /<h2 class="serif" id="brand-about-title">&amp;Tradition à Bruxelles<\/h2>/);
  assert.equal(brandAboutHTML('marque-inconnue'), '');
  // Sous le titre, avant la grille (25 novembre 2026), le 1er paragraphe visible, la suite derrière « Lire la suite ».
  const page = '<main id="contenu"><div class="wrap" data-breadcrumb></div><p>grille</p></main>';
  const once = injectBrandAbout(page, 'fermob');
  assert.match(once, /data-breadcrumb><\/div>\n<section class="wrap brand-about[\s\S]*<\/section><p>grille<\/p>/);
  assert.match(once, /<details class="brand-about__more"><summary>Lire la suite<\/summary>/);
  assert.match(once, /href="\/nuancier-fermob\.html"/);
  assert.equal(injectBrandAbout(once, 'fermob'), once, 'pas de doublon');
  assert.equal(injectBrandAbout(page, 'marque-inconnue'), page);
  // Texte saisi dans Shopify (métaobjet texte_marque) : prioritaire, et échappé.
  const shop = injectBrandAbout(page, 'fermob', { title: '', paragraphs: ['Un <b>texte</b> Shopify.', 'Suite.'] });
  assert.match(shop, /<p>Un &lt;b&gt;texte&lt;\/b&gt; Shopify\.<\/p>/);
  assert.match(shop, /id="brand-about-title">Fermob à Bruxelles</, "sans titre saisi, celui du fichier reste");
  assert.doesNotMatch(shop, /nuancier-fermob/);
  const { paragraphs } = require('../lib/services/brand-editorial');
  assert.deepEqual(paragraphs('Un.\nDeux.\n\n  Trois. \n'), ['Un. Deux.', 'Trois.']);
});

test('accueil : le H1 porte le lieu, toute l’année', () => {
  const home = fs.readFileSync(path.join(__dirname, '..', 'v3/index.html'), 'utf8');
  assert.match(home, /<h1 class="serif">[^]*?Mobilier et déco design à Bruxelles[^]*?<\/h1>/);
  const routes = fs.readFileSync(path.join(__dirname, '..', 'routes/pages.js'), 'utf8');
  assert.doesNotMatch(routes, /blackMonthHero\(\{ level: 'h1'/, 'la campagne ne prend plus le H1 de l’accueil');
});

test('Black Month : terminée le 29 novembre au matin, jamais avant', () => {
  assert.equal(bm.ended(Date.parse('2026-11-28T23:30:00+01:00')), false);
  assert.equal(bm.ended(Date.parse('2026-11-29T00:00:00+01:00')), true);
});

test('magasin : une seule source de données structurées pour l’accueil, le contact et Mikado Studio', () => {
  const { renderPage } = require('../lib/render/layout');
  for (const page of ['index.html', 'contact.html', 'studio.html']) {
    const html = renderPage(page);
    assert.match(html, /"@type": "FurnitureStore"/, page);
    assert.match(html, /"streetAddress": "75 Rue du Doyenné"/, page);
    assert.match(html, /"opens": "10:30"/, page);
    assert.doesNotMatch(html, /STORE-JSONLD/, page);
  }
  assert.match(renderPage('studio.html'), /"@type": "Service"[\s\S]*"name": "Mikado Studio"/);
});
