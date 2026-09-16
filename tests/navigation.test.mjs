import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createNavigation, selectionURL, sourceSelection, productHref, listingTrail, productTrail, collectionTrail, breadcrumbHTML, breadcrumbData, productBrandDestination } from '../v3/navigation.mjs';
import { walkCatalog, sortCatalog } from '../v3/catalog-pagination.mjs';
const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
const nav = createNavigation(read('../v3/navigation-data.json'), read('../v3/mega-menu-brands.json').brands, read('../v3/designers-data.json').designers);
const url = path => new URL(path, 'https://www.mikadodeco.be');
const labels = trail => trail.map(x => x.label);
const product = { handle: 'chaise', name: 'Chaise <&>', brand: 'HAY' };

test('all 162 collections have a role and acyclic, explicit parents; all 39 children keep their family', () => {
 assert.equal(Object.keys(nav.collections).length, 162);
 assert.equal(Object.values(nav.collections).filter(c => c.kind === 'family').length, 7);
 assert.equal(Object.values(nav.collections).filter(c => c.kind === 'subcategory').length, 39);
 for (const [handle, c] of Object.entries(nav.collections)) {
  const trail = collectionTrail(handle, nav);
  assert.equal(trail.at(-1).label, c.label, handle);
  assert.equal(new Set(trail.map(x => x.href)).size, trail.length, handle);
  if (c.kind === 'subcategory') { assert.equal(trail.length, 4, handle); assert.equal(trail[2].label, nav.collections[c.parent].label); }
  if (c.kind === 'brand') assert.equal(trail[1].label, 'Marques', handle);
  if (c.kind === 'designer') assert.equal(trail[1].label, 'Designers', handle);
 }
 assert.deepEqual(labels(collectionTrail('tables-outdoor',nav)), ['Accueil','Catalogue','Jardin','Tables outdoor']);
});
test('all curated brands keep Marques globally and every family when arriving through that family', () => {
 for (const b of read('../v3/mega-menu-brands.json').brands) {
  const p = { ...product, brand: b.name };
  assert.equal(productTrail(p, url(productHref(p,b.href)), nav)[1].label, 'Marques');
  for (const [h,c] of Object.entries(nav.collections).filter(([,c]) => c.kind === 'family')) {
   const source = '/collections/'+h+'?brand='+b.href.split('/').pop();
   // slug names may differ from the physical handle; use destination's normalized slug.
   const destination = productBrandDestination(p, url(productHref(p, '/collections/'+h)), nav);
   assert.equal(labels(productTrail(p,url(productHref(p,destination)),nav))[2],c.label,source);
  }
 }
});
test('selection round trip retains filters, search, pagination, sort and cursor without external redirects', () => {
 const source='/produits.html?cats=chaises,fauteuils&brand=hay&q=Rey%20chair&tag=bois&sort=asc&page=12&cursor=a%2B%2F%3D&shown=48';
 const back=sourceSelection(url(productHref(product,source)));
 assert.equal(back, selectionURL(source)+'#product-chaise');
 assert.equal(new URL(back,url('/')).searchParams.get('cursor'),'a+/=');
 for (const bad of ['https://evil.test','//evil.test/x','/\\evil.test','/produit.html?handle=x','/admin','/collections/../../admin']) assert.equal(selectionURL(bad),'');
 assert.equal(selectionURL('/produits.html?email=secret&sort=wrong&page=-1'),'/produits.html');
 assert.equal(sourceSelection(url('/produit.html?from=coll-brand:luminaires:hay')), '/collections/luminaires?brand=hay');
});
test('brand and designer histories have truthful fallbacks; related products are neutral', () => {
 assert.deepEqual(labels(productTrail(product,url(productHref(product,'/collections/chaises?brand=hay')),nav)),['Accueil','Catalogue','Assises','Chaises','HAY','Chaise <&>']);
 assert.deepEqual(labels(productTrail(product,url('/produit.html?from=coll:artek'),nav)), ['Accueil','Catalogue','Chaise <&>']);
 assert.deepEqual(labels(productTrail(product,url('/produit.html?from=coll:unknown'),nav)), ['Accueil','Catalogue','Chaise <&>']);
 assert.deepEqual(labels(productTrail(product,url(productHref(product,'/produit.html?handle=other')),nav)), ['Accueil','Catalogue','Chaise <&>']);
 assert.equal(productBrandDestination(product,url(productHref(product,'/collections/alvar-aalto')),nav),'/collections/hay');
 assert.equal(productBrandDestination(product,url(productHref(product,'/collections/luminaires')),nav),'/collections/luminaires?brand=hay');
});
test('one accessible breadcrumb and identical JSON-LD hierarchy, with a stable product canonical', () => {
 const trail=productTrail(product,url(productHref(product,'/collections/chaises?brand=hay')),nav);
 const html=breadcrumbHTML(trail), data=breadcrumbData(trail,'/produit.html?handle=chaise');
 assert.match(html,/aria-current="page"/); assert.match(html,/Chaise &lt;&amp;&gt;/); assert.doesNotMatch(html,/itemscope/);
 assert.deepEqual(data.itemListElement.map(x=>x.name),labels(trail));
 assert.equal(data.itemListElement.at(-1).item,'https://www.mikadodeco.be/produit.html?handle=chaise');
 assert.equal(listingTrail(url('/collections/ichendorf-milano'),nav)[1].label,'Marques');
});
test('old cart identifiers and the selected variant retain a route to their product', () => {
 const href=productHref({handle:'gid://shopify/Product/123'},'/selection.html','gid://shopify/ProductVariant/456');
 assert.equal(url(href).searchParams.get('id'),'gid://shopify/Product/123');
 assert.equal(url(href).searchParams.get('variant'),'456');
 assert.equal(sourceSelection(url(href)),'/selection.html');
 assert.equal(productHref({handle:'bad<script>'}), '');
});
test('pagination goes beyond the old 25-page ceiling, deduplicates and keeps errors explicit', async () => {
 const result=await walkCatalog(async cursor=>{const n=Number(cursor||0);return {items:[{id:n,image:'x'},{id:n,image:'x'}],pageInfo:{hasNextPage:n<30,endCursor:String(n+1)}}});
 assert.equal(result.items.length,31); assert.equal(result.complete,true);
 const repeated=await walkCatalog(async ()=>({items:[{id:1,image:'x'}],pageInfo:{hasNextPage:true,endCursor:'same'}}));
 assert.equal(repeated.complete,false); assert.match(repeated.error.message,/Cursor/);
 let n=0;
 const failed=await walkCatalog(async ()=>{if(n++)throw Error('offline');return {items:[{id:1,image:'x'}],pageInfo:{hasNextPage:true,endCursor:'2'}}});
 assert.equal(failed.items.length,1);assert.equal(failed.complete,false);
});

test('price sort follows the displayed starting price, including multi-variant products', () => {
 const products=[{name:'A',price:400,priceMin:316},{name:'B',price:319},{name:'C',price:315}];
 assert.deepEqual(sortCatalog(products,'asc').map(p=>p.name),['C','A','B']);
 assert.deepEqual(sortCatalog(products,'desc').map(p=>p.name),['B','A','C']);
 assert.equal(products[0].name,'A');
});
