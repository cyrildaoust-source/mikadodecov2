/* ============================================================
   Mikadodeco v3 · shared shell + cart + helpers
   Imported by every page. Injects the chrome (announce + nav +
   drawer) and footer so they stay in sync, wires the selection
   cart (localStorage), and exposes formatting + card helpers.
   ============================================================ */

import { chromeHTML, footerHTML } from "/chrome-template.js";

export const CART_KEY = "mikado_v3_cart";

/* ---------- formatting ---------- */
export const euro = (n) =>
  n || n === 0
    ? new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)
    : "";

// Card / PDP price label. Returns "À partir de X €" when the product has a
// variant price range; otherwise the plain price. Falls back to p.price when
// priceMin/priceMax aren't on the object (older feeds / safety).
export const priceLabel = (p) => {
  const min = p?.priceMin ?? p?.price;
  const max = p?.priceMax ?? p?.price;
  if (min != null && max != null && max - min > 0.5) return `À partir de ${euro(min)}`;
  return euro(min);
};

export const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const slugify = (s) =>
  String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ---------- build SHA / cache busting ----------
   Vercel serves /images/* with `Cache-Control: immutable`, so a logo
   update is invisible to returning visitors until they clear their
   cache. We append the current build SHA to long-cached asset URLs:
   every deploy → new SHA → ?v= changes → browser refetches.
   buildShaReady() resolves once /api/build has answered (sub-5ms). */
let _buildSha = "";
const _buildShaPromise = fetch("/api/build", { cache: "no-store" })
  .then((r) => (r.ok ? r.json() : null))
  .then((d) => { _buildSha = (d && d.sha) || ""; })
  .catch(() => { _buildSha = ""; });
export const buildShaReady = () => _buildShaPromise;
export const versionedImg = (path) => {
  if (!_buildSha) return path;
  return path + (path.includes("?") ? "&" : "?") + "v=" + _buildSha;
};

/* ---------- cart (selection) ---------- */
// Cart items: { variantId, qty, handle, name, brand, price, image }
// Migration on read: legacy items missing qty → qty=1. Items with no variantId
// are filtered out (defensive — a bug in older builds could create them and
// they all collide under the empty-string key).
export function readCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((i) => i && i.variantId)
      .map((i) => ({ ...i, qty: Math.max(1, parseInt(i.qty) || 1) }));
  } catch { return []; }
}
function writeCart(items) {
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
   (POST /api/cart/preview). This is the SAME logic selection.html runs inline
   — extracted here so the cart drawer reuses it verbatim (debounced ~500ms,
   stale responses dropped via a sequence counter, silent network fallback).
   `onUpdate(preview|null)` fires with the payload, or null on empty cart /
   failure (→ caller keeps the client-side pre-discount subtotal). Returns
   `{ schedule }`. selection.html keeps its own copy for now (not modified
   here) and could be migrated to this helper in a follow-up. */
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

/* ---------- data ---------- */
export async function fetchProducts() {
  const r = await fetch("/api/products");
  if (!r.ok) throw new Error("products " + r.status);
  return r.json();
}
export async function fetchBrands() {
  const r = await fetch("/api/brands");
  if (!r.ok) throw new Error("brands " + r.status);
  return r.json();
}
export async function fetchCollections() {
  const r = await fetch("/api/collections");
  if (!r.ok) throw new Error("collections " + r.status);
  return r.json();
}
// Curated brand → Shopify collection-handle map, sourced from
// mega-menu-brands.json (the single source of truth for curated handles).
// Resolves to { slugify(name): handle }. Memoized so repeated callers (brand
// cards, PDP brand link/breadcrumb) share one fetch. Brands absent from the
// map have no curated collection — callers decide the fallback.
let _brandHandles = null;
export function loadBrandHandles() {
  if (!_brandHandles) {
    _brandHandles = fetch("/mega-menu-brands.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : { brands: [] }))
      .then((d) => {
        const map = {};
        for (const b of (d.brands || [])) {
          if (b && b.name && typeof b.href === "string") {
            map[slugify(b.name)] = b.href.replace(/^\/collections\//, "");
          }
        }
        return map;
      })
      .catch(() => ({}));
  }
  return _brandHandles;
}
// Fil d'Ariane (breadcrumb). `trail` = [{ label, href? }, …]; the LAST item is
// the current page (rendered without a link, aria-current). Emits schema.org
// BreadcrumbList microdata for SEO. Pure string helper: inject the result
// into a per-page placeholder — it is NOT rendered by
// initShell, because the crumb belongs between the header and the page H1,
// a region that lives in per-page markup.
export function breadcrumbHTML(trail) {
  if (!Array.isArray(trail) || trail.length === 0) return "";
  const items = trail.map((c, i) => {
    const isLast = i === trail.length - 1;
    const label = escapeHtml(c.label);
    const inner = (!isLast && c.href)
      ? `<a itemprop="item" href="${escapeHtml(c.href)}"><span itemprop="name">${label}</span></a>`
      : `<span itemprop="name"${isLast ? ' aria-current="page"' : ""}>${label}</span>`;
    return `<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">${inner}<meta itemprop="position" content="${i + 1}" /></li>`;
  }).join("");
  return `<nav class="breadcrumb" aria-label="Fil d'Ariane"><ol itemscope itemtype="https://schema.org/BreadcrumbList">${items}</ol></nav>`;
}

export async function fetchPromos() {
  const r = await fetch("/api/promos");
  if (!r.ok) throw new Error("promos " + r.status);
  return r.json();
}
// Fills the empty .pcard__promo slot on every card whose variantId is in
// the promos map. Cards show a short generic label ("Offre exclusive")
// and keep the full Shopify discount title in a tooltip; the PDP shows
// the full title in place.
export function applyPromos(promosMap) {
  if (!promosMap || typeof promosMap !== "object") return;
  document.querySelectorAll(".pcard").forEach((card) => {
    const slot = card.querySelector("[data-promo-slot]");
    const variantId = card.querySelector("[data-variant]")?.dataset.variant;
    if (!slot || !variantId) return;
    const title = promosMap[variantId];
    if (title) {
      slot.textContent = "Offre exclusive";
      slot.title = title;
      slot.hidden = false;
    } else {
      slot.hidden = true;
      slot.textContent = "";
      slot.removeAttribute("title");
    }
  });
}

/* ---------- product card (used by every grid) ---------- */
function cardLabel(variantId) {
  const n = cartQty(variantId);
  if (n === 0) return "+ Ajouter à la sélection";
  if (n === 1) return "Dans la sélection";
  return `Dans la sélection (${n})`;
}

// FR plurals — overrides for option names where the naive "+ s" rule misleads.
const VARIANT_PLURALS = {
  "Couleur": "finitions",
  "Coloris": "finitions",
  "Taille": "tailles",
  "Dimensions": "dimensions",
  "Structure": "structures",
  "Coussin": "coussins",
  "Patin": "patins",
  "Assise": "assises",
  "Essence bois": "essences de bois",
  "Couleur cadre": "finitions de cadre",
  "Modèle": "modèles",
  "Finition": "finitions",
  "Forme": "formes",
  "Geste": "gestes",
};
const pluralize = (name) => VARIANT_PLURALS[name] || (name.toLowerCase().endsWith("s") ? name.toLowerCase() : name.toLowerCase() + "s");

// "25 couleurs" · "3 tailles" · "120 variantes" — empty string when the product
// has a single variant or only one distinct value on its primary option.
function variantBadge(p) {
  const vs = Array.isArray(p?.variants) ? p.variants : [];
  if (vs.length < 2) return "";
  // primary option: the one with the most distinct values; ties → first option
  const tally = {};
  for (const v of vs) for (const o of (v.options || [])) {
    if (!o?.name) continue;
    tally[o.name] = tally[o.name] || new Set();
    tally[o.name].add(o.value);
  }
  const ranked = Object.entries(tally).sort((a, b) => b[1].size - a[1].size);
  if (!ranked.length) return `${vs.length} variantes`;
  const [name, values] = ranked[0];
  if (values.size < 2) return vs.length > 1 ? `${vs.length} variantes` : "";
  return `${values.size} ${pluralize(name)}`;
}

// Encodes the current listing view as a token (coll:<h> |
// designer:<x> | brand:<x>) so a product link carries the path the user
// actually took — read by the PDP to build a CONTEXTUAL breadcrumb. Derived
// from location at card-render time; "" = no context (homepage / bare
// catalogue / PDP related) → the PDP shows the neutral catalogue trail.
export function currentViewFrom() {
  const params = new URLSearchParams(location.search);
  const collMatch = location.pathname.match(/^\/collections\/(.+?)\/?$/);
  if (collMatch) {
    const h = decodeURIComponent(collMatch[1]);
    if (h && h !== "all") return "coll:" + h;
  }
  if (params.get("designer")) return "designer:" + params.get("designer");
  if (params.get("brand")) return "brand:" + params.get("brand");
  return "";
}

export function productCard(p) {
  // Prefer ?handle= so the PDP can hit /api/product/:handle directly
  // (no /api/products cap). Fall back to ?id= for products served from
  // a stale cache that doesn't carry .handle yet.
  const base = p.handle
    ? `/produit.html?handle=${encodeURIComponent(p.handle)}`
    : `/produit.html?id=${encodeURIComponent(p.id)}`;
  // Carry the current view so the PDP breadcrumb reflects the real path.
  const from = currentViewFrom();
  const href = from ? `${base}&from=${encodeURIComponent(from)}` : base;
  const alt = p.image2 && p.image2 !== p.image ? `<img class="alt" src="${p.image2}" alt="" loading="lazy" />` : "";
  const tag = p.badge === "nouveau" ? `<span class="tag">Nouveau</span>`
    : p.badge === "bestseller" ? `<span class="tag">Coup de cœur</span>`
    : p.badge === "limite" ? `<span class="tag">Édition limitée</span>` : "";
  return `
    <div class="pcard">
      <a class="pcard__media" href="${href}" aria-label="${escapeHtml(p.name)}">
        <div class="pcard__tags">${tag}</div>
        <span class="pcard__promo" data-promo-slot hidden></span>
        <img class="main" src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" />
        ${alt}
      </a>
      <div class="pcard__brand">${escapeHtml(p.brand || "")}</div>
      <div class="pcard__row">
        <a class="pcard__name" href="${href}">${escapeHtml(p.name)}</a>
        ${variantBadge(p) ? `<span class="pcard__variants">${variantBadge(p)}</span>` : ""}
      </div>
      ${p.inStock
        ? `<div class="pcard__avail"><span class="pcard__dot pcard__dot--stock" aria-hidden="true"></span>À voir en boutique</div>`
        : `<div class="pcard__avail"><span class="pcard__dot pcard__dot--order" aria-hidden="true"></span>${p.longDelay ? "Sur commande · délai sur demande" : "Livraison " + escapeHtml(p.leadTimeLabel || "3-4 semaines")}</div>`}
      <div class="pcard__price">${priceLabel(p)}</div>
      <button class="btn btn--outline btn--block pcard__cta" data-add
        data-variant="${escapeHtml(p.variantId)}" data-handle="${escapeHtml(p.id)}"
        data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand || "")}"
        data-price="${p.price || 0}" data-image="${escapeHtml(p.image || "")}">
        ${cardLabel(p.variantId)}
      </button>
    </div>`;
}

/* delegated add-to-cart for any [data-add] button.
   Cards behave as a toggle: click adds 1; clicking when already in cart removes
   the whole line (quantity is adjusted on the selection page or PDP). */
function bindAddToCart() {
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
  document.addEventListener("cart:change", () => {
    document.querySelectorAll("[data-add]").forEach((b) => {
      const v = b.dataset.variant;
      if (v) b.textContent = cardLabel(v);
    });
  });
}

/* ---------- bindings ---------- */
/* Body scroll-lock shared by the cart drawer and the mobile menu drawer.
   Single source of truth: same scrollbar-width compensation + the same
   `cartd-locked` body class for both. The two drawers are mutually
   exclusive (opening one closes the other), so they never fight the lock. */
function lockBodyScroll(on) {
  if (on) {
    const sw = window.innerWidth - document.documentElement.clientWidth;
    if (sw > 0) document.body.style.paddingRight = sw + "px";
    document.body.classList.add("cartd-locked");
  } else {
    document.body.classList.remove("cartd-locked");
    document.body.style.paddingRight = "";
  }
}

function bindDrawer() {
  const drawer = document.querySelector("[data-drawer]");
  const burger = document.querySelector("[data-burger]");
  if (!drawer || !burger) return;
  const isOpen = () => drawer.classList.contains("open");
  let lastFocus = null;

  // Piège de focus + Échap, même logique que le cart drawer.
  function onKeydown(e) {
    if (!isOpen()) return;
    if (e.key === "Escape") { e.preventDefault(); closeDrawer(false); return; }
    if (e.key !== "Tab") return;
    const list = [...drawer.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')]
      .filter((el) => el.offsetParent !== null && !el.disabled);
    if (!list.length) { e.preventDefault(); return; }
    const first = list[0], last = list[list.length - 1], a = document.activeElement;
    if (!drawer.contains(a)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  }

  function openDrawer() {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    drawer.classList.add("open");
    lockBodyScroll(true);
    burger.setAttribute("aria-expanded", "true");
    document.addEventListener("keydown", onKeydown, true);
    requestAnimationFrame(() => drawer.querySelector("[data-drawer-close]")?.focus());
    // Back button closes the drawer instead of leaving the page.
    history.pushState({ drawer: true }, "");
  }
  function closeDrawer(keepHistory) {
    if (!isOpen()) return;
    drawer.classList.remove("open");
    lockBodyScroll(false);
    burger.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onKeydown, true);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    else burger.focus();
    if (!keepHistory && history.state && history.state.drawer) history.back();
  }

  burger.addEventListener("click", openDrawer);
  document.querySelector("[data-drawer-close]")?.addEventListener("click", () => closeDrawer(false));
  drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => closeDrawer(true)));
  window.addEventListener("popstate", () => { if (isOpen()) closeDrawer(true); });
}

/* ---------- cart drawer (mini-cart) ----------
   Slides from the right on (1) cart-icon click and (2) cart:add. Lists the cart
   with live qty/remove, a client-side subtotal, and a link to /selection.html.
   Re-renders on cart:change but NEVER auto-opens on it (only cart:add + icon). */
function bindCartDrawer() {
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
  // → struck original + GRATUIT; partial discount → struck original + final;
  // else plain price. Uses the per-variant payload from the preview.
  const priceHTML = (i, qty) => {
    const lineSub = (i.price || 0) * qty;
    const pl = lastPreview?.lines?.find((l) => l.variantId === i.variantId);
    const d = pl?.discount || 0;
    if ((pl?.discountPct || 0) >= 99) return `<s class="cartd__was">${euro(lineSub)}</s><em class="cartd__free">GRATUIT</em>`;
    if (d > 0) return `<s class="cartd__was">${euro(lineSub)}</s><span class="cartd__price">${euro(lineSub - d)}</span>`;
    return `<span class="cartd__price">${euro(lineSub)}</span>`;
  };

  const lineHTML = (i, idx) => {
    const qty = Math.max(1, parseInt(i.qty) || 1);
    return `
      <div class="cartd__item">
        <img class="cartd__img" src="${escapeHtml(i.image || "")}" alt="" loading="lazy" />
        <div class="cartd__info">
          <div class="cartd__brand">${escapeHtml(i.brand || "")}</div>
          <div class="cartd__name">${escapeHtml(i.name || "")}</div>
          <div class="cartd__line">
            <div class="cartd__qty">
              <button class="cartd__qbtn" type="button" data-cartd-dec="${escapeHtml(i.variantId)}" aria-label="Diminuer la quantité">−</button>
              <span class="cartd__qval">${qty}</span>
              <button class="cartd__qbtn" type="button" data-cartd-inc="${escapeHtml(i.variantId)}" aria-label="Augmenter la quantité">+</button>
            </div>
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
    foot.innerHTML = `
      <div class="cartd__row"><span>Sous-total</span><span>${euro(subtotal)}</span></div>
      ${discounts.map((d) => `<div class="cartd__row cartd__row--discount"><span>Remise · ${escapeHtml(d.title)}</span><span>−${euro(d.amount)}</span></div>`).join("")}
      <div class="cartd__row cartd__row--total"><span>Total</span><span>${euro(total)}</span></div>
      ${discount > 0 ? `<div class="cartd__savings">Vous économisez ${euro(discount)}</div>` : ""}
      <p class="cartd__note">Remises et livraison calculées au panier</p>
      <a class="btn btn--blue btn--block cartd__cta" href="/selection.html">Ma sélection →</a>
      <button type="button" class="cartd__continue" data-cartd-continue>← Continuer mes achats</button>`;
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
  const preview = createCartPreview((data) => { lastPreview = data; if (isOpen()) render(); });

  // ── open triggers ──
  cartLink?.addEventListener("click", (e) => { e.preventDefault(); open(); }); // href kept as no-JS fallback
  document.addEventListener("cart:add", open);
  document.querySelector("[data-burger]")?.addEventListener("click", close);   // opening mobile menu closes the cart

  // ── close triggers ──
  root.querySelector("[data-cartd-close]")?.addEventListener("click", close);
  root.querySelector("[data-cartd-backdrop]")?.addEventListener("click", close);

  // ── live refresh (never auto-open) — re-render + re-fetch discounts while open ──
  document.addEventListener("cart:change", () => { if (isOpen()) { render(); preview.schedule(); } });

  // ── "← Continuer mes achats" closes (foot is re-rendered, so delegate) ──
  foot.addEventListener("click", (e) => { if (e.target.closest("[data-cartd-continue]")) close(); });

  // ── qty +/- via setCartQty (NOT addToCart), remove via index ──
  body.addEventListener("click", (e) => {
    const dec = e.target.closest("[data-cartd-dec]");
    const inc = e.target.closest("[data-cartd-inc]");
    const rem = e.target.closest("[data-cartd-remove]");
    if (dec) setCartQty(dec.dataset.cartdDec, cartQty(dec.dataset.cartdDec) - 1);
    else if (inc) setCartQty(inc.dataset.cartdInc, cartQty(inc.dataset.cartdInc) + 1);
    else if (rem) removeFromCartAt(parseInt(rem.dataset.cartdRemove, 10));
  });

  render(); // seed content so an icon-click before any add shows the current cart
}

export function bindReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  els.forEach((e) => io.observe(e));
}
function bindChrome(transparent) {
  const chrome = document.querySelector("[data-chrome]");
  if (!chrome) return;
  // Pose l'état initial du header (solid si le scroll est restauré au refresh)
  // SANS transition, puis réactive les transitions au 2e frame → plus de fondu
  // du filet `--line` au 1er paint, mais scroll/hover restent fluides.
  chrome.classList.add("chrome--noanim");
  const reanim = () => requestAnimationFrame(() =>
    requestAnimationFrame(() => chrome.classList.remove("chrome--noanim")));
  if (!transparent) { chrome.classList.add("chrome--solid"); reanim(); return; }
  const hero = document.querySelector(".hero, .subhero, .rdv-hero");
  if (!hero) { chrome.classList.add("chrome--solid"); reanim(); return; }
  const onScroll = () => chrome.classList.toggle("chrome--solid", window.scrollY > hero.offsetHeight - chrome.offsetHeight - 8);
  onScroll();
  reanim();
  window.addEventListener("scroll", onScroll, { passive: true });
}
function bindNewsletter() {
  const form = document.querySelector("[data-newsletter]");
  if (!form) return;
  const status = form.querySelector("[data-news-status]");
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = form.querySelector("input[name=email]");
    const email = (input.value || "").trim();
    if (!isEmail(email)) { status.textContent = "Indiquez un e-mail valide."; status.className = "footer__news-status is-error"; return; }
    const btn = form.querySelector("button");
    btn.disabled = true; const label = btn.textContent; btn.textContent = "…";
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      if (res.status === 429) throw new Error("rate_limit");
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "server");
      input.style.display = "none"; btn.style.display = "none";
      status.textContent = "Merci, vous êtes inscrit·e."; status.className = "footer__news-status is-ok";
    } catch (e2) {
      status.textContent = e2.message === "rate_limit" ? "Trop de tentatives. Patientez quelques minutes." : "L'inscription a échoué. Réessayez.";
      status.className = "footer__news-status is-error";
      btn.disabled = false; btn.textContent = label; console.warn(e2);
    }
  });
}
function bindAnnounce() {
  const host = document.querySelector("[data-announce]");
  if (!host) return;
  const items = [...host.querySelectorAll("span")];
  if (items.length < 2) return;
  // WCAG 2.2.2 : si l'utilisateur préfère moins d'animation → pas de défilement ;
  // sinon défile mais se met en PAUSE au survol/focus de la barre.
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let i = 0, timer = null;
  const start = () => { if (!timer) timer = setInterval(() => { items[i].classList.remove("on"); i = (i + 1) % items.length; items[i].classList.add("on"); }, 4000); };
  const stop = () => { clearInterval(timer); timer = null; };
  host.addEventListener("mouseenter", stop);
  host.addEventListener("mouseleave", start);
  host.addEventListener("focusin", stop);
  host.addEventListener("focusout", start);
  start();
}

/* ---------- entry ---------- */
function ensureMegaMenuCss() {
  if (document.querySelector('link[href="/mega-menu.css"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/mega-menu.css";
  document.head.appendChild(link);
}

/* Vercel Web Analytics — mesure d'audience SANS cookie (pas de bandeau de
   consentement requis, la politique cookies reste inchangée). Chargé une seule
   fois pour TOUT le site depuis initShell, point d'injection unique du chrome
   (toutes les pages l'appellent, dont l'accueil via main.js et les articles
   pré-rendus). Snippet officiel Vercel « HTML / autre framework » : on amorce la
   file window.va puis on charge le script de mesure en defer. Tant que Web
   Analytics n'est pas activé sur le projet (dashboard Vercel), /_vercel/insights
   répond 404 et le tag reste inoffensif. */
function ensureVercelAnalytics() {
  if (window.__vaInjected) return;
  window.__vaInjected = true;
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  const s = document.createElement("script");
  s.defer = true;
  s.src = "/_vercel/insights/script.js";
  document.head.appendChild(s);
}

/* Pose aria-current="page" + .is-active sur le lien de nav correspondant à
   `active` (libellé), et le retire des autres. Idempotent. Le SSR rend le chrome
   avec active="" (aucun lien marqué) ; le client (qui connaît le bon `active`
   via l'appel de chaque page) pose le surlignage ici. */
function setActiveNav(active) {
  document.querySelectorAll(".nav__primary .nlink").forEach((a) => {
    const on = !!active && a.textContent.trim() === active;
    a.classList.toggle("is-active", on);
    if (on) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

export function initShell({ active = "", transparentNav = false } = {}) {
  // Garde d'idempotence : initShell ne doit jamais binder deux fois (sinon
  // double rotation d'annonce, double submit newsletter, double scroll handler).
  if (document.body.dataset.shellReady) return;
  document.body.dataset.shellReady = "1";
  ensureVercelAnalytics();
  const h = document.getElementById("site-header");
  const f = document.getElementById("site-footer");
  ensureMegaMenuCss();
  // SSR : si le chrome est déjà rendu (header non vide), HYDRATER sans réécrire
  // (réécrire = re-flash). Sinon (page non-SSR / repli), injecter comme avant.
  if (h && !h.firstElementChild) h.innerHTML = chromeHTML(active);
  if (f && !f.firstElementChild) f.innerHTML = footerHTML();
  // Pose l'état actif (aria-current / is-active) quel que soit le chemin. Idempotent.
  setActiveNav(active);
  if (!transparentNav) document.body.classList.add("has-topnav");
  bindDrawer();
  bindCartDrawer();
  bindChrome(transparentNav);
  bindAnnounce();
  bindNewsletter();
  bindAddToCart();
  syncBadge();
  document.addEventListener("cart:change", syncBadge);
  bindReveal();
  // Hydrate mega menu + dropdown async (fetches /api/menu).
  // Top-level is already in the DOM; only sub-items wait on this.
  import("/mega-menu.js").then(({ initMegaMenu }) => initMegaMenu()).catch((e) => console.warn("[shell] mega-menu init failed:", e.message));
}
