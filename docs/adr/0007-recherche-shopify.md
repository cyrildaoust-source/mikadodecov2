# ADR 0007 — La pertinence de la recherche reste celle de Shopify ; l'index ne la remplace pas

Date : 8 octobre 2026 · Statut : accepté · Clôt le point 2.4 du plan.

## Contexte

Le plan prévoyait de servir la recherche prédictive depuis l'index catalogue (disponible en un appel depuis l'ADR 0002, étape 2). Mesures sur un serveur local avec l'index chargé :

| Requête | Temps | Appels Shopify |
|---|---|---|
| prédictive « chaise », instance froide | 4,8 s | 4 |
| prédictive « lampe », marques déjà en cache | 4,0 s | 3 |
| prédictive « chaises HAY noires » (critères) | 1,1 s | 1 |
| prédictive « table chêne moins de 1500 € » (critères) | 6,3 s | 5 |
| page de recherche « chaise noire » (déjà calculée) | 0,04 s | 0 |

Le temps est presque entièrement dans les appels à l'API Shopify (`predictiveSearch`, `search`, variantes), 1 à 1,5 s chacun. L'index n'y change rien : il ne porte pas la pertinence textuelle de Shopify (synonymes, fautes de frappe, « chaize » → chaise), choisie en juillet 2026 justement pour cette qualité.

## Décision

Ne pas remplacer la recherche native par une recherche sur l'index. Les gains possibles (dériver les marques actives de l'index au lieu du parcours des vendors, enrichir les variantes depuis l'index) sont modestes et introduiraient des écarts de données (l'index ne couvre que les collections indexées). Les résultats restent cachés 60 s à l'edge par requête.

## Conséquences

- Point 2.4 fermé sans changement de code.
- La latence de la recherche est celle de Shopify ; la seule amélioration structurelle serait un cache de résultats partagé (store), à mesurer sur le volume réel de recherches avant d'investir.
