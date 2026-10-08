# ADR 0009 — Configuration Vercel moderne : un build publie les fichiers statiques, tout le reste va au serveur

Date : 8 octobre 2026 · Statut : accepté · Phase 3.1 (étape 1) du plan ; remplace la partie « `vercel.json` dérivé » de l'ADR 0005.

## Contexte

`vercel.json` utilisait la configuration héritée `builds` + `routes` : 45 règles écrites à la main, dont une liste des pages à envoyer à la fonction (régénérée par un script depuis le manifeste), une règle « toute URL avec extension = fichier de `v3/` » et une règle « toute URL sans extension = `v3/<chemin>.html` brut ». Trois conséquences :

- **double routage** : une page devait exister dans Express ET dans `vercel.json` ; un oubli donnait un 404 en production seulement (PR #80/#81), d'où le générateur de l'ADR 0005 ;
- **pas d'étape de build possible** : la propriété `builds` exclut `functions`, `buildCommand` et `outputDirectory`. Impossible d'ajouter un bundler (point 3.1), de hacher les assets, ou de régler `maxDuration` ;
- **fuites et gabarits bruts** : tout fichier de `v3/` était public (`.md`, sauvegardes `.bak-…`), et `/studio` servait le gabarit `studio.html` sans chrome.

## Décision

- `vercel.json` passe à la configuration moderne : `buildCommand: npm run build`, `outputDirectory: dist`, `functions` (fichiers embarqués dans la fonction), `headers`, `redirects` (les 13 redirections historiques, statuts conservés), et **une seule** `rewrites` : `/(.*)` → `/api/index`.
- `scripts/build.mjs` (`npm run build`) produit `dist/` : copie de `v3/` **sans** les pages HTML (sauf les `stub` du manifeste), sans `.md`, `.bak`, fichiers cachés. `dist/` n'est pas versionné.
- Règle de routage, désormais unique : Vercel sert un fichier de `dist/` s'il existe, sinon la requête arrive à Express, qui décide (page rendue, API, redirection, 404 avec chrome). Plus aucune liste de pages dans `vercel.json`.
- Express reprend les deux comportements que la configuration héritée portait : URL sans extension → **301** vers la page `.html` quand elle existe (`/studio` → `/studio.html`, `/journal/x` → `/journal/x.html`), et les gabarits (`role: template` : `famille.html`, `famille-assises.html`, `500.html`) ne sont plus servis bruts → 404.
- `scripts/route-parity.mjs` (`npm run parity --b <Preview>`) compare prod et Preview sur 65 URL (statut, redirection, type, cache, qui répond) ; il sert à valider ce changement et tout changement futur de `vercel.json`.
- `tests/vercel-config.test.cjs` fige le contrat (pas de `builds`/`routes`, rewrite unique, redirections, en-têtes, contenu de `dist/`).

## Conséquences

- Ajouter une page = une ligne dans `data/pages.manifest.json`, rien d'autre. Le générateur `scripts/build-vercel-config.mjs` est supprimé.
- Le build Vercel exécute `npm run build` : la voie est ouverte pour l'étape 2 du point 3.1 (esbuild, assets hachés `immutable`, scission de `shared.js`, point 3.4) et pour le contenu généré à la construction (4.2).
- `maxDuration` n'est pas fixée : la fonction hérite du réglage du projet (Fluid compute, 300 s), nécessaire à `POST /api/cron/catalog-index`.
- Retour arrière = revert de la PR (un seul commit) : l'ancienne configuration redevient active au déploiement suivant.
