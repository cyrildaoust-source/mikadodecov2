const families = require('../data/family-pages.json');
const seatingIcons = require('../data/seating-icons.json');
const PAGE_SIZE = 24;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const jsonForHtml = value => JSON.stringify(value).replace(/</g, '\\u003c');
const familyUrl = handle => '/collections/' + encodeURIComponent(handle);

// La grille n'a pas besoin de toutes les galeries, descriptions et données PDP.
function cardSeed(product) {
  const fields = ['id', 'handle', 'variantId', 'name', 'brand', 'image', 'image2', 'badge', 'compareAt', 'price', 'priceMin', 'priceMax', 'inStock', 'longDelay', 'leadTimeLabel'];
  return {
    ...Object.fromEntries(fields.map(field => [field, product[field]])),
    variants: (product.variants || []).map(variant => ({ options: variant.options || [] })),
  };
}

function nextPageUrl(handle, pageInfo) {
  return pageInfo?.hasNextPage && pageInfo.endCursor
    ? familyUrl(handle) + '?cursor=' + encodeURIComponent(pageInfo.endCursor) + '#grille'
    : null;
}

function rail(categories) {
  const fit = categories.length <= 5 ? ' home-rail--fit' : '';
  return `<section class="section wrap" aria-labelledby="family-categories">
    <div class="home-railhead"><h2 class="serif" id="family-categories">Nos catégories</h2>
    </div>
    <div class="home-rail${fit}" data-famrail role="region" aria-labelledby="family-categories">${categories.map(category => `<a class="home-rc" href="${familyUrl(category.handle)}"><img class="home-rc__img" src="${escapeHtml(category.image)}" alt="" loading="lazy"><span class="home-rc__scrim" aria-hidden="true"></span><span class="home-rc__n">${escapeHtml(category.title)}</span></a>`).join('')}</div>
  </section>`;
}

function inspiration(family) {
  return `<section class="sec" aria-labelledby="family-inspiration"><h2 class="lab" id="family-inspiration">${escapeHtml(family.inspiration.title)}</h2>
    <div class="fam-inspirations" data-famrail role="region" aria-labelledby="family-inspiration">${family.inspiration.items.map(item => `<a class="scard" href="${escapeHtml(item.href)}"><span class="ph"><img class="ph-img" src="${escapeHtml(item.image)}" alt="" loading="lazy"></span><span class="scard__name">${escapeHtml(item.title)}</span></a>`).join('')}</div>
  </section>`;
}

function brands(family) {
  return `<section class="sec" aria-labelledby="family-brands"><h2 class="lab" id="family-brands">Nos marques</h2><div class="bgrid">${family.brands.map(brand => `<a class="bcard" href="/produits.html?brand=${encodeURIComponent(brand.slug)}"><span class="ph"><img class="ph-img" src="${escapeHtml(brand.image)}" alt="" loading="lazy"></span><span class="bcard__scrim"></span><span class="bcard__logo"><img src="/images/brands/${escapeHtml(brand.slug)}.svg" alt="${escapeHtml(brand.name)}" loading="lazy"></span></a>`).join('')}</div></section>`;
}

function iconSection(title, cards = '') {
  return `<section class="sec" data-icones-sec${cards ? '' : ' hidden'} aria-labelledby="family-icons"><h2 class="lab" id="family-icons">${escapeHtml(title)}</h2><div class="fam-icon-rail" data-icones data-famrail role="region" aria-labelledby="family-icons">${cards}</div></section>`;
}

function renderSeatingPage(template, items, cards) {
  return template.replace('<!-- SEATING_ICONS -->', () => iconSection(seatingIcons.title, cards))
    .replace('<script type="application/json" id="seating-icons-initial">{"items":[]}</script>', () => `<script type="application/json" id="seating-icons-initial">${jsonForHtml({ items: items.map(cardSeed) })}</script>`);
}

function renderFamilyPage(template, handle, { items = [], pageInfo = {}, failed = false, cards = '', cursor = '' } = {}) {
  const family = families[handle];
  if (!family) throw new Error('Unknown family');
  const next = nextPageUrl(handle, pageInfo);
  const grid = cards || `<p class="fam-empty">${failed ? 'Les produits ne sont pas disponibles pour le moment. Vous pouvez réessayer.' : 'Cette sélection se prépare. Découvrez nos catégories ou demandez-nous conseil.'}</p>`;
  const replacements = {
    TITLE: escapeHtml(family.title + ' · Mikado Deco'),
    DESCRIPTION: escapeHtml(family.description),
    URL: 'https://www.mikadodeco.be' + familyUrl(handle),
    IMAGE: escapeHtml(family.hero.startsWith('/') ? 'https://www.mikadodeco.be' + family.hero : family.hero),
    HERO: escapeHtml(family.hero),
    NAME: escapeHtml(family.title),
    HANDLE: escapeHtml(handle),
    INTRO: escapeHtml(family.description),
    CTA: escapeHtml(family.cta),
    CATEGORIES: rail(family.categories),
    ICONS: family.icons === false ? '' : iconSection('Les icônes'),
    INSPIRATION: inspiration(family),
    BRANDS: brands(family),
    GRID_TITLE: escapeHtml(family.gridTitle),
    GRID: grid,
    COUNT: items.length ? `${items.length} produit${items.length > 1 ? 's' : ''} affiché${items.length > 1 ? 's' : ''}` : '',
    PAGINATION: `<nav class="plp-pagination" aria-label="Suite des produits">${cursor ? `<a class="plp-page" href="${familyUrl(handle)}#grille">Revenir au début</a>` : ''}${next ? `<a class="plp-page" data-more href="${escapeHtml(next)}">Voir plus de produits</a>` : ''}${failed ? `<a class="plp-page" href="${escapeHtml(familyUrl(handle) + (cursor ? '?cursor=' + encodeURIComponent(cursor) : '') + '#grille')}">Réessayer</a>` : ''}</nav>`,
    INITIAL: jsonForHtml({ handle, items: items.map(cardSeed), pageInfo, cursor, pageSize: PAGE_SIZE, failed }),
  };
  return template.replace(/\[\[([A-Z_]+)\]\]/g, (_, key) => {
    if (!(key in replacements)) throw new Error('Unknown family placeholder');
    return replacements[key];
  });
}

module.exports = { families, seatingIcons, PAGE_SIZE, nextPageUrl, renderFamilyPage, renderSeatingPage };
