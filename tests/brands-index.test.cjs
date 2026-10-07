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
  assert.equal(cards[i],brandCardHTML({name,href},{imageUrl:url=>`${url}?v=dev`}));
 }
});
