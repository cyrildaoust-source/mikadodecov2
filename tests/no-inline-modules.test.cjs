const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync, existsSync } = require('node:fs');
const { join } = require('node:path');

// Phase 3.2 : le code des pages vit dans v3/pages/*.js, pas dans des <script type="module">
// inline de centaines de lignes (non cachés, non vérifiés par `npm run check`, et qui
// imposent 'unsafe-inline' dans la CSP). Un petit module inline (appel d'initShell…) reste
// toléré jusqu'à MAX_INLINE_LINES. Les scripts classiques anti-flash (quelques lignes,
// exécutés avant le premier rendu) ne sont pas concernés.
const ROOT = join(__dirname, '..');
const MAX_INLINE_LINES = 20;
const htmlFiles = [
  ...readdirSync(join(ROOT, 'v3')).filter((f) => f.endsWith('.html')).map((f) => join('v3', f)),
  ...readdirSync(join(ROOT, 'templates')).filter((f) => f.endsWith('.html')).map((f) => join('templates', f)),
];

test(`aucun <script type="module"> inline de plus de ${MAX_INLINE_LINES} lignes dans les pages`, () => {
  const offenders = [];
  for (const rel of htmlFiles) {
    const html = readFileSync(join(ROOT, rel), 'utf8');
    for (const m of html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)) {
      const lines = m[1].split('\n').length - 1;
      if (lines > MAX_INLINE_LINES) offenders.push(`${rel} : module inline de ${lines} lignes → v3/pages/`);
    }
  }
  assert.deepEqual(offenders, []);
});

test('chaque script de page référencé existe et importe les modules partagés par URL absolue', () => {
  for (const rel of htmlFiles) {
    const html = readFileSync(join(ROOT, rel), 'utf8');
    for (const m of html.matchAll(/<script type="module" src="(\/pages\/[^"]+)"><\/script>/g)) {
      const file = join(ROOT, 'v3', m[1]);
      assert.ok(existsSync(file), `${rel} référence ${m[1]} qui n'existe pas`);
      const src = readFileSync(file, 'utf8');
      for (const imp of src.matchAll(/from\s+"([^"]+)"/g)) assert.match(imp[1], /^\//, `${m[1]} : import relatif « ${imp[1]} » (la page et le script n'ont pas la même URL de base)`);
    }
  }
});

test('le rendu SSR du catalogue remplace bien le script de page, inline ou externe', () => {
  for (const file of ['chair-catalog-page.js', 'search-page.js']) {
    const src = readFileSync(join(ROOT, 'lib', file), 'utf8');
    assert.match(src, /<script type="module"\(\?: src="\\\/pages\\\/produits\\\.js"\)\?>/, `${file} : la regex doit accepter le script externe`);
  }
});
