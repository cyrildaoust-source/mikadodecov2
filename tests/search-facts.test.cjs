const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseSearchFacts,previewFacts}=require('../lib/search-facts');
const {buildFilterProduct}=require('../lib/catalog-filters');
const {prepareSearchProduct,searchCatalog,dimensions}=require('../lib/search-catalog');
const batch=require('../data/catalog-enrichment/fermob-tables.json');
const standard=(max=6)=>({version:1,configurations:[{id:'standard',label:'',dimensions:{length:160,width:80,height:74},capacity:{status:'verified',max}}]});
function product({facts=standard(),variantFacts=null,variable=false,description='',name='Table test'}={}) {
  const card={id:'gid://shopify/Product/1',handle:'table-test',name,brand:'HAY',productType:'table',dimensions:'',description,tags:[],collections:[],image:'https://cdn.shopify.com/main.jpg',material:'Métal',variants:[{id:'gid://shopify/ProductVariant/2',title:'Noir',price:900,available:true,options:[{name:'Couleur',value:'Noir'},...(variable?[{name:'Dimensions',value:'200 x 90 cm'}]:[])]}]};
  const mf=f=>f===null?[]:[{namespace:'custom',key:'search_facts',value:typeof f==='string'?f:JSON.stringify(f)}];
  return prepareSearchProduct(buildFilterProduct({tags:[],filterMetafields:mf(facts),variants:{edges:card.variants.map(v=>({node:{selectedOptions:v.options,filterMetafields:mf(variantFacts)}}))}},card));
}
test('les données structurées sont typées ; conflit, zéro, estimation ou JSON invalide ne deviennent pas une capacité',()=>{
  assert.equal(parseSearchFacts(null),null);
  assert.equal(parseSearchFacts('{').invalid,true);
  for(const max of [0,-1,6.5,'6',Infinity])assert.equal(parseSearchFacts(standard(max)).invalid,true);
  const c=standard();c.configurations[0].capacity={status:'conflict',max:8};assert.equal(parseSearchFacts(c).invalid,true);
  c.configurations[0].capacity={status:'estimated',max:8};assert.equal(parseSearchFacts(c).invalid,true);
  c.configurations[0].capacity={status:'unknown'};assert.equal(parseSearchFacts(c).invalid,undefined);
});
test('un conflit canonique bloque le texte, sans faire disparaître le produit des recherches ordinaires',()=>{
  const facts=standard();facts.configurations[0].capacity={status:'conflict'};
  const p=product({facts,description:'Pour 8 personnes'});
  assert.equal(searchCatalog([p],{q:'table noire'}).total,1);
  assert.equal(searchCatalog([p],{q:'table pour 8'}).total,0);
  assert.equal(searchCatalog([p],{q:'table 160 x 80 cm'}).total,1);
  const invalid=product({facts:'{',description:'Pour 8 personnes'});
  assert.equal(searchCatalog([invalid],{q:'table noire'}).total,1);
  assert.equal(searchCatalog([invalid],{q:'table pour 8'}).total,0);
});
test('une variante de taille ne récupère pas les dimensions ou la capacité du format commun',()=>{
  const p=product({variable:true,description:'Pour 8 personnes'});
  assert.equal(searchCatalog([p],{q:'table pour 6'}).total,0);
  assert.equal(searchCatalog([p],{q:'table 160 x 80 cm'}).total,0);
  const exact=product({variable:true,variantFacts:standard(8)});
  assert.equal(searchCatalog([exact],{q:'table 160 x 80 cm pour 8'}).total,1);
});
test('dimensions et capacité doivent appartenir à la même configuration ; les allonges nécessaires sont visibles',()=>{
  const facts=standard(6);facts.configurations.push({id:'extended',label:'Avec les allonges',dimensions:{length:260,width:80,height:74},capacity:{status:'verified',max:10}});
  const p=product({facts});
  assert.equal(searchCatalog([p],{q:'table longueur max 160 cm pour 10'}).total,0);
  const found=searchCatalog([p],{q:'table longueur 260 cm pour 10'});
  assert.equal(found.total,1);assert.match(found.items[0].finishLabel,/Avec les allonges/);assert.equal(found.items[0].matchedVariantId,'gid://shopify/ProductVariant/2');
  assert.doesNotMatch(searchCatalog([p],{q:'table pour 6'}).items[0].finishLabel,/allonges/);
  const unverified=product({facts:null,name:'Table extensible',description:'Pour 10 personnes avec allonges'});
  assert.equal(searchCatalog([unverified],{q:'table pour 10'}).total,0);
});
test('le lot entier est lié aux identités et options exactes, désactivé par défaut hors preview',()=>{
  assert.equal(batch.products.length,25);
  for(const row of batch.products) {
    if(row.facts)assert.equal(parseSearchFacts(row.facts).invalid,undefined,row.handle);
    const variant=row.binding.variants[0];
    assert.equal(previewFacts(row,variant,false),null);
    const verified=row.binding.status==='verified';
    assert.equal(Boolean(previewFacts(row,variant,true)),verified,row.handle);
    assert.equal(previewFacts({...row,id:'gid://shopify/Product/999'},variant,true),null);
    assert.equal(previewFacts(row,{...variant,options:[{name:'Taille',value:'autre'}]},true),null);
  }
});
test('Ribambelle : 14 places à 299 cm uniquement ; capacité fermée inconnue',()=>{
  const row=batch.products.find(p=>p.handle.includes('ribambelle'));
  const p=product({facts:row.facts});
  assert.equal(searchCatalog([p],{q:'table pour 14 personnes 149 x 100 cm'}).total,0);
  assert.deepEqual(searchCatalog([p],{q:'table pour 14 personnes 149 x 100 cm'}).incomplete,[{label:'capacité',count:1}]);
  assert.equal(searchCatalog([p],{q:'table pour 14 personnes 299 x 100 cm'}).total,1);
});
test('une capacité non applicable ne produit pas une alerte de donnée manquante',()=>{
  const facts=standard();facts.configurations[0].capacity={status:'not_applicable'};
  assert.deepEqual(searchCatalog([product({facts})],{q:'table pour 6'}).incomplete,[]);
});
test('le diamètre connu d’une table ronde ne devient pas un format rectangulaire manquant',()=>{
  const facts=standard();facts.configurations[0].dimensions={diameter:120,height:74};
  const result=searchCatalog([product({facts})],{q:'table pour 6 160 x 80 cm'});
  assert.equal(result.total,0);assert.deepEqual(result.incomplete,[]);
});
test('cotes W/D/H explicites avec pouces en parallèle ; aucune conversion de l’âge enfant en places',()=>{
  const d=dimensions('H: 74cm / 29.1in, W: 180cm / 70.9in, D: 90cm / 35.4in');
  assert.equal(d.width,180);assert.equal(d.depth,90);assert.equal(d.height,74);
  const kid=batch.products.find(p=>p.handle.includes('kid'));assert.equal(kid.facts.configurations[0].capacity.status,'unknown');
  assert.equal(kid.facts.configurations[0].dimensions.width,55.5);
});
