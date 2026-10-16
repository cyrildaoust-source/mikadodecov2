# Décisions d'architecture (ADR)

Une décision structurante = un fichier court (contexte, décision, conséquences), numéroté, jamais réécrit : une décision qui change donne un nouvel ADR qui remplace l'ancien.

| N° | Décision | Statut |
|---|---|---|
| [0001](0001-cache-edge-des-listes.md) | Les pages de listes sont cachées à l'edge (`s-maxage` + `stale-while-revalidate`) | accepté |
| [0002](0002-index-catalogue.md) | L'index du catalogue ne se construit jamais dans la requête d'un visiteur (Blob + route protégée cadencée par GitHub) | accepté, étapes 1 et 2 faites |
| [0003](0003-rate-limit-par-instance.md) | Le rate-limit reste par instance tant qu'aucun abus n'est mesuré | accepté |
| [0004](0004-csp-nonce.md) | CSP posée par le serveur avec un nonce par requête ; plus de `unsafe-inline` pour les scripts | accepté |
| [0005](0005-manifeste-des-pages.md) | `data/pages.manifest.json` est la seule liste des pages ; `vercel.json` en est dérivé | accepté ; la dérivation de `vercel.json` est remplacée par 0009 |
| [0006](0006-express-5.md) | Passage à Express 5 (promesses rejetées gérées nativement) | accepté |
| [0007](0007-recherche-shopify.md) | La pertinence de la recherche reste celle de Shopify ; l'index ne la remplace pas (point 2.4 fermé) | accepté |
| [0008](0008-images-statiques.md) | Les images restent servies en statique par Vercel, pas par Blob (point 4.4 reporté) | accepté |
| [0009](0009-configuration-vercel-moderne.md) | Configuration Vercel moderne : `npm run build` publie `dist/` (statique sans gabarits), une seule réécriture vers le serveur, plus de liste de pages dans `vercel.json` | accepté |
| [0010](0010-assets-haches.md) | Assets front hachés par version de sources (esbuild au build Vercel, `immutable` un an, réécriture au rendu) | accepté |
| [0011](0011-modules-front.md) | Front découpé par responsabilité (`shared.js` supprimé, 12 modules) ; sources jamais servies brutes en production ; 404 produit cachée 1 min | accepté |
| [0012](0012-layout-unique.md) | Un seul `<head>` pour tout le site : `templates/layout.html` + pages en fragments (`<!--page {…}-->`, `<template data-head>`, `<main>`) assemblés par `renderPage()` | accepté |
| [0013](0013-contenu-depuis-la-source.md) | Journal et pages légales rendus à la demande depuis leurs sources (`articles.data.mjs`, `docs/legal/*.md`) ; plus de HTML généré commité ni d'étape CI | accepté |
| [0014](0014-redirections-anciennes-fiches.md) | Anciennes fiches produit : la table de l'importateur (`data/redirections.json`) donne 301 ou 410, appliquée par le serveur et seulement quand aucune fiche publiée ne porte le handle | accepté |
| [0015](0015-delais-par-regles.md) | Délais hors stock : table de règles par marque et famille (`data/lead-times.json`), exceptions par fiche (`custom.lead_time`), un seul libellé de la carte au checkout | accepté |
| [0016](0016-operation-de-noel.md) | Opération de Noël : page Idées cadeaux par règles (tags cadeau/noel, tranches de budget, rubriques), repère « Livré avant Noël » calculé article par article, saison pilotée par `campaigns.json` | accepté |
| [0018](0018-page-promotions-filtrable.md) | Page Promotions filtrable depuis l'index (prix réduit ou tag `promotion` + remises automatiques), mêmes filtres que les autres listes, repli sur l'ancienne page | accepté |
| [0017](0017-popup-newsletter.md) | Popup newsletter discrète (règles d'ouverture, réglages dans `data/newsletter.json`), origine de l'inscription en tag, repli d'identifiants Admin et sonde dans `/api/health` | accepté |

Le plan d'ensemble et son état : [`../ARCHI-critique-et-plan-2026-10-06.md`](../ARCHI-critique-et-plan-2026-10-06.md).
