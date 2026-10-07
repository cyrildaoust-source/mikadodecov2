# ADR 0001 — Les pages de listes sont cachées à l'edge

Date : 7 octobre 2026 · Statut : accepté · Phase 2.1 du plan d'architecture.

## Contexte

Les pages catalogue, collections (marques, catégories), familles et créateurs étaient servies en `Cache-Control: no-store` « pour que prix et stock se renouvellent via l'index ». Conséquence mesurée le 06/10 : chaque visite re-rendait la page dans la fonction (TTFB 1,0 à 2,1 s), alors que la fiche produit était déjà servie depuis l'edge (`s-maxage=600`).

## Décision

- Page de liste non filtrée (page 1 ou suivante) : `public, s-maxage=120, stale-while-revalidate=86400`.
- Page filtrée ou sans résultat (déjà `noindex`) : `public, s-maxage=60, stale-while-revalidate=3600`.
- `/api/catalog/<handle>` (pagination et filtres côté client) : `public, s-maxage=60, stale-while-revalidate=600`.
- Restent en `no-store` : la page de recherche `?q=`, les états d'erreur (503), la liste de repli servie quand l'index n'est pas prêt (`scopeFallback`), le panier, les formulaires.
- Les pages statiques avec chrome (accueil, marques, designers, journal…) gardent `public, max-age=0, must-revalidate` **sans** `s-maxage` : elles négocient `Accept` (markdown pour les agents) et le cache edge ne tient pas compte de `Vary`. À revoir si la variante markdown reçoit sa propre URL.

## Conséquences

- Au pire 2 minutes de prix ou de stock périmé sur une liste ; le prix est reconfirmé au panier (`/api/cart/preview`, `no-store`) et la fiche produit se rafraîchit toutes les 10 minutes.
- Une remise Shopify activée ou retirée est visible sur les listes en moins de 2 minutes (incident de septembre 2026 : une désynchronisation de plusieurs heures venait d'une autre cause, pas du cache).
- TTFB attendu sur un hit edge : < 100 ms au lieu de 1 à 2 s ; la fonction n'est invoquée qu'à l'expiration, en arrière-plan.
