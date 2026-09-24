// Audit des chargements après l'arrivée du HTML : appels réseau, cartes reconstruites,
// sauts de mise en page (CLS), images en double, rendu sans JavaScript.
// Usage : BASE=https://www.mikadodeco.be [PREVIEW_BYPASS=…] [NOJS=0] [PAGES=/,/produits.html] node scripts/audit-loading.mjs
// Écrit le détail dans ./audit-loading.json.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'https://www.mikadodeco.be';
const OUT = process.cwd() + '/audit-loading-';
const pages = (process.env.PAGES || '/,/produits.html,/collections/sieges,/collections/decoration,/collections/fauteuils,/collections/hay,/collections/promotions,/collections/nouveautes,/produits.html?designer=verner-panton,/produit.html?handle=chaise-aluminium-luxembourg-4101,/marques.html,/designers.html,/journal.html,/journal/fermob.html,/studio.html,/materiaux.html,/rendez-vous.html,/contact.html,/selection.html,/nuancier-fermob.html,/produits.html?q=chaise').split(',');
const browser = await chromium.launch();
const rows = [];
for (const [device, opts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['mobile', { viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 3 }]]) {
  for (const js of (process.env.NOJS === '0' ? [true] : [true, false])) {
    if (!js && device === 'mobile') continue;
    const ctx = await browser.newContext({ ...opts, javaScriptEnabled: js, ...(process.env.PREVIEW_BYPASS ? { extraHTTPHeaders: { 'x-vercel-protection-bypass': process.env.PREVIEW_BYPASS, 'x-vercel-set-bypass-cookie': 'true' } } : {}) });
    for (const path of pages) {
      const page = await ctx.newPage();
      const api = [], imgs = new Map();
      page.on('request', r => {
        const u = new URL(r.url());
        if ((u.hostname.endsWith('mikadodeco.be') || u.hostname.endsWith('vercel.app')) && (u.pathname.startsWith('/api/') || u.pathname.startsWith('/index-catalogue'))) api.push(u.pathname + (u.search ? '?' + u.searchParams.toString().slice(0, 60) : ''));
        if (r.resourceType() === 'image' && u.hostname === 'cdn.shopify.com') { const k = u.pathname; imgs.set(k, (imgs.get(k) || new Set()).add(u.search)); }
      });
      if (js) await page.addInitScript(() => {
        window.__m = { added: 0, removed: 0, text: 0, cls: 0, where: {}, cardsRemoved: 0 };
        new MutationObserver(list => { for (const m of list) for (const n of m.removedNodes) if (n.nodeType === 1 && (n.matches('.pcard') || n.querySelector?.('.pcard'))) window.__m.cardsRemoved += n.matches('.pcard') ? 1 : n.querySelectorAll('.pcard').length; }).observe(document, { subtree: true, childList: true });
        new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
        document.addEventListener('DOMContentLoaded', () => {
          const root = document.querySelector('main') || document.body;
          new MutationObserver(list => { for (const m of list) {
            if (m.target.closest?.('[data-breadcrumb], .chrome, #site-header, #site-footer, .cart-drawer, [data-promo-slot]')) continue;
            const key = (m.target.closest?.('[id],[class]')?.id || m.target.closest?.('[class]')?.className || m.target.nodeName || '').toString().slice(0, 40);
            if (m.type === 'childList') { window.__m.added += m.addedNodes.length; window.__m.removed += m.removedNodes.length; if (m.addedNodes.length + m.removedNodes.length) window.__m.where[key] = (window.__m.where[key] || 0) + m.addedNodes.length + m.removedNodes.length; }
            else window.__m.text++;
          } }).observe(root, { subtree: true, childList: true, characterData: true });
        });
      });
      const t = Date.now();
      try { await page.goto(BASE + path, { waitUntil: 'load', timeout: 45000 }); } catch (e) {}
      await page.waitForTimeout(js ? 4000 : 500);
      const info = await page.evaluate(() => {
        const main = document.querySelector('main') || document.body;
        const hidden = [...main.querySelectorAll('section, [data-reveal], .reveal')].filter(e => { const s = getComputedStyle(e); return (s.opacity === '0' || s.visibility === 'hidden') && e.getBoundingClientRect().height > 40; }).length;
        return { m: window.__m || null, cards: document.querySelectorAll('.pcard').length, textLen: main.innerText.trim().length, hidden, h: document.documentElement.scrollHeight };
      });
      const dupImgs = [...imgs.values()].filter(s => s.size > 1).length;
      rows.push({ device, js, path, ms: Date.now() - t, api, dupImgs, ...info, where: info.m ? Object.entries(info.m.where).sort((a, b) => b[1] - a[1]).slice(0, 4) : [] });
      await page.close();
    }
    await ctx.close();
  }
}
await browser.close();
import('node:fs').then(fs => fs.writeFileSync(OUT.replace(/-$/, '') + '.json', JSON.stringify(rows, null, 1)));
for (const r of rows) console.log([r.device, r.js ? 'js' : 'NOJS', r.path.padEnd(48), 'api=' + r.api.length, r.m ? `dom+${r.m.added}/-${r.m.removed}` : '', r.m ? 'cls=' + r.m.cls.toFixed(3) : '', r.m ? 'cardsRebuilt=' + r.m.cardsRemoved : '', 'cards=' + r.cards, 'hidden=' + r.hidden, 'dupImg=' + r.dupImgs, r.js ? '' : 'text=' + r.textLen].join(' | '), r.api.length ? '\n      ' + r.api.join(' ') : '', r.where.length ? '\n      where ' + JSON.stringify(r.where) : '');
