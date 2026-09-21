#!/usr/bin/env node
// Audit hors ligne du même catalogue mappé que /api/products. Aucune écriture Shopify.
const fs=require('node:fs');
const path=require('node:path');
const {buildFilterProduct}=require('../lib/catalog-filters');
const {prepareSearchProduct,searchCatalog,familyMatches}=require('../lib/search-catalog');
const batch=require('../data/catalog-enrichment/fermob-tables.json');
function prepare(card,preview=false) {
  const raw={tags:card.tags,filterMetafields:['material','dimensions','usage'].map(key=>({namespace:'custom',key,value:card[key]||''})),variants:{edges:card.variants.map(v=>({node:{selectedOptions:v.options}}))}};
  return prepareSearchProduct(buildFilterProduct(raw,card),{preview});
}
function audit(cards) {
  const before=cards.map(p=>prepare(p)),after=cards.map(p=>prepare(p,true));
  const rows=cards.map((p,i)=>{
    const vs=before[i].variants, enriched=after[i].variants;
    const capacityApplicable=familyMatches(p.productType,p.name,'table')||/^(canap|banc|banquette)/i.test(p.productType);
    const dimensions=v=>v.search.configurations.some(c=>c.dimensions.size?.length);
    const capacity=v=>v.search.configurations.some(c=>c.capacity);
    const row=batch.products.find(r=>r.id===p.id);
    return {id:p.id,handle:p.handle,name:p.name,brand:p.brand,type:p.productType,
      dimensionsText:Boolean(p.dimensions),materialText:Boolean(p.material),
      dimensionsBefore:vs.some(dimensions),dimensionsAfter:enriched.some(dimensions),
      heightBefore:vs.some(v=>v.search.configurations.some(c=>Number.isFinite(c.dimensions.height))),heightAfter:enriched.some(v=>v.search.configurations.some(c=>Number.isFinite(c.dimensions.height))),
      capacityApplicable,capacityBefore:vs.some(capacity),capacityAfter:enriched.some(capacity),
      priceKnown:vs.every(v=>Number.isFinite(v.price)&&v.price>0),
      colorKnown:vs.every(v=>v.color.some(c=>c!=='non-renseigne')),materialKnown:vs.every(v=>v.material.some(c=>c!=='non-renseigne')),
      ...(row?{reviewIssues:row.issues}:{}),
    };
  });
  const summary=rs=>({products:rs.length,dimensionsText:rs.filter(r=>r.dimensionsText).length,materialText:rs.filter(r=>r.materialText).length,dimensionsBefore:rs.filter(r=>r.dimensionsBefore).length,dimensionsAfter:rs.filter(r=>r.dimensionsAfter).length,heightBefore:rs.filter(r=>r.heightBefore).length,heightAfter:rs.filter(r=>r.heightAfter).length,capacityApplicable:rs.filter(r=>r.capacityApplicable).length,capacityBefore:rs.filter(r=>r.capacityApplicable&&r.capacityBefore).length,capacityAfter:rs.filter(r=>r.capacityApplicable&&r.capacityAfter).length,priceKnown:rs.filter(r=>r.priceKnown).length,colorKnown:rs.filter(r=>r.colorKnown).length,materialKnown:rs.filter(r=>r.materialKnown).length});
  const group=key=>Object.fromEntries([...new Set(rows.map(r=>r[key]))].sort().map(k=>[k,summary(rows.filter(r=>r[key]===k))]));
  const queries=['table pour 6 personnes','table Fermob pour 6 personnes','table Fermob diamètre 77 cm pour 4 personnes 300€','table Fermob 143 x 80 cm pour 6 personnes','table Fermob pour 14 personnes','table Fermob longueur max 150 cm pour 14 personnes'];
  return {generatedAt:new Date().toISOString(),scope:'Snapshot du catalogue public ; champs canoniques non exposés par /api/products non mesurés. Before = moteur courant sans le lot, After = simulation du lot préparé, jamais un bilan de publication.',total:summary(rows),diningTables:summary(rows.filter(r=>familyMatches(r.type,r.name,'table'))),byBrand:group('brand'),byType:group('type'),examples:queries.map(q=>({q,before:searchCatalog(before,{q}).total,after:searchCatalog(after,{q}).total})),products:rows};
}
if(require.main===module) {
  const [input,output]=process.argv.slice(2);
  if(!input||!output)throw new Error('Usage: node scripts/audit-search-data.cjs products.json report.json');
  const result=audit(JSON.parse(fs.readFileSync(input,'utf8')));
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({total:result.total,tables:result.diningTables,examples:result.examples},null,2));
}
module.exports={audit,prepare};
