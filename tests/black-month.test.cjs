// Black Month (lib/black-month.js) : règles de prix de l'instance promotions (9 novembre 2026) et extinction automatique.
const test = require('node:test');
const assert = require('node:assert/strict');
const bm = require('../lib/black-month');
const at = iso => Date.parse(iso);

test('Black Month : visible du 9 au 28 novembre, éteint le 29 au matin, compte à rebours à Bruxelles', () => {
  assert.equal(bm.active(at('2026-11-08T23:59:00+01:00')), false);
  assert.equal(bm.active(at('2026-11-10T09:00:00+01:00')), true);
  assert.equal(bm.active(at('2026-11-28T23:30:00+01:00')), true);
  assert.equal(bm.active(at('2026-11-29T00:00:00+01:00')), false);
  assert.equal(bm.countdown(at('2026-11-10T09:00:00+01:00')), 'Plus que 19 jours');
  assert.equal(bm.countdown(at('2026-11-27T23:30:00+01:00')), 'Plus que 2 jours');
  assert.equal(bm.countdown(at('2026-11-28T08:00:00+01:00')), 'Dernier jour');
});

test('Black Month : prix remisé au centime dès 200 €, jamais seul en dessous ; pièces de la plus chère à la moins chère', () => {
  assert.deepEqual(bm.offerPrice(499), { price: 499, sale: 399.2, saving: 99.8 });
  assert.deepEqual(bm.offerPrice(200), { price: 200, sale: 160, saving: 40 });
  assert.deepEqual(bm.offerPrice(109), { price: 109, sale: null, saving: null });
  const product = (id, variants) => ({ card: { id, handle: 'p' + id, name: 'P' + id }, variants });
  const pieces = bm.offerPieces([
    product(1, [{ id: 'a', price: 300 }, { id: 'b', price: 900 }]),
    product(2, [{ id: 'c', price: 1500 }]),
    product(3, [{ id: 'd', price: 120 }]),
    product(4, [{ id: 'e', price: 5000 }]),
  ], new Set(['a', 'c', 'd']));
  assert.deepEqual(pieces.map(p => p.variant.id), ['c', 'a', 'd']);   // b et e ne sont pas remisées
  assert.equal(pieces[2].sale, null);
  assert.ok(bm.isOffer('Black Month : −20 % sur le mobilier en stock dès 200 €'));
  assert.ok(!bm.isOffer('Home Stories for Winter'));
});

test('Black Month : la lecture ne retient que les variantes en stock où Shopify applique la remise', async () => {
  const index = { products: [
    { card: { id: 'P1', handle: 'p1', name: 'P1' }, variants: [{ id: 'v1', price: 499, available: true, qty: 1 }, { id: 'v2', price: 499, available: true, qty: 0 }] },
    { card: { id: 'P2', handle: 'p2', name: 'P2' }, variants: [{ id: 'v3', price: 900, available: true, qty: 2 }] },
  ] };
  const probed = [];
  const offer = await bm.readOffer({
    collectionIds: async () => ['P1', 'P2'], getIndex: async () => index,
    probe: async id => { probed.push(id); return id === 'v1' ? 'Black Month : −20 %' : null; },
  });
  assert.deepEqual(probed.sort(), ['v1', 'v3']);
  assert.deepEqual(offer.pieces.map(p => p.variant.id), ['v1']);
});

test('Black Month : la lecture précalculée par le cron redonne les mêmes pièces que la lecture directe', async () => {
  const index = { products: [
    { card: { id: 'P1', handle: 'p1', name: 'P1' }, variants: [{ id: 'v1', price: 499, available: true, qty: 1 }] },
    { card: { id: 'P2', handle: 'p2', name: 'P2' }, variants: [{ id: 'v2', price: 1900, available: true, qty: 2 }] },
  ] };
  const live = await bm.readOffer({ collectionIds: async () => ['P1', 'P2'], getIndex: async () => index, probe: async () => 'Black Month' });
  const stored = bm.offerFromStored(JSON.parse(JSON.stringify({ productIds: live.productIds, eligible: [...live.eligible] })), index);
  assert.deepEqual(stored.pieces.map(p => [p.variant.id, p.sale]), live.pieces.map(p => [p.variant.id, p.sale]));
  assert.deepEqual(stored.pieces.map(p => p.variant.id), ['v2', 'v1']);
});

test('barre d’annonce : le code BLACK10 apparaît dès le 20 novembre, en clair, avec une version courte', () => {
  const clock = process.env.MIKADO_CLOCK;
  const render = () => { delete require.cache[require.resolve('../lib/render/black-month')]; return require('../lib/render/black-month').announceHTML(); };
  try {
    process.env.MIKADO_CLOCK = '2026-11-19T12:00:00+01:00';
    assert.doesNotMatch(render(), /BLACK10/);
    process.env.MIKADO_CLOCK = '2026-11-20T09:00:00+01:00';
    const html = render();
    assert.match(html, /<strong class="bm-code">BLACK10<\/strong>/);
    assert.match(html, /bm-long[^>]*><b>Black Month<\/b>&nbsp;: −10&nbsp;% dès 200&nbsp;€ d’achat avec le code/);
    assert.match(html, /bm-short[^>]*>−10&nbsp;% dès 200&nbsp;€ avec le code/);
    assert.doesNotMatch(html, /−20/);   // le −20 % se voit sur les prix (Cyril, 20 novembre 2026)
    assert.match(html, /jusqu’au 28\/11/);
    assert.doesNotMatch(html, /jusqu.à −/i);
  } finally { if (clock === undefined) delete process.env.MIKADO_CLOCK; else process.env.MIKADO_CLOCK = clock; }
});
