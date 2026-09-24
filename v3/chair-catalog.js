import {initShell,productCard,fetchPromos,applyPromos,loadNavigation,paintBreadcrumb,restoreSelectionPosition} from '/shared.js';
import {listingTrail} from '/navigation.mjs';
import {bindFamilyRails} from '/family-rail.js';
import {filterControls,chairPagination,scopeURL,emptyState,CHAIRS_SCOPE} from '/catalog-filters-view.mjs';

const initial = JSON.parse(document.querySelector('#chair-catalog-initial').textContent);
// Collection filtrée (Chaises ou sous-catégorie) : chemin, API et libellés.
const scope = initial.scope || CHAIRS_SCOPE;
const pageURL = (state, page) => scopeURL(scope, state, page);
const controls = document.querySelector('[data-chair-controls]');
const grid = document.querySelector('[data-grid]');
const pagination = document.querySelector('[data-pagination]');
const status = document.querySelector('[data-chair-status]');
let current = initial, pending = null, generation = 0, promos = null, navigation = null;
// Les pages familles gardent leur propre script de page (menu, rubriques éditoriales).
if(initial.shell!==false)initShell({active:'Mobilier',transparentNav:initial.state.page===1});
document.documentElement.classList.add('chair-filters-ready');
loadNavigation().then(nav=>{navigation=nav;updateBreadcrumb();}).catch(()=>{});
// Catalogue complet : rubriques de la composition Mobilier (familles, icônes).
const landing=document.querySelector('[data-catalogue-landing]');
if(landing) {
  bindFamilyRails(landing);
  const seed=document.querySelector('#catalogue-icons-initial'),rail=landing.querySelector('[data-catalogue-icons]');
  if(seed&&rail){rail.innerHTML=JSON.parse(seed.textContent).items.map(p=>productCard(p,location.pathname+location.search)).join('');restoreSelectionPosition(rail);}
}
fetchPromos().then(value=>{promos=value;applyPromos(promos);}).catch(()=>{});

function updateBreadcrumb() {
  if(!navigation)return;
  const brandName=current.state.brand.length===1?current.facets.brand.find(v=>v.value===current.state.brand[0])?.label:'';
  paintBreadcrumb(listingTrail(new URL(pageURL(current.state),location.origin),navigation,{title:scope.label,brandName}));
}
function syncOffset() {
  const height=document.querySelector('.chrome')?.getBoundingClientRect().height||100;
  controls.style.scrollMarginTop=`${Math.ceil(height+20)}px`;
}
function fitPopovers() {
  if(!matchMedia('(min-width: 761px)').matches)return;
  for(const group of controls.querySelectorAll('details[open]')) {
    const available=innerHeight-group.getBoundingClientRect().bottom-30;
    group.style.setProperty('--popover-height',`${Math.max(180,available)}px`);
  }
}
function scrollToResults() {
  syncOffset();controls.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
function paint(data,{keepOpen=false}={}) {
  const open=keepOpen?[...controls.querySelectorAll('details[open]')].map(el=>el.dataset.filterGroup):[];
  const active=document.activeElement;
  const focus=controls.contains(active)?{name:active.name,value:active.value,group:active.closest('details')?.dataset.filterGroup,summary:active.tagName==='SUMMARY'}:null;
  const mobileOpen=keepOpen&&controls.querySelector('.catalog-filters')?.classList.contains('is-open');
  current=data;
  const title=data.state.brand.length===1?`${scope.label} · ${data.facets.brand.find(b=>b.value===data.state.brand[0])?.label||'Sélection'}`:scope.label;
  for(const heading of document.querySelectorAll('[data-plp-title],.chair-catalog__compact h1'))heading.textContent=title;
  controls.innerHTML=filterControls({...data,scope});
  for(const el of controls.querySelectorAll('details'))el.open=open.includes(el.dataset.filterGroup);
  const form=controls.querySelector('form');form.classList.toggle('is-open',Boolean(mobileOpen));
  form.querySelector('[data-filters-toggle]').setAttribute('aria-expanded',String(Boolean(mobileOpen)));
  document.documentElement.classList.toggle('filters-locked',Boolean(mobileOpen)&&matchMedia('(max-width: 760px)').matches);
  grid.innerHTML=data.items.length?data.items.map(p=>productCard(p,pageURL(data.state))).join(''):emptyState(scope);
  pagination.innerHTML=chairPagination({...data,scope});pagination.hidden=data.totalPages<=1;
  document.documentElement.toggleAttribute('data-chair-continuation',data.state.page>1);
  if(focus) {
    const target=[...controls.querySelectorAll('input,select,summary')].find(el=>focus.summary?el.tagName==='SUMMARY'&&el.closest('details')?.dataset.filterGroup===focus.group:el.name===focus.name&&el.value===focus.value);
    target?.focus({preventScroll:true});
  }
  if(promos)applyPromos(promos);
  updateBreadcrumb();syncOffset();fitPopovers();if(typeof updateFab==='function')updateFab();
}
function formURL() {
  const q=new URLSearchParams();
  for(const [key,value] of new FormData(controls.querySelector('form')))if(value!==''&&!(key==='sort'&&value==='pop'))q.append(key,value);
  for(const key of ['category','brand','color','material','usage','feature'])if(q.has(key)){const values=q.getAll(key);q.set(key,values.join(','));}
  return scope.basePath+(q.size?'?'+q:'');
}
async function load(url,{historyMode='push',scroll=false,keepOpen=false}={}) {
  const next=new URL(url,location.origin);
  if(next.pathname!==scope.basePath||next.origin!==location.origin)return;
  // Un chargement initial de page 2 ne contient pas de photo de bandeau. Le retour
  // à la découverte passe alors par le rendu serveur complet de la page 1.
  if(!(Number(next.searchParams.get('page'))>1)&&!document.querySelector('.subhero,.fam-hero')) {
    if(historyMode==='none')location.reload();else location.assign(next.pathname+next.search+'#grille');
    return;
  }
  const request=++generation;
  pending?.abort();pending=new AbortController();
  status.textContent='Actualisation de votre sélection…';grid.setAttribute('aria-busy','true');
  try {
    const r=await fetch('/api/catalog/'+encodeURIComponent(scope.handle)+next.search,{signal:pending.signal});
    if(!r.ok)throw new Error('catalog unavailable');
    const data=await r.json();
    if(!Array.isArray(data.items)||!data.state||!data.facets)throw new Error('invalid catalog');
    if(request!==generation)return;
    if(historyMode!=='none')history[historyMode==='replace'?'replaceState':'pushState'](null,'',pageURL(data.state));
    paint(data,{keepOpen});
    status.textContent=`${data.total} modèle${data.total>1?'s':''} dans votre sélection.`;
    if(scroll)scrollToResults();
  } catch(error) {
    if(error.name==='AbortError'||request!==generation)return;
    paint(current,{keepOpen});
    status.replaceChildren(document.createTextNode('La sélection n’a pas pu être actualisée. '));
    const retry=document.createElement('button');retry.type='button';retry.className='catalog-filters__retry';retry.textContent='Réessayer';
    retry.addEventListener('click',()=>load(url,{historyMode,scroll,keepOpen}));status.append(retry);
  } finally {if(request===generation)grid.removeAttribute('aria-busy');}
}

controls.addEventListener('change',event=>{
  if(event.target.matches('input[type=checkbox],select[name=sort]'))load(formURL(),{keepOpen:true});
});
controls.addEventListener('submit',event=>{event.preventDefault();load(formURL(),{scroll:matchMedia('(max-width: 760px)').matches});});
controls.addEventListener('input',event=>{
  if(!event.target.matches('[data-filter-search]'))return;
  const q=event.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  for(const label of event.target.closest('.catalog-filters__popover').querySelectorAll('.catalog-filters__option'))label.hidden=!label.textContent.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q);
});
function setFiltersOpen(open) {
  const form=controls.querySelector('form');if(!form)return;
  form.classList.toggle('is-open',open);form.querySelector('[data-filters-toggle]').setAttribute('aria-expanded',String(open));
  // Le panneau mobile couvre l'écran : la page derrière ne défile plus.
  document.documentElement.classList.toggle('filters-locked',open&&matchMedia('(max-width: 760px)').matches);
  if(open&&matchMedia('(max-width: 760px)').matches)form.querySelector('[data-filters-close]')?.focus({preventScroll:true});
}
controls.addEventListener('click',event=>{
  if(event.target.closest('[data-filters-toggle]'))setFiltersOpen(!controls.querySelector('form').classList.contains('is-open'));
  else if(event.target.closest('[data-filters-close]')){setFiltersOpen(false);controls.querySelector('[data-filters-toggle]')?.focus({preventScroll:true});}
});
// Rappel flottant « Filtrer et trier » quand la barre est remontée hors de l'écran.
const fab=document.createElement('button');
fab.type='button';fab.className='catalog-filters-fab';fab.hidden=true;
document.body.appendChild(fab);
fab.addEventListener('click',()=>setFiltersOpen(true));
function updateFab() {
  const bar=controls.querySelector('[data-filters-toggle]'),active=controls.querySelectorAll('.catalog-filters__chip').length;
  fab.textContent=`Filtrer et trier${active?` (${active})`:''}`;
  const past=bar&&bar.getBoundingClientRect().bottom<0,gridLeft=grid.getBoundingClientRect().bottom>innerHeight*.6;
  fab.hidden=!(matchMedia('(max-width: 760px)').matches&&past&&gridLeft&&!controls.querySelector('form')?.classList.contains('is-open'));
}
addEventListener('scroll',updateFab,{passive:true});
document.addEventListener('click',event=>{
  const link=event.target.closest('[data-chair-link]');
  if(link&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&event.button===0){event.preventDefault();load(link.href,{scroll:true});return;}
  if(!event.target.closest('.catalog-filters__group'))for(const d of controls.querySelectorAll('details[open]'))d.open=false;
});
controls.addEventListener('toggle',event=>{
  const d=event.target;
  if(d.tagName==='DETAILS'&&d.open&&matchMedia('(min-width: 761px)').matches) {
    for(const other of controls.querySelectorAll('details[open]'))if(other!==d)other.open=false;
    if(innerHeight-d.getBoundingClientRect().bottom<300) {
      syncOffset();controls.scrollIntoView({block:'start',behavior:'instant'});
    }
    fitPopovers();
  }
},true);
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  const d=controls.querySelector('details[open]');
  if(d){d.open=false;d.querySelector('summary').focus();}
  else setFiltersOpen(false);
});
addEventListener('popstate',()=>load(location.href,{historyMode:'none',scroll:true}));
addEventListener('resize',()=>{syncOffset();fitPopovers();},{passive:true});
addEventListener('scroll',fitPopovers,{passive:true});
if(!initial.error) {
  paint(initial);
  restoreSelectionPosition(grid);
  if(location.hash==='#grille')requestAnimationFrame(scrollToResults);
}
syncOffset();
