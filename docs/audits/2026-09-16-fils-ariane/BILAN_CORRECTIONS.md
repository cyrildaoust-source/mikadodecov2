# Corrections de la navigation — bilan du 16 septembre 2026

Les corrections principales sont **publiées**, via [la PR 101](https://github.com/cyrildaoust-source/mikadodecov2/pull/101). La version `a4dea09` a été relevée sur `/api/build` après déploiement et contrôlée sur le site public. Ce bilan complète l’[audit initial de la version 981c471](rapport.md) ; il ne remplace pas ses constats historiques.

[Ouvrir la preview](https://mikadodecov2-git-corriger-parcours-marques-mikadodeco.vercel.app/collections/luminaires?brand=hay) · [Voir le site publié](https://www.mikadodeco.be/collections/luminaires?brand=hay) · [Plan et suivi](PLAN_ACTION.md)

## Ce qui a changé

| Avant | Maintenant |
|---|---|
| Les sous-catégories perdaient leur famille | Les 39 sous-catégories remontent à l’une des 7 familles |
| Certains parcours de marque étaient classés sous Mobilier | Les collections de marques passent par Marques ; une marque consultée depuis une famille reste dans cette famille |
| Les familles n’avaient pas de fil visible | Le même composant apparaît après leur hero |
| Assises devenait Sièges, Jardin devenait Mobilier outdoor | Les noms des familles restent stables dans le fil |
| La fiche oubliait recherche, matière, filtres, tri ou page | Un lien « Retour à ma sélection » restitue l’adresse de la sélection, son tri et sa pagination |
| La continuation des familles était perdue | Le retour recharge aussi les produits ouverts avec « Voir plus » ; 48 produits restaurés dans la recette réelle |
| La page pouvait être rabattue pendant un chargement partiel | Le catalogue attend la fin du chargement pour borner la page |
| Le catalogue s’arrêtait après 25 lots | Le chargement suit les curseurs jusqu’à la fin ; une panne est signalée comme chargement incomplet avec possibilité de réessayer |
| Le tri utilisait parfois un prix de variante différent du prix affiché | Il suit le prix minimum affiché sur la carte |
| Le panier ne permettait pas de rouvrir les fiches | Image et nom sont cliquables, dans le tiroir et dans Ma sélection, avec la variante choisie |
| D’anciens paniers conservaient seulement un identifiant Shopify | Les anciennes URL par identifiant sont résolues vers le handle ; une fiche dépubliée garde une vraie erreur 404 |
| Le HTML initial et le navigateur avaient des règles différentes | Cartes, fils et JSON-LD partagent le même module de navigation |

Aucune page intermédiaire « marques par famille » n’est ajoutée. Les cartes, boutons, photographies et choix éditoriaux existants sont conservés. Le complément de livraison redirige également les anciens alias `/collections/all` et `/collections/frontpage` vers le catalogue, en conservant leurs filtres.

## Schéma désormais appliqué

```text
Accueil
├── Catalogue
│   ├── Assises → Chaises → Produit
│   ├── Luminaires → HAY → Produit
│   ├── Arts de la table → Verres & carafes → Produit
│   └── Jardin → Tables outdoor → Produit
├── Marques → Artek → Produit
└── Designers → Alvar Aalto → Produit

Fiche produit → Retour à ma sélection
                recherche + filtres + tri + page + produits déjà affichés
Ma sélection → Produit + variante choisie → Ma sélection
```

Le fil décrit le chemin d’arrivée. Une arrivée directe garde `Accueil → Catalogue → Produit` : aucune catégorie principale n’est inventée. Les URL canoniques des produits restent sans provenance ni paramètres de retour. Les recommandations d’une fiche n’héritent pas automatiquement de la catégorie du produit précédent.

## Vérifications et preuves

| Contrôle | Résultat et portée |
|---|---|
| Suites automatisées | **43 tests réussis** : les trois suites imposées, plus les tests de navigation et de pagination |
| Inventaire public complet | **2 920 produits**, 30 lots parcourus, aucun handle absent et aucun doublon |
| Génération des liens | Les 2 920 fiches ont une adresse valide ; **8 488 contextes produit/collection** exécutés sans erreur de génération |
| Routes en production | **455 adresses en HTTP 200**, dont les 162 collections et les 247 destinations de designers visibles |
| Fiches en production | **315 URL contextualisées, représentant 234 produits distincts**, toutes en HTTP 200 |
| Fil et JSON-LD | Aucune incohérence détectée entre les noms du fil serveur et ceux du BreadcrumbList sur les pages contrôlées ; un seul schéma par page concernée |
| Ordinateur | Recette réelle des parcours détaillés ci-dessous, cartes hydratées et liens cliqués |
| Mobile | Deux fiches avec fils longs, à 390 × 844 : retour lisible et aucun débordement horizontal |
| Clavier | Tabulation dans le fil publié : focus visible sur Catalogue |

Les **2 920 URL générées ne sont pas 2 920 requêtes HTTP sur les fiches**. Le contrôle HTTP des fiches porte sur les 315 URL ci-dessus. Les contrôles HTTP et les simulations ne constituent pas une inspection visuelle de toutes les pages. L’accueil, le journal et le panier n’ont pas reçu un fil de catalogue. Le relevé `a4dea09` comprend encore l’ancien alias `/collections/all` sans fil initial ; son complément de correction est couvert séparément par le test de redirection.

Preuves téléchargeables : [routes après correction](routes-apres.csv), [fiches après correction](fiches-apres.csv), [inventaire complet](inventaire-produits-apres.csv), [vérification des contextes](verification-inventaire.json), [comparaison des designers](comparaison-designers.json).

### Parcours observés dans le navigateur

- Luminaires/HAY et Luminaires/Artek → fiche : famille et marque conservées.
- Artek global et Ichendorf Milano → fiche : parent Marques conservé.
- Alvar Aalto → Tabouret 60 : parent Designers conservé.
- Chaises, page 2, prix croissant → fiche → retour : même page, même tri et même position de grille retrouvés.
- Recherche Bistro + Fermob → fiche : recherche et marque conservées dans le retour.
- Verres & carafes + tag verrerie → fiche : matière conservée dans le retour.
- Tables outdoor → Table Luxembourg : parent Jardin conservé.
- Famille Luminaires, 48 produits affichés → fiche → retour : les 48 produits sont rechargés.
- Recherche rapide Bistro → fiche : retour vers les résultats Bistro.
- Ajout d’un Lampadaire Apex sur preview → tiroir → Ma sélection → fiche : variante Emerald green conservée. Retour au panier vérifié et article de test retiré.
- Famille Assises : fil et présentation des cartes vérifiés sur ordinateur.
- Relecture du tri sur la dernière preview : les prix « À partir de » suivent bien l’ordre croissant.

## Ce qui reste à traiter dans les données

Le site et l’importer restent deux dépôts distincts. Cette livraison **ne modifie pas les données Shopify**. Le relevé public montre pourquoi une catégorie principale ne doit pas être générée aveuglément :

- `subcategory` est vide sur les 2 920 produits. Le site lit déjà `custom.subcategory`, puis un éventuel tag `sub:`.
- Le champ API `category` vaut `objets` sur 2 214 produits. C’est une catégorie de présentation dérivée du type, trop large pour constituer une hiérarchie fiable à elle seule.
- Deux produits Esteban n’ont aucune collection : Bouquet parfumé Ellipse 950 ml et Bouquet parfumé Edition Premium 3 L. Leur fiche reste accessible via la marque et la recherche ; leur classement doit être renseigné.
- Les tags matière restent hétérogènes. Le filtre `verrerie` est conservé tel quel ; son exhaustivité nécessite un travail sur les matières.
- Les 10 collections historiques de designers ont été comparées aux tags de l’inventaire complet. Trois sélections sont équivalentes à cet instant (Verner Panton, Jean Prouvé, Julien de Smedt), plusieurs diffèrent (notamment Alvar Aalto : 33 contre 90 produits), et Pierre Paulin/Hans Wegner n’ont pas de profil correspondant dans le répertoire actuel. Aucune redirection de designer n’est décidée sur la seule ressemblance des noms.

### Prochain lot importer, concret

1. Définir une table de correspondance revue entre type fonctionnel, sous-catégorie parmi les 39 entrées et famille parente. Conserver les handles publiés.
2. Produire un export des produits sans sous-catégorie et des appartenances contradictoires. Vérifier notamment intérieur/extérieur et les collections dont une règle repose sur un nom de gamme.
3. Proposer un petit lot de corrections avec valeurs avant/après dans `custom.subcategory`, les tags d’usage et les collections. Vérifier les cas positifs et négatifs avant un import global.
4. Harmoniser matière, marque et designer avec les noms/slugs lus par le site. Conserver les rôles packshot, ambiance et image de variante.
5. Rejouer les tests et la recette des familles après chaque changement du contrat de données. Pour toute nouvelle collection, renseigner son rôle dans `v3/navigation-data.json` ; les marques curées continuent d’utiliser `mega-menu-brands.json`.

Ces actions doivent être coordonnées avec l’agent qui importe actuellement les produits. Aucun champ source n’a été remplacé automatiquement pendant cette correction de navigation.

## Validation Google et limites restantes

Le test Google des résultats enrichis a été ouvert et lancé sur une fiche publique après publication. L’outil a répondu **« Un problème est survenu »**, avec une invitation à réessayer dans quelques heures, sans produire de résultat. La validation externe des cinq types de pages reste donc ouverte. Les contrôles locaux du JSON-LD et les comparaisons avec le HTML serveur sont réussis ; ils ne remplacent pas une validation Google.

Search Console et le nouveau passage de Google restent à suivre après déploiement. Aucune commande payée ni audit complet avec lecteur d’écran n’a été réalisé. Ce bilan clôt les corrections de navigation livrées ; il ne certifie pas que tout le classement importé ou tout le commerce du site est parfait.
