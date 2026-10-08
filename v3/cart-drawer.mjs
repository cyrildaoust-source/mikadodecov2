/* ---------- tiroir panier (mini-cart) ----------
   Slides from the right on (1) cart-icon click and (2) cart:add. Lists the cart
   with live qty/remove, a client-side subtotal, and a link to /selection.html.
   Re-renders on cart:change but NEVER auto-opens on it (only cart:add + icon). */
import { euro, escapeHtml } from "./format.mjs";
import { productHref } from "./navigation.mjs";
import { CART_KEY, readCart, cartCount, cartQty, setCartQty, removeFromCartAt, syncBadge, createCartPreview } from "./cart.mjs";
import { SALE, isSaleActive, saleNextTier } from "./sale.mjs";
import { giftOfferHTML, giftReconcile, giftBind } from "./gift-offer.mjs";
import { lockBodyScroll } from "./scroll-lock.mjs";

export function bindCartDrawer() {
  const root = document.querySelector("[data-cart-drawer]");
  if (!root) return;
  const panel    = root.querySelector("[data-cartd-panel]");
  const body     = root.querySelector("[data-cartd-body]");
  const foot     = root.querySelector("[data-cartd-foot]");
  const title    = root.querySelector("[data-cartd-title]");
  const cartLink = document.querySelector(".nav__cart");
  let lastFocus   = null;
  let lastPreview = null;                          // last /api/cart/preview payload (real discounts + total)
  const isOpen    = () => root.classList.contains("open");

  // Per-line price, mirroring selection.html's 3 states: fully free (≥99% off)
  // → struck original + « Offert »; partial discount → struck original + final;
  // else plain price. Uses the per-variant payload from the preview.
  const priceHTML = (i, qty) => {
    const lineSub = (i.price || 0) * qty;
    const pl = lastPreview?.lines?.find((l) => l.variantId === i.variantId);
    const d = pl?.discount || 0;
    if ((pl?.discountPct || 0) >= 99) return `<s class="cartd__was">${euro(lineSub)}</s><em class="cartd__free">Offert</em>`;
    if (d > 0) return `<s class="cartd__was">${euro(lineSub)}</s><span class="cartd__price">${euro(lineSub - d)}</span>`;
    return `<span class="cartd__price">${euro(lineSub)}</span>`;
  };

  const lineHTML = (i, idx) => {
    const qty = Math.max(1, parseInt(i.qty) || 1);
    const href = escapeHtml(productHref(i, "/selection.html", i.variantId));
    return `
      <div class="cartd__item">
        <a class="navigation-product-link" href="${href}" aria-label="${escapeHtml(i.name)}"><img class="cartd__img" src="${escapeHtml(i.image || "")}" alt="" loading="lazy" /></a>
        <div class="cartd__info">
          <div class="cartd__brand">${escapeHtml(i.brand || "")}</div>
          <a class="cartd__name navigation-product-link" href="${href}">${escapeHtml(i.name || "")}</a>
          <div class="cartd__line">
            ${i.gift ? `<span class="cartd__giftchip">Cadeau</span>` : `<div class="cartd__qty">
              <button class="cartd__qbtn" type="button" data-cartd-dec="${escapeHtml(i.variantId)}" data-cartd-idx="${idx}" aria-label="${qty > 1 ? "Diminuer la quantité" : "Retirer l'article"}">−</button>
              <span class="cartd__qval">${qty}</span>
              <button class="cartd__qbtn" type="button" data-cartd-inc="${escapeHtml(i.variantId)}" aria-label="Augmenter la quantité">+</button>
            </div>`}
            <div class="cartd__priceblock">${priceHTML(i, qty)}</div>
          </div>
        </div>
        <button class="cartd__remove" type="button" data-cartd-remove="${idx}" aria-label="Retirer ${escapeHtml(i.name || "cet article")}">&times;</button>
      </div>`;
  };

  function render() {
    const cart = readCart();
    const n = cartCount();
    title.textContent = `Mon panier${n ? ` (${n})` : ""}`;
    if (!cart.length) {
      body.innerHTML = `
        <div class="cartd__empty">
          <p class="cartd__empty-text">Votre panier est vide</p>
          <a class="btn btn--outline btn--block" href="/produits.html">Voir le catalogue</a>
        </div>`;
      foot.hidden = true; foot.innerHTML = "";
      return;
    }
    body.innerHTML = cart.map(lineHTML).join("");
    // Subtotal = client pre-discount sum (same basis as selection.html). Discount
    // + total come from the real preview; until it lands, total === subtotal so
    // the summary is never empty (anti-flash).
    const subtotal  = cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
    const discount  = lastPreview?.discount || 0;
    const total     = Math.max(0, subtotal - discount);
    const discounts = lastPreview?.discounts || [];
    foot.hidden = false;
    const selVals = {};
    foot.querySelectorAll("[data-gift-variant]").forEach((s) => { selVals[s.getAttribute("data-gift-variant")] = s.value; });
    foot.innerHTML = `${giftOfferHTML(lastPreview)}` + `
      <div class="cartd__row"><span>Sous-total</span><span>${euro(subtotal)}</span></div>
      ${discounts.map((d) => `<div class="cartd__row cartd__row--discount"><span>Remise · ${escapeHtml(d.title)}</span><span>−${euro(d.amount)}</span></div>`).join("")}
      <div class="cartd__row cartd__row--total"><span>Total</span><span>${euro(total)}</span></div>
      ${(() => {
        if (!isSaleActive()) return "";
        const nt = saleNextTier(subtotal);
        if (nt) return `<p class="cartd__tier">Plus que <strong>${euro(Math.ceil(nt.gap))}</strong> pour bénéficier de <strong>−${nt.pct}%</strong></p>`;
        const maxPct = SALE.tiers[SALE.tiers.length - 1][1];
        return `<p class="cartd__tier">Remise maximale atteinte · <strong>−${maxPct}%</strong></p>`;
      })()}
      ${discount > 0 ? `<div class="cartd__savings">Vous économisez ${euro(discount)}</div>` : ""}
      <p class="cartd__note">${discount > 0 ? "Remise appliquée automatiquement · " : ""}Livraison en Belgique : 50 €</p>
      <a class="btn btn--blue btn--block cartd__cta" href="/selection.html">Ma sélection →</a>
      <button type="button" class="cartd__continue" data-cartd-continue>← Continuer mes achats</button>`;
    foot.querySelectorAll("[data-gift-variant]").forEach((s) => { const v = selVals[s.getAttribute("data-gift-variant")]; if (v) s.value = v; });
  }

  function onKeydown(e) {
    if (!isOpen()) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    const list = [...panel.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')]
      .filter((el) => el.offsetParent !== null && !el.disabled);
    if (!list.length) { e.preventDefault(); return; }
    const first = list[0], last = list[list.length - 1], a = document.activeElement;
    if (!panel.contains(a)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  }

  function open() {
    if (isOpen()) { render(); preview.schedule(); return; } // already open → refresh, no re-animate
    lastFocus = document.activeElement;
    document.querySelector("[data-drawer]")?.classList.remove("open"); // close mobile menu
    lastPreview = null;                          // anti-flash: start from the client subtotal, no stale discounts
    render();
    preview.schedule();                          // real discounts/total — fetched ONLY while open
    root.classList.add("open");
    lockBodyScroll(true);
    document.addEventListener("keydown", onKeydown, true);
    requestAnimationFrame(() => root.querySelector("[data-cartd-close]")?.focus());
  }

  function close() {
    if (!isOpen()) return;
    root.classList.remove("open");
    lockBodyScroll(false);
    document.removeEventListener("keydown", onKeydown, true);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    else cartLink?.focus();
  }

  // Real discounts/total from Shopify (same endpoint+logic as selection.html),
  // fetched ONLY while the drawer is open; null payload → keep client subtotal.
  const preview = createCartPreview((data) => { lastPreview = data; giftReconcile(data); if (isOpen()) render(); });
  giftBind();
  document.addEventListener("gift:meta", () => { if (isOpen()) render(); });

  // ── open triggers ──
  cartLink?.addEventListener("click", (e) => { e.preventDefault(); open(); }); // href kept as no-JS fallback
  document.addEventListener("cart:add", open);
  document.querySelector("[data-burger]")?.addEventListener("click", close);   // opening mobile menu closes the cart

  // ── close triggers ──
  root.querySelector("[data-cartd-close]")?.addEventListener("click", close);
  root.querySelector("[data-cartd-backdrop]")?.addEventListener("click", close);

  // ── live refresh (never auto-open) — re-render + re-fetch discounts while open ──
  document.addEventListener("cart:change", () => { if (isOpen()) { render(); preview.schedule(); } });

  // Retour arrière / bfcache : la page (donc le tiroir) peut être restaurée telle qu'à
  // sa dernière visite — avec un panier périmé si on l'a modifié ailleurs entre-temps
  // (ex. retrait d'un article sur /selection.html). On resync depuis localStorage à
  // chaque affichage de page + sur changement dans un autre onglet.
  window.addEventListener("pageshow", () => { syncBadge(); render(); if (isOpen()) preview.schedule(); });
  window.addEventListener("storage", (e) => { if (e.key === CART_KEY) { syncBadge(); render(); if (isOpen()) preview.schedule(); } });

  // ── "← Continuer mes achats" closes (foot is re-rendered, so delegate) ──
  foot.addEventListener("click", (e) => { if (e.target.closest("[data-cartd-continue]")) close(); });

  // ── qty +/- via setCartQty (NOT addToCart), remove via index ──
  body.addEventListener("click", (e) => {
    const dec = e.target.closest("[data-cartd-dec]");
    const inc = e.target.closest("[data-cartd-inc]");
    const rem = e.target.closest("[data-cartd-remove]");
    // « − » à 1 retire l'article (au lieu de rester bloqué à 1).
    if (dec) { const n = cartQty(dec.dataset.cartdDec); if (n > 1) setCartQty(dec.dataset.cartdDec, n - 1); else removeFromCartAt(parseInt(dec.dataset.cartdIdx, 10)); }
    else if (inc) setCartQty(inc.dataset.cartdInc, cartQty(inc.dataset.cartdInc) + 1);
    else if (rem) removeFromCartAt(parseInt(rem.dataset.cartdRemove, 10));
  });

  render(); // seed content so an icon-click before any add shows the current cart
}
