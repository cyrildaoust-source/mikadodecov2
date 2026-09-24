export const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function searchCriteria(data) {
  return data.criteria?.length ? `<div class="catalog-filters__active search-intent" aria-label="Critères de votre recherche">${data.criteria.map(c=>c.removeURL?`<a class="catalog-filters__chip" href="${esc(c.removeURL)}#grille" aria-label="${esc('Retirer '+c.label)}">${esc(c.label)}<span aria-hidden="true">×</span></a>`:`<span class="catalog-filters__chip">${esc(c.label)}</span>`).join('')}</div>` : '';
}
export function searchNotes(data) {
  return (data.corrected?'<p class="searchd__hint">Recherche avec correction de l’orthographe.</p>':'')
    +(data.issues||[]).map(note=>`<p class="searchd__hint">${esc(note)}</p>`).join('')
    +(data.incomplete||[]).map(x=>`<p class="searchd__hint">${x.count} modèle${x.count>1?'s':''} avec ${esc(x.label)} à confirmer ${x.count>1?'ne sont pas inclus':'n’est pas inclus'} dans cette sélection.</p>`).join('');
}
export function searchSuggestions(data) {
  if(!data.suggestions?.length)return '';
  return `<div class="search-refine"><p class="sr__lab">${data.needsCategory?'Quel type de pièce cherchez-vous ?':'Élargir votre recherche'}</p><div class="sr__chips">${data.suggestions.map(s=>`<a class="sr__chip" href="${esc(s.url)}#grille">${esc(s.label)}${s.count!==undefined?' · '+s.count+' modèle'+(s.count>1?'s':''):''}</a>`).join('')}</div></div>`;
}
export function searchPagination(data) {
  if(data.totalPages<=1)return '';
  const url=page=>{const u=new URL(data.resultsUrl,'https://www.mikadodeco.be');u.searchParams.set('page',page);return u.pathname+u.search+'#grille';};
  const link=(page,name)=>`<a class="plp-page" href="${esc(url(page))}">${name}</a>`;
  const pages=[];
  for(let n=1;n<=data.totalPages;n++)if(n===1||n===data.totalPages||Math.abs(n-data.state.page)<=2)pages.push(n);else if(pages.at(-1)!=='…')pages.push('…');
  return (data.state.page>1?link(data.state.page-1,'← Précédent'):'')+pages.map(n=>n==='…'?'<span class="plp-page__ellipsis">…</span>':n===data.state.page?`<span class="plp-page is-current" aria-current="page">${n}</span>`:link(n,n)).join('')+(data.state.page<data.totalPages?link(data.state.page+1,'Suivant →'):'');
}
export function searchContent(data,renderCard) {
  const {state}=data;
  return `<section class="search-page__intro wrap">
    <div data-breadcrumb></div>
    <div class="pagehead"><h1>Votre recherche.</h1><p>Un meuble, une finition, des dimensions, un budget.</p></div>
    <form class="search-page__form" action="/produits.html" method="get" role="search">
      <div class="field"><label for="catalog-search">Décrivez ce que vous cherchez</label><input id="catalog-search" type="search" name="q" value="${esc(state.q)}" maxlength="200" required placeholder="Table en chêne pour 6 personnes, 2 000 €" /></div>
      <button class="btn btn--outline" type="submit">Rechercher</button>
    </form>
    ${searchCriteria(data)}${searchNotes(data)}
  </section>
  <section class="section wrap search-page__results" aria-label="Résultats de recherche">
    <div class="grid-head fam-gridhead" id="grille"><h2 class="serif">${data.error?'Recherche indisponible':data.needsCategory?'Précisez votre recherche':data.total+' modèle'+(data.total>1?'s':'')+' pour vous'}</h2>
      ${data.total?`<form action="/produits.html" method="get" class="search-page__sort"><input type="hidden" name="q" value="${esc(state.q)}">${state.omit.length?`<input type="hidden" name="omit" value="${esc(state.omit.join(','))}">`:''}<label class="sr-only" for="search-sort">Trier les résultats</label><select id="search-sort" name="sort" class="fselect">${[['pop','Pertinence'],['asc','Prix croissant'],['desc','Prix décroissant'],['az','Nom : A → Z']].map(([v,l])=>`<option value="${v}"${state.sort===v?' selected':''}>${l}</option>`).join('')}</select><button class="btn btn--outline" type="submit">Trier</button></form>`:''}
    </div>
    ${data.error?`<p class="searchd__hint">La recherche est momentanément indisponible.</p><a class="btn btn--outline" href="${esc(data.resultsUrl)}">Réessayer</a>`:data.total?'':`${data.needsCategory?'':'<p class="searchd__hint">Aucun modèle ne réunit tous ces critères. Vous pouvez modifier votre demande ou retirer un critère ci-dessus.</p>'}${searchSuggestions(data)}`}
    <div class="pgrid" data-grid>${data.items.map(p=>renderCard(p,data.resultsUrl)).join('')}</div>
    <nav class="plp-pagination" aria-label="Pagination des résultats"${data.totalPages<=1?' hidden':''}>${searchPagination(data)}</nav>
  </section>`;
}
