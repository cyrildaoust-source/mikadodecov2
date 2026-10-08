/* ---------- panier (sélection) — localStorage ---------- */
import { GIFT_OFFER, giftActive } from "./gift-rules.mjs";

export const CART_KEY = "mikado_v3_cart";

// Cart items: { variantId, qty, handle, name, brand, price, image }
// Migration on read: legacy items missing qty → qty=1. Items with no variantId
// are filtered out (defensive — a bug in older builds could create them and
// they all collide under the empty-string key).
export function readCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((i) => i && i.variantId && (i.gift !== GIFT_OFFER.id || giftActive()))
      .map((i) => ({ ...i, qty: Math.max(1, parseInt(i.qty) || 1) }));
  } catch { return []; }
}
export function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  document.dispatchEvent(new CustomEvent("cart:change"));
}
export function inCart(variantId) { return !!variantId && readCart().some((i) => i.variantId === variantId); }
export function cartQty(variantId) {
  if (!variantId) return 0;
  const item = readCart().find((i) => i.variantId === variantId);
  return item ? item.qty : 0;
}
export function addToCart(item, qty = 1) {
  if (!item || !item.variantId) return readCart();
  const n = Math.max(1, parseInt(qty) || 1);
  const cart = readCart();
  const idx = cart.findIndex((i) => i.variantId === item.variantId);
  if (idx >= 0) cart[idx].qty = (cart[idx].qty || 1) + n;
  else cart.push({ ...item, qty: n });
  writeCart(cart);
  // `cart:add` fires ONLY on an actual add (not on qty edits / removals, which
  // go through writeCart → cart:change only). The cart drawer opens on this.
  document.dispatchEvent(new CustomEvent("cart:add"));
  return cart;
}
export function setCartQty(variantId, qty) {
  const cart = readCart();
  const idx = cart.findIndex((i) => i.variantId === variantId);
  if (idx < 0) return cart;
  const n = Math.max(1, parseInt(qty) || 1);
  cart[idx].qty = n;
  writeCart(cart);
  return cart;
}
export function removeFromCart(variantId) {
  writeCart(readCart().filter((i) => i.variantId !== variantId));
}
// Remove by position. Robust against items missing a variantId (e.g. variant-less
// products stored with variantId = null), which removeFromCart can't target.
export function removeFromCartAt(index) {
  const cart = readCart();
  if (index < 0 || index >= cart.length) return cart;
  cart.splice(index, 1);
  writeCart(cart);
  return cart;
}
export function cartCount() {
  return readCart().reduce((s, i) => s + (i.qty || 1), 0);
}
export function syncBadge() {
  const n = cartCount();
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = n;
    el.classList.toggle("is-empty", n === 0);
  });
}

/* Real cart totals + automatic discount allocations from Shopify
   (POST /api/cart/preview). Debounced ~500ms, stale responses dropped via a
   sequence counter, silent network fallback. `onUpdate(preview|null)` fires with
   the payload, or null on empty cart / failure (→ caller keeps the client-side
   pre-discount subtotal). Returns `{ schedule }`. */
export function createCartPreview(onUpdate, delay = 500) {
  let timer = null, seq = 0;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const cart = readCart();
      if (!cart.length) { onUpdate(null); return; }
      const mySeq = ++seq;
      try {
        const res = await fetch("/api/cart/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: cart.map((i) => ({ variantId: i.variantId, qty: i.qty || 1 })) }),
        });
        if (!res.ok) throw new Error("preview " + res.status);
        const data = await res.json();
        if (mySeq !== seq) return;                 // a newer request superseded this one
        onUpdate(data);
      } catch (e) {
        if (mySeq === seq) onUpdate(null);          // silent: keep local pre-discount totals
        console.warn("[cart] preview unavailable:", e.message);
      }
    }, delay);
  }
  return { schedule };
}
