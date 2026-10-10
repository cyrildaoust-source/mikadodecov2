// Logos de marques. Les logos fournis en image (et non en dessin vectoriel) sont servis
// en PNG : un SVG qui emballe une image s'affichait mal sur iPhone (logo Volta invisible).
export const PNG_LOGOS = new Set(['addison-ross', 'airborne', 'artek', 'avolt', 'esteban', 'kay-bojesen', 'lind-dna', 'softline', 'volta-mobiles']);
export const brandLogoSrc = (slug) => `/images/brands/${slug}.${PNG_LOGOS.has(slug) ? 'png' : 'svg'}`;
