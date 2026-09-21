// Contrat de filtrage du pilote Chaises. Les valeurs inconnues restent distinctes
// de « non ». Aucune caractéristique n'est déduite de la marque ou d'une photo.
const { imageIdentity } = require('../v3/product-variant');
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/[’']/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const slug = value => normalize(value).replace(/ /g, '-');
const unique = values => [...new Set(values)];
const UNKNOWN = 'non-renseigne';
const COLORS = { blanc: 'Blanc', beige: 'Beige', gris: 'Gris', noir: 'Noir', brun: 'Brun', rouge: 'Rouge', rose: 'Rose', orange: 'Orange', jaune: 'Jaune', vert: 'Vert', bleu: 'Bleu', violet: 'Violet', naturel: 'Bois naturel', dore: 'Doré', argent: 'Argenté', [UNKNOWN]: 'Autres finitions' };
const MATERIALS = { bois: 'Bois', metal: 'Métal', plastique: 'Plastique', tissu: 'Tissu', cuir: 'Cuir', corde: 'Corde & fibres', [UNKNOWN]: 'Matière non précisée' };
const USAGES = { interieur: 'Intérieur', exterieur: 'Extérieur', [UNKNOWN]: 'Usage non précisé' };
const FEATURES = { accoudoirs: 'Avec accoudoirs', 'sans-accoudoirs': 'Sans accoudoirs', empilable: 'Empilable', pliant: 'Pliant' };
// Correspondances explicites du nuancier déjà documenté dans le site.
const FERMOB_COLORS = { cactus: 'vert', pesto: 'vert', romarin: 'vert', 'menthe glaciale': 'vert', reglisse: 'noir', carbone: 'gris', guimauve: 'violet', miel: 'jaune', 'citron givre': 'jaune', 'pain d epices': 'brun', muscade: 'brun', tonka: 'brun', 'cerise noire': 'rouge', piment: 'rouge' };
const COLOR_WORDS = { blanc: 'blanc', white: 'blanc', creme: 'blanc', beige: 'beige', sand: 'beige', sable: 'beige', gris: 'gris', grey: 'gris', gray: 'gris', noir: 'noir', black: 'noir', brun: 'brun', marron: 'brun', brown: 'brun', rouge: 'rouge', red: 'rouge', rose: 'rose', pink: 'rose', orange: 'orange', tangerine: 'orange', jaune: 'jaune', yellow: 'jaune', vert: 'vert', green: 'vert', bleu: 'bleu', blue: 'bleu', violet: 'violet', purple: 'violet', mauve: 'violet', lilac: 'violet', lilas: 'violet', dore: 'dore', gold: 'dore', golden: 'dore', argent: 'argent', silver: 'argent', chrome: 'argent' };
const MATERIAL_WORDS = { bois: /\b(bois|wood|chene|oak|hetre|beech|frene|ash|noyer|walnut|bouleau|birch|teck|teak|contreplaque|plywood)\b/, metal: /\b(metal|acier|steel|aluminium|aluminum|inox|iron|fer|chrome)\b/, plastique: /\b(plastique|plastic|polypropylene|polycarbonate|polyurethane|polyethylene|polyamide|resine|resin|abs)\b/, tissu: /\b(tissu|fabric|textile|laine|wool|velours|velvet|coton|cotton|polyester|lin|linen)\b/, cuir: /\b(cuir|leather)\b/, corde: /\b(corde|cord|cordage|rotin|rattan|cannage|cane|paille|straw)\b/ };

function colors(value, brand = '') {
  const text = normalize(value);
  if (normalize(brand) === 'fermob' && FERMOB_COLORS[text]) return [FERMOB_COLORS[text]];
  const result = unique(text.split(' ').flatMap(word => COLOR_WORDS[word] || []));
  // « Chêne noir » reste noir ; le bois naturel est une finition explicitement nommée.
  if (!result.length && /\b(naturel|natural|chene|oak|hetre|beech|frene|ash|noyer|walnut|bouleau|birch|teck|teak)\b/.test(text)) result.push('naturel');
  return result;
}
const materials = value => Object.entries(MATERIAL_WORDS).filter(([, pattern]) => pattern.test(normalize(value))).map(([key]) => key);
const COLOR_AXIS = /^(couleur|coloris|color|colour|finition|couleur assise|couleur de l assise|revetement)$/;
const MATERIAL_AXIS = /^(matiere|material|essence bois|bois|pietement|structure|assise|revetement|tissu|cuir|finition)$/;

function metaMap(list) {
  return Object.fromEntries((list || []).filter(Boolean).map(m => [m.namespace + '.' + m.key, m]));
}
function referenceLabels(field) {
  if (!field) return [];
  if (field.type?.includes('reference')) return (field.references?.nodes || (field.reference ? [field.reference] : [])).map(o => o.fields?.find(f => ['label', 'name'].includes(f.key))?.value || o.handle || '').filter(Boolean);
  try { const value = JSON.parse(field.value); return Array.isArray(value) ? value.filter(v => typeof v === 'string' && !v.startsWith('gid:')) : []; } catch { return [field.value].filter(Boolean); }
}
function finiteMeasure(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).replace(',', '.').trim();
  if (!/^\d+(?:\.\d+)?$/.test(text)) return null;
  const n = Number(text); return n > 0 && n <= 500 ? n : null;
}
function measure(meta, key, text) {
  const direct = finiteMeasure(meta['custom.' + key]?.value);
  if (direct !== null) return { value: direct, source: 'custom.' + key };
  // Reprise déterministe d'une mesure explicitement nommée, jamais d'un triplet sans légende.
  const labels = { seat_height_cm: '(?:hauteur d[’\x27 ]assise|hauteur assise|assise[^;]*?\\bH)', width_cm: '(?:largeur|\\bL)', depth_cm: '(?:profondeur|\\bP)', height_cm: '(?:hauteur(?! d[’\x27 ]assise)|\\bH)' };
  const matches = [...String(text || '').matchAll(new RegExp(labels[key] + '\\s*[:=]?\\s*(\\d+(?:[.,]\\d+)?)\\s*(cm|mm)\\b', 'gi'))];
  const numbers = unique(matches.map(match => Number(match[1].replace(',', '.')) / (match[2].toLowerCase() === 'mm' ? 10 : 1)));
  if (numbers.length !== 1) return null;
  const n = numbers[0];
  return n > 0 && n <= 500 ? { value: n, source: 'custom.dimensions:explicit' } : null;
}

function buildFilterProduct(raw, card) {
  const meta = metaMap(raw.filterMetafields);
  const value = key => meta[key]?.value || '';
  const tags = (raw.tags || []).map(normalize);
  const productMaterial = unique([
    ...referenceLabels(meta['shopify.furniture-fixture-material']).flatMap(materials),
    ...referenceLabels(meta['shopify.material']).flatMap(materials),
    ...materials(value('custom.material') || value('custom.materiaux') || card.material),
    ...tags.flatMap(t => Object.keys(MATERIAL_WORDS).includes(t) || ['aluminium', 'acier', 'hetre', 'chene', 'bouleau', 'frene', 'noyer', 'teck', 'rotin', 'polypropylene'].includes(t) ? materials(t) : []),
  ]);
  const usageText = normalize(value('custom.usage'));
  const usage = unique(['interieur','exterieur'].filter(k => usageText.includes(k) || tags.includes(k)));
  const features = [];
  const featureText = referenceLabels(meta['shopify.chair-features']).map(normalize);
  const has = candidates => [...tags, ...featureText].some(t => candidates.includes(t));
  const bool = key => value('custom.' + key) === 'true' ? true : value('custom.' + key) === 'false' ? false : null;
  const armrests = bool('has_armrests');
  if (armrests === true || armrests === null && has(['accoudoirs','avec accoudoirs','armrests','with armrests'])) features.push('accoudoirs');
  if (armrests === false || armrests === null && has(['sans accoudoirs','armless','without armrests'])) features.push('sans-accoudoirs');
  if (bool('stackable') ?? has(['empilable','stackable'])) features.push('empilable');
  if (bool('foldable') ?? has(['pliable','pliante','pliant','foldable','folding'])) features.push('pliant');
  const measurements = Object.fromEntries(['seat_height_cm','width_cm','depth_cm','height_cm'].map(k => [k, measure(meta, k, value('custom.dimensions'))]));
  const rawVariants = raw.variants.edges.map(e => e.node);
  const variableMaterials = unique(rawVariants.flatMap(v => (v.selectedOptions || []).filter(o => MATERIAL_AXIS.test(normalize(o.name))).flatMap(o => materials(o.value))));
  const baseMaterials = productMaterial.filter(k => variableMaterials.length < 2 || !variableMaterials.includes(k));
  const variants = card.variants.map((v, i) => {
    const vm = metaMap(rawVariants[i]?.filterMetafields);
    const canonicalColors = referenceLabels(vm['custom.color_family'] || vm['shopify.color-pattern']).flatMap(x => colors(x, card.brand));
    const variantColors = canonicalColors.length ? canonicalColors : (v.options || []).filter(o => COLOR_AXIS.test(normalize(o.name))).flatMap(o => colors(o.value, card.brand));
    const variantMaterials = (v.options || []).filter(o => MATERIAL_AXIS.test(normalize(o.name))).flatMap(o => materials(o.value));
    const canonicalMaterials = referenceLabels(vm['custom.material_family']).flatMap(materials);
    const mats = canonicalMaterials.length ? unique(canonicalMaterials) : unique([...baseMaterials, ...variantMaterials]);
    const finishOptions = (v.options || []).filter(o => COLOR_AXIS.test(normalize(o.name)));
    // Les segments explicitement nommés distinguent le bois visible d'un bois peint.
    // Ce score de présentation ne certifie pas la couleur depuis une photographie.
    const appearance = unique([...variantColors, ...finishOptions.flatMap(o => o.value.split(/\s*[/+]\s*/).flatMap(part => colors(part, card.brand)))]);
    const partialFinish = finishOptions.some(o => /\b(assise|seat|dossier|back|pietement|cadre|frame|sangle|webbing|hpl|lamifi[ée]|laminate)\b/.test(normalize(o.value)))
      || finishOptions.some(o => /assise|revetement/.test(normalize(o.name)));
    const labelOptions = (v.options || []).filter(o => o.value && o.value !== 'Default Title');
    const finishLabel = labelOptions.map(o => labelOptions.length > 1 ? `${o.name} : ${o.value}` : o.value).join(' · ') || (v.title === 'Default Title' ? '' : v.title || '');
    const searchWords = normalize([card.name, card.brand, v.title, ...labelOptions.map(o => o.value)].join(' ')).split(' ');
    return { ...v, searchFacts: vm['custom.search_facts']?.value ?? null, finishLabel, appearance, partialFinish, searchWords, color: unique(variantColors).length ? unique(variantColors) : [UNKNOWN], material: mats.length ? mats : [UNKNOWN] };
  });
  return { card, searchFacts: meta['custom.search_facts']?.value ?? null, brand: slug(card.brand), usage: usage.length ? usage : [UNKNOWN], features, measurements, variants };
}

const LIST_KEYS = ['brand','color','material','usage','feature'];
const NUMBER_KEYS = ['min','max','seat_min','seat_max'];
function parseFilters(input) {
  const params = input instanceof URLSearchParams ? input : new URLSearchParams(Object.entries(input || {}).flatMap(([k,v]) => Array.isArray(v) ? v.map(x=>[k,x]) : [[k,v]]));
  const state = { sort: ['pop','asc','desc','az'].includes(params.get('sort')) ? params.get('sort') : 'pop', page: Math.min(100000, Math.max(1, parseInt(params.get('page'),10) || 1)), tag: /^[a-z0-9-]+$/.test(params.get('tag') || '') ? params.get('tag') : '', stock: params.get('stock') === '1' };
  state.q = (params.get('q') || '').trim().slice(0, 200);
  for (const key of LIST_KEYS) state[key] = unique(params.getAll(key).flatMap(x=>x.split(',')).filter(x=>/^[a-z0-9-]{1,80}$/.test(x))).slice(0,40);
  for (const key of NUMBER_KEYS) {
    const value = params.get(key)?.trim().replace(',','.');
    state[key] = value && /^\d+(?:\.\d{1,2})?$/.test(value) && Number(value) <= (key.startsWith('seat') ? 500 : 1000000) ? Number(value) : null;
  }
  for (const [a,b] of [['min','max'],['seat_min','seat_max']]) if (state[a] !== null && state[b] !== null && state[a] > state[b]) [state[a],state[b]] = [state[b],state[a]];
  return state;
}
function filterParams(state, { page = state.page } = {}) {
  const p = new URLSearchParams();
  for (const k of LIST_KEYS) if(state[k]?.length) p.set(k, state[k].join(','));
  for (const k of NUMBER_KEYS) if(state[k] !== null && state[k] !== undefined) p.set(k, String(state[k]));
  if(state.stock) p.set('stock','1');
  if(state.tag) p.set('tag',state.tag);
  if(state.q) p.set('q',state.q);
  if(state.sort && state.sort !== 'pop') p.set('sort',state.sort);
  if(page > 1) p.set('page',String(page));
  return p;
}
const overlaps = (actual, wanted) => !wanted?.length || wanted.some(k => actual.includes(k));
function matchingVariants(product, state, omit = '') {
  if (omit !== 'brand' && !overlaps([product.brand],state.brand)) return [];
  if (omit !== 'usage' && !overlaps(product.usage,state.usage)) return [];
  if (omit !== 'feature' && state.feature.some(f=>!product.features.includes(f))) return [];
  if (state.tag && !product.card.tags.includes(state.tag)) return [];
  if (omit !== 'seat' && (state.seat_min !== null || state.seat_max !== null)) {
    const n = product.measurements.seat_height_cm?.value;
    if (n === undefined || (state.seat_min !== null && n < state.seat_min) || (state.seat_max !== null && n > state.seat_max)) return [];
  }
  const words = normalize(state.q).split(' ').filter(Boolean);
  return product.variants.filter(v => Number.isFinite(v.price)
    && words.every((word, i) => v.searchWords.some(actual => actual === word || i === words.length - 1 && /^[a-z]{3,}$/.test(word) && actual.startsWith(word)))
    && (omit === 'color' || overlaps(v.color,state.color))
    && (omit === 'material' || overlaps(v.material,state.material))
    && (omit === 'price' || ((state.min === null || v.price >= state.min) && (state.max === null || v.price <= state.max)))
    && (omit === 'stock' || !state.stock || (v.available && typeof v.qty === 'number' && v.qty > 0)));
}
function representativeVariants(variants, state) {
  const distance = v => !state.color.length ? 0 : (v.appearance || v.color).filter(c => c !== UNKNOWN && !state.color.includes(c)).length + Number(Boolean(v.partialFinish));
  return [...variants].sort((a,b) => Number(b.available) - Number(a.available) || distance(a) - distance(b) || a.price - b.price || a.id.localeCompare(b.id));
}
function variantHoverImage(v, card) {
  const main = imageIdentity(v.image || card.image);
  const variantImages = new Set(card.variants.map(variant => imageIdentity(variant.image)).filter(Boolean));
  // La vue complémentaire appartient au modèle : ne pas montrer le packshot
  // d'une autre finition ni répéter la même photo avec une autre taille CDN.
  const image = [card.image2, ...(card.images || [])].find(url => {
    const identity = imageIdentity(url);
    return identity && identity !== main && !variantImages.has(identity);
  });
  if (!image) return null;
  const url = new URL(image);
  if (url.hostname === 'cdn.shopify.com') { url.searchParams.set('width', '600'); url.searchParams.set('format', 'webp'); }
  return url.href;
}
function variantPresentation(v, card) {
  const stock = v.available && typeof v.qty === 'number' && v.qty > 0;
  return { variantId: v.id, matchedVariantId: v.id, finishLabel: v.finishLabel, price: v.price, priceIsExact: true,
    image: v.image || card.image, image2: variantHoverImage(v, card), compareAt: v.compareAtPrice > v.price ? v.compareAtPrice : null,
    available: v.available, purchaseDisabled: !v.available, inStock: Boolean(stock),
    availabilityLabel: !v.available ? 'Indisponible' : stock ? 'En stock' : 'Sur commande' };
}
function resultCard(product, variants, state) {
  const sorted = representativeVariants(variants, state), chosen = sorted[0];
  const prices = variants.map(v=>v.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const {id,handle,name,brand,badge,longDelay,leadTimeLabel} = product.card;
  const options = {};
  for(const v of variants) for(const o of v.options || []) (options[o.name] ||= new Set()).add(o.value);
  // Une seule carte par modèle. Les aperçus sont bornés et respectent tous les filtres.
  const choices = sorted.filter((v,i,all) => all.findIndex(other => other.finishLabel === v.finishLabel && other.image === v.image) === i);
  return { id,handle,name,brand,badge,longDelay,leadTimeLabel, ...variantPresentation(chosen, product.card),
    priceMin: min, priceMax: max,
    finishChoices: choices.slice(0,4).map(v => variantPresentation(v, product.card)), finishCount: choices.length,
    variantCount: variants.length, variantOptions: Object.entries(options).map(([name,values])=>({name,count:values.size})),
  };
}
function filterCatalog(products, input, pageSize = 60) {
  const state = parseFilters(input), facets = {};
  const labels = { brand: Object.fromEntries(products.map(p=>[p.brand,p.card.brand])), color: COLORS, material: MATERIALS, usage: USAGES, feature: FEATURES };
  for(const key of LIST_KEYS) {
    const counts = new Map();
    for(const p of products) {
      const variants = matchingVariants(p,state,key); if(!variants.length) continue;
      const values = key === 'brand' ? [p.brand] : key === 'usage' ? p.usage : key === 'feature' ? p.features : unique(variants.flatMap(v=>v[key]));
      for(const v of values) counts.set(v,(counts.get(v)||0)+1);
    }
    if(key === 'feature') for(const value of counts.keys()) counts.set(value,products.filter(p=>matchingVariants(p,{...state,feature:unique([...state.feature,value])}).length).length);
    // Une valeur active reste retirable même quand elle donne zéro résultat.
    for(const v of state[key]) if(!counts.has(v)) counts.set(v,0);
    facets[key] = [...counts].map(([value,count])=>({value,label:labels[key][value] || value,count})).sort((a,b)=>Number(a.value===UNKNOWN)-Number(b.value===UNKNOWN)||a.label.localeCompare(b.label,'fr'));
  }
  const prices = products.flatMap(p=>matchingVariants(p,state,'price').map(v=>v.price));
  facets.price = prices.length ? {min:Math.min(...prices),max:Math.max(...prices)} : {min:0,max:0};
  facets.stock = products.filter(p=>matchingVariants(p,{...state,stock:true}).length).length;
  const seats = products.filter(p=>p.measurements.seat_height_cm);
  facets.seat = {known:seats.length,total:products.length};
  const all = products.flatMap(p=>{const vs=matchingVariants(p,state);return vs.length ? [resultCard(p,vs,state)] : [];});
  if(state.sort === 'asc') all.sort((a,b)=>a.price-b.price);
  if(state.sort === 'desc') all.sort((a,b)=>b.price-a.price);
  if(state.sort === 'az') all.sort((a,b)=>a.name.localeCompare(b.name,'fr'));
  const total = all.length, totalPages = Math.max(1,Math.ceil(total/pageSize));
  state.page = Math.min(state.page,totalPages);
  return {items:all.slice((state.page-1)*pageSize,state.page*pageSize),total,totalPages,pageSize,state,facets};
}

module.exports = {buildFilterProduct,filterCatalog,parseFilters,filterParams,matchingVariants,resultCard,colors,materials,measure,normalize,slug};
