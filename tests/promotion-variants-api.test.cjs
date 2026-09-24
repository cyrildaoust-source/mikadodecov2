const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const realFetch=global.fetch;
let server,base;
const makeProduct=id=>({id:`gid://shopify/Product/${id}`,handle:`promo-${id}`,title:'Chaise test',vendor:'Fermob',productType:'chaise',description:'',tags:['promotion'],
 availableForSale:true,totalInventory:4,metafields:[],collections:{edges:[{node:{handle:'promotions'}}]},
 featuredImage:{url:'https://cdn.shopify.com/normal.jpg'},images:{edges:[{node:{url:'https://cdn.shopify.com/normal.jpg'}},{node:{url:'https://cdn.shopify.com/promo.jpg'}}]},
 priceRange:{minVariantPrice:{amount:'119.5'},maxVariantPrice:{amount:'239'}},compareAtPriceRange:{minVariantPrice:{amount:'0'}},
 variants:{edges:[
  {node:{id:`gid://shopify/ProductVariant/${id}1`,title:'Noir',price:{amount:'239'},availableForSale:true,quantityAvailable:2,image:{url:'https://cdn.shopify.com/normal.jpg'},selectedOptions:[]}},
  {node:{id:`gid://shopify/ProductVariant/${id}2`,title:'Bleu acapulco',price:{amount:'119.5'},compareAtPrice:{amount:'239'},availableForSale:true,quantityAvailable:2,image:{url:'https://cdn.shopify.com/promo.jpg'},selectedOptions:[]}}
 ]}});
before(async()=>{
 process.env.SHOPIFY_STORE_DOMAIN='promo-variants.test';process.env.SHOPIFY_STOREFRONT_TOKEN='test';
 global.fetch=async(url,options)=>{
  assert.equal(new URL(url).hostname,'promo-variants.test');
  const {query,variables}=JSON.parse(options.body);
  if(/query GetCollectionProducts/.test(query)) {
   assert.match(query,/quantityAvailable/);
   return Response.json({data:{collection:{title:'Promotions',description:'',products:{edges:[{node:makeProduct(variables.after?2:1)}],pageInfo:{hasNextPage:!variables.after,endCursor:variables.after?null:'next'}}}}});
  }
  if(/query GetProducts/.test(query))return Response.json({data:{products:{edges:[],pageInfo:{hasNextPage:false,endCursor:null}}}});
  if(/mutation Cart(?:Create|Preview)/.test(query))return Response.json({data:{cartCreate:{cart:{discountAllocations:[],lines:{edges:[]}}}}});
  if(/query GetCollections/.test(query))return Response.json({data:{collections:{edges:[{node:{id:'gid://shopify/Collection/1',handle:'promotions',title:'Promotions'}}]}}});
  if(/query GetProduct\(/.test(query))return Response.json({data:{product:makeProduct(1)}});
  throw Error('Unexpected operation '+query.slice(0,80));
 };
 server=require('../server').listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{global.fetch=realFetch;await new Promise(r=>server.close(r));});

test('every promotions API page carries the exact discounted finish, preserving pagination',async()=>{
 for(const [suffix,id,next]of [['',1,true],['&cursor=next',2,false]]){
  const r=await realFetch(base+'/api/collection/promotions/products?limit=1'+suffix);assert.equal(r.status,200);
  const data=await r.json(),p=data.items[0];
  assert.equal(p.matchedVariantId,`gid://shopify/ProductVariant/${id}2`);
  assert.equal(p.price,119.5);assert.equal(p.compareAt,239);assert.equal(p.priceMin,119.5);assert.equal(p.priceMax,119.5);
  assert.equal(p.finishLabel,'Bleu acapulco');assert.equal(p.availabilityLabel,'En stock');
  assert.equal(data.pageInfo.hasNextPage,next);
 }
});
test('SSR card and destination PDP agree before JavaScript; the ordinary PDP keeps its normal cover',async()=>{
 const html=await(await realFetch(base+'/collections/promotions',{headers:{Accept:'text/html'}})).text();
 const href=html.match(/class="pcard__media" href="([^"]+)"/)[1].replaceAll('&amp;','&');
 assert.match(href,/variant=12/);assert.match(html,/Bleu acapulco/);assert.match(html,/−50%/);
 const pdp=await(await realFetch(base+href,{headers:{Accept:'text/html'}})).text();
 assert.match(pdp,/<img class="pdp__main" src="[^"]*promo\.jpg/);
 assert.match(pdp,/<span class="price-was">239\s*€<\/span><span class="price-now price-now--sale">119,50\s*€<\/span>/);
 const normal=await(await realFetch(base+'/produit.html?handle=promo-1',{headers:{Accept:'text/html'}})).text();
 assert.match(normal,/<img class="pdp__main" src="[^"]*normal\.jpg/);
 assert.match(normal,/<div class="pdp__price">239\s*€<\/div>/);
});

test('product JSON-LD describes the displayed variant: sale price, strikethrough price and stock',async()=>{
 const ld=async path=>JSON.parse((await(await realFetch(base+path,{headers:{Accept:'text/html'}})).text()).match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]).offers;
 const sale=await ld('/produit.html?handle=promo-1&variant=12');
 assert.equal(sale.price,'119.5');assert.equal(sale.availability,'https://schema.org/InStock');
 assert.deepEqual(sale.priceSpecification,{'@type':'UnitPriceSpecification',priceType:'https://schema.org/StrikethroughPrice',price:'239',priceCurrency:'EUR'});
 const normal=await ld('/produit.html?handle=promo-1');
 assert.equal(normal.price,'239');assert.equal(normal.priceSpecification,undefined);
});
