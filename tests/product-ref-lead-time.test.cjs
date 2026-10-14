// Cartes de recommandation (mapProductRef) : le délai suit la même résolution que la fiche (ADR 0015).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mapProductRef } = require('../lib/shopify/product-mapper');
const { PRODUCT_QUERY, PRODUCT_RECOMMENDATIONS_QUERY } = require('../lib/shopify/queries');

const base = {
  id: 'gid://shopify/Product/1', handle: 'hkliving-canape-nomad-lin-305-cm', title: 'Canapé Nomad lin 305 cm',
  vendor: 'HKliving', productType: 'canapé', availableForSale: true, totalInventory: 0, tags: ['canape', 'delai-long'],
  priceRange: { minVariantPrice: { amount: '3875' }, maxVariantPrice: { amount: '3875' } },
  selectedOrFirstAvailableVariant: { id: 'gid://shopify/ProductVariant/1', availableForSale: true, price: { amount: '3875' } },
};

test('carte de recommandation : custom.lead_time prime sur le tag delai-long, comme sur la fiche', () => {
  const card = mapProductRef({ ...base, leadTime: { value: '6-10 semaines' } });
  assert.equal(card.leadTimeLabel, '7–11 semaines');   // 6-10 semaines de la marque + 1 semaine de marge Mikado
  assert.equal(card.longDelay, false);
  const without = mapProductRef({ ...base, leadTime: null });
  assert.equal(without.longDelay, true);
  assert.equal(without.leadTimeLabel, 'délai sur demande');
  const placeholder = mapProductRef({ ...base, leadTime: { value: 'n/a' } });
  assert.equal(placeholder.longDelay, true);
});

test('les requêtes de recommandation demandent le métachamp de délai', () => {
  for (const q of [PRODUCT_QUERY, PRODUCT_RECOMMENDATIONS_QUERY]) {
    assert.match(q, /fragment RecoCard[\s\S]*leadTime: metafield\(namespace: "custom", key: "lead_time"\) \{ value \}/);
  }
});
