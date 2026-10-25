const { test } = require('node:test');
const assert = require('node:assert/strict');
// Relecture du 25 octobre 2026 : le champ texte de Shopify collait les paragraphes (« éditée par Vitra.L’œuvre »).
const { descriptionText } = require('../lib/shopify/product-mapper');

test('description de fiche : un paragraphe par bloc HTML, entités décodées, repli sur le texte brut', () => {
  const html = '<p>Suspension <strong>Akari 26A</strong>, éditée par Vitra.</p><p>L’œuvre&nbsp;&amp; la lumière.</p><ul><li>Un</li><li>Deux</li></ul>Ligne<br>suivante';
  assert.equal(descriptionText(html, 'x'), 'Suspension Akari 26A, éditée par Vitra.\n\nL’œuvre & la lumière.\n\nUn\n\nDeux\n\nLigne\nsuivante');
  assert.equal(descriptionText('', 'texte brut'), 'texte brut');
  assert.doesNotMatch(descriptionText('<p>A.</p><p>B</p>'), /\.B/);
});
