// Fil d'Ariane rendu par le serveur sur les pages de contenu et les articles,
// identique à son JSON-LD (audit du 24 septembre 2026).
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const realFetch=global.fetch;
let server,base;
before(async()=>{
 process.env.SHOPIFY_STORE_DOMAIN='breadcrumbs.test';process.env.SHOPIFY_STOREFRONT_TOKEN='test';
 global.fetch=async()=>Response.json({data:{}});
 server=require('../server').listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{global.fetch=realFetch;await new Promise(r=>server.close(r));});
const trailOf=async p=>{
 const html=await(await realFetch(base+p,{headers:{Accept:'text/html'}})).text();
 const nav=(html.match(/<nav class="breadcrumb"[\s\S]*?<\/nav>/)||[''])[0];
 const labels=[...nav.matchAll(/<li>(?:<a href="[^"]*">([^<]*)<\/a>|<span aria-current="page">([^<]*)<\/span>)<\/li>/g)].map(m=>(m[1]||m[2]).replace(/&amp;/g,'&').replace(/&#39;/g,"'"));
 const ld=[...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1])).filter(j=>j['@type']==='BreadcrumbList');
 return {labels,ld};
};
const pages={
 '/journal.html':['Accueil','Le journal'],
 '/studio.html':['Accueil','Mikado Studio'],
 '/materiaux.html':['Accueil','Matières'],
 '/rendez-vous.html':['Accueil','Rendez-vous'],
 '/contact.html':['Accueil','Contact'],
 '/nuancier-fermob.html':['Accueil','Marques','Fermob','Nuancier Fermob'],
 '/mentions-legales.html':['Accueil','Mentions légales'],
 '/conditions-generales-de-vente.html':['Accueil','Conditions générales de vente'],
 '/politique-cookies.html':['Accueil','Politique cookies'],
 '/politique-et-vie-privee.html':['Accueil','Politique de confidentialité'],
};
test('les pages de contenu reçoivent leur fil d\'Ariane du serveur, identique au JSON-LD',async()=>{
 for(const [p,expected] of Object.entries(pages)){
  const {labels,ld}=await trailOf(p);
  assert.deepEqual(labels,expected,p);
  assert.equal(ld.length,1,p);
  assert.deepEqual(ld[0].itemListElement.map(e=>e.name),expected,p);
 }
});
test('chaque article du journal a son fil Accueil › Le journal › titre dès le serveur',async()=>{
 const dir=path.join(__dirname,'../v3/journal');
 for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))){
  const title=fs.readFileSync(path.join(dir,f),'utf8').match(/<h1 class="article__title">([^<]+)<\/h1>/);
  if(!title)continue;
  const {labels,ld}=await trailOf('/journal/'+f);
  const expected=['Accueil','Le journal',title[1].replace(/&amp;/g,'&').replace(/&#39;/g,"'")];
  assert.deepEqual(labels,expected,f);
  assert.deepEqual(ld[0].itemListElement.map(e=>e.name),expected,f);
 }
});
