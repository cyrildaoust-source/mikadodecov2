# Ventes associées sur la fiche produit

Les deux rubriques ont des rôles distincts :

- **Pour compléter vos achats** compose l'usage du produit : accessoire dédié,
  assise autour d'une table, art de la table, textile et, pour une table
  extérieure, éclairage nomade.
- **Dans la même famille** rassemble les autres pièces de la gamme ou du même
  modèle. Ce n'est pas une seconde liste d'accessoires génériques.

Les cartes restent celles du composant commun `v3/product-card.mjs`. Chaque
rubrique contient au plus six cartes et disparaît lorsqu'elle est vide.

## Priorité des sources

1. Les choix explicites enregistrés par Search & Discovery dans les métachamps
   Shopify `complementary_products` et `related_products`.
2. La même gamme, reconnue par une collection de gamme, un tag de modèle ou un
   terme distinctif du titre, jamais par la marque seule.
3. Une relation fonctionnelle sûre au sein de cette gamme : housse ou coussin
   d'une assise, abat-jour ou ampoule d'une lampe, rallonge d'une table,
   recharge, bougeoir et bougie, assise et table assorties.
4. Pour les tables, une composition de scène issue de recherches Storefront par
   types de produit, sans aucun handle codé en dur.
5. Les recommandations automatiques Shopify `COMPLEMENTARY` et `RELATED` comme
   dernier repli.

Le produit courant, les doublons, les produits indisponibles, les produits sans
image ou sans variante achetable sont toujours retirés.

## Composition d'une table

La sélection réserve les places au lieu de laisser une famille envahir les six
cartes : au plus deux assises, puis une pièce de vaisselle, un verre ou contenant,
un textile ou dessous de plat et, pour l'extérieur, une lampe extérieure. Une
rallonge réellement compatible passe avant cette composition. Les chaises de la
même gamme sont prioritaires ; à défaut, la même marque et le même usage
intérieur/extérieur servent au classement.

Les catégories Storefront sont des règles de recherche, pas une liste de
produits. Une nouvelle assiette, une chaise ou une lampe publiée et disponible
peut donc entrer automatiquement dans la sélection.

## Panier

Ces rubriques restent sur la fiche produit. Les dupliquer dans le panier
alourdirait le dernier écran avant commande et demanderait de recomposer plusieurs
contextes lorsque le panier contient plusieurs articles. Une éventuelle reprise
dans `v3/selection.html` devra faire l'objet d'un test séparé, avec une seule
proposition compacte et explicitement mesurée.

## Écriture dans Shopify

Le site ne modifie aucun métachamp. Si une curation supplémentaire est souhaitée,
le propriétaire reçoit d'abord un tableau « produit → propositions → raison » ;
les seuls champs qui pourraient ensuite être écrits, après accord, sont les deux
métachamps de recommandation ci-dessus.
