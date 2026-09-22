# Travail sur Mikado

- Pour toute modification d’interface, lire `DESIGN.md` et respecter la dernière décision du propriétaire.
- Réutiliser les cartes et boutons communs. Les pages règlent leur placement et leur contenu, sans redessiner leurs éléments internes.
- Pour les pages familles et le catalogue, lire `docs/FAMILY_PAGES.md` avant de modifier la curation ou le classement.
- Après une modification des données, routes ou règles de pagination, exécuter `node --test tests/family-pages.test.cjs tests/table-collections.test.cjs tests/product-specs.test.mjs` et corriger les erreurs pertinentes.
- Vérifier les modifications visuelles dans une preview réelle, prioritairement sur ordinateur, puis fournir son lien. Ne pas confondre réussite des tests et validation visuelle.

## Promotions Shopify

- Une baisse de prix et un prix comparé ne suffisent pas : vérifier le tag `promotion` et l'appartenance réelle à la collection Promotions.
- Contrôler la variante réellement remisée (finition, prix, prix comparé, stock, politique de vente), puis la carte publique, son image, le lien vers cette variante et le panier. Ne pas annoncer une mise en ligne sur la seule validation Shopify.
- Les remises de déstockage sont limitées au stock disponible ; respecter les exceptions explicitement autorisées, comme Panton sur commande par lots de 6.
- Vérifier les anciennes offres et retirer du classement les produits sans remise ni offre active. Ne pas inventer une nouvelle remise pour conserver un produit dans Promotions.
- En cas de changement de présentation des promotions, exécuter aussi `node --test tests/promotion-card.test.cjs`.
