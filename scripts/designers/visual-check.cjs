// Captures et mesures (débordement horizontal, zones tactiles) sur une preview réelle.
// Usage : node visual-check.cjs <origin> <prefix> <path>...
const { chromium } = require('/home/vercel-sandbox/mikadodecov2/node_modules/playwright');
const [origin, prefix, ...paths] = process.argv.slice(2);
const widths = [1440, 390, 360];
(async () => {
  const b = await chromium.launch();
  const report = [];
  for (const w of widths) {
    const ctx = await b.newContext({ viewport: { width: w, height: w > 800 ? 900 : 800 } });
    const p = await ctx.newPage();
    if (process.env.PREVIEW_BYPASS) { await p.setExtraHTTPHeaders({ 'x-vercel-protection-bypass': process.env.PREVIEW_BYPASS, 'x-vercel-set-bypass-cookie': 'true' }); await p.goto(origin + '/'); await p.setExtraHTTPHeaders({}); }
    for (const path of paths) {
      const resp = await p.goto(origin + path, { waitUntil: 'networkidle', timeout: 90000 }).catch(e => null);
      await p.waitForTimeout(1200);
      await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in')));
      const m = await p.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const over = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > vw + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed'; })
          .filter(e => !e.closest('[class*=rail],[data-rail],.az-bar,.fam-icon-rail,.pdp__rail'))
          .slice(0, 5).map(e => e.tagName + '.' + String(e.className).slice(0, 40));
        const small = [...document.querySelectorAll('main a, main button')].filter(e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width && s.visibility !== 'hidden' && (r.height < 44 || r.width < 24); })
          .map(e => { const r = e.getBoundingClientRect(); return `${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 25)}(${Math.round(r.width)}x${Math.round(r.height)})`; });
        return { scrollW: document.documentElement.scrollWidth, vw, over, smallCount: small.length, smallEx: small.slice(0, 6), h1: document.querySelector('h1')?.textContent.trim(), robots: document.querySelector('meta[name=robots]')?.content || '', photo: document.querySelector('.designer-hero__photo')?.currentSrc || '', photoW: document.querySelector('.designer-hero__photo')?.naturalWidth || 0, cards: document.querySelectorAll('.pgrid .pcard').length };
      });
      const name = `${prefix}-${path.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home'}-${w}.png`;
      await p.screenshot({ path: __dirname + '/shots/' + name, fullPage: false });
      report.push({ path, w, status: resp?.status(), ...m, shot: name });
      console.log(JSON.stringify({ path, w, status: resp?.status(), ...m }));
    }
    await ctx.close();
  }
  require('fs').writeFileSync(__dirname + `/shots/${prefix}-report.json`, JSON.stringify(report, null, 1));
  await b.close();
})();
