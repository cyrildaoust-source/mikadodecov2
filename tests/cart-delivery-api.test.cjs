const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const realFetch = global.fetch;
let server, base, captured, available = 1, failStock = false;
const id = 'gid://shopify/ProductVariant/1';
before(async () => {
  process.env.SHOPIFY_STORE_DOMAIN = 'delivery.test';
  process.env.SHOPIFY_STOREFRONT_TOKEN = 'test';
  global.fetch = async (url, options) => {
    if (!String(url).includes('delivery.test')) return realFetch(url, options);
    const { query, variables } = JSON.parse(options.body);
    if (query.includes('query CartStock')) {
      if (failStock) return Response.json({errors:[{message:'inventory unavailable'}]});
      return Response.json({data:{nodes:[{id,quantityAvailable:available,requiresShipping:true}]}});
    }
    assert.match(query, /mutation CartCreate/);
    captured = variables;
    return Response.json({data:{cartCreate:{cart:{checkoutUrl:'https://delivery.test/checkouts/test'},userErrors:[]}}});
  };
  server = require('../server').listen(0, '127.0.0.1');
  await new Promise(r => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { global.fetch = realFetch; await new Promise(r => server.close(r)); });
const post = (route, body) => realFetch(base + route, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
test('checkout uses fresh server inventory and ignores fabricated client ETA and stale project text', async () => {
  available = 0;
  const response = await post('/api/cart/create', { items:[{variantId:id,qty:2,gift:'offer',inStock:true,delivery:'1 jour'}], customer:{projet:'Livraison: À confirmer au paiement'} });
  assert.equal(response.status, 200);
  assert.match(captured.note, /3–4 semaines/);
  assert.doesNotMatch(captured.note, /Projet:|À confirmer/);
  assert.equal(captured.lines[0].quantity, 2);
  assert.deepEqual(captured.lines[0].attributes, [{key:'_gift',value:'offer'},{key:'Délai estimé',value:'3–4 semaines'}]);
  assert.equal(captured.attributes.find(a => a.key === 'Délai estimé').value, '3–4 semaines');
});
test('preview reflects exact quantities and refreshed availability', async () => {
  available = 2;
  for (const [qty, label] of [[2,'1–2 jours'],[3,'3–4 semaines']]) {
    const response = await post('/api/cart/delivery',{items:[{variantId:id,qty}]});
    assert.equal(response.status, 200);
    assert.equal((await response.json()).label, label);
  }
});
test('stock query failure cannot silently create a cart with a false promise', async () => {
  captured = null; failStock = true;
  const response = await post('/api/cart/create',{items:[{variantId:id,qty:1}]});
  assert.equal(response.status, 500);
  assert.equal(captured, null);
  failStock = false;
});
