# ADR 0017 — Popup d'inscription à la newsletter, et inscription fiable dans Shopify

Date : 13 octobre 2026 · Statut : accepté · Demande de Cyril du 12 octobre, cahier des charges dans `mikado-marketing/chantiers/supports/popup-newsletter.md` (maquette `popup-newsletter-maquette.html`).

## Contexte

La newsletter porte le cadeau de bienvenue (code envoyé par l'automatisation Shopify Messaging). Le seul point d'entrée était le formulaire du pied de page. Par ailleurs, `/api/newsletter` répondait parfois « inscription finalisée manuellement » : l'adresse partait alors par e-mail à la boutique au lieu de créer le client Shopify, et le code de bienvenue ne partait pas.

## Décision

- **Une popup discrète**, `v3/newsletter-popup.mjs`, chargée après le reste de la page, sans bibliothèque. Ouverture après 25 secondes ou à la 2e page vue (au premier des deux), ou sur ordinateur quand la souris quitte la fenêtre vers le haut (jamais avant 10 s) ; une seule fois par visite ; jamais sur le panier, le compte, les pages légales ni les pages d'erreur ; silence 30 jours après une fermeture, pour toujours après une inscription, et pour un visiteur arrivant du mail de bienvenue (`utm_medium=email-bienvenue`). Le souvenir vit dans le navigateur (localStorage, sessionStorage) ; illisible = pas de popup. Jamais dans un navigateur automatisé (`navigator.webdriver`) ; `?newsletter=1` force l'ouverture pour la vérification. Un tiroir ouvert (panier, menu, recherche) fait attendre.
- **Affichage** : fenêtre centrée 640 × 380, photo à gauche, sur ordinateur ; panneau qui monte du bas avec la photo en bandeau de 150 px sur téléphone. Style du site, bouton `btn--blue`. Rôle `dialog`, focus dans le champ e-mail, Échap, clic à côté, retour du focus à la fermeture.
- **Réglages hors code**, `data/newsletter.json` (dans `#site-data`) : pourcentage (`offer`, vide = sans phrase du cadeau ; 5 % prévu le 01/02/2027), photo (WebP ≤ 150 Ko, chargée à l'ouverture ; l'idéal reste une photo de la boutique, verticale), délais, pages exclues.
- **Même appel que le pied de page**, `POST /api/newsletter`, avec l'origine `source: footer | popup` → tag Shopify `newsletter-footer` / `newsletter-popup`, en plus de `newsletter` et `site-web`.
- **Inscription fiable** (`lib/newsletter.js`) : chaque client Admin configuré est essayé dans l'ordre (jeton fixe, puis identifiants de l'application avec jeton de 24 h) avant le repli par e-mail ; la raison de chaque échec est journalisée (`[newsletter] … reason`). `/api/health` sonde l'application Admin (lecture `shop { name }` par mode, cachée 5 min) : `newsletter.admin = ok | down | non configurée`, visible par le contrôle de santé GitHub toutes les 15 minutes.
- **Mesure** : événement Vercel Analytics `newsletter_popup` (`vue`, `inscription`, `fermeture`), facultatif ; les tags Shopify restent la mesure de référence.

## Corrections du 13 octobre (après le test de Cyril)

- **Ouverture 5 secondes après l'arrivée** (le cahier des charges disait 25), la croix pour partir si l'on n'est pas intéressé ; après l'inscription, un simple message « Merci ! Votre code arrive par e-mail. » qui reste affiché avec sa croix (plus de fermeture automatique).
- **Charte** : coins carrés partout (le panneau bas sur téléphone n'est plus arrondi), croix carrée (plus de rond au survol ni au focus) ; sur téléphone la photo est un **recadrage paysage dédié** (`popup-mobile.webp`, 750×400, table et chaises) servi par `<picture>`, au lieu du portrait coupé en bande.

- La popup revenait après l'inscription : la sortie de la souris vers le haut la rouvrait. Une fois montrée, plus aucun déclencheur ne la rouvre pendant la visite, et une fermeture n'écrase jamais le souvenir d'une inscription.
- Une adresse **déjà abonnée** ne reçoit pas de mail de bienvenue (l'automatisation Shopify ne part que pour un nouvel accord marketing) : l'API répond `saved: already` (tags posés, accord inchangé) et le site dit « Vous êtes déjà inscrit·e » au lieu de promettre un code. Pour tester le mail, il faut une adresse qui n'est pas encore abonnée.

## Conséquences

- Les scripts navigateur du dépôt (smoke, parité, browser-check) ne voient jamais la popup (`navigator.webdriver`).
- Tests : `tests/newsletter-popup.test.mjs` (règles d'ouverture), `tests/newsletter.test.cjs` (origine, repli d'identifiants, sonde de santé).
- Reste hors code : la photo de la boutique à prendre par Cyril ; le mail de bienvenue et le code sont dans Shopify Messaging.
