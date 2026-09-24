// Index commun : familles (dont Jardin et Assises), catalogue complet et catégories.
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const realFetch=global.fetch;
let server,base,collectionReads=0,indexReads=0;
const members={};
const add=(id,...handles)=>{for(const h of handles)(members[h]||=[]).push(`gid://shopify/Product/${id}`);};
const products=[];
function node(id,{type='chaise',vendor=id%2?'HAY':'Vitra',tags=[],handles=[]}={}){
  add(id,...handles);
  return {id:`gid://shopify/Product/${id}`,handle:`produit-${id}`,title:`Produit ${id}`,vendor,productType:type,description:'Description longue.',tags,availableForSale:true,totalInventory:2,
    collections:{edges:handles.map(handle=>({node:{handle}}))},featuredImage:{url:`https://cdn.shopify.com/${id}.jpg`},images:{edges:[{node:{url:`https://cdn.shopify.com/${id}.jpg`}}]},
    priceRange:{minVariantPrice:{amount:String(100+id),currencyCode:'EUR'},maxVariantPrice:{amount:String(100+id),currencyCode:'EUR'}},compareAtPriceRange:{minVariantPrice:{amount:'0'}},metafields:[],filterMetafields:[],
    variants:{pageInfo:{hasNextPage:false,endCursor:null},edges:[{node:{id:`gid://shopify/ProductVariant/${id*10}`,title:'Noir',price:{amount:String(100+id)},availableForSale:true,quantityAvailable:id%3,selectedOptions:[{name:'Couleur',value:'Noir'}],image:{url:`https://cdn.shopify.com/${id}-noir.jpg`}}}]}};
}
// 40 chaises, 10 chaises de jardin, 10 vases, 5 tables et 3 tables d'extérieur : 68 fiches.
for(let id=1;id<=40;id++)products.push(node(id,{handles:['chaises','sieges']}));
for(let id=41;id<=50;id++)products.push(node(id,{tags:['exterieur'],handles:['chaises-outdoor','outdoor','sieges']}));
for(let id=51;id<=60;id++)products.push(node(id,{type:'vase',tags:id===52?['icone']:[],handles:['vases','decoration']}));
for(let id=61;id<=65;id++)products.push(node(id,{type:'table',handles:['tables-de-salle-a-manger','tables']}));
for(let id=66;id<=68;id++)products.push(node(id,{type:'table',tags:['exterieur'],handles:['tables']}));

// Marque HAY (fiches impaires) dans l'ordre inverse, choisi dans Shopify ; Nouveautés.
members.hay=products.filter(p=>p.vendor==='HAY').map(p=>p.id).reverse();
members.nouveautes=[products[59].id,products[2].id];
before(async()=>{
  process.env.SHOPIFY_STORE_DOMAIN='index.test';process.env.SHOPIFY_STOREFRONT_TOKEN='test';
  global.fetch=async(url,options)=>{
    if(!String(url).includes('index.test'))return realFetch(url,options);
    const {query,variables}=JSON.parse(options.body);
    if(/query CatalogueIndex\(/.test(query)){
      indexReads++;
      const start=Number(variables.after||0),end=Math.min(start+50,products.length);
      return Response.json({data:{products:{edges:products.slice(start,end).map(node=>({node})),pageInfo:{hasNextPage:end<products.length,endCursor:String(end)}}}});
    }
    if(/query CollectionMembers\(/.test(query))return Response.json({data:{collection:{products:{nodes:(members[variables.handle]||[]).map(id=>({id})),pageInfo:{hasNextPage:false,endCursor:null}}}}});
    if(/query CollectionCatalog\(/.test(query)){collectionReads++;return new Response('unexpected',{status:500});}
    if(/query GetProduct\(/.test(query))return Response.json({data:{product:null}});
    if(/query GetCollections\(/.test(query))return Response.json({data:{collections:{edges:[{node:{id:'gid://shopify/Collection/9',handle:'vases',title:'Vases',description:'Vases design chez Mikado Deco.',products:{edges:[{node:{id:'x'}}]}}}],pageInfo:{hasNextPage:false,endCursor:null}}}});
    return Response.json({data:{products:{edges:[],pageInfo:{hasNextPage:false,endCursor:null}},collection:null}});
  };
  server=require('../server').listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{global.fetch=realFetch;await new Promise(r=>server.close(r));});
const seed=html=>JSON.parse(html.match(/id="chair-catalog-initial">([\s\S]*?)<\/script>/)[1]);
const page=async path=>{const response=await realFetch(base+path);return {response,html:await response.text()};};

test('Assises : liste filtrée depuis l’index, sans le mobilier de jardin, avec les catégories du menu',async()=>{
  const data=await (await realFetch(base+'/api/catalog/sieges')).json();
  assert.equal(data.total,40,'les chaises de jardin restent hors d’Assises');
  assert.deepEqual(data.facets.category.map(c=>[c.value,c.count]),[['chaises',40]]);
  const {response,html}=await page('/collections/sieges');
  assert.equal(response.status,200);
  assert.match(html,/<html lang="fr" data-chair-catalog>/);
  assert.match(html,/<h1 class="fam-hero__title" data-plp-title data-context>Assises<\/h1>/);
  assert.match(html,/data-filter-group="category"/);
  assert.match(html,/aria-label="Filtrer : Assises"/);
  assert.match(html,/Toutes les assises/);
  assert.equal((html.match(/class="pcard"/g)||[]).length,40);
  assert.equal(seed(html).shell,false,'le script de la page Assises garde le menu');
  assert.match(html,/src="\/chair-catalog.js"/);
  assert.doesNotMatch(html,/Voir plus de produits/);
  assert.match(html,/Accueil[\s\S]*Assises/);
  assert.equal(collectionReads,0,'aucune relecture de collection');
});

test('Jardin et Tables appliquent leurs règles ; la marque d’une carte arrive présélectionnée',async()=>{
  const jardin=await (await realFetch(base+'/api/catalog/outdoor')).json();
  assert.equal(jardin.total,10);
  assert.deepEqual(jardin.facets.category.map(c=>c.value),['chaises-outdoor']);
  const tables=await (await realFetch(base+'/api/catalog/tables')).json();
  assert.equal(tables.total,5,'les tables d’extérieur restent hors de Tables');
  const {html}=await page('/collections/sieges?brand=hay');
  assert.equal(seed(html).total,20);
  assert.match(html,/data-plp-title data-context>Assises · HAY<\/h1>/);
  assert.match(html,/<title>Assises · HAY · Mikado Deco<\/title>/);
  const famille=await page('/collections/decoration?category=vases');
  assert.equal(famille.response.status,200);
  assert.equal(seed(famille.html).total,10);
  assert.match(famille.html,/content="noindex,follow"/);
  assert.match(famille.html,/Tous les objets de décoration/);
});

test('catalogue complet : composition Mobilier, catégories par famille et pages numérotées de 60',async()=>{
  const {response,html}=await page('/produits.html');
  assert.equal(response.status,200);
  const data=seed(html);
  assert.equal(data.total,68);assert.equal(data.items.length,60);
  assert.deepEqual(data.facets.category.map(c=>c.value),['sieges','tables','decoration','outdoor'].filter(v=>data.facets.category.some(c=>c.value===v)).sort((a,b)=>data.scope.categories.findIndex(c=>c.value===a)-data.scope.categories.findIndex(c=>c.value===b)));
  assert.equal(data.facets.category[0].value,'sieges','ordre du menu, pas alphabétique');
  assert.match(html,/data-catalogue-landing/);
  assert.match(html,/class="section wrap catalog-section"/);
  assert.match(html,/id="catalogue-title" data-plp-title data-context>Mobilier<\/h1>/);
  assert.match(html,/href="\/produits.html\?page=2#grille"/);
  const second=await page('/produits.html?page=2');
  assert.match(second.html,/data-chair-continuation/);
  assert.equal(seed(second.html).items.length,8);
  const brand=await page('/produits.html?brand=vitra&category=decoration');
  assert.equal(seed(brand.html).total,5);
  assert.match(brand.html,/data-plp-title data-context>Mobilier · Vitra<\/h1>/);
  assert.match(brand.html,/returnTo=%2Fproduits.html%3Fcategory%3Ddecoration%26brand%3Dvitra|returnTo=%2Fproduits.html%3Fbrand%3Dvitra%26category%3Ddecoration/);
});

test('sous-catégories, tables et Canapés lisent le même index',async()=>{
  const vases=await page('/collections/vases');
  assert.equal(seed(vases.html).total,10);
  assert.match(vases.html,/<p data-plp-sub>Vases design chez Mikado Deco.<\/p>/);
  const salle=await (await realFetch(base+'/api/catalog/tables-de-salle-a-manger')).json();
  assert.equal(salle.total,5);
  assert.equal(collectionReads,0);
});

test('l’index est servi au CDN en parties compressées, sans paramètre, puis recollé à l’identique',async()=>{
  const {unpackIndex,PARTS}=require('../lib/catalog-index');
  const reads=indexReads;
  const texts=[];
  for(const part of ['membres',...Array.from({length:PARTS},(_,i)=>String(i))]){
    const response=await realFetch(base+`/index-catalogue/${part}.json`);
    assert.equal(response.status,200,part);
    assert.equal(response.headers.get('content-encoding'),'gzip');
    assert.match(response.headers.get('cache-control'),/s-maxage=900, stale-while-revalidate=86400/);
    texts.push(await response.text());
  }
  assert.ok(indexReads-reads<=2,'une seule construction pour toutes les parties');
  const index=unpackIndex(texts[0],texts.slice(1));
  assert.equal(index.products.length,68);
  assert.deepEqual(index.products.map(p=>p.card.id),products.map(p=>p.id),'ordre des ventes conservé');
  assert.equal(index.products[0].card.description,undefined,'descriptions retirées de l’index');
  assert.ok(index.products[0].variants[0].searchWords.includes('hay'),'mots de recherche recalculés');
  assert.equal(index.members.sieges.length,50);
  assert.equal((await realFetch(base+'/index-catalogue/membres.json?x=1')).status,404);
  assert.equal((await realFetch(base+'/index-catalogue/tout.json')).status,404);
  const {selectionURL}=await import('../v3/navigation.mjs');
  assert.equal(selectionURL('/produits.html?category=sieges&brand=hay'),'/produits.html?brand=hay&category=sieges');
});

test('marques et Nouveautés : rendu serveur complet, ordre choisi dans Shopify, familles pour catégories',async()=>{
  const {response,html}=await page('/collections/hay');
  assert.equal(response.status,200);
  const data=seed(html);
  assert.equal(data.scope.kind,'collection');
  assert.equal(data.items[0].id,members.hay[0],'ordre de la collection, pas des ventes');
  assert.ok(data.facets.category.some(c=>c.value==='sieges'),'familles comme catégories');
  assert.match(html,/<option value="pop" selected>Notre sélection<\/option>/);
  assert.match(html,/data-grid data-ssr="1"/);
  const news=seed((await page('/collections/nouveautes')).html);
  assert.deepEqual(news.items.map(p=>p.id),members.nouveautes);
  assert.match((await page('/collections/nouveautes')).html,/Les plus récents/);
  const cards=(await (await realFetch(base+'/api/catalog/hay?category=sieges')).json());
  assert.ok(cards.total>0&&cards.items.every(p=>p.brand==='HAY'));
});

test('chaque page porte les données du site : aucun appel pour le menu, les marques ni la version',async()=>{
  const {html}=await page('/collections/sieges');
  const data=JSON.parse(html.match(/id="site-data">([\s\S]*?)<\/script>/)[1]);
  assert.equal(data.build,'dev');
  assert.ok(Array.isArray(data.brandsFile.brands)&&data.brandsFile.brands.length>10);
  assert.ok(data.config&&typeof data.config==='object');
});

test('« Les icônes » des familles sont calculées par le serveur : aucune relecture dans le navigateur',async()=>{
  const {html}=await page('/collections/decoration');
  const section=html.match(/<section class="sec" data-icones-sec[^>]*>[\s\S]*?<\/section>/)[0];
  assert.match(section,/data-ssr/);
  assert.doesNotMatch(section.match(/^<section[^>]*>/)[0],/ hidden/);
  assert.match(section,/handle=produit-52/);
  assert.equal((section.match(/class="pcard"/g)||[]).length,1);
  assert.match(section,/data-add/,'carte complète, bouton compris');
});
