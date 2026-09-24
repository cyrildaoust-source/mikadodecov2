const landing = require('../data/catalog-landing.json');
const { renderCategoryRail, cardSeed } = require('./family-pages');
const { editorialHero, injectCollectionHero } = require('./editorial-media');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// Les vues Mobilier partagent leur modèle, avec une présentation compacte dès
// la page 2. Marques, recherche et créateurs conservent leur propre en-tête.
function isCatalogLanding(query = {}) {
  return !query.brand && !query.designer && !query.q && (!query.coll || query.coll === 'all');
}

function renderCatalogLanding(template, { iconItems = [], iconCards = '', discoveryHidden = false, continuation = false } = {}) {
  const hero = editorialHero(landing.hero);
  const html = injectCollectionHero(template, hero);
  return html.replace('<main id="contenu">', `<main id="contenu" class="fam" data-catalogue-landing${continuation ? ' data-catalogue-continuation' : ''}>`)
    .replace(/<section class="subhero[^\"]*">[\s\S]*?<\/section>/, () => `<section class="fam-hero" aria-labelledby="catalogue-title">
    <span class="ph"><img class="ph-img editorial-photo" src="${escapeHtml(hero.img)}" srcset="${escapeHtml(hero.srcset)}" sizes="100vw" width="${hero.width}" height="${hero.height}" alt="${escapeHtml(hero.alt)}" style="${escapeHtml(hero.style)}" ${continuation ? 'loading="lazy"' : 'fetchpriority="high"'}></span>
    <div class="fam-hero__scrim" aria-hidden="true"></div>
    <div class="fam-hero__in">
      <h1 class="fam-hero__title" id="catalogue-title" data-plp-title data-context>${escapeHtml(landing.title)}</h1>
      <p class="fam-hero__desc" data-plp-sub>${escapeHtml(landing.description)}</p>
      <a class="fam-hero__btn" href="#grille">Découvrir les pièces <span aria-hidden="true">↓</span></a>
    </div>
  </section>`)
    .replace('<div class="wrap" data-breadcrumb></div>', () => '<div class="wrap" data-breadcrumb></div>\n<div data-catalogue-families>' + renderCategoryRail(landing.categories) + '</div>' + `
    <div data-catalogue-discovery${discoveryHidden ? ' hidden' : ''}>
      ${iconCards ? `<section class="sec" aria-labelledby="catalogue-icons">
        <h2 class="lab" id="catalogue-icons">${escapeHtml(landing.icons.title)}</h2>
        <div class="fam-icon-rail" data-catalogue-icons data-famrail role="region" aria-labelledby="catalogue-icons">${iconCards}</div>
      </section>` : ''}
      ${renderCategoryRail(landing.discovery.categories, { id: 'catalogue-discovery', title: landing.discovery.title, compact: true })}
    </div>
    <script type="application/json" id="catalogue-icons-initial">${JSON.stringify({ items: iconItems.map(cardSeed) }).replace(/</g, '\\u003c')}</script>`)
    .replace(/<section class="section wrap" data-pop-section[\s\S]*?<\/section>/, '')
    .replace('<div class="wrap plp-countline"><span class="plp-count" data-plp-count></span></div>', '')
    .replace(/<section class="section wrap">\s*<div class="grid-head" id="grille">[\s\S]*?<\/div>/, `<section class="section wrap catalogue-products">
    <div class="fam-gridhead grid-head" id="grille">
      <h2 data-grid-title data-context>Tout le catalogue</h2>
      <span data-plp-count></span>
    </div>`);
}

module.exports = { landing, isCatalogLanding, renderCatalogLanding };
