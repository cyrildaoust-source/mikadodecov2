# Architecture du site

Mikado utilise Express pour rendre du HTML côté serveur, puis des modules JavaScript natifs pour les interactions. Le navigateur reçoit déjà les liens, les cartes et les informations essentielles ; la recherche, les filtres et la sélection enrichissent ces pages. Aucun framework ou outil de compilation supplémentaire n'est nécessaire pour cette organisation.

## Responsabilités

| Emplacement | Responsabilité |
| --- | --- |
| `server.js` | Routes HTTP, composition des pages, sécurité et caches des pages |
| `lib/shopify/client.js` | Transport Storefront et traitement des erreurs |
| `lib/shopify/queries.js` | Opérations Storefront communes |
| `lib/shopify/product-mapper.js` | Transformation des données Shopify en produits affichables |
| `lib/services/search.js` | Chargement, pagination et cache des index de recherche |
| `lib/search-intent.js`, `lib/search-catalog.js` | Interprétation et correspondance des demandes client |
| `lib/search-facts.js` | Validation des configurations sourcées |
| `v3/product-card.mjs`, `v3/format.mjs` | HTML et formatage communs au serveur et au navigateur, sans accès au DOM |
| `v3/shared.js` | Navigation, sélection et initialisation des interactions communes |
| `v3/search-drawer.mjs` | Suggestions de recherche, chargées à la première ouverture |
| `v3/*.html`, `templates/` | Structure et composition des pages |
| `v3/styles.css` | Direction artistique et composants communs |

Une page choisit les produits et leur disposition. Elle réutilise les cartes sans recopier leur HTML. Les routes utilisent le client Shopify ; les règles de recherche restent testables sans réseau. Les faits produits appartiennent à Shopify et au pipeline importer, jamais à un catalogue parallèle dans le navigateur.

Le formulaire de recherche utilise une requête GET vers `/produits.html?q=…`. Si le module de suggestions échoue au chargement, le champ et la validation par Entrée restent utilisables. Les modules communs sont revalidés par le navigateur après déploiement.

## Mesure du 21 septembre 2026

Avant cette séparation, les fichiers suivis contenaient environ 1 018 Ko de HTML et 593 Ko de JavaScript, scripts et tests compris. Environ 169 Ko de JavaScript étaient aussi inclus dans les fichiers HTML. Ce comptage de fichiers ne mesure ni le trafic réseau ni le temps d'exécution : seul le code chargé et exécuté sur une page compte pour le visiteur.

Le chantier réduit le serveur principal d'environ 2 850 à 2 200 lignes et le module partagé du navigateur d'environ 1 190 à 970 lignes. Les suggestions ne sont plus téléchargées au premier affichage. Cette séparation améliore la maintenance ; elle ne constitue pas, à elle seule, une mesure de gain de vitesse. La performance doit être vérifiée dans une preview réelle.

Pour les prochaines évolutions, extraire les contrôleurs ou les scripts de page lorsqu'ils changent, en gardant le rendu serveur et les modules natifs. Un changement de framework n'est pas un objectif en soi. Les contrats visuels sont dans `DESIGN.md`, les règles éditoriales dans `docs/FAMILY_PAGES.md`.

## Recette de la livraison

Preview du 21 septembre : https://mikadodecov2-rg7ptut41-mikadodeco.vercel.app. Recherche depuis le haut de l’accueil puis validation par Entrée : « chaise noire 500€ », 45 modèles. Vérification sur ordinateur à 1635 px et sur mobile à 390 × 844 px : cartes communes, critères, prix et contrôles présents ; largeur de page 390 px, aucune erreur de console sur ce parcours. Les 110 tests passent, dont les suites obligatoires des familles, tables et caractéristiques. Les contrôles de performance chiffrés ne font pas partie de cette recette.

Publication : [PR 114](https://github.com/cyrildaoust-source/mikadodecov2/pull/114), commit `3ac7a5f`, déploiement Vercel de production prêt. Le parcours depuis le haut de l’accueil a été revérifié sur [le site public](https://www.mikadodeco.be/produits.html?q=table+Artek+160+x+80+cm+pour+6+personnes) avec les données Shopify réelles. La preview finale sans simulation est https://mikadodecov2-hdjy77wku-mikadodeco.vercel.app.
