/* selection.html · script de page (ex-inline, sorti dans ce fichier en octobre 2026 : cache navigateur,
   syntaxe vérifiée par npm run check, prêt pour une CSP sans 'unsafe-inline').
   Comportement identique : un module inline s'exécute lui aussi après l'analyse du document. */
import { initShell } from "/shell.mjs";
import { readCart, removeFromCartAt, setCartQty } from "/cart.mjs";
import { euro, escapeHtml } from "/format.mjs";
import { isSaleActive, saleNextTier, SALE } from "/sale.mjs";
import { giftOfferHTML, giftReconcile, giftBind } from "/gift-offer.mjs";
import { productHref } from "/navigation.mjs";
initShell({ active: "", transparentNav: false });

// Livraison : tarif unique en Belgique, sans seuil de gratuité (décision du
// 24 septembre 2026). Shopify reste la référence au paiement.
const DELIVERY_NOTE = "Livraison en Belgique : 50 €, quel que soit le montant.";
const populated = document.querySelector("[data-populated]");
const empty = document.querySelector("[data-empty]");
const itemsEl = document.querySelector("[data-items]");

// Last preview returned by /api/cart/preview. When present, its values
// (post-discount subtotal + discount breakdown) replace the local sums.
let lastPreview = null;
const discountsEl = document.querySelector("[data-discounts]");

let deliveryEstimate = null;
let deliverySequence = 0;
async function refreshDelivery() {
  const seq = ++deliverySequence;
  deliveryEstimate = null;
  render();
  const items = readCart().map(i => ({ variantId: i.variantId, qty: i.qty || 1 }));
  if (!items.length) return;
  try {
    const response = await fetch('/api/cart/delivery', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!response.ok) throw new Error('delivery');
    const result = await response.json();
    if (seq === deliverySequence) { deliveryEstimate = result; render(); }
  } catch (_) { /* Keep the conditional policy, never invent a short ETA. */ }
}

function render() {
  const cart = readCart();
  if (!cart.length) { populated.style.display = "none"; empty.style.display = "block"; return; }
  populated.style.display = "block"; empty.style.display = "none";
  itemsEl.innerHTML = cart.map((i, idx) => {
    const qty = i.qty || 1;
    const lineSubtotal = (i.price || 0) * qty;
    // V1 panier: look up the per-variant payload from /api/cart/preview.
    // Falls back gracefully when the preview hasn't responded yet.
    const previewLine    = lastPreview?.lines?.find((l) => l.variantId === i.variantId);
    const lineDiscount   = previewLine?.discount   || 0;
    const discountTitles = previewLine?.discountTitles || [];
    const discountPct    = previewLine?.discountPct || 0;

    const promoCodeHTML = discountTitles.length
      ? `<div class="sel-item__promo-code">${discountTitles.map(escapeHtml).join(" · ")}</div>`
      : "";

    // 3 visual states (brief §3 cases 1/2/3):
    //   • free (≥99% off)  → original price struck + « Offert » italic
    //   • partial discount → original struck + final price + −amount
    //                        (+ "dont X OFFERTE(S)" for BXGY qty ≥ 4)
    //   • no discount      → plain price
    let priceHTML;
    if (discountPct >= 99) {
      priceHTML = `
        <span class="sel-item__price--original">${euro(lineSubtotal)}</span>
        <span class="sel-item__price--free">Offert</span>`;
    } else if (lineDiscount > 0) {
      // Detect BXGY-style "free units": discount expressed as a whole
      // number of unit prices. Only shown when qty ≥ 4 (where the
      // valorisation makes sense, i.e. the rule "buy 3, get one
      // free"). Floors to 0 if the discount isn't a clean multiple.
      const unit  = qty > 0 ? lineSubtotal / qty : 0;
      const freeN = (qty >= 4 && unit > 0) ? Math.floor(lineDiscount / unit) : 0;
      const freeMention = freeN >= 1
        ? `<span class="sel-item__free-mention">dont ${freeN} OFFERTE${freeN > 1 ? "S" : ""}</span>`
        : "";
      priceHTML = `
        <span class="sel-item__price--original">${euro(lineSubtotal)}</span>
        <span class="sel-item__price--final">${euro(lineSubtotal - lineDiscount)}</span>
        <span class="sel-item__discount-amount">−${euro(lineDiscount)}</span>
        ${freeMention}`;
    } else {
      priceHTML = `<span class="sel-item__price--final">${euro(lineSubtotal)}</span>`;
    }

    return `
    <div class="sel-item" data-row="${idx}">
      <a class="navigation-product-link" href="${escapeHtml(productHref(i, "/selection.html", i.variantId))}" aria-label="${escapeHtml(i.name)}"><img class="sel-item__img" src="${escapeHtml(i.image)}" alt="" /></a>
      <div>
        <div class="sel-item__brand">${escapeHtml(i.brand || "")}</div>
        <a class="sel-item__name navigation-product-link" href="${escapeHtml(productHref(i, "/selection.html", i.variantId))}">${escapeHtml(i.name || "")}</a>
        ${promoCodeHTML}
        <div class="sel-item__controls">
          ${i.gift ? `<span class="sel-item__giftchip">Cadeau</span>` : `<div class="qty qty--sm">
            <button class="qty__btn" data-qty-dec="${escapeHtml(i.variantId)}" data-qty-idx="${idx}" aria-label="${qty > 1 ? "Diminuer" : "Retirer l'article"}" type="button">−</button>
            <input class="qty__val" data-qty-input="${escapeHtml(i.variantId)}" type="text" inputmode="numeric" value="${qty}" aria-label="Quantité" />
            <button class="qty__btn" data-qty-inc="${escapeHtml(i.variantId)}" aria-label="Augmenter" type="button">+</button>
          </div>`}
          <button class="sel-item__remove" data-remove="${idx}">Retirer</button>
        </div>
      </div>
      <div class="sel-item__price">${priceHTML}</div>
    </div>`;
  }).join("");

  const localSubtotal = cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const subtotal = localSubtotal;                  // displayed as "Sous-total" (pre-discount)
  const discount = lastPreview?.discount || 0;     // sum of all Shopify discounts
  const payable  = Math.max(0, subtotal - discount);
  // Les frais de livraison s'ajoutent au paiement (Shopify) ; le récapitulatif les annonce.
  const grand    = payable;
  const hint = document.querySelector("[data-delivery-hint]");
  if (hint) { hint.textContent = DELIVERY_NOTE; hint.hidden = false; }

  // Palier soldes : même encart que le tiroir (« Plus que X € pour −Y% »), pendant les soldes.
  const tierEl = document.querySelector("[data-sale-tier]");
  if (tierEl) {
    if (isSaleActive()) {
      const nt = saleNextTier(subtotal);
      if (nt) { tierEl.innerHTML = `Plus que <strong>${euro(Math.ceil(nt.gap))}</strong> pour bénéficier de <strong>−${nt.pct}%</strong>`; tierEl.hidden = false; }
      else { tierEl.innerHTML = `Remise maximale atteinte · <strong>−${SALE.tiers[SALE.tiers.length - 1][1]}%</strong>`; tierEl.hidden = false; }
    } else { tierEl.hidden = true; }
  }

  document.querySelector("[data-subtotal]").textContent = euro(subtotal);

  // Offre cadeau « Mois Verner Panton » — module dans le résumé.
  const gbox = document.querySelector("[data-gift-offer]");
  if (gbox) {
    const selVals = {};
    gbox.querySelectorAll("[data-gift-variant]").forEach((s) => { selVals[s.getAttribute("data-gift-variant")] = s.value; });
    gbox.innerHTML = giftOfferHTML(lastPreview);
    gbox.querySelectorAll("[data-gift-variant]").forEach((s) => { const v = selVals[s.getAttribute("data-gift-variant")]; if (v) s.value = v; });
  }

  // Discount lines (visible only when Shopify returned at least one)
  const list = lastPreview?.discounts || [];
  if (list.length > 0) {
    discountsEl.innerHTML = list.map((d) => `<div class="sel-row sel-row--discount"><span>Remise · ${escapeHtml(d.title)}</span><span>−${euro(d.amount)}</span></div>`).join("");
    discountsEl.hidden = false;
  } else {
    discountsEl.innerHTML = "";
    discountsEl.hidden = true;
  }

  // "ÉCONOMIES TOTALES" highlight row — visible only when discount > 0.
  // Mirrors Shopify checkout's at-a-glance savings summary.
  const savingsEl = document.querySelector("[data-savings]");
  if (savingsEl) {
    if (discount > 0) {
      savingsEl.innerHTML = `
        <span class="sel-row__savings-label">ÉCONOMIES TOTALES</span>
        <span class="sel-row__savings-amount">−${euro(discount)}</span>`;
      savingsEl.hidden = false;
    } else {
      savingsEl.innerHTML = "";
      savingsEl.hidden = true;
    }
  }

  document.querySelector("[data-total-label]").textContent = "Total";
  document.querySelector("[data-total]").textContent = euro(grand);

  const etaEl = document.querySelector("[data-cart-eta]");
  if (etaEl) {
    etaEl.innerHTML = deliveryEstimate?.label
      ? `Délai estimé : <strong>${escapeHtml(deliveryEstimate.label)}</strong>${deliveryEstimate.onOrder ? ' · envoi groupé dès réception des articles sur commande.' : ''}`
      : 'En stock : <strong>1–2 jours</strong> · Sur commande : <strong>3–4 semaines</strong>. Le délai le plus long s’applique aux envois groupés.';
    etaEl.classList.toggle('sel-eta--warn', !!deliveryEstimate?.onOrder);
    etaEl.hidden = false;
  }

  // NOTE: we deliberately don't nudge the cart toward crossing a BXGY
  // "buy N, get one free" threshold — Shopify renders its own "réduction
  // appliquée" line at checkout when a threshold is crossed, which is enough.
}

// Debounced preview fetch: asks Shopify for the *real* totals + automatic
// discount allocations (e.g. "Buy 5 get 1 free") for the current cart.
let previewTimer = null;
let previewSeq = 0;
function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(async () => {
    const cart = readCart();
    if (!cart.length) { lastPreview = null; render(); return; }
    const mySeq = ++previewSeq;
    try {
      const res = await fetch("/api/cart/preview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart.map((i) => ({ variantId: i.variantId, qty: i.qty || 1 })) }),
      });
      if (!res.ok) throw new Error("preview " + res.status);
      const data = await res.json();
      if (mySeq !== previewSeq) return; // a newer request already started
      lastPreview = data;
      giftReconcile(data);   // cohérence cadeaux sur données fraîches (0 € réel, redescente)
      render();
    } catch (e) {
      // silent failure: keep the local (pre-discount) totals
      if (mySeq === previewSeq) { lastPreview = null; render(); }
      console.warn("[selection] preview unavailable:", e.message);
    }
  }, 500);
}

function findQty(variantId) {
  const item = readCart().find((i) => i.variantId === variantId);
  return item ? (item.qty || 1) : 0;
}

document.addEventListener("click", (e) => {
  const rm = e.target.closest("[data-remove]");
  if (rm) { removeFromCartAt(Number(rm.dataset.remove)); return; }
  const dec = e.target.closest("[data-qty-dec]");
  if (dec) {
    const v = dec.dataset.qtyDec;
    const n = findQty(v);
    // « − » à 1 retire l'article (au lieu de rester bloqué à 1).
    if (n > 1) setCartQty(v, n - 1);
    else removeFromCartAt(Number(dec.dataset.qtyIdx));
    return;
  }
  const inc = e.target.closest("[data-qty-inc]");
  if (inc) {
    const v = inc.dataset.qtyInc;
    const n = findQty(v);
    setCartQty(v, Math.min(99, n + 1));
    return;
  }
});
document.addEventListener("change", (e) => {
  const qtyEl = e.target.closest("[data-qty-input]");
  if (qtyEl) {
    const v = qtyEl.dataset.qtyInput;
    const n = Math.max(1, Math.min(99, parseInt(qtyEl.value) || 1));
    setCartQty(v, n);
  }
});

document.querySelector("[data-checkout]").addEventListener("click", async () => {
  const cart = readCart();
  if (!cart.length) return;
  const btn = document.querySelector("[data-checkout]");
  const err = document.querySelector("[data-checkout-error]");
  btn.disabled = true; btn.textContent = "Redirection…"; err.style.display = "none";
  try {
    const res = await fetch("/api/cart/create", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.map((i) => ({ variantId: i.variantId, qty: i.qty || 1, ...(i.gift ? { gift: i.gift } : {}) })) }),
    });
    const data = await res.json();
    if (data.checkoutUrl) location.href = data.checkoutUrl;
    else throw new Error(data.error || "checkout");
  } catch (e2) {
    err.textContent = "Le paiement n'a pas pu démarrer. Réessayez ou contactez-nous."; err.style.display = "block";
    btn.disabled = false; btn.textContent = "Finaliser la sélection";
    console.warn(e2);
  }
});

document.addEventListener("cart:change", () => { render(); schedulePreview(); refreshDelivery(); });

// Back-button safety: if the user hits "back" from Shopify checkout the
// page restores from the bfcache with the button still disabled / showing
// "Redirection…". Reset to its idle state on every pageshow.
window.addEventListener("pageshow", () => {
  const btn = document.querySelector("[data-checkout]");
  if (btn) { btn.disabled = false; btn.textContent = "Finaliser la sélection"; }
  const err = document.querySelector("[data-checkout-error]");
  if (err) { err.style.display = "none"; err.textContent = ""; }
});

render();
schedulePreview();
refreshDelivery();
giftBind();
document.addEventListener("gift:meta", render);
