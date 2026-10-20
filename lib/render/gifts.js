// Idées cadeaux et saison de Noël (ADR 0016) : rubriques de la page /collections/idees-cadeaux,
// bandeau de l'accueil. Ni message de saison dans la barre d'annonce, ni emballage cadeau (décisions de
// Cyril du 20 octobre 2026 : le lien « emballage offert » en tête de la barre était affreux, et l'emballage
// n'est pas un must — impossible pour les grosses pièces).
// Les réglages viennent de data/gift-ideas.json (page, toute l'année) et de lib/christmas.js
// (fenêtre de saison, bloc `noel` de data/campaigns.json). Aucun texte de saison hors fenêtre.
const giftIdeas = require('../../data/gift-ideas.json');
const { imageAtWidth, photoStyle } = require('../editorial-media');
const { active, badgeActive, config, exchangeOpen, now } = require('../christmas');
const { IN_STOCK } = require('../lead-time');
const { ogEscape: esc } = require('./og');

const HANDLE = giftIdeas.handle;
const BASE = '/collections/' + HANDLE;
const BANDS = giftIdeas.bands;
const pieces = n => `${n} pièce${n > 1 ? 's' : ''}`;
const bandKey = b => `${b.min ?? ''}|${b.max ?? ''}`;
// Une tuile = un point d'entrée : cliquer une tranche remplace la rubrique, et inversement (demande de Cyril du
// 13 octobre) ; combiner les deux se fait dans la barre de filtres, sous les tuiles.
function bandHref(b) {
  const q = new URLSearchParams();
  if (b.min != null) q.set('min', String(b.min));
  if (b.max != null) q.set('max', String(b.max));
  return BASE + (q.size ? '?' + q : '');
}
const bandActive = (b, state) => (state.min ?? null) === (b.min ?? null) && (state.max ?? null) === (b.max ?? null);
const categoryHref = (value) => BASE + '?category=' + encodeURIComponent(value);
const tileImage = (image) => image.startsWith('https://cdn.shopify.com/') ? imageAtWidth(image, 800) : image;

// Tranches de budget : cartes photo (mêmes cartes que « Nos familles » : dégradé bas→haut, titre serif en bas),
// la tranche active cerclée de bleu ; le nombre de pièces sous le titre.
function budgetSection(counts, state) {
  const tiles = BANDS.map((b, i) => `<a class="home-rc gift-band${bandActive(b, state) ? ' is-active' : ''}" href="${esc(bandHref(b))}#grille" data-chair-link data-gift-band="${esc(bandKey(b))}"${bandActive(b, state) ? ' aria-current="true"' : ''}><img class="home-rc__img editorial-photo" style="${photoStyle(b)}" src="${esc(tileImage(b.image))}" alt="" loading="lazy"><span class="home-rc__scrim" aria-hidden="true"></span><span class="home-rc__n">${esc(b.label)}</span>${Number.isInteger(counts[i]) ? `<span class="home-rc__count">${pieces(counts[i])}</span>` : ''}</a>`).join('');
  return `<section class="section wrap gift-discovery" aria-labelledby="gift-budget">
    <div class="home-railhead"><h2 class="serif" id="gift-budget">Par budget</h2></div>
    <div class="gift-bands">${tiles}</div>
  </section>`;
}
// Rubriques « Pour qui » (collègue, belle-maman, les animaux…) : seules celles qui ont des fiches sont montrées.
// `rubrics` = facettes de la page SANS filtre : une tuile est un point d'entrée, elle reste visible quand une
// tranche de budget est active (la cliquer remplace la tranche).
function recipientsSection(rubrics, state) {
  const counts = new Map((rubrics || []).map(c => [c.value, c.count]));
  // Une rubrique `season: true` (l'hôte du réveillon) n'apparaît qu'en saison de Noël.
  const shown = giftIdeas.categories.filter(c => (!c.season || active()) && (counts.get(c.value) > 0 || (state.category || []).includes(c.value)));
  if (!shown.length) return '';
  const tiles = shown.map(c => `<a class="home-rc${(state.category || []).includes(c.value) ? ' is-active' : ''}" href="${esc(categoryHref(c.value))}#grille" data-chair-link data-gift-cat="${esc(c.value)}"><img class="home-rc__img editorial-photo" style="${photoStyle(c)}" src="${esc(tileImage(c.image))}" alt="" loading="lazy"><span class="home-rc__scrim" aria-hidden="true"></span><span class="home-rc__n">${esc(c.label)}</span></a>`).join('');
  return `<section class="section wrap gift-discovery" aria-labelledby="gift-usage">
    <div class="home-railhead"><h2 class="serif" id="gift-usage">Pour qui</h2></div>
    <div class="home-rail gift-rail" data-famrail role="region" aria-labelledby="gift-usage">${tiles}</div>
  </section>`;
}
// Repères de saison : « Livré avant Noël », échange jusqu'au 31 janvier, carte cadeau.
function notesSection(giftCard, at) {
  const c = config();
  const notes = [];
  if (badgeActive(at)) notes.push(['Livré avant Noël', `Le repère « Livré avant Noël » apparaît sur les articles qui arrivent au plus tard le ${esc(c.deliveryByLabel)} si vous commandez aujourd'hui, d'après leur délai réel. Les pièces en stock partent en ${esc(IN_STOCK)} et se retirent en boutique sous 24 h.`]);
  if (exchangeOpen(at) && c.exchange) notes.push([`Échange jusqu'au ${esc(c.exchange.untilLabel)}`, `Pour tout cadeau acheté à partir du ${esc(c.exchange.fromLabel)} : échange ou avoir en boutique sur présentation du ticket ou de la confirmation de commande, hors promotions. En ligne, vous disposez de 14 jours pour changer d'avis.`]);
  if (giftCard?.handle) notes.push(['La carte cadeau', `Le montant de votre choix, envoyé par e-mail dès le paiement. <a href="/produit.html?handle=${encodeURIComponent(giftCard.handle)}">Offrir une carte cadeau</a>.`]);
  if (!notes.length) return '';
  return `<section class="section wrap gift-discovery" aria-label="Nos engagements pour vos cadeaux"><div class="gift-notes">${notes.map(([title, text]) => `<div class="gift-note"><h3 class="serif">${title}</h3><p>${text}</p></div>`).join('')}</div></section>`;
}
// Page rendue par le serveur (renderChairCatalog) : rubriques avant la grille, texte de saison sous le titre.
function renderGiftsPage(html, data, { counts = [], rubrics = null, giftCard = null, at = now() } = {}) {
  if (badgeActive(at)) html = html.replace(/<p data-plp-sub>[^<]*<\/p>/, () => `<p data-plp-sub>${esc(giftIdeas.seasonDescriptionBadge)}</p>`);
  if (data.state.page > 1) return html;                      // pages suivantes : la grille seule, comme Mobilier
  const sections = budgetSection(counts, data.state) + recipientsSection(rubrics || data.facets?.category, data.state) + notesSection(giftCard, at);
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
        <p class="home-band__s">${badgeActive(at) ? 'Des idées pour tous les budgets et pour tout le monde, livrées avant Noël quand le délai le permet.' : 'Des idées pour tous les budgets et pour tout le monde, de belle-maman aux collègues.'}</p>
        <div class="home-band__links">${BANDS.map(b => `<a class="btn btn--light" href="${esc(bandHref(b))}">${esc(b.label)}</a>`).join('')}<a class="btn btn--light" href="${BASE}">Toutes les idées cadeaux</a></div>
      </div>
    </div>
  </section>`;
}
// Navigation : « Idées cadeaux » avant Promotions, dans la barre et dans le tiroir mobile, TOUTE L'ANNÉE
// (décision de Cyril du 13 octobre 2026 : la page sert aussi hors Noël — anniversaires, crémaillères).
function navLinksHTML() {
  return { top: `<a href="${BASE}" class="nlink">Idées cadeaux</a>`, drawer: `<a class="drawer__link" href="${BASE}">Idées cadeaux</a>` };
}
module.exports = { BANDS, bandHref, homeGiftsHTML, navLinksHTML, renderGiftsPage };
