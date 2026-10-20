// Logos de marques. Les logos fournis en image (et non en dessin vectoriel) sont servis
// en PNG : un SVG qui emballe une image s'affichait mal sur iPhone (logo Volta invisible).
export const PNG_LOGOS = new Set(['addison-ross', 'airborne', 'artek', 'avolt', 'esteban', 'harto', 'kay-bojesen', 'lind-dna', 'normann-copenhagen', 'softline', 'volta-mobiles']);
export const brandLogoSrc = (slug) => `/images/brands/${slug}.${PNG_LOGOS.has(slug) ? 'png' : 'svg'}`;
// Marques dont le logo existe dans v3/images/brands (la fonction Vercel n'embarque pas les images : la
// liste vit ici et tests/brands-index.test.cjs la compare au dossier). Une marque absente affiche son nom
// (Linie Design : seul un monogramme existe, Cyril préfère le nom en toutes lettres — 20 octobre 2026).
export const LOGOS = new Set(["addison-ross","airborne","alessi","anglepoise","artek","assouline","avolt","blomus","carl-hansen-son","compagnie-de-provence","esteban","ester-erik","fatboy","ferm-living","fermob","harto","hay","hkliving","hoptimist","ichendorf-milano","iittala","kay-bojesen","lind-dna","marimekko","moustache","muuto","normann-copenhagen","pastoe","pols-potten","relaxound","remember","serax","softline","stoff-nagel","string-furniture","tiptoe","tradition","vitra","volta-mobiles"]);
export const hasBrandLogo = (slug) => LOGOS.has(slug);
