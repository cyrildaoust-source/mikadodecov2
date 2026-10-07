# Ventes associées sur la fiche produit

Les deux rubriques ont des rôles distincts :

- **Complétez avec** compose l'usage du produit : accessoire dédié,
  assise autour d'une table, art de la table, textile et, pour une table
  extérieure, éclairage nomade.
- **Vous aimerez aussi** rassemble les autres pièces de la gamme ou du même
  modèle. Ce n'est pas une seconde liste d'accessoires génériques.

Les cartes restent celles du composant commun `v3/product-card.mjs`. Chaque
rubrique contient quatre cartes au plus et disparaît lorsqu'elle est vide.
Chaque fiche publiée doit toutefois disposer d'au moins une rubrique : le filet
par type et univers garantit « Vous aimerez aussi » lorsque la fiche n'a ni
curation ni gamme exploitable. « Complétez avec » reste masqué plutôt que de
présenter un faux accessoire.

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
5. Pour les fiches sans gamme exploitable, le même type de produit puis le même
   univers fonctionnel, à partir des types Shopify et sans aucun handle codé en dur.
6. Les recommandations automatiques Shopify `COMPLEMENTARY` et `RELATED` comme
   dernier repli et complément de classement.

Le produit courant, les doublons, les produits indisponibles, les produits sans
image ou sans variante achetable sont toujours retirés.

Les choix manuels Shopify sont conservés tels quels. Pour les choix automatiques,
la pertinence passe avant la diversité des marques (révision du 6 octobre) :

- la même gamme occupe d'abord deux places au plus ; ses compléments (coussins,
  housses, abat-jour…) reprennent ensuite les places restées libres, si bien
  qu'une rubrique n'est jamais à moitié vide ;
- dans « Vous aimerez aussi », les autres meubles de la gamme passent avant ses
  accessoires, dont la place naturelle est « Complétez avec » ;
- « Vous aimerez aussi » garde deux pièces de la gamme au plus, y compris parmi
  les choix manuels (demande du 7 octobre) : « Complétez avec » montre déjà la
  gamme, les autres places vont à d'autres gammes de même usage ;
- les candidats sont classés par niveau de pertinence (même type, même usage
  intérieur ou extérieur). Dans chaque niveau, les marques alternent, deux cartes
  au plus par marque ; puis le même niveau complète sans limite de marque. Le
  niveau suivant n'est utilisé que si le précédent est épuisé ;
- la gamme complète passe avant un produit d'usage différent : une pièce
  d'intérieur ne propose un meuble de jardin qu'en dernier recours.

Une assise et une table ne sont associées dans « Complétez avec » que si elles sont
toutes deux pliantes ou toutes deux fixes (tag `pliante`) : une chaise Palissade va avec
une table fixe, une chaise Bistro avec une table Bistro. Un choix manuel Shopify reste
prioritaire. Le 7 octobre, 18 tables et 13 assises pliantes ont reçu ce tag d'après
leur description.

Les tags `exterieur` / `interieur` décident de l'usage : un meuble de jardin sans
tag extérieur est traité comme un meuble d'intérieur.

## Couverture vérifiée

Dernière mesure en lecture seule, le 3 octobre 2026 sur le canal Headless :

- 4 196 produits actifs et publiés ;
- 69 produits couverts par une curation Search & Discovery existante ;
- 4 196 produits couverts par les règles déterministes, soit 100 % du catalogue
  mesuré ; le repli automatique Shopify reste disponible ensuite ;
- 155 tables de repas sur 155 disposent d'une composition de scène complète.

Cette mesure inclut 556 entrées et 9 sorties du canal depuis le contrôle du 30
septembre. L'audit des tags a révélé quatre nouveaux types isolés ; les univers
génériques bar, bureau et rangement les couvrent désormais sans handle de
produit codé en dur. Le dossier détaillé est conservé dans
`docs/audits/2026-10-03-product-tags/`.

Les scripts `audit-product-recommendations.mjs` et
`audit-storefront-recommendations.mjs` reproduisent cette mesure. Ils sont en
lecture seule et ne contiennent aucune mutation Shopify.

## Composition d'une table

La sélection réserve les quatre places au lieu de les laisser envahir par une
seule famille : une assise, une pièce de vaisselle, un verre ou contenant, puis
un textile ou dessous de plat en intérieur, ou une lampe autonome en extérieur.
Une rallonge réellement compatible passe avant cette composition. Les chaises
de la même gamme sont prioritaires ; à défaut, le même usage intérieur/extérieur
sert au classement et une autre marque est préférée à pertinence égale.

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
