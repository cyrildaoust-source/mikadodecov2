# Filtres Chaises — contrat site / importer

Pilote du 16 septembre 2026 sur `/collections/chaises`, étendu le 24 septembre aux sous-catégories du méga menu (Fauteuils, Suspensions, Vases, Verres & carafes…) : la liste est dans `lib/filter-scopes.js`. Restent pour l’instant sur leur liste d’origine :
- les tables, qui ont leurs propres règles intérieur/extérieur (`lib/table-collections.js`) ;
- Canapés : 712 modèles, environ 11 s de lecture complète à froid ;
- les familles, Jardin, Assises, les marques, Promotions, le catalogue et la recherche.

Chaque collection filtrable garde son titre et sa description Shopify, son bandeau, son fil d’Ariane et son adresse (`/collections/<handle>`). L’API correspondante est `/api/catalog/<handle>`. L’index complet d’une collection reste frais 5 min. Pendant 30 min encore, la version précédente est servie tout de suite, pendant que la collection se relit. Le bandeau, les cartes, les boutons et la pagination de 60 produits suivent les composants du site. Le tri initial utilise l’ordre `BEST_SELLING` de Shopify, libellé « Les plus populaires » ; il ne remplace pas les sélections éditoriales du propriétaire.

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

Les 63 tests couvrent le filtrage par variante, les valeurs absentes, les compteurs, les prix avec centimes, les curseurs, les erreurs et reprises, le rendu serveur, la pagination et les retours de fiche, ainsi que les régressions des familles, tables, navigation et caractéristiques produit. Ils utilisent des réponses Shopify simulées. La requête Storefront et les opérations Admin ont aussi été validées contre les schémas Shopify. La première preview lit 132 modèles publiés sur trois pages (60, 60, 12), dont 15 avec hauteur d’assise connue. Les 35 valeurs complétées côté Admin comprennent aussi des fiches non publiées. La réponse de première page contient environ 54 ko de JSON. La recette visuelle est détaillée ci-dessous.

Références : [filtres Storefront Shopify](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/filter-products), [définitions de métachamps](https://shopify.dev/docs/apps/build/metafields/definitions).

## Recette sur la preview réelle

Preview du code `811ac92` : [Chaises](https://mikadodecov2-fn64unhq4-mikadodeco.vercel.app/collections/chaises). Contrôle effectué sur ordinateur (1626 px) puis mobile (390 × 844 px), avec le catalogue Shopify publié.

- Les trois réponses de pagination contiennent 60, 60 et 12 cartes, soit 132 identifiants uniques. Le passage à la page 2 remonte aux filtres et masque le bandeau ; le bouton précédent du navigateur restaure la première page.
- HAY + noir + budget 600–700 € donne la Rey à partir de 611 €. La fiche ouverte affiche précisément 611 €, « Noir profond / Moquette / Non rembourrée », variante `54442188177737`. Le panier de test a reçu cette même variante à 611 €, puis l’article a été retiré. Aucun paiement n’a été effectué.
- Le retour de fiche conserve marque, couleur, budget et position du produit. Carl Hansen & Søn + Artek donne 54 modèles et un fil d’Ariane « Sélection de marques » ; le slug scandinave suit la navigation commune.
- Le filtre En stock retourne 14 modèles, tous présentés en stock. Le tri croissant débute à 72, 89, 95, 99, 109, 119, 149 et 159 €.
- Sur ordinateur, le menu long garde son bouton accessible dans la hauteur de l’écran. Échap le ferme et remet le focus sur son intitulé. Une carte sans seconde image garde sa photo au survol.
- Sur mobile, les filtres se replient, le budget s’applique et une sélection vide propose de retirer les critères ou de revoir toutes les chaises. La largeur du document reste de 390 px, sans débordement horizontal. Les dimensions de contrôle ont été réinitialisées.
- Aucun avertissement ni erreur n’a été capturé dans la console de cette preview pendant le parcours. Les scénarios de panne sont couverts par les tests automatisés ; le paiement et les règles commerciales de livraison restent hors de cette recette.

Les accoudoirs et les mesures ne disposent pas encore d’une couverture permettant une comparaison complète. Les filtres de caractéristiques disponibles reflètent uniquement les informations explicitement encodées ; leur enrichissement, comme celui des familles de couleur et de matière par variante, reste à reprendre dans l’importer avant généralisation aux autres familles.

## Correction des usages du 17 septembre 2026

Les quatre fiches publiées dont l’usage était absent ont reçu `custom.usage = Intérieur` dans Shopify : `artek-domus-chair-seat-upholstered`, `artek-domus-chair-seat-and-back-upholstered`, `artek-domus-chair` et `artek-rope-chair`. Les créations ont utilisé `compareDigest: null`, puis chaque valeur a été relue. Aucun prix, stock, média, tag ou statut de publication n’a changé.

La source est le [guide d’entretien officiel Artek](https://www.artek.fi/en/guides/care-maintenance), qui prévoit un usage intérieur sauf mention contraire dans les spécifications. La [fiche Rope](https://www.artek.fi/en/products/rope-chair) ne mentionne pas d’usage extérieur ; la référence à un usage marin décrit sa corde, pas l’usage de la chaise. L’importer doit préserver ces valeurs vérifiées, ou présenter une source fabricant et un différentiel avant de les modifier. Il ne faut pas généraliser « rembourré = intérieur » aux autres fabricants ni remplacer toutes les données absentes par intérieur.

Après correction, l’API publique retourne toujours 132 modèles, avec 87 références pour l’intérieur et 53 pour l’extérieur ; les produits à double usage participent aux deux comptes. La facette d’usage non renseigné a disparu naturellement. La preview sur ordinateur confirme 18 modèles Artek classés en intérieur. Les 63 tests ont été relancés après la modification des données et passent. Cette intervention porte sur les données ; le propriétaire a demandé de reprendre la présentation des filtres ultérieurement.

## Finitions représentatives — 18 septembre 2026

Le pilote conserve un modèle par carte. Parmi les variantes satisfaisant tous les critères, le classement privilégie les variantes achetables, puis la correspondance de couleur (autres couleurs et composants explicitement nommés pénalisés), puis le prix et un identifiant stable. Le texte des options sert de reprise déterministe ; ce classement n’est pas une reconnaissance des photos ni une certification de couleur. Les familles de couleur vérifiées restent prioritaires pour le filtrage. Le bois peint reste distinct d’un aspect bois naturel. Une matière commune explicitement renseignée n’est plus perdue quand les variantes ne proposent pas de famille de matière alternative.

La carte affiche la finition et son prix exact, même si une autre finition est moins chère. Le tri suit ce prix affiché. Après rectification du propriétaire le 18 septembre, les vignettes photographiques de variantes ont été retirées : une seule finition représentative est affichée par carte, toutes les variantes restant accessibles sur la fiche. Le composant `product-finishes.mjs` porte le libellé commun au serveur et au navigateur. Le survol conserve une vue complémentaire du modèle, distincte des photos associées aux autres variantes.

Deux associations ont été corrigées dans Shopify sur `artek-chair-69`, sans toucher aux données commerciales : SKU `ART-C69-28100472` → image `artek-chair-69-white-lacquer-seat-back.jpg` ; SKU `ART-C69-28100480` → image `artek-chair-69-black-lacquer.jpg`. Les images ont été contrôlées visuellement dans la galerie existante. Les associations et le catalogue publié sont relus après l’opération. Ce contrôle ciblé ne certifie pas toutes les photos du catalogue.

### Recherche globale par critères — 19 septembre 2026

Le propriétaire demande une recherche couvrant la taille, la finition, la capacité et le prix depuis la barre du haut. Le premier prototype limité aux chaises est remplacé par `lib/search-intent.js` et `lib/search-catalog.js`. La catégorie Chaises conserve ses filtres et ses cartes validés.

Preview : [barre globale](https://mikadodecov2-1xy4tbnga-mikadodeco.vercel.app/) et [table 160 × 80 cm pour six personnes](https://mikadodecov2-1xy4tbnga-mikadodeco.vercel.app/produits.html?q=table+160+x+80+cm+pour+6+personnes).

Les demandes peuvent combiner type, marque, couleur, matière, essence ou finition, dimensions nommées (largeur, longueur, profondeur, hauteur, diamètre), format, capacité minimale déclarée, prix, usage et quelques caractéristiques explicites. Le parseur accepte les accords courants, les unités cm/mm/m, les décimales françaises, « 1m60 », les montants avec milliers et des fautes courantes du vocabulaire métier. Les références numériques restent exactes ; aucune compréhension universelle du langage naturel n’est promise. Les mots résiduels restent des critères, les exclusions non prises en charge sont signalées. Sans type, marque ou nom de produit, une demande telle que « noir 500 € » propose de choisir une catégorie.

Les variantes sont filtrées ensemble : couleur, finition, dimensions variables, prix et stock ne peuvent venir de configurations différentes. Une seule carte par produit, réutilisant `resultCard`, `plpCardSsr` et `productCard`. Les cartes gardent la photo, le prix exact, la disponibilité et l’identifiant de la finition retenue ; le composant commun fournit le bouton de sélection. Aucun sélecteur photographique de finitions n’a été ajouté.

Les données manquantes ne sont pas estimées. La capacité est lue dans un intitulé ou une description explicites, ou une option de capacité. Une table annoncée pour quatre à six personnes peut répondre à six personnes ; une dimension seule ne permet pas d’en déduire la capacité. Les cotes nommées ne sont jamais reconstruites depuis un triplet sans légende. Un format écrit reste recherchable comme format. Les dimensions précises de la fiche priment sur un titre arrondi, et une option de taille empêche d’appliquer les dimensions d’une autre configuration. L’audit public du catalogue a relevé 2 920 produits, dont 1 396 avec le champ dimensions rempli ; les titres et options apportent des formats supplémentaires. La capacité reste très peu renseignée : la recherche « table pour 6 personnes » inclut sept modèles et signale 116 modèles avec capacité à confirmer. Ce relevé ne certifie pas les informations des fabricants et ne modifie aucune fiche Shopify.

`/api/search?q=…` et la page serveur `/produits.html?q=…` partagent l’interprétation des demandes et les résultats. `/api/predictive` utilise cette sélection complète dès qu’une phrase comporte des critères et en présente huit modèles. Les débuts de mots, noms seuls et marques seules gardent l’autocomplétion native légère, notamment ses suggestions de marques et catégories. Les recherches déjà restreintes par un contexte distinct (marque, catégorie ou créateur) conservent leur contrôleur existant.

Les critères compris sont visibles, les contraintes retirables avec `omit`, les liens conservant la demande, le tri, la page et le retour de fiche. Le type de produit reste visible ; on le change en modifiant la phrase. Aucun critère ne se relâche automatiquement. Une sélection vide propose jusqu’à trois retraits, avec leurs comptes réels. Les résultats s’affichent par pages de 60, après parcours complet, avec un tri portant sur le prix effectivement présenté. Une panne reste une réponse 503 avec nouvelle tentative, sans faux résultat vide. Les requêtes dépassées ne remplacent pas la saisie actuelle.

Les catégories identifiées utilisent les types produit Shopify de `data/search-product-types.json`, relevés dans le catalogue publié et contrôlés par le prédicat de famille. Ce fichier ne change pas les appartenances Shopify ni les sélections éditoriales ; le compléter quand l’importer ajoute une nouvelle dénomination de type. Les requêtes correspondantes récupèrent les produits par lots de 100, les autres emploient la recherche native paginée. Toutes les pages de variantes sont parcourues. Cache mémoire de cinq minutes, douze périmètres maximum, requêtes simultanées identiques mutualisées ; `/api/revalidate` invalide cet index. Les démarrages à froid restent dépendants de Shopify. La première itération, utilisant seulement le plein texte, avait pris 12,8 secondes pour les chaises ; la récupération par type a ramené le relevé à 3,8 secondes à froid, contre 1,1 seconde pour les lampes de table. Ce ne sont pas des mesures sous charge ni un SLA. Un index durable reste une amélioration possible pour les recherches à froid.

Les requêtes ont été validées contre le schéma Storefront avec le skill Shopify. Références : [recherche Storefront](https://shopify.dev/docs/api/storefront/2026-07/queries/search), [ProductConnection et filtres](https://shopify.dev/docs/api/storefront/2026-07/connections/ProductConnection), [variantes](https://shopify.dev/docs/api/storefront/2026-07/objects/Product).

Recette : 79 tests passent (`search-catalog`, `catalog-filters`, `chair-catalog`, `family-pages`, `table-collections`, `product-specs`, `navigation`). Les cas couvrent notamment les unités, les budgets, la variante commune, les dimensions arrondies et variables, les capacités absentes, les alternatives explicites, les références, les erreurs amont, la pagination, le tri, les retours et l’échappement HTML. Le parseur du prototype Chaises devenu inutilisé est retiré.

Contrôle visuel de la preview sur ordinateur à 1626 px puis mobile à 390 × 844 px : barre globale, critères, résultats, cartes communes et boutons ; recherche d’une table 160 × 80 cm pour six personnes, fiche Kaari REB012 à 2 190 €, finition Chêne — lamifié blanc brillant, puis retour à la sélection ; recherche sans résultat « canapé 3 places 100 € », proposition de retirer le budget puis affichage de trois modèles ; barre mobile « chaise noir 500 € », 45 modèles, sans débordement (document 390 px), fermeture par Échap avec restitution du focus. Aucun avertissement ou erreur de console observé sur ce parcours. La taille du navigateur a été réinitialisée. Livraison en preview uniquement.

### Enrichissement des données de recherche — 19 septembre 2026

Le [chantier d’enrichissement](SEARCH_ENRICHMENT.md) complète cette première recherche avec des faits structurés par configuration et variante, un audit reproductible des 2 920 fiches et un premier lot Fermob sourcé : 23 jeux de dimensions et 16 capacités exploitables. Les contradictions restent exclues et les capacités avec allonges sont liées à leurs dimensions déployées. Le lot est préparé pour l’importer et activé uniquement dans la [nouvelle preview](https://mikadodecov2-b4zyhhn1n-mikadodeco.vercel.app/produits.html?q=table+pour+6+personnes), sans écriture Shopify ; la recherche pour six personnes passe de 7 à 14 modèles. Les 90 tests et la recette ordinateur/mobile sont détaillés dans ce dossier.
