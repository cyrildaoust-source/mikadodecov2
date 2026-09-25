const collectionHeroes = require('../data/collection-heroes.json');
const brandHeroManifest = require('../data/brand-heroes.json');
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
  return editorialHero(photo);
}

function brandHero(handle, { includeCandidates = false } = {}) {
  const photo = Object.hasOwn(brandHeroManifest.heroes, handle)
    ? brandHeroManifest.heroes[handle]
    : null;
  if (!photo || (photo.status !== 'qualified' && !includeCandidates)) return null;
  if (photo.kind === 'local') {
    const root = `/images/brands/headers/${handle}`;
    return {
      brand: true,
      editorial: true,
      candidate: false,
      srcset: `${root}-1280.webp 1280w, ${root}-1920.webp 1920w, ${root}-2400.webp 2400w`,
      img: `${root}-1920.jpg`,
      width: photo.width,
      height: photo.height,
      alt: photo.alt,
      style: photoStyle(photo),
    };
  }
  const hero = editorialHero(photo);
  return hero ? { ...hero, brand: true, candidate: photo.status !== 'qualified' } : null;
}

function editorialHero(photo) {
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
  const dimensions = hero.width && hero.height ? ` width="${hero.width}" height="${hero.height}"` : '';
  return html.replace('<section class="subhero"', '<section class="subhero subhero--editorial"')
    .replace('<script type="application/json" id="collection-hero-initial">null</script>', () => '<script type="application/json" id="collection-hero-initial">' + seed + '</script>')
    .replace(/<!-- COLLECTION_HERO_NOSCRIPT -->\s*<noscript>[\s\S]*?<\/noscript>/, () =>
      `<noscript><img class="subhero__img editorial-photo" src="${escapeHtml(hero.img)}" srcset="${escapeHtml(hero.srcset)}" sizes="100vw"${dimensions} alt="${escapeHtml(hero.alt)}" fetchpriority="high" style="${escapeHtml(hero.style)}"></noscript>`);
}

module.exports = {
  brandHeroManifest,
  brandHero,
  collectionHeroes,
  collectionHero,
  editorialHero,
  injectCollectionHero,
  imageAtWidth,
  photoStyle,
};
