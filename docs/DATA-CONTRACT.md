# Contrat de données — qui est la source de vérité de quoi

Date : 7 octobre 2026 · Phase 4.3 du plan d'architecture · Ce document fait foi pour toute question « où vit cette donnée ? ». Il complète `docs/ARCHI-critique-et-plan-2026-10-06.md` et le contrat des tags du backend (mémoire importateur).

## Principe

Trois lieux, trois natures de données, jamais de recopie d'un lieu vers l'autre dans le code :

| Lieu | Nature | Qui modifie | Comment le site le lit |
|---|---|---|---|
| **Shopify** | Les **faits commerciaux** : produits, variantes, prix, prix comparé, stock, disponibilité, images produit, collections (intelligentes et manuelles), metafields produit, tags, remises programmées, menu principal, clients, commandes. | L'importateur (données), Cyril (admin Shopify). | Storefront API côté serveur uniquement (`lib/shopify/`), jamais depuis le navigateur. Cache mémoire 5 min + cache edge. |
| **`data/` du dépôt** | Les **règles de présentation** du site : conditions de livraison et de retour déclarées à Google (`offer-policy.json`, tirées des CGV), inventaire des pages (`pages.manifest.json`), filtres de catégorie (`category-filters.json`), campagnes et textes imposés (`campaigns.json`), pages familles (`family-pages.json`), héros de marques et collections (`brand-heroes.json`, `collection-heroes.json`), landing catalogue, icônes d'assises, enrichissements de recherche. | Le code (PR, revue, CI). | Lu au chargement par `lib/config.js` et les services ; testé (`tests/data-sources.test.cjs`, `tests/pages-manifest.test.cjs`). |
| **Contenu éditorial** | Bios et photos des designers (`v3/designers-data.json`, `data/designer-photos.json`), coup de cœur du méga menu (`v3/mega-menu-config.json`), curation des marques du méga menu (`v3/mega-menu-brands.json`), articles du journal (`v3/journal/articles.data.mjs`), pages légales (`docs/legal/*.md`). | Cyril, aujourd'hui par PR. **Cible** : metaobjects Shopify (designers, coup de cœur, bannières de marques) pour éditer sans déploiement. | Fichiers du dépôt aujourd'hui ; Storefront API (metaobjects) demain, même contrat de lecture côté serveur. |

## Interdits

- **Aucune donnée produit en dur dans le code** : ni prix, ni handle de produit, ni stock, ni nom de variante. Un produit mis en avant est désigné par une collection Shopify ou un tag, jamais par son handle dans un `.js`. (Exception tracée : les handles d'icônes dans `data/catalog-landing.json`, `data/seating-icons.json` et `data/family-pages.json` sont de la curation, donc des règles de présentation ; ils sont vérifiés à l'exécution et une icône absente est simplement ignorée.)
- **Aucune règle métier dans un littéral de code** (`product_type:"…"`, dates de campagne, listes de pages) : `tests/data-sources.test.cjs` échoue sinon. Exception déclarée : les requêtes de « scène » du moteur de recommandation (`lib/product-recommendations.js`), candidates à `data/`.
- **Aucune lecture de Shopify depuis le navigateur** : le token Storefront ne quitte pas le serveur.
- **Aucune écriture dans Shopify depuis le site**, sauf le panier (`cartCreate`) et l'inscription newsletter (app Admin dédiée, portée `write_customers`).

## Contrat Shopify consommé par le site

- **Tags** : `exterieur`, `jardin`, `terrasse`, `interieur`, familles et catégories (contrat canonique tenu par l'importateur) ; `promotion` pour l'appartenance aux offres ; `delai-long` pour les délais longs.
- **Metafields produit** (`custom.*`) : `designer`, `year`, `material`, `dimensions`, `lead_time`, `subcategory`, `usage`, `search_facts`, dimensions exactes (`width_cm`, `depth_cm`, `height_cm`…, voir `data/catalog-filter-contract.json`), recommandations Search & Discovery (lues dynamiquement, jamais codées).
- **Collections** : intelligentes pour les catégories et les marques (règles par tag/vendor), automatique `promotions` (règle « prix réduit », voir « Prix et promotions »), manuelles pour les campagnes saisonnières. Une collection dont le handle commence par `claude-` est interne et jamais servie.
- **Menu** : `main-menu` (Shopify) complété par `data/pages.manifest.json` et `v3/navigation-data.json`.
- **Disponibilité** : `availableForSale` fait foi (réglage Shopify) ; le libellé « Indisponible » en découle.

## Migration prévue du contenu éditorial (hors code du site, brief importateur)

1. Metaobject `designer` : nom, slug, biographie, photo, pays, marques associées → remplace `v3/designers-data.json` (229 Ko) et `data/designer-photos.json`.
2. Metaobject `mise_en_avant` : coup de cœur du méga menu (image, titre, accroche, lien) → remplace `v3/mega-menu-config.json`.
3. Metaobject `banniere_marque` : visuel de bandeau par marque → remplace `data/brand-heroes.json` et les fichiers `v3/images/brands/headers/*`.

Côté site : un service `lib/services/content.js` lira ces metaobjects par Storefront API (cache 30 min + edge), avec repli sur les fichiers actuels tant que les metaobjects n'existent pas. Aucune page ne change de forme.

## Fichiers générés commités

Les articles du journal (source `v3/journal/articles.data.mjs`) et les 4 pages légales (sources `docs/legal/*.md` + fiches `data/legal-pages.json`) sont **rendus à la demande** par le serveur depuis leurs sources (`lib/render/journal.js`, `lib/render/legal.js`, ADR 0013) : aucun HTML généré n'est commité, aucune étape de régénération. Modifier le contenu = modifier la source ; le déploiement suivant le sert.

## Table des redirections des anciennes fiches (ADR 0014)

`data/redirections.json` est **produit par l'importateur** (`mikado-importer`, `exports/site/redirections.json`, schéma `mikado.redirections@2`) et copié tel quel dans le dépôt : le site ne l'édite jamais à la main et n'en déduit rien (le champ `status` décide : 301 avec `to` = handle publié ou chemin `/collections/…`, 410 sans destination). Chaque livraison remplace le fichier. Règle d'application, posée par l'importateur : une fiche publiée passe toujours avant la table.

## Délais de livraison hors stock (ADR 0015)

`data/lead-times.json` est une **règle de présentation du site** : délai de la marque vers Mikado (`days` ou `weeks`, `[min, max]`) par marque, affinable par famille ou sous-catégorie, plus la marge Mikado ; le site en déduit le délai affiché. Modifiée par PR sur les valeurs de Cyril. Côté Shopify, **l'importateur** peut poser une exception par fiche dans `custom.lead_time` (texte libre en français : « 6 semaines », « 2-3 semaines », « 10 jours », « sur demande »), que le site lit en priorité ; le tag `delai-long` reste « délai sur demande ». Un flux fournisseur ou l'historique des bons de commande alimentera ces mêmes champs. Le métachamp `custom.lead_time` d'une fiche (écrit par l'importateur) porte le **délai de la marque vers Mikado** en texte libre (« 6-10 semaines », « 10 jours ouvrés ») ; le site y ajoute 2–3 jours ouvrés de réception et d'envoi (`margin.metafieldDays`), le délai de la marque comprenant déjà la livraison jusqu'à la boutique ; en semaines, seule la borne haute peut monter d'une semaine (« 6-10 semaines » → « 6–11 semaines ») ; « sur demande » est affiché tel quel (décision de Cyril du 14/10/2026).

## Retrait en boutique (ADR 0019)

Un seul emplacement Shopify actif honore les commandes en ligne (« Mikado Deco ») : `quantityAvailable` d'une variante est le stock du point de retrait. Le site en déduit le retrait : en stock → « prêt sous 24 h » ; à commander → le même délai que la livraison ; sur demande → « délai confirmé après commande ». Si un second emplacement apparaît, lire `storeAvailability` (portée `unauthenticated_read_product_pickup_locations`).

## Idées cadeaux et saison de Noël (ADR 0016)

`data/gift-ideas.json` (page `/collections/idees-cadeaux` : tranches de budget, rubriques, photos) et le bloc `noel` de `data/campaigns.json` (fenêtre de saison, date de livraison, marge, emballage, échange) sont des **règles de présentation du site**, modifiées par PR. La page retient les fiches de l'index portant un tag contenant `cadeau`/`cadeaux` (`cadeau`, `idee-cadeau`, `cadeau-design`, `coffret-cadeau`, `cadeau-enfant`…) ou le tag `noel` ; les rubriques « Pour qui » (enfants, amoureux, belle-maman, collègue, chien et chat, hôte du réveillon) lisent des MOTS de tags listés dans `data/gift-ideas.json` (`enfant`, `kids`, `vase`, `bougeoir`, `mariage`, `bureau`, `cafe`, `the`, `chien`, `chat`, `champagne`, `bougie`, `cremaillere`, `apero`…), comparés mot à mot dans chaque tag séparé par des tirets. **L'importateur** pilote donc la curation par les tags, sans collection dédiée (`docs/BRIEF-importateur-noel.md`). Chaque carte et chaque fiche portent `christmas: { inStock, onOrder }` (repère « Livré avant Noël » pour les deux états, `null` hors saison) et `giftCard` (produit Shopify `isGiftCard` : « Envoyée par e-mail », aucun délai).

## Prix et promotions (décision de Cyril du 13/10/2026)

Deux contrats se complètent : `docs/CONTRAT_DONNEES_SHOPIFY.md` du dépôt `mikado-importer` dit **qui écrit** chaque donnée dans Shopify et fait foi là-dessus ; ce document dit **ce que le site lit et affiche**.

- **Deux prix par variante.** `compareAtPrice` = le **prix initial**, le RRP de la marque à l'encodage, arrondi selon la règle de la marque. `price` = le prix réellement facturé. **Au tarif normal, `price` = `compareAtPrice`** (posé égal sur toutes les variantes par le chantier A23 de l'importateur puis l'opération O12 ; un `compareAtPrice` vide n'est qu'une transition). En réduction, `compareAtPrice` reste le RRP et `price` baisse.
- **Qui écrit.** L'importateur écrit `compareAtPrice` et le prix au tarif normal, à la création ; ensuite un prix en vente ne change qu'avec l'accord de Cyril. Les réductions (`price` baissé et une balise de raison) sont écrites par l'**instance promotions** de Cyril et ses deux routines claude.ai (« Veille promos marques & mails », « Veille concurrents », consignes dans `routines/` du dépôt importateur), qui ne font pas partie de l'importateur et n'écrivent jamais `compareAtPrice`. Cyril crée les remises automatiques. Le site n'écrit jamais rien.
- **Une réduction, une raison** : `alignement-concurrent`, `promo-marque-alignee`, `fin-de-serie-marque` (routines) ou `promotion` (opération maison, offres conditionnelles comprises ; posée par l'instance promotions, jamais par les routines). Fin de réduction : `price` = `compareAtPrice` sur toutes les variantes, balise retirée. `promo`, `sale` et les balises de campagne ne se posent plus (relevé du 13/10 : il n'en reste aucune).
- **Ce que le site lit.** « En promotion » = `price < compareAtPrice` sur au moins une variante ; l'égalité n'est pas une promotion (le mapper tolère 0,50 €) : prix barré sur les cartes et les fiches, variante remisée choisie pour la carte (`lib/promotion-variants.js`), remises en tête des idées cadeaux. La page `/collections/promotions` = la collection Shopify `promotions` + les produits sous **remise automatique** Shopify active (sonde `getPromos`) + la campagne Home Stories pendant ses dates. Le badge rouge = remise automatique active. Les balises de raison ne sont pas lues par le site.
- **Collections miroirs, tenues par l'instance promotions** (relevé du 13/10) : `promotions` (automatique, 162 produits) = « Prix réduit **est défini** » OU balise `promotion` ; `code-bienvenue-eligible` « Code bienvenue — éligible » (automatique, publiée sur aucun canal, 16 377 produits) = « Prix réduit **n'est pas défini** » ET balise ≠ `promotion`. Le code de bienvenue (marketing) s'applique à la seconde.
- **Remises automatiques Shopify** (offres de marques, paliers d'une opération) : créées par Cyril, elles ne changent aucun prix et ne se cumulent pas avec le code de bienvenue (réglage « Combinaisons » du code).
