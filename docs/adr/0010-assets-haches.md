# ADR 0010 — Assets front hachés par version de sources, construits par esbuild au build Vercel

Date : 8 octobre 2026 · Statut : accepté · Phase 3.1 (étape 2) du plan ; s'appuie sur l'ADR 0009.

## Contexte

Les pages chargeaient leurs modules ES bruts (`/shared.js` 52 Ko, `/pages/produits.js` 41 Ko, puis chaque import en cascade : `navigation.mjs`, `chrome-template.js`, `format.mjs`…) et `styles.css` (155 Ko) avec `Cache-Control: max-age=0, must-revalidate` : à chaque navigation, une dizaine de requêtes 304 par page, et aucun moyen de mettre ces fichiers en cache longtemps sans risquer de servir un vieux JS après un déploiement. Les logos de marques contournaient le problème avec `?v=<sha>` lu sur `/api/build`.

Depuis l'ADR 0009, Vercel exécute `npm run build` : une étape de construction est possible.

## Décision

- **Le HTML du dépôt continue de référencer les sources** (`<script type="module" src="/pages/produits.js">`, `import … from "/shared.js"`, `<link href="/styles.css">`). Rien à changer pour écrire une page.
- **`scripts/build.mjs`** (esbuild) regroupe et minifie chaque module référencé par le HTML dans `dist/assets/<nom>.<version>.js` (découpage du code partagé en `chunks/`, sourcemaps), et chaque feuille de style dans `dist/assets/<nom>.<version>.css` (`@import url("/mega-menu.css")` fusionné ; `url(/fonts/…)` et `url(/images/…)` restent absolues). Les entrées sont découvertes dans le HTML par `lib/assets.js` (`entries()`), pas listées à la main.
- **La version est le hachage du contenu de toutes les sources front** (`v3/*.js`, `*.mjs`, `*.css`, `v3/pages/*.js`). Le build et le serveur la calculent chacun depuis les mêmes fichiers, embarqués dans la fonction par `includeFiles` : pas de manifeste à transporter du build au runtime, et un déploiement qui ne touche ni JS ni CSS conserve les mêmes URL (caches navigateur intacts). `tests/assets.test.cjs` vérifie que chaque source est couverte par `includeFiles`.
- **Au rendu**, `injectChrome` réécrit les références (`rewriteAssets`) vers les noms hachés. `vercel.json` sert `/assets/*` avec `public, max-age=31536000, immutable`. Les sources brutes restent copiées dans `dist/` (sécurité pour toute référence oubliée ; retrait prévu avec la scission de `shared.js`, point 3.4).
- **La fonction n'embarque ni `dist/` ni `v3/images`, `v3/fonts`** (`excludeFiles`) : le build produit `dist/` avant le tracé de la fonction, et sans exclusion les copies entraient dans le bundle (327 Mo, au-delà de la limite de 250 Mo). Le serveur ne lit jamais ces fichiers ; le CDN les sert. La fonction passe de ~165 Mo à quelques Mo.
- **En local**, sans build, rien n'est réécrit (le site tourne sur les sources) ; après `npm run build`, le serveur sert `dist/assets` et réécrit comme en production. `ASSETS_HASHED=0|1` force le comportement.
- Le smoke test vérifie qu'un script et la feuille de style de l'accueil sont bien servis depuis `/assets/` en `immutable`.

## Conséquences

- Première visite : moins de requêtes (modules regroupés, CSS fusionnée) ; navigations suivantes : zéro requête de revalidation pour JS et CSS.
- Changer un module = nouvelle version pour tous les bundles (granularité volontairement simple : le code partagé est dans presque chaque bundle). Si la taille du site le justifie un jour, passer à un hachage par sortie avec manifeste.
- `shared.js` perd `ensureMegaMenuCss()` (injection tardive de `/mega-menu.css`), devenue inutile depuis que `styles.css` l'importe ; la feuille est désormais fusionnée.
- `?v=<sha>` sur les logos de marques et `/api/build` restent : ils concernent des images, pas des bundles. À revoir avec les images (ADR 0008).
