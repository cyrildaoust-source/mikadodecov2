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

`data/family-pages.json` contient les textes, liens, photos et marques choisis pour ces cinq pages. Les liens de catégories s’appuient sur le méga menu Shopify. Sur Tables, la carte « Tables outdoor » remplace « Tables de café » : la collection café actuelle contient surtout du mobilier de jardin et une carafe mal classée, sans table d’intérieur identifiée. La carte Tables outdoor utilise une ambiance Ribambelle ; sa page présente une autre scène extérieure, avec une table Traverse. Les bandeaux sont également rendus sans JavaScript. Les photos sont des choix éditoriaux explicites, pas la première image du premier produit renvoyé par Shopify. `sourceProduct` permet de retrouver leur provenance lorsqu’elles viennent d’une fiche produit.

`templates/family-page.html`, `lib/family-pages.js` et `v3/family-page.js` fournissent le modèle commun. Jardin et Assises gardent leurs compositions validées. Les cartes de catégories utilisent les classes de l’accueil ; jusqu’à cinq catégories, elles occupent la largeur disponible sur grand écran. Les sept pages familles partagent `v3/family-rail.js` : défilement natif au tactile/trackpad, glissement à la souris et navigation avec les flèches du clavier, Début et Fin. Les boutons de flèches au-dessus des catégories sont retirés. Un glissement ne déclenche pas le lien ; un clic simple garde son comportement habituel. Le rail devient tabulable seulement lorsqu’il déborde. L’accueil conserve ses contrôles existants.

Les cinq nouvelles pages présentent leurs inspirations sur une seule rangée de trois images, de 180 à 280 px de haut sur ordinateur, et dans une rangée défilante de 200 px de haut sur mobile. Les marques suivent désormais le catalogue pour rapprocher les produits du début de page. Sur Tables, « Le plaisir de recevoir » utilise une autre photo que le bandeau. Sur Luminaires, la suspension Beehive Artek et le lampadaire Akari 10A Vitra remplacent Bolleke et Apex Floor ; Apex Table reste dans sa catégorie.

Les collections sont chargées par lots de 24, sans plafond global ajouté par ces pages. Le premier lot est rendu côté serveur, avec des liens produits et une pagination qui fonctionne sans JavaScript. « Voir plus de produits » ajoute ensuite les lots dans la même grille. Une panne conserve la navigation et offre une nouvelle tentative ; elle n’est pas mise en cache comme une page de produits normale.

## Parcours famille → marque

Les 28 cartes de marques des sept familles pointent vers `/collections/<famille>?brand=<marque>` : Tables → Artek affiche uniquement les tables Artek ; Luminaires → Artek affiche uniquement les luminaires Artek. La photo reprend la carte de cette marque dans la famille lorsque celle-ci est disponible. Le titre, le fil d’Ariane avec retour vers la famille, les métadonnées et les produits rendus côté serveur conservent ce contexte. Retirer la marque ramène à la page famille.

`lib/collection-brand.js` réunit la famille et ses sous-catégories puis intersecte la sélection avec la marque après les règles de classement, en remplissant les lots à travers les curseurs. Cela inclut les fiches présentes uniquement dans un enfant ; la première collection contenant la fiche est sa source unique pour éviter les doublons. Tables exclut la sous-catégorie Outdoor et conserve ses règles intérieur/extérieur. Les curseurs conservent la famille, la marque, le filtre matière et la source parcourue. Le relevé du 16 septembre montrait notamment deux luminaires HAY dans la famille, alors que six étaient présents dans ses enfants. L’importer doit rétablir les appartenances parentes à la source.

Le résultat ne dépend pas de l’activation d’un filtre Shopify Search & Discovery. Une marque absente donne une sélection vide ; une panne conserve le contexte et n’est pas mise en cache. Les paramètres `brand` et `tag` sont transmis à chaque lot. Le changement de marque recharge sa sélection complète, sans filtrer uniquement les produits de la marque précédente.

Dans Jardin, l’appartenance à la collection Outdoor remplace le filtre limité au seul tag `exterieur`, afin de conserver aussi les modèles classés jardin avec d’autres tags.

## Photos des familles et sous-catégories

`data/collection-heroes.json` définit les 39 bandeaux des sous-catégories du méga menu. Chaque entrée référence une photographie de galerie produit, son `sourceProduct`, un texte alternatif, ses dimensions et son point de cadrage (`position`, `mobilePosition`). Les fichiers identifiés comme générés et les schémas techniques sont exclus de cette sélection. Une photo de produit en situation peut illustrer une catégorie sans modifier son classement Shopify.

`lib/editorial-media.js` aligne le bandeau visible, son chargement prioritaire, sa version sans JavaScript et son image de partage. Les tailles responsive restent limitées à la largeur disponible du fichier ; demander `width=2000` au CDN ne crée pas une source haute résolution. Les pages marques et le catalogue général conservent leurs bandeaux existants.

Les cinq familles utilisent des photos distinctes entre leur bandeau, leurs catégories, leurs inspirations et leurs marques. Les photos des catégories validées sont conservées lorsque leur sujet et leur cadrage conviennent. Les paramètres `heroPosition` et `position` règlent le cadrage sans changer les cartes, les boutons ou les proportions communes. Une même gamme peut apparaître dans plusieurs photos et une sous-catégorie peut reprendre une ambiance de sa famille.

Pour remplacer une photo : choisir une vraie scène de la galerie, contrôler son sujet et sa netteté, conserver son URL et son produit source, puis régler le point de cadrage dans une preview sur ordinateur. Préférer une source paysage d’au moins 2000 px pour un bandeau. Plusieurs médias actuels sont limités à environ 1200–1400 px : l’importer doit préserver les originaux et fournir des photos d’ambiance en haute définition lorsqu’elles existent, sans agrandissement artificiel ni suppression des URL déjà publiées.

## Action éditoriale : les icônes

La rubrique est désactivée pour Arts de la table : aucun bloc ni appel API d’icônes n’y est généré.

Sur Assises uniquement, « Les chaises iconiques » se place après les catégories. `data/seating-icons.json` contient quatre modèles fixes : Panton, CH24 Wishbone, Standard et Rey Chair de HAY. Les fiches sont rendues côté serveur avec les mêmes cartes produits que le catalogue, puis hydratées dans le même ordre. Une fiche dépubliée ou en panne laisse les autres disponibles. Aucun mélange, aucun roulement automatique ; la barre horizontale est masquée et le défilement reste disponible si l’écran l’exige.

Sur Tables, « Notre sélection de tables » utilise quatre handles explicites dans `data/family-pages.json` : Noguchi Dining, Drop Leaf HM6, Kaari REB004 et CH006. Cette proposition éditoriale peut être remplacée par les favoris du propriétaire. Elle ne prétend pas refléter les meilleures ventes. Seules des fiches de type table sans classement outdoor sont affichées. Les photos, prix et boutons gardent le composant standard.

Pour les autres familles, les tags `icone` et `icone-design` servent à une sélection éditoriale au sein de chaque collection. Une meilleure vente, une nouveauté, la notoriété d’une marque ou un mot trouvé sur le site fournisseur ne suffisent pas à attribuer ces tags. Une rubrique sans sélection reste masquée. Toutes les sélections utilisent le composant `productCard` et son agencement standard, même pour un ou deux produits : photo carrée au-dessus, marque, nom, disponibilité, prix puis bouton. Aucune variante horizontale ne déplace les éléments.

Décision demandée : retirer `icone` de la fiche `chaise-hay-aac-26` dans Shopify, ainsi que `icone-design` s’il y était ajouté. Le contrôle public du 14 septembre montrait `icone` et une sélection Assises ne contenant que ce produit.

Le site exclut provisoirement ce handle dans `v3/family-policy.mjs`, même si le tag n’a pas encore été retiré à la source. Cela retire la chaise de la rubrique « Les icônes », sans la retirer du catalogue et sans exclure les autres produits HAY. La modification du tag Shopify reste à effectuer. Après correction et vérification du prochain import, l’exception pourra être supprimée.

À prévoir dans l’importer : préserver cette décision lors des réimports. Les tags éditoriaux doivent être gérés séparément des tags issus d’une classification automatique. Présenter les ajouts/retraits proposés dans le différentiel avant publication ; ne pas écraser silencieusement une sélection manuelle.

## Action catalogue : contrôler les appartenances aux collections

`lib/table-collections.js` définit la séparation appliquée aux réponses serveur et à la pagination :

- `tables`, `tables-de-salle-a-manger`, `tables-de-cafe` et `tables-basses-et-tables-dappoint` conservent les produits de type table qui ne sont pas marqués pour l’extérieur.
- Un tag `exterieur`, `mobilier-exterieur`, `mobilier-de-jardin`, ou l’appartenance à `outdoor`/`tables-outdoor`, classe le modèle côté jardin. Un modèle à double usage reste dans Outdoor pour cette séparation éditoriale.
- `tables-outdoor` conserve ses tables existantes et ajoute celles de `tables` classées outdoor. Les membres déjà présents ne sont pas répétés ; un tabouret mal classé est exclu par son type fonctionnel. Les produits ajoutés portent l’appartenance outdoor dans la réponse du site pour que la grille les conserve.
- Les lots sont remplis en parcourant les curseurs Shopify, sans charger toute la collection d’un coup. Un produit supplémentaire sert à vérifier l’existence d’une page suivante. Les curseurs de continuation reprennent après le dernier élément consommé et distinguent les deux sources outdoor.

Le relevé du 15 septembre contenait 125 produits dans Tables, dont 54 marqués pour l’extérieur. La collection physique Tables outdoor avait 15 produits, dont un tabouret. Cette séparation est réalisée dans le site et sa preview ; elle ne modifie pas les collections Shopify. L’importer doit ensuite harmoniser ces règles à la source, notamment les appartenances parentes et sous-catégories. Les champs d’usage et le type fonctionnel doivent être explicites et révisables, sans déduction à partir de la seule marque ou d’un mot de gamme.

Cas concrets observés via les API publiques les 14 et 15 septembre :

- `tables-de-cafe` contient la chaise Bistro et un coussin Basics Bistro, en plus des tables. Vérifier la règle de collection : un nom de gamme partagé (« Bistro ») ne doit pas suffire à classer un produit comme table.
- `paniers-et-corbeilles` contient des modules Stacked. Vérifier les règles qui confondent la famille « rangement » avec une sous-catégorie précise. Une caisse Toolbox peut relever d’un choix éditorial ; une étagère modulaire mérite une autre classification.

Le bloc « La transparence et la couleur » utilise une photo de pichets Tube en verre et pointe désormais vers `/collections/verres-carafes?tag=verrerie`. La collection générale contient aussi des pichets en grès, en porcelaine ou en métal. Ce filtre existant sélectionne la verrerie dès le rendu serveur puis dans la grille interactive. Il ne couvre pas tous les produits en verre : les tags matière sont encore hétérogènes (`verre`, `verrerie`, `borosilicate`, etc.). À harmoniser dans l’importer après validation des matières, sans confondre le récipient « un verre » avec la matière verre.

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

Commande : `node --test tests/family-pages.test.cjs tests/table-collections.test.cjs tests/product-specs.test.mjs`.

Les tests des familles couvrent les cinq routes, le rendu serveur des produits et du chrome, les métadonnées, les curseurs opaques, la fin de pagination, les collections vides, les pannes, l’échappement du JSON initial et la sélection d’icônes, y compris la sélection de chaises, une fiche dépubliée, une requête produit en panne et l’absence de rubrique sur Arts de la table. Ils couvrent aussi l’appartenance des chaises à Assises, la transmission du filtre verrerie au rendu serveur, les lots de tables remplis malgré les exclusions, la continuité des curseurs, les deux sources outdoor sans doublons et les pannes en cours de pagination. Les réponses Shopify sont simulées : ces tests ne certifient ni le classement du catalogue réel, ni le rendu visuel, ni une commande payée.
