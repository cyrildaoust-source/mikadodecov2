const { chromium } = require('/home/vercel-sandbox/mikadodecov2/node_modules/playwright');
const [origin, bypass, prefix] = process.argv.slice(2);
(async()=>{const b=await chromium.launch();
for (const w of [390,360]) {
  const ctx=await b.newContext({viewport:{width:w,height:800},...(bypass&&bypass!=='-'?{extraHTTPHeaders:{'x-vercel-protection-bypass':bypass}}:{})});const p=await ctx.newPage();
  await p.goto(origin+'/designers.html',{waitUntil:'networkidle'});await p.waitForTimeout(800);
  const m=await p.evaluate(()=>{
    const hit=(el,pseudo)=>{const r=el.getBoundingClientRect();const cs=getComputedStyle(el,pseudo);return [Math.max(r.width,parseFloat(cs.width)||0),parseFloat(cs.height)||0]};
    const names=[...document.querySelectorAll('.az-name a')].map(a=>hit(a,'::before'));
    const bar=[...document.querySelectorAll('a.az-bar__letter')].map(a=>hit(a,'::after'));
    const min=(arr,i)=>Math.min(...arr.map(x=>x[i]));
    // Contrôle réel : un tap au centre de chaque lien atteint bien ce lien
    let wrong=0; for (const a of document.querySelectorAll('.az-name a')) { const r=a.getBoundingClientRect(); if(r.top<0||r.bottom>innerHeight) continue; const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2); if(!a.contains(e)) wrong++; }
    return {names:names.length,nameMinW:min(names,0),nameMinH:min(names,1),bar:bar.length,barMin:[min(bar,0),min(bar,1)],sw:document.documentElement.scrollWidth,vw:innerWidth,wrong};
  });
  console.log(w,JSON.stringify(m));
  await p.locator('#letter-C').scrollIntoViewIfNeeded();await p.evaluate(()=>scrollBy(0,-110));
  await p.screenshot({path:`shots/${prefix}-az-C-${w}.png`});
  await ctx.close();}
await b.close();})();
