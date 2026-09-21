const {normalize} = require('./catalog-filters');
const productTypes = require('../data/search-product-types.json');
const brands = [...new Set([
  ...require('../v3/mega-menu-brands.json').brands.map(b => b.name),
  ...Object.values(require('../v3/navigation-data.json').collections).filter(c => c.kind === 'brand').map(c => c.label),
])];
const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/\s+/g,' ').trim();
const N = '(?:\\d{1,3}(?: \\d{3})+|\\d+)(?:[.,]\\d{1,2})?';
const number = value => Number(value.replace(/ /g,'').replace(',','.'));
const cm = (value,unit) => Math.round(number(value) * (unit === 'm' ? 100 : unit === 'mm' ? .1 : 1) * 100) / 100;
const amountLabel = n => n.toLocaleString('fr-BE',{maximumFractionDigits:2});
const families = [
  ['lampe-table','Lampes de table','lampe de table','lampes? (?:de table|de bureau|a poser|de chevet)'],
  ['lampe-portable','Lampes portables','lampe portable','lampes? (?:portables?|baladeuses?)'],
  ['table-chevet','Tables de chevet','table de chevet','tables? de chevet|chevets?'],
  ['table-basse','Tables basses','table basse','tables? basses?'],
  ['table-appoint','Tables d’appoint','table appoint','tables? d appoint|gueridons?'],
  ['chaise-bar','Chaises & tabourets de bar','bar','(?:chaises?|tabourets?) (?:de |hauts? de )?(?:bar|snack)|chaises? hautes?'],
  ['chaise-longue','Chaises longues','chaise longue','chaises? longues?|transats?|bains? de soleil'],
  ['meuble-tv','Meubles TV','meuble tv','meubles? (?:tv|tele(?:vision)?)'],
  ['table','Tables','table','tables?'], ['chaise','Chaises','chaise','chaises?'],
  ['canape','Canapés','canapé','canapes?|sofas?'], ['fauteuil','Fauteuils','fauteuil','fauteuils?'],
  ['tabouret','Tabourets','tabouret','tabourets?'], ['banc','Bancs','banc','bancs?|banquettes?'],
  ['buffet','Buffets','buffet','buffets?|enfilades?'], ['armoire','Armoires','armoire','armoires?'],
  ['commode','Commodes','commode','commodes?'], ['etagere','Étagères','étagère','etageres?|bibliotheques?'],
  ['bureau','Bureaux','bureau','bureaux?'], ['console','Consoles','console','consoles?'],
  ['lampe','Luminaires','lampe','lampes?|luminaires?'], ['suspension','Suspensions','suspension','suspensions?'],
  ['lampadaire','Lampadaires','lampadaire','lampadaires?'], ['applique','Appliques','applique','appliques?'],
  ['tapis','Tapis','tapis','tapis'], ['miroir','Miroirs','miroir','miroirs?'], ['vase','Vases','vase','vases?'],
  ['coussin','Coussins','coussin','coussins?'], ['pouf','Poufs','pouf','poufs?'],
];
const colorWords = {noir:'noire?s?|black',blanc:'blanc(?:s|he|hes)?|white',gris:'gris(?:e|es)?|grey|gray',beige:'beiges?',brun:'brune?s?|marrons?|brown',rouge:'rouges?|red',rose:'roses?|pink',orange:'oranges?',jaune:'jaunes?|yellow',vert:'verte?s?|green',bleu:'bleue?s?|blue',violet:'violet(?:s|te|tes)?|mauves?|purple',naturel:'naturel(?:s|le|les)?',dore:'doree?s?',argent:'argentee?s?'};
const materialWords = {bois:'bois|wood',metal:'metal|metalliques?',plastique:'plastiques?',tissu:'tissus?|textiles?',cuir:'cuir',corde:'cordes?|cordages?',verre:'verre|glass',ceramique:'ceramique',marbre:'marbre|marble'};
const finishWords = {chene:'chene|oak',noyer:'noyer|walnut',hetre:'hetre|beech',frene:'frene|ash',bouleau:'bouleau|birch',teck:'teck|teak',rotin:'rotin|rattan',chrome:'chrome',laiton:'laiton|brass',velours:'velours|velvet',mat:'mat(?:e|s|es)?',brillant:'brillant(?:e|s|es)?'};
const labels = {metal:'Métal',ceramique:'Céramique',chene:'Chêne',hetre:'Hêtre',frene:'Frêne',dore:'Doré',argent:'Argenté'};
const label = k => labels[k] || k[0].toUpperCase()+k.slice(1);

// Corrections limitées au vocabulaire métier, jamais aux nombres ou références.
const corrections = {chaisse:'chaise',chaises:'chaises',chaisses:'chaises',chase:'chaise',canapee:'canape',canapper:'canape',fauteille:'fauteuil',fauteuille:'fauteuil',etagere:'etagere',buereau:'bureau',talbe:'table',tablee:'table',noiree:'noire'};
function parseSearch(value, omitted = '') {
  const q = String(value || '').trim().slice(0,200);
  let text = fold(q), correction = false;
  text=text.replace(/\b(\d+)m(\d{2})\b/g,'$1.$2 m');
  text = text.replace(/\b[a-z]+\b/g, word => { const replacement=corrections[word];if(replacement && replacement!==word)correction=true;return replacement||word; });
  const criteria=[], issues=[];
  const ignored = new Set(String(omitted).split(',').filter(x=>/^[a-z-]{1,30}$/.test(x)));
  const add = c => { const existing=criteria.find(x=>x.id===c.id); if(existing)issues.push('Précisez un seul '+c.label.toLowerCase()+'.');else criteria.push(c); };
  const take = (pattern,fn) => { text=text.replace(pattern,(...args)=>{fn(...args);return ' ';}); };
  const dimension = (axis,n,op='eq') => ({id:'size-'+axis,kind:'size',axis,value:n,op,label:({width:'Largeur',length:'Longueur',depth:'Profondeur',height:'Hauteur',diameter:'Diamètre',size:'Dimension'})[axis]+' '+({eq:': ',max:'≤ ',min:'≥ '})[op]+amountLabel(n)+' cm'});
  const op = word => /moins|max|au plus|jusqu/.test(word||'')?'max':/plus|min|au moins/.test(word||'')?'min':'eq';
  const axis = word => ({largeur:'width',large:'width',longueur:'length',long:'length',profondeur:'depth',profond:'depth',hauteur:'height',haut:'height',diametre:'diameter','ø':'diameter'})[word]||'size';
  // Les dimensions sont consommées AVANT les montants : « moins de 80 cm » n'est pas un budget.
  take(new RegExp(`\\b(largeur|longueur|profondeur|hauteur|diametre)\\s*(?::|de)?\\s*(moins de|maximum|max|au plus|jusqu a|au moins|minimum|min|plus de)?\\s*(${N})\\s*(mm|cm|m)\\b(?:\\s*(maximum|max))?`,'g'),(_,a,o,n,u,suffix)=>add(dimension(axis(a),cm(n,u),op(o||suffix))));
  take(new RegExp(`\\b(${N})\\s*[x×]\\s*(${N})(?:\\s*[x×]\\s*(${N}))?\\s*(mm|cm|m)\\b`,'g'),(_,a,b,c,u)=>add({id:'format',kind:'format',values:[a,b,c].filter(Boolean).map(n=>cm(n,u)),label:'Format : '+[a,b,c].filter(Boolean).map(n=>amountLabel(cm(n,u))).join(' × ')+' cm'}));
  take(new RegExp(`(ø\\s*)?\\b(moins de|maximum|max|au plus|jusqu a|au moins|minimum|min|plus de)?\\s*(${N})\\s*(mm|cm|m)\\b(?:\\s*(?:de )?(largeur|large|longueur|long|profondeur|profond|hauteur|haut|diametre))?(?:\\s*(maximum|max))?`,'g'),(_,diam,o,n,u,a,suffix)=>add(dimension(diam?'diameter':axis(a),cm(n,u),op(o||suffix))));
  take(/\b(?:pour |capacite(?: de)? )?(\d{1,2})\s*(personnes?|places?|convives?)\b/g,(_,n,unit)=>add({id:'capacity',kind:'capacity',value:Number(n),label:unit.startsWith('place')?n+' places minimum':'Pour '+n+' personnes'}));
  const prices=[];
  take(new RegExp(`\\bentre (${N})\\s*(?:€|euros?)? et (${N})\\s*(?:€|euros?\\b)`,'g'),(_,a,b)=>prices.push({min:number(a),max:number(b)}));
  take(new RegExp(`\\b(moins de|jusqu a|au plus|maximum|max|budget(?: de)?|plus de|au moins|minimum|min|a partir de)\\s*(${N})(?![\\d.,])\\s*(?:€|euros?\\b)?`,'g'),(_,o,n)=>prices.push(/plus de|au moins|minimum|^min$|a partir/.test(o)?{min:number(n)+(o==='plus de'?.01:0)}:{max:number(n)-(o==='moins de'?.01:0)}));
  take(new RegExp(`\\b(${N})\\s*(?:€|euros?\\b)(?:\\s*(?:maximum|max))?`,'g'),(_,n)=>prices.push({max:number(n)}));
  if(prices.length) {
    const min=Math.max(0,...prices.map(p=>p.min??0)),max=Math.min(1000000,...prices.map(p=>p.max??1000000));
    if(min>max||max<0)issues.push('Le budget indiqué est contradictoire.');
    add({id:'price',kind:'price',min,max,label:max===1000000&&min ? `Dès ${amountLabel(min)} €` : min ? `Budget : ${amountLabel(min)}–${amountLabel(max)} €` : `Jusqu’à ${amountLabel(max)} €`});
  }
  let family;
  for(const [id,name,term,pattern] of families) {
    const match=text.match(new RegExp('\\b(?:'+pattern+')\\b'));
    if(match) { family={id,name,term};text=text.replace(match[0],' ');break; }
  }
  if(family)add({id:'family',kind:'family',value:family.id,label:family.name});
  if(family && ['table','canape','banc'].includes(family.id))take(/\bpour\s+(\d{1,2})\b/g,(_,n)=>add({id:'capacity',kind:'capacity',value:Number(n),label:'Pour '+n+' personnes'}));
  let brand;
  for(const name of [...brands].sort((a,b)=>b.length-a.length)) {
    const term=fold(name).replace(/&/g,' ').replace(/ +/g,' ').trim();
    text=text.replace(/&/g,' ').replace(/ +/g,' ');
    if(new RegExp('\\b'+term+'\\b').test(text)) {brand=name;take(new RegExp('\\b'+term+'\\b','g'),()=>{});add({id:'brand',kind:'brand',value:normalize(name),label:name});break;}
  }
  take(/\bsans accoudoirs?\b/g,()=>add({id:'armrests',kind:'feature',value:'sans-accoudoirs',label:'Sans accoudoirs'}));
  take(/\bsans fil\b/g,()=>add({id:'wireless',kind:'text-feature',values:['sans fil','rechargeable','sur batterie'],label:'Sans fil'}));
  // Une négation ne se transforme jamais silencieusement en critère positif.
  if(/\b(sans|pas|sauf|hors|ni|non)\b/.test(text))issues.push('Cette exclusion mérite d’être précisée dans la recherche.');
  for(const [kind,words] of Object.entries({color:colorWords,material:materialWords,finish:finishWords})) {
    const values=[];
    for(const [key,pattern] of Object.entries(words))take(new RegExp('\\b(?:'+pattern+')\\b','g'),()=>values.push(key));
    if(values.length)add({id:kind,kind,values:[...new Set(values)],mode:/\bou\b/.test(text)?'any':'all',label:[...new Set(values)].map(label).join(/\bou\b/.test(text)?' ou ':' + ')});
  }
  take(/\b(exterieure?s?|outdoor|jardin|terrasse|balcon)\b/g,()=>{if(!criteria.some(c=>c.id==='usage'))add({id:'usage',kind:'usage',value:'exterieur',label:'Extérieur'});});
  take(/\b(interieure?s?|indoor)\b/g,()=>add({id:'usage',kind:'usage',value:'interieur',label:'Intérieur'}));
  for(const [pattern,value,name] of [['empilables?','empilable','Empilable'],['pliantes?|pliables?|pliants?','pliant','Pliant'],['accoudoirs?','accoudoirs','Avec accoudoirs']])take(new RegExp('\\b(?:'+pattern+')\\b','g'),()=>add({id:value,kind:'feature',value,label:name}));
  take(/\ben stock\b/g,()=>add({id:'stock',kind:'stock',label:'En stock'}));
  take(/\b(rondes?|ronds?|round|carrees?|rectangulaires?|ovales?)\b/g,word=>{const shape=/rond|round/.test(word)?'round':/carre/.test(word)?'square':/ovale/.test(word)?'oval':'rectangle';add({id:'shape',kind:'shape',value:shape,label:{round:'Rond',square:'Carré',oval:'Ovale',rectangle:'Rectangulaire'}[shape]});});
  const stop=new Set('je cherche recherche rechercher chercher voudrais veux souhaite aimerais trouver besoin un une des du de d la le les en a pour avec et ou qui soit est me il faut couleur coloris finition matiere marque budget environ'.split(' '));
  const terms=normalize(text).split(' ').filter(w=>w&&!stop.has(w));
  if(terms.length)add({id:'text',kind:'text',values:terms,label:terms.join(' ')});
  const active=criteria.filter(c=>!ignored.has(c.id));
  // Le retrait d'une contrainte conserve le périmètre amont, sauf famille/marque/texte.
  const familyCore=family?.id==='lampe'?'(lampe OR suspension OR lampadaire OR applique OR plafonnier)':family?.term;
  const core=[!ignored.has('family')&&familyCore,!ignored.has('brand')&&brand,!family&&!ignored.has('text')&&terms.join(' ')].filter(Boolean).join(' ');
  const types=!ignored.has('family')&&productTypes[family?.id];
  const quote=s=>'"'+s.replace(/["\\]/g,' ')+'"';
  const scopeQuery=types?.length ? '('+types.map(t=>'product_type:'+quote(t)).join(' OR ')+')'+(brand&&!ignored.has('brand')?' AND vendor:'+quote(brand):'') : brand&&!ignored.has('brand')?'vendor:'+quote(brand):null;
  const needsCategory=!core&&!scopeQuery;
  return {q,criteria:active,allCriteria:criteria,omitted:[...ignored].filter(id=>criteria.some(c=>c.id===id)),core:core||'*',scopeQuery,needsCategory,family:family?.name||'Produits',correction,issues};
}
module.exports={parseSearch,fold,cm,finishWords,families};
