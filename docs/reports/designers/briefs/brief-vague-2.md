# Brief de recherche — créateurs Mikado, 2e vague (6 octobre 2026)

Applique **intégralement** les règles de `/home/vercel-sandbox/mikadodecov2/.context/designers/BRIEF.md` (bio, sources autorisées, portrait officiel, format de sortie), avec ces différences :

- **Chemins** : écris ton résultat dans `/home/vercel-sandbox/mikadodecov2/.context/designers/research2/<lot>.json` et les portraits dans `/home/vercel-sandbox/mikadodecov2/.context/designers/photos2/<slug>.<ext>`. Ne modifie rien d'autre (pas `v3/`, pas git, pas Shopify).
- **Lot** : `/home/vercel-sandbox/mikadodecov2/.context/designers/batches2/<lot>.json`. Chaque entrée a un champ `mode` :
  - `bio+photo` : bio et portrait ;
  - `bio` : la fiche a déjà un portrait, ne cherche que la bio (renvoie `"photo": null` et `"photoMissingReason": "portrait existant conservé"`) ;
  - `photo` : la fiche a déjà une bio (`existingBio`), ne cherche que le portrait (renvoie `"bio": null`).
  `sampleProducts` donne des produits vendus par Mikado : appuie-toi dessus pour citer les pièces. Beaucoup de ces produits ne sont pas encore en ligne : c'est normal.
- **Ce n'est peut-être pas un créateur** : certaines valeurs viennent d'un champ « créateur » mal rempli (une marque, une boutique, un festival, une gamme sous licence, un nom de collection). Si l'entrée n'est pas une personne, un duo ou un studio de création identifiable, renvoie `"notCreator": true` avec une explication dans `remarks` (ex. « Tomorrowland : festival, collaboration de marque avec Serax »), sans bio ni photo. Une collaboration avec une créatrice ou un créateur identifiable (ex. une styliste) est un créateur.
- **Nom affiché** : garde `name` sauf erreur manifeste (casse, accents, nom officiel du studio) ; dans ce cas donne le nom corrigé dans `name` et explique dans `remarks`. Ne change jamais `slug`.
- `sortKey` : le nom de famille pour une personne, le nom complet pour un duo ou un studio.
- Sources autorisées rappelées : site de l'éditeur (Serax, HAY, Muuto, Vitra, Alessi, Louis Poulsen, Martinelli Luce, Flos, Linie Design, Iittala, Marimekko, Pols Potten…) ou site officiel du créateur ; une institution officielle peut compléter. Jamais un revendeur, Wikipédia/Wikimedia, la presse, une banque d'images ou un réseau social. `vitra.com` bloque les requêtes directes : `https://r.jina.ai/<url>` permet de lire la page, puis télécharge l'image depuis le serveur de Vitra. `alessi.com` limite les requêtes (erreur 429) : même méthode.
- Ne passe pas plus de quelques minutes par entrée : une bio courte et sûre (`"bioConfidence": "faible"`) vaut mieux qu'une bio inventée.

Termine par un court résumé en français : bios écrites, portraits trouvés, entrées `notCreator`, cas à valider.
