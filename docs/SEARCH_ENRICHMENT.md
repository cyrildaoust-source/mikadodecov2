# Chantier données de recherche — 19 septembre 2026

Première tranche préparée et testable en preview. **Zéro écriture Shopify**, zéro publication de code en production. Le lot couvre les 25 fiches Fermob publiées classées Table, dont une console et un modèle enfant qui nécessitent un traitement distinct.

## Mesure initiale

Snapshot de 2 920 fiches publiques du 19 septembre. Les compteurs ci-dessous portent sur les champs exposés par l’API publique, les options et le texte exploitable ; ils ne certifient pas l’exactitude fabricant de tout le catalogue. L’API publique n’expose pas tous les métachamps canoniques. Les 25 identités Fermob et leurs 625 variantes ont été relues dans Shopify Admin le même jour, avec pagination complète. Les chiffres sont reproductibles avec le script d’audit et le snapshot privé.

| Information | Ensemble du catalogue | Fiches classées table / table à manger |
| --- | ---: | ---: |
| Fiches | 2 920 | 126 |
| Champ dimensions renseigné | 1 396 | 59 |
| Au moins une dimension reconnue, titre compris | 1 676 | 107 |
| Hauteur exploitable | 425 | 22 |
| Champ matière renseigné | 1 463 | 58 |
| Capacité déclarée exploitable | 22 sur 209 tables, canapés et bancs | 9 sur 126 |

36 canapés : 7 capacités déclarées exploitables. 47 bancs : 6. Couleur reconnue pour toutes les variantes sur seulement 625 fiches ; c’est une mesure du vocabulaire actuel, pas une preuve que les couleurs sont absentes du fournisseur. Une fiche présente un prix absent ou non positif dans le snapshot (sous-verre-hip) : revue séparée, aucun prix recalculé.

## Lot Fermob qualifié par champ

- 23 fiches : mesures exactes relues dans les dessins fabricant, en cm. Les cotes du piètement et les hauteurs sous plateau ne deviennent pas des cotes hors tout.
- 16 fiches : capacité déclarée exploitable, dont Ribambelle XL uniquement avec ses 3 allonges pour 14 personnes à 299 cm.
- 5 fiches : contradiction de capacité entre descriptif et caractéristique technique ; aucun chiffre retenu pour filtrer.
- 1 modèle enfant : âge 3–6 ans, capacité inconnue. 1 console : capacité en personnes non applicable.
- 2 rapprochements restent en attente : Luxembourg Guéridon (SKU 4147, dessin trouvé pour 4134, images mêlées) et Airloop (page française indisponible).

Le rapprochement se fonde sur le GID Shopify, le handle, la marque, la référence modèle de chaque SKU, le dessin correspondant et les options exactes des variantes. Un même format et un nom approchant ne suffisent pas. Les références contradictoires ne sont pas appliquées.

| Fiche | Cotes fabricant en cm | Capacité retenue | Source |
| --- | --- | --- | --- |
| Table Bistro Ø 77 cm | Ø 77 × H 74 | 4 places | [Fabricant](https://www.fermob.com/fr/table-bistro-table-o-77-cm.html) |
| Table Bistro Ø 60 cm | Ø 60 × H 74 | 2 places | [Fabricant](https://www.fermob.com/fr/table-bistro-table-o-60-cm.html) |
| Table Caractère 190 x 90 cm | L 190 × l 90 × H 74 | Contradiction | [Fabricant](https://www.fermob.com/fr/table-caractere-table-190-x-90-cm.html) |
| Table Bistro 71 x 71 cm | L 71 × l 71 × H 74 | Contradiction | [Fabricant](https://www.fermob.com/fr/table-bistro-table-71-x-71-cm.html) |
| Table 1900 Ø 96 cm | Ø 96 × H 74 | 5 places | [Fabricant](https://www.fermob.com/fr/table-1900-table-o-96-cm.html) |
| Table Luxembourg 165 x 100 cm | L 165 × l 100 × H 74 | Contradiction | [Fabricant](https://www.fermob.com/fr/table-luxembourg-table-165-x-100-cm.html) |
| Table Luxembourg 207 x 100 cm | L 207 × l 100 × H 74 | Contradiction | [Fabricant](https://www.fermob.com/fr/table-luxembourg-table-207-x-100-cm.html) |
| Table Bistro 57 x 57 cm | L 57 × l 57 × H 74 | 2 places | [Fabricant](https://www.fermob.com/fr/table-bistro-table-57-x-57-cm.html) |
| Table Bistro Ø 96 cm | Ø 96 × H 74 | 5 places | [Fabricant](https://www.fermob.com/fr/table-bistro-table-o-96-cm.html) |
| Table 1900 Ø 117 cm | Ø 117 × H 74 | Contradiction | [Fabricant](https://www.fermob.com/fr/table-1900-table-o-117-cm.html) |
| Table Romane Ø 137 cm | Ø 137 × H 75 | 8 places | [Fabricant](https://www.fermob.com/fr/table-romane-table-o-137-cm.html) |
| Table Ribambelle 3 allonges XL 149/299 x 100 cm | L 149 × l 100 × H 74 ; L 299 × l 100 × H 74 (allonges) | Inconnue ; 14 places avec 3 allonges | [Fabricant](https://www.fermob.com/fr/table-ribambelle-table-3-allonges-xl-149-299-x-100-cm.html) |
| Table Rest'o 71 x 71 cm | L 71 × l 71 × H 74 | 4 places | [Fabricant](https://www.fermob.com/fr/table-rest-o-table-71-x-71-cm.html) |
| Console Picolino | l 93 × P 31 × H 85 | Non applicable | [Fabricant](https://www.fermob.com/fr/meuble-d-entree-picolino-console.html) |
| Table Montmartre Ø 117 cm | Ø 117 × H 74 | 6 places | [Fabricant](https://www.fermob.com/fr/table-montmartre-table-o-117-cm.html) |
| Table Montmartre Ø 96 cm | Ø 96 × H 74 | 5 places | [Fabricant](https://www.fermob.com/fr/table-montmartre-table-o-96-cm.html) |
| Table Luxembourg Kid 76 x 55,5 cm | L 76 × l 55,5 × H 47 | Inconnue | [Fabricant](https://www.fermob.com/fr/mobilier-enfant-luxembourg-kid-table-76-x-55-5-cm.html) |
| Table Luxembourg Guéridon 80 x 80 cm | À vérifier | Non validée | [Fabricant](https://www.fermob.com/fr/table-luxembourg-gueridon-80-x-80-cm.html) |
| Table haute Luxembourg 126 × 73 cm | L 126 × l 73 × H 105 | 6 places | [Fabricant](https://www.fermob.com/fr/table-luxembourg-table-haute-126-x-73-cm.html) |
| Table Luxembourg 4 Pieds 80 x 80 cm | L 80 × l 80 × H 74 | 4 places | [Fabricant](https://www.fermob.com/fr/table-luxembourg-table-4-pieds-80-x-80-cm.html) |
| Table Luxembourg 143 x 80 cm | L 143 × l 80 × H 74 | 6 places | [Fabricant](https://www.fermob.com/fr/table-luxembourg-table-143-x-80-cm.html) |
| Table Bistro 77 x 57 cm | L 77 × l 57 × H 74 | 4 places | [Fabricant](https://www.fermob.com/fr/table-bistro-table-77-x-57-cm.html) |
| Table Airloop Ø 60 cm | À vérifier | Non validée | Page indisponible |
| Table So'o Chêne 180 x 90 cm | L 180 × l 90 × H 74 | 6 places | [Fabricant](https://www.fermob.com/fr/table-d-interieur-so-o-table-ch-ne-180-x-90-cm.html) |
| Table So'o Ø 117 cm | Ø 117 × H 75 | 6 places | [Fabricant](https://www.fermob.com/fr/table-so-o-table-o-117-cm.html) |

Les détails des contradictions, URL des dessins, dates, empreintes SHA-256 et liaisons de variantes sont versionnés dans data/catalog-enrichment/fermob-tables.json. Les captures HTML et dessins originaux sont conservés dans .context/search-enrichment/sources. Les textes longs du fabricant ne sont pas republiés sur le site.

## Effet mesuré, avant publication

| Recherche | Avant lot | Simulation du lot |
| --- | ---: | ---: |
| table pour 6 personnes | 7 | 14 |
| table Fermob pour 6 personnes | 0 | 7 |
| table Fermob diamètre 77 cm pour 4 personnes 300€ | 0 | 1 |
| table Fermob 143 x 80 cm pour 6 personnes | 0 | 1 |
| table Fermob pour 14 personnes | 0 | 1 |
| table Fermob longueur max 150 cm pour 14 personnes | 0 | 0 |

La couverture des capacités passe de 9 à 25 sur les 126 fiches classées tables ; les hauteurs reconnues de 22 à 45. Ces nombres décrivent une simulation avec les produits disponibles et les prix du snapshot, pas une modification du catalogue publié.

## Contrat de stockage et lecture

La définition merchant-owned custom.search_facts, type json, est prévue sur PRODUCT et PRODUCTVARIANT, accessible en Storefront PUBLIC_READ. Elle complète le contrat data/catalog-filter-contract.json v2. Les deux définitions sont préparées, **pas créées dans Shopify**. Ce namespace commun permet à l’importer et au site de partager les données ; aucune app ni métaobjet supplémentaire n’est nécessaire.

Version 1 : configurations distinctes contenant id, label, dimensions et capacity. Dimensions : nombres exacts en cm, axes length, width, depth, height, diameter. Pour les tables de ce lot, length est le grand axe du plateau et width le petit axe ; pour la console, width est la largeur de façade et depth la profondeur. Aucun axe n’est inventé à partir d’un triplet sans légende. Les cotes W/D/H déjà explicitement nommées dans les fiches sont aussi reconnues.

Capacity porte un état verified avec max entier positif, ou unknown / conflict / not_applicable sans nombre. Le validateur lib/search-facts.js refuse zéro, texte numérique, estimation, valeur aberrante et configuration invalide. Un champ présent mais invalide ne réactive pas la capacité d’un ancien texte.

Les faits de variante priment. Les faits produit ne s’appliquent qu’en l’absence d’option de taille/capacité variable. Les dimensions, la capacité, la finition, le prix et la disponibilité doivent être satisfaits par la même variante **et la même configuration**. Une extension ne permet pas de combiner 149 cm fermé avec 14 personnes à 299 cm. Le libellé des allonges nécessaires apparaît dans le libellé existant de la carte. Une capacité non attribuée par la source à la table fermée reste inconnue.

La recherche lit le métachamp sur chaque page de produits et de variantes. En attendant le passage du lot dans l’importer, la preview peut injecter le lot avec VERCEL_ENV=preview ET CATALOG_ENRICHMENT_PREVIEW=1 ; la production ne lit jamais ce lot local. Même dans cette preview, une identité ou des options différentes empêchent l’injection. Un métachamp existant est toujours prioritaire.

## Passage dans l’importer

Le site ne devient pas propriétaire des fiches. scripts/prepare-search-enrichment.cjs produit 23 propositions avec état avant, faits proposés, preuves et préconditions ; il n’écrit pas dans Shopify. Il refuse une source altérée, une fiche changée depuis la capture, des variantes incomplètes/modifiées et l’écrasement d’un métachamp existant. Les deux identités non résolues restent bloquées.

Raccordement restant : intégrer ces faits comme source/mapping dans CatalogExecution, ajouter le contrôle au gate commun puis exporter le patch ciblé. Le pipeline importer n’a pas été modifié dans ce workspace. Préserver titres, handles, options, SKU, EAN, prix, coûts, stocks, médias, tags éditoriaux et publications. Relire Shopify juste avant application ; utiliser le contrôle de concurrence du métachamp (création seulement si toujours absent), puis relire après écriture et invalider le cache du site. Ne jamais réimporter toute une fiche pour ajouter ces faits.

Le standard importer actuel impose une sortie de préparation pour revue, sans écriture automatique sur les fiches existantes (docs/CATALOG_ENCODING_STANDARD.md, ENC-10). La preview est la première validation concrète de ce lot. La validation de données n’est ni une certification Gold ni une autorisation de publication.

## Suite ordonnée et critères de fin

1. Tables : terminer les 101 capacités encore inconnues/non retenues après ce lot, d’abord Artek (32 fiches), Carl Hansen (25), &Tradition (20), HAY (10). Source exacte par format ; distinguer table repas, table haute, enfant, console, fixe et extensible. Résoudre les 5 contradictions Fermob et la référence du guéridon.
2. Canapés et bancs : places par configuration vendue, dimensions exactes et couchage séparé. Ne pas confondre modules et canapé complet, ni largeur et nombre de places.
3. Finitions et matières : couleur normalisée par variante, essence, revêtement, finition, usage intérieur/extérieur. Les noms commerciaux restent visibles. Revoir notamment les tags extérieurs de So’o Chêne, dont la source produit décrit un usage intérieur.
4. Rangement puis luminaires : largeur/profondeur/hauteur, fonctions pertinentes par famille ; toute capacité doit préciser son unité. Prix et stock restent ceux de Shopify, au niveau de la variante.
5. À chaque lot : couverture avant/après, contrôle des conflits et identités, test des demandes client, preview, proposition de patch, application explicite puis vérification de lecture. Le chantier est terminé lorsque les manques applicables ont une valeur sourcée ou une exception explicite avec action de suivi, et que les nouvelles importations conservent ces faits.

## Reproduire

```sh
node scripts/audit-search-data.cjs .context/search-audit/products.json .context/search-enrichment/catalog-audit.json
node scripts/prepare-search-enrichment.cjs .context/search-enrichment/shopify-audit.json .context/search-enrichment/sources .context/search-enrichment/proposals.json
node --test tests/search-enrichment-plan.test.cjs tests/search-facts.test.cjs tests/search-catalog.test.cjs tests/catalog-filters.test.cjs tests/chair-catalog.test.cjs tests/family-pages.test.cjs tests/table-collections.test.cjs tests/product-specs.test.mjs tests/navigation.test.mjs
```

L’audit détaillé par marque/type et la liste des manques se trouvent dans .context/search-enrichment/catalog-audit.json ; les propositions sont dans .context/search-enrichment/proposals.json. Validation GraphQL Admin et Storefront réussie. Les 90 tests passent ; git diff --check est propre.

## Recette de la preview — 19 septembre 2026

Preview : [table pour six personnes — 14 modèles](https://mikadodecov2-b4zyhhn1n-mikadodeco.vercel.app/produits.html?q=table+pour+6+personnes). Le lot préparé est activé uniquement dans cette preview, sans écriture Shopify.

Contrôle sur ordinateur à 1626 px : recherche depuis la barre du haut puis page complète ; Luxembourg 143 × 80 cm pour six personnes, une seule correspondance à 889 €. Les dimensions déjà connues des modèles ronds ne produisent plus de faux signalement de données manquantes pour une recherche de format rectangulaire. La recherche générale pour six personnes affiche 14 modèles.

Contrôle mobile à 390 × 844 px : Ribambelle pour 14 personnes, une correspondance avec « Avec les 3 allonges · longueur 299 cm » lisible sur la carte commune. En ajoutant une longueur maximale de 150 cm, aucun résultat ; retirer explicitement la longueur propose une correspondance, retirer la capacité en propose neuf. Aucun débordement horizontal (document et viewport à 390 px), avertissement ou erreur de console observé sur ce parcours. La taille du navigateur a été réinitialisée après recette.
