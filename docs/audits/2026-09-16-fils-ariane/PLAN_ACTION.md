# Plan de correction du fil d’Ariane Mikado

Référence : [rapport du 16 septembre 2026](rapport.md), version auditée `981c471`.

**État au moment de la livraison : audit réalisé, documents accessibles sur GitHub ; corrections ci-dessous à réaliser.** Les cases ne doivent être cochées qu’après vérification. Une réponse HTTP 200 ou des tests réussis ne suffisent pas à valider un parcours.

## Ordre de réalisation

| Lot | Résultat attendu | Constats couverts | Responsable |
|---|---|---|---|
| A | Même hiérarchie, mêmes noms et bonne distinction famille / marque partout | F02, F03, F05 | Dépôt du site |
| B | Retour à la sélection exacte et fil présent dès l’affichage des pages | F01, F04, F06, F09 | Dépôt du site |
| C | Collections qualifiées et données structurées cohérentes | F07, F08 | Site, curation et importer |
| D | Validation élargie et contrôle après publication | Tous | Site ; importer pour les erreurs de données |

Les lots A et B peuvent avancer sans attendre la fin des imports. Le lot C doit préserver les handles existants et les choix du propriétaire. Le lot D clôt les corrections ; il ne doit pas être remplacé par une simple relecture du code.

## Lot A — la bonne hiérarchie pour chaque type de page

- [ ] Partager le rôle et le parent des collections entre le serveur, le catalogue et les fiches. Réutiliser le menu, la configuration des familles et la source des marques.
- [ ] Relier chacune des 39 sous-catégories à sa famille. Conserver les liens transversaux, comme Tables → Tables outdoor, sans changer automatiquement leur parent de référence.
- [ ] Corriger la classification des sept marques : Blomus, Ichendorf Milano, LIND DNA, Relaxound, Stoff Nagel, String Furniture et Volta Mobiles.
- [ ] Garder le niveau Marques sur les fiches issues des 28 destinations de marques, avec ou sans collection dédiée.
- [ ] Garder simultanément la famille et la marque lorsqu’une marque est choisie depuis une famille ; conserver aussi la sous-catégorie lorsque le départ est plus précis.
- [ ] Utiliser les libellés Assises et Jardin partout. Harmoniser le libellé du catalogue dans le fil, sans modifier les handles.
- [ ] Définir un repli stable lorsqu’un contexte est ancien, inconnu ou incompatible avec le produit.

**Critères de clôture :** la liste et sa fiche affichent la même suite d’ancêtres ; chaque ancêtre ouvre la sélection annoncée. Artek global passe par Marques ; Artek dans Luminaires garde Luminaires. Aucune page « marques par famille » supplémentaire n’est créée.

**Recette minimale :** assertions pour les 7 familles, 39 sous-catégories et 28 marques ; parcours réels Luminaires/HAY, Luminaires/Artek, Artek global, Ichendorf, Assises/Chaises et Jardin/Tables outdoor dans une preview sur ordinateur.

## Lot B — retrouver sa sélection et stabiliser le rendu

- [ ] Transmettre une adresse de retour interne conservant la recherche, les catégories, la marque, le designer, la matière, le tri et la pagination lorsqu’ils sont présents.
- [ ] Produire le même lien produit dans le HTML initial et après chargement JavaScript.
- [ ] Transmettre la provenance depuis la recherche rapide, les cartes de famille, les listes et les sélections éditoriales.
- [ ] Ajouter « Retour à ma sélection » sur les fiches concernées, avec les composants communs. Garder les liens d’ancêtres pour remonter dans la hiérarchie.
- [ ] Conserver autant que possible la position dans la grille ; restituer au minimum la bonne page et le bon tri.
- [ ] Afficher le fil sur les sept familles et le préremplir côté serveur lorsque les données sont connues.
- [ ] Rendre l’image et le nom d’un article de Ma sélection cliquables vers sa fiche ; gérer la variante et le cas d’un produit dépublié.
- [ ] Vérifier qu’un produit recommandé n’hérite pas d’une catégorie à laquelle il n’appartient pas.

**Critères de clôture :** les retours Bistro/Fermob, Chaises filtrées, verrerie, page 2 et designer restituent la sélection attendue. Un clic avant chargement complet et un clic après chargement conduisent au même contexte. Une arrivée directe garde un chemin fiable ; aucun retour trompeur n’est inventé.

**Recette minimale :** ces cinq retours dans le navigateur, plus recherche rapide, ouverture dans un nouvel onglet, rechargement, accès direct et navigation clavier. Vérifier visuellement les noms longs et l’emplacement du fil sur ordinateur, puis sur mobile.

## Lot C — classement et référencement

- [ ] Attribuer un rôle aux 162 collections : famille, sous-catégorie, marque, gamme, designer ou opération éditoriale.
- [ ] Comparer les collections historiques de designers à leurs listes actuelles avant de décider d’éventuelles redirections.
- [ ] Vérifier les champs existants `category`, `productType`, `subcategory` et `collections` avant de définir une catégorie principale par produit.
- [ ] Documenter avec l’importer les appartenances, l’usage intérieur / extérieur, l’identité des marques et designers, les matières et la stabilité des handles.
- [ ] Réutiliser la hiérarchie partagée dans les données structurées ; documenter le chemin de référence et le contexte d’arrivée visible.
- [ ] Conserver une URL canonique stable par produit et des redirections explicites en cas de migration justifiée.
- [ ] Valider le balisage sur des pages famille, sous-catégorie, marque, designer et produit avec l’outil Google des résultats enrichis.

**Critères de clôture :** aucune marque ni aucun designer ne devient une catégorie Mobilier par défaut ; les exceptions restantes sont listées. Le fil ne déduit pas un parent non vérifié à partir d’un simple mot du nom du produit. Les données structurées suivent la règle retenue.

**Dépendance externe :** les corrections d’appartenance dans Shopify doivent être coordonnées avec l’importer. Search Console nécessite l’accès à la propriété et un nouveau passage de Google ; son résultat ne peut pas être garanti le jour du déploiement.

## Lot D — élargir la validation et publier les corrections

- [ ] Ajouter des tests de parcours aux tests existants : parents, marques, filtres combinés, retour, contexte invalide et rendu serveur / navigateur.
- [ ] Exécuter les trois suites imposées par `AGENTS.md` et corriger les erreurs pertinentes.
- [ ] Refaire le contrôle des destinations recensées et vérifier les ancêtres générés après les corrections.
- [ ] Élargir le contrôle automatisé des liens aux fiches publiées, avec pagination complète et déduplication ; distinguer les liens contrôlés automatiquement des fiches réellement observées dans le navigateur.
- [ ] Contrôler aussi les destinations du répertoire Designers, les sélections vides et les contextes anciens ; documenter les exceptions.
- [ ] Valider les parcours représentatifs sur ordinateur, puis sur mobile. Contrôler focus, noms longs et position du fil.
- [ ] Fournir une preview HTTPS de chaque lot modifiant le site, avec des liens vers les cas corrigés et le résultat des vérifications.
- [ ] Après publication, relever la version effectivement servie et rejouer les parcours prioritaires en production.
- [ ] Mettre à jour le rapport avec les preuves avant / après et les éventuels points restant ouverts.

Commande de base :

```sh
node --test tests/family-pages.test.cjs tests/table-collections.test.cjs tests/product-specs.test.mjs
```

**Définition de terminé :** une règle partagée pour les chemins, des retours exacts, un rendu cohérent, les vérifications automatiques et visuelles réussies, et aucune anomalie prioritaire laissée sans traitement ou explication. Le contrôle de toutes les URLs ne doit jamais être présenté comme une inspection visuelle de toutes les fiches.
