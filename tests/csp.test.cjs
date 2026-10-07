const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');
const { cspHeader, addNonce, newNonce } = require('../lib/csp');

const ROOT = join(__dirname, '..');

// ── lib/csp.js ──────────────────────────────────────────────────────────────
test('cspHeader : nonce dans script-src, plus de unsafe-inline pour les scripts, styles inchangés', () => {
  const h = cspHeader('abc123');
  assert.match(h, /script-src 'self' https:\/\/unpkg\.com 'nonce-abc123'(;|$)/);
  assert.doesNotMatch(h.match(/script-src[^;]*/)[0], /unsafe-inline/);
  assert.match(h, /style-src 'self' 'unsafe-inline' https:\/\/use\.typekit\.net/);
  assert.match(h, /img-src [^;]*https:\/\/cdn\.shopify\.com/);
  assert.match(h, /object-src 'none'/);
  assert.doesNotMatch(cspHeader(null), /nonce-/);
});

test('addNonce : scripts inline exécutables seulement, idempotent', () => {
  const html = '<script>a()</script><script type="module">b()</script><script src="/x.js"></script>'
    + '<script type="application/ld+json">{}</script><script type="application/json" id="d">{}</script><script nonce="deja">c()</script>';
  const out = addNonce(html, 'N');
  assert.equal(out, '<script nonce="N">a()</script><script nonce="N" type="module">b()</script><script src="/x.js"></script>'
    + '<script type="application/ld+json">{}</script><script type="application/json" id="d">{}</script><script nonce="deja">c()</script>');
  assert.equal(addNonce(out, 'N'), out);
  assert.notEqual(newNonce(), newNonce());
});

// ── Vrai serveur ────────────────────────────────────────────────────────────
let server, base;
before(async () => {
  process.env.SHOPIFY_STORE_DOMAIN = 'csp.test';
  process.env.SHOPIFY_STOREFRONT_TOKEN = 'test';
  server = require('../server').listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise((r) => server.close(r)); });

test('une page HTML porte la CSP avec son nonce, et chaque script inline exécutable porte ce nonce', async () => {
  for (const path of ['/contact.html', '/produit.html', '/page-inconnue-404']) {
    const res = await fetch(base + path, { headers: { accept: 'text/html' } });
    const csp = res.headers.get('content-security-policy');
    assert.ok(csp, `${path} : pas de CSP`);
    const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
    assert.ok(nonce, `${path} : pas de nonce dans la CSP`);
    assert.doesNotMatch(csp.match(/script-src[^;]*/)[0], /unsafe-inline/);
    const html = await res.text();
    const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g)].map((m) => m[1]).filter((a) => !/application\/(ld\+)?json/.test(a));
    assert.ok(inline.length > 0, `${path} : aucun script inline (le script d'en-tête au moins)`);
    for (const attrs of inline) assert.match(attrs, new RegExp(`nonce="${nonce.replace(/[+/=]/g, '\\$&')}"`), `${path} : script inline sans nonce → ${attrs}`);
    assert.doesNotMatch(html, / on(load|error|click)="/, `${path} : gestionnaire inline`);
    assert.match(html, /id="mikado-head"/);
  }
});

test('deux requêtes ont deux nonces différents', async () => {
  const [a, b] = await Promise.all([fetch(base + '/contact.html'), fetch(base + '/contact.html')]);
  const n = (r) => r.headers.get('content-security-policy').match(/'nonce-([^']+)'/)[1];
  assert.notEqual(n(a), n(b));
});

test('les réponses JSON ne reçoivent pas de CSP (inutile hors document)', async () => {
  const res = await fetch(base + '/api/build');
  assert.equal(res.headers.get('content-security-policy'), null);
});

// ── Sources ─────────────────────────────────────────────────────────────────
function files(dir, exts) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return ['images', 'fonts', 'node_modules'].includes(name) ? [] : files(p, exts);
    return exts.some((e) => name.endsWith(e)) ? [p] : [];
  });
}

test('aucun gestionnaire inline (onload/onerror/onclick…) ni javascript: dans les sources du front et les générateurs', () => {
  const offenders = [];
  for (const f of [...files(join(ROOT, 'v3'), ['.html', '.js', '.mjs']), ...files(join(ROOT, 'templates'), ['.html']), ...files(join(ROOT, 'scripts'), ['.mjs', '.js', '.cjs'])]) {
    const src = readFileSync(f, 'utf8');
    if (/ on(load|error|click|change|submit|input|mouseover)="/.test(src)) offenders.push(`${f} : gestionnaire inline`);
    if (/href="javascript:/.test(src)) offenders.push(`${f} : href javascript:`);
  }
  assert.deepEqual(offenders, []);
});

test('vercel.json ne pose plus de CSP globale (elle vient du serveur, avec nonce)', () => {
  assert.doesNotMatch(readFileSync(join(ROOT, 'vercel.json'), 'utf8'), /Content-Security-Policy/);
});
