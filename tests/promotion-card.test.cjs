const test = require('node:test');
const assert = require('node:assert/strict');
const { promotionCard } = require('../lib/promotion-card');
const variant = (id,extra={}) => ({id:`gid://shopify/ProductVariant/${id}`,price:200,compareAtPrice:null,available:true,qty:0,title:'Blanc',options:[{name:'Couleur',value:'Blanc'}],image:`https://cdn.shopify.com/${id}.jpg`,...extra});
const regular=variant(1), sold=variant(2,{price:100,compareAtPrice:200,available:false}), sale=variant(3,{price:100,compareAtPrice:200,qty:2,title:'Bleu Acapulco',options:[{name:'Couleur',value:'Bleu Acapulco'}]});
const product={id:'p',handle:'chaise',name:'Chaise',price:200,priceMin:100,priceMax:200,image:regular.image,image2:sold.image,images:[regular.image,sold.image,'https://cdn.shopify.com/ambiance.jpg'],variants:[regular,sold,sale]};
test('la finition remisée disponible fournit prix, photo, lien et bouton',async()=>{
 const card=promotionCard(product);
 assert.equal(card.variantId,sale.id);assert.equal(card.matchedVariantId,sale.id);
 assert.equal(card.price,100);assert.equal(card.compareAt,200);assert.equal(card.priceIsExact,true);
 assert.equal(card.finishLabel,'Bleu Acapulco');assert.equal(card.image,sale.image);
 assert.match(card.image2,/ambiance/);assert.equal(card.availabilityLabel,'En stock');
 const {productCardHTML}=await import('../v3/product-card.mjs');const html=productCardHTML(card);
 assert.match(html,/variant=3/);assert.match(html,/data-variant="gid:\/\/shopify\/ProductVariant\/3"/);assert.match(html,/−50%/);
 assert.equal(product.price,200);
});
test('une remise épuisée ne rend pas achetable une finition au prix normal',()=>{
 const card=promotionCard({...product,variants:[regular,sold]});
 assert.equal(card.variantId,sold.id);assert.equal(card.purchaseDisabled,true);assert.equal(card.availabilityLabel,'Indisponible');
});
test('les offres conditionnelles au panier restent inchangées',()=>{
 const panton={...product,variants:[regular],compareAt:null};assert.equal(promotionCard(panton),panton);
});
