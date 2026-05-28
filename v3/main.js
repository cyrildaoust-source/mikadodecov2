/* Home page · mounts the shared shell, then fills the product rows. */
import { initShell, fetchProducts, productCard, fetchBrands, fetchPromos, applyPromos, slugify, escapeHtml, buildShaReady, versionedImg } from "/shared.js";

initShell({ active: "", transparentNav: true });

async function loadRows() {
  const hosts = [...document.querySelectorAll("[data-products]")];
  if (!hosts.length) return;
  try {
    const all = (await fetchProducts()).filter((p) => p.image);
    if (!all.length) throw new Error("empty feed");
    let cursor = 0;
    for (const host of hosts) {
      const count = parseInt(host.dataset.count || "3", 10);
      const slice = all.slice(cursor, cursor + count);
      cursor += count;
      if (slice.length) host.innerHTML = slice.map(productCard).join("");
    }
  } catch (err) {
    hosts.forEach((h) => { h.innerHTML = `<p class="pcard__name" style="grid-column:1/-1;color:var(--muted)">La sélection se charge bientôt.</p>`; });
    console.warn("[v3] product feed unavailable:", err.message);
  }
}
loadRows();

// Fetch Shopify promo titles in the background (cached server-side) and
// inject them onto every rendered card once they resolve. Failures are
// silent — the badge is optional decoration.
fetchPromos().then(applyPromos).catch((e) => console.warn("[v3] promos unavailable:", e.message));

/* Brand logo marquee + live "maisons" count, from the real vendor feed.
   Tries /images/brands/<slug>.svg first; if missing, the <img> onerror
   swaps itself for a Cormorant-italic wordmark (.brandmarquee__name).
   No console 404 noise — the swap is silent for the viewer. */
function brandLogo(b) {
  const slug = slugify(b.name);
  const href = `/produits.html?brand=${slug}`;
  const name = escapeHtml(b.name);
  const src  = versionedImg(`/images/brands/${slug}.svg`);
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
    const [, brands] = await Promise.all([
      buildShaReady(),
      fetchBrands(),
    ]);
    const filtered = brands.filter((b) => b.productCount > 0);
    if (!filtered.length) throw new Error("empty brand feed");
    const ordered = [...filtered].sort((a, b) => b.productCount - a.productCount);
    const items = ordered.map(brandLogo).join("");
    // Duplicate the set so the -50% keyframe loops seamlessly.
    track.innerHTML = items + items;
  } catch (err) {
    track?.closest(".brandmarquee")?.remove();
    console.warn("[v3] brand marquee unavailable:", err.message);
  }
}
loadBrandMarquee();
