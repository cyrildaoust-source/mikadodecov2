const {normalize,parseFilters,resultCard,buildFilterProduct,materials} = require('./catalog-filters');
const {parseSearch,fold,finishWords,cm} = require('./search-intent');
const {chairQuery,readChairCatalog,VARIANT_QUERY} = require('./chair-catalog');
const {parseSearchFacts,configurations,previewFacts} = require('./search-facts');

// Mêmes variantes complètes et mêmes cartes que les filtres de catégorie.
function searchQuery(fragment) {
  return chairQuery(fragment).replace(/query CollectionCatalog\(\$handle: String!, \$after: String\) \{\s*collection\(handle: \$handle\) \{\s*handle title description\s*products\(first: 50, after: \$after, sortKey: BEST_SELLING\)/,
    'query SearchCatalog($q: String!, $after: String) { search(query: $q, first: 50, after: $after, types: [PRODUCT], prefix: LAST, unavailableProducts: HIDE)')
    .replace('edges { node {\n            ...ProductCardFields','edges { node { ... on Product {\n            ...ProductCardFields')
    .replace(/\n          \} \}\n        \}\n      \}\n    \}$/, '\n          } } }\n        }\n    }');
}
function scopedSearchQuery(fragment) {
  return searchQuery(fragment).replace('query SearchCatalog($q: String!, $after: String)', 'query ScopedSearchCatalog($q: String!, $after: String)')
    .replace('search(query: $q, first: 50, after: $after, types: [PRODUCT], prefix: LAST, unavailableProducts: HIDE)', 'search: products(query: $q, first: 100, after: $after, sortKey: BEST_SELLING)');
}

function dimensions(text) {
  const value=fold(text), result={};
  const unit=[...value.matchAll(/(?:\d|\s)(mm|cm|m)\b/g)].at(-1)?.[1];
  if(!unit)return result;
  const labels={width:'largeur|width|w',length:'longueur|length',depth:'profondeur|depth|p|d',height:'hauteur|height|h',diameter:'diametre|diameter|ø'};
  const values={};
  for(const [key,pattern] of Object.entries(labels)) {
    const hits=[...value.matchAll(new RegExp('(?:\\b(?:'+pattern+')\\b|'+(key==='diameter'?'ø':'(?!)')+')\\s*[:=]?\\s*(\\d+(?:[.,]\\d+)?)\\s*(mm|cm|m)?','g'))].map(m=>cm(m[1],m[2]||unit));
    if(new Set(hits).size===1)values[key]=hits[0];
  }
  // L est la portée horizontale explicitement cotée ; aucune déduction depuis un triplet nu.
  const span=[...value.matchAll(/\bl\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?/g)].map(m=>cm(m[1],m[2]||unit));
  if(new Set(span).size===1) {values.width??=span[0];values.length??=span[0];}
  for(const [key,n] of Object.entries(values))if(n>0&&n<=2000)result[key]=n;
  const tuples=[...value.matchAll(/(\d+(?:[.,]\d+)?)\s*[×x]\s*(\d+(?:[.,]\d+)?)(?:\s*[×x]\s*(\d+(?:[.,]\d+)?))?\s*(mm|cm|m)\b/g)];
  if(tuples.length===1)result.format=tuples[0].slice(1,4).filter(Boolean).map(n=>cm(n,tuples[0][4]));
  const singles=[...value.matchAll(/\b(\d+(?:[.,]\d+)?)\s*(mm|cm|m)\b/g)].map(m=>cm(m[1],m[2]));
  result.size=[...new Set([...Object.values(values),...(result.format||[]),...singles])].filter(n=>n>0&&n<=2000);
  return result;
}
function capacity(text) {
  const t=fold(text);
  const range=t.match(/\b(\d{1,2})\s*(?:a|–|-|\/)\s*(\d{1,2})\s*(?:personnes|places|convives)\b/);
  if(range)return {min:Number(range[1]),max:Number(range[2])};
  const single=t.match(/\b(\d{1,2})\s*(?:personnes|places|convives)\b/);
  return single?{min:1,max:Number(single[1])}:null;
}
function prepareSearchProduct(product, options={}) {
  const p=product.card;
  const base=dimensions(p.dimensions || p.name);
  const titleDimensions=dimensions(p.name);
  // Les formats peuvent n'être donnés que dans le titre, sans remplacer les cotes précises.
  if(!p.dimensions) {base.size=[...new Set([...(base.size||[]),...(titleDimensions.size||[])])];base.format??=titleDimensions.format;}
  const adjustable=/\b(allonges?|extensible|extendable|extension)\b/.test(normalize(p.name+' '+p.description));
  const factCapacity=adjustable?null:capacity(p.name)||capacity(p.description);
  const variableSize=product.variants.some(v=>v.options.some(o=>/^(taille|dimensions?|size|largeur|longueur|profondeur|hauteur|diametre|places|capacite)$/.test(normalize(o.name))));
  product.search={type:normalize(p.productType),words:normalize([p.name,p.brand,p.designer].join(' ')).split(' '),description:normalize(p.description)};
  for(const v of product.variants) {
    const sizeOptions=v.options.filter(o=>/^(taille|dimensions?|size|largeur|longueur|profondeur|hauteur|diametre|places|capacite)$/.test(normalize(o.name)));
    const variantDimensions=dimensions(sizeOptions.map(o=>/taille|dimension|size/.test(normalize(o.name))?o.value:o.name+' '+o.value).join(' ; '));
    // Une option de taille empêche d'appliquer les dimensions communes d'une autre configuration.
    const facts=variableSize?variantDimensions:adjustable?{}:{...base};
    if(!variableSize&&!adjustable)for(const [key,field] of Object.entries({width:'width_cm',depth:'depth_cm',height:'height_cm'}))if(product.measurements[field])facts[key]=product.measurements[field].value;
    const capacityOption=sizeOptions.find(o=>/place|capacite/.test(normalize(o.name)));
    const cap=capacityOption?capacity(capacityOption.value+' places'):(variableSize?null:factCapacity);
    const finishText=normalize(v.options.filter(o=>!/taille|dimension|size/.test(normalize(o.name))).map(o=>o.value).join(' '));
    const extraMaterial=normalize(p.material);
    const finishFallback=product.variants.length===1?normalize(p.material+' '+p.name):extraMaterial;
    const extras={verre:/\b(verre|glass)\b/,ceramique:/\b(ceramique|ceramic|gres|porcelaine)\b/,marbre:/\b(marbre|marble)\b/};
    for(const [m,re] of Object.entries(extras))if(re.test(finishText+' '+extraMaterial)&&!v.material.includes(m))v.material.push(m);
    const canonical=parseSearchFacts(v.searchFacts) || (!variableSize ? parseSearchFacts(product.searchFacts) : null) || previewFacts(p,v,options.preview);
    const configs=canonical?configurations(canonical):[{id:'standard',label:'',dimensions:facts,capacity:cap,capacityStatus:cap?'declared':'unknown'}];
    v.search={dimensions:configs[0]?.dimensions||{},capacity:configs[0]?.capacity||null,configurations:configs,finish:finishText,finishFallback};
  }
  return product;
}

function familyMatches(type,name,id) {
  const t=normalize(type), n=normalize(name);
  switch(id) {
    case 'table':return /^(table|table a manger|table de salle a manger|table de repas|table exterieure|table de jardin)$/.test(t);
    case 'chaise':return /^chaise(?: avec accoudoirs)?$/.test(t);
    case 'chaise-bar':return /^(chaise|tabouret) (?:de )?(?:bar|snack|haut)/.test(t);
    case 'chaise-longue':return /chaise longue|transat|bain de soleil/.test(t);
    case 'table-basse':return /^table basse/.test(t);
    case 'table-appoint':return /^table d appoint|^gueridon/.test(t);
    case 'lampe':return /^(lampe|luminaire|suspension|lampadaire|applique|plafonnier)/.test(t);
    case 'lampe-table':return /^lampe (?:de table|de bureau|a poser|de chevet)/.test(t);
    case 'lampe-portable':return /^lampe (?:portable|baladeuse)/.test(t);
    case 'table-chevet':return /^table de chevet/.test(t);
    case 'armoire':return /^armoire/.test(t)||/^armoire/.test(n);
    case 'buffet':return /^buffet|^enfilade/.test(t)&&!/^armoire/.test(n);
    case 'etagere':return /^etagere|^bibliotheque/.test(t);
    case 'meuble-tv':return /^meuble tv/.test(t);
    default:return t===id||t.startsWith(id+' ');
  }
}
// Une seule faute dans un mot long ; références numériques toujours exactes.
function near(a,b) {
  if(a===b)return true;
  if(a.length<5||b.length<5||Math.abs(a.length-b.length)>1||/\d/.test(a+b))return false;
  if(a.length===b.length) {
    const d=[...a].flatMap((x,i)=>x===b[i]?[]:[i]);
    return d.length===1||d.length===2&&d[1]===d[0]+1&&a[d[0]]===b[d[1]]&&a[d[1]]===b[d[0]];
  }
  const [short,long]=a.length<b.length?[a,b]:[b,a];let i=0,j=0;
  while(i<short.length&&j<long.length){if(short[i]===long[j]){i++;j++;}else j++;if(j-i>1)return false;}return true;
}
function matches(product,v,c,configuration=v.search) {
  const p=product.card, facts={...v.search,...configuration};
  switch(c.kind) {
    case 'family':return familyMatches(p.productType,p.name,c.value);
    case 'brand':return normalize(p.brand)===c.value;
    case 'price':return v.price>=c.min&&v.price<=c.max;
    case 'color':case 'material':return c.values[c.mode==='any'?'some':'every'](x=>v[c.kind].includes(x));
    case 'finish':return c.values[c.mode==='any'?'some':'every'](x=>new RegExp('\\b(?:'+finishWords[x]+')\\b').test(facts.finish||facts.finishFallback));
    case 'capacity':return facts.capacity!==null && c.value<=facts.capacity.max && c.value>0;
    case 'size': {let ns=(c.axis==='size'?facts.dimensions.size:[facts.dimensions[c.axis]])?.filter(Number.isFinite)||[];if(c.axis==='size'&&c.op!=='eq'&&ns.length)ns=[Math.max(...ns)];return ns.some(n=>c.op==='max'?n<=c.value:c.op==='min'?n>=c.value:Math.abs(n-c.value)<.01);}
    case 'format': {
      const d=facts.dimensions, span=d.length??d.width;
      const cross=d.length!==undefined?(d.depth??d.width):d.depth;
      const format=d.format||(Number.isFinite(span)&&Number.isFinite(cross)?[span,cross,...(Number.isFinite(d.height)?[d.height]:[])]:null);
      return Boolean(format&&format.length>=c.values.length&&c.values.every((n,i)=>Math.abs(n-format[i])<.01));
    }
    case 'stock':return v.available&&typeof v.qty==='number'&&v.qty>0;
    case 'shape': {const text=normalize(p.name+' '+v.title);return ({round:/\b(rond|ronde|round)\b/,square:/\b(carre|carree|square)\b/,oval:/\b(ovale|oval)\b/,rectangle:/\b(rectangulaire|rectangular)\b/})[c.value].test(text)||c.value==='round'&&Number.isFinite(facts.dimensions.diameter);}
    case 'feature':return product.features.includes(c.value);
    case 'usage':return product.usage.includes(c.value)||p.tags.some(t=>c.value==='exterieur'?['exterieur','mobilier-exterieur','mobilier-de-jardin'].includes(t):t==='interieur') || c.value==='exterieur'&&p.collections.some(t=>['outdoor','tables-outdoor'].includes(t));
    case 'text-feature':return c.values.some(word=>product.search.description.includes(word));
    case 'text': { const words=[...product.search.words,...v.searchWords];return c.values.every((word,i)=>words.some(w=>w===word||i===c.values.length-1&&word.length>=3&&!/\d/.test(word)&&w.startsWith(word)||near(w,word))); }
    default:return false;
  }
}
function searchURL(q,{omit=[],page=1,sort='pop'}={}) {
  const p=new URLSearchParams({q});if(omit.length)p.set('omit',omit.join(','));if(sort!=='pop')p.set('sort',sort);if(page>1)p.set('page',page);
  return '/produits.html?'+p;
}
function searchCatalog(products,input={},pageSize=60) {
  const intent=parseSearch(input.q,input.omit),sort=['asc','desc','az'].includes(input.sort)?input.sort:'pop';
  const selected=criteria=>products.flatMap(p=>{
    const vs=p.variants.flatMap(v=>{
      if(!Number.isFinite(v.price)||!v.available)return [];
      const compatible=v.search.configurations.filter(config=>criteria.every(c=>matches(p,v,c,config)));
      const config=compatible[0];
      if(!config)return [];
      // Afficher la configuration nécessaire, en conservant la carte et la vraie variante.
      const label=config.id!=='standard' && criteria.some(c=>['capacity','size','format'].includes(c.kind))?config.label:'';
      return [{...v,search:{...v.search,configurations:compatible},...(label?{finishLabel:[v.finishLabel,label].filter(Boolean).join(' · ')}:{})}];
    });
    return vs.length?[{p,vs}]:[];
  });
  const found=intent.issues.length?[]:selected(intent.criteria);
  const presentation=parseFilters({color:intent.criteria.find(c=>c.kind==='color')?.values.join(',')||''});
  let cards=found.map(({p,vs})=>resultCard(p,vs,presentation));
  if(sort==='asc')cards.sort((a,b)=>a.price-b.price);if(sort==='desc')cards.sort((a,b)=>b.price-a.price);if(sort==='az')cards.sort((a,b)=>a.name.localeCompare(b.name,'fr'));
  const total=cards.length,totalPages=Math.max(1,Math.ceil(total/pageSize)),page=Math.min(totalPages,Math.max(1,Math.min(100000,parseInt(input.page,10)||1)));
  const state={q:intent.q,omit:intent.omitted,page,sort};
  const criteria=intent.criteria.map(c=>({id:c.id,label:c.label,...(c.kind==='family'?{}:{removeURL:searchURL(intent.q,{omit:[...intent.omitted,c.id]})})}));
  const suggestions=[];
  if(!total&&!intent.issues.length)for(const c of intent.criteria.filter(c=>!['family','brand','text'].includes(c.kind))) {
    const others=selected(intent.criteria.filter(x=>x!==c));
    if(others.length)suggestions.push({label:'Sans « '+c.label+' »',count:others.length,url:searchURL(intent.q,{omit:[...intent.omitted,c.id]})});
  }
  const incomplete=[];
  for(const c of intent.criteria.filter(c=>['capacity','size','format'].includes(c.kind))) {
    const count=selected(intent.criteria.filter(x=>x!==c)).filter(({vs})=>vs.every(v=>!v.search.configurations.some(f=>c.kind==='capacity'?f.capacity:c.kind==='format'?(f.dimensions.format||Number.isFinite(f.dimensions.diameter)):c.axis==='size'?f.dimensions.size?.length:Number.isFinite(f.dimensions[c.axis]))) && (c.kind!=='capacity'||vs.some(v=>v.search.configurations.some(f=>f.capacityStatus!=='not_applicable')))).length;
    if(count)incomplete.push({label:c.kind==='capacity'?'capacité':'dimensions',count});
  }
  const categories=intent.needsCategory?['chaise','table','canapé','lampe','buffet'].map(word=>({label:word[0].toUpperCase()+word.slice(1),url:searchURL(word+' '+intent.q)})):[];
  return {items:cards.slice((page-1)*pageSize,page*pageSize),total,totalPages,pageSize,state,criteria,suggestions:intent.needsCategory?categories:suggestions.slice(0,3),needsCategory:intent.needsCategory,incomplete,issues:intent.issues,corrected:intent.correction,family:intent.family,resultsUrl:searchURL(intent.q,state)};
}

async function readSearchCatalog(fetchPage,mapProduct,fetchVariants) {
  const data=await readChairCatalog(async after=>({handle:'search',title:'Recherche',products:await fetchPage(after)}),mapProduct,fetchVariants);
  return data.products.map(prepareSearchProduct);
}
module.exports={searchQuery,scopedSearchQuery,VARIANT_QUERY,readSearchCatalog,searchCatalog,searchURL,prepareSearchProduct,dimensions,capacity,familyMatches,matches,near};
