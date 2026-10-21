const { chromium } = require('/home/vercel-sandbox/mikadodecov2/node_modules/playwright');
const [origin, bypass, prefix] = process.argv.slice(2);
(async()=>{const b=await chromium.launch();
for (const [w,touch] of [[1440,false],[1024,true],[390,true],[360,true]]) {
  const ctx=await b.newContext({viewport:{width:w,height:900},hasTouch:touch,isMobile:touch&&w<500,...(bypass&&bypass!=='-'?{extraHTTPHeaders:{'x-vercel-protection-bypass':bypass}}:{})});const p=await ctx.newPage();
  await p.goto(origin+'/designers.html',{waitUntil:'networkidle'});await p.waitForTimeout(800);
  const m=await p.evaluate(()=>{
    const rows=[...document.querySelectorAll('.az-name')].map(li=>li.getBoundingClientRect());
    const cols=new Set([...document.querySelectorAll('#letter-C ~ .az-names .az-name, .az-group:nth-child(3) .az-name')].map(li=>Math.round(li.getBoundingClientRect().left)));
    let wrong=0; for (const a of document.querySelectorAll('.az-name a')) { const r=a.closest('.az-name').getBoundingClientRect(); if(r.top<0||r.bottom>innerHeight) continue; const e=document.elementFromPoint(r.left+4,r.top+r.height/2); if(!a.closest('.az-name').contains(e)) wrong++; }
    return {rows:rows.length,minH:Math.min(...rows.map(r=>r.height)),minW:Math.round(Math.min(...rows.map(r=>r.width))),colsC:cols.size,indexH:Math.round(document.querySelector('.az-index').getBoundingClientRect().height),sw:document.documentElement.scrollWidth,vw:innerWidth,wrong};
  });
  console.log(w,JSON.stringify(m));
  const y=await p.evaluate(()=>document.querySelector('#letter-B').getBoundingClientRect().top+scrollY-120);
  await p.mouse.wheel(0,y);await p.waitForTimeout(900);
  await p.screenshot({path:`shots/${prefix}-cols-${w}.png`});
  await ctx.close();}
await b.close();})();
