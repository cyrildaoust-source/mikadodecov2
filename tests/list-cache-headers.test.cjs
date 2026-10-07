const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

// ADR 0001 : les pages de listes et leur API de pagination sont cachables à l'edge.
// Le rendu des listes (sendScopeCatalog) est trop intégré (index, Shopify, gabarits) pour
// être joué de bout en bout ici : on fige la politique dans la source, comme les autres
// tests de contrat du dépôt (surtitres, recommandations).
const pages = readFileSync(join(__dirname, '..', 'lib', 'render', 'pages.js'), 'utf8');
const api = readFileSync(join(__dirname, '..', 'routes', 'api.js'), 'utf8');

test('sendScopeCatalog : page de liste 2 min + SWR 24 h, page filtrée 1 min + SWR 1 h, erreur en no-store', () => {
  const start = pages.indexOf("if(isFilteredState(data.state) || !data.total)");
  const success = pages.slice(start, pages.indexOf("res.set('Content-Type', 'text/html; charset=utf-8');", start));
  assert.match(success, /isFilteredState\(data\.state\)\s*\?\s*'public, s-maxage=60, stale-while-revalidate=3600'\s*:\s*'public, s-maxage=120, stale-while-revalidate=86400'/);
  assert.doesNotMatch(success, /'no-store'/);   // (le commentaire du bloc cite no-store : on ne cherche que le littéral)
  assert.match(pages, /res\.status\(503\)\.set\(\{'Cache-Control':'no-store','Retry-After':'60'\}\)/);
});

test('la page de recherche ?q= reste en no-store (résultats personnels à la saisie)', () => {
  const search = pages.slice(pages.indexOf('async function sendSearchPage'), pages.indexOf('sendSearchPage') + 2000);
  assert.match(search, /res\.set\('Cache-Control','no-store'\)\.send\(injectChrome\(html,'produits\.html',true\)\)/);
});

test('/api/catalog/:handle suit la même politique courte que les pages filtrées', () => {
  const route = api.slice(api.indexOf("router.get('/api/catalog/:handle'"), api.indexOf('// ─── API: GET PRODUCTS'));
  assert.match(route, /'public, s-maxage=60, stale-while-revalidate=600'/);
  assert.doesNotMatch(route, /'no-store'\)\.json\(await getScopePage/);
});
