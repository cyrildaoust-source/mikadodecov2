// Rangées de l'accueil. « Nouveautés » vient de la collection Shopify « nouveautes »
// (tag nouveaute, du plus récent au plus ancien) et alterne les marques, en commençant
// par la marque arrivée le plus récemment : un import massif d'une seule marque ne
// remplit pas la rangée. « Meilleures ventes » suit l'ordre BEST_SELLING, sans doublon.
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

module.exports = { pickNewArrivals, pickBestSellers };
