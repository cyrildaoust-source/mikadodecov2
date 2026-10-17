// Estimate availability before checkout; availableForSale also includes backorders.
// Hors stock, le délai de chaque ligne vient des règles par marque et famille (lib/lead-time.js,
// ADR 0015) ; l'envoi groupé prend le plus long.
const { IN_STOCK, defaultLabel, leadTimeFor, longest, longestPickup, pickupFor } = require('./lead-time');   // IN_STOCK = « 2–3 jours » (Cyril, 12 oct. 2026)
const ON_ORDER = defaultLabel();   // libellé par défaut hors stock (« 3–4 semaines »), gardé pour les appelants
const VARIANT_STOCK_QUERY = `query CartStock($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on ProductVariant {
      id quantityAvailable requiresShipping
      product { vendor tags collections(first: 20) { nodes { handle } } metafield(namespace: "custom", key: "lead_time") { value } }
    }
  }
}`;

// Une erreur de validation du corps est une faute du client (400), pas une panne (500) :
// la route lit `status` pour répondre juste (un moniteur ne doit pas voir un 500 ici).
const invalid = (message) => Object.assign(new Error(message), { status: 400 });

function normalizeItems(items) {
  if (!Array.isArray(items) || !items.length || items.length > 50) {
    throw invalid('Le panier doit contenir entre 1 et 50 lignes.');
  }
  return items.map(item => {
    const qty = Number(item.qty ?? 1);
    if (!/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(item.variantId) || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw invalid('Article ou quantité invalide dans le panier.');
    }
    return { ...item, qty };
  });
}

function estimateDelivery(items, variants) {
  const stock = new Map(variants.filter(Boolean).map(v => [v.id, v]));
  const quantities = new Map();
  for (const i of items) quantities.set(i.variantId, (quantities.get(i.variantId) || 0) + i.qty);
  const lines = [...quantities].map(([variantId, quantity]) => {
    const variant = stock.get(variantId);
    if (!variant) throw new Error('Impossible de vérifier la disponibilité de cet article.');
    const physical = variant.requiresShipping !== false;
    const inStock = !physical || (Number.isFinite(variant.quantityAvailable) && variant.quantityAvailable >= quantity);
    const p = variant.product || {};
    const leadTime = physical && !inStock
      ? leadTimeFor({ vendor: p.vendor, collections: (p.collections?.nodes || []).map(c => c?.handle).filter(Boolean), tags: p.tags || [], leadTime: p.metafield?.value || '' })
      : null;
    // Retrait en boutique : le stock décide ; à commander, le délai de la marque jusqu'à la boutique, sans marge (Cyril, 17 oct.).
    const pickupInfo = physical ? pickupFor({ inStock, leadTime: p.metafield?.value || '' }) : null;
    return { variantId, quantity, physical, inStock, leadTime, pickupInfo, label: physical ? (inStock ? IN_STOCK : leadTime.label) : null, pickup: pickupInfo?.label || null };
  });
  const physical = lines.filter(l => l.physical);
  const onOrder = physical.some(l => !l.inStock);
  const slowest = onOrder ? longest(physical.filter(l => !l.inStock).map(l => l.leadTime)) : null;
  const pickup = longestPickup(physical.map(l => l.pickupInfo));
  for (const l of lines) delete l.pickupInfo;
  return { label: physical.length ? (onOrder ? slowest.label : IN_STOCK) : null, onOrder, pickup: pickup?.label || null, lines };
}

async function getDeliveryEstimate(items, fetchShopify) {
  const ids = [...new Set(items.map(i => i.variantId))];
  const data = await fetchShopify(VARIANT_STOCK_QUERY, { ids });
  return estimateDelivery(items, data.nodes || []);
}

function realProject(value) {
  if (typeof value !== 'string') return '';
  // Ignore the placeholder sent by older cached storefront pages.
  return /^Livraison:\s*À confirmer au paiement\s*$/i.test(value.trim()) ? '' : value.slice(0, 500);
}
module.exports = { IN_STOCK, ON_ORDER, VARIANT_STOCK_QUERY, normalizeItems, estimateDelivery, getDeliveryEstimate, realProject };
