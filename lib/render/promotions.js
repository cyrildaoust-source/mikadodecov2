// Page Promotions (ADR 0018) : au-dessus de la grille filtrable, les familles qui ont des promotions (tuiles photo
// avec le nombre réel de fiches) et les raccourcis par tranche de remise. Rien n'est rédigé à la main : tout vient de
// l'index (décision de Cyril du 16 octobre 2026, après le rejet de tuiles « offres » aux libellés inventés). Les photos
// des tuiles sont celles des familles du catalogue (data/catalog-landing.json), jamais celles des produits remisés
// (Cyril, 17 octobre : « c'est affreux à voir »).
const landing = require('../../data/catalog-landing.json');
const { imageAtWidth, photoStyle } = require('../editorial-media');
const { ogEscape: esc } = require('./og');

const BASE = '/collections/promotions';
const pieces = n => `${n} pièce${n > 1 ? 's' : ''}`;
const tileImage = image => (image && image.startsWith('https://cdn.shopify.com/') ? imageAtWidth(image, 800) : image || '');
const familyPhoto = value => landing.categories.find(c => c.handle === value) || null;

function familyTiles(tiles, state) {
  return tiles.map(t => {
    const on = (state.category || []).includes(t.value), photo = familyPhoto(t.value);
    if (!photo) return '';
    return `<a class="home-rc promo-family${on ? ' is-active' : ''}" href="${esc(BASE + '?category=' + t.value)}#grille" data-chair-link data-promo-cat="${esc(t.value)}"${on ? ' aria-current="true"' : ''}><img class="home-rc__img editorial-photo" style="${photoStyle(photo)}" src="${esc(tileImage(photo.image))}" alt="" loading="lazy"><span class="home-rc__scrim" aria-hidden="true"></span><span class="home-rc__n">${esc(t.label)}</span><span class="home-rc__count">${pieces(t.count)}</span></a>`;
  }).join('');
}
// Une tranche vide n'apparaît pas, sauf si elle est active (pour pouvoir la retirer).
function discountChips(bands, counts, state) {
  return bands.map((n, i) => ({ n, count: counts[i] ?? 0 })).filter(b => b.count > 0 || state.discount === b.n).map(b => {
    const on = state.discount === b.n;
    return `<a class="catalog-filters__band${on ? ' is-active' : ''}" href="${esc(BASE + '?discount=' + b.n)}#grille" data-chair-link data-promo-band="${b.n}"${on ? ' aria-current="true"' : ''}>−${b.n} % et plus<span class="promo-band__n">${b.count}</span></a>`;
  }).join('');
}
function renderPromotionsPage(html, data, { tiles = [], bands = [], counts = [] } = {}) {
  if (data.state.page > 1) return html;                      // pages suivantes : la grille seule
  const tilesHTML = familyTiles(tiles, data.state), chips = discountChips(bands, counts, data.state);
  if (!tilesHTML && !chips) return html;
  const section = `<section class="section wrap gift-discovery promo-discovery" aria-labelledby="promo-families">
    <div class="home-railhead"><h2 class="serif" id="promo-families">Par famille</h2></div>
    ${tilesHTML ? `<div class="promo-families">${tilesHTML}</div>` : ''}
    ${chips ? `<div class="promo-bands"><span class="promo-bands__label">Par remise</span>${chips}</div>` : ''}
  </section>`;
  return html.replace(/<section class="section wrap">(\s*<div class="grid-head chair-catalog__controls")/, (_m, head) => section + '<section class="section wrap catalog-section">' + head);
}

module.exports = { renderPromotionsPage };
