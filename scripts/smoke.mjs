#!/usr/bin/env node
/**
 * Smoke test — Mikado Deco
 * ------------------------
 * Vérifie en quelques secondes qu'un déploiement (prod ou Preview) répond
 * correctement sur les parcours clés : code HTTP attendu, contenu minimal
 * (titre H1, chrome rendu côté serveur, JSON-LD, cartes produit…) et temps de
 * réponse. Zéro dépendance ; lisible dans un terminal et dans le résumé d'un
 * job GitHub Actions (GITHUB_STEP_SUMMARY).
 *
 * Usage :
 *   node scripts/smoke.mjs                       # prod (https://www.mikadodeco.be)
 *   node scripts/smoke.mjs --base https://mikadodecov2-git-ma-branche.vercel.app --bypass <secret>
 *   node scripts/smoke.mjs --slow 1000           # seuil d'alerte temps (ms, défaut 1500)
 *   node scripts/smoke.mjs --strict-timing       # un temps > seuil devient un ÉCHEC
 *
 * Variables d'environnement équivalentes : SMOKE_BASE, VERCEL_AUTOMATION_BYPASS_SECRET.
 * Les Previews Vercel sont protégées : sans secret de contournement, elles
 * répondent 401 et le script s'arrête avec un message clair.
 *
 * Code de sortie : 0 si tout passe, 1 dès qu'un contrôle échoue.
 */
import { appendFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : fallback; };
const BASE = (opt('--base', process.env.SMOKE_BASE || 'https://www.mikadodeco.be')).replace(/\/$/, '');
const BYPASS = opt('--bypass', process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '');
const SLOW_MS = parseInt(opt('--slow', '1500'), 10);
const STRICT_TIMING = args.includes('--strict-timing');
const TIMEOUT_MS = 30_000;

const ACCEPT = {
  html: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',   // le 404 sert du markdown aux agents sans text/html explicite
  json: 'application/json',
  xml: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
  text: 'text/plain,*/*;q=0.8',
};

async function get(path, kind) {
  const headers = { 'user-agent': 'mikado-smoke/1 (+https://github.com/cyrildaoust-source/mikadodecov2)', accept: ACCEPT[kind] || '*/*' };
  // En-tête seul : avec `x-vercel-set-bypass-cookie`, Vercel répond par une redirection vers la même
  // URL pour poser un cookie que fetch ne conserve pas → boucle de redirections (« fetch failed »).
  if (BYPASS) headers['x-vercel-protection-bypass'] = BYPASS;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const t0 = performance.now();
  try {
    const res = await fetch(BASE + path, { headers, redirect: 'follow', signal: ctrl.signal });
    const ttfb = performance.now() - t0;
    const body = await res.text();
    const total = performance.now() - t0;
    return { res, body, ttfb, total };
  } finally { clearTimeout(timer); }
}

// ── Contrôles de contenu réutilisables ───────────────────────────────────────
const has = (re, label) => (body) => (re.test(body) ? null : label);
const h1 = has(/<h1[\s>]/i, 'pas de <h1>');
const chrome = has(/<header class="chrome/i, 'chrome (header) non rendu côté serveur');
const ldjson = has(/<script type="application\/ld\+json">/i, 'pas de JSON-LD');
const cards = has(/class="pcard"/, 'aucune carte produit rendue');
const noServerError = (body) => (/Erreur serveur|Internal Server Error|FUNCTION_INVOCATION_FAILED/i.test(body) ? 'page d\'erreur serveur' : null);

// ── Parcours vérifiés ───────────────────────────────────────────────────────
// `path` peut être une fonction async (résolu à l'exécution, ex. une vraie fiche produit).
const CHECKS = [
  { name: 'Accueil',               path: '/',                       kind: 'html', status: 200, checks: [h1, chrome, ldjson, noServerError] },
  { name: 'Catalogue',             path: '/produits.html',          kind: 'html', status: 200, checks: [h1, chrome, cards, noServerError] },
  { name: 'Page marque (Vitra)',    path: '/collections/vitra',      kind: 'html', status: 200, checks: [h1, chrome, cards, noServerError] },
  { name: 'Catégorie (chaises)',    path: '/collections/chaises',    kind: 'html', status: 200, checks: [h1, chrome, cards, noServerError] },
  { name: 'Famille (tables)',       path: '/collections/tables',     kind: 'html', status: 200, checks: [h1, chrome, noServerError] },
  { name: 'Designers',             path: '/designers.html',         kind: 'html', status: 200, checks: [h1, chrome, noServerError] },
  { name: 'Journal',               path: '/journal.html',           kind: 'html', status: 200, checks: [h1, chrome, noServerError] },
  { name: 'Fiche produit',         path: firstProductPath,          kind: 'html', status: 200, checks: [h1, chrome, ldjson, noServerError] },
  { name: 'Contact',               path: '/contact.html',           kind: 'html', status: 200, checks: [h1, chrome, has(/<form/i, 'pas de formulaire')] },
  { name: 'Page inconnue → 404',   path: '/cette-page-n-existe-pas', kind: 'html', status: 404, checks: [chrome, has(/Page introuvable/, 'texte 404 absent')] },
  { name: 'Sitemap',               path: '/sitemap.xml',            kind: 'xml',  status: 200, checks: [has(/<(sitemapindex|urlset)/, 'ni sitemapindex ni urlset')] },
  { name: 'llms.txt',              path: '/llms.txt',               kind: 'text', status: 200, checks: [has(/Mikado/i, 'contenu inattendu')] },
  { name: 'robots.txt',            path: '/robots.txt',             kind: 'text', status: 200, checks: [has(/Sitemap:/i, 'pas de ligne Sitemap:')] },
  { name: 'API menu',              path: '/api/menu',               kind: 'json', status: 200, checks: [jsonWhere((d) => Array.isArray(d.items) && d.items.length > 0, 'items vide')] },
  { name: 'API marques',           path: '/api/brands',             kind: 'json', status: 200, checks: [jsonWhere((d) => Array.isArray(d) && d.length > 5, 'moins de 6 marques')] },
  { name: 'API produits (page 1)', path: '/api/products?paginated=1&limit=3', kind: 'json', status: 200, checks: [jsonWhere((d) => Array.isArray(d.items) && d.items.length === 3, 'items ≠ 3')] },
  // Assets hachés (ADR 0010) : l'accueil référence /assets/<nom>.<version>.(js|css), servis un an en immutable.
  { name: 'Script haché (immutable)', path: hashedAssetPath('js'),  kind: 'text', status: 200, headers: { 'cache-control': /immutable/ }, checks: [has(/\S/, 'vide')] },
  { name: 'CSS haché (immutable)',    path: hashedAssetPath('css'), kind: 'text', status: 200, headers: { 'cache-control': /immutable/ }, checks: [has(/\.chrome/, 'pas la feuille du site')] },
];

function jsonWhere(pred, label) {
  return (body) => { try { return pred(JSON.parse(body)) ? null : label; } catch { return 'JSON invalide'; } };
}

function hashedAssetPath(ext) {
  return async () => {
    const { res, body } = await get('/', 'html');
    if (!res.ok) throw new Error(`/ → ${res.status}`);
    const m = body.match(new RegExp(`["'](/assets/[A-Za-z0-9_./-]+\\.${ext})["']`));
    if (!m) throw new Error(`aucun /assets/*.${ext} dans l'accueil (assets hachés inactifs ?)`);
    return m[1];
  };
}

async function firstProductPath() {
  const { res, body } = await get('/api/products?paginated=1&limit=1', 'json');
  if (!res.ok) throw new Error(`/api/products → ${res.status}`);
  const handle = JSON.parse(body)?.items?.[0]?.handle;
  if (!handle) throw new Error('aucun produit dans /api/products');
  return '/produit.html?handle=' + encodeURIComponent(handle);
}

// ── Exécution ───────────────────────────────────────────────────────────────
const rows = [];
let failures = 0;
for (const c of CHECKS) {
  let path;
  try { path = typeof c.path === 'function' ? await c.path() : c.path; }
  catch (error) { failures++; rows.push({ name: c.name, path: '—', status: '—', ms: '—', ok: false, notes: [error.message] }); continue; }
  try {
    const { res, body, ttfb, total } = await get(path, c.kind);
    const notes = [];
    if (res.status === 401 && !BYPASS) { console.error(`\n✖ ${BASE} répond 401 : déploiement protégé. Passer --bypass <VERCEL_AUTOMATION_BYPASS_SECRET>.\n`); process.exit(1); }
    if (res.status !== c.status) notes.push(`HTTP ${res.status} (attendu ${c.status})`);
    else {
      for (const check of c.checks) { const problem = check(body); if (problem) notes.push(problem); }
      for (const [name, re] of Object.entries(c.headers || {})) { const v = res.headers.get(name) || ''; if (!re.test(v)) notes.push(`${name} : « ${v} » (attendu ${re})`); }
    }
    const slow = ttfb > SLOW_MS;
    if (slow) notes.push(`${STRICT_TIMING ? 'lent' : 'lent (alerte)'} : ${Math.round(ttfb)} ms > ${SLOW_MS} ms`);
    const ok = notes.filter((n) => !n.startsWith('lent (alerte)')).length === 0;
    if (!ok) failures++;
    rows.push({ name: c.name, path, status: res.status, ms: `${Math.round(ttfb)} / ${Math.round(total)}`, ok, notes, cache: res.headers.get('x-vercel-cache') || '' });
  } catch (error) {
    failures++;
    rows.push({ name: c.name, path, status: 'ERR', ms: '—', ok: false, notes: [error.name === 'AbortError' ? `aucune réponse en ${TIMEOUT_MS / 1000} s` : error.message] });
  }
}

// ── Rapport ─────────────────────────────────────────────────────────────────
const header = `| | Parcours | URL | HTTP | TTFB / total (ms) | Edge | Notes |\n|---|---|---|---|---|---|---|`;
const lines = rows.map((r) => `| ${r.ok ? '✅' : '❌'} | ${r.name} | \`${r.path}\` | ${r.status} | ${r.ms} | ${r.cache || ''} | ${r.notes.join(' · ')} |`);
const title = `## Smoke test · ${BASE} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;
const verdict = failures ? `**${failures} contrôle(s) en échec** sur ${rows.length}.` : `**${rows.length} / ${rows.length} contrôles OK.**`;
const report = [title, '', verdict, '', header, ...lines, ''].join('\n');
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n');
process.exit(failures ? 1 : 0);
