# Audit Artek — rapport détaillé (29 septembre 2026)

Synthèse, corrections effectuées et reste à faire : [README.md](README.md). Les positions de photos (#n) et les libellés cités sont ceux de l'état initial ; la colonne Statut indique l'état après les corrections du 29 septembre. Chaque constat, y compris les niveaux faible et info, figure dans [constats.csv](constats.csv) avec sa preuve et la correction proposée.

## 1. Les 26 constats critiques

Le client peut commander, voir ou recevoir autre chose que ce qui est annoncé.

| Statut | Produit | Variante / photo | Constat | Correction proposée ou effectuée |
| --- | --- | --- | --- | --- |
| ✅ corrigé | [Suspension A330S Golden Bell](https://www.mikadodeco.be/products/artek-a330s-golden-bell) | Laiton poli non verni · #1, #12 | La variante « Laiton poli non verni » (Savoy, 607 €) affiche la photo #1, qui montre le laiton poli verni à câble blanc (même image que la variante « Laiton poli » à 564 €). Le vrai packshot Savoy (#12, laiton plus chaud, câble noir) existe mais est rangé en galerie, donc affiché comme ambiance. Le client qui paie le supplément Savoy voit l'autre finition. | Lier #12 à « Laiton poli non verni » et #1 à « Laiton poli » seul ; alt #12 = « Suspension A330S Golden Bell — Laiton poli non verni (Savoy) ». |
| ✅ corrigé | [Lampadaire A811](https://www.mikadodeco.be/products/artek-a811-eu) | Laiton nickelé · #1, #3 | Précision sur SHARED_VARIANT_IMAGE : la variante « Laiton nickelé » affiche #1, qui montre le col et le tube en laiton doré, alors que le packshot de la version nickelée (#3, tube argenté) est déjà dans la fiche, rangé en galerie (donc affiché comme ambiance). | Lier #3 à la variante « Laiton nickelé », alt « Lampadaire A811 — Laiton nickelé » ; #1 reste liée à « Laiton poli » seule. |
| ✅ corrigé | [Table pliante Aalto DL81C 75/113 × 75 cm](https://www.mikadodeco.be/products/artek-aalto-table-foldable-dl81c) | Clay linoléum ; Pistachio linoléum ; Vapour linoléum · #5 | Précision sur le constat automatique : les variantes Clay, Pistachio et Vapour affichent un plateau linoléum NOIR, alors qu’Artek les vend en linoléum bicolore (argile/noyer, pistache/olive, vapeur/bleu fumé). Le client voit une autre finition que celle qu’il commande. | Importer les packshots Artek des trois éditions bicolores et les lier à leur variante ; en attendant, désactiver ces trois variantes. |
| ✅ corrigé | [Table Aalto 81B 120 × 75 cm](https://www.mikadodeco.be/products/artek-aalto-table-rectangular-81b) | Bouleau · #1 | La photo principale, qui est aussi l’image de la variante « Bouleau », montre une table au plateau environ deux fois plus long que profond, avec des pieds rapprochés des bouts : proportion d’une 80A (120 × 60) ou 81A (150 × 75), pas d’une 81B (120 × 75). Toutes les autres photos 81B (#7, #8, #9, #10) montrent un plateau nettement plus profond. Code exact de la table photographiée à confirmer. | Lier #10 (packshot officiel 81B bouleau) à la variante « Bouleau », en faire la photo principale et supprimer #1. |
| ✅ corrigé | [Table Aalto 90A Ø 100 cm](https://www.mikadodeco.be/products/artek-aalto-table-round-90a) | Bouleau verni naturel / lamifié blanc ; Bouleau verni naturel / linoléum noir · #4, #5 | Les images des variantes « Bouleau verni naturel / lamifié blanc » et « … / linoléum noir » sont des packshots de la table ENFANT 90A (H60, pieds nettement plus courts). Le client qui choisit ces finitions voit une table basse d’enfant au lieu de la table H74 vendue. | Lier #7 « Aalto-table-round-90A-white-laminate_web.jpg » au lamifié blanc et #6 « Aalto-Table-round-90A-black-linoleum_web.jpg » au linoléum noir, puis retirer #4 et #5 (ils appartiennent à la fiche artek-aalto-table-round-90a-60cm). |
| ✅ corrigé | [Lit de repos 710](https://www.mikadodeco.be/products/artek-day-bed-710-frame) | #1 | La photo principale #1 et la photo #2 montrent le Day Bed 710 garni d'un matelas et de coussins de dossier (bleus sur #1, gris clair sur #2). La fiche ne vend que le cadre en bouleau à lattes : le client voit un canapé-lit complet et reçoit un cadre nu. | Principale : packshot du cadre seul (bouleau à lattes, sans matelas). Garder #2 comme ambiance légendée « présenté avec matelas et coussins, vendus séparément ». |
| ✅ corrigé | [Lit de repos 710](https://www.mikadodeco.be/products/artek-day-bed-710-frame) |  | La description renvoie aux « fiches dédiées Mikado » pour le matelas et les coussins, mais ces deux fiches sont en brouillon (API 404, aucun canal). Le client ne peut acheter qu'un cadre à lattes inutilisable seul. | Publier le matelas et les coussins (avec photos et choix du tissu), ou vendre un ensemble cadre + matelas (+ coussins). Sinon, dépublier le cadre ou supprimer la phrase de renvoi. |
| ✅ corrigé | [Fauteuil Domus rembourré](https://www.mikadodeco.be/products/artek-domus-lounge-chair-upholstered) |  | La variante « Chêne — cuir noir » (2 750 €) est illustrée par un Domus rembourré en bouleau verni. Le nom du fichier le dit et le bois clair et lisse de la structure le confirme (comparé au packshot chêne #1 du Domus bois, au veinage marqué). Le client voit une autre essence que celle qu’il commande. | Remplacer #2 par le packshot Artek « oak, clear lacquer / leather upholstery, black » avec l’alt « Fauteuil Domus rembourré — Chêne — cuir noir ». Si c’est bien la version bouleau qui est commandée, renommer plutôt la variante « Bouleau — cuir noir ». |
| ✅ retiré de la vente en ligne | [Tissu H55 (au mètre)](https://www.mikadodeco.be/products/artek-h55-fabric) |  | Variante unique « Default Title » : le client ne peut choisir ni la qualité (coton, coton enduit, toile, laine/coton) ni le coloris (noir sur blanc / blanc sur noir) ; la commande est indéfinie. | Définir la qualité réellement proposée (titre « Tissu H55 laine/coton » par ex.) et une option Coloris ; sinon dépublier. |
| ✅ corrigé | [Console murale Kaari REB006](https://www.mikadodeco.be/products/artek-kaari-reb006) | Chêne — linoléum rouge, chant noir · #5 | La variante à montants chêne naturel affiche #5, qui montre des montants NOIRS (fichier « black-oak-red-Linoleum »). | Lier #6 (montants chêne naturel, linoléum rouge) à « Chêne — linoléum rouge, chant noir » et corriger l'alt. |
| ✅ corrigé | [Console murale Kaari REB006](https://www.mikadodeco.be/products/artek-kaari-reb006) | Teinté noir — linoléum rouge, chant noir · #6 | La variante à montants noirs affiche #6, qui montre des montants en chêne NATUREL (fichier « natural-oak-red-Linoleum »). | Lier #5 à « Teinté noir — linoléum rouge, chant noir » et corriger les deux alts. |
| ✅ corrigé | [Table Kaari REB004 Ø 110 cm](https://www.mikadodeco.be/products/artek-kaari-table-round-reb004) | Chêne — lamifié noir brillant · #7 | La variante lamifié noir brillant affiche #7 : plateau gris-bleu mat (fichier « clear-protective-varnish »), qui ressemble à du linoléum ; la bonne photo est #6 (chêne naturel, plateau noir brillant, fichier « natural-oak-black-HPL »). | Lier #6 à « Chêne — lamifié noir brillant ». |
| ✅ corrigé | [Table Kaari REB004 Ø 110 cm](https://www.mikadodeco.be/products/artek-kaari-table-round-reb004) | Chêne — linoléum noir · #6 | La variante linoléum noir affiche #6 = plateau lamifié noir brillant (fichier « natural-oak-black-HPL »). | Lier #7 (chêne naturel, plateau mat — linoléum noir à confirmer) ou un packshot Artek REB004 natural-oak-black-Linoleum. |
| ✅ corrigé | [Table Kaari REB004 Ø 110 cm](https://www.mikadodeco.be/products/artek-kaari-table-round-reb004) | Chêne noir — lamifié noir brillant · #8 | La variante chêne noir / lamifié noir brillant affiche #8 : plateau en linoléum BLEU (fichier « black-oak-blue-Linoleum »), finition non proposée ; aucune photo juste pour cette variante. | Importer le packshot Artek REB004 black-oak-black-HPL et le lier ; retirer #8 ou le laisser en galerie avec alt « finition non proposée ». |
| ☑ accepté (vente sur devis) | [Banc Kiki 1 place](https://www.mikadodeco.be/products/artek-kiki-bench-1-seater) |  | L'option « Revêtement » ne propose que des classes de prix (Tissu F40…F200, Cuir L40/L60), sans choix du tissu ni de la couleur. Le client paie sans pouvoir dire ce qu'il veut, et reçoit un revêtement « confirmé à la commande ». | Ajouter un champ obligatoire (propriété de ligne) « Tissu / cuir et coloris » avec la liste Artek par classe, ou limiter la vente en ligne à quelques coloris nommés (ex. Hallingdal 65 / 130). |
| ☑ accepté (vente sur devis) | [Banc Kiki 2 places](https://www.mikadodeco.be/products/artek-kiki-bench-2-seater) |  | L'option « Revêtement » ne propose que des classes de prix (Tissu F40…F200, Cuir L40/L60), sans choix du tissu ni de la couleur. Le client paie sans pouvoir dire ce qu'il veut, et reçoit un revêtement « confirmé à la commande ». | Ajouter un champ obligatoire (propriété de ligne) « Tissu / cuir et coloris » avec la liste Artek par classe, ou limiter la vente en ligne à quelques coloris nommés (ex. Hallingdal 65 / 407). |
| ☑ accepté (vente sur devis) | [Banc Kiki 3 places](https://www.mikadodeco.be/products/artek-kiki-bench-3-seater) |  | L'option « Revêtement » ne propose que des classes de prix (Tissu F40…F200, Cuir L40/L60), sans choix du tissu ni de la couleur. Le client paie sans pouvoir dire ce qu'il veut, et reçoit un revêtement « confirmé à la commande ». | Ajouter un champ obligatoire (propriété de ligne) « Tissu / cuir et coloris » avec la liste Artek par classe, ou limiter la vente en ligne à quelques coloris nommés (ex. Hallingdal 65 / 173). |
| ☑ accepté (vente sur devis) | [Fauteuil Kiki](https://www.mikadodeco.be/products/artek-kiki-lounge-chair) |  | Le client choisit une classe de prix (Tissu F40…F200, Cuir L40/L60) mais ni le tissu ni la couleur. La description renvoie à « confirmé à la commande ». Le choix obligatoire (quel tissu, quelle couleur) ne peut pas s’exprimer sur la fiche ni dans le panier. | Ajouter un champ obligatoire tissu/couleur (propriété de ligne ou option) avec la liste des tissus Artek par classe, ou limiter la fiche à des combinaisons précises photographiées (ex. « Tissu Aura vert chasseur », « Cuir Sörensen noir »). |
| ☑ accepté (vente sur devis) | [Fauteuil Kiki](https://www.mikadodeco.be/products/artek-kiki-lounge-chair) |  | Les six classes de tissu affichent le même fauteuil en tissu vert (#1, Aura hunter green chez Artek) et les deux classes de cuir le même cuir noir (#3). Le client est amené à croire qu’il recevra ce vert ou ce noir, quel que soit son choix, alors que la couleur n’est pas fixée. | Remplacer ces photos par un visuel neutre accompagné d’un nuancier, ou décrire la couleur (« photo : tissu Aura vert, autres coloris au choix »). |
| ☑ accepté (vente sur devis) | [Canapé Kiki 2 places](https://www.mikadodeco.be/products/artek-kiki-sofa-2-seater) |  | Le client choisit une classe de prix (Tissu F40…F200, Cuir L40/L60) mais ni le tissu ni la couleur. La description renvoie à « confirmé à la commande ». Le choix obligatoire (quel tissu, quelle couleur) ne peut pas s’exprimer sur la fiche ni dans le panier. | Ajouter un champ obligatoire tissu/couleur (propriété de ligne ou option) avec la liste des tissus Artek par classe, ou limiter la fiche à des combinaisons précises photographiées (ex. « Cuir Sörensen Prestige cognac », « Cuir Sörensen Prestige noir »). |
| ☑ accepté (vente sur devis) | [Canapé Kiki 2 places](https://www.mikadodeco.be/products/artek-kiki-sofa-2-seater) |  | Classe « Cuir L40 » = cuir cognac (#1) et classe « Cuir L60 » = cuir noir (#3) : l’image change de couleur quand on change de classe de prix. Le client croit que L40 = cognac et L60 = noir, alors que chez Artek le cognac comme le noir sont en cuir Sörensen Prestige. Les six classes de tissu partagent un tissu gris (#4). | Ne pas associer une couleur à une classe de prix : visuel neutre avec nuancier, ou variantes réelles « Cuir cognac » / « Cuir noir » (même classe) avec leur photo. |
| ☑ accepté (vente sur devis) | [Canapé Kiki 3 places](https://www.mikadodeco.be/products/artek-kiki-sofa-3-seater) |  | Le client choisit une classe de prix (Tissu F40…F200, Cuir L40/L60) mais ni le tissu ni la couleur. La description renvoie à « confirmé à la commande ». Le choix obligatoire (quel tissu, quelle couleur) ne peut pas s’exprimer sur la fiche ni dans le panier. | Ajouter un champ obligatoire tissu/couleur (propriété de ligne ou option) avec la liste des tissus Artek par classe, ou limiter la fiche à des combinaisons précises photographiées (ex. « Cuir Sörensen Prestige cognac », « Cuir Sörensen Prestige noir »). |
| ☑ accepté (vente sur devis) | [Canapé Kiki 3 places](https://www.mikadodeco.be/products/artek-kiki-sofa-3-seater) |  | Les six classes de tissu montrent un tissu jaune (#1, Aura canary chez Artek), la classe Cuir L40 du cuir cognac (#3) et la classe Cuir L60 du cuir noir (#4) : la couleur semble dépendre de la classe de prix, et le jaune paraît imposé pour tous les tissus. | Ne pas associer une couleur à une classe de prix : visuel neutre avec nuancier, ou variantes réelles « Cuir cognac » / « Cuir noir » (même classe) avec leur photo. |
| ✅ corrigé | [Chaise de bureau Rival KG002](https://www.mikadodeco.be/products/artek-rival-chair-kg002) | Maille 3D gris clair/crème · #1 | La photo principale, liée à « Maille 3D gris clair/crème », montre une assise en cuir lisse caramel sur structure bouleau naturel et coque blanche : ce n'est pas du tricot 3D. Le client qui choisit cette variante voit un cuir caramel. | Lier à « Maille 3D gris clair/crème » un packshot Artek « laqué blanc, coque blanche, 3D-knit gris/blanc » ; utiliser #1 pour une variante cuir caramel sur bouleau si elle est ajoutée. |
| ✅ corrigé | [Chaise de bureau Rival KG002](https://www.mikadodeco.be/products/artek-rival-chair-kg002) |  | Le piètement (bouleau naturel, laqué blanc ou laqué asphalte) est « précisé à la commande » dans la description, sans option : le client ne peut pas le choisir dans le panier, et chaque photo de variante montre une structure différente (naturel #1/#7, asphalte #6/#12), ce qui laisse croire que la couleur est liée au revêtement. | Ajouter une option « Piètement » (Bouleau naturel/« silver birch », Laqué blanc, Laqué asphalte) combinée au revêtement selon les combinaisons Artek, avec une photo par combinaison ; retirer la phrase de la description. |
| ✅ corrigé | [Chaise de bar Atelier H75](https://www.mikadodeco.be/products/chaise-de-bar-atelier-h75) | #1, #3, #6–#10 | Toutes les photos de variante de la version H75 sont celles du tabouret de 65 cm : la photo principale est le même packshot que H65 et les fichiers #6 à #10 s'appellent « Atelier-Bar-Stool-65-cm-… ». Le client voit la version basse et commande la haute. | Remplacer par les packshots Artek 75 cm de chaque finition ; garder #5 (deux hauteurs côte à côte) et retirer #3 (65 cm) de la fiche H75. |

## 2. Constats de marque (transverses)

| Statut | Gravité | Constat | Preuve | Correction |
| --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | La collection Shopify « Alvar Aalto » (règle : titre contient « Aalto ») affiche 33 modèles : elle inclut 15 produits Iittala/Vitra dont la verrerie et la vaisselle « Aino Aalto » (autre créatrice) et des miniatures Vitra, mais exclut la majorité des pièces d'Alvar Aalto dont le titre ne contient pas « Aalto » (Tabouret 60, chaises 65–69, fauteuils 41/42/400, luminaires A330S, A331…). | Admin : collection alvar-aalto, 42 membres, 27 Artek ; https://www.mikadodeco.be/collections/alvar-aalto (33 modèles) | Règle sur le tag alvar-aalto (après nettoyage des tags) ou sur custom.designer ; exclure les produits Aino Aalto. |
| ◐ partiel | élevé | 599 variantes sur 645 (152 produits sur 162) ont un poids d'expédition nul ; 2 variantes ont un poids de 3 g (Rocket laqué blanc, patère Kaari). La grille de livraison au poids validée ne peut pas s'appliquer à Artek. | Admin : inventoryItem.measurement.weight | Saisir le poids emballé par variante (fiches Artek / tarif fournisseur) ; corriger les deux valeurs en grammes. |
| ◐ partiel | élevé | Plusieurs types Artek ne sont retenus par aucune règle de collection du menu : Étagère murale (112, Kaari), Porte-parapluie (115), Console (Kaari REB006), Plafonnier (A622), Lit de repos et Matelas (710), Affiche (9), Housse de coussin (3), Tissu au mètre / Coupon de tissu (6), Sac, Pochette, Sangle, Accessoire. 35 fiches actives n'apparaissent dans aucune famille du site. À l'inverse, la règle « Parasols & ombrages » accepte le type Paravent et envoie le Paravent 100 dans la famille Jardin. | collections.json (règles) ; /api/catalog/<famille>?brand=artek : 47 + 41 + 19 + 8 + 6 + 2 + 1 fiches | Compléter les règles : Étagère murale → etageres-et-bibliotheques ; Porte-parapluie → pateres-et-porte-manteaux ; Console → etageres/commodes ; Plafonnier → suspensions ou luminaires ; Affiche → objets-decoratifs-cadres ; Housse de coussin → coussins-plaids-tapis ; retirer Paravent de parasols-ombrages. Décider pour tissus/sacs. |
| ✅ corrigé | moyen | Page créateur Alvar Aalto (/produits.html?designer=alvar-aalto, 91 modèles) : 14 fiches Artek qui ne sont pas d'Alvar Aalto y remontent par leur tag (8 affiches de Greige, TSTO, K. Hellberg, I. Bell ou sans auteur ; accessoires Siena sans créateur ; sangle ; patins feutre), ainsi que des vases Iittala. | https://www.mikadodeco.be/produits.html?designer=alvar-aalto | Retirer le tag alvar-aalto des produits qui ne sont pas de lui ; garder uniquement Alvar Aalto (et les motifs Siena si on décide de le créditer). |
| ✅ corrigé | moyen | Aucune page créateur pour Ilmari Tapiovaara alors que 19 fiches Artek lui sont attribuées (Domus, Kiki, Mademoiselle, Aslak, Lukki, Trienna) ; son nom n'est donc pas cliquable sur les fiches. Même situation pour TAF Studio (8 fiches), Yrjö Kukkapuro, Konstantin Grcic. | https://www.mikadodeco.be/produits.html?designer=ilmari-tapiovaara → 404 ; v3/designers-data.json | Ajouter ces créateurs à v3/designers-data.json (slug, tags) après nettoyage des tags créateur. |
| ✅ corrigé | moyen | Collection marque « Artek » : description vide, titre et méta-description SEO vides, photo sans texte alternatif (1304×652), aucun métachamp de marque (pays, ville, fondation, site…). La page marque publique n'a donc aucun texte éditorial propre à Artek. | Admin collection artek ; https://www.mikadodeco.be/collections/artek | Rédiger une présentation Artek (fondée en 1935 à Helsinki par Alvar et Aino Aalto, Maire Gullichsen et Nils-Gustav Hahl), SEO dédié, alt de l'image, métachamps de marque. |
| ⬜ à faire | moyen | Aucune variante n'a de code-barres (EAN/GTIN), de code SH douanier ni de pays d'origine sur l'article d'inventaire (0/645). 117 fiches sont publiées sur Facebook & Instagram sans identifiant produit ; l'origine n'existe qu'en métachamp texte. | Admin : barcode, harmonizedSystemCode, countryCodeOfOrigin | Importer les EAN Artek (tarif fournisseur) ; renseigner le pays d'origine sur l'article d'inventaire à partir des « Made in » vérifiés. |
| ✅ corrigé | moyen | La collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits dont 26 tables Artek) est publiée sur les 4 canaux, dont Facebook & Instagram et Point de vente. Le site l'exclut de ses pages filtrées, mais elle reste un ensemble public dans Shopify. | Admin : resourcePublications de la collection | Dépublier la collection de tous les canaux (ou la supprimer si elle n'a plus d'usage). |
| ✅ corrigé | faible | Données du méga-menu (v3/mega-menu-brands.json) : les sous-entrées Artek « Screen » (tag screen) et « Arm chair 41 » (tag arm-chair-41) ne correspondent à aucun produit (pages /collections/artek?tag=… à 0 modèle). Requalifié après vérification du code : ces sous-entrées ne sont plus affichées dans le menu (v3/mega-menu.js), aucun lien visible n'y mène. | https://www.mikadodeco.be/collections/artek?tag=screen et ?tag=arm-chair-41 (0 modèle, vérifié le 29 septembre) ; v3/mega-menu-brands.json | Fait : libellés et tags corrigés (« Tabouret 60 », « Paravent 100 » → screen-100, « Fauteuil 41 Paimio » → armchair-41-paimio) pour une éventuelle réactivation. |
| ◐ partiel | faible | Entrée « Stool 60 » du méga-menu (tag stool-60) : 2 modèles, le Tabouret 60 et l'affiche Tabouret 60 ; E60 et NE60 absents. Libellé anglais. | https://www.mikadodeco.be/collections/artek?tag=stool-60 | Libellé « Tabouret 60 » ; décider si E60/NE60 doivent y figurer (ajout du tag) et si l'affiche doit en sortir. |
| ⬜ à faire | faible | lib/shopify/product-mapper.js : CATEGORY_MAP ignore des types courants (Suspension, Plafonnier, Canapé, Chaise de bar, Tabouret de bar, Chaise de bureau, Table d'appoint, Buffet…) ; l'API /api/product renvoie alors category « objets ». Ce champ n'est lu par aucune page ni aucun filtre aujourd'hui (vérifié). | lib/shopify/product-mapper.js ; grep des usages | Compléter la table ou supprimer ce champ inutilisé. |
| ⬜ à faire | info | Les 645 variantes sont en « continuer à vendre hors stock » (vente sur commande) ; 5 variantes seulement ont du stock (1 pièce chacune). Cela rend commandables des articles probablement arrêtés chez Artek (Miroir 124, tissu H55, tables enfant 80B/80C H60). | Admin inventoryPolicy / inventoryQuantity | Passer en « arrêter la vente » ou dépublier les références arrêtées après confirmation fournisseur. |
| ⬜ à faire | info | Références artek.fi non vendues par Mikado (hors variantes regroupées) : Stool X602, Stool 60 Villi, éditions Stool 60 (Aizome, Celebration, Coloring, Kivet, Lokki, Seireeni), Bench 153B et Table 90D éditions, Cabinet 250 Celebration, Tea Trolley 901 Coloring, tissu Kirsikankukka, Pieces of Aalto. | artek.fi sitemap produits (145 pages) | Information pour l'assortiment ; aucune action obligatoire. |

## 3. Fiches produit

Pour chaque produit : référence fabricant, verdict de l'examen, puis les constats critiques, élevés et moyens. Les photos sont désignées par leur position dans Shopify (#1 = première).

### Tables Aalto

#### Table Aalto 80A 120 × 60 cm — `artek-aalto-table-rectangular-80a`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-rectangular-80a) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-rectangular) · Table · 3 variantes · 10 photos · familles du site : Tables  
Artek : Aalto Table rectangular — Table 80A · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : 120 × 60 cm, H 74 cm, plateau 4 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 0 critique, 3 élevé, 8 moyen, 4 faible, 2 info ; 11 corrigés le 29 septembre.  
**Verdict :** Photos de variantes justes (80A, 4 pieds, bonnes finitions), mais la bande d’ambiances mélange des packshots de la table enfant 80A H60 et une scène d’enfant avec une 81B ; dimensions, année, matière absentes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : 120 × 60 cm, H 74 cm, plateau 4 cm, 4 pieds L. | custom.dimensions = « L 120 × P 60 × H 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 3 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |
| ✅ corrigé | moyen | SEO |  | Méta-description avec un mot anglais (« rectangular ») repris du nom fournisseur. | Remplacer par la forme française (rectangulaire, carrée, ronde, pliante) et citer Alvar Aalto et l’année. |
| ✅ corrigé | moyen | Photos | #8, #9, #10 | Trois packshots de la table ENFANT 80A (H60, vendue sur la fiche artek-aalto-table-rectangular-80a-60cm) sont en galerie : ils apparaissent comme ambiances de la table adulte H74 et peuvent tromper sur la hauteur. | Retirer #8-#10 de cette fiche (ils existent sur la fiche enfant). |
| ✅ corrigé | moyen | Photos | #5 | Photo « Children’s Chair N65 and Aalto Table 81B in situ » : chaise enfant N65 et table enfant 81B (H60) dans une chambre d’enfant ; ni 80A ni table adulte. | Retirer #5. |

#### Table Aalto 80B 100 × 60 cm — `artek-aalto-table-rectangular-80b`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-rectangular-80b) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-rectangular) · Table · 3 variantes · 11 photos · familles du site : Tables  
Artek : Aalto Table rectangular — Table 80B · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : 100 × 60 cm, H 74 cm, plateau 4 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 0 critique, 3 élevé, 8 moyen, 4 faible, 2 info ; 11 corrigés le 29 septembre.  
**Verdict :** Packshots de variantes corrects (80B 100 × 60, 4 pieds), mais trois packshots de table enfant et une scène d’enfant polluent la galerie ; métachamps de dimensions, année et matière vides.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : 100 × 60 cm, H 74 cm, plateau 4 cm, 4 pieds L. | custom.dimensions = « L 100 × P 60 × H 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 3 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |
| ✅ corrigé | moyen | SEO |  | Méta-description avec un mot anglais (« rectangular ») repris du nom fournisseur. | Remplacer par la forme française (rectangulaire, carrée, ronde, pliante) et citer Alvar Aalto et l’année. |
| ✅ corrigé | moyen | Photos | #8, #9, #10 | Trois packshots de la table ENFANT 80B (H60) affichés comme ambiances de la table adulte H74. | Retirer #8-#10 (fiche enfant artek-aalto-table-rectangular-80b-60cm). |
| ✅ corrigé | moyen | Photos | #3 | Photo « Children’s Chair N65 and Aalto Table 81B in situ » : chaise enfant N65 et table enfant 81B (H60) dans une chambre d’enfant. | Retirer #3. |

#### Table Aalto 81A 150 × 75 cm — `artek-aalto-table-rectangular-81a`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-rectangular-81a) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-rectangular) · Table · 3 variantes · 8 photos · familles du site : Tables  
Artek : Aalto Table rectangular — Table 81A · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : 150 × 75 cm, H 74 cm, plateau 4 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 0 critique, 3 élevé, 9 moyen, 5 faible, 1 info ; 12 corrigés le 29 septembre.  
**Verdict :** Packshots de variantes corrects (81A 150 × 75), mais packshots enfant et scène d’enfant en galerie, alt de la photo principale générique et métachamps de dimensions, année et matière vides.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : 150 × 75 cm, H 74 cm, plateau 4 cm, 4 pieds L. | custom.dimensions = « L 150 × P 75 × H 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Photos | Bouleau | Alt de l’image de variante « Table Aalto 81A 150 × 75 cm — Artek » sans rapport avec la finition « Bouleau ». |  |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 3 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |
| ✅ corrigé | moyen | SEO |  | Méta-description avec un mot anglais (« rectangular ») repris du nom fournisseur. | Remplacer par la forme française (rectangulaire, carrée, ronde, pliante) et citer Alvar Aalto et l’année. |
| ✅ corrigé | moyen | Photos | #6, #7 | Deux packshots de la table ENFANT 81A (H60) en galerie de la table adulte. | Retirer #6-#7 (fiche enfant 81a-60cm). |
| ✅ corrigé | moyen | Photos | #3 | Photo « Children’s Chair N65 and Aalto Table 81B in situ » : chaise enfant N65 et table enfant 81B (H60) dans une chambre d’enfant. | Retirer #3. |

#### Table Aalto 81B 120 × 75 cm — `artek-aalto-table-rectangular-81b`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-rectangular-81b) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-rectangular) · Table · 4 variantes · 12 photos · familles du site : Tables  
Artek : Aalto Table rectangular — Table 81B · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : 120 × 75 cm, H 74 cm, plateau 4 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 1 critique, 3 élevé, 7 moyen, 7 faible, 2 info ; 13 corrigés le 29 septembre.  
**Verdict :** Photo principale et image « Bouleau » d’une autre proportion que la 81B (plateau 2:1 type 80A/81A), alors que le vrai packshot 81B bouleau (#10) dort en galerie ; libellés de variantes incohérents, photos enfant en galerie.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | critique | Photos | Bouleau · #1 | La photo principale, qui est aussi l’image de la variante « Bouleau », montre une table au plateau environ deux fois plus long que profond, avec des pieds rapprochés des bouts : proportion d’une 80A (120 × 60) ou 81A (150 × 75), pas d’une 81B (120 × 75). Toutes les autres photos 81B (#7, #8, #9, #10) montrent un plateau nettement plus profond. Code exact de la table photographiée à confirmer. | Lier #10 (packshot officiel 81B bouleau) à la variante « Bouleau », en faire la photo principale et supprimer #1. |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : 120 × 75 cm, H 74 cm, plateau 4 cm, 4 pieds L. | custom.dimensions = « L 120 × P 75 × H 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 4 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |
| ✅ corrigé | moyen | SEO |  | Méta-description avec un mot anglais (« rectangular ») repris du nom fournisseur. | Remplacer par la forme française (rectangulaire, carrée, ronde, pliante) et citer Alvar Aalto et l’année. |
| ✅ corrigé | moyen | Photos | #4, #5, #11, #12 | Deux packshots de la table ENFANT 81B (H60) et deux scènes de chambre d’enfant (N65 + 81B enfant) servent d’ambiances à la table adulte. | Retirer #4, #5, #11, #12 (fiche enfant 81b-60cm). |

#### Table Aalto 82A 150 × 85 cm — `artek-aalto-table-rectangular-82a`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-rectangular-82a) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-rectangular) · Table · 3 variantes · 7 photos · familles du site : Tables  
Artek : Aalto Table rectangular — Table 82A · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : 150 × 85 cm, H 74 cm, plateau 5 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 0 critique, 3 élevé, 7 moyen, 4 faible, 1 info ; 10 corrigés le 29 septembre.  
**Verdict :** Fiche saine côté photos (82A et finitions conformes) ; il manque les dimensions, l’année et la matière, et l’alt de la photo principale est générique.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : 150 × 85 cm, H 74 cm, plateau 5 cm, 4 pieds L. | custom.dimensions = « L 150 × P 85 × H 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Photos | Bouleau | Alt de l’image de variante « Table Aalto 82A 150 × 85 cm — Artek » sans rapport avec la finition « Bouleau ». |  |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 3 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |
| ✅ corrigé | moyen | SEO |  | Méta-description avec un mot anglais (« rectangular ») repris du nom fournisseur. | Remplacer par la forme française (rectangulaire, carrée, ronde, pliante) et citer Alvar Aalto et l’année. |

#### Table Aalto 82B 135 × 85 cm — `artek-aalto-table-rectangular-82b`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-rectangular-82b) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-rectangular) · Table · 3 variantes · 7 photos · familles du site : Tables  
Artek : Aalto Table rectangular — Table 82B · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : 135 × 85 cm, H 74 cm, plateau 5 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 0 critique, 3 élevé, 6 moyen, 3 faible, 2 info ; 9 corrigés le 29 septembre.  
**Verdict :** Photos et variantes conformes à la 82B ; lacunes de métachamps (dimensions, année, matière), poids et SEO.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : 135 × 85 cm, H 74 cm, plateau 5 cm, 4 pieds L. | custom.dimensions = « L 135 × P 85 × H 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 3 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |
| ✅ corrigé | moyen | SEO |  | Méta-description avec un mot anglais (« rectangular ») repris du nom fournisseur. | Remplacer par la forme française (rectangulaire, carrée, ronde, pliante) et citer Alvar Aalto et l’année. |

#### Table Aalto 83 182 × 91 cm — `artek-aalto-table-rectangular-83`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-rectangular-83) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-rectangular) · Table · 5 variantes · 10 photos · familles du site : Tables  
Artek : Aalto Table rectangular — Table 83 · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : 182 × 91 cm, H 74 cm, plateau 5 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 0 critique, 3 élevé, 7 moyen, 10 faible, 2 info ; 14 corrigés le 29 septembre.  
**Verdict :** Les cinq finitions Artek sont là avec leurs photos, mais le poids d’expédition est aberrant (74 000 kg), le libellé teinté noyer mélange l’anglais et la photo principale est la finition bouleau sauvage.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : 182 × 91 cm, H 74 cm, plateau 5 cm, 4 pieds L. | custom.dimensions = « L 182 × P 91 × H 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Options |  | Valeurs d’option en anglais/code : Bouleau teinté noyer / chêne veneer teinté noyer. |  |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ✅ corrigé | moyen | SEO |  | Méta-description avec un mot anglais (« rectangular ») repris du nom fournisseur. | Remplacer par la forme française (rectangulaire, carrée, ronde, pliante) et citer Alvar Aalto et l’année. |
| ✅ corrigé | moyen | Variantes | Bouleau teinté noyer / chêne veneer teinté noyer | Libellé « Bouleau teinté noyer / chêne veneer teinté noyer » : mot anglais « veneer » (constat auto confirmé). Artek décrit des pieds en bouleau teinté noyer et un plateau en chêne teinté noyer. Le libellé ne correspond pas à celui de la table 91 (« Bouleau teinté noyer ») pour la même finition. | « Teinté noyer (pieds bouleau, plateau placage chêne) », identique sur 83 et 91. |

#### Table Aalto 86 210 × 100 cm — `artek-aalto-table-rectangular-86`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-rectangular-86) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-rectangular) · Table · 3 variantes · 6 photos · familles du site : Tables  
Artek : Aalto Table rectangular — Table 86 · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : 210 × 100 cm, H 74 cm, plateau 5 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 0 critique, 3 élevé, 6 moyen, 3 faible, 2 info ; 9 corrigés le 29 septembre.  
**Verdict :** Photos et variantes conformes à la 86 (210 × 100) ; seules manquent les données (dimensions, année, matière, poids).

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : 210 × 100 cm, H 74 cm, plateau 5 cm, 4 pieds L. | custom.dimensions = « L 210 × P 100 × H 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 3 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |
| ✅ corrigé | moyen | SEO |  | Méta-description avec un mot anglais (« rectangular ») repris du nom fournisseur. | Remplacer par la forme française (rectangulaire, carrée, ronde, pliante) et citer Alvar Aalto et l’année. |

#### Table Aalto 86A 240 × 100 cm — `artek-aalto-table-rectangular-86a`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-rectangular-86a) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-rectangular) · Table · 3 variantes · 5 photos · familles du site : Tables  
Artek : Aalto Table rectangular — Table 86A · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : 240 × 100 cm, H 74 cm, plateau 5 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 0 critique, 3 élevé, 6 moyen, 4 faible, 2 info ; 9 corrigés le 29 septembre.  
**Verdict :** Photos de variantes conformes à la 86A ; une seule ambiance dont le code est inidentifiable ; métachamps incomplets.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : 240 × 100 cm, H 74 cm, plateau 5 cm, 4 pieds L. | custom.dimensions = « L 240 × P 100 × H 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 3 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |
| ✅ corrigé | moyen | SEO |  | Méta-description avec un mot anglais (« rectangular ») repris du nom fournisseur. | Remplacer par la forme française (rectangulaire, carrée, ronde, pliante) et citer Alvar Aalto et l’année. |

#### Table Aalto 80C 60 × 60 cm — `artek-aalto-table-square-80c`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-square-80c) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-square) · Table · 3 variantes · 9 photos · familles du site : Tables  
Artek : Aalto Table square — Table 80C · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : 60 × 60 cm, H 74 cm, plateau 4 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 0 critique, 3 élevé, 8 moyen, 2 faible, 2 info ; 10 corrigés le 29 septembre.  
**Verdict :** Packshots de variantes conformes (80C carrée, 4 pieds), mais des packshots enfant 80C et une scène d’enfant se trouvent en galerie ; métachamps incomplets.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : 60 × 60 cm, H 74 cm, plateau 4 cm, 4 pieds L. | custom.dimensions = « L 60 × P 60 × H 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 3 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |
| ✅ corrigé | moyen | SEO |  | Méta-description avec un mot anglais (« square ») repris du nom fournisseur. | Remplacer par la forme française (rectangulaire, carrée, ronde, pliante) et citer Alvar Aalto et l’année. |
| ✅ corrigé | moyen | Photos | #7, #8, #9 | Trois packshots de la table ENFANT 80C (H60) en galerie de la table H74. | Retirer #7-#9 (fiche enfant square-80c-60cm). |
| ✅ corrigé | moyen | Photos | #3 | Photo « Children’s Chair N65 and Aalto Table 81B in situ » : chaise enfant N65 et table enfant 81B (H60) dans une chambre d’enfant ; pas une table carrée 80C. | Retirer #3. |

#### Table Aalto 81C 75 × 75 cm — `artek-aalto-table-square-81c`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-square-81c) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-square) · Table · 3 variantes · 9 photos · familles du site : Tables  
Artek : Aalto Table square — Table 81C · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : 75 × 75 cm, H 74 cm, plateau 4 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 0 critique, 3 élevé, 8 moyen, 3 faible, 2 info ; 10 corrigés le 29 septembre.  
**Verdict :** Packshots de variantes conformes (81C carrée), mais packshots enfant, scène d’enfant rectangulaire et gros plan abstrait en galerie ; métachamps incomplets.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : 75 × 75 cm, H 74 cm, plateau 4 cm, 4 pieds L. | custom.dimensions = « L 75 × P 75 × H 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 3 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |
| ✅ corrigé | moyen | SEO |  | Méta-description avec un mot anglais (« square ») repris du nom fournisseur. | Remplacer par la forme française (rectangulaire, carrée, ronde, pliante) et citer Alvar Aalto et l’année. |
| ✅ corrigé | moyen | Photos | #6, #7, #8 | Trois packshots de la table ENFANT 81C (H60) en galerie. | Retirer #6-#8 (fiche enfant square-81c-60cm). |
| ✅ corrigé | moyen | Photos | #2 | Photo « Children’s Chair N65 and Aalto Table 81B in situ » : chaise enfant N65 et table enfant 81B (H60) dans une chambre d’enfant ; table rectangulaire, pas la 81C. | Retirer #2. |

#### Table Aalto 84 120 × 120 cm — `artek-aalto-table-square-84`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-square-84) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-square) · Table · 3 variantes · 6 photos · familles du site : Tables  
Artek : Aalto Table square — Table 84 · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : 120 × 120 cm, H 74 cm, plateau 4 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 0 critique, 3 élevé, 6 moyen, 3 faible, 2 info ; 9 corrigés le 29 septembre.  
**Verdict :** Photos et variantes conformes à la 84 (120 × 120, 4 pieds) ; un gros plan abstrait en galerie et des métachamps incomplets.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : 120 × 120 cm, H 74 cm, plateau 4 cm, 4 pieds L. | custom.dimensions = « L 120 × P 120 × H 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 3 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |
| ✅ corrigé | moyen | SEO |  | Méta-description avec un mot anglais (« square ») repris du nom fournisseur. | Remplacer par la forme française (rectangulaire, carrée, ronde, pliante) et citer Alvar Aalto et l’année. |

#### Table Aalto 90A Ø 100 cm — `artek-aalto-table-round-90a`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-round-90a) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-round) · Table · 4 variantes · 8 photos · familles du site : Tables  
Artek : Aalto Table round — Table 90A · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : Ø 100 cm, H 74 cm, plateau 4 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 1 critique, 3 élevé, 8 moyen, 6 faible, 2 info ; 14 corrigés le 29 septembre.  
**Verdict :** Les variantes lamifié blanc et linoléum noir affichent des photos de la table ENFANT 90A (H60), alors que les packshots adultes correspondants sont rangés en galerie ; libellés incohérents.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | critique | Photos | Bouleau verni naturel / lamifié blanc ; Bouleau verni naturel / linoléum noir · #4, #5 | Les images des variantes « Bouleau verni naturel / lamifié blanc » et « … / linoléum noir » sont des packshots de la table ENFANT 90A (H60, pieds nettement plus courts). Le client qui choisit ces finitions voit une table basse d’enfant au lieu de la table H74 vendue. | Lier #7 « Aalto-table-round-90A-white-laminate_web.jpg » au lamifié blanc et #6 « Aalto-Table-round-90A-black-linoleum_web.jpg » au linoléum noir, puis retirer #4 et #5 (ils appartiennent à la fiche artek-aalto-table-round-90a-60cm). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : Ø 100 cm, H 74 cm, plateau 4 cm, 4 pieds L. | custom.dimensions = « Ø 100 cm, hauteur 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 4 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |
| ✅ corrigé | moyen | SEO |  | Méta-description avec un mot anglais (« round ») repris du nom fournisseur. | Remplacer par la forme française (rectangulaire, carrée, ronde, pliante) et citer Alvar Aalto et l’année. |
| ✅ corrigé | moyen | Photos | #6, #7 | Les packshots adultes lamifié blanc et linoléum noir ne sont liés à aucune variante et s’affichent comme « ambiances ». | Les lier aux variantes (voir constat précédent). |
| ✅ corrigé | moyen | Photos | #8 | Packshot de la table enfant 90A bouleau en galerie. | Retirer #8. |

#### Table Aalto 90B Ø 75 cm — `artek-aalto-table-round-90b`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-round-90b) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-round) · Table · 4 variantes · 7 photos · familles du site : Tables  
Artek : Aalto Table round — Table 90B · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : Ø 75 cm, H 74 cm, plateau 4 cm, 3 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 0 critique, 3 élevé, 6 moyen, 6 faible, 2 info ; 10 corrigés le 29 septembre.  
**Verdict :** Photos et variantes conformes à la 90B (Ø 75, 3 pieds, 4 finitions Artek) ; libellés incohérents et métachamps incomplets.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : Ø 75 cm, H 74 cm, plateau 4 cm, 3 pieds L. | custom.dimensions = « Ø 75 cm, hauteur 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 4 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |
| ✅ corrigé | moyen | SEO |  | Méta-description avec un mot anglais (« round ») repris du nom fournisseur. | Remplacer par la forme française (rectangulaire, carrée, ronde, pliante) et citer Alvar Aalto et l’année. |

#### Table Aalto 91 Ø 125 cm — `artek-aalto-table-round-91`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-round-91) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-round) · Table · 4 variantes · 12 photos · familles du site : Tables  
Artek : Aalto Table round — Table 91 · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : Ø 125 cm, H 74 cm, plateau 5 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 0 critique, 3 élevé, 7 moyen, 7 faible, 2 info ; 11 corrigés le 29 septembre.  
**Verdict :** Photos conformes à la 91 (Ø 125, 4 pieds), mais la finition teinté noyer est mal nommée (plateau en chêne) ; galerie chargée et métachamps incomplets.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : Ø 125 cm, H 74 cm, plateau 5 cm, 4 pieds L. | custom.dimensions = « Ø 125 cm, hauteur 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 4 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |
| ✅ corrigé | moyen | SEO |  | Méta-description avec un mot anglais (« round ») repris du nom fournisseur. | Remplacer par la forme française (rectangulaire, carrée, ronde, pliante) et citer Alvar Aalto et l’année. |
| ✅ corrigé | moyen | Variantes | Bouleau teinté noyer | La variante « Bouleau teinté noyer » ne dit pas que le plateau est en placage chêne teinté noyer (seuls les pieds sont en bouleau teinté) ; la 83 nomme autrement cette même finition. | « Teinté noyer (pieds bouleau, plateau placage chêne) ». |

#### Table demi-ronde Aalto 95 120 × 60 cm — `artek-aalto-table-half-round-95`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-half-round-95) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-half-round) · Table · 3 variantes · 6 photos · familles du site : Tables  
Artek : Aalto Table half-round — Table 95 · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : 120 × 60 cm, H 74 cm, plateau 4 cm, 3 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 0 critique, 3 élevé, 5 moyen, 3 faible, 2 info ; 8 corrigés le 29 septembre.  
**Verdict :** Photos et variantes conformes à la 95 (demi-ronde 120 × 60, 3 pieds) ; seules des données manquent (dimensions, année dans les métachamps, matière, poids).

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : 120 × 60 cm, H 74 cm, plateau 4 cm, 3 pieds L. | custom.dimensions = « L 120 × P 60 × H 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 3 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |

#### Table demi-ronde Aalto 96 150 × 75 cm — `artek-aalto-table-half-round-96`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-half-round-96) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-half-round) · Table · 3 variantes · 4 photos · familles du site : Tables  
Artek : Aalto Table half-round — Table 96 · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : 150 × 75 cm, H 74 cm, plateau 4 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 0 critique, 3 élevé, 5 moyen, 4 faible, 2 info ; 7 corrigés le 29 septembre.  
**Verdict :** Packshots conformes à la 96 (demi-ronde 150 × 75, 4 pieds) ; aucune ambiance, et dimensions, année et matière absentes des métachamps.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : 150 × 75 cm, H 74 cm, plateau 4 cm, 4 pieds L. | custom.dimensions = « L 150 × P 75 × H 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 3 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |

#### Table à rallonge Aalto 97 135/190 × 85 cm — `artek-aalto-table-extendable-97`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-extendable-97) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-extendable) · Table · 2 variantes · 5 photos · familles du site : Tables  
Artek : Aalto Table extendable — Table 97 · Alvar Aalto · 1956 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : 135 × 85 cm fermée, 190 × 85 cm avec rallonge, H 74 cm, plateau 5 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 0 critique, 3 élevé, 6 moyen, 3 faible, 2 info ; 9 corrigés le 29 septembre.  
**Verdict :** Photos et finitions conformes (bouleau et lamifié blanc, seules finitions Artek pour la 97, conçue en 1956) ; il manque les dimensions, l’année dans les métachamps et la matière.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : 135 × 85 cm fermée, 190 × 85 cm avec rallonge, H 74 cm, plateau 5 cm, 4 pieds L. | custom.dimensions = « L 135 cm (190 cm avec rallonge) × P 85 cm × H 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1956 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1956 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 2 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |

#### Table pliante Aalto DL81C 75/113 × 75 cm — `artek-aalto-table-foldable-dl81c`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-foldable-dl81c) · [Fiche Artek](https://www.artek.fi/en/products/aalto-table-foldable) · Table · 6 variantes · 6 photos · familles du site : Tables  
Artek : Aalto Table foldable — Table DL81C · Alvar Aalto · 1933 · Made in Finlande (plateaux HPL et linoléum) ; Finlande et Allemagne (plateaux placage bouleau) · en catalogue  
Dimensions Artek : 75 × 75 cm abattant replié, 112,5 × 75 cm abattant déplié, H 74 cm, plateau 4 cm, 4 pieds L (dessin coté artek.fi + https://www.artek.fi/downloads/Artek-Aalto-Tables_shapes-sizes-surfaces.pdf)  
Constats : 1 critique, 4 élevé, 9 moyen, 5 faible, 1 info ; 15 corrigés le 29 septembre.  
**Verdict :** Les trois linoléums bicolores en édition limitée affichent la photo du linoléum noir et portent des libellés anglais tronqués ; la variante lamifié blanc n’a qu’une ambiance comme image.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | critique | Photos | Clay linoléum ; Pistachio linoléum ; Vapour linoléum · #5 | Précision sur le constat automatique : les variantes Clay, Pistachio et Vapour affichent un plateau linoléum NOIR, alors qu’Artek les vend en linoléum bicolore (argile/noyer, pistache/olive, vapeur/bleu fumé). Le client voit une autre finition que celle qu’il commande. | Importer les packshots Artek des trois éditions bicolores et les lier à leur variante ; en attendant, désactiver ces trois variantes. |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Photos |  | Une même photo (Aalto-Table-foldable-DL81C-folded_-legs-natural-lacquered_-top-black-linoleum_cut-out_web.jpg) sert à 4 finitions différentes : Linoléum noir \| Clay linoléum \| Pistachio linoléum \| Vapour linoléum. | Associer à chaque finition sa propre photo. |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (constat auto confirmé) alors que custom.search_facts contient déjà les cotes ; la fiche publique n’affiche aucune dimension (API site : dimensions ""). Cotes Artek : 75 × 75 cm abattant replié, 112,5 × 75 cm abattant déplié, H 74 cm, plateau 4 cm, 4 pieds L. | custom.dimensions = « L 75 cm (112,5 cm abattant déplié) × P 75 cm × H 74 cm » |
| ✅ corrigé | élevé | Métachamps | Bouleau | custom.origin « Fabriqué en Finlande » et le tag made-in-finlande valent pour toutes les finitions, or Artek indique que les plateaux en placage bouleau sont fabriqués en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateaux lamifié et linoléum) ; Finlande ou Allemagne (plateaux placage bouleau) » |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Options |  | Valeurs d’option en anglais/code : Clay linoléum \| Pistachio linoléum \| Vapour linoléum. |  |
| ✅ corrigé | moyen | Métachamps |  | custom.year et custom.material vides (constats auto confirmés) : valeurs à saisir. | custom.year = 1933 ; custom.material = « Pieds et chant du plateau en bouleau massif ; âme du plateau en bouleau massif, aggloméré ou nid d'abeille ; surface en placage bouleau, stratifié HPL blanc « IKI » ou linoléum » |
| ⬜ à faire | moyen | Variantes |  | Poids d’expédition à 0 kg sur les 6 variantes (meuble volumineux). | Saisir le poids emballé fourni par Artek pour chaque variante. |
| ✅ corrigé | moyen | SEO |  | Méta-description avec un mot anglais (« foldable ») repris du nom fournisseur. | Remplacer par la forme française (rectangulaire, carrée, ronde, pliante) et citer Alvar Aalto et l’année. |
| ✅ corrigé | moyen | Variantes | Clay linoléum | Les libellés « Clay linoléum », « Pistachio linoléum » et « Vapour linoléum » sont en anglais et incomplets : ils ne disent pas qu’il s’agit d’éditions limitées bicolores ni quelle est la seconde teinte. | « Linoléum bicolore argile/noyer », « Linoléum bicolore pistache/olive », « Linoléum bicolore vapeur/bleu fumé » ; remplacer aussi les tags clay-linoleum, pistachio-linoleum et vapour-linoleum. |
| ⬜ à faire | moyen | Photos | Lamifié blanc · #4 | L’image de la variante « Lamifié blanc » est un gros plan d’ambiance recadré (tasse, assiette, chaises) et non un packshot : la table entière n’apparaît pas. | Utiliser le packshot Artek DL81C lamifié blanc et laisser #4 en ambiance. |

### Tabourets, mobilier enfant et chaises de bar

#### Tabouret 60 — `artek-stool-60`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-stool-60) · [Fiche Artek](https://www.artek.fi/en/products/stool-60) · Tabouret · 17 variantes · 22 photos · familles du site : Assises  
Artek : Stool 60 · Alvar Aalto · 1933 · Made in Finland · en catalogue  
Dimensions Artek : Ø assise 35 cm, encombrement 38 cm, H 44 cm (cotes lues dans les identifiants « number_* » du schéma SVG « Materials and Dimensions » de la page artek.fi ; fiche PDF https://www.artek.fi/downloads/Stool-60-Stool-E60-Childrens-Stool-NE60-Factsheet-1842298.pdf : 38 × H44)  
Constats : 0 critique, 1 élevé, 6 moyen, 5 faible, 3 info ; 11 corrigés le 29 septembre.  
**Verdict :** Fiche globalement juste (3 pieds sur toutes les photos, chaque finition a sa photo conforme) ; le principal défaut est l'ambiguïté des libellés « Laqué … » (assise seule ou tabouret entier) et une photo de galerie d'une assise rose non vendue.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1933 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ⬜ à faire | moyen | Photos |  | Image basse définition 882×882 (variante) : packshot-e01e0255019639aedaa350c2702d0f61.png. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ✅ corrigé | moyen | Variantes |  | Les libellés « Laqué orange / jaune / vert / pétrole / rouge / bleu / gris » désignent chez Artek des pieds en bouleau verni naturel avec seule l'assise laquée (photos conformes), alors que « Laqué blanc » et « Laqué noir », écrits de la même façon, désignent un tabouret entièrement laqué (pieds + assise). En parallèle « Verni naturel / laqué noir\|blanc » désigne l'assise seule. Le client ne peut pas deviner, à la seule lecture, que « Laqué orange » a des pieds naturels et que « Laqué noir » a des pieds noirs. | Renommer de façon systématique : « Pieds naturels / assise laquée orange » (idem jaune, vert, pétrole, rouge, bleu, gris, blanc, noir) et « Entièrement laqué blanc » / « Entièrement laqué noir ». Idem pour « Lamifié blanc » → « Pieds naturels / assise lamifiée blanche », « Linoléum noir » → « Pieds naturels / assise linoléum noir ». Mettre les alts à jour en conséquence. |
| ✅ corrigé | moyen | Photos | #21 | La photo de galerie #21 est un packshot d'un Tabouret 60 à assise rose pâle, finition qui n'est proposée ni par la fiche ni dans la liste de variantes Artek actuelle. Non liée à une variante, elle apparaît dans la bande « ambiances » et laisse croire qu'un rose existe. | Supprimer la photo #21 (ou ne la garder que si la finition rose est réellement commandable, en créant alors la variante). |

#### Tabouret E60 — `artek-stool-e60`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-stool-e60) · [Fiche Artek](https://www.artek.fi/en/products/stool-e60) · Tabouret · 17 variantes · 24 photos · familles du site : Assises  
Artek : Stool E60 · Alvar Aalto · 1934 · Made in Finland · en catalogue  
Dimensions Artek : Ø assise 35 cm, encombrement 42 cm, H 44 cm (cotes lues dans les identifiants « number_* » du schéma SVG « Materials and Dimensions » de la page artek.fi)  
Constats : 0 critique, 1 élevé, 6 moyen, 6 faible, 3 info ; 9 corrigés le 29 septembre.  
**Verdict :** Toutes les photos de variantes montrent bien 4 pieds et la bonne combinaison ; mêmes libellés « Laqué … » ambigus que le Tabouret 60, année 1934 absente et galerie encombrée d'ambiances où le E60 est secondaire.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Photos | Bouleau sauvage | Alt de l’image de variante « Tabouret E60 — Artek » sans rapport avec la finition « Bouleau sauvage ». |  |
| ⬜ à faire | moyen | Photos |  | Image basse définition 925×925 (variante) : packshot-76bca4ffa95ed6008d9355fbf890ca3c.png. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ✅ corrigé | moyen | Variantes |  | Les libellés « Laqué orange / jaune / vert / pétrole / rouge / bleu / gris » désignent chez Artek des pieds en bouleau verni naturel avec seule l'assise laquée (photos conformes), alors que « Laqué blanc » et « Laqué noir », écrits de la même façon, désignent un tabouret entièrement laqué (pieds + assise). En parallèle « Verni naturel / laqué noir\|blanc » désigne l'assise seule. Le client ne peut pas deviner, à la seule lecture, que « Laqué orange » a des pieds naturels et que « Laqué noir » a des pieds noirs. | Renommer de façon systématique : « Pieds naturels / assise laquée orange » (idem jaune, vert, pétrole, rouge, bleu, gris, blanc, noir) et « Entièrement laqué blanc » / « Entièrement laqué noir ». Idem pour « Lamifié blanc » → « Pieds naturels / assise lamifiée blanche », « Linoléum noir » → « Pieds naturels / assise linoléum noir ». Mettre les alts à jour en conséquence. |
| ✅ corrigé | moyen | Description |  | La description et le SEO ne donnent pas l'année de création (1934) ; la seule année citée est 2024 (garantie), ce qui peut être lu comme une date de création. | Ajouter « dessiné en 1934 » dans la description et « (1934) » dans la méta-description ; custom.year = 1934 ; ajouter le tag « annees-1930 » (présent sur Tabouret 60 et NE60). |

#### Tabouret enfant NE60 — `artek-childrens-stool-ne60`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-childrens-stool-ne60) · [Fiche Artek](https://www.artek.fi/en/products/childrens-stool-ne60) · Tabouret · 3 variantes · 3 photos · familles du site : Assises  
Artek : Children's Stool NE60 · Alvar Aalto · 1934 · Made in Finland · en catalogue  
Dimensions Artek : H 38 cm, encombrement 38 cm (cotes lues dans les identifiants « number_* » du schéma SVG « Materials and Dimensions » de la page artek.fi : 38 / 38 ; fiche PDF https://www.artek.fi/downloads/Stool-60-Stool-E60-Childrens-Stool-NE60-Factsheet-1842298.pdf : 38 × H38)  
Constats : 0 critique, 1 élevé, 5 moyen, 4 faible, 2 info ; 5 corrigés le 29 septembre.  
**Verdict :** Photos correctes (4 pieds, proportions basses cohérentes : rapport H/L ≈ 1,1 contre 1,27 pour le E60) et finitions exactes ; problèmes : prix identiques au E60 adulte, aucune dimension ni poids.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1934 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ⬜ à faire | moyen | Prix |  | Le tabouret enfant NE60 est vendu exactement au prix du Tabouret E60 adulte dans les trois finitions communes (311 € bouleau, 342 € lamifié / linoléum), coûts identiques aussi. C'est plausible (mêmes composants, pieds plus courts) mais à confirmer sur la liste de prix Artek. | Vérifier le tarif Artek NE60 et le coût d'achat ; corriger si différent. |

#### Chaise de bar K65 — `artek-high-chair-k65`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-high-chair-k65) · [Fiche Artek](https://www.artek.fi/en/products/high-chair-k65) · Chaise de bar · 5 variantes · 7 photos · familles du site : Assises  
Artek : High Chair K65 · Alvar Aalto · 1935 (fiche PDF 2014 : 1936) · Made in Finland · en catalogue  
Dimensions Artek : H 70 cm, hauteur d'assise 59,5 cm, 40 cm (cotes lues dans les identifiants « number_* » du schéma SVG « Materials and Dimensions » de la page artek.fi : 70 / 59,5 / 40 / 30 ; fiche PDF https://www.artek.fi/downloads/Bar-Stool-64-High-Chair-K65-Factsheet-1848397.pdf : 60 et 70)  
Constats : 0 critique, 1 élevé, 3 moyen, 8 faible, 2 info ; 3 corrigés le 29 septembre.  
**Verdict :** Photos toutes conformes (dossier bas, repose-pieds, 5 finitions bien représentées) ; manquent l'année, la hauteur d'assise (≈ 60 cm, pas 65) et le classement site tombe en « objets ».

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Description |  | Le nom « K65 » peut faire croire à une hauteur d'assise de 65 cm (comme le Tabouret de bar 64 H65 voisin) ; Artek indique 59,5 cm d'assise et 70 cm hors tout. Aucune hauteur n'est affichée sur la fiche, alors qu'elle est décisive pour un plan de travail. | custom.dimensions = « H 70 cm, hauteur d'assise 59,5 cm, l. 40 cm » ; custom.seat_height_cm = 59.5 ; ajouter dans la description « pour plans de travail d'environ 85-90 cm ». |

#### Tabouret de bar Rocket — `artek-rocket-bar-stool`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-rocket-bar-stool) · [Fiche Artek](https://www.artek.fi/en/products/rocket-bar-stool) · Tabouret de bar · 3 variantes · 5 photos · familles du site : Assises  
Artek : Rocket Bar Stool · Eero Aarnio · 1995 · Made in Lithuania · en catalogue  
Dimensions Artek : H 73 cm, encombrement 44 cm (cotes lues dans les identifiants « number_* » du schéma SVG « Materials and Dimensions » de la page artek.fi : 73 / 44 ; fiche PDF https://www.artek.fi/downloads/Baby-Rocket-Stool-Rocket-Bar-Stool-Factsheet-1847906.pdf)  
Constats : 0 critique, 2 élevé, 3 moyen, 7 faible, 1 info ; 8 corrigés le 29 septembre.  
**Verdict :** Finitions, origine (Lituanie), créateur et hauteur 73 cm exacts ; photos conformes. Il manque l'année 1995 et le poids de la variante blanche est aberrant (3 g) ; la fiche tombe en « objets » sur le site.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Logistique | Laqué blanc | Poids d'expédition de 3 g : Laqué blanc (ART-RBS-28000704) (probablement 3 kg saisi en grammes). | Corriger le poids (kg, pas g). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ◐ partiel | moyen | Variantes |  | La variante Laqué blanc a un poids d'expédition de 3 g, les deux autres 0 g : poids faux ou absent pour un tabouret en chêne massif. | Saisir le poids réel (plusieurs kg) sur les 3 variantes, dans l'unité kg. |

#### Chaise enfant N65 — `artek-childrens-chair-n65`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-childrens-chair-n65) · [Fiche Artek](https://www.artek.fi/en/products/childrens-chair-n65) · Chaise · 3 variantes · 5 photos · familles du site : Assises  
Artek : Children's Chair N65 · Alvar Aalto · 1935 · Made in Finland · en catalogue  
Dimensions Artek : l. 35 cm, P. 38 cm, hauteur d'assise 37,5 cm, H 60 cm (cotes lues dans les identifiants « number_* » du schéma SVG « Materials and Dimensions » de la page artek.fi : 35 / 38 / 37,5 / 60 ; fiche PDF https://www.artek.fi/downloads/Chair-65-Childrens-Chair-N65-Factsheet-1843105.pdf)  
Constats : 0 critique, 1 élevé, 4 moyen, 6 faible, 2 info ; 7 corrigés le 29 septembre.  
**Verdict :** Fiche exacte (1935, dossier bas, 3 finitions conformes aux photos) ; prix strictement identiques à la Chaise 65 adulte, pas de dimensions ni de poids, et deux tags hors sujet.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1935 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ⬜ à faire | moyen | Prix |  | La chaise enfant N65 est vendue au prix exact de la Chaise 65 adulte (441 € bouleau, 471 € lamifié / linoléum, mêmes coûts). C'est plausible mais à confirmer. | Vérifier le tarif Artek et le coût d'achat de la N65. |

#### Table enfant Aalto 80A 120 × 60 cm H60 — `artek-aalto-table-rectangular-80a-60cm`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-rectangular-80a-60cm) · [Fiche Artek](https://www.artek.fi/en/products/aalto-childrens-table-rectangular) · Table · 3 variantes · 4 photos · familles du site : Tables  
Artek : Aalto Children's Table rectangular 80A · Alvar Aalto · 1933 · Made in Plateau bouleau : Finlande et Allemagne ; plateau HPL ou linoléum : Finlande · en catalogue  
Dimensions Artek : 120 × 60 cm, H 60 cm (cotes lues dans les identifiants « number_* » du schéma SVG « Materials and Dimensions » de la page artek.fi : 60 / 60 / 4 / 103,5 / 120)  
Constats : 0 critique, 2 élevé, 8 moyen, 6 faible, 1 info ; 3 corrigés le 29 septembre.  
**Verdict :** Modèle, taille, hauteur et finitions conformes à Artek ; mais les trois photos de variantes sont les mêmes images que celles de la table 81B (120 × 75), donc au moins une des deux fiches montre une mauvaise profondeur.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Photos | #1, #3, #4 | Les images #1 (Bouleau), #3 (Lamifié blanc) et #4 (Linoléum noir) sont identiques, à la retouche près, à celles de la table enfant 81B 120 × 75 (écart moyen de pixels 0,3 à 1,3 sur 255). Deux tables de profondeurs différentes (60 et 75 cm) ne peuvent pas avoir la même photo : l'une des deux fiches montre le mauvais plateau (à confirmer avec les fichiers Artek d'origine). | Récupérer sur l'espace médias Artek les packshots distincts 80A et 81B en hauteur 60 cm, et remplacer ceux de la fiche erronée. |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ⬜ à faire | moyen | Classement |  | Table enfant typée « Table » : elle entre dans la famille Tables comme une table de repas (catégorie Shopify : Dining Tables). | Type « Table enfant » ou tag dédié, et catégorie Shopify Kids Tables. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Description |  | Description identique à artek-aalto-table-rectangular-80b-60cm, artek-aalto-table-rectangular-81a-60cm, artek-aalto-table-rectangular-81b-60cm, artek-aalto-table-square-81c-60cm, artek-aalto-table-round-90a-60cm. | Rédiger une description propre à chaque taille/version. |
| ⬜ à faire | moyen | Prix |  | Prix identique à la version adulte artek-aalto-table-rectangular-80a (1152.0 € vs 1152.0 €) ; vérifier le tarif Artek de la hauteur 60 cm. |  |
| ◐ partiel | moyen | Photos | #2 | La seule ambiance (#2) est un gros plan d'une table enfant 81B avec des chaises N65 : on ne voit pas le modèle vendu (80A 120 × 60 cm H60). | Remplacer par une ambiance du modèle réel si elle existe, sinon garder mais avec l'alt « Table enfant Aalto 81B et chaises N65 (illustration de la gamme) ». |

#### Table enfant Aalto 80B 100 × 60 cm H60 — `artek-aalto-table-rectangular-80b-60cm`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-rectangular-80b-60cm) · [Fiche Artek](https://www.artek.fi/en/products/aalto-childrens-table-rectangular) · Table · 3 variantes · 4 photos · familles du site : Tables  
Artek : Aalto Table rectangular 80B (pas en version enfant sur artek.fi) · Alvar Aalto · 1933 · Made in Plateau bouleau : Finlande et Allemagne ; plateau HPL ou linoléum : Finlande · introuvable en version enfant sur artek.fi (à confirmer auprès d'Artek)  
Dimensions Artek : Adulte 80B : 100 × 60 cm, H 74 cm (cotes lues dans les identifiants « number_* » du schéma SVG « Materials and Dimensions » de la page artek.fi, aalto-table-rectangular) ; aucune version H60 publiée  
Constats : 0 critique, 2 élevé, 10 moyen, 9 faible, 1 info ; 7 corrigés le 29 septembre.  
**Verdict :** Modèle 80B en hauteur 60 cm absent de la gamme enfant publiée par Artek (qui ne propose que 80A, 81A et 81B), avec en plus une finition libellée « Iki blanc hp » ; le produit doit être confirmé auprès d'Artek avant d'être vendu.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Données fabricant |  | La page Artek « Aalto Children's Table rectangular » ne propose en hauteur 60 cm que les modèles 80A, 81A et 81B. Le 80B enfant (100 × 60, H60) n'y figure pas, même si les noms de fichiers des photos (« Aalto-Children_s-Table-rectangular-80B… ») laissent penser qu'il a existé. Le client peut commander un modèle que le fournisseur ne livre peut-être plus. | Confirmer auprès d'Artek que le 80B H60 est encore commandable (tarif, code) ; sinon passer la fiche en brouillon. |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ⬜ à faire | moyen | Classement |  | Table enfant typée « Table » : elle entre dans la famille Tables comme une table de repas (catégorie Shopify : Dining Tables). | Type « Table enfant » ou tag dédié, et catégorie Shopify Kids Tables. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Description |  | Description identique à artek-aalto-table-rectangular-80a-60cm, artek-aalto-table-rectangular-81a-60cm, artek-aalto-table-rectangular-81b-60cm, artek-aalto-table-square-81c-60cm, artek-aalto-table-round-90a-60cm. | Rédiger une description propre à chaque taille/version. |
| ✅ corrigé | moyen | Options |  | Valeurs d’option en anglais/code : Iki blanc hp. |  |
| ⬜ à faire | moyen | Prix |  | Prix identique à la version adulte artek-aalto-table-rectangular-80b (1069.0 € vs 1069.0 €) ; vérifier le tarif Artek de la hauteur 60 cm. |  |
| ✅ corrigé | moyen | Options |  | Finitions différentes de la version adulte : [Bouleau\|Iki blanc hp\|Linoléum noir] vs [Bouleau\|Lamifié blanc\|Linoléum noir]. |  |
| ◐ partiel | moyen | Photos | #2 | La seule ambiance (#2) est un gros plan d'une table enfant 81B avec des chaises N65 : on ne voit pas le modèle vendu (80B 100 × 60 cm H60). | Remplacer par une ambiance du modèle réel si elle existe, sinon garder mais avec l'alt « Table enfant Aalto 81B et chaises N65 (illustration de la gamme) ». |

#### Table enfant Aalto 81A 150 × 75 cm H60 — `artek-aalto-table-rectangular-81a-60cm`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-rectangular-81a-60cm) · [Fiche Artek](https://www.artek.fi/en/products/aalto-childrens-table-rectangular) · Table · 3 variantes · 4 photos · familles du site : Tables  
Artek : Aalto Children's Table rectangular 81A · Alvar Aalto · 1933 · Made in Plateau bouleau : Finlande et Allemagne ; plateau HPL ou linoléum : Finlande · en catalogue  
Dimensions Artek : 150 × 75 cm, H 60 cm (cotes lues dans les identifiants « number_* » du schéma SVG « Materials and Dimensions » de la page artek.fi : 60 / 75 / 4 / 133,5 / 150)  
Constats : 0 critique, 1 élevé, 9 moyen, 6 faible, 1 info ; 4 corrigés le 29 septembre.  
**Verdict :** Modèle, taille et finitions conformes ; photos propres à la 81A (plus longue que les autres). Seul défaut spécifique : l'alt de la photo principale.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ⬜ à faire | moyen | Classement |  | Table enfant typée « Table » : elle entre dans la famille Tables comme une table de repas (catégorie Shopify : Dining Tables). | Type « Table enfant » ou tag dédié, et catégorie Shopify Kids Tables. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Description |  | Description identique à artek-aalto-table-rectangular-80a-60cm, artek-aalto-table-rectangular-80b-60cm, artek-aalto-table-rectangular-81b-60cm, artek-aalto-table-square-81c-60cm, artek-aalto-table-round-90a-60cm. | Rédiger une description propre à chaque taille/version. |
| ✅ corrigé | moyen | Photos | Bouleau | Alt de l’image de variante « Table enfant Aalto 81A 150 × 75 cm H60 — Artek » sans rapport avec la finition « Bouleau ». |  |
| ⬜ à faire | moyen | Prix |  | Prix identique à la version adulte artek-aalto-table-rectangular-81a (1659.0 € vs 1659.0 €) ; vérifier le tarif Artek de la hauteur 60 cm. |  |
| ◐ partiel | moyen | Photos | #2 | La seule ambiance (#2) est un gros plan d'une table enfant 81B avec des chaises N65 : on ne voit pas le modèle vendu (81A 150 × 75 cm H60). | Remplacer par une ambiance du modèle réel si elle existe, sinon garder mais avec l'alt « Table enfant Aalto 81B et chaises N65 (illustration de la gamme) ». |

#### Table enfant Aalto 81B 120 × 75 cm H60 — `artek-aalto-table-rectangular-81b-60cm`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-rectangular-81b-60cm) · [Fiche Artek](https://www.artek.fi/en/products/aalto-childrens-table-rectangular) · Table · 3 variantes · 5 photos · familles du site : Tables  
Artek : Aalto Children's Table rectangular 81B · Alvar Aalto · 1933 · Made in Plateau bouleau : Finlande et Allemagne ; plateau HPL ou linoléum : Finlande · en catalogue  
Dimensions Artek : 120 × 75 cm, H 60 cm (cotes lues dans les identifiants « number_* » du schéma SVG « Materials and Dimensions » de la page artek.fi : 60 / 75 / 4 / 103,5 / 120)  
Constats : 0 critique, 2 élevé, 8 moyen, 7 faible, 1 info ; 4 corrigés le 29 septembre.  
**Verdict :** Modèle et finitions conformes, les ambiances montrent bien la 81B ; mais les packshots sont identiques à ceux de la 80A (120 × 60).

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Photos | #1, #4, #5 | Les images #1, #4 et #5 sont identiques à celles de la table enfant 80A 120 × 60 (#1, #3, #4). L'une des deux fiches montre la mauvaise profondeur de plateau (60 ou 75 cm), à confirmer. | Obtenir les packshots Artek distincts et remplacer ceux de la fiche erronée. |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ⬜ à faire | moyen | Classement |  | Table enfant typée « Table » : elle entre dans la famille Tables comme une table de repas (catégorie Shopify : Dining Tables). | Type « Table enfant » ou tag dédié, et catégorie Shopify Kids Tables. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Description |  | Description identique à artek-aalto-table-rectangular-80a-60cm, artek-aalto-table-rectangular-80b-60cm, artek-aalto-table-rectangular-81a-60cm, artek-aalto-table-square-81c-60cm, artek-aalto-table-round-90a-60cm. | Rédiger une description propre à chaque taille/version. |
| ⬜ à faire | moyen | Prix |  | Prix identique à la version adulte artek-aalto-table-rectangular-81b (1246.0 € vs 1246.0 €) ; vérifier le tarif Artek de la hauteur 60 cm. |  |
| ⬜ à faire | moyen | Options |  | Finitions différentes de la version adulte : [Bouleau\|Lamifié blanc\|Linoléum noir] vs [Bouleau\|Bouleau sauvage\|Bouleau verni naturel / lamifié blanc\|Bouleau verni naturel / linoléum noir]. |  |

#### Table enfant Aalto 80C 60 × 60 cm H60 — `artek-aalto-table-square-80c-60cm`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-square-80c-60cm) · [Fiche Artek](https://www.artek.fi/en/products/aalto-childrens-table-square) · Table · 3 variantes · 4 photos · familles du site : Tables  
Artek : Aalto Table square 80C (pas en version enfant sur artek.fi) · Alvar Aalto · 1933 · Made in Plateau bouleau : Finlande et Allemagne ; plateau HPL ou linoléum : Finlande · introuvable en version enfant sur artek.fi (à confirmer auprès d'Artek)  
Dimensions Artek : Adulte 80C : 60 × 60 cm, H 74 cm (cotes lues dans les identifiants « number_* » du schéma SVG « Materials and Dimensions » de la page artek.fi, aalto-table-square) ; aucune version H60 publiée  
Constats : 0 critique, 2 élevé, 9 moyen, 9 faible, 2 info ; 7 corrigés le 29 septembre.  
**Verdict :** La table enfant carrée d'Artek n'existe publiquement qu'en 81C (75 × 75) ; le 80C H60 est à confirmer. La fiche affiche aussi une origine trop simple et la finition « Iki blanc hp ».

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Données fabricant |  | artek.fi indique que la table enfant carrée est « available in 75x75 cm » (81C) seulement ; le 80C 60 × 60 en hauteur 60 cm n'est pas publié. Les noms de fichiers « Aalto-Children_s-Table-square-80C… » laissent penser qu'il a existé. | Confirmer la disponibilité auprès d'Artek ; sinon passer la fiche en brouillon. |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ⬜ à faire | moyen | Classement |  | Table enfant typée « Table » : elle entre dans la famille Tables comme une table de repas (catégorie Shopify : Dining Tables). | Type « Table enfant » ou tag dédié, et catégorie Shopify Kids Tables. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Options |  | Valeurs d’option en anglais/code : Iki blanc hp. |  |
| ⬜ à faire | moyen | Prix |  | Prix identique à la version adulte artek-aalto-table-square-80c (892.0 € vs 892.0 €) ; vérifier le tarif Artek de la hauteur 60 cm. |  |
| ✅ corrigé | moyen | Options |  | Finitions différentes de la version adulte : [Bouleau\|Iki blanc hp\|Linoléum noir] vs [Bouleau\|Lamifié blanc\|Linoléum noir]. |  |
| ✅ corrigé | moyen | Métachamps |  | custom.origin « Fabriqué en Finlande » et le tag « made-in-finlande » s'appliquent à toutes les finitions, alors qu'Artek indique que les tables à plateau bouleau sont fabriquées en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateau bouleau : Finlande ou Allemagne) ». |
| ◐ partiel | moyen | Photos | #2 | La seule ambiance (#2) est un gros plan d'une table enfant 81B avec des chaises N65 : on ne voit pas le modèle vendu (80C 60 × 60 cm H60). | Remplacer par une ambiance du modèle réel si elle existe, sinon garder mais avec l'alt « Table enfant Aalto 81B et chaises N65 (illustration de la gamme) ». |

#### Table enfant Aalto 81C 75 × 75 cm H60 — `artek-aalto-table-square-81c-60cm`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-square-81c-60cm) · [Fiche Artek](https://www.artek.fi/en/products/aalto-childrens-table-square) · Table · 3 variantes · 4 photos · familles du site : Tables  
Artek : Aalto Children's Table square 81C · Alvar Aalto · 1933 · Made in Plateau bouleau : Finlande et Allemagne ; plateau HPL ou linoléum : Finlande · en catalogue  
Dimensions Artek : 75 × 75 cm, H 60 cm (cotes lues dans les identifiants « number_* » du schéma SVG « Materials and Dimensions » de la page artek.fi : 60 / 75 / 4 / 58,5 / 75)  
Constats : 0 critique, 1 élevé, 8 moyen, 6 faible, 1 info ; 3 corrigés le 29 septembre.  
**Verdict :** Seule table enfant carrée d'Artek : modèle, taille, hauteur et finitions conformes, photos propres à la 81C ; défauts limités à l'ambiance d'un autre modèle et aux données incomplètes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ⬜ à faire | moyen | Classement |  | Table enfant typée « Table » : elle entre dans la famille Tables comme une table de repas (catégorie Shopify : Dining Tables). | Type « Table enfant » ou tag dédié, et catégorie Shopify Kids Tables. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Description |  | Description identique à artek-aalto-table-rectangular-80a-60cm, artek-aalto-table-rectangular-80b-60cm, artek-aalto-table-rectangular-81a-60cm, artek-aalto-table-rectangular-81b-60cm, artek-aalto-table-round-90a-60cm. | Rédiger une description propre à chaque taille/version. |
| ⬜ à faire | moyen | Prix |  | Prix identique à la version adulte artek-aalto-table-square-81c (964.0 € vs 964.0 €) ; vérifier le tarif Artek de la hauteur 60 cm. |  |
| ◐ partiel | moyen | Photos | #2 | La seule ambiance (#2) est un gros plan d'une table enfant 81B avec des chaises N65 : on ne voit pas le modèle vendu (81C 75 × 75 cm H60). | Remplacer par une ambiance du modèle réel si elle existe, sinon garder mais avec l'alt « Table enfant Aalto 81B et chaises N65 (illustration de la gamme) ». |

#### Table enfant Aalto 90A Ø 100 cm H60 — `artek-aalto-table-round-90a-60cm`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aalto-table-round-90a-60cm) · [Fiche Artek](https://www.artek.fi/en/products/aalto-childrens-table-round) · Table · 3 variantes · 3 photos · familles du site : Tables  
Artek : Aalto Children's Table round (90A) · Alvar Aalto · 1933 · Made in Plateau bouleau : Finlande et Allemagne ; HPL/linoléum : Finlande · en catalogue  
Dimensions Artek : Ø 100 cm, H 60 cm (cotes lues dans les identifiants « number_* » du schéma SVG « Materials and Dimensions » de la page artek.fi : 60 / 4 / 100)  
Constats : 0 critique, 1 élevé, 9 moyen, 6 faible, 1 info ; 3 corrigés le 29 septembre.  
**Verdict :** Taille Ø 100 et hauteur 60 conformes (seule table enfant ronde d'Artek) ; photos correctes, mais aucune ambiance et données incomplètes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Classement |  | Membre de la collection de travail « Claude — Modifs 2026-05-16 » (manuelle, 568 produits) publiée sur les 4 canaux, dont Facebook/Instagram. | Retirer le produit de la collection de travail ou dépublier celle-ci. |
| ⬜ à faire | moyen | Classement |  | Table enfant typée « Table » : elle entre dans la famille Tables comme une table de repas (catégorie Shopify : Dining Tables). | Type « Table enfant » ou tag dédié, et catégorie Shopify Kids Tables. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Description |  | Description identique à artek-aalto-table-rectangular-80a-60cm, artek-aalto-table-rectangular-80b-60cm, artek-aalto-table-rectangular-81a-60cm, artek-aalto-table-rectangular-81b-60cm, artek-aalto-table-square-81c-60cm. | Rédiger une description propre à chaque taille/version. |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ⬜ à faire | moyen | Prix |  | Prix identique à la version adulte artek-aalto-table-round-90a (1348.0 € vs 1348.0 €) ; vérifier le tarif Artek de la hauteur 60 cm. |  |
| ⬜ à faire | moyen | Options |  | Finitions différentes de la version adulte : [Bouleau\|Lamifié blanc\|Linoléum noir] vs [Bouleau\|Bouleau sauvage\|Bouleau verni naturel / lamifié blanc\|Bouleau verni naturel / linoléum noir]. |  |

#### Chaise de bar 64 H65 — `chaise-de-bar-64-h65`

[Fiche Mikado](https://www.mikadodeco.be/products/chaise-de-bar-64-h65) · [Fiche Artek](https://www.artek.fi/en/products/bar-stool-64) · Chaise de bar · 5 variantes · 6 photos · familles du site : Assises  
Artek : Bar Stool 64, 65cm · Alvar Aalto · 1935 (fiche PDF : 1934) · Made in Finland · en catalogue  
Dimensions Artek : Hauteur 65 cm, encombrement 52 cm (cotes lues dans les identifiants « number_* » du schéma SVG « Materials and Dimensions » de la page artek.fi)  
Constats : 0 critique, 2 élevé, 5 moyen, 11 faible, 3 info ; 8 corrigés le 29 septembre.  
**Verdict :** Finitions exactes, mais le produit est un tabouret de bar (pas une chaise), la description affirme à tort qu'il s'agit de la version la plus haute et toutes les photos sont celles de la version 75 cm.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Photos | #1, #3, #4, #5, #6 | La fiche H65 utilise exactement les mêmes 6 photos que la fiche H75, dont deux packshots nommés « Bar-Stool-64-75cm… » (#3 Lamifié blanc, #4 Linoléum noir) : on montre le modèle de 75 cm pour vendre celui de 65 cm (proportions identiques, rapport H/L ≈ 1,65 sur toutes les images). | Utiliser pour la H65 des packshots Artek « Bar Stool 64, 65cm » ; ajouter aux deux fiches un dessin coté (hauteur, encombrement). |
| ✅ corrigé | élevé | Description |  | La description de la H65 dit « disponible en deux hauteurs d'assise, celle-ci étant la plus haute », ce qui est faux : 65 cm est la hauteur basse (texte copié de la H75). | « … disponible en deux hauteurs d'assise ; celle-ci (65 cm) convient aux plans de travail d'environ 90 cm. » |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide alors que custom.country_of_origin = « Finlande » : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Description |  | Description identique à chaise-de-bar-64-h75. | Rédiger une description propre à chaque taille/version. |
| ✅ corrigé | moyen | Titre |  | Le produit s'appelle « Bar Stool 64 » chez Artek : c'est un tabouret sans dossier, pas une « chaise de bar ». La description dit d'ailleurs « tabouret de bar 64 », et le type « Chaise de bar » le fait classer dans « Chaises » au lieu de « Tabourets et bancs ». | Titre « Tabouret de bar 64 H65 », type « Tabouret de bar » (entrée automatique dans tabourets-et-bancs), SEO en conséquence (garder le handle, sinon redirection). |

#### Chaise de bar 64 H75 — `chaise-de-bar-64-h75`

[Fiche Mikado](https://www.mikadodeco.be/products/chaise-de-bar-64-h75) · [Fiche Artek](https://www.artek.fi/en/products/bar-stool-64) · Chaise de bar · 5 variantes · 6 photos · familles du site : Assises  
Artek : Bar Stool 64, 75cm · Alvar Aalto · 1935 (fiche PDF : 1934) · Made in Finland · en catalogue  
Dimensions Artek : Hauteur 75 cm, encombrement 54,5 cm (cotes lues dans les identifiants « number_* » du schéma SVG « Materials and Dimensions » de la page artek.fi)  
Constats : 0 critique, 0 élevé, 6 moyen, 11 faible, 3 info ; 7 corrigés le 29 septembre.  
**Verdict :** Finitions exactes et description juste pour cette hauteur ; il s'agit toutefois d'un tabouret de bar (pas d'une chaise), avec des photos identiques à la H65 et le classement « objets ».

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide alors que custom.country_of_origin = « Finlande » : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Description |  | Description identique à chaise-de-bar-64-h65. | Rédiger une description propre à chaque taille/version. |
| ✅ corrigé | moyen | Titre |  | Le produit s'appelle « Bar Stool 64 » chez Artek : c'est un tabouret sans dossier, pas une « chaise de bar ». La description dit d'ailleurs « tabouret de bar 64 », et le type « Chaise de bar » le fait classer dans « Chaises » au lieu de « Tabourets et bancs ». | Titre « Tabouret de bar 64 H75 », type « Tabouret de bar » (entrée automatique dans tabourets-et-bancs), SEO en conséquence (garder le handle, sinon redirection). |
| ✅ corrigé | moyen | Photos | #1, #3, #4, #5, #6 | Les 6 photos sont identiques à celles de la fiche H65 : rien ne distingue visuellement les deux hauteurs (les fichiers #3 et #4 sont bien des 75 cm). | Utiliser pour la H65 des packshots Artek « Bar Stool 64, 65cm » ; ajouter aux deux fiches un dessin coté (hauteur, encombrement). |

### Chaises

#### Chaise Atelier — `artek-atelier-chair`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-atelier-chair) · [Fiche Artek](https://www.artek.fi/en/products/atelier-chair) · Chaise · 6 variantes · 11 photos · familles du site : Assises  
Artek : Atelier Chair · TAF Studio · 2018 · Made in Italy · en catalogue  
Dimensions Artek : Schéma coté artek.fi : 46 × 47 cm (largeur/profondeur, ordre à confirmer), hauteur d'assise 45,5 cm, hauteur 78 cm ; empilable par 7  
Constats : 0 critique, 2 élevé, 2 moyen, 7 faible, 1 info ; 4 corrigés le 29 septembre.  
**Verdict :** Fiche saine : 6 variantes conformes à Artek, chaque variante a sa photo correcte ; manquent dimensions, matière et poids.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide alors qu'Artek publie les cotes. | custom.dimensions = « L 46 × P 47 × H 78 cm, hauteur d'assise 45,5 cm (L/P à confirmer) — empilable par 7 » |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide. | custom.material = « Hêtre, frêne ou chêne massif ; assise en contreplaqué de hêtre plaqué » |

#### Chaise Aslak — `artek-aslak-chair`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-aslak-chair) · [Fiche Artek](https://www.artek.fi/en/products/aslak-chair) · Chaise · 5 variantes · 9 photos · familles du site : Assises  
Artek : Aslak Chair · Ilmari Tapiovaara · 1958 (esquissée dès 1946) · Made in Italy · en catalogue  
Dimensions Artek : Schéma coté artek.fi : 50 / 53 cm (largeur/profondeur, ordre à confirmer), 46 cm (hauteur d'assise probable), hauteur 76 cm ; empilable par 4  
Constats : 0 critique, 6 élevé, 2 moyen, 4 faible, 1 info ; 6 corrigés le 29 septembre.  
**Verdict :** Variantes et photos exactes (5/5) ; l'année est incohérente (SEO 1946, tag années 1940) alors qu'Artek date la chaise de 1958.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | SEO |  | Année SEO 1946 ≠ custom.year 1958. |  |
| ✅ corrigé | élevé | Tags |  | Tag annees-1940 ≠ année 1958. |  |
| ✅ corrigé | élevé | SEO |  | La méta-description SEO date la chaise de 1946 ; Artek la date de 1958 (1946 = simple esquisse). custom.year = 1958 est juste. | Méta-description : « Chaise Aslak par Ilmari Tapiovaara (1958) … ». |
| ✅ corrigé | élevé | Tags |  | Le tag annees-1940 est faux pour une chaise datée de 1958. | Remplacer annees-1940 par annees-1950. |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide. | custom.dimensions = « H 76 cm, hauteur d'assise 46 cm, 50 × 53 cm (L/P à confirmer) — empilable par 4 » |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide. | custom.material = « Hêtre massif et contreplaqué de hêtre moulé, laqué » |

#### Chaise Lukki — `artek-lukki-chair`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-lukki-chair) · [Fiche Artek](https://www.artek.fi/en/products/lukki-chair) · Chaise · 1 variante · 2 photos · familles du site : Assises  
Artek : Lukki Chair · Ilmari Tapiovaara · 1951 · Made in Finland · en catalogue  
Dimensions Artek : Schéma coté artek.fi : 56 / 51 cm (largeur/profondeur, ordre à confirmer), hauteur d'assise 43 cm, hauteur accoudoirs 66,5 cm, hauteur 74 cm ; empilable par 4  
Constats : 0 critique, 2 élevé, 3 moyen, 7 faible, 0 info ; 5 corrigés le 29 septembre.  
**Verdict :** Variante unique conforme ; fiche pauvre (2 photos) et l'unique ambiance semble montrer une autre couleur.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide. | custom.dimensions = « L 56 × P 51 × H 74 cm (L/P à confirmer), assise 43 cm, accoudoirs 66,5 cm — empilable par 4 » |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Photos |  | La seule photo d'ambiance met au premier plan une chaise à structure beige et assise blanche, finition non vendue (Artek ne propose que le noir) ; la Lukki noire n'est pas clairement visible. Identification du modèle au premier plan à confirmer. | Remplacer #2 par une ambiance Artek montrant la Lukki noire, ou ajouter au moins une seconde ambiance noire. |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide ; la description omet le placage hêtre laqué noir. | custom.material = « Acier thermolaqué noir mat ; contreplaqué de bouleau plaqué hêtre laqué noir » |

#### Chaise 611 — `artek-chair-611`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-chair-611) · [Fiche Artek](https://www.artek.fi/en/products/chair-611) · Chaise · 10 variantes · 16 photos · familles du site : Assises  
Artek : Chair 611 · Alvar Aalto · 1929 · Made in Finland · en catalogue  
Dimensions Artek : Schéma coté artek.fi : 48,5 / 49 cm (largeur/profondeur, ordre à confirmer), hauteur d'assise 42,5 cm, hauteur 80 cm ; « max. 5 » empilées  
Constats : 0 critique, 2 élevé, 6 moyen, 9 faible, 1 info ; 9 corrigés le 29 septembre.  
**Verdict :** 10 variantes, 10 photos de variante exactes (sangles et structure vérifiées) ; description approximative (« cousus sellier »), 10 tags recopiés des variantes, année absente.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide. | custom.dimensions = « L 48,5 × P 49 × H 80 cm (L/P à confirmer), hauteur d'assise 42,5 cm » |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1929 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Description |  | « une assise et un dossier cousus sellier » est inexact : il s'agit de sangles de lin tissées/tressées sur le cadre, pas de couture sellier. | « …avec une assise et un dossier en sangles de lin tressées. » |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide ; Artek confirme 1929. | custom.year = 1929 |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide. | custom.material = « Bouleau massif ; sangles 100 % lin » |

#### Chaise 65 — `artek-chair-65`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-chair-65) · [Fiche Artek](https://www.artek.fi/en/products/chair-65) · Chaise · 5 variantes · 8 photos · familles du site : Assises  
Artek : Chair 65 · Alvar Aalto · 1935 · Made in Finland · en catalogue  
Dimensions Artek : Schéma coté artek.fi : 35 / 40 cm (largeur/profondeur, ordre à confirmer), 45,5 cm (hauteur d'assise probable), hauteur 66 cm  
Constats : 0 critique, 2 élevé, 5 moyen, 4 faible, 2 info ; 6 corrigés le 29 septembre.  
**Verdict :** Bon modèle (dossier bas rectangulaire) sur toutes les photos, 5 variantes conformes et correctement illustrées ; manquent année, dimensions, matière.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide. | custom.dimensions = « 35 × 40 cm (L/P à confirmer), hauteur d'assise 45,5 cm, hauteur 66 cm » |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1935 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide. | custom.year = 1935 |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide. | custom.material = « Bouleau massif, dossier en contreplaqué de bouleau moulé ; assise bouleau, lamifié (HPL) ou linoléum » |

#### Chaise 66 — `artek-chair-66`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-chair-66) · [Fiche Artek](https://www.artek.fi/en/products/chair-66) · Chaise · 6 variantes · 11 photos · familles du site : Assises  
Artek : Chair 66 · Alvar Aalto · 1935 · Made in Finland · en catalogue  
Dimensions Artek : Schéma coté artek.fi : 39 / 42 cm (largeur/profondeur, ordre à confirmer), 45,5 cm (hauteur d'assise probable), hauteur 80 cm (le même schéma affiche 30¾" = 78 cm : à confirmer)  
Constats : 0 critique, 2 élevé, 5 moyen, 9 faible, 2 info ; 6 corrigés le 29 septembre.  
**Verdict :** Bon modèle (dossier large à poignée) sur toutes les photos, 6 variantes conformes et illustrées ; libellés différents des chaises 65/68/69 pour les mêmes finitions.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide. | custom.dimensions = « 39 × 42 cm (L/P à confirmer), hauteur d'assise 45,5 cm, hauteur 80 cm (à confirmer, 78 cm selon la valeur en pouces) » |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1935 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide. | custom.year = 1935 |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide. | custom.material = « Bouleau massif, dossier en contreplaqué de bouleau moulé ; assise bouleau, lamifié (HPL) ou linoléum » |

#### Chaise 68 — `artek-chair-68`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-chair-68) · [Fiche Artek](https://www.artek.fi/en/products/chair-68) · Chaise · 5 variantes · 8 photos · familles du site : Assises  
Artek : Chair 68 · Alvar Aalto · 1935 · Made in Finland · en catalogue  
Dimensions Artek : Schéma coté artek.fi : 43 / 48,5 cm (largeur/profondeur, ordre à confirmer), 45,5 cm (hauteur d'assise probable), hauteur 70 cm ; empilable par 4  
Constats : 0 critique, 2 élevé, 5 moyen, 5 faible, 2 info ; 7 corrigés le 29 septembre.  
**Verdict :** Bon modèle (dossier trois pièces à barre cintrée) sur toutes les photos, 5 variantes conformes ; description très courte, pas de dimensions.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide. | custom.dimensions = « 43 × 48,5 cm (L/P à confirmer), hauteur d'assise 45,5 cm, hauteur 70 cm — empilable par 4 » |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1935 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide. | custom.year = 1935 |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide. | custom.material = « Bouleau massif, dossier en lamelles de bouleau moulées ; assise bouleau, lamifié (HPL) ou linoléum » |

#### Chaise 69 — `artek-chair-69`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-chair-69) · [Fiche Artek](https://www.artek.fi/en/products/chair-69) · Chaise · 11 variantes · 15 photos · familles du site : Assises  
Artek : Chair 69 · Alvar Aalto · 1935 · Made in Finland · en catalogue  
Dimensions Artek : Schéma coté artek.fi : 44 / 47 cm (largeur/profondeur, ordre à confirmer), 45,5 cm (hauteur d'assise probable), hauteur 76 cm (le schéma affiche 29¼" = 74 cm : à confirmer)  
Constats : 0 critique, 2 élevé, 8 moyen, 6 faible, 3 info ; 8 corrigés le 29 septembre.  
**Verdict :** 11 variantes conformes à Artek et bien illustrées ; l'alt de la photo « Laqué blanc » (#9) annonce l'autre finition blanche, tags recopiés et « contemporain » faux.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide. | custom.dimensions = « 44 × 47 cm (L/P à confirmer), hauteur d'assise 45,5 cm, hauteur 76 cm (74 cm selon la valeur en pouces : à confirmer) » |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1935 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Photos | Bouleau / laqué blanc | Alt de l’image de variante « Chaise 69 — Artek » sans rapport avec la finition « Bouleau / laqué blanc ». |  |
| ✅ corrigé | moyen | Photos | Laqué noir | Alt de l’image de variante « Chaise 69 — Artek » sans rapport avec la finition « Laqué noir ». |  |
| ✅ corrigé | moyen | Photos | Laqué blanc · #9 | La photo #9 (chaise entièrement blanche, pieds laqués) est bien liée à « Laqué blanc » mais son alt dit « Bouleau / laqué blanc » (pieds naturels) ; inversement l'alt de #14 est générique. Non signalé par le contrôle automatique pour #9. | Alt #9 : « Chaise 69 — Laqué blanc » ; alt #14 : « Chaise 69 — Bouleau / laqué blanc » ; alt #15 : « Chaise 69 — Laqué noir ». |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide. | custom.year = 1935 |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide. | custom.material = « Bouleau massif, dossier en lamelles de bouleau moulées ; assise bouleau, laquée ou lamifiée (HPL) » |

#### Chaise Domus — `artek-domus-chair`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-domus-chair) · [Fiche Artek](https://www.artek.fi/en/products/domus-chair) · Chaise · 5 variantes · 15 photos · familles du site : Assises  
Artek : Domus Chair · Ilmari Tapiovaara · 1946 · Made in Finland · en catalogue  
Dimensions Artek : Schéma coté artek.fi : 58 / 54 cm (largeur/profondeur, ordre à confirmer), hauteur d'assise 44,5 cm, hauteur accoudoirs 66 cm, hauteur 79 cm ; empilable par 4  
Constats : 0 critique, 2 élevé, 3 moyen, 6 faible, 1 info ; 3 corrigés le 29 septembre.  
**Verdict :** 5 variantes bois conformes et bien illustrées ; 4 ambiances sur 10 montrent des Domus rembourrées vendues sur d'autres fiches ; tags lacunaires.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide. | custom.dimensions = « L 58 × P 54 × H 79 cm (L/P à confirmer), assise 44,5 cm, accoudoirs 66 cm — empilable par 4 » |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Photos |  | Plusieurs ambiances de cette fiche « bois » montrent surtout des Domus rembourrées (cuir brun assise+dossier, tissu beige, tissu rouge, cuir vert), qui ne s'achètent pas ici. | Déplacer #3, #4, #5, #7 vers la fiche « assise et dossier rembourrés » (ou les placer après les ambiances bois) et garder en tête #2, #6, #8, #9, #14, #15. |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide. | custom.material = « Bouleau ou chêne massif ; assise et dossier en placage moulé » |

#### Chaise Domus assise et dossier rembourrés — `artek-domus-chair-seat-and-back-upholstered`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-domus-chair-seat-and-back-upholstered) · [Fiche Artek](https://www.artek.fi/en/stories/domus-means-home) · Chaise · 10 variantes · 18 photos · familles du site : Assises  
Artek : Domus Chair (éditions rembourrées « Domus means home ») · Ilmari Tapiovaara · 1946 · Made in Finland · en catalogue  
Dimensions Artek : Identiques à la Domus Chair : schéma artek.fi 58 / 54 cm, assise 44,5 cm, accoudoirs 66 cm, H 79 cm  
Constats : 0 critique, 2 élevé, 4 moyen, 9 faible, 1 info ; 9 corrigés le 29 septembre.  
**Verdict :** 10 éditions réelles et photos de variante exactes, mais libellés d'options mal formés (1re variante incompréhensible, casse et noms de collections tronqués), origine et tags manquants.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide. | custom.dimensions = « L 58 × P 54 × H 79 cm (L/P à confirmer), assise 44,5 cm, accoudoirs 66 cm » |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Variantes | Bouleau / tissu hola canary tissu / cuir prestige cream passepoil · #1 | Le libellé de la variante par défaut est incohérent : « tissu hola canary tissu / cuir prestige cream passepoil » (« tissu » doublé, passepoil mal placé). | « Bouleau / tissu Hola canary / passepoil cuir Prestige cream » |
| ✅ corrigé | moyen | Métachamps |  | custom.origin et custom.country_of_origin absents ; Artek indique « made in Finland ». | custom.origin = « Fabriqué en Finlande », custom.country_of_origin = « Finlande » |

#### Chaise Rope — `artek-rope-chair`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-rope-chair) · [Fiche Artek](https://www.artek.fi/en/products/rope-chair) · Chaise · 4 variantes · 6 photos · familles du site : Assises  
Artek : Rope Chair · Ronan & Erwan Bouroullec · 2020 · Made in Germany · en catalogue  
Dimensions Artek : Schéma coté artek.fi : hauteur 80 cm, accoudoirs 66,5 cm ; autres cotes 51 / 48,5 / 45,5 / 44 / 43,5 cm à attribuer (largeur, profondeur, hauteur d'assise)  
Constats : 0 critique, 4 élevé, 5 moyen, 6 faible, 1 info ; 5 corrigés le 29 septembre.  
**Verdict :** 2 finitions réelles bien photographiées ; le choix des patins crée 4 variantes dont la description contredit l'une des options.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Photos |  | Une même photo (packshot-4742cb2a56d31d9b327b23c1e7f2c1e1.png) sert à 2 finitions différentes : Noir thermolaqué mat / laqué noir / corde polyester noir / patins feutre \| Noir thermolaqué mat / laqué noir / corde polyester noir / patins plastique. | Associer à chaque finition sa propre photo. |
| ⬜ à faire | élevé | Photos |  | Une même photo (artek-rope-chair-light-grey.jpg) sert à 2 finitions différentes : Gris clair thermolaqué mat / laqué gris clair / corde lin naturel / patins feutre \| Gris clair thermolaqué mat / laqué gris clair / corde lin naturel / patins plastique. | Associer à chaque finition sa propre photo. |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide. | custom.dimensions = « H 80 cm, accoudoirs 66,5 cm, L 51 × P 48,5 cm environ (à confirmer sur le DWG Artek) » |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Photos |  | La photo principale est partagée par 2 variantes : la fiche s’ouvre sur la première d’entre elles. |  |
| ✅ corrigé | moyen | Description |  | La description affirme « patins en feutre installés » alors que deux variantes sont vendues avec patins plastique. | « Livrée assemblée, avec patins en feutre ou en plastique selon la version choisie. » |
| ⬜ à faire | moyen | Variantes |  | Les patins sont fondus dans un libellé de finition très long (4 niveaux) ; la même photo sert donc à deux « finitions ». Artek ne documente pas ce choix de patins sur sa page (à confirmer). | Créer deux options : Finition (Noir / corde polyester noire ; Gris clair / corde lin naturel) et Patins (Feutre / Plastique) ; chaque photo reste liée à sa finition. |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide. | custom.material = « Acier thermolaqué ; assise contreplaqué de hêtre plaqué frêne laqué ; corde lin ou polyester » |

#### Chaise Domus assise rembourrée — `artek-domus-chair-seat-upholstered`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-domus-chair-seat-upholstered) · [Fiche Artek](https://www.artek.fi/en/products/domus-chair) · Chaise · 3 variantes · 5 photos · familles du site : Assises  
Artek : Domus Chair (assise rembourrée) · Ilmari Tapiovaara · 1946 · Made in Finland · en catalogue  
Dimensions Artek : Identiques à la Domus Chair : schéma artek.fi 58 / 54 cm, assise 44,5 cm, accoudoirs 66 cm, H 79 cm  
Constats : 0 critique, 2 élevé, 5 moyen, 8 faible, 1 info ; 6 corrigés le 29 septembre.  
**Verdict :** 3 variantes conformes et bien illustrées, mais les 2 ambiances montrent une Domus entièrement rembourrée en cuir clair ; libellés et prix à harmoniser.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide. | custom.dimensions = « L 58 × P 54 × H 79 cm (L/P à confirmer), assise 44,5 cm, accoudoirs 66 cm » |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Photos |  | Les deux ambiances montrent une Domus chêne avec assise ET dossier rembourrés en cuir clair, alors que la fiche vend une assise seule en cuir noir. | Remplacer par des ambiances Artek de Domus à assise cuir noir (ou déplacer #2/#3 vers la fiche assise+dossier). |
| ⬜ à faire | moyen | Prix |  | Le supplément de l'assise cuir varie fortement selon la finition : +282 € sur bouleau (1075 vs 793) mais +169 € sur teinté noir (1110 vs 941) et +145 € sur chêne (1215 vs 1070). | Vérifier les trois prix sur le tarif Artek (le bouleau rembourré semble trop cher ou les deux autres trop bas). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin et country_of_origin absents. | custom.origin = « Fabriqué en Finlande » |

#### Chaise de bureau Rival KG002 — `artek-rival-chair-kg002`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-rival-chair-kg002) · [Fiche Artek](https://www.artek.fi/en/products/rival-chair) · Chaise de bureau · 4 variantes · 12 photos · familles du site : Assises  
Artek : Rival Chair KG002 · Konstantin Grcic · 2014 · Made in Germany · en catalogue  
Dimensions Artek : Schéma coté artek.fi : 59 / 52 cm (largeur/profondeur, ordre à confirmer), hauteur d'assise 46 cm, hauteur 78 cm  
Constats : 2 critique, 2 élevé, 7 moyen, 9 faible, 2 info ; 13 corrigés le 29 septembre.  
**Verdict :** Fiche à reprendre : la photo principale annonce du tricot gris clair mais montre du cuir caramel, le piètement n'est pas un choix possible et les packshots mélangent les couleurs de structure.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | critique | Photos | Maille 3D gris clair/crème · #1 | La photo principale, liée à « Maille 3D gris clair/crème », montre une assise en cuir lisse caramel sur structure bouleau naturel et coque blanche : ce n'est pas du tricot 3D. Le client qui choisit cette variante voit un cuir caramel. | Lier à « Maille 3D gris clair/crème » un packshot Artek « laqué blanc, coque blanche, 3D-knit gris/blanc » ; utiliser #1 pour une variante cuir caramel sur bouleau si elle est ajoutée. |
| ✅ corrigé | critique | Variantes |  | Le piètement (bouleau naturel, laqué blanc ou laqué asphalte) est « précisé à la commande » dans la description, sans option : le client ne peut pas le choisir dans le panier, et chaque photo de variante montre une structure différente (naturel #1/#7, asphalte #6/#12), ce qui laisse croire que la couleur est liée au revêtement. | Ajouter une option « Piètement » (Bouleau naturel/« silver birch », Laqué blanc, Laqué asphalte) combinée au revêtement selon les combinaisons Artek, avec une photo par combinaison ; retirer la phrase de la description. |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide. | custom.dimensions = « L 59 × P 52 × H 78 cm (L/P à confirmer), hauteur d'assise 46 cm, assise pivotante » |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Options |  | Valeurs d’option en anglais/code : Maille 3D noir/blanc \| Maille 3D gris clair/crème. |  |
| ✅ corrigé | moyen | Photos |  | Trois packshots de combinaisons (asphalte/cuir nero, blanc/cuir caramel, blanc/cuir nero) ne sont liés à aucune variante : le site les affiche dans la bande « ambiances ». | Les lier aux futures variantes Piètement × Revêtement, sinon les retirer. |
| ✅ corrigé | moyen | Variantes |  | Libellés non conformes à Artek : « Maille 3D gris clair/crème » (Artek : 3D-knit gray/white), « Cuir noir premium » (Artek : natural leather nero, fichier « Premium-nero »), « Cuir caramel naturel » (natural leather caramel). | « Tricot 3D gris/blanc », « Tricot 3D noir/blanc », « Cuir naturel caramel », « Cuir nero (noir) ». |
| ✅ corrigé | moyen | Métachamps |  | custom.origin, country_of_origin et usage absents. | custom.origin = « Fabriqué en Allemagne », custom.country_of_origin = « Allemagne », custom.usage = « Intérieur » |

#### Chaise de bar Atelier H65 — `chaise-de-bar-atelier-h65`

[Fiche Mikado](https://www.mikadodeco.be/products/chaise-de-bar-atelier-h65) · [Fiche Artek](https://www.artek.fi/en/products/atelier-bar-stool) · Chaise de bar · 6 variantes · 10 photos · familles du site : Assises  
Artek : Atelier Bar Stool 65 cm · TAF Studio · 2021 · Made in Italy · en catalogue  
Dimensions Artek : Schéma coté artek.fi : hauteur d'assise 65 cm ; assise 40 / 32 cm (L/P à confirmer) ; env. 4 kg  
Constats : 0 critique, 1 élevé, 8 moyen, 12 faible, 3 info ; 12 corrigés le 29 septembre.  
**Verdict :** 6 variantes conformes et photos exactes (65 cm) ; nommé « chaise » alors que c'est un tabouret, hors famille Tabourets, année et matière absentes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Le produit est l'« Atelier Bar Stool » d'Artek, un tabouret sans dossier ; le titre et le type « Chaise de bar » sont trompeurs (la description dit elle-même « tabouret de bar ») et le produit est absent de « Tabourets et bancs » et de « sieges ». | Titre « Tabouret de bar Atelier H65 », type « Tabouret » (ou « Tabouret de bar » ajouté aux règles de tabourets-et-bancs et à CATEGORY_MAP). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide alors que custom.country_of_origin = « Italie » : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Description |  | Description identique à chaise-de-bar-atelier-h75. | Rédiger une description propre à chaque taille/version. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide ; Artek date le tabouret de 2021. | custom.year = 2021 ; ajouter le tag annees-2020. |
| ✅ corrigé | moyen | Métachamps |  | custom.dimensions ne donne que la hauteur d'assise. | custom.dimensions = « Hauteur d'assise 65 cm, assise 40 × 32 cm (à confirmer) — env. 4 kg » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide. | custom.material = « Hêtre, frêne ou chêne massif ; assise contreplaqué de hêtre plaqué ; repose-pieds renforcé aluminium » |
| ⬜ à faire | moyen | Prix |  | H65 et H75 ont exactement les mêmes prix et coûts pour chaque finition (580 à 701 €) : cohérent seulement si le tarif Artek est identique pour les deux hauteurs. | Vérifier le tarif Artek des deux hauteurs. |

#### Chaise de bar Atelier H75 — `chaise-de-bar-atelier-h75`

[Fiche Mikado](https://www.mikadodeco.be/products/chaise-de-bar-atelier-h75) · [Fiche Artek](https://www.artek.fi/en/products/atelier-bar-stool) · Chaise de bar · 6 variantes · 10 photos · familles du site : Assises  
Artek : Atelier Bar Stool 75 cm · TAF Studio · 2021 · Made in Italy · en catalogue  
Dimensions Artek : Schéma coté artek.fi : hauteur d'assise 75 cm ; assise 40 / 32 cm (L/P à confirmer) ; env. 4 kg  
Constats : 1 critique, 2 élevé, 8 moyen, 11 faible, 3 info ; 14 corrigés le 29 septembre.  
**Verdict :** Photos de la version 65 cm réutilisées sur la H75 et texte « version basse » : la fiche H75 montre et décrit le mauvais produit ; nom « chaise » inexact.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | critique | Photos | #1, #3, #6–#10 | Toutes les photos de variante de la version H75 sont celles du tabouret de 65 cm : la photo principale est le même packshot que H65 et les fichiers #6 à #10 s'appellent « Atelier-Bar-Stool-65-cm-… ». Le client voit la version basse et commande la haute. | Remplacer par les packshots Artek 75 cm de chaque finition ; garder #5 (deux hauteurs côte à côte) et retirer #3 (65 cm) de la fiche H75. |
| ✅ corrigé | élevé | Description |  | La description de la H75 dit « dont voici la version basse » : c'est la version haute. | « …disponible en deux hauteurs d'assise, dont voici la version haute (75 cm), pour comptoir de bar. » |
| ✅ corrigé | élevé | Classement |  | Le produit est l'« Atelier Bar Stool » d'Artek, un tabouret sans dossier ; le titre et le type « Chaise de bar » sont trompeurs (la description dit elle-même « tabouret de bar ») et le produit est absent de « Tabourets et bancs » et de « sieges ». | Titre « Tabouret de bar Atelier H75 », type « Tabouret » (ou « Tabouret de bar » ajouté aux règles de tabourets-et-bancs et à CATEGORY_MAP). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide alors que custom.country_of_origin = « Italie » : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Description |  | Description identique à chaise-de-bar-atelier-h65. | Rédiger une description propre à chaque taille/version. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide ; Artek date le tabouret de 2021. | custom.year = 2021 ; ajouter le tag annees-2020. |
| ✅ corrigé | moyen | Métachamps |  | custom.dimensions ne donne que la hauteur d'assise. | custom.dimensions = « Hauteur d'assise 75 cm, assise 40 × 32 cm (à confirmer) — env. 4 kg » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide. | custom.material = « Hêtre, frêne ou chêne massif ; assise contreplaqué de hêtre plaqué ; repose-pieds renforcé aluminium » |
| ⬜ à faire | moyen | Prix |  | H65 et H75 ont exactement les mêmes prix et coûts pour chaque finition (580 à 701 €) : cohérent seulement si le tarif Artek est identique pour les deux hauteurs. | Vérifier le tarif Artek des deux hauteurs. |

### Fauteuils et canapés

#### Fauteuil 41 Paimio — `artek-armchair-41-paimio`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-armchair-41-paimio) · [Fiche Artek](https://www.artek.fi/en/products/armchair-41-paimio) · Fauteuil · 2 variantes · 6 photos · familles du site : Assises  
Artek : Armchair 41 “Paimio” · Alvar Aalto · 1932 · Made in Finland · en catalogue  
Dimensions Artek : L 60 × P 80 × H 64 cm ; assise 33 cm ; accoudoirs 56 cm (dessin coté de la rubrique « Materials and Dimensions » (valeurs lues dans le SVG de la page))  
Constats : 0 critique, 0 élevé, 2 moyen, 4 faible, 1 info ; 3 corrigés le 29 septembre.  
**Verdict :** Fiche saine : photos et variantes justes, dimensions conformes à Artek ; seule la description confond « contreplaqué » et « bouleau massif ».

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Description |  | La description parle de « contreplaqué de bouleau massif cintré » : c’est contradictoire. Chez Artek, la structure est en lamelles de bouleau massif cintrées et la coque en contreplaqué de bouleau moulé. | Remplacer par « Sa structure en lamelles de bouleau massif cintrées porte une coque en contreplaqué de bouleau moulé ». |

#### Fauteuil 42 — `artek-armchair-42`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-armchair-42) · [Fiche Artek](https://www.artek.fi/en/products/armchair-42) · Fauteuil · 2 variantes · 5 photos · familles du site : Assises  
Artek : Armchair 42 · Alvar Aalto · 1932 (fiche technique : 1931-32) · Made in Finland · en catalogue  
Dimensions Artek : L 60 × P 75 × H 72 cm ; assise 36 cm ; accoudoirs 54 cm (dessin coté de la rubrique « Materials and Dimensions » (valeurs lues dans le SVG de la page))  
Constats : 0 critique, 2 élevé, 3 moyen, 4 faible, 1 info ; 6 corrigés le 29 septembre.  
**Verdict :** Photos correctes (42 blanc et noir, ambiances avec de vrais 42) ; il manque dimensions et matière, et le surnom est mal traduit.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Dimensions absentes (constat automatique) : valeurs Artek trouvées. | custom.dimensions = « L 60 × P 75 × H 72 cm ; hauteur d’assise 36 cm ; hauteur des accoudoirs 54 cm » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | Matière absente (constat automatique) : valeur Artek. | custom.material = « Structure : lamelles de bouleau massif cintrées, vernis incolore. Coque : contreplaqué de bouleau moulé, laqué blanc ou noir. » |

#### Fauteuil 43 — `artek-lounge-chair-43`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-lounge-chair-43) · [Fiche Artek](https://www.artek.fi/en/products/lounge-chair-43) · Fauteuil · 6 variantes · 8 photos · familles du site : Assises  
Artek : Lounge Chair 43 · Alvar Aalto · 1937 · Made in Finland · en catalogue  
Dimensions Artek : L 61 × P 164 × H 70 cm ; accoudoirs 52 cm ; assise 41 cm (hauteur d’assise à confirmer : point le plus haut de l’assise ?) (dessin coté de la rubrique « Materials and Dimensions » (valeurs lues dans le SVG de la page); pas de Factsheet PDF publiée)  
Constats : 0 critique, 2 élevé, 5 moyen, 8 faible, 2 info ; 12 corrigés le 29 septembre.  
**Verdict :** Photos et six sanglages exacts, mais le produit est une chaise longue vendue comme « Fauteuil 43 », sans dimensions ni matière.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Dimensions absentes (constat automatique) : valeurs Artek trouvées. | custom.dimensions = « L 61 × P 164 × H 70 cm ; hauteur des accoudoirs 52 cm » (+ hauteur d’assise 41 cm après vérification sur le dessin) |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Titre |  | Le modèle Artek est une chaise longue (Lounge Chair 43, 164 cm de profondeur). Le titre « Fauteuil 43 » ne correspond pas à ce que montrent les photos et ne sera pas trouvé en cherchant « chaise longue ». | Titre « Chaise longue 43 » ; titre SEO « Chaise longue 43 Alvar Aalto — Artek \| Mikado Deco ». |
| ✅ corrigé | moyen | Classement |  | Type « Fauteuil » et catégorie Shopify « Armchairs » : le produit n’apparaît pas dans la sous-catégorie Sièges › Chaises longues du site, qui existe (filtre product_type « Chaise longue »). | Arbitrage propriétaire : type « Chaise longue » (sort de la collection Fauteuils) ou garder « Fauteuil » et l’ajouter à la sous-catégorie Chaises longues. Catégorie Shopify : « Furniture > Chairs > Chaises » (chaises longues), à confirmer dans la taxonomie. |
| ✅ corrigé | moyen | Métachamps |  | Matière absente (constat automatique). | custom.material = « Structure : lamelles de bouleau massif cintrées, vernis incolore. Assise : sangles de lin. » |

#### Fauteuil 406 — `artek-armchair-406`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-armchair-406) · [Fiche Artek](https://www.artek.fi/en/products/armchair-406) · Fauteuil · 6 variantes · 6 photos · familles du site : Assises  
Artek : Armchair 406 · Alvar Aalto · 1939 · Made in Finland · en catalogue  
Dimensions Artek : L 60 × P 72 × H 87 cm ; assise 41 cm ; accoudoirs 57 cm (Armchair 406 Factsheet PDF + dessin artek.fi)  
Constats : 0 critique, 2 élevé, 4 moyen, 3 faible, 1 info ; 6 corrigés le 29 septembre.  
**Verdict :** Six sanglages exacts, chacun avec son packshot juste ; il manque les dimensions, la matière et toute photo d’ambiance.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Dimensions absentes (constat automatique) : valeurs Artek trouvées. | custom.dimensions = « L 60 × P 72 × H 87 cm ; hauteur d’assise 41 cm ; hauteur des accoudoirs 57 cm » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ✅ corrigé | moyen | Métachamps |  | Matière absente (constat automatique). | custom.material = « Structure : lamelles de bouleau massif cintrées, vernis incolore. Assise : sangles de lin. » |

#### Fauteuil Domus — `artek-domus-lounge-chair`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-domus-lounge-chair) · [Fiche Artek](https://www.artek.fi/en/products/domus-lounge-chair) · Fauteuil · 4 variantes · 5 photos · familles du site : Assises  
Artek : Domus Lounge Chair · Ilmari Tapiovaara · 1946 · Made in Finland · en catalogue  
Dimensions Artek : L 59 × P 71 × H 89 cm ; assise 41 cm ; accoudoirs 54,5 cm (dessin coté de la rubrique « Materials and Dimensions » (valeurs lues dans le SVG de la page))  
Constats : 0 critique, 2 élevé, 3 moyen, 4 faible, 1 info ; 5 corrigés le 29 septembre.  
**Verdict :** Les quatre finitions bois sont justes et bien photographiées ; il manque dimensions et matière, et les libellés sont mal harmonisés avec la version rembourrée.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Dimensions absentes (constat automatique) : valeurs Artek trouvées. | custom.dimensions = « L 59 × P 71 × H 89 cm ; hauteur d’assise 41 cm ; hauteur des accoudoirs 54,5 cm » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | Matière absente (constat automatique). | custom.material = « Structure et accoudoirs : bouleau massif (ou chêne massif pour la finition chêne). Assise et dossier : contreplaqué de bouleau moulé, plaqué chêne pour la finition chêne. » |

#### Fauteuil Mademoiselle — `artek-mademoiselle-lounge-chair`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-mademoiselle-lounge-chair) · [Fiche Artek](https://www.artek.fi/en/products/mademoiselle-lounge-chair) · Fauteuil · 2 variantes · 3 photos · familles du site : Assises  
Artek : Mademoiselle Lounge Chair · Ilmari Tapiovaara · 1956 · Made in Finland · en catalogue  
Dimensions Artek : L 55 × P 66 × H 94 cm ; assise 41 cm (dessin coté de la rubrique « Materials and Dimensions » (valeurs lues dans le SVG de la page))  
Constats : 0 critique, 2 élevé, 4 moyen, 6 faible, 0 info ; 7 corrigés le 29 septembre.  
**Verdict :** Photos correctes, mais la finition noire est un bouleau teinté noir, pas laqué ; dimensions et matière manquent.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Dimensions absentes (constat automatique) : valeurs Artek trouvées. | custom.dimensions = « L 55 × P 66 × H 94 cm ; hauteur d’assise 41 cm » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Variantes |  | La variante « Laqué noir » n’existe pas sous ce nom chez Artek : la version noire est en bouleau teinté noir, qui laisse voir le veinage. | Renommer la variante et l’alt de la photo #1 en « Teinté noir ». |
| ✅ corrigé | moyen | Métachamps |  | Matière absente (constat automatique). | custom.material = « Bouleau massif, laqué blanc ou teinté noir. » |

#### Fauteuil à bascule Mademoiselle — `artek-mademoiselle-rocking-chair`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-mademoiselle-rocking-chair) · [Fiche Artek](https://www.artek.fi/en/products/mademoiselle-rocking-chair) · Fauteuil · 2 variantes · 3 photos · familles du site : Assises  
Artek : Mademoiselle Rocking Chair · Ilmari Tapiovaara · 1956 · Made in Finland · en catalogue  
Dimensions Artek : L 55 × P 91 × H 97 cm ; assise 45 cm (dessin coté de la rubrique « Materials and Dimensions » (valeurs lues dans le SVG de la page))  
Constats : 0 critique, 2 élevé, 5 moyen, 5 faible, 1 info ; 8 corrigés le 29 septembre.  
**Verdict :** Photos correctes. Même erreur de finition noire que le fauteuil, restes d’anglais (« Rocking Chair ») ; le type « Fauteuil » peut rester.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Dimensions absentes (constat automatique) : valeurs Artek trouvées. | custom.dimensions = « L 55 × P 91 × H 97 cm ; hauteur d’assise 45 cm » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Variantes |  | La variante « Laqué noir » est en réalité, chez Artek, un bouleau teinté noir. | Renommer la variante et l’alt de #1 en « Teinté noir ». |
| ✅ corrigé | moyen | Description |  | La description et la méta-description SEO gardent l’anglais « Mademoiselle Rocking Chair » (« Le fauteuil Mademoiselle Rocking Chair… », « Fauteuil Mademoiselle Rocking Chair par… »). | Écrire « Le fauteuil à bascule Mademoiselle… » partout ; ajouter l’année 1956 dans la méta-description. |
| ✅ corrigé | moyen | Métachamps |  | Matière absente (constat automatique). | custom.material = « Bouleau massif, laqué blanc ou teinté noir. » |

#### Fauteuil 45 — `artek-armchair-45`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-armchair-45) · [Fiche Artek](https://www.artek.fi/en/products/armchair-45) · Fauteuil · 8 variantes · 18 photos · familles du site : Assises  
Artek : Armchair 45 · Alvar Aalto · 1947 · Made in Finland · en catalogue  
Dimensions Artek : L 61 × P 64 × H 83 cm ; assise 45,5 cm ; accoudoirs 65,5 cm ; largeur d’assise 55,5/48 cm, profondeur d’assise 44 cm (dessin coté de la rubrique « Materials and Dimensions » (valeurs lues dans le SVG de la page))  
Constats : 0 critique, 0 élevé, 2 moyen, 10 faible, 1 info ; 4 corrigés le 29 septembre.  
**Verdict :** Les huit variantes correspondent exactement aux huit exemples Artek et chaque packshot montre la bonne combinaison ; la description ne parle que de la version cuir.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Description |  | La description ne présente que la version en cuir capitonné, alors que 4 des 8 variantes (dont les deux moins chères et la photo principale) sont en sangles de lin, avec accoudoirs nus, gainés de cuir ou en rotin. | Écrire « Assise et dossier en cuir capitonné ou en sangles de lin ; accoudoirs nus, en rotin, gainés ou passepoilés de cuir selon la version ». |

#### Fauteuil 400 Tank — `artek-armchair-400`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-armchair-400) · [Fiche Artek](https://www.artek.fi/en/products/armchair-400-tank) · Fauteuil · 3 variantes · 7 photos · familles du site : Assises  
Artek : Armchair 400 “Tank” · Alvar Aalto · 1936 (fiche : 1935-36) · Made in Finland · en catalogue  
Dimensions Artek : L 77 × P 77 × H 65 cm ; assise 37 cm ; accoudoirs 51 cm ; profondeur d’assise 58 cm (Armchair 400 Tank Factsheet PDF + dessin artek.fi)  
Constats : 0 critique, 2 élevé, 5 moyen, 6 faible, 0 info ; 8 corrigés le 29 septembre.  
**Verdict :** Les trois packshots de variantes sont justes ; le Zebra n’est pas qualifié (noir/blanc ou brun/blanc) et dimensions, matière et coût manquent.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Dimensions absentes (constat automatique) : valeurs Artek trouvées. | custom.dimensions = « L 77 × P 77 × H 65 cm ; hauteur d’assise 37 cm ; hauteur des accoudoirs 51 cm » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ⬜ à faire | moyen | Prix | Bouleau — tissu Zebra | Coût d’achat absent : Bouleau — tissu Zebra (ART-A400-28200102-ZEB). | Renseigner le coût d’achat. |
| ✅ corrigé | moyen | Photos | Bouleau — tissu Zebra | Alt de l’image de variante « Fauteuil 400 Tank — Artek » sans rapport avec la finition « Bouleau — tissu Zebra ». |  |
| ✅ corrigé | moyen | Métachamps |  | Matière absente (constat automatique). | custom.material = « Structure : lamelles de bouleau massif cintrées. Assise et dossier : ressorts zig-zag, mousse polyuréthane et ouate polyester, revêtement tissu. » |

#### Fauteuil 401 — `artek-armchair-401`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-armchair-401) · [Fiche Artek](https://www.artek.fi/en/products/armchair-401) · Fauteuil · 2 variantes · 4 photos · familles du site : Assises  
Artek : Armchair 401 · Alvar Aalto · 1933 · Made in Finland · en catalogue  
Dimensions Artek : L 62,5 × P 80 × H 105 cm ; assise 40 cm ; accoudoirs 57 cm (dessin coté de la rubrique « Materials and Dimensions » (valeurs lues dans le SVG de la page) ; Factsheet 401/402 PDF)  
Constats : 0 critique, 2 élevé, 5 moyen, 3 faible, 1 info ; 7 corrigés le 29 septembre.  
**Verdict :** Les deux packshots de variantes sont justes ; une photo de galerie montre surtout un 402 ; dimensions et matière manquent.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Dimensions absentes (constat automatique) : valeurs Artek trouvées. | custom.dimensions = « L 62,5 × P 80 × H 105 cm ; hauteur d’assise 40 cm ; hauteur des accoudoirs 57 cm » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Photos | Bouleau — tissu Polo | Alt de l’image de variante « Fauteuil 401 — Artek » sans rapport avec la finition « Bouleau — tissu Polo ». |  |
| ◐ partiel | moyen | Photos |  | La photo de galerie #3 montre au premier plan un Fauteuil 402 en Zebra ; le 401 n’apparaît que petit, en arrière-plan. Dans la bande d’ambiances, le client voit un autre modèle. | Retirer #3 de la fiche 401, ou la placer après #2 avec l’alt « Fauteuil 401 (au fond) et Fauteuil 402 en Zebra ». |
| ✅ corrigé | moyen | Métachamps |  | Matière absente (constat automatique). | custom.material = « Structure : lamelles de bouleau massif cintrées. Assise et dossier : ressorts acier, algues, fibre de bois, mousse polyuréthane et ouate polyester, revêtement tissu. » |

#### Fauteuil 402 — `artek-armchair-402`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-armchair-402) · [Fiche Artek](https://www.artek.fi/en/products/armchair-402) · Fauteuil · 3 variantes · 5 photos · familles du site : Assises  
Artek : Armchair 402 · Alvar Aalto · 1933 · Made in Finland · en catalogue  
Dimensions Artek : L 61 × P 70 × H 76 cm ; assise 42 cm ; accoudoirs 57 cm (dessin coté de la rubrique « Materials and Dimensions » (valeurs lues dans le SVG de la page) ; Factsheet 401/402 PDF)  
Constats : 0 critique, 2 élevé, 5 moyen, 6 faible, 0 info ; 7 corrigés le 29 septembre.  
**Verdict :** Les trois variantes sont bien photographiées (Zebra teinté miel, Nubia, Polo) ; il manque dimensions, matière et coût du Zebra, et le produit est absent de la boutique en ligne Shopify et de Meta.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Dimensions absentes (constat automatique) : valeurs Artek trouvées. | custom.dimensions = « L 61 × P 70 × H 76 cm ; hauteur d’assise 42 cm ; hauteur des accoudoirs 57 cm » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ⬜ à faire | moyen | Prix | Teinté miel — tissu Zebra | Coût d’achat absent : Teinté miel — tissu Zebra (ART-A402-28200302-ZEB). | Renseigner le coût d’achat. |
| ✅ corrigé | moyen | Photos | Bouleau — tissu Polo | Alt de l’image de variante « Fauteuil 402 — Artek » sans rapport avec la finition « Bouleau — tissu Polo ». |  |
| ✅ corrigé | moyen | Métachamps |  | Matière absente (constat automatique). | custom.material = « Structure : lamelles de bouleau massif cintrées. Assise et dossier : ressorts acier, algues, fibre de bois, mousse polyuréthane et ouate polyester, revêtement tissu. » |

#### Fauteuil Domus rembourré — `artek-domus-lounge-chair-upholstered`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-domus-lounge-chair-upholstered) · [Fiche Artek](https://www.artek.fi/en/products/domus-lounge-chair) · Fauteuil · 2 variantes · 2 photos · familles du site : Assises  
Artek : Domus Lounge Chair (versions rembourrées) · Ilmari Tapiovaara · 1946 · Made in Finland · en catalogue (même page que le Domus bois)  
Dimensions Artek : L 59 × P 71 × H 89 cm ; assise 41 cm ; accoudoirs 54,5 cm (dessin coté de la rubrique « Materials and Dimensions » (valeurs lues dans le SVG de la page))  
Constats : 1 critique, 2 élevé, 7 moyen, 5 faible, 0 info ; 9 corrigés le 29 septembre.  
**Verdict :** La photo de la variante chêne montre un Domus en bouleau verni ; l’origine, les dimensions, la matière et toute ambiance manquent.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | critique | Photos |  | La variante « Chêne — cuir noir » (2 750 €) est illustrée par un Domus rembourré en bouleau verni. Le nom du fichier le dit et le bois clair et lisse de la structure le confirme (comparé au packshot chêne #1 du Domus bois, au veinage marqué). Le client voit une autre essence que celle qu’il commande. | Remplacer #2 par le packshot Artek « oak, clear lacquer / leather upholstery, black » avec l’alt « Fauteuil Domus rembourré — Chêne — cuir noir ». Si c’est bien la version bouleau qui est commandée, renommer plutôt la variante « Bouleau — cuir noir ». |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Dimensions absentes (constat automatique) : valeurs Artek trouvées. | custom.dimensions = « L 59 × P 71 × H 89 cm ; hauteur d’assise 41 cm ; hauteur des accoudoirs 54,5 cm » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Photos | Chêne — cuir noir | Alt de l’image de variante « Fauteuil Domus rembourré — Artek » sans rapport avec la finition « Chêne — cuir noir ». |  |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ✅ corrigé | moyen | Métachamps |  | Origine absente (constat automatique), ni custom.origin ni custom.country_of_origin, et pas de tag made-in. | custom.origin = « Fabriqué en Finlande » ; custom.country_of_origin = « Finlande » ; tag « made-in-finlande ». |
| ✅ corrigé | moyen | Métachamps |  | Matière absente (constat automatique). | custom.material = « Structure et accoudoirs : bouleau massif laqué noir ou chêne massif. Coque : contreplaqué de bouleau moulé, revêtement cuir noir sur mousse polyuréthane. » |

#### Fauteuil Karuselli — `artek-karuselli-lounge-chair`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-karuselli-lounge-chair) · [Fiche Artek](https://www.artek.fi/en/products/karuselli-lounge-chair) · Fauteuil · 1 variante · 3 photos · familles du site : Assises  
Artek : Karuselli Lounge Chair · Yrjö Kukkapuro · 1964 · Made in Finland · en catalogue  
Dimensions Artek : L 80 × P 97,5 × H 92 cm ; assise 37 cm (Karuselli Factsheet PDF + dessin artek.fi)  
Constats : 0 critique, 4 élevé, 3 moyen, 5 faible, 0 info ; 8 corrigés le 29 septembre.  
**Verdict :** Fiche à variante unique qui ne dit pas ce qui est vendu (très probablement cuir noir sur coque blanche) ; dimensions et matière manquent.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Options |  | Variante unique « Default Title » : le client ne peut choisir ni la finition ni le revêtement qui existent chez Artek. |  |
| ✅ corrigé | élevé | Variantes |  | Précision sur le constat automatique SINGLE_NO_CHOICE : toutes les photos (#1 à #3) montrent la version cuir noir, coque et piètement blancs, bras chromé. Ni le titre, ni la variante « Default Title », ni la description ne le disent. Artek propose aussi le cuir blanc et tout le nuancier Sörensen Prestige. | Créer l’option « Revêtement » = « Cuir noir » (et « Cuir blanc » si proposé) avec l’alt correspondant, ou au minimum écrire « cuir noir, coque blanche » dans le titre de la variante et la description. |
| ✅ corrigé | élevé | Métachamps |  | Dimensions absentes (constat automatique) : valeurs Artek trouvées. | custom.dimensions = « L 80 × P 97,5 × H 92 cm ; hauteur d’assise 37 cm » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | Matière absente (constat automatique). | custom.material = « Coque et piètement : fibre de verre blanche. Bras de liaison : acier chromé. Assise : cuir sur mousse polyuréthane. Mécanisme pivotant et basculant. » |

#### Repose-pieds Karuselli — `artek-karuselli-ottoman`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-karuselli-ottoman) · [Fiche Artek](https://www.artek.fi/en/products/karuselli-ottoman) · Repose-pieds · 1 variante · 4 photos · familles du site : Assises  
Artek : Karuselli Ottoman · Yrjö Kukkapuro · 1964 · Made in Finland · en catalogue  
Dimensions Artek : L 53,5 × H 38 cm (Karuselli Factsheet PDF + dessin artek.fi ; profondeur non cotée)  
Constats : 0 critique, 4 élevé, 5 moyen, 7 faible, 1 info ; 8 corrigés le 29 septembre.  
**Verdict :** Variante unique non qualifiée (cuir noir d’après les photos) ; la galerie contient un doublon et un packshot du fauteuil seul ; le tag « fauteuil » est faux.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Options |  | Variante unique « Default Title » : le client ne peut choisir ni la finition ni le revêtement qui existent chez Artek. |  |
| ✅ corrigé | élevé | Variantes |  | Précision sur SINGLE_NO_CHOICE : les photos montrent un cuir noir, mais la variante « Default Title » ne le dit pas. Artek propose noir, blanc et rouge. | Option « Revêtement » = « Cuir noir » (+ autres coloris proposés), avec l’alt de #1 adapté. |
| ⬜ à faire | élevé | Métachamps |  | Dimensions absentes (constat automatique) : valeurs Artek trouvées. | custom.dimensions = « L 53,5 × H 38 cm » (profondeur à confirmer auprès d’Artek) |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Photos |  | La photo #2 est un second packshot du même repose-pieds noir, non lié à une variante. Elle s’affiche donc comme « ambiance » et fait doublon avec la photo principale #1. | Supprimer #2, ou la lier à une future variante. |
| ✅ corrigé | moyen | Photos |  | La photo #3 est le packshot du fauteuil Karuselli seul, sans repose-pieds : dans la bande d’ambiances, elle montre un autre produit (vendu 9 395 €). | Retirer #3 (la #4, qui montre le fauteuil avec son repose-pieds, suffit). |
| ⬜ à faire | moyen | Métachamps |  | Matière absente (constat automatique). | custom.material = « Piètement : fibre de verre blanche. Plateau : cuir sur mousse polyuréthane. » |

#### Fauteuil Kiki — `artek-kiki-lounge-chair`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kiki-lounge-chair) · [Fiche Artek](https://www.artek.fi/en/products/kiki-lounge-chair) · Fauteuil · 8 variantes · 4 photos · familles du site : Assises  
Artek : Kiki Lounge Chair · Ilmari Tapiovaara · 1960 · Made in Hungary · en catalogue  
Dimensions Artek : L 60 × P 75 × H 68 cm ; assise 39 cm (dessin coté de la rubrique « Materials and Dimensions » (valeurs lues dans le SVG de la page))  
Constats : 2 critique, 2 élevé, 5 moyen, 8 faible, 1 info ; 10 corrigés le 29 septembre.  
**Verdict :** Les classes de revêtement ne permettent pas de choisir tissu ni couleur, et les photos associées montrent un vert et un noir précis ; dimensions et matière manquent.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ☑ accepté (vente sur devis) | critique | Variantes |  | Le client choisit une classe de prix (Tissu F40…F200, Cuir L40/L60) mais ni le tissu ni la couleur. La description renvoie à « confirmé à la commande ». Le choix obligatoire (quel tissu, quelle couleur) ne peut pas s’exprimer sur la fiche ni dans le panier. | Ajouter un champ obligatoire tissu/couleur (propriété de ligne ou option) avec la liste des tissus Artek par classe, ou limiter la fiche à des combinaisons précises photographiées (ex. « Tissu Aura vert chasseur », « Cuir Sörensen noir »). |
| ☑ accepté (vente sur devis) | critique | Photos |  | Les six classes de tissu affichent le même fauteuil en tissu vert (#1, Aura hunter green chez Artek) et les deux classes de cuir le même cuir noir (#3). Le client est amené à croire qu’il recevra ce vert ou ce noir, quel que soit son choix, alors que la couleur n’est pas fixée. | Remplacer ces photos par un visuel neutre accompagné d’un nuancier, ou décrire la couleur (« photo : tissu Aura vert, autres coloris au choix »). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Dimensions absentes (constat automatique) : valeurs Artek trouvées. | custom.dimensions = « L 60 × P 75 × H 68 cm ; hauteur d’assise 39 cm » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ⬜ à faire | moyen | Photos |  | La photo principale est partagée par 6 variantes : la fiche s’ouvre sur la première d’entre elles. |  |
| ✅ corrigé | moyen | Description |  | La description est générique, avec des restes d’anglais (« collection Lounge Chairs / Sofas d’Artek ») ; elle ne décrit ni le modèle (tube d’acier ovale laqué noir, lignes nettes, collection modulable) ni le créateur ou l’année. | Réécrire : « Dessiné par Ilmari Tapiovaara en 1960, … structure en tube d’acier ovale thermolaqué noir, garnissage mousse PU et ouate polyester… » et déplacer l’explication des classes dans un bloc d’aide. |
| ✅ corrigé | moyen | Métachamps |  | Matière absente (constat automatique). | custom.material = « Structure : tube d’acier ovale thermolaqué noir. Assise et dossier : mousse polyuréthane et ouate polyester, revêtement tissu ou cuir. » |

#### Canapé Kiki 2 places — `artek-kiki-sofa-2-seater`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kiki-sofa-2-seater) · [Fiche Artek](https://www.artek.fi/en/products/kiki-sofa) · Canapé · 8 variantes · 4 photos · familles du site : Assises  
Artek : Kiki Sofa 2-seater · Ilmari Tapiovaara · 1960 · Made in Hungary · en catalogue  
Dimensions Artek : L 116 × P 75 × H 68 cm ; assise 39 cm (dessin coté de la rubrique « Materials and Dimensions » (valeurs lues dans le SVG de la page))  
Constats : 2 critique, 2 élevé, 7 moyen, 8 faible, 2 info ; 11 corrigés le 29 septembre.  
**Verdict :** Mêmes classes de revêtement sans choix du tissu ni de la couleur ; chaque classe de cuir est illustrée par une couleur différente ; origine Hongrie absente et catégorie « objets » côté site.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ☑ accepté (vente sur devis) | critique | Variantes |  | Le client choisit une classe de prix (Tissu F40…F200, Cuir L40/L60) mais ni le tissu ni la couleur. La description renvoie à « confirmé à la commande ». Le choix obligatoire (quel tissu, quelle couleur) ne peut pas s’exprimer sur la fiche ni dans le panier. | Ajouter un champ obligatoire tissu/couleur (propriété de ligne ou option) avec la liste des tissus Artek par classe, ou limiter la fiche à des combinaisons précises photographiées (ex. « Cuir Sörensen Prestige cognac », « Cuir Sörensen Prestige noir »). |
| ☑ accepté (vente sur devis) | critique | Photos |  | Classe « Cuir L40 » = cuir cognac (#1) et classe « Cuir L60 » = cuir noir (#3) : l’image change de couleur quand on change de classe de prix. Le client croit que L40 = cognac et L60 = noir, alors que chez Artek le cognac comme le noir sont en cuir Sörensen Prestige. Les six classes de tissu partagent un tissu gris (#4). | Ne pas associer une couleur à une classe de prix : visuel neutre avec nuancier, ou variantes réelles « Cuir cognac » / « Cuir noir » (même classe) avec leur photo. |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Dimensions absentes (constat automatique) : valeurs Artek trouvées. | custom.dimensions = « L 116 × P 75 × H 68 cm ; hauteur d’assise 39 cm » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ☑ accepté (vente sur devis) | moyen | Photos |  | La photo principale #1 n’est liée qu’à la variante Cuir L40 : la fiche s’ouvre donc sur le cuir cognac à 3 457 € au lieu de la classe d’entrée Tissu F40 à 2 594 €. La carte montre aussi un canapé en cuir. | Mettre en principale le packshot tissu #4 (lié à F40…), ou accepter l’ouverture sur le cuir en connaissance de cause. |
| ✅ corrigé | moyen | Description |  | La description est générique, avec des restes d’anglais (« collection Lounge Chairs / Sofas d’Artek ») ; elle ne décrit ni le modèle (tube d’acier ovale laqué noir, lignes nettes, collection modulable) ni le créateur ou l’année. | Réécrire : « Dessiné par Ilmari Tapiovaara en 1960, … structure en tube d’acier ovale thermolaqué noir, garnissage mousse PU et ouate polyester… » et déplacer l’explication des classes dans un bloc d’aide. |
| ✅ corrigé | moyen | Métachamps |  | Précision sur NO_ORIGIN : le Kiki est fabriqué en Hongrie, pas en Finlande. Il ne faut pas recopier « Fabriqué en Finlande » des autres fiches Artek. Le tag made-in manque aussi. | custom.origin = « Fabriqué en Hongrie » ; custom.country_of_origin = « Hongrie » ; tag « made-in-hongrie ». |
| ✅ corrigé | moyen | Métachamps |  | Matière absente (constat automatique). | custom.material = « Structure : tube d’acier ovale thermolaqué noir. Assise et dossier : mousse polyuréthane et ouate polyester, revêtement tissu ou cuir. » |

#### Canapé Kiki 3 places — `artek-kiki-sofa-3-seater`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kiki-sofa-3-seater) · [Fiche Artek](https://www.artek.fi/en/products/kiki-sofa) · Canapé · 8 variantes · 4 photos · familles du site : Assises  
Artek : Kiki Sofa 3-seater · Ilmari Tapiovaara · 1960 · Made in Hungary · en catalogue  
Dimensions Artek : L 173 × P 75 × H 68 cm ; assise 39 cm (dessin coté de la rubrique « Materials and Dimensions » (valeurs lues dans le SVG de la page))  
Constats : 2 critique, 2 élevé, 7 moyen, 9 faible, 2 info ; 11 corrigés le 29 septembre.  
**Verdict :** Mêmes classes de revêtement sans choix du tissu ni de la couleur ; chaque classe de cuir est illustrée par une couleur différente ; origine Hongrie absente et catégorie « objets » côté site.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ☑ accepté (vente sur devis) | critique | Variantes |  | Le client choisit une classe de prix (Tissu F40…F200, Cuir L40/L60) mais ni le tissu ni la couleur. La description renvoie à « confirmé à la commande ». Le choix obligatoire (quel tissu, quelle couleur) ne peut pas s’exprimer sur la fiche ni dans le panier. | Ajouter un champ obligatoire tissu/couleur (propriété de ligne ou option) avec la liste des tissus Artek par classe, ou limiter la fiche à des combinaisons précises photographiées (ex. « Cuir Sörensen Prestige cognac », « Cuir Sörensen Prestige noir »). |
| ☑ accepté (vente sur devis) | critique | Photos |  | Les six classes de tissu montrent un tissu jaune (#1, Aura canary chez Artek), la classe Cuir L40 du cuir cognac (#3) et la classe Cuir L60 du cuir noir (#4) : la couleur semble dépendre de la classe de prix, et le jaune paraît imposé pour tous les tissus. | Ne pas associer une couleur à une classe de prix : visuel neutre avec nuancier, ou variantes réelles « Cuir cognac » / « Cuir noir » (même classe) avec leur photo. |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Dimensions absentes (constat automatique) : valeurs Artek trouvées. | custom.dimensions = « L 173 × P 75 × H 68 cm ; hauteur d’assise 39 cm » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Photos |  | La photo principale est partagée par 6 variantes : la fiche s’ouvre sur la première d’entre elles. |  |
| ✅ corrigé | moyen | Description |  | La description est générique, avec des restes d’anglais (« collection Lounge Chairs / Sofas d’Artek ») ; elle ne décrit ni le modèle (tube d’acier ovale laqué noir, lignes nettes, collection modulable) ni le créateur ou l’année. | Réécrire : « Dessiné par Ilmari Tapiovaara en 1960, … structure en tube d’acier ovale thermolaqué noir, garnissage mousse PU et ouate polyester… » et déplacer l’explication des classes dans un bloc d’aide. |
| ✅ corrigé | moyen | Métachamps |  | Précision sur NO_ORIGIN : le Kiki est fabriqué en Hongrie, pas en Finlande. Il ne faut pas recopier « Fabriqué en Finlande » des autres fiches Artek. Le tag made-in manque aussi. | custom.origin = « Fabriqué en Hongrie » ; custom.country_of_origin = « Hongrie » ; tag « made-in-hongrie ». |
| ✅ corrigé | moyen | Métachamps |  | Matière absente (constat automatique). | custom.material = « Structure : tube d’acier ovale thermolaqué noir. Assise et dossier : mousse polyuréthane et ouate polyester, revêtement tissu ou cuir. » |

### Tables basses, dessertes et bancs

#### Table basse 90D — `artek-table-90d`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-table-90d) · [Fiche Artek](https://www.artek.fi/en/products/table-90d) · Table basse · 3 variantes · 3 photos · familles du site : Tables  
Artek : Table 90D · Alvar Aalto · 1933 · Made in Finlande (plateau bouleau : Finlande et Allemagne) · en catalogue  
Dimensions Artek : Ø 48 cm, H 44 cm, plateau 3 cm (schéma coté artek.fi)  
Constats : 0 critique, 2 élevé, 5 moyen, 5 faible, 0 info ; 8 corrigés le 29 septembre.  
**Verdict :** Fiche saine sur les photos et les variantes ; il manque surtout l'année, les dimensions et la matière dans les métachamps. L'origine est partiellement inexacte pour le plateau bouleau.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension sur la fiche ; les cotes Artek sont connues. | custom.dimensions = « Ø 48 × H 44 cm » ; custom.year = 1933 ; custom.material = « Pieds et chant : bouleau massif verni. Plateau : placage de bouleau, stratifié HPL blanc ou linoléum noir sur âme en aggloméré. » |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1933 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ✅ corrigé | moyen | Métachamps | Bouleau | « Fabriqué en Finlande » est inexact pour la finition Bouleau : Artek indique que les tables à plateau placage bouleau sont fabriquées en Finlande et en Allemagne. | custom.origin = « Fabriqué en Finlande (plateau bouleau : Finlande et Allemagne) », ou le préciser dans la description. |

#### Table basse Tea Trolley 900 — `artek-tea-trolley-900`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-tea-trolley-900) · [Fiche Artek](https://www.artek.fi/en/products/tea-trolley-900) · Table basse · 2 variantes · 6 photos · familles du site : Tables  
Artek : Tea Trolley 900 · Alvar Aalto · 1937 · Made in Finlande · en catalogue  
Dimensions Artek : 90 × 65 × H 60 cm (schéma coté artek.fi)  
Constats : 0 critique, 0 élevé, 3 moyen, 6 faible, 1 info ; 9 corrigés le 29 septembre.  
**Verdict :** Variantes, photos de variantes et métachamps corrects ; le produit est vendu comme « Table basse » alors que c'est une desserte, et deux ambiances le montrent à peine.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | moyen | Classement |  | Desserte typée « Table basse » : elle n'entre pas dans « Dessertes et chariots » et apparaît parmi les tables basses. |  |
| ✅ corrigé | moyen | Titre |  | Le titre et le titre SEO présentent une desserte à roulettes comme une « Table basse ». | Titre « Desserte Tea Trolley 900 » (SEO : « Desserte Tea Trolley 900 Alvar Aalto (1937) — Artek \| Mikado Deco »), en même temps que le passage au type « Desserte » (constat automatique TROLLEY_TYPE). |
| ✅ corrigé | moyen | Photos | #4, #5 | Les ambiances #4 et #5 montrent une table 91 et des chaises en noyer ; la desserte n'apparaît que coupée au bord droit. | Retirer #4 et #5 ou les placer après #2 et #3, où la desserte est le sujet. |

#### Table basse Tea Trolley 901 — `artek-tea-trolley-901`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-tea-trolley-901) · [Fiche Artek](https://www.artek.fi/en/products/tea-trolley-901) · Table basse · 3 variantes · 8 photos · familles du site : Tables  
Artek : Tea Trolley 901 · Alvar Aalto (version sombre : Hella Jongerius, 2015) · 1936 · Made in Finlande · en catalogue  
Dimensions Artek : 90 × 50 × H 56 cm (schéma coté artek.fi et fiche PDF 2015)  
Constats : 0 critique, 1 élevé, 3 moyen, 8 faible, 1 info ; 9 corrigés le 29 septembre.  
**Verdict :** Les photos de variantes sont justes, mais les libellés « Laqué blanc / … » font croire à une structure laquée blanche alors qu'elle est en bouleau verni : seules les roues sont blanches. Le titre « Table basse » est aussi faux.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Variantes | Laqué blanc / lamifié blanc ; Laqué blanc / linoléum noir | « Laqué blanc » dans les deux premiers libellés désigne en fait les roues ; la structure est en bouleau verni naturel. Le client peut croire à une structure laquée blanche. | « Bouleau verni / plateaux lamifié blanc » et « Bouleau verni / plateaux linoléum noir » (roues blanches précisées dans la description). |
| ✅ corrigé | moyen | Classement |  | Desserte typée « Table basse » : elle n'entre pas dans « Dessertes et chariots » et apparaît parmi les tables basses. |  |
| ✅ corrigé | moyen | Photos | #8 | L'ambiance #8 est un gros plan d'une 901 à plateau linoléum clair ou crème, une finition non vendue ici (ancienne version claire Hella Jongerius ou linoléum blanc). | Retirer #8. |
| ✅ corrigé | moyen | Titre |  | Le titre et le SEO appellent la desserte « Table basse ». | « Desserte Tea Trolley 901 », avec le type « Desserte ». |

#### Table d'appoint 606 — `artek-side-table-606`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-side-table-606) · [Fiche Artek](https://www.artek.fi/en/products/side-table-606) · Table d'appoint · 1 variante · 4 photos · familles du site : Tables  
Artek : Side Table 606 · Aino Aalto · 1932 · Made in Finlande · en catalogue  
Dimensions Artek : Plateau Ø 40 cm, base Ø 50 cm, H 45 cm (schéma artek.fi 40/50/45 ; revendeurs : plateau Ø 40, base Ø 50)  
Constats : 0 critique, 0 élevé, 1 moyen, 8 faible, 1 info ; 6 corrigés le 29 septembre.  
**Verdict :** Créateur (Aino Aalto) et année (1932) exacts, photos correctes ; les dimensions sont mal formulées pour une table ronde et le site la classe en « objets ».

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | moyen | Métachamps |  | Les dimensions sont données en L × P pour une table à plateau rond et base en trois-quarts de lune. | « Plateau Ø 40 cm, base Ø 50 cm, H 45 cm ». |

#### Table d'appoint 915 — `artek-side-table-915`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-side-table-915) · [Fiche Artek](https://www.artek.fi/en/products/side-table-915) · Table d'appoint · 2 variantes · 5 photos · familles du site : Tables  
Artek : Side Table 915 · Alvar Aalto · 1932 · Made in Finlande · en catalogue  
Dimensions Artek : 59 × 49 × H 59 cm (schéma coté artek.fi 49 / 59 / 59)  
Constats : 0 critique, 2 élevé, 1 moyen, 7 faible, 2 info ; 6 corrigés le 29 septembre.  
**Verdict :** Photos et variantes justes ; il manque les dimensions, la matière et le créateur dans le SEO et la description (constats automatiques). Les libellés « Laqué blanc/noir » omettent la structure en bouleau naturel.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension, alors qu'Artek les publie. | custom.dimensions = « L 59 × P 49 × H 59 cm » ; custom.material = « Structure : lamelles de bouleau massif cintrées, vernis naturel. Tablettes : contreplaqué de bouleau moulé, laqué blanc ou noir. » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |

#### Table basse Trienna — `artek-trienna-table`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-trienna-table) · [Fiche Artek](https://www.artek.fi/en/products/trienna-table) · Table basse · 3 variantes · 4 photos · familles du site : Tables  
Artek : Trienna Table · Ilmari Tapiovaara · 1954 · Made in Finlande · en catalogue  
Dimensions Artek : 70 × 62 × H 39 cm (schéma coté artek.fi 70 / 39 / 62 ; confirmé par des revendeurs)  
Constats : 0 critique, 2 élevé, 1 moyen, 8 faible, 1 info ; 7 corrigés le 29 septembre.  
**Verdict :** Variantes et photos conformes à Artek, année 1954 exacte ; il manque les dimensions et la matière, et la seule ambiance montre surtout un fauteuil Kiki.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension sur la fiche. | custom.dimensions = « 70 × 62 × H 39 cm » ; custom.material = « Placage de bouleau moulé, surface placage de chêne (verni naturel, laqué blanc ou teinté noir). » |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |

#### Banc 153A — `artek-bench-153a`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-bench-153a) · [Fiche Artek](https://www.artek.fi/en/products/bench-153a) · Banc · 7 variantes · 11 photos · familles du site : Assises  
Artek : Bench 153A · Alvar Aalto · 1945 · Made in Finlande · en catalogue  
Dimensions Artek : 112,5 × 40 × H 44,5 cm (schéma coté artek.fi)  
Constats : 0 critique, 2 élevé, 7 moyen, 8 faible, 3 info ; 14 corrigés le 29 septembre.  
**Verdict :** Les 7 variantes correspondent aux 7 versions Artek, avec des photos de variantes justes. En revanche, le vernis naturel est écrit de deux façons, ce qui crée une fausse grille 5 × 2, et « Massif » traduit mal « solid top » (plateau plein plaqué).

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension ni année. | custom.dimensions = « L 112,5 × P 40 × H 44,5 cm » ; custom.year = 1945 ; custom.material = « Pieds : bouleau massif. Plateau à lattes : bouleau massif ; plateau plein : placage de bouleau. » |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1945 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Variantes | Verni naturel / Massif | La même finition est écrite « Bouleau verni naturel » (à lattes) et « Verni naturel » (plein). Le sélecteur affiche donc 5 finitions × 2 plateaux, soit 10 combinaisons dont 3 grisées. Les seules versions Artek sont 3 finitions × 2 plateaux, plus le bouleau sauvage à lattes, soit 7. | Renommer « Verni naturel / Massif » en « Bouleau verni naturel / Plein » ; la grille devient 4 × 2 avec une seule combinaison absente (bouleau sauvage plein), qui n'existe pas chez Artek. |
| ✅ corrigé | moyen | Variantes | Verni naturel / Massif ; Laqué blanc / Massif ; Laqué noir / Massif | « Massif » traduit « solid top » à tort : chez Artek, le plateau plein est en placage de bouleau sur âme contreplaqué et nid d'abeille, alors que c'est le plateau à lattes qui est en bouleau massif. | Valeur d'option « Plein » (ou « Plateau plein »), et non « Massif » ; retirer ou nuancer le tag bois-massif. |
| ✅ corrigé | moyen | Description |  | La description présente le 153A comme un banc à plateau à lattes, alors que 3 variantes ont un plateau plein. | « Proposé avec plateau à lattes en bouleau massif ou plateau plein plaqué bouleau. » |
| ◐ partiel | moyen | Photos | #2, #3, #4, #5 | #2 montre un banc à lattes à teinte miel prononcée, sans doute une ancienne teinte non proposée (à confirmer). #3 et #5 (« bench-153-solid-top ») montrent un banc plein court dont les proportions évoquent plutôt le 153B (à confirmer). #4 (776 px) montre le banc très petit, à l'arrière-plan. | Vérifier #3 et #5 auprès d'Artek et les déplacer sur 153B si besoin ; retirer #4 ; garder #2 seulement si la teinte est confirmée. |

#### Banc 153B — `artek-bench-153b`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-bench-153b) · [Fiche Artek](https://www.artek.fi/en/products/bench-153b) · Banc · 7 variantes · 20 photos · familles du site : Assises  
Artek : Bench 153B · Alvar Aalto · 1945 · Made in Finlande · en catalogue  
Dimensions Artek : 72,5 × 40 × H 44,5 cm (schéma coté artek.fi)  
Constats : 0 critique, 4 élevé, 6 moyen, 5 faible, 2 info ; 12 corrigés le 29 septembre.  
**Verdict :** La fiche vend le 153B standard (7 variantes justes), mais sa description et 13 photos de galerie sur 20 présentent les éditions limitées Marimekko Kivet et Seireeni, qu'on ne peut pas commander ici.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Description |  | La description porte entièrement sur le « banc 153B Kivet » en édition limitée Artek + Marimekko (motif Maija Isola en marqueterie), alors que les variantes vendues sont les bancs standard à lattes ou pleins. | Réécrire : « Dessiné par Alvar Aalto en 1945, le banc 153B est la version courte (72,5 cm) du banc à pieds en L… plateau à lattes en bouleau massif ou plateau plein plaqué bouleau, verni naturel, laqué blanc ou noir, ou bouleau sauvage. » |
| ✅ corrigé | élevé | Photos | #2–#9, #16–#20 | 13 photos de galerie sur 20 montrent les éditions limitées Kivet ou Seireeni (marqueterie Marimekko). La bande d'ambiances de la fiche est donc remplie d'un produit qu'on ne peut pas commander. | Retirer #2 à #9 et #16 à #20 ; ajouter des ambiances du 153B standard (artek.fi). |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension ni année ; la longueur est pourtant ce qui distingue 153A de 153B. | custom.dimensions = « L 72,5 × P 40 × H 44,5 cm » ; custom.year = 1945 ; custom.material comme pour le 153A. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1945 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ⬜ à faire | moyen | Photos |  | Image basse définition 874×874 (variante) : packshot-766fc2018676a7aef2323198f66f97b4.png. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ✅ corrigé | moyen | Tags |  | Les tags edition-limitee et objet-de-collection sont faux pour les variantes vendues. | Retirer ; appliquer au 153B les mêmes corrections qu'au 153A (bouleau-sauvage, pas de verni-naturel en double). |
| ✅ corrigé | moyen | Variantes | Verni naturel / Massif | Le vernis naturel est écrit de deux façons (« Bouleau verni naturel » à lattes, « Verni naturel » plein) : 10 combinaisons affichées pour 7 versions réelles ; « Massif » traduit mal « solid top » (plateau plein). | « Bouleau verni naturel / Plein » ; valeur de plateau « Plein » au lieu de « Massif ». |

#### Banc 168B — `artek-bench-168b`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-bench-168b) · [Fiche Artek](https://www.artek.fi/en/products/bench-168b) · Banc · 3 variantes · 5 photos · familles du site : Assises  
Artek : Bench 168B · Alvar Aalto · 1945 · Made in Finlande · en catalogue  
Dimensions Artek : 150 × 35 × H 45 cm (plateau plein) ; H 46,5 cm (rembourré) (schéma coté artek.fi)  
Constats : 0 critique, 2 élevé, 4 moyen, 7 faible, 3 info ; 8 corrigés le 29 septembre.  
**Verdict :** Photos et finitions correctes ; l'option « Plateau = Massif », à une seule valeur, est inutile et inexacte (plateau plaqué), et il manque les dimensions et l'année.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension ni année. | custom.dimensions = « L 150 × P 35 × H 45 cm » ; custom.year = 1945 ; custom.material = « Pieds : bouleau massif. Plateau : placage de bouleau sur âme bouleau, contreplaqué et nid d'abeille. » |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1945 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ◐ partiel | moyen | Variantes |  | Option « Plateau » à valeur unique « Massif » : elle ne sert à rien et elle est inexacte, puisque le plateau plein du 168B est en placage de bouleau sur âme nid d'abeille. | Supprimer l'option Plateau (ou « Plein » si des versions rembourrées sont ajoutées) ; libellés « Bouleau verni naturel », « Laqué blanc », « Laqué noir ». |

#### Banc 167 — `artek-bench-167`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-bench-167) · [Fiche Artek](https://www.artek.fi/en/products/bench-167) · Banc · 3 variantes · 5 photos · familles du site : Assises  
Artek : Bench 167 · Alvar Aalto · 1945 · Made in Finlande · en catalogue  
Dimensions Artek : 180 × 60 × H 45,5 cm (schéma coté artek.fi ; confirmé par des revendeurs)  
Constats : 0 critique, 2 élevé, 4 moyen, 5 faible, 2 info ; 8 corrigés le 29 septembre.  
**Verdict :** Les trois variantes cuir Prestige cognac existent (cuir L40 Sørensen Prestige) et leurs photos sont justes ; mais les deux ambiances montrent un cuir noir non proposé, le tissu annoncé ne se commande pas, et il manque les dimensions.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension ni matière. | custom.dimensions = « L 180 × P 60 × H 45,5 cm » ; custom.material = « Pieds : bouleau massif. Assise : contreplaqué de bouleau, mousse PU, cuir Sørensen Prestige cognac. » ; custom.usage = Intérieur. |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Photos | #2, #3 | Les ambiances #2 et #3 montrent un banc 167 en cuir noir sur pieds noirs, une couleur de cuir non proposée : seul le cuir Prestige cognac est vendu. | Remplacer par des ambiances cuir cognac, ou indiquer dans l'alt « exemple en cuir noir, sur demande ». |
| ✅ corrigé | moyen | Description |  | La description annonce « disponible en revêtement tissu ou cuir », mais aucune variante tissu n'existe. | « Proposé en ligne en cuir Prestige cognac ; autres cuirs et tissus Artek sur demande. » |

#### Banc Kiki 1 place — `artek-kiki-bench-1-seater`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kiki-bench-1-seater) · [Fiche Artek](https://www.artek.fi/en/products/kiki-bench) · Banc · 8 variantes · 3 photos · familles du site : Assises  
Artek : Kiki Bench 1-seater · Ilmari Tapiovaara · 1960 · Made in Hongrie · en catalogue  
Dimensions Artek : 60 × 54 × H 39 cm (schéma coté artek.fi)  
Constats : 1 critique, 3 élevé, 6 moyen, 8 faible, 4 info ; 9 corrigés le 29 septembre.  
**Verdict :** Classes de revêtement sans choix du tissu ni de la couleur, et photos de coloris précis rattachées à des classes : le client ne peut pas savoir ce qu'il commande ; fiche par ailleurs sans dimensions ni matière.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ☑ accepté (vente sur devis) | critique | Variantes |  | L'option « Revêtement » ne propose que des classes de prix (Tissu F40…F200, Cuir L40/L60), sans choix du tissu ni de la couleur. Le client paie sans pouvoir dire ce qu'il veut, et reçoit un revêtement « confirmé à la commande ». | Ajouter un champ obligatoire (propriété de ligne) « Tissu / cuir et coloris » avec la liste Artek par classe, ou limiter la vente en ligne à quelques coloris nommés (ex. Hallingdal 65 / 130). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ☑ accepté (vente sur devis) | élevé | Photos | #1, #3 | Les photos de variantes montrent des coloris précis (tissu : #1 packshot 485×485, tissu gris ; cuir : indian red (#3)) pour des classes de prix entières. Le client choisit « Cuir L60 » et voit un cuir indian red qu'il ne recevra pas forcément. | Ajouter un alt « Exemple de revêtement : … » et un avertissement visible sous le sélecteur, ou montrer un nuancier par classe. |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension, aucune matière, aucun usage. | custom.dimensions = « L 60 × P 54 × H 39 cm » ; custom.material = « Structure : tube d'acier ovale thermolaqué noir. Assise : mousse PU et ouate polyester, tissu ou cuir. » ; custom.usage = Intérieur ; custom.country_of_origin = Hongrie ; custom.origin = « Fabriqué en Hongrie ». |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ⬜ à faire | moyen | Métachamps |  | Format non standard : « Fabriqué en Hongrie / Édité par Artek ». |  |
| ⬜ à faire | moyen | Photos |  | La photo principale est partagée par 6 variantes : la fiche s’ouvre sur la première d’entre elles. |  |
| ✅ corrigé | moyen | Photos |  | Image basse définition 485×485 (variante) : packshot-c9a481124c04684ec4b7804b0305d3d7.png. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ✅ corrigé | moyen | Description |  | La description est générique et commerciale (« pièce de la collection Benches d'Artek », avec « Benches » en anglais) ; elle ne dit rien du produit (tube d'acier ovale, 1960, Tapiovaara). | Reprendre le texte Artek : « Le banc Kiki d'Ilmari Tapiovaara (1960) repose sur une structure en tube d'acier ovale ; son assise rembourrée aux arêtes adoucies… » |

#### Banc Kiki 2 places — `artek-kiki-bench-2-seater`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kiki-bench-2-seater) · [Fiche Artek](https://www.artek.fi/en/products/kiki-bench) · Banc · 8 variantes · 3 photos · familles du site : Assises  
Artek : Kiki Bench 2-seater · Ilmari Tapiovaara · 1960 · Made in Hongrie · en catalogue  
Dimensions Artek : 116 × 54 × H 39 cm (schéma coté artek.fi)  
Constats : 1 critique, 3 élevé, 5 moyen, 8 faible, 4 info ; 9 corrigés le 29 septembre.  
**Verdict :** Classes de revêtement sans choix du tissu ni de la couleur, et photos de coloris précis rattachées à des classes : le client ne peut pas savoir ce qu'il commande ; fiche par ailleurs sans dimensions ni matière.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ☑ accepté (vente sur devis) | critique | Variantes |  | L'option « Revêtement » ne propose que des classes de prix (Tissu F40…F200, Cuir L40/L60), sans choix du tissu ni de la couleur. Le client paie sans pouvoir dire ce qu'il veut, et reçoit un revêtement « confirmé à la commande ». | Ajouter un champ obligatoire (propriété de ligne) « Tissu / cuir et coloris » avec la liste Artek par classe, ou limiter la vente en ligne à quelques coloris nommés (ex. Hallingdal 65 / 407). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ☑ accepté (vente sur devis) | élevé | Photos | #1, #2 | Les photos de variantes montrent des coloris précis (tissu : #1 packshot, tissu crème ; cuir : mocca (#2)) pour des classes de prix entières. Le client choisit « Cuir L60 » et voit un cuir mocca qu'il ne recevra pas forcément. | Ajouter un alt « Exemple de revêtement : … » et un avertissement visible sous le sélecteur, ou montrer un nuancier par classe. |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension, aucune matière, aucun usage. | custom.dimensions = « L 116 × P 54 × H 39 cm » ; custom.material = « Structure : tube d'acier ovale thermolaqué noir. Assise : mousse PU et ouate polyester, tissu ou cuir. » ; custom.usage = Intérieur ; custom.country_of_origin = Hongrie ; custom.origin = « Fabriqué en Hongrie ». |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ⬜ à faire | moyen | Métachamps |  | Format non standard : « Fabriqué en Hongrie / Édité par Artek ». |  |
| ⬜ à faire | moyen | Photos |  | La photo principale est partagée par 6 variantes : la fiche s’ouvre sur la première d’entre elles. |  |
| ✅ corrigé | moyen | Description |  | La description est générique et commerciale (« pièce de la collection Benches d'Artek », avec « Benches » en anglais) ; elle ne dit rien du produit (tube d'acier ovale, 1960, Tapiovaara). | Reprendre le texte Artek : « Le banc Kiki d'Ilmari Tapiovaara (1960) repose sur une structure en tube d'acier ovale ; son assise rembourrée aux arêtes adoucies… » |

#### Banc Kiki 3 places — `artek-kiki-bench-3-seater`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kiki-bench-3-seater) · [Fiche Artek](https://www.artek.fi/en/products/kiki-bench) · Banc · 8 variantes · 2 photos · familles du site : Assises  
Artek : Kiki Bench 3-seater · Ilmari Tapiovaara · 1960 · Made in Hongrie · en catalogue  
Dimensions Artek : 173 × 54 × H 39 cm (schéma coté artek.fi)  
Constats : 1 critique, 3 élevé, 6 moyen, 8 faible, 4 info ; 8 corrigés le 29 septembre.  
**Verdict :** Classes de revêtement sans choix du tissu ni de la couleur, et photos de coloris précis rattachées à des classes : le client ne peut pas savoir ce qu'il commande ; fiche par ailleurs sans dimensions ni matière.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ☑ accepté (vente sur devis) | critique | Variantes |  | L'option « Revêtement » ne propose que des classes de prix (Tissu F40…F200, Cuir L40/L60), sans choix du tissu ni de la couleur. Le client paie sans pouvoir dire ce qu'il veut, et reçoit un revêtement « confirmé à la commande ». | Ajouter un champ obligatoire (propriété de ligne) « Tissu / cuir et coloris » avec la liste Artek par classe, ou limiter la vente en ligne à quelques coloris nommés (ex. Hallingdal 65 / 173). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ☑ accepté (vente sur devis) | élevé | Photos | #1, #2 | Les photos de variantes montrent des coloris précis (tissu : #1 packshot, assise noire ; cuir : walnut (#2)) pour des classes de prix entières. Le client choisit « Cuir L60 » et voit un cuir walnut qu'il ne recevra pas forcément. | Ajouter un alt « Exemple de revêtement : … » et un avertissement visible sous le sélecteur, ou montrer un nuancier par classe. |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension, aucune matière, aucun usage. | custom.dimensions = « L 173 × P 54 × H 39 cm » ; custom.material = « Structure : tube d'acier ovale thermolaqué noir. Assise : mousse PU et ouate polyester, tissu ou cuir. » ; custom.usage = Intérieur ; custom.country_of_origin = Hongrie ; custom.origin = « Fabriqué en Hongrie ». |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ⬜ à faire | moyen | Métachamps |  | Format non standard : « Fabriqué en Hongrie / Édité par Artek ». |  |
| ⬜ à faire | moyen | Photos |  | La photo principale est partagée par 6 variantes : la fiche s’ouvre sur la première d’entre elles. |  |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ✅ corrigé | moyen | Description |  | La description est générique et commerciale (« pièce de la collection Benches d'Artek », avec « Benches » en anglais) ; elle ne dit rien du produit (tube d'acier ovale, 1960, Tapiovaara). | Reprendre le texte Artek : « Le banc Kiki d'Ilmari Tapiovaara (1960) repose sur une structure en tube d'acier ovale ; son assise rembourrée aux arêtes adoucies… » |

#### Table basse Kiki 60 × 60 cm — `table-basse-kiki-60-x-60-cm`

[Fiche Mikado](https://www.mikadodeco.be/products/table-basse-kiki-60-x-60-cm) · [Fiche Artek](https://www.artek.fi/en/products/kiki-low-table) · Table basse · 1 variante · 4 photos · familles du site : Tables  
Artek : Kiki Low Table 60 × 60 cm · Ilmari Tapiovaara · 1960 · Made in Hongrie et Danemark · en catalogue  
Dimensions Artek : 60 × 60 × H 42 cm (schéma coté artek.fi)  
Constats : 0 critique, 0 élevé, 7 moyen, 8 faible, 2 info ; 11 corrigés le 29 septembre.  
**Verdict :** Le bon modèle et la bonne taille sont en photo principale ; libellé de finition incomplet, description fausse (linoléum), hauteur et année absentes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide alors que custom.country_of_origin = « Hongrie » : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Description |  | Description identique à table-basse-kiki-100-x-60-cm, table-basse-kiki-140-x-60-cm. | Rédiger une description propre à chaque taille/version. |
| ✅ corrigé | moyen | Variantes |  | L'unique finition « Noir thermolaquée » ne décrit que la structure (avec une faute d'accord) et ne dit rien du plateau, en stratifié HPL noir. | « Acier thermolaqué noir / plateau stratifié noir ». |
| ✅ corrigé | moyen | Description |  | La description annonce « un plateau en linoléum ou en stratifié », mais Artek ne propose que le HPL et la fiche n'offre aucun choix. | « Plateau en stratifié HPL noir » ; « table basse rectangulaire » pour les formats 100 et 140. |
| ✅ corrigé | moyen | Métachamps |  | Les dimensions n'indiquent pas la hauteur ; l'année (1960) et l'origine publiée manquent. | custom.dimensions = « L 60 × P 60 × H 42 cm » ; custom.year = 1960 ; custom.origin = « Fabriqué en Hongrie et au Danemark » ; custom.material = « Structure : tube d'acier ovale thermolaqué noir. Plateau : stratifié HPL noir sur aggloméré. » |

#### Table basse Kiki 100 × 60 cm — `table-basse-kiki-100-x-60-cm`

[Fiche Mikado](https://www.mikadodeco.be/products/table-basse-kiki-100-x-60-cm) · [Fiche Artek](https://www.artek.fi/en/products/kiki-low-table) · Table basse · 1 variante · 5 photos · familles du site : Tables  
Artek : Kiki Low Table 100 × 60 cm · Ilmari Tapiovaara · 1960 · Made in Hongrie et Danemark · en catalogue  
Dimensions Artek : 100 × 60 × H 42 cm (schéma coté artek.fi)  
Constats : 0 critique, 0 élevé, 8 moyen, 8 faible, 2 info ; 11 corrigés le 29 septembre.  
**Verdict :** Le bon modèle et la bonne taille sont en photo principale ; libellé de finition incomplet, description fausse (linoléum, « carrée »), hauteur et année absentes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide alors que custom.country_of_origin = « Hongrie » : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Description |  | Description identique à table-basse-kiki-60-x-60-cm, table-basse-kiki-140-x-60-cm. | Rédiger une description propre à chaque taille/version. |
| ✅ corrigé | moyen | Variantes |  | L'unique finition « Noir thermolaquée » ne décrit que la structure (avec une faute d'accord) et ne dit rien du plateau, en stratifié HPL noir. | « Acier thermolaqué noir / plateau stratifié noir ». |
| ✅ corrigé | moyen | Description |  | La description annonce « un plateau en linoléum ou en stratifié », mais Artek ne propose que le HPL et la fiche n'offre aucun choix. Elle qualifie aussi la table de « carrée », alors qu'elle mesure 100 × 60 cm. | « Plateau en stratifié HPL noir » ; « table basse rectangulaire » pour les formats 100 et 140. |
| ✅ corrigé | moyen | Métachamps |  | Les dimensions n'indiquent pas la hauteur ; l'année (1960) et l'origine publiée manquent. | custom.dimensions = « L 100 × P 60 × H 42 cm » ; custom.year = 1960 ; custom.origin = « Fabriqué en Hongrie et au Danemark » ; custom.material = « Structure : tube d'acier ovale thermolaqué noir. Plateau : stratifié HPL noir sur aggloméré. » |
| ✅ corrigé | moyen | Photos | #5 | La galerie #5 est un packshot Artek « Linoleum » : un plateau en linoléum qui n'est plus proposé. Il apparaît comme une ambiance et appuie la mention erronée de la description. | Remplacer par le packshot HPL 100 cm. |

#### Table basse Kiki 140 × 60 cm — `table-basse-kiki-140-x-60-cm`

[Fiche Mikado](https://www.mikadodeco.be/products/table-basse-kiki-140-x-60-cm) · [Fiche Artek](https://www.artek.fi/en/products/kiki-low-table) · Table basse · 1 variante · 4 photos · familles du site : Tables  
Artek : Kiki Low Table 140 × 60 cm · Ilmari Tapiovaara · 1960 · Made in Hongrie et Danemark · en catalogue  
Dimensions Artek : 140 × 60 × H 42 cm (schéma coté artek.fi)  
Constats : 0 critique, 0 élevé, 7 moyen, 8 faible, 2 info ; 10 corrigés le 29 septembre.  
**Verdict :** Le bon modèle et la bonne taille sont en photo principale ; libellé de finition incomplet, description fausse (linoléum, « carrée »), hauteur et année absentes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide alors que custom.country_of_origin = « Hongrie » : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Description |  | Description identique à table-basse-kiki-60-x-60-cm, table-basse-kiki-100-x-60-cm. | Rédiger une description propre à chaque taille/version. |
| ✅ corrigé | moyen | Variantes |  | L'unique finition « Noir thermolaquée » ne décrit que la structure (avec une faute d'accord) et ne dit rien du plateau, en stratifié HPL noir. | « Acier thermolaqué noir / plateau stratifié noir ». |
| ✅ corrigé | moyen | Description |  | La description annonce « un plateau en linoléum ou en stratifié », mais Artek ne propose que le HPL et la fiche n'offre aucun choix. Elle qualifie aussi la table de « carrée », alors qu'elle mesure 140 × 60 cm. | « Plateau en stratifié HPL noir » ; « table basse rectangulaire » pour les formats 100 et 140. |
| ✅ corrigé | moyen | Métachamps |  | Les dimensions n'indiquent pas la hauteur ; l'année (1960) et l'origine publiée manquent. | custom.dimensions = « L 140 × P 60 × H 42 cm » ; custom.year = 1960 ; custom.origin = « Fabriqué en Hongrie et au Danemark » ; custom.material = « Structure : tube d'acier ovale thermolaqué noir. Plateau : stratifié HPL noir sur aggloméré. » |

### Rangement, miroir, paravent et collection Kaari

#### Étagère murale 112 — `artek-wall-shelf-112`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-wall-shelf-112) · [Fiche Artek](https://www.artek.fi/en/products/wall-shelf-112) · Étagère murale · 3 variantes · 6 photos · familles du site : aucune  
Artek : Wall Shelf 112 (version vendue : 112B) · Alvar Aalto · 1936 · Made in Finland · en catalogue  
Dimensions Artek : 112B : L 90 × P 25–27 × H 25 cm (cotes artek.fi 90 / 27 / 25 / 24,5 ; Factsheet 2014 : 90 × 25 × 25) ; 112A (non vendu en ligne) : 90 × 36 × 25  
Constats : 0 critique, 2 élevé, 2 moyen, 10 faible, 0 info ; 11 corrigés le 29 septembre.  
**Verdict :** Photos et variantes justes ; produit invisible dans le menu (type « Étagère murale » hors règles), code 112B absent du titre, matière et poids manquants.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Étagère murale »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Classement |  | Type « Étagère murale » absent des règles de la collection etageres-et-bibliotheques (qui n'accepte que « Étagère », « Etagère », « Bibliothèque »). | Soit passer le type à « Étagère », soit ajouter TYPE = « Étagère murale » à la règle etageres-et-bibliotheques (corrige aussi Étagère murale Kaari). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Matière absente alors qu'elle est connue. | custom.material = « Supports en bouleau massif lamellé cintré, tablette en placage de bouleau ». |

#### Buffet 250 — `artek-cabinet-250`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-cabinet-250) · [Fiche Artek](https://www.artek.fi/en/products/cabinet-250) · Buffet · 1 variante · 5 photos · familles du site : Rangement  
Artek : Cabinet 250 · Alvar Aalto (esprit d'Aino Aalto selon Artek) · 1936-1937 · Made in Finland and Germany · en catalogue  
Dimensions Artek : Cotes artek.fi : 100 / 95 / 60 / 40 cm (probablement L 100 × P 40 × H 95 cm, 60 = hauteur du corps — à confirmer)  
Constats : 0 critique, 2 élevé, 5 moyen, 6 faible, 1 info ; 5 corrigés le 29 septembre.  
**Verdict :** Fiche bien rédigée et photos pertinentes ; manquent année, dimensions, matière ; origine incomplète.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Métachamps |  | Meuble à 3 001 € sans dimensions. | custom.dimensions = « L 100 × P 40 × H 95 cm » après vérification du schéma Artek. |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | Année absente alors qu'Artek donne 1936-1937. | custom.year = 1936 (ou « 1936-1937 ») ; tag annees-1930. |
| ✅ corrigé | moyen | Métachamps |  | Origine « Fabriqué en Finlande » incomplète. | custom.origin = « Fabriqué en Finlande et en Allemagne ». |
| ⬜ à faire | moyen | Métachamps |  | Matière absente. | custom.material = « Bouleau massif et placage de bouleau teintés miel ». |

#### Patère murale Tupla — `artek-tupla-wall-hook`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-tupla-wall-hook) · [Fiche Artek](https://www.artek.fi/en/products/tupla-wall-hook) · Patère murale · 1 variante · 7 photos · familles du site : Rangement  
Artek : Tupla Wall Hook · Ronan & Erwan Bouroullec · 2020 · Made in Italy · en catalogue  
Dimensions Artek : Cotes artek.fi : 31 / 31 / 13,5 / 3 cm (hauteur ≈ 31 cm — détail à confirmer)  
Constats : 0 critique, 2 élevé, 4 moyen, 10 faible, 1 info ; 10 corrigés le 29 septembre.  
**Verdict :** Fiche correcte et photos bonnes ; manquent année et dimensions, alts génériques.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Métachamps |  | Aucune dimension. | custom.dimensions d'après le schéma Artek (≈ H 31 × P 13,5 cm, à confirmer). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 2020 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide alors que 2020 est cité partout. | custom.year = 2020. |

#### Miroir 124 — `artek-124-mirror`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-124-mirror) · [Fiche Artek](https://www.artek.fi/en/products/124-mirror (redirige vers la liste produits)) · Miroir · 2 variantes · 4 photos · familles du site : Décoration  
Artek : 124° Mirror, medium, with shelf · Daniel Rybakken · 2017 (lancement Artek 2018 selon Artek Helsinki — à confirmer) · Made in introuvable · arrêté probable (page artek.fi redirigée)  
Dimensions Artek : Moyen avec tablette : 42 × 18 × 35 cm (smow, à confirmer)  
Constats : 0 critique, 5 élevé, 9 moyen, 9 faible, 0 info ; 11 corrigés le 29 septembre.  
**Verdict :** Fiche squelettique d'un produit probablement retiré du catalogue Artek : créateur, année, dimensions, matière absents ; photo principale = ambiance basse définition ; libellés incomplets.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.designer vide : pas de créateur sur la fiche ni de lien créateur. | Renseigner custom.designer (voir reference-artek.csv) ou laisser vide si Artek ne crédite personne. |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Données fabricant |  | La page artek.fi du 124° Mirror redirige vers la liste des produits : produit vraisemblablement arrêté, mais vendu « 3-4 semaines » avec stock 0 et politique CONTINUE. | Confirmer la disponibilité auprès d'Artek ; sinon passer en DENY / brouillon. |
| ✅ corrigé | élevé | Métachamps |  | Créateur absent : Daniel Rybakken (le nom de fichier de #2 le cite). | custom.designer = Daniel Rybakken ; tag daniel-rybakken ; SEO « Miroir 124° Daniel Rybakken — Artek ». |
| ⬜ à faire | élevé | Photos | Moyen · #1 | Photo principale = ambiance recadrée (mur en bois, objet coupé en bas), 543×739 : pas un packshot. | Utiliser un packshot carré haute définition de la version tablette frêne naturel ; garder #1 en galerie. |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Description |  | Description très courte (141 caractères). |  |
| ⬜ à faire | moyen | Photos |  | Image basse définition 543×739 (variante) : artek-artek-124-mirror-00.png. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ⬜ à faire | moyen | Métachamps |  | Année absente. | custom.year = 2017 (à confirmer) ; tag annees-2010. |
| ✅ corrigé | moyen | Variantes | Moyen | « Moyen » ne dit pas la finition de la tablette (frêne naturel), alors que l'autre valeur précise « laqué noir » : choix peu lisible. | Option « Tablette » : « Frêne naturel », « Frêne laqué noir » (taille Moyen dans le titre). |
| ✅ corrigé | moyen | Titre |  | Titre « Miroir 124 » : nom officiel « 124° Mirror », taille et tablette absentes. | « Miroir 124° moyen avec tablette ». |
| ✅ corrigé | moyen | Description |  | Description réduite à une phrase avec restes d'anglais (« 124 Mirror », « Storage & Organisation »), aucune info produit (deux faces à 124°, acier poli, tablette frêne). | Réécrire : principe des deux faces à 124°, matières, tablette, fixation murale ou posé, dimensions. |

#### Porte-parapluie 115 — `artek-115-umbrella-stand`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-115-umbrella-stand) · [Fiche Artek](https://www.artek.fi/en/products/umbrella-stand-115) · Porte-parapluie · 1 variante · 2 photos · familles du site : aucune  
Artek : Umbrella Stand 115 · Alvar Aalto · 1936 · Made in Finland · en catalogue  
Dimensions Artek : Cotes artek.fi : H 48 × 28 × 24,5 cm  
Constats : 0 critique, 4 élevé, 4 moyen, 7 faible, 0 info ; 14 corrigés le 29 septembre.  
**Verdict :** Photos justes ; invisible dans le menu, libellé « Laiton » réducteur, année/dimensions/matière absentes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Porte-parapluie »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Classement |  | Type « Porte-parapluie » repris par aucune collection du menu. | Ajouter TYPE = « Porte-parapluie » à la règle rangement (et éventuellement pateres-et-porte-manteaux). |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension. | custom.dimensions = « H 48 × 28 × 24,5 cm ». |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1936 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide. | custom.year = 1936. |

#### Étagère Kanto — `artek-kanto`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kanto) · [Fiche Artek](https://www.artek.fi/en/products/kanto-magazine-firewood-rack-pn001) · Étagère · 3 variantes · 5 photos · familles du site : Rangement  
Artek : Kanto Magazine-/Firewood Rack PN001 · Pancho Nikander · 2004 · Made in Estonia · en catalogue  
Dimensions Artek : L 34 × P 28,3 × H 56,5 cm (Factsheet PN001 ; artek.fi 34 / 28 / 56,5)  
Constats : 0 critique, 3 élevé, 2 moyen, 6 faible, 2 info ; 9 corrigés le 29 septembre.  
**Verdict :** Photos et variantes justes, mais nommé et classé comme une « étagère » alors que c'est un porte-revues / porte-bûches ; dimensions absentes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Titre |  | « Étagère Kanto » est trompeur : c'est un porte-revues / porte-bûches (la description le dit). | Titre « Porte-revues et porte-bûches Kanto PN001 » ; SEO idem. |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension. | custom.dimensions = « L 34 × P 28,3 × H 56,5 cm ». |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Classement |  | Type « Étagère » → le produit apparaît dans « Étagères et bibliothèques » ; tag etagere faux. | Type « Porte-revues » ajouté à la règle rangement ; retirer le tag etagere, ajouter porte-revues. |

#### Porte-manteau Kiila — `artek-kiila-coat-stand`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kiila-coat-stand) · [Fiche Artek](https://www.artek.fi/en/products/kiila-coat-stand) · Patère · 3 variantes · 6 photos · familles du site : Rangement  
Artek : Kiila Coat Stand · Daniel Rybakken · 2017 · Made in Poland · en catalogue  
Dimensions Artek : Cotes artek.fi : H 192 × 54 × 48 cm  
Constats : 0 critique, 2 élevé, 4 moyen, 9 faible, 1 info ; 13 corrigés le 29 septembre.  
**Verdict :** Photos justes pour chaque variante ; libellés « Noir » et « Pierre blanc » ambigus (pieds en frêne naturel), dimensions et matière absentes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension. | custom.dimensions = « H 192 cm, emprise 54 × 48 cm ». |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Photos | Noir | Alt de l’image de variante « Porte-manteau Kiila — Artek » sans rapport avec la finition « Noir ». |  |
| ✅ corrigé | moyen | Variantes | Noir · #6 | « Noir » désigne en réalité des pieds en frêne verni naturel avec structure et patères noires ; confusion possible avec « Laqué noir ». | « Frêne naturel / structure noire ». |
| ✅ corrigé | moyen | Métachamps |  | Matière absente ; la description ne cite pas le frêne. | custom.material = « Frêne massif, acier thermolaqué, polyamide » ; ajouter « en frêne massif » dans la description. |

#### Porte-manteau 160 — `artek-clothes-tree-160`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-clothes-tree-160) · [Fiche Artek](https://www.artek.fi/en/products/clothes-tree-160) · Patère · 2 variantes · 3 photos · familles du site : Rangement  
Artek : Clothes Tree 160 · Anna-Maija Jaatinen · 1964 · Made in Estonia · en catalogue  
Dimensions Artek : Cotes artek.fi : H 177 cm, piètement 61 cm  
Constats : 0 critique, 2 élevé, 3 moyen, 7 faible, 1 info ; 6 corrigés le 29 septembre.  
**Verdict :** Créateur, année et origine exacts ; photos de variantes justes ; dimensions et matière absentes, galerie faible.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension (le « 160 » du nom n'est pas la hauteur). | custom.dimensions = « H 177 cm, Ø piètement 61 cm ». |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Matière absente. | custom.material = « Bouleau massif, pied en acier laqué noir ». |
| ⬜ à faire | moyen | Photos | #3 | Seule ambiance = vue d'ensemble de la collection (1280 px) où le porte-manteau est coupé au bord droit. | Ajouter une ambiance où le porte-manteau 160 est entier ; alt précis. |

#### Étagère Kaari REB007 — `artek-kaari-reb007`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kaari-reb007) · [Fiche Artek](https://www.artek.fi/en/products/kaari-wall-shelf-round) · Étagère · 3 variantes · 5 photos · familles du site : Rangement  
Artek : Kaari Wall Shelf round REB007 · Ronan & Erwan Bouroullec · 2015 · Made in Germany and Poland · en catalogue  
Dimensions Artek : Cotes artek.fi : 35 / 35 / 30 cm (Ø 35 cm environ)  
Constats : 0 critique, 2 élevé, 5 moyen, 10 faible, 1 info ; 12 corrigés le 29 septembre.  
**Verdict :** Variantes et photos exactes ; titre sans « ronde / murale », année, dimensions et matière absentes, origine incomplète.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Métachamps |  | Aucune dimension. | custom.dimensions d'après le schéma Artek (Ø 35 cm…). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 2015 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide. | custom.year = 2015. |
| ✅ corrigé | moyen | Métachamps |  | Origine « Fabriqué en Allemagne » incomplète : Artek indique une fabrication en Allemagne et en Pologne. | custom.origin = « Fabriqué en Allemagne et en Pologne » ; country_of_origin en conséquence ; ajuster le tag made-in-allemagne (+ made-in-pologne). |

#### Patère murale Kaari — `artek-kaari-wall-hook`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kaari-wall-hook) · [Fiche Artek](https://www.artek.fi/en/products/kaari-wall-hook) · Patère murale · 2 variantes · 4 photos · familles du site : Rangement  
Artek : Kaari Wall Hook (REB014) · Ronan & Erwan Bouroullec · 2015 · Made in Germany and Poland · en catalogue  
Dimensions Artek : Cotes artek.fi : H 32,5 × 11 × 7,5 cm  
Constats : 0 critique, 3 élevé, 6 moyen, 9 faible, 1 info ; 14 corrigés le 29 septembre.  
**Verdict :** Photos et variantes justes ; poids incohérent entre variantes, année/dimensions/matière absentes, origine incomplète.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Logistique | Laqué noir | Poids d'expédition de 3 g : Laqué noir (ART-KWH-28503650) (probablement 3 kg saisi en grammes). | Corriger le poids (kg, pas g). |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension. | custom.dimensions = « H 32,5 × L 11 × P 7,5 cm ». |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 2015 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ◐ partiel | moyen | Variantes |  | Poids 3 kg pour « Laqué noir » et 0 kg pour « Verni naturel » sur un même petit crochet ; 3 kg paraît surévalué. | Même poids réel sur les deux variantes (à mesurer, probablement < 1 kg). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide. | custom.year = 2015. |
| ✅ corrigé | moyen | Métachamps |  | Origine « Fabriqué en Allemagne » incomplète : Artek indique une fabrication en Allemagne et en Pologne. | custom.origin = « Fabriqué en Allemagne et en Pologne » ; country_of_origin en conséquence ; ajuster le tag made-in-allemagne (+ made-in-pologne). |

#### Paravent 100 — `artek-screen-100`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-screen-100) · [Fiche Artek](https://www.artek.fi/en/products/screen-100) · Paravent · 4 variantes · 13 photos · familles du site : Jardin  
Artek : Screen 100 (100A 180 cm, 100B 150 cm, 100C 130 cm, 100D 100 cm) · Alvar Aalto · 1936 (Factsheet : 1935-36) · Made in Finland · en catalogue  
Dimensions Artek : Hauteur 100/130/150/180 × longueur totale 200 cm (Factsheet « Total length 200 cm »)  
Constats : 0 critique, 4 élevé, 6 moyen, 8 faible, 1 info ; 13 corrigés le 29 septembre.  
**Verdict :** Packshots cohérents avec les hauteurs ; classé dans « Parasols & ombrages », libellés sans codes A–D ni indication hauteur × longueur, description avec noms anglais.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Classé dans « parasols-ombrages » (famille Jardin) alors que c'est un produit d'intérieur. |  |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Classement |  | La cause du classement Jardin est la règle de collection elle-même : parasols-ombrages inclut TYPE = « Paravent ». | Retirer « Paravent » de la règle parasols-ombrages et l'ajouter à une collection intérieure (decoration ou rangement, ou nouvelle sous-catégorie « Paravents »). |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension. | custom.dimensions = « H 100 / 130 / 150 / 180 cm × L 200 cm (déroulé) ». |
| ⬜ à faire | moyen | Classement |  | Type « Paravent » absent de la sous-catégorie attendue (objets-decoratifs-cadres ou rangement). Présent dans : parasols-ombrages. |  |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Variantes |  | « 100 x 200 cm » etc. : ordre non précisé (hauteur × longueur déroulée) et codes Artek absents ; un client peut lire largeur × hauteur (200 cm de haut). | « 100D — H 100 × L 200 cm », « 100C — H 130 × L 200 cm », « 100B — H 150 × L 200 cm », « 100A — H 180 × L 200 cm » ; option « Hauteur ». |
| ✅ corrigé | moyen | Description |  | Noms anglais « Screen 100 », « Screen 100B », « Screen 100A » sans explication des lettres ; espace manquant « pièce.Offrant ». | Expliquer « 100A (180 cm) … 100D (100 cm) », écrire « paravent 100 » ; corriger l'espace. |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide. | custom.year = 1936 ; tag annees-1930. |

#### Étagère Kaari Bureau Mural — `artek-kaari-bureau-mural`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kaari-bureau-mural) · [Fiche Artek](https://www.artek.fi/en/products/kaari-wall-shelf-with-desk) · Étagère · 2 variantes · 7 photos · familles du site : Rangement  
Artek : Kaari Wall Shelf with Desk REB010 / REB013 · Ronan & Erwan Bouroullec · 2015 · Made in Germany and Poland · en catalogue  
Dimensions Artek : REB013 : L 100 × H 142 × P 55 cm ; REB010 : L 200 × H 142 × P 55 cm (artek.fi + https://www.artek.fi/downloads/Kaari-Collection-2021-4957224.pdf)  
Constats : 0 critique, 2 élevé, 9 moyen, 8 faible, 1 info ; 16 corrigés le 29 septembre.  
**Verdict :** Photos correctes (REB013 et REB010) mais titre, option « Finition » contenant des tailles, codes absents, origine/dimensions manquantes, tag cadeau absurde.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Meuble à 2 114–3 309 € sans dimensions. | custom.dimensions = « REB013 : 100 × 55 × 142 cm ; REB010 : 200 × 55 × 142 cm ». |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Métachamps |  | Année 2015 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Options |  | Option « Finition » contenant des dimensions/références : Bureau 100 x 55 cm \| Bureau 200 x 55 cm. |  |
| ✅ corrigé | moyen | Titre |  | « Étagère Kaari Bureau Mural » : formulation maladroite, codes absents. | « Étagère murale Kaari avec bureau REB010 / REB013 ». |
| ✅ corrigé | moyen | Variantes | Bureau 100 x 55 cm · #1 | Libellés donnant seulement la taille du plan de travail ; ni code, ni largeur/hauteur totale (100 × 142 cm). | Option « Dimensions » : « REB013 — L 100 × H 142 cm (bureau 100 × 55) ». |
| ✅ corrigé | moyen | Variantes | Bureau 200 x 55 cm · #7 | Idem pour REB010 ; le fichier de #7 dit « black-oak » mais la photo montre bien des montants chêne naturel (conforme à la seule finition Artek). | « REB010 — L 200 × H 142 cm (bureau 200 × 55) ». |
| ✅ corrigé | moyen | Métachamps |  | Origine absente (Allemagne et Pologne). | custom.origin = « Fabriqué en Allemagne et en Pologne » ; tag made-in-allemagne. |

#### Étagère murale Kaari — `artek-kaari-wall-shelf`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kaari-wall-shelf) · [Fiche Artek](https://www.artek.fi/en/products/kaari-wall-shelf) · Étagère murale · 2 variantes · 3 photos · familles du site : aucune  
Artek : Kaari Wall Shelf REB008 / REB009 · Ronan & Erwan Bouroullec · 2015 · Made in Germany and Poland · en catalogue  
Dimensions Artek : REB008 : L 200 × P 35 × H 113 cm ; REB009 : L 100 × P 35 × H 188 cm (https://www.artek.fi/downloads/Kaari-Collection-2021-4957224.pdf)  
Constats : 0 critique, 5 élevé, 6 moyen, 10 faible, 0 info ; 17 corrigés le 29 septembre.  
**Verdict :** Photos justes (REB008 et REB009) mais libellés trompeurs (seule la tablette est décrite, hauteurs 113/188 cm absentes), matière fausse (HPL), produit invisible dans le menu.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Étagère murale »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Variantes | 100 x 35 cm · #3 | « 100 x 35 cm » décrit une tablette ; le produit REB009 est une colonne de 5 tablettes de 188 cm de haut : le client ne peut pas deviner la hauteur ni le nombre de tablettes. | « REB009 — L 100 × H 188 cm (5 tablettes) » ; option « Modèle ». |
| ✅ corrigé | élevé | Variantes | 200 x 35 cm · #1 | Idem : REB008 = 3 tablettes, 113 cm de haut. | « REB008 — L 200 × H 113 cm (3 tablettes) ». |
| ✅ corrigé | élevé | Classement |  | Type « Étagère murale » absent des règles : produit hors menu (autoFinding confirmé) ; même cause que l'étagère 112. | Type « Étagère » ou ajout de « Étagère murale » à la règle. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 2015 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Options |  | Option « Finition » contenant des dimensions/références : 200 x 35 cm \| 100 x 35 cm. |  |
| ✅ corrigé | moyen | Description |  | « tablettes … surface en HPL brillant » : Artek indique de la mélamine noire brillante. | « tablettes en mélamine noire brillante ». |
| ✅ corrigé | moyen | Métachamps |  | Origine « Fabriqué en Allemagne » incomplète : Artek indique une fabrication en Allemagne et en Pologne. | custom.origin = « Fabriqué en Allemagne et en Pologne » ; country_of_origin en conséquence ; ajuster le tag made-in-allemagne (+ made-in-pologne). |

#### Bureau Kaari REB005 150 × 65 cm — `artek-kaari-desk-reb005`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kaari-desk-reb005) · [Fiche Artek](https://www.artek.fi/en/products/kaari-desk) · Bureau · 4 variantes · 8 photos · familles du site : Tables  
Artek : Kaari Desk REB005 150 × 65 cm · Ronan & Erwan Bouroullec · 2015 · Made in Germany and Poland · en catalogue  
Dimensions Artek : L 150 × P 65 × H 75 cm (https://www.artek.fi/downloads/Kaari-Collection-2021-4957224.pdf ; artek.fi 150 / 65 / 75 / 54)  
Constats : 0 critique, 2 élevé, 5 moyen, 8 faible, 1 info ; 9 corrigés le 29 septembre.  
**Verdict :** Variantes et photos exactes ; manquent dimensions (hauteur), origine, usage, matière.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (le titre donne 150 × 65 cm mais pas la hauteur). | custom.dimensions = « L 150 × P 65 × H 75 cm ». |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Tags |  | Tag « table » sur un produit de type Bureau. |  |
| ✅ corrigé | moyen | Métachamps |  | Origine « (vide) » incomplète : Artek indique une fabrication en Allemagne et en Pologne. | custom.origin = « Fabriqué en Allemagne et en Pologne » ; country_of_origin en conséquence ; ajuster le tag made-in-allemagne (+ made-in-pologne). |

#### Console murale Kaari REB006 — `artek-kaari-reb006`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kaari-reb006) · [Fiche Artek](https://www.artek.fi/en/products/kaari-wall-console) · Console · 6 variantes · 9 photos · familles du site : aucune  
Artek : Kaari Wall Console REB006 · Ronan & Erwan Bouroullec · 2015 · Made in Germany and Poland · en catalogue  
Dimensions Artek : L 100 × P 45 × H 34 cm (https://www.artek.fi/downloads/Kaari-Collection-2021-4957224.pdf)  
Constats : 2 critique, 4 élevé, 6 moyen, 10 faible, 1 info ; 15 corrigés le 29 septembre.  
**Verdict :** Deux photos de variantes inversées (linoléum rouge : chêne naturel ↔ noir) ; produit absent du menu ; libellés incohérents ; dimensions/origine absentes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | critique | Photos | Chêne — linoléum rouge, chant noir · #5 | La variante à montants chêne naturel affiche #5, qui montre des montants NOIRS (fichier « black-oak-red-Linoleum »). | Lier #6 (montants chêne naturel, linoléum rouge) à « Chêne — linoléum rouge, chant noir » et corriger l'alt. |
| ✅ corrigé | critique | Photos | Teinté noir — linoléum rouge, chant noir · #6 | La variante à montants noirs affiche #6, qui montre des montants en chêne NATUREL (fichier « natural-oak-red-Linoleum »). | Lier #5 à « Teinté noir — linoléum rouge, chant noir » et corriger les deux alts. |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Console »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Classement |  | Type « Console » repris par aucune collection : invisible dans le menu (autoFinding confirmé). | Type « Étagère » (etageres-et-bibliotheques) ou « Bureau » (Artek : « serves as desk, bar, or deep shelf »), ou ajouter « Console » à une règle. |
| ✅ corrigé | élevé | Métachamps |  | Aucune dimension. | custom.dimensions = « L 100 × P 45 × H 34 cm ». |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Variantes |  | « Teinté noir » (sans « chêne ») alors que les autres fiches Kaari disent « Chêne noir » / « Chêne laqué noir » ; « chant rouge » au lieu de « chant rouge brillant » ; séparateurs « — » et « , » mélangés. | « Chêne laqué noir / linoléum bleu / chant rouge brillant » (format REB007). |
| ✅ corrigé | moyen | Métachamps |  | Origine « (vide) » incomplète : Artek indique une fabrication en Allemagne et en Pologne. | custom.origin = « Fabriqué en Allemagne et en Pologne » ; country_of_origin en conséquence ; ajuster le tag made-in-allemagne (+ made-in-pologne). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide (autoFinding confirmé). | custom.usage = Intérieur. |

#### Table Kaari REB001 200 × 85 cm — `artek-kaari-table-rectangular-reb001`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kaari-table-rectangular-reb001) · [Fiche Artek](https://www.artek.fi/en/products/kaari-table-rectangular) · Table · 6 variantes · 8 photos · familles du site : Tables  
Artek : Kaari Table rectangular REB001 200 × 85 cm · Ronan & Erwan Bouroullec · 2015 · Made in Germany and Poland · en catalogue  
Dimensions Artek : 200 × 85 × 74 cm (https://www.artek.fi/downloads/Kaari-Collection-2021-4957224.pdf)  
Constats : 0 critique, 2 élevé, 6 moyen, 6 faible, 1 info ; 7 corrigés le 29 septembre.  
**Verdict :** Six variantes conformes à Artek, chaque photo correspond ; manquent sous-catégorie, dimensions complètes, origine.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (seule la taille du plateau figure dans le titre ; hauteur 74 cm absente) ; custom.search_facts contient pourtant les cotes. | custom.dimensions = « L 200 × P 85 × H 74 cm ». |
| ⬜ à faire | moyen | Classement |  | Type « Table » absent de la sous-catégorie attendue (tables-de-salle-a-manger). Présent dans : tables. |  |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Classement |  | Absente de « Tables de salle à manger » car le tag table-de-repas manque (autoFinding MISSING_EXPECTED_SUB). | Ajouter le tag table-de-repas. |
| ✅ corrigé | moyen | Métachamps |  | Origine « (vide) » incomplète : Artek indique une fabrication en Allemagne et en Pologne. | custom.origin = « Fabriqué en Allemagne et en Pologne » ; country_of_origin en conséquence ; ajuster le tag made-in-allemagne (+ made-in-pologne). |

#### Table Kaari REB002 240 × 90 cm — `artek-kaari-table-rectangular-reb002`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kaari-table-rectangular-reb002) · [Fiche Artek](https://www.artek.fi/en/products/kaari-table-rectangular) · Table · 6 variantes · 7 photos · familles du site : Tables  
Artek : Kaari Table rectangular REB002 240 × 90 cm · Ronan & Erwan Bouroullec · 2015 · Made in Germany and Poland · en catalogue  
Dimensions Artek : 240 × 90 × 74 cm (https://www.artek.fi/downloads/Kaari-Collection-2021-4957224.pdf)  
Constats : 0 critique, 2 élevé, 6 moyen, 6 faible, 1 info ; 6 corrigés le 29 septembre.  
**Verdict :** Variantes et photos exactes ; une seule ambiance ; manquent sous-catégorie, dimensions complètes, origine.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (seule la taille du plateau figure dans le titre ; hauteur 74 cm absente) ; custom.search_facts contient pourtant les cotes. | custom.dimensions = « L 240 × P 90 × H 74 cm ». |
| ⬜ à faire | moyen | Classement |  | Type « Table » absent de la sous-catégorie attendue (tables-de-salle-a-manger). Présent dans : tables. |  |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Classement |  | Absente de « Tables de salle à manger » car le tag table-de-repas manque (autoFinding MISSING_EXPECTED_SUB). | Ajouter le tag table-de-repas. |
| ✅ corrigé | moyen | Métachamps |  | Origine « (vide) » incomplète : Artek indique une fabrication en Allemagne et en Pologne. | custom.origin = « Fabriqué en Allemagne et en Pologne » ; country_of_origin en conséquence ; ajuster le tag made-in-allemagne (+ made-in-pologne). |

#### Table Kaari REB012 160 × 80 cm — `artek-kaari-table-rectangular-reb012`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kaari-table-rectangular-reb012) · [Fiche Artek](https://www.artek.fi/en/products/kaari-table-rectangular) · Table · 6 variantes · 10 photos · familles du site : Tables  
Artek : Kaari Table rectangular REB012 160 × 80 cm · Ronan & Erwan Bouroullec · 2015 · Made in Germany and Poland · en catalogue  
Dimensions Artek : 160 × 80 × 74 cm (https://www.artek.fi/downloads/Kaari-Collection-2021-4957224.pdf)  
Constats : 0 critique, 2 élevé, 6 moyen, 7 faible, 1 info ; 7 corrigés le 29 septembre.  
**Verdict :** Variantes et photos exactes ; galerie correcte ; manquent sous-catégorie, dimensions complètes, origine.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (seule la taille du plateau figure dans le titre ; hauteur 74 cm absente) ; custom.search_facts contient pourtant les cotes. | custom.dimensions = « L 160 × P 80 × H 74 cm ». |
| ⬜ à faire | moyen | Classement |  | Type « Table » absent de la sous-catégorie attendue (tables-de-salle-a-manger). Présent dans : tables. |  |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Classement |  | Absente de « Tables de salle à manger » car le tag table-de-repas manque (autoFinding MISSING_EXPECTED_SUB). | Ajouter le tag table-de-repas. |
| ✅ corrigé | moyen | Métachamps |  | Origine « (vide) » incomplète : Artek indique une fabrication en Allemagne et en Pologne. | custom.origin = « Fabriqué en Allemagne et en Pologne » ; country_of_origin en conséquence ; ajuster le tag made-in-allemagne (+ made-in-pologne). |

#### Table Kaari REB003 Ø 80 cm — `artek-kaari-table-round-reb003`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kaari-table-round-reb003) · [Fiche Artek](https://www.artek.fi/en/products/kaari-table-round) · Table · 6 variantes · 7 photos · familles du site : Tables  
Artek : Kaari Table round REB003 Ø 80 cm · Ronan & Erwan Bouroullec · 2015 · Made in Germany and Poland · en catalogue  
Dimensions Artek : Ø 80 × H 74 cm (https://www.artek.fi/downloads/Kaari-Collection-2021-4957224.pdf)  
Constats : 0 critique, 2 élevé, 6 moyen, 6 faible, 1 info ; 6 corrigés le 29 septembre.  
**Verdict :** Variantes et photos exactes ; seule ambiance = photo de groupe où la table est minuscule ; manquent sous-catégorie, dimensions, origine.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (seule la taille du plateau figure dans le titre ; hauteur 74 cm absente) ; custom.search_facts contient pourtant les cotes. | custom.dimensions = « Ø 80 × H 74 cm ». |
| ⬜ à faire | moyen | Classement |  | Type « Table » absent de la sous-catégorie attendue (tables-de-salle-a-manger). Présent dans : tables. |  |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Classement |  | Absente de « Tables de salle à manger » car le tag table-de-repas manque (autoFinding MISSING_EXPECTED_SUB). | Ajouter le tag table-de-repas. |
| ✅ corrigé | moyen | Métachamps |  | Origine « (vide) » incomplète : Artek indique une fabrication en Allemagne et en Pologne. | custom.origin = « Fabriqué en Allemagne et en Pologne » ; country_of_origin en conséquence ; ajuster le tag made-in-allemagne (+ made-in-pologne). |

#### Table Kaari REB004 Ø 110 cm — `artek-kaari-table-round-reb004`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kaari-table-round-reb004) · [Fiche Artek](https://www.artek.fi/en/products/kaari-table-round) · Table · 6 variantes · 8 photos · familles du site : Tables  
Artek : Kaari Table round REB004 Ø 110 cm · Ronan & Erwan Bouroullec · 2015 · Made in Germany and Poland · en catalogue  
Dimensions Artek : Ø 110 × H 74 cm (https://www.artek.fi/downloads/Kaari-Collection-2021-4957224.pdf)  
Constats : 3 critique, 2 élevé, 9 moyen, 7 faible, 1 info ; 13 corrigés le 29 septembre.  
**Verdict :** Trois variantes affichent la mauvaise photo (dont une finition linoléum bleu non vendue) et plusieurs alts sont faux : le client voit une autre finition que celle commandée.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | critique | Photos | Chêne — lamifié noir brillant · #7 | La variante lamifié noir brillant affiche #7 : plateau gris-bleu mat (fichier « clear-protective-varnish »), qui ressemble à du linoléum ; la bonne photo est #6 (chêne naturel, plateau noir brillant, fichier « natural-oak-black-HPL »). | Lier #6 à « Chêne — lamifié noir brillant ». |
| ✅ corrigé | critique | Photos | Chêne — linoléum noir · #6 | La variante linoléum noir affiche #6 = plateau lamifié noir brillant (fichier « natural-oak-black-HPL »). | Lier #7 (chêne naturel, plateau mat — linoléum noir à confirmer) ou un packshot Artek REB004 natural-oak-black-Linoleum. |
| ✅ corrigé | critique | Photos | Chêne noir — lamifié noir brillant · #8 | La variante chêne noir / lamifié noir brillant affiche #8 : plateau en linoléum BLEU (fichier « black-oak-blue-Linoleum »), finition non proposée ; aucune photo juste pour cette variante. | Importer le packshot Artek REB004 black-oak-black-HPL et le lier ; retirer #8 ou le laisser en galerie avec alt « finition non proposée ». |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (seule la taille du plateau figure dans le titre ; hauteur 74 cm absente) ; custom.search_facts contient pourtant les cotes. | custom.dimensions = « Ø 110 × H 74 cm ». |
| ⬜ à faire | moyen | Classement |  | Type « Table » absent de la sous-catégorie attendue (tables-de-salle-a-manger). Présent dans : tables. |  |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Photos | Chêne — lamifié noir brillant | Alt de l’image de variante « Table Kaari REB004 Ø 110 cm — Artek » sans rapport avec la finition « Chêne — lamifié noir brillant ». |  |
| ✅ corrigé | moyen | Photos | Chêne noir — lamifié noir brillant | Alt de l’image de variante « Table Kaari REB004 Ø 110 cm — Artek » sans rapport avec la finition « Chêne noir — lamifié noir brillant ». |  |
| ✅ corrigé | moyen | Photos | #4, #6, #7, #8 | Alts faux : #4 (chêne noir / linoléum noir) a l'alt « Chêne — lamifié noir brillant » ; #6 (chêne / lamifié noir) l'alt « Chêne noir — lamifié noir brillant » ; #7 et #8 alt générique. | Alt = finition réellement visible pour chaque photo après re-liaison. |
| ⬜ à faire | moyen | Classement |  | Absente de « Tables de salle à manger » car le tag table-de-repas manque (autoFinding MISSING_EXPECTED_SUB). | Ajouter le tag table-de-repas. |
| ✅ corrigé | moyen | Métachamps |  | Origine « (vide) » incomplète : Artek indique une fabrication en Allemagne et en Pologne. | custom.origin = « Fabriqué en Allemagne et en Pologne » ; country_of_origin en conséquence ; ajuster le tag made-in-allemagne (+ made-in-pologne). |

#### Table Kaari REB011 75 × 75 cm — `artek-kaari-table-square-reb011`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kaari-table-square-reb011) · [Fiche Artek](https://www.artek.fi/en/products/kaari-table-square) · Table · 6 variantes · 7 photos · familles du site : Tables  
Artek : Kaari Table square REB011 75 × 75 cm · Ronan & Erwan Bouroullec · 2015 · Made in Germany and Poland · en catalogue  
Dimensions Artek : 75 × 75 × 74 cm (https://www.artek.fi/downloads/Kaari-Collection-2021-4957224.pdf)  
Constats : 0 critique, 2 élevé, 6 moyen, 5 faible, 1 info ; 6 corrigés le 29 septembre.  
**Verdict :** Six variantes conformes et photos exactes ; manquent sous-catégorie, dimensions complètes, origine.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide (seule la taille du plateau figure dans le titre ; hauteur 74 cm absente) ; custom.search_facts contient pourtant les cotes. | custom.dimensions = « 75 × 75 × H 74 cm ». |
| ⬜ à faire | moyen | Classement |  | Type « Table » absent de la sous-catégorie attendue (tables-de-salle-a-manger). Présent dans : tables. |  |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Classement |  | Absente de « Tables de salle à manger » car le tag table-de-repas manque (autoFinding MISSING_EXPECTED_SUB). | Ajouter le tag table-de-repas. |
| ✅ corrigé | moyen | Métachamps |  | Origine « (vide) » incomplète : Artek indique une fabrication en Allemagne et en Pologne. | custom.origin = « Fabriqué en Allemagne et en Pologne » ; country_of_origin en conséquence ; ajuster le tag made-in-allemagne (+ made-in-pologne). |

### Luminaires

#### Suspension Kori — `artek-kori-pendant-light-eu`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kori-pendant-light-eu) · [Fiche Artek](https://www.artek.fi/en/products/kori-pendant-light) · Suspension · 1 variante · 5 photos · familles du site : Luminaires  
Artek : Kori Pendant Light · TAF Studio · 2023 · Made in Italy · en catalogue  
Dimensions Artek : Ø 12 cm, H 17 cm (réflecteur), rosace Ø 12 × H 7 cm, câble 250 cm (dessin coté artek.fi, identifiants number_12/17/7/250)  
Constats : 0 critique, 1 élevé, 2 moyen, 9 faible, 2 info ; 8 corrigés le 29 septembre.  
**Verdict :** Fiche correcte sur l'essentiel (créateur, année, origine Italie, photos justes) ; manquent dimensions, matière et données électriques, libellé de finition à reprendre.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | Aucune donnée électrique renseignée (custom.lighting_type, light_source_type, power_w, voltage_v, cable_details, ip_rating, safety_class vides) alors que 5 fiches Artek voisines les affichent. | Renseigner : custom.lighting_type = Suspension ; light_source_type = Douille E27 ; power_w = 12 W max (ampoule LED) ; voltage_v = 220-240 V · 50/60 Hz ; cable_details = Câble plastique blanc · 250 cm ; ip_rating et safety_class : non publiés par Artek, laisser vides plutôt que deviner. |

#### Suspension Kori Disc — `artek-kori-pendant-light-with-disc-shade-eu`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kori-pendant-light-with-disc-shade-eu) · [Fiche Artek](https://www.artek.fi/en/products/kori-pendant-light-with-disc-shade) · Suspension · 1 variante · 5 photos · familles du site : Luminaires  
Artek : Kori Pendant Light with Disc Shade · TAF Studio · 2023 · Made in Italy · en catalogue  
Dimensions Artek : Disque Ø 22 cm, H 17 cm, rosace Ø 12 × H 7 cm, câble 250 cm (dessin coté artek.fi : 22 / 12 / 7 / 17 / 250)  
Constats : 0 critique, 1 élevé, 2 moyen, 13 faible, 2 info ; 8 corrigés le 29 septembre.  
**Verdict :** Photos et attribution justes ; titre abrégé, restes d'anglais (« with Disc Shade ») dans la description et le SEO, dimensions/matière/électricité absentes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | Aucune donnée électrique renseignée (custom.lighting_type, light_source_type, power_w, voltage_v, cable_details, ip_rating, safety_class vides) alors que 5 fiches Artek voisines les affichent. | Renseigner : custom.lighting_type = Suspension ; light_source_type = Douille E27 ; power_w = 12 W max (ampoule LED) ; voltage_v = 220-240 V · 50/60 Hz ; cable_details = Câble plastique blanc · 250 cm ; ip_rating et safety_class : non publiés par Artek, laisser vides plutôt que deviner. |

#### Suspension Kori Dune — `artek-kori-pendant-light-with-dune-shade-eu`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kori-pendant-light-with-dune-shade-eu) · [Fiche Artek](https://www.artek.fi/en/products/kori-pendant-light-with-dune-shade) · Suspension · 1 variante · 5 photos · familles du site : Luminaires  
Artek : Kori Pendant Light with Dune Shade · TAF Studio · 2023 · Made in Italy · en catalogue  
Dimensions Artek : Abat-jour Ø 45 cm, H 17 cm, rosace Ø 12 × H 7 cm, câble 250 cm (dessin coté artek.fi : 45 / 12 / 7 / 250 / 17)  
Constats : 0 critique, 1 élevé, 2 moyen, 13 faible, 2 info ; 9 corrigés le 29 septembre.  
**Verdict :** Photos justes (#3/#4 = même scène allumée/éteinte) ; mêmes lacunes que la Kori Disc : anglais résiduel, dimensions, matière, électricité.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | Aucune donnée électrique renseignée (custom.lighting_type, light_source_type, power_w, voltage_v, cable_details, ip_rating, safety_class vides) alors que 5 fiches Artek voisines les affichent. | Renseigner : custom.lighting_type = Suspension ; light_source_type = Douille E27 ; power_w = 12 W max (ampoule LED) ; voltage_v = 220-240 V · 50/60 Hz ; cable_details = Câble plastique blanc · 250 cm ; ip_rating et safety_class : non publiés par Artek, laisser vides plutôt que deviner. |

#### Suspension A201 — `artek-a201`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-a201) · [Fiche Artek](https://www.artek.fi/en/products/pendant-light-a201) · Suspension · 1 variante · 6 photos · familles du site : Luminaires  
Artek : Pendant Light A201 · Alvar Aalto · 1950's (texte : 1952, bibliothèque de l'hôtel de ville de Säynätsalo) · Made in China · en catalogue  
Dimensions Artek : Ø 29 × H 20 cm, rosace Ø 12 cm, câble 250 cm (dessin coté artek.fi : 29 / 20 / 12 / 250)  
Constats : 0 critique, 0 élevé, 1 moyen, 9 faible, 1 info ; 6 corrigés le 29 septembre.  
**Verdict :** Fiche la plus complète du groupe : données électriques (E27, 12 W, 220-240 V, câble blanc 250 cm, IP20, classe II), dimensions Ø 29 × H 20, matière et origine vérifiées exactes ; seules retouches : « anneau de laiton » dans la description, accord et ordre des mots du libellé.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | moyen | Description |  | La description parle d'un « anneau de laiton perforé » alors qu'Artek indique un anneau en acier laitonné (plaqué laiton). Le métachamp matière de la même fiche dit d'ailleurs « Anneau plaqué laiton ». | Écrire « un anneau perforé en acier laitonné ». |

#### Suspension AMA500 — `artek-ama500`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-ama500) · [Fiche Artek](https://www.artek.fi/en/products/pendant-light-ama500) · Suspension · 1 variante · 6 photos · familles du site : Luminaires  
Artek : Pendant Light AMA500 · Aino Aalto · 1941 · Made in China · en catalogue  
Dimensions Artek : Ø 32 × H 23 cm, rosace Ø 12 cm, câble 250 cm (dessin coté artek.fi : 23 / 250 / 12 / 32 ; attribution largeur/hauteur à confirmer sur le dessin)  
Constats : 0 critique, 1 élevé, 3 moyen, 10 faible, 1 info ; 6 corrigés le 29 septembre.  
**Verdict :** Photos, créatrice, année et origine justes ; manquent dimensions, matière et électricité ; « anneau de laiton » inexact.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Description |  | « L'anneau de laiton perforé » : Artek indique un anneau en acier laitonné. | « L'anneau perforé en acier laitonné ». |
| ⬜ à faire | moyen | Métachamps |  | Aucune donnée électrique renseignée (custom.lighting_type, light_source_type, power_w, voltage_v, cable_details, ip_rating, safety_class vides) alors que 5 fiches Artek voisines les affichent. | Renseigner : lighting_type = Suspension ; light_source_type = Douille E27 ; power_w = 12 W max ; voltage_v = 220-240 V · 50/60 Hz ; cable_details = Fiche de plafond · Câble plastique blanc · 250 cm ; ip_rating = IP20 ; safety_class = Classe II. |

#### Suspension A110 Hand Grenade — `artek-a110-hand-grenade`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-a110-hand-grenade) · [Fiche Artek](https://www.artek.fi/en/products/pendant-light-a110-hand-grenade) · Suspension · 4 variantes · 10 photos · familles du site : Luminaires  
Artek : Pendant Light A110 "Hand Grenade" · Alvar Aalto · 1952 · Made in China · en catalogue  
Dimensions Artek : Ø 16 × H 44 cm, rosace Ø 13 × H 5 cm, câble 250 cm (dessin coté artek.fi)  
Constats : 0 critique, 1 élevé, 5 moyen, 15 faible, 1 info ; 13 corrigés le 29 septembre.  
**Verdict :** Quatre variantes justes avec chacune sa photo ; la description généralise l'anneau en laiton à toutes les finitions ; manquent année, dimensions, matière, électricité.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1952 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Description |  | La description annonce « un anneau de laiton perforé » pour toutes les versions, alors que deux variantes vendues ont un anneau laqué noir ou blanc et que l'anneau est en acier laitonné, pas en laiton. « abat-jour en acier peint » : Artek dit thermolaqué. | « un abat-jour en acier thermolaqué et un anneau intérieur perforé, en acier laitonné ou laqué ton sur ton ». |
| ⬜ à faire | moyen | Métachamps |  | Aucune donnée électrique renseignée (custom.lighting_type, light_source_type, power_w, voltage_v, cable_details, ip_rating, safety_class vides) alors que 5 fiches Artek voisines les affichent. | Renseigner : lighting_type = Suspension ; light_source_type = Douille E27 ; power_w = 12 W max ; voltage_v = 220-240 V · 50/60 Hz ; cable_details = Câble plastique 250 cm (noir ou blanc selon la finition) ; ip_rating = IP20 ; safety_class = Classe II. |

#### Suspension A330S Golden Bell — `artek-a330s-golden-bell`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-a330s-golden-bell) · [Fiche Artek](https://www.artek.fi/en/products/pendant-light-a330s-golden-bell) · Suspension · 5 variantes · 14 photos · familles du site : Luminaires  
Artek : Pendant Light A330S "Golden Bell" · Alvar Aalto (texte : Aino et Alvar Aalto) · 1937 · Made in China · en catalogue  
Dimensions Artek : Ø 17 × H 20 cm, rosace Ø 12 × H 6 cm, câble 250 cm (dessin coté artek.fi)  
Constats : 1 critique, 3 élevé, 3 moyen, 9 faible, 2 info ; 11 corrigés le 29 septembre.  
**Verdict :** Erreur critique : le packshot Savoy (non verni, câble noir) est rangé en galerie tandis que les deux laitons partagent la photo du laiton verni ; année 1936 fausse dans le SEO et la description.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | critique | Photos | Laiton poli non verni · #1, #12 | La variante « Laiton poli non verni » (Savoy, 607 €) affiche la photo #1, qui montre le laiton poli verni à câble blanc (même image que la variante « Laiton poli » à 564 €). Le vrai packshot Savoy (#12, laiton plus chaud, câble noir) existe mais est rangé en galerie, donc affiché comme ambiance. Le client qui paie le supplément Savoy voit l'autre finition. | Lier #12 à « Laiton poli non verni » et #1 à « Laiton poli » seul ; alt #12 = « Suspension A330S Golden Bell — Laiton poli non verni (Savoy) ». |
| ✅ corrigé | élevé | SEO |  | Année SEO 1936 ≠ custom.year 1937. |  |
| ✅ corrigé | élevé | Photos |  | Une même photo (artek-pendant-light-a330s-golden-bell-brass.jpg) sert à 2 finitions différentes : Laiton poli non verni \| Laiton poli. | Associer à chaque finition sa propre photo. |
| ✅ corrigé | élevé | SEO |  | Précision sur SEO_YEAR_MISMATCH : l'année juste est 1937. La description dit aussi « dessinée … en 1936 » : erreur au même endroit. | SEO : « … par Alvar Aalto (1937) … » ; description : « dessinée par Aino et Alvar Aalto en 1937 pour le restaurant Savoy d'Helsinki, et présentée la même année au pavillon finlandais de l'Exposition universelle de Paris ». |
| ✅ corrigé | moyen | Photos |  | La photo principale est partagée par 2 variantes : la fiche s’ouvre sur la première d’entre elles. |  |
| ✅ corrigé | moyen | Photos | #1 | Tant que #1 est partagée, la fiche s'ouvre sur la 1re variante, « Laiton poli non verni » (la plus chère), avec une photo qui ne lui correspond pas. L'alt de #1 dit « Laiton poli non verni » alors que l'image montre le laiton verni. | Après correction des liens, garder #1 en principale (laiton verni, finition de référence) avec l'alt « … — Laiton poli verni » ; mettre éventuellement « Laiton poli » en 1re variante. |
| ✅ corrigé | moyen | Variantes |  | « Laiton poli » ne dit pas qu'il est verni, seule différence avec « Laiton poli non verni ». Le nom Artek « Savoy » manque. Libellés différents de l'applique A330S (« Laiton », « Noir acier »…). | « Laiton poli verni », « Laiton poli non verni (Savoy) », « Acier chromé », « Acier laqué noir », « Acier laqué blanc » ; mêmes libellés sur l'applique. |

#### Suspension A331 Beehive — `artek-a331-beehive`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-a331-beehive) · [Fiche Artek](https://www.artek.fi/en/products/pendant-light-a331-beehive) · Suspension · 3 variantes · 10 photos · familles du site : Luminaires  
Artek : Pendant Light A331 "Beehive" · Alvar Aalto · 1953 · Made in China · en catalogue  
Dimensions Artek : Ø 33 × H 30 cm, rosace Ø 10 × H 6 cm, câble 250 cm (dessin coté artek.fi)  
Constats : 0 critique, 1 élevé, 4 moyen, 12 faible, 1 info ; 11 corrigés le 29 septembre.  
**Verdict :** Les trois variantes Artek sont présentes, chacune avec la bonne photo ; libellés hétérogènes, « thermolaquée » mal accordé, et année, dimensions, matière, électricité manquantes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1953 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ⬜ à faire | moyen | Métachamps |  | Aucune donnée électrique renseignée (custom.lighting_type, light_source_type, power_w, voltage_v, cable_details, ip_rating, safety_class vides) alors que 5 fiches Artek voisines les affichent. | Renseigner : lighting_type = Suspension ; light_source_type = Douille E27 ; power_w = 12 W max ; voltage_v = 220-240 V · 50/60 Hz ; cable_details = Câble plastique 250 cm (blanc ; noir pour la version noire, cf. #6) ; ip_rating = IP20 ; safety_class = Classe II. |

#### Suspension A333 Turnip — `artek-a333-turnip`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-a333-turnip) · [Fiche Artek](https://www.artek.fi/en/products/pendant-light-a333-turnip) · Suspension · 2 variantes · 5 photos · familles du site : Luminaires  
Artek : Pendant Light A333 "Turnip" · Alvar Aalto · 1950's · Made in China · en catalogue  
Dimensions Artek : Ø 25,5 × H 20 cm, rosace Ø 12 × H 10 cm, câble 250 cm (dessin coté artek.fi)  
Constats : 0 critique, 1 élevé, 4 moyen, 9 faible, 1 info ; 7 corrigés le 29 septembre.  
**Verdict :** Photos justes pour les deux variantes, mais libellés trompeurs (« Laitonné » fait croire à une lampe entièrement laitonnée) et fiche sans dimensions, matière, électricité ni tag de décennie.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Variantes | Laitonné · #4 | « Laitonné » et « Laqué blanc » décrivent en fait seulement l'anneau : l'abat-jour est blanc dans les deux cas. Le libellé « Laitonné » laisse croire à un luminaire en laiton. Libellés incohérents avec l'A110 et l'A331 (« Blanc thermolaquée / laitonné… »). | « Blanc / anneau laitonné » et « Blanc / anneau blanc ». |
| ⬜ à faire | moyen | Métachamps |  | Aucune donnée électrique renseignée (custom.lighting_type, light_source_type, power_w, voltage_v, cable_details, ip_rating, safety_class vides) alors que 5 fiches Artek voisines les affichent. | Renseigner : lighting_type = Suspension ; light_source_type = Douille E27 ; power_w = 12 W max ; voltage_v = 220-240 V · 50/60 Hz ; cable_details = Câble plastique blanc · 250 cm ; ip_rating = IP20 ; safety_class = Classe II. |

#### Suspension A440 — `artek-a440`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-a440) · [Fiche Artek](https://www.artek.fi/en/products/pendant-light-a440) · Suspension · 1 variante · 6 photos · familles du site : Luminaires  
Artek : Pendant Light A440 · Alvar Aalto · 1954 · Made in Finland and Poland · en catalogue  
Dimensions Artek : Ø 19 × H 23 cm, rosace Ø 10 × H 6 cm, câble 200 cm (dessin coté artek.fi)  
Constats : 0 critique, 2 élevé, 4 moyen, 9 faible, 1 info ; 11 corrigés le 29 septembre.  
**Verdict :** Photos et attribution justes, mais origine incomplète (Artek : Finlande et Pologne) ; libellé de variante maladroit ; année, dimensions, matière et électricité manquantes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | Origine « Fabriqué en Finlande » (et tag made-in-finlande) alors qu'Artek indique « Made in Finland and Poland ». | custom.origin = « Fabriqué en Finlande et en Pologne » ; country_of_origin = « Finlande, Pologne » ; ajouter le tag made-in-pologne ou retirer made-in-finlande. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1954 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ⬜ à faire | moyen | Métachamps |  | Aucune donnée électrique renseignée (custom.lighting_type, light_source_type, power_w, voltage_v, cable_details, ip_rating, safety_class vides) alors que 5 fiches Artek voisines les affichent. | Renseigner : lighting_type = Suspension ; light_source_type = Douille E27 ; power_w = 12 W max ; voltage_v = 220-240 V · 50/60 Hz ; cable_details = Câble plastique blanc · 200 cm ; ip_rating / safety_class : non publiés par Artek. |

#### Suspension JL341 — `artek-jl341`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-jl341) · [Fiche Artek](https://www.artek.fi/en/products/pendant-light-jl341) · Suspension · 2 variantes · 6 photos · familles du site : Luminaires  
Artek : Pendant Light JL341 · Juha Leiviskä · 1969 · Made in Finland · en catalogue  
Dimensions Artek : Ø 56 × H 17 cm, rosace Ø 10 × H 10 cm, câble 200 cm (dessin coté artek.fi)  
Constats : 0 critique, 0 élevé, 0 moyen, 8 faible, 1 info ; 5 corrigés le 29 septembre.  
**Verdict :** Fiche exacte (créateur, année, origine, dimensions, matière, données électriques vérifiées) ; seul le libellé de la variante laiton est maladroit.

#### Applique A910 — `artek-wall-light-a910`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-wall-light-a910) · [Fiche Artek](https://www.artek.fi/en/products/wall-light-a910) · Applique · 1 variante · 5 photos · familles du site : Luminaires  
Artek : Wall Light A910 · aucun créateur nommé (page : « 1990's » ; fiche PDF : « design Artek ») · 1990's · Made in Finland · en catalogue  
Dimensions Artek : L 28 × P 19 × H 21 cm (dessin coté artek.fi : 28 / 19 / 21)  
Constats : 0 critique, 2 élevé, 3 moyen, 5 faible, 3 info ; 9 corrigés le 29 septembre.  
**Verdict :** Créateur faux : Artek ne crédite pas Alvar Aalto (modèle Artek des années 1990 inspiré de ses lampes), alors que métachamp, SEO et tag l'attribuent à Aalto ; dimensions, matière, électricité manquantes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Métachamps |  | custom.designer = « Alvar Aalto », titre SEO « Applique A910 Alvar Aalto », méta-description « par Alvar Aalto » et tag alvar-aalto, alors qu'Artek n'attribue ce modèle à aucun designer : lancé dans les années 1990, « design Artek », seulement inspiré des luminaires d'Aalto pour l'Institut national des pensions. La description Mikado le dit elle-même. | custom.designer = « Artek » (ou vide) ; SEO : « Applique A910 — Artek, d'après Alvar Aalto » ; retirer le tag alvar-aalto (sinon la fiche apparaît sur la page designer d'Aalto). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Site |  | Créateur publié «  » ≠ Admin « Alvar Aalto ». |  |
| ⬜ à faire | moyen | Métachamps |  | Aucune donnée électrique renseignée (custom.lighting_type, light_source_type, power_w, voltage_v, cable_details, ip_rating, safety_class vides) alors que 5 fiches Artek voisines les affichent. | Renseigner : lighting_type = Applique ; light_source_type = Douille E27 ; power_w = 60 W max (incandescence) ; voltage_v = 220-240 V · 50 Hz ; cable_details = Fiche Schuko · Câble plastique blanc · 250 cm ; ip_rating = IP20 ; safety_class = Classe I. |

#### Plafonnier A622 — `artek-ceiling-light-a622`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-ceiling-light-a622) · [Fiche Artek](https://www.artek.fi/en/products/ceiling-light-a622) · Plafonnier · 2 variantes · 7 photos · familles du site : aucune  
Artek : Ceiling Light A622 (A622A / A622B) · Alvar Aalto · 1953 · Made in Finland · en catalogue  
Dimensions Artek : A622A : Ø 57 × H 23 cm ; A622B : Ø 46,5 × H 18,5 cm (dessins cotés artek.fi)  
Constats : 0 critique, 3 élevé, 5 moyen, 10 faible, 2 info ; 12 corrigés le 29 septembre.  
**Verdict :** Invisible dans les familles du menu (type Plafonnier) ; option « Finition » contenant des codes de taille ; deux tailles au même prix ; dimensions et électricité absentes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Plafonnier »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Classement |  | Précision sur NO_MENU_COLLECTION : aucune collection automatique ne retient le type « Plafonnier » (luminaires = Lampe \| Suspension \| Lampadaire \| Applique). | Ajouter la condition TYPE = Plafonnier à la collection luminaires (et éventuellement une sous-catégorie Plafonniers), ou classer en type « Suspension » à défaut. |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Options |  | Option « Finition » contenant des dimensions/références : A622a \| A622b. |  |
| ✅ corrigé | moyen | Variantes | A622a | Précision sur OPTION_NAME_WRONG : l'option « Finition » propose « A622a / A622b », des codes que le client ne peut pas interpréter ; il s'agit de deux tailles (même finition laquée blanche). Casse différente d'Artek (A622A/A622B). | Option « Taille » : « A622A — Ø 57 cm » / « A622B — Ø 46,5 cm ». |
| ⬜ à faire | moyen | Prix |  | Les deux tailles (Ø 57 et Ø 46,5 cm) sont au même prix (1 546 €) et au même coût (702,35 €) : prix de la petite taille à vérifier. | Contrôler le tarif Artek de l'A622B et ajuster prix et coût. |
| ⬜ à faire | moyen | Métachamps |  | Aucune donnée électrique renseignée (custom.lighting_type, light_source_type, power_w, voltage_v, cable_details, ip_rating, safety_class vides) alors que 5 fiches Artek voisines les affichent. | Renseigner : lighting_type = Plafonnier ; light_source_type = 3 douilles E27 ; power_w = 3 × 60 W max ; voltage_v = 220-240 V · 50 Hz ; cable_details = Raccordement direct au plafond, sans fiche (commande par interrupteur mural) ; ip_rating = IP20 ; safety_class = Classe I. |

#### Lampadaire Kori — `artek-kori-floor-light-eu`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kori-floor-light-eu) · [Fiche Artek](https://www.artek.fi/en/products/kori-floor-light) · Lampadaire · 2 variantes · 7 photos · familles du site : Luminaires  
Artek : Kori Floor Light · TAF Studio · 2023 · Made in Italy · en catalogue  
Dimensions Artek : H 115 cm ; cotes 22 et 12 cm (socle / réflecteur, à confirmer sur le dessin artek.fi)  
Constats : 0 critique, 1 élevé, 2 moyen, 6 faible, 2 info ; 4 corrigés le 29 septembre.  
**Verdict :** Bonne fiche : description fidèle à Artek, chaque couleur a son packshot ; libellés « Laqué » à corriger (thermolaquage mat) ; dimensions, matière, électricité manquantes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | Aucune donnée électrique renseignée (custom.lighting_type, light_source_type, power_w, voltage_v, cable_details, ip_rating, safety_class vides) alors que 5 fiches Artek voisines les affichent. | Renseigner : lighting_type = Lampadaire ; light_source_type = Douille E27 ; power_w = 12 W max (LED) ; voltage_v = 220-240 V · 50/60 Hz ; cable_details = Fiche Euro · Câble 270 cm ; ip_rating / safety_class : non publiés sur la page Artek. |

#### Lampadaire A805 Angel Wing — `artek-a805-angel-wing-eu`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-a805-angel-wing-eu) · [Fiche Artek](https://www.artek.fi/en/products/floor-light-a805-angel-wing) · Lampadaire · 2 variantes · 6 photos · familles du site : Luminaires  
Artek : Floor Light A805 "Angel Wing" · Alvar Aalto · 1954 (fiche PDF : 1953-54) · Made in Finland · en catalogue  
Dimensions Artek : L 52 × H 174 cm (dessin coté artek.fi)  
Constats : 0 critique, 0 élevé, 0 moyen, 8 faible, 2 info ; 4 corrigés le 29 septembre.  
**Verdict :** Fiche juste : deux variantes, chacune avec sa photo, données électriques et dimensions vérifiées exactes ; retouches mineures (nom de l'Institut, matière du tube nickelé, photo de galerie peu lisible).

#### Lampadaire A808 — `artek-a808-eu`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-a808-eu) · [Fiche Artek](https://www.artek.fi/en/products/floor-light-a808) · Lampadaire · 2 variantes · 6 photos · familles du site : Luminaires  
Artek : Floor Light A808 · Alvar Aalto · 1955/1956 · Made in Finland · en catalogue  
Dimensions Artek : L 40 × H 163 cm (dessin coté artek.fi ; fiche PDF 163 / 40)  
Constats : 0 critique, 1 élevé, 5 moyen, 7 faible, 2 info ; 8 corrigés le 29 septembre.  
**Verdict :** Photos justes pour les deux abat-jour ; « Laiton poli » désigne ici l'abat-jour alors que sur l'A805, l'A810 et l'A811 il désigne le tube ; libellé « Blanc peint acier » maladroit ; année, dimensions, matière, électricité manquantes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | Année 1955 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Variantes |  | Sur l'A808, l'option porte sur l'abat-jour (le tube est toujours en laiton poli), mais les libellés « Blanc peint acier » / « Laiton poli » ne le disent pas, et « Laiton poli » a un autre sens sur les lampadaires voisins A805, A810, A811 (le tube). | Option « Abat-jour » : « Acier laqué blanc » / « Laiton poli ». |
| ⬜ à faire | moyen | Métachamps |  | Aucune donnée électrique renseignée (custom.lighting_type, light_source_type, power_w, voltage_v, cable_details, ip_rating, safety_class vides) alors que 5 fiches Artek voisines les affichent. | Renseigner : lighting_type = Lampadaire ; light_source_type = Douille E27 ; power_w = 100 W max ; voltage_v = 220-240 V · 50 Hz ; cable_details = Fiche Schuko · Câble plastique noir · 250 cm ; ip_rating = IP20 ; safety_class = Classe I. |

#### Lampadaire A810 — `artek-a810-eu`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-a810-eu) · [Fiche Artek](https://www.artek.fi/en/products/floor-light-a810) · Lampadaire · 2 variantes · 8 photos · familles du site : Luminaires  
Artek : Floor Light A810 · Alvar Aalto · 1959 · Made in Finland · en catalogue  
Dimensions Artek : L 48 × H 165 cm (dessin coté artek.fi)  
Constats : 0 critique, 1 élevé, 0 moyen, 6 faible, 2 info ; 5 corrigés le 29 septembre.  
**Verdict :** Variantes, données électriques et dimensions exactes, mais trois photos de galerie montrent l'édition spéciale « rubis/bordeaux » (pied et socle rouges), non vendue ici.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Photos | #4, #5, #8 | #5 est un packshot complet de l'A810 édition spéciale Artek Helsinki à pied et socle rubis, #8 un gros plan de ce socle rouge, #4 une ambiance avec le pied bordeaux. Cette finition n'est pas proposée (variantes : tube laiton ou inox, pied cuir noir). Non liées aux variantes, ces images apparaissent comme ambiances ; #5 ressemble à une variante disponible. | Retirer #5 et #8 ; retirer #4 ou préciser dans l'alt « édition spéciale rubis, non disponible ». |

#### Lampadaire A811 — `artek-a811-eu`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-a811-eu) · [Fiche Artek](https://www.artek.fi/en/products/floor-light-a811) · Lampadaire · 2 variantes · 3 photos · familles du site : Luminaires  
Artek : Floor Light A811 · non indiqué (page : « Year: 1965 » sans nom ; fiche PDF : « design Artek » ; texte : dernier ajout à la gamme de lampadaires d'Alvar Aalto) · 1965 · Made in Finland · en catalogue  
Dimensions Artek : L 45 × H 160 cm (dessin coté artek.fi ; fiche PDF 160 / 45)  
Constats : 1 critique, 2 élevé, 6 moyen, 7 faible, 1 info ; 12 corrigés le 29 septembre.  
**Verdict :** Erreur critique : la variante nickelée affiche la photo du laiton poli alors que le packshot nickelé (#3) existe en galerie ; attribution à Aalto à confirmer ; année, dimensions, matière, électricité manquantes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | critique | Photos | Laiton nickelé · #1, #3 | Précision sur SHARED_VARIANT_IMAGE : la variante « Laiton nickelé » affiche #1, qui montre le col et le tube en laiton doré, alors que le packshot de la version nickelée (#3, tube argenté) est déjà dans la fiche, rangé en galerie (donc affiché comme ambiance). | Lier #3 à la variante « Laiton nickelé », alt « Lampadaire A811 — Laiton nickelé » ; #1 reste liée à « Laiton poli » seule. |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Photos |  | Une même photo (packshot-b12598b098d1783dd506fda20a608a39.png) sert à 2 finitions différentes : Laiton poli \| Laiton nickelé. | Associer à chaque finition sa propre photo. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1965 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Photos |  | La photo principale est partagée par 2 variantes : la fiche s’ouvre sur la première d’entre elles. |  |
| ⬜ à faire | moyen | Métachamps |  | custom.designer = Alvar Aalto, SEO « par Alvar Aalto (1965) », tag alvar-aalto : Artek ne met aucun nom sur la page (seulement « Year: 1965 ») et la fiche PDF dit « design Artek », alors que les autres lampadaires (A805, A808, A810) sont crédités « Alvar Aalto ». Attribution à confirmer auprès d'Artek. | Faire confirmer par Artek ; à défaut, écrire « Artek, d'après Alvar Aalto ». |
| ⬜ à faire | moyen | Métachamps |  | Aucune donnée électrique renseignée (custom.lighting_type, light_source_type, power_w, voltage_v, cable_details, ip_rating, safety_class vides) alors que 5 fiches Artek voisines les affichent. | Renseigner : lighting_type = Lampadaire ; light_source_type = Douille E27 ; power_w = 60 W max ; voltage_v = 220-240 V · 50 Hz ; cable_details = Fiche Schuko · Câble plastique noir · 250 cm ; ip_rating = IP20 ; safety_class = Classe I. |

#### Lampe de table Kori — `artek-kori-table-light-eu`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-kori-table-light-eu) · [Fiche Artek](https://www.artek.fi/en/products/kori-table-light) · Lampe de table · 2 variantes · 6 photos · familles du site : Luminaires  
Artek : Kori Table Light · TAF Studio · 2023 · Made in Italy · en catalogue  
Dimensions Artek : H 22 cm ; cotes 12 et 11 cm (réflecteur / socle, à confirmer sur le dessin artek.fi)  
Constats : 0 critique, 1 élevé, 4 moyen, 8 faible, 3 info ; 4 corrigés le 29 septembre.  
**Verdict :** Absente de la famille Luminaires (type « Lampe de table » non retenu) ; description inexacte (socle en zinc, pas d'abat-jour, inspiration inventée) ; packshot blanc en basse définition.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Photos |  | Image basse définition 502×502 (variante) : packshot-c281fc1f9479e310513d0843cbc99332.png. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ✅ corrigé | moyen | Description |  | Erreurs factuelles : « la tige et le socle sont en acier » (le socle est en zinc moulé) ; « l'abat-jour … en aluminium 100 % recyclé » (pas d'abat-jour : c'est le réflecteur, ou « panier », qui est en aluminium recyclé) ; « s'inspire de la lumière du soleil filtrant à travers le feuillage » ne figure ni sur la page Artek ni dans le catalogue Kori. | Reprendre le texte Artek : lumière directe vers le haut sans éblouissement et cône plus large de lumière indirecte vers le bas ; idéale comme liseuse près d'un lit ou d'un fauteuil, ou en accent sur une étagère ; socle en zinc moulé, tige en acier, réflecteur en aluminium moulé recyclé. |
| ⬜ à faire | moyen | Métachamps |  | Aucune donnée électrique renseignée (custom.lighting_type, light_source_type, power_w, voltage_v, cable_details, ip_rating, safety_class vides) alors que 5 fiches Artek voisines les affichent. | Renseigner : lighting_type = Lampe de table ; light_source_type = Douille E27 ; power_w = 12 W max (LED) ; voltage_v = 220-240 V · 50/60 Hz ; cable_details = Fiche Euro · Câble 240 cm ; ip_rating / safety_class : non publiés sur la page Artek. |

#### Applique A330S — `artek-wall-light-a330s-eu`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-wall-light-a330s-eu) · [Fiche Artek](https://www.artek.fi/en/products/wall-light-a330s-golden-bell) · Applique · 4 variantes · 8 photos · familles du site : Luminaires  
Artek : Wall Light A330S "Golden Bell" · Alvar Aalto · 1937 · Made in China · en catalogue  
Dimensions Artek : Abat-jour Ø 17 × H 20 cm ; saillie 48 cm ; autres cotes 26 et 15 cm (hauteur / platine, à confirmer) (dessin coté artek.fi)  
Constats : 0 critique, 1 élevé, 4 moyen, 10 faible, 2 info ; 6 corrigés le 29 septembre.  
**Verdict :** Quatre variantes justes avec leur photo, mais libellés maladroits (« Noir acier ») et différents de la suspension A330S ; nom « Golden Bell » absent du titre ; année, dimensions, matière, électricité manquantes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | Année 1937 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ⬜ à faire | moyen | Métachamps |  | Aucune donnée électrique renseignée (custom.lighting_type, light_source_type, power_w, voltage_v, cable_details, ip_rating, safety_class vides) alors que 5 fiches Artek voisines les affichent. | Renseigner : lighting_type = Applique ; light_source_type = Douille E27 ; power_w = LED 4-6 W recommandée ; voltage_v = 220-240 V · 50 Hz ; cable_details = Fiche Euro · Câble visible 250 cm · Interrupteur sur câble à 60 cm sous la platine ; ip_rating = IP20 ; safety_class = Classe II. |

### Textiles et accessoires textiles

#### Tissu Rivi (au mètre) — `artek-rivi-fabric`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-rivi-fabric) · [Fiche Artek](https://www.artek.fi/en/products/rivi-fabric) · Tissu au mètre · 12 variantes · 6 photos · familles du site : aucune  
Artek : Rivi Fabric · Ronan & Erwan Bouroullec · 2017 · Made in Latvia · en catalogue  
Dimensions Artek : Au mètre : laize 150 cm (coton, toile) / 145 cm (coton enduit) (artek.fi, section Materials and Dimensions)  
Constats : 0 critique, 1 élevé, 6 moyen, 5 faible, 5 info ; 10 corrigés le 29 septembre.  
**Verdict :** Coloris et photos justes (fond/motif dans le bon sens), mais la fiche « au mètre » décrit un coupon prédécoupé 150 × 300 cm et annonce une laize de 150 cm fausse pour le coton enduit (145 cm) ; aucune catégorie adaptée.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Tissu au mètre »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Description |  | La fiche au mètre reprend le texte du coupon : « Le tissu Rivi en coton prédécoupé… La dimension du tissu est de 150 × 300 cm », puis « Vendu au mètre ». Le client ne sait pas s'il reçoit 1 m ou un coupon de 3 m. | Supprimer « prédécoupé » et « La dimension du tissu est de 150 × 300 cm » ; écrire : « Vendu au mètre linéaire : 1 unité = 1 m ; commandez autant d'unités que de mètres souhaités (coupe d'un seul tenant). » |
| ✅ corrigé | moyen | Métachamps |  | custom.dimensions et la description indiquent une laize unique de 150 cm ; chez Artek le coton enduit acrylique fait 145 cm de large. | custom.dimensions : « Laize 150 cm (coton, toile de coton) — 145 cm (coton enduit) — vendu au mètre » ; même précision dans la description. |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide alors que les trois qualités ont une composition et un grammage précis ; aucune mention « non recommandé pour le garnissage de sièges ». | custom.material : « Coton 100 % (180 g/m²), coton enduit acrylique (220 g/m²) ou toile de coton (280 g/m²) » ; ajouter « Ne convient pas au garnissage de sièges » dans la description. |
| ⬜ à faire | moyen | Classement |  | Aucune sous-catégorie existante ne correspond à un tissu au mètre (coussins-plaids-tapis n'accepte que les types Coussin/Tapis/Couvre-lit/Plaid ; objets-decoratifs-cadres ne convient pas). | Décision propriétaire : soit créer une sous-catégorie « Tissus & mercerie » (types Tissu au mètre, Coupon de tissu, Sangle), soit accepter la visibilité marque + recherche ; ne pas forcer dans coussins-plaids-tapis. |

#### Coupon de tissu Rivi (150 × 300 cm) — `artek-rivi-pre-cut-fabric`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-rivi-pre-cut-fabric) · [Fiche Artek](https://www.artek.fi/en/products/rivi-fabric) · Coupon de tissu · 12 variantes · 6 photos · familles du site : aucune  
Artek : Rivi Fabric, pre-cut · Ronan & Erwan Bouroullec · 2017 · Made in Latvia · en catalogue  
Dimensions Artek : Coupon 150 × 300 cm (coton et toile) ; 145 × 300 cm (coton enduit) (artek.fi, figures « Cotton, pre-cut », « Acrylic coated cotton, pre-cut »)  
Constats : 0 critique, 1 élevé, 6 moyen, 4 faible, 5 info ; 8 corrigés le 29 septembre.  
**Verdict :** Variantes, prix et photos cohérents ; le titre « 150 × 300 cm » est faux pour le coton enduit (145 × 300), origine et matière absentes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Coupon de tissu »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Titre |  | Le titre, le SEO et custom.dimensions annoncent 150 × 300 cm pour toutes les matières ; le coupon en coton enduit acrylique mesure 145 × 300 cm chez Artek. | Titre « Coupon de tissu Rivi (300 cm) » ou garder 150 × 300 et préciser dans custom.dimensions : « 150 × 300 cm (coton, toile) — 145 × 300 cm (coton enduit) ». |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide ; composition/grammage connus. | custom.material : « Coton 100 %, coton enduit acrylique ou toile de coton selon la variante ». |
| ⬜ à faire | moyen | Classement |  | Aucune sous-catégorie existante adaptée à un coupon de tissu. | Même décision que pour le tissu au mètre (sous-catégorie « Tissus & mercerie » à créer ou visibilité marque seule). |

#### Plateau Rivi — `artek-rivi-tray`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-rivi-tray) · [Fiche Artek](https://www.artek.fi/en/products/rivi-tray) · Plateau · 8 variantes · 10 photos · familles du site : Arts de la table  
Artek : Rivi Tray · Ronan & Erwan Bouroullec · 2017 · Made in Sweden · en catalogue  
Dimensions Artek : Small 27 × 20 cm ; Large 43 × 33 cm (artek.fi, figures Rivi Tray small/large)  
Constats : 0 critique, 2 élevé, 4 moyen, 7 faible, 1 info ; 10 corrigés le 29 septembre.  
**Verdict :** 8 variantes conformes à Artek, chaque photo montre le bon coloris et la bonne taille ; manquent créateur, année et dimensions dans les métachamps.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.designer vide : pas de créateur sur la fiche ni de lien créateur. | Renseigner custom.designer (voir reference-artek.csv) ou laisser vide si Artek ne crédite personne. |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | Année 2017 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Métachamps |  | Créateur seulement en tag (« ronan-erwan-bouroullec ») : custom.designer vide, donc aucun créateur affiché sur la fiche. | Renseigner custom.designer ou retirer le tag si le créateur est faux. |

#### Housse de coussin Rivi — `artek-rivi-cushion-cover`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-rivi-cushion-cover) · [Fiche Artek](https://www.artek.fi/en/products/rivi-cushion-cover) · Housse de coussin · 8 variantes · 12 photos · familles du site : aucune  
Artek : Rivi Cushion Cover · Ronan & Erwan Bouroullec · 2017 · Made in Estonia · en catalogue  
Dimensions Artek : 40 × 40 cm et 50 × 50 cm (artek.fi)  
Constats : 0 critique, 4 élevé, 5 moyen, 6 faible, 1 info ; 12 corrigés le 29 septembre.  
**Verdict :** Variantes et photos exactes (coloris et tailles vérifiés), mais la housse n'est rangée dans aucune catégorie alors que « Coussins, plaids & tapis » existe, et rien n'indique que le garnissage est vendu à part.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Housse de coussin »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Métachamps |  | custom.designer vide : pas de créateur sur la fiche ni de lien créateur. | Renseigner custom.designer (voir reference-artek.csv) ou laisser vide si Artek ne crédite personne. |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Classement |  | Le type « Housse de coussin » n'est capté par aucune règle ; la sous-catégorie adaptée existe : coussins-plaids-tapis (types Coussin/Tapis/Couvre-lit/Plaid). | Ajouter « Housse de coussin » aux règles de coussins-plaids-tapis et decoration (collection Shopify + CATEGORY_FILTERS), ou passer le type à « Coussin ». |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | Année 2017 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Métachamps |  | Créateur seulement en tag (« ronan-erwan-bouroullec ») : custom.designer vide, donc aucun créateur affiché sur la fiche. | Renseigner custom.designer ou retirer le tag si le créateur est faux. |
| ✅ corrigé | moyen | Description |  | La description ne dit pas que la housse est vendue sans garnissage, alors que toutes les photos montrent des coussins garnis. | Ajouter : « Housse seule, coussin de garnissage vendu séparément (Coussin de garnissage 40 × 40 ou 50 × 50 cm) » avec lien vers artek-inner-cushion. |

#### Coussin de garnissage — `artek-inner-cushion`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-inner-cushion) · [Fiche Artek](https://shop.artek.fi/products/inner-cushion-40-x-40-cm) · Coussin · 2 variantes · 2 photos · familles du site : Décoration  
Artek : Inner cushion (40 × 40 / 50 × 50 / 40 × 60 cm) · aucun (accessoire) · — · Made in non indiqué par Artek · introuvable sur artek.fi (page produit redirigée) ; en vente sur shop.artek.fi  
Dimensions Artek : 40 × 40 cm, 50 × 50 cm, 40 × 60 cm (titres shop.artek.fi)  
Constats : 0 critique, 1 élevé, 7 moyen, 2 faible, 0 info ; 3 corrigés le 29 septembre.  
**Verdict :** Photos et tailles correctes, mais description fausse (« celui-ci est le plus petit ») et matière absente (polyester recyclé).

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ⬜ à faire | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Description |  | Description très courte (169 caractères). |  |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ✅ corrigé | moyen | Description |  | « Ils sont disponibles en deux tailles différentes, dont celui-ci est le plus petit » : la fiche propose les deux tailles en variantes ; Artek en propose trois. | « Coussin de garnissage Artek en polyester 100 % recyclé, à glisser dans les housses Rivi, Siena ou Zebra. Disponible en 40 × 40 cm et 50 × 50 cm. » |
| ⬜ à faire | moyen | Métachamps |  | Précision pour NO_MATERIAL : matière Artek connue. | custom.material « Polyester 100 % recyclé » ; custom.dimensions « 40 × 40 cm ou 50 × 50 cm ». |

#### Sac en toile Rivi — `artek-rivi-canvas-bag`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-rivi-canvas-bag) · [Fiche Artek](https://www.artek.fi/en/products/rivi-canvas-bag) · Sac · 4 variantes · 8 photos · familles du site : aucune  
Artek : Rivi Canvas Bag · Ronan & Erwan Bouroullec · 2017 · Made in Estonia · en catalogue  
Dimensions Artek : 41 × 41 cm (artek.fi)  
Constats : 0 critique, 2 élevé, 5 moyen, 4 faible, 1 info ; 8 corrigés le 29 septembre.  
**Verdict :** Coloris et photos de variante exacts, dimensions justes ; deux packshots en double dans la galerie et aucune catégorie.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Sac »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Métachamps |  | custom.designer vide : pas de créateur sur la fiche ni de lien créateur. | Renseigner custom.designer (voir reference-artek.csv) ou laisser vide si Artek ne crédite personne. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | Année 2017 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Métachamps |  | Créateur seulement en tag (« ronan-erwan-bouroullec ») : custom.designer vide, donc aucun créateur affiché sur la fiche. | Renseigner custom.designer ou retirer le tag si le créateur est faux. |
| ⬜ à faire | moyen | Classement |  | Aucune sous-catégorie existante pour sacs et pochettes. | Décision propriétaire : créer une sous-catégorie « Sacs & pochettes » (types Sac, Pochette) sous Décoration, ou accepter la visibilité marque + recherche. |

#### Pochette Rivi — `artek-rivi-pouch`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-rivi-pouch) · [Fiche Artek](https://www.artek.fi/en/products/rivi-pouch) · Pochette · 4 variantes · 5 photos · familles du site : aucune  
Artek : Rivi Pouch (small) · Ronan & Erwan Bouroullec · 2017 · Made in Estonia · en catalogue  
Dimensions Artek : 24 × 15 cm (artek.fi, Rivi Pouch small)  
Constats : 0 critique, 2 élevé, 5 moyen, 3 faible, 1 info ; 7 corrigés le 29 septembre.  
**Verdict :** Fiche exacte (4 coloris, 24 × 15 cm, photos justes) ; seuls manquent créateur/année en métachamps et une catégorie.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Pochette »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Métachamps |  | custom.designer vide : pas de créateur sur la fiche ni de lien créateur. | Renseigner custom.designer (voir reference-artek.csv) ou laisser vide si Artek ne crédite personne. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | Année 2017 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ✅ corrigé | moyen | Métachamps |  | Créateur seulement en tag (« ronan-erwan-bouroullec ») : custom.designer vide, donc aucun créateur affiché sur la fiche. | Renseigner custom.designer ou retirer le tag si le créateur est faux. |
| ⬜ à faire | moyen | Classement |  | Aucune sous-catégorie existante pour les pochettes. | Même décision que pour les sacs (« Sacs & pochettes » à créer ou visibilité marque seule). |

#### Tissu Siena (au mètre) — `artek-siena-fabric`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-siena-fabric) · [Fiche Artek](https://www.artek.fi/en/products/siena-fabric) · Tissu au mètre · 14 variantes · 9 photos · familles du site : aucune  
Artek : Siena Fabric · Alvar Aalto · 1954 · Made in Latvia · en catalogue  
Dimensions Artek : Au mètre : laize 150 cm (coton, toile), 145 cm (coton enduit) (artek.fi)  
Constats : 0 critique, 1 élevé, 6 moyen, 5 faible, 6 info ; 10 corrigés le 29 septembre.  
**Verdict :** 14 variantes exactes (Blanc/blanc n'existe pas en toile), photos de coloris justes ; photo principale blanc sur blanc peu lisible, texte de coupon sur une fiche au mètre, laize du coton enduit fausse.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Tissu au mètre »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Photos |  | La photo principale (#1) est le coloris Blanc/blanc : motif blanc sur blanc presque invisible sur la carte produit ; le coupon Siena utilise Blanc/noir, plus représentatif. | Mettre en principale la photo Blanc/noir (#6) et réordonner les variantes (Blanc/noir en premier). |
| ✅ corrigé | moyen | Description |  | Même texte que le coupon : « Le tissu Siena en coton prédécoupé… La dimension du tissu est de 150 × 300 cm », puis « Vendu au mètre ». | Supprimer les mentions de coupon ; préciser « 1 unité = 1 mètre linéaire, coupe d'un seul tenant ». |
| ✅ corrigé | moyen | Métachamps |  | Laize unique « 150 cm » annoncée ; le coton enduit acrylique fait 145 cm. | custom.dimensions : « Laize 150 cm (coton, toile de coton) — 145 cm (coton enduit) — vendu au mètre ». |
| ⬜ à faire | moyen | Classement |  | Aucune sous-catégorie existante pour un tissu au mètre. | Voir décision « Tissus & mercerie » (Rivi). |

#### Coupon de tissu Siena (150 × 300 cm) — `artek-siena-pre-cut-fabric`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-siena-pre-cut-fabric) · [Fiche Artek](https://www.artek.fi/en/products/siena-fabric) · Coupon de tissu · 14 variantes · 9 photos · familles du site : aucune  
Artek : Siena Fabric, pre-cut · Alvar Aalto · 1954 · Made in Latvia · en catalogue  
Dimensions Artek : 150 × 300 cm (shop.artek.fi « The size of the fabric is 150 x 300 cm ») ; coton enduit : laize 145 cm  
Constats : 0 critique, 1 élevé, 5 moyen, 6 faible, 5 info ; 8 corrigés le 29 septembre.  
**Verdict :** Variantes exactes et photos justes ; manquent origine, matière et tag de fabrication, dimension fausse pour le coton enduit.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Coupon de tissu »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Titre |  | « 150 × 300 cm » annoncé pour toutes les qualités ; le coton enduit a une laize de 145 cm. | custom.dimensions : « 150 × 300 cm (coton, toile) — 145 × 300 cm (coton enduit) ». |
| ⬜ à faire | moyen | Classement |  | Aucune sous-catégorie existante pour un coupon de tissu. | Voir décision « Tissus & mercerie ». |

#### Housse de coussin Siena — `artek-siena-cushion-cover`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-siena-cushion-cover) · [Fiche Artek](https://www.artek.fi/en/products/siena-cushion-cover) · Housse de coussin · 8 variantes · 9 photos · familles du site : aucune  
Artek : Siena Cushion Cover · Alvar Aalto (motif) · motif 1954 ; produit 2010 (artek.fi) · Made in Estonia · en catalogue  
Dimensions Artek : 40 × 40 cm et 50 × 50 cm (artek.fi)  
Constats : 0 critique, 4 élevé, 5 moyen, 2 faible, 0 info ; 7 corrigés le 29 septembre.  
**Verdict :** 8 variantes et photos exactes ; housse absente de « Coussins, plaids & tapis », garnissage non signalé, créateur seulement en tag.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Housse de coussin »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Métachamps |  | custom.designer vide : pas de créateur sur la fiche ni de lien créateur. | Renseigner custom.designer (voir reference-artek.csv) ou laisser vide si Artek ne crédite personne. |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Classement |  | Type « Housse de coussin » hors de toute règle alors que coussins-plaids-tapis existe. | Ajouter « Housse de coussin » aux règles coussins-plaids-tapis et decoration (ou type « Coussin »). |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | Créateur seulement en tag (« alvar-aalto ») : custom.designer vide, donc aucun créateur affiché sur la fiche. | Renseigner custom.designer ou retirer le tag si le créateur est faux. |
| ✅ corrigé | moyen | Photos | Blanc/noir / 50 × 50 cm | Alt de l’image de variante « Housse de coussin Siena — Artek » sans rapport avec la finition « Blanc/noir / 50 × 50 cm ». |  |
| ✅ corrigé | moyen | Description |  | Pas de mention « housse seule, garnissage vendu séparément » malgré des photos de coussins garnis. | Ajouter la mention et un lien vers artek-inner-cushion. |

#### Sac en toile Siena — `artek-siena-canvas-bag`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-siena-canvas-bag) · [Fiche Artek](https://www.artek.fi/en/products/siena-canvas-bag) · Sac · 4 variantes · 7 photos · familles du site : aucune  
Artek : Siena Canvas Bag · Alvar Aalto (motif) · motif 1954 ; produit 2010 · Made in Estonia · en catalogue  
Dimensions Artek : 41 × 41 cm (artek.fi)  
Constats : 0 critique, 2 élevé, 4 moyen, 3 faible, 1 info ; 5 corrigés le 29 septembre.  
**Verdict :** Fiche exacte (4 coloris, 41 × 41 cm, photos justes) ; créateur/année seulement en tag, pas de catégorie.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Sac »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Métachamps |  | custom.designer vide : pas de créateur sur la fiche ni de lien créateur. | Renseigner custom.designer (voir reference-artek.csv) ou laisser vide si Artek ne crédite personne. |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | Créateur seulement en tag (« alvar-aalto ») : custom.designer vide, donc aucun créateur affiché sur la fiche. | Renseigner custom.designer ou retirer le tag si le créateur est faux. |
| ⬜ à faire | moyen | Classement |  | Aucune sous-catégorie existante pour les sacs. | Voir décision « Sacs & pochettes ». |

#### Pochette Siena — `artek-siena-pouch`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-siena-pouch) · [Fiche Artek](https://www.artek.fi/en/products/siena-pouch) · Pochette · 4 variantes · 6 photos · familles du site : aucune  
Artek : Siena Pouch (small) · Alvar Aalto (motif) · motif 1954 ; produit 2014 · Made in Estonia · en catalogue  
Dimensions Artek : 24 × 15 cm (artek.fi, Siena Pouch small)  
Constats : 0 critique, 2 élevé, 4 moyen, 4 faible, 0 info ; 5 corrigés le 29 septembre.  
**Verdict :** Fiche exacte (coloris, photos, 24 × 15 cm) ; créateur/année absents des métachamps, pas de catégorie.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Pochette »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Métachamps |  | custom.designer vide : pas de créateur sur la fiche ni de lien créateur. | Renseigner custom.designer (voir reference-artek.csv) ou laisser vide si Artek ne crédite personne. |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | Créateur seulement en tag (« alvar-aalto ») : custom.designer vide, donc aucun créateur affiché sur la fiche. | Renseigner custom.designer ou retirer le tag si le créateur est faux. |
| ⬜ à faire | moyen | Classement |  | Aucune sous-catégorie existante pour les pochettes. | Voir décision « Sacs & pochettes ». |

#### Plateau Siena — `artek-siena-tray`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-siena-tray) · [Fiche Artek](https://www.artek.fi/en/products/siena-tray) · Plateau · 8 variantes · 9 photos · familles du site : Arts de la table  
Artek : Siena Tray · Alvar Aalto (motif) · motif 1954 ; produit 2002 · Made in Sweden · en catalogue  
Dimensions Artek : Small 27 × 20 cm ; Large 43 × 33 cm (artek.fi)  
Constats : 0 critique, 2 élevé, 3 moyen, 5 faible, 0 info ; 4 corrigés le 29 septembre.  
**Verdict :** 8 variantes et 8 photos exactes (coloris et tailles) ; dimensions, créateur et année manquent en métachamps.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Métachamps |  | custom.designer vide : pas de créateur sur la fiche ni de lien créateur. | Renseigner custom.designer (voir reference-artek.csv) ou laisser vide si Artek ne crédite personne. |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | Créateur seulement en tag (« alvar-aalto ») : custom.designer vide, donc aucun créateur affiché sur la fiche. | Renseigner custom.designer ou retirer le tag si le créateur est faux. |

#### Coussin d'assise Zebra — `artek-zebra-seat-cushion`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-zebra-seat-cushion) · [Fiche Artek](https://www.artek.fi/en/products/zebra-seat-cushion) · Coussin · 1 variante · 3 photos · familles du site : Décoration  
Artek : Zebra Seat Cushion · motif anonyme, découvert par Aino Aalto (1935) · 2017 (produit) ; tissu 1936 · Made in Estonia · en catalogue  
Dimensions Artek : Ø 34 cm (artek.fi, figure 34 × 34)  
Constats : 0 critique, 3 élevé, 3 moyen, 6 faible, 2 info ; 11 corrigés le 29 septembre.  
**Verdict :** Photo et dimensions justes, mais le SEO attribue le motif à Aino Aalto (anonyme, seulement découvert par elle) et le coloris n'est pas nommé (Artek propose noir/blanc et marron/blanc).

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Options |  | Variante unique « Default Title » : le client ne peut choisir ni la finition ni le revêtement qui existent chez Artek. |  |
| ✅ corrigé | élevé | SEO |  | Titre et méta-description SEO : « Coussin d'assise Zebra par Aino Aalto » ; Aino Aalto n'a pas dessiné le motif. | Ne pas écrire « par Aino Aalto » : « Tissu Zebra (anonyme, repéré par Aino Aalto en 1935) ». Laisser custom.designer vide ou « Anonyme » ; remplacer le tag aino-aalto par un texte descriptif, ou le garder uniquement si la page créateur explique « sélection d'Aino Aalto ». |
| ✅ corrigé | élevé | Variantes |  | Variante unique « Default Title » : le coloris (noir/blanc sur la photo) n'est écrit nulle part, alors qu'Artek vend aussi marron/blanc. | Créer l'option « Coloris » = « Noir/blanc » (et « Marron/blanc » si le fournisseur la livre), avec la photo correspondante. |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | Créateur seulement en tag (« aino-aalto ») : custom.designer vide, donc aucun créateur affiché sur la fiche. | Renseigner custom.designer ou retirer le tag si le créateur est faux. |

#### Housse de coussin Zebra — `artek-zebra-cushion-cover`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-zebra-cushion-cover) · [Fiche Artek](https://www.artek.fi/en/products/zebra-cushion-cover) · Housse de coussin · 2 variantes · 5 photos · familles du site : aucune  
Artek : Zebra Cushion Cover · motif anonyme, découvert par Aino Aalto · 1936 (artek.fi) · Made in Estonia · en catalogue  
Dimensions Artek : 40 × 40, 50 × 50, 40 × 60 cm  
Constats : 0 critique, 3 élevé, 5 moyen, 4 faible, 0 info ; 6 corrigés le 29 septembre.  
**Verdict :** Photos et tailles justes ; SEO correct (« découvert par Aino Aalto ») ; coloris non nommé, marron/blanc et 40 × 60 absents, housse hors de sa catégorie.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Housse de coussin »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Classement |  | Type « Housse de coussin » hors des règles alors que coussins-plaids-tapis existe. | Ajouter « Housse de coussin » aux règles coussins-plaids-tapis et decoration (ou type « Coussin »). |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Variantes |  | Aucune option de coloris : noir/blanc implicite ; Artek propose aussi marron/blanc et un format 40 × 60 cm. | Ajouter l'option « Coloris » = Noir/blanc (et Marron/blanc si référencé) ; 40 × 60 en option facultative. |
| ✅ corrigé | moyen | Description |  | Pas de mention « housse seule, garnissage vendu séparément ». | Ajouter la mention et un lien vers artek-inner-cushion. |
| ⬜ à faire | moyen | Métachamps |  | Précision pour NO_YEAR / NO_DESIGNER. | Ne pas écrire « par Aino Aalto » : « Tissu Zebra (anonyme, repéré par Aino Aalto en 1935) ». Laisser custom.designer vide ou « Anonyme » ; remplacer le tag aino-aalto par un texte descriptif, ou le garder uniquement si la page créateur explique « sélection d'Aino Aalto ». custom.year 1936. |

#### Sac cabas Zebra — `artek-zebra-tote-bag`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-zebra-tote-bag) · [Fiche Artek](https://www.artek.fi/en/products/zebra-tote-bag) · Sac · 1 variante · 3 photos · familles du site : aucune  
Artek : Zebra Tote Bag · motif anonyme, découvert par Aino Aalto · 2017 · Made in Estonia · en catalogue  
Dimensions Artek : 41 × 42 cm (artek.fi)  
Constats : 0 critique, 4 élevé, 3 moyen, 4 faible, 2 info ; 10 corrigés le 29 septembre.  
**Verdict :** Photos et dimensions justes ; SEO « par Aino Aalto » inexact et coloris (noir/blanc, anse noire) non nommé.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Sac »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Options |  | Variante unique « Default Title » : le client ne peut choisir ni la finition ni le revêtement qui existent chez Artek. |  |
| ✅ corrigé | élevé | SEO |  | SEO « Sac cabas Zebra par Aino Aalto ». | Ne pas écrire « par Aino Aalto » : « Tissu Zebra (anonyme, repéré par Aino Aalto en 1935) ». Laisser custom.designer vide ou « Anonyme » ; remplacer le tag aino-aalto par un texte descriptif, ou le garder uniquement si la page créateur explique « sélection d'Aino Aalto ». |
| ✅ corrigé | élevé | Variantes |  | Variante « Default Title » : ni le coloris noir/blanc ni la couleur de l'anse (cuir noir) ne sont indiqués ; Artek vend aussi marron/blanc à anse marron. | Option « Coloris » = « Noir/blanc, anse cuir noir » (+ « Marron/blanc, anse cuir marron » si référencé). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ⬜ à faire | moyen | Classement |  | Aucune sous-catégorie existante pour les sacs. | Voir décision « Sacs & pochettes ». |

#### Pochette Zebra — `artek-zebra-pouch`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-zebra-pouch) · [Fiche Artek](https://www.artek.fi/en/products/zebra-pouch) · Pochette · 2 variantes · 4 photos · familles du site : aucune  
Artek : Zebra Pouch (small / large) · motif anonyme, découvert par Aino Aalto · 2017 · Made in Estonia · en catalogue  
Dimensions Artek : Large 29,5 × 22 cm (artek.fi) ; small non chiffrée par Artek  
Constats : 0 critique, 3 élevé, 4 moyen, 5 faible, 2 info ; 9 corrigés le 29 septembre.  
**Verdict :** Tailles et photos cohérentes ; SEO « par Aino Aalto » inexact, coloris non nommé, cote du petit modèle non vérifiable.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Pochette »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | SEO |  | SEO « Pochette Zebra par Aino Aalto ». | Ne pas écrire « par Aino Aalto » : « Tissu Zebra (anonyme, repéré par Aino Aalto en 1935) ». Laisser custom.designer vide ou « Anonyme » ; remplacer le tag aino-aalto par un texte descriptif, ou le garder uniquement si la page créateur explique « sélection d'Aino Aalto ». |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Variantes |  | Seule l'option Dimensions existe ; coloris noir/blanc implicite, marron/blanc absent. | Ajouter l'option « Coloris » (Noir/blanc ; Marron/blanc si référencé). |
| ⬜ à faire | moyen | Classement |  | Aucune sous-catégorie existante pour les pochettes. | Voir décision « Sacs & pochettes ». |

#### Sangle en lin (au mètre) — `artek-webbing`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-webbing) · [Fiche Artek](https://shop.artek.fi/products/linen-webbing) · Sangle · 6 variantes · 8 photos · familles du site : aucune  
Artek : Webbing (linen webbing) · aucun (matériau ; sangles adoptées par Alvar Aalto, palette de couleurs avec Hella Jongerius) · — · Made in Germany (shop.artek.fi) · introuvable sur artek.fi (redirection) ; en vente sur shop.artek.fi  
Dimensions Artek : Largeur 5 cm ; 1 unité = 1 mètre (shop.artek.fi)  
Constats : 0 critique, 2 élevé, 13 moyen, 3 faible, 1 info ; 7 corrigés le 29 septembre.  
**Verdict :** Six coloris exacts et bien illustrés ; photos 500 px, SEO « par Alvar Aalto » et anglais « Webbing », renvoi à une section qui n'existe pas sur Mikado, largeur et origine absentes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Sangle »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Photos |  | Image basse définition 447×447 (variante) : packshot-7f232f7c47fae2b90adf2b23e24a8a76.png. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ⬜ à faire | moyen | Photos |  | Image basse définition 500×500 (variante) : Artek-Webbing-natural_red_web.jpg. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ⬜ à faire | moyen | Photos |  | Image basse définition 500×500 (variante) : Artek-Webbing-natural_black_web.jpg. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ⬜ à faire | moyen | Photos |  | Image basse définition 500×500 (variante) : Artek-Webbing-black_black_web.jpg. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ⬜ à faire | moyen | Photos |  | Image basse définition 500×500 (variante) : Artek-Webbing-black_brown_web.jpg. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ⬜ à faire | moyen | Photos |  | Image basse définition 500×500 (variante) : Artek-Webbing-black_blue_web.jpg. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ✅ corrigé | moyen | SEO |  | Méta-description « Sangle Webbing (au mètre) par Alvar Aalto » : reste d'anglais et attribution de création à Aalto pour un matériau ; titre SEO « Sangle en lin (au mètre) Alvar Aalto ». | Titre SEO « Sangle en lin Artek au mètre — Mikado Deco » ; méta « Sangle 100 % lin, largeur 5 cm, pour regarnir les chaises et fauteuils Aalto à sangles (611, 45, 406…). » |
| ✅ corrigé | moyen | Description |  | « Vous trouverez le métrage de sangle nécessaire pour chaque modèle de chaise dans la section matériaux et dimensions » : cette section n'existe pas sur la fiche Mikado (texte traduit de shop.artek.fi). | Remplacer par un lien vers le guide Artek (artek.fi/en/guides/re-webbing-guide) ou indiquer les métrages par modèle. |
| ✅ corrigé | moyen | Métachamps |  | Précision pour NO_DIMENSIONS / NO_ORIGIN : valeurs Artek. | custom.dimensions « Largeur 5 cm — vendu au mètre » ; custom.origin « Fabriqué en Allemagne » ; tag made-in-allemagne. |
| ⬜ à faire | moyen | Classement |  | Aucune sous-catégorie existante (pièce détachée / mercerie). | Voir décision « Tissus & mercerie ». |

#### Tissu Zebra (au mètre) — `artek-zebra-fabric`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-zebra-fabric) · [Fiche Artek](https://shop.artek.fi/products/zebra-fabric) · Tissu au mètre · 1 variante · 2 photos · familles du site : aucune  
Artek : Zebra Fabric · Anonyme (découvert par Aino Aalto) · 1936 · Made in Germany (shop.artek.fi) · introuvable sur artek.fi (redirection) ; en vente sur shop.artek.fi  
Dimensions Artek : Laize 137 cm ; 1 unité = 1 mètre (shop.artek.fi) — artek.fi indique 140 cm pour le tissu des accessoires  
Constats : 0 critique, 4 élevé, 6 moyen, 3 faible, 3 info ; 10 corrigés le 29 septembre.  
**Verdict :** Laize 137 cm conforme à shop.artek.fi ; SEO « par Aino Aalto » faux (Artek : « Anonymous »), coloris non nommé, matière et origine (Allemagne) absentes.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Tissu au mètre »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Options |  | Variante unique « Default Title » : le client ne peut choisir ni la finition ni le revêtement qui existent chez Artek. |  |
| ✅ corrigé | élevé | SEO |  | Titre et méta SEO « Tissu Zebra (au mètre) par Aino Aalto » ; Artek crédite « Anonymous, 1936 ». | Ne pas écrire « par Aino Aalto » : « Tissu Zebra (anonyme, repéré par Aino Aalto en 1935) ». Laisser custom.designer vide ou « Anonyme » ; remplacer le tag aino-aalto par un texte descriptif, ou le garder uniquement si la page créateur explique « sélection d'Aino Aalto ». |
| ✅ corrigé | élevé | Variantes |  | Variante unique « Default Title » pour un tissu au mètre à 351 € : coloris (noir/blanc) non écrit ; Artek propose aussi marron/blanc. | Option « Coloris » = Noir/blanc (+ Marron/blanc si référencé). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Métachamps |  | Précision pour NO_MATERIAL / NO_ORIGIN / NO_YEAR. | custom.material « 58 % laine, 36 % coton, 6 % polyester (double jacquard) » ; custom.origin « Fabriqué en Allemagne » ; custom.year 1936 ; tag annees-1930. |
| ⬜ à faire | moyen | Classement |  | Aucune sous-catégorie existante pour un tissu au mètre. | Voir décision « Tissus & mercerie ». |

#### Tissu H55 (au mètre) — `artek-h55-fabric`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-h55-fabric) · [Fiche Artek](https://www.stylepark.com/en/artek/h55-fabric) · Tissu au mètre · 1 variante · 1 photo · familles du site : aucune  
Artek : H55 Fabric · Elissa Aalto · 1955 (réédition Artek 2013) · Made in non trouvé · introuvable : ni sur artek.fi (redirection vers la liste produits) ni sur shop.artek.fi — probablement arrêté, à confirmer auprès du fournisseur  
Dimensions Artek : Laize non confirmée (150 cm pour la toile de coton selon revendeurs ; 140 cm annoncé par Mikado — à confirmer)  
Constats : 1 critique, 5 élevé, 7 moyen, 3 faible, 3 info ; 2 corrigés le 29 septembre.  
**Verdict :** Produit probablement arrêté chez Artek ; créatrice (Elissa Aalto, 1955) absente alors qu'elle est écrite sur la lisière de la photo, qualité et coloris non définis, photo unique 543 × 313, description générique.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ retiré de la vente en ligne | critique | Variantes |  | Variante unique « Default Title » : le client ne peut choisir ni la qualité (coton, coton enduit, toile, laine/coton) ni le coloris (noir sur blanc / blanc sur noir) ; la commande est indéfinie. | Définir la qualité réellement proposée (titre « Tissu H55 laine/coton » par ex.) et une option Coloris ; sinon dépublier. |
| ✅ retiré de la vente en ligne | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Tissu au mètre »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ retiré de la vente en ligne | élevé | Métachamps |  | custom.designer vide : pas de créateur sur la fiche ni de lien créateur. | Renseigner custom.designer (voir reference-artek.csv) ou laisser vide si Artek ne crédite personne. |
| ✅ retiré de la vente en ligne | élevé | Options |  | Variante unique « Default Title » : le client ne peut choisir ni la finition ni le revêtement qui existent chez Artek. |  |
| ✅ retiré de la vente en ligne | élevé | Données fabricant |  | H55 n'apparaît plus sur artek.fi (page produit redirigée) ni dans le catalogue shop.artek.fi (304 produits parcourus) : produit probablement arrêté, disponibilité à confirmer avant de le laisser en vente (délai « 3-4 semaines »). | Confirmer auprès d'Artek ; si arrêté, passer la fiche en brouillon ou « épuisé ». |
| ✅ retiré de la vente en ligne | élevé | Métachamps |  | Précision pour NO_DESIGNER / NO_YEAR : créatrice lisible sur la lisière de la photo #1. | custom.designer « Elissa Aalto », custom.year 1955 ; tags elissa-aalto, annees-1950 ; SEO « Tissu H55 d'Elissa Aalto (1955) ». |
| ✅ retiré de la vente en ligne | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ retiré de la vente en ligne | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ retiré de la vente en ligne | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ retiré de la vente en ligne | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ retiré de la vente en ligne | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ✅ retiré de la vente en ligne | moyen | Photos |  | Image basse définition 543×313 (variante) : artek-artek-h55-fabric-00.png. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ✅ retiré de la vente en ligne | moyen | Description |  | Description générique et calquée sur l'anglais : « pièce de la collection Upholstery d'Artek » ; rien sur le motif (H couchés), l'histoire (exposition H55 Helsingborg 1955), la composition. | Réécrire : motif de H couchés dessiné par Elissa Aalto pour l'appartement finlandais de l'exposition H55 à Helsingborg (1955) ; qualité, composition, laize, entretien. |

#### Patins feutre (Lot de 4) — `artek-felt-glides`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-felt-glides) · [Fiche Artek](https://shop.artek.fi/products/felt-glides) · Accessoire · 3 variantes · 1 photo · familles du site : aucune  
Artek : Felt glides (lot de 4 + vis) · aucun (accessoire) · — · Made in non indiqué · introuvable sur artek.fi ; en vente sur shop.artek.fi  
Dimensions Artek : 17 × 30 / 22 × 45 / 28 × 52 mm ; Small : tabourets 60/E60/NE60, chaises 65/66/68/69/N65, 64, K65, bancs 153A/B, table 90D ; Medium : banc 168B, tables 80A-C, 81A-C, 84, 90A/B, 95, 96, DL81C ; Large : tables 82A/B, 83, 86, 86A, 91, 97 (shop.artek.fi)  
Constats : 0 critique, 2 élevé, 11 moyen, 3 faible, 1 info ; 7 corrigés le 29 septembre.  
**Verdict :** Tailles justes mais libellés « LG60/LG80/LG83 » inventés, compatibilités incomplètes (les bancs 153 prennent le petit format), même prix pour les trois tailles, photo unique montrant les trois formats.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Accessoire »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ⬜ à faire | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Photos | LG60 (17 × 30 mm) | Alt de l’image de variante « Patins feutre (Lot de 4) — Artek » sans rapport avec la finition « LG60 (17 × 30 mm) ». |  |
| ✅ corrigé | moyen | Photos | LG80 (22 × 45 mm) | Alt de l’image de variante « Patins feutre (Lot de 4) — Artek » sans rapport avec la finition « LG80 (22 × 45 mm) ». |  |
| ✅ corrigé | moyen | Photos | LG83 (28 × 52 mm) | Alt de l’image de variante « Patins feutre (Lot de 4) — Artek » sans rapport avec la finition « LG83 (28 × 52 mm) ». |  |
| ⬜ à faire | moyen | Photos |  | La photo principale est partagée par 3 variantes : la fiche s’ouvre sur la première d’entre elles. |  |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ⬜ à faire | moyen | Photos |  | Image basse définition 814×814 (variante) : packshot-9ad616a474e7fab12b4b2c552e78a4a2.png. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ✅ corrigé | moyen | Variantes |  | Libellés « LG60 / LG80 / LG83 » absents chez Artek (Small / Medium / Large) et trompeurs : « LG80 » laisse croire au seul modèle 80, alors que le format moyen sert au banc 168B et aux tables 80–96. | « Petit 17 × 30 mm », « Moyen 22 × 45 mm », « Grand 28 × 52 mm » ; ajouter la liste de compatibilités Artek dans la description. |
| ✅ corrigé | moyen | Description |  | « Pour les bancs et les petites tables, le format intermédiaire 22 x 45 mm est adapté » : faux pour les bancs 153A/153B (petit format). | Reprendre la liste exacte de compatibilités par taille. |
| ⬜ à faire | moyen | Photos |  | La photo unique (#1, 814 px) montre un patin de chaque taille : le client peut croire que le lot contient les trois formats, alors qu'il contient 4 patins d'une seule taille. | Alt : « Les trois tailles de patins Artek (lot de 4 patins d'une même taille) » ; idéalement une photo par taille montrant 4 patins et 8 vis. |

### Objets, affiches, cache-pots et lit de repos 710

#### Accessoire Secrets of Finland — `artek-secrets-of-finland`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-secrets-of-finland) · [Fiche Artek](https://www.artek.fi/en/collections/secrets-of-finland (pages produit sur shop.artek.fi)) · Accessoire · 6 variantes · 6 photos · familles du site : aucune  
Artek : Secrets of Finland : Pauper Coin Collector, Easter Witch Vase, Easter Dog Vase, Midsummer Dream Vase, Lucius Candleholder, Lucia Candleholder (6 produits distincts) · COMPANY (Aamu Song et Johan Olin) · 2019 · Made in Portugal (confirmé pour Pauper Coin Collector par hivemodern ; à confirmer pour les 5 autres) · en catalogue (shop.artek.fi, collection FIN/JPN Friendship)  
Dimensions Artek : Pauper Coin Collector : env. 10 × 10 × 16,5 cm (4" × 4" × 6,5", hivemodern) ; autres pièces non trouvées  
Constats : 0 critique, 4 élevé, 7 moyen, 11 faible, 1 info ; 12 corrigés le 29 septembre.  
**Verdict :** Photos justes et bien liées, mais six objets distincts (tirelire, trois vases, deux bougeoirs) sont vendus comme des « finitions » d'un produit au titre anglais et sans description réelle.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Accessoire »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Options |  | L’option « Finition » liste des produits différents : Pauper coin collector \| Easter witch vase \| Easter dog vase \| Midsummer dream vase \| Lucius candleholder \| Lucia candleholder. |  |
| ◐ partiel | élevé | Variantes |  | Précision sur le constat automatique : chez Artek, ces six objets ont chacun leur fiche, et toutes ont la même glaçure « sand ». L'option « Finition » ne désigne donc aucune finition : elle permet de choisir un autre objet (tirelire, vase ou bougeoir), avec des prix de 67 à 128 €. | Créer six fiches (Tirelire Pauper, Vase Easter Witch, Vase Easter Dog, Vase Midsummer Dream, Bougeoir Lucius, Bougeoir Lucia) avec un type par objet (Vase, Bougeoir, Tirelire). À défaut, renommer l'option en « Modèle » et traduire les valeurs (ex. « Tirelire Pauper », « Vase Sorcière de Pâques »). |
| ✅ corrigé | moyen | Titre |  | Titre construit « type + nom anglais » : « Accessoire Secrets of Finland ». |  |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Description |  | Description très courte (138 caractères). |  |
| ⬜ à faire | moyen | Options |  | Valeurs d’option en anglais/code : Pauper coin collector \| Easter witch vase \| Easter dog vase \| Midsummer dream vase \| Lucius candleholder \| Lucia candleholder. |  |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ✅ corrigé | moyen | Titre |  | Le titre « Accessoire Secrets of Finland » désigne une collection et non un produit. Il ne dit ni ce qu'est l'objet, ni sa matière, ni son créateur. | Si la fiche reste unique : « Secrets of Finland — objets en céramique de COMPANY ». Sinon, un titre par objet, par exemple « Vase Midsummer Dream — Secrets of Finland ». |
| ✅ corrigé | moyen | Description |  | La description est générique (« pièce de la collection Accessories d'Artek ») et garde un mot anglais. Elle ne mentionne ni COMPANY, ni la céramique faite main, ni la collection FIN/JPN Friendship de 2019, ni la tradition finlandaise qui a inspiré chaque objet. | Rédiger une description en français à partir des textes Artek : duo COMPANY (Aamu Song et Johan Olin), 2019, six objets en céramique faite main, glaçure sable, un rituel finlandais par objet. |

#### Accessoire Postcards — `artek-postcards`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-postcards) · [Fiche Artek](https://www.artek.fi/en/products/artek-icons-postcards-greige ; https://shop.artek.fi/products/outline-postcards-3-pieces) · Accessoire · 2 variantes · 2 photos · familles du site : aucune  
Artek : Artek Icons Postcards, Greige (lot de 5) / Outline postcards 3 pieces (TSTO) · Greige (Icons) / TSTO (Outline) · 2013 (Icons) ; Outline : à confirmer (collection Outline, vers 2015) · Made in Allemagne (Icons) ; Outline : non précisé · en catalogue  
Dimensions Artek : A6 (Icons)  
Constats : 0 critique, 4 élevé, 9 moyen, 8 faible, 0 info ; 12 corrigés le 29 septembre.  
**Verdict :** Deux lots de cartes différents (5 cartes Greige et 3 cartes TSTO) sont réunis sous une seule fiche au titre anglais. La description, qui ne parle que du lot Outline (« trois cartes », TSTO), est fausse pour la variante Icons.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Accessoire »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Options |  | L’option « Finition » liste des produits différents : Icon postcards \| Outline postcards. |  |
| ✅ corrigé | élevé | Description | Icon postcards · #2 | La description et le SEO annoncent « trois cartes postales » dessinées par TSTO. Or la variante « Icon postcards » (20 €) est un lot de CINQ cartes du studio Greige : Paimio, Kiki, 10-Unit System, Beehive, Stool 60. Le client qui choisit Icons lit un contenu et un créateur faux. | Scinder en deux fiches : « Cartes postales Icons (lot de 5) — Greige » et « Cartes postales Outline (lot de 3) — TSTO ». À défaut, décrire les deux lots et indiquer le nombre de cartes dans le libellé des variantes. |
| ✅ corrigé | moyen | Titre |  | Titre avec des mots anglais : « Accessoire Postcards ». |  |
| ✅ corrigé | moyen | Titre |  | Titre construit « type + nom anglais » : « Accessoire Postcards ». |  |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Options |  | Valeurs d’option en anglais/code : Icon postcards \| Outline postcards. |  |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ✅ corrigé | moyen | Variantes |  | L'option s'appelle « Finition » et ses valeurs sont en anglais (« Icon postcards », « Outline postcards »), sans le nombre de cartes ni le créateur. | Option « Modèle » : « Icons — lot de 5 (Greige) » et « Outline — lot de 3 (TSTO)». |
| ✅ corrigé | moyen | Titre |  | Le titre « Accessoire Postcards » est anglais et générique. Le type « Accessoire » ne correspond à aucune famille du menu. | « Cartes postales Artek » (ou un titre par lot, voir ci-dessus). |

#### Accessoire Architect's Tools — `artek-architect-s-tools`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-architect-s-tools) · [Fiche Artek](https://www.artek.fi/en/products/ruler ; https://www.artek.fi/en/products/architects-scale ; https://www.artek.fi/en/products/tape-measure ; https://www.artek.fi/en/products/folding-ruler ; https://www.artek.fi/en/products/level) · Accessoire · 6 variantes · 6 photos · familles du site : aucune  
Artek : Ruler / Architect's Scale / Tape Measure / Folding Ruler / Level (5 produits distincts) · non crédité par Artek · 2011 · Made in Allemagne · en catalogue  
Dimensions Artek : 20 / 30 cm ; 20 cm ; 300 cm ; 200 cm ; 40 cm (dessins artek.fi)  
Constats : 0 critique, 3 élevé, 12 moyen, 12 faible, 0 info ; 14 corrigés le 29 septembre.  
**Verdict :** Photos exactes et bien liées, mais cinq outils différents sont vendus comme des « finitions ». Les libellés mêlent anglais et français, et celui de l'échelle d'architecte est faux (« 1:2 / 5 » au lieu de 1:2,5).

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Accessoire »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Options |  | L’option « Finition » liste des produits différents : Ruler / hêtre / 20 cm \| Ruler / hêtre / 30 cm \| Architect's scale / aluminium / 20 cm / 1:2 / 5 - 1:5 - 1:20 - 1:50 - 1:100 \| Tape measure / blanc / 3 m \| Folding ruler / hêtre / laqué noir / 2 m \| Level / aluminium / 40 cm. |  |
| ✅ corrigé | moyen | Titre |  | Titre avec des mots anglais : « Accessoire Architect's Tools ». |  |
| ✅ corrigé | moyen | Titre |  | Titre construit « type + nom anglais » : « Accessoire Architect's Tools ». |  |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Description |  | Description très courte (137 caractères). |  |
| ✅ corrigé | moyen | Options |  | Valeurs d’option en anglais/code : Ruler / hêtre / 20 cm \| Ruler / hêtre / 30 cm \| Tape measure / blanc / 3 m \| Folding ruler / hêtre / laqué noir / 2 m \| Level / aluminium / 40 cm. |  |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ✅ corrigé | moyen | Variantes | Architect's scale / aluminium / 20 cm / 1:2 / 5 - 1:5 - 1:20 - 1:50 - 1:100 | Le libellé de l'échelle d'architecte a transformé « 1:2,5 » en « 1:2 / 5 » : le client lit une échelle 1:2 suivie d'un « 5 » isolé. Le tag dérivé reprend l'erreur. | « Échelle d'architecte — aluminium, 20 cm (1:2,5 · 1:5 · 1:20 · 1:50 · 1:100) ». |
| ◐ partiel | moyen | Variantes |  | Précision sur le constat automatique : Artek vend cinq produits séparés (Ruler, Architect's Scale, Tape Measure, Folding Ruler, Level). Les alts sont déjà en français, alors que les libellés de variantes restent en anglais (« Ruler », « Tape measure », « Level »). | Renommer l'option en « Article » et reprendre les alts : « Règle en hêtre 20 cm », « Règle en hêtre 30 cm », « Échelle d'architecte 20 cm », « Mètre ruban blanc 3 m », « Mètre pliant hêtre laqué noir 2 m », « Niveau aluminium 40 cm ». Idéalement, une fiche par outil. |
| ⬜ à faire | moyen | Photos | #2-#6 | Les photos #2 à #6 sont en 3:2 (4096×2731) et montrent des objets longs et horizontaux. Sur une carte carrée recadrée au centre, les extrémités du mètre pliant (#5) et du niveau (#6), qui occupent environ 80 à 90 % de la largeur, seront coupées (à vérifier en preview). | Fournir des versions carrées avec marge (fond blanc) pour les photos de variantes. |
| ✅ corrigé | moyen | Titre |  | Le titre « Accessoire Architect's Tools » est anglais. Le type « Accessoire » ne correspond à aucune famille du menu. | « Outils d'architecte Artek — règle, mètre, niveau ». |

#### Coussins dossier pour lit de repos 710 (Lot de 2) — `artek-day-bed-710-back-cushions`

**Brouillon.** [Fiche Mikado](https://www.mikadodeco.be/products/artek-day-bed-710-back-cushions) · [Fiche Artek](https://www.artek.fi/en/products/day-bed-710) · Coussin · 7 variantes · 0 photo · familles du site : Décoration  
Artek : Day Bed 710 — back cushions (2 pcs), accessoire du Day Bed 710 · Alvar Aalto · 1933 · Made in Finlande et Estonie · en catalogue  
Dimensions Artek : Dessin artek.fi : 203 × 92 cm, cotes de hauteur 45 et 78 (lecture : H avec matelas / H avec coussins dossier, à confirmer) ; cadre 203 × 92 × H35, matelas 200 × 90 × 12, coussins dossier 100 × 23 × 7/23 cm (2 pièces) selon scandinavia-design.fr  
Constats : 0 critique, 10 élevé, 13 moyen, 7 faible, 2 info ; 8 corrigés le 29 septembre.  
**Verdict :** Fiche en brouillon, sans photo ni coût. Le revêtement n'est choisi que par classe de prix, sans tissu ni couleur. Le type « Coussin » la placerait parmi les coussins déco.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Photos | Sans housse | Variante sans image : Sans housse (ART-DB710BC-27000703). La fiche affiche la photo générale d’une autre finition. | Associer une photo de la finition exacte à la variante. |
| ⬜ à faire | élevé | Photos | Tissu F40 | Variante sans image : Tissu F40 (ART-DB710BC-27000802-F40). La fiche affiche la photo générale d’une autre finition. | Associer une photo de la finition exacte à la variante. |
| ⬜ à faire | élevé | Photos | Tissu F60 | Variante sans image : Tissu F60 (ART-DB710BC-27000802-F60). La fiche affiche la photo générale d’une autre finition. | Associer une photo de la finition exacte à la variante. |
| ⬜ à faire | élevé | Photos | Tissu F80 | Variante sans image : Tissu F80 (ART-DB710BC-27000802-F80). La fiche affiche la photo générale d’une autre finition. | Associer une photo de la finition exacte à la variante. |
| ⬜ à faire | élevé | Photos | Tissu F100 | Variante sans image : Tissu F100 (ART-DB710BC-27000802-F100). La fiche affiche la photo générale d’une autre finition. | Associer une photo de la finition exacte à la variante. |
| ⬜ à faire | élevé | Photos | Tissu F140 | Variante sans image : Tissu F140 (ART-DB710BC-27000802-F140). La fiche affiche la photo générale d’une autre finition. | Associer une photo de la finition exacte à la variante. |
| ⬜ à faire | élevé | Photos | Tissu F200 | Variante sans image : Tissu F200 (ART-DB710BC-27000802-F200). La fiche affiche la photo générale d’une autre finition. | Associer une photo de la finition exacte à la variante. |
| ✅ corrigé | élevé | Photos |  | Aucune photo. |  |
| ☑ accepté (vente sur devis) | élevé | Variantes |  | « Tissu F40 » à « Tissu F200 » ne sont que des classes de prix : le client ne peut choisir ni le tissu ni la couleur (« confirmé à la commande »). La description annonce aussi du cuir (L40 à L60), qui n'existe dans aucune variante. Ce serait un constat critique si la fiche était publiée. | Proposer des tissus précis (ex. Kvadrat Hallingdal 65, avec couleur), ou garder la fiche hors vente. Retirer la mention du cuir, ou ajouter les variantes cuir. |
| ✅ corrigé | moyen | Statut |  | Fiche en brouillon (non vendue). Aucune photo. |  |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Prix | Sans housse | Coût d’achat absent : Sans housse (ART-DB710BC-27000703). | Renseigner le coût d’achat. |
| ⬜ à faire | moyen | Prix | Tissu F40 | Coût d’achat absent : Tissu F40 (ART-DB710BC-27000802-F40). | Renseigner le coût d’achat. |
| ⬜ à faire | moyen | Prix | Tissu F60 | Coût d’achat absent : Tissu F60 (ART-DB710BC-27000802-F60). | Renseigner le coût d’achat. |
| ⬜ à faire | moyen | Prix | Tissu F80 | Coût d’achat absent : Tissu F80 (ART-DB710BC-27000802-F80). | Renseigner le coût d’achat. |
| ⬜ à faire | moyen | Prix | Tissu F100 | Coût d’achat absent : Tissu F100 (ART-DB710BC-27000802-F100). | Renseigner le coût d’achat. |
| ⬜ à faire | moyen | Prix | Tissu F140 | Coût d’achat absent : Tissu F140 (ART-DB710BC-27000802-F140). | Renseigner le coût d’achat. |
| ⬜ à faire | moyen | Prix | Tissu F200 | Coût d’achat absent : Tissu F200 (ART-DB710BC-27000802-F200). | Renseigner le coût d’achat. |
| ⬜ à faire | moyen | Classement |  | Le type « Coussin » place ces coussins de dossier dans les collections « Décoration » et « Coussins, plaids & tapis ». Une fois publiés, ils y côtoieraient les coussins décoratifs au lieu d'être rattachés au lit de repos ou aux canapés. | Type « Élément de canapé » (collection Canapés) ou type dédié sans famille, avec un lien depuis la fiche du cadre. |
| ⬜ à faire | moyen | Métachamps |  | Précision sur NO_DIMENSIONS et NO_ORIGIN. | custom.dimensions = « 2 coussins de 100 × 23 cm, ép. 7/23 cm (à confirmer) » ; custom.origin = « Fabriqué en Finlande et en Estonie » ; custom.material = « Mousse PU, housse amovible ». |

#### Lit de repos 710 — `artek-day-bed-710-frame`

[Fiche Mikado](https://www.mikadodeco.be/products/artek-day-bed-710-frame) · [Fiche Artek](https://www.artek.fi/en/products/day-bed-710) · Lit de repos · 1 variante · 2 photos · familles du site : aucune  
Artek : Day Bed 710 · Alvar Aalto · 1933 · Made in Finlande et Estonie · en catalogue  
Dimensions Artek : Dessin artek.fi : 203 × 92 cm, cotes de hauteur 45 et 78 (lecture : H avec matelas / H avec coussins dossier, à confirmer) ; cadre 203 × 92 × H35, matelas 200 × 90 × 12, coussins dossier 100 × 23 × 7/23 cm (2 pièces) selon scandinavia-design.fr  
Constats : 2 critique, 5 élevé, 7 moyen, 7 faible, 2 info ; 11 corrigés le 29 septembre.  
**Verdict :** Fiche active qui vend le cadre seul (1 230 €) avec des photos du lit complet, matelas et coussins compris. Ces deux accessoires étant en brouillon, le client ne peut pas acheter un lit de repos utilisable.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | critique | Photos | #1 | La photo principale #1 et la photo #2 montrent le Day Bed 710 garni d'un matelas et de coussins de dossier (bleus sur #1, gris clair sur #2). La fiche ne vend que le cadre en bouleau à lattes : le client voit un canapé-lit complet et reçoit un cadre nu. | Principale : packshot du cadre seul (bouleau à lattes, sans matelas). Garder #2 comme ambiance légendée « présenté avec matelas et coussins, vendus séparément ». |
| ✅ corrigé | critique | Site |  | La description renvoie aux « fiches dédiées Mikado » pour le matelas et les coussins, mais ces deux fiches sont en brouillon (API 404, aucun canal). Le client ne peut acheter qu'un cadre à lattes inutilisable seul. | Publier le matelas et les coussins (avec photos et choix du tissu), ou vendre un ensemble cadre + matelas (+ coussins). Sinon, dépublier le cadre ou supprimer la phrase de renvoi. |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Lit de repos »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ✅ corrigé | élevé | Titre |  | Le titre « Lit de repos 710 » ne précise pas qu'il s'agit du cadre seul (le handle dit « frame »). Sur la carte produit, 1 230 € semble être le prix du lit complet. | « Lit de repos 710 — cadre seul (sans matelas) ». |
| ⬜ à faire | élevé | Métachamps |  | Précision sur NO_DIMENSIONS pour un meuble : les dimensions sont connues. | custom.dimensions = « L 203 × P 92 × H 35 cm (cadre) ; H env. 45 cm avec matelas, 78 cm avec coussins dossier (à confirmer) ». |
| ⬜ à faire | élevé | Classement |  | Précision sur NO_MENU_COLLECTION : aucune collection de famille n'accepte le type « Lit de repos » (Canapés = Canapé, Banquette, Élément de canapé, Housse de canapé), et l'API du site classe le produit en « objets ». | Ajouter « Lit de repos » à la règle de la collection Canapés (ou créer une sous-catégorie Lits de repos). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Description |  | Description très courte (194 caractères). |  |
| ⬜ à faire | moyen | Métachamps |  | Précision sur NO_ORIGIN et NO_MATERIAL. | custom.material = « Bouleau massif verni naturel » ; custom.origin = « Fabriqué en Finlande et en Estonie ». |
| ✅ corrigé | moyen | Description |  | La description est courte et garde des anglicismes (« Day Bed 710 », « collection Sofas »). Elle ne présente ni le pied en L, ni la structure à lattes, ni la transformation canapé ↔ lit. L'année 1935 citée est celle de la fondation d'Artek, pas du modèle (1933) : ce n'est pas une erreur, mais l'année du modèle manque dans le texte. | Réécrire en français : Alvar Aalto, 1933, famille du pied en L, bouleau massif, cadre à lattes, matelas et coussins en option. |
| ⬜ à faire | moyen | Variantes |  | Aucun poids d'expédition sur un meuble de plus de 2 m (weightKg = 0) : le calcul du transport est impossible. | Renseigner le poids et le volume d'expédition du cadre. |

#### Matelas pour lit de repos 710 — `artek-day-bed-710-mattress`

**Brouillon.** [Fiche Mikado](https://www.mikadodeco.be/products/artek-day-bed-710-mattress) · [Fiche Artek](https://www.artek.fi/en/products/day-bed-710) · Matelas · 7 variantes · 0 photo · familles du site : aucune  
Artek : Day Bed 710 — mattress, accessoire du Day Bed 710 · Alvar Aalto · 1933 · Made in Finlande et Estonie · en catalogue  
Dimensions Artek : Dessin artek.fi : 203 × 92 cm, cotes de hauteur 45 et 78 (lecture : H avec matelas / H avec coussins dossier, à confirmer) ; cadre 203 × 92 × H35, matelas 200 × 90 × 12, coussins dossier 100 × 23 × 7/23 cm (2 pièces) selon scandinavia-design.fr  
Constats : 0 critique, 12 élevé, 12 moyen, 7 faible, 2 info ; 9 corrigés le 29 septembre.  
**Verdict :** Fiche en brouillon, sans photo ni coût. Le tissu est impossible à choisir, le cuir est annoncé mais absent, et le type « Matelas » ne correspond à aucune famille. Or ce produit est indispensable pour que le cadre actif soit utilisable.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Matelas »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ⬜ à faire | élevé | Métachamps |  | custom.dimensions vide : aucune dimension affichée sur la fiche. | Renseigner custom.dimensions avec les cotes Artek (voir reference-artek.csv). |
| ⬜ à faire | élevé | Photos | Sans housse | Variante sans image : Sans housse (ART-DB710M-27000501). La fiche affiche la photo générale d’une autre finition. | Associer une photo de la finition exacte à la variante. |
| ⬜ à faire | élevé | Photos | Tissu F40 | Variante sans image : Tissu F40 (ART-DB710M-27000602-F40). La fiche affiche la photo générale d’une autre finition. | Associer une photo de la finition exacte à la variante. |
| ⬜ à faire | élevé | Photos | Tissu F60 | Variante sans image : Tissu F60 (ART-DB710M-27000602-F60). La fiche affiche la photo générale d’une autre finition. | Associer une photo de la finition exacte à la variante. |
| ⬜ à faire | élevé | Photos | Tissu F80 | Variante sans image : Tissu F80 (ART-DB710M-27000602-F80). La fiche affiche la photo générale d’une autre finition. | Associer une photo de la finition exacte à la variante. |
| ⬜ à faire | élevé | Photos | Tissu F100 | Variante sans image : Tissu F100 (ART-DB710M-27000602-F100). La fiche affiche la photo générale d’une autre finition. | Associer une photo de la finition exacte à la variante. |
| ⬜ à faire | élevé | Photos | Tissu F140 | Variante sans image : Tissu F140 (ART-DB710M-27000602-F140). La fiche affiche la photo générale d’une autre finition. | Associer une photo de la finition exacte à la variante. |
| ⬜ à faire | élevé | Photos | Tissu F200 | Variante sans image : Tissu F200 (ART-DB710M-27000602-F200). La fiche affiche la photo générale d’une autre finition. | Associer une photo de la finition exacte à la variante. |
| ✅ corrigé | élevé | Photos |  | Aucune photo. |  |
| ✅ corrigé | élevé | Site |  | Le cadre actif (artek-day-bed-710-frame) renvoie à cette fiche, qui est en brouillon. Sans matelas, le lit de repos vendu n'est pas utilisable. | Compléter la fiche (photos, tissus, coût) et la publier en même temps que le cadre. |
| ☑ accepté (vente sur devis) | élevé | Variantes |  | « Tissu F40 » à « F200 » sont des classes de prix, sans tissu ni couleur (« confirmé à la commande »). La description annonce aussi du cuir L40 à L60, qu'aucune variante ne propose. Ce serait un constat critique une fois la fiche publiée. | Proposer des tissus précis (ex. Kvadrat Hallingdal 65 110 ou 750, comme chez Artek), et retirer ou ajouter le cuir. |
| ✅ corrigé | moyen | Statut |  | Fiche en brouillon (non vendue). Aucune photo. |  |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.usage vide : le produit tombe dans « usage non renseigné » des filtres. | Renseigner custom.usage = Intérieur (guide Artek : usage intérieur sauf mention contraire). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Prix | Sans housse | Coût d’achat absent : Sans housse (ART-DB710M-27000501). | Renseigner le coût d’achat. |
| ⬜ à faire | moyen | Prix | Tissu F40 | Coût d’achat absent : Tissu F40 (ART-DB710M-27000602-F40). | Renseigner le coût d’achat. |
| ⬜ à faire | moyen | Prix | Tissu F60 | Coût d’achat absent : Tissu F60 (ART-DB710M-27000602-F60). | Renseigner le coût d’achat. |
| ⬜ à faire | moyen | Prix | Tissu F80 | Coût d’achat absent : Tissu F80 (ART-DB710M-27000602-F80). | Renseigner le coût d’achat. |
| ⬜ à faire | moyen | Prix | Tissu F100 | Coût d’achat absent : Tissu F100 (ART-DB710M-27000602-F100). | Renseigner le coût d’achat. |
| ⬜ à faire | moyen | Prix | Tissu F140 | Coût d’achat absent : Tissu F140 (ART-DB710M-27000602-F140). | Renseigner le coût d’achat. |
| ⬜ à faire | moyen | Prix | Tissu F200 | Coût d’achat absent : Tissu F200 (ART-DB710M-27000602-F200). | Renseigner le coût d’achat. |
| ⬜ à faire | moyen | Métachamps |  | Précision sur NO_DIMENSIONS, NO_MATERIAL et NO_ORIGIN. | custom.dimensions = « 200 × 90 × 12 cm » ; custom.material = « Mousse PU, housse amovible » ; custom.origin = « Fabriqué en Finlande et en Estonie ». |

#### Cache-pot Riihitie 21 × 16 cm — `cache-pot-riihitie-20-5-x-16-cm`

[Fiche Mikado](https://www.mikadodeco.be/products/cache-pot-riihitie-20-5-x-16-cm) · [Fiche Artek](https://www.artek.fi/en/products/riihitie-plant-pot-a ; https://www.artek.fi/en/products/riihitie-plant-pot-b) · Cache-pot · 6 variantes · 13 photos · familles du site : Décoration  
Artek : Riihitie Plant Pot A small / Riihitie Plant Pot B small · Aino Aalto · 1937 (réédition 2017) · Made in Portugal · en catalogue  
Dimensions Artek : A small : 20,5 × 16 × H12 cm ; B small : 19 × 16 × H12 cm (dessins artek.fi)  
Constats : 0 critique, 0 élevé, 8 moyen, 9 faible, 2 info ; 5 corrigés le 29 septembre.  
**Verdict :** Photos de variantes justes (forme et glaçure). En revanche, le titre « 21 × 16 cm » ne vaut que pour la forme A, et l'année, l'origine et la matière manquent.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Métachamps |  | Année 1937 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ⬜ à faire | moyen | Description |  | Description identique à cache-pot-riihitie-28-x-23-cm, cache-pot-riihitie-40-x-27-cm. | Rédiger une description propre à chaque taille/version. |
| ⬜ à faire | moyen | Photos |  | Image basse définition 642×642 (variante) : packshot-60e6094b3a5b317ecee608ef0a848be5.png. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ⬜ à faire | moyen | Titre |  | Le titre « 21 × 16 cm » arrondit la forme A (20,5 × 16) et ne correspond pas à la forme B (19 × 16), vendue sur la même fiche. Le handle dit « 20-5 », le titre « 21 ». Artek nomme les tailles « small », « medium » et « large ». | « Cache-pot Riihitie petit (formes A et B) », avec les cotes exactes dans custom.dimensions (déjà correctes). Ne pas changer le handle sans redirection. |
| ⬜ à faire | moyen | Métachamps |  | Précision sur NO_YEAR, NO_ORIGIN et NO_MATERIAL. | custom.year = 1937 ; custom.origin = « Fabriqué au Portugal » ; custom.material = « Céramique émaillée faite main » ; custom.usage = Intérieur (déjà renseigné). |

#### Cache-pot Riihitie 28 × 23 cm — `cache-pot-riihitie-28-x-23-cm`

[Fiche Mikado](https://www.mikadodeco.be/products/cache-pot-riihitie-28-x-23-cm) · [Fiche Artek](https://www.artek.fi/en/products/riihitie-plant-pot-b) · Cache-pot · 3 variantes · 6 photos · familles du site : Décoration  
Artek : Riihitie Plant Pot B medium · Aino Aalto · 1937 (réédition 2017) · Made in Portugal · en catalogue  
Dimensions Artek : 28 × 23 × H16 cm (dessin artek.fi)  
Constats : 0 critique, 0 élevé, 8 moyen, 7 faible, 2 info ; 5 corrigés le 29 septembre.  
**Verdict :** Photos, variantes et dimensions conformes à Artek. Une ambiance montre la petite taille, et l'année, l'origine et la matière manquent.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Métachamps |  | Année 1937 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ⬜ à faire | moyen | Description |  | Description identique à cache-pot-riihitie-20-5-x-16-cm, cache-pot-riihitie-40-x-27-cm. | Rédiger une description propre à chaque taille/version. |
| ⬜ à faire | moyen | Photos |  | Image basse définition 858×858 (variante) : packshot-ef433b4c47543baa2383fa6086188320.png. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ✅ corrigé | moyen | Photos | #3 | La galerie #3 montre un pot de PETITE taille : le fichier s'appelle « plant-pot-b-small-light-grey-aalto-table-97-chair-611 ». Elle est présentée comme une ambiance du modèle moyen 28 × 23 cm. | Déplacer #3 vers la fiche du petit modèle et la remplacer par une ambiance du modèle B medium. |
| ⬜ à faire | moyen | Métachamps |  | Précision sur NO_YEAR, NO_ORIGIN et NO_MATERIAL. | custom.year = 1937 ; custom.origin = « Fabriqué au Portugal » ; custom.material = « Céramique émaillée faite main ». |

#### Cache-pot Riihitie 40 × 27 cm — `cache-pot-riihitie-40-x-27-cm`

[Fiche Mikado](https://www.mikadodeco.be/products/cache-pot-riihitie-40-x-27-cm) · [Fiche Artek](https://www.artek.fi/en/products/riihitie-plant-pot-a) · Cache-pot · 3 variantes · 6 photos · familles du site : Décoration  
Artek : Riihitie Plant Pot A large · Aino Aalto · 1937 (réédition 2017) · Made in Portugal · en catalogue  
Dimensions Artek : Dessin artek.fi : 40 × 31 × H20 cm ; Finnish Design Shop : 40 × 27 × H20 cm (écart à confirmer)  
Constats : 0 critique, 0 élevé, 7 moyen, 8 faible, 2 info ; 4 corrigés le 29 septembre.  
**Verdict :** Photos et glaçures conformes. La profondeur du titre (27 cm) diffère du dessin Artek (31 cm), à confirmer ; l'année, l'origine et la matière manquent.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ⬜ à faire | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Métachamps |  | Année 1937 présente dans le SEO mais pas dans custom.year. | Reporter l’année dans custom.year après vérification. |
| ⬜ à faire | moyen | Description |  | Description identique à cache-pot-riihitie-20-5-x-16-cm, cache-pot-riihitie-28-x-23-cm. | Rédiger une description propre à chaque taille/version. |
| ⬜ à faire | moyen | Titre |  | Titre et custom.dimensions annoncent 40 × 27 × H20 cm, alors que le dessin coté d'artek.fi indique 40 / 31 / 20 cm. Finnish Design Shop donne 27 cm. La profondeur est donc à confirmer sur la fiche technique ou le colis. | Vérifier auprès d'Artek, puis corriger le titre et custom.dimensions si la profondeur est de 31 cm (le handle ne peut pas changer sans redirection). |
| ⬜ à faire | moyen | Métachamps |  | Précision sur NO_YEAR, NO_ORIGIN et NO_MATERIAL. | custom.year = 1937 ; custom.origin = « Fabriqué au Portugal » ; custom.material = « Céramique émaillée faite main ». |

#### Affiche Paimio 50 × 70 cm — `affiche-paimio-50-x-70-cm`

[Fiche Mikado](https://www.mikadodeco.be/products/affiche-paimio-50-x-70-cm) · [Fiche Artek](https://www.artek.fi/en/products/paimio-poster-greige) · Affiche · 1 variante · 1 photo · familles du site : aucune  
Artek : Paimio Poster, Greige · Greige (studio berlinois) · 2013 · Made in non précisé · en catalogue  
Dimensions Artek : 50 × 70 cm  
Constats : 0 critique, 3 élevé, 5 moyen, 6 faible, 2 info ; 7 corrigés le 29 septembre.  
**Verdict :** Affiche correcte (photo, texte, 50 × 70). Le tag alvar-aalto la place sur la page Aalto, et l'année ainsi que la matière manquent.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Affiche »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Tags |  | Tag créateur « alvar-aalto » alors que custom.designer = « Greige ». |  |
| ✅ corrigé | élevé | Tags |  | Précision : le tag « alvar-aalto » fait apparaître cette affiche sur la page créateur Alvar Aalto (/produits.html?designer=alvar-aalto filtre sur ce tag), alors qu'elle est l'œuvre de Greige. L'affiche représente un meuble d'Aalto, mais Aalto n'en est pas l'auteur. | Retirer le tag alvar-aalto. Pour relier l'affiche au meuble, utiliser un tag de sujet non rattaché à un créateur (ex. « sujet-aalto »). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ✅ corrigé | moyen | Classement |  | Précision sur NO_MENU_COLLECTION : aucune collection du menu n'inclut le type « Affiche » (la Décoration prend Cadre, Miroir, Vase… mais pas Affiche). | Ajouter « Affiche » à la règle de la collection Décoration (ou créer une sous-catégorie Affiches), pour les 9 affiches. |

#### Affiche Beehive 50 × 70 cm — `affiche-beehive-50-x-70-cm`

[Fiche Mikado](https://www.mikadodeco.be/products/affiche-beehive-50-x-70-cm) · [Fiche Artek](https://www.artek.fi/en/products/beehive-poster-greige) · Affiche · 1 variante · 1 photo · familles du site : aucune  
Artek : Beehive Poster, Greige · Greige · 2013 · Made in non précisé · en catalogue  
Dimensions Artek : 50 × 70 cm  
Constats : 0 critique, 3 élevé, 5 moyen, 7 faible, 2 info ; 8 corrigés le 29 septembre.  
**Verdict :** Affiche correcte. Le tag alvar-aalto la place sur la page Aalto, et l'année ainsi que la matière manquent.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Affiche »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Tags |  | Tag créateur « alvar-aalto » alors que custom.designer = « Greige ». |  |
| ✅ corrigé | élevé | Tags |  | Précision : le tag « alvar-aalto » fait apparaître cette affiche sur la page créateur Alvar Aalto (/produits.html?designer=alvar-aalto filtre sur ce tag), alors qu'elle est l'œuvre de Greige. L'affiche représente un meuble d'Aalto, mais Aalto n'en est pas l'auteur. | Retirer le tag alvar-aalto. Pour relier l'affiche au meuble, utiliser un tag de sujet non rattaché à un créateur (ex. « sujet-aalto »). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ✅ corrigé | moyen | Classement |  | Précision sur NO_MENU_COLLECTION : aucune collection du menu n'inclut le type « Affiche » (la Décoration prend Cadre, Miroir, Vase… mais pas Affiche). | Ajouter « Affiche » à la règle de la collection Décoration (ou créer une sous-catégorie Affiches), pour les 9 affiches. |

#### Affiche Tabouret 60 50 × 70 cm — `affiche-tabouret-60-50-x-70-cm`

[Fiche Mikado](https://www.mikadodeco.be/products/affiche-tabouret-60-50-x-70-cm) · [Fiche Artek](https://www.artek.fi/en/products/stool-60-poster-greige) · Affiche · 1 variante · 1 photo · familles du site : aucune  
Artek : Stool 60 Poster, Greige · Greige · 2013 · Made in non précisé · en catalogue  
Dimensions Artek : 50 × 70 cm  
Constats : 0 critique, 3 élevé, 5 moyen, 7 faible, 2 info ; 6 corrigés le 29 septembre.  
**Verdict :** Affiche correcte. Le tag alvar-aalto la place sur la page Aalto, et l'année ainsi que la matière manquent. Le titre accole deux nombres (« Tabouret 60 50 × 70 »).

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Affiche »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Tags |  | Tag créateur « alvar-aalto » alors que custom.designer = « Greige ». |  |
| ✅ corrigé | élevé | Tags |  | Précision : le tag « alvar-aalto » fait apparaître cette affiche sur la page créateur Alvar Aalto (/produits.html?designer=alvar-aalto filtre sur ce tag), alors qu'elle est l'œuvre de Greige. L'affiche représente un meuble d'Aalto, mais Aalto n'en est pas l'auteur. | Retirer le tag alvar-aalto. Pour relier l'affiche au meuble, utiliser un tag de sujet non rattaché à un créateur (ex. « sujet-aalto »). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ✅ corrigé | moyen | Classement |  | Précision sur NO_MENU_COLLECTION : aucune collection du menu n'inclut le type « Affiche » (la Décoration prend Cadre, Miroir, Vase… mais pas Affiche). | Ajouter « Affiche » à la règle de la collection Décoration (ou créer une sous-catégorie Affiches), pour les 9 affiches. |

#### Affiche Aalto Chronology 50 × 70 cm — `affiche-aalto-chronology-50-x-70-cm`

[Fiche Mikado](https://www.mikadodeco.be/products/affiche-aalto-chronology-50-x-70-cm) · [Fiche Artek](https://www.artek.fi/en/products/aalto-chronology-poster) · Affiche · 1 variante · 1 photo · familles du site : aucune  
Artek : Aalto Chronology Poster · non crédité par Artek · 2002 · Made in non précisé · en catalogue  
Dimensions Artek : 50 × 70 cm  
Constats : 0 critique, 1 élevé, 7 moyen, 5 faible, 1 info ; 6 corrigés le 29 septembre.  
**Verdict :** Affiche sans graphiste crédité chez Artek. Elle apparaît sur la page Alvar Aalto par son tag (et par la collection automatique « Aalto » dans le titre), alors qu'elle est un hommage à Aalto et non une création de lui.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Affiche »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Métachamps |  | Créateur seulement en tag (« alvar-aalto ») : custom.designer vide, donc aucun créateur affiché sur la fiche. | Renseigner custom.designer ou retirer le tag si le créateur est faux. |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ✅ corrigé | moyen | Tags |  | Le tag « alvar-aalto » fait apparaître l'affiche sur la page créateur Alvar Aalto. Or elle n'est pas de lui : Artek ne crédite aucun graphiste (création de 2002). Elle entre aussi dans la collection « alvar-aalto » (règle : titre contient « Aalto »). | Retirer le tag alvar-aalto. Si la collection alvar-aalto sert au site, en exclure les affiches (par exemple avec une règle TYPE ≠ Affiche). |
| ✅ corrigé | moyen | Classement |  | Précision sur NO_MENU_COLLECTION : aucune collection du menu n'inclut le type « Affiche » (la Décoration prend Cadre, Miroir, Vase… mais pas Affiche). | Ajouter « Affiche » à la règle de la collection Décoration (ou créer une sous-catégorie Affiches), pour les 9 affiches. |

#### Affiche 75 ans 100 × 140 cm — `affiche-75-ans-artek-100-x-140-cm`

[Fiche Mikado](https://www.mikadodeco.be/products/affiche-75-ans-artek-100-x-140-cm) · [Fiche Artek](https://www.artek.fi/en/products/artek-75-anniversary-poster-kustaa-saksi) · Affiche · 1 variante · 1 photo · familles du site : aucune  
Artek : Artek 75 Anniversary Poster, Kustaa Saksi · Kustaa Saksi · 2010 · Made in non précisé · en catalogue  
Dimensions Artek : 100 × 140 cm  
Constats : 0 critique, 1 élevé, 5 moyen, 5 faible, 2 info ; 4 corrigés le 29 septembre.  
**Verdict :** Fiche juste : créateur, format 100 × 140 et texte conformes à Artek. Seules manquent l'année (2010) et la matière.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Affiche »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ✅ corrigé | moyen | Classement |  | Précision sur NO_MENU_COLLECTION : aucune collection du menu n'inclut le type « Affiche » (la Décoration prend Cadre, Miroir, Vase… mais pas Affiche). | Ajouter « Affiche » à la règle de la collection Décoration (ou créer une sous-catégorie Affiches), pour les 9 affiches. |

#### Affiche 80 ans 50 × 70 cm — `affiche-80-ans-artek-50-x-70-cm`

[Fiche Mikado](https://www.mikadodeco.be/products/affiche-80-ans-artek-50-x-70-cm) · [Fiche Artek](https://shop.artek.fi/products/poster-artek-80-years) · Affiche · 1 variante · 1 photo · familles du site : aucune  
Artek : Artek 80 Anniversary Poster · TSTO · 2015 · Made in non précisé · en catalogue (shop.artek.fi ; pas de page artek.fi/en/products)  
Dimensions Artek : 50 × 70 cm  
Constats : 0 critique, 3 élevé, 7 moyen, 6 faible, 2 info ; 6 corrigés le 29 septembre.  
**Verdict :** Créateur et texte justes. Photo principale en basse définition avec des reflets blancs suspects ; le tag alvar-aalto la place sur la page Aalto.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Affiche »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Tags |  | Tag créateur « alvar-aalto » alors que custom.designer = « TSTO ». |  |
| ✅ corrigé | élevé | Tags |  | Précision : le tag « alvar-aalto » fait apparaître cette affiche sur la page créateur Alvar Aalto (/produits.html?designer=alvar-aalto filtre sur ce tag), alors qu'elle est l'œuvre de TSTO. L'affiche représente un meuble d'Aalto, mais Aalto n'en est pas l'auteur. | Retirer le tag alvar-aalto. Pour relier l'affiche au meuble, utiliser un tag de sujet non rattaché à un créateur (ex. « sujet-aalto »). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ⬜ à faire | moyen | Photos |  | Image basse définition 777×777 (variante) : packshot-16ef064f0be9f2259b60024827e674e9.png. | Remplacer par l’original haute définition (≥ 1 500 px). |
| ⬜ à faire | moyen | Photos | #1 | La principale #1 (777 px) montre des taches blanches floues sur les rayures noires : reflets ou retouche ratée (à confirmer). Le client peut croire l'affiche abîmée ou le motif autre. | Remplacer par le visuel officiel en haute définition (shop.artek.fi/products/poster-artek-80-years). |
| ✅ corrigé | moyen | Classement |  | Précision sur NO_MENU_COLLECTION : aucune collection du menu n'inclut le type « Affiche » (la Décoration prend Cadre, Miroir, Vase… mais pas Affiche). | Ajouter « Affiche » à la règle de la collection Décoration (ou créer une sous-catégorie Affiches), pour les 9 affiches. |

#### Affiche 85 ans 50 × 70 cm — `affiche-85-ans-artek-50-x-70-cm`

[Fiche Mikado](https://www.mikadodeco.be/products/affiche-85-ans-artek-50-x-70-cm) · [Fiche Artek](https://www.artek.fi/en/products/artek-85-anniversary-poster-karoliina-hellberg) · Affiche · 1 variante · 2 photos · familles du site : aucune  
Artek : Artek 85 Anniversary Poster, Karoliina Hellberg · Karoliina Hellberg · 2020 · Made in Finlande · en catalogue  
Dimensions Artek : 50 × 70 cm  
Constats : 0 critique, 3 élevé, 4 moyen, 6 faible, 2 info ; 9 corrigés le 29 septembre.  
**Verdict :** Fiche juste (créatrice, texte, packshot et ambiance encadrée). Le tag alvar-aalto la place sur la page Aalto, et l'année, l'origine et la matière manquent.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Affiche »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Tags |  | Tag créateur « alvar-aalto » alors que custom.designer = « Karoliina Hellberg ». |  |
| ✅ corrigé | élevé | Tags |  | Précision : le tag « alvar-aalto » fait apparaître cette affiche sur la page créateur Alvar Aalto (/produits.html?designer=alvar-aalto filtre sur ce tag), alors qu'elle est l'œuvre de Karoliina Hellberg. L'affiche représente un meuble d'Aalto, mais Aalto n'en est pas l'auteur. | Retirer le tag alvar-aalto. Pour relier l'affiche au meuble, utiliser un tag de sujet non rattaché à un créateur (ex. « sujet-aalto »). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Classement |  | Précision sur NO_MENU_COLLECTION : aucune collection du menu n'inclut le type « Affiche » (la Décoration prend Cadre, Miroir, Vase… mais pas Affiche). | Ajouter « Affiche » à la règle de la collection Décoration (ou créer une sous-catégorie Affiches), pour les 9 affiches. |

#### Affiche 90 ans 50 × 70 cm — `affiche-90-ans-artek-50-x-70-cm`

[Fiche Mikado](https://www.mikadodeco.be/products/affiche-90-ans-artek-50-x-70-cm) · [Fiche Artek](https://www.artek.fi/en/products/artek-90-anniversary-poster) · Affiche · 1 variante · 5 photos · familles du site : aucune  
Artek : Artek 90 Anniversary Poster · Inka Bell · 2025 · Made in non précisé · en catalogue  
Dimensions Artek : 50 × 70 cm  
Constats : 0 critique, 3 élevé, 5 moyen, 6 faible, 2 info ; 8 corrigés le 29 septembre.  
**Verdict :** Belle fiche (packshot et 4 ambiances), mais le SEO laisse croire à une sérigraphie gravée au laser alors que l'affiche est imprimée en offset. Le tag alvar-aalto la place sur la page Aalto.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Affiche »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Tags |  | Tag créateur « alvar-aalto » alors que custom.designer = « Inka Bell ». |  |
| ✅ corrigé | élevé | Tags |  | Précision : le tag « alvar-aalto » fait apparaître cette affiche sur la page créateur Alvar Aalto (/produits.html?designer=alvar-aalto filtre sur ce tag), alors qu'elle est l'œuvre de Inka Bell. L'affiche représente un meuble d'Aalto, mais Aalto n'en est pas l'auteur. | Retirer le tag alvar-aalto. Pour relier l'affiche au meuble, utiliser un tag de sujet non rattaché à un créateur (ex. « sujet-aalto »). |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ⬜ à faire | moyen | SEO |  | La méta-description annonce une « sérigraphie et gravure laser ». Or seule l'œuvre originale a été réalisée ainsi : l'affiche vendue est une impression offset. La description omet aussi cette précision. | SEO : « Affiche 90 ans d'Artek par Inka Bell — impression offset d'une œuvre inspirée du Paravent 100 ». Ajouter dans la description « imprimée en offset sur papier Scandia 200 Natural ». |
| ✅ corrigé | moyen | Classement |  | Précision sur NO_MENU_COLLECTION : aucune collection du menu n'inclut le type « Affiche » (la Décoration prend Cadre, Miroir, Vase… mais pas Affiche). | Ajouter « Affiche » à la règle de la collection Décoration (ou créer une sous-catégorie Affiches), pour les 9 affiches. |

#### Affiche Tea Trolley 900 50 × 70 cm — `affiche-tea-trolley-900-50-x-70-cm`

[Fiche Mikado](https://www.mikadodeco.be/products/affiche-tea-trolley-900-50-x-70-cm) · [Fiche Artek](https://www.artek.fi/en/products/outline-poster-tea-trolley-901-tsto) · Affiche · 1 variante · 1 photo · familles du site : aucune  
Artek : Outline Poster Tea Trolley 901, Tsto (texte Artek : « Outline Tea Trolley 900 Poster »), beige · TSTO · 2015 · Made in non précisé · en catalogue  
Dimensions Artek : 50 × 70 cm  
Constats : 0 critique, 3 élevé, 9 moyen, 4 faible, 1 info ; 11 corrigés le 29 septembre.  
**Verdict :** Photo juste (Outline beige). Le créateur TSTO, la série Outline et l'année manquent, et le tag alvar-aalto la place sur la page Aalto.

| Statut | Gravité | Domaine | Variante / photo | Constat | Correction |
| --- | --- | --- | --- | --- | --- |
| ✅ corrigé | élevé | Classement |  | Aucune catégorie du menu : le produit n'apparaît dans aucune famille ni sous-catégorie (type « Affiche »), seulement sur la page marque et en recherche. | Adapter le type ou la règle d’une sous-catégorie du menu (voir constat de marque COLLECTION_RULE_GAPS). |
| ✅ corrigé | élevé | Métachamps |  | custom.designer vide : pas de créateur sur la fiche ni de lien créateur. | Renseigner custom.designer (voir reference-artek.csv) ou laisser vide si Artek ne crédite personne. |
| ✅ corrigé | élevé | Métachamps |  | Précision sur NO_DESIGNER : l'affiche est du studio TSTO (Helsinki), série Outline, 2015. La description ne le dit pas, et seul le tag « alvar-aalto » évoque un créateur, ce qui est faux. | custom.designer = TSTO ; custom.year = 2015 ; custom.material = « Papier Munken Lynx Rough ». Ajouter le tag tsto et retirer alvar-aalto. |
| ✅ corrigé | moyen | Métachamps |  | custom.year vide : année de création absente de la fiche. | Renseigner custom.year avec l’année Artek (voir reference-artek.csv). |
| ✅ corrigé | moyen | Métachamps |  | custom.material vide : aucune matière affichée. | Renseigner custom.material (matières Artek, voir reference-artek.csv). |
| ⬜ à faire | moyen | Métachamps |  | custom.origin vide : pays de fabrication absent de la fiche. | Renseigner custom.origin et custom.country_of_origin avec le « Made in » Artek. |
| ✅ corrigé | moyen | Métachamps |  | Créateur seulement en tag (« alvar-aalto ») : custom.designer vide, donc aucun créateur affiché sur la fiche. | Renseigner custom.designer ou retirer le tag si le créateur est faux. |
| ⬜ à faire | moyen | Photos |  | Aucune photo de galerie hors variantes : la fiche n’a pas de bande de miniatures/ambiances. | Ajouter au moins une photo d’ambiance Artek non liée à une variante. |
| ✅ corrigé | moyen | Titre |  | Le titre omet la série « Outline » et la couleur beige, que seul l'alt mentionne. Artek intitule l'affiche « Tea Trolley 901 » mais écrit « Tea Trolley 900 » dans le texte : à confirmer. | « Affiche Outline Tea Trolley, beige — TSTO, 50 × 70 cm ». |
| ✅ corrigé | moyen | Description |  | La description est très courte : ni TSTO, ni la série Outline, ni la palette nordique, ni le papier. | Reprendre le texte Artek traduit (silhouette abstraite de la desserte, studio TSTO, couleur beige, papier Munken Lynx Rough). |
| ✅ corrigé | moyen | Tags |  | Le tag « alvar-aalto » fait apparaître l'affiche sur la page créateur Alvar Aalto, alors qu'elle est de TSTO. | Retirer alvar-aalto et ajouter tsto. |
| ✅ corrigé | moyen | Classement |  | Précision sur NO_MENU_COLLECTION : aucune collection du menu n'inclut le type « Affiche » (la Décoration prend Cadre, Miroir, Vase… mais pas Affiche). | Ajouter « Affiche » à la règle de la collection Décoration (ou créer une sous-catégorie Affiches), pour les 9 affiches. |
