# Travail sur Mikado

- Pour toute modification d’interface, lire `DESIGN.md` et respecter la dernière décision du propriétaire.
- Réutiliser les cartes et boutons communs. Les pages règlent leur placement et leur contenu, sans redessiner leurs éléments internes.
- Pour les pages familles et le catalogue, lire `docs/FAMILY_PAGES.md` avant de modifier la curation ou le classement.
- Après une modification des données, routes ou règles de pagination, exécuter `node --test tests/family-pages.test.cjs tests/table-collections.test.cjs tests/product-specs.test.mjs` et corriger les erreurs pertinentes.
- Vérifier les modifications visuelles dans une preview réelle, prioritairement sur ordinateur, puis fournir son lien. Ne pas confondre réussite des tests et validation visuelle.
