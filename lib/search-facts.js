// Contrat partagé avec la préparation des données : aucune capacité déduite d'une cote.
const AXES = ['length','width','depth','height','diameter'];
const STATES = ['verified','unknown','conflict','not_applicable'];
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const only = (value, keys) => Object.keys(value).every(k => keys.includes(k));
function parseSearchFacts(field) {
  if (field == null) return null;
  // Un champ présent mais illisible ne réactive pas les anciennes suppositions textuelles.
  const invalid = {version:1,invalid:true,configurations:[]};
  let data;
  try { data = typeof field === 'string' ? JSON.parse(field) : field; } catch { return invalid; }
  if (!object(data) || data.version !== 1 || !Array.isArray(data.configurations) || !data.configurations.length || data.configurations.length > 12) return invalid;
  const ids = new Set();
  for (const c of data.configurations) {
    if (!object(c) || !only(c,['id','label','dimensions','capacity']) || !/^[a-z0-9-]{1,50}$/.test(c.id) || ids.has(c.id)) return invalid;
    ids.add(c.id);
    if (typeof c.label !== 'string' || c.label.length > 100 || c.id !== 'standard' && !c.label.trim()) return invalid;
    if (!object(c.dimensions) || !only(c.dimensions, AXES) || Object.values(c.dimensions).some(n => typeof n !== 'number' || !Number.isFinite(n) || n <= 0 || n > 2000)) return invalid;
    if (!object(c.capacity) || !only(c.capacity,['status','max']) || !STATES.includes(c.capacity.status)) return invalid;
    if (c.capacity.status === 'verified' ? !Number.isInteger(c.capacity.max) || c.capacity.max < 1 || c.capacity.max > 100 : 'max' in c.capacity) return invalid;
  }
  return {version:1,configurations:data.configurations.map(c=>({...c,dimensions:{...c.dimensions},capacity:{...c.capacity}}))};
}
function dimensionFacts(d) {
  const facts={...d};
  const span=d.length??d.width, cross=d.length!==undefined?(d.width??d.depth):d.depth;
  if (Number.isFinite(span)&&Number.isFinite(cross)) facts.format=[span,cross,...(Number.isFinite(d.height)?[d.height]:[])];
  facts.size=[...new Set(Object.values(d).filter(Number.isFinite))];
  return facts;
}
function configurations(facts) {
  return (facts.configurations.length?facts.configurations:[{id:'standard',label:'',dimensions:{},capacity:{status:'unknown'}}]).map(c=>({id:c.id,label:c.label,dimensions:dimensionFacts(c.dimensions),capacity:c.capacity.status==='verified'?{min:1,max:c.capacity.max}:null,capacityStatus:c.capacity.status}));
}
// Le lot de qualification est injecté uniquement dans une preview explicitement activée.
// La production lit custom.search_facts ; elle ne dépend jamais de ce lot local.
function previewFacts(card, variant, enabled = process.env.VERCEL_ENV === 'preview' && process.env.CATALOG_ENRICHMENT_PREVIEW === '1') {
  if (!enabled) return null;
  const batches = [require('../data/catalog-enrichment/fermob-tables.json'),require('../data/catalog-enrichment/artek-tables.json')];
  const row = batches.flatMap(batch=>batch.products).find(p=>p.id===card.id && p.handle===card.handle && p.name===card.name && p.brand===card.brand);
  if (!row?.facts || row.binding.status!=='verified') return null;
  const binding = row.binding.variants.find(v=>v.id===variant.id);
  if (!binding || JSON.stringify(binding.options)!==JSON.stringify(variant.options)) return null;
  return parseSearchFacts(row.facts);
}
module.exports={parseSearchFacts,dimensionFacts,configurations,previewFacts,AXES,STATES};
