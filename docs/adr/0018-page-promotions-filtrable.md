# ADR 0018 — Page Promotions filtrable depuis l'index

Date : 16 octobre 2026. Statut : accepté.

## Contexte

La page `/collections/promotions` était la seule liste du site sans filtres (Cyril, 16/10 : « il n'y a aucun filtre, ce qui est dommage »). Elle était servie par l'ancien chemin : lecture de la collection Shopify `promotions` à chaque visite, fusion avec les produits sous remise automatique (sonde `getPromos`) et la campagne Home Stories, sans l'index commun qui donne aux autres listes leurs filtres (prix, marque, catégorie, couleur…), leur tri et leur pagination.

## Décision

- Une portée `promotions` dans `lib/filter-scopes.js`, comme les idées cadeaux (ADR 0016) : **sans lire la collection Shopify**. Membre = fiche de l'index **en prix réduit** (prix comparé supérieur au prix sur au moins une finition) **ou taguée `promotion`**, c'est-à-dire les règles de la collection `promotions` tenue par l'instance promotions (contrat « Prix et promotions »), **plus** les fiches dont une finition est sous **remise automatique** Shopify active (sonde `getPromos`, cache 30 min, bornée à 2,5 s : sonde froide = page servie sans elles). Les remises automatiques changent sans l'index : la clé de cache de la liste suit leur liste.
- Même page que les autres listes (`sendScopeCatalog`) : filtres, tri, pagination, familles du catalogue en catégories, finition remisée choisie pour la carte (`preferDiscount`), ordre mélangé par marque (graine quotidienne), bandeau identique à l'ancienne page (`data/collection-heroes.json`).
- Repli `collection` : si l'index manque, la liste directe de la collection `promotions` (qui fusionne déjà les remises automatiques) alimente la même page filtrable.

## Conséquences

- Les filtres de la page Promotions sont ceux du catalogue ; une entrée « Promotions » par famille dans le menu peut pointer sur `/collections/promotions?category=<famille>`.
- La fraîcheur des prix barrés est celle de l'index (reconstruit par le cron) ; les remises automatiques sont relues toutes les 30 minutes ; le prix et le stock sont reconfirmés au panier.
- Tests : `tests/catalog-index.test.cjs` (portée, catégories, page, filtres), compte des bandeaux dans `tests/family-pages.test.cjs`, contrôle smoke « Promotions ».
