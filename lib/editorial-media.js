const collectionHeroes = require('../data/collection-heroes.json');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function position(value, fallback = '50% 50%') {
  return /^(?:100|\d{1,2})% (?:100|\d{1,2})%$/.test(value) ? value : fallback;
}

// Les réglages sont limités aux photos éditoriales, sans toucher aux cartes produit.
function photoStyle(photo = {}) {
  const desktop = position(photo.position);
  return `--photo-position:${desktop};--photo-position-mobile:${position(photo.mobilePosition, desktop)}`;
}

function imageAtWidth(image, width) {
  if (!image.startsWith('https://cdn.shopify.com/')) return image;
  const url = new URL(image);
  url.searchParams.set('width', width);
  url.searchParams.set('format', 'webp');
  return url.href;
}

function collectionHero(handle) {
  const photo = Object.hasOwn(collectionHeroes, handle) ? collectionHeroes[handle] : null;
  if (!photo) return null;
  const widths = [800, 1200, 1600, 2000].filter(width => width < photo.width);
  widths.push(photo.width);
  return {
    brand: false, editorial: true,
    srcset: widths.map(width => imageAtWidth(photo.image, width) + ' ' + width + 'w').join(', '),
    img: imageAtWidth(photo.image, Math.min(2000, photo.width)),
    width: photo.width, height: photo.height, alt: photo.alt,
    style: photoStyle(photo),
  };
}

function injectCollectionHero(html, hero) {
  if (!hero) return html;
  const seed = JSON.stringify(hero).replace(/</g, '\\u003c');
  return html.replace('<section class="subhero"', '<section class="subhero subhero--editorial"')
    .replace('<script type="application/json" id="collection-hero-initial">null</script>', () => '<script type="application/json" id="collection-hero-initial">' + seed + '</script>')
    .replace(/<!-- COLLECTION_HERO_NOSCRIPT -->\s*<noscript>[\s\S]*?<\/noscript>/, () =>
      `<noscript><img class="subhero__img editorial-photo" src="${escapeHtml(hero.img)}" srcset="${escapeHtml(hero.srcset)}" sizes="100vw" width="${hero.width}" height="${hero.height}" alt="${escapeHtml(hero.alt)}" fetchpriority="high" style="${escapeHtml(hero.style)}"></noscript>`);
}

module.exports = { collectionHeroes, collectionHero, injectCollectionHero, imageAtWidth, photoStyle };
