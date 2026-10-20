// Opération de Noël (ADR 0016) : fenêtre de saison, repère « Livré avant Noël » article par article,
// fenêtre d'échange. L'horloge MIKADO_CLOCK remplace Date.now() pour ces tests.
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const christmas = require('../lib/christmas');
const { leadTimeFor, IN_STOCK_RANGE } = require('../lib/lead-time');

const clock = (iso) => { process.env.MIKADO_CLOCK = iso; };
afterEach(() => { delete process.env.MIKADO_CLOCK; });
const ONE_WEEK = { onRequest: false, range: [1, 1], unit: 'semaines' };
const DAYS = (n) => ({ onRequest: false, range: [n, n], unit: 'jours ouvrés' });

test('campaigns.json : bloc noel valide, dates cohérentes, fenêtre avant Noël', () => {
  const raw = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'campaigns.json'), 'utf8')).noel;
  const c = christmas.parseConfig(raw);
  assert.equal(c.enabled, true);
  assert.ok(c.startsAt < c.endsAt && c.endsAt <= c.deliveryBy, 'la saison se termine au plus tard le jour de livraison');
  assert.equal(c.deliveryByLabel, '24 décembre');
  assert.equal(c.deliveryBadge, false, 'repère « Livré avant Noël » éteint (Cyril, 13 octobre 2026)');
  assert.equal(new Date(c.startsAt).toISOString(), '2026-10-18T22:00:00.000Z', 'lancement le lundi 19 octobre 2026');
  assert.deepEqual([c.exchange.fromLabel, c.exchange.untilLabel], ['15 novembre', '31 janvier']);
  assert.throws(() => christmas.parseConfig({ ...raw, deliveryBy: '24/12/2026' }), /YYYY-MM-DD/);
  assert.throws(() => christmas.parseConfig({ ...raw, endsAt: raw.startsAt }), /endsAt/);
  assert.throws(() => christmas.parseConfig(null), /absent/);
});

test('hors fenêtre : rien (ni repère, ni état de fiche)', () => {
  clock('2026-10-10T10:00:00+02:00');
  assert.equal(christmas.active(), false);
  assert.equal(christmas.deliverable(null), false, 'même un article en stock n’affiche rien avant la saison');
  assert.equal(christmas.flagsFor(ONE_WEEK), null);
  clock('2026-10-19T09:00:00+02:00');
  assert.equal(christmas.active(), true, 'lancement le 19 octobre au matin');
  clock('2026-12-24T19:00:00+01:00');
  assert.equal(christmas.active(), false, 'la saison s’éteint le 24 décembre à la fermeture');
});

test('« Livré avant Noël » suit le délai haut de l’article plus la marge, article par article', () => {
  clock('2026-12-10T10:00:00+01:00');
  assert.equal(christmas.deliverable(null), true, `en stock : ${IN_STOCK_RANGE[1]} jours + 2 de marge → le 15`);
  assert.equal(christmas.deliverable(DAYS(7)), true, '7 jours ouvrés depuis le jeudi 10 → lundi 21, + 2 → 23');
  assert.equal(christmas.deliverable(DAYS(8)), true, '8 jours ouvrés → mardi 22, + 2 → le 24, dernier jour');
  assert.equal(christmas.deliverable(DAYS(9)), false, '9 jours ouvrés → mercredi 23, + 2 → le 25 : trop tard');
  assert.equal(christmas.deliverable(ONE_WEEK), true, '1 semaine → 17, + 2 → 19');
  assert.equal(christmas.deliverable({ onRequest: true, label: 'délai sur demande' }), false, 'délai inconnu : jamais de promesse');
  clock('2026-12-19T10:00:00+01:00');
  assert.equal(christmas.deliverable(null), true, 'dernier jour pour le stock : 19 + 3 + 2 = 24');
  clock('2026-12-20T10:00:00+01:00');
  assert.equal(christmas.deliverable(null), false, 'le 20, le stock ne promet plus rien');
  assert.equal(christmas.deliverable(DAYS(2)), true, 'dimanche 20 + 2 jours ouvrés → mardi 22, + 2 → le 24');
  assert.equal(christmas.deliverable(DAYS(3)), false, '3 jours ouvrés → mercredi 23, + 2 → le 25');
});

test('le repère est éteint par la configuration ; avec l’interrupteur, les règles réelles des marques décident', () => {
  clock('2026-12-01T10:00:00+01:00');
  assert.equal(christmas.badgeActive(), false);
  assert.equal(christmas.flagsFor(leadTimeFor({ vendor: 'HAY' })), null, 'deliveryBadge: false → aucun repère, saison ou pas');
  const raw = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'campaigns.json'), 'utf8')).noel;
  const on = christmas.parseConfig({ ...raw, deliveryBadge: true });
  assert.deepEqual(christmas.flagsFor(leadTimeFor({ vendor: 'HAY' }), christmas.now(), on), { inStock: true, onOrder: true });        // 10–14 jours ouvrés → 19 déc.
  assert.deepEqual(christmas.flagsFor(leadTimeFor({ vendor: 'Vitra' }), christmas.now(), on), { inStock: true, onOrder: false });     // 3–4 semaines → 29 déc.
  clock('2026-11-20T10:00:00+01:00');
  assert.deepEqual(christmas.flagsFor(leadTimeFor({ vendor: 'Vitra' }), christmas.now(), on), { inStock: true, onOrder: true });      // 28 jours → 18 déc.
  assert.equal(christmas.flagsFor(leadTimeFor({ vendor: 'Vitra', tags: ['delai-long'] }), christmas.now(), on).onOrder, false);
  clock('2026-10-01T10:00:00+02:00');
  assert.equal(christmas.flagsFor(leadTimeFor({ vendor: 'HAY' }), christmas.now(), on), null, 'avant le lancement : rien, même interrupteur allumé');
});

test('fenêtre d’échange', () => {
  clock('2026-12-01T10:00:00+01:00');
  assert.equal(christmas.exchangeOpen(), true);
  clock('2027-01-15T10:00:00+01:00');
  assert.equal(christmas.active(), false);
  assert.equal(christmas.exchangeOpen(), true, 'mais l’échange court jusqu’au 31 janvier');
  clock('2027-02-02T10:00:00+01:00');
  assert.equal(christmas.exchangeOpen(), false);
});

test('MIKADO_CLOCK : une valeur invalide est ignorée', () => {
  clock('pas une date');
  assert.ok(Math.abs(christmas.now() - Date.now()) < 1000);
});
