// Inscription newsletter. Le formulaire classique /contact de la boutique Shopify
// refuse les envois serveur (403 « challenge ») : l'inscription passe par l'Admin API,
// avec un e-mail de secours à la boutique pour ne jamais perdre une adresse.
const TAGS = ['newsletter', 'site-web'];
const CONSENT = { marketingState: 'SUBSCRIBED', marketingOptInLevel: 'SINGLE_OPT_IN' };

const CREATE = `mutation NewsletterCreate($input: CustomerInput!) {
  customerCreate(input: $input) { customer { id } userErrors { field message } } }`;
const FIND = `query NewsletterCustomer($query: String!) { customers(first: 1, query: $query) { nodes { id } } }`;
const SUBSCRIBE = `mutation NewsletterConsent($input: CustomerEmailMarketingConsentUpdateInput!, $id: ID!, $tags: [String!]!) {
  customerEmailMarketingConsentUpdate(input: $input) { userErrors { field message } }
  tagsAdd(id: $id, tags: $tags) { userErrors { field message } } }`;

// Application du Dev Dashboard : identifiant + secret échangés contre un jeton de
// 24 h (client credentials grant). Un ancien jeton Admin fixe reste accepté.
let cached = null;
async function accessToken(store, env) {
  if (env.SHOPIFY_ADMIN_TOKEN) return env.SHOPIFY_ADMIN_TOKEN;
  if (cached && cached.store === store && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const r = await fetch(`https://${store}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: env.SHOPIFY_ADMIN_CLIENT_ID, client_secret: env.SHOPIFY_ADMIN_CLIENT_SECRET }),
  });
  if (!r.ok) throw new Error(`Shopify jeton ${r.status}`);
  const { access_token, expires_in } = await r.json();
  cached = { store, token: access_token, expiresAt: Date.now() + (expires_in || 3600) * 1000 };
  return access_token;
}

function adminClient(env = process.env) {
  const store = env.SHOPIFY_ADMIN_DOMAIN || env.SHOPIFY_STORE_DOMAIN;
  if (!store || !(env.SHOPIFY_ADMIN_TOKEN || (env.SHOPIFY_ADMIN_CLIENT_ID && env.SHOPIFY_ADMIN_CLIENT_SECRET))) return null;
  const url = `https://${store}/admin/api/${env.SHOPIFY_ADMIN_API_VERSION || '2026-07'}/graphql.json`;
  return async (query, variables) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await accessToken(store, env) }, body: JSON.stringify({ query, variables }) });
    if (!r.ok) throw new Error(`Shopify Admin ${r.status}`);
    const { data, errors } = await r.json();
    if (errors?.length) throw new Error(errors.map(e => e.message).join('; '));
    return data;
  };
}

const failIf = errors => { if (errors?.length) throw new Error(errors.map(e => e.message).join('; ')); };

// Crée le client abonné, ou abonne le client existant portant cette adresse.
async function subscribeInShopify(email, admin) {
  const created = (await admin(CREATE, { input: { email, tags: TAGS, emailMarketingConsent: CONSENT } })).customerCreate;
  if (created.customer) return 'created';
  if (!created.userErrors.some(e => (e.field || []).includes('email'))) failIf(created.userErrors);
  const id = (await admin(FIND, { query: `email:"${email.replace(/"/g, '')}"` })).customers.nodes[0]?.id;
  if (!id) failIf(created.userErrors);
  const updated = await admin(SUBSCRIBE, { id, tags: TAGS, input: { customerId: id, emailMarketingConsent: CONSENT } });
  failIf(updated.customerEmailMarketingConsentUpdate.userErrors);
  failIf(updated.tagsAdd.userErrors);
  return 'subscribed';
}

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

module.exports = { adminClient, subscribeInShopify, notifyByEmail, TAGS };
