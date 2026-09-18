const {test}=require('node:test');
const assert=require('node:assert/strict');
const {buildFilterProduct,filterCatalog,parseFilters,filterParams,colors,measure,slug}=require('../lib/catalog-filters');
const {readChairCatalog}=require('../lib/chair-catalog');
const field=(key,value)=>({namespace:'custom',key,type:'single_line_text_field',value});
function chair(id, variants, extra={}) {
  const vs=variants.map((v,i)=>({id:`gid://shopify/ProductVariant/${id*100+i}`,price:500,available:true,qty:0,image:`https://cdn.shopify.com/${id}-${i}.jpg`,options:[{name:'Couleur',value:'Noir'}],...v}));
  const card={id:String(id),handle:`chaise-${id}`,name:`Chaise ${id}`,brand:'HAY',material:'Bois',image:'https://cdn.shopify.com/main.jpg',tags:[],variants:vs,...extra.card};
  return buildFilterProduct({tags:card.tags,filterMetafields:[field('usage','Intérieur'),...(extra.fields||[])],variants:{edges:vs.map(v=>({node:{...v,selectedOptions:v.options,filterMetafields:v.filterMetafields||[]}}))}},card);
}
test('couleur, prix et stock doivent correspondre à la même variante ; carte et lien suivent son prix exact',()=>{
  const p=chair(1,[{price:400,qty:2,options:[{name:'Couleur',value:'Beige'}]},{price:700.95,qty:0}]);
  assert.equal(filterCatalog([p],{color:'noir',max:'500'}).total,0);
  assert.equal(filterCatalog([p],{color:'noir',stock:'1'}).total,0);
  const hit=filterCatalog([p],{color:'noir',min:'700',max:'701'}).items[0];
  assert.equal(hit.price,700.95);assert.equal(hit.priceMin,700.95);assert.equal(hit.priceMax,700.95);
  assert.equal(hit.matchedVariantId,p.variants[1].id);assert.equal(hit.variantId,p.variants[1].id);
  assert.equal(hit.image,p.variants[1].image);assert.equal(hit.image2,null);assert.equal(hit.availabilityLabel,'Sur commande');
  assert.equal(hit.variants,undefined,'la liste complète de variantes reste sur le serveur');
});
test('les matières proposées par les options restent liées à la variante choisie',()=>{
  const p=chair(1,[{price:400,options:[{name:'Matière',value:'Bois'},{name:'Couleur',value:'Blanc'}]},{price:700,options:[{name:'Matière',value:'Métal'},{name:'Couleur',value:'Noir'}]}],{card:{material:'Bois ou métal'}});
  assert.equal(filterCatalog([p],{material:'metal',max:'500'}).total,0);
  assert.equal(filterCatalog([p],{material:'bois',color:'noir'}).total,0);
  assert.equal(filterCatalog([p],{material:'metal',color:'noir'}).total,1);
});
test('le survol garde une vue du modèle après filtrage et pour chaque finition proposée',()=>{
  const scene='https://cdn.shopify.com/scene.jpg?v=4&width=1400&format=webp';
  const p=chair(1,[{options:[{name:'Couleur',value:'Blanc'}]},{options:[{name:'Couleur',value:'Noir'}]}],{card:{image2:scene,images:[scene]}});
  const hit=filterCatalog([p],{color:'blanc'}).items[0];
  assert.equal(hit.image,p.variants[0].image);
  assert.equal(hit.image2,'https://cdn.shopify.com/scene.jpg?v=4&width=600&format=webp');
  assert.equal(hit.variantId,p.variants[0].id);assert.equal(hit.price,p.variants[0].price);
  const all=filterCatalog([p],{}).items[0];
  assert.ok(all.finishChoices.every(v=>v.image2===hit.image2));
});
test('le survol ignore les packshots des autres variantes et les doublons CDN',()=>{
  const white='https://cdn.shopify.com/white.jpg?v=1&width=1400';
  const black='https://cdn.shopify.com/black.jpg?v=1&width=1400';
  const p=chair(1,[{image:white,options:[{name:'Couleur',value:'Blanc'}]},{image:black}],{card:{
    image2:'https://cdn.shopify.com/black.jpg?v=2&width=600&format=webp',
    images:['https://cdn.shopify.com/white.jpg?v=2&width=600&format=webp',black,'https://cdn.shopify.com/detail.jpg'],
  }});
  const hit=filterCatalog([p],{color:'blanc'}).items[0];
  assert.equal(hit.image2,'https://cdn.shopify.com/detail.jpg?width=600&format=webp');
  p.card.images=[white,black];
  assert.equal(filterCatalog([p],{color:'blanc'}).items[0].image2,null);
});
test('la couleur choisit une finition représentative ; budget, stock et images restent sur la même variante',()=>{
  const finish=(value,price,extra={})=>({price,options:[{name:'Finition',value}],...extra});
  const p=chair(69,[finish('Bouleau',476),finish('Lamifié blanc',509),finish('Bouleau / laqué blanc',510),finish('Laqué blanc',534),finish('Laqué noir',534)],{card:{brand:'Artek',tags:['bouleau'],material:''}});
  const white=filterCatalog([p],{color:'blanc'}).items[0];
  assert.equal(white.finishLabel,'Laqué blanc');assert.equal(white.price,534);assert.equal(white.priceIsExact,true);
  assert.equal(white.variantId,p.variants[3].id);assert.equal(white.image,p.variants[3].image);
  assert.equal(white.finishChoices.length,3);assert.equal(white.finishCount,3);
  assert.ok(white.finishChoices.every(v=>v.finishLabel.includes('blanc')));
  assert.equal(filterCatalog([p],{color:'blanc',max:520}).items[0].finishLabel,'Lamifié blanc');
  assert.equal(filterCatalog([p],{color:'blanc',max:500}).total,0);
  assert.equal(filterCatalog([p],{color:'naturel'}).items[0].finishLabel,'Bouleau');
  assert.equal(filterCatalog([p],{color:'blanc',material:'bois'}).items[0].finishLabel,'Laqué blanc');
  const stocked=chair(70,[finish('Bouleau / laqué blanc',510,{qty:2}),finish('Laqué blanc',534)]);
  assert.equal(filterCatalog([stocked],{color:'blanc',stock:'1'}).items[0].price,510);
  const unavailable=chair(71,[finish('Bouleau / laqué blanc',510),finish('Laqué blanc',534,{available:false})]);
  assert.equal(filterCatalog([unavailable],{color:'blanc'}).items[0].price,510);
});
test('le tri suit le prix de la finition montrée, les aperçus sont bornés, les filtres restent stables',()=>{
  const a=chair(1,[{price:400,options:[{name:'Finition',value:'Bouleau / blanc'}]},{price:600,options:[{name:'Finition',value:'Blanc'}]}]);
  const b=chair(2,[{price:550,options:[{name:'Couleur',value:'Blanc'}]}]);
  assert.deepEqual(filterCatalog([a,b],{color:'blanc',sort:'asc'}).items.map(p=>p.price),[550,600]);
  assert.deepEqual(filterCatalog([a,b],{color:'blanc',sort:'desc'}).items.map(p=>p.price),[600,550]);
  const many=chair(3,Array.from({length:12},(_,i)=>({price:500+i,options:[{name:'Finition',value:'Blanc '+i}]})));
  const card=filterCatalog([many],{color:'blanc'}).items[0];
  assert.equal(card.finishChoices.length,4);assert.equal(card.finishCount,12);assert.equal(card.variantCount,12);
});
test('les couleurs des composants sont secondaires et une matière peinte ne devient pas du bois naturel',()=>{
  const p=chair(1,[{price:400,options:[{name:'Finition',value:'Bouleau / laqué blanc'}]},{price:500,options:[{name:'Finition',value:'Laqué blanc'}]}]);
  assert.equal(filterCatalog([p],{color:'blanc'}).items[0].price,500);
  assert.deepEqual(colors('Bouleau laqué blanc'),['blanc']);
  assert.deepEqual(colors('Bouleau'),['naturel']);
});
test('les options secondaires des patins ne deviennent pas des couleurs de chaise',()=>{
  const p=chair(1,[{options:[{name:'Couleur',value:'Blanc'},{name:'Patin',value:'Noir'}]}]);
  assert.equal(filterCatalog([p],{color:'noir'}).total,0);
  assert.deepEqual(colors('Pesto','Fermob'),['vert']);assert.deepEqual(colors('Pesto','Autre marque'),[]);
});
test('les marques scandinaves conservent les slugs de la navigation commune',async()=>{
  const {navigationSlug}=await import('../v3/navigation.mjs');
  for(const brand of ['Carl Hansen & Søn','&Tradition','Ferm Living','HAY','Møbel Æ'])assert.equal(slug(brand),navigationSlug(brand));
  assert.equal(filterCatalog([chair(1,[{}],{card:{brand:'Carl Hansen & Søn'}})],{brand:'carl-hansen-son'}).total,1);
});
test('absence et faux explicite sont distincts ; les négations ne deviennent pas des caractéristiques positives',()=>{
  const missing=chair(1,[{}]);
  const noArms=chair(2,[{}],{fields:[field('has_armrests','false')]});
  const arms=chair(3,[{}],{fields:[field('has_armrests','true'),field('stackable','true')]});
  assert.equal(filterCatalog([missing,noArms,arms],{feature:'sans-accoudoirs'}).total,1);
  assert.equal(filterCatalog([missing,noArms,arms],{feature:'accoudoirs,empilable'}).total,1);
  assert.equal(filterCatalog([missing],{feature:'empilable'}).total,0);
  const corrected=chair(4,[{}],{fields:[field('has_armrests','false'),field('stackable','false')],card:{tags:['accoudoirs','empilable']}});
  assert.equal(filterCatalog([corrected],{feature:'accoudoirs'}).total,0);
  assert.equal(filterCatalog([corrected],{feature:'empilable'}).total,0);
  const facets=filterCatalog([noArms,arms],{feature:'accoudoirs'}).facets.feature;
  assert.equal(facets.find(f=>f.value==='sans-accoudoirs').count,0);
});
test('les dimensions exactes prévalent ; un triplet sans légende ne fournit aucune hauteur d’assise',()=>{
  assert.equal(measure({},'seat_height_cm','44 × 49 × 80 cm'),null);
  assert.equal(measure({},'seat_height_cm','Largeur 48 cm ; hauteur d’assise 465 mm').value,46.5);
  assert.equal(measure({},'seat_height_cm','L 42 × P 50 × H 82 cm ; assise P 29 cm, H 46 cm').value,46);
  assert.equal(measure({'custom.seat_height_cm':field('seat_height_cm','45.5')},'seat_height_cm','hauteur d’assise 46 cm').value,45.5);
  assert.equal(measure({},'seat_height_cm','Hauteur d’assise 46 cm ou hauteur d’assise 65 cm'),null);
});
test('comptes de produits uniques, filtres et tri portent sur toutes les pages',()=>{
  const all=Array.from({length:125},(_,i)=>chair(i+1,[{price:200+i},{price:300+i}],{card:{brand:i%2?'HAY':'Vitra'}}));
  const first=filterCatalog(all,{sort:'desc'}),second=filterCatalog(all,{sort:'desc',page:'2'}),last=filterCatalog(all,{sort:'desc',page:'999'});
  assert.equal(first.total,125);assert.equal(first.totalPages,3);assert.equal(first.items.length,60);assert.equal(second.items.length,60);assert.equal(last.items.length,5);assert.equal(last.state.page,3);
  assert.equal(first.items[0].price,324);assert.equal(new Set([...first.items,...second.items].map(p=>p.id)).size,120);
  assert.equal(first.facets.color.find(v=>v.value==='noir').count,125);
  assert.equal(filterCatalog(all,{brand:'hay',min:'320'}).total,52);
});
test('les compteurs de couleur respectent le budget sur la même variante',()=>{
  const p=chair(1,[{price:400,options:[{name:'Couleur',value:'Beige'}]},{price:700}]);
  const result=filterCatalog([p],{max:'500',color:'noir'});
  assert.equal(result.total,0);
  assert.equal(result.facets.color.find(v=>v.value==='beige').count,1);
  assert.equal(result.facets.color.find(v=>v.value==='noir').count,0);
});
test('les paramètres sont bornés, normalisés et conservés sans URL ou script arbitraire',()=>{
  const state=parseFilters(new URLSearchParams('color=noir&color=blanc&min=800&max=400&page=-9&stock=1&feature=%3Cscript%3E'));
  assert.deepEqual(state.color,['noir','blanc']);assert.equal(state.min,400);assert.equal(state.max,800);assert.equal(state.page,1);assert.deepEqual(state.feature,[]);
  assert.equal(filterParams(state).get('color'),'noir,blanc');assert.equal(filterParams(state).get('stock'),'1');
});
test('le parcours serveur refuse les lots incomplets, suit toutes les variantes et déduplique les produits',async()=>{
  const raw={id:'1',variants:{edges:[{node:{id:'a'}}],pageInfo:{hasNextPage:true,endCursor:'v1'}}};
  let pages=0,variantReads=0;
  const result=await readChairCatalog(async after=>({handle:'chaises',products:{edges:[{node:structuredClone(raw)}],pageInfo:{hasNextPage:++pages===1,endCursor:after?'end':'next'}}}),()=>({id:'1',brand:'HAY',image:'image',variants:[{id:'a',options:[],price:1},{id:'b',options:[],price:2}],tags:[]}),async()=>{variantReads++;return {edges:[{node:{id:'b'}}],pageInfo:{hasNextPage:false,endCursor:'v2'}};});
  assert.equal(result.products.length,1);assert.equal(variantReads,1);
  await assert.rejects(readChairCatalog(async()=>{throw new Error('offline')},()=>{}),/offline/);
  await assert.rejects(readChairCatalog(async()=>({products:{edges:[],pageInfo:{hasNextPage:true,endCursor:'same'}}}),()=>{}),/did not advance/);
  await assert.rejects(readChairCatalog(async()=>({products:{edges:[{node:raw}],pageInfo:{hasNextPage:false}}}),()=>{}),/Incomplete chair variants/);
});
