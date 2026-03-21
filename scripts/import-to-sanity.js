/**
 * One-time migration: imports products.json + brands.json into Sanity.
 *
 * Usage:
 *   node scripts/import-to-sanity.js
 *
 * Requirements:
 *   - SANITY_PROJECT_ID set in .env
 *   - SANITY_API_TOKEN set in .env (needs write access: Editor role)
 *   - Generate token at: sanity.io/manage → project → API → Tokens → Add API token
 */

require('dotenv').config();
const { createClient } = require('@sanity/client');
const fs   = require('fs');
const path = require('path');

// ─── CONFIG ───────────────────────────────────────────────
const PROJECT_ID = process.env.SANITY_PROJECT_ID;
const DATASET    = process.env.SANITY_DATASET || 'production';
const TOKEN      = process.env.SANITY_API_TOKEN;

if (!PROJECT_ID || PROJECT_ID === 'YOUR_PROJECT_ID') {
  console.error('❌  SANITY_PROJECT_ID manquant dans .env');
  process.exit(1);
}
if (!TOKEN) {
  console.error('❌  SANITY_API_TOKEN manquant dans .env');
  console.error('   → sanity.io/manage → project → API → Tokens → Add API token (Editor role)');
  process.exit(1);
}

const client = createClient({
  projectId:  PROJECT_ID,
  dataset:    DATASET,
  apiVersion: '2024-01-01',
  token:      TOKEN,
  useCdn:     false,
});

// ─── LOAD LOCAL DATA ──────────────────────────────────────
const brandsRaw   = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/brands.json'),   'utf8'));
const productsRaw = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/products.json'), 'utf8'));

// ─── IMPORT BRANDS ────────────────────────────────────────
async function importBrands() {
  console.log('\n📦  Importing brands...');
  const brandIdMap = {}; // local id → Sanity _id

  for (const b of brandsRaw) {
    const doc = {
      _id:      `brand-${b.id}`,
      _type:    'brand',
      name:     b.name,
      brandKey: b.brandKey,
      country:  b.country,
      city:     b.city     || '',
      founded:  b.founded  || null,
      tagline:  b.tagline  || '',
      description: b.description || '',
      website:  b.website  || '',
      featured: b.featured || false,
      order:    brandsRaw.indexOf(b),
    };

    try {
      await client.createOrReplace(doc);
      brandIdMap[b.brandKey] = doc._id;
      console.log(`  ✓  ${b.name}`);
    } catch (err) {
      console.error(`  ✗  ${b.name}: ${err.message}`);
    }
  }

  return brandIdMap;
}

// ─── IMPORT PRODUCTS ──────────────────────────────────────
async function importProducts(brandIdMap) {
  console.log('\n📦  Importing products...');

  for (const p of productsRaw) {
    const brandSanityId = brandIdMap[p.brand];

    const doc = {
      _id:   `product-${p.id}`,
      _type: 'product',
      name:  p.name,

      // Reference to brand document
      brand: brandSanityId
        ? { _type: 'reference', _ref: brandSanityId }
        : undefined,

      designer:    p.designer    || '',
      year:        p.year        || null,
      category:    p.category    || '',
      subcategory: p.subcategory || '',
      material:    p.material    || '',
      dimensions:  p.dimensions  || '',
      price:       p.price,
      leadTime:    p.leadTime    || '',
      description: p.description || '',

      // Image: store as URL string in a custom field since we don't have
      // the actual asset uploaded. After import, replace in Sanity Studio.
      // For a proper migration you'd download the image and upload it.
      imageUrl: p.image || '',

      badge:     p.badge     || null,
      available: p.available !== false,
      featured:  p.featured  || false,
    };

    try {
      await client.createOrReplace(doc);
      if (!brandSanityId) {
        console.warn(`  ⚠️   ${p.name} — brand "${p.brand}" not found, skipping reference`);
      } else {
        console.log(`  ✓  ${p.brand} — ${p.name}`);
      }
    } catch (err) {
      console.error(`  ✗  ${p.name}: ${err.message}`);
    }
  }
}

// ─── ADD imageUrl field to product schema if missing ──────
// NOTE: The product schema uses `image` as a Sanity image type.
// For an external URL migration, we temporarily add an `imageUrl` string field.
// After importing, replace image assets in the Studio or use this patch:
async function patchImageUrls() {
  console.log('\n🖼   Note: images are stored as imageUrl (string).');
  console.log('   → Open Sanity Studio, go to each product, and upload the real image.');
  console.log('   → Or use the Sanity asset upload API to migrate URLs automatically.\n');
}

// ─── RUN ──────────────────────────────────────────────────
(async () => {
  console.log(`\n🚀  Importing to Sanity`);
  console.log(`   Project: ${PROJECT_ID}`);
  console.log(`   Dataset: ${DATASET}\n`);

  try {
    const brandIdMap = await importBrands();
    await importProducts(brandIdMap);
    await patchImageUrls();
    console.log('\n✅  Import terminé.');
    console.log('   → Ouvrez le Sanity Studio pour vérifier et compléter les images.');
  } catch (err) {
    console.error('\n❌  Import échoué:', err.message);
    process.exit(1);
  }
})();
