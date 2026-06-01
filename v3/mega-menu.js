/* ============================================================
   Mikadodeco · Mega menu controller (V2.1)
   - Mobilier  : Shopify-driven (menu(handle:"main-menu"))
   - Marques   : fully hardcoded from /mega-menu-brands.json
                 (15 brands + featured collections + flat designer list)
   - Side panel "Coup de cœur" from /mega-menu-config.json (restored)
   Top-level NAV labels/hrefs live in shared.js as the fallback so
   the chrome renders instantly with no flash.
   ============================================================ */

import { escapeHtml, slugify } from "/shared.js";

const OPEN_DELAY  = 100;
const CLOSE_DELAY = 200;

let config     = null;   // mega-menu-config.json (side panel)
let brandsData = null;   // mega-menu-brands.json (Marques hardcode)
let menu       = null;   // /api/menu (Mobilier only)
let stageEl    = null;

const TOP = { mobilier: null };

// --- public ---------------------------------------------------

export async function initMegaMenu() {
  stageEl = document.querySelector("[data-mm-stage]");
  if (!stageEl) return;
  try {
    const [menuRes, cfgRes, brandsRes] = await Promise.all([
      fetch("/api/menu",                  { cache: "no-store"    }).then((r) => r.json()).catch(() => ({ ok: false, items: [] })),
      fetch("/mega-menu-config.json",     { cache: "force-cache" }).then((r) => r.json()).catch(() => ({})),
      fetch("/mega-menu-brands.json",     { cache: "force-cache" }).then((r) => r.json()).catch(() => ({ brands: [], designers: [] })),
    ]);
    menu       = menuRes;
    config     = cfgRes      || {};
    brandsData = brandsRes   || { brands: [], designers: [] };
    indexTopItems(menu.items || []);
    hydrateMobilier();
    hydrateMarques();
    hydrateDesigners();
    hydrateDrawer();
    bindHover();
    bindKeyboard();
    bindFocus();
    bindDrawerAccordions();
  } catch (e) {
    console.warn("[mega-menu] init failed:", e.message);
  }
}

function indexTopItems(items) {
  for (const it of items) {
    const key = (it.title || "").trim().toLowerCase();
    if (key === "mobilier") TOP.mobilier = it;
  }
}

// --- shared side panel render ---------------------------------

// Editorial side panel (.mm-side) shared as-is by all three megas: the
// "Coup de cœur" (Mobilier/Marques) and the "Designer du mois" (Designers)
// are the SAME visual component — only the data differs.
function sideHTML({ label, image, imageAlt, title, lead, ctaHref, ctaLabel, imgOnError }) {
  if (!image) return "";
  const onerr = imgOnError ? ` onerror="this.remove()"` : "";
  return `
    <aside class="mm-side">
      <div class="mm-side__label">${escapeHtml(label || "")}</div>
      <div class="mm-side__rule" aria-hidden="true"></div>
      <img class="mm-side__visual" src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt || "")}" loading="lazy"${onerr} />
      ${title ? `<div class="mm-side__title">${escapeHtml(title)}</div>` : ""}
      ${lead  ? `<p class="mm-side__lead">${escapeHtml(lead)}</p>` : ""}
      ${ctaHref ? `<a class="mm-side__cta" href="${escapeHtml(ctaHref)}">${escapeHtml(ctaLabel || "")} →</a>` : ""}
    </aside>`;
}

function coupDeCoeurHTML(megaKey) {
  const cdc = config?.[megaKey]?.coupDeCoeur;
  if (!cdc || !cdc.image) return "";
  return sideHTML({
    label: cdc.label || "Coup de cœur du moment",
    image: cdc.image,
    imageAlt: cdc.imageAlt || "",
    title: cdc.title,
    lead: cdc.lead,
    ctaHref: cdc.ctaHref,
    ctaLabel: cdc.ctaLabel || "Lire l'article",
  });
}

// --- Mobilier mega (Shopify-driven, unchanged) ----------------

function hydrateMobilier() {
  const panel = stageEl.querySelector('[data-mm-panel="mobilier"]');
  if (!panel) return;
  const top = TOP.mobilier;
  if (!top || !top.items?.length) { panel.innerHTML = ""; return; }
  const colsHtml = top.items.map((cat) => {
    const subs = (cat.items || []).map((sub) =>
      `<li><a href="${escapeHtml(sub.url)}">${escapeHtml(sub.title)}</a></li>`
    ).join("");
    return `
      <div class="mm-col">
        <a class="mm-col__head" href="${escapeHtml(cat.url)}">${escapeHtml(cat.title)}</a>
        <ul class="mm-col__list">${subs}</ul>
      </div>`;
  }).join("");
  panel.innerHTML = `
    <div class="mm-mega mm-mega--mobilier">
      <div class="mm-mega__cols">${colsHtml}</div>
      ${coupDeCoeurHTML("mobilier")}
    </div>`;
}

// --- Marques mega (V2.1: fully hardcoded) ---------------------

function hydrateMarques() {
  const panel = stageEl.querySelector('[data-mm-panel="marques"]');
  if (!panel) return;
  const brands = brandsData?.brands || [];
  if (!brands.length) { panel.innerHTML = ""; return; }

  // V2.2: featured sub-collections retired from the rendered mega
  // (kept in the JSON for future revival). Brand cards now hold just
  // the brand name → collection page.
  const brandCards = brands.map((b) => `
      <div class="mm-brand">
        <a class="mm-brand__name" href="${escapeHtml(b.href)}">${escapeHtml(b.name)}</a>
      </div>`).join("");

  // Same shell as Mobilier/Designers: navigable content left, editorial
  // .mm-side right. Designers now live only in their own mega (removed here).
  panel.innerHTML = `
    <div class="mm-mega mm-mega--marques">
      <div class="mm-marques__col">
        <div class="mm-col__head">Nos marques</div>
        <div class="mm-brands-grid">${brandCards}</div>
        <a class="mm-marques__all" href="/marques.html">Toutes les marques →</a>
      </div>
      ${coupDeCoeurHTML("marques")}
    </div>`;
}

// --- Designers mega · À la une (left) + "Designer du mois" .mm-side
//     (right). Same shell/structure as Mobilier & Marques. -------------

function hydrateDesigners() {
  const panel = stageEl.querySelector('[data-mm-panel="designers"]');
  if (!panel) return;
  const designers = brandsData?.designers || [];
  const duMois    = config?.designers?.duMois;
  // Nothing to show → leave empty so open() skips it; the top-level
  // "Designers" trigger still navigates to /designers.html (graceful).
  if (!designers.length && !duMois) { panel.innerHTML = ""; return; }

  // À la une — the curated flat list (the same one the Marques mega used
  // to hold), 2 columns, one click to each designer's filtered PLP.
  const desHtml = designers.map((d) =>
    `<a href="/produits.html?designer=${slugify(d)}">${escapeHtml(d)}</a>`
  ).join("");
  const left = designers.length ? `
      <div class="mm-marques__col">
        <div class="mm-col__head">À la une</div>
        <div class="mm-des-flat">${desHtml}</div>
        <a class="mm-marques__all" href="/designers.html">Tous les designers →</a>
      </div>` : "";

  // Designer du mois — the SAME editorial component as the coup de cœur.
  const side = duMois ? sideHTML({
    label: "Designer du mois",
    image: duMois.photo,
    imageAlt: duMois.name || "",
    title: duMois.name,
    lead: duMois.lead,
    ctaHref: duMois.slug ? `/produits.html?designer=${duMois.slug}` : "",
    ctaLabel: duMois.ctaLabel || "Voir ses pièces",
    imgOnError: true,
  }) : "";

  panel.innerHTML = `
    <div class="mm-mega mm-mega--designers">
      ${left}
      ${side}
    </div>`;
}

// --- mobile drawer hydration ---------------------------------

function hydrateDrawer() {
  const mobSub = document.querySelector('[data-drawer-sub="mobilier"]');
  if (mobSub && TOP.mobilier?.items?.length) {
    const links = TOP.mobilier.items.map((c) =>
      `<li><a href="${escapeHtml(c.url)}">${escapeHtml(c.title)}</a></li>`
    ).join("");
    mobSub.innerHTML = links + `<li><a href="/collections/all" style="font-style:italic">Voir tout le mobilier →</a></li>`;
  }
  // Marques drawer: 15 brands, name only — featured collections skipped
  // on mobile (V2.1 decision: drawer is already long).
  const brSub = document.querySelector('[data-drawer-sub="marques"]');
  if (brSub && brandsData?.brands?.length) {
    const links = brandsData.brands.map((b) =>
      `<li><a href="${escapeHtml(b.href)}">${escapeHtml(b.name)}</a></li>`
    ).join("");
    brSub.innerHTML = links + `<li><a href="/marques.html" style="font-style:italic">Toutes les marques →</a></li>`;
  }
  // Drawer footer reuses the Mobilier coup de cœur as the bottom
  // editorial block (single source of truth, same JSON as desktop).
  const foot = document.querySelector("[data-drawer-foot]");
  const cdc  = config?.mobilier?.coupDeCoeur;
  if (foot && cdc?.image) {
    foot.innerHTML = `
      <div class="drawer__foot-label">${escapeHtml(cdc.label || "Coup de cœur du moment")}</div>
      <img class="drawer__visual" src="${escapeHtml(cdc.image)}" alt="${escapeHtml(cdc.imageAlt || "")}" loading="lazy" />
      ${cdc.title ? `<div class="drawer__foot-title">${escapeHtml(cdc.title)}</div>` : ""}
      ${cdc.lead  ? `<p class="drawer__foot-lead">${escapeHtml(cdc.lead)}</p>` : ""}
      ${cdc.ctaHref ? `<a class="drawer__foot-cta" href="${escapeHtml(cdc.ctaHref)}">${escapeHtml(cdc.ctaLabel || "Lire l'article")} →</a>` : ""}
    `;
  }
}

// --- desktop hover/keyboard interactions ----------------------

let openKey = null;
let openTimer = null;
let closeTimer = null;

function bindHover() {
  document.querySelectorAll("[data-mm-trigger]").forEach((t) => {
    const key = t.dataset.mmTrigger;
    t.addEventListener("mouseenter", () => scheduleOpen(key));
    t.addEventListener("mouseleave", () => scheduleClose());
    t.addEventListener("focus", () => open(key));
  });
  stageEl.addEventListener("mouseenter", () => cancelTimers());
  stageEl.addEventListener("mouseleave", () => scheduleClose());
}

function scheduleOpen(key) {
  cancelTimers();
  openTimer = setTimeout(() => open(key), OPEN_DELAY);
}
function scheduleClose() {
  cancelTimers();
  closeTimer = setTimeout(close, CLOSE_DELAY);
}
function cancelTimers() {
  clearTimeout(openTimer); openTimer = null;
  clearTimeout(closeTimer); closeTimer = null;
}

function open(key) {
  if (!stageEl || openKey === key) return;
  const panel = stageEl.querySelector(`[data-mm-panel="${key}"]`);
  if (!panel || !panel.innerHTML.trim()) return;
  stageEl.querySelectorAll(".mm-panel").forEach((p) => p.classList.remove("is-active"));
  panel.classList.add("is-active");
  stageEl.dataset.mmKey = key;
  stageEl.classList.add("is-open");
  setExpanded(key, true);
  openKey = key;
}

function close() {
  if (!stageEl || !openKey) return;
  stageEl.classList.remove("is-open");
  setExpanded(openKey, false);
  openKey = null;
}

function setExpanded(key, val) {
  const t = document.querySelector(`[data-mm-trigger="${key}"]`);
  t?.setAttribute("aria-expanded", val ? "true" : "false");
}

function bindKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openKey) {
      const t = document.querySelector(`[data-mm-trigger="${openKey}"]`);
      close();
      t?.focus();
    }
  });
}

function bindFocus() {
  document.addEventListener("focusin", (e) => {
    if (!openKey) return;
    const trigger = document.querySelector(`[data-mm-trigger="${openKey}"]`);
    if (!stageEl.contains(e.target) && e.target !== trigger) close();
  });
}

// --- mobile drawer accordions --------------------------------

function bindDrawerAccordions() {
  document.querySelectorAll(".drawer__group").forEach((g) => {
    const head = g.querySelector(".drawer__group-head");
    if (!head) return;
    head.addEventListener("click", () => {
      const isOpen = g.dataset.open === "true";
      g.dataset.open = isOpen ? "false" : "true";
      head.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });
  });
}
