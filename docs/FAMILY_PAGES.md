# Pages familles et données du catalogue

État du 15 septembre 2026. Les deux dépôts restent séparés : le site gère la présentation ; l’importer prépare et valide les données qui alimentent Shopify.

## Pages concernées

| Famille | URL | Sous-catégories |
| --- | --- | --- |
| Tables | `/collections/tables` | 4 |
| Luminaires | `/collections/luminaires` | 6 |
| Décoration | `/collections/decoration` | 6 |
| Rangement | `/collections/rangement` | 5 |
| Arts de la table | `/collections/accessoires` | 5 |

`data/family-pages.json` contient les textes, liens, photos et marques choisis pour ces cinq pages. Les 26 liens de catégories reprennent le méga menu Shopify observé le 14 septembre. Les photos sont des choix éditoriaux explicites, pas la première image du premier produit renvoyé par Shopify. `sourceProduct` permet de retrouver leur provenance lorsqu’elles viennent d’une fiche produit.

`templates/family-page.html`, `lib/family-pages.js` et `v3/family-page.js` fournissent le modèle commun. Jardin et Assises gardent leurs compositions validées. Les cartes de catégories utilisent les classes de l’accueil ; jusqu’à cinq catégories, elles occupent la largeur disponible sur grand écran. Les flèches ne sont proposées que si le contenu déborde. Les catégories restent accessibles par défilement tactile et clavier.

Les collections sont chargées par lots de 24, sans plafond global ajouté par ces pages. Le premier lot est rendu côté serveur, avec des liens produits et une pagination qui fonctionne sans JavaScript. « Voir plus de produits » ajoute ensuite les lots dans la même grille. Une panne conserve la navigation et offre une nouvelle tentative ; elle n’est pas mise en cache comme une page de produits normale.

## Action éditoriale : les icônes

Les tags `icone` et `icone-design` servent à une sélection éditoriale au sein de chaque collection. Une meilleure vente, une nouveauté, la notoriété d’une marque ou un mot trouvé sur le site fournisseur ne suffisent pas à attribuer ces tags. Une rubrique sans sélection reste masquée.

Décision demandée : retirer `icone` de la fiche `chaise-hay-aac-26` dans Shopify, ainsi que `icone-design` s’il y était ajouté. Le contrôle public du 14 septembre montrait `icone` et une sélection Assises ne contenant que ce produit.

Le site exclut provisoirement ce handle dans `v3/family-policy.mjs`, même si le tag n’a pas encore été retiré à la source. Cela retire la chaise de la rubrique « Les icônes », sans la retirer du catalogue et sans exclure les autres produits HAY. La modification du tag Shopify reste à effectuer. Après correction et vérification du prochain import, l’exception pourra être supprimée.

À prévoir dans l’importer : préserver cette décision lors des réimports. Les tags éditoriaux doivent être gérés séparément des tags issus d’une classification automatique. Présenter les ajouts/retraits proposés dans le différentiel avant publication ; ne pas écraser silencieusement une sélection manuelle.

## Action catalogue : contrôler les appartenances aux collections

Les nouvelles pages affichent les collections Shopify existantes. Elles ne filtrent pas les erreurs de classement au cas par cas dans le navigateur.

Deux cas concrets ont été observés via les API publiques le 14 septembre :

- `tables-de-cafe` contient la chaise Bistro et un coussin Basics Bistro, en plus des tables. Vérifier la règle de collection : un nom de gamme partagé (« Bistro ») ne doit pas suffire à classer un produit comme table.
- `paniers-et-corbeilles` contient des modules Stacked. Vérifier les règles qui confondent la famille « rangement » avec une sous-catégorie précise. Une caisse Toolbox peut relever d’un choix éditorial ; une étagère modulaire mérite une autre classification.

Avant de publier un lot : comparer le type fonctionnel du produit aux collections visées, vérifier aussi son appartenance à la famille parente, puis contrôler quelques exemples positifs et négatifs. Pour une collection automatique, corriger les tags/types ou sa règle ; pour une collection manuelle, corriger ses membres. Ne pas renommer les handles du menu pour résoudre une erreur de classement.

## Contrat à préserver entre les deux dépôts

1. **Identité et URLs** : conserver les handles des produits et collections déjà publiés. Si un changement est indispensable, prévoir les redirections et mettre à jour menu et configuration des familles ensemble.
2. **Images** : maintenir les médias déjà utilisés par les pages, ou fournir leur remplacement avant suppression. Vérifier visuellement les rôles packshot, ambiance et détail ; une image de variante n’est pas automatiquement une photo d’ambiance. La provenance des images de catégories est documentée dans la configuration du site.
3. **Quantité vendue et variantes** : qualifier les unités/sets, options et prix avant envoi. Un prix fournisseur ne prouve pas à lui seul ce qui est vendu sur la fiche.
4. **Informations techniques** : tout nouveau nom de metafield ou nouveau format doit être vérifié dans l’importer puis dans le mapping de `server.js` et le rendu de la fiche produit. Publier un champ ne garantit pas que le site le lise.
5. **Disponibilité et délais** : préserver les données gérées manuellement et contrôler le libellé affiché sur les cartes et les fiches après import.
6. **Validation** : produire un différentiel avant/après, un petit lot représentatif et une vérification sur le site avant d’élargir le lot. Inclure un produit à variantes, un article vendu en set, un prix avec centimes et un produit avec données techniques.

L’accès en lecture au dépôt importer permet de comparer ses évolutions lors de chaque intervention sur le site. Ce document ne configure pas une surveillance automatique entre les dépôts. Une nouvelle recette ou un nouveau format source doit être signalé dans la livraison de l’importer avec son effet attendu sur les données Shopify.

## Vérifications

Commande : `node --test tests/family-pages.test.cjs tests/product-specs.test.mjs`.

Les tests des familles couvrent les cinq routes, le rendu serveur des produits et du chrome, les métadonnées, les curseurs opaques, la fin de pagination, les collections vides, les pannes, l’échappement du JSON initial et la sélection d’icônes. Les réponses Shopify sont simulées : ces tests ne certifient ni le classement du catalogue réel, ni le rendu visuel, ni une commande payée.
