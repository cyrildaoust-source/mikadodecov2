// Sélection déterministe des ventes associées à partir des faits Shopify.
// Aucune fiche ni aucun handle n'est codé en dur : les signaux sont les
// recommandations curées, les collections/tags/titres de gamme et les types.

const DEFAULT_LIMIT = 4;
const MAX_LIMIT = 8;

const fold = value => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const words = value => fold(value).split(/\s+/).filter(Boolean);

const GENERIC_WORDS = new Set([
  'avec', 'sans', 'pour', 'dans', 'sur', 'sous', 'entre', 'petit', 'petite',
  'grand', 'grande', 'moyen', 'moyenne', 'mini', 'medium', 'large', 'set',
  'lot', 'piece', 'pieces', 'modele', 'collection', 'edition', 'interieur',
  'exterieur', 'outdoor', 'indoor', 'design', 'nouveau', 'nouvelle',
]);

function productType(product) {
  return fold(product?.productType || product?.subcategory || product?.category);
}

function productText(product) {
  return fold([product?.name, product?.productType, ...(product?.tags || [])].join(' '));
}

function isAvailable(product) {
  return !!product && product.available !== false && !!product.image && !!product.variantId;
}

function role(product) {
  const type = productType(product);
  const text = productText(product);
  if (/\bhousse\b/.test(type)) return 'cover';
  if (/\b(galette|coussin|dossier|matelas|tissu au metre)\b/.test(type)) return 'seat-accessory';
  if (/\b(canape|fauteuil|chaise|banc|tabouret|pouf|assise|repose pieds|lit de repos)\b/.test(type)) return 'seat';
  if (/\b(abat jour|ampoule|cable de recharge|tube lumineux|pied de lampe)\b/.test(type)) return 'light-accessory';
  if (/\b(lampe|lampadaire|suspension|applique|plafonnier|lustre|lanterne)\b/.test(type)) return 'light';
  if (/\b(rallonge de table|plateau de table)\b/.test(type)) return 'table-accessory';
  if (/\b(table|bureau|console)\b/.test(type)) return 'table';
  if (/\b(recharge|concentre de parfum)\b/.test(type) || /\brecharge\b/.test(text)) return 'refill';
  if (/\b(diffuseur|bouquet parfume|savon liquide|spray d ambiance|parfum)\b/.test(type)) return 'refillable';
  if (/\b(bougie|chandelle)\b/.test(type)) return 'candle';
  if (/\b(bougeoir|chandelier)\b/.test(type)) return 'candle-holder';
  return type || 'other';
}

function universeGroup(product) {
  const type = productType(product);
  const productRole = role(product);
  if (['seat', 'table', 'cover', 'seat-accessory', 'table-accessory'].includes(productRole) || /\b(etagere|armoire|buffet|commode|rangement|desserte)\b/.test(type)) return 'furniture';
  if (['light', 'light-accessory'].includes(productRole)) return 'lighting';
  if (/\b(assiette|verre|carafe|pichet|bol|tasse|mug|plat|saladier|couvert|theiere|cafe|coquetier|huilier|soucoupe|service de table)\b/.test(type)) return 'tableware';
  if (/\b(vase|soliflore|cache pot|pot|sculpture|objet decoratif|vide poche|coupe|centre de table)\b/.test(type)) return 'decoration';
  if (['candle', 'candle-holder', 'refill', 'refillable'].includes(productRole)) return 'ambiance';
  return productRole;
}

function functionalPair(a, b) {
  const roleA = role(a), roleB = role(b);
  const pair = new Set([roleA, roleB]);
  if (pair.has('cover') && (pair.has('seat') || pair.has('table'))) {
    const cover = roleA === 'cover' ? a : b;
    const covered = roleA === 'cover' ? b : a;
    const coverText = productText(cover);
    const coveredRole = role(covered);
    if (coveredRole === 'table' && /\b(chaise|fauteuil|canape|banc|pouf)\b/.test(coverText) && !/\btable\b/.test(coverText)) return 0;
    if (coveredRole === 'seat' && /\btable\b/.test(coverText) && !/\b(chaise|fauteuil|canape|banc|pouf)\b/.test(coverText)) return 0;
    const coverNumbers = words(cover?.name).filter(word => /^\d+$/.test(word));
    const productNumbers = new Set(words(covered?.name).filter(word => /^\d+$/.test(word)));
    if (coverNumbers.length && productNumbers.size && !coverNumbers.some(number => productNumbers.has(number))) return 0;
    return 8;
  }
  if (pair.has('seat') && pair.has('seat-accessory')) return 8;
  if (pair.has('light') && pair.has('light-accessory')) return 8;
  if (pair.has('table') && pair.has('table-accessory')) return 8;
  if (pair.has('refillable') && pair.has('refill')) return 8;
  if (pair.has('candle') && pair.has('candle-holder')) return 7;
  return 0;
}

function buildRecommendationContext(catalog = []) {
  const products = catalog.filter(Boolean);
  const collectionCounts = new Map();
  const tagCounts = new Map();
  const brandCounts = new Map();
  const productsByBrand = new Map();
  const titleTokenCounts = new Map();
  const typeWords = new Set(products.flatMap(p => words(p.productType)));

  for (const product of products) {
    const brand = fold(product.brand);
    brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
    if (!productsByBrand.has(brand)) productsByBrand.set(brand, []);
    productsByBrand.get(brand).push(product);
    for (const value of new Set(product.collections || [])) collectionCounts.set(value, (collectionCounts.get(value) || 0) + 1);
    for (const value of new Set(product.tags || [])) tagCounts.set(value, (tagCounts.get(value) || 0) + 1);
    const brandWords = new Set(words(product.brand));
    const tokens = new Set(words(product.name).filter(token => token.length >= 3 && !GENERIC_WORDS.has(token) && !typeWords.has(token) && !brandWords.has(token) && !/^\d+$/.test(token)));
    for (const token of tokens) {
      const key = `${brand}|${token}`;
      titleTokenCounts.set(key, (titleTokenCounts.get(key) || 0) + 1);
    }
  }
  return { products, productsByBrand, collectionCounts, tagCounts, brandCounts, titleTokenCounts, typeWords };
}

function rangeAffinity(subject, candidate, context) {
  if (!subject || !candidate || fold(subject.brand) !== fold(candidate.brand)) return { score: 0, reasons: [], strong: false };
  const reasons = [];
  let score = 0;
  const brand = fold(subject.brand);
  const brandTokens = new Set(words(subject.brand));
  const subjectTitle = fold(subject.name);
  const candidateTitle = fold(candidate.name);
  const subjectCollections = new Set(subject.collections || []);
  const candidateCollections = new Set(candidate.collections || []);
  for (const collection of subjectCollections) {
    const normalized = fold(collection);
    const count = context.collectionCounts.get(collection) || 0;
    const named = normalized.length >= 3 && subjectTitle.includes(normalized) && candidateTitle.includes(normalized);
    if (!candidateCollections.has(collection) || count < 2 || count > 120 || normalized === brand || brandTokens.has(normalized) || !named) continue;
    score += 8;
    reasons.push(`collection:${collection}`);
  }

  const subjectTags = new Set(subject.tags || []);
  const candidateTags = new Set(candidate.tags || []);
  for (const tag of subjectTags) {
    if (!candidateTags.has(tag)) continue;
    const normalized = fold(tag);
    const count = context.tagCounts.get(tag) || 0;
    const named = normalized.length >= 3 && subjectTitle.includes(normalized) && candidateTitle.includes(normalized);
    const genericType = words(normalized).every(word => context.typeWords.has(word) || GENERIC_WORDS.has(word));
    if (count >= 2 && count <= 120 && normalized !== brand && !brandTokens.has(normalized) && !genericType && named) {
      score += 5;
      reasons.push(`tag:${tag}`);
    }
  }

  const candidateTokens = new Set(words(candidate.name));
  for (const token of new Set(words(subject.name))) {
    if (token.length < 3 || GENERIC_WORDS.has(token) || context.typeWords.has(token) || brandTokens.has(token) || /^\d+$/.test(token) || !candidateTokens.has(token)) continue;
    const count = context.titleTokenCounts.get(`${brand}|${token}`) || 0;
    const brandCount = context.brandCounts.get(brand) || 0;
    if (count >= 2 && count <= Math.max(8, Math.ceil(brandCount * 0.35))) {
      score += 3;
      reasons.push(`modele:${token}`);
    }
  }
  return { score, reasons, strong: reasons.some(reason => !reason.startsWith('modele:')) };
}

function universeScore(subject, candidate) {
  const sameBrand = fold(subject.brand) === fold(candidate.brand);
  if (!sameBrand) return 0;
  let score = 4;
  if (productType(subject) === productType(candidate)) score += 5;
  return score;
}

function recommendProducts({
  product,
  catalog = [],
  curatedComplementary = [],
  curatedRelated = [],
  automaticComplementary = [],
  automaticRelated = [],
  context: suppliedContext,
  limit = DEFAULT_LIMIT,
} = {}) {
  const cap = Math.min(MAX_LIMIT, Math.max(1, Number(limit) || DEFAULT_LIMIT));
  const context = suppliedContext || buildRecommendationContext(catalog);
  const seen = new Set([product?.id, product?.handle].filter(Boolean));
  const withPurchase = [];
  const completePurchase = [];

  const add = (target, candidates) => {
    for (const candidate of candidates) {
      if (target.length >= cap) break;
      if (!isAvailable(candidate)) continue;
      const keys = [candidate.id, candidate.handle].filter(Boolean);
      if (keys.some(key => seen.has(key))) continue;
      keys.forEach(key => seen.add(key));
      target.push(candidate);
    }
  };

  // 1. Les choix explicites du propriétaire gardent toujours leur ordre Shopify.
  add(withPurchase, curatedComplementary);
  add(completePurchase, curatedRelated);

  const candidates = (context.productsByBrand.get(fold(product?.brand)) || [])
    .filter(candidate => isAvailable(candidate) && candidate.id !== product?.id && candidate.handle !== product?.handle)
    .map((candidate, index) => {
      const affinity = rangeAffinity(product, candidate, context);
      return { candidate, index, affinity, pair: functionalPair(product, candidate), universe: universeScore(product, candidate) };
    });
  const ranked = rows => rows.sort((a, b) => b.score - a.score || a.index - b.index).map(row => row.candidate);

  // 2. Même gamme : les rôles différents accompagnent l'achat ; le même rôle
  // reste dans l'univers de gamme (alternative/extension de collection).
  const range = candidates.filter(row => row.affinity.score > 0);
  const accessoryRoles = new Set(['cover', 'seat-accessory', 'light-accessory', 'table-accessory', 'refill']);
  add(withPurchase, ranked(range.filter(row => row.pair || (row.affinity.strong && role(row.candidate) !== role(product) && universeGroup(row.candidate) === universeGroup(product) && !accessoryRoles.has(role(row.candidate)))).map(row => ({ ...row, score: row.affinity.score + row.pair }))));
  add(completePurchase, ranked(range.filter(row => !row.pair && role(row.candidate) === role(product)).map(row => ({ ...row, score: row.affinity.score }))));

  // 3. Accessoires fonctionnels : un signal de gamme/modèle est obligatoire,
  // pour éviter de présenter une housse, un coussin ou une rallonge universels.
  add(withPurchase, ranked(candidates.filter(row => row.pair && row.affinity.score > 0).map(row => ({ ...row, score: row.pair + row.affinity.score }))));
  add(completePurchase, ranked(candidates.filter(row => row.universe >= 9).map(row => ({ ...row, score: row.universe + row.affinity.score }))));

  // 4. Shopify en dernier recours. COMPLEMENTARY n'est pas auto-généré par
  // Shopify, mais lire l'intent garde les éventuels choix Search & Discovery.
  add(withPurchase, automaticComplementary);
  const autoPairs = automaticRelated.filter(candidate => functionalPair(product, candidate));
  add(withPurchase, autoPairs);
  add(completePurchase, automaticRelated);

  return { withPurchase, completePurchase };
}

module.exports = {
  buildRecommendationContext,
  functionalPair,
  rangeAffinity,
  recommendProducts,
};
