/* ---------- cartes produit (toutes les grilles) + ajout au panier délégué ---------- */
import { listingContext, selectionURL, productHref } from "./navigation.mjs";
import { productCardHTML, selectionLabel } from "./product-card.mjs";
import { cartQty, inCart, addToCart, removeFromCart } from "./cart.mjs";

const cardLabel = variantId => selectionLabel(cartQty(variantId));

// Encodes the current listing view as a token (coll:<h> |
// designer:<x> | brand:<x>) so a product link carries the path the user
// actually took — read by the PDP to build a CONTEXTUAL breadcrumb. Derived
// from location at card-render time; "" = no context (homepage / bare
// catalogue / PDP related) → the PDP shows the neutral catalogue trail.
export function currentViewFrom() {
  return listingContext(new URL(location.href));
}

export function productCard(p, source) {
  return productCardHTML(p, {source: typeof source === 'string' ? source : location.pathname + location.search, quantity: cartQty(p.variantId)});
}

/* delegated add-to-cart for any [data-add] button.
   Cards behave as a toggle: click adds 1; clicking when already in cart removes
   the whole line (quantity is adjusted on the selection page or PDP). */
export function bindAddToCart() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    e.preventDefault();
    const v = btn.dataset.variant;
    if (!v) return;
    if (inCart(v)) removeFromCart(v);
    else addToCart({ handle: btn.dataset.handle, variantId: v, name: btn.dataset.name, brand: btn.dataset.brand, price: parseFloat(btn.dataset.price) || 0, image: btn.dataset.image });
    btn.textContent = cardLabel(v);
  });
  // Keep every [data-add] label in sync when the cart changes elsewhere.
  document.addEventListener("cart:change", () => syncCardLabels());
  // Cartes envoyées par le serveur : libellé « Dans la sélection » des articles du panier.
  syncCardLabels();
}
export function syncCardLabels(root = document) {
  root.querySelectorAll("[data-add]").forEach((b) => {
    const v = b.dataset.variant;
    if (v && !b.disabled) {
      const label = cardLabel(v);
      if (b.textContent.trim() !== label.trim()) b.textContent = label;
    }
  });
}

// Recalcule les liens après une pagination sans toucher aux cartes partagées.
export function syncProductLinks(root = document) {
  const source = selectionURL(location.pathname + location.search);
  if (!source) return;
  root.querySelectorAll('.pcard a[href*="/produit.html?"]').forEach(a => {
    const params = new URL(a.href).searchParams;
    a.href = productHref({ handle: params.get('handle'), id: params.get('id') }, source, params.get('variant'));
  });
}

let selectionRestored = false;
export function restoreSelectionPosition(root = document) {
  if (selectionRestored || !location.hash.startsWith('#product-')) return;
  const handle = location.hash.slice(9);
  const card = [...root.querySelectorAll('.pcard__media')].find(a => a.getClientRects().length && new URL(a.href).searchParams.get('handle') === handle);
  if (!card) return;
  selectionRestored = true;
  requestAnimationFrame(() => {
    let saved;
    try { saved = JSON.parse(sessionStorage.getItem('mikado-selection-position')); } catch {}
    if (saved?.source === selectionURL(location.pathname + location.search + location.hash)) window.scrollTo({ top: saved.top, behavior: 'instant' });
    else card.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
}
