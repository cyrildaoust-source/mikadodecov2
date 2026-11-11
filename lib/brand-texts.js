// Textes des pages de marque (data/brand-texts.json, audit SEO du 10 novembre 2026).
// Le site retombait sur un sous-titre générique quand la description de la collection Shopify
// est vide : la marque n'avait ni texte ni description propre. Une description Shopify remplie
// passe toujours avant `intro` ; le bloc « À propos » s'affiche sous la grille, page 1 sans filtre.
const { brands } = require('../data/brand-texts.json');

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function brandText(handle) {
  return Object.hasOwn(brands, handle) ? brands[handle] : null;
}

function brandAboutHTML(handle) {
  const text = brandText(handle);
  if (!text?.paragraphs?.length) return '';
  const links = (text.links || []).map(link => `<a class="btn btn--light" href="${esc(link.href)}">${esc(link.label)}</a>`).join('');
  return `<section class="section wrap brand-about prose" aria-labelledby="brand-about-title">
    <h2 class="serif" id="brand-about-title">${esc(text.title)}</h2>
    ${text.paragraphs.map(p => `<p>${esc(p)}</p>`).join('\n    ')}${links ? `\n    <p class="brand-about__links">${links}</p>` : ''}
  </section>`;
}

// Ajoute le bloc juste avant la fin du contenu principal.
function injectBrandAbout(html, handle) {
  const block = brandAboutHTML(handle);
  return block && !html.includes('class="section wrap brand-about') ? html.replace('</main>', () => block + '\n</main>') : html;
}

module.exports = { brandAboutHTML, brandText, injectBrandAbout };
