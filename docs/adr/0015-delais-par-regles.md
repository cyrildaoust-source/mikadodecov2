# ADR 0015 — Délais de livraison hors stock : règles par marque et famille, appliquées automatiquement

Date : 11 octobre 2026 · Statut : accepté · Demande de Cyril du 10 octobre (« des délais fournis par les fournisseurs, en temps réel, pour éviter 3–4 semaines partout »).

## Contexte

Le site annonçait un délai binaire : « 1–2 jours » si le stock Mikado couvre la quantité, sinon « 3–4 semaines » pour tout le catalogue, quelle que soit la marque. Mikado a peu de stock : presque tout part sur commande, et un délai uniforme et pessimiste freine la commande. Encoder un délai fiche par fiche (4 300 fiches) n'est ni faisable ni tenable ; le métachamp `custom.lead_time` existait et n'était pas lu pour l'affichage.

## Décision

- **Une table de règles**, `data/lead-times.json` : délai en semaines `[min, max]` par marque (nom fournisseur Shopify exact), affiné par famille ou sous-catégorie (handles des collections du site : `sieges`, `canapes`, `tables`, `luminaires`…), avec un défaut global. Elle est courte, lisible par Cyril, modifiée par PR.
- **Une résolution unique**, `lib/lead-time.js`, pour chaque fiche hors stock : métachamp `custom.lead_time` de la fiche (exception, texte libre : « 6 semaines », « 10 jours », « sur demande ») → tag `delai-long` (« délai sur demande ») → marque + sous-catégorie → marque + famille → marque → défaut. Le stock Mikado reste décidé au panier, sur le stock réel de la variante.
- **Un seul libellé partout** : carte, fiche, panier (le plus long des articles hors stock pour un envoi groupé), attribut « Délai estimé » par ligne et par commande au checkout, e-mail de confirmation (`docs/notifications/delivery-estimate.liquid` affiche tout libellé).
- **Les sources de données restent à leur place** : la table vit dans le site ; les exceptions par fiche et, plus tard, les délais issus des flux fournisseurs ou des bons de commande sont écrits par l'importateur dans `custom.lead_time` — le site les lit déjà.

## Conséquences

- Tant que la table n'a pas de marque, rien ne change pour le visiteur (libellé « 3–4 semaines », désormais avec le tiret typographique partout). Les valeurs de Cyril se posent marque par marque, en une PR.
- Un délai annoncé reste une estimation, jamais une réservation (politique inchangée, `docs/delivery-policy.md`).
- L'automatisation « temps réel » se branche sans toucher au site : un flux fournisseur ou l'historique des bons de commande alimente `custom.lead_time` ou la table.
