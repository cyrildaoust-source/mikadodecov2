const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SITE_NAME, pageTitle, productTitle } = require('../lib/render/seo');

// Modèle de titre par type de page (exigence A3) : une seule forme par type, décidée en un endroit.
test('fiche produit : le titre SEO Shopify prime, sinon « Nom — Marque | Mikado Deco »', () => {
  assert.equal(productTitle({ seoTitle: 'Verre à eau Animal Farm — Ichendorf Milano | Mikado Deco', name: 'x', brand: 'y' }), 'Verre à eau Animal Farm — Ichendorf Milano | Mikado Deco');
  assert.equal(productTitle({ seoTitle: '  ', name: 'Chaise Bistro', brand: 'Fermob' }), 'Chaise Bistro — Fermob | Mikado Deco');
  assert.equal(productTitle({ name: 'Lampe', brand: '' }), 'Lampe | Mikado Deco');
  assert.equal(productTitle({}), `Produit | ${SITE_NAME}`);
  assert.equal(productTitle({ name: ' Table  Luxembourg ', brand: 'Fermob ' }), 'Table Luxembourg — Fermob | Mikado Deco', 'espaces normalisés');
});

test('autres pages : « Nom · Mikado Deco », idempotent, jamais vide', () => {
  assert.equal(pageTitle('Vitra à Bruxelles'), 'Vitra à Bruxelles · Mikado Deco');
  assert.equal(pageTitle('Votre recherche'), 'Votre recherche · Mikado Deco');
  assert.equal(pageTitle('Contact · Mikado Deco'), 'Contact · Mikado Deco', 'déjà suffixé');
  assert.equal(pageTitle('Mikado Studio | Mikado Deco'), 'Mikado Studio | Mikado Deco', 'autre séparateur accepté');
  assert.equal(pageTitle(''), SITE_NAME);
  assert.equal(pageTitle(null), SITE_NAME);
});

test('les routes passent par le modèle (aucune concaténation « · Mikado Deco » restante)', () => {
  const { readFileSync } = require('node:fs');
  const { join } = require('node:path');
  for (const f of ['routes/pages.js', 'lib/render/pages.js']) {
    const src = readFileSync(join(__dirname, '..', f), 'utf8');
    assert.doesNotMatch(src, /· Mikado Deco[`']/, `${f} : titre composé à la main`);
  }
});
