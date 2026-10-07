const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createErrorHandler, installAsyncErrorForwarding, statusOf, wantsJson } = require('../lib/http-errors');

// Petite application de test : les mêmes briques que server.js (patch async +
// gestionnaire final), avec des routes qui échouent de toutes les façons possibles.
async function withApp(run, { renderHtml } = {}) {
  installAsyncErrorForwarding();
  const logs = [];
  const app = express();
  app.use(express.json());
  app.get('/api/sync', () => { throw new Error('boum sync'); });
  app.get('/api/async', async () => { await Promise.resolve(); throw new Error('boum async'); });
  app.get('/api/status', () => { const e = new Error('interdit'); e.status = 403; throw e; });
  app.get('/page', async () => { throw new Error('page cassée'); });
  app.get('/ok', (req, res) => res.json({ ok: true }));
  app.post('/api/json', (req, res) => res.json(req.body));
  app.use(createErrorHandler({ renderHtml: renderHtml ?? ((status) => `<html><body><h1>Erreur ${status}</h1></body></html>`), log: (level, fields) => logs.push({ level, ...fields }) }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await run(base, logs); } finally { await new Promise((r) => server.close(r)); }
}

test('une promesse rejetée dans un handler async arrive au gestionnaire (JSON 500, message interne masqué)', async () => {
  await withApp(async (base, logs) => {
    const res = await fetch(base + '/api/async');
    assert.equal(res.status, 500);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await res.json(), { error: 'server_error' });
    assert.equal(logs.length, 1);
    assert.equal(logs[0].level, 'error');
    assert.equal(logs[0].msg, 'boum async');
    assert.equal(logs[0].path, '/api/async');
    assert.match(logs[0].stack, /boum async/);
  });
});

test('un throw synchrone est traité de la même façon', async () => {
  await withApp(async (base) => {
    const res = await fetch(base + '/api/sync');
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { error: 'server_error' });
  });
});

test('err.status légitime est respecté et journalisé en warn, sans pile', async () => {
  await withApp(async (base, logs) => {
    const res = await fetch(base + '/api/status');
    assert.equal(res.status, 403);
    assert.deepEqual(await res.json(), { error: 'forbidden' });
    assert.equal(logs[0].level, 'warn');
    assert.equal(logs[0].stack, undefined);
  });
});

test('une page HTML reçoit la page 500 rendue par renderHtml', async () => {
  await withApp(async (base) => {
    const res = await fetch(base + '/page', { headers: { accept: 'text/html' } });
    assert.equal(res.status, 500);
    assert.match(res.headers.get('content-type'), /text\/html/);
    assert.match(await res.text(), /<h1>Erreur 500<\/h1>/);
  });
});

test('si renderHtml échoue, le client reçoit un texte brut, jamais une page Vercel', async () => {
  await withApp(async (base) => {
    const res = await fetch(base + '/page', { headers: { accept: 'text/html' } });
    assert.equal(res.status, 500);
    assert.match(res.headers.get('content-type'), /text\/plain/);
    assert.match(await res.text(), /Une erreur est survenue/);
  }, { renderHtml: () => { throw new Error('template absent'); } });
});

test('un corps JSON invalide donne un 400 bad_request (erreur d’express.json)', async () => {
  await withApp(async (base) => {
    const res = await fetch(base + '/api/json', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{oups' });
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: 'bad_request' });
  });
});

test('les routes saines ne sont pas affectées par le patch', async () => {
  await withApp(async (base) => {
    const res = await fetch(base + '/ok');
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
  });
});

test('statusOf et wantsJson', () => {
  assert.equal(statusOf(new Error('x')), 500);
  assert.equal(statusOf({ status: 404 }), 404);
  assert.equal(statusOf({ statusCode: 413 }), 413);
  assert.equal(statusOf({ status: 200 }), 500);
  assert.equal(statusOf({ status: 'abc' }), 500);
  assert.equal(wantsJson({ path: '/api/menu', headers: {} }), true);
  assert.equal(wantsJson({ path: '/produits.html', headers: { accept: 'text/html' } }), false);
  assert.equal(wantsJson({ path: '/x', headers: { accept: 'application/json' } }), true);
  assert.equal(wantsJson({ path: '/x', headers: {} }), false);
});
