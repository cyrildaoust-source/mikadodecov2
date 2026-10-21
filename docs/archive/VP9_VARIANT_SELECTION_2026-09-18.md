# Sélection initiale et chargement des variantes — 18 septembre 2026

La fiche Flowerpot VP9 avait une couverture Orange vif alors que le navigateur
choisissait Bleu cobalt, première variante Shopify. Le rendu serveur, l'API et
le navigateur partagent désormais la sélection : identifiant de variante valide
dans l'URL, puis association unique avec la couverture, puis défaut existant.
Les transformations de livraison des URL Shopify ne changent pas cette identité.
L'ordre des variantes Shopify reste intact. Sans correspondance unique ni lien
explicite, le prix « À partir de » reste conservé.

Lors d'un changement de couleur, l'image est préchargée et décodée avant de
changer ensemble photo, libellé, prix, stock affiché et identité du panier.
Un chargement ancien ou échoué ne peut pas écraser la sélection courante.
Aucune mutation Shopify, modification de stock, activation ou publication.

## Vérification

- `node --test tests/*.test.cjs tests/*.test.mjs` : 77 tests réussis.
- `node --check server.js` et `git diff --check` réussis.
- Prévisualisation navigateur réelle sur
  `http://127.0.0.1:4327/produit.html?handle=lampe-de-table-flowerpot-vp9`,
  avec fixture issue du relevé public VP9 (pas de panier de production).
- À l'ouverture sans variante : photo orange, Orange vif, 189 €, stock affiché 2.
- Choix Bleu cobalt : photo bleue, Bleu cobalt, 189 €, stock affiché 3 ;
  URL `variant=54313203794249` ; rechargement conservant le choix.
- Tests de prix différents sur fixture synthétique, priorité URL, couverture
  ambiguë, absence de correspondance, concurrence et échec de chargement.

Ce contrôle local ne prouve pas le déploiement en production et ne qualifie pas
le catalogue &Tradition. Les réserves fournisseur et la qualification des médias
restent suivies dans le dépôt mikado-importer.
