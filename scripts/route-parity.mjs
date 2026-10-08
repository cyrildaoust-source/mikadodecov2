#!/usr/bin/env node
/**
 * Parité de routage — Mikado Deco
 * -------------------------------
 * Compare, URL par URL, deux déploiements du site (par défaut : la prod et une Preview) :
 * code HTTP, redirection, type de contenu, politique de cache, et qui a répondu (le serveur
 * Express — en-tête Server-Timing — ou le statique). Sert à valider un changement de
 * configuration Vercel avant de le merger : toute différence est listée.
 *
 *   node scripts/route-parity.mjs --a https://www.mikadodeco.be --b https://xxx.vercel.app [--bypass <secret>]
 *   node scripts/route-parity.mjs --b https://xxx.vercel.app --only-diff
 *
 * Code de sortie 1 s'il y a au moins une différence sur une URL marquée stricte.
 */
const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : fallback; };
const A = (opt('--a', 'https://www.mikadodeco.be')).replace(/\/$/, '');
const B = (opt('--b', '')).replace(/\/$/, '');
const BYPASS = opt('--bypass', process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '');
const ONLY_DIFF = args.includes('--only-diff');
if (!B) { console.error('Indiquer --b <URL de la Preview>'); process.exit(2); }

// [chemin, aspects à comparer strictement] — tout est comparé, mais seuls les aspects listés font échouer.
const URLS = [
  ['/', ['status', 'who', 'type']],
  ['/produits.html', ['status', 'who', 'type']],
  ['/produits.html?designer=verner-panton', ['status', 'who']],
  ['/produits.html?q=chaise', ['status', 'who']],
  ['/produit.html?handle=verre-a-eau-animal-farm', ['status', 'who', 'type']],
  ['/produit.html', ['status', 'who']],
  ['/collections/vitra', ['status', 'who', 'type']],
  ['/collections/chaises', ['status', 'who']],
  ['/collections/tables', ['status', 'who']],
  ['/collections', ['status', 'location']],
  ['/products/verre-a-eau-animal-farm', ['status', 'location']],
  ['/marques.html', ['status', 'who', 'type']],
  ['/designers.html', ['status', 'who']],
  ['/studio.html', ['status', 'who']],
  ['/journal.html', ['status', 'who']],
  ['/journal/fermob.html', ['status', 'who', 'type']],
  ['/contact.html', ['status', 'who']],
  ['/selection.html', ['status', 'who']],
  ['/nuancier-fermob.html', ['status', 'who']],
  ['/mentions-legales.html', ['status', 'who']],
  ['/404.html', ['status', 'who']],
  ['/about', ['status', 'who']],
  ['/privacy', ['status', 'who']],
  ['/sitemap.xml', ['status', 'who', 'type']],
  ['/sitemap-pages.xml', ['status', 'who']],
  ['/sitemap-products.xml', ['status', 'who']],
  ['/index-catalogue/membres.json', ['status']],
  ['/api/menu', ['status', 'who', 'type']],
  ['/api/health', ['status', 'who']],
  ['/api/build', ['status', 'who']],
  ['/api/inexistant', ['status']],
  ['/article.html?slug=fermob', ['status', 'location']],
  ['/article.html', ['status']],
  ['/nos-produits', ['status', 'location']],
  ['/nos-produits/truc', ['status', 'location']],
  ['/passez-commande', ['status', 'location']],
  ['/nos-marques', ['status', 'location']],
  ['/nos-marques/vitra', ['status', 'location']],
  ['/nos-marques/ichendorf', ['status', 'location']],
  ['/nos-marques/autre', ['status', 'location']],
  ['/prendre-rendez-vous', ['status', 'location']],
  ['/contact', ['status', 'location']],
  ['/v3/contact.html', ['status', 'location']],
  ['/v3', ['status', 'location']],
  ['/vitra-home-stories-for-winter', ['status', 'location']],
  ['/styles.css', ['status', 'who', 'type', 'cache']],
  ['/shared.js', ['status', 'who', 'type']],
  ['/pages/produits.js', ['status', 'who', 'type']],
  ['/product-card.mjs', ['status', 'who', 'type']],
  ['/mega-menu-brands.json', ['status', 'who', 'type']],
  ['/designers-data.json', ['status', 'who']],
  ['/logomikado.svg', ['status', 'who', 'cache']],
  ['/fonts/cormorant-garamond-latin-600-normal.woff2', ['status', 'who', 'cache']],
  ['/images/og-default.jpg', ['status', 'who', 'cache']],
  ['/favicon.ico', ['status', 'who']],
  ['/robots.txt', ['status', 'who', 'type']],
  ['/llms.txt', ['status', 'who']],
  ['/MIKADO_IDENTITY.md', ['status']],
  ['/server.js', ['status']],
  ['/package.json', ['status']],
  ['/.env', ['status']],
  ['/lib/config.js', ['status']],
  ['/page-qui-n-existe-pas', ['status', 'who']],
  ['/studio', ['status']],
  ['/dossier/inconnu/', ['status']],
];

async function probe(base, path) {
  const headers = { 'user-agent': 'mikado-parity/1', accept: 'text/html,application/json;q=0.9,*/*;q=0.8' };
  if (BYPASS && base !== A) headers['x-vercel-protection-bypass'] = BYPASS;
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 45_000);
  try {
    const res = await fetch(base + path, { headers, redirect: 'manual', signal: ctrl.signal });
    await res.arrayBuffer();
    const loc = res.headers.get('location') || '';
    return {
      status: res.status,
      location: loc.replace(base, '').replace(A, '').replace(B, ''),
      type: (res.headers.get('content-type') || '').split(';')[0],
      cache: res.headers.get('cache-control') || '',
      who: res.headers.get('server-timing') ? 'serveur' : (res.status >= 300 && res.status < 400 && !res.headers.get('server-timing') ? 'edge' : 'statique'),
    };
  } catch (e) { return { status: 'ERR', location: '', type: '', cache: '', who: e.name === 'AbortError' ? 'timeout' : 'erreur' }; }
  finally { clearTimeout(timer); }
}

let failures = 0; const rows = [];
for (const [path, strict] of URLS) {
  const [a, b] = await Promise.all([probe(A, path), probe(B, path)]);
  const diffs = [];
  for (const k of ['status', 'location', 'type', 'cache', 'who']) if (String(a[k]) !== String(b[k])) diffs.push(`${k}: ${a[k] || '∅'} → ${b[k] || '∅'}`);
  const strictFail = diffs.some((d) => strict.includes(d.split(':')[0]));
  if (strictFail) failures++;
  if (!ONLY_DIFF || diffs.length) rows.push(`${strictFail ? '❌' : diffs.length ? '⚠️ ' : '✅'} ${path.padEnd(52)} ${String(a.status).padStart(3)} ${a.who.padEnd(8)} | ${String(b.status).padStart(3)} ${b.who.padEnd(8)} ${diffs.join(' · ')}`);
}
console.log(`Parité ${A} (A) → ${B} (B) — ${URLS.length} URL, ${failures} différence(s) bloquante(s)\n`);
console.log('   URL'.padEnd(56) + ' A            | B');
console.log(rows.join('\n'));
process.exit(failures ? 1 : 0);
