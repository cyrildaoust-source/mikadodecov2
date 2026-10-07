// Routes formulaires : contact, newsletter (et son OAuth Shopify).
// Extrait de server.js (phase 1 du plan d'architecture, octobre 2026) — code déplacé, pas réécrit.
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { adminClient, notifyByEmail, subscribeInShopify } = require('../lib/newsletter');
const { ORIGIN } = require('../lib/config');

// ─── RATE-LIMIT ANTI-ABUS (in-memory, best-effort par instance serverless) ──
// CAVEAT serverless : sur Vercel le store est par-instance et remis à zéro à
// chaque cold start ; plusieurs instances ne partagent pas le compteur. Stoppe
// le spam naïf (matraquage d'une instance chaude), pas une attaque distribuée.
// Version distribuée (Vercel KV / Upstash) = évolution ultérieure si besoin.
const formLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,           // 10 min
  limit: 5,                             // 5 soumissions / IP / fenêtre (contact, newsletter)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});
// ─── CONTACT FORM ──────────────────────────────────────
// Body: { name, email, telephone?, projet?, message }
// Validates server-side, logs structured payload, returns 200.
// Wire up nodemailer / a webhook later — the endpoint contract stays the same.
router.post('/api/contact', formLimiter, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    // Honeypot anti-bot : champ masqué qu'un humain ne remplit jamais. Si rempli
    // → faux succès silencieux (on ne révèle pas le piège, on ne traite rien).
    if (String(req.body?.hp_field || '').trim()) return res.json({ ok: true });

    const { name = '', email = '', telephone = '', projet = '', message = '', source = 'website' } = req.body || {};

    const cleanName    = String(name).trim().slice(0, 120);
    const cleanEmail   = String(email).trim().toLowerCase().slice(0, 200);
    const cleanPhone   = String(telephone).trim().slice(0, 40);
    const cleanProjet  = String(projet).trim().slice(0, 80);
    const cleanMessage = String(message).trim().slice(0, 4000);

    if (!cleanName)    return res.status(400).json({ error: 'name_required' });
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'email_invalid' });
    }
    if (!cleanMessage || cleanMessage.length < 4) {
      return res.status(400).json({ error: 'message_too_short' });
    }

    const submission = {
      ts:       new Date().toISOString(),
      name:     cleanName,
      email:    cleanEmail,
      telephone:cleanPhone || null,
      projet:   cleanProjet || null,
      message:  cleanMessage,
      source,
      ua:       String(req.headers['user-agent'] || '').slice(0, 200),
    };

    // Structured log — surfaces in Vercel logs (filet de sécurité si l'e-mail échoue).
    console.log('[contact]', JSON.stringify(submission));
    let delivered = false;   // au moins un canal de notification a réussi ?

    // Notification e-mail via Resend (si configuré). Reply-To = client → réponse directe.
    if (process.env.RESEND_API_KEY) {
      const to      = process.env.CONTACT_TO   || 'shop@mikadodeco.be';
      const from    = process.env.CONTACT_FROM || 'Mikado Deco (site) <no-reply@mikadodeco.be>';
      const subject = `Nouvelle demande — ${cleanProjet || 'Contact'} — ${cleanName}`;
      const text = [
        `Nom : ${cleanName}`,
        `E-mail : ${cleanEmail}`,
        cleanPhone  ? `Téléphone : ${cleanPhone}` : null,
        cleanProjet ? `Objet : ${cleanProjet}`    : null,
        `Source : ${source}`,
        `Reçu : ${submission.ts}`,
        '',
        cleanMessage,
      ].filter((l) => l !== null).join('\n');
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ from, to, reply_to: cleanEmail, subject, text }),
        });
        if (r.ok) { delivered = true; }
        else {
          const detail = await r.text().catch(() => '');
          console.warn('[contact] resend failed:', r.status, detail.slice(0, 300));
        }
      } catch (e) {
        console.warn('[contact] resend error:', e.message);
      }
    }

    // If a CONTACT_WEBHOOK_URL is set, forward (Slack, Discord, Zapier, etc.)
    if (process.env.CONTACT_WEBHOOK_URL) {
      try {
        const wr = await fetch(process.env.CONTACT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission),
        });
        if (wr.ok) delivered = true;
      } catch (e) {
        console.warn('[contact] webhook failed:', e.message);
      }
    }

    // Honnêteté : si un canal de notification est configuré mais que l'envoi a échoué, on
    // ne ment pas au client (« envoyé ») → il verra un message + un repli (tél/e-mail direct).
    const hasChannel = !!(process.env.RESEND_API_KEY || process.env.CONTACT_WEBHOOK_URL);
    if (hasChannel && !delivered) return res.status(502).json({ error: 'delivery_failed' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[contact] error:', err.message);
    res.status(500).set('Cache-Control', 'no-store').json({ error: 'server_error' });
  }
});
// One-time merchant authorization for the installed newsletter app. The resulting
// offline token is copied into Vercel as SHOPIFY_ADMIN_TOKEN; this route then closes.
const NEWSLETTER_OAUTH_COOKIE = '__Host-mikado-newsletter-oauth';
const NEWSLETTER_OAUTH_REDIRECT = 'https://www.mikadodeco.be/api/shopify/newsletter/callback';
const newsletterOAuthHeaders = (res) => res.set({
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
});
const newsletterOAuthReady = () =>
  process.env.SHOPIFY_ADMIN_DOMAIN === 'cqnfzf-qb.myshopify.com' &&
  !!process.env.SHOPIFY_ADMIN_CLIENT_ID && !!process.env.SHOPIFY_ADMIN_CLIENT_SECRET;
router.get('/api/shopify/newsletter/connect', formLimiter, (req, res) => {
  newsletterOAuthHeaders(res);
  if (process.env.SHOPIFY_ADMIN_TOKEN) return res.status(410).send('Connexion déjà terminée.');
  if (!newsletterOAuthReady()) return res.status(503).send('Application non configurée.');
  const state = crypto.randomBytes(32).toString('hex');
  res.cookie(NEWSLETTER_OAUTH_COOKIE, state, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000,
  });
  const params = new URLSearchParams({
    client_id: process.env.SHOPIFY_ADMIN_CLIENT_ID,
    scope: 'read_customers,write_customers',
    redirect_uri: NEWSLETTER_OAUTH_REDIRECT,
    state,
  });
  return res.redirect('https://cqnfzf-qb.myshopify.com/admin/oauth/authorize?' + params);
});
router.get('/api/shopify/newsletter/callback', formLimiter, async (req, res) => {
  newsletterOAuthHeaders(res);
  if (process.env.SHOPIFY_ADMIN_TOKEN) return res.status(410).send('Connexion déjà terminée.');
  if (!newsletterOAuthReady()) return res.status(503).send('Application non configurée.');
  const params = new URL(req.originalUrl, ORIGIN).searchParams;
  const keys = [...params.keys()];
  if (new Set(keys).size !== keys.length) return res.status(400).send('Paramètres dupliqués.');
  const state = params.get('state') || '';
  const cookieState = String(req.headers.cookie || '').split(';').map(part => part.trim())
    .find(part => part.startsWith(NEWSLETTER_OAUTH_COOKIE + '='))?.slice(NEWSLETTER_OAUTH_COOKIE.length + 1) || '';
  const a = Buffer.from(state), b = Buffer.from(cookieState);
  if (!state || a.length !== b.length || !crypto.timingSafeEqual(a, b))
    return res.status(403).send('Session de connexion invalide.');
  res.clearCookie(NEWSLETTER_OAUTH_COOKIE, { secure: true, sameSite: 'lax', path: '/' });
  const shop = params.get('shop');
  const code = params.get('code');
  const hmac = params.get('hmac');
  if (shop !== 'cqnfzf-qb.myshopify.com' || !code || !/^[a-f0-9]{64}$/i.test(hmac || ''))
    return res.status(400).send('Réponse Shopify invalide.');
  const message = [...params.entries()].filter(([key]) => key !== 'hmac')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => key + '=' + value).join('&');
  const expected = crypto.createHmac('sha256', process.env.SHOPIFY_ADMIN_CLIENT_SECRET)
    .update(message).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hmac.toLowerCase())))
    return res.status(403).send('Signature Shopify invalide.');
  try {
    const tokenResponse = await fetch('https://cqnfzf-qb.myshopify.com/admin/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: process.env.SHOPIFY_ADMIN_CLIENT_ID,
        client_secret: process.env.SHOPIFY_ADMIN_CLIENT_SECRET,
        code,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!tokenResponse.ok) return res.status(502).send('Échange du jeton refusé par Shopify (' + tokenResponse.status + ').');
    const data = await tokenResponse.json();
    if (!data.access_token || data.expires_in || !(data.scope || '').split(',').includes('write_customers'))
      return res.status(502).send('Jeton Shopify ou autorisations inattendus.');
    const safeToken = String(data.access_token).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return res.type('html').send('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Connexion Shopify</title><body><h1>Connexion Shopify autorisée</h1><p>Copiez ce jeton une seule fois dans Vercel, variable SHOPIFY_ADMIN_TOKEN pour Production et Preview. Ne le partagez pas.</p><textarea id="shopify-token" readonly rows="3" cols="90">' + safeToken + '</textarea></body></html>');
  } catch (error) {
    console.warn('[newsletter-oauth] token exchange failed:', error.name);
    return res.status(502).send('Connexion Shopify momentanément indisponible.');
  }
});
// ─── API: NEWSLETTER → SHOPIFY ─────────────────────────
// Abonne l'adresse dans Shopify (Admin API, consentement e-mail + tags). Sans jeton
// Admin ou en cas d'échec, la boutique reçoit l'adresse par e-mail. Le visiteur ne
// voit « inscrit » que si l'un des deux enregistrements a réussi.
// Body: { email }
router.post('/api/newsletter', formLimiter, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    if (String(req.body?.hp_field || '').trim()) return res.json({ ok: true }); // honeypot anti-bot (faux succès)

    const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 200);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'email_invalid' });
    }
    let saved = null, reason = 'application Shopify non configurée';
    const admin = adminClient();
    if (admin) {
      try { saved = await subscribeInShopify(email, admin); }
      catch (e) { reason = e.message; console.warn('[newsletter] shopify failed:', e.message); }
    }
    if (!saved) {
      try { if (await notifyByEmail(email, reason)) saved = 'email'; }
      catch (e) { console.warn('[newsletter] email failed:', e.message); }
    }
    if (process.env.NEWSLETTER_WEBHOOK_URL) {
      try {
        const r = await fetch(process.env.NEWSLETTER_WEBHOOK_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'newsletter', email, saved, ts: new Date().toISOString() }),
        });
        if (r.ok) saved ||= 'webhook';
      } catch (e) { console.warn('[newsletter] webhook failed:', e.message); }
    }
    console.log('[newsletter]', JSON.stringify({ ts: new Date().toISOString(), saved }));
    if (!saved) return res.status(502).json({ error: 'delivery_failed' });
    res.json({ ok: true, saved });
  } catch (err) {
    console.error('[newsletter] error:', err.message);
    res.status(500).set('Cache-Control', 'no-store').json({ error: 'server_error' });
  }
});

module.exports = router;
