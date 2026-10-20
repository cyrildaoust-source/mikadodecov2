/* Home page · mounts the shared shell, then fills the product rows. */
import { initShell } from "/shell.mjs";
import { productCard } from "/product-grid.mjs";
import { fetchPromos, applyPromos } from "/catalog-data.mjs";

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
  // Rails envoyés complets par le serveur : rien à recharger ni à redessiner.
  // Un squelette porte aussi la classe .pcard : seule une vraie carte a son bouton d'ajout.
  if (!hosts.length || hosts.every((h) => h.querySelector(".pcard [data-add]"))) return;
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

