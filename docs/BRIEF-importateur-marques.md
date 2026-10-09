# Brief pour l'importateur — nouvelles marques : une collection par marque

Date : 9 octobre 2026 · Demandeur : le site (mikadodeco.be) · Transmis par Cyril.
Contexte : cinq marques nouvellement publiées sont actives sur le site (elles ont des produits sur le canal Headless) mais n'ont **pas de page marque**, parce que le site ne crée pas de page `/collections/<marque>` sans collection Shopify. Leur carte sur la page Marques renvoie au catalogue filtré, et aucune bannière ni logo ne peut être posé tant que la page n'existe pas.

## Constat du site au 9 octobre

| Marque (nom fournisseur exact) | Produits publiés | Collection Shopify | Page `/collections/<slug>` |
|---|---|---|---|
| Hoptimist | 175 | aucune | 404 |
| Addison Ross | ~72 | aucune | 404 |
| Magis | ~44 | aucune | 404 |
| Softline | 1 | aucune | 404 |
| Kave Home | 1 | aucune | 404 |
| Kay Bojesen | 0 | aucune | — |

(Lecture : `/api/brands` du site liste 32 marques actives ; `/api/collections` liste 166 collections publiées, aucune à ces handles.)

## Ce dont le site a besoin

**Une collection intelligente par marque**, exactement comme celles qui existent pour Vitra, Fatboy, HAY ou Ferm Living :

- **handle** = le nom de la marque en minuscules, accents retirés, tout caractère non alphanumérique remplacé par un tiret (`ø` → `o`, `æ` → `ae`) : `hoptimist`, `addison-ross`, `magis`, `softline`, `kave-home`, `kay-bojesen`. C'est la règle de slug du site ; un handle différent ne sera pas reconnu comme page marque.
- **titre** = le nom de la marque tel qu'il apparaît dans le champ Fournisseur des produits.
- **règle** : « Fournisseur est égal à » le nom exact du fournisseur (une seule règle).
- **tri** : meilleures ventes (`BEST_SELLING`).
- **publication** : sur le canal **« Mikado Deco Headless »** (`gid://shopify/Publication/313321914697`), indispensable ; sur « Boutique en ligne » aussi si c'est l'usage pour les autres marques.

Rien d'autre : pas d'image de collection, pas de description obligatoire (le site pose sa propre bannière et son propre texte).

## Deux compléments

1. **Terminer l'import** de Softline (1 produit), Kave Home (1) et Kay Bojesen (0) avant ou après la collection, peu importe : une collection vide ne gêne pas le site, mais une page marque avec un produit fait pauvre. Me dire quand l'import de chaque marque est complet.
2. **Photos d'ambiance** (facultatif, gain de temps) : le site construit sa bannière 2:1 à partir d'une photo paysage d'au moins 2 400 px de large. Magis en a dans ses galeries produit ; Hoptimist, Softline, Kave Home et Addison Ross n'ont que des packshots. Si vous avez accès aux médiathèques de ces marques, une photo d'ambiance par marque déposée dans Shopify (Fichiers, ou en média d'un produit phare) m'évite de passer par Cyril. Sinon, Cyril la fournit.

## Ce que le site fera ensuite

Dès la collection publiée (visible dans `/api/collections` et `/collections/<slug>` en 200), le site ajoute dans la journée : le logo de la marque sur la page Marques et dans le méga-menu, la bannière de la page marque, et l'entrée de la marque dans le méga-menu si Cyril le souhaite. Aucune action de votre côté après la création.

## Au passage : les anciens handles de ces marques

La table des redirections (`exports/site/redirections.json`, branchée sur le site depuis le 9 octobre) ne contient aucune entrée pour Hoptimist, Softline et Kay Bojesen : leurs anciens handles (54) sont dans la section `a_verifier`, que Cyril tranche. Une fois les collections créées, la destination naturelle de ces anciens handles sans fiche équivalente est `/collections/<marque>` (comme `pouf-the-cover-up` → `/collections/fatboy`) : à proposer dans la prochaine version de la table, avec l'accord de Cyril.

## Comment livrer

Un message « collections créées et publiées » avec la liste des handles suffit. Le site vérifie `/api/collections` et chaque `/collections/<slug>` ; en cas d'écart (handle différent, canal manquant), je le signale avec l'URL en 404.
