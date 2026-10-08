# ADR 0011 — Le front est découpé par responsabilité ; les sources ne sont plus servies brutes

Date : 8 octobre 2026 · Statut : accepté · Phase 3.4 du plan ; s'appuie sur l'ADR 0010.

## Contexte

`v3/shared.js` (990 lignes) mélangeait le panier, le tiroir panier, l'offre cadeau, les appels à l'API, les cartes produit, le fil d'Ariane, la newsletter, l'analytics, la barre d'annonce, le tiroir mobile et l'initialisation de la coquille. Chaque page l'importait en entier ; toute évolution du panier passait par le même fichier que la newsletter. Depuis l'ADR 0010, ce poids n'est plus un sujet de performance (un seul chunk partagé, 15 Ko compressés, caché un an) : la question est devenue purement de structure.

Par ailleurs, les sources brutes (`/shell.mjs`, `/styles.css`…) restaient copiées dans `dist/` et servies par la fonction, « au cas où » : deux chemins pour le même code.

## Décision

- `shared.js` disparaît (0 résidu). Douze modules, un par responsabilité, tous dans `v3/` :
  `shell.mjs` (initShell : hydratation du chrome, tiroir mobile, recherche, annonce, images de repli, nav active), `cart.mjs` (panier localStorage, badge, aperçu Shopify), `cart-drawer.mjs`, `gift-rules.mjs` (constantes et prédicats de l'offre cadeau, sans dépendance, lisibles par le panier) et `gift-offer.mjs` (moteur et rendu), `catalog-data.mjs` (API produits/marques/collections/promotions, navigation, fil d'Ariane), `product-grid.mjs` (cartes, ajout délégué, liens de retour), `site-data.mjs` (`#site-data`, version), `sale.mjs`, `newsletter.mjs`, `analytics.mjs`, `scroll-lock.mjs`. `format.mjs`, `navigation.mjs`, `product-card.mjs`, `chrome-template.js` restent isomorphes.
- Chaque page importe ce qu'elle utilise depuis le bon module ; les pages HTML et les gabarits générés (journal, légal) importent `initShell` depuis `/shell.mjs`.
- **Les sources ne sont plus publiées dans `dist/`** et le serveur ne les sert plus en production (`express.static` les ignore dès qu'un build existe) : seuls les bundles `/assets/<nom>.<version>.(js|css)` existent. En local sans build, les sources sont servies telles quelles.
- La 404 produit/collection (`send404Shell`) passe de 10 minutes à 1 minute de cache edge (`s-maxage=60, stale-while-revalidate=600`) : une fiche remise en ligne réapparaît en une minute (l'edge Vercel n'a pas de purge par URL).

## Conséquences

- Code déplacé, pas réécrit : même comportement, vérifié par le parcours panier de bout en bout (ajout, badge, tiroir, quantité, page sélection, bascule des cartes, retrait) et les contrôles habituels.
- `/shell.mjs`, `/styles.css`, `/pages/*.js` répondent 404 en production : c'est voulu (le HTML référence toujours les sources, le serveur réécrit vers les bundles). `route-parity.mjs` le déclare comme changement voulu.
- Un module front ne vit que dans `v3/` (racine ou `pages/`) ; le découpage est la base du layout unique (4.1).
