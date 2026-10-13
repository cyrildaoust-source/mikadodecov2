// Inscription newsletter. Le formulaire classique /contact de la boutique Shopify
// refuse les envois serveur (403 « challenge ») : l'inscription passe par l'Admin API,
// avec un e-mail de secours à la boutique pour ne jamais perdre une adresse.
//
// Chaque inscription crée (ou met à jour) le client Shopify AVEC l'accord marketing par e-mail :
// c'est ce qui déclenche l'automatisation de bienvenue (code de bienvenue). L'origine de
// l'inscription (pied de page, popup) est posée en tag `newsletter-<origine>` (ADR 0017).
const TAGS = ['newsletter', 'site-web'];
const SOURCES = { footer: 'newsletter-footer', popup: 'newsletter-popup' };
const CONSENT = { marketingState: 'SUBSCRIBED', marketingOptInLevel: 'SINGLE_OPT_IN' };

const CREATE = `mutation NewsletterCreate($input: CustomerInput!) {
  customerCreate(input: $input) { customer { id } userErrors { field message } } }`;
const FIND = `query NewsletterCustomer($query: String!) { customers(first: 1, query: $query) { nodes { id } } }`;
const SUBSCRIBE = `mutation NewsletterConsent($input: CustomerEmailMarketingConsentUpdateInput!, $id: ID!, $tags: [String!]!) {
  customerEmailMarketingConsentUpdate(input: $input) { userErrors { field message } }
  tagsAdd(id: $id, tags: $tags) { userErrors { field message } } }`;
const PING = `{ shop { name } }`;

// Application du Dev Dashboard : identifiant + secret échangés contre un jeton de
// 24 h (client credentials grant). Un ancien jeton Admin fixe reste accepté.
let cached = null;
async function exchangedToken(store, env) {
  if (cached && cached.store === store && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const r = await fetch(`https://${store}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: env.SHOPIFY_ADMIN_CLIENT_ID, client_secret: env.SHOPIFY_ADMIN_CLIENT_SECRET }),
  });
  if (!r.ok) {
    const responseText = await r.text();
    const errorCode = responseText.match(/Oauth error ([a-z_]+)/i)?.[1]
      || responseText.match(/"error"\s*:\s*"([a-z_]+)"/i)?.[1]
      || 'unknown';
    throw new Error(`Shopify jeton ${r.status} (${errorCode})`);
  }
  const { access_token, expires_in } = await r.json();
  cached = { store, token: access_token, expiresAt: Date.now() + (expires_in || 3600) * 1000 };
  return access_token;
}
async function accessToken(store, env, mode) {
  if (mode === 'token') return env.SHOPIFY_ADMIN_TOKEN;
  return exchangedToken(store, env);
}
function client(store, env, mode) {
  const url = `https://${store}/admin/api/${env.SHOPIFY_ADMIN_API_VERSION || '2026-07'}/graphql.json`;
  const admin = async (query, variables) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await accessToken(store, env, mode) }, body: JSON.stringify({ query, variables }) });
    if (!r.ok) throw new Error(`Shopify Admin ${r.status}`);
    const { data, errors } = await r.json();
    if (errors?.length) throw new Error(errors.map(e => e.message).join('; '));
    return data;
  };
  admin.mode = mode;
  admin.label = mode === 'token' ? 'jeton fixe' : 'identifiants';
  return admin;
}
// Les clients Admin configurés, dans l'ordre d'essai : le jeton fixe, puis les identifiants
// (jeton de 24 h). Un échec du premier (jeton révoqué, portée manquante) n'empêche plus le second.
function adminClients(env = process.env) {
  const store = env.SHOPIFY_ADMIN_DOMAIN || env.SHOPIFY_STORE_DOMAIN;
  if (!store) return [];
  const list = [];
  if (env.SHOPIFY_ADMIN_TOKEN) list.push(client(store, env, 'token'));
  if (env.SHOPIFY_ADMIN_CLIENT_ID && env.SHOPIFY_ADMIN_CLIENT_SECRET) list.push(client(store, env, 'credentials'));
  return list;
}
// Compatibilité : le premier client configuré (ancien appel), ou null.
const adminClient = (env = process.env) => adminClients(env)[0] || null;

const failIf = errors => { if (errors?.length) throw new Error(errors.map(e => e.message).join('; ')); };
const tagsFor = source => [...TAGS, ...(SOURCES[source] ? [SOURCES[source]] : [])];

// Crée le client abonné, ou abonne le client existant portant cette adresse.
async function subscribeInShopify(email, admin, { source = '' } = {}) {
  const tags = tagsFor(source);
  const created = (await admin(CREATE, { input: { email, tags, emailMarketingConsent: CONSENT } })).customerCreate;
  if (created.customer) return 'created';
  if (!created.userErrors.some(e => (e.field || []).includes('email'))) failIf(created.userErrors);
  const id = (await admin(FIND, { query: `email:"${email.replace(/"/g, '')}"` })).customers.nodes[0]?.id;
  if (!id) failIf(created.userErrors);
  const updated = await admin(SUBSCRIBE, { id, tags, input: { customerId: id, emailMarketingConsent: CONSENT } });
  failIf(updated.customerEmailMarketingConsentUpdate.userErrors);
  failIf(updated.tagsAdd.userErrors);
  return 'subscribed';
}
// Essaie chaque client Admin configuré ; renvoie { saved, reasons } (reasons = échecs, par mode).
async function subscribe(email, { source = '', env = process.env, clients = adminClients(env) } = {}) {
  const reasons = [];
  for (const admin of clients) {
    try { return { saved: await subscribeInShopify(email, admin, { source }), reasons }; }
    catch (e) { reasons.push(`${admin.label} : ${e.message}`); }
  }
  if (!clients.length) reasons.push('application Shopify non configurée');
  return { saved: null, reasons };
}

// État de l'application Admin pour /api/health : chaque mode configuré est sondé par une lecture
// `shop { name }` (jamais d'écriture), au plus une fois par 5 minutes.
let statusCache = null;
async function adminStatus(env = process.env, { clients = adminClients(env), now = Date.now() } = {}) {
  if (statusCache && now - statusCache.at < 5 * 60_000) return statusCache.value;
  const modes = {};
  for (const admin of clients) {
    try { await admin(PING, {}); modes[admin.label] = 'ok'; }
    catch (e) { modes[admin.label] = 'down: ' + e.message; }
  }
  const value = clients.length ? { admin: Object.values(modes).includes('ok') ? 'ok' : 'down', modes } : { admin: 'non configurée', modes };
  statusCache = { at: now, value };
  return value;
}
const resetStatusCache = () => { statusCache = null; };

async function notifyByEmail(email, reason, env = process.env) {
  if (!env.RESEND_API_KEY) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM || 'Mikado Deco (site) <no-reply@mikadodeco.be>',
      to: env.NEWSLETTER_TO || env.CONTACT_TO || 'shop@mikadodeco.be',
      subject: `Inscription newsletter à ajouter dans Shopify — ${email}`,
      text: `Adresse : ${email}\nReçue le : ${new Date().toISOString()}\n\nElle n'a pas pu être enregistrée automatiquement dans Shopify (${reason}).\nÀ ajouter aux abonnés e-mail, avec les tags ${TAGS.join(', ')}.`,
    }),
  });
  return r.ok;
}

module.exports = { adminClient, adminClients, adminStatus, resetStatusCache, subscribe, subscribeInShopify, notifyByEmail, TAGS, SOURCES };
