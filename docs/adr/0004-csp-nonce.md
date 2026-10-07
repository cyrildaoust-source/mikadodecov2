# ADR 0004 — La CSP est posée par le serveur avec un nonce par requête ; plus de `'unsafe-inline'` pour les scripts

Date : 7 octobre 2026 · Statut : accepté · Phase 3.3 du plan.

## Contexte

La politique de sécurité du contenu vivait dans `vercel.json`, identique pour toutes les réponses, avec `script-src 'unsafe-inline'`. Cette concession était imposée par les scripts inline des pages (jusqu'à 769 lignes dans le catalogue) et par 38 gestionnaires inline (`onload="this.media='all'"` sur la feuille Typekit de chaque page, `onerror="…"` sur les logos). Conséquence : une injection HTML aurait pu exécuter du script.

## Décision

- Les gros scripts de page vivent dans `v3/pages/<page>.js` (phase 3.2). Un script inline reste admis s'il tient en moins de 20 lignes (gardes anti-flash exécutées avant le premier rendu).
- La CSP est construite par `lib/csp.js` et posée par `lib/request-log.js` sur chaque réponse HTML, avec un nonce propre à la requête. `injectChrome` ajoute ce nonce à chaque `<script>` inline exécutable ; les blocs JSON et JSON-LD n'en ont pas besoin.
- Plus aucun gestionnaire inline : la bascule des feuilles de style `media="print"` et la mise en file des images en erreur sont faites par un script d'en-tête commun (nonce) ; une image de repli porte `data-fallback="…"`, traité par `bindImageFallbacks()` dans `shared.js`.
- `style-src` garde `'unsafe-inline'` (attributs `style=` et blocs `<style>` des pages).
- `vercel.json` ne porte plus de CSP : les fichiers statiques n'en ont pas besoin, et deux en-têtes CSP se cumuleraient.

## Conséquences

- Une XSS par injection HTML ne peut plus exécuter de script. `tests/csp.test.cjs` vérifie le nonce sur le vrai serveur et l'absence de gestionnaire inline dans les sources et les générateurs.
- Toute nouvelle page passe par `injectChrome` pour recevoir son nonce ; une page servie sans le chrome (stub de redirection) n'a pas de CSP en production (servie en statique) et c'est voulu.
- Prochaine étape possible : retirer `'unsafe-inline'` de `style-src` (déplacer les blocs `<style>` des pages dans `styles.css`, remplacer les `style=` par des classes).
