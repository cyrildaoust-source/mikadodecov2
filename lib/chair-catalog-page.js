const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Rendu serveur d'une collection filtrable (Chaises et sous-catégories) : mêmes
// composants et même vue que les mises à jour du navigateur (catalog-filters-view.mjs).
function renderChairCatalog(html, data, view, renderCard) {
  const scope=data.scope;
  const continuation=data.state.page>1;
  const title=data.state.brand.length===1 ? `${scope.label} · ${data.facets.brand.find(b=>b.value===data.state.brand[0])?.label||'Sélection'}` : scope.label;
  const sub=scope.handle==='chaises' ? scope.sub : (data.collection?.description || scope.sub);
  html=html.replace('<html lang="fr">',`<html lang="fr" class="plp-collection" data-chair-catalog${continuation?' data-chair-continuation':''}>`)
    .replace('<h1 data-plp-title>Le catalogue</h1>',`<h1 data-plp-title data-context>${esc(title)}</h1>`)
    .replace('<p data-plp-sub>Mobilier de design, choisi pièce par pièce.</p>',()=>`<p data-plp-sub>${esc(sub)}</p>`)
    .replace(/  <div class="filterbar"[\s\S]*?(?=  <section class="section wrap" data-pop-section)/,'')
    .replace(/  <section class="section wrap" data-pop-section[\s\S]*?<\/section>/,'')
    .replace(/  <div class="wrap plp-countline">[^\n]*\n/,'')
    .replace(/  <div class="wrap plp-chips"[^\n]*\n/,'')
    .replace('<div class="wrap" data-breadcrumb>',`<div class="chair-catalog__compact wrap"><h1 class="serif">${esc(title)}</h1></div><div class="wrap" data-breadcrumb>`)
    .replace(/<div class="grid-head" id="grille">[\s\S]*?<\/div>/,()=>`<div class="grid-head chair-catalog__controls" id="grille" data-chair-controls>${view.filterControls(data)}</div><p class="catalog-filters__status" data-chair-status role="status" aria-live="polite"></p>`)
    .replace('<div class="pgrid" data-grid></div>',()=>`<div class="pgrid" data-grid data-ssr="1">${data.items.length?data.items.map(p=>renderCard(p,view.scopeURL(scope,data.state))).join(''):view.emptyState(scope)}</div>`)
    .replace('<nav class="plp-pagination" data-pagination aria-label="Pagination" hidden></nav>',()=>`<nav class="plp-pagination" data-pagination aria-label="Pagination : ${esc(scope.label)}"${data.totalPages<=1?' hidden':''}>${view.chairPagination(data)}</nav>`)
    // Conserver le template et ses composants ; remplacer uniquement le contrôleur
    // de liste historique qui charge tous les lots dans le navigateur.
    .replace(/<script type="module">[\s\S]*?<\/script>/,()=>`<script type="application/json" id="chair-catalog-initial">${JSON.stringify(data).replace(/</g,'\\u003c')}</script><script type="module" src="/chair-catalog.js"></script>`);
  if(continuation) {
    html=html.replace(/<section class="subhero[\s\S]*?<\/section>/,'');
    // Ce bandeau est conservé dans les données éditoriales ; ne pas précharger une
    // image invisible sur les pages suivantes (le script head s'arrête ici).
    html=html.replace('window.__hero = hero;','window.__hero = hero; return;');
  }
  return html;
}
module.exports={renderChairCatalog};
