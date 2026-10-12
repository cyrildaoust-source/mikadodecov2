// Idées cadeaux et saison de Noël (ADR 0016) : rubriques de la page /collections/idees-cadeaux,
// bandeau de l'accueil, case « emballage cadeau » du panier et message de la barre d'annonce.
// Les réglages viennent de data/gift-ideas.json (page, toute l'année) et de lib/christmas.js
// (fenêtre de saison, bloc `noel` de data/campaigns.json). Aucun texte de saison hors fenêtre.
const giftIdeas = require('../../data/gift-ideas.json');
const { imageAtWidth, photoStyle } = require('../editorial-media');
const { active, config, exchangeOpen, giftWrapActive, now } = require('../christmas');
const { IN_STOCK } = require('../lead-time');
const { ogEscape: esc } = require('./og');

const HANDLE = giftIdeas.handle;
const BASE = '/collections/' + HANDLE;
const BANDS = giftIdeas.bands;
const pieces = n => `${n} pièce${n > 1 ? 's' : ''}`;
const bandKey = b => `${b.min ?? ''}|${b.max ?? ''}`;
function bandHref(b, category = '') {
  const q = new URLSearchParams();
  if (category) q.set('category', category);
  if (b.min != null) q.set('min', String(b.min));
  if (b.max != null) q.set('max', String(b.max));
  return BASE + (q.size ? '?' + q : '');
}
const bandActive = (b, state) => (state.min ?? null) === (b.min ?? null) && (state.max ?? null) === (b.max ?? null);
const categoryHref = (value, state) => { const q = new URLSearchParams(); q.set('category', value); if (state.min != null) q.set('min', String(state.min)); if (state.max != null) q.set('max', String(state.max)); return BASE + '?' + q; };
const tileImage = (image) => image.startsWith('https://cdn.shopify.com/') ? imageAtWidth(image, 800) : image;

// Tranches de budget : tuiles typographiques, la tranche active remplie en encre (même langage que la pagination).
function budgetSection(counts, state) {
  const tiles = BANDS.map((b, i) => `<a class="gift-band${bandActive(b, state) ? ' is-active' : ''}" href="${esc(bandHref(b, state.category?.[0] || ''))}#grille" data-chair-link data-gift-band="${esc(bandKey(b))}"${bandActive(b, state) ? ' aria-current="true"' : ''}><span class="gift-band__amount">${esc(b.label)}</span>${Number.isInteger(counts[i]) ? `<span class="gift-band__count">${pieces(counts[i])}</span>` : ''}</a>`).join('');
  return `<section class="section wrap gift-discovery" aria-labelledby="gift-budget">
    <div class="home-railhead"><h2 class="serif" id="gift-budget">Par budget</h2></div>
    <div class="gift-bands">${tiles}</div>
  </section>`;
}
// Rubriques « pour qui, pour quoi » : seules celles qui ont des fiches (facettes de la page) sont montrées.
function usageSection(facets, state) {
  const counts = new Map((facets?.category || []).map(c => [c.value, c.count]));
  const shown = giftIdeas.categories.filter(c => counts.get(c.value) > 0 || (state.category || []).includes(c.value));
  if (!shown.length) return '';
  const tiles = shown.map(c => `<a class="home-rc${(state.category || []).includes(c.value) ? ' is-active' : ''}" href="${esc(categoryHref(c.value, state))}#grille" data-chair-link data-gift-cat="${esc(c.value)}"><img class="home-rc__img editorial-photo" style="${photoStyle(c)}" src="${esc(tileImage(c.image))}" alt="" loading="lazy"><span class="home-rc__scrim" aria-hidden="true"></span><span class="home-rc__n">${esc(c.label)}</span></a>`).join('');
  return `<section class="section wrap gift-discovery" aria-labelledby="gift-usage">
    <div class="home-railhead"><h2 class="serif" id="gift-usage">Pour qui, pour quoi</h2></div>
    <div class="home-rail${shown.length <= 5 ? ' home-rail--fit' : ''}" data-famrail role="region" aria-labelledby="gift-usage">${tiles}</div>
  </section>`;
}
// Repères de saison : « Livré avant Noël », emballage offert, échange jusqu'au 31 janvier, carte cadeau.
function notesSection(giftCard, at) {
  const c = config();
  const notes = [];
  if (active(at)) {
    notes.push(['Livré avant Noël', `Le repère « Livré avant Noël » apparaît sur les articles qui arrivent au plus tard le ${esc(c.deliveryByLabel)} si vous commandez aujourd'hui, d'après leur délai réel. Les pièces en stock partent en ${esc(IN_STOCK)} et se retirent en boutique sous 24 h.`]);
    if (giftWrapActive(at)) notes.push(['Emballage cadeau offert', 'Cochez la case au panier : nous emballons vos cadeaux avec soin, comme en boutique.']);
  }
  if (exchangeOpen(at) && c.exchange) notes.push([`Échange jusqu'au ${esc(c.exchange.untilLabel)}`, `Pour tout cadeau acheté à partir du ${esc(c.exchange.fromLabel)} : échange ou avoir en boutique sur présentation du ticket ou de la confirmation de commande, hors promotions. En ligne, vous disposez de 14 jours pour changer d'avis.`]);
  if (giftCard?.handle) notes.push(['La carte cadeau', `Le montant de votre choix, envoyé par e-mail dès le paiement. <a href="/produit.html?handle=${encodeURIComponent(giftCard.handle)}">Offrir une carte cadeau</a>.`]);
  if (!notes.length) return '';
  return `<section class="section wrap gift-discovery" aria-label="Nos engagements pour vos cadeaux"><div class="gift-notes">${notes.map(([title, text]) => `<div class="gift-note"><h3 class="serif">${title}</h3><p>${text}</p></div>`).join('')}</div></section>`;
}
// Page rendue par le serveur (renderChairCatalog) : rubriques avant la grille, texte de saison sous le titre.
function renderGiftsPage(html, data, { counts = [], giftCard = null, at = now() } = {}) {
  if (active(at)) html = html.replace(/<p data-plp-sub>[^<]*<\/p>/, () => `<p data-plp-sub>${esc(giftIdeas.seasonDescription)}</p>`);
  if (data.state.page > 1) return html;                      // pages suivantes : la grille seule, comme Mobilier
  const sections = budgetSection(counts, data.state) + usageSection(data.facets, data.state) + notesSection(giftCard, at);
  return html.replace(/<section class="section wrap">(\s*<div class="grid-head chair-catalog__controls")/, (_m, head) => sections + '<section class="section wrap catalog-section">' + head);
}
// Accueil : bandeau pleine largeur pendant la saison, avec les tranches de budget.
function homeGiftsHTML(at = now()) {
  if (!active(at)) return '';
  const h = giftIdeas.home;
  const widths = [1280, 2000].filter(w => w < h.width).concat(Math.min(2400, h.width));
  return `<section class="reveal">
    <div class="home-band home-band--gifts">
      <img class="home-band__img editorial-photo" src="${esc(imageAtWidth(h.image, 2000))}" srcset="${esc(widths.map(w => imageAtWidth(h.image, w) + ' ' + w + 'w').join(', '))}" sizes="100vw" width="${h.width}" height="${h.height}" alt="${esc(h.alt)}" loading="lazy" style="${photoStyle(h)}" />
      <span class="home-band__scrim"></span>
      <div class="home-band__in wrap">
        <h2 class="home-band__t serif">Idées cadeaux</h2>
        <p class="home-band__s">Des pièces de design pour tous les budgets, livrées avant Noël quand le délai le permet. Emballage cadeau offert.</p>
        <div class="home-band__links">${BANDS.map(b => `<a class="btn btn--light" href="${esc(bandHref(b))}">${esc(b.label)}</a>`).join('')}<a class="btn btn--light" href="${BASE}">Toutes les idées cadeaux</a></div>
      </div>
    </div>
  </section>`;
}
// Panier : case « emballage cadeau offert » pendant la saison (lue par v3/pages/selection.js).
function giftWrapHTML(at = now()) {
  if (!giftWrapActive(at)) return '';
  return `<label class="sel-giftwrap" data-gift-wrap><input type="checkbox" data-gift-wrap-input /><span><strong>Emballage cadeau offert</strong> · nous emballons vos articles avec soin, comme en boutique.</span></label>`;
}
// Barre d'annonce : premier message pendant la saison.
function announcementHTML(at = now()) {
  if (!active(at)) return '';
  return `<span class="on"><a href="${BASE}">Idées cadeaux pour tous les budgets${giftWrapActive(at) ? ' · emballage offert' : ''}</a></span>`;
}

module.exports = { BANDS, announcementHTML, bandHref, giftWrapHTML, homeGiftsHTML, renderGiftsPage };
