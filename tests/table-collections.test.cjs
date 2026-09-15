const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isOutdoor, isTable, tablePage } = require('../lib/table-collections');

const table = (id, outdoor = false, collections = ['tables']) => ({ id, handle: 'table-' + id, productType: 'table', tags: outdoor ? ['exterieur'] : [], collections });
function source(collections, size = 3) {
  return async (handle, first, after) => {
    const all = collections[handle] || [];
    const start = after ? Number(after) : 0;
    const end = Math.min(start + Math.min(first, size), all.length);
    return { collection: { handle, title: handle }, edges: all.slice(start, end).map((product, i) => ({ product, cursor: String(start + i + 1) })), pageInfo: { hasNextPage: end < all.length, endCursor: String(end) } };
  };
}

test('indoor pages fill through outdoor batches and never skip or repeat an eligible table', async () => {
  const all = Array.from({ length: 28 }, (_, i) => table(i, i < 8 || i % 3 === 0));
  const expected = all.filter(product => !isOutdoor(product)).map(product => product.id);
  const actual = [];
  let after = null;
  do {
    const page = await tablePage({ handle: 'tables', first: 4, after }, source({ tables: all }));
    actual.push(...page.items.map(product => product.id));
    if (page.pageInfo.hasNextPage) assert.equal(page.items.length, 4);
    assert.notEqual(page.pageInfo.endCursor, after || 'initial');
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  assert.deepEqual(actual, expected);
});

test('outdoor includes missing garden tables, preserves existing entries and excludes chairs and duplicates', async () => {
  const shared = table(1, true, ['tables', 'tables-outdoor']);
  const fetchChunk = source({ 'tables-outdoor': [shared, table(2, true, ['tables-outdoor']), { ...table(3, true), productType: 'tabouret' }], tables: [shared, table(4), table(5, true), table(6, true)] });
  const first = await tablePage({ handle: 'tables-outdoor', first: 2 }, fetchChunk);
  const last = await tablePage({ handle: 'tables-outdoor', first: 2, after: first.pageInfo.endCursor }, fetchChunk);
  assert.deepEqual([...first.items, ...last.items].map(product => product.id), [1, 2, 5, 6]);
  assert.equal(last.pageInfo.hasNextPage, false);
  assert.ok(last.items.every(product => product.collections.includes('tables-outdoor')), 'the PLP must keep the additional outdoor products');
});

test('garden membership and dual usage stay in outdoor; unrelated objects are never tables', () => {
  assert.equal(isOutdoor({ tags: ['interieur', 'exterieur'] }), true);
  assert.equal(isOutdoor({ collections: ['outdoor'] }), true);
  assert.equal(isOutdoor({ tags: ['interieur'] }), false);
  assert.equal(isTable({ productType: 'table basse' }), true);
  assert.equal(isTable({ productType: 'lampe de table' }), false);
  assert.equal(isTable({ productType: 'carafe', tags: ['table'] }), false);
});

test('empty results terminate and broken cursors or upstream failures do not return a partial success', async () => {
  const empty = await tablePage({ handle: 'tables', first: 4 }, source({ tables: [table(1, true), table(2, true)] }));
  assert.equal(empty.items.length, 0);
  assert.equal(empty.pageInfo.hasNextPage, false);
  await assert.rejects(tablePage({ handle: 'tables', first: 4 }, async () => { throw new Error('upstream unavailable'); }), /unavailable/);
  await assert.rejects(tablePage({ handle: 'tables', first: 4 }, async () => ({ collection: { handle: 'tables' }, edges: [{ product: table(1, true), cursor: 'stuck' }], pageInfo: { hasNextPage: true, endCursor: 'stuck' } })), /did not advance/);
  const page = await tablePage({ handle: 'tables', first: 1 }, source({ tables: [table(1), table(2)] }));
  await assert.rejects(tablePage({ handle: 'tables-outdoor', first: 1, after: page.pageInfo.endCursor }, source({})), /Invalid table cursor/);
});
