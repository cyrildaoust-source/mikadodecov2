# Brief de recherche — créateurs Mikado (30 septembre 2026)

Tu prépares, pour un lot de créateurs, (1) une biographie factuelle en français et (2) si possible un portrait officiel.
Tu ne modifies AUCUN fichier du dépôt en dehors de `.context/designers/research/` et `.context/designers/photos/`.
Tu n'écris rien dans Shopify. Pas de git.

## Outils
- `ToolSearch` avec `select:WebSearch,WebFetch` pour charger la recherche web et la lecture de pages.
- `curl -sL -A "Mozilla/5.0"` dans Bash pour lire une page ou télécharger une image (`file` et `identify`/`node` pour contrôler).
- Les produits vendus par Mikado pour chaque créateur sont listés dans le lot : sers-t'en pour savoir quelles pièces citer.

## 1. Biographie (champ `bio`)
- Français, 450 à 900 caractères, 3 à 6 phrases, ton neutre de notice. Pas de slogan, pas de superlatif publicitaire
  (« incontournable », « génie », « iconique », « intemporel », « sublime »…), pas d'adresse au lecteur, pas de tiret cadratin décoratif.
- Faits vérifiables uniquement : nationalité, dates et lieux de naissance/décès si publiés, formation, création du studio,
  collaborations avec des éditeurs, pièces principales (avec année si la source la donne), en privilégiant les pièces vendues par Mikado.
- **Sources autorisées : le site de l'éditeur (Carl Hansen & Søn, &Tradition, Moustache, Pastoe, Iittala, Artek, Muuto, Fermob, Pols Potten, Vitra…) ou le site officiel du créateur/studio.**
  Un musée ou une institution officielle (Designmuseum Danmark, Het Nieuwe Instituut, Stedelijk…) peut compléter.
  Pas de revendeur, pas de Wikipédia comme seule source, pas de blog. Un fait qui n'est que sur une source non autorisée est omis.
- Donne les URL réellement consultées dans `bioSources` (au moins une). Ne cite jamais une URL que tu n'as pas ouverte.
- Si le créateur est un duo ou un studio, présente-le comme tel (membres, année de fondation, ville).
- Si les sources sont trop minces, écris une bio plus courte (au moins 2 phrases) plutôt que d'inventer, et mets `"bioConfidence": "faible"`.

## 2. Portrait (champ `photo`)
- Un vrai portrait photographique de la personne (ou des membres du duo/studio), **publié par l'éditeur ou le créateur lui-même** :
  page designer du site de l'éditeur, espace presse / media bank de l'éditeur (préféré), site officiel du créateur.
- Interdit : revendeur (Made in Design, Finnish Design Shop, Ambientedirect, Connox, Nordicnest…), banque d'images (Getty, Alamy, Shutterstock…), Pinterest, Wikipédia/Wikimedia, presse, réseaux sociaux, image générée, dessin, photo d'un produit ou d'un atelier sans la personne.
- Qualité : largeur ≥ 600 px, idéalement ≥ 1000 px ; visage net ; cadrable en 4:5 portrait (la personne occupe une bonne partie de l'image). Prends la plus grande version disponible (paramètres de CDN type `?w=`, `width=`, `_1920x` : demande la plus grande).
- Télécharge l'original dans `.context/designers/photos/<slug>.<ext>` et vérifie avec `file` que c'est bien une image et sa taille.
  Regarde l'image (outil Read sur le fichier) pour confirmer que c'est la bonne personne et un portrait.
- Renseigne : `sourcePage` (page où l'image est publiée), `imageUrl` (URL directe téléchargée), `credit` (photographe si indiqué, sinon null), `width`, `height`, `notes`.
- Si rien de convenable n'existe dans les sources autorisées : `"photo": null` et `"photoMissingReason"` précis (ce que tu as cherché). Ne force pas.

## Sortie
Écris un fichier JSON `.context/designers/research/<lot>.json` : un tableau d'objets
```json
{
  "slug": "…", "name": "…", "sortKey": "Nom de famille (ou nom du studio)",
  "brands": ["Nom exact de la marque, tel que fourni dans le lot"],
  "bio": "…", "bioSources": ["https://…"], "bioConfidence": "bonne|faible",
  "photo": {"file": ".context/designers/photos/<slug>.jpg", "sourcePage": "https://…", "imageUrl": "https://…", "credit": null, "width": 1200, "height": 1500, "notes": "…"} ,
  "photoMissingReason": null,
  "remarks": "doutes éventuels (ex. orthographe du nom, attribution douteuse du produit)"
}
```
Garde `slug`, `name` et `brands` tels que fournis, sauf erreur manifeste que tu signales dans `remarks` (ne change pas le slug).
`sortKey` : le nom de famille pour une personne (« Wegner »), le nom complet pour un duo ou un studio (« Space Copenhagen », « Fabricius & Kastholm »).
Pour une entrée marquée « bio existante conservée », renvoie `"bio": null` et ne cherche que la photo.
Termine par un court résumé : combien de bios, combien de photos, lesquelles manquent et pourquoi.
