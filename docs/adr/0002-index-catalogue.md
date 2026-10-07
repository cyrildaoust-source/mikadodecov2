# ADR 0002 — L'index du catalogue ne doit jamais se construire dans la requête d'un visiteur

Date : 7 octobre 2026 · Statut : accepté (étape 1 faite, étape 2 à décider) · Phase 2.3 du plan.

## Contexte

L'index du catalogue (tous les produits publiés, variantes, données de filtre, appartenance aux familles) est construit par la fonction avec des dizaines d'appels Shopify, puis découpé en 5 parties gzippées servies par `/index-catalogue/<part>.json` (edge : `s-maxage=900, stale-while-revalidate=86400`). Les instances de la fonction se le procurent en relisant ces URL à l'edge : l'edge joue le rôle de magasin partagé.

Problème mesuré le 06/10 : quand l'entrée edge est froide (déploiement, cold start après 24 h), `/index-catalogue/membres.json` attend la construction complète (> 60 s). Les pages de listes, elles, n'attendent que 4 s (`INDEX_WAIT`) puis servent la liste de repli : la même URL rend deux pages différentes selon la température.

## Décision

**Étape 1 (faite, sans infrastructure)** : un réchauffage toutes les 30 minutes (`.github/workflows/warm-cache.yml`) visite les 5 parties de l'index et les listes les plus vues. L'entrée edge est ainsi toujours dans sa fenêtre `stale-while-revalidate` : l'edge sert l'ancienne version et régénère en arrière-plan ; un visiteur ne déclenche plus la construction et les instances trouvent toujours un index prêt.

**Étape 2 (à décider, infrastructure Vercel)** : construire l'index par un Cron Vercel (toutes les 15 min) et l'écrire dans Vercel Blob (ou KV) ; les fonctions lisent le Blob en un appel (~200 ms) ; `/index-catalogue/*.json` sert le Blob ; `INDEX_WAIT`, le repli « legacy » et le 503 disparaissent. Prérequis : un store Blob et sa variable `BLOB_READ_WRITE_TOKEN` dans le projet Vercel (réglage à faire par le propriétaire), et un plan Vercel autorisant une fréquence de cron de 15 minutes.

## Conséquences

- Étape 1 : coût ≈ 30 à 50 minutes de GitHub Actions par mois ; une construction d'index au plus toutes les 30 minutes, en arrière-plan.
- Étape 2 : une seule construction par quart d'heure pour toutes les instances, index disponible dès le premier hit après déploiement, suppression de ~40 lignes de gestion d'attente dans `lib/services/catalog-scope.js`.
