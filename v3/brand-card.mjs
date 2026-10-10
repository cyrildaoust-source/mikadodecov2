import { escapeHtml, slugify } from './format.mjs';
import { brandLogoSrc } from './brand-logos.mjs';

const ORIGIN = { fermob: 'France', hay: 'Danemark', vitra: 'Suisse', muuto: 'Danemark', tradition: 'Danemark', 'ferm-living': 'Danemark', fatboy: 'Pays-Bas', hkliving: 'Pays-Bas', 'pols-potten': 'Pays-Bas', alessi: 'Italie', artek: 'Finlande', relaxound: 'Allemagne', gubi: 'Danemark', moustache: 'France', hoptimist: 'Danemark', softline: 'Danemark', 'kay-bojesen': 'Danemark', 'addison-ross': 'Royaume-Uni' };

// The server and the static-page fallback render the same brand card.
// `brand.href` vient de /api/brands (règle commune de navigation.mjs).
export function brandCardHTML(brand, { imageUrl = url => url } = {}) {
  const slug = brand.slug || slugify(brand.name);
  const logo = imageUrl(brandLogoSrc(slug));
  return `<a class="brandcard" href="${escapeHtml(brand.href || `/produits.html?brand=${slug}`)}">
    <span class="brandcard__origin">${ORIGIN[slug] || 'Europe'}</span>
    <div>
      <img class="brandcard__logo" src="${escapeHtml(logo)}" alt="${escapeHtml(brand.name)}" loading="lazy"
        data-fallback="brand-name" />
    </div>
  </a>`;
}
