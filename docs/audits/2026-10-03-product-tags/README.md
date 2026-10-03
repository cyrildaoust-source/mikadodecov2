# Audit transversal des tags produit

Mesure en lecture seule du 2026-10-03T21:10:32.828Z, sur l'Admin Shopify et la publication **Mikado Deco Headless**. Aucune fiche, aucun tag, aucun métachamp et aucune publication n'ont été modifiés.

## Périmètre

- **15 358 produits Shopify** : 4 398 actifs, 10 519 brouillons, 424 archivés et 17 non listés.
- **4 196 produits actifs publiés sur Headless**.
- **214 303 affectations de tags** et **13 606 tags exacts distincts** dans tout Shopify.
- Sur le site public : **67 686 affectations** et **5 368 tags distincts**.
- **18 105 variantes publiées** comparées aux tags, sans limite de vingt variantes par produit.

## Diagnostic principal

La syntaxe est propre : les tags publics sont déjà normalisés en minuscules et tirets, sans collisions de casse ou d'accents. Le problème n'est pas leur écriture, mais le mélange de plusieurs responsabilités dans un même champ : marque, type, designer, gamme, couleur de variante, matière, usage, promotion et traces techniques.

- **2 858 tags publics sur 5 368 (53.2 %) n'apparaissent que sur une seule fiche**. Un singleton n'est pas automatiquement mauvais, mais il ne peut pas créer une famille à lui seul.
- **3 936 fiches (93.8 %) recopient la marque dans les tags**, alors que Shopify possède déjà le fournisseur.
- **3 880 fiches (92.5 %) recopient leur type de produit**.
- **2 126 fiches (50.7 %) recopient au moins une valeur d'option ou de finition**, soit 7 782 affectations. Ces tags peuvent servir de reprise transitoire aux filtres, mais ne doivent pas établir une parenté de gamme.
- **93 tags `legacy-split-*`** sont encore présents sur 93 fiches publiées. Ce sont des identifiants techniques, pas des données éditoriales.
- **512 fiches publiques réparties sur 107 types** n'ont pas encore de rôle fonctionnel précis dans le moteur. Elles restent généralement couvertes par leur type exact ; un type isolé devient toutefois une exception.
- La médiane publique est de **14 tags par fiche**, le 95e centile de **31**, avec un maximum de **118**.

Répartition des tags publics par fréquence : singleton 2858, 2–4 fiches 1271, 5–9 fiches 507, 10–49 fiches 482, 50–199 fiches 202, 200 fiches ou plus 48.

## Dépendances à protéger

L'audit croise les tags avec **57 conditions distinctes de collections automatiques**, **261 tags du registre des créateurs**, **55 tags de gammes du registre des marques** et les tags lus directement par le site. Aucun nettoyage global ne doit précéder cette analyse.

- Collections automatiques : 35 conditions ont au moins un produit public ; 22 n'en ont actuellement aucun.
- Registre créateurs : 102 tags alimentent une page publique ; 159 correspondent seulement à des produits non publiés ou à aucune fiche.
- Registre de gammes des marques : 32 tags sont présents ; 23 sont sans produit public.

Les écarts proches ci-dessous sont des **candidats de vérification**, pas des corrections automatiques :

| Tag attendu | État | Dépendance | Tags publics proches |
| --- | --- | --- | --- |
| boelleke | absent de Shopify | registre-gamme:Fatboy:Boelleke | bolleke |
| dennis-guidone | absent de Shopify | designer:denis-guidone | denis-guidone |
| zigzag | absent de Shopify | registre-gamme:Pols Potten:Zigzag | zig-zag |
| original | seulement hors publication | registre-gamme:Fatboy:Original | originals |

## Potentiel pour les ventes associées

L'analyse détecte **243 tags candidats de gamme** : au moins deux produits, une marque dominante, présence du tag dans les titres et plusieurs types de produit. Ce filtre retire les marques, types, designers, couleurs de variante, tags génériques et traces techniques les plus évidentes. Ces candidats doivent encore être validés éditorialement avant de devenir une donnée canonique.

| Tag candidat | Marque dominante | Produits | Rôles observés | Potentiel |
| --- | --- | ---: | --- | --- |
| palissade | HAY | 47 | dining-seat, bar-seat, lounge-seat, seat, seat-accessory, dining-table, bar-table, low-table | complément direct |
| luxembourg | Fermob | 28 | dining-seat, bar-seat, lounge-seat, dining-table, bar-table, low-table, seat, seat-accessory | complément direct |
| thorvald | &Tradition | 21 | dining-seat, seat-accessory, dining-table, low-table, seat, lounge-seat | complément direct |
| ville | &Tradition | 16 | dining-seat, seat-accessory, seat, lounge-seat, dining-table | complément direct |
| 1900 | Fermob | 8 | dining-seat, seat, low-table, dining-table, seat-accessory | complément direct |
| betty | &Tradition | 15 | dining-seat, bar-seat, lounge-seat, seat-accessory | complément direct |
| bistro | Fermob | 14 | dining-seat, dining-table, bar-seat, seat-accessory | complément direct |
| 70s-ceramics | HKliving | 67 | other, dishware, drinkware, serving-accessory, candle, refillable, drink-serveware, decor-object | même famille |
| royal-velvet | HKliving | 60 | lounge-seat, seat-accessory | complément direct |
| cocoon | HKliving | 59 | lounge-seat, seat-accessory | complément direct |
| cosy | HKliving | 59 | seat-accessory, lounge-seat | complément direct |
| dallas | HKliving | 59 | seat-accessory, lounge-seat | complément direct |
| knotted | HKliving | 59 | seat-accessory, lounge-seat | complément direct |
| pure | HKliving | 59 | seat-accessory, lounge-seat | complément direct |
| sneak | HKliving | 59 | seat-accessory, lounge-seat | complément direct |
| whisper | HKliving | 59 | seat-accessory, lounge-seat | complément direct |
| corduroy-rib | HKliving | 50 | seat-accessory, lounge-seat | complément direct |
| corduroy-velvet | HKliving | 50 | seat-accessory, lounge-seat | complément direct |
| volo | Vitra | 10 | seat, dining-seat, lounge-seat, seat-accessory | complément direct |
| cosy-2 | Vitra | 13 | seat, dining-seat, seat-accessory | complément direct |
| edison | Fatboy | 12 | shade, lamp, other | complément direct |
| vp11 | &Tradition | 4 | dining-seat, serving-accessory, seat-accessory | complément direct |
| rocco | HKliving | 10 | seat-accessory, lounge-seat | complément direct |
| cuir-premium-f | Vitra | 11 | seat, seat-accessory | complément direct |
| hola | Vitra | 10 | seat, seat-accessory | complément direct |
| credo | Vitra | 7 | seat, seat-accessory | complément direct |
| dumet | Vitra | 4 | seat, seat-accessory | complément direct |
| dapple | Ferm Living | 3 | dining-seat, seat-accessory | complément direct |
| rd4 | &Tradition | 3 | dining-seat, seat-accessory | complément direct |
| rfh | &Tradition | 3 | dining-seat, seat-accessory | complément direct |
| sc110 | &Tradition | 3 | lounge-seat, seat-accessory | complément direct |
| sc111 | &Tradition | 3 | dining-seat, seat-accessory | complément direct |
| sc94 | &Tradition | 3 | dining-seat, seat-accessory | complément direct |
| sc95 | &Tradition | 3 | dining-seat, seat-accessory | complément direct |
| potence | Vitra | 3 | shade, lamp | complément direct |
| ah912 | Carl Hansen & Søn | 2 | dining-seat, seat-accessory | complément direct |
| av27 | &Tradition | 2 | dining-seat, seat-accessory | complément direct |
| av28 | &Tradition | 2 | dining-seat, seat-accessory | complément direct |
| av33 | &Tradition | 2 | dining-seat, seat-accessory | complément direct |
| av34 | &Tradition | 2 | dining-seat, seat-accessory | complément direct |

Parmi eux, les groupes mêlant assise et coussin, table et rallonge, lampe et abat-jour, bougie et bougeoir ou produit et recharge peuvent alimenter **« Complétez avec »**. Les autres servent plutôt à **« Vous aimerez aussi »**.

## Contrôle de la couverture actuelle

Entre les mesures du 30 septembre et du 3 octobre, **556 fiches sont entrées dans le canal Headless et 9 en sont sorties**. Le premier passage a trouvé **4 192/4 196 fiches couvertes** et quatre nouveaux types isolés. Leur classement générique dans les univers bar, bureau et rangement porte maintenant la couverture déterministe à **4 196/4 196 (100 %)**, sans handle ni produit codé en dur.

Les exceptions révélées puis résolues sont :

| Produit | Marque | Type | Tags disponibles |
| --- | --- | --- | --- |
| ouvre-bouteille-virgula-divina | Alessi | Ouvre-bouteille | accessoire-bar, acier-inoxydable, alessi, aperitif, art-de-l-aperitif, art-de-la-table, bar, cadeau, decapsuleur, frederic-gooris, minimaliste, ouvre-bouteille, virgula-divina |
| aimant-magnet-dots | Vitra | Aimant | aimant, bureau, dark, design-suisse, hella-jongerius, idee-cadeau, interieur, light, lot-de-5, magnet-dots, modern, petit-cadeau, rouge, tableau-magnetique, vert, vitra |
| sous-main-repad | Vitra | Sous-main | bureau, clay, dark-red, decoration, design-suisse, intemporel, interieur, jade, light-sage, modern, natural-black, repad, ronan-erwan-bouroullec, salon, sous-main, vitra |
| panier-bakkie-lace-grand-o40-h9-cm | Pols Potten | Panier | basket-bakkie-lace-l, decoration, interieur, metal, panier, pols-potten |

Les 155 tables de repas disposent toujours d'une scène complète.

## Architecture durable proposée

1. **Conserver les tags comme compatibilité**, sans leur confier seuls le sens métier.
2. Créer trois données structurées et contrôlées : `recommendation_role`, `recommendation_universe` et `range_key`. Elles ne contiennent ni prix, ni statut, ni sélection de produit.
3. Amorcer `range_key` depuis les 243 candidats de ce rapport, puis présenter un différentiel au propriétaire. Aucune écriture automatique.
4. Exclure du signal de gamme les valeurs de variantes, marques, types, promotions, styles génériques et identifiants techniques.
5. Lancer cet audit à chaque activation et quotidiennement : une fiche sans rôle ou sans voisin pertinent entre dans une file d'exception avant qu'une couverture ne soit annoncée à 100 %.
6. Invalider précisément le cache `product:<handle>` au webhook produit afin qu'une activation ou une correction soit visible sans attendre le TTL.

## Fichiers livrés

- `tags.csv` : les 13 606 tags, leurs fréquences, marques, types, rôles, dépendances et drapeaux.
- `produits.csv` : les 15 358 fiches, leur statut, le nombre de tags, les recopies de variantes et la couverture publique.
- `candidats-gammes.csv` : 243 groupes à examiner pour les ventes associées.
- `dependances-tags.csv` : collections automatiques, créateurs, gammes de marques et lectures directes du site.
- `types-produits.csv` : tous les types Shopify, leur rôle fonctionnel actuel et les classifications encore à traiter.

## Par marque — canal public

| Marque | Produits | Affectations | Tags distincts | Singletons | Médiane/fiche | Maximum |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| HKliving | 1472 | 18473 | 983 | 473 | 12 | 32 |
| Carl Hansen & Søn | 410 | 4070 | 493 | 338 | 10 | 14 |
| Vitra | 398 | 8250 | 758 | 384 | 18 | 42 |
| Pols Potten | 385 | 4303 | 737 | 476 | 7 | 35 |
| &Tradition | 260 | 5941 | 797 | 367 | 24 | 44 |
| HAY | 201 | 3804 | 396 | 132 | 17 | 33 |
| Fermob | 166 | 6135 | 380 | 132 | 42 | 49 |
| Artek | 160 | 2642 | 317 | 127 | 16 | 38 |
| Fatboy | 141 | 3224 | 616 | 338 | 25 | 40 |
| Iittala | 110 | 2227 | 240 | 78 | 19 | 28 |
| Ferm Living | 91 | 1222 | 360 | 212 | 10 | 30 |
| Moustache | 86 | 747 | 122 | 65 | 9 | 11 |
| Ichendorf Milano | 73 | 1307 | 201 | 96 | 18 | 23 |
| Pastoe | 57 | 695 | 102 | 41 | 12 | 14 |
| Volta Mobiles | 42 | 955 | 69 | 39 | 23 | 23 |
| Muuto | 28 | 822 | 182 | 65 | 27 | 42 |
| Serax | 25 | 450 | 135 | 69 | 19 | 28 |
| String Furniture | 24 | 654 | 148 | 76 | 27 | 36 |
| Stoff Nagel | 20 | 367 | 79 | 30 | 20 | 31 |
| Avolt | 11 | 256 | 53 | 1 | 24 | 25 |
| Blomus | 8 | 212 | 54 | 22 | 28 | 30 |
| Compagnie de Provence | 6 | 160 | 40 | 0 | 24 | 31 |
| Anglepoise | 5 | 100 | 56 | 34 | 19 | 25 |
| LIND DNA | 5 | 276 | 84 | 13 | 60 | 64 |
| Marimekko | 4 | 182 | 116 | 68 | 41 | 65 |
| Relaxound | 3 | 58 | 30 | 14 | 20 | 21 |
| Tiptoe | 3 | 23 | 13 | 7 | 7 | 9 |
| Alessi | 1 | 13 | 13 | 13 | 13 | 13 |
| Ester & Erik | 1 | 118 | 118 | 118 | 118 | 118 |

## Validation de l'intégration issue de l'audit

- `node --test tests/*.test.*` : 187 tests réussis.
- Les quatre exceptions contrôlées sur ordinateur, 390 px et 360 px : 12 parcours, aucune rubrique vide, aucun débordement horizontal, aucune zone tactile sous 44 px et jamais plus de quatre cartes.
- `tests/no-eyebrows.test.cjs` passe ; le détecteur ne relève aucun surtitre sur la fiche contrôlée.
- La preview locale peut journaliser le 404 attendu de Vercel Insights, absent hors environnement Vercel ; aucune erreur applicative n'a été relevée.

## Limites et sécurité

Cet audit mesure la structure et les cooccurrences ; il ne certifie pas qu'un tag matière, designer ou compatibilité est vrai par rapport au fabricant. Aucun retrait de tag ne doit être appliqué sans différentiel produit par produit, contrôle des collections et accord du propriétaire. **Aucune donnée Shopify n'a été écrite pendant cet audit.**
