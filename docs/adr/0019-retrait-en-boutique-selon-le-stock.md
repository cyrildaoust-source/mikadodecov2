# ADR 0019 — Retrait en boutique : le délai suit le stock

Date : 17 octobre 2026. Statut : accepté.

## Contexte

Le point de retrait « Mikado Deco » est réglé dans Shopify sur « Généralement prêt sous 24 heures ». Ce réglage vaut pour tout le magasin : Shopify ne regarde ni le stock ni le délai de la fiche. Le 17 octobre, un client a lu qu'il pouvait venir chercher le lendemain deux appuie-tête Fermob qui n'étaient pas en stock. Le paiement Shopify et ses e-mails restent du ressort de Cyril ; le site, lui, doit dire juste.

## Décision (règle de Cyril)

- Article **en stock** à la boutique : « Retrait en boutique : prêt sous 24 h ».
- Article **à commander** : le retrait affiche **le même délai que la livraison** (règles par marque et famille, ou métachamp `custom.lead_time`, avec la marge) : « c'est littéralement le même temps » (Cyril, 17 octobre, après une première version qui retirait la marge d'expédition et donnait un retrait plus court que la livraison). La fiche l'écrit en une ligne : « Livraison ou retrait en boutique · 6–11 semaines ».
- Délai sur demande (tag `delai-long`, métachamp « sur demande ») : « délai confirmé après commande », livraison ou retrait.
- Jamais « 24 h » pour un article sans stock.

Une seule fonction, `pickupFor` dans `lib/lead-time.js`, à côté de `leadTimeFor` ; `longestPickup` donne le retrait d'une commande (l'article le plus long, un délai à confirmer l'emporte).

## Où

- **Fiche produit** : à côté du délai de livraison, mis à jour au changement de variante (`v3/pdp-view.mjs`) ; les deux libellés viennent du serveur (`product.pickup.ready` / `product.pickup.onOrder`, `lib/shopify/product-mapper.js`).
- **Panier** : ligne par ligne (`/api/cart/delivery` → `lines[].pickup`) et pour la commande (`pickup`) ; attributs et note de la commande Shopify (`Retrait en boutique`), comme le délai estimé.

## Données

- Stock à la boutique : `quantityAvailable` de la variante (Storefront). La boutique n'a **qu'un seul emplacement** actif qui honore les commandes en ligne (« Mikado Deco », vérifié par l'API Admin le 17/10) : cette quantité est exactement le stock du point de retrait. `storeAvailability` (portée `unauthenticated_read_product_pickup_locations`) n'est donc pas nécessaire ; si un second emplacement apparaît, cette décision est à revoir.
- Délai : celui de la livraison (`leadTimeFor`, ADR 0015) : métachamp `custom.lead_time` quand il existe, sinon la règle par marque et famille.

## Conséquences

- Le texte « en boutique sous 24 h » n'apparaît plus que pour un article réellement en stock.
- Shopify continue d'écrire « prêt sous 24 heures » au paiement et dans ses e-mails : réglage et textes à adapter par Cyril (instructions de retrait).
- Tests : `tests/lead-time.test.cjs`, `tests/delivery-estimate.test.cjs`, `tests/cart-delivery-api.test.cjs`.
