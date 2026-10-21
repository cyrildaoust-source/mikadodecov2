// Ajoute les tags créateur du plan (tagsAdd uniquement, aucun retrait).
// Usage : node apply-tags.mjs tag-plan.json [--dry]
import fs from 'node:fs';
const URL_ = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2025-07/graphql.json`;
const plan = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const dry = process.argv.includes('--dry');
const M = `mutation($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { node { id } userErrors { field message } } }`;
const log = [];
for (const item of plan) {
  if (dry) { log.push({ ...item, result: 'dry' }); continue; }
  let res;
  for (let i = 0; i < 6; i++) {
    const r = await fetch(URL_, { method: 'POST', headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: M, variables: { id: item.id, tags: item.add } }) });
    res = await r.json();
    if (res.errors && JSON.stringify(res.errors).includes('THROTTLED')) { await new Promise(r => setTimeout(r, 2000)); continue; }
    break;
  }
  const errors = res.errors || res.data?.tagsAdd?.userErrors || [];
  log.push({ id: item.id, handle: item.handle, add: item.add, ok: !errors.length, errors });
  process.stderr.write(errors.length ? 'x' : '.');
  await new Promise(r => setTimeout(r, 250));
}
fs.writeFileSync('tag-log.json', JSON.stringify(log, null, 1));
console.error('\n', log.filter(l => l.ok || l.result).length, '/', plan.length);
