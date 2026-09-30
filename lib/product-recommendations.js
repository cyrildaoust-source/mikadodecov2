// Règles communes des ventes associées. Shopify fournit les candidats ; ce module
// ne contient aucun handle de produit et ne fabrique jamais une compatibilité.
// Une relation fonctionnelle automatique n'est admise que si les deux pièces ont
// aussi une gamme ou un nom de modèle commun.

const MAX_RECOMMENDATIONS = 6;

function normalize(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ø/g, 'o').replace(/æ/g, 'ae')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const GENERIC_WORDS = new Set(normalize(`
  accessoire affiche aluminium ampoule applique assiette banc beige blanc bleu bois
  bougie bougeoir bureau canape carafe chaise chandelier coussin creme decoration
  diffuseur dore exterieur fauteuil galette gris housse interieur lampe lampadaire
  laiton marbre meuble miroir noir outdoor pied photophore plateau portable pouf
  recharge rouge suspension table tabouret tapis verre vert vase mural murale petit
  petite grand grande rond ronde set lot avec sans pour de du des la le les et a en
`).split(' '));

const BROAD_COLLECTION_WORDS = new Set(normalize(`
  accessoire accessoires assise assises catalogue chaise chaises decoration exterieur
  fauteuil fauteuils jardin luminaire luminaires mobilier nouveaute nouveautes outdoor
  promotion promotions rangement rangements siege sieges table tables
`).split(' '));

function words(value) { return normalize(value).split(' ').filter(Boolean); }
function phraseIn(text, phrase) { return (` ${normalize(text)} `).includes(` ${normalize(phrase)} `); }

function isDistinctive(term) {
  const ws = words(term);
  if (!ws.length || ws.every(w => GENERIC_WORDS.has(w))) return false;
  return ws.some(w => /[a-z]/.test(w) && (w.length >= 4 || /\d/.test(w)));
}

function collectionRefs(product) {
  return Array.isArray(product?.collectionRefs) ? product.collectionRefs.filter(Boolean) : [];
}

function selectRangeCollections(product) {
  const title = normalize(product?.name || product?.title);
  const vendor = normalize(product?.brand || product?.vendor);
  const tags = new Set((product?.tags || []).map(normalize));
  return collectionRefs(product).filter(collection => {
    const label = normalize(collection.title || collection.handle);
    if (!label || label === vendor || phraseIn(vendor, label) || phraseIn(label, vendor)) return false;
    const ws = words(label);
    if (!isDistinctive(label) || ws.every(w => BROAD_COLLECTION_WORDS.has(w))) return false;
    return phraseIn(title, label) || tags.has(label) || tags.has(normalize(collection.handle));
  }).slice(0, 2);
}

function identityTerms(product) {
  const title = normalize(product?.name || product?.title);
  const vendor = normalize(product?.brand || product?.vendor);
  const typeWords = new Set(words(product?.productType));
  const found = [];
  const add = value => {
    const term = normalize(value);
    if (!term || term === vendor || !isDistinctive(term) || found.includes(term)) return;
    found.push(term);
  };
  for (const collection of selectRangeCollections(product)) add(collection.title || collection.handle);
  for (const tag of product?.tags || []) if (phraseIn(title, tag)) {
    add(tag);
    // Les déclinaisons ajoutent parfois un suffixe au tag de gamme
    // (ch24-soft, toni-bankski). Le noyau reste utile pour retrouver le coussin
    // ou la recharge dont le tag s'arrête au nom de gamme commun.
    for (const word of words(tag)) if ((word.length >= 5 || /\d/.test(word)) && !GENERIC_WORDS.has(word)) add(word);
  }
  if (!found.length) {
    for (const word of words(title)) {
      if (!GENERIC_WORDS.has(word) && !typeWords.has(word) && !words(vendor).includes(word)) add(word);
      if (found.length >= 2) break;
    }
  }
  return found.slice(0, 3);
}

function recommendationSearchTerm(product) {
  return identityTerms(product).slice(0, 2).join(' ');
}

function role(product) {
  const value = normalize(`${product?.productType || ''} ${product?.name || product?.title || ''}`);
  if (/\b(housse|protection)\b/.test(value)) return 'seat-accessory';
  if (/\b(coussin|galette)\b/.test(value)) return 'seat-accessory';
  if (/\babat jour\b/.test(value)) return 'shade';
  if (/\bampoule\b/.test(value)) return 'bulb';
  if (/\b(rallonge|allonge|extension)\b/.test(value) && /\btable\b/.test(value)) return 'table-extension';
  if (/\brecharge\b/.test(value)) return 'refill';
  if (/\b(bougeoir|chandelier|photophore)\b/.test(value)) return 'candle-holder';
  if (/\bbougie\b/.test(value)) return 'candle';
  if (/\b(diffuseur|savon|parfum)\b/.test(value)) return 'refillable';
  if (/\b(chaise|fauteuil|banc|tabouret|pouf|canape|assise)\b/.test(value)) return 'seat';
  if (/\b(pied de lampe|lampe|lampadaire|suspension|applique|luminaire)\b/.test(value)) return 'lamp';
  if (/\btable\b/.test(value)) return 'table';
  return 'other';
}

const FUNCTIONAL_PAIRS = new Map([
  ['seat', new Set(['seat-accessory'])],
  ['seat-accessory', new Set(['seat'])],
  ['lamp', new Set(['shade', 'bulb'])],
  ['shade', new Set(['lamp'])],
  ['bulb', new Set(['lamp'])],
  ['table', new Set(['table-extension'])],
  ['table-extension', new Set(['table'])],
  ['refillable', new Set(['refill'])],
  ['refill', new Set(['refillable'])],
  ['candle-holder', new Set(['candle-holder', 'candle'])],
  ['candle', new Set(['candle-holder'])],
]);

function sameRange(product, candidate, rangeIds) {
  const ids = new Set((candidate?.recommendationCollectionIds || []).filter(Boolean));
  if ([...rangeIds].some(id => ids.has(id))) return true;
  if (normalize(product?.brand || product?.vendor) !== normalize(candidate?.brand || candidate?.vendor)) return false;
  const candidateText = `${candidate?.name || candidate?.title || ''} ${(candidate?.tags || []).join(' ')}`;
  return identityTerms(product).some(term => phraseIn(candidateText, term));
}

function functionalCompanion(product, candidate, rangeIds) {
  return sameRange(product, candidate, rangeIds) && Boolean(FUNCTIONAL_PAIRS.get(role(product))?.has(role(candidate)));
}

function valid(candidate, selfId) {
  return Boolean(candidate && candidate.id && candidate.id !== selfId && candidate.image && candidate.available === true && candidate.variantId);
}

function selectProductRecommendations({
  product,
  curatedComplementary = [], curatedRelated = [],
  range = [], searched = [], automaticComplementary = [], automaticRelated = [],
} = {}) {
  const seen = new Set([product?.id].filter(Boolean));
  const rangeIds = new Set(selectRangeCollections(product).map(c => c.id).filter(Boolean));
  const complementary = [], related = [];
  const add = (target, candidates, source, accept = () => true) => {
    for (const candidate of candidates || []) {
      if (target.length >= MAX_RECOMMENDATIONS) break;
      if (!valid(candidate, product?.id) || seen.has(candidate.id) || !accept(candidate)) continue;
      seen.add(candidate.id);
      target.push({ ...candidate, recommendationSource: source });
    }
  };

  // 1. Choix explicites Search & Discovery, dans leur rubrique respective.
  add(complementary, curatedComplementary, 'curated');
  add(related, curatedRelated, 'curated');
  // 2 et 3. Même gamme, puis relation fonctionnelle sûre au sein de cette gamme.
  add(complementary, [...range, ...searched], 'range-functional', candidate => functionalCompanion(product, candidate, rangeIds));
  add(related, [...range, ...searched], 'same-range', candidate => sameRange(product, candidate, rangeIds));
  // 4. Repli Shopify, seulement après les signaux explicites et déterministes.
  add(complementary, automaticComplementary, 'shopify-complementary');
  add(related, automaticRelated, 'shopify-related');

  return { complementary, related };
}

module.exports = {
  MAX_RECOMMENDATIONS, normalize, selectRangeCollections, identityTerms,
  recommendationSearchTerm, role, sameRange, functionalCompanion,
  selectProductRecommendations,
};
