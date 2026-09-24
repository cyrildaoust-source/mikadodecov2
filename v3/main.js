/* Home page · mounts the shared shell, then fills the product rows. */
import { initShell, productCard, fetchBrands, fetchPromos, applyPromos, slugify, escapeHtml, buildShaReady, versionedImg, loadBrandHandles } from "/shared.js";
import { brandLogoSrc } from "/brand-logos.mjs";

initShell({ active: "", transparentNav: true });

// Rail « Nos familles » — flèches + désactivation en bout de course.
(function () {
  const s = document.querySelector("[data-famrail]"); if (!s) return;
  const p = document.querySelector("[data-prev]"), n = document.querySelector("[data-next]");
  const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const step = () => Math.min(s.clientWidth * 0.8, 640);
  const sync = () => { if (p) p.disabled = s.scrollLeft <= 1; if (n) n.disabled = s.scrollLeft + s.clientWidth >= s.scrollWidth - 1; };
  if (p) p.addEventListener("click", () => s.scrollBy({ left: -step(), behavior: rm ? "auto" : "smooth" }));
  if (n) n.addEventListener("click", () => s.scrollBy({ left: step(), behavior: rm ? "auto" : "smooth" }));
  s.addEventListener("scroll", () => requestAnimationFrame(sync), { passive: true });
  addEventListener("resize", sync); sync();
})();

async function loadRows() {
  const hosts = [...document.querySelectorAll("[data-products]")];
  if (!hosts.length) return;
  // Mêmes produits que le rendu serveur (/api/home-rails) : Nouveautés = vraie collection
  // « nouveautes » en alternant les marques ; Meilleures ventes = ordre BEST_SELLING.
  try {
    const r = await fetch("/api/home-rails");
    if (!r.ok) throw new Error("home rails " + r.status);
    const rails = await r.json();
    for (const host of hosts) {
      const list = (host.dataset.sort === "new" ? rails.nouveautes : rails.best) || [];
      const slice = list.slice(0, parseInt(host.dataset.count || "4", 10));
      if (slice.length) host.innerHTML = slice.map(productCard).join("");
    }
  } catch (err) {
    // Les cartes rendues par le serveur restent en place ; sinon, un message d'attente.
    hosts.filter((h) => h.querySelector(".pcard__skel")).forEach((h) => { h.innerHTML = `<p class="pcard__name" style="grid-column:1/-1;color:var(--muted)">La sélection se charge bientôt.</p>`; });
    console.warn("[v3] home rails unavailable:", err.message);
  }
}
loadRows();

// Fetch Shopify promo titles in the background (cached server-side) and
// inject them onto every rendered card once they resolve. Failures are
// silent — the badge is optional decoration.
fetchPromos().then(applyPromos).catch((e) => console.warn("[v3] promos unavailable:", e.message));

/* Brand logo marquee + live "maisons" count, from the real vendor feed.
   Tries the brand logo (brand-logos.mjs) first; if missing, the <img> onerror
   swaps itself for a Cormorant-italic wordmark (.brandmarquee__name).
   No console 404 noise — the swap is silent for the viewer. */
function brandLogo(b, handleMap) {
  const slug = slugify(b.name);
  const handle = handleMap && handleMap[slug];
  const href = handle ? `/collections/${handle}` : `/produits.html?brand=${slug}`;
  const name = escapeHtml(b.name);
  const src  = versionedImg(brandLogoSrc(slug));
  return `<a class="brandmarquee__item" href="${href}" aria-label="${name}">`
    + `<img class="brandmarquee__logo" src="${src}" alt="${name}" loading="lazy" `
    + `onerror="this.outerHTML='<span class=&quot;brandmarquee__name&quot;>${name}</span>'" />`
    + `</a>`;
}

async function loadBrandMarquee() {
  const track = document.querySelector("[data-brandmarquee]");
  if (!track) return;
  try {
    // Wait for the build SHA so the logo URLs carry ?v=<sha> on the
    // first paint. The fetch is cached server-side, sub-ms warm.
    const [, brands, handleMap] = await Promise.all([
      buildShaReady(),
      fetchBrands(),
      loadBrandHandles(),
    ]);
    const filtered = brands.filter((b) => b.productCount > 0);
    if (!filtered.length) throw new Error("empty brand feed");
    const ordered = [...filtered].sort((a, b) => b.productCount - a.productCount);
    const items = ordered.map((b) => brandLogo(b, handleMap)).join("");
    // Duplicate the set so the -50% keyframe loops seamlessly.
    track.innerHTML = items + items;
  } catch (err) {
    track?.closest(".brandmarquee")?.remove();
    console.warn("[v3] brand marquee unavailable:", err.message);
  }
}
loadBrandMarquee();
