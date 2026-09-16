const landing = require('../data/catalog-landing.json');
const { renderCategoryRail } = require('./family-pages');
const { editorialHero, injectCollectionHero } = require('./editorial-media');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// Les filtres et la pagination du catalogue gardent la même composition après
// rechargement. Marques, recherche et créateurs conservent leur propre en-tête.
function isCatalogLanding(query = {}) {
  return !query.brand && !query.designer && !query.q && (!query.coll || query.coll === 'all');
}

function renderCatalogLanding(template) {
  const hero = editorialHero(landing.hero);
  const html = injectCollectionHero(template, hero);
  return html.replace('<main id="contenu">', '<main id="contenu" class="fam" data-catalogue-landing>')
    .replace(/<section class="subhero[^\"]*">[\s\S]*?<\/section>/, () => `<section class="fam-hero" aria-labelledby="catalogue-title">
    <span class="ph"><img class="ph-img editorial-photo" src="${escapeHtml(hero.img)}" srcset="${escapeHtml(hero.srcset)}" sizes="100vw" width="${hero.width}" height="${hero.height}" alt="${escapeHtml(hero.alt)}" style="${escapeHtml(hero.style)}" fetchpriority="high"></span>
    <div class="fam-hero__scrim" aria-hidden="true"></div>
    <div class="fam-hero__in">
      <p class="fam-hero__eyebrow">Mobilier &amp; objets</p>
      <h1 class="fam-hero__title" id="catalogue-title" data-plp-title data-context>${escapeHtml(landing.title)}</h1>
      <p class="fam-hero__desc" data-plp-sub>${escapeHtml(landing.description)}</p>
      <a class="fam-hero__btn" href="#grille">Découvrir les pièces <span aria-hidden="true">↓</span></a>
    </div>
  </section>`)
    .replace('<div class="wrap" data-breadcrumb></div>', () => '<div class="wrap" data-breadcrumb></div>\n' + renderCategoryRail(landing.categories))
    .replace(/<section class="section wrap" data-pop-section[\s\S]*?<\/section>/, '')
    .replace('<h2 class="serif catalogue-head" data-grid-title>Tout le catalogue</h2>', '<h2 class="serif catalogue-head" data-grid-title data-context>Tout le catalogue</h2>');
}

module.exports = { landing, isCatalogLanding, renderCatalogLanding };
