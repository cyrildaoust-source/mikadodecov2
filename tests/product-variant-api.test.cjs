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
  const {query}=JSON.parse(options.body);assert.match(query,/query GetProduct\(/);
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
test('SSR starts on the same cover variant, explicit and invalid URLs follow the shared rule',async()=>{
 for(const [query,expected] of [['',orange],['&variant=1',blue],['&variant=unknown',orange]]){
  const html=await(await realFetch(base+'/produit.html?handle=cover-selection'+query,{headers:{Accept:'text/html'}})).text();
  const main=html.match(/<img class="pdp__main" data-main src="([^"]+)"/);
  assert.ok(main,'server-rendered image');assert.ok(main[1].startsWith(expected));
  assert.match(html,/import "\/product-variant.js"/);
 }
});
