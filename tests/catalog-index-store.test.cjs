const { test } = require('node:test');
const assert = require('node:assert/strict');
const { writeIndex, readIndex, readMeta, blobConfigured, PREFIX, partNames } = require('../lib/services/catalog-index-store');

// Faux Blob : put mémorise, list retrouve, fetch relit — sans réseau ni token.
function fakeBlob() {
  const files = new Map();
  const put = async (pathname, body, options) => { files.set(pathname, { body: String(body), options }); return { url: 'https://blob.test/' + pathname, pathname }; };
  const list = async ({ prefix }) => ({ blobs: [...files.keys()].filter((p) => p.startsWith(prefix)).map((p) => ({ pathname: p, url: 'https://blob.test/' + p })) });
  const fetch = async (url) => { const f = files.get(url.replace('https://blob.test/', '')); return f ? { ok: true, status: 200, text: async () => f.body, json: async () => JSON.parse(f.body) } : { ok: false, status: 404 }; };
  return { files, put, list, fetch };
}

test('writeIndex écrit membres, chaque partie et meta.json, publics, réécrivables, cache 60 s', async () => {
  const b = fakeBlob();
  const meta = await writeIndex({ membres: '{"m":1}', parts: ['{"p":0}', '{"p":1}'] }, { builtAt: 123, count: 2 }, { put: b.put });
  assert.deepEqual([...b.files.keys()].sort(), [`${PREFIX}0.json`, `${PREFIX}1.json`, `${PREFIX}membres.json`, `${PREFIX}meta.json`]);
  for (const { options } of b.files.values()) assert.deepEqual([options.access, options.addRandomSuffix, options.allowOverwrite, options.cacheControlMaxAge], ['public', false, true, 60]);
  assert.equal(meta.version, 1); assert.equal(meta.parts, 2); assert.equal(meta.count, 2);
  assert.equal(meta.urls.membres, `https://blob.test/${PREFIX}membres.json`);
  assert.deepEqual(partNames(2), ['membres', '0', '1']);
});

test('readIndex relit meta puis les parties et déballe dans l’ordre ; null sans index', async () => {
  const b = fakeBlob();
  assert.equal(await readIndex({ unpack: () => 'jamais', list: b.list, fetch: b.fetch }), null);
  assert.equal(await readMeta({ list: b.list, fetch: b.fetch }), null);
  await writeIndex({ membres: 'M', parts: ['A', 'B', 'C'] }, { builtAt: 7, count: 3 }, { put: b.put });
  const got = await readIndex({ unpack: (m, parts) => ({ m, parts }), list: b.list, fetch: b.fetch });
  assert.deepEqual(got.index, { m: 'M', parts: ['A', 'B', 'C'] });
  assert.equal(got.meta.builtAt, 7);
});

test('un meta corrompu ou une partie manquante lève une erreur explicite (le repli prend alors le relais)', async () => {
  const b = fakeBlob();
  await b.put(`${PREFIX}meta.json`, JSON.stringify({ version: 2 }), {});
  await assert.rejects(() => readMeta({ list: b.list, fetch: b.fetch }), /meta invalide/);
  await b.put(`${PREFIX}meta.json`, JSON.stringify({ version: 1, parts: 1, urls: { membres: 'https://blob.test/x' } }), {});
  await assert.rejects(() => readIndex({ unpack: () => {}, list: b.list, fetch: b.fetch }), /partie 0 absente/);
});

test('blobConfigured dépend uniquement du token', () => {
  assert.equal(blobConfigured({}), false);
  assert.equal(blobConfigured({ BLOB_READ_WRITE_TOKEN: 'x' }), true);
});
