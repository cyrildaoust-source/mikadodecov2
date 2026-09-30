# Ventes associées sur la fiche produit

Mesure du 30 septembre 2026, avant publication. Le catalogue Storefront contient
3 610 fiches (une de plus que les 3 609 du brief) ; Shopify Admin
compte 3 847 produits actifs, dont 3 610 publiés sur le canal utilisé par le site.
Aucun métachamp Shopify n'a été écrit pendant ce chantier.

## Règles appliquées

Chaque rubrique contient au plus quatre cartes du composant commun. Le produit
courant, les doublons, les fiches indisponibles, sans image ou sans variante
achetable sont exclus dans tous les cas.

1. Recommandations curées Search & Discovery, dans leur ordre Shopify.
2. Même gamme, reconnue dans les collections, tags et mots distinctifs du titre,
   pour une même marque. Les collections de marque, familles génériques, matières,
   couleurs et noms de designer ne suffisent pas.
3. Relation fonctionnelle : assise et coussin/galette/housse, luminaire et
   abat-jour/ampoule, table et rallonge, produit rechargeable et recharge,
   bougie et bougeoir. Une gamme ou un modèle commun reste obligatoire ; les
   dimensions et le type explicites d'une housse doivent être compatibles.
4. Repli Shopify Storefront : `COMPLEMENTARY` puis les résultats fonctionnels de
   `RELATED` pour « Ce qui va avec votre achat », et `RELATED` pour « Pour
   compléter votre achat ».

Les produits d'une même gamme mais de rôles différents alimentent « Ce qui va
avec votre achat » (par exemple une table et ses chaises, ou les pièces d'un
service). Les variantes du même rôle et les produits du même type de la marque
alimentent « Pour compléter votre achat ».

Shopify documente que `RELATED` est auto-généré à partir des ventes, descriptions
et collections, tandis que `COMPLEMENTARY` requiert une curation Search &
Discovery. Les deux intents renvoient au plus dix produits. L'API Ajax du canal
Online Store a renvoyé zéro résultat pour les deux intents sur l'échantillon de
12 fiches ; le site utilise donc la Storefront GraphQL du canal Headless, après
les règles déterministes ci-dessus.

## Couverture globale avant / après

| Fiches avec… | Avant | Après règles et curation | Évolution |
| --- | ---: | ---: | ---: |
| « Ce qui va avec votre achat » | 44 (1,2 %) | 1 367 (37,9 %) | +1 323 |
| « Pour compléter votre achat » | 62 (1,7 %) | 3 393 (94,0 %) | +3 331 |
| Au moins une rubrique | 69 (1,9 %) | 3 454 (95,7 %) | +3 385 |
| Les deux rubriques | 37 (1,0 %) | 1 306 (36,2 %) | +1 269 |

Le repli Storefront `RELATED` peut encore compléter les 156 fiches restantes dans
la preview réelle. Il n'est pas compté dans la colonne « après » ci-dessus afin de
ne pas présenter une disponibilité d'API non encore observée comme acquise.

## Couverture par marque

`C` = compléments curés avant, `L` = liés curés avant, `Avec` et `Univers` = fiches
couvertes après, `≥1` = au moins une rubrique après.

| Marque | Fiches | C | L | Avec | Univers | ≥1 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| HKliving | 1 472 | 0 | 0 | 780 | 1 421 | 1 442 |
| Carl Hansen & Søn | 410 | 0 | 0 | 94 | 397 | 399 |
| &Tradition | 260 | 0 | 0 | 95 | 251 | 254 |
| Pols Potten | 216 | 0 | 0 | 12 | 212 | 212 |
| Fermob | 166 | 2 | 13 | 91 | 160 | 160 |
| Artek | 160 | 0 | 0 | 5 | 150 | 151 |
| Fatboy | 125 | 0 | 0 | 43 | 120 | 121 |
| HAY | 111 | 42 | 49 | 67 | 105 | 105 |
| Iittala | 110 | 0 | 0 | 62 | 89 | 99 |
| Ferm Living | 89 | 0 | 0 | 26 | 60 | 71 |
| Moustache | 86 | 0 | 0 | 7 | 81 | 82 |
| Vitra | 84 | 0 | 0 | 0 | 75 | 75 |
| Ichendorf Milano | 72 | 0 | 0 | 32 | 60 | 63 |
| Pastoe | 57 | 0 | 0 | 16 | 51 | 51 |
| Volta Mobiles | 42 | 0 | 0 | 0 | 42 | 42 |
| Muuto | 28 | 0 | 0 | 10 | 25 | 26 |
| Serax | 25 | 0 | 0 | 8 | 13 | 20 |
| String Furniture | 24 | 0 | 0 | 13 | 22 | 22 |
| Stoff Nagel | 20 | 0 | 0 | 0 | 16 | 16 |
| Esteban | 9 | 0 | 0 | 0 | 7 | 7 |
| Avolt | 9 | 0 | 0 | 0 | 9 | 9 |
| Blomus | 8 | 0 | 0 | 0 | 4 | 4 |
| Compagnie de Provence | 6 | 0 | 0 | 6 | 6 | 6 |
| LIND DNA | 5 | 0 | 0 | 0 | 5 | 5 |
| Anglepoise | 5 | 0 | 0 | 0 | 5 | 5 |
| Marimekko | 4 | 0 | 0 | 0 | 2 | 2 |
| Relaxound | 3 | 0 | 0 | 0 | 3 | 3 |
| Tiptoe | 3 | 0 | 0 | 0 | 2 | 2 |
| Ester & Erik | 1 | 0 | 0 | 0 | 0 | 0 |

## Couverture par type principal

Le tableau couvre les types d'au moins 15 fiches et les types fonctionnels cités
dans le brief. Les types du long tail suivent exactement le même calcul.

| Type Shopify | Fiches | C avant | L avant | Avec après | Univers après |
| --- | ---: | ---: | ---: | ---: | ---: |
| Élément de canapé | 518 | 0 | 0 | 428 | 518 |
| Coussin | 181 | 20 | 20 | 111 | 180 |
| Vase | 145 | 0 | 0 | 4 | 142 |
| Pouf | 140 | 0 | 0 | 60 | 140 |
| Canapé | 138 | 1 | 2 | 79 | 138 |
| Chaise | 131 | 2 | 5 | 41 | 131 |
| Table | 130 | 2 | 10 | 53 | 129 |
| Fauteuil | 113 | 4 | 5 | 40 | 113 |
| Table basse | 109 | 0 | 2 | 27 | 108 |
| Tapis | 98 | 0 | 0 | 0 | 98 |
| Suspension | 80 | 0 | 0 | 3 | 79 |
| Lampe de table | 72 | 0 | 0 | 2 | 70 |
| Bougeoir | 65 | 0 | 0 | 1 | 63 |
| Sculpture | 63 | 0 | 0 | 0 | 62 |
| Miroir | 59 | 0 | 0 | 0 | 56 |
| Housse de canapé | 56 | 0 | 0 | 56 | 56 |
| Table d'appoint | 54 | 0 | 0 | 8 | 53 |
| Banc | 47 | 3 | 5 | 28 | 47 |
| Tabouret | 42 | 0 | 1 | 15 | 40 |
| Plateau | 39 | 0 | 0 | 0 | 37 |
| Mobile | 38 | 0 | 0 | 0 | 38 |
| Chaise avec accoudoirs | 37 | 4 | 7 | 17 | 36 |
| Verre à eau | 35 | 0 | 0 | 22 | 35 |
| Lampadaire | 35 | 0 | 0 | 0 | 34 |
| Assiette | 35 | 0 | 0 | 28 | 34 |
| Cadre | 34 | 0 | 0 | 0 | 34 |
| Bol | 30 | 0 | 0 | 21 | 29 |
| Buffet | 26 | 0 | 0 | 15 | 23 |
| Tabouret de bar | 26 | 0 | 1 | 3 | 26 |
| Pichet | 25 | 0 | 0 | 16 | 24 |
| Repose-pieds | 20 | 0 | 1 | 3 | 20 |
| Accessoire | 19 | 0 | 0 | 0 | 16 |
| Abat-jour | 18 | 0 | 0 | 4 | 18 |
| Étagère | 17 | 0 | 0 | 7 | 16 |
| Patère | 17 | 0 | 0 | 0 | 14 |
| Carafe | 16 | 0 | 0 | 11 | 13 |
| Chaise de bar | 16 | 0 | 0 | 5 | 15 |
| Bol de service | 15 | 0 | 0 | 2 | 13 |
| Pied de lampe | 15 | 0 | 0 | 6 | 14 |
| Housse de pouf | 14 | 0 | 0 | 14 | 14 |
| Housse de protection | 10 | 7 | 0 | 10 | 10 |
| Galette | 9 | 0 | 0 | 9 | 9 |
| Rallonge de table | 6 | 0 | 0 | 4 | 6 |
| Bougie | 5 | 0 | 0 | 2 | 4 |
| Bougie parfumée | 5 | 0 | 0 | 3 | 4 |

## Panier

La rubrique n'est pas reprise dans `v3/selection.html` pour cette livraison. Le
panier contient déjà les quantités, remises, délais, cadeau éventuel et passage en
caisse ; agréger les recommandations de plusieurs lignes y créerait des doublons
et des associations ambiguës. La fiche fournit le bon contexte produit. Une
extension ultérieure du panier devrait se limiter à une seule rangée de quatre
compléments dédupliqués, mesurée séparément.
