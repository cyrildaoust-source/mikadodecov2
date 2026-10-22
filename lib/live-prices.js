// Prix vivants des cartes de liste — Mikado Deco
// L'index du catalogue (Blob) est reconstruit toutes les 10 minutes ; entre deux passages, une promo terminée
// dans Shopify resterait affichée sur les cartes (signalé par l'instance promotions le 21 octobre 2026 : « prix
// affiché ≠ prix réel », erreur grave pour Cyril). Avant d'envoyer une page de liste, le site relit donc dans
// Shopify le prix et le prix barré des finitions affichées (au plus 60 cartes, 4 finitions chacune) et corrige
// les cartes. Prix barré seulement si compareAtPrice > price (contrat de données). Mémoire : 60 s par finition.
const { shopifyFetch } = require('./shopify/client');
const { isPromoTagged } = require('./promo-tags');

const LIVE_PRICES_QUERY = `query LivePrices($ids: [ID!]!) {
  nodes(ids: $ids) { ... on ProductVariant { id price { amount } compareAtPrice { amount } availableForSale product { tags } } }
}`;
const TTL = 60_000, CHUNK = 100;
const memo = new Map();   // id → { at, price, compareAt, available, tags }

async function readLive(ids) {
  const now = Date.now(), missing = ids.filter((id) => !(memo.get(id)?.at > now - TTL));
  for (let i = 0; i < missing.length; i += CHUNK) {
    const data = await shopifyFetch(LIVE_PRICES_QUERY, { ids: missing.slice(i, i + CHUNK) });
    for (const n of data?.nodes || []) {
      if (!n?.id) continue;
      const price = Number(n.price?.amount), was = Number(n.compareAtPrice?.amount);
      memo.set(n.id, { at: now, price, compareAt: Number.isFinite(was) && was > price ? was : null, available: n.availableForSale !== false, tags: n.product?.tags || [] });
    }
  }
  if (memo.size > 20000) for (const [k, v] of memo) if (v.at < now - TTL) memo.delete(k);
  return memo;
}
const apply = (card, live) => (live && Number.isFinite(live.price) ? { ...card, price: live.price, compareAt: live.compareAt } : card);

// items : cartes de liste (resultCard). En cas de panne Shopify, les cartes de l'index sont rendues telles quelles.
async function withLivePrices(items) {
  const ids = [...new Set(items.flatMap((c) => [c.variantId, ...(c.finishChoices || []).map((f) => f.variantId)]).filter(Boolean))];
  if (!ids.length) return items;
  let live;
  try { live = await readLive(ids); } catch (e) { console.warn('[prix-vivants]', e.message); return items; }
  return items.map((card) => ({ ...apply(card, live.get(card.variantId)), finishChoices: (card.finishChoices || []).map((f) => apply(f, live.get(f.variantId))) }));
}

// Page Promotions : membres = fiches qui portent ENCORE une balise de raison dans Shopify. Le tri se fait sur toute la
// liste AVANT le découpage en pages (22 octobre 2026 : retirer les cartes après coup laissait 58 cartes sur 60 en page 1,
// deux cases vides en bas, relevé par Cyril). Une fiche par produit suffit, les balises sont celles du produit.
// Renvoie la liste d'origine (même objet) quand rien ne change, pour garder la mémoire des pages.
async function stillPromoted(products) {
  const ids = [...new Set(products.map((p) => p.card?.variantId).filter(Boolean))];
  if (!ids.length) return products;
  let live;
  try { live = await readLive(ids); } catch (e) { console.warn('[prix-vivants]', e.message); return products; }
  const kept = products.filter((p) => { const v = live.get(p.card?.variantId); return !v || isPromoTagged(v.tags); });
  return kept.length === products.length ? products : kept;
}

module.exports = { LIVE_PRICES_QUERY, withLivePrices, stillPromoted };
