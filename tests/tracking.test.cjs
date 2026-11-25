const { test } = require('node:test');
const assert = require('node:assert/strict');

test('mesure : sans identifiant ni préversion, aucun bandeau ni balise ; la préversion montre le bandeau sans balise', () => {
  const { trackingConfig } = require('../lib/tracking');
  assert.equal(trackingConfig({}).enabled, false);
  const demo = trackingConfig({ VERCEL_ENV: 'preview' });
  assert.equal(demo.enabled, true); assert.equal(demo.demo, true);
  const live = trackingConfig({ GA4_ID: 'G-ABC123', META_PIXEL_ID: '123' });
  assert.equal(live.enabled, true); assert.equal(live.demo, undefined); assert.equal(live.ga4, 'G-ABC123'); assert.equal(live.metaPixel, '123');
});

test('UTM : seulement les 5 champs connus, nettoyés, transmis au panier', () => {
  const { cleanUtm } = require('../routes/cart');
  assert.deepEqual(cleanUtm({ utm_source: 'google', utm_campaign: 'test-decembre-2026', gclid: 'x', utm_medium: '<script>' }),
    { utm_source: 'google', utm_medium: 'script', utm_campaign: 'test-decembre-2026' });
  assert.deepEqual(cleanUtm(null), {});
  assert.deepEqual(cleanUtm({ utm_source: '   ' }), {});
});

test('API Conversions Meta : événements connus, adresse du site, données bornées, aucun champ de formulaire', () => {
  const { buildEvent } = require('../routes/track');
  const req = { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8', 'user-agent': 'UA', cookie: '_fbp=fb.1.1.2; other=1' } };
  const ev = buildEvent(req, { event: 'AddToCart', event_id: 'abc', url: 'https://www.mikadodeco.be/produit.html?handle=x', custom_data: { value: '199.999', content_ids: ['1'], email: 'a@b.c' } }, 1_700_000_000_000);
  assert.equal(ev.event_name, 'AddToCart'); assert.equal(ev.event_id, 'abc'); assert.equal(ev.event_time, 1_700_000_000);
  assert.deepEqual(ev.user_data, { client_ip_address: '1.2.3.4', client_user_agent: 'UA', fbp: 'fb.1.1.2' });
  assert.equal(ev.custom_data.value, 200); assert.equal(ev.custom_data.email, undefined); assert.equal(ev.custom_data.content_type, 'product');
  assert.equal(buildEvent(req, { event: 'Purchase', event_id: 'a', url: 'https://www.mikadodeco.be/' }), null, 'l’achat vient de Shopify, pas du site');
  assert.equal(buildEvent(req, { event: 'Lead', event_id: 'a', url: 'https://evil.example/' }), null);
});
