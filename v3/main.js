/* Home page · mounts the shared shell, then fills the product rows. */
import { initShell, fetchProducts, productCard, fetchBrands, slugify, escapeHtml } from "/shared.js";

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

/* Brand logo marquee + live "maisons" count, from the real vendor feed.
   Each brand renders as a monochrome logo from /images/brands/<slug>.svg.
   Drop an official SVG at that path to replace any mark; missing files fall
   back to a clean text wordmark so the marquee never breaks. */
function brandLogo(b) {
  const slug = slugify(b.name);
  const href = `/produits.html?brand=${slug}`;
  const name = escapeHtml(b.name);
  return `<a class="brandmarquee__item" href="${href}" aria-label="${name}">`
    + `<img class="brandmarquee__logo" src="/images/brands/${slug}.svg" alt="${name}" loading="lazy" `
    + `onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'brandmarquee__wordmark',textContent:this.alt}))" />`
    + `</a>`;
}

async function loadBrandMarquee() {
  const track = document.querySelector("[data-brandmarquee]");
  if (!track) return;
  try {
    const brands = (await fetchBrands()).filter((b) => b.productCount > 0);
    if (!brands.length) throw new Error("empty brand feed");
    const ordered = [...brands].sort((a, b) => b.productCount - a.productCount);
    const items = ordered.map(brandLogo).join("");
    // Duplicate the set so the -50% keyframe loops seamlessly.
    track.innerHTML = items + items;
  } catch (err) {
    track?.closest(".brandmarquee")?.remove();
    console.warn("[v3] brand marquee unavailable:", err.message);
  }
}
loadBrandMarquee();
