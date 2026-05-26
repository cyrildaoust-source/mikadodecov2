/* ============================================================
   Mikadodeco · Nuancier Fermob widget
   Standalone module: mount the interactive palette into any host
   element. No auto-init — callers (page hôte + article) handle
   their own bootstrap.

   Public API:
     mountNuancier(rootEl, colors[, { scrollOnLoad }])
       rootEl   HTMLElement (host) — its innerHTML is replaced
       colors   array from /nuancier-fermob.data.json
       options  { scrollOnLoad: bool } — scroll rootEl into view
                if a matching hash is present on load (default true)
   ============================================================ */
import { slugify, escapeHtml } from "/shared.js";

const TEMPLATE = `
  <header class="nf-nav">
    <div class="nf-active" data-active>
      <h2 class="nf-active__name serif" data-name>—</h2>
      <div class="nf-active__index"><span data-index>—</span> / 25</div>
    </div>
    <nav class="nf-swatches" aria-label="Toutes les couleurs Fermob">
      <ol class="nf-swatches__list" data-swatches></ol>
    </nav>
  </header>

  <section class="nf-stage" aria-live="polite">
    <div class="nf-stage__media">
      <img class="nf-stage__hero" data-mood-hero alt="" />
      <div class="nf-stage__moodgrid">
        <img data-mood-1 loading="lazy" alt="" />
        <img data-mood-2 loading="lazy" alt="" />
      </div>
    </div>

    <div class="nf-stage__body">
      <p class="nf-stage__title" data-title>—</p>
      <p class="nf-stage__desc" data-desc>—</p>

      <div class="nf-stage__harmonies" data-harmonies hidden>
        <div class="nf-stage__harmonies-label">Harmonies recommandées</div>
        <div class="nf-stage__harmonies-list" data-harmonies-list></div>
      </div>
    </div>
  </section>

  <section class="nf-ambiances" data-ambiances hidden>
    <h3 class="nf-ambiances__title serif">Ambiances · <span data-amb-color>—</span></h3>
    <div class="nf-ambiances__grid" data-thumbs></div>
  </section>
`;

const FADE_MS = 150;

export function mountNuancier(rootEl, colors, opts = {}) {
  if (!rootEl) return null;
  if (!Array.isArray(colors) || !colors.length) {
    rootEl.innerHTML = `<p class="nf-error">Le nuancier ne s'est pas chargé.</p>`;
    return null;
  }
  const { scrollOnLoad = true } = opts;

  rootEl.classList.add("nf-root");
  rootEl.innerHTML = TEMPLATE;

  const $ = (sel) => rootEl.querySelector(sel);
  const els = {
    active:     $("[data-active]"),
    name:       $("[data-name]"),
    index:      $("[data-index]"),
    swatches:   $("[data-swatches]"),
    moodHero:   $("[data-mood-hero]"),
    mood1:      $("[data-mood-1]"),
    mood2:      $("[data-mood-2]"),
    title:      $("[data-title]"),
    desc:       $("[data-desc]"),
    harmonies:  $("[data-harmonies]"),
    harmoniesL: $("[data-harmonies-list]"),
    ambiances:  $("[data-ambiances]"),
    ambColor:   $("[data-amb-color]"),
    thumbs:     $("[data-thumbs]"),
  };

  const bySlug = new Map();
  colors.forEach((c) => bySlug.set(slugify(c.name), c));

  let activeSlug = null;

  renderSwatches();

  const hashSlug = location.hash.replace(/^#/, "");
  const initial  = (hashSlug && bySlug.has(hashSlug)) ? hashSlug : slugify(colors[0].name);
  setActive(initial, { updateHash: false, fade: false });

  // Deep-link landing: scroll the widget into view (skip on standalone
  // page where the host is already near the top, so we'd just bounce).
  if (scrollOnLoad && hashSlug && bySlug.has(hashSlug)) {
    requestAnimationFrame(() => {
      rootEl.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // Hash routing — works whether the user pasted the URL, clicked
  // back/forward, or shared the link.
  window.addEventListener("hashchange", onHashChange);

  return { setActive };

  // -------- internals --------

  function onHashChange() {
    const slug = location.hash.replace(/^#/, "");
    if (slug && bySlug.has(slug) && slug !== activeSlug) {
      setActive(slug, { updateHash: false });
      rootEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function renderSwatches() {
    els.swatches.innerHTML = colors.map((c) => {
      const slug = slugify(c.name);
      return `<li>
        <button type="button" class="nf-swatch" data-slug="${escapeHtml(slug)}" aria-pressed="false" aria-label="${escapeHtml(c.name)}" title="${escapeHtml(c.name)}" style="--swatch-color:${escapeHtml(c.hex)}">
          <span class="nf-swatch__dot" aria-hidden="true"></span>
        </button>
      </li>`;
    }).join("");
    els.swatches.addEventListener("click", (e) => {
      const btn = e.target.closest(".nf-swatch");
      if (!btn) return;
      const slug = btn.dataset.slug;
      if (slug && slug !== activeSlug) setActive(slug);
    });
  }

  function setActive(slug, { updateHash = true, fade = true } = {}) {
    const color = bySlug.get(slug);
    if (!color) return;
    activeSlug = slug;

    // Moodboard + body + ambiances refresh immediately. Only the
    // top "active label" gets the fade — it's the change indicator.
    refreshMedia(color);
    refreshBody(color);
    refreshHarmonies(color);
    refreshAmbiances(color);
    refreshSwatchPressed(slug);

    if (fade && !prefersReducedMotion()) {
      els.active.classList.add("is-fading");
      setTimeout(() => {
        writeActiveLabel(color);
        els.active.classList.remove("is-fading");
      }, FADE_MS);
    } else {
      writeActiveLabel(color);
    }

    if (updateHash) {
      history.replaceState(null, "", `#${slug}`);
    }
    document.title = `${color.name} · Nuancier Fermob · Mikadodeco`;
  }

  function writeActiveLabel(color) {
    els.name.textContent  = color.name || "—";
    els.index.textContent = String(color.order ?? "").padStart(2, "0");
  }

  function refreshMedia(color) {
    const moods = Array.isArray(color.moodboard_images) ? color.moodboard_images : [];
    setImg(els.moodHero, moods[0], `${color.name} · ambiance principale`);
    setImg(els.mood1,    moods[1], `${color.name} · ambiance 2`);
    setImg(els.mood2,    moods[2], `${color.name} · ambiance 3`);
  }

  function refreshBody(color) {
    els.title.textContent = color.title || "";
    els.desc.textContent  = color.description || "";
  }

  function refreshHarmonies(color) {
    const assocs = color.associations || {};
    const rows = Object.values(assocs).filter((row) => Array.isArray(row) && row.length);
    if (!rows.length) { els.harmonies.hidden = true; return; }
    els.harmonies.hidden = false;
    // Chips are purely visual (no navigation). Rendered as <span>.
    els.harmoniesL.innerHTML = rows.map((row) => {
      const chips = row.map((c, i) => {
        const sep = i > 0 ? `<span class="nf-harmony__plus" aria-hidden="true">+</span>` : "";
        return `${sep}<span class="nf-harmony__chip" style="--chip-color:${escapeHtml(c.hex)}" title="${escapeHtml(c.title || c.name)}">${escapeHtml(c.name)}</span>`;
      }).join("");
      return `<div class="nf-harmony">${chips}</div>`;
    }).join("");
  }

  function refreshAmbiances(color) {
    const thumbs = Array.isArray(color.ambiance_thumbs) ? color.ambiance_thumbs.slice(0, 6) : [];
    if (!thumbs.length) { els.ambiances.hidden = true; return; }
    els.ambiances.hidden = false;
    els.ambColor.textContent = color.name;
    els.thumbs.innerHTML = thumbs.map((url, i) =>
      `<img loading="lazy" referrerpolicy="no-referrer" src="${escapeHtml(url)}" alt="${escapeHtml(color.name)} — ambiance ${i + 1}" />`
    ).join("");
  }

  function refreshSwatchPressed(slug) {
    els.swatches.querySelectorAll(".nf-swatch").forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.slug === slug ? "true" : "false");
    });
  }

  function setImg(imgEl, url, alt) {
    if (!imgEl) return;
    if (!url) { imgEl.removeAttribute("src"); imgEl.alt = ""; return; }
    imgEl.src = url;
    imgEl.alt = alt;
    // Fermob CDN may refuse off-site Referer; strip it best-effort.
    imgEl.referrerPolicy = "no-referrer";
  }
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
