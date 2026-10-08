# ADR 0013 — Journal et pages légales rendus depuis leur source, plus de HTML généré commité

Date : 8 octobre 2026 · Statut : accepté · Phase 4.2 du plan.

## Contexte

Les neuf articles du journal (source : `v3/journal/articles.data.mjs`) et les quatre pages légales (sources : `docs/legal/*.md`, rédigées par l'avocate et Cyril) étaient pré-rendus par deux scripts (`npm run journal`, `npm run build:legal`) en treize fichiers HTML commités dans `v3/`, et une étape de CI vérifiait que ces fichiers correspondaient à leurs sources. Modifier un article demandait d'éditer la source, de régénérer, de committer treize fichiers. Les scripts dupliquaient la logique de `<head>` que le layout unique (ADR 0012) a depuis centralisée.

## Décision

- Les articles et les pages légales sont rendus **à la demande par le serveur**, depuis leurs sources, sous forme de fragments du layout unique : `lib/render/journal.js` (import ESM de `articles.data.mjs`, validation au chargement, promesse `journalReady`) et `lib/render/legal.js` (nettoyage par marqueurs et conversion markdown → HTML, configuration dans `data/legal-pages.json`). Le rendu est mémorisé par processus : les sources ne changent qu'avec un déploiement.
- `lib/render/layout.js` connaît ces **pages générées** : un `rel` sous `journal/` ou une entrée du manifeste `generated: "legal"` passe par le générateur au lieu d'un fichier.
- Le sitemap liste les articles depuis la donnée. Les treize fichiers générés, les deux scripts, les deux commandes npm et l'étape de CI disparaissent. `docs/legal/**` est embarqué dans la fonction.
- Les dimensions Open Graph des photos d'article, lues à la construction avec `sharp`, ne sont plus émises (l'image par défaut garde les siennes dans le layout) : les scrapers mesurent eux-mêmes.

## Conséquences

- Publier ou corriger un article = éditer `articles.data.mjs` ; une page légale = éditer son `.md` (et `data/legal-pages.json` pour titre, intro, date). Rien à régénérer, rien d'autre à committer.
- Le rendu est identique à l'ancien, vérifié fragment par fragment contre les fichiers qu'il remplace, puis par la parité des balises SEO avec la production.
- Un article mal formé est refusé au chargement avec un message qui nomme le slug ; une source légale manquante lève une erreur explicite au premier rendu de la page (les autres pages ne sont pas touchées).
- Le gabarit d'article vit désormais dans le serveur : l'exigence A5 du plan SEO (bloc questions-réponses, appel à l'action vers une collection) se fera à un seul endroit.
