/* designers.html · script de page (ex-inline, sorti dans ce fichier en octobre 2026 : cache navigateur,
   syntaxe vérifiée par npm run check, prêt pour une CSP sans 'unsafe-inline').
   Comportement identique : un module inline s'exécute lui aussi après l'analyse du document. */
import { initShell, escapeHtml, loadNavigation } from "/shared.js";
import { brandHref } from "/navigation.mjs";
initShell({ active: "Designers", transparentNav: true });

const featuredGrid = document.querySelector("[data-featured-grid]");
const azBar        = document.querySelector("[data-az-bar]");
const azIndex      = document.querySelector("[data-az-index]");
const countEl      = document.querySelector("[data-designer-count]");

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
// Precomposed Latin letters NFD can't decompose (no combining-mark form):
// fold them to a base letter so a Nordic/Polish/Icelandic family name files
// under its letter instead of dropping into the "#" bucket.
const FOLD = { "Ø": "O", "Œ": "O", "Æ": "A", "Å": "A", "Ł": "L", "Đ": "D", "Þ": "T", "ẞ": "S" };

// Bucket letter = first char of the sort key (family name), uppercased
// and stripped of diacritics so "Prouvé" → P, "Émile…" → E. Anything
// non-alphabetic falls into the "#" bucket.
function bucketOf(d) {
  const key = (d.sortKey || d.name || "").trim();
  let ch = key.charAt(0).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  ch = FOLD[ch] || ch;
  return /[A-Z]/.test(ch) ? ch : "#";
}

let nav = { brands: {} };
function brandsHTML(d) {
  return (d.brands || []).map((b) => `<a href="${escapeHtml(brandHref(b, nav))}">${escapeHtml(b)}</a>`)
    .join('<span class="designer-card__brand-sep" aria-hidden="true"> · </span>');
}

// Guarded portrait — a missing photo must not throw (one bad record would
// otherwise reject the whole .then and blank the entire directory). Falls
// back to a neutral tile that keeps the 4:5 footprint (no CLS).
function photoHTML(d) {
  if (!d.photo) return `<div class="designer-card__photo" aria-hidden="true"></div>`;
  return `<picture><source type="image/webp" srcset="${escapeHtml(d.photo.replace(/\.jpg$/, "-640.webp"))}" /><img class="designer-card__photo" src="${escapeHtml(d.photo)}" width="640" height="800" alt="${escapeHtml(d.name)}" loading="lazy" /></picture>`;
}

// Large featured card — same shape as the historical (épuré) card:
// <article> + transparent overlay <a> for whole-tile navigation, brand
// links kept clickable above the overlay. The featured card OWNS the
// deep-link id="<slug>" (its A-Z entry below carries none — one id/slug).
function featuredCardHTML(d) {
  return `
    <article class="designer-card designer-card--lg" id="${escapeHtml(d.slug)}">
      ${photoHTML(d)}
      <h3 class="designer-card__name">${escapeHtml(d.name)}</h3>
      <div class="designer-card__brands">${brandsHTML(d)}</div>
      <a class="designer-card__link" href="/produits.html?designer=${encodeURIComponent(d.slug)}" aria-label="Voir les produits de ${escapeHtml(d.name)}"></a>
    </article>`;
}

function highlight(el) {
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("is-highlight");
  setTimeout(() => el.classList.remove("is-highlight"), 1600);
}
function gotoHash() {
  const raw = location.hash.replace(/^#/, "");
  if (!raw) return;
  let hash; try { hash = decodeURIComponent(raw); } catch (e) { hash = raw; }
  const el = document.getElementById(hash) || document.getElementById(raw);
  if (el) highlight(el);
}

// Annuaire complet envoyé par le serveur : ne pas le relire ni le redessiner.
if (azIndex.children.length && featuredGrid.querySelector(".designer-card:not(.designer-card--skel)")) requestAnimationFrame(gotoHash);
else Promise.all([
  fetch("/designers-data.json", { cache: "no-cache" }).then((r) => r.ok ? r.json() : Promise.reject("designers-data " + r.status)),
  loadNavigation().catch(() => nav),
])
  .then(([data, navigation]) => {
    nav = navigation;
    // Visible directory = every designer that isn't hidden. Hidden ones
    // (no product yet) stay in the JSON but render nowhere.
    const all = (data?.designers || []).filter((d) => !d.hidden);
    all.sort((a, b) => (a.sortKey || a.name).localeCompare(b.sortKey || b.name, "fr", { sensitivity: "base" }));
    countEl.textContent = `${all.length} designers`;

    // 1) Featured block — the big cards (ordered by family name).
    const featured = all.filter((d) => d.featured);
    const featuredSlugs = new Set(featured.map((d) => d.slug));
    featuredGrid.innerHTML = featured.map(featuredCardHTML).join("");

    // 2) A-Z index — ALL visible designers (featured included so the
    //    directory is complete). Group by bucket letter.
    // Two designers sharing a family name (Aino and Alvar Aalto): full name to tell them apart.
    const keyCount = {};
    for (const d of all) { const k = (d.sortKey || d.name).toLowerCase(); keyCount[k] = (keyCount[k] || 0) + 1; }
    const azLabel = (d) => keyCount[(d.sortKey || d.name).toLowerCase()] > 1 ? d.name : (d.sortKey || d.name);
    const groups = {};
    for (const d of all) (groups[bucketOf(d)] ||= []).push(d);
    const letters = Object.keys(groups).sort((a, b) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b, "fr");
    });

    // Alpha bar: full alphabet; letters without designers are inert.
    const bar = ALPHA.map((L) => groups[L]
      ? `<a class="az-bar__letter" href="#letter-${L}">${L}</a>`
      : `<span class="az-bar__letter is-empty" aria-hidden="true">${L}</span>`);
    if (groups["#"]) bar.push(`<a class="az-bar__letter" href="#letter-num">#</a>`);
    azBar.innerHTML = bar.join("");

    // Groups: family-name links. A featured designer's A-Z entry carries
    // NO id (its big card holds the only id="<slug>" on the page).
    azIndex.innerHTML = letters.map((L) => {
      const anchor = L === "#" ? "letter-num" : `letter-${L}`;
      const names = groups[L].map((d) => {
        const id = featuredSlugs.has(d.slug) ? "" : ` id="${escapeHtml(d.slug)}"`;
        const label = escapeHtml(azLabel(d));
        return `<li class="az-name"${id}><a href="/produits.html?designer=${encodeURIComponent(d.slug)}">${label}</a></li>`;
      }).join("");
      return `<div class="az-group">`
           +   `<h3 class="az-letter" id="${anchor}">${L}</h3>`
           +   `<ul class="az-names">${names}</ul>`
           + `</div>`;
    }).join("");

    // Deep-link (#<slug> in the URL — a shared/bookmarked link or any
    // future caller): scroll to the targeted card or A-Z entry and pulse
    // it. rAF lets the layout settle before we measure offsets.
    requestAnimationFrame(gotoHash);
  })
  .catch((e) => {
    featuredGrid.innerHTML = `<p class="plp-empty">La page designers se charge bientôt. <a href="/produits.html">Retour au catalogue</a></p>`;
    console.warn("[designers]", e);
  });

// Hash changes (navigating to another #<slug> on this page) re-trigger
// the scroll + pulse.
window.addEventListener("hashchange", gotoHash);
