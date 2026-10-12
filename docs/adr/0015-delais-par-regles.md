# ADR 0015 — Délais de livraison hors stock : règles par marque et famille, appliquées automatiquement

Date : 11 octobre 2026 · Statut : accepté · Demande de Cyril du 10 octobre (« des délais fournis par les fournisseurs, en temps réel, pour éviter 3–4 semaines partout »).

## Contexte

Le site annonçait un délai binaire : « 1–2 jours » si le stock Mikado couvre la quantité, sinon « 3–4 semaines » pour tout le catalogue, quelle que soit la marque. Mikado a peu de stock : presque tout part sur commande, et un délai uniforme et pessimiste freine la commande. Encoder un délai fiche par fiche (4 300 fiches) n'est ni faisable ni tenable ; le métachamp `custom.lead_time` existait et n'était pas lu pour l'affichage.

## Décision

- **Une table de règles**, `data/lead-times.json` : le délai de la **marque vers Mikado** quand l'article est en stock chez elle (en jours ouvrés `days` ou en semaines `weeks`, `[min, max]`, valeurs observées par Cyril), par marque (nom fournisseur Shopify exact), affinable par famille ou sous-catégorie (handles des collections du site : `sieges`, `canapes`, `tables`, `luminaires`…), avec un défaut global et une **marge Mikado** (réception, préparation, livraison ; les marques ne livrent ni le lundi ni le week-end). Le site affiche le résultat en **jours ouvrés** jusqu'à 15 (« 5–7 jours ouvrés »), en semaines au-delà. Elle est courte, lisible par Cyril, modifiée par PR.
- **Une résolution unique**, `lib/lead-time.js`, pour chaque fiche hors stock : métachamp `custom.lead_time` de la fiche (exception, texte libre : « 6 semaines », « 10 jours », « sur demande ») → tag `delai-long` (« délai sur demande ») → marque + sous-catégorie → marque + famille → marque → défaut. Le stock Mikado reste décidé au panier, sur le stock réel de la variante.
- **Un seul libellé partout** : carte, fiche, panier (le plus long des articles hors stock pour un envoi groupé), attribut « Délai estimé » par ligne et par commande au checkout, e-mail de confirmation (`docs/notifications/delivery-estimate.liquid` affiche tout libellé).
- **Les sources de données restent à leur place** : la table vit dans le site ; les exceptions par fiche et, plus tard, les délais issus des flux fournisseurs ou des bons de commande sont écrits par l'importateur dans `custom.lead_time` — le site les lit déjà.

## Conséquences

- Les valeurs de Cyril du 11 octobre couvrent 30 marques ; une marque absente de la table garde « 3–4 semaines ». Les marques rapides (Blomus, Fatboy, LIND DNA, Compagnie de Provence) annoncent « 5–7 jours ouvrés » : c'est le but, montrer qu'une pièce en stock chez la marque arrive vite. Les valeurs supposent l'article en stock chez la marque ; une pièce fabriquée à la commande (tissus Vitra…) relève d'une règle par famille ou d'une exception par fiche.
- Un délai annoncé reste une estimation, jamais une réservation (politique inchangée, `docs/delivery-policy.md`).
- L'automatisation « temps réel » se branche sans toucher au site : un flux fournisseur ou l'historique des bons de commande alimente `custom.lead_time` ou la table.
