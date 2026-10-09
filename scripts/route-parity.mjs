#!/usr/bin/env node
/**
 * Parité de routage — Mikado Deco
 * -------------------------------
 * Compare, URL par URL, deux déploiements du site (par défaut : la prod et une Preview) :
 * code HTTP, redirection, type de contenu, politique de cache, qui a répondu (le serveur
 * Express — en-tête Server-Timing — ou le statique) et, pour les pages HTML en 200, les
 * balises qui comptent pour le référencement : <title>, meta description, canonical, robots,
 * nombre de <h1>, types JSON-LD, image Open Graph. Sert à valider un changement de
 * configuration Vercel ou de gabarit avant de le merger : toute différence est listée, et une
 * différence SEO sur une page est toujours bloquante (sauf changement déclaré voulu).
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

// [chemin, aspects à comparer strictement, changement voulu ?] — tout est comparé, mais seuls les aspects
// listés font échouer. Un troisième élément décrit un changement VOULU (ADR 0009) : pour ces aspects,
// B est comparé à l'attendu et non à A (ex. /studio : gabarit brut en 200 → 301 vers /studio.html).
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
  // A9 (ADR 0014) : anciens handles de la table des redirections → 301 en un saut (fiche publiée ou chemin), 410 si retirée.
  ['/produit.html?handle=chaise-belleville-copie', ['status', 'location'], { status: 301, location: '/produit.html?handle=chaise-avec-accoudoirs-belleville' }],
  ['/produit.html?handle=pouf-the-cover-up', ['status', 'location'], { status: 301, location: '/collections/fatboy' }],
  ['/produit.html?handle=bougie-parfumee-gstaad-glam-travel-from-home', ['status', 'who'], { status: 410 }],
  ['/products/chaise-belleville-copie', ['status', 'location'], { status: 301, location: '/produit.html?handle=chaise-avec-accoudoirs-belleville' }],
  ['/products/bougie-parfumee-gstaad-glam-travel-from-home', ['status'], { status: 410 }],
  ['/marques.html', ['status', 'who', 'type']],
  ['/designers.html', ['status', 'who']],
  ['/studio.html', ['status', 'who']],
  ['/journal.html', ['status', 'who']],
  ['/journal/fermob.html', ['status', 'who', 'type']],
  ['/contact.html', ['status', 'who']],
  ['/selection.html', ['status', 'who'], { robots: 'noindex,follow', canonical: '' }],   // A2 : page panier hors indexation
  ['/nuancier-fermob.html', ['status', 'who']],
  ['/mentions-legales.html', ['status', 'who']],
  ['/404.html', ['status', 'who'], { ogImage: '/images/og-default.jpg' }],   // layout unique : image de partage sur toute page (ADR 0012)
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
  ['/home', ['status', 'location'], { status: 301, location: '/' }],   // A12 : 301 vers l'accueil
  ['/v3/contact.html', ['status', 'location']],
  ['/v3', ['status', 'location']],
  ['/vitra-home-stories-for-winter', ['status', 'location']],
  // Sources front : plus servies brutes depuis l'ADR 0011 (seuls les bundles /assets/* existent) → 404 voulu.
  ['/styles.css', ['status'], { status: 404 }],
  ['/shell.mjs', ['status'], { status: 404 }],
  ['/pages/produits.js', ['status'], { status: 404 }],
  ['/product-card.mjs', ['status'], { status: 404 }],
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
  ['/dossier/inconnu/', ['status']],
  ['/studio', ['status', 'location'], { status: 301, location: '/studio.html' }],
  ['/journal/fermob', ['status', 'location'], { status: 301, location: '/journal/fermob.html' }],
  ['/produits', ['status', 'location'], { status: 301, location: '/produits.html' }],
  ['/famille.html', ['status'], { status: 404 }],
  ['/500.html', ['status'], { status: 404 }],
];

// Balises de référencement d'une page HTML (comparées en chemin relatif : la Preview et la prod
// n'ont pas la même origine).
const SEO_KEYS = ['title', 'description', 'canonical', 'robots', 'h1', 'ld', 'ogImage'];
const decode = (t) => t.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const attr = (html, re) => { const m = html.match(re); return m ? decode(m[1]) : ''; };
const relative = (u) => u.replace(/^https?:\/\/[^/]+/, '');
function extractSeo(html) {
  const head = (html.match(/<head>([\s\S]*?)<\/head>/i) || [, html])[1];
  const types = new Set();
  for (const m of head.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { const j = JSON.parse(m[1]); for (const o of Array.isArray(j) ? j : [j]) types.add(Array.isArray(o['@type']) ? o['@type'].join('+') : (o['@type'] || '?')); } catch { types.add('JSON-LD invalide'); }
  }
  return {
    title: attr(head, /<title>([\s\S]*?)<\/title>/i),
    description: attr(head, /<meta name="description" content="([^"]*)"/i),
    canonical: relative(attr(head, /<link rel="canonical" href="([^"]*)"/i)),
    robots: attr(head, /<meta name="robots" content="([^"]*)"/i),
    h1: String((html.match(/<h1[\s>]/gi) || []).length),
    ld: [...types].sort().join(','),
    ogImage: relative(attr(head, /<meta property="og:image" content="([^"]*)"/i)),
  };
}

async function probe(base, path) {
  const headers = { 'user-agent': 'mikado-parity/1', accept: 'text/html,application/json;q=0.9,*/*;q=0.8' };
  if (BYPASS && /\.vercel\.app$/.test(new URL(base).hostname)) headers['x-vercel-protection-bypass'] = BYPASS;   // toute Preview, côté A ou B
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 45_000);
  try {
    const res = await fetch(base + path, { headers, redirect: 'manual', signal: ctrl.signal });
    const type = (res.headers.get('content-type') || '').split(';')[0];
    const html = type === 'text/html' && res.status === 200 ? await res.text() : (await res.arrayBuffer(), '');
    const loc = res.headers.get('location') || '';
    return {
      ...(html ? extractSeo(html) : {}),
      status: res.status,
      location: loc.replace(base, '').replace(A, '').replace(B, ''),
      type,
      cache: res.headers.get('cache-control') || '',
      who: res.headers.get('server-timing') ? 'serveur' : (res.status >= 300 && res.status < 400 && !res.headers.get('server-timing') ? 'edge' : 'statique'),
    };
  } catch (e) { return { status: 'ERR', location: '', type: '', cache: '', who: e.name === 'AbortError' ? 'timeout' : 'erreur' }; }
  finally { clearTimeout(timer); }
}

let failures = 0; const rows = [];
for (const [path, strict, expect = {}] of URLS) {
  const [a, b] = await Promise.all([probe(A, path), probe(B, path)]);
  const diffs = [], wanted = [];
  for (const k of ['status', 'location', 'type', 'cache', 'who', ...SEO_KEYS]) {
    if (k in expect) {
      if (String(b[k]) !== String(expect[k])) diffs.push(`${k}: attendu ${expect[k]} → ${b[k] || '∅'}`);
      else if (String(a[k]) !== String(b[k])) wanted.push(`${k}: ${a[k] || '∅'} → ${b[k]}`);
    } else if (String(a[k] ?? '') !== String(b[k] ?? '')) diffs.push(`${k}: ${String(a[k] ?? '∅').slice(0, 70) || '∅'} → ${String(b[k] ?? '∅').slice(0, 70) || '∅'}`);
  }
  // Une page HTML servie en 200 des deux côtés : toute différence de balise SEO est bloquante.
  const htmlPage = a.status === 200 && a.type === 'text/html' && b.status === 200 && b.type === 'text/html';
  const strictFail = diffs.some((d) => { const k = d.split(':')[0]; return strict.includes(k) || k in expect || (htmlPage && SEO_KEYS.includes(k)); });
  if (strictFail) failures++;
  const note = [...diffs, ...(wanted.length ? ['voulu : ' + wanted.join(', ')] : [])].join(' · ');
  if (!ONLY_DIFF || diffs.length) rows.push(`${strictFail ? '❌' : diffs.length ? '⚠️ ' : '✅'} ${path.padEnd(52)} ${String(a.status).padStart(3)} ${a.who.padEnd(8)} | ${String(b.status).padStart(3)} ${b.who.padEnd(8)} ${note}`);
}
const seoPages = URLS.length; // information : les balises SEO sont comparées sur chaque page HTML en 200
console.log(`Parité ${A} (A) → ${B} (B) — ${URLS.length} URL (balises SEO comparées sur chaque page HTML), ${failures} différence(s) bloquante(s)\n`);
console.log('   URL'.padEnd(56) + ' A            | B');
console.log(rows.join('\n'));
process.exit(failures ? 1 : 0);
