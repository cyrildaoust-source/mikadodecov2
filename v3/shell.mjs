/* ============================================================
   Mikado Deco v3 · coquille commune (shell)
   Importée par chaque page : hydrate le chrome rendu par le serveur (annonce,
   nav, tiroir mobile, pied de page), branche le tiroir panier, la recherche,
   la newsletter, les images de repli, et charge le méga menu à la demande.
   Le panier, les cartes, les données et l'offre cadeau vivent dans leurs
   modules (cart.mjs, product-grid.mjs, catalog-data.mjs, gift-offer.mjs).
   ============================================================ */
import { chromeHTML, footerHTML } from "./chrome-template.js";
import { listingTrail } from "./navigation.mjs";
import { syncBadge } from "./cart.mjs";
import { bindCartDrawer } from "./cart-drawer.mjs";
import { bindAddToCart, syncProductLinks } from "./product-grid.mjs";
import { loadNavigation, paintBreadcrumb } from "./catalog-data.mjs";
import { isSaleActive } from "./sale.mjs";
import { lockBodyScroll } from "./scroll-lock.mjs";
import { bindNewsletter } from "./newsletter.mjs";
import { ensureVercelAnalytics } from "./analytics.mjs";

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

function bindSearch() {
  let drawer, pending;
  async function open(event) {
    const button = event.currentTarget;
    if (pending) return;
    button.setAttribute('aria-busy', 'true');
    try {
      pending = drawer ? Promise.resolve(drawer) : import('./search-drawer.mjs').then(({createSearchDrawer}) => (drawer = createSearchDrawer()));
      const ready = await pending;
      ready?.open();
    } catch (error) {
      // Keep the native GET form usable even if the suggestions module fails.
      document.body.classList.add('search-locked');
      document.querySelector('[data-search-input]')?.focus();
      const close = () => {
        document.body.classList.remove('search-locked');
        button.focus();
      };
      document.querySelector('[data-search-field] [data-search-close]')?.addEventListener('click', close, {once: true});
      document.querySelector('[data-search-input]')?.addEventListener('keydown', function escape(event) {
        if (event.key === 'Escape') { close(); this.removeEventListener('keydown', escape); }
      });
    } finally {
      pending = null;
      button.removeAttribute('aria-busy');
    }
  }
  document.querySelectorAll('[data-search-open]').forEach(button => button.addEventListener('click', open));
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
  const hero = document.querySelector(".hero, .subhero, .rdv-hero, .fam-hero");
  if (!hero) { chrome.classList.add("chrome--solid"); reanim(); return; }
  const onScroll = () => chrome.classList.toggle("chrome--solid", !!document.querySelector('[data-catalogue-continuation]') || window.scrollY > hero.offsetHeight - chrome.offsetHeight - 8);
  onScroll();
  reanim();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("catalogue:layout", onScroll);
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

/* Images de repli sans onerror inline (interdit par la CSP sans 'unsafe-inline').
   Une image porte data-fallback="remove|text|brand-name|brand-wordmark|hero" ; l'événement
   error ne remonte pas, on l'écoute en capture sur le document. Les images déjà en échec
   avant ce bind ont été mises en file par le script d'en-tête (window.__imgErrors). */
const IMAGE_FALLBACKS = {
  remove: (img) => img.remove(),
  text: (img) => img.replaceWith(document.createTextNode(img.alt)),
  "brand-name": (img) => { const s = document.createElement("span"); s.className = "brandcard__name"; s.textContent = img.alt; img.replaceWith(s); },
  "brand-wordmark": (img) => { const s = document.createElement("span"); s.className = "brandmarquee__name"; s.textContent = img.alt; img.replaceWith(s); },
  hero: (img) => { const src = img.parentNode && img.parentNode.querySelector("source"); if (src) src.remove(); img.src = "/images/produits-hero.jpg"; img.style.objectPosition = "center 70%"; },
};
export function applyImageFallback(img) {
  const fn = img && IMAGE_FALLBACKS[img.dataset.fallback];
  if (!fn || img.dataset.fallbackDone) return;
  img.dataset.fallbackDone = "1";
  fn(img);
}
function bindImageFallbacks() {
  document.addEventListener("error", (e) => { const t = e.target; if (t && t.tagName === "IMG" && t.dataset.fallback) applyImageFallback(t); }, true);
  const queued = Array.isArray(window.__imgErrors) ? window.__imgErrors : [];
  queued.forEach(applyImageFallback);
  window.__imgErrors = { push: applyImageFallback };   // le script d'en-tête continue d'appeler push : traitement direct
}

export function initShell({ active = "", transparentNav = false } = {}) {
  // Garde d'idempotence : initShell ne doit jamais binder deux fois (sinon
  // double rotation d'annonce, double submit newsletter, double scroll handler).
  if (document.body.dataset.shellReady) return;
  document.body.dataset.shellReady = "1";
  ensureVercelAnalytics();
  const h = document.getElementById("site-header");
  const f = document.getElementById("site-footer");
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
  bindImageFallbacks();
  // Les familles possèdent un hero dédié ; leur fil est placé juste après.
  if (document.querySelector('[data-family], .fam-rich')) {
    loadNavigation().then(nav => paintBreadcrumb(listingTrail(new URL(location.href), nav))).catch(console.warn);
  }
  document.addEventListener('click', e => {
    const link = e.target.closest('.pcard a[href*="/produit.html?"]');
    if (link) {
      syncProductLinks(link.closest('.pcard'));
      const source = new URL(link.href).searchParams.get('returnTo');
      if (source) try { sessionStorage.setItem('mikado-selection-position', JSON.stringify({ source, top: window.scrollY })); } catch {}
    }
  }, true);
  syncBadge();
  document.addEventListener("cart:change", syncBadge);
  // Hydrate mega menu + dropdown async (fetches /api/menu).
  // Top-level is already in the DOM; only sub-items wait on this.
  import("./mega-menu.js").then(({ initMegaMenu }) => initMegaMenu()).catch((e) => console.warn("[shell] mega-menu init failed:", e.message));
}
