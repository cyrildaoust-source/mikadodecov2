# Brief importateur — Noël 2026 : carte cadeau, tags cadeau, rubrique enfants

Référence : ADR 0016 (`docs/adr/0016-operation-de-noel.md`). Demandé le 13 octobre 2026 ; échange sur l'issue `site` ouverte dans `mikado-importer`. Le site ne touche pas aux données Shopify.

## 1. Produit « Carte cadeau » (P0 — décision de Cyril)

Créer dans Shopify le produit carte cadeau (Produits → Cartes cadeaux → Ajouter un produit carte cadeau) :

- Titre : **Carte cadeau Mikado Deco**. Handle souhaité : `carte-cadeau` (le site lit `isGiftCard`, le handle est libre).
- Montants (variantes) : **50 €, 100 €, 150 €, 250 €, 500 €**.
- Image : visuel sobre aux couleurs du site (papier, bleu signature) ; le site n'en fournit pas.
- Description courte : « Envoyée par e-mail dès le paiement, avec un message personnel. Valable sur www.mikadodeco.be et en boutique à Uccle. » (la mention boutique est à confirmer par Cyril : encaissement par Shopify POS requis).
- Publier sur le canal **Headless** (313321914697) comme les autres fiches, statut actif.

Dès la publication, le site affiche la carte (« Envoyée par e-mail », sans délai) et la propose sur la page Idées cadeaux, sans déploiement.

## 2. Tags cadeau (P1 — curation de la page Idées cadeaux)

La page `/collections/idees-cadeaux` retient toute fiche publiée dont un tag contient le mot `cadeau` ou `cadeaux` (`cadeau`, `idee-cadeau`, `cadeau-design`, `coffret-cadeau`, `cadeau-enfant`, `cadeau-naissance`…) ou le tag `noel`. Au 13 octobre : ≈ 1 984 fiches actives (765 à moins de 50 €, 449 de 50 à 100 €, 406 de 100 à 200 €, 449 au-delà).

- Retirer le mot `cadeau` d'une fiche la sort de la page ; l'ajouter l'y fait entrer (prise en compte à la construction suivante de l'index, toutes les 30 min).
- À vérifier côté importateur : pièces détachées, housses, accessoires techniques ou articles à « délai sur demande » qui porteraient un tag cadeau par héritage de gamme.

## 3. Rubrique « Pour les enfants » (P1)

Mots de tags lus : `enfant`, `enfants`, `kids`, `naissance`, `bebe` (à n'importe quelle position du tag : `chaise-enfant`, `cadeau-naissance`, `chambre-enfant`…). Au 13 octobre : 59 fiches `enfant`, dont 27 avec un tag cadeau. Pour figurer dans la page, une fiche enfant doit AUSSI porter un tag cadeau (règle 2).

## 4. Délais (rappel ADR 0015)

Une pièce fabriquée à la commande (tissus Vitra, sur mesure) doit porter `custom.lead_time` (« 6 semaines », « sur demande ») : le repère « Livré avant Noël » s'appuie sur ce délai et disparaît de lui-même si l'article ne peut pas arriver à temps.
