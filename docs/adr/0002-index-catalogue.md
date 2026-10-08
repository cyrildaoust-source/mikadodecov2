# ADR 0002 — L'index du catalogue ne doit jamais se construire dans la requête d'un visiteur

Date : 7 octobre 2026 · Statut : accepté (étapes 1 et 2 faites le 8 octobre 2026) · Phase 2.3 du plan.

## Contexte

L'index du catalogue (tous les produits publiés, variantes, données de filtre, appartenance aux familles) est construit par la fonction avec des dizaines d'appels Shopify, puis découpé en 5 parties gzippées servies par `/index-catalogue/<part>.json` (edge : `s-maxage=900, stale-while-revalidate=86400`). Les instances de la fonction se le procurent en relisant ces URL à l'edge : l'edge joue le rôle de magasin partagé.

Problème mesuré le 06/10 : quand l'entrée edge est froide (déploiement, cold start après 24 h), `/index-catalogue/membres.json` attend la construction complète (> 60 s). Les pages de listes, elles, n'attendent que 4 s (`INDEX_WAIT`) puis servent la liste de repli : la même URL rend deux pages différentes selon la température.

## Décision

**Étape 1 (faite, sans infrastructure)** : un réchauffage toutes les 30 minutes (`.github/workflows/warm-cache.yml`) visite les 5 parties de l'index et les listes les plus vues. L'entrée edge est ainsi toujours dans sa fenêtre `stale-while-revalidate` : l'edge sert l'ancienne version et régénère en arrière-plan ; un visiteur ne déclenche plus la construction et les instances trouvent toujours un index prêt.

**Étape 2 (faite le 8 octobre 2026, adaptée au plan Hobby)** : un store Vercel Blob (`mikadodeco-blob`, variable `BLOB_READ_WRITE_TOKEN`) reçoit l'index en 1 + 4 fichiers JSON publics et un `meta.json`. Il est écrit par la route protégée `POST /api/cron/catalog-index` (`Authorization: Bearer CATALOG_INDEX_SECRET`, fail-closed), appelée toutes les 30 minutes par `.github/workflows/warm-cache.yml` : le Cron Vercel du plan Hobby ne permet qu'un passage par jour, GitHub cadence donc. Toutes les instances lisent l'index depuis Blob en un `list` et quelques `fetch` (~200 ms) ; `/index-catalogue/<partie>.json` redirige vers Blob. L'ancien chemin (CDN de l'endpoint, puis construction locale) reste en repli tant que Blob est vide ou indisponible, donc rien ne casse au premier déploiement.

Mesuré en local contre le vrai store : construction + écriture 39 s (5 057 produits), puis une instance neuve sert `/collections/chaises` en 0,7 s en lisant Blob, contre 8 s auparavant en repli.

## Conséquences

- Étape 1 : coût ≈ 30 à 50 minutes de GitHub Actions par mois ; une construction d'index au plus toutes les 30 minutes, en arrière-plan.
- Étape 2 : une construction toutes les 30 minutes pour toutes les instances ; un visiteur ne déclenche plus jamais la construction dès que Blob est rempli ; `INDEX_WAIT` et le repli « legacy » ne servent plus qu'au tout premier déploiement ou à une panne Blob. Le code de repli reste tant que ces cas existent.
