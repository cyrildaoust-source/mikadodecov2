/* ============================================================
   Mikadodeco · Mega menu controller (V2.1)
   - Mobilier  : Shopify-driven (menu(handle:"main-menu"))
   - Marques   : fully hardcoded from /mega-menu-brands.json
                 (15 brands + featured collections + flat designer list)
   - Side panel "Coup de cœur" from /mega-menu-config.json (restored)
   Top-level NAV labels/hrefs live in shared.js as the fallback so
   the chrome renders instantly with no flash.
   ============================================================ */

import { escapeHtml } from "/shared.js";

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

function coupDeCoeurHTML(megaKey) {
  const cdc = config?.[megaKey]?.coupDeCoeur;
  if (!cdc || !cdc.image) return "";
  return `
    <aside class="mm-side">
      <div class="mm-side__label">${escapeHtml(cdc.label || "Coup de cœur du moment")}</div>
      <div class="mm-side__rule" aria-hidden="true"></div>
      <img class="mm-side__visual" src="${escapeHtml(cdc.image)}" alt="${escapeHtml(cdc.imageAlt || "")}" loading="lazy" />
      ${cdc.title ? `<div class="mm-side__title">${escapeHtml(cdc.title)}</div>` : ""}
      ${cdc.lead  ? `<p class="mm-side__lead">${escapeHtml(cdc.lead)}</p>` : ""}
      ${cdc.ctaHref ? `<a class="mm-side__cta" href="${escapeHtml(cdc.ctaHref)}">${escapeHtml(cdc.ctaLabel || "Lire l'article")} →</a>` : ""}
    </aside>`;
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
  const brands    = brandsData?.brands || [];
  const designers = brandsData?.designers || [];
  if (!brands.length) { panel.innerHTML = ""; return; }

  // V2.2: featured sub-collections retired from the rendered mega
  // (kept in the JSON for future revival). Brand cards now hold just
  // the brand name → collection page.
  const brandCards = brands.map((b) => `
      <div class="mm-brand">
        <a class="mm-brand__name" href="${escapeHtml(b.href)}">${escapeHtml(b.name)}</a>
      </div>`).join("");

  // Designers — flat alphabetic list, name only, link to /marques.html
  // (placeholder until the dedicated designers page exists).
  const desHtml = designers.map((d) =>
    `<a href="/marques.html">${escapeHtml(d)}</a>`
  ).join("");

  panel.innerHTML = `
    <div class="mm-mega mm-mega--marques">
      <div class="mm-marques">
        <div class="mm-marques__col">
          <div class="mm-col__head">Nos marques</div>
          <div class="mm-brands-grid">${brandCards}</div>
          <a class="mm-marques__all" href="/marques.html">Toutes les marques →</a>
        </div>
        <div class="mm-marques__col mm-marques__col--des">
          <div class="mm-col__head">Designers</div>
          <div class="mm-des-flat">${desHtml}</div>
          <a class="mm-marques__all" href="/marques.html">Tous les designers →</a>
        </div>
      </div>
      ${coupDeCoeurHTML("marques")}
    </div>`;
}

// --- mobile drawer hydration ---------------------------------

function hydrateDrawer() {
  const mobSub = document.querySelector('[data-drawer-sub="mobilier"]');
  if (mobSub && TOP.mobilier?.items?.length) {
    mobSub.innerHTML = TOP.mobilier.items.map((c) =>
      `<li><a href="${escapeHtml(c.url)}">${escapeHtml(c.title)}</a></li>`
    ).join("");
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
