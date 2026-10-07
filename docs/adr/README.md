# Décisions d'architecture (ADR)

Une décision structurante = un fichier court (contexte, décision, conséquences), numéroté, jamais réécrit : une décision qui change donne un nouvel ADR qui remplace l'ancien.

| N° | Décision | Statut |
|---|---|---|
| [0001](0001-cache-edge-des-listes.md) | Les pages de listes sont cachées à l'edge (`s-maxage` + `stale-while-revalidate`) | accepté |
| [0002](0002-index-catalogue.md) | L'index du catalogue ne se construit jamais dans la requête d'un visiteur (réchauffage, puis Cron + Blob) | accepté, étape 2 à décider |
| [0003](0003-rate-limit-par-instance.md) | Le rate-limit reste par instance tant qu'aucun abus n'est mesuré | accepté |
| [0004](0004-csp-nonce.md) | CSP posée par le serveur avec un nonce par requête ; plus de `unsafe-inline` pour les scripts | accepté |
| [0005](0005-manifeste-des-pages.md) | `data/pages.manifest.json` est la seule liste des pages ; `vercel.json` en est dérivé | accepté |
| [0006](0006-express-5.md) | Passage à Express 5 (promesses rejetées gérées nativement) | accepté |

Le plan d'ensemble et son état : [`../ARCHI-critique-et-plan-2026-10-06.md`](../ARCHI-critique-et-plan-2026-10-06.md).
