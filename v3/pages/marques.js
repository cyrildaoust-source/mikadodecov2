/* marques.html · script de page (ex-inline, sorti dans ce fichier en octobre 2026 : cache navigateur,
   syntaxe vérifiée par npm run check, prêt pour une CSP sans 'unsafe-inline').
   Comportement identique : un module inline s'exécute lui aussi après l'analyse du document. */
import { initShell, buildShaReady, versionedImg } from "/shared.js";
import { brandCardHTML } from "/brand-card.mjs";
initShell({ active: "Marques", transparentNav: true });

const grid = document.querySelector("[data-brandgrid]");
const countEl = document.querySelector("[data-brand-count]");

// Les cartes SSR sont déjà complètes : ne pas les remplacer ni recharger leurs logos.
// Le chargement client sert uniquement au repli sans rendu serveur.
// Liste DYNAMIQUE depuis /api/brands (vendor de TOUS les produits publiés —
// walk paginé côté serveur, fini le plafond 250). Une marque apparaît dès
// qu'elle a des produits publiés online, disparaît sinon. Chaque marque porte
// son lien (href). buildShaReady reste pour le cache-busting logos.
async function loadBrands() {
  if (grid.dataset.ssr === "1") return;
  const [, active] = await Promise.all([
    buildShaReady(),
    fetch("/api/brands", { cache: "no-cache" }).then((r) => r.ok ? r.json() : Promise.reject("brands " + r.status)),
  ]);
  const brands = (active || []).slice().sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
  countEl.textContent = `${brands.length} marques`;
  grid.innerHTML = brands.map(b => brandCardHTML(b, { imageUrl: versionedImg })).join("");
}
loadBrands().catch((e) => { grid.innerHTML = `<p class="plp-empty">Les marques se chargent bientôt. <a href="/produits.html">Retour au catalogue</a></p>`; console.warn(e); });
