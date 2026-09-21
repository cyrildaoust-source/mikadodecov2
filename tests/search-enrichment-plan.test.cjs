const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {plan}=require('../scripts/prepare-search-enrichment.cjs');
function fixture(){
 const source=Buffer.from('source fabricant capturée'),sha256=createHash('sha256').update(source).digest('hex');
 const variants=[{id:'v1',sku:'FER-BIS-0233-E8',options:[{name:'Couleur',value:'Beige latte'}]}];
 const row={id:'p1',handle:'bistro',name:'Table Bistro',brand:'Fermob',binding:{status:'verified',shopifyUpdatedAt:'date',variants},facts:{version:1,configurations:[{id:'standard',label:'',dimensions:{diameter:77},capacity:{status:'verified',max:4}}]},sources:[{sha256},{sha256}],issues:[]};
 const snapshot={data:{nodes:[{id:'p1',handle:'bistro',title:'Table Bistro',vendor:'Fermob',updatedAt:'date',facts:null,variants:{pageInfo:{hasNextPage:false},nodes:variants.map(v=>({id:v.id,sku:v.sku,selectedOptions:v.options}))}}]}};
 return {source,row,snapshot,batch:{batchId:'test',products:[row]}};
}
test('la préparation est locale et refuse un changement, une pagination incomplète ou un métachamp existant',()=>{
 const f=fixture(),run=()=>plan(f.snapshot,()=>f.source,f.batch);
 assert.equal(run().proposals.length,1);assert.equal(run().shopifyWrites,0);
 const p=f.snapshot.data.nodes[0];
 p.facts={value:'manuel'};assert.equal(run().blocked.length,1);p.facts=null;
 p.updatedAt='autre';assert.equal(run().blocked.length,1);p.updatedAt='date';
 p.variants.pageInfo.hasNextPage=true;assert.equal(run().blocked.length,1);p.variants.pageInfo.hasNextPage=false;
 p.variants.nodes[0].sku='AUTRE';assert.equal(run().blocked.length,1);
});
test('une capture altérée ou un fait invalide bloque la production des propositions',()=>{
 const f=fixture();assert.throws(()=>plan(f.snapshot,()=>Buffer.from('altérée'),f.batch),/altérée/);
 f.row.facts.configurations[0].capacity.max=0;assert.throws(()=>plan(f.snapshot,()=>f.source,f.batch),/invalides/);
});
