# Audit de propreté du code du site — 20 octobre 2026

Demande de Cyril : « un audit complet de tout le code du site, que le tout soit clair, qu'il n'y ait pas d'erreurs, pas de reliquats, que le site soit propre ».

Dépôt audité : `cyrildaoust-source/mikadodecov2`, branche `main` au commit `b710b9d` (après le retrait du journal, le retrait de « Mikado Deco » des marques et les accès au nuancier Fermob). Lecture seule : aucun fichier modifié par l'audit lui-même ; les corrections suivent par PR, lot par lot (§ 7).

## 0. En bref

| | |
|---|---|
| Fichiers suivis | 1 757, dont 1 396 images (164 Mo sur 179 Mo) |
| Code lu intégralement | serveur (62 fichiers, 7 787 lignes), front (77 fichiers, ≈ 20 000 lignes), données/docs/scripts/CI (tout sauf la table de redirections de l'importateur) |
| Contrôles automatiques | syntaxe 171 JS + 27 JSON sans erreur · build propre · tests 338/338 · état de santé prod OK · 240 liens internes vérifiés, 0 cassé · 19 pages clés chargées au navigateur (bureau + téléphone) : aucune erreur console hors logos manquants |
| Constats retenus (après contre-vérification) | **22 erreurs**, ≈ 55 reliquats, ≈ 40 doublons, ≈ 30 incohérences, ≈ 15 docs périmées, 76 images orphelines + 50 sources jamais servies |
| Volume nettoyable sans changer le site | ≈ 520 lignes de JS mort ou saisonnier terminé, ≈ 180 lignes de CSS sans usage, ≈ 37 Mo d'images déployées pour rien, 27 exports serveur jamais importés |

Le site fonctionne ; aucune erreur ne casse une page. Les erreurs réelles sont des choses invisibles tant qu'on ne tombe pas dessus : un menu sans tiroir sur tablette, un cache qui ne se vide pas, une page absente du sitemap, deux rails à trois cartes au lieu de quatre.

## 1. Erreurs confirmées (toutes vérifiées en lisant le code ou en prod)

### Visibles par un visiteur

| # | Où | Quoi | Correction | Risque |
|---|---|---|---|---|
| V1 | `v3/styles.css:222` ↔ `v3/mega-menu.css:36-40` | Entre 921 et 1 023 px de large (tablette en paysage, petit portable), le bouton « Menu » s'affiche mais le tiroir reste `display:none` : le clic n'ouvre rien. Reproduit en prod à 960 px. | Aligner le seuil sur 1 024 px (ou retirer la règle : le tiroir est déjà hors écran par `transform`). | À tester visuellement |
| V2 | `v3/shell.mjs:110` ↔ `v3/index.html:29` | L'accueil est envoyé par le serveur avec un en-tête transparent sur la photo, puis le script le force opaque dès le chargement parce qu'il ne reconnaît pas `.home-hero`. Bascule au chargement, et accueil seule page à photo avec menu opaque. Reproduit en prod à 1 400 px. | **Décision de Cyril** : transparent comme les autres pages à photo (ajouter `.home-hero` au sélecteur) ou opaque assumé (manifeste `hero:false`, plus de bascule). | Visuel |
| V3 | `data/seating-icons.json:5`, `data/family-pages.json` (tables) | `chaise-ch24-wishbone` et `table-ch006` sont des fiches Carl Hansen, marque retirée le 10 octobre : les rails « Les chaises iconiques » (Assises) et « Notre sélection de tables » affichent 3 cartes au lieu de 4. | **Décision de Cyril** : les deux remplaçantes. | Nul |
| V4 | `v3/images/brands/` | Quatre marques actives sans logo : Hartô (43 fiches), Remember (68), Linie Design (10), Normann Copenhagen (6). La page Marques affiche leur nom en secours mais demande quatre fichiers absents (404) à chaque visite. Le logo Remember existe, mal nommé et mal rangé : `logosvg/remeber.svg`. | Renommer/déplacer Remember ; fournir les trois autres logos (Cyril ou site officiel) ; en attendant, ne pas demander un fichier qui n'existe pas. | Faible |
| V5 | `routes/seo.js:47-59` | `/collections/idees-cadeaux`, liée toute l'année dans le menu, n'est dans aucun sitemap. | L'ajouter aux pages du sitemap (priorité 0,7). | Nul |
| V6 | `v3/index.html:11`, `v3/llms.txt:44` | Raison sociale « Mikado Deco SRL » dans les données structurées et la page pour les IA ; le pied de page et les pages légales disent « MIKADO M-O-A SRL » (BCE). | Aligner sur les pages légales. | Nul |

### Invisibles mais réelles (serveur et front)

| # | Où | Quoi | Correction | Risque |
|---|---|---|---|---|
| S1 | `routes/api.js:240-246` | `/api/revalidate` (webhook Shopify) vide la clé `brands` que plus personne ne pose ; la vraie clé `brands:active` (30 min), les fiches `product:<handle>`, `home-rails-v1`, `collection:*`, `sitemap:products` (6 h) ne sont jamais vidées. Après une mise à jour Shopify, fiches, marques et sitemap restent périmés jusqu'à expiration. | Vider tout le cache (`cache.clear()` + recherche) et le prouver par un test. | Faible |
| S2 | `lib/render/pages.js:36-39` ↔ `routes/pages.js:80` | Les modules de la fiche produit (`pdp-view`, `product-specs`) sont importés sans jamais être attendus : la première fiche après un démarrage à froid peut partir dégradée (squelette, sans accordéon) et rester 10 min en cache à l'edge. | Exporter `pdpReady` et l'attendre avec `chromeReady`/`navigationReady`. | Nul |
| S3 | `routes/pages.js:186` | Une erreur de rendu sur Assises ou Jardin est avalée sans trace, et la page de secours est servie en 200 cachable 10 min. | Journaliser (`console.warn`) et répondre `no-store` dans ce chemin. | Nul |
| S4 | `lib/config.js:49-51` | La configuration lit `campaigns.promotions[0]` sans garde : le jour où la campagne Vitra (fin 01/02/2027) sera retirée du fichier, le serveur ne démarre plus. | Garde sur la liste vide. | Nul |
| S5 | `routes/cart.js:137-138` | `/api/cart/delivery` répond 400 (« faute client ») pour toute erreur, panne Shopify comprise. | `err.status || 503`. | Nul |
| S6 | `lib/shopify/queries.js:407` | L'aperçu du panier ne lit que 50 lignes alors que Shopify scinde les lignes « 5+1 » : au-delà, les remises des dernières lignes manquent. | `first: 100`. | Nul |
| F1 | `v3/main.js:27` | Le repli des rails de l'accueil (`/api/home-rails`) ne s'exécute jamais : les squelettes portent déjà la classe `.pcard`. Si le rendu serveur échoue, les squelettes restent à l'écran. | Tester la présence d'un bouton d'ajout. | Faible |
| F2 | `v3/pages/produits.js:29` vs `:112` | `await loadNavigation()` avant `initShell` : si un JSON de navigation échoue, plus de tiroir, de panier ni de recherche sur le catalogue, sans message. | Appeler `initShell` d'abord, ou `catch` avec repli. | Faible |
| F3 | `v3/pages/produit.js:163-189` | Bloc des vignettes `[data-thumb]` : aucun gabarit ne les rend (la fiche utilise `data-rail-img`/`data-amb`). Code mort + CSS `.pdp__thumbs`. | Supprimer. | Nul |
| F4 | `v3/main.js:52-85`, `v3/shell.mjs:164` | Bandeau défilant des marques `[data-brandmarquee]` : absent de toute page. Code mort, repli mort, 22 lignes de CSS mortes, six imports qui ne servent plus qu'à ça. | Supprimer. | Nul |
| F5 | `v3/nuancier-fermob.css:300` | `main.page > h1:first-child` ne correspond jamais (le premier enfant est le fil d'Ariane) : la marge voulue n'est jamais appliquée. | Cibler `.page > h1`. | Faible |
| F6 | `v3/pages/produit.js:5,10,12,55,67-68`, `v3/pages/produits.js:5`, `v3/nuancier-fermob.js:14` | Import en double de `format.mjs`, imports jamais utilisés (`fetchCollections`, `euro`, `fetchProducts`, `escapeHtml`), variables jamais lues. | Nettoyer. | Nul |
| F7 | `v3/pages/famille.js:93-94`, `famille-assises.js:88-89`, `chair-catalog.js:51,75` | `renderPag()` appelé deux fois dans le `catch` ; `typeof updateFab === 'function'` toujours vrai. | Simplifier. | Nul |
| F8 | `v3/pdp-view.mjs:125` vs `v3/product-card.mjs:101` | Repli de délai « 3-4 semaines » (trait d'union) d'un côté, « 3–4 semaines » (demi-cadratin) de l'autre. | Un seul repli dans `format.mjs`. | Nul |
| F9 | `v3/mega-menu.js:114,258` | Repli de libellé « Lire l'article » (journal retiré). Jamais atteint. | « Découvrir ». | Nul |

## 2. Reliquats (code qui ne sert plus)

### Saisonnier terminé

- **Soldes d'été 2026** (4 au 31 juillet) : `v3/sale.mjs`, spans `data-sale` et dates dupliquées dans `v3/chrome-template.js:23-29,134-139`, accroches dans `shell.mjs`, `cart-drawer.mjs`, `pages/selection.js`, `selection.html`, `catalog-data.mjs`, `pages/produit.js`, ≈ 25 lignes de CSS (`hero__salecta`, `sale-hd-on`…) jamais présentes dans l'accueil actuel. ≈ 60 lignes de JS dormantes depuis trois mois. **Décision de Cyril** : retirer (la mécanique « −5 % dès 300 € » reste dans l'historique git et l'ADR) ou garder dormant pour l'été 2027.
- **Offre cadeau « Mois Panton »** (septembre) : `v3/gift-rules.mjs` (`enabled: false`), `v3/gift-offer.mjs` (221 lignes), CSS `.gifto*`, accroches dans `cart.mjs`, `cart-drawer.mjs`, `pages/selection.js`, `selection.html`, `catalog-data.mjs`, `pages/produit.js` ; côté serveur `routes/cart.js:38-44,156` calcule encore l'éligibilité par ligne et accepte `item.gift` (commentaire citant un code « WELCOME10 » qui n'existe pas). ≈ 260 lignes. **Décision de Cyril** : retirer ou garder dormant (le filtre `gift` touche le panier : à tester).
- **Collections promo passées dans la navigation** (`v3/navigation-data.json`) : `promo-4eme-chaise-offerte`, `promo-chaises-hay/fermob/vitra/tradition/fatboy`, `mobilier-exterieur` (promo été), plus `claude-modifs-2026-05-16` (collection de travail, déjà bloquée par le serveur), deux doublons `serax-wind-fire-1/-2`, `serviettes-ete` libellée « Serviettes Reste ». Côté serveur, `lib/filter-scopes.js:139` garde un cas particulier `/^promo/` pour ces collections. `panton-cubes` et `noel` à confirmer avec l'importateur.
- `vercel.json:35-36` : redirection propre à la campagne Vitra (à retirer après le 01/02/2027, à noter dans `campaigns.json`).

### Code mort

- Serveur : `getBrands()` (`lib/services/catalog.js:164-194`, jamais appelée) et son `cache.del('brands')` ; `fs`, `path`, `V3_DIR` importés sans usage (`routes/seo.js`) ; `/api/search` (`routes/api.js:22-27`) sans aucun appelant ni test ; `lineDiscounts` « legacy » dans la réponse panier, lu par personne ; `adminClient` (`lib/newsletter.js:78`) et `ON_ORDER` (`lib/delivery-estimate.js:5`) « gardés pour les appelants » sans appelant ; 27 exports jamais importés (`OWN_VENDORS`, `DIRECTIVES`, `SHOPIFY_STORE`, `fragmentPath`, `OG_DEFAULT_IMAGE`, `bandHref`, `FILTER_FIELDS`, `MEMBERS_QUERY`, `AXES`, `STATES`, `isGiftIdea`, `subscribeInShopify`, `matchingVariants`, `arrival`, `PROMO_TAGS`, `searchURL`, `dimensionFacts`, `CACHE_MAX_AGE`, `DEFAULT_TTL`, `isFolding`, `foldingMismatch`, `adminClients`, `TAGS`, `GIFTS`, `PROMOTIONS`…) ; gardes impossibles dans `routes/pages.js:485-494` (anti-traversée et `id="site-header"` depuis le layout unique) ; clause `/article inconnu/` (`routes/pages.js:491`) du journal ; `if (links)` toujours vrai (`lib/render/chrome.js:62-68`) ; entrées identité dans `lib/search-intent.js:36`.
- Front : exports `currentViewFrom`, `chairURL`, `emptyChairs`, `buildProductSpecRows` (seulement un test) ; `v3/mega-menu-designers.json` (0 référence, embarqué dans la fonction Vercel) ; `mega-menu-config.json` champ `designers.aLaUne` jamais lu ; `mega-menu-brands.json` champ `collections` (≈ 200 lignes) jamais lu ; `nuancier-fermob.data.json` champs `order`/`admin_value` jamais lus ; classe `reveal` posée sur 24 éléments sans aucune règle CSS ; 8 `style="display:none"` alors que `hidden` existe ; scripts inline de canonique « client » (`produit.html:3-12`, `produits.html:42-69`) qui réécrivent la valeur déjà posée par le serveur.
- CSS sans aucune référence (≈ 123 lignes dans `styles.css` : anciens `hero`, `catscroll`, `room`, `ugc`, `brandmarquee`, `lookbook`, `searchd`, `sel-opt`, `pdp__thumbs/back/ship/note/meta`, `gifto__link`… ; 47 lignes dans `mega-menu.css` : `.mm-brand__colls`, `.drawer__visual`, `.drawer__foot-*`) ; `produits.css:55-67` dupliqué de `styles.css` ; 9 règles `.x[hidden]{display:none}` inutiles depuis la règle globale.
- Images (§ 6) : 76 fichiers orphelins (15,1 Mo), 13 sources citées seulement par le script d'optimisation (5,6 Mo), 37 sources de bandeaux de marque jamais servies (16,8 Mo), 5 logos SVG jamais demandés (le PNG est servi), dossier `logosvg/` (4 SVG mal nommés), `headers/kriptonite*` (2 Mo, marque absente), 5 paires de doublons binaires chez les créateurs, 2 `.gitkeep` dans des dossiers pleins.
- Scripts : 6 outils ponctuels jamais câblés (`audit-loading.mjs`, `audit-product-recommendations.mjs`, `audit-storefront-recommendations.mjs`, `audit-search-data.cjs`, `prepare-search-enrichment.cjs`, `build-favicon.js`) ; jobs d'`optimize-images.js` pour des images que plus aucune page ne sert ; lot d'enrichissement `data/catalog-enrichment/*` (312 Ko) publié dans Shopify le 21/09, lu seulement en mode Preview.

### Commentaires périmés (sans effet, mais trompeurs)

`lib/services/catalog.js` (une dizaine de blocs décrivant du code parti ailleurs), `lib/services/catalog-scope.js:16-27`, `lib/config.js:20-22`, `routes/seo.js:24,46`, `api/index.js:3-4`, `lib/render/pages.js:120-121`, `lib/http-errors.js:3-7`, `routes/api.js:57-63` (liste de consommateurs fausse), `routes/forms.js:25` (« nodemailer later »), `v3/styles.css:1,749,1069,1139`, `v3/rendez-vous.html:81`, `v3/pages/produits.js:116`, `v3/analytics.mjs:4-5`, `v3/mega-menu.js:2-6`, `v3/mega-menu.css:228`, `v3/index.html` (numérotation 6 → 8), `scripts/optimize-images.js:66-67`, `.github/workflows/warm-cache.yml:10-12`, `docs/legal/.gitignore:2`.

## 3. Doublons

- **Échappement HTML en 15 exemplaires** : 9 côté serveur (`og.js`, `layout.js`, `legal.js` ×2, `catalog-landing.js`, `editorial-media.js`, `family-pages.js`, `chair-catalog-page.js`, `routes/seo.js`, `routes/forms.js` inline) + 6 côté front (`format.mjs` canonique, `product-finishes.mjs`, `catalog-filters-view.mjs`, `newsletter-popup.mjs`, `navigation.mjs`, `search-view.mjs`) + 12 copies de `JSON.stringify(x).replace(/</g,'\\u003c')`. → un `lib/html.js` serveur et `format.mjs` côté front.
- **Normalisation / slug** : `catalog-filters.js`, `collection-brand.js`, `search-intent.js`, `product-recommendations.js`, `legal.js`, `lead-time.js`, `v3/format.mjs`, `v3/navigation.mjs` (NFD + ø/æ identiques). → une seule paire, avec test d'équivalence (les slugs de marque sont dans les URL).
- **Redimensionnement CDN Shopify** en 4 versions (dont une qui peut doubler un `width=` déjà présent).
- **Fragment GraphQL `ProductCardFields`** recopié champ par champ dans `COLLECTION_PRODUCTS_QUERY` alors que `catalog-scope.js` promet une « source unique ».
- **Pagination rendue cinq fois** (`pages/produits.js`, `famille.js`, `famille-assises.js`, `catalog-filters-view.mjs`, `search-view.mjs`) ; `famille.js` ≡ `famille-assises.js` à deux lignes près (72 lignes).
- **Piège de focus ×6**, **verrou de défilement ×3**, **regex e-mail ×6** (serveur + front), `pieces()` ×3, même regex d'insertion avant la grille ×3, `absUrl` ×2, titres/héros Assises-Jardin en 4 endroits, `EXTRA_FAMILIES` copie de la navigation, `mega-menu-brands.json` chargé 6 fois (2 `readFileSync` + 4 `require`), coquille vide de campagne construite deux fois, deux mécanismes pour le `<head>` (`renderPage` overrides et `renderWithOg` après coup), logique Assises/tables/icônes dupliquée entre `routes/pages.js` et `lib/render/pages.js`.
- **HTML** : `trust-list` identique dans `selection.html` et `pdp-view.mjs` ; JSON-LD FurnitureStore dans `index.html` et `contact.html` ; trois bandeaux CTA au même style inline (`studio`, `materiaux`, `nuancier`) ; squelette de carte copié 4 fois.
- **CSS** : 13 blocs `@media (max-width: 760px)` dispersés, 12 blocs `prefers-reduced-motion`, sélecteurs redéclarés 3 à 4 fois (`.catalog-filters__groups`, `.pdp`, `.pdp__info`, `.footer__grid`…), `.searchd__chip` ≡ `.sr__chip`.
- **Tests** : 21 fichiers répètent le même harnais serveur (variables Shopify, stub `fetch`, `listen(0)`) ; `brands-index.test.cjs` et sa version e2e ont le même `before()` à la ligne près. → `tests/_server.cjs`.
- **Docs** : la règle du métachamp `custom.lead_time` collée mot pour mot dans `delivery-policy.md` et `DATA-CONTRACT.md` ; la liste des mots de tags cadeaux répétée 4 fois ; `docs/ARCHITECTURE.md` décrit une architecture fausse à côté d'AGENTS.md (qui est juste).

## 4. Incohérences

- **Charte « coins carrés, aucun élément rond »** (DESIGN.md) : chips de recherche `border-radius: 22px` (`styles.css:689,730`, mesuré en prod), `.sr__row` 6 px, `.pcard__sale` 2 px, `.cartcount` 8 px ; pastilles rondes `.pcard__dot`, `.catalog-filters__swatch`, `.mikado-pin__ring`. **Décision de Cyril** pour les pastilles d'état et les échantillons de couleur (ronds par nature ?).
- **Couleurs hors palette** : `#b23b3b` (rouge promo/erreur, alors que `--danger` existe), `#b7ae9f`, `#f7f4ee`, `#fff` ×9, `#000` ×5, `#f5c451`. → tokens.
- **Vocabulaire panier / sélection mêlé** : « Ma sélection », « Mon panier », « + Ajouter à la sélection » (cartes) contre « Ajouter au panier » (fiche), « Finaliser la sélection ». **Décision de Cyril** : un seul mot.
- **Règles d'AGENTS.md non respectées** : « jamais de `· Mikado Deco` concaténé » (7 endroits), « toute requête GraphQL dans `lib/shopify/queries.js` » (5 requêtes ailleurs, dont une construite par remplacement de texte), « au-delà de 20 lignes, un script inline va dans `v3/pages/` » (4 scripts de 26 à 38 lignes).
- **Langue** : messages d'erreur anglais (`'Unknown family'`, `'Invalid table cursor'`…) qui finissent dans les journaux JSON, commentaires anglais dans une dizaine de modules, un seul doc en anglais (`MIKADO_IDENTITY.md`) ; nommage de fichiers `.js`/`.mjs` sans règle écrite ; trois entrées de page hors `v3/pages/`.
- **Gestion d'erreur différente d'une route à l'autre** : 500, 503, 200 `{ok:false}`, 400, corps vide sans `no-store`. → un helper « amont indisponible » (503 + `Retry-After` + `no-store`).
- **Hauteurs de chrome en dur** (104, 116, 130, 140, 145, 160 px) alors que `--nav-h` existe et que le catalogue mesure la vraie hauteur.
- **Fragilités** : ≈ 40 remplacements HTML par regex qui dépendent des gabarits au caractère près et échouent en silence (une seule ancre est vérifiée) ; une requête de recherche fabriquée en remplaçant du texte dans une autre requête ; identifiant CDN de la boutique en dur dans l'index ; limites (2 500 ms, 4 000 ms, 60 pages…) sans ligne d'explication ; domaine `myshopify` en dur dans une route OAuth sans usage documenté (`routes/forms.js:122-197`) ; `ORIGIN` en dur à deux endroits.
- **ADR 0018 contredit par le code** : le repli de la page Promotions ne fusionne pas les remises automatiques comme l'ADR l'affirme.
- **Divers** : `HOME_STORIES_PROMOTION` nomme une campagne précise pour un mécanisme générique ; deux `pageTitle` importés côte à côte ; `metaCache` assigné avant sa déclaration ; `contentPageTrail` appelé avec un argument de trop ; Dependabot étiqueté `dependances`, label inexistant (ses deux PR #228 et #245 sont rouges parce que leurs branches datent d'avant les tests du 19–20/10) ; `.vercelignore` n'exclut ni `docs/` (11 Mo) ni `tests/` ni `scripts/` ; deux workflows reposent sur un handle produit en dur ; `designers.html` réutilise la photo de `marques.html` ; « Promotions jardin » mène à toutes les promotions ; Google Maps sous quatre formes ; pays des marques et exclusion « Compagnie de Provence » codés dans le JS plutôt que dans le registre ; section CTA du nuancier hors `<main>` ; sauts de titres h1 → h3 sur contact et rendez-vous ; `tabindex="0"` sur la barre d'annonce.

## 5. Documentation périmée

- `DESIGN.md` et `docs/FAMILY_PAGES.md` citent encore CH24 Wishbone, Noguchi Dining et CH006 dans les icônes (décisions du 20/10 : table basse Noguchi, bougeoir Nagel) ; « 39 bandeaux » (43) ; « mapping de `server.js` ».
- `docs/ARCHITECTURE.md` : `server.js` « routes, sécurité, caches » (il fait 15 lignes), « aucun outil de compilation » (esbuild), « 110 tests ». À réduire à un renvoi vers AGENTS.md et les ADR.
- `docs/DESIGNERS.md`, `docs/MIKADO_IDENTITY.md` (« TVA pas encore affichée », placeholders « à remplacer avant lancement » toujours servis), `.env.example` (variables mortes citées, 13 variables réellement lues absentes), `docs/DATA-CONTRACT.md` § Migration (fichier de 229 Ko → 530 Ko, service inexistant), `docs/delivery-policy.md` (« saison du 16 novembre » dans le paragraphe qui dit 19 octobre), `docs/adr/README.md` (ligne 0017 après 0019), briefs importateur sans ligne d'état.
- Comptes rendus datés à archiver : `RELAIS-2026-09-24.md`, `INDEXATION_2026-09-20.md`, `VP9_VARIANT_SELECTION_2026-09-18.md`, `promo-ete-2026/`, `articles/fermob-comment-choisir-sa-couleur.md` (journal retiré), `docs/audits/` (10 Mo de CSV, HTML et captures). **Décision de Cyril** : `docs/archive/` et exclusion du déploiement.
- Absents : `README.md` à la racine et `docs/README.md` (index des docs vivantes, promis par le plan d'octobre).

## 6. Données et images

- **Provenance périmée** (sans effet visible) : 15 handles `sourceProduct` répondent 404 dans `catalog-landing.json`, `collection-heroes.json`, `gift-ideas.json`, `family-pages.json`, `brand-heroes.json` ; 1 URL CDN de provenance morte (Esteban). À rafraîchir à l'occasion.
- **Ester & Erik** : bandeau qualifié et page `/collections/ester-erik` en 200, mais 0 produit publié (absente de `/api/brands`). À marquer dormante ou à vérifier avec l'importateur.
- **Texte imposé par le site** dans `campaigns.json` (conditions Vitra Home Stories) : « commande avant le 27 novembre… livraison avant Noël probablement possible » : promesse de date fondée sur le stock, contraire à la règle de Cyril. **À valider par Cyril** (texte Vitra ?).
- **Code de bienvenue** : `data/newsletter.json` dit « jusqu'au 31/12/2026 », la décision du 14/10 dit 31/01/2027. À confirmer côté Shopify.
- **Images** : 76 orphelins (15,1 Mo : anciens `hero-1`, `lifestyle-*`, `category-*`, `ref-*`, dérivés `hero-home-*`, `feat-*`, `lookbook-*`, 24 portraits de créateurs non liés, `kriptonite`, `jardin/9-10.webp`, `placeholder-silhouette.svg`) ; 13 sources (5,6 Mo) citées seulement par le script d'optimisation ; 37 sources de bandeaux (16,8 Mo) jamais servies, gardées comme matière de régénération ; 5 SVG de logos jamais demandés ; 5 paires de doublons binaires. Les placeholders `ref-*` sont encore servis par `materiaux.html` et le méga menu (`ref-feat-2.webp`, `lifestyle-1.jpg`) alors que `MIKADO_IDENTITY.md` les dit « à remplacer avant lancement » : **licence à trancher par Cyril**. Le build copie tout `v3/images/` : ≈ 37 Mo déployés pour rien à chaque mise en ligne. La sortie des images du dépôt (Blob, ADR 0008) reste la vraie solution.
- **Lot d'enrichissement** `data/catalog-enrichment/*` + 2 scripts + 2 tests : publié dans Shopify le 21/09, lu seulement en Preview. À archiver ou à déclarer « gabarit des prochains lots ».
- `data/designer-photos.json` (196 Ko, provenance, lu par un test) et `data/catalog-filter-contract.json` (contrat importateur, lu par personne) sont embarqués dans la fonction Vercel pour rien.

## 7. Plan de nettoyage par lots

Chaque lot = une PR, Preview vérifiée (bureau + téléphone), tests verts, merge par Cyril.

| Lot | Contenu | Risque | Décision nécessaire |
|---|---|---|---|
| **0 — Erreurs** | S1 à S6, V1, V4 (Remember + plus de 404), V5, V6, F1 à F9 ; garde `campaigns.promotions` ; tests pour chaque correction | Nul à faible | V2 (en-tête accueil), V3 (deux remplaçantes Carl Hansen), logos Hartô / Linie Design / Normann Copenhagen |
| **1 — Reliquats sûrs** | code mort serveur et front (F3, F4, exports, gardes impossibles, fichiers orphelins JSON), CSS sans usage (≈ 180 lignes), classe `reveal`, `display:none` → `hidden`, commentaires périmés, dossier `logosvg/`, `.gitkeep`, doublons binaires de portraits, `jardin/9-10`, 5 SVG non servis | Nul | Aucune |
| **2 — Saisonnier terminé** | soldes d'été 2026 (front + chrome + CSS), offre Panton (front + serveur), collections promo passées dans la navigation + cas `/^promo/`, `claude-modifs`, doublons Serax, « Serviettes Reste » | Faible (panier, barre d'annonce, fil d'Ariane à tester) | Retirer ou garder dormant (soldes, Panton) ; `panton-cubes`, `noel` à confirmer avec l'importateur |
| **3 — Doublons** | `lib/html.js` + `format.mjs` (échappement, slug, normalisation, e-mail, prix), fragment GraphQL unique, requêtes nommées dans `queries.js`, `replaceOnce` avec avertissement + balises dans les gabarits, module de pagination + page famille unique, piège de focus et verrou communs, helper `tests/_server.cjs`, CSS regroupé par composant, table unique des familles riches, un seul chargement du registre des marques, un seul mécanisme pour le `<head>` | Faible à « à tester » (tests existants, captures avant/après) | Aucune |
| **4 — Cohérence** | titres sans suffixe manuel, erreurs amont uniformes (503), `ORIGIN` partout, messages d'erreur en français, constantes nommées, `--chrome-h`, scripts inline > 20 lignes déplacés, h1/h2/h3, `tabindex`, section hors `<main>`, Dependabot (label + relance), `.vercelignore`, workflows sans handle en dur, pays/exclusions des marques dans le registre | Nul à faible | Coins (chips, pastilles), vocabulaire panier / sélection, tokens de couleur |
| **5 — Docs et données** | DESIGN.md, FAMILY_PAGES, ARCHITECTURE → renvoi, DESIGNERS, MIKADO_IDENTITY, `.env.example`, DATA-CONTRACT, delivery-policy, ADR README, états des briefs, `README.md` racine + `docs/README.md`, provenances périmées, Ester & Erik, note de fin de campagne Vitra | Nul | Archivage (`docs/archive/`), texte Vitra « livraison avant Noël », date BIENVENUE10 |
| **6 — Images** | orphelins (15 Mo), sources du script d'optimisation (5,6 Mo), kriptonite, placeholders `ref-*` à remplacer ; ensuite sortie des images du dépôt (ADR 0008) | Nul techniquement | Suppression d'images, licence des `ref-*`, bandeaux sources (garder hors dépôt ?) |

## 8. Ce qui est sain (vérifié, à ne pas re-vérifier)

- Toutes les ancres HTML que le serveur remplace existent aujourd'hui à l'identique (une à une) ; la requête de recherche fabriquée est valide (accolades 61/61).
- CSP justifiée hôte par hôte ; aucun `onclick`/`onerror` inline ; repli d'images par `data-fallback`.
- Aucun `console.log` de débogage, aucun TODO réel ; aucun écouteur posé deux fois ; `initShell` idempotent ; aucun doublon d'`id` par page ; aucun surtitre.
- Liens internes : 240 vérifiés en prod, tous en 200 ; toutes les cibles des pages, du chrome et du pied de page existent ; redirections `vercel.json` cohérentes ; `/collections/all` alias volontaire.
- Décisions voulues, non comptées : marques dormantes (registre + bandeaux), repère « Livré avant Noël » éteint, « Idées cadeaux » toute l'année, Moustache retiré en saison, nuancier gardé et câblé, table de redirections de l'importateur (4 425 entrées), rate-limit par instance, horloge `MIKADO_CLOCK`, « Mikado Deco » exclu des marques, journal en 410.
- Dépendances : 9 déclarées, 9 utilisées ; lockfile cohérent ; Node 22 partout. Workflows : scripts et secrets existants, 10 URL de réchauffage en 200, pas d'étape redondante. Manifeste des pages = exactement les 17 HTML + le gabarit famille. Tests : aucun `skip`/`only`, horloge figée dans les suites saisonnières, aucun test sur du code retiré.
- `campaigns.json`, `category-filters.json`, `offer-policy.json`, `legal-pages.json`, `newsletter.json`, `lead-times.json`, `search-product-types.json` : lus par le code cité dans leur note ; bandeaux de marque : les 4 dérivés présents pour chacune des 36 entrées.

## 9. Méthode

Trois relectures indépendantes en parallèle (serveur ; front ; données, docs, scripts, CI, images), chacune en lecture seule avec obligation de prouver par grep tout « inutilisé » et de distinguer le voulu (AGENTS.md, ADR) du reliquat ; contrôles automatiques (syntaxe, build, tests, classes CSS contre le HTML/JS, exports contre les imports, modules contre les références, images contre les références et les règles dynamiques, hachage des doublons) ; contre-vérification des constats majeurs sur le code et en production (menu à 960 px, en-tête à 1 400 px, sitemaps, cache, handles). Les rapports détaillés des trois relectures sont conservés dans la session ; ce document en est la consolidation.
