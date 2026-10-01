# Répertoire des créateurs

État du 30 septembre 2026.

## Données

`v3/designers-data.json` contient une fiche par créateur : `name`, `slug`, `tags`, `brands`, `bio`, `photo`, `sortKey`, `featured`, `hidden`. Les liens vers les marques sont calculés par `brandHref()` depuis `v3/mega-menu-brands.json` ; ne pas réintroduire `brandHrefs`. `sortKey` sert au classement et au libellé de l'index A-Z (nom de famille, ou nom du duo ou du studio).

La page `/produits.html?designer=<slug>` montre les produits qui portent l'un des `tags` de la fiche. Le premier tag est le slug ; les suivants sont les autres écritures du métachamp `custom.designer` (duo inversé, « et » ou « & », accents). La fiche produit relie le nom du créateur à sa page par ce même registre (`designerSlug()` dans `v3/navigation.mjs`), et une ancienne écriture dans l'URL redirige vers la fiche. Une page sans produit reste hors de l'index des moteurs, du sitemap et de `/designers.html` (annuaire A-Z et grands noms) : `activeDesignerSlugs()` dans `server.js` lit l'index commun du catalogue ; s'il est indisponible, la liste complète est gardée.

Un tag de créateur ne doit jamais être le tag d'une marque : la page afficherait tout le catalogue de la marque. `tests/designers-data.test.cjs` le vérifie.

## Tags Shopify

Le 30 septembre, avec l'accord du propriétaire pour les tags uniquement, le slug de la fiche a été ajouté (`tagsAdd`, aucun retrait) aux 63 produits actifs dont le métachamp nommait le créateur sans porter l'un de ses tags. Relevés avant/après et journal : `.context/designers/` de l'espace de travail concerné. Un produit qui porte déjà un tag de la fiche, même sous une autre écriture, n'est pas retagué.

Valeurs du métachamp qui ne sont pas des créateurs, laissées sans fiche : HAY, Ichendorf, Ferm Living, « Carl Hansen & Søn - Kitchen », studio blomus, Vitra Design Museum. À corriger à la source dans l'importer.

## Portraits

`v3/images/designers/<slug>.jpg` (4:5, 1200 × 1500 au plus) et `<slug>-640.webp` produit par `npm run images`. Le site appelle toujours la version `-640.webp` : une source plus étroite est portée à 640 px de large (agrandissement limité à 1,18×). Après `npm run images`, restaurer les bandeaux de marque si le script les a réencodés.

Un portrait est un vrai portrait officiel, publié par l'éditeur ou par le créateur ; jamais une image de revendeur, de banque d'images ou de presse. Pour un duo ou un studio, la photo montre ses membres ; si la seule photo officielle est en largeur et qu'un recadrage 4:5 coupe un visage, monter les membres côte à côte (deux bandes). S'il n'existe rien de convenable, la fiche reste sans photo. Chaque portrait a sa source dans `data/designer-photos.json` : le 1er octobre, les 212 portraits importés avant le 30 septembre ont été vérifiés (196 retrouvés chez l'éditeur ou le créateur, 16 remplacés par un portrait officiel : Wikimedia, presse, origine introuvable ou mauvaise personne).
