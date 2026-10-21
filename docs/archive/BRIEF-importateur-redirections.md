# Brief pour l'importateur — table des redirections des fiches produit

Date : 9 octobre 2026 · Demandeur : le site (mikadodeco.be) · Transmis par Cyril.
Contexte : plan SEO, exigence A9. Décision de Cyril du 8 octobre : les fiches remplacées redirigent (301) vers leur nouvelle fiche ou leur page marque ; les 68 fiches Assouline retirées définitivement répondent « parti pour de bon » (410).

## Ce dont le site a besoin

**Le fichier `redirections.json` au schéma `mikado.redirections@1`**, celui que produit `tools/export_redirections.py`, aujourd'hui dans `.context/remise-en-ligne-2026-10-08/` (non versionné, donc invisible depuis GitHub et depuis le Mac de Cyril).

Le site le lira tel quel, à condition que chaque entrée dise :

- `from` : **l'ancien handle** de la fiche (ce qui suit `?handle=` dans `/produit.html?handle=…`, et `/products/…` sur l'ancienne boutique), sans domaine ni chemin ;
- `to` : la **destination** quand il y en a une — soit un **handle** de fiche publié (le site construira `/produit.html?handle=<to>`), soit un **chemin** commençant par `/` (ex. `/collections/vitra`) ; absent quand `status` vaut 410 ;
- `status` : `301` (remplacée, a une destination) ou `410` (retirée définitivement, aucune destination). **Le site ne déduit rien du nom de la marque** : c'est ce champ qui décide.

Si le schéma réel diffère (noms de champs, forme de `to`), joindre un exemple de chaque cas (une 301 vers une fiche, une 301 vers une collection, une 410) : le site s'adapte au premier envoi, pas à chaque mise à jour.

## Trois garanties attendues du fichier

1. **Aucune boucle ni masquage** : aucun `from` n'est le handle d'une fiche actuellement publiée (sinon la vraie fiche serait redirigée) ; aucun `to` n'est lui-même un `from` du fichier.
2. **Destinations vivantes** : chaque `to` est un handle publié sur le canal Headless, ou une collection publiée. Le site vérifiera et ignorera (en le signalant) toute destination morte plutôt que de rediriger vers une 404.
3. **Un compteur et une date** : nombre d'entrées par statut et date de génération, dans le fichier (`generatedAt`, `counts`) ou dans le message qui l'accompagne. Au 8 octobre la session SEO relevait 11 160 entrées en 301 et 68 en 410.

## Comment le livrer, et à quel rythme

- **Première livraison** : le fichier tel qu'il existe aujourd'hui, même si le travail de remise en ligne n'est pas terminé. Le site le branche et sert les redirections dès le déploiement suivant ; chaque nouvelle version remplace la précédente.
- **Où** : au choix, le plus simple pour vous — soit le committer dans le dépôt `mikado-importer` à un chemin versionné et stable (par exemple `exports/site/redirections.json`), que le site peut lire depuis GitHub ; soit l'envoyer à Cyril en fichier.
- **Rythme** : à chaque import qui change des handles ou retire des fiches. Pas besoin de prévenir : un fichier plus récent au même endroit suffit.

## Ce que le site fera avec

- `/produit.html?handle=<from>` et `/products/<from>` : **301** vers la destination (mise en cache longue), ou **410** avec la page d'erreur habillée du site et `noindex`.
- Les fiches qui ne sont dans aucune entrée ne changent pas : une fiche publiée s'affiche, une fiche inconnue reste en 404.
- Avant mise en production : vérification sur un échantillon d'entrées de chaque statut (parité prod → Preview), et contrôle qu'aucune fiche publiée n'est touchée.

## Hors de ce brief, pour mémoire

- Les titres et descriptions SEO des fiches (`title_tag`, `description_tag`) sont lus en priorité par le site depuis le 8 octobre ; le repli « Nom — Marque | Mikado Deco » ne sert qu'aux fiches qui n'en ont pas. Si une liste des fiches sans `title_tag` est facile à produire, elle est bienvenue, sans urgence.
- Les blocs éditoriaux des pages marques (metaobjects) restent parqués : rien à encoder pour l'instant, décision de Cyril.
