const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const realFetch=global.fetch;
const vendors=['Moustache','&Tradition','Atelier <Test>'];
let server,base,brandCardHTML;

before(async()=>{
 process.env.SHOPIFY_STORE_DOMAIN='brands-index.test';process.env.SHOPIFY_STOREFRONT_TOKEN='test';
 ({brandCardHTML}=await import('../v3/brand-card.mjs'));
 global.fetch=async(url,options)=>{
  assert.equal(new URL(url).hostname,'brands-index.test');
  const {query}=JSON.parse(options.body);
  if(/query GetVendors\(/.test(query))return Response.json({data:{products:{edges:vendors.map(vendor=>({node:{vendor}})),pageInfo:{hasNextPage:false,endCursor:null}}}});
  return Response.json({data:{}});
 };
 server=require('../server').listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{global.fetch=realFetch;await new Promise(r=>server.close(r));});

const gridOf=html=>html.match(/<div class="brandgrid"[^>]*>[\s\S]*?\n\s*<\/div>\s*<\/section>/)[0];

test('the Marques page is complete before JavaScript and uses the shared brand card',async()=>{
 const html=await(await realFetch(base+'/marques.html',{headers:{Accept:'text/html'}})).text();
 const grid=gridOf(html);
 assert.match(grid,/^<div class="brandgrid" data-brandgrid data-ssr="1">/);
 assert.doesNotMatch(grid,/pcard__skel/);
 assert.match(html,/data-brand-count>3 marques</);
 const cards=grid.match(/<a class="brandcard"[\s\S]*?<\/a>/g);
 assert.equal(cards.length,3);
 // Alphabetical order, curated destination or catalogue fallback, known origin and escaped name.
 const curated=JSON.parse(fs.readFileSync(path.join(__dirname,'../v3/mega-menu-brands.json'),'utf8')).brands;
 const moustache=curated.find(b=>b.name==='Moustache')?.href||'/produits.html?brand=moustache';
 assert.deepEqual(cards.map(c=>c.match(/href="([^"]+)"/)[1]),['/collections/tradition','/produits.html?brand=atelier-test',moustache]);
 assert.match(cards[2],/brandcard__origin">France</);
 assert.match(cards[1],/alt="Atelier &lt;Test&gt;"/);
 assert(cards.every(c=>/src="\/images\/brands\/[a-z-]+\.svg\?v=dev"/.test(c)));
 for(const [i,name]of ['&Tradition','Atelier <Test>','Moustache'].entries()){
  const href=cards[i].match(/href="([^"]+)"/)[1];
  assert.equal(cards[i],brandCardHTML({name},{href,imageUrl:url=>`${url}?v=dev`}));
 }
});

test('the browser keeps server cards in place and its fallback renders the same cards',async t=>{
 let chromium;
 try { ({chromium}=require('playwright')); } catch { return t.skip('Playwright is not installed'); }
 let browser;
 try { browser=await chromium.launch({headless:true}); } catch { return t.skip('Chromium is not available'); }
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(url=>!url.href.startsWith(base),route=>route.abort());
  // A late brand API failure must not replace or clear the server-rendered grid.
  await page.route('**/api/brands',async route=>{await new Promise(r=>setTimeout(r,500));await route.fulfill({status:503,json:[]});});
  await page.addInitScript(()=>{
   window.removedBrandCards=0;
   new MutationObserver(records=>{for(const r of records)if(r.target.matches?.('[data-brandgrid]'))window.removedBrandCards+=[...r.removedNodes].filter(n=>n.matches?.('a.brandcard')).length;})
    .observe(document,{childList:true,subtree:true});
   document.addEventListener('DOMContentLoaded',()=>{window.serverBrandCards=[...document.querySelectorAll('[data-brandgrid] a.brandcard')];});
  });
  await page.goto(base+'/marques.html');
  await page.waitForFunction(()=>document.body.dataset.shellReady==='1');
  await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(()=>window.serverBrandCards.length),3);
  assert(await page.evaluate(()=>window.serverBrandCards.every(c=>c.isConnected)));
  assert.equal(await page.evaluate(()=>window.removedBrandCards),0);
  const cards=()=>page.locator('[data-brandgrid] a.brandcard').evaluateAll(nodes=>nodes.map(c=>({href:c.getAttribute('href'),origin:c.querySelector('.brandcard__origin').textContent,name:c.querySelector('img')?.alt||c.querySelector('.brandcard__name')?.textContent})));
  const ssr=await cards();
  // The same page without server rendering loads the list once and shows equivalent cards.
  await page.unroute('**/api/brands');
  const staticPage=fs.readFileSync(path.join(__dirname,'../v3/marques.html'),'utf8');
  await page.route('**/marques-static.html',route=>route.fulfill({contentType:'text/html',body:staticPage}));
  await page.goto(base+'/marques-static.html');
  await page.locator('[data-brandgrid] a.brandcard').first().waitFor();
  assert.deepEqual(await cards(),ssr);
  assert.equal(await page.locator('[data-brandgrid] .pcard__skel').count(),0);
  assert.equal(await page.locator('[data-brand-count]').textContent(),'3 marques');
  assert.deepEqual(errors,[]);
 } finally { await browser.close(); }
});
