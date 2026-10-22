const { test } = require('node:test');
const assert = require('node:assert/strict');
// Accueil et catalogue mélangés (Cyril, 22 octobre 2026) : du mobilier, pas seulement de petits objets.
const { rotateSelection } = require('../lib/home-rails');
const { filterScope } = require('../lib/filter-scopes');
const selection = require('../data/recommandations-accueil.json');

test('Nos recommandations : sélection choisie, 4 par jour, décalée de 2 chaque jour', () => {
  const h = ['m1', 'o1', 'm2', 'o2', 'm3', 'o3'];
  assert.deepEqual(rotateSelection(h, 0).slice(0, 4), ['m1', 'o1', 'm2', 'o2']);
  assert.deepEqual(rotateSelection(h, 1).slice(0, 4), ['m2', 'o2', 'm3', 'o3']);
  assert.deepEqual(rotateSelection(h, 3).slice(0, 4), ['m1', 'o1', 'm2', 'o2']);
  assert.ok(selection.handles.length >= 4 && selection.handles.length % 2 === 0, 'liste paire : 2 meubles + 2 objets chaque jour');
  assert.equal(new Set(selection.handles).size, selection.handles.length, 'sans doublon');
});

test('catalogue : familles en alternance ; sous-catégorie : jamais « Tout le catalogue »', () => {
  assert.equal(filterScope('catalogue')?.order ?? require('../lib/filter-scopes').CATALOGUE.order, 'families');
  assert.equal(filterScope('fauteuils').heading, 'Notre sélection de fauteuils');
  assert.equal(filterScope('salle-de-bain').heading, 'Notre sélection pour la salle de bain');
  for (const h of require('../lib/filter-scopes').filterScopeHandles()) {
    const s = filterScope(h);
    if (s && s.kind !== 'catalogue') assert.notEqual(s.heading, 'Tout le catalogue', h);
  }
});
