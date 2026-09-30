#!/usr/bin/env node
// Mesure en lecture seule le repli automatique Shopify sur les produits que les
// règles déterministes n'ont pas couverts. Le fichier d'entrée est produit par
// audit-product-recommendations.mjs --details=… ; aucune mutation n'est possible.

import { readFileSync, writeFileSync } from 'node:fs';

const option = name => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) || '';
const inputPath = option('input');
const outputPath = option('output');
const shop = option('shop').replace(/\/$/, '');
const concurrency = Math.max(1, Math.min(12, Number(option('concurrency')) || 6));

if (!inputPath || !outputPath || !/^https:\/\//.test(shop)) {
  throw new Error('Usage : --input=<audit.json> --output=<rapport.json> --shop=https://… [--concurrency=6]');
}

const source = JSON.parse(readFileSync(inputPath, 'utf8'));
const products = (source.products || []).filter(product => !product.after);

async function fetchJson(url) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { headers: { accept: 'application/json' } });
    if (response.ok) return response.json();
    // Un produit publié uniquement sur le canal Headless n'existe pas pour le
    // thème Online Store. Il est donc non couvert par ce repli, sans faire
    // échouer la mesure des autres produits.
    if (response.status === 404) return { products: [] };
    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      continue;
    }
    throw new Error(`Shopify ${response.status} pour ${url.pathname}`);
  }
}

async function recommendations(product, intent) {
  const url = new URL('/recommendations/products.json', shop);
  url.searchParams.set('product_id', String(product.id).split('/').at(-1));
  url.searchParams.set('limit', '10');
  url.searchParams.set('intent', intent);
  const payload = await fetchJson(url);
  const seen = new Set([String(product.id).split('/').at(-1), product.handle]);
  return (payload.products || []).filter(candidate => {
    const variant = (candidate.variants || []).find(item => item.available) || candidate.variants?.[0];
    const image = candidate.featured_image || candidate.image || candidate.images?.[0];
    const keys = [String(candidate.id), candidate.handle].filter(Boolean);
    if (candidate.available !== true || !variant?.id || !image || keys.some(key => seen.has(key))) return false;
    keys.forEach(key => seen.add(key));
    return true;
  });
}

async function inspect(product) {
  const [complementary, related] = await Promise.all([
    recommendations(product, 'complementary'),
    recommendations(product, 'related'),
  ]);
  return {
    handle: product.handle,
    title: product.title,
    vendor: product.vendor,
    productType: product.productType,
    role: product.role,
    complementary: complementary.length,
    related: related.length,
    covered: complementary.length > 0 || related.length > 0,
    complementaryHandles: complementary.slice(0, 4).map(item => item.handle),
    relatedHandles: related.slice(0, 4).map(item => item.handle),
  };
}

const rows = new Array(products.length);
let cursor = 0;
await Promise.all(Array.from({ length: Math.min(concurrency, products.length) }, async () => {
  while (cursor < products.length) {
    const index = cursor++;
    rows[index] = await inspect(products[index]);
  }
}));

const missing = rows.filter(row => !row.covered);
const report = {
  measuredAt: new Date().toISOString(),
  sourceMeasuredAt: source.measuredAt,
  shop,
  scope: 'produits non couverts par la curation, la gamme, le modèle ou les règles fonctionnelles',
  evaluated: rows.length,
  coveredByAutomaticShopify: rows.length - missing.length,
  missing: missing.length,
  resultingCatalogCoverage: {
    total: source.overall?.total || source.products?.length || 0,
    covered: (source.overall?.after || 0) + rows.length - missing.length,
  },
  missingProducts: missing,
  products: rows,
};
report.resultingCatalogCoverage.percent = report.resultingCatalogCoverage.total
  ? Number((100 * report.resultingCatalogCoverage.covered / report.resultingCatalogCoverage.total).toFixed(1))
  : 0;

writeFileSync(outputPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  evaluated: report.evaluated,
  coveredByAutomaticShopify: report.coveredByAutomaticShopify,
  missing: report.missing,
  resultingCatalogCoverage: report.resultingCatalogCoverage,
}, null, 2));
