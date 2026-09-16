// Taille commune aux catalogues numérotés, indépendante des lots réseau.
export const DISPLAY_PAGE_SIZE = 60;

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

export function sortCatalog(products, sort) {
  const list = products.slice(), price = p => p.priceMin ?? p.price ?? 0;
  if (sort === 'asc') list.sort((a, b) => price(a) - price(b));
  else if (sort === 'desc') list.sort((a, b) => price(b) - price(a));
  else if (sort === 'az') list.sort((a, b) => String(a.name).localeCompare(String(b.name), 'fr'));
  return list;
}

// Un lot partiel ne permet ni d'annoncer le total ni de borner la page demandée.
export function catalogPagination(itemCount, { page = 1, pageSize = DISPLAY_PAGE_SIZE, loading = false, incomplete = false } = {}) {
  const requested = Math.max(1, Number.parseInt(page, 10) || 1);
  if (loading || incomplete) return { page: requested, totalPages: null, status: loading ? 'loading' : 'error' };
  const totalPages = Math.max(1, Math.ceil(itemCount / pageSize));
  return { page: Math.min(requested, totalPages), totalPages, status: 'ready' };
}
