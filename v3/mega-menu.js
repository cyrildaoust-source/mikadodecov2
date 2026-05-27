/* ============================================================
   Mikadodeco · Mega menu controller (V2)
   Fetches /api/menu (Shopify-driven, cached server-side 5 min) +
   /mega-menu-config.json (editorial "coup de cœur") + /mega-menu-
   designers.json (Marques→Designers map). Both mega menus run the
   same full-width stage; Marques now has its own column layout
   (Brands · Designers · side panel) instead of the V1 dropdown.
   Top-level NAV labels/hrefs live in shared.js as the fallback
   so the chrome renders instantly with no flash.
   ============================================================ */

import { escapeHtml } from "/shared.js";

const OPEN_DELAY  = 100;
const CLOSE_DELAY = 200;

let config    = null;   // mega-menu-config.json
let designers = null;   // mega-menu-designers.json
let menu      = null;   // /api/menu payload
let stageEl   = null;   // shared panel container injected after .chrome

const TOP = { mobilier: null, marques: null };

// --- public ---------------------------------------------------

export async function initMegaMenu() {
  stageEl = document.querySelector("[data-mm-stage]");
  if (!stageEl) return;
  try {
    const [menuRes, cfgRes, desRes] = await Promise.all([
      fetch("/api/menu",                  { cache: "no-store"    }).then((r) => r.json()).catch(() => ({ ok: false, items: [] })),
      fetch("/mega-menu-config.json",     { cache: "force-cache" }).then((r) => r.json()).catch(() => ({})),
      fetch("/mega-menu-designers.json",  { cache: "force-cache" }).then((r) => r.json()).catch(() => ({})),
    ]);
    menu      = menuRes;
    config    = cfgRes      || {};
    designers = desRes      || {};
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

// --- data layer ----------------------------------------------

function indexTopItems(items) {
  for (const it of items) {
    const key = (it.title || "").trim().toLowerCase();
    if (key === "mobilier")     TOP.mobilier = it;
    else if (key === "marques") TOP.marques  = it;
  }
}

// --- shared side panel render ---------------------------------

// "Coup de cœur du moment" block, used by both mega menus.
// Returns "" when no block is configured for that mega.
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

// --- desktop hydration ---------------------------------------

function hydrateMobilier() {
  const panel = stageEl.querySelector('[data-mm-panel="mobilier"]');
  if (!panel) return;
  const top = TOP.mobilier;
  if (!top || !top.items?.length) { panel.innerHTML = ""; return; }

  // 4+3 grid: stable layout regardless of viewport. CSS handles the
  // grid-template-columns: repeat(4, 1fr) so we just render the 7
  // categories in source order; Shopify drives the order.
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

function hydrateMarques() {
  const panel = stageEl.querySelector('[data-mm-panel="marques"]');
  if (!panel) return;
  const top = TOP.marques;
  if (!top || !top.items?.length) { panel.innerHTML = ""; return; }

  // Column 1 — Brands (Shopify ordered)
  const brandLinks = top.items.map((b) =>
    `<a href="${escapeHtml(b.url)}">${escapeHtml(b.title)}</a>`
  ).join("");

  // Column 2 — Designers grouped by brand (config-driven). Only the
  // brands that appear in mega-menu-designers.json render here; the
  // others stay listed in column 1 without a designer block.
  const designerGroups = (top.items || [])
    .filter((b) => Array.isArray(designers?.[b.title]) && designers[b.title].length)
    .map((b) => {
      const names = designers[b.title].map((d) =>
        `<a href="${escapeHtml(d.href)}">${escapeHtml(d.name)}</a>`
      ).join("");
      return `
        <div class="mm-des__group">
          <div class="mm-des__brand">· ${escapeHtml(b.title)}</div>
          <div class="mm-des__list">${names}</div>
        </div>`;
    }).join("");

  panel.innerHTML = `
    <div class="mm-mega mm-mega--marques">
      <div class="mm-marques">
        <div class="mm-marques__col">
          <div class="mm-col__head">Nos marques</div>
          <div class="mm-brands">${brandLinks}</div>
          <a class="mm-marques__all" href="/marques.html">Toutes les marques →</a>
        </div>
        <div class="mm-marques__col mm-marques__col--des">
          <div class="mm-col__head">Designers</div>
          <div class="mm-des">${designerGroups}</div>
          <a class="mm-marques__all" href="/designers.html">Tous les designers →</a>
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
  const brSub = document.querySelector('[data-drawer-sub="marques"]');
  if (brSub && TOP.marques?.items?.length) {
    const links = TOP.marques.items.map((b) =>
      `<li><a href="${escapeHtml(b.url)}">${escapeHtml(b.title)}</a></li>`
    ).join("");
    brSub.innerHTML = links + `<li><a href="/marques.html" style="font-style:italic">Toutes les marques →</a></li>`;
  }
  // Drawer footer: render the Mobilier coup de cœur as the bottom
  // editorial block (single source of truth, the same JSON as the
  // desktop side panel).
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
  // Both mega menus are now full-width; no per-key positioning.
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
