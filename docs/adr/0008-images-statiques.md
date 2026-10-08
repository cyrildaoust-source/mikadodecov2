# ADR 0008 — Les images du site restent servies en statique par Vercel, pas par Blob

Date : 8 octobre 2026 · Statut : accepté · Reporte le point 4.4 du plan.

## Contexte

Le dépôt porte 714 images (84 Mo) dans `v3/images`, ce qui alourdit chaque clone. Le plan proposait de les déplacer vers Vercel Blob, dont un store existe depuis le 8 octobre (index catalogue).

Deux faits pèsent :

- **Plan Hobby** : le transfert sortant de Blob est plafonné à environ 10 Go par mois, sans dépassement possible ; l'hébergement statique Vercel en offre 100 Go. Les visuels de pages (héros, familles, bandeaux de marques) représentent plusieurs Mo par visite : servir le site depuis Blob exposerait à des images cassées en fin de mois.
- **Sortir les images de git** ne suffit pas à alléger le dépôt : elles sont dans l'historique. Il faudrait une réécriture d'historique (`git lfs migrate` ou équivalent), opération qui invalide tous les clones existants, à décider explicitement par le propriétaire.

## Décision

Les images restent dans `v3/images`, servies en statique par Vercel. Blob sert à l'index catalogue (et, demain, à des fichiers produits par le site), pas au trafic des pages.

## Conséquences

- Le clone reste lourd (compensé par le clone local hors iCloud) ; le point 4.4 est reporté.
- Si le site passe au plan Pro (transfert Blob 1 To), ou si une réécriture d'historique est décidée, cet ADR est à remplacer.
