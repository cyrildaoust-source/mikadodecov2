import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productCardHTML} from '../v3/product-card.mjs';

const product = {handle:'table', name:'Table <test>', brand:'A & B', image:'/table.jpg', image2:'/detail.jpg',
  price:500, priceMin:400, priceMax:700, priceIsExact:true, variantId:'gid://shopify/ProductVariant/12',
  finishLabel:'Noir · Avec les allonges', availabilityLabel:'Sur commande', inStock:false,
  variantOptions:[{name:'Couleur',count:3}]};

test('server and browser share the exact visible product facts and contextual links',()=>{
  const options={source:'/produits.html?q=table+noire'};
  const server=productCardHTML(product,{...options,interactive:false});
  const browser=productCardHTML(product,options);
  assert.equal(browser.replace(/<button[\s\S]*?<\/button>/,''),server);
  assert.match(server,/Table &lt;test&gt;/);
  assert.match(server,/A &amp; B/);
  assert.match(server,/Noir · Avec les allonges/);
  assert.match(server,/3 finitions/);
  assert.match(server,/500/);
  assert.doesNotMatch(server,/À partir de|data-add/);
  assert.match(server,/returnTo=/);
  assert.match(server,/class="alt"/);
});

test('selection controls preserve disabled state and saved cart quantity',()=>{
  assert.match(productCardHTML(product,{quantity:2}),/Dans la sélection \(2\)/);
  const html=productCardHTML({...product,purchaseDisabled:true});
  assert.match(html,/data-add\s+disabled/);
  assert.match(html,/Indisponible/);
});
