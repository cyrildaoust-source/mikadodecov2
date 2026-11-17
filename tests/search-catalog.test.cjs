const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseSearch}=require('../lib/search-intent');
const {buildFilterProduct}=require('../lib/catalog-filters');
const {prepareSearchProduct,searchCatalog,dimensions,readSearchCatalog,near}=require('../lib/search-catalog');
function product({name='Table test',type='table',dims='',description='',material='Bois',variants=[['Noir','160 × 80 cm',900],['Blanc','200 × 90 cm',700]],...extra}={}) {
  const card={id:'gid://shopify/Product/1',handle:'table-test',name,productType:type,dimensions:dims,description,material,brand:'HAY',tags:[],collections:[],image:'https://cdn.shopify.com/main.jpg',variants:variants.map(([color,size,price],i)=>({id:'gid://shopify/ProductVariant/'+(100+i),title:color,price,available:true,qty:i?0:2,options:[{name:'Couleur',value:color},...(size?[{name:'Dimensions',value:size}]:[])],image:'https://cdn.shopify.com/'+i+'.jpg'})),...extra};
  const raw={tags:card.tags,filterMetafields:[{namespace:'custom',key:'material',value:material},{namespace:'custom',key:'dimensions',value:dims}],variants:{edges:card.variants.map(v=>({node:{selectedOptions:v.options}}))}};
  return prepareSearchProduct(buildFilterProduct(raw,card));
}
test('les quatre demandes métier : taille, finition, capacité et prix sont combinées sans confondre les unités',()=>{
  const d=parseSearch('Une table en chêne noire 160 x 80 cm pour 6 personnes à moins de 2 000 €');
  assert.equal(d.core,'table');assert.deepEqual(d.issues,[]);
  const get=id=>d.criteria.find(c=>c.id===id);
  assert.deepEqual(get('format').values,[160,80]);assert.equal(get('capacity').value,6);assert.equal(get('price').max,1999.99);assert.deepEqual(get('finish').values,['chene']);
  assert.equal(parseSearch('buffet largeur max 1m60').criteria[0].value,160);
  assert.equal(parseSearch('table pour 6').criteria.find(c=>c.id==='capacity').value,6);
  assert.equal(parseSearch('table profondeur moins de 80 cm').criteria.some(c=>c.kind==='price'),false);
});
test('type précis, faute, nom de modèle et exclusion ne dégradent pas une demande',()=>{
  assert.equal(parseSearch('lampe de table noire').criteria.find(c=>c.kind==='family').value,'lampe-table');
  assert.equal(parseSearch('table basse').criteria.find(c=>c.kind==='family').value,'table-basse');
  assert.equal(parseSearch('chaisse noir 500€').correction,true);
  assert.deepEqual(parseSearch('chaise Artek 69 blanche').criteria.find(c=>c.kind==='text').values,['69']);
  assert.ok(parseSearch('chaise pas noire').issues.length);
  assert.ok(parseSearch('table entre 2000 et 1000 euros').issues.length);
  assert.ok(near('fermob','fermbo'));assert.equal(near('69','690'),false);
});
test('une dimension, la finition et le prix appartiennent à la même variante',()=>{
  const p=product();
  assert.equal(searchCatalog([p],{q:'table noire 160 x 80 cm 1000€'}).total,1);
  assert.equal(searchCatalog([p],{q:'table noire 200 x 90 cm 1000€'}).total,0);
  assert.equal(searchCatalog([p],{q:'table noire 800€'}).total,0);
  const d=searchCatalog([p],{q:'table noire 160 x 80 cm 1000€'});
  assert.equal(d.items[0].price,900);assert.equal(d.items[0].matchedVariantId,'gid://shopify/ProductVariant/100');assert.match(d.items[0].image,/0.jpg/);
});
test('les dimensions sans légende ne deviennent pas une largeur et les mesures précises prévalent sur le titre arrondi',()=>{
  const d=dimensions('L 160 × H 80 × P 42 cm');assert.equal(d.width,160);assert.equal(d.depth,42);assert.equal(d.height,80);
  assert.equal(dimensions('Ø120cm').diameter,120);
  assert.equal(dimensions('160 × 42 × 80 cm').width,undefined);
  const p=product({name:'Buffet 160 cm',type:'buffet',dims:'L 159,5 × P 40 × H 55 cm',variants:[['Noir','',900]]});
  assert.equal(searchCatalog([p],{q:'buffet largeur max 160 cm'}).total,1);
  assert.equal(searchCatalog([p],{q:'buffet 160 cm'}).total,0);
  const variable=product({dims:'L 120 × P 80 × H 70 cm'});
  assert.equal(searchCatalog([variable],{q:'table largeur 120cm'}).total,0);
  assert.equal(searchCatalog([product()],{q:'table max 120cm'}).total,0);
  assert.equal(searchCatalog([product({dims:'L 160 × H 75 × P 80 cm',variants:[['Noir','',900]]})],{q:'table 160 x 80 cm'}).total,1);
  assert.equal(searchCatalog([product({dims:'160 × 80 × 75 cm',variants:[['Noir','',900]]})],{q:'table 160 x 80 cm'}).total,1);
});
test('capacité déclarée : les produits inconnus restent exclus et une suggestion ne relâche jamais un critère en silence',()=>{
  const known=product({description:'Accueille 4 à 6 personnes.',variants:[['Noir','',900]]}),unknown=product({handle:'unknown'});
  const d=searchCatalog([known,unknown],{q:'table pour 6 personnes 1000€'});assert.equal(d.total,1);assert.deepEqual(d.incomplete,[{label:'capacité',count:1}]);
  const zero=searchCatalog([known,unknown],{q:'table pour 8 personnes noire 1000€'});assert.equal(zero.total,0);
  const alternative=zero.suggestions.find(s=>s.url.includes('omit=capacity'));assert.equal(alternative.count,2);
  const relaxed=searchCatalog([known,unknown],Object.fromEntries(new URL(alternative.url,'http://test').searchParams));assert.equal(relaxed.total,2);assert.ok(relaxed.items.every(p=>p.price===900));
});
test('les mots couleur combinés exigent la finition demandée, les accessoires ne deviennent pas une table',()=>{
  const p=product();assert.equal(searchCatalog([p],{q:'table noire et blanche'}).total,0);assert.equal(searchCatalog([p],{q:'table noire ou blanche'}).total,1);
  assert.equal(searchCatalog([product({type:'set de table'})],{q:'table noire'}).total,0);
});
test('pagination et tri portent sur la sélection entière, un format manquant n’est jamais inventé',()=>{
  const list=Array.from({length:65},(_,i)=>product({handle:'table-'+i,variants:[['Noir','',1000-i]],dims:'L 160 × P 80 × H 75 cm'}));
  const d=searchCatalog(list,{q:'table noire largeur 160cm',sort:'asc',page:'2'});assert.equal(d.total,65);assert.equal(d.items.length,5);assert.equal(d.items[0].price,996);
  assert.match(d.resultsUrl,/page=2/);assert.equal(searchCatalog([product({variants:[['Noir','',900]]})],{q:'table 160cm'}).total,0);
});
test('liens de critères et retour de fiche conservent la demande, la variante et les retraits ; HTML échappé',async()=>{
  const {productHref,sourceSelection}=await import('../v3/navigation.mjs'),view=await import('../v3/search-view.mjs');
  const d=searchCatalog([product()],{q:'table noire <script>',omit:'text'});
  const href=productHref(d.items[0],d.resultsUrl);assert.match(href,/variant=100/);assert.match(sourceSelection(new URL(href,'https://test')),/omit=text/);
  const html=view.searchContent(d,()=>'<div>Card</div>');assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);
});
test('les erreurs de pagination et de variantes restent des erreurs, jamais une sélection tronquée',async()=>{
  await assert.rejects(readSearchCatalog(async()=>({edges:[],pageInfo:{hasNextPage:true,endCursor:'same'}}),x=>x),/cursor/);
  await assert.rejects(readSearchCatalog(async()=>null,x=>x),/unavailable/);
});
test('une référence tapée collée retrouve le nom écrit en deux mots (« EA217 » → « Soft Pad EA 217 »)',()=>{
  const p=product({name:'Chaise de bureau Soft Pad EA 217',type:'chaise de bureau'});
  for(const q of ['EA217','ea 217','EA 217','soft pad ea217'])assert.equal(searchCatalog([p],{q}).total,1,q);
  assert.equal(searchCatalog([p],{q:'EA219'}).total,0);
});
test('une phrase courante ne vide plus la page : les mots en trop élargissent, et la page le dit',()=>{
  const sofa=product({name:'Fauteuil Club',type:'fauteuil',description:'Assise profonde.',variants:[['Noir','',900]]});
  const cosy={...product({name:'Fauteuil Nuage',type:'fauteuil',description:'Un fauteuil confortable.',variants:[['Blanc','',700]]})};
  cosy.card={...cosy.card,id:'gid://shopify/Product/2',handle:'fauteuil-nuage'};
  const wide=searchCatalog([sofa,cosy],{q:'fauteuil confortable pour le salon'});
  assert.equal(wide.total,2);assert.equal(wide.widened,'confortable salon');
  assert.equal(wide.items[0].name,'Fauteuil Nuage');   // la fiche qui porte un des mots passe devant
  assert.equal(wide.criteria.some(c=>c.id==='text'),false);
  // Un nom de modèle qui trouve quelque chose reste un vrai filtre.
  const strict=searchCatalog([sofa,cosy],{q:'fauteuil nuage'});
  assert.equal(strict.total,1);assert.equal(strict.widened,'');
  assert.equal(parseSearch('éclairage terrasse').criteria.find(c=>c.kind==='family').value,'lampe');
});
test('phrase courante : les résultats de la recherche par phrase de Shopify remplacent l’élargissement, dans son ordre',()=>{
  const {phraseNeeded,phrasePage}=require('../lib/services/search');
  const mk=(id,name,type,price)=>{const p=product({name,type,variants:[['Noir','',price]]});p.card={...p.card,id:'gid://shopify/Product/'+id,handle:'h'+id};return p;};
  const club=mk(1,'Fauteuil Club','fauteuil',900),repos=mk(2,'Fauteuil Repos','fauteuil',4000),lampe=mk(3,'Lampe Apex','lampe',90);
  const q='fauteuil confortable pour le salon',intent=parseSearch(q),data=searchCatalog([club,repos],{q});
  assert.equal(phraseNeeded(intent,data),true);
  // Shopify classe le fauteuil de repos d'abord et propose aussi une lampe : la famille comprise reste un filtre.
  const page=phrasePage(data,[repos,lampe,club],{q},intent,60);
  assert.deepEqual(page.items.map(c=>c.name),['Fauteuil Repos','Fauteuil Club']);
  assert.equal(page.widened,'');assert.equal(page.criteria.some(c=>c.id==='text'),false);
  assert.equal(page.resultsUrl.includes('omit'),false);
  // Phrase sans famille reconnue : les résultats de Shopify, sans demander de catégorie.
  const q2='quelque chose de confortable',i2=parseSearch(q2),d2=searchCatalog([],{q:q2}),p2=phrasePage(d2,[repos,lampe],{q:q2},i2,60);
  assert.equal(p2.total,2);assert.equal(p2.needsCategory,false);
  // Rien côté Shopify : la page d'origine est gardée. Un nom de modèle trouvé ne passe pas par la phrase.
  assert.equal(phrasePage(data,[],{q},intent,60),data);
  assert.equal(phraseNeeded(parseSearch('fauteuil club'),searchCatalog([club,repos],{q:'fauteuil club'})),false);
});
test('la pièce cherchée est le premier nom de la phrase, pas le premier de la liste',()=>{
  const fam=q=>parseSearch(q).criteria.find(c=>c.kind==='family')?.value;
  assert.equal(fam('luminaire au-dessus de la table à manger'),'lampe');
  assert.equal(fam('lampe design pour bureau'),'lampe');
  assert.equal(fam('coussin pour canapé gris'),'coussin');
  assert.equal(fam('chaise pour bureau à la maison'),'chaise');
  assert.equal(fam('lampe de table noire'),'lampe-table');
  assert.equal(fam('table basse ronde'),'table-basse');
  assert.equal(fam('tabouret de bar pour cuisine'),'chaise-bar');
});
test('une caractéristique décisive absente des fiches ne montre pas de faux résultats',()=>{
  const sofa=product({name:'Canapé Mags',type:'canape',description:'Canapé profond.',variants:[['Gris','',2000]]});
  const page=searchCatalog([sofa],{q:'canapé convertible'});
  assert.equal(page.total,0);assert.equal(page.widened,'');
  assert.equal(page.suggestions[0].label,'Sans « Convertible »');
  const {phrasePage}=require('../lib/services/search');
  assert.equal(phrasePage(page,[sofa],{q:'canapé convertible'},parseSearch('canapé convertible'),60),page);
  const swivel=product({name:'Fauteuil Orbo pivotant',type:'fauteuil',variants:[['Noir','',900]]});
  assert.equal(searchCatalog([swivel],{q:'fauteuil pivotant'}).total,1);
});
