# ADR 0018 — Page Promotions filtrable depuis l'index

Date : 16 octobre 2026. Statut : accepté.

## Contexte

La page `/collections/promotions` était la seule liste du site sans filtres (Cyril, 16/10 : « il n'y a aucun filtre, ce qui est dommage »). Elle était servie par l'ancien chemin : lecture de la collection Shopify `promotions` à chaque visite, fusion avec les produits sous remise automatique (sonde `getPromos`) et la campagne Home Stories, sans l'index commun qui donne aux autres listes leurs filtres (prix, marque, catégorie, couleur…), leur tri et leur pagination.

## Décision

- Une portée `promotions` dans `lib/filter-scopes.js`, comme les idées cadeaux (ADR 0016) : **sans lire la collection Shopify**. Membre = fiche de l'index portant **l'une des quatre balises de raison** (`promotion`, `alignement-concurrent`, `promo-marque-alignee`, `fin-de-serie-marque`, `lib/promo-tags.js`) : la règle unique décidée par Cyril le 16 octobre pour les collections `promotions` et `code-bienvenue-eligible`, après le constat que la condition Shopify « prix réduit » compte aussi un prix barré égal au prix (9 125 produits au lieu de 162). Le prix barré ne décide plus l'appartenance ; il ne s'affiche que s'il est strictement supérieur au prix. Les remises automatiques Shopify (offres de marques) gardent leur badge rouge par la sonde `getPromos` ; leurs produits entrent dans la page par leur balise `promotion`, posée par l'instance promotions.
- Même page que les autres listes (`sendScopeCatalog`) : filtres, tri, pagination, familles du catalogue en catégories, finition remisée choisie pour la carte (`preferDiscount`), ordre mélangé par marque (graine quotidienne), bandeau identique à l'ancienne page (`data/collection-heroes.json`).
- Repli `collection` : si l'index manque, la liste directe de la collection `promotions` (qui fusionne déjà les remises automatiques) alimente la même page filtrable.

## Conséquences

- Les filtres de la page Promotions sont ceux du catalogue ; une entrée « Promotions » par famille dans le menu peut pointer sur `/collections/promotions?category=<famille>`.
- La fraîcheur des prix barrés est celle de l'index (reconstruit par le cron) ; les remises automatiques sont relues toutes les 30 minutes ; le prix et le stock sont reconfirmés au panier.
- Tests : `tests/catalog-index.test.cjs` (portée, catégories, page, filtres), compte des bandeaux dans `tests/family-pages.test.cjs`, contrôle smoke « Promotions ».
