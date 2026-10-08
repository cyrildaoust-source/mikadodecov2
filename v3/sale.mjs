/* Soldes d'été 2026 (Europe/Brussels) — garder les dates EN SYNC avec
   l'inline-script du bandeau dans chrome-template.js. */
export const SALE = {
  startMs: Date.parse("2026-07-04T00:00:00+02:00"),
  endMs:   Date.parse("2026-08-01T00:00:00+02:00"),   // fin = 1er août 00:00 (exclu)
  tiers: [[300, 5], [800, 10], [1500, 15], [3000, 20]], // [seuil €, %] CROISSANT (remise au niveau commande)
};
export function isSaleActive() {
  const n = Date.now();
  return n >= SALE.startMs && n < SALE.endMs;
}
// Palier suivant à atteindre selon le sous-total (null si palier max déjà atteint).
export function saleNextTier(subtotal) {
  for (const [min, pct] of SALE.tiers) if (subtotal < min) return { min, pct, gap: min - subtotal };
  return null;
}
