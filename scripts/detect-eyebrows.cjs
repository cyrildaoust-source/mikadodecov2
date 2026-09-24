// Détecteur de surtitres (« eyebrows ») sur le rendu réel : petit texte en capitales
// espacées placé juste au-dessus d'un titre. Usage :
//   node scripts/detect-eyebrows.cjs https://www.mikadodeco.be
// Sortie non nulle si un surtitre est trouvé. Règle : DESIGN.md, section « Surtitres ».
const {chromium}=require('playwright');
const origin=(process.argv[2]||'https://www.mikadodeco.be').replace(/\/$/,'');
const paths=['/','/produits.html','/collections/tables','/collections/luminaires','/collections/decoration','/collections/rangement','/collections/accessoires','/collections/outdoor','/collections/sieges','/collections/chaises','/collections/chaises?page=2','/collections/fauteuils','/collections/hay','/collections/promotions','/produits.html?q=chaise','/produits.html?designer=verner-panton','/produit.html?handle=chaise-aluminium-luxembourg-4101','/marques.html','/designers.html','/journal.html','/journal/fermob.html','/journal/moustache.html','/journal/chene-et-le-temps.html','/studio.html','/materiaux.html','/rendez-vous.html','/contact.html','/selection.html','/nuancier-fermob.html','/mentions-legales.html','/conditions-generales-de-vente.html','/politique-cookies.html','/politique-et-vie-privee.html','/page-inexistante'];
function scan(){
 const out=[];const seen=new Set();
 const isHeading=e=>/^H[1-4]$/.test(e.tagName)||/(^|\s)(serif|title|__title|__name|catalogue-head)(\s|$)/.test(e.className||'')&&parseFloat(getComputedStyle(e).fontSize)>=18;
 const isEyebrowish=e=>{if(!e||e.nodeType!==1)return false;const t=(e.textContent||'').trim();if(!t||t.length>70||e.querySelector('img,svg,input,select,button'))return false;
  // Le nom de marque d'une fiche ou d'une carte identifie le produit : ce n'est pas un surtitre.
  if(e.matches('.pdp__brand,.pcard__brand'))return false;
  const s=getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden')return false;const fs=parseFloat(s.fontSize),ls=parseFloat(s.letterSpacing)||0;
  const caps=s.textTransform==='uppercase'||(t===t.toUpperCase()&&/[A-ZÀ-Ý]{3}/.test(t));return caps&&fs<=15&&ls>=fs*0.06;};
 for(const h of document.querySelectorAll('h1,h2,h3,h4,[class*=title],.serif,.catalogue-head')){
  if(!isHeading(h))continue;
  let prev=h.previousElementSibling;
  if(!prev&&h.parentElement)prev=h.parentElement.previousElementSibling;
  if(isEyebrowish(prev)){const k=(prev.className||prev.tagName)+'|'+prev.textContent.trim();if(!seen.has(k)){seen.add(k);out.push({texte:prev.textContent.trim().replace(/\s+/g,' '),classe:String(prev.className||prev.tagName),titre:h.textContent.trim().slice(0,40)});}}
 }
 return out;
}
(async()=>{const b=await chromium.launch();let total=0;try{const p=await b.newPage({viewport:{width:1440,height:900}});
 // Preview Vercel protégée : PREVIEW_BYPASS=<jeton> (voir `vercel curl --debug`).
 if(process.env.PREVIEW_BYPASS){await p.setExtraHTTPHeaders({'x-vercel-protection-bypass':process.env.PREVIEW_BYPASS,'x-vercel-set-bypass-cookie':'true'});await p.goto(origin+'/api/build');await p.setExtraHTTPHeaders({});}
 for(const path of paths){try{await p.goto(origin+path,{waitUntil:'domcontentloaded',timeout:60000});await p.waitForTimeout(2500);}catch{console.log('!',path,'inaccessible');continue;}
  await p.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')));
  const found=await p.evaluate(scan);
  // Méga menu et recherche ouverts
  if(path==='/'){await p.locator('#site-header [data-mm-trigger], #site-header .nav__link').first().hover().catch(()=>{});await p.waitForTimeout(800);found.push(...await p.evaluate(scan));
   await p.locator('.nav__search').first().click().catch(()=>{});await p.waitForTimeout(1200);found.push(...await p.evaluate(scan));}
  const uniq=[...new Map(found.map(f=>[f.classe+f.texte,f])).values()];
  if(uniq.length){total+=uniq.length;console.log(path);for(const f of uniq)console.log('   ✗',JSON.stringify(f.texte),'['+f.classe+'] au-dessus de «'+f.titre+'»');}
 }}finally{await b.close();}
 console.log(total?`${total} surtitre(s) trouvé(s).`:'Aucun surtitre.');process.exitCode=total?1:0;})();
