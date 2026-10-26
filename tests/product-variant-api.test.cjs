const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const realFetch=global.fetch;
let server,base;
const blue='https://cdn.shopify.com/blue.png?v=1';
const orange='https://cdn.shopify.com/orange.png?v=2';
const product={id:'gid://shopify/Product/100',handle:'cover-selection',title:'Lampe',vendor:'Test',productType:'lampe',description:'Lampe test',tags:[],availableForSale:true,totalInventory:3,
 featuredImage:{url:orange},images:{edges:[{node:{url:orange}},{node:{url:blue}}]},collections:{edges:[]},metafields:[],
 priceRange:{minVariantPrice:{amount:'189'},maxVariantPrice:{amount:'209'}},variants:{edges:[
 {node:{id:'gid://shopify/ProductVariant/1',title:'Blue',price:{amount:'209'},quantityAvailable:1,availableForSale:true,image:{url:blue},selectedOptions:[]}},
 {node:{id:'gid://shopify/ProductVariant/2',title:'Orange',price:{amount:'189'},quantityAvailable:2,availableForSale:true,image:{url:orange},selectedOptions:[]}}
 ]}};
before(async()=>{
 process.env.SHOPIFY_STORE_DOMAIN='variants.test';process.env.SHOPIFY_STOREFRONT_TOKEN='test';
 global.fetch=async(url,options)=>{
  if(!String(url).includes('variants.test'))return realFetch(url,options);
  const {query}=JSON.parse(options.body);
  if(/query ProductRecommendations\(/.test(query))return Response.json({data:{complementary:[],related:[],rangeCollections:[],search:{nodes:[]}}});
  assert.match(query,/query GetProduct\(/);
  return Response.json({data:{product}});
 };
 server=require('../server').listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{global.fetch=realFetch;await new Promise(r=>server.close(r));});
test('API selection, selected price and cover agree without reordering variants',async()=>{
 const data=await(await realFetch(base+'/api/product/cover-selection')).json();
 assert.equal(data.variantId,'gid://shopify/ProductVariant/2');assert.equal(data.price,189);
 assert.deepEqual(data.variants.map(v=>v.id),['gid://shopify/ProductVariant/1','gid://shopify/ProductVariant/2']);
});
const pageScript=require('node:fs').readFileSync(require('node:path').join(__dirname,'../v3/pages/produit.js'),'utf8');
test('SSR starts on the same cover variant, explicit and invalid URLs follow the shared rule',async()=>{
 for(const [query,expected] of [['',orange],['&variant=1',blue],['&variant=unknown',orange]]){
  const html=await(await realFetch(base+'/produit.html?handle=cover-selection'+query,{headers:{Accept:'text/html'}})).text();
  const main=html.match(/<img class="pdp__main" data-main src="([^"]+)"/);
  assert.ok(main,'server-rendered image');assert.ok(main[1].startsWith(expected));
  // Le script de page est externe depuis la phase 3.2 : la page le référence, et c'est lui qui importe la règle partagée.
  assert.match(html,/<script type="module" src="\/pages\/produit\.js"><\/script>/);
  assert.match(pageScript,/import "\/product-variant.js"/);
 }
});
test('aperçu de partage : type produit, image 1200×630 sur fond blanc, prix ; photo carrée gardée pour les données structurées',async()=>{
 const html=await(await realFetch(base+'/produit.html?handle=cover-selection',{headers:{Accept:'text/html'}})).text();
 assert.match(html,/<meta property="og:type" content="product" \/>/);
 const og=html.match(/<meta property="og:image" content="([^"]+)"/)[1];
 assert.match(og,/width=1200&amp;height=630&amp;pad_color=ffffff/);
 assert.match(html,/<meta property="og:image:width" content="1200" \/>\s+<meta property="og:image:height" content="630" \/>\s+<meta property="og:image:alt" content="[^"]+" \/>/);
 assert.match(html,/<meta property="product:price:amount" content="189" \/>\s*<meta property="product:price:currency" content="EUR" \/>/);
 const ld=JSON.parse(html.match(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema\.org","@type":"Product"[\s\S]*?)<\/script>/)[1]);
 assert.doesNotMatch(ld.image,/pad_color/);
});
test('barre d’adresse : la fiche retire ?from= et ?returnTo= et garde le fil d’arrivée dans l’historique',()=>{
 assert.match(pageScript,/history\.replaceState\(\{ \.\.\.history\.state, mikadoArrival:/);
 assert.match(pageScript,/for \(const key of \["handle", "id", "variant"\]\)/);
 assert.match(pageScript,/paintBreadcrumb\(productTrail\(p, arrival, nav\), sourceSelection\(arrival\)\)/);
});
