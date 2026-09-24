const { test } = require('node:test');
const assert = require('node:assert/strict');
const { promotionVariantCard } = require('../lib/promotion-variants');
const { selectInitialVariant } = require('../v3/product-variant');
const variant = (id, price, was, extra = {}) => ({ id: `gid://shopify/ProductVariant/${id}`, title: 'Finition ' + id,
  price, compareAtPrice: was, available: true, qty: 0, image: `https://cdn.shopify.com/${id}.jpg?width=1400`, ...extra });
function product(variants) {
  return { id:'gid://shopify/Product/1', handle:'chaise-test', name:'Chaise', price:100, priceMin:100, priceMax:300,
    variantId:variants[0].id, image:variants[0].image, image2:variants[1]?.image,
    images:[...variants.map(v=>v.image),'https://cdn.shopify.com/ambiance.jpg'], inStock:true, variants };
}

test('a discounted finish carries its own price, image, stock, cart ID and PDP link, without changing the source', async () => {
  const original = product([variant(1,100,null),variant(2,200,250,{qty:2,title:'Bleu acapulco'})]);
  const snapshot = JSON.stringify(original);
  const card = promotionVariantCard(original);
  assert.equal(card.variantId,original.variants[1].id);
  assert.equal(card.matchedVariantId,card.variantId);
  assert.equal(card.price,200); assert.equal(card.priceMin,200); assert.equal(card.priceMax,200);
  assert.equal(card.compareAt,250); assert.equal(card.priceIsExact,true);
  assert.equal(card.finishLabel,'Bleu acapulco'); assert.equal(card.availabilityLabel,'En stock');
  assert.match(card.image,/\/2\.jpg\?width=600/); assert.match(card.image2,/ambiance\.jpg/);
  assert.equal(JSON.stringify(original),snapshot);
  const {productCardHTML}=await import('../v3/product-card.mjs');
  const {productHref,sourceSelection}=await import('../v3/navigation.mjs');
  const source='/collections/promotions?brand=fermob&sort=asc&page=2';
  const url=new URL(productHref(card,source),'https://www.mikadodeco.be');
  assert.equal(url.searchParams.get('variant'),'2');
  assert.equal(sourceSelection(url),source+'#product-chaise-test');
  const selected=selectInitialVariant(original.variants,{requestedId:url.searchParams.get('variant'),coverUrl:original.image});
  assert.equal(selected.price,card.price);assert.equal(selected.compareAtPrice,card.compareAt);
  for(const interactive of [true,false]) {
    const html=productCardHTML(card,{source,interactive});
    assert.match(html,/variant=2/);assert.match(html,/Bleu acapulco/);assert.match(html,/−20%/);
    assert.doesNotMatch(html,/À partir de/);
    if(interactive) assert.match(html,/data-variant="gid:\/\/shopify\/ProductVariant\/2"/);
  }
});

test('available discounted stock wins; a cheaper unavailable finish and the full-price cover cannot win', () => {
  const p=product([variant(1,1,null,{qty:20}),variant(2,50,100,{available:false,qty:0}),variant(3,70,100),variant(4,80,100,{qty:2})]);
  assert.equal(promotionVariantCard(p).variantId,p.variants[3].id);
  p.variants[3].qty=0;
  assert.equal(promotionVariantCard(p).variantId,p.variants[2].id);
  p.variants[2].qty=null;
  assert.equal(promotionVariantCard(p).inStock,false,'stock elsewhere on the model must not become this finish’s stock');
});

test('ties retain the editorial variant and then use a stable ID independent of API order', () => {
  const p=product([variant(1,80,100),variant(2,80,100)]);
  p.variantId=p.variants[1].id;
  assert.equal(promotionVariantCard(p).variantId,p.variants[1].id);
  p.variantId='missing';
  const before=promotionVariantCard(p);p.variants.reverse();
  assert.equal(promotionVariantCard(p).variantId,before.variantId);
});

test('unavailable discounts cannot be purchased and other finishes never become hover photos', () => {
  const p=product([variant(1,100,null),variant(2,50,100,{available:false})]);p.images=p.variants.map(v=>v.image);
  const card=promotionVariantCard(p);
  assert.equal(card.purchaseDisabled,true);assert.equal(card.availabilityLabel,'Indisponible');
  assert.equal(card.image2,null);
});

test('conditional offers, regular prices and invalid amounts do not invent a discounted variant', () => {
  for(const variants of [[],[variant(1,100,null)],[variant(1,100,100)],[variant(1,100,50)],[variant(1,NaN,100)]]) {
    const p=variants.length?product(variants):{variants};assert.equal(promotionVariantCard(p),p);
  }
});

test('exact discounts keep cents and zero-price variants in the shared price renderer', async () => {
  const {productCardHTML}=await import('../v3/product-card.mjs');
  for(const [price,was] of [[9.75,10],[0,10]]) {
    const p=product([variant(1,20,null),variant(2,price,was)]);
    const html=productCardHTML(promotionVariantCard(p));
    assert.match(html,/price-was/);assert.match(html,/price-now--sale/);
    assert.match(html,/variant=2/);
  }
});
