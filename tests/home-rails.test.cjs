// Rangées de l'accueil : de vraies nouveautés, variées, sans doublon avec les meilleures ventes.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pickNewArrivals,pickBestSellers}=require('../lib/home-rails');
const p=(id,brand,extra={})=>({id,handle:id,brand,image:'/'+id+'.jpg',...extra});
test('les nouveautés alternent les marques, de la plus récemment arrivée à la suivante',()=>{
 const items=[p('hk1','HKliving'),p('hk2','HKliving'),p('hk3','HKliving'),p('v1','Vitra'),p('v2','Vitra'),p('m1','Moustache')];
 assert.deepEqual(pickNewArrivals(items).map(x=>x.id),['hk1','v1','m1','hk2']);
});
test('un import massif d’une seule marque ne remplit pas la rangée tant qu’une autre existe',()=>{
 const items=[...Array.from({length:40},(_,i)=>p('hk'+i,'HKliving')),p('v1','Vitra')];
 assert.deepEqual(pickNewArrivals(items).map(x=>x.brand),['HKliving','Vitra','HKliving','HKliving']);
});
test('produits sans photo ou non achetables exclus ; meilleures ventes sans doublon',()=>{
 const items=[p('a','A',{image:null}),p('b','B',{purchaseDisabled:true}),p('c','C')];
 assert.deepEqual(pickNewArrivals(items).map(x=>x.id),['c']);
 assert.deepEqual(pickBestSellers([p('c','C'),p('d','D'),p('e','E')],[p('c','C')],2).map(x=>x.id),['d','e']);
});
