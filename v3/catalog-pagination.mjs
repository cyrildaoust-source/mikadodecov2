// Parcours complet, sans plafond de produits et sans boucle de curseur.
// Une erreur conserve les résultats reçus, mais ne les présente jamais comme complets.
export async function walkCatalog(fetchPage, onChunk, start = null, isCurrent = () => true) {
  let cursor = start, items = [], collection = null;
  const cursors = new Set(), ids = new Set();
  try {
    while (isCurrent()) {
      if (cursors.has(cursor)) throw new Error('Cursor did not advance');
      cursors.add(cursor);
      const data = await fetchPage(cursor);
      if (!isCurrent()) return { cancelled: true };
      if (data?._notFound) return data;
      if (!Array.isArray(data?.items)) throw new Error('Invalid product response');
      if (data.collection) collection = data.collection;
      for (const p of data.items) {
        const key = p.id || p.handle;
        if (p.image && !ids.has(key)) { ids.add(key); items.push(p); }
      }
      onChunk?.(items.slice(), collection);
      if (!data.pageInfo?.hasNextPage) return { items, collection, complete: true };
      cursor = data.pageInfo.endCursor;
      if (!cursor) throw new Error('Missing cursor');
    }
    return { cancelled: true };
  } catch (error) { return { items, collection, complete: false, error }; }
}
