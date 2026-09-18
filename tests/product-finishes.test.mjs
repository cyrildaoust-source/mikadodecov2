import {test} from 'node:test';
import assert from 'node:assert/strict';
import {finishHTML,selectCardFinish} from '../v3/product-finishes.mjs';
import {productHref} from '../v3/navigation.mjs';

test('changer de finition conserve la fiche et le retour filtré, remplace prix, image et disponibilité ensemble',()=>{
  const p={handle:'chaise-69',name:'Chaise 69',variantId:'gid://shopify/ProductVariant/1',matchedVariantId:'gid://shopify/ProductVariant/1',price:534,finishLabel:'Blanc',finishCount:2,finishChoices:[
    {variantId:'gid://shopify/ProductVariant/1',matchedVariantId:'gid://shopify/ProductVariant/1',finishLabel:'Blanc',price:534,image:'https://cdn.shopify.com/white.jpg'},
    {variantId:'gid://shopify/ProductVariant/2',matchedVariantId:'gid://shopify/ProductVariant/2',finishLabel:'Bouleau / blanc',price:510,priceIsExact:true,image:'https://cdn.shopify.com/mixed.jpg',image2:'https://cdn.shopify.com/scene.jpg',availabilityLabel:'En stock',inStock:true,purchaseDisabled:false}]};
  const selected=selectCardFinish(p,p.finishChoices[1].variantId);
  assert.equal(selected.price,510);assert.equal(selected.image,'https://cdn.shopify.com/mixed.jpg');assert.equal(selected.inStock,true);
  assert.equal(selected.image2,'https://cdn.shopify.com/scene.jpg');
  assert.equal(p.price,534);assert.equal(selectCardFinish(p,'absent'),p);
  const href=id=>productHref(selected,'/collections/chaises?brand=artek&color=blanc',id);
  const html=finishHTML(selected,href);
  assert.match(html,/variant=2/);assert.match(html,/aria-current="true"/);assert.match(html,/color%3Dblanc/);assert.match(html,/width=88/);
  assert.equal((html.match(/aria-current=/g)||[]).length,1);
});
test('les libellés sont échappés et une URL de photo non approuvée ne devient pas une vignette',()=>{
  const p={handle:'chair',name:'<script>',finishLabel:'Blanc " & <',finishChoices:[{variantId:'1',finishLabel:'" onmouseover="alert(1)',image:'javascript:alert(1)'},{variantId:'2',finishLabel:'Blanc',image:'https://cdn.shopify.com/white.jpg'}]};
  const html=finishHTML(p,id=>'/produit.html?variant='+id);
  assert.doesNotMatch(html,/<script>|javascript:|onmouseover=/);assert.match(html,/&lt;/);assert.match(html,/&quot;/);
  assert.equal(finishHTML({name:'Legacy'},()=>''),'');
});
