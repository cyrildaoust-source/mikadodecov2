/* ============================================================
   Mikadodeco · Mega menu controller
   Fetches /api/menu (Shopify-driven, cached server-side 5 min),
   hydrates the Mobilier mega panel + Marques dropdown + the mobile
   drawer accordions. Wires hover-open/close with delays, keyboard
   support (Tab/Esc), and focus-out close.
   Top-level NAV labels/hrefs live in shared.js as a hardcoded
   fallback so the chrome renders instantly with no flash.
   ============================================================ */

import { escapeHtml, slugify } from "/shared.js";

const OPEN_DELAY  = 100;
const CLOSE_DELAY = 200;

let config = null;     // mega-menu-config.json (lazy fetched alongside menu)
let menu   = null;     // /api/menu payload
let stageEl = null;    // shared panel container injected after .chrome

// Lookup tables built once after fetch
const TOP = { mobilier: null, marques: null };

// --- public ---------------------------------------------------

export async function initMegaMenu() {
  stageEl = document.querySelector("[data-mm-stage]");
  if (!stageEl) return; // nav not rendered yet — caller should re-init
  try {
    const [menuRes, cfgRes] = await Promise.all([
      fetch("/api/menu", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ ok: false, items: [] })),
      fetch("/mega-menu-config.json", { cache: "force-cache" }).then((r) => r.json()).catch(() => ({})),
    ]);
    menu = menuRes;
    config = cfgRes || {};
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

// Match by lowercased title — Shopify item is "Mobilier" (renamed
// from "Produits") and "Marques" exactly. If Cyril renames one,
// hydration silently no-ops and the hardcoded top-level still works.
function indexTopItems(items) {
  for (const it of items) {
    const key = (it.title || "").trim().toLowerCase();
    if (key === "mobilier")     TOP.mobilier = it;
    else if (key === "marques") TOP.marques  = it;
  }
}

// --- desktop hydration ---------------------------------------

function hydrateMobilier() {
  const panel = stageEl.querySelector('[data-mm-panel="mobilier"]');
  if (!panel) return;
  const top = TOP.mobilier;
  if (!top || !top.items?.length) {
    panel.innerHTML = "";
    return;
  }
  const cfg = config.mobilier || {};
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

  const sideHtml = cfg.image ? `
    <aside class="mm-mega__side">
      <img class="mm-mega__visual" src="${escapeHtml(cfg.image)}" alt="${escapeHtml(cfg.imageAlt || "")}" loading="lazy" />
      ${cfg.ctaHref ? `<a class="mm-mega__cta" href="${escapeHtml(cfg.ctaHref)}">${escapeHtml(cfg.ctaLabel || "Découvrir")} →</a>` : ""}
      <div class="mm-mega__sep"></div>
      ${cfg.secondaryHref ? `<a class="mm-mega__second" href="${escapeHtml(cfg.secondaryHref)}">${escapeHtml(cfg.secondaryLabel || "Nouveautés")} →</a>` : ""}
    </aside>` : "";

  panel.innerHTML = `
    <div class="mm-mega">
      <div class="mm-mega__cols">${colsHtml}</div>
      ${sideHtml}
    </div>`;
}

function hydrateMarques() {
  const panel = stageEl.querySelector('[data-mm-panel="marques"]');
  if (!panel) return;
  const top = TOP.marques;
  if (!top || !top.items?.length) { panel.innerHTML = ""; return; }
  const list = top.items.map((b) =>
    `<a href="${escapeHtml(b.url)}">${escapeHtml(b.title)}</a>`
  ).join("");
  panel.innerHTML = `
    <div class="mm-drop">
      ${list}
      <div class="mm-drop__sep"></div>
      <a class="mm-drop__all" href="/marques.html">Toutes les marques →</a>
    </div>`;
}

// --- mobile drawer hydration ---------------------------------

function hydrateDrawer() {
  // Mobilier section: list of 7 categories (link only, no sub-sub
  // in V1 — direct navigation per brief §4 mobile note).
  const mobSub = document.querySelector('[data-drawer-sub="mobilier"]');
  if (mobSub && TOP.mobilier?.items?.length) {
    mobSub.innerHTML = TOP.mobilier.items.map((c) =>
      `<li><a href="${escapeHtml(c.url)}">${escapeHtml(c.title)}</a></li>`
    ).join("");
  }
  // Marques section: list of 11 brands + "Toutes les marques".
  const brSub = document.querySelector('[data-drawer-sub="marques"]');
  if (brSub && TOP.marques?.items?.length) {
    const links = TOP.marques.items.map((b) =>
      `<li><a href="${escapeHtml(b.url)}">${escapeHtml(b.title)}</a></li>`
    ).join("");
    brSub.innerHTML = links + `<li><a href="/marques.html" style="font-style:italic">Toutes les marques →</a></li>`;
  }
  // Bottom visual + shortcuts (mobilier config)
  const foot = document.querySelector("[data-drawer-foot]");
  if (foot && config.mobilier?.image) {
    const cfg = config.mobilier;
    foot.innerHTML = `
      <img class="drawer__visual" src="${escapeHtml(cfg.image)}" alt="${escapeHtml(cfg.imageAlt || "")}" loading="lazy" />
      ${cfg.ctaHref ? `<a class="drawer__foot-cta" href="${escapeHtml(cfg.ctaHref)}">${escapeHtml(cfg.ctaLabel || "Découvrir")} →</a>` : ""}
      ${cfg.secondaryHref ? `<a class="drawer__foot-cta" href="${escapeHtml(cfg.secondaryHref)}">${escapeHtml(cfg.secondaryLabel || "Nouveautés")} →</a>` : ""}
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
    // Focus opens immediately so keyboard users see the panel.
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
  if (!panel || !panel.innerHTML.trim()) return; // not hydrated yet
  // Hide other panels
  stageEl.querySelectorAll(".mm-panel").forEach((p) => p.classList.remove("is-active"));
  panel.classList.add("is-active");
  stageEl.dataset.mmKey = key;
  stageEl.classList.toggle("mm-stage--narrow", key === "marques");
  positionStage(key);
  stageEl.classList.add("is-open");
  setExpanded(key, true);
  openKey = key;
}

// Anchor the stage relative to its trigger.
// - Mobilier mega = full-width banner (default `left:0; right:0`)
// - Marques dropdown = narrow box anchored under the Marques trigger,
//   computed from getBoundingClientRect so it follows window resizes.
function positionStage(key) {
  if (!stageEl) return;
  if (key === "marques") {
    const trigger = document.querySelector(`[data-mm-trigger="${key}"]`);
    const chrome  = stageEl.closest(".chrome") || document.body;
    if (trigger) {
      const tRect = trigger.getBoundingClientRect();
      const cRect = chrome.getBoundingClientRect();
      // Align left edge of dropdown with left edge of trigger.
      stageEl.style.left  = (tRect.left - cRect.left) + "px";
      stageEl.style.right = "auto";
    }
  } else {
    stageEl.style.left  = "";
    stageEl.style.right = "";
  }
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
  // Close when focus moves outside the trigger AND the panel.
  document.addEventListener("focusin", (e) => {
    if (!openKey) return;
    const trigger = document.querySelector(`[data-mm-trigger="${openKey}"]`);
    if (!stageEl.contains(e.target) && e.target !== trigger) {
      close();
    }
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
