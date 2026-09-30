// Règles communes des ventes associées. Shopify fournit les candidats ; ce module
// ne contient aucun handle de produit et ne fabrique jamais une compatibilité.
// Une relation fonctionnelle automatique n'est admise que si les deux pièces ont
// aussi une gamme ou un nom de modèle commun. La seule exception est la composition
// d'une table : elle assemble des familles de produits, jamais des handles précis.

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
  return ws.some(w => !GENERIC_WORDS.has(w) && /[a-z]/.test(w) && (w.length >= 4 || /\d/.test(w)));
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
    words(tag).forEach((word, index) => {
      if (((index === 0 && word.length >= 4) || word.length >= 5 || /\d/.test(word)) && !GENERIC_WORDS.has(word)) add(word);
    });
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
  const type = normalize(product?.productType);
  const title = normalize(product?.name || product?.title);
  const value = `${type} ${title}`.trim();
  if (/\b(housse|protection)\b/.test(value)) return 'seat-accessory';
  if (/\b(coussin|galette)\b/.test(value)) return 'seat-accessory';
  if (/\babat jour\b/.test(value)) return 'shade';
  if (/\bampoule\b/.test(value)) return 'bulb';
  if (/^(rallonge|allonge|extension)( de table)?$/.test(type) || /^(rallonge|allonge|extension)\b/.test(title) && !/^table\b/.test(type)) return 'table-extension';
  if (/\brecharge\b/.test(value)) return 'refill';
  if (/\b(bougeoir|chandelier|photophore)\b/.test(value)) return 'candle-holder';
  if (/\bbougie\b/.test(value)) return 'candle';
  if (/\b(diffuseur|savon|parfum)\b/.test(value)) return 'refillable';
  if (/\b(nappe|serviette|set de table|chemin de table)\b/.test(value)) return 'table-linen';
  if (/\b(sous plat|dessous de plat|trivet)\b/.test(value)) return 'table-protector';
  if (/\b(assiette|bol|saladier|plat de service|plat a gateau)\b/.test(value)) return 'dishware';
  if (/\b(pichet|carafe|decanter)\b/.test(value)) return 'drink-serveware';
  if (/\b(verre|gobelet|coupe|flute)\b/.test(value)) return 'drinkware';
  if (/\b(chaise longue|canape|sofa|pouf|fauteuil bas|fauteuil lounge|rocking|bascule|repose pieds)\b/.test(value)) return 'lounge-seat';
  if (/\b(chaise de bar|chaise haute|tabouret de bar|tabouret haut)\b/.test(value)) return 'bar-seat';
  if (/\b(chaise|banc|tabouret)\b/.test(value)) return 'dining-seat';
  if (/\b(fauteuil|assise)\b/.test(value)) return 'seat';
  if (/\b(pied de lampe|lampe|lampadaire|suspension|applique|luminaire)\b/.test(value)) return 'lamp';
  if (/\b(table basse|table d appoint|bout de canape)\b/.test(value)) return 'low-table';
  if (/\b(table haute|table de bar|mange debout)\b/.test(value)) return 'bar-table';
  if (/\btable\b/.test(value)) return 'dining-table';
  return 'other';
}

const FUNCTIONAL_PAIRS = new Map([
  // Une pièce qui complète réellement l'usage : les assises autour d'une table,
  // la table près des assises, puis les accessoires dédiés. La gamme commune
  // reste obligatoire dans functionalCompanion, y compris pour l'outdoor.
  ['dining-seat', new Set(['seat-accessory', 'dining-table'])],
  ['bar-seat', new Set(['seat-accessory', 'bar-table'])],
  ['lounge-seat', new Set(['seat-accessory', 'low-table'])],
  ['seat', new Set(['seat-accessory', 'dining-table', 'low-table'])],
  ['seat-accessory', new Set(['dining-seat', 'bar-seat', 'lounge-seat', 'seat'])],
  ['dining-table', new Set(['table-extension', 'dining-seat'])],
  ['bar-table', new Set(['bar-seat'])],
  ['low-table', new Set(['lounge-seat', 'seat'])],
  ['lamp', new Set(['shade', 'bulb'])],
  ['shade', new Set(['lamp'])],
  ['bulb', new Set(['lamp'])],
  ['table-extension', new Set(['dining-table'])],
  ['refillable', new Set(['refill'])],
  ['refill', new Set(['refillable'])],
  ['candle-holder', new Set(['candle-holder', 'candle'])],
  ['candle', new Set(['candle-holder'])],
  ['drinkware', new Set(['drink-serveware'])],
  ['drink-serveware', new Set(['drinkware'])],
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

function functionalRank(product, candidate) {
  if (role(product) !== 'dining-table') return 0;
  const value = normalize(`${candidate?.productType || ''} ${candidate?.name || candidate?.title || ''}`);
  if (/\bchaise\b/.test(value)) return 0;
  if (/\bbanc\b/.test(value)) return 1;
  if (/\btabouret\b/.test(value)) return 2;
  return 3;
}

function isOutdoor(product) {
  return (product?.tags || []).some(tag => /\b(exterieur|outdoor|jardin)\b/.test(normalize(tag)));
}

function sceneBucket(candidate) {
  const candidateRole = role(candidate);
  if (candidateRole === 'dining-seat') return 'seating';
  if (candidateRole === 'dishware') return 'dishware';
  if (candidateRole === 'drinkware' || candidateRole === 'drink-serveware') return 'drinkware';
  if (candidateRole === 'table-linen' || candidateRole === 'table-protector') return 'textiles';
  if (candidateRole === 'lamp' && isOutdoor(candidate)) return 'lighting';
  return null;
}

const NO_SCENE_QUERY = 'title:"__mikado_aucune_scene__"';

function sceneSearchQueries(product) {
  if (role(product) !== 'dining-table') return {
    includeTableScene: false,
    includeOutdoorLighting: false,
    sceneSeating: NO_SCENE_QUERY,
    sceneDishware: NO_SCENE_QUERY,
    sceneDrinkware: NO_SCENE_QUERY,
    sceneTextiles: NO_SCENE_QUERY,
    sceneLighting: NO_SCENE_QUERY,
  };
  const available = 'available_for_sale:true AND ';
  const outdoor = isOutdoor(product);
  return {
    includeTableScene: true,
    includeOutdoorLighting: outdoor,
    sceneSeating: available + '(product_type:Chaise OR product_type:"Chaise avec accoudoirs" OR product_type:Banc OR product_type:"Banc à manger")' + (outdoor ? ' AND tag:exterieur' : ''),
    sceneDishware: available + '(product_type:Assiette OR product_type:"Assiette creuse" OR product_type:Bol OR product_type:"Bol de service" OR product_type:Saladier OR product_type:"Plat de service")',
    sceneDrinkware: available + '(product_type:"Verre à eau" OR product_type:"Verre à vin" OR product_type:Verre OR product_type:Pichet OR product_type:Carafe)',
    sceneTextiles: available + '(product_type:"Set de table" OR product_type:Nappe OR product_type:Serviette OR title:"Sous-plat" OR title:"Dessous de plat")',
    sceneLighting: outdoor
      ? available + '(product_type:"Lampe baladeuse" OR product_type:"Lampe portable" OR product_type:"Lampe de table" OR product_type:Lampe OR product_type:Lanterne) AND tag:exterieur'
      : NO_SCENE_QUERY,
  };
}

function seatingKind(candidate) {
  const value = normalize(`${candidate?.productType || ''} ${candidate?.name || candidate?.title || ''}`);
  if (/\b(accoudoirs?|fauteuil)\b/.test(value)) return 'armchair';
  if (/\bbanc\b/.test(value)) return 'bench';
  if (/\btabouret\b/.test(value)) return 'stool';
  return 'chair';
}

function contextualRank(product, candidate, rangeIds) {
  const sameModel = sameRange(product, candidate, rangeIds) ? 0 : 1;
  const sameBrand = normalize(product?.brand || product?.vendor) === normalize(candidate?.brand || candidate?.vendor) ? 0 : 1;
  const sameSetting = isOutdoor(product) === isOutdoor(candidate) ? 0 : 1;
  return sameModel * 100 + sameBrand * 10 + sameSetting;
}

function diverseSeating(entries) {
  const firstByKind = new Map();
  for (const entry of entries) if (!firstByKind.has(seatingKind(entry.candidate))) firstByKind.set(seatingKind(entry.candidate), entry);
  const preferred = ['chair', 'armchair', 'bench', 'stool'].flatMap(kind => firstByKind.has(kind) ? [firstByKind.get(kind)] : []);
  return [...preferred, ...entries.filter(entry => !preferred.includes(entry))];
}

function valid(candidate, selfId) {
  return Boolean(candidate && candidate.id && candidate.id !== selfId && candidate.image && candidate.available === true && candidate.variantId);
}

function selectProductRecommendations({
  product,
  curatedComplementary = [], curatedRelated = [],
  range = [], searched = [], scene = {}, automaticComplementary = [], automaticRelated = [],
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
  const functionalCandidates = [...range, ...searched]
    .map((candidate, index) => ({ candidate, index }))
    .sort((a, b) => functionalRank(product, a.candidate) - functionalRank(product, b.candidate) || a.index - b.index)
    .map(item => item.candidate);
  if (role(product) === 'dining-table') {
    // Une rallonge dédiée passe avant la mise en scène. Les assises sont ensuite
    // limitées à deux et diversifiées (sans/avec accoudoirs, puis banc), afin de
    // laisser de la place à l'art de la table, au textile et à la lumière outdoor.
    add(complementary, functionalCandidates, 'range-functional', candidate =>
      functionalCompanion(product, candidate, rangeIds) && role(candidate) !== 'dining-seat');

    const ranged = functionalCandidates
      .filter(candidate => functionalCompanion(product, candidate, rangeIds) && role(candidate) === 'dining-seat')
      .map((candidate, index) => ({ candidate, source: 'range-functional', index }));
    const sceneEntries = bucket => (scene?.[bucket] || [])
      .filter(candidate => sceneBucket(candidate) === bucket)
      .map((candidate, index) => ({ candidate, source: 'scene-composition', index }));
    const order = entries => entries.sort((a, b) =>
      contextualRank(product, a.candidate, rangeIds) - contextualRank(product, b.candidate, rangeIds)
      || a.index - b.index);
    const addQuota = (bucket, limit, entries) => {
      let count = complementary.filter(candidate => sceneBucket(candidate) === bucket).length;
      for (const entry of entries) {
        if (complementary.length >= MAX_RECOMMENDATIONS || count >= limit) break;
        const before = complementary.length;
        add(complementary, [entry.candidate], entry.source);
        if (complementary.length > before) count++;
      }
    };

    addQuota('seating', 2, diverseSeating(order([...ranged, ...sceneEntries('seating')])));
    addQuota('dishware', 1, order(sceneEntries('dishware')));
    addQuota('drinkware', 1, order(sceneEntries('drinkware')));
    addQuota('textiles', 1, order(sceneEntries('textiles')));
    if (isOutdoor(product)) addQuota('lighting', 1, order(sceneEntries('lighting')));
  } else {
    add(complementary, functionalCandidates, 'range-functional', candidate => functionalCompanion(product, candidate, rangeIds));
  }
  add(related, [...range, ...searched], 'same-range', candidate => sameRange(product, candidate, rangeIds));
  add(related, automaticRelated, 'shopify-same-range', candidate => sameRange(product, candidate, rangeIds));
  // 4. Repli Shopify, seulement après les signaux explicites et déterministes.
  add(complementary, automaticComplementary, 'shopify-complementary');
  add(related, automaticRelated, 'shopify-related');

  return { complementary, related };
}

module.exports = {
  MAX_RECOMMENDATIONS, normalize, selectRangeCollections, identityTerms,
  recommendationSearchTerm, role, sameRange, functionalCompanion, isOutdoor,
  sceneBucket, sceneSearchQueries,
  selectProductRecommendations,
};
