// Server-only Shopify transport. Credentials never reach browser modules.
const SHOPIFY_STORE   = process.env.SHOPIFY_STORE_DOMAIN;    // e.g. mystore.myshopify.com
const SHOPIFY_TOKEN   = process.env.SHOPIFY_STOREFRONT_TOKEN; // public Storefront API token
const SHOPIFY_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10';
const SHOPIFY_URL     = SHOPIFY_STORE
  ? `https://${SHOPIFY_STORE}/api/${SHOPIFY_VERSION}/graphql.json`
  : null;

if (!SHOPIFY_URL || !SHOPIFY_TOKEN) {
  console.warn('Shopify non configure — SHOPIFY_STORE_DOMAIN ou SHOPIFY_STOREFRONT_TOKEN manquant dans .env\n');
}

async function shopifyFetch(query, variables = {}) {
  if (!SHOPIFY_URL) throw new Error('Shopify non configure — verifiez SHOPIFY_STORE_DOMAIN dans .env');
  const res = await fetch(SHOPIFY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify API ${res.status}: ${res.statusText}`);
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors.map(e => e.message).join('; '));
  return data;
}

module.exports = { shopifyFetch, SHOPIFY_STORE };
