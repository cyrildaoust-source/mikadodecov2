const INDOOR_COLLECTIONS = new Set(['tables', 'tables-de-salle-a-manger', 'tables-de-cafe', 'tables-basses-et-tables-dappoint']);
const PREFIX = 'tables-v1.';

function isOutdoor(product) {
  const tags = product.tags || [];
  const collections = product.collections || [];
  return ['exterieur', 'mobilier-exterieur', 'mobilier-de-jardin'].some(tag => tags.includes(tag))
    || collections.includes('outdoor') || collections.includes('tables-outdoor');
}

function isTable(product) {
  return /^tables?(?:\b|-)/i.test(product.productType || '');
}

function tableSources(handle) {
  if (INDOOR_COLLECTIONS.has(handle)) return [{ handle, accept: product => isTable(product) && !isOutdoor(product) }];
  if (handle === 'tables-outdoor') return [
    { handle, accept: product => isTable(product) },
    // Complète la collection outdoor existante, sans répéter ses membres.
    { handle: 'tables', accept: product => isTable(product) && isOutdoor(product) && !(product.collections || []).includes('tables-outdoor') },
  ];
  return null;
}

// Parcourt seulement ce qui est nécessaire pour remplir une page + un produit
// de contrôle. Le curseur reprend après le dernier élément réellement consommé.
async function tablePage({ handle, first, after }, fetchChunk) {
  const sources = tableSources(handle);
  if (!sources) throw new Error('Unknown table scope');
  let position = { source: 0, after: after || null };
  if (after?.startsWith(PREFIX)) {
    const decoded = JSON.parse(Buffer.from(after.slice(PREFIX.length), 'base64url').toString());
    if (decoded.handle !== handle || !Number.isInteger(decoded.source) || decoded.source < 0 || decoded.source >= sources.length || !(decoded.after === null || typeof decoded.after === 'string')) throw new Error('Invalid table cursor');
    position = decoded;
  }
  const encode = () => PREFIX + Buffer.from(JSON.stringify({ handle, source: position.source, after: position.after })).toString('base64url');
  const items = [];
  let collection = null;
  const visited = new Set();
  while (position.source < sources.length) {
    const source = sources[position.source];
    const key = position.source + ':' + (position.after || '');
    if (visited.has(key)) throw new Error('Table cursor did not advance');
    visited.add(key);
    const chunk = await fetchChunk(source.handle, Math.min(100, first + 1), position.after);
    if (!chunk) {
      if (sources.length === 1) return null;
      position = { source: position.source + 1, after: null };
      continue;
    }
    collection ||= { ...chunk.collection, handle, ...(handle === 'tables-outdoor' ? { title: 'Tables outdoor' } : {}) };
    for (const edge of chunk.edges) {
      if (!edge.cursor) throw new Error('Missing table cursor');
      if (source.accept(edge.product)) {
        if (items.length === first) return { collection, items, pageInfo: { hasNextPage: true, endCursor: encode() } };
        items.push({ ...edge.product, collections: [...new Set([...(edge.product.collections || []), handle])] });
      }
      position.after = edge.cursor;
    }
    if (chunk.pageInfo.hasNextPage) {
      if (!chunk.pageInfo.endCursor) throw new Error('Missing table continuation');
      position.after = chunk.pageInfo.endCursor;
    } else position = { source: position.source + 1, after: null };
  }
  return collection ? { collection, items, pageInfo: { hasNextPage: false, endCursor: null } } : null;
}

module.exports = { isOutdoor, isTable, tableSources, tablePage };
