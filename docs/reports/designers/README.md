# Répertoire des créateurs : rapport de chantier (30 septembre – 7 octobre 2026)

Règles et fonctionnement du répertoire : `docs/DESIGNERS.md`. Ce dossier garde ce qui a servi à le construire, pour pouvoir le reprendre.

## Ce qui est en production

- PR #159 (1er octobre) puis #173 (6 octobre), fusionnées dans `main`.
- `v3/designers-data.json` : 565 fiches. Une fiche par créateur nommé dans le métachamp `custom.designer` d'un produit actif ou en brouillon ; Vlaemynck (marque du groupe Fermob) reste masqué.
- `/designers.html` ne liste que les créateurs ayant au moins un produit en ligne (334 au 7 octobre) ; les autres réapparaissent seuls quand leurs produits sont activés.
- Portraits : 501 fiches sur 565 en ont un, chacun avec sa source officielle dans `data/designer-photos.json`. Les 212 portraits plus anciens ont été vérifiés le 1er octobre (`verification/`).
- Shopify : tag créateur ajouté (`tagsAdd`, aucun retrait) à 63 produits le 30 septembre et 427 le 6 octobre, avec l'accord du propriétaire. Journaux : `tags/`. Relevés avant/après comparés : seuls les tags prévus ont changé.

## Contenu du dossier

| Fichier | Rôle |
| --- | --- |
| `a-corriger-importer.csv` | 115 valeurs du métachamp créateur à corriger dans l'importer (1 098 produits), avec la correction proposée. |
| `fiches-a-reprendre.csv` | Fiches sans portrait, sans bio ou à bio courte, avec la raison. |
| `canon.json` | Normalisation des valeurs du métachamp : `alias` (variante → fiche), `multi` (plusieurs fiches), `skip` (pas un créateur). Utilisé par `scripts/designers/plan-tags.py`. |
| `inventaire-2026-09-30.csv` | Inventaire de départ (produits actifs, fiche et photo avant/après). |
| `research/`, `research2/` | Résultats des recherches (vague 1 et 2) : bio, sources consultées, source du portrait, remarques et doutes. |
| `verification/` | Vérification de l'origine des 212 anciens portraits (verdict, source, remplacement). |
| `tags/` | Journaux des ajouts de tags Shopify (identifiant, handle, tags ajoutés, erreurs). |
| `briefs/` | Consignes données aux recherches (sources autorisées, ton des bios, critères des portraits). |

Les relevés bruts du catalogue et les photos d'origine sont restés hors Git (volumineux, régénérables avec `scripts/designers/export.mjs`).

## Scripts (`scripts/designers/`)

Écrits pour être lancés depuis un dossier de travail (`.context/designers/` pendant le chantier) ; les chemins relatifs sont à adapter.

- `export.mjs <sortie.json>` : relevé lecture seule des produits (`status:active` ; remplacer par `status:draft` pour les brouillons). Jeton lu dans `SHOPIFY_ADMIN_API_KEY`, jamais écrit.
- `plan-tags.py <relevé>` → `tag-plan.json` : produits dont le métachamp nomme un créateur sans porter un tag de sa fiche.
- `apply-tags.mjs <plan>` : `tagsAdd` uniquement (`--dry` pour simuler) ; écrit `tag-log.json`. Ne lancer qu'avec l'accord du propriétaire.
- `merge.py`, `merge2.py` : intègrent les résultats de recherche dans `v3/designers-data.json` et `data/designer-photos.json`.
- `process-photo.cjs <source> <slug> <cadrage>` : portrait 4:5 dans `v3/images/designers/` (cadrage `attention`, `x,y,l,h` ou `c:cx,cy,échelle`) ; puis `npm run images` et restaurer `v3/images/brands`.
- `montage.cjs` : deux membres côte à côte quand la seule photo officielle d'un duo est en largeur.
- `sheet.cjs` (planche contact), `cols.cjs`, `tap.cjs`, `visual-check.cjs` (contrôles de la preview à 1440, 390 et 360 px ; `PREVIEW_BYPASS` pour une preview protégée).

## Ce qui reste à faire

1. **Importer** : corriger les 115 valeurs de `a-corriger-importer.csv`. Tant que ce n'est pas fait, un nouveau produit importé avec une de ces valeurs doit être rattaché à la main (relancer `export.mjs`, `plan-tags.py`, `apply-tags.mjs`).
2. **Nouveaux créateurs** : à chaque nouvel import, relancer le relevé pour repérer les noms sans fiche (méthode : `inventaire.py`, puis recherches selon `briefs/`).
3. **Portraits manquants** (voir `fiches-a-reprendre.csv`) : notamment Mies van der Rohe, Marcel Breuer, Mart Stam (Thonet ne publie que de petites images), Schinkel (aucune photo), Milton Glaser, Ontwerpduo, Studio Habits, les Louis Poulsen et Serax sans version assez grande.
4. **À valider par le propriétaire** :
   - portraits agrandis de 1,16× (Louis Poulsen, 550 px : Eliasson, Flindt, Uchiyama, Moser, Wohlert, Lange) ; portraits tirés d'anciennes pages éditeur archivées (Willemot, Croonenberghs, Cardinael, Van Poucke, Boxy's, Bela Silva, Kelly Wearstler, Vuokko Eskolin-Nurmesniemi) ; portraits de fondations (Elissa Aalto, Frank Lloyd Wright, Bertoia) ; Pier Giacomo Castiglioni identifié par ressemblance ;
   - noms corrigés : « Nedda » → « Nedda El-Asmar », « Front Design » → « Front », « Jorgen Wolff » → « Jørgen Wolff » ;
   - attributions douteuses : verres Manhattan (Patrik Illo plutôt que Peter Šipoš ?), suspension Vela (Orlandini Design plutôt que Lucci & Orlandini ?), Patère Mood et suspension Gemstone (Pols Potten, HKliving), tabouret LOU (HEJU ne signe que les couleurs) ;
   - doublon Elisa Gargan / Elisa Giovannoni (même personne, deux fiches) ;
   - Wegner absent des « grands noms » malgré 99 produits en ligne.
