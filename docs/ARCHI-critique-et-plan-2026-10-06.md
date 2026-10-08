# Architecture du site mikadodeco.be — critique et plan d'amélioration

Date : 6 octobre 2026 · Base analysée : `main` @ `8800d9f` (PR #171) + prod `www.mikadodeco.be` (mesures curl le 06/10) · Auteur : Claude (revue d'architecture).

> Le schéma gitdiagram donne la forme générale (Express + statique `v3/` + Shopify). Ce document part du code réel de `main` et de mesures en production, pas du schéma.

---

## 0. État d'avancement (mis à jour le 8 octobre 2026)

| Phase | Point | État | Où |
|---|---|---|---|
| 0 | 0.1 CI · 0.2 npm test · 0.3 smoke · 0.4 hygiène · 0.5 erreurs · 0.6 clone hors iCloud | ✅ livré | PR #177, #178, #179, #180 (+ #181 = 2.2) |
| 1 | 1.1 découpage · 1.2 manifeste · 1.3 cache borné · 1.4 data/ · 1.5 journal + Server-Timing | ✅ livré | PR #182 (brouillon, sur les 5 PR de la phase 0) |
| 2 | 2.1 listes à l'edge · 2.2 API · 2.3 étape 1 (réchauffage) · 2.5 ADR | ✅ livré | PR #181, #183 ; ADR 0001–0003 |
| 2 | 2.3 étape 2 (index dans Blob, route protégée cadencée par GitHub) | ✅ livré (8 oct.) | PR feat/index-blob ; ADR 0002 |
| 2 | 2.4 prédictive sur l'index | ✖ fermé sans code : la latence est celle de Shopify, l'index ne porte pas sa pertinence | ADR 0007 |
| 3 | 3.2 scripts de page externes · 3.3 CSP nonce sans 'unsafe-inline' | ✅ livré | PR #184 |
| 3 | 3.5 double payload · 3.6 Lighthouse (rapport, non bloquant) | ✅ livré | PR #186 (3.5), #185 (3.6) |
| 3 | 3.1 étape 1 : configuration Vercel moderne (`npm run build` → `dist/`, une seule réécriture vers le serveur, fin du double routage, outil de parité prod/Preview) | ✅ livré (8 oct.) | PR #199/#200 ; ADR 0009 |
| 3 | 3.1 étape 2 : esbuild, assets hachés `immutable`, version = hachage des sources, réécriture au rendu | ✅ en Preview (8 oct.), à valider puis merger | PR perf/assets-haches ; ADR 0010 |
| 3 | 3.4 scission shared.js (+ retrait des sources brutes de dist/) | à faire, débloqué par l'étape 2 | — |
| 4 | 4.2 contenu généré vérifié en CI · 4.3 contrat de données | ✅ livré | PR #185 |
| 4 | 4.3 brief importateur metaobjects | ⏸ parqué (rien à encoder pour l'instant, décision du 8 oct.) | docs/BRIEF-importateur-metaobjects.md |
| 4 | 4.1 layout unique | à faire | — |
| 4 | 4.4 images hors git | ⏸ reporté : Blob plafonné sur le plan Hobby, sortie de git = réécriture d'historique | ADR 0008 |
| 5 | 5.2 /api/health · 5.3 ADR 0001–0006 · 5.4 Dependabot · 5.4 Express 5 | ✅ livré | PR #185, #187 ; docs/adr |
| 5 | 5.1 log drain + alertes (réglage Vercel) | à faire, réglage propriétaire | — |

---

## 1. Verdict en une page

Le site est un **monolithe Express de 2 821 lignes exécuté comme une seule fonction serverless Vercel**, qui sert une arborescence statique `v3/` (HTML + CSS + modules ES bruts, sans build) et parle à Shopify Storefront côté serveur. L'architecture a bien tenu la montée en fonctionnalités (SSR progressif, SEO, GEO 100/100, sécurité correcte, composants isomorphes) mais elle atteint ses limites sur **quatre axes** :

1. **Cache et temps de réponse** : les pages listes sont servies en `no-store` et re-rendues à chaque visite (1 à 2 s de TTFB mesurés), l'index catalogue se construit dans la requête (timeout > 60 s observé), la recherche prédictive à froid prend 5,6 s.
2. **Structure du code** : `server.js` a grossi de 2 032 à 2 821 lignes malgré l'extraction de `lib/` ; 36 routes, 68 fonctions, zéro gestionnaire d'erreurs global ; chaque route SSR doit être déclarée deux fois (Express + `vercel.json`).
3. **Pipeline qualité** : aucune CI, `npm test` a disparu de `package.json`, la suite complète ne termine pas (un test lance le serveur + Playwright), validation = « regarder la Preview ».
4. **Front sans build** : 916 lignes de JS + 889 lignes de CSS inline dans `produits.html`, 677 lignes inline dans `produit.html`, CSP condamnée à `'unsafe-inline'`, pas de fingerprint d'assets, payload d'hydratation doublé (193 KB de JSON à côté de 64 cartes déjà rendues).

Ce qui est **sain et à préserver** : secrets strictement côté serveur, CSP/HSTS/HMAC/rate-limit/honeypot, client Shopify avec retries (jamais sur les mutations), composants partagés serveur/navigateur (`product-card.mjs`, `chrome-template.js`), JSON-LD + sitemap index + `llms.txt`, 35 fichiers de tests existants, règles de design codifiées (`DESIGN.md`, `AGENTS.md`), assets statiques légers et servis en HIT edge (CSS 38 KB br, shared.js 18 KB br).

**Recommandation** : ne pas changer de framework maintenant. Faire les phases 0 → 3 ci-dessous (≈ 10 semaines, ≈ 29 jours d'implémentation) ; elles sont nécessaires quel que soit l'avenir et divisent par deux le coût d'une éventuelle migration (option B, §6).

### Notes indicatives par dimension

| Dimension | Note | Justification courte |
|---|---|---|
| Sécurité | 8/10 | Token Storefront jamais côté client, CSP/HSTS/XFO, HMAC webhook, rate-limit, honeypot. Résiduel : `'unsafe-inline'`, limiteurs par instance. |
| SEO / découvrabilité | 8/10 | SSR chrome + PDP + grilles, JSON-LD, sitemap index, canonical, GEO 100/100. |
| Perf front (assets) | 8/10 | CSS/JS petits, brotli, HIT edge, fonts préchargées. Manque : fingerprint, bundling. |
| Perf serveur / cache | 4/10 | Listes `no-store` (1–2 s), index en requête (> 60 s), predictive 5,6 s à froid, cache mémoire non borné par instance. |
| Structure du code | 4/10 | Monolithe 2 821 l., double routage, config dupliquée (NON_HERO / SSR_PAGES / FAMILLES_RICHES / CATEGORY_FILTERS / dates promo). |
| Qualité / CI | 3/10 | Pas de CI, pas de `npm test`, suite non hermétique, pas de lint, Playwright mélangé aux tests unitaires. |
| Données / contenu | 4/10 | 600 KB de JSON éditorial dans le repo + constantes JS + Shopify : source de vérité éclatée ; tout contenu = commit + déploiement. |
| Repo / outillage | 3/10 | 84 MB d'images dans git sous iCloud (checkout > 150 s), checkout local sur une branche de juillet, fichiers de dev déployés publiquement, code legacy Vitra encore bundlé. |
| Observabilité | 2/10 | `console.warn` seulement, pas de logs structurés, pas d'alerte, pas de health check, pas de budget perf. |

---

## 2. Photographie de l'existant (faits vérifiés)

### 2.1 Topologie

```
Navigateur ──► Vercel Edge ──► vercel.json (≈ 45 règles de routage + headers sécurité)
                               ├─ @vercel/static  : v3/** (HTML, CSS, JS, JSON, images, fonts)
                               └─ @vercel/node    : api/index.js → require('../server.js')  [1 seule fonction]
                                                     ├─ SSR : chrome, PDP, collections, familles, créateurs, sitemaps, 404
                                                     ├─ API : /api/products|brands|menu|collections|search|predictive|catalog|product|cart/*|contact|newsletter|revalidate|build
                                                     ├─ index catalogue : /index-catalogue/<part>.json (construit dans la fonction)
                                                     └─ cache mémoire `_cache` + Maps ad hoc, par instance
                                                            │
                                                            ▼
                                                   Shopify Storefront GraphQL (lib/shopify/client.js, retries 250/750 ms)
Génération hors ligne (manuelle, résultat commité) : scripts/build-journal.mjs, scripts/build-legal.mjs, scripts/optimize-images.js
```

### 2.2 Chiffres (main @ 8800d9f)

| Mesure | Valeur |
|---|---|
| `server.js` | 2 821 lignes · 166 KB · 36 routes · 68 fonctions · 20 `require` |
| `lib/` | 26 modules · 2 863 lignes (shopify/client, product-mapper, queries, search, seo-meta, product-jsonld, family-pages, catalog-index…) |
| Front `v3/*.js|mjs` | 25 modules · 3 536 lignes · `shared.js` seul = 973 lignes |
| CSS | `styles.css` 1 981 lignes (3 `!important`, bon signe) · `mega-menu.css` 385 |
| JS/CSS inline | `produits.html` 916 l. JS + 889 l. CSS · `produit.html` 677 l. JS · `selection.html` 284 l. JS · `designers.html` 151 l. |
| Tests | 35 fichiers (`.cjs` + `.mjs`) · aucun script `test` dans `package.json` · 4 fichiers lancés isolément = 25 tests verts en 2,4 s · suite complète bloque (brands-index lance le serveur + Playwright) |
| CI | aucun `.github/` |
| `vercel.json` | 1 fonction · `includeFiles` = 24 entrées listées à la main · ≈ 45 routes |
| Données repo | `designers-data.json` 229 KB · `data/*.json` ≈ 600 KB (catalog-enrichment 312 KB, designer-photos 116 KB…) |
| Images | 714 fichiers · 84 MB trackés dans git |
| Vélocité | 165 PR mergées au total · 79 depuis le 13/09/2026 |
| Checkout local | branche `feat/marques-dynamiques` (juillet 2026), 79 PR derrière `main` |

### 2.3 Mesures production (06/10/2026, premier hit = edge MISS)

| URL | Code | Poids transféré | Temps total | Cache-Control vu |
|---|---|---|---|---|
| `/` | 200 | 68 KB brut | — | `public, max-age=0, must-revalidate` |
| `/produits.html` | 200 | 48,8 KB br (**482 KB brut**) | **2,14 s** | `no-store` |
| `/collections/vitra` | 200 | 36 KB br | **1,05 s** | `no-store` |
| `/collections/chaises` | 200 | 42 KB br | **1,00 s** | `no-store` |
| `/produit.html?handle=verre-a-eau-animal-farm` | 200 | 141 KB brut | 0,85 s | `public` (s-maxage consommé par l'edge) |
| `/api/products?paginated=1&limit=24` | 200 | 21 KB br | 0,27 s | `no-store` (forcé par vercel.json) |
| `/api/menu`, `/api/brands` | 200 | 1,1 / 0,7 KB | 0,20 / 0,23 s | `no-store` (forcé par vercel.json) |
| `/api/predictive?q=chaise` | 200 | 2,9 KB | **5,63 s** | `no-store` |
| `/index-catalogue/membres.json` | **000** | — | **> 60 s (timeout)** | — |
| `/styles.css` · `/shared.js` · `/mega-menu.js` | 200 | 38 / 17,7 / 5,1 KB br | 0,08–0,17 s (HIT) | `public, max-age=0, must-revalidate` |
| `/sitemap.xml` (index) · `/llms.txt` | 200 | 0,3 / 1,5 KB | 0,25 s | ok |

Composition du HTML de `/produits.html` (482 KB) : 64 cartes SSR × ≈ 3 KB = 239 KB · `<script type="application/json" id="chair-catalog-initial">` = **193 KB** · `site-data` JSON = 18 KB · 14 balises `<script>` inline · head 15,6 KB.

---

## 3. Critique détaillée

### 3.1 Monolithe serverless et double routage

- `server.js` concentre routage, rendu HTML (regex sur templates), accès Shopify, cache, index, SEO, formulaires. L'extraction de `lib/` (sept. 2026) n'a pas inversé la tendance : +789 lignes depuis juillet.
- **Aucun error-handler Express** `(err, req, res, next)` : une exception non attrapée dans une route async = réponse Vercel générique 500, sans log structuré, sans chrome.
- **Double routage** : toute route SSR doit exister dans Express ET dans `vercel.json` (`dest: /api/index.js`), sinon 404 en prod uniquement (gotcha déjà subi : canonique shop→www, #80/#81). `includeFiles` liste 24 fichiers à la main : un oubli = 500 en prod, invisible en local.
- Une seule fonction = un seul bundle (templates + `data/**` + modules) → cold start plus lourd pour un simple `/api/brands`.

### 3.2 Cache : mémoire par instance + politique HTTP incohérente

- `_cache` est un objet global **non borné** : clés par terme de recherche, curseur, filtre (`search:*`, `table-scope-v1:*`, `catalog:index:*`…). Sur une instance chaude longue, la mémoire ne fait que croître. `scopePageMemo` (200 entrées) et `searchIndexes` (12) sont bornés, pas le reste.
- `/api/revalidate` (webhook Shopify) vide le cache **d'une seule instance** ; les autres gardent la donnée périmée jusqu'au TTL. Le rate-limit a la même limite (documentée en commentaire, jamais traitée).
- **Pages listes en `no-store` par choix** (« prix/stock se renouvellent via l'index ») : chaque visite de `/produits.html`, `/collections/*`, familles, créateurs = SSR complet ⇒ 1 à 2 s de TTFB, alors que la fiche produit bénéficie de `s-maxage=600 + SWR`. Les prix sont de toute façon reconfirmés au panier (`/api/cart/preview`) : la fraîcheur à la seconde sur les listes ne protège de rien.
- `vercel.json` force `cache-control: no-store` sur **tout** `/api/(.*)` : les endpoints parfaitement cachables (menu, brands, collections, home-rails, products paginé) ratent l'edge à chaque appel.
- CSS/JS en `max-age=0, must-revalidate` sans fingerprint : revalidation (304) à chaque page ; le contournement `?v=<sha>` via `/api/build` est un bricolage que le bundling rend inutile.

### 3.3 Index catalogue construit dans la requête

- `buildIndexNow()` parcourt tout le catalogue publié (collections membres + variantes) **à l'intérieur d'un appel HTTP**. `/index-catalogue/membres.json` attend la construction complète : > 60 s observé (timeout), aucun `maxDuration` configuré.
- Les pages ont un garde-fou (`INDEX_WAIT = 4 s` puis repli « legacy »), ce qui produit **deux rendus différents de la même URL** selon la température de la fonction, et des 503 `Retry-After` quand l'index est indisponible.
- Même logique pour `/api/predictive` (5,6 s à froid) : la recherche interroge Shopify en direct au lieu d'un index déjà prêt.

### 3.4 Front : pages = mini-applications inline, pas de build

- `produits.html` : 14 `<script>` inline (916 lignes) + 889 lignes de CSS inline ; `produit.html` 677 lignes ; `selection.html` 284. Ce code n'est **ni caché par le navigateur, ni testable unitairement, ni minifié**, et il impose `script-src 'unsafe-inline'` dans la CSP (une XSS n'est donc que partiellement mitigée).
- `shared.js` (973 lignes) mélange panier, drawer, annonce, newsletter, analytics, cartes, helpers : tout est chargé partout.
- **Double payload** sur les listes : 64 cartes déjà rendues en HTML **et** le même état sérialisé en JSON (193 KB) pour l'hydratation. Le brotli masque le coût réseau (48 KB) mais pas le parse HTML + JSON côté mobile.
- Imports absolus (`/shared.js`) et modules ESM non bundlés : cascade de requêtes au chargement (shared → mega-menu → product-card → format…), pas de tree-shaking, pas de hash.

### 3.5 Configuration dupliquée (sources de vérité multiples)

| Concept | Où il vit | Problème |
|---|---|---|
| Pages SSR / hero / non-hero | `NON_HERO` + `SSR_PAGES` (server.js) + liste de pages dans `vercel.json` | 3 listes à synchroniser à la main |
| Familles riches | `FAMILLES_RICHES` (server.js) + `famille.html` + `famille-assises.html` (95 lignes de diff) + `templates/family-page.html` + `data/family-pages.json` | 3 gabarits pour 1 concept |
| Filtres catégories | `CATEGORY_FILTERS` (36 entrées hardcodées, `product_type` Shopify en dur) + `data/catalog-filter-contract.json` | règle métier en JS, non testée contre le contrat |
| Promotions | dates `startsAt/endsAt` en dur (server.js) + `data/*` + collection Shopify Promotions | un changement de dates = déploiement |
| Marques | `mega-menu-brands.json` (curé) + `/api/brands` (dynamique) + `data/brand-heroes.json` | trois notions de « marque » |
| Métadonnées pages | `<head>` recopié dans 23 pages (46 à 64 lignes chacun) | un preload/une meta à changer = 23 fichiers |

### 3.6 Qualité, tests, CI

- **Aucune CI** : rien ne tourne sur une PR ; `AGENTS.md` demande de lancer 3 fichiers de tests à la main et de « vérifier dans une preview réelle ». Avec 79 PR en 3 semaines, c'est la définition d'une régression silencieuse.
- `npm test` a été **retiré** de `package.json` sur `main` (il existait en juillet).
- Suite non hermétique : `tests/brands-index.test.cjs` démarre le vrai serveur (`require('../server').listen`) et pilote Playwright (`page.route`) ; sans navigateur installé, la suite complète pend indéfiniment (observé : > 7 min). Unitaire, intégration et e2e ne sont pas séparés.
- Pas de lint, pas de typecheck (JS pur sans JSDoc), pas de `engines.node`, Playwright en devDependency sert au scraper et au test sans distinction.

### 3.7 Repo et outillage

- 84 MB d'images (714 fichiers) **dans git**, repo sous iCloud : checkout complet > 150 s, worktrees impraticables (déjà documenté), et le checkout local est resté sur une branche de juillet.
- Fichiers de développement **servis publiquement** par `@vercel/static` : `v3/build-favicon.js`, `v3/MIKADO_IDENTITY.md`.
- Code legacy du scraper Vitra encore embarqué et exposé : `/api/vitra`, `data/vitra-chairs.json` (dans `includeFiles`), `scripts/scrape-vitra.js`, `import-to-shopify.js`, `export-to-csv.js`, `oauth-get-token.js`.
- Pages générées (journal, légal) commitées sans vérification « généré = source » ; `docs/` = 72 fichiers de prompts sans index.

### 3.8 Données et contenu

- Le contenu éditorial (bios/photos designers 345 KB, coups de cœur, bannières marques, enrichissements tables 312 KB) vit dans des JSON du repo : chaque retouche de texte passe par une PR et un déploiement, et seule une personne qui sait éditer du JSON peut la faire.
- Le contrat avec Shopify (tags, metafields, collections intelligentes) est documenté en mémoire de session et en commentaires, pas dans un fichier du repo que les agents lisent.

### 3.9 Observabilité

- `console.warn/error` uniquement ; pas de corrélation requête → appels Shopify → durée ; pas de `Server-Timing` ; pas d'alerte 5xx ; pas de health check ; pas de suivi du throttling Shopify ; pas de budget perf.

---

## 4. Plan d'amélioration

Conventions : **effort** en jours d'implémentation (agent ou dev), **critère** = ce qui doit être vrai pour clore l'action. Chaque action = une PR courte, Preview puis validation, jamais de merge direct sur `main` (règle existante).

### Phase 0 — Filet de sécurité (semaine 1 · ≈ 3 j) — *à faire avant tout refactor*

| # | Action | Détail | Critère |
|---|---|---|---|
| 0.1 | **CI GitHub Actions** | `.github/workflows/ci.yml` : Node 22, `npm ci`, `npm test`, `npm run lint` ; protection de branche `main` = CI verte obligatoire. | Toute PR affiche un statut ; merge bloqué si rouge. |
| 0.2 | **Rétablir `npm test` et scinder la suite** | `package.json` : `"test": "node --test --test-timeout=15000 'tests/unit/**/*.test.{cjs,mjs}' 'tests/integration/**/*.test.{cjs,mjs}'"`, `"test:e2e": "playwright test"` (hors CI par défaut). Déplacer `brands-index` et tout test qui pilote un navigateur dans `tests/e2e/`. Ajouter `"engines": { "node": ">=22" }`. | `npm test` termine en < 60 s sur une machine sans navigateur. |
| 0.3 | **Smoke test prod/preview** | `scripts/smoke.mjs` : 12 URLs (accueil, catalogue, 2 collections, 1 famille, 1 créateur, 1 PDP, sitemap, llms, 404, 2 API) → code, TTFB, présence `<h1>`, JSON-LD, chrome SSR. Déclenché par workflow `deployment_status` et à la main. | Rapport en commentaire de PR ; échec = alerte. |
| 0.4 | **Hygiène du déployé** | Déplacer `v3/build-favicon.js` → `scripts/`, `v3/MIKADO_IDENTITY.md` → `docs/`. Supprimer `/api/vitra`, `data/vitra-chairs.json`, `scripts/scrape-vitra.js`, `import-to-shopify.js`, `export-to-csv.js`, `oauth-get-token.js`, scripts npm associés, `data/vitra*` de `includeFiles`. | `curl /build-favicon.js` = 404 ; bundle fonction allégé ; `grep -r vitra` = 0 hors journal. |
| 0.5 | **Error-handler global + limites de fonction** | `app.use((err, req, res, next) => …)` : log JSON, 500 HTML avec chrome (ou JSON sur `/api/*`). `vercel.json` : `"functions": { "api/index.js": { "maxDuration": 30, "memory": 1024 } }` (selon plan Vercel). | Une exception volontaire en Preview rend une page 500 propre et un log. |
| 0.6 | **Poste de travail** | Cloner hors iCloud (`~/dev/mikadodeco`), `git checkout main`, garder iCloud pour `docs/` uniquement. | `git status` < 2 s ; `git worktree add` < 10 s. |

### Phase 1 — Démonolithiser et unifier la configuration (semaines 2–3 · ≈ 6 j)

| # | Action | Détail | Critère |
|---|---|---|---|
| 1.1 | **Découper `server.js` en routeurs** (déplacements purs, sans changement de comportement) | `app.js` (middlewares, montage, error-handler) · `routes/pages.js` (chrome SSR pages statiques, 404) · `routes/catalog.js` (produits.html, collections, familles, créateurs, scope, index-catalogue) · `routes/product.js` (produit.html, `/products/:handle`, `/api/product`) · `routes/search.js` · `routes/cart.js` · `routes/forms.js` (contact, newsletter + OAuth) · `routes/seo.js` (sitemaps, robots, llms) · `routes/admin.js` (revalidate, build, health). `server.js` ne fait plus que `require('./app').listen`. Revue avec `git diff --color-moved`. | `server.js` ≤ 150 lignes ; aucune requête GraphQL hors `lib/shopify/queries.js` ; smoke 0.3 identique avant/après. |
| 1.2 | **Manifeste de pages → fin du double routage** | `data/pages.manifest.json` : `{ path, template, hero, ssr, includeInSitemap }`. Il remplace `NON_HERO`, `SSR_PAGES`, `FAMILLES_RICHES` et la liste de pages de `vercel.json`. `scripts/build-vercel-config.mjs` génère la section `routes` + `includeFiles` de `vercel.json` ; `tests/unit/vercel-routes.test.cjs` échoue si une route Express SSR n'a pas sa règle Vercel. | Ajouter une page = 1 ligne de manifeste ; test rouge si `vercel.json` n'est pas régénéré. |
| 1.3 | **Service de cache unique** | `lib/cache.js` : LRU borné (500 entrées), TTL, **tags** (`products`, `collections`, `menu`, `index`), `revalidate(tags)`, compteurs hit/miss. Remplace `_cache`, `scopePageMemo`, `searchIndexes`, caches ad hoc. | `grep -n "_cache\[" lib routes` = 0 ; mémoire d'une instance plafonnée. |
| 1.4 | **Une source par règle métier** | `CATEGORY_FILTERS` fusionné dans `data/catalog-filter-contract.json` (test de cohérence avec les `product_type` réels via fixture) ; dates promo → `data/promotions.json` ; marques : `mega-menu-brands.json` ne garde que la curation (ordre, mise en avant), les faits viennent de `/api/brands`. | Aucune constante métier (`product_type`, date, handle) littérale dans `routes/` ou `lib/` hors lecture de `data/`. |
| 1.5 | **Logs structurés + Server-Timing** | `lib/log.js` (JSON une ligne : route, status, ms, `shopifyCalls`, `shopifyMs`, cache hit/miss, `requestId`). Header `Server-Timing: shopify;dur=…, render;dur=…` sur les réponses HTML. | Chaque réponse porte `Server-Timing` ; logs Vercel filtrables par route. |

### Phase 2 — Cache et temps de réponse (semaines 3–5 · ≈ 5 j)

| # | Action | Détail | Critère |
|---|---|---|---|
| 2.1 | **Listes cachables à l'edge** | `/produits.html`, `/collections/*`, familles, créateurs : `Cache-Control: public, s-maxage=120, stale-while-revalidate=86400` (page 1 non filtrée) ; `s-maxage=60` pour les pages filtrées indexables ; `no-store` seulement sur `?q=` et états d'erreur. Justification : le prix et le stock sont reconfirmés par `/api/cart/preview` avant tout achat. | p75 TTFB listes < 400 ms (edge HIT) ; smoke 0.3 mesure et compare. |
| 2.2 | **Retirer le `no-store` global `/api/(.*)` de `vercel.json`** | Chaque endpoint pose son propre header : `s-maxage=300 + SWR` pour menu/brands/collections/products paginé/home-rails ; `no-store` explicite pour cart/*, contact, newsletter, revalidate, build. | `curl -I /api/menu` deuxième hit = `x-vercel-cache: HIT`. |
| 2.3 | **Index catalogue hors requête** | `vercel.json` `"crons": [{ "path": "/api/cron/catalog-index", "schedule": "*/15 * * * *" }]` (protégé par `CRON_SECRET`) → construit l'index et l'écrit dans **Vercel Blob** (ou KV) ; les fonctions lisent le Blob (1 fetch ≈ 200 ms) ; `/index-catalogue/*.json` sert le Blob. Suppression de `INDEX_WAIT`, `INDEX_RETRY`, du repli « legacy » et du 503 `Retry-After`. Webhook Shopify `products/update` → déclenche une reconstruction anticipée. | `/index-catalogue/membres.json` < 1 s à froid ; une URL de liste rend **le même HTML** à froid et à chaud. |
| 2.4 | **Recherche prédictive sur l'index** | `/api/predictive` répond depuis l'index Blob (marques/catégories/produits) ; Shopify `predictiveSearch` seulement en complément asynchrone ou en repli borné à 1,5 s. | p95 `/api/predictive` < 300 ms. |
| 2.5 | **Rate-limit partagé (si abus constaté)** | `rate-limit-redis` + Upstash (gratuit) sur contact/newsletter/cart. Sinon documenter la limite actuelle dans `docs/`. | Décision tracée (ADR). |

### Phase 3 — Front : build, extraction du code inline, CSP (semaines 5–8 · ≈ 8 j)

| # | Action | Détail | Critère |
|---|---|---|---|
| 3.1 | **Bundler minimal (esbuild)** | `src/pages/{home,catalog,product,selection,designers,family,search,nuancier}.js` + `src/shell.js` → `v3/dist/[name].[hash].js|css` + `dist/manifest.json`. Le SSR injecte les URLs (`injectAssets(html, page)`). `Cache-Control: public, max-age=31536000, immutable` sur `/dist/*`. Suppression de `?v=<sha>` et de `/api/build`. `npm run build` dans CI et dans le build Vercel. | Zéro 304 d'assets en navigation ; un déploiement ne casse jamais le cache navigateur. |
| 3.2 | **Extraire les scripts et styles inline** | `produits.html` (14 `<script>`, 916 l. + 889 l. CSS) → `src/pages/catalog.js` + `catalog.css` ; `produit.html` (677 l.) → `product.js` ; `selection.html` (284 l.) → `selection.js` ; `designers.html` (151 l.) → `designers.js`. Seuls restent inline les gardes anti-flash (< 10 lignes), avec nonce. | `awk` « lignes JS inline » < 15 par page ; tests unitaires possibles sur `catalog.js`. |
| 3.3 | **CSP sans `'unsafe-inline'` pour les scripts** | Nonce par requête généré dans `injectChrome`, posé sur les scripts inline restants ; `script-src 'self' 'nonce-…'`. (`application/json` et `ld+json` ne sont pas exécutés : non concernés.) Garder `style-src 'unsafe-inline'` tant que des attributs `style=` existent, puis viser le retrait. | En-tête CSP sans `'unsafe-inline'` dans `script-src` ; 0 erreur console CSP sur les 12 URLs du smoke. |
| 3.4 | **Scinder `shared.js`** | `src/cart/*.js`, `src/chrome/*.js` (drawer, annonce, nav active), `src/newsletter.js`, `src/analytics.js` ; `format.mjs`, `product-card.mjs`, `chrome-template.js` restent isomorphes et deviennent des entrées partagées du bundle. `initShell` orchestre. | Accueil : JS initial < 25 KB br ; `shared.js` supprimé (0 résidu). |
| 3.5 | **Hydratation sans double payload** | Ne plus sérialiser `chair-catalog-initial` complet (193 KB) : embarquer `{ state, facets, pageInfo }` (≈ 10 KB) ; les cartes SSR portent les `data-*` nécessaires (variantId, prix, stock) ; la page suivante vient de `/api/catalog/:handle`. | HTML `/produits.html` < 150 KB brut / < 25 KB br ; INP mobile < 200 ms. |
| 3.6 | **Budget perf en CI** | Lighthouse CI sur l'URL Preview (perf ≥ 90 desktop, ≥ 75 mobile, CLS < 0,1, HTML listes < 150 KB). Avertissement 2 semaines, puis bloquant. | Rapport Lighthouse en commentaire de PR. |

### Phase 4 — Gabarits et données (semaines 8–10 · ≈ 5 j)

| # | Action | Détail | Critère |
|---|---|---|---|
| 4.1 | **Layout unique** | `templates/layout.html` (head commun : meta, preloads, fonts, nonce, conteneurs chrome) + `templates/pages/*.html` (contenu seul) ; `renderPage(page, data)` remplace les regex sur fichiers complets. Fusion `famille.html` + `famille-assises.html` + `templates/family-page.html` → 1 gabarit piloté par `data/family-pages.json`. | 1 seul `<head>` dans le repo ; 1 gabarit famille ; diff visuel nul (captures Preview). |
| 4.2 | **Pages générées = étape de build** | `npm run build:content` (journal + légal) exécuté dans CI avec test « sortie == commit » (ou rendu à la demande via le layout, et plus de HTML généré commité). | Un article modifié sans régénération fait échouer la CI. |
| 4.3 | **Contrat de données écrit** | `docs/DATA-CONTRACT.md` : Shopify = produits, variantes, prix, stock, collections, metafields, promotions, tags (reprendre le contrat tags existant) ; `data/` = règles de présentation (familles, filtres, héros, curation) ; contenu éditorial (bios/photos designers, coup de cœur, bannières marques) → **metaobjects Shopify** lus par Storefront API, avec `scripts/migrate-designers-to-metaobjects.mjs`. Test : aucune donnée produit (prix, handle, stock) en dur dans le code. | `designers-data.json` supprimé du repo ; une bio se change sans déploiement. |
| 4.4 | **Images hors git** | `v3/images` (84 MB) → Vercel Blob ou Shopify Files (CDN + `?width=` natif) ; a minima Git LFS. `scripts/optimize-images.js` devient pipeline d'upload. | Repo < 20 MB ; `git clone` < 30 s ; worktrees à nouveau utilisables. |

### Phase 5 — Observabilité et gouvernance (continu · ≈ 2 j de mise en place)

| # | Action | Détail | Critère |
|---|---|---|---|
| 5.1 | **Log drain + alertes** | Vercel Log Drain → Axiom ou Better Stack (gratuits) ; alertes : 5xx > 1 % / 15 min, p95 TTFB > 1,5 s, erreurs `THROTTLED` Shopify. | Une alerte de test reçue par e-mail. |
| 5.2 | **Health check** | `/api/health` : version (sha), âge de l'index, ping Shopify, taille du cache ; moniteur externe (UptimeRobot) toutes les 5 min. | Page d'état lisible ; alerte si down > 2 min. |
| 5.3 | **ADR et AGENTS.md** | `docs/adr/0001-cache-listes.md`, `0002-index-blob.md`, `0003-bundler.md`… (10 lignes chacun : contexte, décision, conséquences). `AGENTS.md` pointe vers `npm test` + CI au lieu de commandes manuelles ; index de `docs/`. | Chaque décision structurante a son ADR ; `docs/README.md` liste les documents vivants. |
| 5.4 | **Dépendances** | Dependabot/Renovate ; Express 4 → 5 (erreurs async natives : supprime les `try/catch` répétés) ; `engines.node` 22. | CI verte après migration ; 0 `try/catch` purement de relais dans `routes/`. |

### Récapitulatif effort / valeur

| Phase | Semaines | Effort | Gain principal |
|---|---|---|---|
| 0 Filet | 1 | 3 j | Fin des régressions silencieuses ; prod observable |
| 1 Découpage + manifeste | 2–3 | 6 j | Code navigable ; fin du double routage ; cache borné |
| 2 Cache + index | 3–5 | 5 j | Listes 2 s → < 0,4 s ; fin des timeouts ; HTML stable |
| 3 Front build | 5–8 | 8 j | CSP durcie ; assets immuables ; payload −60 % ; code testable |
| 4 Gabarits + données | 8–10 | 5 j | 1 layout, 1 gabarit famille ; contenu éditable sans déploiement ; repo léger |
| 5 Observabilité | continu | 2 j | Alertes, ADR, dépendances suivies |
| **Total** | **≈ 10 semaines** | **≈ 29 j** | |

---

## 5. Risques et manière de les tenir

- **Vélocité (79 PR / 3 semaines) vs refactor** : les phases 1 et 3 sont des déplacements mécaniques → PR « move only » courtes (1 routeur ou 1 page par PR), revue `--color-moved`, fenêtre de gel de 48 h sur `server.js` pour la PR 1.1. Le smoke 0.3 est la ceinture.
- **Cache des listes et fraîcheur des prix** : `s-maxage=120` = au pire 2 min de prix affiché périmé, reconfirmé au panier ; une remise Shopify flippée est visible en < 2 min (précédent : désync de septembre). Documenter dans l'ADR 0001.
- **Index dans Blob** : dépendance Vercel supplémentaire ; alternative = KV/Upstash ; dans les deux cas le format JSON actuel (`packIndex/unpackIndex`) est conservé.
- **Bundler et DA** : esbuild ne touche pas au CSS existant (il le copie et le hashe) ; aucun changement visuel attendu ; vérification par captures Preview desktop (règle existante : validation bureau).
- **Metaobjects Shopify** : nécessite l'importateur (périmètre Shopify = hors code du site) ; prévoir le brief écrit comme pour les metafields.

## 6. Option B — changer de framework (à décider après la phase 2, pas avant)

Candidat naturel : **Astro** (SSR hybride + îlots, adaptateur Vercel). Ce que ça achète : routage par fichiers (plus de `vercel.json` double), build/hash/CSS scoping natifs, zéro JS par défaut, streaming, service d'images. Ce que ça coûte : 4 à 6 semaines, réécriture des 23 pages et du rendu par regex, ré-apprentissage des agents, risque sur la DA. Verdict : **non** tant que les phases 0 → 3 ne sont pas faites ; elles sont indispensables dans les deux scénarios (tests, CI, découpage, extraction du code inline, index hors requête) et rendent la migration deux fois moins chère si elle est décidée.

## 7. Ce qu'on ne touche pas

- La DA, le chrome, les composants isomorphes (`product-card.mjs`, `chrome-template.js`) : ils sont justement la partie saine.
- Les données Shopify (produits, collections intelligentes, metafields) : périmètre de l'importateur ; les besoins passent par un brief écrit.
- Les remises de l'opération en cours.

## 8. Premières 48 heures (ordre conseillé)

1. Cloner hors iCloud, `git checkout main` (0.6).
2. PR « CI + npm test + split unit/e2e » (0.1, 0.2).
3. PR « smoke.mjs » (0.3).
4. PR « hygiène : legacy Vitra + fichiers dev hors de v3 » (0.4).
5. PR « error-handler + maxDuration » (0.5).
6. PR « vercel.json : plus de no-store global sur /api » (2.2, isolable, gain immédiat).
