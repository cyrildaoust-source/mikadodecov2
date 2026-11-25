// Textes éditoriaux des pages de marque, modifiables dans Shopify sans toucher au code (session marketing,
// 25 novembre 2026) : métaobjets de type `texte_marque` — champs `marque` (handle de la page, ex. « vitra »),
// `titre` (facultatif) et `texte` (paragraphes séparés par une ligne vide). La définition doit être lisible par
// la Storefront API. Sans métaobjet pour une marque, le site garde le texte de data/brand-texts.json.
const { shopifyFetch } = require('../shopify/client');
const { cached } = require('../cache');

const QUERY = `query BrandEditorial($after: String) {
  metaobjects(type: "texte_marque", first: 250, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes { fields { key value } }
  }
}`;

const paragraphs = text => String(text || '').replace(/\r/g, '').split(/\n\s*\n/).map(p => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);

async function readAll() {
  const out = {};
  let after = null;
  for (let i = 0; i < 4; i++) {
    const data = await shopifyFetch(QUERY, { after });
    const page = data?.metaobjects;
    for (const node of page?.nodes || []) {
      const f = Object.fromEntries((node.fields || []).map(x => [x.key, x.value]));
      const handle = String(f.marque || '').trim().toLowerCase();
      const body = paragraphs(f.texte);
      if (handle && body.length) out[handle] = { title: String(f.titre || '').trim(), paragraphs: body };
    }
    if (!page?.pageInfo?.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }
  return out;
}

// Jamais bloquant : en cas d'erreur Shopify, la page garde le texte du fichier.
async function getBrandEditorial() {
  try { return await cached('brand-editorial:v1', readAll, 10 * 60 * 1000); }
  catch (error) { console.warn('[brand-editorial]', error.message); return {}; }
}

module.exports = { getBrandEditorial, paragraphs };
