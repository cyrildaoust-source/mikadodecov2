const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const realFetch=global.fetch;
let calls=0,script=[];
before(()=>{
  process.env.SHOPIFY_STORE_DOMAIN='client.test';process.env.SHOPIFY_STOREFRONT_TOKEN='test';
  global.fetch=async()=>{calls++;const next=script.shift();if(next instanceof Error)throw next;return next;};
});
after(()=>{global.fetch=realFetch;});
const {shopifyFetch}=require('../lib/shopify/client');
const ok=data=>Response.json({data});
test('une lecture est réessayée après une coupure réseau, un 5xx ou une limitation',async()=>{
  calls=0;script=[new TypeError('fetch failed'),new Response('busy',{status:503}),ok({shop:{name:'Mikado'}})];
  assert.deepEqual(await shopifyFetch('query Shop { shop { name } }'),{shop:{name:'Mikado'}});
  assert.equal(calls,3);
  calls=0;script=[Response.json({errors:[{message:'Throttled',extensions:{code:'THROTTLED'}}]}),ok({x:1})];
  assert.deepEqual(await shopifyFetch('query X { x }'),{x:1});assert.equal(calls,2);
});
test('au-delà de deux nouvelles tentatives, ou pour une erreur définitive, l’échec remonte',async()=>{
  calls=0;script=[new TypeError('fetch failed'),new TypeError('fetch failed'),new TypeError('fetch failed')];
  await assert.rejects(shopifyFetch('query X { x }'),/fetch failed/);assert.equal(calls,3);
  calls=0;script=[new Response('nope',{status:401})];
  await assert.rejects(shopifyFetch('query X { x }'),/Shopify API 401/);assert.equal(calls,1);
  calls=0;script=[Response.json({errors:[{message:'Field missing'}]})];
  await assert.rejects(shopifyFetch('query X { x }'),/Field missing/);assert.equal(calls,1);
});
test('une mutation n’est jamais rejouée',async()=>{
  calls=0;script=[new TypeError('fetch failed')];
  await assert.rejects(shopifyFetch('mutation NewsletterCreate($input: CustomerInput!) { customerCreate(input: $input) { customer { id } } }'),/fetch failed/);
  assert.equal(calls,1);
});
