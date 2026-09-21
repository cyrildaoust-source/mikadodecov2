import {test} from 'node:test';
import assert from 'node:assert/strict';
import {finishHTML} from '../v3/product-finishes.mjs';

test('la carte conserve le libellé sans afficher de vignettes ni leur emplacement vide',()=>{
  const p={handle:'chaise-69',name:'Chaise 69',variantId:'gid://shopify/ProductVariant/1',matchedVariantId:'gid://shopify/ProductVariant/1',price:534,finishLabel:'Blanc',finishCount:2,finishChoices:[
    {variantId:'gid://shopify/ProductVariant/1',matchedVariantId:'gid://shopify/ProductVariant/1',finishLabel:'Blanc',price:534,image:'https://cdn.shopify.com/white.jpg'},
    {variantId:'gid://shopify/ProductVariant/2',matchedVariantId:'gid://shopify/ProductVariant/2',finishLabel:'Bouleau / blanc',price:510,priceIsExact:true,image:'https://cdn.shopify.com/mixed.jpg',image2:'https://cdn.shopify.com/scene.jpg',availabilityLabel:'En stock',inStock:true,purchaseDisabled:false}]};
  for (const choices of [p.finishChoices, p.finishChoices.slice(0,1), []]) {
    const html=finishHTML({...p,finishChoices:choices});
    assert.match(html,/class="pcard__finish-label"[^>]*>Blanc<\/div>/);
    assert.doesNotMatch(html,/<img|<a\b|data-card-finish|class="pcard__finishes"|pcard__finish-more/);
  }
});
test('le libellé reste échappé et les cartes sans finition ne reçoivent aucun contenu',()=>{
  const p={handle:'chair',name:'<script>',finishLabel:'Blanc " & <',finishChoices:[{variantId:'1',finishLabel:'" onmouseover="alert(1)',image:'javascript:alert(1)'},{variantId:'2',finishLabel:'Blanc',image:'https://cdn.shopify.com/white.jpg'}]};
  const html=finishHTML(p);
  assert.doesNotMatch(html,/<script>|javascript:|onmouseover=/);assert.match(html,/&lt;/);assert.match(html,/&quot;/);
  assert.equal(finishHTML({name:'Legacy'}),'');
});
