// Rangées de l'accueil. « Nouveautés » vient de la collection Shopify « nouveautes »
// (tag nouveaute, du plus récent au plus ancien) et alterne les marques, en commençant
// par la marque arrivée le plus récemment : un import massif d'une seule marque ne
// remplit pas la rangée. « Meilleures ventes » : sélection choisie (data/meilleures-ventes.json), qui tourne
// chaque jour ; complétée par l'ordre BEST_SELLING si des fiches manquent, sans doublon.
const showable = p => p && p.image && p.purchaseDisabled !== true;

function pickNewArrivals(items, count = 4) {
  const byBrand = new Map();
  for (const p of items.filter(showable)) {
    const brand = p.brand || '';
    if (!byBrand.has(brand)) byBrand.set(brand, []);
    byBrand.get(brand).push(p);
  }
  const queues = [...byBrand.values()];
  const picked = [];
  while (picked.length < count && queues.some(q => q.length)) {
    for (const q of queues) if (q.length && picked.length < count) picked.push(q.shift());
  }
  return picked;
}

function pickBestSellers(items, exclude = [], count = 4) {
  const seen = new Set(exclude.map(p => p.id || p.handle));
  return items.filter(p => showable(p) && !seen.has(p.id || p.handle)).slice(0, count);
}

// Ordre du jour de la sélection : décalage de 2 par jour (la liste alterne mobilier et objets).
function rotateSelection(handles, day = Math.floor(Date.now() / 86_400_000)) {
  if (!handles.length) return [];
  const start = (day * 2) % handles.length;
  return [...handles.slice(start), ...handles.slice(0, start)];
}

module.exports = { pickNewArrivals, pickBestSellers, rotateSelection };
