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

// The Mikadodeco storefront (v3/) is served at the site root.
// Old /v3/* links 301-redirect to the clean root path for backward-compat.
app.use('/v3', (req, res) => res.redirect(301, req.url && req.url !== '/' ? req.url : '/'));
// Pretty collection URLs: /collections/<handle> serves the catalog page
// (the client-side script picks up the handle from the pathname). Matches
// Shopify's URL convention so links from newsletters and the press work.
app.get('/collections/:handle', (req, res) => res.sendFile(path.join(__dirname, 'v3', 'produits.html')));
app.use(express.static(path.join(__dirname, 'v3')));
app.use(cors({ origin: process.env.BASE_URL || `http://localhost:${PORT}` }));
app.use(express.json());

// ─── SHOPIFY: PRODUCTS QUERY ───────────────────────────
// Metafields must be enabled in Shopify admin → Settings → Custom data → Products
// Namespaces used: "custom" — keys: designer, year, material, dimensions, lead_time, subcategory
const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges {
        cursor
        node {
          id
          title
          vendor
          productType
          description
          tags
          availableForSale
          totalInventory
          collections(first: 20) {
            edges { node { handle } }
          }
          featuredImage { url altText }
          images(first: 8) {
            edges { node { url altText } }
          }
          priceRange {
            minVariantPrice { amount currencyCode }
            maxVariantPrice { amount currencyCode }
          }
          variants(first: 250) {
            edges {
              node {
                id
                title
                price { amount currencyCode }
                availableForSale
                selectedOptions { name value }
                image { url altText }
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

// Boutique-de-quartier delivery promise: a single, honest baseline applies
// to anything that has to be ordered from a supplier (which is most of the
// catalog). Items physically in stock at the boutique are flagged via the
// Shopify inventory and shipped fast. Anything genuinely outside this
// promise (Fermob peak season, Kriptonite, Charolles, Treku, etc.) gets a
// `delai-long` product tag in Shopify → we fall back to a generic
// "délai sur demande" line and confirm by mail/phone after the order.
const DELIVERY_DEFAULT = '3-4 semaines';
const DELIVERY_LONG    = 'délai sur demande';

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
  // `price` is the first variant's price (what gets stored in the cart when
  // adding from a product card). `priceMin` / `priceMax` come from Shopify's
  // priceRange and cover every variant. The front-end shows "À partir de"
  // when priceMin < priceMax.
  const price    = parseFloat(variant?.price?.amount || node.priceRange.minVariantPrice.amount);
  const priceMin = parseFloat(node.priceRange.minVariantPrice.amount);
  const priceMax = parseFloat(node.priceRange.maxVariantPrice?.amount || node.priceRange.minVariantPrice.amount);
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
    priceMin,
    priceMax,
    // Availability badge — "À voir en boutique" when the article is
    // physically present (regardless of finish/colour — it's an invitation
    // to come see the model, not a real-time stock count). Anything else
    // ships from the supplier under the standard promise.
    inStock:     (typeof node.totalInventory === 'number') && node.totalInventory > 0,
    longDelay:   node.tags.some(t => /^delai[-_ ]?long$/i.test(t)),
    leadTimeLabel: node.tags.some(t => /^delai[-_ ]?long$/i.test(t)) ? DELIVERY_LONG : DELIVERY_DEFAULT,
    // Raw Shopify tags exposed so the front can react to seasonal flags
    // (e.g. `promo-ete-2026`, `promo-siege-ete-2026`) without an extra API.
    tags:        node.tags || [],
    // Shopify collection handles this product belongs to. Lets the front
    // render true collection pages (Mobilier d'extérieur, Promo 4ème
    // chaise offerte…) instead of tag-filtered catalog views.
    collections: (node.collections?.edges || []).map(e => e?.node?.handle).filter(Boolean),
    // (kept for backward compat with the PDP metafield — separate from brand lead-time)
    leadTime:    meta.lead_time   || '',
    description: node.description || '',
    image:       node.featuredImage?.url || node.images?.edges?.[0]?.node?.url || '',
    // image2 = first image that isn't the featured one — used for on-hover swap.
    image2:      (() => {
      const featured = node.featuredImage?.url;
      const imgs = (node.images?.edges || []).map(e => e?.node?.url).filter(Boolean);
      const second = imgs.find(u => u !== featured) || imgs[1] || null;
      return second || null;
    })(),
    // images = full ordered list, used by the PDP gallery
    images:      (node.images?.edges || []).map(e => e?.node?.url).filter(Boolean),
    // variants = all variants with their selected options, used by the PDP variant picker
    variants:    (node.variants?.edges || []).map(e => e?.node).filter(Boolean).map(v => ({
      id: v.id,
      title: v.title,
      price: parseFloat(v.price?.amount),
      available: v.availableForSale,
      options: (v.selectedOptions || []).map(o => ({ name: o.name, value: o.value })),
      image: v.image?.url || null,
    })),
    badge:       badgeTag,
    available:   node.availableForSale && (variant?.availableForSale ?? true),
    featured:    node.tags.some(t => t.toLowerCase() === 'featured'),
  };
}

// Legacy: returns up to 250 products as a flat array. Kept untouched
// because home/selection/produit pages + getBrands/getPromos all read
// this shape directly. The new paginated mode lives in getProductsPage.
async function getProducts() {
  return cached('products', async () => {
    const data = await shopifyFetch(PRODUCTS_QUERY, { first: 250 });
    return data.products.edges.map(({ node }) => mapProduct(node));
  });
}

// Paginated catalog used by the PLP. Cached per (first, after) so each
// "Voir plus" click is sub-5ms after the first warm-up. Returns the
// Shopify-native shape `{ items, pageInfo }`.
async function getProductsPage(first, after) {
  const f   = Math.max(1, Math.min(100, parseInt(first) || 50));
  const a   = after || null;
  const key = `products:page:${f}:${a || 'first'}`;
  return cached(key, async () => {
    const data  = await shopifyFetch(PRODUCTS_QUERY, { first: f, after: a });
    const items = data.products.edges.map(({ node }) => mapProduct(node));
    return { items, pageInfo: data.products.pageInfo };
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
          handle
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
    handle:      node.handle || '',
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
    // Shopify shop currently has 147 collections; 250 leaves headroom
    // without needing pagination.
    const data = await shopifyFetch(COLLECTIONS_QUERY, { first: 250 });
    return data.collections.edges
      .map(({ node }, i) => mapCollection(node, i))
      // Exclude Shopify's built-in "All" / "Home page" collections
      .filter(c => !['all', 'frontpage'].includes(c.handle));
  });
}

// ─── API: GET PRODUCTS ─────────────────────────────────
// Two modes:
//   GET /api/products                              → legacy array (≤ 250 products)
//     consumed by home (main.js), selection, produit, internal getPromos
//   GET /api/products?paginated=1&limit=50&cursor= → { items, pageInfo }
//     consumed by the new PLP at /produits.html
// The legacy shape is contractual — 4 callers depend on it.
app.get('/api/products', async (req, res) => {
  try {
    const { paginated, cursor, limit } = req.query;
    if (paginated || cursor || limit) {
      const page = await getProductsPage(limit, cursor);
      return res.json(page);
    }
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

// ─── SHOPIFY: MAIN MENU QUERY ──────────────────────────
// Drives the site nav top-level + the Mobilier mega menu sub-items
// + the Marques dropdown. Handle "main-menu" is the default Shopify
// "Menu principal" (Online Store → Navigation). Cyril edits libellés
// / ordre / sub-items from the Shopify admin; the site picks it up
// at the next /api/menu cache refresh (5 min TTL).
const MENU_QUERY = `
  query GetMainMenu {
    menu(handle: "main-menu") {
      items {
        title
        url
        items {
          title
          url
          items {
            title
            url
          }
        }
      }
    }
  }
`;

// Shopify returns absolute URLs on the *primary* domain
// (shop.mikadodeco.be/...). Rewrite to bare paths so the front
// uses them directly and the JSON works on any environment.
function rewriteMenuUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    return u.pathname + u.search + u.hash;
  } catch { return url; }
}

function mapMenuItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((it) => ({
    title: it.title || '',
    url:   rewriteMenuUrl(it.url),
    items: mapMenuItems(it.items),
  }));
}

async function getMenu() {
  return cached('menu', async () => {
    const data = await shopifyFetch(MENU_QUERY);
    const items = mapMenuItems(data?.menu?.items || []);
    return { ok: true, items };
  });
}

// ─── API: MAIN MENU ────────────────────────────────────
// Used by the nav widget (mega menu + dropdown). On upstream failure
// returns { ok: false, items: [] } — the client falls back to its
// hardcoded top-level. We never 500 on this endpoint: the nav is
// global and must not surface as a broken request.
app.get('/api/menu', async (req, res) => {
  try {
    res.json(await getMenu());
  } catch (err) {
    console.warn('Menu fetch failed:', err.message);
    res.json({ ok: false, items: [] });
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

// ─── SHOPIFY: COLLECTION PRODUCTS QUERY ────────────────
// Drives /collections/<handle> pages. We query Shopify directly by
// handle so the products are pre-filtered server-side — the V1 bug
// (PLP grid empty on most collections) came from client-side filtering
// a too-small 250-product window.
const COLLECTION_PRODUCTS_QUERY = `
  query GetCollectionProducts($handle: String!, $first: Int!, $after: String, $filters: [ProductFilter!]) {
    collection(handle: $handle) {
      title
      description
      image { url altText }
      products(first: $first, after: $after, filters: $filters) {
        pageInfo { hasNextPage endCursor }
        edges {
          cursor
          node {
            id
            title
            vendor
            productType
            description
            tags
            availableForSale
            totalInventory
            collections(first: 20) { edges { node { handle } } }
            featuredImage { url altText }
            images(first: 8) { edges { node { url altText } } }
            priceRange {
              minVariantPrice { amount currencyCode }
              maxVariantPrice { amount currencyCode }
            }
            variants(first: 250) {
              edges {
                node {
                  id
                  title
                  price { amount currencyCode }
                  availableForSale
                  selectedOptions { name value }
                  image { url altText }
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
            ]) { key value }
          }
        }
      }
    }
  }
`;

async function getCollectionProducts(handle, first, after, tag) {
  const f   = Math.max(1, Math.min(100, parseInt(first) || 50));
  const a   = after || null;
  const t   = (tag || '').trim() || null;
  const key = `collection:${handle}:${t ? `tag-${t}:` : ''}${f}:${a || 'first'}`;
  return cached(key, async () => {
    // Shopify's ProductFilter list — empty = no filter, [{ tag }] =
    // server-side tag filtering. Caching by tag prevents the V2 issue
    // where "Voir plus" on a tag had to scroll past unrelated products.
    const filters = t ? [{ tag: t }] : [];
    const data = await shopifyFetch(COLLECTION_PRODUCTS_QUERY, { handle, first: f, after: a, filters });
    const c = data.collection;
    if (!c) return null;
    const items = c.products.edges.map(({ node }) => mapProduct(node));
    return {
      collection: {
        handle,
        title:       c.title || '',
        description: c.description || '',
        image:       c.image?.url || null,
      },
      items,
      pageInfo: c.products.pageInfo,
    };
  });
}

// ─── API: GET COLLECTION PRODUCTS ──────────────────────
// GET /api/collection/:handle/products?cursor=...&limit=50&tag=<tag>
// Returns { collection: { title, description, image }, items, pageInfo }
// `tag` is an optional Shopify ProductFilter — when present, only
// products carrying that tag are returned (paginated server-side).
// 404 when the handle does not exist in Shopify.
app.get('/api/collection/:handle/products', async (req, res) => {
  try {
    const { handle } = req.params;
    const { cursor, limit, tag } = req.query;
    const payload = await getCollectionProducts(handle, limit, cursor, tag);
    if (!payload) return res.status(404).json({ error: 'collection_not_found' });
    res.json(payload);
  } catch (err) {
    console.error('Collection products error:', err.message);
    res.status(500).json({ error: 'Impossible de charger la collection.' });
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
  delete _cache['promos'];
  delete _cache['menu'];
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

// ─── SHOPIFY: CART PREVIEW (totals + discount allocations) ─────────
// Same shape as CartCreate, but we ask for cost + discountAllocations so
// the front-end can show Shopify's actual price after automatic discounts
// (e.g. "Buy 5 get 1 free") before the customer hits checkout.
const CART_PREVIEW_MUTATION = `
  mutation CartPreview($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        cost {
          subtotalAmount { amount currencyCode }
          totalAmount    { amount currencyCode }
        }
        discountAllocations {
          discountedAmount { amount currencyCode }
          ... on CartAutomaticDiscountAllocation { title }
          ... on CartCodeDiscountAllocation      { code  }
          ... on CartCustomDiscountAllocation    { title }
        }
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              cost {
                subtotalAmount { amount currencyCode }
                totalAmount    { amount currencyCode }
              }
              discountAllocations {
                discountedAmount { amount currencyCode }
                ... on CartAutomaticDiscountAllocation { title }
                ... on CartCodeDiscountAllocation      { code  }
                ... on CartCustomDiscountAllocation    { title }
              }
              merchandise { ... on ProductVariant { id } }
            }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

// ─── PROMO DISCOVERY ────────────────────────────────────
// Probes each variant with a "test cart" of qty=100 to surface any Shopify
// automatic discount that applies. Used by /api/promos to drive the red
// promo badge on product cards and on the PDP.
async function fetchPromoForVariant(variantId) {
  try {
    const data = await shopifyFetch(CART_PREVIEW_MUTATION, {
      lines: [{ merchandiseId: variantId, quantity: 100 }],
    });
    const cart = data.cartCreate?.cart;
    if (!cart) return null;
    const titleOf = (d) => d.title || d.code;
    const cartLevel = (cart.discountAllocations || []).map(titleOf);
    const lineLevel = (cart.lines?.edges || []).flatMap((e) =>
      (e.node.discountAllocations || []).map(titleOf)
    );
    return [...cartLevel, ...lineLevel].find(Boolean) || null;
  } catch (e) {
    console.warn('[promo] probe failed for', variantId, e.message);
    return null;
  }
}

// Parallel probe with bounded concurrency. ~12 in-flight requests is well
// under Shopify's Storefront rate limit and finishes a 200-product probe in
// roughly 2-4 seconds on cold cache. Result cached as 'promos' (5 min TTL).
async function getPromos() {
  return cached('promos', async () => {
    const products = await getProducts();
    const variantIds = [...new Set(products.map((p) => p.variantId).filter(Boolean))];
    const map = {};
    let i = 0;
    const concurrency = 12;
    async function worker() {
      while (i < variantIds.length) {
        const vid = variantIds[i++];
        const title = await fetchPromoForVariant(vid);
        if (title) map[vid] = title;
      }
    }
    await Promise.all(Array(Math.min(concurrency, variantIds.length)).fill(0).map(worker));
    return map;
  });
}

// ─── API: PROMOS (variantId → discount title) ──────────
app.get('/api/promos', async (req, res) => {
  try {
    res.json(await getPromos());
  } catch (err) {
    console.error('Promos error:', err.message);
    res.status(500).json({ error: 'Impossible de charger les promotions.' });
  }
});

// ─── API: CART PREVIEW (totals + discounts) ────────────
// Body: { items: [{ variantId, qty }] }
// Returns: { subtotal, total, discount, discounts: [{title, amount}], lines: [{variantId, qty, subtotal, total, discount}] }
// NOTE: every call creates an orphan Shopify cart that auto-expires after
// ~10 days. Debounce on the client to keep volume sane.
app.post('/api/cart/preview', async (req, res) => {
  try {
    const items = req.body?.items;
    if (!Array.isArray(items) || items.length === 0) return res.json({ subtotal: 0, total: 0, discount: 0, discounts: [], lines: [] });
    const lines = items.map(item => ({
      merchandiseId: item.variantId,
      quantity:      Math.max(1, Math.min(99, parseInt(item.qty) || 1)),
    }));
    const data = await shopifyFetch(CART_PREVIEW_MUTATION, { lines });
    const result = data.cartCreate;
    if (result.userErrors?.length) return res.status(400).json({ error: result.userErrors[0].message });
    const cart = result.cart;
    const titleOf = (d) => d.title || d.code || 'Remise';
    // Cart-level discounts (e.g. code "WELCOME10")
    const cartDiscounts = (cart.discountAllocations || []).map(d => ({
      title:  titleOf(d),
      amount: parseFloat(d.discountedAmount.amount),
    }));
    // Shopify can split one client-side line into several internal lines
    // (e.g. a "buy 5 get 1 free" rule yields one qty=5 line + one qty=1 free
    // line for the same variantId). We collect line-level allocations and
    // aggregate per variant so the cart UI can show a clean per-row discount.
    const internalLines = (cart.lines?.edges || []).map(e => e.node);
    const lineDiscounts = {}; // variantId → total discount
    const allLineDiscountObjs = [];
    for (const n of internalLines) {
      const vid = n.merchandise?.id || null;
      const lineSub = parseFloat(n.cost.subtotalAmount.amount);
      const lineTot = parseFloat(n.cost.totalAmount.amount);
      const lineDiscount = Math.max(0, lineSub - lineTot);
      if (vid && lineDiscount > 0) lineDiscounts[vid] = (lineDiscounts[vid] || 0) + lineDiscount;
      for (const d of (n.discountAllocations || [])) {
        const amt = parseFloat(d.discountedAmount.amount);
        if (amt > 0) allLineDiscountObjs.push({ title: titleOf(d), amount: amt });
      }
    }
    // Summary list, aggregated by title, used to render "Remise · X: -Y €" rows
    const byTitle = {};
    [...cartDiscounts, ...allLineDiscountObjs].forEach(d => {
      if (d.amount <= 0) return;
      byTitle[d.title] = (byTitle[d.title] || 0) + d.amount;
    });
    const discounts = Object.entries(byTitle).map(([title, amount]) => ({ title, amount }));
    const discount  = discounts.reduce((s, d) => s + d.amount, 0);
    // Cart cost totals (post-discount, pre-shipping/tax)
    const subtotalDisplayed = parseFloat(cart.cost.subtotalAmount.amount) + discount; // pre-discount, for "Sous-total"
    const total             = parseFloat(cart.cost.totalAmount.amount);
    res.json({ subtotal: subtotalDisplayed, total, discount, discounts, lineDiscounts });
  } catch (err) {
    console.error('Cart preview error:', err.message);
    res.status(500).json({ error: 'Erreur lors du calcul du panier.' });
  }
});

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

    // Shopify returns checkoutUrl on the store's *primary* domain. The headless
    // storefront owns www.mikadodeco.be (served by Vercel), so checkout must run
    // on a Shopify-pointed subdomain. If SHOPIFY_CHECKOUT_DOMAIN is set (e.g.
    // shop.mikadodeco.be → CNAME shops.myshopify.com, set as Shopify primary),
    // force the checkout host to it so the redirect lands on Shopify, not Vercel.
    let checkoutUrl = result.cart.checkoutUrl;
    if (process.env.SHOPIFY_CHECKOUT_DOMAIN) {
      try {
        const u = new URL(checkoutUrl);
        u.host = process.env.SHOPIFY_CHECKOUT_DOMAIN;
        checkoutUrl = u.toString();
      } catch (_) { /* keep Shopify's original URL on parse failure */ }
    }

    res.json({ checkoutUrl });

  } catch (err) {
    console.error('Cart create error:', err.message);
    res.status(500).json({ error: err.message || 'Erreur lors de la creation du panier.' });
  }
});

// ─── CONTACT FORM ──────────────────────────────────────
// Body: { name, email, telephone?, projet?, message }
// Validates server-side, logs structured payload, returns 200.
// Wire up nodemailer / a webhook later — the endpoint contract stays the same.
app.post('/api/contact', async (req, res) => {
  try {
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

    // Structured log — surfaces in Vercel logs, Heroku, journalctl, etc.
    console.log('[contact]', JSON.stringify(submission));

    // If a CONTACT_WEBHOOK_URL is set, forward (Slack, Discord, Zapier, etc.)
    if (process.env.CONTACT_WEBHOOK_URL) {
      try {
        await fetch(process.env.CONTACT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission),
        });
      } catch (e) {
        console.warn('[contact] webhook failed:', e.message);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[contact] error:', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ─── API: NEWSLETTER → SHOPIFY ─────────────────────────
// Subscribes an email to the Shopify customer list (tagged "newsletter")
// via the storefront's classic customer form handler. No Admin API needed.
// Body: { email }
app.post('/api/newsletter', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 200);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'email_invalid' });
    }
    if (!SHOPIFY_STORE) {
      console.log('[newsletter] (no Shopify configured)', email);
      return res.json({ ok: true });
    }
    // Best-effort: post to Shopify's classic storefront customer form handler.
    // (Reliable customer-list signup needs the Admin API; the storefront form
    // handler is theme/online-store dependent. We never lose the lead: on any
    // failure we still log + optionally forward to a webhook.)
    let shopifyOk = false;
    try {
      const form = new URLSearchParams();
      form.set('form_type', 'customer');
      form.set('utf8', '✓');
      form.set('contact[email]', email);
      form.set('contact[tags]', 'newsletter,v3-footer');
      const r = await fetch(`https://${SHOPIFY_STORE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'mikadodeco-newsletter' },
        body: form.toString(),
        redirect: 'manual',
      });
      shopifyOk = r.status >= 200 && r.status < 400; // 302 = success
      console.log('[newsletter]', JSON.stringify({ ts: new Date().toISOString(), email, shopifyStatus: r.status, shopifyOk }));
    } catch (e) {
      console.warn('[newsletter] shopify post failed:', e.message);
    }

    // Always capture the lead, even if Shopify declined.
    if (process.env.NEWSLETTER_WEBHOOK_URL || process.env.CONTACT_WEBHOOK_URL) {
      try {
        await fetch(process.env.NEWSLETTER_WEBHOOK_URL || process.env.CONTACT_WEBHOOK_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'newsletter', email, shopifyOk, ts: new Date().toISOString() }),
        });
      } catch (e) { console.warn('[newsletter] webhook failed:', e.message); }
    }

    res.json({ ok: true, shopify: shopifyOk });
  } catch (err) {
    console.error('[newsletter] error:', err.message);
    res.status(500).json({ error: 'server_error' });
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
