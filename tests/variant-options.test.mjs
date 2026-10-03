import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { optionAxes, variantForOption, pdpView } from '../v3/pdp-view.mjs';

const { selectInitialVariant } = createRequire(import.meta.url)('../v3/product-variant.js');
const v = (id, couleur, pietement, cuir, available = true) => ({
  id, title: `${couleur} / ${pietement} / ${cuir}`, price: 100, available, qty: null, image: `https://cdn.shopify.com/${id}.png`,
  options: [{ name: 'Couleur', value: couleur }, { name: 'Piètement', value: pietement }, { name: 'Cuir du dos', value: cuir }],
});
// Combinaisons incomplètes, comme dans Shopify : Rouge n'existe qu'en piètement Noir.
const variants = [
  v('1', 'Gris', 'Alu', 'Noir'), v('2', 'Gris', 'Noir', 'Noir'), v('3', 'Gris', 'Alu', 'Brun'),
  v('4', 'Rouge', 'Noir', 'Noir'), v('5', 'Rouge', 'Noir', 'Brun', false), v('6', 'Bleu', 'Mono', 'Noir'),
];

test('one axis per Shopify option with at least two values, in Shopify order', () => {
  assert.deepEqual(optionAxes(variants), [
    { name: 'Couleur', values: ['Gris', 'Rouge', 'Bleu'] },
    { name: 'Piètement', values: ['Alu', 'Noir', 'Mono'] },
    { name: 'Cuir du dos', values: ['Noir', 'Brun'] },
  ]);
  assert.deepEqual(optionAxes([{ options: [{ name: 'Cadre', value: 'Noir' }, { name: 'Coque', value: 'A' }] }, { options: [{ name: 'Cadre', value: 'Noir' }, { name: 'Coque', value: 'B' }] }]), [{ name: 'Coque', values: ['A', 'B'] }]);
});

test('changing one option keeps the other choices when the combination exists', () => {
  assert.equal(variantForOption(variants, variants[0], 'Cuir du dos', 'Brun').id, '3');
  assert.equal(variantForOption(variants, variants[0], 'Piètement', 'Noir').id, '2');
});

test('a missing combination leads to the closest variant, available first', () => {
  // Gris/Alu/Brun → Rouge : Rouge n'existe qu'en Noir ; Rouge/Noir/Brun est indisponible mais garde le cuir.
  assert.equal(variantForOption(variants, variants[2], 'Couleur', 'Rouge').id, '5');
  // Gris/Alu/Noir → Rouge : Rouge/Noir/Noir garde le cuir et reste disponible.
  assert.equal(variantForOption(variants, variants[0], 'Couleur', 'Rouge').id, '4');
  assert.equal(variantForOption(variants, variants[0], 'Couleur', 'Bleu').id, '6');
});

test('the product page shows one labelled button per option with the current value', () => {
  const p = { name: 'Grand Relax', brand: 'Vitra', variants, image: variants[0].image, images: [variants[0].image], variantId: '1', price: 100 };
  const { html } = pdpView(p, { requestedVariant: '3', selectInitialVariant });
  const buttons = html.match(/data-vard-open data-axis="\d"/g) || [];
  assert.equal(buttons.length, 3);
  for (const name of ['Couleur', 'Piètement', 'Cuir du dos']) assert.match(html, new RegExp(`<span class="label" id="pdp-axis-\\d">${name}</span>`));
  assert.match(html, /data-axis-value="0">Gris</);
  assert.match(html, /data-axis-value="1">Alu</);
  assert.match(html, /data-axis-value="2">Brun</);
  assert.equal((html.match(/data-coloris-img/g) || []).length, 1);
});

test('a single-option product keeps its single variant button', () => {
  const single = [1, 2, 3].map(i => ({ id: String(i), title: `C${i}`, price: 10, available: true, options: [{ name: 'Couleur', value: `C${i}` }] }));
  const { html } = pdpView({ name: 'Chaise', variants: single, images: [], variantId: '1', price: 10 }, { selectInitialVariant });
  assert.equal((html.match(/data-vard-open/g) || []).length, 1);
  assert.doesNotMatch(html, /data-axis=/);
  assert.match(html, /Coloris/);
});
