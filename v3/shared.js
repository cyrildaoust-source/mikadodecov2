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
  const href = `/produit.html?id=${encodeURIComponent(p.id)}`;
  const alt = p.image2 && p.image2 !== p.image ? `<img class="alt" src="${p.image2}" alt="" loading="lazy" />` : "";
  const tag = p.badge === "nouveau" ? `<span class="tag">Nouveau</span>`
    : p.badge === "bestseller" ? `<span class="tag">Coup de cœur</span>`
    : p.badge === "limite" ? `<span class="tag">Édition limitée</span>` : "";
  return `
    <div class="pcard">
      <a class="pcard__media" href="${href}" aria-label="${escapeHtml(p.name)}">
        <div class="pcard__tags">${tag}</div>
        <img class="main" src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" />
        ${alt}
      </a>
      <div class="pcard__brand">${escapeHtml(p.brand || "")}</div>
      <div class="pcard__row">
        <a class="pcard__name" href="${href}">${escapeHtml(p.name)}</a>
        ${variantBadge(p) ? `<span class="pcard__variants">${variantBadge(p)}</span>` : ""}
      </div>
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

/* ---------- chrome + footer markup ---------- */
const NAV = [
  { label: "Mobilier", href: "/produits.html" },
  { label: "Marques", href: "/marques.html" },
  { label: "Mikado Studio", href: "/studio.html" },
  { label: "Le journal", href: "/journal.html" },
];

function chromeHTML(active) {
  const links = NAV.map((n) => `<a href="${n.href}" class="nlink${active === n.label ? " is-active" : ""}">${n.label}</a>`).join("");
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
      </div>
      <div class="nav__rightwrap">
        <nav class="nav__center">${links}</nav>
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
    </div>
  </div>
  <div class="drawer" data-drawer>
    <button class="drawer__close" data-drawer-close aria-label="Fermer">&times;</button>
    ${NAV.map((n) => `<a href="${n.href}">${n.label}</a>`).join("")}
    <a href="/selection.html">Sélection</a>
    <a href="/rendez-vous.html">Rendez-vous</a>
  </div>`;
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
          <li><a href="/produits.html?cat=exterieur">Extérieur</a></li>
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
export function initShell({ active = "", transparentNav = false } = {}) {
  const h = document.getElementById("site-header");
  const f = document.getElementById("site-footer");
  if (h) h.innerHTML = chromeHTML(active);
  if (f) f.innerHTML = footerHTML();
  if (!transparentNav) document.body.classList.add("has-topnav");
  bindDrawer();
  bindChrome(transparentNav);
  bindAnnounce();
  bindNewsletter();
  bindAddToCart();
  syncBadge();
  document.addEventListener("cart:change", syncBadge);
  bindReveal();
}
