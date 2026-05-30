/* ============================================================
   Mikadodeco v3 · shared shell + cart + helpers
   Imported by every page. Injects the chrome (announce + nav +
   drawer) and footer so they stay in sync, wires the selection
   cart (localStorage), and exposes formatting + card helpers.
   ============================================================ */

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
/* ---------- promo été 2026 (4ème chaise offerte) ---------- */
// Centralized so every consumer (PLP bandeau, PDP bandeau, cart message)
// uses the same dates and tag names. Update here when the next promo lands.
export const PROMO_ETE_2026 = {
  start: new Date("2026-05-26T00:00:00+02:00"),
  end:   new Date("2026-06-06T23:59:59+02:00"),
  tagOutdoor: "promo-ete-2026",          // 590 outdoor products (vitrine)
  tagSiege:   "promo-siege-ete-2026",    // 89 sieges éligibles à la BXGY
  collOutdoor:"mobilier-exterieur",
  collPromo:  "promo-4eme-chaise-offerte",
};
export const isPromoEteActive = () => {
  const now = new Date();
  return now >= PROMO_ETE_2026.start && now <= PROMO_ETE_2026.end;
};
// Hero bandeau used on the outdoor PLP and on eligible PDPs. Variants:
//   "plp"  → full bandeau with CTA (top of /collections/mobilier-exterieur)
//   "pdp"  → compact bandeau (just under the PDP gallery)
export function promoBandeauHTML(variant = "plp") {
  const cta = `<a class="promo-bandeau__cta" href="/collections/${PROMO_ETE_2026.collPromo}">Voir la sélection chaises en promo →</a>`;
  const intro = variant === "pdp"
    ? `<p class="promo-bandeau__body">Du <strong>26 mai au 6 juin</strong>, achetez 3 chaises d'extérieur, la 4<sup>ème</sup> est offerte. Automatiquement, sans code.</p>`
    : `<p class="promo-bandeau__body">Du <strong>26 mai au 6 juin</strong>, achetez 3 chaises d'extérieur, la 4<sup>ème</sup> est offerte. Automatiquement, sans code.<br><span class="promo-bandeau__brands">Fermob · HAY · Vitra · &amp;Tradition · Fatboy</span></p>`;
  return `
    <aside class="promo-bandeau promo-bandeau--${escapeHtml(variant)}">
      <div class="promo-bandeau__inner">
        <span class="promo-bandeau__eyebrow">Offre été 2026</span>
        <h2 class="promo-bandeau__title">L'été commence à votre table.</h2>
        ${intro}
        ${variant === "plp" ? cta : ""}
      </div>
    </aside>`;
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

export function productCard(p) {
  // Prefer ?handle= so the PDP can hit /api/product/:handle directly
  // (no /api/products cap). Fall back to ?id= for products served from
  // a stale cache that doesn't carry .handle yet.
  const href = p.handle
    ? `/produit.html?handle=${encodeURIComponent(p.handle)}`
    : `/produit.html?id=${encodeURIComponent(p.id)}`;
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

/* ---------- chrome + footer markup ----------
   NAV_TOP is the top-level fallback that renders immediately. Mega
   menu sub-items + Marques dropdown contents are hydrated async by
   /mega-menu.js from /api/menu (Shopify-driven). If the fetch fails,
   the top-level still navigates (clicks land on the corresponding
   collection page). */
const NAV_TOP = [
  { label: "Mobilier",      href: "/collections/all",         kind: "mega",     key: "mobilier" },
  { label: "Marques",       href: "/collections",             kind: "dropdown", key: "marques"  },
  { label: "Promotions",    href: "/collections/promotions",  kind: "promo" },
  { label: "Mikado Studio", href: "/studio.html",             kind: "link"  },
  { label: "Le journal",    href: "/journal.html",            kind: "link"  },
];

function chromeHTML(active) {
  const links = NAV_TOP.map((n) => {
    const isActive = active === n.label;
    const cls = ["nlink", isActive ? "is-active" : "", n.kind === "promo" ? "nlink--promo" : ""].filter(Boolean).join(" ");
    const extra = (n.kind === "mega" || n.kind === "dropdown")
      ? ` data-mm-trigger="${n.key}" aria-haspopup="true" aria-expanded="false"`
      : "";
    return `<a href="${n.href}" class="${cls}"${extra}>${n.label}</a>`;
  }).join("");

  // Mega panel stage — single off-flow container, hidden by default.
  // Hydrated by /mega-menu.js after the chrome is in the DOM.
  const stage = `
    <div class="mm-stage" data-mm-stage>
      <div class="mm-stage__inner">
        <div class="mm-panel" data-mm-panel="mobilier"></div>
        <div class="mm-panel" data-mm-panel="marques"></div>
      </div>
    </div>`;

  // Mobile drawer — accordion sections for Mobilier/Marques, then
  // flat links for Promotions / Studio / Le journal, plus a footer
  // visual block hydrated from mega-menu-config.json.
  const drawerHTML = `
    <div class="drawer" data-drawer>
      <div class="drawer__head">
        <span class="drawer__title">Menu</span>
        <button class="drawer__close" data-drawer-close aria-label="Fermer">&times;</button>
      </div>
      <div class="drawer__body">
        <div class="drawer__group" data-open="false" data-drawer-group="mobilier">
          <button type="button" class="drawer__group-head" aria-expanded="false">Mobilier <span class="drawer__chev" aria-hidden="true">▾</span></button>
          <ul class="drawer__sub" data-drawer-sub="mobilier"></ul>
        </div>
        <div class="drawer__group" data-open="false" data-drawer-group="marques">
          <button type="button" class="drawer__group-head" aria-expanded="false">Marques <span class="drawer__chev" aria-hidden="true">▾</span></button>
          <ul class="drawer__sub" data-drawer-sub="marques"></ul>
        </div>
        <a class="drawer__link drawer__link--promo" href="/collections/promotions">Promotions</a>
        <a class="drawer__link" href="/studio.html">Mikado Studio</a>
        <a class="drawer__link" href="/journal.html">Le journal</a>
        <a class="drawer__link drawer__link--util" href="/rendez-vous.html">Rendez-vous</a>
        <a class="drawer__link drawer__link--util" href="/selection.html">Sélection</a>
      </div>
      <footer class="drawer__foot" data-drawer-foot></footer>
    </div>`;

  // Cart drawer (mini-cart) — slides from the right, above everything. Body +
  // foot are (re)rendered by bindCartDrawer() from readCart(); the skeleton just
  // holds the slots. Present on every page (injected with the shell).
  const cartDrawerHTML = `
    <div class="cartd" data-cart-drawer>
      <div class="cartd__backdrop" data-cartd-backdrop></div>
      <aside class="cartd__panel" role="dialog" aria-modal="true" aria-label="Mon panier" data-cartd-panel>
        <header class="cartd__head">
          <h2 class="cartd__title" data-cartd-title>Mon panier</h2>
          <button class="cartd__close" data-cartd-close type="button" aria-label="Fermer le panier">&times;</button>
        </header>
        <div class="cartd__body" data-cartd-body></div>
        <footer class="cartd__foot" data-cartd-foot hidden></footer>
      </aside>
    </div>`;

  return `
  <div class="chrome" data-chrome>
    <div class="announce" data-announce>
      <span class="on">Boutique de design à Uccle · du mardi au samedi</span>
      <span>Mobilier de design, choisi pièce par pièce</span>
      <span>Livraison partout en Belgique</span>
      <span>Mikado Studio · le conseil en aménagement</span>
    </div>
    <div class="nav__inner">
      <div class="nav__left">
        <a href="/" class="wordmark" aria-label="mikadodeco"><img src="/logomikado.svg" alt="mikadodeco" /></a>
        <nav class="nav__primary">${links}</nav>
      </div>
      <div class="nav__right">
        <a href="/rendez-vous.html" class="nav__util nav__util-extra">Rendez-vous</a>
        <a href="/selection.html" class="nav__cart" aria-label="Ma sélection">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" width="22" height="22" aria-hidden="true">
            <path d="M6.46 8.2 4.55 19.2a.25.25 0 0 0 .25.3h14.4a.25.25 0 0 0 .25-.3L17.54 8.2a.25.25 0 0 0-.25-.2H6.71a.25.25 0 0 0-.25.2Z" stroke-linejoin="round"/>
            <path d="M9.5 11V4.75a.25.25 0 0 1 .25-.25h4.5a.25.25 0 0 1 .25.25V11"/>
          </svg>
          <span class="cartcount" data-cart-count>0</span>
        </a>
        <button class="nav__burger" data-burger aria-label="Menu">Menu</button>
      </div>
    </div>
    ${stage}
  </div>
  ${drawerHTML}
  ${cartDrawerHTML}`;
}

function footerHTML() {
  return `
  <footer class="footer">
    <div class="wrap">
      <div class="footer__lockbar">
        <span class="lockup-lg">Mikadodeco · Boutique de design · Uccle, Bruxelles</span>
        <svg class="seal" viewBox="0 0 120 120" role="img" aria-label="Mikadodeco, Bruxelles, depuis 2011">
          <defs><path id="seal-arc" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" /></defs>
          <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" stroke-width="1" />
          <circle cx="60" cy="60" r="40" fill="none" stroke="currentColor" stroke-width="1" />
          <text font-family="'neue-haas-grotesk-display', sans-serif" font-size="8.4" letter-spacing="2.4" fill="currentColor"><textPath href="#seal-arc" startOffset="0">· MIKADODECO · MOBILIER DE DESIGN · BRUXELLES </textPath></text>
          <text x="60" y="67" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-weight="600" font-size="20" fill="currentColor">Uccle</text>
        </svg>
      </div>
      <div class="footer__grid">
        <div class="footer__news">
          <h4 class="serif">Restons en contact</h4>
          <p>Recevez nos nouveautés, nos coups de cœur et les rendez-vous de la boutique.</p>
          <form class="footer__form" data-newsletter novalidate>
            <input type="email" name="email" placeholder="Votre adresse e-mail" aria-label="E-mail" required />
            <button class="btn btn--solid btn--block" type="submit">S'inscrire</button>
            <p class="footer__news-status" data-news-status></p>
          </form>
        </div>
        <div><h5>Boutique</h5><ul>
          <li><a href="/produits.html">Mobilier</a></li>
          <li><a href="/produits.html?cat=luminaires">Luminaires</a></li>
          <li><a href="/produits.html?cat=objets">Objets</a></li>
          <li><a href="/collections/mobilier-exterieur">Extérieur</a></li>
        </ul></div>
        <div><h5>Maison</h5><ul>
          <li><a href="/marques.html">Les marques</a></li>
          <li><a href="/materiaux.html">Les matières</a></li>
          <li><a href="/journal.html">Le journal</a></li>
          <li><a href="/rendez-vous.html">Rendez-vous</a></li>
        </ul></div>
        <div><h5>Contact</h5><ul>
          <li><a href="mailto:shop@mikadodeco.be">shop@mikadodeco.be</a></li>
          <li><a href="/contact.html">Nous écrire</a></li>
          <li><a href="https://maps.google.com/?q=75+Rue+du+Doyenné+1180+Uccle" target="_blank" rel="noopener">75 Rue du Doyenné, Uccle</a></li>
        </ul></div>
      </div>
      <div class="footer__bottom">
        <nav>
          <a href="/contact.html">Conditions</a>
          <a href="/contact.html">Confidentialité</a>
          <span>&copy; 2026 Mikadodeco</span>
        </nav>
        <div class="pay"><span>Visa</span><span>Mastercard</span><span>Bancontact</span><span>PayPal</span></div>
      </div>
    </div>
  </footer>`;
}

/* ---------- bindings ---------- */
function bindDrawer() {
  const drawer = document.querySelector("[data-drawer]");
  const open = document.querySelector("[data-burger]");
  if (!drawer || !open) return;
  open.addEventListener("click", () => drawer.classList.add("open"));
  document.querySelector("[data-drawer-close]")?.addEventListener("click", () => drawer.classList.remove("open"));
  drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => drawer.classList.remove("open")));
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
  let lastFocus  = null;
  const isOpen   = () => root.classList.contains("open");

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
            <span class="cartd__price">${euro((i.price || 0) * qty)}</span>
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
    const subtotal = cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
    foot.hidden = false;
    foot.innerHTML = `
      <div class="cartd__subtotal"><span>Sous-total</span><span>${euro(subtotal)}</span></div>
      <p class="cartd__note">Remises et livraison calculées au panier</p>
      <a class="btn btn--solid btn--block cartd__cta" href="/selection.html">Aller au panier →</a>`;
  }

  function lockScroll(on) {
    if (on) {
      const sw = window.innerWidth - document.documentElement.clientWidth;
      if (sw > 0) document.body.style.paddingRight = sw + "px";
      document.body.classList.add("cartd-locked");
    } else {
      document.body.classList.remove("cartd-locked");
      document.body.style.paddingRight = "";
    }
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
    if (isOpen()) { render(); return; }          // already open → just refresh, no re-animate
    lastFocus = document.activeElement;
    document.querySelector("[data-drawer]")?.classList.remove("open"); // close mobile menu
    render();
    root.classList.add("open");
    lockScroll(true);
    document.addEventListener("keydown", onKeydown, true);
    requestAnimationFrame(() => root.querySelector("[data-cartd-close]")?.focus());
  }

  function close() {
    if (!isOpen()) return;
    root.classList.remove("open");
    lockScroll(false);
    document.removeEventListener("keydown", onKeydown, true);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    else cartLink?.focus();
  }

  // ── open triggers ──
  cartLink?.addEventListener("click", (e) => { e.preventDefault(); open(); }); // href kept as no-JS fallback
  document.addEventListener("cart:add", open);
  document.querySelector("[data-burger]")?.addEventListener("click", close);   // opening mobile menu closes the cart

  // ── close triggers ──
  root.querySelector("[data-cartd-close]")?.addEventListener("click", close);
  root.querySelector("[data-cartd-backdrop]")?.addEventListener("click", close);

  // ── live refresh (never auto-open) ──
  document.addEventListener("cart:change", () => { if (isOpen()) render(); });

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
  if (!transparent) { chrome.classList.add("chrome--solid"); return; }
  const hero = document.querySelector(".hero, .subhero, .rdv-hero");
  if (!hero) { chrome.classList.add("chrome--solid"); return; }
  const onScroll = () => chrome.classList.toggle("chrome--solid", window.scrollY > hero.offsetHeight - chrome.offsetHeight - 8);
  onScroll();
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
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "server");
      form.querySelector("input").style.display = "none"; btn.style.display = "none";
      status.textContent = "Merci, vous êtes inscrit·e."; status.className = "footer__news-status is-ok";
    } catch (e2) {
      status.textContent = "L'inscription a échoué. Réessayez."; status.className = "footer__news-status is-error";
      btn.disabled = false; btn.textContent = label; console.warn(e2);
    }
  });
}
function bindAnnounce() {
  const host = document.querySelector("[data-announce]");
  if (!host) return;
  const items = [...host.querySelectorAll("span")];
  if (items.length < 2) return;
  let i = 0;
  setInterval(() => { items[i].classList.remove("on"); i = (i + 1) % items.length; items[i].classList.add("on"); }, 4000);
}

/* ---------- entry ---------- */
function ensureMegaMenuCss() {
  if (document.querySelector('link[href="/mega-menu.css"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/mega-menu.css";
  document.head.appendChild(link);
}

export function initShell({ active = "", transparentNav = false } = {}) {
  const h = document.getElementById("site-header");
  const f = document.getElementById("site-footer");
  ensureMegaMenuCss();
  if (h) h.innerHTML = chromeHTML(active);
  if (f) f.innerHTML = footerHTML();
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
