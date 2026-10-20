const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const realFetch=global.fetch;
const vendors=['Moustache','&Tradition','Atelier <Test>','Mikado Deco'];   // « Mikado Deco » = carte cadeau, jamais une marque
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
 assert.doesNotMatch(grid,/mikado-deco|Mikado Deco/,'le magasin n’est pas une marque (carte cadeau, Cyril 20/10/2026)');
 const cards=grid.match(/<a class="brandcard"[\s\S]*?<\/a>/g);
 assert.equal(cards.length,3);
 // Alphabetical order, curated destination or catalogue fallback, known origin and escaped name.
 const curated=JSON.parse(fs.readFileSync(path.join(__dirname,'../v3/mega-menu-brands.json'),'utf8')).brands;
 const moustache=curated.find(b=>b.name==='Moustache')?.href||'/produits.html?brand=moustache';
 assert.deepEqual(cards.map(c=>c.match(/href="([^"]+)"/)[1]),['/collections/tradition','/produits.html?brand=atelier-test',moustache]);
 assert.match(cards[2],/brandcard__origin">France</);
 assert.match(cards[1],/brandcard__name">Atelier &lt;Test&gt;</,"nom échappé");
 assert(cards[0].includes('src="/images/brands/tradition.svg?v=dev"')&&cards[2].includes('src="/images/brands/moustache.svg?v=dev"'),'logo présent dans le dépôt → <img> versionnée');
 assert(!/<img/.test(cards[1])&&/<span class="brandcard__name">Atelier &lt;Test&gt;<\/span>/.test(cards[1]),'aucun fichier de logo → le nom, sans requête 404 (audit du 20 octobre 2026)');
 for(const [i,name]of ['&Tradition','Atelier <Test>','Moustache'].entries()){
  const href=cards[i].match(/href="([^"]+)"/)[1];
  assert.equal(cards[i],brandCardHTML(i===1?{name,href,logo:null}:{name,href},{imageUrl:url=>`${url}?v=dev`}));
 }
});

test('page de marque : les outils du registre (nuancier Fermob) apparaissent sous le titre, rien pour les autres marques',async()=>{
 const { brandBanner, navigationReady } = require('../lib/render/navigation');
 await navigationReady;
 const hero='<section class="subhero"><div class="subhero__in"><h1 data-plp-title data-context>Fermob</h1><p data-plp-sub>Mobilier de design.</p></div></section>';
 const fermob=brandBanner(hero,'fermob');
 assert.match(fermob,/<section class="subhero subhero--brand">/);
 assert.match(fermob,/<p data-plp-sub>Mobilier de design\.<\/p><p class="subhero__tools"><a class="btn btn--light" href="\/nuancier-fermob\.html">Voir le nuancier Fermob<\/a><\/p>/);
 const withBanner=brandBanner(hero.replace('class="subhero"','class="subhero subhero--editorial subhero--brand"'),'fermob');
 assert.match(withBanner,/<section class="subhero subhero--editorial subhero--brand">/,'la classe posée par la bannière n’est pas doublée');
 assert.equal((withBanner.match(/subhero__tools/g)||[]).length,1,'les outils sont là même quand la bannière a déjà posé la classe');
 assert.equal(brandBanner(withBanner,'fermob'),withBanner,'idempotent');
 const moustache=brandBanner(hero,'moustache');
 assert.match(moustache,/subhero--brand/);assert.doesNotMatch(moustache,/subhero__tools|nuancier/);
 assert.equal(brandBanner(hero,'chaises'),hero,'une sous-catégorie n’est pas une marque');
});
