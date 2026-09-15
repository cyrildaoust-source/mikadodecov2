import { initShell, productCard } from '/shared.js';
import { bindFamilyRails } from '/family-rail.js';
import { ICON_TAGS, isFamilyIcon, uniqueProducts } from '/family-policy.mjs';

initShell({ active: 'Mobilier', transparentNav: true });
const root = document.querySelector('[data-family]');
const initial = JSON.parse(document.querySelector('#family-initial').textContent);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

bindFamilyRails(root);

const grid = root.querySelector('[data-grid]');
const count = root.querySelector('[data-count]');
const status = root.querySelector('[data-grid-status]');
const more = root.querySelector('[data-more]');
const seen = new Set(initial.items.map(product => product.handle || product.id));
let displayed = initial.items.length;
let pageInfo = initial.pageInfo;
let loading = false;
if (initial.items.length) grid.innerHTML = initial.items.map(productCard).join('');
const featured = root.querySelector('[data-featured-products]');
if (featured && initial.featuredItems.length) featured.innerHTML = initial.featuredItems.map(productCard).join('');

function syncMore() {
  if (!more) return;
  const canLoad = pageInfo?.hasNextPage && pageInfo.endCursor;
  more.hidden = !canLoad;
  if (canLoad) more.href = `/collections/${encodeURIComponent(initial.handle)}?cursor=${encodeURIComponent(pageInfo.endCursor)}#grille`;
}

if (more) more.addEventListener('click', async event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (loading) return;
  loading = true;
  more.setAttribute('aria-disabled', 'true');
  grid.setAttribute('aria-busy', 'true');
  status.textContent = 'Chargement des produits…';
  const cursor = pageInfo.endCursor;
  try {
    const response = await fetch(`/api/collection/${encodeURIComponent(initial.handle)}/products?limit=${initial.pageSize}&cursor=${encodeURIComponent(cursor)}`);
    if (!response.ok) throw new Error('Collection unavailable');
    const payload = await response.json();
    if (!Array.isArray(payload.items) || !payload.pageInfo) throw new Error('Invalid collection response');
    // A broken upstream cursor must not keep offering the same batch forever.
    if (payload.pageInfo.hasNextPage && (!payload.pageInfo.endCursor || payload.pageInfo.endCursor === cursor)) throw new Error('Cursor did not advance');
    const products = uniqueProducts(payload.items).filter(product => !seen.has(product.handle || product.id));
    const firstIndex = grid.children.length;
    grid.insertAdjacentHTML('beforeend', products.map(productCard).join(''));
    products.forEach(product => seen.add(product.handle || product.id));
    displayed += products.length;
    pageInfo = payload.pageInfo;
    count.textContent = `${displayed} produit${displayed > 1 ? 's' : ''} affiché${displayed > 1 ? 's' : ''}`;
    syncMore();
    status.textContent = products.length ? `${products.length} produits supplémentaires affichés.` : 'Tous les produits disponibles sont affichés.';
    // Keep keyboard users in the newly revealed products, including the last batch.
    const firstLink = grid.children[firstIndex]?.querySelector('a');
    firstLink?.focus({ preventScroll: true });
    grid.children[firstIndex]?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  } catch (error) {
    status.textContent = 'Impossible de charger la suite. Réessayez ou ouvrez le lien dans un nouvel onglet.';
  } finally {
    loading = false;
    more.removeAttribute('aria-disabled');
    grid.removeAttribute('aria-busy');
  }
});

// Curation explicite, par famille. Aucun remplacement automatique par des meilleures ventes.
(async () => {
  const section = root.querySelector('[data-icones-sec]');
  if (!section) return;
  const show = products => {
    const rail = section.querySelector('[data-icones]');
    rail.innerHTML = products.map(productCard).join('');
    section.hidden = !products.length;
  };
  const results = await Promise.allSettled(ICON_TAGS.map(async tag => {
    const response = await fetch(`/api/collection/${encodeURIComponent(initial.handle)}/products?limit=30&tag=${encodeURIComponent(tag)}`);
    if (!response.ok) throw new Error('Icons unavailable');
    return (await response.json()).items || [];
  }));
  const products = uniqueProducts(results.flatMap(result => result.status === 'fulfilled' ? result.value : [])).filter(isFamilyIcon);
  if (!products.length) return;
  show(products);
})();
