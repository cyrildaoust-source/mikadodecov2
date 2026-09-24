// Logos de marques. Les logos fournis en image (et non en dessin vectoriel) sont servis
// en PNG : un SVG qui emballe une image s'affichait mal sur iPhone (logo Volta invisible).
export const PNG_LOGOS = new Set(['airborne', 'artek', 'avolt', 'esteban', 'lind-dna', 'volta-mobiles']);
export const brandLogoSrc = (slug) => `/images/brands/${slug}.${PNG_LOGOS.has(slug) ? 'png' : 'svg'}`;
