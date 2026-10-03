#!/usr/bin/env node
// Audit en lecture seule de la couverture des ventes associées. Requiert les
// variables SHOPIFY_STORE_URL et SHOPIFY_ADMIN_API_KEY ; aucune mutation n'est
// définie dans ce fichier.

import recommendations from '../lib/product-recommendations.js';
const { selectRangeCollections, functionalCompanion, sameRange, sameUniverse, role, sceneBucket, isOutdoor } = recommendations;
import { writeFileSync } from 'node:fs';

const host = String(process.env.SHOPIFY_STORE_URL || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const token = process.env.SHOPIFY_ADMIN_API_KEY || '';
const version = process.env.SHOPIFY_ADMIN_API_VERSION || '2026-07';
const minTotal = Math.max(1, Number(process.argv.find(arg => arg.startsWith('--min-total='))?.split('=')[1]) || 5);
const detailsPath = process.argv.find(arg => arg.startsWith('--details='))?.slice('--details='.length) || '';
if (!host || !token) throw new Error('SHOPIFY_STORE_URL et SHOPIFY_ADMIN_API_KEY sont requis.');
const endpoint = `https://${host}/admin/api/${version}/graphql.json`;

async function admin(query, variables = {}) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-shopify-access-token': token },
      body: JSON.stringify({ query, variables }),
    });
    const result = await response.json();
    const throttled = result.errors?.some(error => error.extensions?.code === 'THROTTLED');
    if (throttled && attempt < 8) {
      await new Promise(resolve => setTimeout(resolve, Math.min(8000, 1500 * (attempt + 1))));
      continue;
    }
    if (!response.ok || result.errors?.length) throw new Error(result.errors?.map(e => e.message).join('; ') || `Shopify ${response.status}`);
    return result.data;
  }
}

const publications = (await admin(`{ publications(first: 50) { nodes { id name } } }`)).publications.nodes;
const headless = publications.find(p => /headless/i.test(p.name)) || publications.find(p => /online store/i.test(p.name));
if (!headless) throw new Error('Publication headless ou Online Store introuvable.');

const query = `query RecommendationCoverage($after: String, $publication: ID!) {
  products(first: 100, after: $after, query: "status:active", sortKey: ID) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id handle title vendor productType tags totalInventory
      published: publishedOnPublication(publicationId: $publication)
      featuredMedia { preview { image { url } } }
      collections(first: 20) { nodes { id handle title } }
      variants(first: 3) { nodes { inventoryPolicy inventoryQuantity inventoryItem { tracked } } }
      complementary: metafield(namespace: "shopify--discovery--product_recommendation", key: "complementary_products") {
        references(first: 50) { nodes { ... on Product { id } } }
      }
      related: metafield(namespace: "shopify--discovery--product_recommendation", key: "related_products") {
        references(first: 50) { nodes { ... on Product { id } } }
      }
    }
  }
}`;

const products = [];
let after = null;
do {
  const page = (await admin(query, { after, publication: headless.id })).products;
  products.push(...page.nodes.filter(product => product.published));
  after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
} while (after);

function available(product) {
  if (!product.featuredMedia?.preview?.image?.url) return false;
  return (product.variants?.nodes || []).some(variant =>
    variant.inventoryPolicy === 'CONTINUE' || variant.inventoryQuantity > 0 || variant.inventoryItem?.tracked === false);
}

const prepared = products.map(product => ({
  ...product,
  name: product.title,
  brand: product.vendor,
  collectionRefs: product.collections.nodes,
  recommendationCollectionIds: selectRangeCollections({
    ...product, name: product.title, brand: product.vendor, collectionRefs: product.collections.nodes,
  }).map(collection => collection.id),
}));
const byVendor = Map.groupBy(prepared, product => product.vendor || '(vide)');
const availableProducts = prepared.filter(available);

const rows = prepared.map(product => {
  const rangeIds = new Set(product.recommendationCollectionIds);
  const candidates = (byVendor.get(product.vendor || '(vide)') || []).filter(candidate => candidate.id !== product.id && available(candidate));
  const sceneCandidates = availableProducts.filter(candidate => candidate.id !== product.id);
  const sceneBuckets = new Set(sceneCandidates.filter(candidate => {
    const bucket = sceneBucket(candidate);
    if (!bucket) return false;
    return !isOutdoor(product) || !['seating', 'lighting'].includes(bucket) || isOutdoor(candidate);
  }).map(sceneBucket));
  const tableScene = role(product) === 'dining-table' && sceneBuckets.size > 0;
  const completeTableScene = role(product) === 'dining-table'
    && ['seating', 'dishware', 'drinkware', 'textiles', ...(isOutdoor(product) ? ['lighting'] : [])]
      .every(bucket => sceneBuckets.has(bucket));
  const deterministicComplementary = candidates.some(candidate => functionalCompanion(product, candidate, rangeIds)) || tableScene;
  const deterministicRelated = candidates.some(candidate => sameRange(product, candidate, rangeIds));
  const universeRelated = availableProducts.some(candidate => candidate.id !== product.id && sameUniverse(product, candidate));
  const curatedComplementary = Boolean(product.complementary?.references?.nodes?.length);
  const curatedRelated = Boolean(product.related?.references?.nodes?.length);
  return {
    product,
    curatedComplementary,
    curatedRelated,
    tableScene,
    completeTableScene,
    before: curatedComplementary || curatedRelated,
    afterComplementary: curatedComplementary || deterministicComplementary,
    afterRelated: curatedRelated || deterministicRelated || universeRelated,
    after: curatedComplementary || curatedRelated || deterministicComplementary || deterministicRelated || universeRelated,
  };
});

function summary(items) {
  const result = { total: items.length };
  for (const key of ['curatedComplementary', 'curatedRelated', 'before', 'afterComplementary', 'afterRelated', 'after']) {
    result[key] = items.filter(item => item[key]).length;
  }
  result.beforePct = Number((100 * result.before / result.total).toFixed(1));
  result.afterPct = Number((100 * result.after / result.total).toFixed(1));
  return result;
}

function grouped(key) {
  return [...Map.groupBy(rows, row => row.product[key] || '(vide)')]
    .map(([name, items]) => ({ name, ...summary(items) }))
    .filter(group => group.total >= minTotal)
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'fr'));
}

const report = {
  measuredAt: new Date().toISOString(),
  publication: headless.name,
  availability: 'image présente et une des trois premières variantes en stock, non suivie ou vendue en dépassement',
  note: 'La couverture après comprend la curation, la gamme ou le modèle, les relations fonctionnelles, les scènes de table et le même type ou univers. Le repli productRecommendations de Shopify est mesuré séparément.',
  overall: summary(rows),
  tableScenes: {
    total: rows.filter(row => role(row.product) === 'dining-table').length,
    withScene: rows.filter(row => row.tableScene).length,
    complete: rows.filter(row => row.completeTableScene).length,
  },
  byBrand: grouped('vendor'),
  byType: grouped('productType'),
};

if (detailsPath) {
  writeFileSync(detailsPath, JSON.stringify({
    ...report,
    products: rows.map(row => ({
      id: row.product.id,
      handle: row.product.handle,
      title: row.product.title,
      vendor: row.product.vendor,
      productType: row.product.productType,
      tags: row.product.tags,
      collections: row.product.collections.nodes,
      role: role(row.product),
      curatedComplementary: row.curatedComplementary,
      curatedRelated: row.curatedRelated,
      tableScene: row.tableScene,
      completeTableScene: row.completeTableScene,
      afterComplementary: row.afterComplementary,
      afterRelated: row.afterRelated,
      after: row.after,
    })),
  }, null, 2));
}

console.log(JSON.stringify(report, null, 2));
