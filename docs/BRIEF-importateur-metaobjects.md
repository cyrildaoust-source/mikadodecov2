# Brief importateur — contenu éditorial dans Shopify (metaobjects)

Date : 7 octobre 2026 · Phase 4.3 du plan d'architecture · Pour : l'importateur Shopify · De : le code du site · Référence : `docs/DATA-CONTRACT.md`.

## Pourquoi

Aujourd'hui, les biographies et photos des designers, le « coup de cœur » du méga menu et les bandeaux de marques vivent dans des fichiers JSON du dépôt. Changer une bio ou un visuel demande une PR et un déploiement, par quelqu'un qui sait éditer du JSON. Dans Shopify, Cyril les éditera lui-même, sans déploiement, et le site les lira comme il lit déjà les produits.

Le site est prêt à lire ces metaobjects par Storefront API ; tant qu'ils n'existent pas, il garde ses fichiers. Rien ne casse pendant la transition.

## Ce qui est demandé (dans l'ordre)

### 1. Metaobject `designer`

| Champ (clé) | Type | Obligatoire | Note |
|---|---|---|---|
| `slug` | texte, unique | oui | identique au slug actuel du site (`v3/designers-data.json`), ex. `verner-panton` |
| `nom` | texte | oui | |
| `biographie` | texte multiligne | non | 2 à 6 phrases, sans HTML |
| `photo` | fichier image | non | portrait 4:5, ≥ 800 px de large |
| `pays` | texte | non | |
| `annees` | texte | non | ex. « 1926–1998 » |
| `marques` | liste de références collections | non | les collections de marque du designer |
| `visible` | booléen | oui | `false` = ne pas lister (designer sans produit en ligne) |

Source : le fichier `v3/designers-data.json` (565 entrées, dont ~20 mises en avant) et `data/designer-photos.json`. Le site fournit un export CSV prêt à importer si utile.

Accès Storefront : lecture publique (`storefront: PUBLIC_READ`). Définition accessible par `metaobjects(type: "designer")`.

### 2. Metaobject `mise_en_avant` (coup de cœur du méga menu)

| Champ | Type | Note |
|---|---|---|
| `emplacement` | texte | `mobilier` ou `marques` (un enregistrement par emplacement) |
| `titre`, `accroche`, `libelle_bouton` | texte | |
| `lien` | URL | interne au site |
| `image`, `image_alt` | fichier image, texte | 3:2, ≥ 1 200 px |

Source : `v3/mega-menu-config.json`.

### 3. Metaobject `banniere_marque`

| Champ | Type | Note |
|---|---|---|
| `collection` | référence collection (marque) | une bannière par marque |
| `image` | fichier image | 3:1, ≥ 2 400 px de large (le site génère 1 280 / 1 920 / 2 400) |
| `alt`, `legende` | texte | |

Source : `data/brand-heroes.json` et `v3/images/brands/headers/`.

## Ce que fera le site ensuite

- Un service `lib/services/content.js` lit ces trois types par Storefront API (cache 30 min + cache edge), avec repli automatique sur les fichiers actuels si la lecture échoue ou si le type n'existe pas encore.
- Dès que les designers sont dans Shopify et vérifiés (nombre, slugs, photos), `v3/designers-data.json` est supprimé du dépôt. Même chemin pour les deux autres.
- Les images servies par le CDN Shopify remplacent celles du dépôt (phase 4.4 : 84 Mo d'images sortent de git).

## Ce qu'il ne faut pas faire

- Ne pas renommer les slugs : ils sont dans les URL (`/produits.html?designer=<slug>`) et dans le sitemap.
- Ne pas créer les metaobjects en « brouillon » invisible côté Storefront : le site a besoin de l'accès `PUBLIC_READ`.
- Aucune donnée produit (prix, stock, variantes) dans ces metaobjects : elle vit sur les produits.

## Pour valider

Donner au code du site : le type exact et les clés des champs créés, et un exemple de requête Storefront qui renvoie un designer. Le site adapte alors son lecteur et confirme en Preview que les pages Designers et créateur sont identiques avant/après.
