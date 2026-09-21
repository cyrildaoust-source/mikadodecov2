import {initShell,productCard,fetchPromos,applyPromos,restoreSelectionPosition} from '/shared.js';
const data=JSON.parse(document.querySelector('#search-initial').textContent);
document.querySelector('[data-grid]').innerHTML=data.items.map(p=>productCard(p,data.resultsUrl)).join('');
initShell({active:'Mobilier',transparentNav:false});
fetchPromos().then(applyPromos).catch(()=>{});
restoreSelectionPosition();
document.querySelector('#search-sort')?.addEventListener('change',event=>event.target.form.requestSubmit());
