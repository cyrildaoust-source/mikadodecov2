// HTML partagé entre le premier rendu serveur et les mises à jour du catalogue.
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles = {brand:'Marque',color:'Couleur',material:'Matière',usage:'Usage',feature:'Caractéristiques'};
const colorHex = {blanc:'#faf9f4',beige:'#d5c2a1',gris:'#929491',noir:'#292b2a',brun:'#76503c',rouge:'#a43f39',rose:'#d6a5b0',orange:'#ca783f',jaune:'#dfba4e',vert:'#718064',bleu:'#54788a',violet:'#9e8bb4',naturel:'#c0a078',dore:'#b99c55',argent:'#b8babb'};
const money = value => new Intl.NumberFormat('fr-BE',{style:'currency',currency:'EUR',maximumFractionDigits:Number.isInteger(value)?0:2}).format(value);
export function chairParams(state, page = state.page) {
  const q = new URLSearchParams();
  for(const key of ['brand','color','material','usage','feature']) if(state[key]?.length) q.set(key,state[key].join(','));
  for(const key of ['min','max','seat_min','seat_max']) if(state[key] !== null && state[key] !== undefined) q.set(key,String(state[key]));
  if(state.stock) q.set('stock','1');
  if(state.tag) q.set('tag',state.tag);
  if(state.q) q.set('q',state.q);
  if(state.sort !== 'pop') q.set('sort',state.sort);
  if(page > 1) q.set('page',String(page));
  return q;
}
// Contexte d'une collection filtrable ; Chaises reste le contexte par défaut du pilote.
export const CHAIRS_SCOPE = {handle:'chaises',label:'Chaises',basePath:'/collections/chaises',heading:'Trouvez votre chaise',formLabel:'Filtrer les chaises',sortLabel:'Trier les chaises',empty:'Aucune chaise ne correspond à cette sélection.',all:'Voir toutes les chaises'};
export const scopeURL = (scope, state, page = state.page) => {const q=chairParams(state,page);return (scope||CHAIRS_SCOPE).basePath+(q.size?'?'+q:'');};
export const chairURL = (state, page = state.page) => scopeURL(CHAIRS_SCOPE,state,page);
export function filterCount(state) {
  return ['brand','color','material','usage','feature'].reduce((n,k)=>n+state[k].length,0)+Number(state.min!==null||state.max!==null)+Number(state.stock)+Number(state.seat_min!==null||state.seat_max!==null)+Number(Boolean(state.tag))+Number(Boolean(state.q));
}
function listFilter(key, data) {
  const values=data.facets[key],selected=data.state[key];
  if(!values?.length && !selected.length) return '';
  const list=values.map(o=>`<label class="catalog-filters__option${!o.count && !selected.includes(o.value)?' is-unavailable':''}">
    <input type="checkbox" name="${key}" value="${esc(o.value)}"${selected.includes(o.value)?' checked':''}${!o.count&&!selected.includes(o.value)?' disabled':''}>
    ${key==='color' && colorHex[o.value]?`<span class="catalog-filters__swatch" style="--swatch:${colorHex[o.value]}" aria-hidden="true"></span>`:''}
    <span>${esc(o.label)}</span><span class="catalog-filters__count">${o.count}</span></label>`).join('');
  return `<details class="catalog-filters__group" data-filter-group="${key}"><summary>${titles[key]}${selected.length?`<span class="catalog-filters__selected">${selected.length}</span>`:''}<span class="catalog-filters__chevron" aria-hidden="true"></span></summary>
    <div class="catalog-filters__popover">${values.length>8?`<label class="catalog-filters__search">Rechercher une ${key==='brand'?'marque':'valeur'}<input type="search" data-filter-search="${key}" placeholder="Rechercher…" autocomplete="off"></label>`:''}<div class="catalog-filters__options">${list}</div><button type="submit" class="btn btn--outline" data-filter-apply>Appliquer</button></div></details>`;
}
export function filterControls(data) {
  const {state,facets,total}=data;
  const scope=data.scope||CHAIRS_SCOPE;
  const active=filterCount(state);
  // Les mesures encore rares restent dans le contrat de données, sans filtre qui
  // donnerait l'impression de comparer équitablement toute la collection.
  const showSeat=facets.seat.known===facets.seat.total && facets.seat.known>1 || state.seat_min!==null || state.seat_max!==null;
  return `<div class="catalog-filters__heading"><h2 class="serif catalogue-head">${esc(scope.heading)}</h2><span class="plp-count" data-chair-count>${total} modèle${total>1?'s':''}</span></div>
    <form class="catalog-filters" action="${esc(scope.basePath)}#grille" method="get" aria-label="${esc(scope.formLabel)}">
      <button type="button" class="btn btn--outline catalog-filters__mobile-toggle" data-filters-toggle aria-expanded="false" aria-controls="chair-filter-options">Filtrer et trier${active?` (${active})`:''}</button>
      <div class="catalog-filters__groups" id="chair-filter-options">
        <div class="catalog-filters__sheet-head"><span class="serif">Filtrer et trier</span><button type="button" class="catalog-filters__close" data-filters-close aria-label="Fermer les filtres">&times;</button></div>
        <label class="catalog-filters__sort"><span class="sr-only">${esc(scope.sortLabel)}</span><select class="fselect" name="sort">${[['pop','Les plus populaires'],['asc','Prix croissant'],['desc','Prix décroissant'],['az','Nom : A → Z']].map(([v,l])=>`<option value="${v}"${state.sort===v?' selected':''}>${l}</option>`).join('')}</select></label>
        ${listFilter('brand',data)}
        <details class="catalog-filters__group" data-filter-group="price"><summary>Prix${state.min!==null||state.max!==null?'<span class="catalog-filters__selected">1</span>':''}<span class="catalog-filters__chevron" aria-hidden="true"></span></summary><div class="catalog-filters__popover catalog-filters__price">
          <p>Votre budget</p><div class="catalog-filters__range"><label>Minimum (€)<input type="number" inputmode="decimal" min="0" step="0.01" name="min" value="${state.min??''}" placeholder="${Math.floor(facets.price.min)}"></label><span aria-hidden="true">—</span><label>Maximum (€)<input type="number" inputmode="decimal" min="0" step="0.01" name="max" value="${state.max??''}" placeholder="${Math.ceil(facets.price.max)}"></label></div><button type="submit" class="btn btn--outline" data-filter-apply>Appliquer</button></div></details>
        ${['color','material','usage','feature'].map(k=>listFilter(k,data)).join('')}
        ${showSeat?`<details class="catalog-filters__group" data-filter-group="seat"><summary>Hauteur d’assise<span class="catalog-filters__chevron" aria-hidden="true"></span></summary><div class="catalog-filters__popover catalog-filters__price"><div class="catalog-filters__range"><label>Minimum (cm)<input type="number" min="0" step="0.1" name="seat_min" value="${state.seat_min??''}"></label><label>Maximum (cm)<input type="number" min="0" step="0.1" name="seat_max" value="${state.seat_max??''}"></label></div><button class="btn btn--outline" type="submit">Appliquer</button></div></details>`:''}
        <label class="catalog-filters__stock"><input type="checkbox" name="stock" value="1"${state.stock?' checked':''}>En stock <span class="catalog-filters__count">${facets.stock}</span></label>
        ${state.tag?`<input type="hidden" name="tag" value="${esc(state.tag)}">`:''}
        ${state.q?`<input type="hidden" name="q" value="${esc(state.q)}">`:''}
        <button type="submit" class="btn btn--outline catalog-filters__submit">Afficher les résultats<span class="catalog-filters__submit-count"> (${total})</span></button>
      </div>
    </form>
    <div class="catalog-filters__active"${active?'':' hidden'}>${activeChips(data)}${active?`<a class="catalog-filters__clear" href="${esc(scope.basePath)}#grille" data-chair-link>Tout effacer</a>`:''}</div>`;
}
function activeChips(data) {
  const {state,facets}=data, chips=[], scope=data.scope||CHAIRS_SCOPE;
  const chip=(label,next)=>chips.push(`<a class="catalog-filters__chip" href="${esc(scopeURL(scope,{...next,page:1}))}#grille" data-chair-link aria-label="${esc('Retirer le filtre '+label)}">${esc(label)}<span aria-hidden="true">×</span></a>`);
  for(const key of Object.keys(titles))for(const value of state[key])chip(facets[key].find(v=>v.value===value)?.label||value,{...state,[key]:state[key].filter(v=>v!==value)});
  if(state.min!==null||state.max!==null)chip(state.min!==null&&state.max!==null?`${money(state.min)} – ${money(state.max)}`:state.min!==null?`Dès ${money(state.min)}`:`Jusqu’à ${money(state.max)}`,{...state,min:null,max:null});
  if(state.stock)chip('En stock',{...state,stock:false});
  if(state.tag)chip(state.tag,{...state,tag:''});
  if(state.q)chip(`Recherche : ${state.q}`,{...state,q:''});
  if(state.seat_min!==null||state.seat_max!==null)chip(`Assise : ${state.seat_min??'…'} – ${state.seat_max??'…'} cm`,{...state,seat_min:null,seat_max:null});
  return chips.join('');
}
export function chairPagination(data) {
  const {state,totalPages}=data;if(totalPages<=1)return '';
  const scope=data.scope||CHAIRS_SCOPE;
  const items=[];
  for(let n=1;n<=totalPages;n++)if(n===1||n===totalPages||Math.abs(n-state.page)<=2)items.push(n);else if(items.at(-1)!=='…')items.push('…');
  const link=(page,label,extra='')=>`<a class="plp-page ${extra}" href="${esc(scopeURL(scope,state,page))}#grille" data-chair-link>${label}</a>`;
  return `${state.page>1?link(state.page-1,'‹ Précédent','plp-page--nav'):'<span class="plp-page" aria-disabled="true">‹ Précédent</span>'}<span class="plp-pagination__numbers">${items.map(n=>n==='…'?'<span class="plp-page__ellipsis">…</span>':n===state.page?`<span class="plp-page is-current" aria-current="page">${n}</span>`:link(n,n)).join('')}</span><span class="plp-pagination__mobile">Page ${state.page} / ${totalPages}</span>${state.page<totalPages?link(state.page+1,'Suivant ›','plp-page--nav'):'<span class="plp-page" aria-disabled="true">Suivant ›</span>'}`;
}
export const emptyState = (scope = CHAIRS_SCOPE) => `<div class="catalog-filters__empty"><p class="serif">${esc(scope.empty)}</p><p>Retirez un filtre pour découvrir davantage de modèles.</p><a class="btn btn--outline" href="${esc(scope.basePath)}#grille" data-chair-link>${esc(scope.all)}</a></div>`;
export const emptyChairs = () => emptyState(CHAIRS_SCOPE);
