#!/usr/bin/env node
// Produit des propositions pour le pipeline importer. Ne contacte pas Shopify.
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {parseSearchFacts}=require('../lib/search-facts');
const batch=require('../data/catalog-enrichment/fermob-tables.json');
function plan(snapshot,readSource,preparedBatch=batch) {
  if(!Array.isArray(snapshot?.data?.nodes))throw new Error('Snapshot Admin nodes requis');
  const proposals=[],blocked=[];
  for(const row of preparedBatch.products) {
    const p=snapshot.data.nodes.find(p=>p?.id===row.id);
    const block=reason=>blocked.push({id:row.id,handle:row.handle,reason});
    if(!row.facts||row.binding.status!=='verified'){block(row.issues.join(' '));continue;}
    if(parseSearchFacts(row.facts).invalid)throw new Error('Données invalides : '+row.handle);
    if(!p||p.handle!==row.handle||p.vendor!==row.brand||p.title!==row.name||p.updatedAt!==row.binding.shopifyUpdatedAt){block('Identité ou fiche modifiée depuis le rapprochement');continue;}
    if(p.variants?.pageInfo?.hasNextPage!==false){block('Variantes incomplètes');continue;}
    const canonical=vs=>JSON.stringify(vs.map(v=>({id:v.id,sku:v.sku,options:v.selectedOptions||v.options})).sort((a,b)=>a.id.localeCompare(b.id)));
    if(canonical(p.variants.nodes)!==canonical(row.binding.variants)){block('Identités, SKU ou options des variantes modifiés');continue;}
    if(p.facts){block('Métachamp déjà présent : comparaison et revue nécessaires, aucun écrasement automatique');continue;}
    for(const [index,source] of row.sources.entries()) {
      const bytes=readSource(row.handle,index===0?'html':'png');
      if(createHash('sha256').update(bytes).digest('hex')!==source.sha256)throw new Error('Source absente ou altérée : '+row.handle);
    }
    proposals.push({id:row.id,handle:row.handle,preconditions:{updatedAt:p.updatedAt,metafieldAbsent:true,variants:row.binding.variants},metafield:{namespace:'custom',key:'search_facts',type:'json',before:null,after:row.facts},sourceEvidence:row.sources,issues:row.issues});
  }
  return {version:1,batchId:preparedBatch.batchId,generatedAt:new Date().toISOString(),status:'review_required',shopifyWrites:0,proposals,blocked};
}
if(require.main===module) {
  const [snapshot,sources,output]=process.argv.slice(2);
  if(!snapshot||!sources||!output)throw new Error('Usage: node scripts/prepare-search-enrichment.cjs snapshot.json sources-dir proposals.json');
  const result=plan(JSON.parse(fs.readFileSync(snapshot,'utf8')),(handle,ext)=>fs.readFileSync(path.join(sources,handle+'.'+ext)));
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({proposals:result.proposals.length,blocked:result.blocked.length,shopifyWrites:0}));
}
module.exports={plan};
