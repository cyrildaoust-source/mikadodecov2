import { initShell } from '/shell.mjs';
import { productCard, restoreSelectionPosition } from '/product-grid.mjs';
import { fetchPromos, applyPromos } from '/catalog-data.mjs';
const data=JSON.parse(document.querySelector('#search-initial').textContent);
// Résultats déjà complets dans la page envoyée par le serveur : pas de reconstruction.
const grid=document.querySelector('[data-grid]');
if(!grid.querySelector('.pcard'))grid.innerHTML=data.items.map(p=>productCard(p,data.resultsUrl)).join('');
initShell({active:'Mobilier',hero:false});
fetchPromos().then(applyPromos).catch(()=>{});
restoreSelectionPosition();
// Le tri s'applique dès le choix (bouton « Trier » réservé aux navigateurs sans JavaScript) ; la grille
// s'estompe pendant le chargement de la nouvelle page (Cyril, 31 octobre 2026 : « ça ne fait absolument rien »).
document.querySelectorAll('.search-page__form, .search-page__sort').forEach(form=>form.addEventListener('submit',()=>grid.setAttribute('aria-busy','true')));
addEventListener('pageshow',()=>grid.removeAttribute('aria-busy'));
document.querySelector('#search-sort')?.addEventListener('change',event=>event.target.form.requestSubmit());
