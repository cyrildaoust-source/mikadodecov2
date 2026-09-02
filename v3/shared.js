/* ============================================================
   Mikado Deco v3 · shared shell + cart + helpers
   Imported by every page. Injects the chrome (announce + nav +
   drawer) and footer so they stay in sync, wires the selection
   cart (localStorage), and exposes formatting + card helpers.
   ============================================================ */

import { chromeHTML, footerHTML } from "/chrome-template.js";

export const CART_KEY = "mikado_v3_cart";

// ── Soldes d'été 2026 (Europe/Brussels) — garder les dates EN SYNC avec
//    l'inline-script du bandeau dans chrome-template.js.
export const SALE = {
  startMs: Date.parse("2026-07-04T00:00:00+02:00"),
  endMs:   Date.parse("2026-08-01T00:00:00+02:00"),   // fin = 1er août 00:00 (exclu)
  tiers: [[300, 5], [800, 10], [1500, 15], [3000, 20]], // [seuil €, %] CROISSANT (remise au niveau commande)
};
export function isSaleActive() {
  const n = Date.now();
  return n >= SALE.startMs && n < SALE.endMs;
}
// Palier suivant à atteindre selon le sous-total (null si palier max déjà atteint).
export function saleNextTier(subtotal) {
  for (const [min, pct] of SALE.tiers) if (subtotal < min) return { min, pct, gap: min - subtotal };
  return null;
}

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
  const was = p?.compareAt;
  if (was != null && min != null && was - min > 0.5) return `<span class="price-was">${euro(was)}</span><span class="price-now price-now--sale">${euro(min)}</span>`;
  if (min != null && max != null && max - min > 0.5) return `À partir de ${euro(min)}`;
  return euro(min);
};

export const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const slugify = (s) =>
  String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ø/g, "o").replace(/æ/g, "ae").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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

/* ══════════ OFFRE CADEAU « Mois Verner Panton » (01→30/09/2026) ══════════
   Le front n'applique AUCUNE remise : les remises automatiques Shopify (BXGY)
   mettent les cadeaux à 0 € au checkout. Le module fait 3 choses : informer
   (barre de progression), ajouter les cadeaux (lignes marquées gift), et tenir
   la cohérence (retrait en redescente en gardant le 1er choisi, vérification
   du 0 € RÉEL via /api/cart/preview — si la remise ne s'applique pas, on
   retire le cadeau plutôt que laisser payer un article « offert »).
   ⚠️ Le minimum Shopify porte sur la collection « Hors promotions » (tout le
   catalogue MOINS les tags promo/promotion/sale/promo-siege-ete-2026) et
   EXCLUT les produits cadeaux (constaté par paniers-tests du 01/09) : la
   barre se calcule sur la somme des lignes éligibles (preview.lines[].eligible,
   repli local « tout éligible »), hors produits cadeaux, aux prix catalogue.
   Paliers = DONNÉES : la machine à états fonctionne pour N paliers.
   Jamais d'ajout automatique — le choix appartient au client. */
export const GIFT_OFFER = {
  id: "panton",
  startsAt: "2026-09-01T19:35:00+02:00",
  endsAt:   "2026-09-30T23:59:59+02:00",
  tiers: [ { threshold: 900, gifts: 1 }, { threshold: 1800, gifts: 2 } ],
  gifts: [ { handle: "lampe-de-table-flowerpot-vp9" }, { handle: "tabouret-wire-vp11-acier" } ],
};
const GIFT_HANDLES = new Set(GIFT_OFFER.gifts.map((g) => g.handle));
export const isGiftProductHandle = (h) => GIFT_HANDLES.has(String(h || ""));
export function giftActive(now = Date.now()) {
  return now >= Date.parse(GIFT_OFFER.startsAt) && now <= Date.parse(GIFT_OFFER.endsAt);
}
/* Fiches cadeaux (nom/prix/image/variantes) chargées depuis /api/product —
   source unique de vérité. Un cadeau sans variante disponible est écarté ;
   les deux écartés → module entièrement masqué (ne jamais promettre un
   cadeau qui n'existe pas). */
let _giftMeta = null, _giftMetaStarted = false;
function loadGiftMeta() {
  if (_giftMetaStarted) return; _giftMetaStarted = true;
  Promise.all(GIFT_OFFER.gifts.map(async (g) => {
    try {
      const r = await fetch(`/api/product/${encodeURIComponent(g.handle)}`);
      if (!r.ok) return null;
      const p = await r.json();
      // Seules les variantes EN STOCK sont offertes (pas de cadeau en backorder).
      const variants = (p.variants || [])
        .filter((v) => v && v.id && v.available !== false && (v.qty || 0) > 0)
        .map((v) => ({ id: v.id, title: v.title || "" , qty: v.qty }));
      if (!variants.length) return null;
      return { handle: g.handle, name: p.name || g.handle, brand: p.brand || "", price: p.priceMin || 0, image: p.image || "", variants };
    } catch (e) { return null; }
  })).then((metas) => {
    _giftMeta = metas.filter(Boolean);
    document.dispatchEvent(new CustomEvent("gift:meta"));
  });
}
const _giftMsg = { text: "", at: 0 };
function setGiftMsg(text) { _giftMsg.text = text; _giftMsg.at = Date.now(); }
/* Lignes cadeau : seules celles AJOUTÉES PAR LE MODULE (flag gift) sont
   retirables par lui. Une VP9/VP11 ajoutée normalement depuis sa fiche n'est
   JAMAIS retirée — mais compte comme « pièce prise » (Shopify la mettra à
   0 €) et reste exclue du montant éligible (comportement Shopify constaté). */
const flaggedGiftLines = (cart) => cart.filter((i) => i.gift === GIFT_OFFER.id).sort((a, b) => (a.giftOrder || 0) - (b.giftOrder || 0));
const takenGiftLines   = (cart) => cart.filter((i) => i.gift === GIFT_OFFER.id || GIFT_HANDLES.has(i.handle));
export function giftContext(preview) {
  const cart = readCart();
  const pl = preview && Array.isArray(preview.lines) ? preview.lines : null;
  let sum = 0;
  for (const i of cart) {
    if (i.gift === GIFT_OFFER.id || GIFT_HANDLES.has(i.handle)) continue;
    const p = pl ? pl.find((l) => l.variantId === i.variantId) : null;
    if (p && p.eligible === false) continue;
    sum += (i.price || 0) * (i.qty || 1);
  }
  const reached = GIFT_OFFER.tiers.filter((t) => sum >= t.threshold);
  const allowance = reached.length ? reached[reached.length - 1].gifts : 0;
  const nextTier = GIFT_OFFER.tiers.find((t) => sum < t.threshold) || null;
  return { cart, sum, allowance, nextTier, taken: takenGiftLines(cart), flagged: flaggedGiftLines(cart) };
}
let _giftReconciling = false;
export function giftReconcile(preview) {
  if (_giftReconciling || !giftActive()) return;
  _giftReconciling = true;
  try {
    const { cart, allowance, taken, flagged } = giftContext(preview);
    for (const g of flagged) if ((g.qty || 1) !== 1) setCartQty(g.variantId, 1);
    // Redescente sous un palier : retirer les cadeaux en trop (les derniers
    // choisis), garder le premier. Message neutre, jamais de reproche.
    const slots = Math.max(0, allowance - (taken.length - flagged.length));
    if (flagged.length > slots) {
      flagged.slice(slots).forEach((g) => removeFromCart(g.variantId));
      setGiftMsg(allowance >= 1
        ? `Votre panier est repassé sous ${euro(GIFT_OFFER.tiers[1].threshold)} — le second cadeau a été retiré.`
        : `Votre panier est repassé sous ${euro(GIFT_OFFER.tiers[0].threshold)} — le cadeau a été retiré.`);
      return;
    }
    // Vérification du 0 € RÉEL — uniquement sur un preview FRAIS (mêmes
    // variantes que le panier). Si Shopify n'a pas mis un cadeau marqué à 0 €
    // (remises désactivées ?), on le retire et on le dit honnêtement.
    if (preview && Array.isArray(preview.lines) && flagged.length) {
      const cartIds = new Set(cart.map((i) => i.variantId));
      const prevIds = new Set(preview.lines.map((l) => l.variantId));
      const fresh = cartIds.size === prevIds.size && [...cartIds].every((id) => prevIds.has(id));
      if (fresh) {
        const notFree = flagged.filter((g) => {
          const p = preview.lines.find((l) => l.variantId === g.variantId);
          return p && p.subtotal > 0 && (p.discountPct || 0) < 99;
        });
        if (notFree.length) {
          notFree.forEach((g) => removeFromCart(g.variantId));
          // Une remise concurrente (ex. 5+1 chaises) a gagné l'arbitrage : guider
          // vers l'ajout des deux pièces plutôt qu'un message d'erreur sec.
          const competing = (preview.discounts || []).length > 0;
          const hadAll = flagged.length >= Math.min(2, (_giftMeta || []).length || 2);
          setGiftMsg(competing
            ? (hadAll || allowance < 2
              ? "Votre panier bénéficie déjà d'une offre plus avantageuse — les cadeaux Panton ne se cumulent pas avec elle."
              : "Une autre offre s'applique déjà à votre panier — ajoutez les deux pièces ensemble pour activer vos cadeaux.")
            : "L'offre n'a pas pu être appliquée — le cadeau a été retiré. Écrivez-nous si le souci persiste.");
        }
      }
    }
  } finally { _giftReconciling = false; }
}
export function giftOfferHTML(preview) {
  if (!giftActive()) return "";
  loadGiftMeta();
  if (!_giftMeta || !_giftMeta.length) return "";
  const { cart, sum, allowance, nextTier, taken, flagged } = giftContext(preview);
  if (!cart.length) return "";
  const msg = _giftMsg.text && (Date.now() - _giftMsg.at < 8000)
    ? `<p class="gifto__msg">${escapeHtml(_giftMsg.text)}</p>` : "";
  const takenHandles = new Set(taken.map((i) => i.handle));
  const bar = (target) => {
    const gap = Math.max(0, Math.ceil(target - sum));
    const pct = Math.max(0, Math.min(100, (sum / target) * 100));
    return { gap, html: `<div class="gifto__bar" role="progressbar" aria-label="Progression vers votre cadeau" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${Math.min(Math.round(sum), target)}"><span class="gifto__fill" style="width:${pct}%"></span></div>` };
  };
  const tile = (m, opts = {}) => {
    const locked = !!opts.locked;
    const sel = m.variants.length > 1 && !locked
      ? `<select class="gifto__sel" data-gift-variant="${escapeHtml(m.handle)}" aria-label="Coloris — ${escapeHtml(m.name)}">${m.variants.map((v) => `<option value="${escapeHtml(v.id)}">${escapeHtml(v.title || m.name)}</option>`).join("")}</select>` : "";
    return `<div class="gifto__tile${locked ? " is-locked" : ""}"${locked ? ' aria-disabled="true"' : ""}>
        <img class="gifto__img" src="${escapeHtml(m.image || "")}" alt="" loading="lazy" />
        <div class="gifto__tinfo">
          <span class="gifto__tname">${escapeHtml(m.name)}</span>
          <span class="gifto__tvalue">Valeur ${euro(m.price)}</span>
          ${sel}
          ${locked ? "" : `<button type="button" class="gifto__btn" data-gift-add="${escapeHtml(m.handle)}">${escapeHtml(opts.cta || "Choisir")}</button>`}
        </div>
      </div>`;
  };
  let body = "";
  // Remise concurrente (ex. 5+1 ×2) déjà supérieure à la valeur des DEUX cadeaux :
  // les ajouter perdrait l'arbitrage Shopify (une seule remise s'applique, la
  // meilleure). On l'explique au lieu de tendre un piège. (taken===0 : dès qu'un
  // cadeau est pris, les remises du preview incluent celle des cadeaux.)
  const competingAmt = (preview && Array.isArray(preview.discounts))
    ? preview.discounts.reduce((s, d) => s + (d.amount || 0), 0) : 0;
  const giftsValue = _giftMeta.reduce((s, m) => s + (m.price || 0), 0);
  if (allowance > 0 && taken.length === 0 && competingAmt >= giftsValue) {
    body = `<p class="gifto__lead">Votre panier bénéficie déjà d'une offre plus avantageuse (−${euro(competingAmt)}). Les cadeaux Panton ne se cumulent pas avec elle.</p>`;
  } else if (allowance === 0) {                                             // État 1 — le plus fréquent
    const b = bar(GIFT_OFFER.tiers[0].threshold);
    body = `<p class="gifto__lead">Plus que <strong>${euro(b.gap)}</strong> et vous choisissez votre cadeau Panton</p>${b.html}
      <div class="gifto__tiles">${_giftMeta.map((m) => tile(m, { locked: true })).join("")}</div>`;
  } else if (taken.length === 0) {                                   // État 2 — débloqué, rien de choisi
    if (allowance >= 2 && _giftMeta.length >= 2) {
      // Droit aux deux d'emblée → ajout GROUPÉ mis en avant. Indispensable quand
      // une remise concurrente (5+1 chaises) est en lice : un SEUL cadeau au panier
      // perd l'arbitrage Shopify (il resterait payant) ; les DEUX ensemble gagnent.
      body = `<p class="gifto__lead">Vous avez droit aux <strong>deux pièces</strong> — ajoutez-les</p>
      <div class="gifto__tiles">${_giftMeta.map((m) => tile(m, { cta: "Ajouter" })).join("")}</div>
      <button type="button" class="gifto__btn gifto__btn--all" data-gift-add-all>Ajouter les deux pièces</button>`;
    } else {
      body = `<p class="gifto__lead">Votre cadeau est débloqué — <strong>choisissez votre pièce</strong></p>
      <div class="gifto__tiles">${_giftMeta.map((m) => tile(m)).join("")}</div>`;
    }
  } else if (allowance >= 2 && taken.length === 1) {                 // État 4 — droit aux deux
    const other = _giftMeta.find((m) => !takenHandles.has(m.handle));
    body = other
      ? `<p class="gifto__lead">Vous avez droit aux deux — ajoutez ${escapeHtml(other.name)}</p><div class="gifto__tiles gifto__tiles--one">${tile(other, { cta: "Ajouter" })}</div>`
      : `<p class="gifto__lead">Votre cadeau Panton est dans le panier.</p>`;
  } else if (nextTier) {                                             // État 3 — 1 pris, cap sur le palier 2
    const chosen = _giftMeta.find((m) => takenHandles.has(m.handle));
    const b = bar(nextTier.threshold);
    const chg = flagged.length ? ` · <button type="button" class="gifto__link" data-gift-change>Changer de cadeau</button>` : "";
    body = `<p class="gifto__lead">${chosen ? escapeHtml(chosen.name) + (/lampe/i.test(chosen.name || "") ? " offerte" : " offert") : "Cadeau ajouté"}${chg}</p>
      <p class="gifto__lead">Plus que <strong>${euro(b.gap)}</strong> et la seconde pièce est offerte aussi</p>${b.html}`;
  } else {                                                            // État 5 — tout est pris
    body = `<p class="gifto__lead">Vos deux cadeaux Panton sont dans le panier.</p>`;
  }
  return `<section class="gifto" aria-label="Offre cadeau du Mois Verner Panton">
      <p class="gifto__eyebrow">Mois Verner Panton · jusqu'au 30 septembre</p>
      <div aria-live="polite">${msg}${body}</div>
    </section>`;
}
let _giftBound = false;
export function giftBind() {
  if (_giftBound) return; _giftBound = true;
  loadGiftMeta();
  // Cohérence même sans preview : à chaque changement de panier, contrôle
  // local (la somme locale majore la somme éligible → jamais de sur-retrait).
  document.addEventListener("cart:change", () => giftReconcile(null));
  document.addEventListener("click", (e) => {
    const addAll = e.target.closest("[data-gift-add-all]");
    if (addAll) {
      // Ajout GROUPÉ en UNE écriture → un seul arbitrage Shopify, pas d'état
      // intermédiaire perdant face au 5+1.
      addAll.disabled = true;
      const cart = readCart();
      let n = 0;
      for (const m of (_giftMeta || [])) {
        const sel = document.querySelector(`[data-gift-variant="${m.handle}"]`);
        const variantId = (sel && sel.value) || m.variants[0].id;
        if (!cart.some((i) => i.variantId === variantId && i.gift === GIFT_OFFER.id)) {
          cart.push({ variantId, handle: m.handle, name: m.name, brand: m.brand, price: m.price, image: m.image, qty: 1, gift: GIFT_OFFER.id, giftOrder: Date.now() + n++ });
        }
      }
      if (n) writeCart(cart);
      return;
    }
    const add = e.target.closest("[data-gift-add]");
    if (add) {
      const m = (_giftMeta || []).find((x) => x.handle === add.getAttribute("data-gift-add"));
      if (!m) return;
      const sel = add.closest(".gifto__tile")?.querySelector("[data-gift-variant]");
      const variantId = (sel && sel.value) || m.variants[0].id;
      const cart = readCart();
      if (cart.some((i) => i.variantId === variantId && i.gift === GIFT_OFFER.id)) return;
      add.disabled = true;                       // anti double-clic (le re-render suit)
      cart.push({ variantId, handle: m.handle, name: m.name, brand: m.brand, price: m.price, image: m.image, qty: 1, gift: GIFT_OFFER.id, giftOrder: Date.now() });
      writeCart(cart);
      return;
    }
    if (e.target.closest("[data-gift-change]")) {
      const fl = flaggedGiftLines(readCart());
      if (fl.length) removeFromCart(fl[0].variantId);   // retour à l'état « choisissez »
    }
  });
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
// the promos map. Cards show the REAL discount title (the admin title —
// keep those short and client-facing); the PDP shows it in place too.
export function applyPromos(promosMap) {
  if (isSaleActive()) return;          // ← soldes : pas de badge par produit (remise = niveau commande)
  if (!promosMap || typeof promosMap !== "object") return;
  document.querySelectorAll(".pcard").forEach((card) => {
    const slot = card.querySelector("[data-promo-slot]");
    const variantId = card.querySelector("[data-variant]")?.dataset.variant;
    if (!slot || !variantId) return;
    // Pas de badge sur les produits CADEAU : l'offre vit dans le module panier,
    // et le titre complet plaqué sur le packshot dessert la carte.
    const href = card.querySelector(".pcard__media")?.getAttribute("href") || "";
    const hm = href.match(/[?&]handle=([^&"]+)/);
    if (hm && isGiftProductHandle(decodeURIComponent(hm[1]))) { slot.hidden = true; slot.textContent = ""; return; }
    const title = promosMap[variantId];
    if (title) {
      slot.textContent = title;
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
        ${p.compareAt && (p.priceMin ?? p.price) && p.compareAt - (p.priceMin ?? p.price) > 0.5 ? `<span class="pcard__sale">−${Math.round((p.compareAt - (p.priceMin ?? p.price)) / p.compareAt * 100)}%</span>` : ""}
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
    return `
      <div class="cartd__item">
        <img class="cartd__img" src="${escapeHtml(i.image || "")}" alt="" loading="lazy" />
        <div class="cartd__info">
          <div class="cartd__brand">${escapeHtml(i.brand || "")}</div>
          <div class="cartd__name">${escapeHtml(i.name || "")}</div>
          <div class="cartd__line">
            ${i.gift ? `<span class="cartd__giftchip">Cadeau</span>` : `<div class="cartd__qty">
              <button class="cartd__qbtn" type="button" data-cartd-dec="${escapeHtml(i.variantId)}" aria-label="Diminuer la quantité">−</button>
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
      <p class="cartd__note">${discount > 0 ? "Remise appliquée automatiquement · " : ""}Livraison offerte dès 1 500 €</p>
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
function bindSearch() {
  const root = document.querySelector("[data-search]");
  if (!root) return;
  // Le champ vit désormais DANS la barre de nav (pas dans l'overlay) → document.
  const input = document.querySelector("[data-search-input]");
  const results = root.querySelector("[data-search-results]");
  const suggest = root.querySelector("[data-search-suggest]");
  let lastFocus = null, timer = null, lastTerm = "", featLoaded = false;
  const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
  const pdpHref = (p) => p.handle ? `/produit.html?handle=${encodeURIComponent(p.handle)}` : `/produit.html?id=${encodeURIComponent(p.id)}`;
  const row = (p) => `<a class="sr__row" href="${pdpHref(p)}"><img class="sr__thumb" src="${escapeHtml(p.image || "")}" alt="" loading="lazy" /><span class="sr__info"><span class="sr__brand">${escapeHtml(p.brand || "")}</span><span class="sr__name">${escapeHtml(p.name || "")}</span></span><span class="sr__price">${priceLabel(p)}</span></a>`;
  // Liens marque « curés » (mega-menu-brands.json, même schéma que marques.html) :
  // clé = nom en minuscules → href /collections/<handle>. Repli ?brand=<slug> si
  // absent. hrefByName persiste (bindSearch appelé une seule fois) → chargé 1×.
  // Promesse MÉMOÏSÉE (même patron que loadBrandHandles) : tout appelant qui
  // `await loadBrandHrefs()` attend la MÊME promesse → hrefByName est garanti
  // rempli avant de peindre les chips (pas de course sur un flag booléen qui
  // résout avant la fin du fetch). Repli ?brand= si le JSON échoue.
  let hrefByName = {}, _brandHrefsP = null;
  const loadBrandHrefs = () => {
    if (!_brandHrefsP) {
      _brandHrefsP = fetch("/mega-menu-brands.json", { cache: "no-cache" })
        .then((r) => r.json())
        .then((j) => { for (const b of (j.brands || [])) if (b.name && b.href) hrefByName[b.name.toLowerCase()] = b.href; })
        .catch(() => { /* repli ?brand= */ });
    }
    return _brandHrefsP;
  };
  const brandHref = (b) => hrefByName[(b.name || "").toLowerCase()] || `/produits.html?brand=${encodeURIComponent(b.slug)}`;
  const catHref   = (c) => `/collections/${encodeURIComponent(c.handle)}`;
  // Belle saison (avril→sept) = extérieur ; sinon intérieur. Le tag EST la saison →
  // la clé de cache serveur (getProductsPage, keyée par tags) se régénère seule.
  const seasonTag = () => { const m = new Date().getMonth() + 1; return (m >= 4 && m <= 9) ? "exterieur" : "interieur"; };
  const chip  = (label, href) => `<a class="sr__chip" href="${href}">${escapeHtml(label)}</a>`;
  const grp   = (lab, inner) => inner ? `<div class="sr__grp"><div class="sr__lab">${lab}</div>${inner}</div>` : "";
  const chips = (arr, href) => arr?.length ? `<div class="sr__chips">${arr.map((x) => chip(x.name, href(x))).join("")}</div>` : "";
  const showSuggest = () => { if (suggest) suggest.hidden = false; if (results) { results.hidden = true; results.innerHTML = ""; } };
  const showResults = () => { if (suggest) suggest.hidden = true; if (results) results.hidden = false; };
  // État vide : produits de saison (data-search-feat) + marques populaires
  // (data-search-brands). Gardes de présence : .innerHTML sur un slot absent
  // relançait un re-fetch en boucle (featLoaded jamais posé).
  const loadFeat = async () => {
    const featSlot   = root.querySelector("[data-search-feat]");
    const brandsSlot = root.querySelector("[data-search-brands]");
    if (featLoaded || !featSlot || !brandsSlot) return;
    featLoaded = true;
    try {
      // loadBrandHrefs() dans le Promise.all → hrefByName rempli AVANT de peindre
      // les chips (chips marque curées, pas de repli ?brand= dû à une course).
      const [, feat, brands] = await Promise.all([
        loadBrandHrefs(),
        fetch(`/api/products?paginated=1&limit=4&tags=${seasonTag()}`).then((r) => r.json()),
        fetch("/api/brands").then((r) => r.json()),
      ]);
      // « Populaires » = plus gros catalogues d'abord (productCount desc, champ
      // exposé par /api/brands) → le label ne montre plus les 6 premières A→Z.
      const brandList = (Array.isArray(brands) ? brands : [])
        .slice().sort((a, b) => (b.productCount || 0) - (a.productCount || 0)).slice(0, 6);
      featSlot.innerHTML   = (Array.isArray(feat.items) ? feat.items : []).map(row).join("");
      brandsSlot.innerHTML = `<div class="sr__chips">${brandList.map((b) => chip(b.name, brandHref(b))).join("")}</div>`;
    } catch (e) { featLoaded = false; }
  };
  function open() {
    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add("search-locked");   // le header bascule en mode recherche
    showSuggest(); loadBrandHrefs(); loadFeat();
    // On mesure APRÈS le reflow (bandeau masqué, champ inline affiché) pour que le
    // panneau de résultats descende pile sous la barre de nav.
    requestAnimationFrame(() => {
      const nav = document.querySelector(".nav__inner");
      const top = nav ? nav.getBoundingClientRect().bottom : 68;
      root.style.setProperty("--search-top", top + "px");
      if (input) input.focus();
    });
    document.addEventListener("keydown", onKey, true);
  }
  function close() {
    root.hidden = true;
    document.body.classList.remove("search-locked");   // le menu se remet
    document.removeEventListener("keydown", onKey, true);
    if (input) { input.value = ""; lastTerm = ""; }
    showSuggest();
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  const gotoResults = () => { const t = input.value.trim(); if (t) location.href = `/produits.html?q=${encodeURIComponent(t)}`; };
  const render = (term, d) => {
    if (!(d.products?.length || d.brands?.length || d.categories?.length)) {
      results.innerHTML = `<p class="searchd__empty">Aucun résultat pour « ${escapeHtml(term)} ».</p>`; return;
    }
    // À 1 caractère, le signal utile = les COLLECTIONS (marques + catégories) ; les
    // produits sont trop bruités → on n'en montre que 2 max. Dès 2 car., tout.
    const prods = term.length <= 1 ? (d.products || []).slice(0, 2) : (d.products || []);
    results.innerHTML =
        grp("Marques",    chips(d.brands, brandHref))
      + grp("Catégories", chips(d.categories, catHref))
      + grp("Produits",   prods.map(row).join(""))
      + `<a class="sr__all" href="/produits.html?q=${encodeURIComponent(term)}">Voir tous les résultats pour « ${escapeHtml(term)} » →</a>`;
  };
  const run = async (term) => {
    try {
      const d = await fetch(`/api/predictive?q=${encodeURIComponent(term)}`).then((r) => r.json());
      if (input.value.trim() !== term) return;   // garde de course conservée
      render(term, d);
    } catch (e) { /* silencieux */ }
  };
  if (input) {
    input.addEventListener("input", () => {
      const term = input.value.trim();
      clearTimeout(timer);
      if (term.length < 1) { showSuggest(); lastTerm = ""; return; }
      if (term === lastTerm) return;
      lastTerm = term;
      showResults();
      results.innerHTML = `<p class="searchd__hint">Recherche…</p>`;
      timer = setTimeout(() => run(term), 220);
    });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); gotoResults(); } });
  }
  document.querySelectorAll("[data-search-open]").forEach((b) => b.addEventListener("click", open));
  // La croix vit dans le header (hors overlay) + le backdrop dans l'overlay → document.
  document.querySelectorAll("[data-search-close]").forEach((b) => b.addEventListener("click", close));
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
  // Hors période de soldes : retire les messages soldes (data-sale) et ré-ancre l'affichage
  // sur le 1er message restant → la barre revient d'elle-même à la normale après le 1er août.
  if (!isSaleActive()) {
    host.querySelectorAll("span[data-sale]").forEach((s) => s.remove());
    [...host.querySelectorAll("span")].forEach((s, idx) => s.classList.toggle("on", idx === 0));
  }
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
  bindSearch();
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
