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
import { appendFileSync, readFileSync } from 'node:fs';

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
// Un contrôle reçoit le corps et un contexte { path, res } ; il renvoie null (OK) ou un libellé de
// problème. Un libellé qui commence par « avis » n'est pas bloquant (conseil, pas défaut).
const has = (re, label) => (body) => (re.test(body) ? null : label);
// Balises de référencement d'une page HTML (exigence A1 du plan SEO) : title et description présents
// et de longueur raisonnable, canonical qui pointe sur la page elle-même (ou la cible indiquée),
// exactement un H1, les types JSON-LD attendus, et pas de noindex sauf si la page le veut.
const decode = (t) => t.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const seo = ({ canonical = 'self', ld = [], noindex = false } = {}) => (body, { path }) => {
  const head = (body.match(/<head>([\s\S]*?)<\/head>/i) || [, body])[1];
  const problems = [];
  const title = decode((head.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1]);
  if (!title) problems.push('pas de <title>'); else if (title.length > 70) problems.push(`avis : title de ${title.length} caractères (> 70)`);
  const desc = decode((head.match(/<meta name="description" content="([^"]*)"/i) || [, ''])[1]);
  if (!desc) problems.push('pas de meta description'); else if (desc.length < 50 || desc.length > 170) problems.push(`avis : description de ${desc.length} caractères (hors 50–170)`);
  const robots = decode((head.match(/<meta name="robots" content="([^"]*)"/i) || [, ''])[1]);
  if (/noindex/i.test(robots) !== noindex) problems.push(noindex ? 'devrait être noindex' : `noindex inattendu (${robots})`);
  const canon = decode((head.match(/<link rel="canonical" href="([^"]*)"/i) || [, ''])[1]).replace(/^https?:\/\/[^/]+/, '');
  if (noindex) { if (canon) problems.push('canonical sur une page noindex'); }
  else if (!canon) problems.push('pas de canonical');
  else if (canonical && canon !== (canonical === 'self' ? path : canonical)) problems.push(`canonical ${canon} ≠ ${canonical === 'self' ? path : canonical}`);
  const h1 = (body.match(/<h1[\s>]/gi) || []).length;
  if (h1 !== 1) problems.push(`${h1} <h1>`);
  const types = new Set();
  for (const m of head.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) { try { const j = JSON.parse(m[1]); for (const o of Array.isArray(j) ? j : [j]) types.add(o['@type']); } catch { problems.push('JSON-LD invalide'); } }
  for (const t of ld) if (!types.has(t)) problems.push(`JSON-LD ${t} absent`);
  return problems.length ? problems.join(' ; ') : null;
};
const h1 = has(/<h1[\s>]/i, 'pas de <h1>');
const chrome = has(/<header class="chrome/i, 'chrome (header) non rendu côté serveur');
const ldjson = has(/<script type="application\/ld\+json">/i, 'pas de JSON-LD');
const cards = has(/class="pcard"/, 'aucune carte produit rendue');
const noServerError = (body) => (/Erreur serveur|Internal Server Error|FUNCTION_INVOCATION_FAILED/i.test(body) ? 'page d\'erreur serveur' : null);

// ── Parcours vérifiés ───────────────────────────────────────────────────────
// `path` peut être une fonction async (résolu à l'exécution, ex. une vraie fiche produit).
// Table des redirections des anciennes fiches (ADR 0014), lue dans le dépôt : premier ancien handle
// qui correspond au critère, et contrôle que la réponse suivie atterrit sur la cible de la table.
const REDIRECTIONS = JSON.parse(readFileSync(new URL('../data/redirections.json', import.meta.url), 'utf8')).redirections;
const redirectSample = (pick) => () => {
  const e = REDIRECTIONS.find(pick);
  if (!e) throw new Error('aucune entrée de ce type dans data/redirections.json');
  return '/produit.html?handle=' + encodeURIComponent(e.from);
};
function landsOnRedirectTarget(body, { path, res }) {
  const from = decodeURIComponent(path.split('handle=')[1] || '');
  const e = REDIRECTIONS.find((x) => x.from === from);
  const target = e.to.startsWith('/') ? e.to : '/produit.html?handle=' + encodeURIComponent(e.to);
  const landed = new URL(res.url);
  return landed.pathname + landed.search === target ? null : `atterrit sur ${landed.pathname + landed.search} (attendu ${target})`;
}

const CHECKS = [
  { name: 'Accueil',               path: '/',                       kind: 'html', status: 200, checks: [h1, chrome, ldjson, noServerError, seo({ ld: ['WebSite'] })] },
  { name: 'Catalogue',             path: '/produits.html',          kind: 'html', status: 200, checks: [h1, chrome, cards, noServerError, seo({ ld: ['BreadcrumbList'] })] },
  { name: 'Page marque (Vitra)',    path: '/collections/vitra',      kind: 'html', status: 200, checks: [h1, chrome, cards, noServerError, seo({ ld: ['BreadcrumbList'] })] },
  { name: 'Catégorie (chaises)',    path: '/collections/chaises',    kind: 'html', status: 200, checks: [h1, chrome, cards, noServerError, seo({ ld: ['BreadcrumbList'] })] },
  { name: 'Famille (tables)',       path: '/collections/tables',     kind: 'html', status: 200, checks: [h1, chrome, noServerError, seo({ ld: ['BreadcrumbList'] })] },
  { name: 'Designers',             path: '/designers.html',         kind: 'html', status: 200, checks: [h1, chrome, noServerError, seo()] },
  { name: 'Journal',               path: '/journal.html',           kind: 'html', status: 200, checks: [h1, chrome, noServerError, seo()] },
  { name: 'Article du journal',    path: '/journal/fermob.html',    kind: 'html', status: 200, checks: [h1, chrome, noServerError, seo({ ld: ['Article', 'BreadcrumbList'] })] },
  { name: 'Fiche produit',         path: firstProductPath,          kind: 'html', status: 200, checks: [h1, chrome, ldjson, noServerError, seo({ ld: ['Product', 'BreadcrumbList'] })] },
  { name: 'Contact',               path: '/contact.html',           kind: 'html', status: 200, checks: [h1, chrome, has(/<form/i, 'pas de formulaire'), seo({ ld: ['FurnitureStore'] })] },
  { name: 'Mentions légales',      path: '/mentions-legales.html',  kind: 'html', status: 200, checks: [h1, chrome, seo({ ld: ['BreadcrumbList'] })] },
  { name: 'Sélection (noindex)',   path: '/selection.html',         kind: 'html', status: 200, checks: [h1, chrome, seo({ noindex: true })] },
  { name: 'Page inconnue → 404',   path: '/cette-page-n-existe-pas', kind: 'html', status: 404, checks: [chrome, has(/Page introuvable/, 'texte 404 absent')] },
  // Anciennes fiches (A9, ADR 0014) : premier ancien handle de chaque sorte dans data/redirections.json → arrive sur la cible de la table, ou 410.
  { name: 'Ancienne fiche → fiche actuelle', path: redirectSample((e) => e.status === 301 && !e.to.startsWith('/')), kind: 'html', status: 200, checks: [landsOnRedirectTarget, h1, chrome] },
  { name: 'Ancienne fiche → collection',     path: redirectSample((e) => e.status === 301 && e.to.startsWith('/')),  kind: 'html', status: 200, checks: [landsOnRedirectTarget, h1, chrome] },
  { name: 'Fiche retirée → 410',             path: redirectSample((e) => e.status === 410),                           kind: 'html', status: 410, checks: [chrome, has(/plus proposée/, 'texte 410 absent')] },
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
      for (const check of c.checks) { const problem = check(body, { path, res }); if (problem) notes.push(problem); }
      for (const [name, re] of Object.entries(c.headers || {})) { const v = res.headers.get(name) || ''; if (!re.test(v)) notes.push(`${name} : « ${v} » (attendu ${re})`); }
    }
    const slow = ttfb > SLOW_MS;
    if (slow) notes.push(`${STRICT_TIMING ? 'lent' : 'lent (alerte)'} : ${Math.round(ttfb)} ms > ${SLOW_MS} ms`);
    const ok = notes.filter((n) => !n.startsWith('lent (alerte)') && !n.startsWith('avis')).length === 0;
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
