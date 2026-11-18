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
  longue longues basse basses haute hautes appoint
  accessoire affiche aluminium ampoule applique assiette banc beige blanc bleu bois
  bougie bougeoir bureau canape carafe chaise chandelier coussin creme decoration
  diffuseur dore exterieur fauteuil galette gris housse interieur lampe lampadaire
  laiton marbre meuble miroir noir outdoor pied photophore plateau portable pouf
  protection recharge rouge sol suspension table tabouret tapis verre vert vase mural murale petit
  petite grand grande rond ronde set lot avec sans pour de du des la le les et a en
  enfant enfants kid kids junior bebe
  couvert couverts cuillere cuilleres cuiller fourchette fourchettes couteau couteaux menagere dessert cafe service
  ceramique ceramiques ceramic gres porcelaine faience velours velvet corduroy boucle lin linen laine wool coton cotton
  cuir leather teck teak chene oak noyer walnut frene hetre rotin bambou bamboo acier steel inox metal tissu fabric
  smooth speckled mat brillant gloss emaille
  tres extra xs xl xxl mini moyen moyenne large small medium
  element elements place places module accoudoir accoudoirs droit droite gauche central centrale angle extremite meridienne
`).split(' '));

const CAMPAIGN_COLLECTION = /black-?month|black-?friday|cyber|promo|solde|cadeau|noel|christmas|nouveaute|en-stock|offre|outlet|destockage|selection|best-?sel|exclusi|saint-valentin|fete/;
const BROAD_COLLECTION_WORDS = new Set(normalize(`
  accessoire accessoires assise assises catalogue chaise chaises decoration exterieur
  fauteuil fauteuils jardin luminaire luminaires mobilier nouveaute nouveautes outdoor
  promotion promotions rangement rangements siege sieges table tables
  terrasse terrasses balcon balcons interieur interieurs salon salons sejour salle manger chambre chambres
  cuisine cuisines entree entrees bain enfant enfants piece pieces bureau bureaux maison
  longue longues basse basses haute hautes bar bars appoint basique basiques lampe lampes suspension suspensions
  lampadaire lampadaires applique appliques canape canapes tabouret tabourets banc bancs vase vases tapis coussin coussins
  art arts vaisselle assiette assiettes bol bols plat plats verre verres carafe carafes mug mugs tasse tasses cafe the
  couvert couverts cuillere cuilleres fourchette fourchettes couteau couteaux ustensile ustensiles service textile textiles
  linge bougie bougies bougeoir bougeoirs objet objets cadre cadres miroir miroirs jouet jouets jeu jeux
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
  'decor-object': ['Vase', 'Vase de sol', 'Soliflore', 'Sculpture', 'Objet décoratif', 'Cube décoratif', 'Mobile', 'Sablier', 'Centre de table', 'Figurine', 'Miniature'],
  cup: ['Tasse', 'Tasse à café', 'Tasse à thé', 'Tasse à cappuccino', 'Tasse à espresso', 'Mug', 'Mug à cappuccino', 'Sous-tasse', 'Soucoupe'],
  cookware: ['Marmite', 'Casserole', 'Faitout', 'Poêle', 'Poêle à griller', 'Cocotte', 'Sauteuse', 'Wok', 'Plat à four'],
  pet: ['Laisse', 'Harnais', 'Collier', 'Gamelle', 'Panier pour chien', 'Jouet pour chien'],
  toy: ['Jouet à empiler', 'Jouet d’éveil', 'Jeu de construction', 'Jeu d’imitation', 'Jeu de pêche', 'Puzzle', 'Hochet', 'Peluche', 'Poupées gigognes', 'Maison de poupée', 'Mobilier de poupée', 'Cheval à bascule'],
  cutlery: ['Couverts', 'Service de couverts', 'Couverts de service', 'Couverts de salade', 'Couverts à salade', 'Cuillère', 'Cuillère de table',
    'Cuillère à dessert', 'Cuillère à café', 'Cuillère à moka', 'Cuillère de service', 'Fourchette', 'Fourchette de table', 'Fourchette à dessert',
    'Couteau', 'Couteau de table', 'Couteau à dessert', 'Couteau à beurre', 'Couteau à fromage', 'Pelle à tarte', 'Pelle à gâteau', 'Louche'],
  'floor-textile': ['Tapis'],
  'home-textile': ['Plaid', 'Couvre-lit', 'Ciel de lit'],
  'bath-textile': ['Essuie de main', 'Essuie de bain', 'Serviette de bain', 'Serviette de toilette', 'Serviette hammam', 'Serviette de plage', 'Serviette', 'Drap de bain', 'Peignoir'],
  'entry-storage': ['Patère', 'Porte-manteau', 'Portemanteau mural', 'Étagère', 'Corniche', 'Butoir de porte', 'Support mural', 'Panier', 'Panier de rangement', 'Caisse de rangement', 'Boîte de rangement'],
  'garden-accessory': ['Arrosoir', 'Mangeoire à oiseaux', 'Jardinière', 'Brasero', 'Parasol'],
  'serving-accessory': ['Chariot', 'Desserte', 'Plateau', 'Présentoir'],
  'desk-space': ['Bureau', 'Tapis de souris', 'Sous-main', 'Aimant', 'Presse-papier'],
  'bar-accessory': ['Ouvre-bouteille', 'Décapsuleur', 'Tire-bouchon', 'Bouchon à vin', 'Shaker', 'Seau à glace', 'Doseur', 'Pilon', 'Cuillère à mélange'],
  'furniture-care': ['Chaise', 'Chaise avec accoudoirs', 'Fauteuil', 'Banc', 'Tabouret', 'Table', 'Table basse'],
};

function words(value) { return normalize(value).split(' ').filter(Boolean); }
function phraseIn(text, phrase) { return (` ${normalize(text)} `).includes(` ${normalize(phrase)} `); }

// Une cote (« H44 », « 30cm ») n'est pas un nom de modèle (18 novembre 2026 : une lampe H44
// « de la même collection » qu'une table d'appoint H44). « VP1 », « CH24 » ou « 60 » le restent.
const DIMENSION_WORD = /^([hlpwd]\d+|\d+(cm|mm|cl|l))$/;
function isDistinctive(term) {
  const ws = words(term);
  if (!ws.length || ws.every(w => GENERIC_WORDS.has(w))) return false;
  return ws.some(w => !GENERIC_WORDS.has(w) && !DIMENSION_WORD.test(w) && /[a-z]/.test(w) && (w.length >= 4 || /\d/.test(w)));
}
const singular = word => word.replace(/(s|x)$/, '');
// Le nom du rayon (« Porte-rouleaux », « Abat-jours ») répète le type du produit : ce n'est pas une gamme.
function isTypeLabel(label, product) {
  const typeWords = new Set(words(product?.productType).map(singular));
  return words(label).every(w => w.length <= 2 || typeWords.has(singular(w)) || BROAD_COLLECTION_WORDS.has(w) || GENERIC_WORDS.has(w));
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
    // Collections d'opération (Black Month, promotions, idées cadeaux…) : un regroupement commercial, pas une
    // gamme (18 novembre 2026 : la chaise Panton proposait des pièces Fermob « de la même collection »).
    if (CAMPAIGN_COLLECTION.test(normalize(collection.handle || label).replace(/ /g, '-'))) return false;
    // Une collection au nom du créateur (« Eames ») n'est pas une gamme : ses pièces vont dans « Autres
    // créations de … », pas dans « De la même collection » (18 novembre 2026).
    const designerWords = new Set(words(product?.designer));
    if (designerWords.size && words(label).every(w => designerWords.has(w))) return false;
    const ws = words(label);
    if (!isDistinctive(label) || ws.every(w => w.length <= 2 || BROAD_COLLECTION_WORDS.has(w))) return false;   // « salle à manger »
    if (isTypeLabel(label, product)) return false;
    return phraseIn(title, label) || tags.has(label) || tags.has(normalize(collection.handle));
  }).slice(0, 2);
}

function identityTerms(product) {
  const title = normalize(product?.name || product?.title);
  const vendor = normalize(product?.brand || product?.vendor);
  const typeWords = new Set(words(product?.productType));
  const designerWords = new Set(words(product?.designer));
  const found = [];
  const add = value => {
    const term = normalize(value);
    if (!term || term === vendor || !isDistinctive(term) || found.includes(term)) return;
    if (designerWords.size && words(term).every(w => designerWords.has(w))) return;   // « eames » = le créateur, pas la gamme
    if (isTypeLabel(term, product)) return;   // « porte rouleau » = le type
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

// Le rôle d'une carte de l'index ne change pas : mémorisé (les alternatives parcourent tout le catalogue).
const roleMemo = new WeakMap();
function role(product) {
  if (!product || typeof product !== 'object') return computeRole(product);
  if (!roleMemo.has(product)) roleMemo.set(product, computeRole(product));
  return roleMemo.get(product);
}
function computeRole(product) {
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
  if (/\b(vase|vase de sol|soliflore|sculpture|objet decoratif|cube decoratif|mobile|sablier|centre de table|figurine|miniature)\b/.test(type)) return 'decor-object';
  if (/^(tasse|tasses|mug|mugs|sous tasse|soucoupe)\b/.test(type)) return 'cup';
  if (/^(marmite|casserole|faitout|poele|cocotte|sauteuse|wok|plat a four)\b/.test(type)) return 'cookware';
  if (/^(laisse|harnais|collier|gamelle|panier pour chien|coussin pour chien|jouet pour chien)\b/.test(type)) return 'pet';
  if (/^(jouet|jouets|puzzle|hochet|peluche|poupee|poupees|maison de poupee|mobilier de poupee|jeu|cheval a bascule|tapis de jeu|cabane de jeu)\b/.test(type)) return 'toy';
  if (/^tapis$/.test(type)) return 'floor-textile';
  if (/\b(plaid|couvre lit|ciel de lit)\b/.test(type)) return 'home-textile';
  if (/\b(essuie de main|essuie de bain|serviette de bain|serviette de toilette|serviette hammam|serviette de plage|serviette d invite|drap de bain|tapis de bain|gant de toilette|peignoir)\b/.test(type)) return 'bath-textile';
  // « Serviette » seule : de bain si le titre le dit (invité, toilette, hammam…), sinon de table.
  if (/^serviettes?$/.test(type) && /\b(invite|toilette|bain|hammam|plage|essuie)\b/.test(title)) return 'bath-textile';
  if (/\b(patere|porte manteau|portemanteau mural|etagere|corniche|butoir de porte|support mural|panier|caisse de rangement|boite de rangement)\b/.test(type)) return 'entry-storage';
  if (/\b(arrosoir|mangeoire a oiseaux|jardiniere|brasero|parasol)\b/.test(type)) return 'garden-accessory';
  if (/\b(chariot|desserte|plateau|presentoir)\b/.test(type)) return 'serving-accessory';
  if (/^(bureau|tapis de souris|sous main|aimant|presse papier)$/.test(type)) return 'desk-space';
  if (/\b(ouvre bouteille|decapsuleur|tire bouchon|bouchon a vin|shaker|seau a glace|doseur|pilon|cuillere a melange)\b/.test(type)) return 'bar-accessory';
  // Les couverts avant les tables : un « Couteau de table » n'est pas une table (18 novembre 2026).
  if (/^(couverts?|service de couverts|cuilleres?|cuiller|fourchettes?|couteaux?|pelle a (gateau|tarte|fromage)|louche|menagere)\b/.test(type)) return 'cutlery';
  // Un type explicite prime : un « Canapé … housse amovible » reste un canapé (18 novembre 2026).
  const accessoryText = type && !GENERIC_PRODUCT_TYPES.has(type) ? type : value;
  if (/\b(housse|protection)\b/.test(accessoryText)) return 'seat-accessory';
  if (/\b(coussin|galette)\b/.test(accessoryText)) return 'seat-accessory';
  if (/\babat jour\b/.test(value)) return 'shade';
  if (/\bampoule\b/.test(value)) return 'bulb';
  if (/^(rallonge|allonge|extension)( de table)?$/.test(type) || /^(rallonge|allonge|extension)\b/.test(title) && !/^table\b/.test(type)) return 'table-extension';
  if (/\brecharge\b/.test(value)) return 'refill';
  if (/\b(bougeoir|chandelier|photophore)\b/.test(value)) return 'candle-holder';
  if (/\bbougie\b/.test(value)) return 'candle';
  if (/\b(diffuseur|savon|parfum)\b/.test(value)) return 'refillable';
  if (/\b(nappe|serviette|set de table|chemin de table)\b/.test(value)) return 'table-linen';
  if (/\b(sous plat|dessous de plat|trivet)\b/.test(value)) return 'table-protector';
  if (/\b(assiette|bol|saladier|plat de service|plat a gateau|service de table)\b/.test(value)) return 'dishware';
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

// Mobilier enfant : une table enfant appelle des assises enfant, et une chaise adulte
// ne propose pas une chaise junior (18 novembre 2026 : chaise de bureau sous la table Aalto H60).
const KIDS_FURNITURE_TYPES = ['Table enfant', 'Chaise enfant', 'Tabouret enfant', 'Fauteuil enfant', 'Banc enfant', 'Pouf enfant'];
const FURNITURE_ROLES = new Set(['dining-seat', 'seat', 'bar-seat', 'lounge-seat', 'dining-table', 'bar-table', 'low-table']);
function isKids(product) {
  if ((product?.tags || []).some(tag => /^(enfant|enfants|mobilier enfant|mobilier design enfant|chambre enfant)$/.test(normalize(tag)))) return true;
  return /\b(enfant|enfants|kid|kids|junior|bebe)\b/.test(normalize(`${product?.productType || ''} ${product?.name || product?.title || ''}`));
}
function kidsMismatch(product, candidate) {
  return FURNITURE_ROLES.has(role(product)) && FURNITURE_ROLES.has(role(candidate)) && isKids(product) !== isKids(candidate);
}

function universeSearchQueries(product) {
  const productType = String(product?.productType || '').trim();
  const universeTypes = UNIVERSE_TYPES[role(product)] || [];
  const kids = FURNITURE_ROLES.has(role(product)) && isKids(product);
  const scoped = query => (kids && query !== NO_SCENE_QUERY ? `${query} AND tag:enfant` : query);
  return {
    sameType: scoped(productTypeSearch(productType ? [productType] : [])),
    sameUniverse: scoped(productTypeSearch(kids ? [...universeTypes, ...KIDS_FURNITURE_TYPES] : universeTypes)),
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
  // Même type, mais aussi même rôle : une « Serviette » d'invité n'est pas une serviette de table.
  if (productType && !GENERIC_PRODUCT_TYPES.has(productType) && productType === candidateType && role(product) === role(candidate)) return true;
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

// Nom de modèle : le premier mot qui n'est ni le type ni un mot courant (« Aalto », « Conical », « Nomad »).
function modelWord(item) {
  const typeWords = new Set(words(item?.productType));
  return words(item?.name || item?.title).find(w => !typeWords.has(w) && !GENERIC_WORDS.has(w) && !DIMENSION_WORD.test(w) && w.length > 2) || '';
}
function modelKey(item) {
  return `${normalize(item?.brand || item?.vendor)} ${modelWord(item) || item?.id || ''}`;
}
// Même marque, même type, même modèle : une autre taille ou finition de la même gamme, même quand la gamme
// porte le nom du créateur (table enfant Aalto, 18 novembre 2026).
function sameModel(product, candidate) {
  const word = modelWord(product);
  return Boolean(word) && normalize(product?.brand || product?.vendor) === normalize(candidate?.brand || candidate?.vendor)
    && normalize(product?.productType) === normalize(candidate?.productType) && modelWord(candidate) === word;
}

function sameRange(product, candidate, rangeIds) {
  // Une gamme appartient à une marque : une collection partagée par plusieurs marques est un rayon,
  // pas une gamme (18 novembre 2026 : une bouteille Ichendorf « de la même collection » qu'une assiette HAY).
  if (normalize(product?.brand || product?.vendor) !== normalize(candidate?.brand || candidate?.vendor)) return false;
  const ids = new Set((candidate?.recommendationCollectionIds || []).filter(Boolean));
  if ([...rangeIds].some(id => ids.has(id))) return true;
  if (sameModel(product, candidate)) return true;
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
  if (candidateRole === 'dishware' || candidateRole === 'cutlery') return 'dishware';
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
  if (isKids(product)) return {
    // Table enfant : des assises et un service de table d'enfant, pas des verres à vin.
    includeTableScene: true,
    includeOutdoorLighting: false,
    sceneSeating: available + '(product_type:Chaise OR product_type:"Chaise enfant" OR product_type:Tabouret OR product_type:"Tabouret enfant" OR product_type:Banc OR product_type:"Banc enfant") AND tag:enfant',
    sceneDishware: available + '(product_type:"Service de table" OR product_type:Couverts) AND tag:enfant',
    sceneDrinkware: NO_SCENE_QUERY,
    sceneTextiles: NO_SCENE_QUERY,
    sceneLighting: NO_SCENE_QUERY,
  };
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

// Une assise et une table ne vont ensemble que si elles sont toutes deux pliantes, ou
// toutes deux fixes (demande du 7 octobre : une chaise Palissade avec une table fixe,
// pas avec une table Bistro pliante). Les tags « pliante » portent l'information.
const SEAT_ROLES = new Set(['dining-seat', 'seat', 'bar-seat', 'lounge-seat']);
const TABLE_ROLES = new Set(['dining-table', 'bar-table', 'low-table']);
function isFolding(product) {
  return /\b(pliant|pliante|pliants|pliantes|pliable|chaise pliante|table pliante)\b/.test(normalize(`${(product?.tags || []).join(' ')} ${product?.name || product?.title || ''}`));
}
function foldingMismatch(product, candidate) {
  const a = role(product), b = role(candidate);
  const pair = (SEAT_ROLES.has(a) && TABLE_ROLES.has(b)) || (TABLE_ROLES.has(a) && SEAT_ROLES.has(b));
  return pair && isFolding(product) !== isFolding(candidate);
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
      if (target === complementary && source !== 'curated' && foldingMismatch(product, candidate)) continue;
      if (source !== 'curated' && kidsMismatch(product, candidate)) continue;
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
  // « Vous aimerez aussi » ouvre la sélection (demande du 7 octobre) : deux pièces de la
  // gamme au plus, même choisies à la main ; « Complétez avec » montre déjà la gamme.
  const inRange = candidate => sameRange(product, candidate, rangeIds);
  const rangeInRelated = () => related.filter(inRange).length;
  add(related, curatedRelated, 'curated', candidate => !inRange(candidate) || rangeInRelated() < 2);
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

    addQuota('seating', isKids(product) ? 2 : 1, diverseSeating(order([...ranged, ...sceneEntries('seating')], 'seating')));
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
  // « De la même collection » (18 novembre 2026) : les autres pièces de la gamme ont leur rubrique ;
  // « Vous aimerez aussi » ne montre plus que des alternatives.
  const sameRangeList = [];
  add(sameRangeList, rangeByPiece, 'same-range', rangePiece);
  add(sameRangeList, automaticRelated, 'shopify-same-range', rangePiece);
  // Même type puis même univers : filet déterministe pour que chaque fiche ait
  // une suite pertinente, y compris les produits absents de Search & Discovery.
  const universeCandidates = (universe || []).map((candidate, index) => ({ candidate, index }))
    .sort((a, b) => universeRank(product, a.candidate) - universeRank(product, b.candidate) || a.index - b.index)
    .map(item => item.candidate);
  const universeTier = candidate => (normalize(product?.productType) === normalize(candidate?.productType) ? 0 : 100) + sameSetting(candidate);
  const inUniverse = candidate => sameUniverse(product, candidate);
  // Même usage intérieur/extérieur d'abord ; puis la gamme complète ; l'autre usage en dernier.
  // Les déclinaisons de la gamme restent dans leur rubrique : ici, seulement d'autres modèles.
  const alternative = candidate => inUniverse(candidate) && !rangePiece(candidate);
  addDiverse(related, universeCandidates.filter(candidate => !sameSetting(candidate)), 'same-universe', universeTier, alternative);
  addDiverse(related, universeCandidates.filter(candidate => sameSetting(candidate)), 'same-universe', universeTier, alternative);
  // Repli Shopify RELATED, seulement après les signaux explicites et déterministes, et dans le même univers
  // (18 novembre 2026 : une figurine proposée sous une suspension, un set de table sous une chaise longue).
  addDiverse(related, automaticRelated, 'shopify-related', sameSetting, alternative);

  return { complementary, sameRange: sameRangeList, related };
}

// Autres créations du créateur de la fiche : des pièces de types différents d'abord (pas quatre variantes
// de la même chaise), jamais une pièce déjà proposée ailleurs sur la fiche.
// Créateur = la marque ou son studio (« Studio Fermob », « HAY ») : pas une signature, pas de rubrique.
function designerIsBrand(product) {
  const brandWords = words(product?.brand || product?.vendor);
  const designerWords = words(product?.designer).filter(w => w !== 'studio' && w !== 'design' && w !== 'team');
  return Boolean(brandWords.length) && designerWords.every(w => brandWords.includes(w));
}

// Carte allégée : la page reçoit ces cartes dans ses données, sans texte de description ni index de recherche.
function lightCard(card, source) {
  const { description: _text, search: _search, ...rest } = card;
  return { ...rest, variants: (rest.variants || []).map(({ search: _s, searchWords: _w, ...v }) => v), recommendationSource: source };
}

const STYLE_TAG = /^(scandinave|contemporain|minimaliste|intemporel|vintage|retro|boheme|industriel|art deco|mid century|annees \d+|design \w+|fait main|made in \w+)$/;
// Alternatives lues dans tout le catalogue (index en mémoire) : même univers, autre gamme, même usage,
// classées par type identique, prix proche et style commun — et non plus les mêmes meilleures ventes
// sur toutes les fiches (18 novembre 2026 : les quatre mêmes vases sous chaque vase).
function similarPieces(product, cards, limit = 12) {
  const price = Number(product?.price) || 0;
  const type = normalize(product?.productType);
  const styles = new Set((product?.tags || []).map(normalize).filter(tag => STYLE_TAG.test(tag)));
  const ownKey = modelKey(product || {});
  const scored = [];
  for (const card of cards || []) {
    if (!card || card.id === product?.id || card.available !== true || !card.image || !card.variantId) continue;
    if (!sameUniverse(product, card) || sameRange(product, card, new Set()) || kidsMismatch(product, card)) continue;
    if (isOutdoor(product) !== isOutdoor(card) || modelKey(card) === ownKey) continue;   // pas une autre taille de la fiche
    const gap = price && card.price ? Math.min(3, Math.abs(Math.log(card.price / price))) : 1.5;
    const shared = (card.tags || []).map(normalize).filter(tag => styles.has(tag)).length;
    scored.push({ card, score: (normalize(card.productType) === type ? 0 : 10) + gap * 2 - Math.min(shared, 3) * 0.5 });
  }
  scored.sort((a, b) => a.score - b.score);
  // Une même gamme ne prend qu'une place : pas trois tailles du même vase.
  const picked = [], ranges = new Set();
  for (const { card } of scored) {
    const key = modelKey(card);
    if (ranges.has(key)) continue;
    ranges.add(key); picked.push(lightCard(card, 'same-universe'));
    if (picked.length >= limit) break;
  }
  return picked;
}

// Autres tailles et finitions du même modèle, lues dans l'index (complète la recherche Shopify).
function modelPieces(product, cards, limit = 12) {
  return (cards || []).filter(card => card && card.id !== product?.id && card.available === true && card.image && card.variantId
    && sameModel(product, card)).slice(0, limit).map(card => lightCard(card, 'same-range'));
}

function designerPieces(product, cards, exclude = new Set()) {
  const name = normalize(product?.designer);
  if (!name || designerIsBrand(product)) return [];
  const self = normalize(product?.name).split(' ').slice(0, 2).join(' ');
  const pool = (cards || []).filter(card => card && card.id !== product.id && !exclude.has(card.id)
    && normalize(card.designer) === name && card.image && card.available !== false
    && normalize(card.name).split(' ').slice(0, 2).join(' ') !== self && !sameRange(product, card, new Set()));
  const byType = new Map();
  for (const card of pool) { const key = normalize(card.productType) || card.id; if (!byType.has(key)) byType.set(key, []); byType.get(key).push(card); }
  const picked = [];
  for (let round = 0; picked.length < MAX_RECOMMENDATIONS && round < 4; round++)
    for (const list of byType.values()) if (list[round] && picked.length < MAX_RECOMMENDATIONS) picked.push(lightCard(list[round], 'same-designer'));
  return picked;
}

module.exports = {
  MAX_RECOMMENDATIONS, normalize, selectRangeCollections, identityTerms,
  recommendationSearchTerm, role, sameRange, sameUniverse, universeSearchQueries,
  functionalCompanion, isOutdoor, isKids,
  sceneBucket, sceneSearchQueries,
  selectProductRecommendations, designerPieces, designerIsBrand, similarPieces, modelPieces, sameModel,
};
