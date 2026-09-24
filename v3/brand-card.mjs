import { escapeHtml, slugify } from './format.mjs';

const ORIGIN = { fermob: 'France', hay: 'Danemark', vitra: 'Suisse', muuto: 'Danemark', tradition: 'Danemark', 'ferm-living': 'Danemark', fatboy: 'Pays-Bas', hkliving: 'Pays-Bas', 'pols-potten': 'Pays-Bas', alessi: 'Italie', artek: 'Finlande', relaxound: 'Allemagne', gubi: 'Danemark', moustache: 'France' };

// The server and the static-page fallback render the same brand card.
export function brandCardHTML(brand, { href, imageUrl = url => url } = {}) {
  const slug = brand.slug || slugify(brand.name);
  const logo = imageUrl(`/images/brands/${slug}.svg`);
  return `<a class="brandcard" href="${escapeHtml(href || `/produits.html?brand=${slug}`)}">
    <span class="brandcard__origin">${ORIGIN[slug] || 'Europe'}</span>
    <div>
      <img class="brandcard__logo" src="${escapeHtml(logo)}" alt="${escapeHtml(brand.name)}" loading="lazy"
        onerror="const name=document.createElement('span');name.className='brandcard__name';name.textContent=this.alt;this.replaceWith(name)" />
    </div>
  </a>`;
}
