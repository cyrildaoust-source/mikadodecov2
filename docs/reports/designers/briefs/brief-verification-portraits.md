# Vérification de l'origine des portraits de créateurs (Mikado)

Le site Mikado (boutique de design à Uccle) affiche un portrait par créateur. Ces portraits ont été importés il y a quelques mois **sans noter leur source**. Le propriétaire veut savoir si certains viennent de sites de revendeurs. Règle du site : un portrait doit être **un portrait officiel**, publié par **l'éditeur** (la marque qui produit ses pièces : Alessi, Serax, Vitra, HAY…) ou par **le créateur lui-même** (son site, celui de son studio). Jamais une image de revendeur (boutiques en ligne, Made in Design, Finnish Design Shop, Connox, Ambientedirect, etc.), de banque d'images, de Wikipedia/Wikimedia, de Pinterest ou de la presse.

## Ta tâche, pour chaque entrée de ton lot

1. Regarde le portrait actuel : `localPhoto` (chemin relatif à `/home/vercel-sandbox/mikadodecov2/`) avec l'outil Read. Il est recadré en 4:5, donc la source peut être plus large.
2. Retrouve **la même photo** sur une source officielle : page designer de l'éditeur, page « about » du créateur ou de son studio, espace presse officiel de l'éditeur ou du créateur. Télécharge les candidates (`curl -L -A "Mozilla/5.0"`) dans `/tmp/verify-<lot>/` et compare-les visuellement avec Read (même cadrage, même lumière, mêmes vêtements). Ne conclus « même photo » que si c'est clairement la même prise de vue.
3. Vérifie aussi que la photo actuelle montre bien la bonne personne (ou les membres du duo/studio).
4. Classe l'entrée :
   - `officielle` : même photo trouvée sur une source officielle. Note la page et l'URL de l'image.
   - `non-officielle` : la photo n'est trouvée que chez un revendeur, dans la presse, sur Wikimedia, une banque d'images… Note où.
   - `introuvable` : impossible de retrouver l'origine de cette photo.
   - `mauvaise-personne` : la photo ne montre pas ce créateur.
5. Si l'entrée n'est pas `officielle` : cherche un **portrait officiel de remplacement** (éditeur ou créateur). Conditions : vrai portrait où l'on voit bien le visage ; pour un duo ou un studio, ses membres ; au moins 600 px de large après un recadrage 4:5 ; plus grande version disponible. Télécharge-le dans `/home/vercel-sandbox/mikadodecov2/.context/designers/verify/photos/<slug>.<ext>`, vérifie-le avec `file` et en le regardant. S'il n'existe rien de convenable, n'en mets pas.

Conseils : vitra.com bloque les requêtes directes ; `https://r.jina.ai/<url>` permet de lire la page, puis on télécharge l'image depuis son serveur. Les sites des éditeurs utilisent souvent des CDN : prends l'URL originale sans paramètre de taille quand c'est possible. Ne passe pas plus de quelques minutes par entrée.

## Interdits

- Ne modifie **rien** dans le dépôt en dehors de `/home/vercel-sandbox/mikadodecov2/.context/designers/verify/`. Pas de git, pas de Shopify, ne touche pas à `v3/`.
- N'invente jamais une source : si tu n'as pas vu la photo sur la page, ce n'est pas `officielle`.

## Résultat

Écris `/home/vercel-sandbox/mikadodecov2/.context/designers/verify/result-<lot>.json` : un tableau, une entrée par créateur du lot, dans l'ordre :

```json
{
  "slug": "…",
  "verdict": "officielle | non-officielle | introuvable | mauvaise-personne",
  "sourceType": "éditeur | créateur | null",
  "sourcePage": "page où la même photo est publiée (ou null)",
  "imageUrl": "URL de l'image trouvée (ou null)",
  "foundElsewhere": "si non-officielle : où la photo apparaît (revendeur, presse…), sinon null",
  "notes": "une ou deux phrases en français",
  "replacement": null | { "file": ".context/designers/verify/photos/<slug>.jpg", "sourcePage": "…", "imageUrl": "…", "width": 0, "height": 0, "notes": "cadrage conseillé, crédit éventuel" }
}
```

Ta réponse finale : un court résumé en français (combien d'officielles, de non-officielles, d'introuvables, de remplacements trouvés, et les cas à faire valider).
