# Travail sur Mikado

- Pour toute modification d’interface, lire `DESIGN.md` et respecter la dernière décision du propriétaire.
- Réutiliser les cartes et boutons communs. Les pages règlent leur placement et leur contenu, sans redessiner leurs éléments internes.
- Pour les pages familles et le catalogue, lire `docs/FAMILY_PAGES.md` avant de modifier la curation ou le classement.
- Avant d’ouvrir ou de mettre à jour une PR, exécuter `npm run check` (syntaxe JS et JSON) puis `npm test` (toute la suite, ≈ 15 s, sans navigateur) et corriger les erreurs. La CI GitHub (`.github/workflows/ci.yml`) rejoue ces deux commandes sur chaque PR. Les tests qui pilotent un navigateur vivent dans `tests/e2e/` et se lancent à part avec `npm run test:e2e` (Playwright + Chromium installés).
- Après une modification des données, routes ou règles de pagination, regarder en particulier `tests/family-pages.test.cjs`, `tests/table-collections.test.cjs` et `tests/product-specs.test.mjs`.
- Vérifier les modifications visuelles dans une preview réelle, sur ordinateur **et sur mobile (390 px puis 360 px)**, puis fournir son lien. Ne pas confondre réussite des tests et validation visuelle.
- **Aucun surtitre (« eyebrow »)**, jamais : pas de petit texte au-dessus d'un titre pour l'introduire. Règle permanente, voir `DESIGN.md` (« Surtitres ») ; `tests/no-eyebrows.test.cjs` doit passer et `node scripts/detect-eyebrows.cjs <preview>` ne rien trouver.
- Penser le mobile dès la conception de chaque changement (demande du propriétaire du 24 septembre) : ordre des informations, zones tactiles de 44 px, aucun débordement horizontal mesuré avec une fenêtre de largeur fixe. Voir la section Mobile de `DESIGN.md`.

## Promotions Shopify

- Une baisse de prix et un prix comparé ne suffisent pas : vérifier le tag `promotion` et l'appartenance réelle à la collection Promotions.
- Contrôler la variante réellement remisée (finition, prix, prix comparé, stock, politique de vente), puis la carte publique, son image, le lien vers cette variante et le panier. Ne pas annoncer une mise en ligne sur la seule validation Shopify.
- Les remises de déstockage sont limitées au stock disponible ; respecter les exceptions explicitement autorisées, comme Panton sur commande par lots de 6.
- Vérifier les anciennes offres et retirer du classement les produits sans remise ni offre active. Ne pas inventer une nouvelle remise pour conserver un produit dans Promotions.
- En cas de changement de présentation des promotions, exécuter aussi `node --test tests/promotion-variants.test.cjs tests/promotion-variants-api.test.cjs`.

## Architecture du code (depuis octobre 2026)

- `server.js` ne fait que démarrer `app.js` ; `api/index.js` (Vercel) importe la même application.
- `app.js` compose les middlewares et monte les routeurs dans l'ordre qui compte : `routes/seo.js` (sitemaps) → `routes/pages.js` (fiche produit, collections, catalogue, pages statiques avec chrome) → statique `v3/` → CORS, JSON → `routes/api.js`, `routes/cart.js`, `routes/forms.js` → 404 → gestionnaire d'erreurs (`lib/http-errors.js`).
- Le code métier vit dans `lib/` : `config.js` (constantes, pages SSR), `cache.js` (cache mémoire borné), `render/` (chrome, navigation, Open Graph, pages SSR, réponses agents), `services/catalog.js` (lectures Shopify mises en cache), `services/catalog-scope.js` (index du catalogue), `shopify/` (client, requêtes, mapper).
- Une route ne contient que la lecture de la requête, l'appel au service et la réponse. Toute requête GraphQL vit dans `lib/shopify/queries.js`. Une nouvelle page `v3/*.html` se déclare dans `data/pages.manifest.json` (rôle, `ssr`, `hero`, `active`) et c'est tout : `vercel.json` n'a plus de liste de pages (toute URL qui n'est pas un fichier de `dist/` arrive au serveur, ADR 0009) ; `tests/pages-manifest.test.cjs` échoue si une page manque au manifeste.

## Sécurité du contenu (CSP)

- La CSP est posée par le serveur (`lib/csp.js`, via `lib/request-log.js`) avec un **nonce par requête** ; `injectChrome` l'ajoute automatiquement à chaque `<script>` inline exécutable. `script-src` n'a plus `'unsafe-inline'`.
- Donc : **jamais de gestionnaire inline** (`onload=`, `onerror=`, `onclick=`…) ni de `href="javascript:"`. Pour une image de repli, poser `data-fallback="remove|text|brand-name|brand-wordmark|hero"` (traitée par `bindImageFallbacks` dans `shared.js`). Une feuille de style chargée en `media="print"` est basculée en `all` par le script d'en-tête commun.
- Un script inline reste possible (gardes anti-flash de quelques lignes) ; au-delà de 20 lignes, il va dans `v3/pages/<page>.js`. `tests/csp.test.cjs` et `tests/no-inline-modules.test.cjs` veillent.
