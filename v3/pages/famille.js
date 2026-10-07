/* famille.html · script de page (ex-inline, sorti dans ce fichier en octobre 2026 : cache navigateur,
   syntaxe vérifiée par npm run check, prêt pour une CSP sans 'unsafe-inline').
   Comportement identique : un module inline s'exécute lui aussi après l'analyse du document. */
import { bindFamilyRails } from "/family-rail.js";
import { initShell, productCard, restoreSelectionPosition } from "/shared.js";
initShell({ active: "Mobilier", transparentNav: !document.documentElement.hasAttribute("data-chair-continuation") });
var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

bindFamilyRails(document.querySelector(".fam"));

// Best-sellers : pas de fetch sur mobile (section masquée) ; section retirée si vide ou erreur.
(async function(){
  var host=document.querySelector('[data-bestsellers]'); if(!host) return;
  var section=host.closest('section');
  if(matchMedia('(max-width:760px)').matches){ if(section)section.hidden=true; return; }
  try{
    var r=await fetch('/api/products?paginated=1&limit=5&tags=exterieur');
    if(!r.ok) throw new Error('http '+r.status);
    var j=await r.json(); var items=j.items||[];
    if(!items.length){ if(section)section.hidden=true; return; }
    host.innerHTML=items.map(productCard).join('');
  }catch(e){ if(section)section.hidden=true; }
})();

// Grille « Tous les produits jardin » : walk complet de la collection outdoor puis pagination client-side (pattern PLP).
(function(){
  var grid=document.querySelector('[data-grid]'), cnt=document.querySelector('[data-count]'), pag=document.querySelector('[data-pagination]');
  // Liste filtrée rendue par le serveur : chair-catalog.js la gère (repli ci-dessous sinon).
  if(!grid || document.querySelector('#chair-catalog-initial')) return;
  var PAGE=60, ALL=[], TOTAL=1, complete=false, moreComing=false;
  var params=new URLSearchParams(location.search);
  var page=Math.max(1, parseInt(params.get('page'),10)||1);

  async function chunk(cursor){
    var r=await fetch('/api/collection/outdoor/products?limit=100'+(cursor?'&cursor='+encodeURIComponent(cursor):''));
    if(!r.ok) throw new Error('http '+r.status);
    var j=await r.json(); return { items:j.items||j.products||[], pi:j.pageInfo||{} };
  }
  function pageItems(cur,total){
    if(total<=7) return Array.from({length:total},function(_,i){return i+1;});
    var out=[1], l=Math.max(2,cur-2), rg=Math.min(total-1,cur+2);
    if(l>2)out.push('…'); for(var i=l;i<=rg;i++)out.push(i); if(rg<total-1)out.push('…'); out.push(total); return out;
  }
  function renderGrid(){
    var start=(page-1)*PAGE, slice=ALL.slice(start,start+PAGE);
    grid.innerHTML = slice.length ? slice.map(productCard).join('') : '<p class="fam-empty">Aucun produit pour le moment.</p>';
  }
  function renderCount(){ if(cnt) cnt.textContent = ALL.length + ' produit' + (ALL.length>1?'s':'') + (complete?'':'…'); }
  function renderPag(){
    if(!pag) return;
    if(!complete){ if(moreComing){ pag.hidden=false; pag.innerHTML='<span class="plp-pagination__loading">Chargement du catalogue…</span>'; } else { pag.hidden=true; pag.innerHTML=''; } return; }
    if(TOTAL<=1){ pag.hidden=true; pag.innerHTML=''; return; }
    pag.hidden=false;
    var prevOff=page<=1, nextOff=page>=TOTAL;
    var nums=pageItems(page,TOTAL).map(function(it){
      return it==='…' ? '<span class="plp-page__ellipsis" aria-hidden="true">…</span>'
        : '<button type="button" class="plp-page'+(it===page?' is-current':'')+'" data-page="'+it+'"'+(it===page?' aria-current="page"':'')+'>'+it+'</button>';
    }).join('');
    pag.innerHTML='<button type="button" class="plp-page plp-page--nav" data-page="'+(page-1)+'"'+(prevOff?' disabled':'')+' aria-label="Page précédente">‹ Précédent</button>'
      +'<span class="plp-pagination__numbers">'+nums+'</span>'
      +'<span class="plp-pagination__mobile">Page '+page+' / '+TOTAL+'</span>'
      +'<button type="button" class="plp-page plp-page--nav" data-page="'+(page+1)+'"'+(nextOff?' disabled':'')+' aria-label="Page suivante">Suivant ›</button>';
  }
  function goTo(n){
    var t=Math.max(1,Math.min(n,TOTAL)); if(t===page) return;
    page=t;
    if(page>1) params.set('page',String(page)); else params.delete('page');
    var qs=params.toString();
    history.pushState(null,'',location.pathname+(qs?'?'+qs:'')+location.hash);
    renderGrid(); renderPag();
    var head=document.querySelector('#grille .fam-gridhead'); if(head)head.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});
    var c=pag&&pag.querySelector('.plp-page.is-current'); if(c)c.focus({preventScroll:true});
  }
  if(pag) pag.addEventListener('click',function(e){ var b=e.target.closest('button[data-page]'); if(!b||b.disabled)return; goTo(parseInt(b.getAttribute('data-page'),10)); });
  window.addEventListener('popstate',function(){ params=new URLSearchParams(location.search); page=Math.max(1,parseInt(params.get('page'),10)||1); if(page>TOTAL)page=TOTAL; renderGrid(); renderPag(); });

  (async function(){
    try{
      var first=await chunk('');
      ALL=first.items.slice();
      var cur=first.pi.hasNextPage?first.pi.endCursor:'';
      moreComing=!!cur;
      if(page===1){ renderGrid(); } renderCount(); renderPag();
      var visited=new Set();
      while(cur){ if(visited.has(cur))throw new Error('Cursor did not advance'); visited.add(cur); var c=await chunk(cur); ALL.push.apply(ALL,c.items); renderCount(); cur=c.pi.hasNextPage?c.pi.endCursor:''; }
      complete=true; TOTAL=Math.max(1,Math.ceil(ALL.length/PAGE)); if(page>TOTAL)page=TOTAL;
      renderGrid(); renderCount(); renderPag(); restoreSelectionPosition();
    }catch(e){
      complete=false; TOTAL=Math.max(1,Math.ceil(ALL.length/PAGE));
      if(cnt)cnt.textContent="Chargement incomplet · réessayez en rechargeant la page";
      if(!ALL.length){ grid.innerHTML='<p class="fam-empty">Impossible de charger les produits pour le moment. Réessayez.</p>'; if(cnt)cnt.textContent=''; }
      else { renderGrid(); renderPag(); }
      renderPag();
    }
  })();
})();
