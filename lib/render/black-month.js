// Mise en scène du Black Month (lib/black-month.js) : barre d'annonce, entrée du menu, bandeau d'accueil,
// « Les grandes pièces » et page de l'offre. Noir et blanc, sans arrondi, mêmes polices que le site.
const { PAGE, config, countdown } = require('../black-month');
const { plpCardSsr } = require('./navigation');

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const euro = n => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n).replace(/\s(?=€)/, ' ');
const pct = `−${config.percent} %`;
const minimum = `${config.minimum} €`;
const variantHref = (product, variant) => `/produit.html?handle=${encodeURIComponent(product.card.handle)}&variant=${String(variant.id).split('/').pop()}`;
const image = (url, width) => {
  if (!url || !url.includes('cdn.shopify.com')) return url || '';
  const u = new URL(url); u.searchParams.set('width', width); u.searchParams.set('format', 'webp'); return u.href;
};

// Barre d'annonce : un seul message fixe, cliquable (plus de défilement pendant l'opération).
function announceHTML() {
  return `<div class="announce announce--bm" data-announce tabindex="0"><span class="on"><a href="${PAGE}"><b>Black Month</b> · ${pct} sur le mobilier en stock<i> dès ${minimum}</i><i> · </i><em>${countdown()}</em></a></span></div>`;
}
const navLinks = () => ({
  top: `<a href="${PAGE}" class="nlink nlink--bm">Black Month</a>`,
  drawer: `<a class="drawer__link drawer__link--bm" href="${PAGE}">Black Month · ${pct}</a>`,
});

// Peu de mots (Cyril, 9 novembre 2026 : « pas beau du tout, autant de texte ») : le titre, le chiffre, une ligne
// de conditions et un seul bouton. Le compte à rebours est dans la barre d'annonce.
function heroHTML({ level = 'h2', cta = 'Voir le mobilier en stock', href = PAGE } = {}) {
  return `<section class="bm-hero" aria-label="Black Month">
    <div class="bm-hero__txt">
      <${level} class="bm-hero__title">Black Month</${level}>
      <p class="bm-hero__offer"><span class="bm-hero__pct">${pct}</span><span class="bm-hero__what">sur le mobilier<br>en stock</span></p>
      <p class="bm-hero__terms">Dès ${minimum} de mobilier · jusqu’au 28&nbsp;novembre</p>
      <div class="bm-hero__ctas"><a class="bm-btn" href="${href}">${esc(cta)}</a></div>
    </div>
    <div class="bm-hero__media"><img src="${esc(image(config.heroImage, 1400))}" srcset="${esc(image(config.heroImage, 800))} 800w, ${esc(image(config.heroImage, 1400))} 1400w" sizes="(max-width: 700px) 100vw, 50vw" alt="${esc(config.heroImageAlt)}" fetchpriority="high"></div>
  </section>`;
}

function pieceHTML({ product, variant, price, sale, saving }) {
  const card = product.card;
  return `<a class="bm-piece" href="${esc(variantHref(product, variant))}">
    <span class="bm-piece__img"><img src="${esc(image(variant.image || card.image, 600))}" alt="${esc(card.name)}" loading="lazy" decoding="async"><span class="bm-piece__tag">${pct}</span></span>
    <span class="bm-piece__body">
      <span class="bm-piece__brand">${esc(card.brand)}</span>
      <span class="bm-piece__name">${esc(card.name)}</span>
      ${sale ? `<span class="bm-piece__price">${euro(sale)} <s>${euro(price)}</s></span><span class="bm-piece__save">${euro(saving)} d’économie</span>`
        : `<span class="bm-piece__price">${euro(price)}</span><span class="bm-piece__save">${pct} dès ${minimum} de mobilier</span>`}
    </span>
  </a>`;
}
function piecesHTML(pieces, { count = 4, title = 'Les grandes pièces, en stock', more = true } = {}) {
  const shown = pieces.slice(0, count);
  if (!shown.length) return '';
  return `<section class="bm-pieces"><div class="wrap">
    <div class="bm-pieces__head"><h2 class="bm-pieces__title">${esc(title)}</h2>${more ? `<a class="bm-pieces__more" href="${PAGE}">Voir les ${pieces.length} pièces →</a>` : ''}</div>
    <div class="bm-pieces__row">${shown.map(pieceHTML).join('')}</div>
  </div></section>`;
}

// Carte de la grille : la variante remisée, son prix remisé (à partir du minimum) et le prix normal barré.
function offerCard({ product, variant, price, sale }) {
  return {
    ...product.card,
    variantId: variant.id,
    image: variant.image || product.card.image,
    finishLabel: variant.finishLabel || product.card.finishLabel,
    price: sale ?? price, priceIsExact: true, compareAt: sale ? price : null,
    cartPrice: price,                       // le panier garde le prix normal : la remise vient de Shopify
    inStock: true, availabilityLabel: 'En stock à Uccle · à emporter ou livré',
    offerTag: sale ? null : `${pct} dès ${minimum} de mobilier`,
  };
}
const TERMS = [
  `${pct} sur les pièces de mobilier en stock signalées, du 10 au 28 novembre 2026 inclus, en boutique à Uccle et en ligne.`,
  `Dès ${minimum} d’achat de mobilier remisé ; la remise est appliquée automatiquement au panier.`,
  'Dans la limite des pièces disponibles. Offre non cumulable avec une autre remise.',
];
function pageMainHTML(offer) {
  const pieces = offer?.pieces || [];
  const grid = pieces.map(piece => plpCardSsr(offerCard(piece), PAGE)).join('');
  return `<main id="contenu" class="bm-page">
    ${heroHTML({ level: 'h1', cta: pieces.length ? `Voir les ${pieces.length} pièces` : 'Voir les pièces', href: '#pieces' })}
    ${piecesHTML(pieces, { count: 8, title: 'Les grandes pièces', more: false })}
    <section class="section wrap bm-grid" id="pieces" aria-labelledby="bm-grid-title">
      <div class="grid-head fam-gridhead"><h2 class="serif" id="bm-grid-title">Toutes les pièces en stock</h2>${pieces.length ? `<span class="plp-count">${pieces.length} pièces</span>` : ''}</div>
      ${grid ? `<div class="pgrid">${grid}</div>` : '<p class="plp-empty">Les pièces de l’offre se chargent : revenez dans un instant.</p>'}
    </section>
    <section class="section wrap bm-terms" aria-labelledby="bm-terms-title"><h2 class="serif" id="bm-terms-title">Conditions de l’offre</h2><ul class="campaign-terms">${TERMS.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>
  </main>`;
}

module.exports = { announceHTML, heroHTML, navLinks, offerCard, pageMainHTML, piecesHTML };
