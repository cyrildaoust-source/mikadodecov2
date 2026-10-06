// Règles communes des ventes associées. Shopify fournit les candidats ; ce module
// ne contient aucun handle de produit et ne fabrique jamais une compatibilité.
// Une relation fonctionnelle automatique n'est admise que si les deux pièces ont
// aussi une gamme ou un nom de modèle commun. La seule exception est la composition
// d'une table : elle assemble des familles de produits, jamais des handles précis.

const MAX_RECOMMENDATIONS = 4;

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
  protection recharge rouge sol suspension table tabouret tapis verre vert vase mural murale petit
  petite grand grande rond ronde set lot avec sans pour de du des la le les et a en
`).split(' '));

const BROAD_COLLECTION_WORDS = new Set(normalize(`
  accessoire accessoires assise assises catalogue chaise chaises decoration exterieur
  fauteuil fauteuils jardin luminaire luminaires mobilier nouveaute nouveautes outdoor
  promotion promotions rangement rangements siege sieges table tables
`).split(' '));
const GENERIC_PRODUCT_TYPES = new Set(['accessoire', 'accessoires', 'objet', 'article']);

// Univers fonctionnels utilisés uniquement lorsque ni la curation, ni la gamme,
// ni le modèle n'ont rempli « Vous aimerez aussi ». Ce sont des types Shopify,
// jamais des produits : le catalogue peut évoluer sans modifier cette liste.
const UNIVERSE_TYPES = {
  'dining-seat': ['Chaise', 'Chaise avec accoudoirs', 'Chaise de bureau', 'Chaise enfant', 'Banc', 'Banc à manger', 'Tabouret'],
  seat: ['Chaise', 'Chaise avec accoudoirs', 'Chaise de bureau', 'Fauteuil', 'Banc', 'Tabouret'],
  'bar-seat': ['Chaise haute', 'Chaise de bar', 'Tabouret de bar', 'Tabouret haut'],
  'lounge-seat': ['Fauteuil', 'Fauteuil bas', 'Chaise longue', 'Canapé', 'Canapé-lit', 'Pouf', 'Repose-pieds'],
  'seat-accessory': ['Coussin', 'Galette', 'Housse de chaise', 'Housse de canapé', 'Housse de protection'],
  'dining-table': ['Table', 'Table à manger', 'Table à rallonge'],
  'bar-table': ['Table haute', 'Table de bar', 'Mange-debout'],
  'low-table': ['Table basse', "Table d'appoint", 'Bout de canapé'],
  'table-extension': ['Rallonge de table', 'Allonge de table'],
  lamp: ['Lampe', 'Lampe de table', 'Lampe de bureau', 'Lampe de chevet', 'Lampe baladeuse', 'Lampe portable', 'Lampadaire', 'Suspension', 'Applique', 'Applique et plafonnier', 'Guirlande', 'Tube lumineux', 'Lanterne'],
  'lamp-base': ['Pied de lampe', 'Lampe de table', 'Lampe'],
  shade: ['Abat-jour', 'Suspension', 'Pied de lampe'],
  bulb: ['Ampoule', 'Lampe', 'Suspension', 'Applique'],
  dishware: ['Assiette', 'Assiette plate', 'Assiette creuse', 'Bol', 'Bol de service', 'Saladier', 'Plat', 'Plat de service', 'Plat à gâteau'],
  drinkware: ['Verre', 'Verre à eau', 'Verre à vin', 'Verre à liqueur', 'Gobelet', 'Coupe', 'Flûte', 'Carafe', 'Pichet'],
  'drink-serveware': ['Carafe', 'Pichet', 'Verre', 'Verre à eau', 'Verre à vin', 'Verre à liqueur'],
  'table-linen': ['Nappe', 'Serviette', 'Set de table', 'Chemin de table', 'Rond de serviette'],
  'table-protector': ['Sous-plat', 'Dessous de plat', 'Sous-verre', 'Set de table'],
  'candle-holder': ['Bougeoir', 'Chandelier', 'Photophore', 'Bougie', 'Bougie conique'],
  candle: ['Bougie', 'Bougie parfumée', 'Bougie conique', 'Bougeoir', 'Chandelier', 'Photophore'],
  refillable: ['Diffuseur', 'Savon', 'Parfum', 'Bouquet parfumé', 'Vaporisateur de parfum', 'Concentré de parfum', 'Recharge'],
  refill: ['Recharge', 'Diffuseur', 'Savon', 'Parfum', 'Bouquet parfumé'],
  'wall-decor': ['Affiche', 'Miroir', 'Horloge', 'Décoration murale'],
  'decor-object': ['Vase', 'Vase de sol', 'Soliflore', 'Sculpture', 'Objet décoratif', 'Cube décoratif', 'Mobile', 'Sablier'],
  'floor-textile': ['Tapis'],
  'home-textile': ['Plaid', 'Couvre-lit', 'Ciel de lit'],
  'bath-textile': ['Essuie de main', 'Serviette de bain', 'Peignoir'],
  'entry-storage': ['Patère', 'Porte-manteau', 'Portemanteau mural', 'Étagère', 'Corniche', 'Butoir de porte', 'Support mural', 'Panier', 'Panier de rangement', 'Caisse de rangement', 'Boîte de rangement'],
  'garden-accessory': ['Arrosoir', 'Mangeoire à oiseaux', 'Jardinière', 'Brasero', 'Parasol'],
  'serving-accessory': ['Chariot', 'Desserte', 'Plateau', 'Présentoir'],
  'desk-space': ['Bureau', 'Tapis de souris', 'Sous-main', 'Aimant', 'Presse-papier'],
  'bar-accessory': ['Ouvre-bouteille', 'Décapsuleur', 'Tire-bouchon', 'Bouchon à vin', 'Shaker', 'Seau à glace', 'Doseur', 'Pilon', 'Cuillère à mélange'],
  'furniture-care': ['Chaise', 'Chaise avec accoudoirs', 'Fauteuil', 'Banc', 'Tabouret', 'Table', 'Table basse'],
};

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
  // Les petites pièces de protection portent souvent le modèle compatible
  // uniquement dans leurs tags (ex. patins pour une gamme de mobilier).
  if (role(product) === 'furniture-care') {
    for (const tag of product?.tags || []) add(tag);
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

function quoteSearch(value) {
  return `"${String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function productTypeSearch(types) {
  const unique = [...new Set((types || []).filter(type => type && !GENERIC_PRODUCT_TYPES.has(normalize(type))))];
  if (!unique.length) return NO_SCENE_QUERY;
  const clause = unique.map(type => `product_type:${quoteSearch(type)}`).join(' OR ');
  return `available_for_sale:true AND (${clause})`;
}

function role(product) {
  const type = normalize(product?.productType);
  const title = normalize(product?.name || product?.title);
  const tags = normalize((product?.tags || []).join(' '));
  const value = `${type} ${title}`.trim();
  if (GENERIC_PRODUCT_TYPES.has(type)) {
    if (/\b(bobeche|bougeoir|bougie|chandelier)\b/.test(`${title} ${tags}`)) return 'candle-holder';
    if (/\b(papeterie|bureau|architecte|outils)\b/.test(`${title} ${tags}`)) return 'desk-space';
    if (/\b(art de la table|arts de la table|bouchon a vin|accessoire de table)\b/.test(`${title} ${tags}`)) return 'dishware';
    if (/\b(rangement|etagere|tiroir|couvercle)\b/.test(`${title} ${tags}`)) return 'entry-storage';
    if (/\b(decoration|ceramiques|ornament|tirelire|sablier)\b/.test(`${title} ${tags}`)) return 'decor-object';
    if (/\b(patins?|protection sol|feutre)\b/.test(`${title} ${tags}`)) return 'furniture-care';
  }
  // Les types explicites passent avant le titre : une « Affiche Tabouret 60 »
  // reste une affiche et ne devient pas une assise à cause du nom du modèle.
  if (/\b(affiche|poster|miroir|horloge|decoration murale)\b/.test(type)) return 'wall-decor';
  if (/\b(vase|vase de sol|soliflore|sculpture|objet decoratif|cube decoratif|mobile|sablier)\b/.test(type)) return 'decor-object';
  if (/^tapis$/.test(type)) return 'floor-textile';
  if (/\b(plaid|couvre lit|ciel de lit)\b/.test(type)) return 'home-textile';
  if (/\b(essuie de main|serviette de bain|peignoir)\b/.test(type)) return 'bath-textile';
  if (/\b(patere|porte manteau|portemanteau mural|etagere|corniche|butoir de porte|support mural|panier|caisse de rangement|boite de rangement)\b/.test(type)) return 'entry-storage';
  if (/\b(arrosoir|mangeoire a oiseaux|jardiniere|brasero|parasol)\b/.test(type)) return 'garden-accessory';
  if (/\b(chariot|desserte|plateau|presentoir)\b/.test(type)) return 'serving-accessory';
  if (/^(bureau|tapis de souris|sous main|aimant|presse papier)$/.test(type)) return 'desk-space';
  if (/\b(ouvre bouteille|decapsuleur|tire bouchon|bouchon a vin|shaker|seau a glace|doseur|pilon|cuillere a melange)\b/.test(type)) return 'bar-accessory';
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
  if (/\bpied de lampe\b/.test(value)) return 'lamp-base';
  if (/\b(pied de lampe|lampe|lampadaire|suspension|applique|luminaire|guirlande|tube lumineux|lanterne)\b/.test(value)) return 'lamp';
  if (/\b(table basse|table d appoint|bout de canape)\b/.test(value)) return 'low-table';
  if (/\b(table haute|table de bar|mange debout)\b/.test(value)) return 'bar-table';
  if (/\btable\b/.test(value)) return 'dining-table';
  return 'other';
}

function universeSearchQueries(product) {
  const productType = String(product?.productType || '').trim();
  const universeTypes = UNIVERSE_TYPES[role(product)] || [];
  return {
    sameType: productTypeSearch(productType ? [productType] : []),
    sameUniverse: productTypeSearch(universeTypes),
  };
}

function universeKey(product) {
  const productRole = role(product);
  if (['dining-seat', 'seat'].includes(productRole)) return 'dining-seat';
  if (['lamp', 'lamp-base', 'shade', 'bulb'].includes(productRole)) return 'lighting';
  if (['drinkware', 'drink-serveware'].includes(productRole)) return 'drinkware';
  if (['dishware', 'table-linen', 'table-protector'].includes(productRole)) return 'tableware';
  if (['candle-holder', 'candle'].includes(productRole)) return 'candlelight';
  if (['refillable', 'refill'].includes(productRole)) return 'fragrance-care';
  return productRole === 'other' ? '' : productRole;
}

function sameUniverse(product, candidate) {
  const productType = normalize(product?.productType);
  const candidateType = normalize(candidate?.productType);
  if (productType && !GENERIC_PRODUCT_TYPES.has(productType) && productType === candidateType) return true;
  const productRole = role(product);
  const candidateRole = role(candidate);
  if (productRole === 'furniture-care') {
    return ['dining-seat', 'seat', 'lounge-seat', 'dining-table', 'low-table'].includes(candidateRole);
  }
  const productUniverse = universeKey(product);
  return Boolean(productUniverse && productUniverse === universeKey(candidate));
}

function universeRank(product, candidate) {
  const sameType = normalize(product?.productType) === normalize(candidate?.productType) ? 0 : 1;
  // La gamme exacte est déjà traitée avant ce filet. À pertinence égale, une
  // autre marque ouvre davantage la sélection au lieu de répéter le fabricant
  // de la fiche courante.
  const sameBrand = normalize(product?.brand || product?.vendor) === normalize(candidate?.brand || candidate?.vendor) ? 1 : 0;
  const sameSetting = isOutdoor(product) === isOutdoor(candidate) ? 0 : 1;
  return sameType * 100 + sameBrand * 10 + sameSetting;
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
  ['lamp-base', new Set(['shade', 'bulb'])],
  ['shade', new Set(['lamp', 'lamp-base'])],
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
  const sameBrand = normalize(product?.brand || product?.vendor) === normalize(candidate?.brand || candidate?.vendor) ? 1 : 0;
  const sameSetting = isOutdoor(product) === isOutdoor(candidate) ? 0 : 1;
  return sameModel * 100 + sameBrand * 10 + sameSetting;
}

function scenePreference(bucket, candidate) {
  const value = normalize(`${candidate?.productType || ''} ${candidate?.name || candidate?.title || ''}`);
  if (bucket === 'dishware') {
    if (/\bassiette\b/.test(value)) return 0;
    if (/\b(plat|saladier)\b/.test(value)) return 1;
    return 2;
  }
  if (bucket === 'textiles') {
    if (/\b(nappe|set de table|sous plat|dessous de plat)\b/.test(value)) return 0;
    return 1;
  }
  return 0;
}

function diverseSeating(entries) {
  const firstByKind = new Map();
  for (const entry of entries) if (!firstByKind.has(seatingKind(entry.candidate))) firstByKind.set(seatingKind(entry.candidate), entry);
  const preferred = ['chair', 'armchair', 'bench', 'stool'].flatMap(kind => firstByKind.has(kind) ? [firstByKind.get(kind)] : []);
  return [...preferred, ...entries.filter(entry => !preferred.includes(entry))];
}

function brandKey(candidate) {
  return normalize(candidate?.brand || candidate?.vendor);
}

// Tour de table stable : une première proposition par marque avant d'en
// reprendre une seconde. La marque de la fiche courante passe après les autres
// puisque les produits de sa gamme ont déjà été proposés en priorité.
function diverseBrands(candidates, product) {
  const queues = new Map();
  for (const candidate of candidates || []) {
    const key = brandKey(candidate) || `__sans-marque-${candidate?.id || queues.size}`;
    if (!queues.has(key)) queues.set(key, []);
    queues.get(key).push(candidate);
  }
  const currentBrand = brandKey(product);
  const keys = [...queues.keys()].sort((a, b) => Number(a === currentBrand) - Number(b === currentBrand));
  const result = [];
  while (keys.some(key => queues.get(key).length)) {
    for (const key of keys) {
      const candidate = queues.get(key).shift();
      if (candidate) result.push(candidate);
    }
  }
  return result;
}

// Regroupe les candidats par niveau de pertinence (0 = le plus proche), dans l'ordre.
function byTier(candidates, tierOf) {
  const tiers = new Map();
  for (const candidate of candidates || []) {
    const tier = tierOf(candidate);
    if (!tiers.has(tier)) tiers.set(tier, []);
    tiers.get(tier).push(candidate);
  }
  return [...tiers.keys()].sort((a, b) => a - b).map(tier => tiers.get(tier));
}

function valid(candidate, selfId) {
  return Boolean(candidate && candidate.id && candidate.id !== selfId && candidate.image && candidate.available === true && candidate.variantId);
}

function selectProductRecommendations({
  product,
  curatedComplementary = [], curatedRelated = [],
  range = [], searched = [], universe = [], scene = {}, automaticComplementary = [], automaticRelated = [],
} = {}) {
  const seen = new Set([product?.id].filter(Boolean));
  const rangeIds = new Set(selectRangeCollections(product).map(c => c.id).filter(Boolean));
  const complementary = [], related = [];
  const add = (target, candidates, source, accept = () => true, { maxItems = MAX_RECOMMENDATIONS, maxPerBrand = Infinity } = {}) => {
    let added = 0;
    for (const candidate of candidates || []) {
      if (target.length >= MAX_RECOMMENDATIONS || added >= maxItems) break;
      if (!valid(candidate, product?.id) || seen.has(candidate.id) || !accept(candidate)) continue;
      const key = brandKey(candidate);
      if (key && target.filter(item => brandKey(item) === key).length >= maxPerBrand) continue;
      seen.add(candidate.id);
      target.push({ ...candidate, recommendationSource: source });
      added++;
    }
  };
  // La pertinence passe avant la diversité : dans chaque niveau, d'abord une marque
  // après l'autre (deux cartes au plus par marque), puis le même niveau sans limite ;
  // le niveau suivant n'est utilisé que si le précédent est épuisé.
  const addDiverse = (target, candidates, source, tierOf, accept = () => true) => {
    for (const tier of byTier(candidates, tierOf)) {
      add(target, diverseBrands(tier, product), source, accept, { maxPerBrand: 2 });
      add(target, tier, source, accept);
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
    // Une rallonge dédiée passe avant la mise en scène. Une seule assise suffit :
    // les trois autres places composent la table au lieu d'aligner des chaises.
    add(complementary, functionalCandidates, 'range-functional', candidate =>
      functionalCompanion(product, candidate, rangeIds) && role(candidate) !== 'dining-seat', { maxItems: 2, maxPerBrand: 2 });

    const ranged = functionalCandidates
      .filter(candidate => functionalCompanion(product, candidate, rangeIds) && role(candidate) === 'dining-seat')
      .map((candidate, index) => ({ candidate, source: 'range-functional', index }));
    const sceneEntries = bucket => (scene?.[bucket] || [])
      .filter(candidate => sceneBucket(candidate) === bucket)
      .map((candidate, index) => ({ candidate, source: 'scene-composition', index }));
    const order = (entries, bucket) => entries.sort((a, b) =>
      contextualRank(product, a.candidate, rangeIds) - contextualRank(product, b.candidate, rangeIds)
      || scenePreference(bucket, a.candidate) - scenePreference(bucket, b.candidate)
      || a.index - b.index);
    const addQuota = (bucket, limit, entries) => {
      let count = complementary.filter(candidate => sceneBucket(candidate) === bucket).length;
      for (const entry of entries) {
        if (complementary.length >= MAX_RECOMMENDATIONS || count >= limit) break;
        if (entry.source === 'range-functional'
          && complementary.filter(candidate => candidate.recommendationSource === 'range-functional').length >= 2) continue;
        const before = complementary.length;
        add(complementary, [entry.candidate], entry.source, () => true, { maxPerBrand: 2 });
        if (complementary.length > before) count++;
      }
    };

    addQuota('seating', 1, diverseSeating(order([...ranged, ...sceneEntries('seating')], 'seating')));
    addQuota('dishware', 1, order(sceneEntries('dishware'), 'dishware'));
    addQuota('drinkware', 1, order(sceneEntries('drinkware'), 'drinkware'));
    if (isOutdoor(product)) addQuota('lighting', 1, order(sceneEntries('lighting'), 'lighting'));
    else addQuota('textiles', 1, order(sceneEntries('textiles'), 'textiles'));
  } else {
    add(complementary, functionalCandidates, 'range-functional', candidate => functionalCompanion(product, candidate, rangeIds), { maxItems: 2, maxPerBrand: 2 });
  }
  const sameSetting = candidate => (isOutdoor(product) === isOutdoor(candidate) ? 0 : 1);
  // Le repli complémentaire garde sa rubrique avant que le filet d'univers ne
  // puisse consommer le même produit dans « Vous aimerez aussi ».
  addDiverse(complementary, automaticComplementary, 'shopify-complementary', sameSetting);
  // Les compléments de la gamme (coussins, housses, abat-jour…) reprennent les places
  // encore libres : la limite de deux ne laisse jamais une rubrique à moitié vide, et
  // ces pièces restent dans « Ce qui va avec votre achat » plutôt que dans l'autre rubrique.
  if (role(product) !== 'dining-table') add(complementary, functionalCandidates, 'range-functional', candidate => functionalCompanion(product, candidate, rangeIds));
  // « Vous aimerez aussi » montre d'abord les autres pièces de la gamme ; ses accessoires
  // (housses, coussins…) viennent après, leur place naturelle étant « Complétez avec ».
  const isAccessory = candidate => /accessory|textile|shade|bulb/.test(role(candidate) || '');
  const rangeByPiece = [...range, ...searched].map((candidate, index) => ({ candidate, index }))
    .sort((a, b) => Number(isAccessory(a.candidate)) - Number(isAccessory(b.candidate)) || a.index - b.index)
    .map(item => item.candidate);
  const rangePiece = candidate => sameRange(product, candidate, rangeIds);
  add(related, rangeByPiece, 'same-range', rangePiece, { maxItems: 2, maxPerBrand: 2 });
  const remainingRangeSlots = Math.max(0, 2 - related.filter(candidate => candidate.recommendationSource === 'same-range').length);
  add(related, automaticRelated, 'shopify-same-range', rangePiece, { maxItems: remainingRangeSlots, maxPerBrand: 2 });
  // Même type puis même univers : filet déterministe pour que chaque fiche ait
  // une suite pertinente, y compris les produits absents de Search & Discovery.
  const universeCandidates = (universe || []).map((candidate, index) => ({ candidate, index }))
    .sort((a, b) => universeRank(product, a.candidate) - universeRank(product, b.candidate) || a.index - b.index)
    .map(item => item.candidate);
  const universeTier = candidate => (normalize(product?.productType) === normalize(candidate?.productType) ? 0 : 100) + sameSetting(candidate);
  const inUniverse = candidate => sameUniverse(product, candidate);
  // Même usage intérieur/extérieur d'abord ; puis la gamme complète ; l'autre usage en dernier.
  addDiverse(related, universeCandidates.filter(candidate => !sameSetting(candidate)), 'same-universe', universeTier, inUniverse);
  add(related, rangeByPiece, 'same-range', rangePiece);
  addDiverse(related, universeCandidates.filter(candidate => sameSetting(candidate)), 'same-universe', universeTier, inUniverse);
  // Repli Shopify RELATED, seulement après les signaux explicites et déterministes.
  addDiverse(related, automaticRelated, 'shopify-related', sameSetting);

  return { complementary, related };
}

module.exports = {
  MAX_RECOMMENDATIONS, normalize, selectRangeCollections, identityTerms,
  recommendationSearchTerm, role, sameRange, sameUniverse, universeSearchQueries,
  functionalCompanion, isOutdoor,
  sceneBucket, sceneSearchQueries,
  selectProductRecommendations,
};
