// Relit dans Shopify l'offre Vitra Home Stories for Winter (ensembles de la collection
// et remises automatiques « Vitra Home Stories – … offert(e) – valeur … ») et écrit
// data/campaigns/vitra-home-stories-for-winter.json. Lecture seule.
// Usage : SHOPIFY_STORE_URL=… SHOPIFY_ADMIN_API_KEY=… node scripts/build-home-stories-offer.mjs
import fs from 'node:fs';

const store = String(process.env.SHOPIFY_STORE_URL || process.env.SHOPIFY_ADMIN_DOMAIN || '').replace(/^https?:\/\//, '');
const token = process.env.SHOPIFY_ADMIN_API_KEY;
if (!store || !token) throw new Error('SHOPIFY_STORE_URL et SHOPIFY_ADMIN_API_KEY sont requis.');
const gql = async (query) => {
  const response = await fetch(`https://${store}/admin/api/2025-07/graphql.json`, { method: 'POST', headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
  const json = await response.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
};

const { collectionByHandle } = await gql(`{ collectionByHandle(handle: "vitra-home-stories-for-winter") { products(first: 100) { nodes {
  handle title priceRangeV2 { minVariantPrice { amount } maxVariantPrice { amount } } options { name values } } } } }`);
const { discountNodes } = await gql(`{ discountNodes(first: 50, query: "title:*Home Stories*") { nodes { discount { ... on DiscountAutomaticBasic {
  title startsAt endsAt customerGets { value { ... on DiscountAmount { amount { amount } } } items { ... on DiscountProducts { products(first: 50) { nodes { handle } } } } } } } } } }`);

const value = {};
let startsAt = null, endsAt = null;
for (const { discount: d } of discountNodes.nodes) {
  if (!d?.customerGets) continue;
  startsAt = d.startsAt; endsAt = d.endsAt;
  for (const p of d.customerGets.items.products.nodes) value[p.handle] = Number(d.customerGets.value.amount.amount);
}

const models = [];
for (const p of collectionByHandle.products.nodes) {
  const match = p.title.match(/^Fauteuil (Grand Relax|Grand Repos|Repos) (.+) & (Ottoman|Panchina)$/);
  if (!match) throw new Error('Titre inattendu : ' + p.title);
  const [, name, fabricName, footstool] = match;
  const setPrice = Number(p.priceRangeV2.minVariantPrice.amount);
  if (setPrice !== Number(p.priceRangeV2.maxVariantPrice.amount)) throw new Error('Prix variable dans ' + p.handle);
  if (!value[p.handle]) throw new Error('Aucune remise Home Stories pour ' + p.handle);
  const options = Object.fromEntries(p.options.map(o => [o.name, o.values]));
  let model = models.find(m => m.name === name);
  if (!model) models.push(model = { name, fabrics: [], bases: options['Piètement'] || [], backLeathers: options['Cuir du dos'] || [] });
  let fabric = model.fabrics.find(f => f.name === fabricName);
  if (!fabric) model.fabrics.push(fabric = { name: fabricName, chair: setPrice - value[p.handle], colors: (options['Couleur'] || []).length, offered: [] });
  if (fabric.chair !== setPrice - value[p.handle]) throw new Error('Prix du fauteuil incohérent pour ' + p.handle);
  fabric.offered.push({ footstool, value: value[p.handle], handle: p.handle });
}
const order = ['Grand Relax', 'Repos', 'Grand Repos'];
models.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
for (const m of models) {
  m.fabrics.sort((a, b) => a.chair - b.chair || a.name.localeCompare(b.name, 'fr'));
  for (const f of m.fabrics) f.offered.sort((a, b) => b.value - a.value);
}

const offer = {
  _note: 'Généré depuis Shopify par scripts/build-home-stories-offer.mjs : ensembles de la collection et remises automatiques programmées. Prix TTC ; le prix du fauteuil est le prix de l’ensemble moins la valeur du repose-pieds offert.',
  generatedAt: new Date().toISOString().slice(0, 10), startsAt, endsAt, christmasOrderBy: '2026-11-27', models,
};
fs.writeFileSync(new URL('../data/campaigns/vitra-home-stories-for-winter.json', import.meta.url), JSON.stringify(offer, null, 2) + '\n');
console.log(models.map(m => `${m.name} : ${m.fabrics.length} revêtements, fauteuil dès ${m.fabrics[0].chair} €`).join('\n'));
