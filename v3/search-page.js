import { initShell } from '/shell.mjs';
import { productCard, restoreSelectionPosition } from '/product-grid.mjs';
import { fetchPromos, applyPromos } from '/catalog-data.mjs';
const data=JSON.parse(document.querySelector('#search-initial').textContent);
// Résultats déjà complets dans la page envoyée par le serveur : pas de reconstruction.
const grid=document.querySelector('[data-grid]');
if(!grid.querySelector('.pcard'))grid.innerHTML=data.items.map(p=>productCard(p,data.resultsUrl)).join('');
initShell({active:'Mobilier',transparentNav:false});
fetchPromos().then(applyPromos).catch(()=>{});
restoreSelectionPosition();
document.querySelector('#search-sort')?.addEventListener('change',event=>event.target.form.requestSubmit());
