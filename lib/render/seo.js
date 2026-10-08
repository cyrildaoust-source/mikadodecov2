// Modèle de titre par type de page — Mikado Deco (exigence A3 du plan SEO, 8 octobre 2026)
// ---------------------------------------------------------------------------------------
// Un seul endroit décide de la forme du <title> (et donc d'og:title / twitter:title, que le
// layout dérive du même titre). Les fiches produit suivent la règle de Cyril, appliquée dans
// Shopify (champ SEO `title_tag`, lu en priorité) : « Nom — Marque | Mikado Deco ». Les autres
// pages gardent le séparateur « · » du site : « Nom de la page · Mikado Deco ».
const SITE_NAME = 'Mikado Deco';

const clean = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

// Fiche produit : le titre SEO Shopify s'il existe, sinon le modèle maison.
function productTitle({ seoTitle, name, brand } = {}) {
  const seo = clean(seoTitle);
  if (seo) return seo;
  const n = clean(name) || 'Produit';
  const b = clean(brand);
  return `${n}${b ? ` — ${b}` : ''} | ${SITE_NAME}`;
}

// Toute autre page (collection, marque, créateur, recherche, article, page éditoriale).
function pageTitle(name) {
  const n = clean(name);
  if (!n) return SITE_NAME;
  if (new RegExp(`(·|\\||—)\\s*${SITE_NAME}$`).test(n)) return n;   // déjà suffixé : idempotent
  return `${n} · ${SITE_NAME}`;
}

module.exports = { SITE_NAME, pageTitle, productTitle };
