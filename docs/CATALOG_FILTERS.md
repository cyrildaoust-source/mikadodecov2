# Filtres Chaises — contrat site / importer

Pilote du 16 septembre 2026, limité à `/collections/chaises`. Les autres familles conservent leurs filtres existants. Le bandeau, les cartes, les boutons et la pagination de 60 produits suivent les composants du site. Le tri initial utilise l’ordre `BEST_SELLING` de Shopify, libellé « Les plus populaires » ; il ne remplace pas les sélections éditoriales du propriétaire.

## Parcours et règles

`Chaises → filtres → page → variante du produit → retour à la sélection`

- Marques, couleurs, matières et usages : plusieurs choix possibles, avec union au sein d’un filtre et intersection entre filtres. Les caractéristiques sont cumulatives.
- Prix, couleur, matière et stock doivent correspondre à une même variante. La photo, le prix, le lien et l’ajout au panier utilisent cette variante. Les centimes sont conservés.
- « En stock » signifie une variante achetable dont `quantityAvailable` est strictement positif. Cela ne prétend pas qu’elle soit exposée au magasin. Une variante achetable sans quantité disponible est présentée « Sur commande » ; une variante non achetable est indisponible et son bouton désactivé.
- Le retour de fiche conserve les filtres, le tri, la page et l’ancre du produit. Les liens fonctionnent sans JavaScript. Le navigateur gère aussi précédent/suivant, les requêtes dépassées et la nouvelle tentative après une panne.
- La première page garde son bandeau ; à partir de la deuxième, l’en-tête devient compact. Les filtres détaillés ont une directive `noindex,follow` ; la pagination conserve son URL canonique.

## Sources et valeurs absentes

Le contrat lisible par les deux dépôts est [`data/catalog-filter-contract.json`](../data/catalog-filter-contract.json). Les noms fabricant des options restent inchangés.

| Donnée | Source principale | Reprise compatible |
| --- | --- | --- |
| Marque, prix, stock | Champs natifs Shopify | Aucune copie dans des tags |
| Famille de couleur | `custom.color_family` sur la variante | Mots explicites des options couleur/finition ; correspondances Fermob documentées dans le nuancier du site |
| Famille de matière | `custom.material_family` sur la variante | Attributs standard Shopify, `custom.material`, options matière et tags de matière explicites |
| Usage | `custom.usage` | Tags explicites intérieur/extérieur |
| Caractéristiques | Booléens produit dédiés | `shopify.chair-features` et tags explicites |
| Mesures | Nombres décimaux dédiés, en cm | Mesure explicitement nommée dans `custom.dimensions`, convertie depuis les mm si nécessaire |

Un nom commercial non reconnu reste « Autres finitions ». Une matière ou un usage non renseigné reste identifiable comme tel. Une absence de caractéristique n’est jamais assimilée à « non ». Les booléens dédiés prévalent sur un ancien tag contradictoire. Les descriptions de matière communes peuvent encore être moins précises que des attributs par variante : les familles vérifiées par variante sont la cible du prochain encodage.

Le filtre de hauteur d’assise reste masqué tant que toutes les fiches du pilote ne disposent pas de cette mesure ; une URL contenant déjà un intervalle permet néanmoins de contrôler les valeurs connues. La largeur, la profondeur et la hauteur totale sont préparées dans les données mais ne sont pas présentées comme des filtres complets. Aucun nombre n’est déduit d’un triplet sans légende ni d’une photo.

## Changements réellement effectués dans Shopify

Relevé sur les **257 produits de la collection côté Admin**, avant modification : usage présent sur 244 fiches, dimensions en texte sur 122 et matière en texte sur 119. Les champs standard couleur et matière étaient respectivement présents sur 67 et 44 fiches. Ce décompte Admin ne prouve pas leur publication sur le canal du site.

Neuf définitions publiques ont été créées et confirmées par Shopify. Les sept champs produit sont `width_cm`, `depth_cm`, `height_cm`, `seat_height_cm`, `has_armrests`, `stackable`, `foldable`. Les deux champs variante sont `color_family`, `material_family`.

**35 hauteurs d’assise** ont été reprises exclusivement depuis une mesure explicite déjà encodée dans le texte de dimensions. Les créations utilisent `compareDigest: null` pour refuser d’écraser une valeur concurrente. Les 35 valeurs ont été relues : type `number_decimal` et égalité numérique vérifiés. Les sources et résultats détaillés sont conservés dans `.context/chair-filters/seat-height-candidates.json` et `.context/chair-filters/dimensions-source.json` (données de travail privées, non versionnées).

Cette opération n’a changé ni les prix, ni les stocks, ni les médias, ni les statuts de publication, ni les tags éditoriaux. Elle n’a pas rempli les couleurs, matières ou caractéristiques par supposition.

## Travail précis à reprendre dans l’importer

Le dépôt importer reste séparé. La référence consultée est `bc584983962f447a2d5a083209609cd9f642e84e`, branche `audit-impl-2026-05-29`. Aucune modification de ce dépôt n’est incluse dans cette livraison.

1. Déclarer dans `config/catalog_rules.yaml` et les politiques de métachamps les nouveaux champs du contrat, avec le bon propriétaire. Les familles de couleur/matière sont des **listes sur les variantes**, pas des tags produit. Réutiliser les trois dimensions numériques déjà prévues et ajouter la hauteur d’assise.
2. Faire passer les valeurs par `CatalogExecution` et ses contrôles communs. Conserver une source fabricant et la transformation dans le rapport d’import. Préserver les mesures exactes, même lorsque le titre applique un arrondi.
3. Pour chaque option fabricant, encoder uniquement les familles confirmées, parmi les vocabulaires du JSON. Une variante peut appartenir à plusieurs familles de matière ; conserver la liste des composants dans le texte détaillé. Une dimension ou caractéristique variable entre configurations ne doit pas devenir une valeur commune au produit.
4. Protéger les handles, identifiants de variantes, médias référencés par le site et décisions éditoriales. Un champ absent d’un nouvel import ne doit pas effacer une valeur vérifiée existante sans différentiel explicite.
5. Qualifier un petit lot comprenant : une chaise à couleurs de prix différents, une variante en stock et une sur commande, des matières variables, une hauteur avec décimale et des valeurs inconnues. Contrôler le différentiel, puis les mêmes sélections dans la preview du site.
6. Les nouvelles fiches préparées pour contrôle restent **DRAFT et sans canal**, conformément aux instructions de l’importer. La création d’une définition ou la fusion du code n’active aucun produit.

Exemple de valeurs : hauteur d’assise `46.5` de type `number_decimal` ; accoudoirs `false` de type `boolean` seulement si vérifié ; couleur de variante `["noir"]` et matières `["bois","metal"]` de type `list.single_line_text_field`.

## Architecture et validation

`lib/chair-catalog.js` parcourt toutes les pages Chaises et toutes les variantes côté serveur, y compris au-delà de 100 variantes. L’index est partagé entre requêtes concurrentes et conservé dans le cache mémoire existant de cinq minutes ; `/api/revalidate` l’invalide. `lib/catalog-filters.js` calcule comptes, facettes, tri et page sur cet index complet. `/api/catalog/chaises` renvoie uniquement les cartes de la page et les facettes. Le navigateur ne télécharge plus toutes les variantes de la collection.

Cette solution est dimensionnée pour le pilote. Un démarrage à froid doit encore lire toute la collection ; ce n’est pas un index de recherche persistant pour des dizaines de milliers de fiches. Son extension à tout le catalogue nécessitera de mesurer le temps de chargement et de choisir un index durable ou les filtres natifs adaptés. Les données commerciales peuvent avoir jusqu’à cinq minutes de retard ; Shopify reste l’autorité au panier.

Les 62 tests couvrent le filtrage par variante, les valeurs absentes, les compteurs, les prix avec centimes, les curseurs, les erreurs et reprises, le rendu serveur, la pagination et les retours de fiche, ainsi que les régressions des familles, tables, navigation et caractéristiques produit. Ils utilisent des réponses Shopify simulées. La requête Storefront et les opérations Admin ont aussi été validées contre les schémas Shopify. La première preview lit 132 modèles publiés sur trois pages (60, 60, 12), dont 15 avec hauteur d’assise connue. Les 35 valeurs complétées côté Admin comprennent aussi des fiches non publiées. La réponse de première page contient environ 54 ko de JSON. La recette visuelle complète est consignée après les derniers ajustements.

Références : [filtres Storefront Shopify](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/filter-products), [définitions de métachamps](https://shopify.dev/docs/apps/build/metafields/definitions).
