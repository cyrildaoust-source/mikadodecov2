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

// Les lectures sont réessayées deux fois après une coupure réseau, un 429 ou un 5xx :
// un index filtrable enchaîne des dizaines d'appels et un seul échec transitoire
// suffisait à renvoyer la page en 503. Les mutations (panier, newsletter…) ne sont
// jamais rejouées, pour ne pas les exécuter deux fois.
const RETRY_DELAYS = [250, 750];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
class TransientError extends Error {}

async function requestOnce(query, variables) {
  let res;
  try {
    res = await fetch(SHOPIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (error) {
    throw new TransientError(error.message);
  }
  if (!res.ok) {
    const Failure = res.status === 429 || res.status >= 500 ? TransientError : Error;
    throw new Failure(`Shopify API ${res.status}: ${res.statusText}`);
  }
  const { data, errors } = await res.json();
  if (errors?.length) {
    const throttled = errors.some(e => e.extensions?.code === 'THROTTLED');
    throw new (throttled ? TransientError : Error)(errors.map(e => e.message).join('; '));
  }
  return data;
}

async function shopifyFetch(query, variables = {}) {
  if (!SHOPIFY_URL) throw new Error('Shopify non configure — verifiez SHOPIFY_STORE_DOMAIN dans .env');
  const retries = /\bmutation\b/.test(query) ? [] : RETRY_DELAYS;
  for (let attempt = 0; ; attempt++) {
    try {
      return await requestOnce(query, variables);
    } catch (error) {
      if (!(error instanceof TransientError) || attempt >= retries.length) throw new Error(error.message);
      await wait(retries[attempt]);
    }
  }
}

module.exports = { shopifyFetch, SHOPIFY_STORE };
