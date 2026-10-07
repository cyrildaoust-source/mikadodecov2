const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');

// Les règles métier vivent dans data/, pas en dur dans le code : filtres catégorie,
// campagnes, textes de collection, fenêtres de promotion. Ces tests figent la forme
// des fichiers et vérifient qu'aucune clause Shopify ni date de promotion ne revient
// en dur dans lib/ ou routes/.
const ROOT = join(__dirname, '..');
const filters = JSON.parse(readFileSync(join(ROOT, 'data', 'category-filters.json'), 'utf8'));
const campaigns = JSON.parse(readFileSync(join(ROOT, 'data', 'campaigns.json'), 'utf8'));

function jsFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? jsFiles(p) : /\.(js|cjs|mjs)$/.test(name) ? [p] : [];
  });
}

test('category-filters.json : un handle → une clause Shopify, triés, sans doublon de sens', () => {
  const entries = Object.entries(filters.filters);
  assert.ok(entries.length >= 30, `seulement ${entries.length} catégories`);
  assert.deepEqual(Object.keys(filters.filters), [...Object.keys(filters.filters)].sort(), 'les handles doivent rester triés');
  for (const [handle, clause] of entries) {
    assert.match(handle, /^[a-z0-9-]+$/, `handle invalide : ${handle}`);
    assert.match(clause, /^\(.*\)$/, `${handle} : clause non parenthésée`);
    assert.match(clause, /(product_type|vendor|title):/, `${handle} : clause sans champ Shopify`);
  }
});

test('campaigns.json : collections de campagne, textes et fenêtres de promotion cohérents', () => {
  for (const [handle, c] of Object.entries(campaigns.collections)) {
    assert.match(handle, /^[a-z0-9-]+$/);
    for (const k of ['name', 'heroDescription', 'description', 'image', 'gridTitle']) assert.equal(typeof c[k], 'string', `${handle}.${k}`);
    assert.ok(Array.isArray(c.terms) && c.terms.length > 0, `${handle}.terms`);
  }
  for (const [handle, t] of Object.entries(campaigns.collectionTexts)) {
    for (const k of ['heroDescription', 'description', 'gridTitle']) assert.equal(typeof t[k], 'string', `${handle}.${k}`);
  }
  assert.ok(campaigns.promotions.length >= 1);
  for (const p of campaigns.promotions) {
    const a = Date.parse(p.startsAt), b = Date.parse(p.endsAt);
    assert.ok(Number.isFinite(a) && Number.isFinite(b), `${p.handle} : dates illisibles`);
    assert.ok(a < b, `${p.handle} : startsAt doit précéder endsAt`);
    assert.match(p.startsAt, /[+-]\d{2}:\d{2}$/, `${p.handle} : fuseau manquant sur startsAt`);
    assert.match(p.endsAt, /[+-]\d{2}:\d{2}$/, `${p.handle} : fuseau manquant sur endsAt`);
  }
});

test('lib/config.js dérive la campagne et la promotion de campaigns.json', () => {
  const config = require('../lib/config');
  assert.deepEqual(Object.keys(config.CAMPAIGN_COLLECTIONS), Object.keys(campaigns.collections));
  assert.deepEqual(config.COLLECTION_TEXTS, campaigns.collectionTexts);
  assert.equal(config.HOME_STORIES_PROMOTION.handle, campaigns.promotions[0].handle);
  assert.equal(config.HOME_STORIES_PROMOTION.startsAt, Date.parse(campaigns.promotions[0].startsAt));
  assert.equal(config.homeStoriesPromotionActive(config.HOME_STORIES_PROMOTION.startsAt), true);
  assert.equal(config.homeStoriesPromotionActive(config.HOME_STORIES_PROMOTION.endsAt), false);
  assert.equal(config.homeStoriesPromotionActive(config.HOME_STORIES_PROMOTION.startsAt - 1), false);
});

test('aucune clause de filtre Shopify ni date de promotion en dur dans lib/ et routes/', () => {
  const offenders = [];
  // Exception connue : lib/product-recommendations.js compose ses requêtes de « scène » (types
  // qui se servent ensemble) en dur ; c'est une règle du moteur de recommandation, couverte par ses
  // propres tests, candidate à data/ dans un lot ultérieur.
  const EXCEPTIONS = new Set([join(ROOT, 'lib', 'product-recommendations.js')]);
  for (const f of [...jsFiles(join(ROOT, 'lib')), ...jsFiles(join(ROOT, 'routes')), join(ROOT, 'app.js'), join(ROOT, 'server.js')].filter((f) => !EXCEPTIONS.has(f))) {
    const src = readFileSync(f, 'utf8');
    if (/product_type:"/.test(src)) offenders.push(`${f} : clause product_type:"…" en dur`);
    if (/Date\.parse\('20\d\d-/.test(src)) offenders.push(`${f} : date de campagne en dur`);
  }
  assert.deepEqual(offenders, []);
});
