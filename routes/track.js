// API Conversions Meta (test publicitaire de décembre 2026). Le navigateur n'appelle cette route qu'avec
// l'accord « publicité » (v3/tracking.mjs) ; elle relaie l'événement à Meta côté serveur, avec le même
// identifiant que le pixel (dédoublonnage). Jeton : variable secrète META_CAPI_TOKEN sur Vercel (saisie par
// Cyril) ; sans jeton ou sans pixel, la route ne fait rien. Aucune donnée de formulaire (nom, e-mail) n'est
// envoyée : seulement l'adresse IP et le navigateur (exigés par Meta) et les cookies _fbp/_fbc du pixel.
const express = require('express');
const rateLimit = require('express-rate-limit');
const { trackingConfig } = require('../lib/tracking');

const router = express.Router();
const EVENTS = new Set(['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Lead']);
const limiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false });

const cookie = (req, name) => {
  const m = String(req.headers.cookie || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : undefined;
};
const num = v => (Number.isFinite(Number(v)) ? Math.round(Number(v) * 100) / 100 : undefined);

// Données d'achat utiles seulement, en texte et nombres bornés.
function customData(raw = {}) {
  const ids = Array.isArray(raw.content_ids) ? raw.content_ids.slice(0, 50).map(String).map(s => s.slice(0, 40)) : undefined;
  const contents = Array.isArray(raw.contents) ? raw.contents.slice(0, 50).map(c => ({ id: String(c.id || '').slice(0, 40), quantity: Math.max(1, Math.min(99, parseInt(c.quantity) || 1)), item_price: num(c.item_price) })) : undefined;
  return Object.fromEntries(Object.entries({ currency: 'EUR', value: num(raw.value), content_ids: ids, content_type: ids ? 'product' : undefined, contents, num_items: num(raw.num_items) }).filter(([, v]) => v !== undefined));
}

function buildEvent(req, body, now = Date.now()) {
  if (!EVENTS.has(body?.event) || typeof body.event_id !== 'string' || body.event_id.length > 80) return null;
  let url;
  try { url = new URL(String(body.url || '')); } catch { return null; }
  if (!/(^|\.)mikadodeco\.be$|\.vercel\.app$|^localhost$/.test(url.hostname)) return null;
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const user = { client_ip_address: ip || undefined, client_user_agent: String(req.headers['user-agent'] || '').slice(0, 400) || undefined, fbp: cookie(req, '_fbp'), fbc: cookie(req, '_fbc') };
  return {
    event_name: body.event,
    event_time: Math.floor(now / 1000),
    event_id: body.event_id,
    action_source: 'website',
    event_source_url: url.href.slice(0, 1000),
    user_data: Object.fromEntries(Object.entries(user).filter(([, v]) => v)),
    custom_data: customData(body.custom_data),
  };
}

router.post('/api/track', limiter, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const { metaPixel } = trackingConfig();
  const token = process.env.META_CAPI_TOKEN;
  const event = buildEvent(req, req.body);
  if (!metaPixel || !token || !event) return res.status(204).end();
  try {
    const version = process.env.META_GRAPH_VERSION || 'v22.0';
    const payload = { data: [event], ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}) };
    const r = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(metaPixel)}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) console.warn('[capi]', r.status, (await r.text()).slice(0, 200));
  } catch (error) { console.warn('[capi]', error.message); }
  return res.status(204).end();
});

module.exports = router;
module.exports.buildEvent = buildEvent;
