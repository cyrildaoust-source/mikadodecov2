const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const realFetch=global.fetch;
let server,base,reads=0,fail=false;
const node=id=>({id:`gid://shopify/Product/${id}`,handle:`chaise-${id}`,title:`Chaise ${id}`,vendor:id%2?'HAY':'Vitra',productType:'chaise',description:'Une chaise.',tags:[],availableForSale:true,totalInventory:2,
  collections:{edges:[{node:{handle:'chaises'}}]},featuredImage:{url:`https://cdn.shopify.com/${id}.jpg`},images:{edges:[{node:{url:`https://cdn.shopify.com/${id}.jpg`}},{node:{url:`https://cdn.shopify.com/${id}-ambiance.jpg`}}]},
  priceRange:{minVariantPrice:{amount:'400',currencyCode:'EUR'},maxVariantPrice:{amount:'700.95',currencyCode:'EUR'}},compareAtPriceRange:{minVariantPrice:{amount:'0'}},metafields:[],
  filterMetafields:[{namespace:'custom',key:'usage',type:'single_line_text_field',value:'Intérieur'},{namespace:'custom',key:'material',type:'single_line_text_field',value:'Bois'}],
  variants:{pageInfo:{hasNextPage:false,endCursor:null},edges:[{node:{id:`gid://shopify/ProductVariant/${id*10}`,title:'Beige',price:{amount:'400'},availableForSale:true,quantityAvailable:2,selectedOptions:[{name:'Couleur',value:'Beige'}],image:{url:`https://cdn.shopify.com/${id}-beige.jpg`}}},{node:{id:`gid://shopify/ProductVariant/${id*10+1}`,title:'Noir',price:{amount:'700.95'},availableForSale:true,quantityAvailable:0,selectedOptions:[{name:'Couleur',value:'Noir'}],image:{url:`https://cdn.shopify.com/${id}-noir.jpg`}}}]} });
before(async()=>{
  process.env.SHOPIFY_STORE_DOMAIN='chairs.test';process.env.SHOPIFY_STOREFRONT_TOKEN='test';process.env.REVALIDATE_TOKEN='chair-test';
  global.fetch=async(url,options)=>{
    if(!String(url).includes('chairs.test'))return realFetch(url,options);
    const {query,variables}=JSON.parse(options.body);
    if(query.includes('query GetProduct('))return Response.json({data:{product:node(1)}});
    assert.match(query,/query (CollectionCatalog|SearchCatalog|ScopedSearchCatalog)/);if(query.includes("query CollectionCatalog"))reads++;
    if(fail)return new Response('offline',{status:503});
    const start=Number(variables.after||0),end=Math.min(start+50,65);
    const products={edges:Array.from({length:end-start},(_,i)=>({node:node(start+i+1)})),pageInfo:{hasNextPage:end<65,endCursor:String(end)}};
    return Response.json({data:/query (?:Scoped)?SearchCatalog/.test(query)?{search:products}:{collection:{handle:'chaises',title:'Chaises',description:'',products}}});
  };
  server=require('../server').listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{global.fetch=realFetch;await new Promise(r=>server.close(r));});
const seed=html=>JSON.parse(html.match(/id="(?:chair-catalog-initial|search-initial)">([\s\S]*?)<\/script>/)[1]);
test('API calcule la sélection complète une fois et renvoie seulement la page demandée',async()=>{
  const a=await (await realFetch(base+'/api/catalog/chaises')).json();
  assert.equal(a.total,65);assert.equal(a.items.length,60);assert.equal(reads,2);
  const b=await (await realFetch(base+'/api/catalog/chaises?page=2')).json();
  assert.equal(b.items.length,5);assert.equal(reads,2);assert.equal(b.items[0].handle,'chaise-61');
  assert.equal(a.items[0].variants,undefined);assert.equal(a.items[0].matchedVariantId,'gid://shopify/ProductVariant/10');
});
test('le rendu serveur et le contrôleur utilisent les mêmes filtres ; liens paginés explorables',async()=>{
  const html=await (await realFetch(base+'/collections/chaises')).text();
  const data=seed(html);
  assert.equal(data.total,65);assert.equal((html.match(/class="pcard"/g)||[]).length,60);
  assert.match(html,/src="\/chair-catalog.js"/);assert.doesNotMatch(html,/walkCatalog/);
  assert.match(html,/href="\/collections\/chaises\?page=2#grille"/);
  assert.match(html,/aria-label="Filtrer les chaises"/);
  assert.match(html,/variant=10/);
  assert.match(html,/pcard__finish-label/);assert.doesNotMatch(html,/data-card-finish=|class="pcard__finishes"|class="pcard__finish-more"/);
  assert.match(html,/<img class="alt" src="https:\/\/cdn.shopify.com\/1-ambiance.jpg/);
  assert.ok(data.items.every(p=>p.image2.includes('-ambiance.jpg')&&p.finishChoices.every(v=>v.image2===p.image2)));
  const page2=await (await realFetch(base+'/collections/chaises?page=2')).text();
  assert.equal(seed(page2).items.length,5);assert.match(page2,/data-chair-continuation/);
  assert.doesNotMatch(page2,/<section class="subhero/);
  assert.match(page2,/<link rel="canonical" href="https:\/\/www.mikadodeco.be\/collections\/chaises\?page=2"/);
});
test('les filtres serveur combinent la marque, la couleur et le prix exact de la variante',async()=>{
  const html=await (await realFetch(base+'/collections/chaises?brand=hay&color=noir&min=700&max=701')).text();
  const data=seed(html);assert.equal(data.total,33);
  assert.ok(data.items.every(p=>p.brand==='HAY'&&p.price===700.95&&p.image.includes('noir')));
  assert.match(html,/700,95/);assert.match(html,/content="noindex,follow"/);
  assert.match(html,/returnTo=[^"\s]*color/);
  const empty=await (await realFetch(base+'/api/catalog/chaises?brand=hay&color=noir&max=500')).json();assert.equal(empty.total,0);
});
test('les suggestions et la recherche soumise ouvrent la même sélection et la même finition',async()=>{
  const q=encodeURIComponent('chaises HAY noires en bois entre 700 et 701 euros');
  const response=await realFetch(base+'/api/predictive?q='+q);
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  const predictive=await response.json();assert.equal(predictive.total,33);assert.equal(predictive.products.length,8);
  assert.ok(predictive.products.every(p=>p.brand==='HAY'&&p.price===700.95&&p.image.includes('noir')&&p.matchedVariantId));
  const submitted=await realFetch(base+'/produits.html?q='+q,{redirect:'manual'});
  assert.equal(submitted.status,200);assert.equal(new URL(predictive.resultsUrl,base).searchParams.get('q'),decodeURIComponent(q));
  const html=await (await realFetch(base+predictive.resultsUrl)).text();
  assert.deepEqual(seed(html).items.slice(0,8),predictive.products);assert.match(html,/variant=11/);
  const noHits=await (await realFetch(base+'/api/predictive?q='+encodeURIComponent('chaise noire en bois à moins de 500 €'))).json();
  assert.equal(noHits.total,0);assert.deepEqual(noHits.products,[]);assert.ok(noHits.criteria.some(c=>c.id==='price'));assert.ok(noHits.suggestions.length);
});
test('la recherche de modèle conserve son texte côté serveur, dans le tri et les liens paginés',async()=>{
  const submitted=await realFetch(base+'/produits.html?q=chaise+HAY+1+noire&sort=desc',{redirect:'manual'});
  assert.equal(submitted.status,200);
  const html=await submitted.text();
  assert.equal(seed(html).total,1);assert.equal(seed(html).items[0].handle,'chaise-1');
  assert.match(html,/Retirer 1/);assert.match(html,/name="q" value="chaise HAY 1 noire"/);assert.match(html,/noindex,follow/);
});
test('la fiche rend dès le serveur le prix et la photo demandés sans modifier le produit en cache',async()=>{
  const selected=await (await realFetch(base+'/produit.html?handle=chaise-1&variant=11')).text();
  assert.match(selected,/<div class="pdp__price">700,95\s*€<\/div>/);
  assert.match(selected,/<img class="pdp__main" src="[^\"]*1-noir\.jpg/);
  const standard=await (await realFetch(base+'/produit.html?handle=chaise-1')).text();
  assert.match(standard,/<div class="pdp__price">À partir de 400\s*€<\/div>/);
});
test('un échec amont reste une erreur et un nouvel essai recharge les données',async()=>{
  await realFetch(base+'/api/revalidate',{method:'POST',headers:{Authorization:'Bearer chair-test'}});
  fail=true;
  const predictive=await realFetch(base+'/api/predictive?q=chaise+noire');assert.equal(predictive.status,503);assert.equal(predictive.headers.get('cache-control'),'no-store');
  const error=await realFetch(base+'/api/catalog/chaises');assert.equal(error.status,503);
  const page=await realFetch(base+'/collections/chaises?color=noir');assert.equal(page.status,503);assert.match(await page.text(),/Impossible de charger les chaises/);
  fail=false;
  const retry=await realFetch(base+'/api/catalog/chaises');assert.equal(retry.status,200);assert.equal((await retry.json()).total,65);
});
test('le retour de fiche conserve chaque filtre et la variante sans accepter une URL externe',async()=>{
  const {productHref,sourceSelection}=await import('../v3/navigation.mjs');
  const source='/collections/chaises?brand=hay,vitra&color=noir&material=bois&usage=interieur&min=500&max=900&stock=1&feature=empilable&page=2';
  const href=productHref({handle:'chaise-1',matchedVariantId:'gid://shopify/ProductVariant/11'},source);
  const url=new URL(href,base);assert.equal(url.searchParams.get('variant'),'11');
  const back=new URL(sourceSelection(url),base),expected=new URL(source,base);
  assert.equal(back.pathname,expected.pathname);assert.equal(back.hash,'#product-chaise-1');
  assert.deepEqual([...back.searchParams].sort(),[...expected.searchParams].sort());
  assert.equal(sourceSelection(new URL('/produit.html?returnTo=https://example.com',base)),'');
});
test('les sous-catégories reçoivent les mêmes filtres, avec leur propre chemin et leur titre',async()=>{
  const {filterScope,filterScopeHandles}=require('../lib/filter-scopes');
  assert.ok(filterScope('fauteuils')&&filterScope('verres-carafes'));
  // Promotions garde son affichage de variantes remisées ; collections internes exclues.
  for(const handle of ['promotions','promo-chaises-hay','featured','claude-modifs-2026-05-16','inconnue'])assert.equal(filterScope(handle),null,handle);
  for(const handle of ['hay','nouveautes','1900','verner-panton'])assert.equal(filterScope(handle).kind,'collection',handle);
  // Tables, Canapés et familles n'existent qu'avec l'index commun ; sans lui, liste d'origine.
  for(const handle of ['tables-de-salle-a-manger','canapes','tables','sieges','outdoor'])assert.equal(filterScope(handle).fallback,'legacy',handle);
  assert.ok(filterScopeHandles().length>20);
  const html=await (await realFetch(base+'/collections/fauteuils?color=noir')).text();
  const data=seed(html);
  assert.equal(data.scope.basePath,'/collections/fauteuils');
  assert.match(html,/<h1 data-plp-title data-context>Fauteuils<\/h1>/);
  assert.match(html,/action="\/collections\/fauteuils#grille"/);
  assert.match(html,/aria-label="Filtrer : Fauteuils"/);
  assert.match(html,/href="\/collections\/fauteuils#grille" data-chair-link>Tout effacer/);
  assert.doesNotMatch(html,/Trouvez votre chaise|\/collections\/chaises\?/);
  assert.match(html,/returnTo=%2Fcollections%2Ffauteuils%3Fcolor%3Dnoir/);
  assert.match(html,/content="noindex,follow"/);
  const api=await realFetch(base+'/api/catalog/fauteuils?brand=hay');
  assert.equal(api.status,200);assert.equal((await api.json()).scope.handle,'fauteuils');
  assert.equal((await realFetch(base+'/api/catalog/promotions')).status,404);
  const {selectionURL}=await import('../v3/navigation.mjs');
  assert.equal(selectionURL('/collections/fauteuils?color=noir&min=100&stock=1'),'/collections/fauteuils?color=noir&min=100&stock=1');
});
