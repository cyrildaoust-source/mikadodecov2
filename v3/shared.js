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

export const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const slugify = (s) =>
  String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ---------- cart (selection) ---------- */
export function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}
function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  document.dispatchEvent(new CustomEvent("cart:change"));
}
export function inCart(variantId) { return readCart().some((i) => i.variantId === variantId); }
export function addToCart(item) {
  const cart = readCart();
  if (!cart.some((i) => i.variantId === item.variantId)) { cart.push(item); writeCart(cart); }
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
export function cartCount() { return readCart().length; }
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
const HEART = `<svg class="pcard__heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M12 20s-7-4.6-9.3-8.4C1 8.7 2.3 5.5 5.4 5.5c2 0 3.2 1.3 3.9 2.4.7-1.1 1.9-2.4 3.9-2.4 3.1 0 4.4 3.2 2.7 6.1C19 15.4 12 20 12 20z"/></svg>`;

export function productCard(p) {
  const href = `/produit.html?id=${encodeURIComponent(p.id)}`;
  const alt = p.image2 && p.image2 !== p.image ? `<img class="alt" src="${p.image2}" alt="" loading="lazy" />` : "";
  const tag = p.badge === "nouveau" ? `<span class="tag">Nouveau</span>`
    : p.badge === "bestseller" ? `<span class="tag">Coup de cœur</span>`
    : p.badge === "limite" ? `<span class="tag">Édition limitée</span>` : "";
  const added = inCart(p.variantId);
  return `
    <div class="pcard">
      <a class="pcard__media" href="${href}" aria-label="${escapeHtml(p.name)}">
        <div class="pcard__tags">${tag}</div>
        ${HEART}
        <img class="main" src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" />
        ${alt}
      </a>
      <div class="pcard__brand">${escapeHtml(p.brand || "")}</div>
      <a class="pcard__name" href="${href}">${escapeHtml(p.name)}</a>
      <div class="pcard__price">${euro(p.price)}</div>
      <button class="btn btn--outline btn--block pcard__cta" data-add
        data-variant="${escapeHtml(p.variantId)}" data-handle="${escapeHtml(p.id)}"
        data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand || "")}"
        data-price="${p.price || 0}" data-image="${escapeHtml(p.image || "")}">
        ${added ? "Dans la sélection" : "+ Ajouter à la sélection"}
      </button>
    </div>`;
}

/* delegated add-to-cart for any [data-add] button */
function bindAddToCart() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    e.preventDefault();
    const v = btn.dataset.variant;
    if (inCart(v)) { removeFromCart(v); btn.textContent = "+ Ajouter à la sélection"; }
    else {
      addToCart({ handle: btn.dataset.handle, variantId: v, name: btn.dataset.name, brand: btn.dataset.brand, price: parseFloat(btn.dataset.price) || 0, image: btn.dataset.image });
      btn.textContent = "Dans la sélection";
    }
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
