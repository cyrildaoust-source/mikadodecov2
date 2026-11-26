// Textes des pages de marque (data/brand-texts.json, audit SEO du 10 novembre 2026).
// Le site retombait sur un sous-titre générique quand la description de la collection Shopify
// est vide : la marque n'avait ni texte ni description propre. Une description Shopify remplie
// passe toujours avant `intro` ; le bloc « À propos » s'affiche sous le titre, page 1 sans filtre.
const { brands } = require('../data/brand-texts.json');

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function brandText(handle) {
  return Object.hasOwn(brands, handle) ? brands[handle] : null;
}

// Texte de la marque sous le titre (session marketing, 25 novembre 2026 ; auparavant sous la grille) : le
// premier paragraphe visible, la suite derrière « Lire la suite ». `override` = texte saisi dans Shopify
// (métaobjet texte_marque, lib/services/brand-editorial.js), prioritaire sur le fichier.
function brandAboutHTML(handle, override = null) {
  const file = brandText(handle);
  const paragraphs = override?.paragraphs?.length ? override.paragraphs : file?.paragraphs;
  if (!paragraphs?.length) return '';
  const title = override?.title || file?.title || '';
  const links = override?.paragraphs?.length ? '' : (file?.links || []).map(link => `<a class="btn btn--light" href="${esc(link.href)}">${esc(link.label)}</a>`).join('');
  const [first, ...rest] = paragraphs;
  const more = rest.length || links
    ? `\n    <details class="brand-about__more"><summary>Lire la suite</summary>${rest.map(p => `<p>${esc(p)}</p>`).join('')}${links ? `<p class="brand-about__links">${links}</p>` : ''}</details>`
    : '';
  return `<section class="wrap brand-about prose"${title ? ' aria-labelledby="brand-about-title"' : ' aria-label="À propos de la marque"'}>
    ${title ? `<h2 class="serif" id="brand-about-title">${esc(title)}</h2>\n    ` : ''}<p>${esc(first)}</p>${more}
  </section>`;
}

// Juste sous le titre : après le fil d'Ariane, avant la grille.
function injectBrandAbout(html, handle, override = null) {
  const block = brandAboutHTML(handle, override);
  const anchor = '<div class="wrap" data-breadcrumb></div>';
  return block && !html.includes('class="wrap brand-about') && html.includes(anchor) ? html.replace(anchor, () => anchor + '\n' + block) : html;
}

module.exports = { brandAboutHTML, brandText, injectBrandAbout };
