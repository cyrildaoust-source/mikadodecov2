# ADR 0018 — Page Promotions filtrable depuis l'index

Date : 16 octobre 2026. Statut : accepté.

## Contexte

La page `/collections/promotions` était la seule liste du site sans filtres (Cyril, 16/10 : « il n'y a aucun filtre, ce qui est dommage »). Elle était servie par l'ancien chemin : lecture de la collection Shopify `promotions` à chaque visite, fusion avec les produits sous remise automatique (sonde `getPromos`) et la campagne Home Stories, sans l'index commun qui donne aux autres listes leurs filtres (prix, marque, catégorie, couleur…), leur tri et leur pagination.

## Décision

- Une portée `promotions` dans `lib/filter-scopes.js`, comme les idées cadeaux (ADR 0016) : **sans lire la collection Shopify**. Membre = fiche de l'index portant **l'une des quatre balises de raison** (`promotion`, `alignement-concurrent`, `promo-marque-alignee`, `fin-de-serie-marque`, `lib/promo-tags.js`) : la règle unique décidée par Cyril le 16 octobre pour les collections `promotions` et `code-bienvenue-eligible`, après le constat que la condition Shopify « prix réduit » compte aussi un prix barré égal au prix (9 125 produits au lieu de 162). Le prix barré ne décide plus l'appartenance ; il ne s'affiche que s'il est strictement supérieur au prix. Les remises automatiques Shopify (offres de marques) gardent leur badge rouge par la sonde `getPromos` ; leurs produits entrent dans la page par leur balise `promotion`, posée par l'instance promotions.
- Même page que les autres listes (`sendScopeCatalog`) : filtres, tri, pagination, familles du catalogue en catégories, finition remisée choisie pour la carte (`preferDiscount`), ordre mélangé par marque (graine quotidienne), bandeau = le fauteuil Grand Relax Vitra et son ottoman, l'offre Home Stories, choisi par Cyril le 16 octobre (`data/collection-heroes.json`). L'espace entre le fil d'Ariane et le titre des listes est resserré (72 → 24 px de haut de section).
- Repli `collection` : si l'index manque, la liste directe de la collection `promotions` (qui fusionne déjà les remises automatiques) alimente la même page filtrable.

## Au-dessus de la grille (décision de Cyril du 16 octobre, après la Preview)

- **Par famille** : une tuile photo par famille du catalogue qui a des fiches en promotion, avec le **nombre réel** de fiches ; la photo est la photo curée de la famille (`data/catalog-landing.json`), jamais celle d'un produit remisé (Cyril, 17 octobre). Un clic filtre la grille sur la famille. Une famille sans promotion n'a pas de tuile.
- **Par remise** : raccourcis « −20 % et plus », « −30 % et plus », « −50 % et plus » (`discountBands`), avec le nombre de fiches ; une tranche vide n'apparaît pas. Nouveau paramètre de filtre `discount` (remise minimale en %, calculée sur le prix barré réel de chaque finition), partagé par le serveur et le navigateur.
- **Tri par défaut « plus forte remise »** (`defaultSort: 'remise'`, absent de l'URL) — **révisé le 21 octobre 2026** : Cyril préfère une grille mélangée ; le tri par défaut redevient le mélange stable des marques (`pop`), « Plus forte remise » reste au choix ; les autres tris restent disponibles. Les tuiles « offres du moment » par marque, aux libellés déduits d'un seul produit, ont été rejetées : rien n'est rédigé à la main.
- Bandeau : le fauteuil Grand Relax Vitra et son ottoman, la meilleure offre du moment.

## Conséquences

- Les filtres de la page Promotions sont ceux du catalogue ; une entrée « Promotions » par famille dans le menu peut pointer sur `/collections/promotions?category=<famille>`.
- La fraîcheur des prix barrés est celle de l'index (reconstruit par le cron) ; les remises automatiques sont relues toutes les 30 minutes ; le prix et le stock sont reconfirmés au panier.
- Tests : `tests/catalog-index.test.cjs` (portée, catégories, page, filtres), compte des bandeaux dans `tests/family-pages.test.cjs`, contrôle smoke « Promotions ».
