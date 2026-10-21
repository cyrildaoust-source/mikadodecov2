// Export lecture seule : produits actifs, publiés sur la boutique en ligne, avec custom.designer.
import fs from 'node:fs';
const URL_ = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2025-07/graphql.json`;
async function gql(query, variables) {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(URL_, { method: 'POST', headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) });
    const j = await r.json();
    if (j.errors) { if (JSON.stringify(j.errors).includes('THROTTLED')) { await new Promise(r => setTimeout(r, 2000)); continue; } throw new Error(JSON.stringify(j.errors)); }
    return j.data;
  }
}
const pubs = await gql('{ publications(first:20){ nodes { id name } } }');
const online = pubs.publications.nodes.find(p => /online store|boutique en ligne/i.test(p.name)) ;
console.error('publications', pubs.publications.nodes.map(p => p.name).join(' | '));
const headless = pubs.publications.nodes;
const Q = `query($c:String){ products(first:250, after:$c, query:"status:active"){ pageInfo{hasNextPage endCursor} nodes{ id handle title vendor status tags updatedAt
  designer: metafield(namespace:"custom", key:"designer"){ value }
  ${headless.map((p, i) => `p${i}: publishedOnPublication(publicationId:"${p.id}")`).join(' ')} } } }`;
let c = null, out = [];
do {
  const d = await gql(Q, { c });
  for (const n of d.products.nodes) {
    const published = headless.filter((p, i) => n['p' + i]).map(p => p.name);
    out.push({ id: n.id, handle: n.handle, title: n.title, vendor: n.vendor, status: n.status, tags: n.tags, updatedAt: n.updatedAt, designer: n.designer?.value ?? null, published });
  }
  c = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
  process.stderr.write(out.length + ' ');
} while (c);
fs.writeFileSync(process.argv[2], JSON.stringify(out));
console.error('\ndone', out.length);
