/**
 * Vitra → Shopify Importer
 * Reads data/vitra-chairs.json and creates products in Shopify via Admin REST API.
 *
 * Prerequisites:
 *   - Run `npm run scrape` first to generate data/vitra-chairs.json
 *   - Set in .env:
 *       SHOPIFY_STORE_DOMAIN=yourstore.myshopify.com
 *       SHOPIFY_API_KEY=shpss_xxxx          (Admin API token)
 *       SHOPIFY_API_VERSION=2024-10          (optional, defaults to 2024-10)
 *
 * Usage:
 *   node scripts/import-to-shopify.js              # import all
 *   node scripts/import-to-shopify.js --dry-run    # preview without importing
 *   node scripts/import-to-shopify.js --limit 5    # import first 5 only
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const STORE   = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN   = process.env.SHOPIFY_API_KEY;
const VERSION = process.env.SHOPIFY_API_VERSION || '2024-10';
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT   = (() => {
  const idx = process.argv.indexOf('--limit');
  return idx !== -1 ? parseInt(process.argv[idx + 1]) : Infinity;
})();

if (!STORE || !TOKEN) {
  console.error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_API_KEY in .env');
  process.exit(1);
}

const API = `https://${STORE}/admin/api/${VERSION}`;
const HEADERS = {
  'Content-Type': 'application/json',
  'X-Shopify-Access-Token': TOKEN,
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Map scraped Vitra product → Shopify product payload ────────────────────
function toShopifyProduct(p) {
  // Each colour becomes a Shopify variant
  const variants = p.colours.length > 0
    ? p.colours.map(colour => ({
        option1: colour,
        price: p.price?.toFixed(2) ?? '0.00',
        inventory_management: null,   // Vitra ships to order — no stock tracking
        fulfillment_service: 'manual',
        requires_shipping: true,
      }))
    : [{
        price: p.price?.toFixed(2) ?? '0.00',
        inventory_management: null,
        fulfillment_service: 'manual',
        requires_shipping: true,
      }];

  const options = p.colours.length > 0
    ? [{ name: 'Couleur', values: p.colours }]
    : [];

  // Images — use Vitra CDN URLs (Shopify will download them)
  const images = p.images.map(img => ({ src: img.src, alt: img.alt }));

  // Tags
  const tags = ['vitra', 'chaise', 'design'];
  if (p.designer) tags.push(p.designer.split(',')[0].trim().toLowerCase().replace(/\s+/g, '-'));

  // Metafields for designer, year, dimensions, source URL
  const metafields = [];
  if (p.designer) {
    metafields.push({ namespace: 'custom', key: 'designer', value: p.designer, type: 'single_line_text_field' });
  }
  const yearMatch = p.designer?.match(/(\d{4})/);
  if (yearMatch) {
    metafields.push({ namespace: 'custom', key: 'year', value: yearMatch[1], type: 'number_integer' });
  }
  if (p.dimensions) {
    metafields.push({ namespace: 'custom', key: 'dimensions', value: p.dimensions, type: 'single_line_text_field' });
  }
  metafields.push({ namespace: 'custom', key: 'source_url', value: p.productUrl, type: 'url' });

  return {
    product: {
      title: p.title,
      vendor: 'Vitra',
      product_type: 'Chaises',
      body_html: `<p>${p.description.replace(/\n\n/g, '</p><p>')}</p>`,
      tags: tags.join(', '),
      status: 'draft',          // Start as draft so you can review before publishing
      variants,
      options,
      images,
      metafields,
    },
  };
}

// ── Shopify Admin API helpers ───────────────────────────────────────────────
async function shopifyPost(endpoint, body) {
  const res = await fetch(`${API}${endpoint}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Shopify ${res.status}: ${JSON.stringify(json.errors)}`);
  return json;
}

async function getExistingTitles() {
  const res = await fetch(`${API}/products.json?limit=250&fields=id,title`, { headers: HEADERS });
  const { products } = await res.json();
  return new Set(products.map(p => p.title));
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const dataPath = path.join(__dirname, '../data/vitra-chairs.json');
  if (!fs.existsSync(dataPath)) {
    console.error('data/vitra-chairs.json not found. Run: npm run scrape');
    process.exit(1);
  }

  const { products, scraped_at, count } = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`\nVitra → Shopify Importer`);
  console.log(`========================`);
  console.log(`Store:        ${STORE}`);
  console.log(`Data file:    ${count} products (scraped ${scraped_at})`);
  console.log(`Mode:         ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`Limit:        ${LIMIT === Infinity ? 'all' : LIMIT}\n`);

  // Check existing products to avoid duplicates
  let existingTitles = new Set();
  if (!DRY_RUN) {
    console.log('Fetching existing Shopify products...');
    existingTitles = await getExistingTitles();
    console.log(`  Found ${existingTitles.size} existing products.\n`);
  }

  const toImport = products
    .filter(p => p.title && p.price)
    .filter(p => !existingTitles.has(p.title))
    .slice(0, LIMIT);

  console.log(`Importing ${toImport.length} products...\n`);

  let created = 0, skipped = 0, failed = 0;

  for (const p of toImport) {
    const payload = toShopifyProduct(p);
    const preview = `${p.title} | €${p.price} | ${p.colours.length} colours`;

    if (DRY_RUN) {
      console.log(`  [DRY] ${preview}`);
      console.log(`        variants: ${payload.product.variants.length}, images: ${payload.product.images.length}, tags: ${payload.product.tags}`);
      skipped++;
      continue;
    }

    try {
      const result = await shopifyPost('/products.json', payload);
      const id = result.product?.id;
      console.log(`  [OK] ${preview} → id:${id}`);
      created++;
      await sleep(600); // respect Shopify rate limit (2 req/sec)
    } catch (e) {
      console.error(`  [ERR] ${p.title}: ${e.message}`);
      failed++;
      await sleep(1000);
    }
  }

  console.log(`\nDone. Created: ${created}  Skipped: ${skipped}  Failed: ${failed}`);
  if (!DRY_RUN && created > 0) {
    console.log(`\nProducts created as DRAFT — review in Shopify admin before publishing.`);
    console.log(`https://${STORE}/admin/products`);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
