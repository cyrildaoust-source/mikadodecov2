// Estimate availability before checkout; availableForSale also includes backorders.
const IN_STOCK = '1–2 jours';
const ON_ORDER = '3–4 semaines';
const VARIANT_STOCK_QUERY = `query CartStock($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on ProductVariant { id quantityAvailable requiresShipping }
  }
}`;

function normalizeItems(items) {
  if (!Array.isArray(items) || !items.length || items.length > 50) {
    throw new Error('Le panier doit contenir entre 1 et 50 lignes.');
  }
  return items.map(item => {
    const qty = Number(item.qty ?? 1);
    if (!/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(item.variantId) || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw new Error('Article ou quantité invalide dans le panier.');
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
    return { variantId, quantity, physical, inStock, label: physical ? (inStock ? IN_STOCK : ON_ORDER) : null };
  });
  const physical = lines.filter(l => l.physical);
  const onOrder = physical.some(l => !l.inStock);
  return { label: physical.length ? (onOrder ? ON_ORDER : IN_STOCK) : null, onOrder, lines };
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
