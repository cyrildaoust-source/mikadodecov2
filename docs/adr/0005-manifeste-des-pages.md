# ADR 0005 — `data/pages.manifest.json` est la seule liste des pages ; `vercel.json` en est dérivé

Date : 7 octobre 2026 · Statut : accepté · Phase 1.2 du plan.

## Contexte

La liste des pages servies avec le chrome existait trois fois : `SSR_PAGES`, `NON_HERO` et `REL_ACTIVE` dans le serveur, et la règle de routage des pages dans `vercel.json` (configuration héritée `builds` + `routes`). Un oubli dans `vercel.json` donnait un 404 en production uniquement, invisible en local (déjà subi, PR #80/#81). Une entrée fantôme (`famille-tables.html`, fichier disparu) traînait.

## Décision

- `data/pages.manifest.json` inventorie chaque page HTML (v3/ et templates/) avec son rôle (page, template, stub), `ssr`, `hero`, `active`, la règle `journal` et les alias agents.
- `lib/config.js` en dérive tout ce que le serveur a besoin de savoir d'une page.
- `scripts/build-vercel-config.mjs` (`npm run build:vercel`) régénère **en place** les deux règles concernées de `vercel.json` sans toucher au reste du fichier ; `--check` sert à la CI.
- `tests/pages-manifest.test.cjs` échoue si une page de `v3/` manque au manifeste, si une page déclarée n'existe pas, ou si `vercel.json` n'est pas aligné.

## Conséquences

- Ajouter une page = une ligne de manifeste + `npm run build:vercel`. Le double routage ne peut plus dériver silencieusement.
- Le reste de `vercel.json` (redirections historiques, en-têtes, statique) reste écrit à la main : il ne change presque jamais. Si le site passe à la configuration Vercel moderne (`rewrites`), le générateur produira ces règles à la place.
