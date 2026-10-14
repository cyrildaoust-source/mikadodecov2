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

test('le métachamp custom.lead_time est une exception : délai marque → Mikado, marge ajoutée ; texte libre compris, sinon ignoré', () => {
  assert.deepEqual(parse('2-3 semaines'), { range: [2, 3], unit: 'semaines' });
  assert.deepEqual(parse('6 semaines'), { range: [6, 6], unit: 'semaines' });
  assert.deepEqual(parse('10 jours'), { range: [10, 10], unit: 'jours' });
  assert.deepEqual(parse('2 à 3 mois'), { range: [8, 12], unit: 'semaines' });
  assert.deepEqual(parse('Sur demande'), { onRequest: true });
  assert.equal(parse('bientôt'), null);
  assert.equal(parse(''), null);
  assert.equal(leadTimeFor({ vendor: 'Vitra', leadTime: '8-10 semaines' }).label, '9–11 semaines');            // + 1 semaine de marge (décision du 14 oct.)
  assert.equal(leadTimeFor({ vendor: 'HKliving', tags: ['delai-long'], leadTime: '6-10 semaines' }).label, '7–11 semaines'); // le métachamp prime sur delai-long
  assert.equal(leadTimeFor({ vendor: 'HKliving', leadTime: '4-7 semaines' }).label, '5–8 semaines');
  assert.equal(leadTimeFor({ vendor: 'HKliving', leadTime: '10 jours ouvrés' }).label, '13–14 jours ouvrés');   // + 3–4 jours ouvrés
  assert.equal(leadTimeFor({ vendor: 'HKliving', leadTime: '10 jours' }).label, '11–12 jours ouvrés');          // jours calendaires → 8 jours ouvrés + marge
  assert.equal(leadTimeFor({ vendor: 'HKliving', leadTime: '6-10 semaines' }).source, 'metafield');
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

// Table remplie avec les délais de Cyril (11 oct.) : délai marque → Mikado + marge, affiché en jours ouvrés quand c'est court.
test('une marque rapide s’affiche en jours ouvrés avec la marge Mikado (2–3 jours chez la marque → 5–7 jours ouvrés)', () => {
  assert.deepEqual([leadTimeFor({ vendor: 'Blomus' }).label, leadTimeFor({ vendor: 'Fatboy' }).label, leadTimeFor({ vendor: 'LIND DNA' }).label], ['5–7 jours ouvrés', '5–7 jours ouvrés', '5–7 jours ouvrés']);
  assert.equal(leadTimeFor({ vendor: 'HAY' }).label, '10–14 jours ouvrés');
  assert.equal(leadTimeFor({ vendor: 'hay' }).source, 'brand', 'nom de marque insensible à la casse');
});

test('au-delà de 15 jours ouvrés, le délai passe en semaines ; une marque en semaines prend une semaine de marge', () => {
  assert.equal(leadTimeFor({ vendor: 'Remember' }).label, '3–4 semaines');        // 10–15 jours + marge → 13–19 → 3–4 semaines
  assert.equal(leadTimeFor({ vendor: 'Pols Potten' }).label, '7–9 jours ouvrés');   // 4–5 jours (correction de Cyril du 11 oct.)
  assert.equal(leadTimeFor({ vendor: 'Vitra' }).label, '3–4 semaines');           // 2–3 semaines + 1
  assert.equal(leadTimeFor({ vendor: 'Fermob' }).label, '4–6 semaines');          // 3–5 semaines + 1
  assert.equal(leadTimeFor({ vendor: 'Kriptonite' }).label, '13–16 semaines');
});

test('une marque absente de la table prend le défaut, et la source le dit', () => {
  const lt = leadTimeFor({ vendor: 'Anglepoise' });
  assert.deepEqual([lt.label, lt.source], ['3–4 semaines', 'default']);
});

test('les jours ouvrés comptent dans l’envoi groupé', () => {
  const fast = leadTimeFor({ vendor: 'Blomus' }), slow = leadTimeFor({ vendor: 'Vitra' }), mid = leadTimeFor({ vendor: 'HAY' });
  assert.equal(longest([fast, mid]).label, '10–14 jours ouvrés');
  assert.equal(longest([fast, slow, mid]).label, '3–4 semaines');
});
