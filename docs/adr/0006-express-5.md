# ADR 0006 — Passage à Express 5

Date : 7 octobre 2026 · Statut : accepté · Phase 5.4 du plan.

## Contexte

Express 4 ne transmettait pas les promesses rejetées des handlers `async` au gestionnaire d'erreurs : la phase 0.5 avait ajouté un patch de 15 lignes (`installAsyncErrorForwarding`, même principe qu'`express-async-errors`) sur un module interne d'Express. Express 5 fait ce travail nativement et supprime les API dépréciées.

## Décision

`express@5` (5.2.1). Le patch et son appel disparaissent ; le gestionnaire d'erreurs global reste tel quel. Deux détails de la v5 pris en compte : `req.body` vaut `undefined` sans corps JSON (gardes `req.body || {}`), et les motifs de route suivent `path-to-regexp` v8 (les routes du site n'utilisent ni `*` ni `?` ni paramètre optionnel ; `'/index-catalogue/:part.json'` et la route générique `/.*/` sont valides, vérifiées).

## Conséquences

- Moins de code à maintenir et plus de dépendance à un module interne d'Express.
- Les 253 tests passent sans modification de comportement ; le smoke local passe.
- Dependabot suivra les 5.x ; un retour en 4.x reviendrait à réintroduire le patch.
