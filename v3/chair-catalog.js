import {initShell,productCard,fetchPromos,applyPromos,loadNavigation,paintBreadcrumb,restoreSelectionPosition} from '/shared.js';
import {listingTrail} from '/navigation.mjs';
import {filterControls,chairPagination,chairURL,emptyChairs} from '/catalog-filters-view.mjs';

const initial = JSON.parse(document.querySelector('#chair-catalog-initial').textContent);
const controls = document.querySelector('[data-chair-controls]');
const grid = document.querySelector('[data-grid]');
const pagination = document.querySelector('[data-pagination]');
const status = document.querySelector('[data-chair-status]');
let current = initial, pending = null, generation = 0, promos = null, navigation = null;
initShell({active:'Mobilier',transparentNav:initial.state.page===1});
document.documentElement.classList.add('chair-filters-ready');
loadNavigation().then(nav=>{navigation=nav;updateBreadcrumb();}).catch(()=>{});
fetchPromos().then(value=>{promos=value;applyPromos(promos);}).catch(()=>{});

function updateBreadcrumb() {
  if(!navigation)return;
  const brandName=current.state.brand.length===1?current.facets.brand.find(v=>v.value===current.state.brand[0])?.label:'';
  paintBreadcrumb(listingTrail(new URL(chairURL(current.state),location.origin),navigation,{title:'Chaises',brandName}));
}
function syncOffset() {
  const height=document.querySelector('.chrome')?.getBoundingClientRect().height||100;
  controls.style.scrollMarginTop=`${Math.ceil(height+20)}px`;
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
  controls.innerHTML=filterControls(data);
  for(const el of controls.querySelectorAll('details'))el.open=open.includes(el.dataset.filterGroup);
  const form=controls.querySelector('form');form.classList.toggle('is-open',Boolean(mobileOpen));
  form.querySelector('[data-filters-toggle]').setAttribute('aria-expanded',String(Boolean(mobileOpen)));
  grid.innerHTML=data.items.length?data.items.map(p=>productCard(p,chairURL(data.state))).join(''):emptyChairs();
  pagination.innerHTML=chairPagination(data);pagination.hidden=data.totalPages<=1;
  document.documentElement.toggleAttribute('data-chair-continuation',data.state.page>1);
  if(focus) {
    const target=[...controls.querySelectorAll('input,select,summary')].find(el=>focus.summary?el.tagName==='SUMMARY'&&el.closest('details')?.dataset.filterGroup===focus.group:el.name===focus.name&&el.value===focus.value);
    target?.focus({preventScroll:true});
  }
  if(promos)applyPromos(promos);
  updateBreadcrumb();syncOffset();
}
function formURL() {
  const q=new URLSearchParams();
  for(const [key,value] of new FormData(controls.querySelector('form')))if(value!==''&&!(key==='sort'&&value==='pop'))q.append(key,value);
  for(const key of ['brand','color','material','usage','feature'])if(q.has(key)){const values=q.getAll(key);q.set(key,values.join(','));}
  return '/collections/chaises'+(q.size?'?'+q:'');
}
async function load(url,{historyMode='push',scroll=false,keepOpen=false}={}) {
  const next=new URL(url,location.origin);
  if(next.pathname!=='/collections/chaises'||next.origin!==location.origin)return;
  // Un chargement initial de page 2 ne contient pas de photo de bandeau. Le retour
  // à la découverte passe alors par le rendu serveur complet de la page 1.
  if(!(Number(next.searchParams.get('page'))>1)&&!document.querySelector('.subhero')) {
    if(historyMode==='none')location.reload();else location.assign(next.pathname+next.search+'#grille');
    return;
  }
  const request=++generation;
  pending?.abort();pending=new AbortController();
  status.textContent='Actualisation de votre sélection…';grid.setAttribute('aria-busy','true');
  try {
    const r=await fetch('/api/catalog/chaises'+next.search,{signal:pending.signal});
    if(!r.ok)throw new Error('catalog unavailable');
    const data=await r.json();
    if(!Array.isArray(data.items)||!data.state||!data.facets)throw new Error('invalid catalog');
    if(request!==generation)return;
    if(historyMode!=='none')history[historyMode==='replace'?'replaceState':'pushState'](null,'',chairURL(data.state));
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
controls.addEventListener('click',event=>{
  if(event.target.closest('[data-filters-toggle]')) {
    const form=controls.querySelector('form'),open=form.classList.toggle('is-open');form.querySelector('[data-filters-toggle]').setAttribute('aria-expanded',String(open));
  }
});
document.addEventListener('click',event=>{
  const link=event.target.closest('[data-chair-link]');
  if(link&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&event.button===0){event.preventDefault();load(link.href,{scroll:true});return;}
  if(!event.target.closest('.catalog-filters__group'))for(const d of controls.querySelectorAll('details[open]'))d.open=false;
});
controls.addEventListener('toggle',event=>{
  const d=event.target;
  if(d.tagName==='DETAILS'&&d.open&&matchMedia('(min-width: 761px)').matches)for(const other of controls.querySelectorAll('details[open]'))if(other!==d)other.open=false;
},true);
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  const d=controls.querySelector('details[open]');
  if(d){d.open=false;d.querySelector('summary').focus();}
  else {const f=controls.querySelector('form');f.classList.remove('is-open');f.querySelector('[data-filters-toggle]').setAttribute('aria-expanded','false');}
});
addEventListener('popstate',()=>load(location.href,{historyMode:'none',scroll:true}));
addEventListener('resize',syncOffset,{passive:true});
if(!initial.error) {
  paint(initial);
  restoreSelectionPosition(grid);
  if(location.hash==='#grille')requestAnimationFrame(scrollToResults);
}
syncOffset();
