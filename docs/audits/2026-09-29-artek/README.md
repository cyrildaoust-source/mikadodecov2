# Audit de la marque Artek — 29 septembre 2026

Audit complet de la marque Artek sur Mikado Deco, produit par produit et variante par variante : photos, variantes, prix, tags, métachamps, textes, SEO, classement, canaux, logistique et rendu public. Le même jour, avec l'accord du propriétaire, les corrections ont été appliquées dans Shopify et sur le site, en deux lots.

Règle retenue par le propriétaire pour la vente en ligne : **montrer ce qu'on a**. On ne propose que des coloris précis et photographiés ; les autres tissus, cuirs et combinaisons se font sur commande ou en boutique.

## Fichiers

- [rapport.md](rapport.md) : les 26 constats critiques, les constats de marque, puis une fiche par produit (162) avec la référence Artek, un verdict et les constats avec leur statut.
- [constats.csv](constats.csv) : les 2 627 constats avec leur statut en fin de journée (corrigé, partiel, à faire), la preuve et la correction.
- [produits.csv](produits.csv), [variantes.csv](variantes.csv), [photos.csv](photos.csv) : état initial. Les numéros de photos (#n) cités dans le rapport renvoient à cet état.
- [reference-artek.csv](reference-artek.csv) : nom officiel, créateur, année, « Made in », matières, dimensions et variantes Artek, relevés pour chaque produit.
- [preuves/](preuves) et [preuves/apres/](preuves/apres) : planches-contacts avant et après correction, et captures du site en ligne.

## Résultat

| | Avant | Après |
| --- | ---: | ---: |
| Constats critiques | 26 | **1 partiel** (tissu H55 : qualité à confirmer) |
| Constats élevés | 368 | 94 à faire, 3 partiels |
| Contrôles automatiques (mêmes règles avant et après) | 1 668, dont 210 élevés | 778, dont 67 élevés |

Informations renseignées :

| Donnée | Avant (160 actives) | Après (162 actives) |
| --- | ---: | ---: |
| Créateur | 138 | 150 |
| Année | 64 | 140 |
| Dimensions | 42 | 119 |
| Matière | 24 | 105 |
| Usage | 108 | 162 |
| Origine | 109 | 149 |

Le nombre de fiches actives passe de 160 à 162 : le matelas et les coussins du lit 710 sont publiés. Les variantes passent de 645 à 601, après le remplacement des classes de prix Kiki par des coloris réels.

## Corrections appliquées

Toutes les modifications Shopify ont été précédées d'une sauvegarde. L'état complet d'origine est conservé dans l'espace de travail (`.context/artek-audit/backups/`, non versionné). Aucun fichier de la médiathèque n'a été supprimé : les photos retirées d'une fiche restent disponibles. Aucune commande ne contenait les variantes supprimées. Aucun stock ni statut de commande n'a été touché.

### Photos

- **11 fiches dont des variantes montraient une autre finition** : console Kaari REB006, table Kaari REB004, tables Aalto 90A et 81B, suspension A330S, lampadaire A811, chaise Rival, fauteuil Domus rembourré, tabouret de bar Atelier H75, tabouret de bar 64 H65, table pliante DL81C.
  - La bonne photo déjà présente a été reliée, ou une photo officielle Artek importée. Toutes ont été revérifiées à l'œil.
  - Pour la REB004, deux finitions sont illustrées par la photo Artek du Ø 80 cm de même finition : Artek ne publie pas le Ø 110 dans ces finitions.
  - Le fichier de la médiathèque « Rival…3D-knit-light-grey-cream_web.jpg » contient en réalité du cuir caramel (erreur à l'import) ; la bonne photo a été importée.
- **Galeries : 49 photos retirées ou déplacées**
  - éditions non vendues : banc 153B Kivet et Seireeni, lampadaire A810 Helsinki ;
  - tables enfant et chambres d'enfant sur les tables adultes ;
  - finitions non proposées (tabouret rose, Lukki beige, banc 167 cuir noir, Kiki linoléum, Tea Trolley 901 claire) ;
  - autre modèle au premier plan (fauteuil 402 sur la fiche 401) ;
  - doublon et fauteuil seul sur la fiche du repose-pieds Karuselli ;
  - ambiances de Domus rembourrées déplacées vers la bonne fiche, pot du petit modèle déplacé sur sa fiche.
- **Textes alternatifs** : 146 photos de variantes reprennent « produit — finition ». 426 photos d'ambiance ont reçu une description de ce qu'elles montrent, rédigée après examen de chaque image. Les fichiers partagés entre fiches n'ont pas été modifiés.

### « Montrer ce qu'on a »

- **Kiki** (fauteuil, canapés 2 et 3 places, bancs 1, 2 et 3 places). Les classes de prix F40…L60 sont remplacées par les coloris que montrent les photos officielles Artek, au prix de leur classe.
  - Classes Artek appliquées : Aura = F80, Hallingdal = F140, Sørensen Prestige = L40, Sørensen Elegance = L60, d'après la grille publiée par deux revendeurs Artek.
  - Le cuir noir des canapés est un Prestige, donc en L40 : 3 457 € au lieu de 3 981 € pour le 2 places, 4 918 € au lieu de 5 723 € pour le 3 places.
  - Descriptions réécrites, avec « autres tissus et cuirs sur commande ou en boutique ».
- **Lit de repos 710**
  - Le matelas et les coussins de dossier sont publiés dans les deux coloris photographiés : Hallingdal 65 750 bleu et 110 gris clair, classe F140, soit 1 393 € et 864 €. Leur coût d'achat reste à saisir.
  - La fiche du cadre indique « cadre seul » et renvoie vers eux.
- **Chaise Rival** : chaque variante indique son piètement photographié (asphalte ou bouleau naturel). Les combinaisons non vendues sont sorties de la galerie.
- **Karuselli et gamme Zebra** : le coloris vendu est indiqué (coque blanche et cuir noir ; noir/blanc).
- **Tissu H55** : le coloris « noir sur blanc » est indiqué.

### Informations fausses et données complétées

**Créateurs**
- Applique A910 : n'est plus attribuée à Alvar Aalto (Artek : « design Artek »).
- Zebra : « par Aino Aalto » retiré (motif anonyme).
- Tag `alvar-aalto` retiré de 8 affiches d'autres créateurs, de la sangle et des patins.
- Créateurs ajoutés : TSTO, Elissa Aalto (H55), Daniel Rybakken (miroir 124°), Bouroullec (Rivi), Alvar Aalto (Siena).

**Années**
- Aslak : 1958. A330S : 1937.
- 72 années ajoutées.

**Origines, selon le « Made in » Artek**
- Tables Aalto adultes et enfant : Finlande ; Finlande ou Allemagne pour les plateaux plaqués bouleau.
- Gamme Kaari : Allemagne et Pologne.
- A440 : Finlande et Pologne.
- Tables basses Kiki : Hongrie et Danemark.
- 25 autres origines ajoutées.

**Données complétées**
- 77 dimensions et 81 matières.
- Usage « Intérieur » sur toutes les fiches, selon le guide d'entretien Artek.
- Les valeurs marquées « à confirmer » n'ont pas été saisies.

**Libellés (136 sur 58 fiches)**
- Tabouret 60 et E60 : « Verni naturel / laqué orange », etc. pour l'assise seule laquée.
- Tables Aalto : « Lamifié blanc » et « Linoléum noir » harmonisés ; noyer « pieds bouleau, plateau placage chêne ».
- DL81C : « Linoléum bicolore argile/noyer », etc.
- Kaari : « Chêne laqué noir » ; références REB sur les étagères.
- Tea Trolley 901 : « Bouleau verni / plateaux…, roues blanches », et « Version Hella Jongerius ».
- Kiila, Mademoiselle (« Teinté noir »), tables basses Kiki.
- Luminaires : anneau, câble, « thermolaqué ».
- Objets et outils traduits : Secrets of Finland, cartes postales, outils d'architecte, patins.
- Bancs 153 : doublon de finition fusionné, plateau « Plein ».

**Types et titres**
- Tea Trolley → Desserte.
- Bar Stool 64 et Atelier sans dossier → Tabouret de bar.
- Fauteuil 43 → Chaise longue 43.
- Porte-revues Kanto ; lit de repos 710 « cadre seul » ; titres traduits.

**Textes**
- 27 descriptions corrigées :
  - banc 153B (décrivait l'édition Marimekko) ;
  - hauteurs des tabourets de bar ;
  - Kori (socle en zinc) ;
  - anneaux des A110 et AMA500 (acier laitonné) ;
  - Kiki (plateau HPL) ;
  - tissus au mètre ;
  - housses (garnissage vendu séparément) ;
  - Rope (patins) ;
  - miroir 124°, H55, Secrets of Finland, sangle (lien vers le guide Artek)…
- 37 textes SEO corrigés : mots anglais, années, longueur.

**Tags**
- 260 tags retirés : références anglaises, codes, recopies de libellés, « idee-cadeau » sur les pièces à plus de 1 000 €.
- 30 tags de décennie ajoutés.
- Conservés : les tags lus par le site (filtres, menu, créateurs, règles de collections).

**Divers**
- Poids de 3 g remis à 0.

### Classement et page marque

- Le paravent n'est plus dans Jardin (règle « Parasols & ombrages ») ; il rejoint Décoration avec les deux autres paravents d'intérieur (String, Serax).
- Types ajoutés aux règles du menu : Affiche, Housse de coussin, Étagère murale, Console, Porte-parapluie, Plafonnier. Cela concerne aussi 8 étagères murales d'autres marques.
- Produits Artek visibles par famille, vérifiés en ligne : Décoration 6 → 20, Rangement 8 → 14, Luminaires 19 → 20, Jardin 1 → 0.
- Collection « Alvar Aalto » : basée sur le tag créateur et les vases Aalto (42 → 89 produits, sans la verrerie d'Aino Aalto).
- Collection de travail « Claude — Modifs 2026-05-16 » dépubliée.
- Page marque Artek : présentation (fondation en 1935), SEO et alt de l'image.

### Code du site (PR #143 et #144)

- `v3/designers-data.json` : pages créateurs Ilmari Tapiovaara, TAF Studio, Yrjö Kukkapuro, Konstantin Grcic et Daniel Rybakken. Leurs noms deviennent cliquables sur les fiches. Artek est ajouté aux marques d'Alvar et Aino Aalto, d'Eero Aarnio et des Bouroullec.
- `v3/mega-menu-brands.json` : sous-entrées Artek remises sur des tags existants. Elles ne sont pas affichées par le menu actuel.

### Vérifications

- `node --test tests/*.test.*` : 170 réussis, 1 ignoré, 0 échec, dont les suites familles, tables et caractéristiques.
- Site en production, sans erreur console, contrôlé sur ordinateur (1440 px) et sur mobile (390 et 360 px) :
  - page créateur Tapiovaara ;
  - page marque Artek ;
  - canapé Kiki 3 places ;
  - console REB006, tabouret H75, table 90A.
- Aucun débordement horizontal.
- `scripts/detect-eyebrows.cjs` : aucun surtitre, ni sur les pages standard ni sur les pages Artek modifiées.
- La preview Vercel étant protégée par authentification, le contrôle visuel des pages créateurs a été fait sur la production, juste après la fusion.

## Ce qui reste à faire

### Décisions du propriétaire

1. **19 fiches sans rubrique du menu** : tissus au mètre et coupons, sacs, pochettes, sangle, patins, cartes postales, outils d'architecte, céramiques Secrets of Finland, lit de repos 710 et son matelas. Il faut soit créer des rubriques (« Sacs & pochettes », « Tissus & mercerie », « Papeterie »), soit les laisser sur la seule page Artek.
2. **Secrets of Finland et outils d'architecte** : faut-il un produit par objet, comme chez Artek ? Aujourd'hui, une seule fiche par collection.
3. **Tissu H55** : quelle qualité est vendue (coton, lin, laine) ? Faut-il le garder, s'il est arrêté chez Artek ?

### À confirmer avec Artek

- Références probablement arrêtées : Miroir 124°, tissu H55, tables enfant 80B et 80C H60.
- Tables enfant : prix identiques aux tables adultes ; les 80A et 81B H60 partagent les mêmes photos.
- Dimensions non saisies :
  - chaises 65, 66, 68, 69, 611, Domus, Aslak, Lukki, Atelier, Rope, Rival (largeur et profondeur incertaines) ;
  - Tupla, REB007, Buffet 250, AMA500, Kori lampadaire et lampe de table, applique A330S, lit 710, repose-pieds Karuselli.
- Libellés à vérifier : A811 (laiton ou acier nickelé), accoudoirs du Fauteuil 45.
- Coût d'achat du matelas et des coussins du lit 710.

### Données fournisseur

- Poids d'expédition : manquants sur la quasi-totalité des variantes, ce qui bloque la grille de livraison au poids.
- Codes EAN et codes douaniers.
- Données électriques des 15 luminaires qui n'en ont pas.

### Code du site

- `lib/shopify/product-mapper.js` : le champ `category` renvoie « objets » pour plusieurs types (canapés, suspensions, tabourets de bar…). Il n'est lu par aucune page aujourd'hui.

## Méthode

1. **Contrôles automatiques** sur l'Admin Shopify : environ 60 règles, calquées sur le fonctionnement réel du site (photo de carte, variante ouverte par défaut, galerie, dessins).
2. **Examen produit par produit** : chaque photo comparée à sa variante ; chaque fiche confrontée à artek.fi et aux fiches techniques PDF. Couverture complète : 162 produits, 645 variantes, 1 041 photos.
3. **Arbitrage, puis corrections par lots.** Pour chaque lot : simulation, sauvegarde, application, relecture dans Shopify, vérification visuelle et en ligne.

## Limites

- Les classes de prix Kiki viennent de la grille Artek publiée par des revendeurs. Les prix appliqués sont ceux déjà enregistrés pour chaque classe dans Shopify.
- Les prix n'ont pas été comparés au tarif Artek, qui n'est pas public.
- Le statut « arrêté » repose sur l'absence de la page sur artek.fi.
- Relevé et corrections du 29 septembre 2026.
