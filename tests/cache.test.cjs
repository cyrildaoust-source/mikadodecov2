const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const cache = require('../lib/cache');

beforeEach(() => cache.clear());

test('cached sert la valeur tant qu’elle est fraîche, puis recharge', async () => {
  let calls = 0;
  const load = async () => ++calls;
  assert.equal(await cache.cached('k', load, 1000), 1);
  assert.equal(await cache.cached('k', load, 1000), 1);           // frais → pas de rechargement
  assert.equal(calls, 1);
  cache.setEntry('k', { data: 'vieux', expiry: Date.now() - 1 });  // expiré
  assert.equal(await cache.cached('k', load, 1000), 2);           // rechargé
  assert.equal(calls, 2);
});

test('peek rend l’entrée brute même expirée (sert au stale-while-revalidate maison)', () => {
  cache.setEntry('scope', { data: [1, 2], expiry: Date.now() - 5 });
  assert.deepEqual(cache.peek('scope').data, [1, 2]);
  assert.equal(cache.peek('absent'), undefined);
});

test('del et delByPrefix invalident de façon ciblée (webhook /api/revalidate)', () => {
  cache.setEntry('products', { data: 1, expiry: Infinity });
  cache.setEntry('catalog:index:a', { data: 1, expiry: Infinity });
  cache.setEntry('catalog:index:b', { data: 1, expiry: Infinity });
  cache.setEntry('menu', { data: 1, expiry: Infinity });
  assert.equal(cache.del('products'), true);
  assert.equal(cache.delByPrefix('catalog:index:'), 2);
  assert.equal(cache.size(), 1);
  assert.ok(cache.peek('menu'));
});

test('le cache est borné : au-delà de MAX_ENTRIES, la plus ancienne entrée part', () => {
  for (let i = 0; i < cache.MAX_ENTRIES + 25; i++) cache.setEntry('search:' + i, { data: i, expiry: Infinity });
  assert.equal(cache.size(), cache.MAX_ENTRIES);
  assert.equal(cache.peek('search:0'), undefined);                 // évincée
  assert.ok(cache.peek('search:' + (cache.MAX_ENTRIES + 24)));      // la plus récente est là
  assert.ok(cache.stats().evictions >= 25);
});

test('réécrire une clé la rend à nouveau récente (pas évincée en premier)', () => {
  cache.setEntry('a', { data: 1, expiry: Infinity });
  for (let i = 0; i < cache.MAX_ENTRIES - 1; i++) cache.setEntry('x' + i, { data: i, expiry: Infinity });
  cache.setEntry('a', { data: 2, expiry: Infinity });               // ré-insérée en fin
  cache.setEntry('y', { data: 0, expiry: Infinity });               // évince x0, pas a
  assert.equal(cache.peek('a').data, 2);
  assert.equal(cache.peek('x0'), undefined);
});
