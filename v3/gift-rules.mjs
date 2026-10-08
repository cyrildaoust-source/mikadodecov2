/* ══════════ OFFRE CADEAU « Mois Verner Panton » — règles (constantes + prédicats) ══════
   Aligné sur l'état Shopify RÉEL du 02/09 au soir (mise à jour parallèle) :
   1 000 € → Flowerpot VP9 (remise 1869512114505) · 3 500 € → UN Tabouret Visiona au
   choix parmi 3 TISSUS (Volo/Twill/Cosy 2 — remise 1869512147273, gets = 3 produits).
   Le moteur (sélection, réconciliation, rendu) vit dans gift-offer.mjs ; ce module
   n'a aucune dépendance pour que le panier (cart.mjs) puisse le lire sans cycle. */
export const GIFT_OFFER = {
  id: "panton",
  enabled: false,
  startsAt: "2026-09-01T19:35:00+02:00",
  endsAt:   "2026-09-30T23:59:59+02:00",
  tiers: [
    // variants: "stock" = coloris en stock only (rotation du stock VP9, 41 pièces) ;
    // "all" = tous les coloris commandables (Visiona : vente hors stock active).
    { threshold: 1000, label: "Lampe portable Flowerpot VP9", gifts: ["lampe-de-table-flowerpot-vp9"], variants: "stock", fem: true },
    { threshold: 2500, label: "Tabouret Visiona", gifts: ["tabouret-visiona-volo", "tabouret-visiona-twill", "tabouret-visiona-cosy-2"], variants: "all", fem: false },
  ],
};
export const GIFT_HANDLES = new Set(GIFT_OFFER.tiers.flatMap((t) => t.gifts));
export const giftTierIdx = (h) => GIFT_OFFER.tiers.findIndex((t) => t.gifts.includes(h));
export const isGiftProductHandle = (h) => giftActive() && GIFT_HANDLES.has(String(h || ""));
export function giftActive(now = Date.now()) {
  return GIFT_OFFER.enabled && now >= Date.parse(GIFT_OFFER.startsAt) && now <= Date.parse(GIFT_OFFER.endsAt);
}
