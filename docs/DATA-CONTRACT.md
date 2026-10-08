# Contrat de données — qui est la source de vérité de quoi

Date : 7 octobre 2026 · Phase 4.3 du plan d'architecture · Ce document fait foi pour toute question « où vit cette donnée ? ». Il complète `docs/ARCHI-critique-et-plan-2026-10-06.md` et le contrat des tags du backend (mémoire importateur).

## Principe

Trois lieux, trois natures de données, jamais de recopie d'un lieu vers l'autre dans le code :

| Lieu | Nature | Qui modifie | Comment le site le lit |
|---|---|---|---|
| **Shopify** | Les **faits commerciaux** : produits, variantes, prix, prix comparé, stock, disponibilité, images produit, collections (intelligentes et manuelles), metafields produit, tags, remises programmées, menu principal, clients, commandes. | L'importateur (données), Cyril (admin Shopify). | Storefront API côté serveur uniquement (`lib/shopify/`), jamais depuis le navigateur. Cache mémoire 5 min + cache edge. |
| **`data/` du dépôt** | Les **règles de présentation** du site : inventaire des pages (`pages.manifest.json`), filtres de catégorie (`category-filters.json`), campagnes et textes imposés (`campaigns.json`), pages familles (`family-pages.json`), héros de marques et collections (`brand-heroes.json`, `collection-heroes.json`), landing catalogue, icônes d'assises, enrichissements de recherche. | Le code (PR, revue, CI). | Lu au chargement par `lib/config.js` et les services ; testé (`tests/data-sources.test.cjs`, `tests/pages-manifest.test.cjs`). |
| **Contenu éditorial** | Bios et photos des designers (`v3/designers-data.json`, `data/designer-photos.json`), coup de cœur du méga menu (`v3/mega-menu-config.json`), curation des marques du méga menu (`v3/mega-menu-brands.json`), articles du journal (`v3/journal/articles.data.mjs`), pages légales (`docs/legal/*.md`). | Cyril, aujourd'hui par PR. **Cible** : metaobjects Shopify (designers, coup de cœur, bannières de marques) pour éditer sans déploiement. | Fichiers du dépôt aujourd'hui ; Storefront API (metaobjects) demain, même contrat de lecture côté serveur. |

## Interdits

- **Aucune donnée produit en dur dans le code** : ni prix, ni handle de produit, ni stock, ni nom de variante. Un produit mis en avant est désigné par une collection Shopify ou un tag, jamais par son handle dans un `.js`. (Exception tracée : les handles d'icônes dans `data/catalog-landing.json`, `data/seating-icons.json` et `data/family-pages.json` sont de la curation, donc des règles de présentation ; ils sont vérifiés à l'exécution et une icône absente est simplement ignorée.)
- **Aucune règle métier dans un littéral de code** (`product_type:"…"`, dates de campagne, listes de pages) : `tests/data-sources.test.cjs` échoue sinon. Exception déclarée : les requêtes de « scène » du moteur de recommandation (`lib/product-recommendations.js`), candidates à `data/`.
- **Aucune lecture de Shopify depuis le navigateur** : le token Storefront ne quitte pas le serveur.
- **Aucune écriture dans Shopify depuis le site**, sauf le panier (`cartCreate`) et l'inscription newsletter (app Admin dédiée, portée `write_customers`).

## Contrat Shopify consommé par le site

- **Tags** : `exterieur`, `jardin`, `terrasse`, `interieur`, familles et catégories (contrat canonique tenu par l'importateur) ; `promotion` pour l'appartenance aux offres ; `delai-long` pour les délais longs.
- **Metafields produit** (`custom.*`) : `designer`, `year`, `material`, `dimensions`, `lead_time`, `subcategory`, `usage`, `search_facts`, dimensions exactes (`width_cm`, `depth_cm`, `height_cm`…, voir `data/catalog-filter-contract.json`), recommandations Search & Discovery (lues dynamiquement, jamais codées).
- **Collections** : intelligentes pour les catégories et les marques (règles par tag/vendor), manuelles pour les campagnes (`promotions`, collections saisonnières). Une collection dont le handle commence par `claude-` est interne et jamais servie.
- **Menu** : `main-menu` (Shopify) complété par `data/pages.manifest.json` et `v3/navigation-data.json`.
- **Disponibilité** : `availableForSale` fait foi (réglage Shopify) ; le libellé « Indisponible » en découle.

## Migration prévue du contenu éditorial (hors code du site, brief importateur)

1. Metaobject `designer` : nom, slug, biographie, photo, pays, marques associées → remplace `v3/designers-data.json` (229 Ko) et `data/designer-photos.json`.
2. Metaobject `mise_en_avant` : coup de cœur du méga menu (image, titre, accroche, lien) → remplace `v3/mega-menu-config.json`.
3. Metaobject `banniere_marque` : visuel de bandeau par marque → remplace `data/brand-heroes.json` et les fichiers `v3/images/brands/headers/*`.

Côté site : un service `lib/services/content.js` lira ces metaobjects par Storefront API (cache 30 min + edge), avec repli sur les fichiers actuels tant que les metaobjects n'existent pas. Aucune page ne change de forme.

## Fichiers générés commités

Les articles du journal (source `v3/journal/articles.data.mjs`) et les 4 pages légales (sources `docs/legal/*.md` + fiches `data/legal-pages.json`) sont **rendus à la demande** par le serveur depuis leurs sources (`lib/render/journal.js`, `lib/render/legal.js`, ADR 0013) : aucun HTML généré n'est commité, aucune étape de régénération. Modifier le contenu = modifier la source ; le déploiement suivant le sert.
