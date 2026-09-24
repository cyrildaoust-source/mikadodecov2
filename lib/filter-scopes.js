// Pages dotées des filtres « Filtrer et trier » du pilote Chaises.
// - Sous-catégories du méga menu : depuis le 24 septembre 2026.
// - Familles (dont Jardin et Assises) et catalogue complet : demande du propriétaire
//   du 24 septembre, avec un filtre « Catégorie ».
// Toutes lisent l'index commun (lib/catalog-index.js). Si l'index manque, les
// sous-catégories filtrées depuis le premier jour relisent leur collection
// (fallback 'collection') ; les autres pages reprennent leur liste d'origine ('legacy').
const collections = require('../v3/navigation-data.json').collections;
const families = require('../data/family-pages.json');
const landing = require('../data/catalog-landing.json');
const designers = Object.fromEntries(require('../v3/designers-data.json').designers.filter(d => d.slug && !d.hidden).map(d => [d.slug, d]));
const { tableSources, isOutdoor } = require('./table-collections');

// Canapés : 712 modèles, environ 11 s de lecture directe (mesure du 24 septembre) ;
// les tables suivent leurs règles intérieur/extérieur. Filtrés via l'index uniquement.
const INDEX_ONLY = new Set(['canapes']);
const COLLECTION_KINDS = new Set(['brand', 'range', 'designer', 'selection']);
const INTERNAL = new Set(['featured', 'frontpage', 'all']);

const CHAIRS = {
  handle: 'chaises', kind: 'subcategory', members: 'chaises', label: 'Chaises', basePath: '/collections/chaises', fallback: 'collection',
  heading: 'Trouvez votre chaise', sub: 'Des matières, des lignes et des couleurs pour trouver la vôtre.',
  formLabel: 'Filtrer les chaises', sortLabel: 'Trier les chaises', empty: 'Aucune chaise ne correspond à cette sélection.', all: 'Voir toutes les chaises',
  unavailable: 'Impossible de charger les chaises pour le moment.',
  ogTitle: 'Chaises de design · Mikado Deco', ogDescription: 'Trouvez votre chaise par marque, prix, couleur, matière et usage. Une sélection de design chez Mikado, à Uccle.',
};
const FAMILY_HEADINGS = { sieges: 'Toutes les assises', outdoor: 'Tous les produits jardin' };

const subcategoriesOf = family => Object.entries(collections)
  .filter(([, c]) => c.kind === 'subcategory' && c.parent === family)
  .map(([value, c]) => ({ value, label: c.label }));

function generic(handle, label, extra) {
  return {
    handle, label, basePath: '/collections/' + handle,
    heading: 'Toute la sélection', sub: 'Mobilier de design, choisi pièce par pièce.',
    formLabel: 'Filtrer : ' + label, sortLabel: 'Trier : ' + label,
    empty: 'Aucun modèle ne correspond à cette sélection.', all: 'Voir toute la sélection',
    unavailable: 'Impossible de charger cette sélection pour le moment.',
    ogTitle: label + ' · Mikado Deco',
    ogDescription: `${label} de design : filtrez par marque, prix, couleur, matière et usage. Une sélection Mikado, à Uccle.`,
    ...extra,
  };
}

const CATALOGUE = generic('catalogue', landing.title, {
  kind: 'catalogue', basePath: '/produits.html', fallback: 'legacy', members: null,
  heading: 'Tout le catalogue', sub: landing.description,
  formLabel: 'Filtrer le catalogue', sortLabel: 'Trier le catalogue', all: 'Voir tout le catalogue',
  categories: landing.categories.map(c => ({ value: c.handle, label: c.title })),
  ogTitle: 'Mobilier & objets de design · Mikado Deco', ogDescription: landing.description,
});

// Pages créateurs (/produits.html?designer=<slug>) : pièces portant ses tags,
// rendues par le serveur depuis l'index, avec les familles pour catégories.
function designerScope(slug) {
  const d = Object.hasOwn(designers, slug) ? designers[slug] : null;
  if (!d || !Array.isArray(d.tags) || !d.tags.length) return null;
  return generic('designer:' + slug, d.name, {
    kind: 'designer', basePath: '/produits.html', fixed: { designer: slug }, tags: d.tags, fallback: 'legacy',
    categories: CATALOGUE.categories, categoryKind: 'family',
    heading: 'Les pièces de ' + d.name, sub: d.bio || '',
    ogTitle: d.name + ' · Mikado Deco',
    ogDescription: d.bio || `Les pièces signées ${d.name} chez Mikado Deco. Retrait à Uccle, livraison en Belgique.`,
  });
}
function filterScope(handle) {
  if (handle === 'chaises') return CHAIRS;
  if (handle.startsWith('designer:')) return designerScope(handle.slice(9));
  if (handle === 'catalogue') return CATALOGUE;
  const c = collections[handle];
  if (!c) return null;
  if (c.kind === 'family') {
    const label = c.label;
    return generic(handle, label, {
      kind: 'family', fallback: 'legacy', members: handle,
      heading: families[handle]?.gridTitle || FAMILY_HEADINGS[handle] || 'Toute la sélection',
      sub: families[handle]?.description || '',
      categories: subcategoriesOf(handle),
      // Assises : sans le mobilier de jardin classé dans la collection (règle de la liste d'origine).
      accept: handle === 'sieges' ? 'indoor-seating' : handle === 'tables' ? 'indoor-tables' : null,
      ogDescription: families[handle]?.description || `${label} de design chez Mikado Deco, à Uccle.`,
    });
  }
  // Marques, gammes, créateurs et sélections : rendus complets par le serveur depuis
  // l'index, dans l'ordre choisi dans Shopify, avec les familles pour catégories.
  // Promotions et « promo-* » gardent leur affichage de variantes remisées ;
  // les collections internes restent hors du site filtré.
  if (COLLECTION_KINDS.has(c.kind)) {
    if (/^promo/.test(handle) || INTERNAL.has(handle) || /^claude-/.test(handle)) return null;
    return generic(handle, c.label, {
      kind: 'collection', members: handle, fallback: 'legacy', order: 'collection',
      categories: CATALOGUE.categories, categoryKind: 'family',
      popLabel: handle === 'nouveautes' ? 'Les plus récents' : 'Notre sélection',
      heading: handle === 'nouveautes' ? 'Toutes les nouveautés' : 'Toute la sélection',
    });
  }
  if (c.kind !== 'subcategory') return null;
  const tables = tableSources(handle);
  return generic(handle, c.label, {
    kind: 'subcategory', members: handle,
    fallback: tables || INDEX_ONLY.has(handle) ? 'legacy' : 'collection',
    accept: tables ? 'table:' + handle : null,
  });
}

// Règles d'appartenance, appliquées aux fiches de l'index (tags, collections, type).
function acceptProduct(scope, card, membersOf) {
  if (scope.kind === 'designer') return (card.tags || []).some(tag => scope.tags.includes(tag));
  if (!scope.accept) return true;
  if (scope.accept === 'indoor-seating') return !(card.tags || []).includes('exterieur') || (card.tags || []).includes('interieur');
  if (scope.accept === 'indoor-tables') return tableSources('tables')[0].accept(card);
  if (scope.accept.startsWith('table:')) {
    const sources = tableSources(scope.accept.slice(6));
    return sources.some(source => membersOf(source.handle)?.has(card.id) && source.accept(card));
  }
  return true;
}
// Une famille réunit sa collection Shopify et ses sous-catégories du menu : les
// collections familles sont incomplètes (24 septembre : Assises sans aucun des 712
// canapés, Tables sans table basse). La première source est obligatoire.
const familyUnion = family => [family, ...subcategoriesOf(family).map(c => c.value)];
// Tables outdoor : complétée par les tables extérieures de la collection Tables.
const memberSources = scope => scope.accept?.startsWith('table:') ? tableSources(scope.accept.slice(6)).map(s => s.handle)
  : scope.kind === 'family' ? familyUnion(scope.handle) : scope.members ? [scope.members] : [];
// Valeur du filtre Catégorie : une sous-catégorie (familles) ou une famille entière,
// avec ses règles (catalogue), pour afficher les mêmes nombres que la page famille.
const categoryScope = (scope, value) => scope.kind === 'catalogue' || scope.categoryKind === 'family' ? filterScope(value) : { handle: value, kind: 'subcategory', members: value };

const filterScopeHandles = () => ['chaises', ...Object.keys(collections).filter(h => h !== 'chaises' && filterScope(h))];
// Collections dont l'index commun doit connaître les membres.
const indexedCollections = () => [...new Set([...filterScopeHandles(), ...CATALOGUE.categories.map(c => c.value)])];

module.exports = { filterScope, filterScopeHandles, indexedCollections, acceptProduct, memberSources, categoryScope, isOutdoor, CATALOGUE };
