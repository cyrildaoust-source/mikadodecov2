const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ON_REQUEST, defaultLabel, label, leadTimeFor, longest, parse } = require('../lib/lead-time');

// Délais sur commande (ADR 0015) : une table de règles par marque, appliquée automatiquement.
test('la table est chargée : défaut 3–4 semaines, libellés en tiret demi-cadratin', () => {
  assert.equal(defaultLabel(), '3–4 semaines');
  assert.equal(label([2, 3]), '2–3 semaines');
  assert.equal(label([6, 6]), '6 semaines');
  assert.equal(label([1, 1]), '1 semaine');
  assert.equal(label([10, 10], 'jours'), '10 jours');
});

test('le métachamp custom.lead_time est une exception : texte libre compris, sinon ignoré', () => {
  assert.deepEqual(parse('2-3 semaines'), { range: [2, 3], unit: 'semaines' });
  assert.deepEqual(parse('6 semaines'), { range: [6, 6], unit: 'semaines' });
  assert.deepEqual(parse('10 jours'), { range: [10, 10], unit: 'jours' });
  assert.deepEqual(parse('2 à 3 mois'), { range: [8, 12], unit: 'semaines' });
  assert.deepEqual(parse('Sur demande'), { onRequest: true });
  assert.equal(parse('bientôt'), null);
  assert.equal(parse(''), null);
  assert.equal(leadTimeFor({ vendor: 'Vitra', leadTime: '8-10 semaines' }).label, '8–10 semaines');
  assert.equal(leadTimeFor({ vendor: 'Vitra', leadTime: 'sur demande' }).label, ON_REQUEST);
});

test('le tag delai-long donne « délai sur demande », quelle que soit la marque', () => {
  const lt = leadTimeFor({ vendor: 'Fermob', tags: ['exterieur', 'delai-long'] });
  assert.equal(lt.onRequest, true);
  assert.equal(lt.label, ON_REQUEST);
  assert.equal(lt.source, 'tag');
});

test('sans règle de marque, le défaut s’applique et la source le dit', () => {
  const lt = leadTimeFor({ vendor: 'Marque inconnue', collections: ['sieges', 'chaises'] });
  assert.deepEqual([lt.label, lt.source, lt.onRequest], ['3–4 semaines', 'default', false]);
});

test('le plus long l’emporte pour un envoi groupé ; une demande prime sur tout', () => {
  const a = { onRequest: false, range: [2, 3], unit: 'semaines', label: '2–3 semaines' };
  const b = { onRequest: false, range: [8, 10], unit: 'semaines', label: '8–10 semaines' };
  const d = { onRequest: false, range: [10, 10], unit: 'jours', label: '10 jours' };
  assert.equal(longest([a, d]).label, '2–3 semaines');
  assert.equal(longest([a, b, d]).label, '8–10 semaines');
  assert.equal(longest([a, { onRequest: true, label: ON_REQUEST }, b]).label, ON_REQUEST);
  assert.equal(longest([]), null);
  assert.equal(longest([null, a]).label, '2–3 semaines');
});
