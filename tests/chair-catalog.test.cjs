const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const realFetch=global.fetch;
let server,base,reads=0,fail=false;
const node=id=>({id:`gid://shopify/Product/${id}`,handle:`chaise-${id}`,title:`Chaise ${id}`,vendor:id%2?'HAY':'Vitra',productType:'chaise',description:'Une chaise.',tags:[],availableForSale:true,totalInventory:2,
  collections:{edges:[{node:{handle:'chaises'}}]},featuredImage:{url:`https://cdn.shopify.com/${id}.jpg`},images:{edges:[{node:{url:`https://cdn.shopify.com/${id}.jpg`}}]},
  priceRange:{minVariantPrice:{amount:'400',currencyCode:'EUR'},maxVariantPrice:{amount:'700.95',currencyCode:'EUR'}},compareAtPriceRange:{minVariantPrice:{amount:'0'}},metafields:[],
  filterMetafields:[{namespace:'custom',key:'usage',type:'single_line_text_field',value:'Intérieur'},{namespace:'custom',key:'material',type:'single_line_text_field',value:'Bois'}],
  variants:{pageInfo:{hasNextPage:false,endCursor:null},edges:[{node:{id:`gid://shopify/ProductVariant/${id*10}`,title:'Beige',price:{amount:'400'},availableForSale:true,quantityAvailable:2,selectedOptions:[{name:'Couleur',value:'Beige'}],image:{url:`https://cdn.shopify.com/${id}-beige.jpg`}}},{node:{id:`gid://shopify/ProductVariant/${id*10+1}`,title:'Noir',price:{amount:'700.95'},availableForSale:true,quantityAvailable:0,selectedOptions:[{name:'Couleur',value:'Noir'}],image:{url:`https://cdn.shopify.com/${id}-noir.jpg`}}}]} });
before(async()=>{
  process.env.SHOPIFY_STORE_DOMAIN='chairs.test';process.env.SHOPIFY_STOREFRONT_TOKEN='test';process.env.REVALIDATE_TOKEN='chair-test';
  global.fetch=async(url,options)=>{
    if(!String(url).includes('chairs.test'))return realFetch(url,options);
    const {query,variables}=JSON.parse(options.body);
    if(query.includes('query GetProduct('))return Response.json({data:{product:node(1)}});
    assert.match(query,/query ChairCatalog/);reads++;
    if(fail)return new Response('offline',{status:503});
    const start=Number(variables.after||0),end=Math.min(start+50,65);
    return Response.json({data:{collection:{handle:'chaises',title:'Chaises',description:'',products:{edges:Array.from({length:end-start},(_,i)=>({node:node(start+i+1)})),pageInfo:{hasNextPage:end<65,endCursor:String(end)}}}}});
  };
  server=require('../server').listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{global.fetch=realFetch;await new Promise(r=>server.close(r));});
const seed=html=>JSON.parse(html.match(/id="chair-catalog-initial">([\s\S]*?)<\/script>/)[1]);
test('API calcule la sélection complète une fois et renvoie seulement la page demandée',async()=>{
  const a=await (await realFetch(base+'/api/catalog/chaises')).json();
  assert.equal(a.total,65);assert.equal(a.items.length,60);assert.equal(reads,2);
  const b=await (await realFetch(base+'/api/catalog/chaises?page=2')).json();
  assert.equal(b.items.length,5);assert.equal(reads,2);assert.equal(b.items[0].handle,'chaise-61');
  assert.equal(a.items[0].variants,undefined);assert.equal(a.items[0].matchedVariantId,'gid://shopify/ProductVariant/10');
});
test('le rendu serveur et le contrôleur utilisent les mêmes filtres ; liens paginés explorables',async()=>{
  const html=await (await realFetch(base+'/collections/chaises')).text();
  const data=seed(html);
  assert.equal(data.total,65);assert.equal((html.match(/class="pcard"/g)||[]).length,60);
  assert.match(html,/src="\/chair-catalog.js"/);assert.doesNotMatch(html,/walkCatalog/);
  assert.match(html,/href="\/collections\/chaises\?page=2#grille"/);
  assert.match(html,/aria-label="Filtrer les chaises"/);
  assert.match(html,/variant=10/);
  const page2=await (await realFetch(base+'/collections/chaises?page=2')).text();
  assert.equal(seed(page2).items.length,5);assert.match(page2,/data-chair-continuation/);
  assert.doesNotMatch(page2,/<section class="subhero/);
  assert.match(page2,/<link rel="canonical" href="https:\/\/www.mikadodeco.be\/collections\/chaises\?page=2"/);
});
test('les filtres serveur combinent la marque, la couleur et le prix exact de la variante',async()=>{
  const html=await (await realFetch(base+'/collections/chaises?brand=hay&color=noir&min=700&max=701')).text();
  const data=seed(html);assert.equal(data.total,33);
  assert.ok(data.items.every(p=>p.brand==='HAY'&&p.price===700.95&&p.image.includes('noir')));
  assert.match(html,/700,95/);assert.match(html,/content="noindex,follow"/);
  assert.match(html,/returnTo=[^"\s]*color/);
  const empty=await (await realFetch(base+'/api/catalog/chaises?brand=hay&color=noir&max=500')).json();assert.equal(empty.total,0);
});
test('la fiche rend dès le serveur le prix et la photo demandés sans modifier le produit en cache',async()=>{
  const selected=await (await realFetch(base+'/produit.html?handle=chaise-1&variant=11')).text();
  assert.match(selected,/<div class="pdp__price">700,95\s*€<\/div>/);
  assert.match(selected,/<img class="pdp__main" src="[^\"]*1-noir\.jpg/);
  const standard=await (await realFetch(base+'/produit.html?handle=chaise-1')).text();
  assert.match(standard,/<div class="pdp__price">À partir de 400\s*€<\/div>/);
});
test('un échec amont reste une erreur et un nouvel essai recharge les données',async()=>{
  await realFetch(base+'/api/revalidate',{method:'POST',headers:{Authorization:'Bearer chair-test'}});
  fail=true;
  const error=await realFetch(base+'/api/catalog/chaises');assert.equal(error.status,503);
  const page=await realFetch(base+'/collections/chaises?color=noir');assert.equal(page.status,503);assert.match(await page.text(),/Impossible de charger les chaises/);
  fail=false;
  const retry=await realFetch(base+'/api/catalog/chaises');assert.equal(retry.status,200);assert.equal((await retry.json()).total,65);
});
test('le retour de fiche conserve chaque filtre et la variante sans accepter une URL externe',async()=>{
  const {productHref,sourceSelection}=await import('../v3/navigation.mjs');
  const source='/collections/chaises?brand=hay,vitra&color=noir&material=bois&usage=interieur&min=500&max=900&stock=1&feature=empilable&page=2';
  const href=productHref({handle:'chaise-1',matchedVariantId:'gid://shopify/ProductVariant/11'},source);
  const url=new URL(href,base);assert.equal(url.searchParams.get('variant'),'11');
  const back=new URL(sourceSelection(url),base),expected=new URL(source,base);
  assert.equal(back.pathname,expected.pathname);assert.equal(back.hash,'#product-chaise-1');
  assert.deepEqual([...back.searchParams].sort(),[...expected.searchParams].sort());
  assert.equal(sourceSelection(new URL('/produit.html?returnTo=https://example.com',base)),'');
});
