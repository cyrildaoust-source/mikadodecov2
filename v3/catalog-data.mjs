/* ---------- données du catalogue + fil d'Ariane + promotions ---------- */
import { createNavigation, breadcrumbHTML, breadcrumbData, returnLinkHTML } from "./navigation.mjs";
import { siteData } from "./site-data.mjs";
import { isSaleActive } from "./sale.mjs";
import { isGiftProductHandle } from "./gift-rules.mjs";

export async function fetchProducts() {
  const r = await fetch("/api/products");
  if (!r.ok) throw new Error("products " + r.status);
  return r.json();
}
export async function fetchBrands() {
  if (siteData("brands")) return siteData("brands");
  const r = await fetch("/api/brands");
  if (!r.ok) throw new Error("brands " + r.status);
  return r.json();
}
export async function fetchCollections() {
  const r = await fetch("/api/collections");
  if (!r.ok) throw new Error("collections " + r.status);
  return r.json();
}
// Même registre et même rendu que le serveur ; aucun appel Shopify pour le fil.
let navigationPromise;
export function loadNavigation() {
  return navigationPromise ||= Promise.all(['/navigation-data.json', '/mega-menu-brands.json', '/designers-data.json'].map(async path => {
    if (path === '/mega-menu-brands.json' && siteData('brandsFile')) return siteData('brandsFile');
    const response = await fetch(path, { cache: 'no-cache' });
    if (!response.ok) throw new Error('Navigation indisponible');
    return response.json();
  })).then(([data, curated, designers]) => createNavigation(data, curated.brands, designers.designers));
}
// N'écrit que si le contenu change : le fil rendu par le serveur reste en place (pas de flash).
function setHTMLIfChanged(el, html) {
  const next = document.createElement('template');
  next.innerHTML = html;
  if (el.innerHTML !== next.innerHTML) el.innerHTML = html;
}
export function paintBreadcrumb(trail, source = '') {
  const slot = document.querySelector('[data-breadcrumb]');
  if (slot) setHTMLIfChanged(slot, breadcrumbHTML(trail));
  const back = document.querySelector('[data-selection-return]');
  if (back) setHTMLIfChanged(back, returnLinkHTML(source));
  let schema = document.getElementById('navigation-breadcrumb');
  if (!schema) {
    schema = document.createElement('script');
    schema.type = 'application/ld+json'; schema.id = 'navigation-breadcrumb';
    document.head.appendChild(schema);
  }
  const current = location.pathname === '/produit.html'
    ? '/produit.html?handle=' + encodeURIComponent(new URLSearchParams(location.search).get('handle') || '')
    : location.pathname + location.search;
  const data = JSON.stringify(breadcrumbData(trail, current));
  if (schema.textContent !== data) schema.textContent = data;
}

export async function fetchPromos() {
  if (siteData("promos")) return siteData("promos");
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
