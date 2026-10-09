#!/usr/bin/env node
/**
 * Vérification navigateur — Mikado Deco
 * -------------------------------------
 * Charge les pages clés d'un déploiement (prod ou Preview) dans Chromium headless et joue le parcours
 * panier de bout en bout avec la vraie API Shopify. Échoue dès qu'une page a une erreur console ou
 * JavaScript, une requête en échec, une source non hachée, un chrome absent ou un méga-menu sans ses
 * styles ; ou dès qu'une étape du panier ne donne pas le résultat attendu.
 *
 *   node scripts/browser-check.mjs                                  # prod
 *   node scripts/browser-check.mjs --base https://xxx.vercel.app    # Preview (secret de contournement
 *                                   dans VERCEL_AUTOMATION_BYPASS_SECRET, envoyé à l'hôte Vercel seulement)
 *   node scripts/browser-check.mjs --no-cart                        # pages seulement
 *
 * Écrit son tableau dans le résumé du job GitHub (GITHUB_STEP_SUMMARY) quand il y en a un.
 * Nécessite Playwright (devDependency) et Chromium (`npx playwright install chromium`).
 */
import { appendFileSync } from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] ? args[i + 1] : fallback; };
const BASE = opt('--base', process.env.SMOKE_BASE || 'https://www.mikadodeco.be').replace(/\/$/, '');
const SECRET = opt('--bypass', process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '');
const WITH_CART = !args.includes('--no-cart');
const PAGES = ['/', '/produits.html', '/produit.html?handle=verre-a-eau-animal-farm', '/collections/vitra', '/produits.html?q=chaise', '/nuancier-fermob.html', '/journal/fermob.html', '/designers.html', '/selection.html'];
const rows = []; let failures = 0;
const row = (ok, name, notes = '') => { rows.push({ ok, name, notes }); if (!ok) failures++; };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
// L'en-tête de contournement va à l'hôte Vercel seulement : envoyé aux polices Typekit, il casserait leur CORS.
if (SECRET) await ctx.route((u) => /\.vercel\.app$/.test(u.hostname), (route) => route.continue({ headers: { ...route.request().headers(), 'x-vercel-protection-bypass': SECRET } }));

// ── Pages ───────────────────────────────────────────────────────────────────
for (const p of PAGES) {
  const page = await ctx.newPage();
  const errors = [], failed = [], raw = new Set(); let assets = 0, immutable = 0;
  page.on('console', (m) => { if (m.type() === 'error' && !/_vercel\/insights/.test(m.text())) errors.push(m.text().slice(0, 120)); });
  page.on('pageerror', (e) => errors.push('JS : ' + String(e.message).slice(0, 120)));
  page.on('response', (r) => {
    const u = new URL(r.url()); if (u.origin !== BASE || u.pathname.startsWith('/_vercel/')) return;
    if (r.status() >= 400) failed.push(`${r.status()} ${u.pathname}`);
    if (u.pathname.startsWith('/assets/')) { assets++; if (/immutable/.test(r.headers()['cache-control'] || '')) immutable++; }
    else if (/\.(m?js|css)$/.test(u.pathname)) raw.add(u.pathname);
  });
  page.on('requestfailed', (r) => { const u = new URL(r.url()); if (u.origin === BASE && !u.pathname.startsWith('/_vercel/')) failed.push('échec ' + u.pathname); });
  try {
    const res = await page.goto(BASE + p, { waitUntil: 'load', timeout: 60000 }); await page.waitForTimeout(2000);
    const info = await page.evaluate(() => ({
      nav: !!document.querySelector('header.chrome nav'),
      mm: (function hasMm(sheets) { for (const s of sheets) { let rules; try { rules = [...s.cssRules]; } catch { continue; } for (const r of rules) { if (r.selectorText && r.selectorText.includes('.mm-')) return true; if (r.styleSheet && hasMm([r.styleSheet])) return true; } } return false; })([...document.styleSheets]),
      h1: (document.querySelector('h1')?.textContent || '').trim().slice(0, 40),
    }));
    const notes = [];
    if (res.status() !== 200) notes.push(`HTTP ${res.status()}`);
    if (errors.length) notes.push('console : ' + errors.join(' | '));
    if (failed.length) notes.push('requêtes : ' + failed.join(', '));
    if (raw.size) notes.push('sources brutes : ' + [...raw].join(', '));
    if (!assets) notes.push('aucun asset haché'); else if (immutable !== assets) notes.push(`${assets - immutable} asset(s) sans immutable`);
    if (!info.nav) notes.push('chrome absent'); if (!info.mm) notes.push('méga-menu sans styles');
    row(notes.length === 0, `Page ${p}`, notes.join(' · ') || `h1 « ${info.h1} », ${assets} assets`);
  } catch (e) { row(false, `Page ${p}`, e.message.slice(0, 160)); }
  await page.close();
}

// ── Parcours panier ─────────────────────────────────────────────────────────
if (WITH_CART) {
  const page = await ctx.newPage(); const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/_vercel\/insights/.test(m.text())) errors.push(m.text().slice(0, 100)); });
  page.on('pageerror', (e) => errors.push('JS : ' + String(e.message).slice(0, 100)));
  const text = async (sel) => (await page.textContent(sel) || '').trim();
  try {
    await page.goto(BASE + '/produit.html?handle=verre-a-eau-animal-farm', { waitUntil: 'load' }); await page.waitForTimeout(2000);
    await page.click('.pdp__cta[data-add]:not([disabled])'); await page.waitForTimeout(800);
    const badge = await text('[data-cart-count]');
    const open = await page.evaluate(() => document.querySelector('[data-cart-drawer]')?.classList.contains('open'));
    const lines = await page.locator('[data-cartd-body] .cartd__item').count();
    row(badge === '1' && open && lines === 1, 'Panier : ajout depuis la fiche → badge 1, tiroir ouvert, 1 ligne', `badge ${badge}, ouvert ${open}, lignes ${lines}`);
    await page.click('[data-cartd-inc]'); await page.waitForTimeout(600);
    const [badge2, qty, total] = [await text('[data-cart-count]'), await text('.cartd__qval'), await text('.cartd__row--total')];
    row(badge2 === '2' && qty === '2' && /€/.test(total), 'Panier : quantité +1 → badge 2, total en €', `badge ${badge2}, qté ${qty}, ${total.replace(/\s+/g, ' ')}`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    await page.goto(BASE + '/selection.html', { waitUntil: 'load' }); await page.waitForTimeout(2000);
    const sel = await page.evaluate(() => ({ has: document.documentElement.classList.contains('cart-has-items'), n: document.querySelectorAll('[data-items] > *').length, subtotal: document.querySelector('[data-subtotal]')?.textContent || '' }));
    row(sel.has && sel.n >= 1 && /€/.test(sel.subtotal), 'Sélection : article présent, sous-total', `${sel.n} article(s), sous-total ${sel.subtotal}`);
    await page.goto(BASE + '/produits.html', { waitUntil: 'load' }); await page.waitForTimeout(2500);
    const card = page.locator('.pcard [data-add]:not([disabled])').first();
    const before = (await card.textContent()).trim(); await card.click(); await page.waitForTimeout(500); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    const after = (await card.textContent()).trim(); const b3 = await text('[data-cart-count]');
    await card.click(); await page.waitForTimeout(500); const back = (await card.textContent()).trim(); const b4 = await text('[data-cart-count]');
    row(before !== after && back === before && b3 === '3' && b4 === '2', 'Catalogue : carte en bascule (libellé + badge)', `« ${before} » → « ${after} » → « ${back} » ; badge ${b3} → ${b4}`);
    await page.click('[data-search-open]'); await page.waitForTimeout(1200);
    const search = await page.evaluate(() => !!document.querySelector('[data-search-input]') && (document.activeElement === document.querySelector('[data-search-input]') || !!document.querySelector('body.search-locked, .search-drawer.open, [data-search-drawer].open')));
    row(search, 'Recherche : tiroir ouvert (module chargé à la demande)');
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    await page.click('.nav__cart'); await page.waitForTimeout(600); await page.click('[data-cartd-remove]'); await page.waitForTimeout(500);
    const empty = await page.evaluate(() => ({ badge: document.querySelector('[data-cart-count]')?.textContent.trim(), txt: document.querySelector('[data-cartd-body]')?.textContent.includes('vide') }));
    row(empty.badge === '0' && empty.txt, 'Panier : retrait dans le tiroir → vide', `badge ${empty.badge}`);
    row(errors.length === 0, 'Panier : aucune erreur console / JS sur le parcours', errors.join(' | '));
  } catch (e) { row(false, 'Parcours panier', e.message.slice(0, 160)); }
  await page.close();
}
await browser.close();

// ── Rapport ─────────────────────────────────────────────────────────────────
const lines = rows.map((r) => `| ${r.ok ? '✅' : '❌'} | ${r.name} | ${r.notes} |`);
const report = [`## Navigateur · ${BASE} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`, '', failures ? `**${failures} contrôle(s) en échec** sur ${rows.length}.` : `**${rows.length} / ${rows.length} contrôles OK.**`, '', '| | Contrôle | Notes |', '|---|---|---|', ...lines, ''].join('\n');
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n');
process.exit(failures ? 1 : 0);
