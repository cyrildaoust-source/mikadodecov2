// Collections dotées des filtres du pilote Chaises (« Filtrer et trier »).
// Étape 1 (24 septembre 2026) : Chaises et les sous-catégories du méga menu, sauf les
// tables (règles intérieur/extérieur propres, lib/table-collections.js) et les très
// grandes collections, dont le chargement complet reste à mesurer avant activation.
const collections = require('../v3/navigation-data.json').collections;
const { tableSources } = require('./table-collections');

// Canapés : 712 modèles, environ 11 s de lecture complète à froid (mesure du 24 septembre).
const DEFERRED = new Set(['canapes']);

const CHAIRS = {
  handle: 'chaises', label: 'Chaises', basePath: '/collections/chaises',
  heading: 'Trouvez votre chaise', sub: 'Des matières, des lignes et des couleurs pour trouver la vôtre.',
  formLabel: 'Filtrer les chaises', sortLabel: 'Trier les chaises', empty: 'Aucune chaise ne correspond à cette sélection.', all: 'Voir toutes les chaises',
  unavailable: 'Impossible de charger les chaises pour le moment.',
  ogTitle: 'Chaises de design · Mikado Deco', ogDescription: 'Trouvez votre chaise par marque, prix, couleur, matière et usage. Une sélection de design chez Mikado, à Uccle.',
};

function filterScope(handle) {
  if (handle === 'chaises') return CHAIRS;
  const c = collections[handle];
  if (!c || c.kind !== 'subcategory' || tableSources(handle) || DEFERRED.has(handle)) return null;
  const label = c.label;
  return {
    handle, label, basePath: '/collections/' + handle,
    heading: 'Toute la sélection', sub: 'Mobilier de design, choisi pièce par pièce.',
    formLabel: 'Filtrer : ' + label, sortLabel: 'Trier : ' + label,
    empty: 'Aucun modèle ne correspond à cette sélection.', all: 'Voir toute la sélection',
    unavailable: 'Impossible de charger cette sélection pour le moment.',
    ogTitle: label + ' · Mikado Deco',
    ogDescription: `${label} de design : filtrez par marque, prix, couleur, matière et usage. Une sélection Mikado, à Uccle.`,
  };
}
const filterScopeHandles = () => ['chaises', ...Object.keys(collections).filter(h => filterScope(h) && h !== 'chaises')];
module.exports = { filterScope, filterScopeHandles, DEFERRED };
