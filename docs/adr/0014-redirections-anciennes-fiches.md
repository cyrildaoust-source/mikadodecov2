# ADR 0014 — Anciennes fiches produit : 301 ou 410 depuis la table de l'importateur, la fiche publiée d'abord

Date : 9 octobre 2026 · Statut : accepté · Exigence A9 du plan SEO.

## Contexte

Des milliers d'URL de fiches n'existent plus sous leur ancien handle : produits ré-encodés sous un autre handle, doublons « -copie », références retirées. Elles répondaient 404 (« Explorée, non indexée » dans la Search Console), et les fiches de l'ancienne boutique Shopify canonisent toujours vers `www.mikadodeco.be/products/<handle>`. Seul l'importateur (`mikado-importer`) connaît l'histoire des handles : il livre `exports/site/redirections.json` (schéma `mikado.redirections@2` ; au 9 octobre, 4 318 entrées en 301 et 68 en 410). Le site ne peut pas reconstruire cette table, et `vercel.json` ne peut pas la porter (limite de 2 048 redirections, et une règle statique serait aveugle à une fiche republiée).

## Décision

- La table est **copiée telle quelle** dans `data/redirections.json` (embarquée dans la fonction par `data/**`). Chaque livraison de l'importateur remplace le fichier ; le site ne l'édite jamais à la main et n'en déduit rien : seul le champ `status` décide (301 avec `to` = handle publié ou chemin `/collections/…` ; 410 sans destination). Les sections `a_verifier`, `rules` et `incomplete` sont ignorées. `lib/redirections.js` charge la table au démarrage, vérifie le schéma et ne retient que les entrées valides ; table absente ou invalide = site sans redirections (404 comme avant) et `/api/health` le dit.
- **Une fiche publiée passe toujours avant la table** (règle posée par l'importateur). `/produit.html?handle=` cherche d'abord la fiche dans Shopify ; seule une fiche introuvable consulte la table. `/products/<handle>` (canonique de l'ancienne boutique) ne consulte Shopify que pour les handles de la table, afin de rediriger en **un seul saut** ; au moindre doute (Shopify indisponible) il garde le saut d'avant vers `/produit.html`, qui tranche.
- 301 vers `/produit.html?handle=<to>` ou vers le chemin donné. 410 = le shell du site (`v3/410.html` : noindex, chrome, corps markdown pour les agents), comme la 404.
- Cache des 301 et 410 : `public, max-age=300, s-maxage=3600` — une fiche republiée sous un ancien handle réapparaît en une heure au plus à l'edge, cinq minutes au plus dans un navigateur.

## Conséquences

- Mettre à jour les redirections = recopier le fichier livré par l'importateur et ouvrir une PR. Le smoke prend le premier ancien handle de chaque sorte dans la table et vérifie l'URL d'arrivée ou le 410 ; la parité fige trois exemples ; `/api/health` expose `redirections` (schéma, date de génération, compteurs, erreur de chargement).
- Une entrée dont la cible n'est plus publiée mène à un 404 : c'est à la table de se refaire (importateur), pas au site.
- Les marques dont les fiches ont été regroupées sur une collection (`/collections/<marque>`) gagnent à avoir une bannière dans `data/brand-heroes.json` : hors de cette décision.
