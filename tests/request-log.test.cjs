const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { requestLogger, recordShopifyCall, currentTiming, serverTimingHeader } = require('../lib/request-log');

async function withApp(run) {
  const logs = [];
  const app = express();
  app.use(requestLogger({ log: (level, fields) => logs.push({ level, ...fields }) }));
  app.get('/api/deux-appels', async (req, res) => {
    await new Promise((r) => setTimeout(r, 5));          // la mesure survit à un await
    recordShopifyCall(12); recordShopifyCall(12.4);
    res.json({ calls: currentTiming().shopifyCalls });
  });
  app.get('/page', (req, res) => res.set('Server-Timing', 'cache;desc="HIT"').send('ok'));
  app.get('/styles.css', (req, res) => res.type('css').send('body{}'));
  app.get('/boum', () => { throw new Error('x'); });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  try { await run(`http://127.0.0.1:${server.address().port}`, logs); } finally { await new Promise((r) => server.close(r)); }
}

test('Server-Timing porte la durée totale et les appels Shopify de la requête', async () => {
  await withApp(async (base, logs) => {
    const res = await fetch(base + '/api/deux-appels');
    assert.deepEqual(await res.json(), { calls: 2 });
    const timing = res.headers.get('server-timing');
    assert.match(timing, /^total;dur=\d+(\.\d)?, shopify;dur=24\.4;desc="2 appel\(s\)"$/);
    await new Promise((r) => setTimeout(r, 10));
    assert.equal(logs.length, 1);
    assert.equal(logs[0].level, 'info');
    assert.equal(logs[0].msg, 'request');
    assert.equal(logs[0].path, '/api/deux-appels');
    assert.equal(logs[0].status, 200);
    assert.equal(logs[0].shopifyCalls, 2);
    assert.equal(logs[0].shopifyMs, 24);
    assert.ok(logs[0].ms >= 5);
  });
});

test('un Server-Timing déjà posé par la route est conservé et complété', async () => {
  await withApp(async (base) => {
    const res = await fetch(base + '/page');
    assert.match(res.headers.get('server-timing'), /^cache;desc="HIT", total;dur=/);
  });
});

test('les fichiers statiques ne sont pas journalisés ; un 500 l’est au niveau error', async () => {
  await withApp(async (base, logs) => {
    await fetch(base + '/styles.css');
    const res = await fetch(base + '/boum');
    assert.equal(res.status, 500);
    await new Promise((r) => setTimeout(r, 10));
    assert.deepEqual(logs.map((l) => [l.level, l.path]), [['error', '/boum']]);
  });
});

test('recordShopifyCall hors requête est un no-op ; serverTimingHeader formate', () => {
  assert.equal(currentTiming(), null);
  recordShopifyCall(99);                                   // rien à compter, rien ne casse
  assert.equal(serverTimingHeader({ shopifyCalls: 0, shopifyMs: 0 }, 3.14159), 'total;dur=3.1');
  assert.equal(serverTimingHeader({ shopifyCalls: 1, shopifyMs: 250 }, 400), 'total;dur=400.0, shopify;dur=250.0;desc="1 appel(s)"');
});
