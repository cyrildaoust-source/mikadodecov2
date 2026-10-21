# Brief importateur — Noël 2026 : carte cadeau, tags cadeau, rubrique enfants

> **État au 21 octobre 2026** : carte cadeau publiée (fournisseur « Mikado Deco », exclu des marques du site) ; tags cadeau en place (2 248 idées cadeaux).

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

## 3. Rubriques « Pour qui » (P1)

Six rubriques, chacune = des mots de tags comparés mot à mot dans chaque tag (`chaise-enfant` contient `enfant`, `cadeau-naissance` contient `naissance`). Pour figurer dans une rubrique, une fiche doit AUSSI porter un tag cadeau (règle 2). Comptes au 13 octobre dans la page :

| Rubrique | Mots de tags lus | Fiches |
|---|---|---|
| Pour les enfants | `enfant`, `enfants`, `kids`, `naissance`, `bebe` | 29 |
| Pour les amoureux | `amour`, `amoureux`, `amoureuse`, `romantique`, `valentin`, `couple`, `bougie`, `parfum`, `champagne` | 75 |
| Pour belle-maman | `mariage`, `vase`, `bougeoir`, `plaid`, `parfum`, `reception`, `vaisselle`, `service` | 868 |
| Pour le collègue | `bureau`, `cafe`, `the`, `mug`, `carnet`, `stylo` | 230 |
| Pour les animaux | `chien`, `chiens`, `chat`, `chats`, `croquettes`, `gamelle` (pas `animaux` : ce mot classe aussi les verres Animal Farm et les figurines Hoptimist) | 22 (44 fiches animaux au total : les gamelles Alessi et Doggielounge Fatboy sans tag cadeau n'y sont pas) |
| Pour qui cuisine | `cuisine`, `ustensile`, `ustensiles`, `couteau`, `cafetiere`, `theiere`, `planche`, `casserole`, `epices`, `salade` | 402 |
| Pour qui aime lire | `lecture`, `livre`, `livres`, `liseuse` | 68 |
| Pour l'hôte du réveillon | `cremaillere`, `apero`, `aperitif`, `bar`, `vin`, `champagne`, `fete`, `reception`, `serviette` | 430 |

À faire côté importateur : poser un tag cadeau sur les articles pour animaux (gamelles, coussins Doggielounge, boîtes à croquettes) et sur les lampes de bureau ; signaler tout mot de tag qui classerait mal une fiche.

## 4. Délais (rappel ADR 0015)

Une pièce fabriquée à la commande (tissus Vitra, sur mesure) doit porter `custom.lead_time` (« 6 semaines », « sur demande ») : le repère « Livré avant Noël » s'appuie sur ce délai et disparaît de lui-même si l'article ne peut pas arriver à temps.
