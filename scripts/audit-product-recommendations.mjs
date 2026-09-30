#!/usr/bin/env node
// Audit en lecture seule de la couverture des ventes associées. Requiert les
// variables SHOPIFY_STORE_URL et SHOPIFY_ADMIN_API_KEY ; aucune mutation n'est
// définie dans ce fichier.

import recommendations from '../lib/product-recommendations.js';
const { selectRangeCollections, functionalCompanion, sameRange } = recommendations;

const host = String(process.env.SHOPIFY_STORE_URL || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const token = process.env.SHOPIFY_ADMIN_API_KEY || '';
const version = process.env.SHOPIFY_ADMIN_API_VERSION || '2026-07';
const minTotal = Math.max(1, Number(process.argv.find(arg => arg.startsWith('--min-total='))?.split('=')[1]) || 5);
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

const rows = prepared.map(product => {
  const rangeIds = new Set(product.recommendationCollectionIds);
  const candidates = (byVendor.get(product.vendor || '(vide)') || []).filter(candidate => candidate.id !== product.id && available(candidate));
  const deterministicComplementary = candidates.some(candidate => functionalCompanion(product, candidate, rangeIds));
  const deterministicRelated = candidates.some(candidate => sameRange(product, candidate, rangeIds));
  const curatedComplementary = Boolean(product.complementary?.references?.nodes?.length);
  const curatedRelated = Boolean(product.related?.references?.nodes?.length);
  return {
    product,
    curatedComplementary,
    curatedRelated,
    before: curatedComplementary || curatedRelated,
    afterComplementary: curatedComplementary || deterministicComplementary,
    afterRelated: curatedRelated || deterministicRelated,
    after: curatedComplementary || curatedRelated || deterministicComplementary || deterministicRelated,
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

console.log(JSON.stringify({
  measuredAt: new Date().toISOString(),
  publication: headless.name,
  availability: 'image présente et une des trois premières variantes en stock, non suivie ou vendue en dépassement',
  note: 'La couverture après est le socle déterministe gamme/modèle ; le repli productRecommendations de Shopify ne peut que l’augmenter.',
  overall: summary(rows),
  byBrand: grouped('vendor'),
  byType: grouped('productType'),
}, null, 2));
