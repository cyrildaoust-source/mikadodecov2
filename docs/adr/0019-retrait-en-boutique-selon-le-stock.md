# ADR 0019 — Retrait en boutique : le délai suit le stock

Date : 17 octobre 2026. Statut : accepté.

## Contexte

Le point de retrait « Mikado Deco » est réglé dans Shopify sur « Généralement prêt sous 24 heures ». Ce réglage vaut pour tout le magasin : Shopify ne regarde ni le stock ni le délai de la fiche. Le 17 octobre, un client a lu qu'il pouvait venir chercher le lendemain deux appuie-tête Fermob qui n'étaient pas en stock. Le paiement Shopify et ses e-mails restent du ressort de Cyril ; le site, lui, doit dire juste.

## Décision (règle de Cyril)

- Article **en stock** à la boutique : « Retrait en boutique : prêt sous 24 h ».
- Article **à commander** : le retrait suit le **délai de la marque jusqu'à la boutique**, le métachamp `custom.lead_time` (« 3 semaines », « 6-10 semaines »), **sans** la marge d'expédition de 2–3 jours ouvrés appliquée à la livraison : la boutique prévient le client dès l'arrivée.
- `custom.lead_time` vide ou « sur demande » : « Retrait en boutique : délai confirmé après commande ».
- Jamais « 24 h » pour un article sans stock.

Une seule fonction, `pickupFor` dans `lib/lead-time.js`, à côté de `leadTimeFor` ; `longestPickup` donne le retrait d'une commande (l'article le plus long, un délai à confirmer l'emporte).

## Où

- **Fiche produit** : à côté du délai de livraison, mis à jour au changement de variante (`v3/pdp-view.mjs`) ; les deux libellés viennent du serveur (`product.pickup.ready` / `product.pickup.onOrder`, `lib/shopify/product-mapper.js`).
- **Panier** : ligne par ligne (`/api/cart/delivery` → `lines[].pickup`) et pour la commande (`pickup`) ; attributs et note de la commande Shopify (`Retrait en boutique`), comme le délai estimé.

## Données

- Stock à la boutique : `quantityAvailable` de la variante (Storefront). La boutique n'a **qu'un seul emplacement** actif qui honore les commandes en ligne (« Mikado Deco », vérifié par l'API Admin le 17/10) : cette quantité est exactement le stock du point de retrait. `storeAvailability` (portée `unauthenticated_read_product_pickup_locations`) n'est donc pas nécessaire ; si un second emplacement apparaît, cette décision est à revoir.
- Délai : `custom.lead_time`, texte français d'une ligne, délai le plus long des variantes vendues (contrat `docs/CONTRAT_DONNEES_SHOPIFY.md` de l'importateur). Tant que le métachamp n'est pas posé sur toutes les marques (chantier A27 de l'importateur), la plupart des articles à commander affichent « délai confirmé après commande ».

## Conséquences

- Le texte « en boutique sous 24 h » n'apparaît plus que pour un article réellement en stock.
- Shopify continue d'écrire « prêt sous 24 heures » au paiement et dans ses e-mails : réglage et textes à adapter par Cyril (instructions de retrait).
- Tests : `tests/lead-time.test.cjs`, `tests/delivery-estimate.test.cjs`, `tests/cart-delivery-api.test.cjs`.
