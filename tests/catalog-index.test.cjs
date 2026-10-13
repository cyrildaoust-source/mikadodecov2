// Index commun : familles (dont Jardin et Assises), catalogue complet et catégories.
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const realFetch=global.fetch;
let server,base,collectionReads=0,indexReads=0;
const members={};
const add=(id,...handles)=>{for(const h of handles)(members[h]||=[]).push(`gid://shopify/Product/${id}`);};
const products=[];
function node(id,{type='chaise',vendor=id%2?'HAY':'Vitra',tags=[],handles=[],compareAt=null}={}){
  add(id,...handles);
  return {id:`gid://shopify/Product/${id}`,handle:`produit-${id}`,title:`Produit ${id}`,vendor,productType:type,description:'Description longue.',tags,availableForSale:true,totalInventory:2,
    collections:{edges:handles.map(handle=>({node:{handle}}))},featuredImage:{url:`https://cdn.shopify.com/${id}.jpg`},images:{edges:[{node:{url:`https://cdn.shopify.com/${id}.jpg`}}]},
    priceRange:{minVariantPrice:{amount:String(100+id),currencyCode:'EUR'},maxVariantPrice:{amount:String(100+id),currencyCode:'EUR'}},compareAtPriceRange:{minVariantPrice:{amount:'0'}},metafields:[],filterMetafields:[],
    variants:{pageInfo:{hasNextPage:false,endCursor:null},edges:[{node:{id:`gid://shopify/ProductVariant/${id*10}`,title:'Noir',price:{amount:String(100+id)},...(compareAt?{compareAtPrice:{amount:String(compareAt)}}:{}),availableForSale:true,quantityAvailable:id%3,selectedOptions:[{name:'Couleur',value:'Noir'}],image:{url:`https://cdn.shopify.com/${id}-noir.jpg`}}}]}};
}
// 40 chaises, 10 chaises de jardin, 10 vases, 5 tables et 3 tables d'extérieur : 68 fiches.
// Idées cadeaux (ADR 0016) : la chaise 7 est taguée pour les enfants, les vases 51–55 « idee-cadeau » + « vase » (belle-maman), le vase 56 « noel » + « bougie » (amoureux).
for(let id=1;id<=40;id++)products.push(node(id,{tags:id<=6?['verner-panton']:id===7?['cadeau-enfant','chambre-enfant']:[],handles:['chaises','sieges']}));
for(let id=41;id<=50;id++)products.push(node(id,{tags:['exterieur'],handles:['chaises-outdoor','outdoor','sieges']}));
for(let id=51;id<=60;id++)products.push(node(id,{type:'vase',tags:id===52?['icone','idee-cadeau','vase']:id<=55?['idee-cadeau','vase']:id===56?['noel','bougie']:[],handles:['vases','decoration'],compareAt:id===54?300:null}));   // le vase 54 est remisé (300 → 154 €)
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
    if(/query ProductRecommendations\(/.test(query))return Response.json({data:{complementary:[],related:[],rangeCollections:[],search:{nodes:[]}}});
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
  assert.match(html,/<title>Assises HAY · Mikado Deco<\/title>/);
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
  assert.equal(data.total,68);assert.equal('items' in data,false,'les cartes sont dans la grille serveur, pas dans le JSON');
  assert.equal((await (await realFetch(base+'/api/catalog/catalogue')).json()).items.length,60);
  assert.deepEqual(data.facets.category.map(c=>c.value),['sieges','tables','decoration','outdoor'].filter(v=>data.facets.category.some(c=>c.value===v)).sort((a,b)=>data.scope.categories.findIndex(c=>c.value===a)-data.scope.categories.findIndex(c=>c.value===b)));
  assert.equal(data.facets.category[0].value,'sieges','ordre du menu, pas alphabétique');
  assert.match(html,/data-catalogue-landing/);
  assert.match(html,/class="section wrap catalog-section"/);
  assert.match(html,/id="catalogue-title" data-plp-title data-context>Mobilier<\/h1>/);
  assert.match(html,/href="\/produits.html\?page=2#grille"/);
  const second=await page('/produits.html?page=2');
  assert.match(second.html,/data-chair-continuation/);
  assert.equal((await (await realFetch(base+'/api/catalog/catalogue?page=2')).json()).items.length,8);
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
  assert.equal((await (await realFetch(base+'/api/catalog/hay')).json()).items[0].id,members.hay[0],'ordre de la collection, pas des ventes');
  assert.ok(data.facets.category.some(c=>c.value==='sieges'),'familles comme catégories');
  assert.match(html,/<option value="pop" selected>Notre sélection<\/option>/);
  assert.match(html,/data-grid data-ssr="1"/);
  const news=seed((await page('/collections/nouveautes')).html);
  assert.equal(news.scope.handle,'nouveautes');
  assert.deepEqual((await (await realFetch(base+'/api/catalog/nouveautes')).json()).items.map(p=>p.id),members.nouveautes);
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

test('le nuancier Fermob arrive complet : première couleur ouverte, couleurs dans la page',async()=>{
  const colors=require('../v3/nuancier-fermob.data.json');
  const {html}=await page('/nuancier-fermob.html');
  assert.match(html,/<div id="nf-root" class="nf-root" data-ssr="[a-z0-9-]+">/);
  assert.equal((html.match(/class="nf-swatch"/g)||[]).length,colors.length);
  assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
  assert.ok(html.includes('data-name>'+colors[0].name.replace(/&/g,'&amp;')+'<'));
  assert.equal(JSON.parse(html.match(/id="nf-data">([\s\S]*?)<\/script>/)[1]).length,colors.length);
});

test('pages créateurs : pièces portant ses tags, rendues par le serveur, paramètre créateur conservé dans chaque lien',async()=>{
  const {response,html}=await page('/produits.html?designer=verner-panton&brand=hay');
  assert.equal(response.status,200);
  const data=seed(html);
  assert.equal(data.scope.kind,'designer');
  assert.equal(data.total,3,'fiches 1, 3 et 5 : tag verner-panton et marque HAY');
  assert.match(html,/<html lang="fr" class="plp-designer" data-chair-catalog data-catalog-brand>/);
  assert.match(html,/designer-hero__name serif">Verner Panton</);
  assert.match(html,/<input type="hidden" name="designer" value="verner-panton">/);
  assert.match(html,/href="\/produits.html\?designer=verner-panton#grille" data-chair-link>Tout effacer/);
  assert.match(html,/href="\/produits.html\?designer=verner-panton#grille" data-chair-link aria-label="Retirer le filtre HAY"/);
  const api=await (await realFetch(base+'/api/catalog/'+encodeURIComponent('designer:verner-panton'))).json();
  assert.equal(api.total,6);
  assert.equal((await page('/produits.html?designer=inconnu')).response.status,404);
  const alias=await realFetch(base+'/produits.html?designer=ronan-bouroullec&brand=hay',{redirect:'manual'});
  assert.equal(alias.status,301,'une autre écriture inscrite dans les tags mène à la fiche du créateur');
  assert.equal(alias.headers.get('location'),'/produits.html?designer=ronan-erwan-bouroullec&brand=hay');
});

test('Idées cadeaux (ADR 0016) : fiches taguées cadeau ou noel, rubriques « Pour qui » par mots de tags, tranches de budget en photo',async()=>{
  const data=await (await realFetch(base+'/api/catalog/idees-cadeaux')).json();
  assert.equal(data.total,7,'5 vases idee-cadeau + le vase noel + la chaise cadeau-enfant');
  assert.deepEqual(data.facets.category.map(c=>[c.value,c.count]),[['cadeaux-enfants',1],['cadeaux-amoureux',1],['cadeaux-belle-maman',5]],'rubriques dans l’ordre de gift-ideas.json, sans celles qui sont vides');
  // Les remises d'abord (vase 54, prix comparé), puis l'ordre mélangé : les marques alternent (4 HAY, 2 Vitra), identique d'un appel à l'autre.
  assert.equal(data.items[0].handle,'produit-54','la remise en tête');assert.equal(data.items[0].compareAt,300);assert.equal(data.items[0].price,154);
  const brands=data.items.map(p=>p.brand);
  for(let i=1;i<4;i++)assert.notEqual(brands[i],brands[i+1],'deux marques différentes se succèdent : '+brands.join(','));
  assert.deepEqual((await (await realFetch(base+'/api/catalog/idees-cadeaux')).json()).items.map(p=>p.handle),data.items.map(p=>p.handle),'ordre stable');
  const kids=await (await realFetch(base+'/api/catalog/idees-cadeaux?category=cadeaux-enfants')).json();
  assert.equal(kids.total,1);assert.equal(kids.items[0].handle,'produit-7');
  const band=await (await realFetch(base+'/api/catalog/idees-cadeaux?min=150&max=160')).json();
  assert.equal(band.total,6,'les six vases sont entre 151 et 156 €');
  const {response,html}=await page('/collections/idees-cadeaux');
  assert.equal(response.status,200);
  assert.match(html,/<h1 data-plp-title data-context>Idées cadeaux<\/h1>/);
  assert.match(html,/<title>Idées cadeaux design · Mikado Deco<\/title>/);
  assert.match(html,/<link rel="canonical" href="https:\/\/www.mikadodeco.be\/collections\/idees-cadeaux"/);
  assert.match(html,/class="home-rc gift-band" href="\/collections\/idees-cadeaux\?max=50#grille" data-chair-link data-gift-band="\|50"><img class="home-rc__img editorial-photo"/,'tranche = carte photo');
  assert.match(html,/De 100 à 200 €<\/span><span class="home-rc__count">7 pièces/);
  assert.match(html,/data-gift-cat="cadeaux-enfants"/);assert.match(html,/data-gift-cat="cadeaux-belle-maman"/);assert.match(html,/>Pour qui<\/h2>/);
  assert.match(html,/class="catalog-filters__band" href="\/collections\/idees-cadeaux\?max=50#grille" data-chair-link>Moins de 50 €/,'tranches aussi dans le filtre Prix');
  assert.doesNotMatch(html,/data-gift-cat="cadeaux-collegue"|data-gift-cat="cadeaux-animaux"|data-gift-cat="cadeaux-hote"|data-gift-cat="cadeaux-cuisine"|data-gift-cat="cadeaux-lecture"/,'une rubrique sans fiche n’est pas montrée');
  assert.equal((html.match(/class="pcard"/g)||[]).length,7);
  assert.match(html,/Accueil[\s\S]*Catalogue[\s\S]*Idées cadeaux/);
  assert.doesNotMatch(html,/noindex/);
  assert.doesNotMatch(html,/Livré avant Noël|gift-note|Emballage cadeau/,'hors saison : aucun repère de Noël');
  assert.doesNotMatch(html,/subhero__img[^>]*src=""/,'bandeau de la page depuis collection-heroes.json');
  const filtered=await page('/collections/idees-cadeaux?max=50');
  assert.match(filtered.html,/class="home-rc gift-band is-active" href="\/collections\/idees-cadeaux\?max=50#grille"[^>]*aria-current="true"/);
  assert.match(filtered.html,/class="catalog-filters__band is-active"[^>]*>Moins de 50 €/);
  assert.match(filtered.html,/data-gift-cat="cadeaux-enfants"/,'les rubriques restent proposées quand une tranche est active');
  assert.match(filtered.html,/href="\/collections\/idees-cadeaux\?category=cadeaux-enfants#grille"/,'une rubrique remplace la tranche, et inversement');
  assert.match(filtered.html,/content="noindex,follow"/);
  assert.match(filtered.html,/Aucune idée cadeau ne correspond/);
});

test('saison de Noël (ADR 0016) : repère éteint, bandeau de l’accueil, navigation, annonce et emballage cadeau',async()=>{
  process.env.MIKADO_CLOCK='2026-12-01T10:00:00+01:00';
  try {
    const data=await (await realFetch(base+'/api/catalog/idees-cadeaux?sort=az')).json();
    assert.ok(data.items.every(p=>p.christmas===null),'repère « Livré avant Noël » éteint (deliveryBadge: false) : aucun état envoyé');
    const {html}=await page('/collections/idees-cadeaux?sort=az');
    assert.doesNotMatch(html,/Livré avant Noël/,'ni chip ni repère sur la page');
    assert.match(html,/gift-note/);assert.match(html,/Emballage cadeau offert/);assert.match(html,/jusqu’au 31 janvier|jusqu'au 31 janvier/);
    assert.match(html,/<p data-plp-sub>[^<]*Emballage cadeau offert/);
    assert.match(html,/<a href="\/collections\/idees-cadeaux" class="nlink">Idées cadeaux<\/a><a href="\/collections\/promotions" class="nlink nlink--promo"/,'navigation : Idées cadeaux avant Promotions');
    assert.match(html,/<a class="drawer__link" href="\/collections\/idees-cadeaux">Idées cadeaux<\/a><a class="drawer__link drawer__link--promo"/,'tiroir mobile aussi');
    const home=await page('/');
    assert.match(home.html,/home-band--gifts/);assert.match(home.html,/href="\/collections\/idees-cadeaux\?max=50">Moins de 50 €/);
    assert.match(home.html,/<span class="on"><a href="\/collections\/idees-cadeaux">Idées cadeaux pour tous les budgets · emballage offert<\/a><\/span>/);
    assert.equal((home.html.match(/class="on"/g)||[]).length,1,'un seul message d’annonce affiché au départ');
    const sel=await page('/selection.html');
    assert.match(sel.html,/data-gift-wrap-input/);
  } finally { delete process.env.MIKADO_CLOCK; }
  const off=await page('/');
  assert.doesNotMatch(off.html,/home-band--gifts|NOEL-HOME|Idées cadeaux pour tous|class="nlink">Idées cadeaux/);
  assert.doesNotMatch((await page('/selection.html')).html,/data-gift-wrap|GIFT-WRAP/);
});

test('ordre mélangé (idées cadeaux) : tour de rôle des marques, tirage stable pour une même graine',()=>{
  const {mixOrder}=require('../lib/catalog-index');
  const list=[...Array(9)].map((_,i)=>({brand:['a','b','c'][i%3],card:{id:String(i)}}));
  const a=mixOrder(list,42),b=mixOrder(list,42),c=mixOrder(list,43);
  assert.equal(a.length,9);assert.deepEqual(new Set(a.map(p=>p.card.id)).size,9,'aucune fiche perdue ni doublée');
  assert.deepEqual(a.map(p=>p.card.id),b.map(p=>p.card.id),'même graine → même ordre');
  assert.notDeepEqual(a.map(p=>p.card.id),c.map(p=>p.card.id),'autre jour → autre ordre');
  for(let i=0;i<8;i++)assert.notEqual(a[i].brand,a[i+1].brand);
  assert.deepEqual(mixOrder([],1),[]);
});
