# Audit des fils d’Ariane et des retours produit — Mikado

Audit du 16 septembre 2026, sur le site public **www.mikadodeco.be**, version **981c471**. Le contenu du code local correspond à cette version de `origin/main`. Cet audit ne modifie pas le site.

**Verdict : les destinations contrôlées répondent correctement, mais le parcours n’est pas encore cohérent de bout en bout.** Les principales faiblesses sont la perte de la sélection d’origine, l’absence des familles parentes et deux traitements différents des marques. Une page qui répond en HTTP 200 ne garantit ni un bon classement, ni un retour utile.

[Plan de correction et suivi](PLAN_ACTION.md) · [Ouvrir le schéma en image](schema.png) · [Inventaire des 209 adresses](routes.csv) · [Échantillon des 123 URL produit](produits.csv) · [Parcours observés sur ordinateur](parcours-visuels.csv)

![Schéma des parcours observés et de la hiérarchie proposée, avec un retour distinct vers la sélection d’origine](schema.png)

## 1. Ce qui a réellement été vérifié

| Contrôle | Couverture | Ce que cela démontre |
|---|---|---|
| Version déployée | `/api/build` : 981c471 ; comparaison avec Git | L’audit porte sur la version actuellement publiée |
| Collections publiques | 162 collections recensées et leurs 162 adresses demandées | Disponibilité des routes, titre, canonique, HTML initial et données structurées |
| Navigation élargie | 209 adresses : 7 familles, 39 sous-catégories, 28 destinations de marques, 28 sélections famille + marque, 92 autres collections, 15 entrées complémentaires | Toutes aboutissent à une réponse 200, après redirection lorsqu’elle existe |
| Fiches produit | 123 URL, représentant 103 produits distincts | Toutes répondent en 200 et contiennent des données structurées Product ; échantillon pris dans le HTML des listes |
| Logique des fils | 203 contextes exécutés avec les fonctions exactes du site | 154 contextes utilisent un produit réel de l’échantillon ; 49 un produit témoin faute de fiche disponible dans le HTML initial |
| Modèles de pages | 28 fichiers HTML, dont le modèle partagé des familles | Présence des emplacements, composants et règles de construction |
| Navigateur réel | Les 7 familles, 13 parcours d’entrée vers une fiche, un article du journal ; clics de retour sur 5 parcours | Confirmation du comportement après chargement JavaScript, sur ordinateur à 1566 × 898 |
| Clavier | Tabulation entre les liens du fil d’une fiche Artek | Focus visible, navigation nommée, dernier élément identifié comme page courante |
| Tests existants | 32 tests réussis, aucun échec | Base de non-régression familles, tables et caractéristiques ; ces tests ne certifient pas à eux seuls les fils d’Ariane |
| Redirections et erreurs | 3 anciennes entrées, 1 collection inexistante, 1 produit inexistant | Redirections vers les routes attendues ; erreurs inexistantes en 404 |

Les 123 URL produit ne sont pas 123 produits différents : certaines fiches ont plusieurs contextes d’entrée. Les simulations de code ne sont pas des visites dans le navigateur. L’absence d’un produit dans le HTML initial n’est pas une preuve que sa collection est vide après chargement.

Le contrôle couvre les règles globales et toutes les collections publiées, **pas chaque fiche, chaque variante ni les 247 profils de designers visibles un par un**. L’audit mobile, une commande payée, le lecteur d’écran, Search Console et un test Google des résultats enrichis ne sont pas inclus. Le dépôt importer n’a pas été audité dans cette intervention.

## 2. Schéma simplifié : état actuel

```text
Accueil
├── Familles : Assises, Tables, Luminaires, Décoration, Jardin…
│   └── Pas de fil d’Ariane visible sur ces 7 pages
│
├── Sous-catégorie : Lampes de table
│   ├── Liste : Accueil > Mobilier > Lampes de table
│   └── Produit : Accueil > Lampes de table > Produit
│       Le niveau Luminaires manque dans les deux cas.
│
├── Luminaires, puis HAY
│   ├── Liste : Accueil > Mobilier > Luminaires > HAY
│   └── Produit : Accueil > Luminaires > HAY > Produit
│       Le retour HAY conserve bien Luminaires + HAY.
│
├── Marques, puis Artek
│   ├── Liste : Accueil > Marques > Artek
│   └── Produit : Accueil > Artek > Produit
│       Le niveau Marques disparaît.
│
└── Recherche « Bistro », filtre Fermob
    ├── Produit : Accueil > Marques > Fermob > Produit
    └── Retour Fermob : tous les produits Fermob
        Le mot Bistro est perdu.
```

Le même produit peut donc présenter plusieurs fils. Ce n’est pas mauvais en soi : un client peut légitimement arriver par une famille, une marque ou un designer. Le problème apparaît lorsque la sélection se perd ou que des niveaux changent sans raison.

## 3. Ce qui fonctionne et doit être conservé

- **Famille + marque** : Luminaires → HAY → Lampadaire Apex → HAY ramène bien à `/collections/luminaires?brand=hay`. Les quatre cartes de marques de Luminaires pointent directement vers ces sélections. Il n’y a pas besoin de recréer une page « luminaires par marque ».
- **Designer** : Alvar Aalto → Tabouret 60 → Alvar Aalto conserve le filtre designer et le lien vers le répertoire Designers.
- **Marques sans collection dédiée** : Avolt utilise `/produits.html?brand=avolt` et garde `Accueil > Marques > Avolt > Produit` sur la fiche.
- **Accès direct à une fiche** : le repli `Accueil > Le catalogue > Produit` est honnête tant que la catégorie principale n’est pas suffisamment fiable pour être affichée.
- **Composant commun** : `breadcrumbHTML()` produit une liste de liens, une navigation nommée et un dernier élément non cliquable. Le style et le focus clavier sont déjà utilisables.
- **URLs canoniques des produits** : le paramètre de provenance n’est pas inclus dans l’URL canonique. Les différents chemins d’arrivée ne créent donc pas volontairement plusieurs identités canoniques pour la même fiche.
- **Anciennes adresses** : `/products/chaise-panton` redirige en 301 vers la fiche actuelle ; l’ancienne entrée `/produits.html?coll=luminaires&brand=hay` garde les deux critères après sa redirection en 302.
- **Page supprimée à la demande du propriétaire** : `/marques.html?collection=luminaires` redirige en 302 vers Luminaires. Cette ancienne étape ne doit pas revenir.

La sémantique de navigation observée correspond aux principes du [modèle de fil d’Ariane du W3C](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/). Cela ne constitue pas une certification d’accessibilité de l’ensemble du site.

## 4. Les problèmes, par priorité

P1 = parcours à corriger en premier. P2 = cohérence et robustesse à traiter ensuite. Aucun blocage généralisé ni lien produit en 404 n’a été constaté dans l’échantillon valide.

### F01 — P1 : impossible de retrouver exactement certaines sélections

**Confirmé dans le navigateur, avec clics vers les fiches.**

| Départ | Fiche ouverte | Destination proposée par le fil | Information perdue |
|---|---|---|---|
| `?q=Bistro&brand=fermob` | Table Bistro Ø 96 cm | `/collections/fermob` | La recherche Bistro |
| `?cats=chaises` | Chaise Bistro Métal | `/produits.html` | Le filtre Chaises |
| `/collections/verres-carafes?tag=verrerie` | Bouteille Animal Farm | `/collections/verres-carafes` | Le filtre verrerie |
| `/collections/chaises?page=2` | Chaise VLA61 Monarch | `/collections/chaises` | La page 2 |
| Recherche rapide « Bistro » dans l’en-tête | Table Bistro Ø 96 cm | `/produits.html` | Le mot recherché et les résultats |

Dans le cas de la verrerie, le lien de retour autorise une sélection plus large que la sélection éditoriale « La transparence et la couleur ». Le code perd aussi le tri et les curseurs lorsqu’ils existent ; leur effet visuel n’a pas été testé séparément.

**Cause :** `listingContext()` conserve la collection, la marque ou le designer, mais pas `q`, `cats`, `tag`, `page`, `sort` ou `cursor`. Les liens de la recherche rapide ne transmettent aucune provenance.

**Correction recommandée :** garder un fil hiérarchique simple et ajouter un lien discret « Retour à ma sélection » sur les fiches issues d’une liste. Il doit retrouver l’adresse complète de la sélection, puis idéalement sa position dans la grille. Cliquer sur un ancêtre du fil peut légitimement élargir la sélection ; ce lien de retour distinct doit rendre l’intention explicite.

**Critère de réussite :** depuis une liste filtrée et paginée, ouvrir une fiche puis revenir doit restituer la même recherche, les mêmes filtres, le même tri et la même page. Tester aussi l’ouverture dans un nouvel onglet. Le bouton Précédent du navigateur est un autre mécanisme : cet audit ne dit pas qu’il perd systématiquement l’historique.

Sources : [construction du contexte](https://github.com/cyrildaoust-source/mikadodecov2/blob/981c471/v3/brand-navigation.mjs#L2), [cartes produit](https://github.com/cyrildaoust-source/mikadodecov2/blob/981c471/v3/shared.js#L554), [recherche rapide](https://github.com/cyrildaoust-source/mikadodecov2/blob/981c471/v3/shared.js#L869).

### F02 — P1 : les 39 sous-catégories sautent leur famille parente

**Règle confirmée par le code sur les 39 sous-catégories ; observée notamment sur Lampes de table, Chaises et Verres & carafes.**

Exemple : depuis Lampes de table, la fiche Prêt à Racket affiche `Accueil > Lampes de table > Produit`. Le client peut revenir aux lampes de table, mais ne dispose pas du niveau Luminaires dans le fil. La liste elle-même affiche `Accueil > Mobilier > Lampes de table` et saute aussi Luminaires.

Les liens existants ne sont pas cassés ; la hiérarchie est incomplète. Pour quelqu’un qui découvre une fiche depuis un moteur de recherche, ce repère devient encore plus utile.

**Correction :** partager une relation explicite sous-catégorie → famille, à partir du menu et des décisions de curation. Le fil d’une sous-catégorie et celui de ses produits doivent utiliser le même chemin. Un raccourci éditorial entre familles n’oblige pas à changer le parent canonique.

**Critère de réussite :** `Accueil > Catalogue > Luminaires > Lampes de table > Produit`, avec tous les ancêtres cliquables et leur contenu correspondant au libellé. Même règle pour les 39 sous-catégories, sans ajouter de page intermédiaire.

Sources : [fil du catalogue](https://github.com/cyrildaoust-source/mikadodecov2/blob/981c471/v3/produits.html#L758), [fil des produits](https://github.com/cyrildaoust-source/mikadodecov2/blob/981c471/v3/produit.html#L94), inventaire du menu public.

### F03 — P1 : les marques ont deux traitements incompatibles

**Premier problème : 7 marques sont classées sous Mobilier au lieu de Marques.**

| Marque | Adresse existante |
|---|---|
| Blomus | `/collections/blomus` |
| Ichendorf Milano | `/collections/ichendorf-milano` |
| LIND DNA | `/collections/lind-dna` |
| Relaxound | `/collections/relaxound` |
| Stoff Nagel | `/collections/stoff-nagel` |
| String Furniture | `/collections/string-furniture` |
| Volta Mobiles | `/collections/volta` |

Le cas Ichendorf est confirmé visuellement : `Accueil > Mobilier > Ichendorf Milano`. La liste locale `BRAND_HANDLES` contient 17 handles, dont seulement 15 des 22 marques configurées avec une collection. Elle n’est pas synchronisée avec la source des liens de marques.

**Deuxième problème : le niveau Marques disparaît sur les fiches issues des 22 collections de marques.** Artek affiche bien `Accueil > Marques > Artek` sur la liste, puis `Accueil > Artek > Lampe de table Kori` sur la fiche. Avolt, qui passe par un filtre `?brand=`, conserve correctement Marques. Le résultat dépend donc du format de l’URL plutôt que du type de page.

**Correction :** utiliser la même source de classification des marques dans le catalogue, les fiches et le serveur. Distinguer une marque globale d’une marque filtrée dans une famille.

**Critères de réussite :** les 28 destinations de marques se comportent de façon identique ; un produit ouvert depuis Artek garde Marques ; un produit ouvert depuis Luminaires + Artek garde Luminaires et Artek. Ces deux parcours doivent rester distincts et utiles.

Sources : [liste divergente](https://github.com/cyrildaoust-source/mikadodecov2/blob/981c471/v3/produits.html#L456), [source des marques](https://github.com/cyrildaoust-source/mikadodecov2/blob/981c471/v3/mega-menu-brands.json), [résolution commune existante](https://github.com/cyrildaoust-source/mikadodecov2/blob/981c471/v3/shared.js#L431).

### F04 — P2 : les sept pages familles n’affichent aucun fil

**Confirmé dans le navigateur sur les sept pages.** Assises, Tables, Luminaires, Décoration, Jardin, Rangement et Arts de la table n’ont pas de fil visible, alors que leurs sous-catégories et produits en ont un.

Un visiteur peut toujours utiliser l’en-tête. L’incohérence vient du changement de repère lorsqu’il passe d’une famille à une liste. Le modèle commun des cinq familles ne contient aucun emplacement de fil ; les deux modèles historiques Assises et Jardin non plus.

**Correction :** intégrer le composant existant à une position stable dans les trois modèles concernés, en respectant le grand visuel d’entrée. Vérifier l’emplacement dans une preview sur ordinateur avant publication. L’absence d’un fil sur l’accueil ou une page de contact n’a pas le même enjeu et n’est pas classée comme anomalie prioritaire.

Sources : `templates/family-page.html`, `v3/famille-assises.html`, `v3/famille.html` ; captures et observations navigateur.

### F05 — P2 : les mots changent selon le parcours

**Confirmé sur les fiches Panton et Balad².** La famille Assises devient « Sièges » sur une fiche ouverte sans filtre marque ; Jardin devient « Mobilier outdoor ». Le parcours famille + marque emploie pourtant Assises et Jardin. « Mobilier » et « Le catalogue » pointent aussi vers la même page `/produits.html` selon le composant.

**Cause :** les titres viennent alternativement de Shopify, du menu ou d’une petite table de correspondance locale.

**Correction :** conserver les libellés de présentation décidés par le propriétaire dans un registre partagé. Proposition pour le fil : « Catalogue », « Assises », « Jardin ». Cela ne nécessite aucun changement de handle ni renommage du menu principal Mobilier.

**Critère de réussite :** une destination garde le même libellé sur sa liste, ses fiches et ses données structurées, avec ou sans filtre marque.

Sources : `v3/mega-menu.js:18`, `v3/produit.html:107`, `v3/produit.html:120`, `/api/collections`.

### F06 — P2 : le premier HTML ne transmet pas toujours le même parcours

**Confirmé par comparaison du HTML public et du navigateur chargé.**

| Type de liste | Liens produit distincts par page, additionnés dans le HTML initial | Avec contexte `from` |
|---|---:|---:|
| 7 familles | 126 | 0 |
| 39 sous-catégories | 702 | 0 |
| 28 destinations de marques | 463 | 45 |
| 28 sélections famille + marque | 473 | 473 |

Ces totaux comptent les occurrences par page, pas des produits uniques. Après chargement JavaScript, les cartes de catégories reçoivent bien leur contexte. Un clic très précoce peut donc ouvrir une fiche avec un fil différent de celui obtenu après chargement. Les 123 fiches échantillonnées contiennent leurs données structurées de fil dans le HTML initial, mais pas de fil visible déjà rempli.

**Correction :** transmettre le même contexte aux cartes rendues par le serveur et aux cartes rendues par JavaScript. Produire aussi le fil visible côté serveur lorsque ses données sont connues, puis réutiliser le même résultat au chargement.

**Critères de réussite :** même `href` avant et après chargement pour une carte donnée ; pas de disparition de contexte en cas de clic immédiat ; fil exploitable même si le JavaScript arrive tard. Le scénario de JavaScript désactivé n’a pas été exécuté dans le navigateur pendant cet audit.

Sources : `server.js:247`, rendu des collections autour de `server.js:620`, `v3/shared.js:558`, `v3/produit.html:94`.

### F07 — P2 : le fil transmis aux moteurs et le fil visible divergent

Exemple sur Lampadaire Apex ouvert depuis Luminaires + HAY :

```text
Visible après chargement : Accueil > Luminaires > HAY > Lampadaire Apex
JSON-LD du serveur      : Accueil > Le catalogue > Lampadaire Apex
```

Les pages de designers ont également un JSON-LD générique via Le catalogue alors que le fil visible passe par Designers. Les cinq familles du modèle partagé ont un BreadcrumbList dans leur HTML ; Assises et Jardin n’en ont pas dans leur réponse initiale.

Cela ne prouve pas une pénalité SEO. Google accepte plusieurs chemins pour une même page. Ici, les différences proviennent de constructions séparées et non d’un choix de hiérarchie documenté. [Documentation officielle Google sur les fils d’Ariane](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).

**Correction :** définir un chemin de référence stable pour les moteurs et décider explicitement comment il coexiste avec le contexte de navigation visible. Réutiliser une seule représentation de la hiérarchie ; éviter que le HTML, les microdonnées et le JSON-LD se contredisent par accident. Conserver les canoniques propres des fiches.

**Critères de réussite :** vérifier liste, famille, marque, designer et fiche dans le test Google des résultats enrichis ; contrôler ensuite les pages indexées dans Search Console. Ces outils n’ont pas été utilisés dans cet audit et aucun résultat d’indexation n’est garanti ici.

Source : [générateur serveur](https://github.com/cyrildaoust-source/mikadodecov2/blob/981c471/server.js#L220).

### F08 — P2 : les collections ne sont pas toutes des catégories

Les 162 collections mélangent des familles, sous-catégories, marques, gammes, designers et opérations commerciales. La règle générale « toute collection qui n’est pas dans la liste des marques relève de Mobilier » est trop pauvre.

Huit handles de collections correspondent exactement à des slugs de designers : `verner-panton`, `alvar-aalto`, `jean-prouve`, `julien-de-smedt`, `charles-ray-eames`, `pascal-mourgue`, `achille-castiglioni`, `hella-jongerius`. Ils ont des routes distinctes du parcours `/produits.html?designer=…`. Leurs inventaires ne sont pas certifiés équivalents : il ne faut pas les rediriger en bloc sans comparaison.

**Correction :** qualifier le rôle de chaque collection : famille, sous-catégorie, marque, gamme, designer, sélection temporaire. Définir ensuite son parent et, lorsqu’il existe plusieurs URLs réellement équivalentes, une destination de référence. Les collections sans produits dans le HTML initial restent à examiner avant de conclure qu’elles sont vides.

**Critère de réussite :** une nouvelle collection importée ne devient pas automatiquement un mauvais niveau du fil. Le site sait présenter son rôle ou applique un repli neutre documenté.

### F09 — P2, adjacent au fil : la sélection ne permet pas de rouvrir une fiche

Dans `v3/selection.html:153`, l’image et le nom d’un article sont rendus sans lien produit. C’est une coupure supplémentaire du parcours de comparaison : un client qui veut relire une dimension doit retrouver le produit ailleurs.

**Constat issu du code, pas d’un panier rempli dans le navigateur.** Aucune commande ni modification de panier n’a été réalisée pour cet audit.

**Correction :** rendre le nom et l’image cliquables vers la fiche ; conserver l’identité produit et, si possible, la variante choisie. Tester séparément les cadeaux et les articles devenus indisponibles.

## 5. Schéma cible recommandé — uniquement avec les pages existantes

```text
Accueil
├── Catalogue                         /produits.html
│   ├── Assises                       /collections/sieges
│   │   └── Chaises                   /collections/chaises
│   │       └── Produit
│   └── Luminaires                    /collections/luminaires
│       ├── Lampes de table           /collections/lampes-de-table
│       │   └── Produit
│       └── HAY, dans Luminaires      /collections/luminaires?brand=hay
│           └── Produit
├── Marques                           /marques.html
│   └── HAY, toute la marque          /collections/hay
│       └── Produit
└── Designers                         /designers.html
    └── Alvar Aalto                   /produits.html?designer=alvar-aalto
        └── Produit

Depuis une fiche issue d’une liste :
« Retour à ma sélection » → recherche + filtres + tri + page d’origine
```

« HAY, dans Luminaires » représente le catalogue filtré déjà existant. Ce schéma ne propose **aucun nouvel annuaire de marques par famille**. Si la marque est choisie à l’intérieur d’une sous-catégorie, cette sous-catégorie doit aussi rester dans le chemin. Une navigation volontaire par le menu global Marques ouvre légitimement toute la marque.

Les produits recommandés, l’accueil et les liens externes peuvent utiliser un chemin de référence neutre ou une catégorie principale vérifiée. Ils ne doivent pas hériter artificiellement d’une catégorie qui ne contient pas le produit recommandé.

## 6. Carte des familles et de leurs enfants

La carte ci-dessous reprend les relations du menu public. Les libellés Assises et Jardin suivent le choix de présentation du site. Chaque handle est inventorié avec son statut dans `routes.csv`.

| Famille | Enfants dans le menu public |
|---|---|
| Assises — `sieges` | Chaises ; Fauteuils ; Canapés ; Sièges de bureau ; Chaises longues ; Tabourets et bancs |
| Tables — `tables` | Tables de salle à manger ; Tables de café ; Tables basses et d’appoint ; Bureaux |
| Luminaires — `luminaires` | Suspensions ; Lampes de table ; Lampes de bureau ; Lampadaires ; Appliques ; Lampes nomades |
| Décoration — `decoration` | Vases ; Bougeoirs, bougies et photophores ; Miroirs ; Coussins, plaids et tapis ; Cache-pots et jardinières ; Objets décoratifs et cadres |
| Jardin — `outdoor` | Chaises outdoor ; Bancs outdoor ; Bains de soleil et transats ; Parasols et ombrages ; Braseros et barbecues ; Accessoires de jardin ; Tables outdoor |
| Rangement — `rangement` | Étagères et bibliothèques ; Commodes et buffets ; Paniers et corbeilles ; Patères et porte-manteaux ; Dessertes et chariots |
| Arts de la table — `accessoires` | Vaisselle et assiettes ; Verres et carafes ; Couverts ; Mugs, tasses et café ; Ustensiles de cuisine |

**Point de curation à conserver :** la page Tables présente un raccourci vers Tables outdoor à la place de Tables de café. Tables outdoor est un enfant de Jardin dans le menu. C’est un lien transversal utile ; il ne doit pas réintroduire les tables extérieures dans les résultats de tables d’intérieur. Une collection « Tables de café » encore présente au menu et une carte éditoriale différente ne sont pas automatiquement des pages cassées.

## 7. Plan d’action concret

### Lot A — fiabiliser les chemins les plus utilisés

1. Partager la classification des marques et la relation sous-catégorie → famille entre le catalogue, les fiches et le serveur.
2. Conserver les libellés Assises et Jardin dans tous les cas ; choisir un seul libellé pour le catalogue dans le fil.
3. Corriger les 7 marques mal classées et garder Marques sur les fiches issues d’une marque globale.
4. Ajouter les familles parentes aux sous-catégories et fiches, en préservant famille + marque.

**Livrable :** une preview sur les pages existantes, avec les parcours Luminaires/HAY, Artek, Ichendorf, Assises/Chaises et Jardin/Tables outdoor. Terminé lorsque ces parcours passent les assertions et les clics manuels de retour.

### Lot B — conserver la sélection et stabiliser l’affichage

1. Définir un contexte de retour contenant seulement une adresse interne du catalogue et les paramètres de recherche autorisés.
2. Le transmettre depuis toutes les cartes, la recherche et les listes paginées, côté serveur comme côté navigateur.
3. Ajouter le lien « Retour à ma sélection » avec les composants existants ; garder les ancêtres du fil comme navigation hiérarchique.
4. Afficher le fil sur les sept familles et préremplir les fils rendus côté serveur.
5. Rendre les articles de la sélection cliquables vers leur fiche.

**Livrable :** démonstration de cinq retours exacts : Bistro/Fermob, Chaises filtrées, verrerie, page 2 et un designer. Tester également un nouvel onglet, un rechargement et une arrivée directe.

### Lot C — nettoyer la taxonomie et les données structurées

1. Qualifier les 162 collections ; comparer les anciennes collections de designers à leurs destinations actuelles avant toute redirection.
2. Fixer une hiérarchie de référence pour les fiches dont l’appartenance est fiable ; conserver un repli neutre pour les autres.
3. Aligner les générateurs de fil et documenter la coexistence du chemin de référence et du contexte d’arrivée.
4. Vérifier les résultats enrichis Google et suivre ensuite les erreurs réelles d’indexation.

**Livrable :** registre des collections, règles de repli, éventuelles redirections justifiées et validation du balisage sur plusieurs types de pages. Un nettoyage de taxonomie ne nécessite pas de fusionner les deux dépôts GitHub.

## 8. Ce qui doit être coordonné avec l’importer

Le site dispose déjà de `category`, `productType`, `subcategory` et `collections` dans le mapping serveur. Il faut d’abord évaluer ces données, pas inventer de nouveaux champs en parallèle sans contrat.

| Donnée / règle | Responsable principal | Contrôle demandé |
|---|---|---|
| Handle produit et collection stable | Importer | Ne pas renommer silencieusement ; fournir la correspondance si une migration est nécessaire |
| Type fonctionnel et sous-catégorie | Importer + curation | Une chaise Bistro ne devient pas une table parce qu’elle partage un nom de gamme |
| Usage intérieur / extérieur | Importer + règles du site | Conserver les usages multiples ; respecter la séparation des listes Tables et Jardin |
| Appartenance à la famille parente | Contrat partagé | Une sous-catégorie et sa famille doivent correspondre à des ensembles de produits cohérents |
| Marque et designer | Importer | Slug stable, identité unifiée et correspondance avec les répertoires du site |
| Rôle d’une collection | Curation du site + importer | Marque, gamme et designer ne sont pas tous des sous-catégories de Mobilier |
| Matière verre | Importer | Harmoniser les tags matière sans confondre un verre à boire et un objet fabriqué en verre |
| Libellé visible et ordre du fil | Site | Respecter les noms validés, indépendamment des noms internes Shopify |

Le fil d’Ariane peut être amélioré immédiatement sans attendre la fin des imports. En revanche, attribuer automatiquement une catégorie principale à chaque fiche demande de vérifier les appartenances. Prévoir un différentiel d’import et un petit lot contrôlé avant une modification globale.

Sources : `server.js:1202`, `server.js:1258` et le contrat déjà documenté dans `docs/FAMILY_PAGES.md`.

## 9. Recette à imposer aux corrections

| Cas | Attendu |
|---|---|
| Chacune des 7 familles | Même composant, libellé stable, lien vers le catalogue |
| Chacune des 39 sous-catégories | Famille parente présente ; aucun ancêtre menant à une sélection sans rapport |
| Chacune des 28 marques actives | Marques présent dans le chemin global, quelle que soit la forme de son URL |
| Les 28 cartes famille + marque | Filtres famille ET marque présents à l’aller et au retour |
| Sous-catégorie + marque | Famille, sous-catégorie et marque conservées ensemble |
| Recherche / catégories / matière | Retour à la sélection exacte ; ancêtres du fil clairement distincts du retour |
| Page 2 et tri personnalisé | Même page et même tri au retour ; pas de perte de résultats |
| Designer | Répertoire Designers puis nom du créateur ; retour à ses produits |
| Accès direct, favori, lien partagé | Chemin de référence fiable ou repli neutre ; aucun libellé issu d’un slug brut |
| Recommandations sur une fiche | Pas d’héritage d’une collection sans appartenance vérifiée |
| Premier HTML puis page chargée | Même destination pour une même carte ; fil stable |
| Contexte ancien ou invalide | Repli cohérent ; aucune destination externe construite depuis un paramètre |
| Produit dépublié ou collection inconnue | 404 explicite et lien de récupération utile |
| Clavier et noms longs | Liens accessibles dans l’ordre, focus visible, retour à la ligne propre |
| Référencement | Canonique produit stable ; BreadcrumbList conforme à la hiérarchie retenue |

Exécuter après les modifications concernées :

```sh
node --test tests/family-pages.test.cjs tests/table-collections.test.cjs tests/product-specs.test.mjs
```

Ajouter des tests centrés sur ces parcours, pas seulement sur le HTML d’un composant. Les 32 tests actuels ont été relancés avec succès pendant l’audit ; les anomalies observées montrent précisément ce qu’ils ne couvrent pas encore. La livraison d’une correction doit inclure une preview et une vérification dans le navigateur.

## 10. Preuves, limites et consultation

- `routes.csv` contient les 209 destinations, leur catégorie d’audit, leur réponse finale, leur canonique et leur fil JSON-LD initial.
- `produits.csv` contient les 123 URL de fiches, leur produit et leur liste source ; 103 produits distincts.
- `parcours-visuels.csv` reprend les observations significatives du navigateur et les retours effectivement cliqués.
- `regles.json` contient les 203 simulations, les 7 marques absentes de la classification et l’inventaire des 28 modèles. Les cas avec produit témoin sont explicitement identifiés.
- Les réponses HTML et JSON brutes, les deux scripts de collecte/simulation et la sortie des tests sont conservés dans `.context/breadcrumb-audit/`, dossier local ignoré par Git.

Tous les liens d’ancêtres produits par la matrice de simulation se trouvent dans l’inventaire des routes contrôlées. Cette vérification établit leur disponibilité ; la pertinence des ensembles de produits demande les règles et les contrôles de curation décrits ci-dessus.

**Preview de référence du site audité :** [Luminaires sur la preview existante](https://mikadodecov2-nteyr6eik-mikadodeco.vercel.app/collections/luminaires). **Exemple en production :** [sélection Luminaires + HAY](https://www.mikadodeco.be/collections/luminaires?brand=hay).

L’audit est livré comme document séparé. Le rapport Markdown et son schéma sont consultables directement sur GitHub, sans serveur local. Le fichier `rapport.html` contient aussi le schéma intégré : une fois téléchargé, il s’ouvre seul dans un navigateur. Les corrections du plan ne sont pas présentées comme déjà implémentées ou publiées.
