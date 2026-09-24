# Référence visuelle Mikado

L’accueil (`v3/index.html`) et les composants de `v3/styles.css` constituent la référence. Les décisions du propriétaire priment sur les exemples d’un outil externe.

## Source et portée

Le dépôt [shadcn-ui/lint](https://github.com/shadcn-ui/lint), lu le 15 septembre 2026, fournit un vérificateur de règles pour Tailwind v4. Ses contrats distinguent les changements de placement des changements d’apparence. Sa [documentation sur les limites](https://github.com/shadcn-ui/lint/blob/main/docs/how-it-works.md#what-it-cannot-see) précise que les déclarations CSS ordinaires ne sont pas analysées.

Mikado utilise Express, du HTML, des modules JavaScript et une feuille CSS commune. Aucune dépendance Tailwind/shadcn n’est ajoutée : installer ce linter ne vérifierait pas les styles actuels. Les règles ci-dessous appliquent son principe de composants communs à cette structure. Elles guident l’implémentation et la revue ; elles ne constituent pas un linter automatique du CSS.

## Contrats des composants

| Composant | Source | Ce que la page peut régler | Apparence commune à préserver |
| --- | --- | --- | --- |
| Carte produit | `v3/product-card.mjs`, commun au serveur et au navigateur | Produits, ordre, nombre et grille parente | Photo carrée au-dessus, marque, nom/variantes, disponibilité, prix, bouton en bas |
| Carte de catégorie | `.home-rc` / `.home-rail` dans `v3/styles.css` | Image, texte, lien et nombre de catégories | Proportions, scrim, typographie et placement du libellé identiques à l’accueil |
| Titre de section | `.serif`, `.lab`, `.fam-gridhead` | Texte et position de la section | `--serif`, graisse 600 et échelle existante `--fs-h2` |
| Bouton de sélection | `.btn.btn--outline.btn--block.pcard__cta` | Données produit | Police, bordure, espacements et position définis par la carte |
| Rangée de produits | `.fam-icon-rail` | Nombre et ordre des cartes | Aucune miniature horizontale ni déplacement des boutons dans une famille particulière |

Les pages composent les composants. Elles ne redéfinissent pas leurs éléments internes avec des sélecteurs comme `.fam .pcard__media` ou des styles inline. Si une évolution commune est souhaitée, modifier le composant à sa source puis vérifier ses autres usages.

## Typographie, palette et largeur

- Utiliser les variables existantes de `:root` : `--serif`, `--sans`, `--sans-product`, `--fs-h2`, `--fs-small`, `--fs-meta`.
- Titres et libellés de catégories : Cormorant Garamond 600. Les métadonnées et boutons gardent les styles des composants ; ne pas ajouter une nouvelle graisse locale.
- Couleurs : `--paper`, `--tile`, `--ink`, `--muted`, `--accent`, `--accent-ink`, ainsi que les couleurs fonctionnelles existantes. Ne pas inventer une couleur par page.
- Largeur : `--container`, `--gutter`, `--gap`. Les familles utilisent la largeur disponible avec les mêmes gouttières que l’accueil.
- Focus clavier visible et défilement réduit selon la préférence système. Masquer une barre de défilement ne doit pas retirer le défilement lui-même.

## Décisions éditoriales actuelles

Décision du propriétaire du 22 septembre, stock : afficher le nombre exact jusqu'à
10 pièces, puis « 10+ » au-delà, sur la fiche, les variantes et les messages de
disponibilité. Le sélecteur de quantité propose au maximum 10 pièces par ajout ;
les contrôles du panier conservent le stock réel.

- Assises : quatre chaises fixes, Panton, CH24 Wishbone, Standard et Rey Chair de HAY. Aucun mélange ni roulement automatique.
- Tables : sélection explicite de quatre tables d’intérieur dans `data/family-pages.json`, intitulée « Notre sélection de tables ». Ne pas présenter une préférence éditoriale comme un classement de ventes.
- Tables outdoor : accès distinct aux modèles prévus pour l’extérieur. Les erreurs d’import restent à corriger à la source.
- Arts de la table : aucune rubrique « Icônes ». Une promesse de matière dans un titre doit correspondre à la photo et aux produits accessibles après le clic.
- Inspirations des cinq familles communes : une rangée de trois cartes compactes ; les marques suivent le catalogue.
- Navigation des marques : depuis une famille, les cartes existantes ouvrent directement le catalogue filtré par famille ET marque. Ne pas ajouter de répertoire de marques par famille ni d’étape intermédiaire.

Décision du propriétaire du 16 septembre, après la première refonte de Mobilier : enrichir l’entrée du catalogue avec « Les icônes du design » et des sous-catégories du méga menu. La sélection globale comporte quatre modèles fixes de quatre marques : CH24 Wishbone, Flowerpot VP9, Noguchi Dining et Tabouret 60. Elle est distincte des quatre chaises d’Assises. Dix sous-catégories photographiques suivent cette sélection. Réutiliser les cartes standards ; la refonte des filtres reste une étape séparée.

Décision du propriétaire du 16 septembre, pagination : à partir de la page 2 de Mobilier, conserver un en-tête compact, le fil d’Ariane et les filtres ; masquer le bandeau photographique, les familles, les icônes et les sous-catégories. Le retour à la page 1 rétablit la découverte. La remontée automatique reste active. Dans tous les catalogues numérotés, afficher les numéros seulement lorsque le total est connu, jamais un total provisoire qui augmente au chargement.

À la demande du propriétaire d’afficher davantage de produits, le réglage retenu est de 60 produits par page pour les catalogues numérotés (auparavant 36). Les cartes gardent leurs dimensions et leurs images à chargement différé. La taille de page reste commune aux appareils pour conserver les mêmes tranches dans les liens et les retours de fiches. Les familles à bouton « Voir plus » gardent leurs lots de 24.

## Vérification d’une modification

Rectification du propriétaire du 18 septembre : les petites photos de variantes sous les cartes n’ont pas été demandées et doivent être retirées. Ne pas ajouter de sélecteur de finitions photographique aux cartes. Conserver une fiche et une carte par modèle dans le pilote Chaises. La carte choisit une finition représentative des filtres et présente son libellé, son prix exact et sa disponibilité ; toutes les variantes restent accessibles sur la fiche. Le composant commun porte cet affichage, sans déplacer le bouton de sélection ni réduire la photo principale.

Conserver la seconde photographie au survol de la grande photo. Cette vue complémentaire provient de la galerie du modèle ; elle ne change ni la finition représentative ni son prix. Exclure les photos déjà associées aux autres variantes et les doublons de la photo principale. Sans vue complémentaire admissible, conserver la photo principale.

Contrôler la page réelle dans la preview sur ordinateur, priorité actuelle du propriétaire : proportions, ordre des éléments, images, liens, défilement et produits réellement affichés. Comparer les cartes modifiées à celles du catalogue. Les tests de données et de pagination ne remplacent pas cette revue visuelle. Donner le lien de preview dans la livraison.

Décision du propriétaire du 22 septembre, Promotions : lorsqu'une remise porte
sur certaines variantes, la carte montre une finition réellement remisée avec
son libellé, sa photo, son prix exact et sa disponibilité. Le clic ouvre cette
même variante sur la fiche ; le bouton de sélection utilise aussi son identité.
Conserver les cartes et boutons communs, sans ajouter de vignettes de finitions.

Décision du propriétaire du 23 septembre : sur la carte produit, le pourcentage
de remise se place en haut à droite, sous l'éventuelle offre automatique, face
aux tags « Nouveau ». Sur la page Marques, une marque sans pays certain reste
« Europe » : ne pas indiquer un pays inexact ou plus précis que la source.

## Surtitres : interdits

Règle permanente du propriétaire (24 septembre 2026) : **aucun surtitre (« eyebrow ») sur le site**.
Un surtitre est un petit texte placé au-dessus d'un titre pour l'introduire, souvent en capitales
espacées : catégorie (« Mobilier », « Matières »), contexte (« Le journal », « Informations légales »,
« Panier »), slogan (« Notre conviction »), numéro (« 01 · Bois »), étiquette de mise en avant
(« Marque du moment », « Coup de cœur du moment »). Le titre se suffit à lui-même ; une information
utile va dans le texte qui suit (ex. « 6 min de lecture » sous le titre d'un article).

Ne sont pas des surtitres : le nom de marque d'une carte ou d'une fiche (identité et lien du
produit), les libellés de formulaire (« Coloris », « Quantité ») et les titres de listes dans les
menus ou la recherche. `tests/no-eyebrows.test.cjs` bloque les classes connues ;
`node scripts/detect-eyebrows.cjs <url>` contrôle le rendu réel d'une preview avant publication.

## Mobile

Audit du 24 septembre (360, 390, 430 et 768 px) : aucun débordement horizontal.
Sur la fiche produit mobile, l'ordre est packshot, nom, prix, finition et achat,
puis le carrousel des photos d'ambiance : le prix reste dans le premier écran.
Le nombre de coloris passe sous l'état de stock. En grille à deux colonnes, le
nombre de finitions passe sous le nom de la carte. Les commandes tactiles
(recherche, filtres, petits liens) offrent une zone d'au moins 44 px sans
changer leur apparence. Vérifier chaque évolution à 390 px puis à 360 px.

Adaptation du 24 septembre, inspirée du parcours mobile de Made in Design et
ramenée au style Mikado (papier, serif, bleu) : sur la fiche, une barre d'achat
fixe (nom, prix de la finition, « Ajouter au panier ») apparaît quand le bouton
principal sort de l'écran. Sur le pilote Chaises, un seul bouton « Filtrer et
trier » ouvre un panneau plein écran (tri en tête, filtres, « Afficher les
résultats (N) » en bas) ; un rappel flottant suit le défilement de la grille.
Sur ordinateur, la barre de filtres et la fiche restent inchangées. Mesurer les
débordements avec une fenêtre de largeur fixe : l'émulation mobile élargit la vue
au lieu de révéler un débordement.

## Dessins de dimensions

Les schémas techniques doivent se fondre dans le fond `--paper`, sans rectangle
blanc, dans la rubrique Dimensions comme dans leur agrandissement. Le composant
commun utilise une fusion multiplicative : le blanc prend la couleur du fond,
les traits et cotes noirs restent lisibles. Les proportions sont conservées.
Cette règle s'applique au rôle « dessin de dimensions », jamais aux photographies
de produits ou d'ambiance. Vérifier les contours, les cotes et le retour clavier
après fermeture de l'agrandissement. Ne pas annoncer une transparence du fichier
source : il reste intact dans Shopify.

Le pipeline principal transmet ce rôle avec le préfixe alternatif réservé
`Dessin de dimensions — `. Le site le reconnaît pour toutes les marques et utilise
le même composant Dimensions sur fond papier. Les anciens libellés libres restent
pris en charge uniquement pour les schémas AndTradition déjà revus. Une URL ou un
nom de fichier ne suffisent pas à déclarer ce rôle.
