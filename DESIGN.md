# Référence visuelle Mikado

L’accueil (`v3/index.html`) et les composants de `v3/styles.css` constituent la référence. Les décisions du propriétaire priment sur les exemples d’un outil externe.

## Source et portée

Le dépôt [shadcn-ui/lint](https://github.com/shadcn-ui/lint), lu le 15 septembre 2026, fournit un vérificateur de règles pour Tailwind v4. Ses contrats distinguent les changements de placement des changements d’apparence. Sa [documentation sur les limites](https://github.com/shadcn-ui/lint/blob/main/docs/how-it-works.md#what-it-cannot-see) précise que les déclarations CSS ordinaires ne sont pas analysées.

Mikado utilise Express, du HTML, des modules JavaScript et une feuille CSS commune. Aucune dépendance Tailwind/shadcn n’est ajoutée : installer ce linter ne vérifierait pas les styles actuels. Les règles ci-dessous appliquent son principe de composants communs à cette structure. Elles guident l’implémentation et la revue ; elles ne constituent pas un linter automatique du CSS.

## Contrats des composants

| Composant | Source | Ce que la page peut régler | Apparence commune à préserver |
| --- | --- | --- | --- |
| Carte produit | `productCard` dans `v3/shared.js`, `plpCardSsr` dans `server.js` | Produits, ordre, nombre et grille parente | Photo carrée au-dessus, marque, nom/variantes, disponibilité, prix, bouton en bas |
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

- Assises : quatre chaises fixes, Panton, CH24 Wishbone, Standard et Rey Chair de HAY. Aucun mélange ni roulement automatique.
- Tables : sélection explicite de quatre tables d’intérieur dans `data/family-pages.json`, intitulée « Notre sélection de tables ». Ne pas présenter une préférence éditoriale comme un classement de ventes.
- Tables outdoor : accès distinct aux modèles prévus pour l’extérieur. Les erreurs d’import restent à corriger à la source.
- Arts de la table : aucune rubrique « Icônes ». Une promesse de matière dans un titre doit correspondre à la photo et aux produits accessibles après le clic.
- Inspirations des cinq familles communes : une rangée de trois cartes compactes ; les marques suivent le catalogue.

## Vérification d’une modification

Contrôler la page réelle dans la preview sur ordinateur, priorité actuelle du propriétaire : proportions, ordre des éléments, images, liens, défilement et produits réellement affichés. Comparer les cartes modifiées à celles du catalogue. Les tests de données et de pagination ne remplacent pas cette revue visuelle. Donner le lien de preview dans la livraison.

## Dessins de dimensions

Les schémas techniques doivent se fondre dans le fond `--paper`, sans rectangle
blanc, dans la rubrique Dimensions comme dans leur agrandissement. Le composant
commun utilise une fusion multiplicative : le blanc prend la couleur du fond,
les traits et cotes noirs restent lisibles. Les proportions sont conservées.
Cette règle s'applique au rôle « dessin de dimensions », jamais aux photographies
de produits ou d'ambiance. Vérifier les contours, les cotes et le retour clavier
après fermeture de l'agrandissement. Ne pas annoncer une transparence du fichier
source : il reste intact dans Shopify.
