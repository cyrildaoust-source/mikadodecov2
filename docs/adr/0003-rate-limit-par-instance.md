# ADR 0003 — Le rate-limit reste en mémoire, par instance, tant qu'aucun abus n'est constaté

Date : 7 octobre 2026 · Statut : accepté · Phase 2.5 du plan.

## Contexte

Les formulaires (contact, newsletter : 5 envois / IP / 10 min) et le panier (30 calculs / IP / min) sont limités par `express-rate-limit` avec un compteur en mémoire. Sur Vercel, ce compteur est par instance et repart à zéro à chaque cold start : il arrête le spam naïf (matraquage d'une instance chaude), pas une attaque distribuée. Un store partagé (Upstash Redis via `rate-limit-redis`) corrigerait cela au prix d'une dépendance réseau sur chaque envoi de formulaire.

## Décision

Garder la limite par instance. Le honeypot, la validation serveur et l'envoi par e-mail (Resend) suffisent au volume actuel. Passer au store partagé **si** le journal des requêtes (`lib/request-log.js`) montre plus de 50 réponses `429` par jour, ou si un abus est constaté sur la boîte de réception.

## Conséquences

- Zéro dépendance ajoutée ; comportement inchangé.
- Le critère de déclenchement est écrit : la décision se rejoue sur une mesure, pas sur une impression.
