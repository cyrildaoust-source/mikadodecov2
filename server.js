require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

// ─── SHOPIFY STOREFRONT API ────────────────────────────
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

// ─── CACHE (5 min TTL) ─────────────────────────────────
const _cache = {};
async function cached(key, fetcher, ttl = 300_000) {
  const now = Date.now();
  if (_cache[key] && _cache[key].expiry > now) return _cache[key].data;
  const data = await fetcher();
  _cache[key] = { data, expiry: now + ttl };
  return data;
}

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({ origin: process.env.BASE_URL || `http://localhost:${PORT}` }));
app.use(express.json());

// ─── SHOPIFY: PRODUCTS QUERY ───────────────────────────
// Metafields must be enabled in Shopify admin → Settings → Custom data → Products
// Namespaces used: "custom" — keys: designer, year, material, dimensions, lead_time, subcategory
const PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          vendor
          productType
          description
          tags
          availableForSale
          featuredImage { url altText }
          priceRange {
            minVariantPrice { amount currencyCode }
          }
          variants(first: 1) {
            edges {
              node {
                id
                price { amount currencyCode }
                availableForSale
              }
            }
          }
          metafields(identifiers: [
            { namespace: "custom", key: "designer" }
            { namespace: "custom", key: "year" }
            { namespace: "custom", key: "material" }
            { namespace: "custom", key: "dimensions" }
            { namespace: "custom", key: "lead_time" }
            { namespace: "custom", key: "subcategory" }
          ]) {
            key
            value
          }
        }
      }
    }
  }
`;

// Map fine-grained Shopify product types (Fermob/HAY use FR labels) to the
// 6 top-level frontend categories. Anything unmatched falls through to "objets".
const CATEGORY_MAP = {
  assises:    ['chaise', 'chaise haute', 'fauteuil', 'fauteuil à bascule', 'banc', 'tabouret', 'pouf', 'repose-pieds'],
  tables:     ['table', 'table basse', 'table à rallonge'],
  luminaires: ['applique', 'lampadaire', 'lampe baladeuse', 'lampe de bureau', 'lampe de chevet', 'lampe de table', 'lampe à pince', 'pied de lampe'],
  rangements: ['caisse de rangement', 'patère'],
  exterieur:  ['accessoires de grill extérieur', 'housse de protection', 'jardinière'],
};
const TYPE_TO_CATEGORY = Object.entries(CATEGORY_MAP).reduce((acc, [cat, types]) => {
  types.forEach(t => { acc[t] = cat; });
  return acc;
}, {});

function mapProduct(node) {
  const meta = {};
  (node.metafields || []).filter(Boolean).forEach(m => { if (m) meta[m.key] = m.value; });
  const variant = node.variants.edges[0]?.node;
  const price   = parseFloat(variant?.price?.amount || node.priceRange.minVariantPrice.amount);
  // Tags: use "badge:nouveau", "badge:limite", "badge:bestseller", "featured" conventions
  const badgeTag = node.tags.find(t => t.startsWith('badge:'))?.replace('badge:', '') || null;
  const rawType  = (node.productType || '').toLowerCase().trim();
  return {
    id:          node.id,
    variantId:   variant?.id || null,
    name:        node.title,
    brand:       node.vendor || '',
    designer:    meta.designer    || '',
    year:        meta.year        ? parseInt(meta.year) : null,
    category:    TYPE_TO_CATEGORY[rawType] || 'objets',
    productType: rawType,
    subcategory: meta.subcategory || node.tags.find(t => t.startsWith('sub:'))?.replace('sub:', '') || '',
    material:    meta.material    || '',
    dimensions:  meta.dimensions  || '',
    price,
    leadTime:    meta.lead_time   || '',
    description: node.description || '',
    image:       node.featuredImage?.url || '',
    badge:       badgeTag,
    available:   node.availableForSale && (variant?.availableForSale ?? true),
    featured:    node.tags.some(t => t.toLowerCase() === 'featured'),
  };
}

async function getProducts() {
  return cached('products', async () => {
    const data = await shopifyFetch(PRODUCTS_QUERY, { first: 250 });
    return data.products.edges.map(({ node }) => mapProduct(node));
  });
}

// ─── BRANDS: DERIVED FROM product.vendor ───────────────
// Brands are inferred from the vendor field on each product (HAY, Vitra, &Tradition…).
// To enrich a brand with metadata (country, founded, tagline, logo, website, color),
// create a Shopify Page named "brand:<vendor>" — not implemented yet, see TODO below.
async function getBrands() {
  return cached('brands', async () => {
    const products = await getProducts();
    const byVendor = new Map();
    for (const p of products) {
      const key = p.brand?.trim();
      if (!key) continue;
      const slug = key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const entry = byVendor.get(key) || {
        id:          `brand:${slug}`,
        brandKey:    key,
        name:        key,
        country:     '',
        city:        '',
        founded:     null,
        tagline:     '',
        description: '',
        website:     '',
        logo:        null,
        color:       '#d4c5b0',
        featured:    false,
        productCount: 0,
      };
      entry.productCount += 1;
      byVendor.set(key, entry);
    }
    return [...byVendor.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((b, i) => ({ ...b, order: i }));
  });
}

// ─── SHOPIFY: COLLECTIONS QUERY ────────────────────────
// Real Shopify collections (product lines like Palissade, Bistro, Luxembourg…).
// Optional metafields: custom.country, custom.city, custom.founded, custom.website,
// custom.tagline, custom.color, custom.featured
const COLLECTIONS_QUERY = `
  query GetCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          title
          description
          image { url altText }
          metafields(identifiers: [
            { namespace: "custom", key: "country" }
            { namespace: "custom", key: "city" }
            { namespace: "custom", key: "founded" }
            { namespace: "custom", key: "website" }
            { namespace: "custom", key: "tagline" }
            { namespace: "custom", key: "color" }
            { namespace: "custom", key: "featured" }
          ]) {
            key
            value
          }
        }
      }
    }
  }
`;

function mapCollection(node, index) {
  const meta = {};
  (node.metafields || []).filter(Boolean).forEach(m => { if (m) meta[m.key] = m.value; });
  const slug = node.id.split('/').pop().toLowerCase();
  return {
    id:          node.id,
    slug,
    key:         node.title,
    name:        node.title,
    country:     meta.country   || '',
    city:        meta.city      || '',
    founded:     meta.founded   ? parseInt(meta.founded) : null,
    tagline:     meta.tagline   || '',
    description: node.description || '',
    website:     meta.website   || '',
    image:       node.image?.url || null,
    color:       meta.color     || '#d4c5b0',
    featured:    meta.featured  === 'true',
    order:       index,
  };
}

async function getCollections() {
  return cached('collections', async () => {
    const data = await shopifyFetch(COLLECTIONS_QUERY, { first: 100 });
    return data.collections.edges
      .map(({ node }, i) => mapCollection(node, i))
      // Exclude Shopify's built-in "All" / "Home page" collections
      .filter(c => !['all', 'frontpage'].includes(c.slug));
  });
}

// ─── API: GET PRODUCTS ─────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (err) {
    console.error('Products error:', err.message);
    res.status(500).json({ error: 'Impossible de charger les produits.' });
  }
});

// ─── API: GET BRANDS ───────────────────────────────────
// Derived from product.vendor — returns one entry per unique vendor.
app.get('/api/brands', async (req, res) => {
  try {
    const brands = await getBrands();
    res.json(brands);
  } catch (err) {
    console.error('Brands error:', err.message);
    res.status(500).json({ error: 'Impossible de charger les marques.' });
  }
});

// ─── API: GET COLLECTIONS ──────────────────────────────
// Real Shopify collections (product lines: Palissade, Bistro, Luxembourg…).
app.get('/api/collections', async (req, res) => {
  try {
    const collections = await getCollections();
    res.json(collections);
  } catch (err) {
    console.error('Collections error:', err.message);
    res.status(500).json({ error: 'Impossible de charger les collections.' });
  }
});

// ─── API: VITRA CHAIRS (scraped data) ─────────────────
// Run `npm run scrape` to regenerate data/vitra-chairs.json
const VITRA_JSON = path.join(__dirname, 'data/vitra-chairs.json');

app.get('/api/vitra', (req, res) => {
  if (!fs.existsSync(VITRA_JSON)) {
    return res.status(404).json({ error: 'Vitra data not found. Run: npm run scrape' });
  }
  try {
    const raw = fs.readFileSync(VITRA_JSON, 'utf8');
    const { products, scraped_at, count } = JSON.parse(raw);

    // Optional filters
    let filtered = products;
    const { q, min, max } = req.query;
    if (q) {
      const term = q.toLowerCase();
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(term) ||
        p.designer?.toLowerCase().includes(term) ||
        p.colours?.some(c => c.includes(term))
      );
    }
    if (min) filtered = filtered.filter(p => p.price >= parseFloat(min));
    if (max) filtered = filtered.filter(p => p.price <= parseFloat(max));

    res.json({ scraped_at, total: count, count: filtered.length, products: filtered });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read Vitra data.' });
  }
});

// ─── API: REVALIDATE CACHE ─────────────────────────────
// Call this from a Shopify webhook (Products/update, Collections/update)
// Setup in Shopify admin → Settings → Notifications → Webhooks
app.post('/api/revalidate', (req, res) => {
  delete _cache['products'];
  delete _cache['brands'];
  delete _cache['collections'];
  console.log('Cache cleared via /api/revalidate');
  res.json({ revalidated: true });
});

// ─── SHOPIFY: CART CREATE MUTATION ─────────────────────
const CART_CREATE_MUTATION = `
  mutation CartCreate(
    $lines:      [CartLineInput!]!
    $note:       String
    $attributes: [AttributeInput!]
  ) {
    cartCreate(input: {
      lines:      $lines
      note:       $note
      attributes: $attributes
    }) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ─── API: CREATE CART → SHOPIFY CHECKOUT ───────────────
// Body: { items: [{ variantId, qty }], customer: { prenom, nom, email, telephone, projet, message } }
// Returns: { checkoutUrl } — redirect the browser to this URL
app.post('/api/cart/create', async (req, res) => {
  try {
    const { items, customer } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'La selection est vide.' });
    }

    const lines = items.map(item => ({
      merchandiseId: item.variantId,
      quantity:      Math.max(1, Math.min(10, parseInt(item.qty) || 1)),
    }));

    // Pass customer context as cart note + attributes
    // (visible in Shopify admin → Orders → Notes / Attributes)
    const noteParts = [];
    if (customer?.prenom || customer?.nom) {
      noteParts.push(`Client: ${[customer.prenom, customer.nom].filter(Boolean).join(' ')}`);
    }
    if (customer?.telephone) noteParts.push(`Tel: ${customer.telephone}`);
    if (customer?.projet)    noteParts.push(`Projet: ${customer.projet}`);
    if (customer?.message)   noteParts.push(`Message: ${customer.message.substring(0, 500)}`);

    const attributes = [];
    if (customer?.prenom)    attributes.push({ key: 'Prenom',    value: customer.prenom });
    if (customer?.nom)       attributes.push({ key: 'Nom',       value: customer.nom });
    if (customer?.email)     attributes.push({ key: 'Email',     value: customer.email });
    if (customer?.telephone) attributes.push({ key: 'Telephone', value: customer.telephone });
    if (customer?.projet)    attributes.push({ key: 'Projet',    value: customer.projet });

    const data = await shopifyFetch(CART_CREATE_MUTATION, {
      lines,
      note:       noteParts.length ? noteParts.join('\n') : undefined,
      attributes: attributes.length ? attributes : undefined,
    });

    const result = data.cartCreate;
    if (result.userErrors?.length) {
      return res.status(400).json({ error: result.userErrors[0].message });
    }

    res.json({ checkoutUrl: result.cart.checkoutUrl });

  } catch (err) {
    console.error('Cart create error:', err.message);
    res.status(500).json({ error: err.message || 'Erreur lors de la creation du panier.' });
  }
});

// ─── START (only when run directly, not when imported by Vercel) ──
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  Mikadodeco — serveur demarre`);
    console.log(`  http://localhost:${PORT}\n`);
  });
}

module.exports = app;
