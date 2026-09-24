# Corrections d’indexation du 20 septembre 2026

Suite à l’audit de 669 exclusions Search Console :

- Pagination HTML des collections, marques et designers : lien vers le lot suivant et retour au début, avec conservation des filtres. Les URL à curseur ont leur propre canonique, préservée après exécution JavaScript. Les familles à chargement additionnel gardent également leur canonique de continuation.
- Une panne Shopify sur le contenu principal renvoie 503, `Retry-After: 60` et `Cache-Control: no-store`. Une fiche inexistante reste en 404. L’échec d’une icône secondaire laisse la grille principale utilisable en 200 sans cache.
- Le sitemap conserve tous les produits publiés. Il omet les collections sans produit visible, tout en conservant les familles éditoriales et les sélections composites. La lecture des collections est paginée et ne s’arrête plus à 250.
- Une collection générique vide reste accessible, avec `noindex,follow`. Ce signal se retire automatiquement quand la collection retrouve des produits visibles, après expiration du cache.
- Les anciennes URL Vitra, Ichendorf, Pols Potten et String Furniture redirigent vers leur collection spécifique. Ester & Erik garde sa destination générale : aucune collection spécifique disponible n’a été confirmée.
- Les dates `lastmod` déduites du démarrage du serveur sont retirées.

Les prix, stocks, statuts produits et canaux Shopify ne sont pas modifiés par ce correctif.

Vérifications : tests des familles, collections de tables et caractéristiques produit, incluant les erreurs 503, la pagination sur plusieurs lots et l’omission des collections vides. La requête Storefront a été validée localement contre le schéma fourni par Shopify, sans télémétrie.

Sources :
- https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
- https://developers.google.com/crawling/docs/troubleshooting/http-status-codes
- https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/getting-started

Limites : les pages numérotées et les tris du catalogue existant restent calculés dans le navigateur ; les liens serveur à curseur permettent le parcours du catalogue sans dépendre de ces contrôles. Le statut final d’indexation dépend de la nouvelle exploration Google. Les décisions de publication des produits réservés au point de vente restent distinctes.
