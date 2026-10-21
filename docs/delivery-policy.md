# Délais Mikado — 22 septembre 2026

Règle demandée : 1–2 jours si la quantité physique disponible couvre toute la quantité demandée, sinon 3–4 semaines. Un envoi groupé prend le délai le plus long. Les variantes sont agrégées avant comparaison (y compris une ligne cadeau du même article). Les produits sans expédition ne prolongent pas le délai des produits physiques. Un stock inconnu n'autorise jamais le délai court.

Le serveur consulte Shopify sans cache pour les variantes du panier, à l’aperçu et à la création du checkout. Le délai est enregistré en propriété de ligne « Délai estimé », en attribut de commande du même nom et dans la note. La note ne prétend plus connaître le choix livraison/retrait avant le paiement. Le mode de réception Shopify reste la référence.

La valeur est une estimation au démarrage du checkout, pas une réservation du stock. Un checkout ancien ou modifié dans Shopify peut nécessiter une nouvelle vérification. Pour garantir une revalidation après changement au checkout ou concurrence entre acheteurs, il faudra une intégration Shopify exécutée à cette étape ; les attributs seuls ne constituent pas cette garantie.

## Réglages Shopify associés

- Dates de livraison estimées : déjà désactivées lors de l’audit.
- Retrait Mikado Deco : délai natif interne 24 h. L’interface native ne propose pas deux délais selon le stock. Ne pas prendre ce paramètre comme délai fournisseur.
- Contenu français du checkout : `Checkout delivery options / Pick up in twenty four hours` et `Store availability pick up time / Twenty four hours` remplacés par : « En stock : 1–2 jours. Sur commande : 3–4 semaines. Attendez l’e-mail “Prêt pour le retrait” avant de venir. »
- Confirmation de commande : remplacer le bloc `consolidated_estimated_delivery_time` par `notifications/delivery-estimate.liquid`, supprimer les trois affichages de `delivery_agreement.estimated_delivery_date`, conserver les noms des modes d’expédition. Le modèle utilise l’attribut du panier s’il contient une des deux valeurs attendues, sinon affiche la politique conditionnelle.
- Le changement du délai natif en « 5 jours ou plus » a été abandonné sans enregistrement car il ne traduit pas la règle demandée.

## Vérification et limites

Tester les paniers en stock, hors stock, mixtes, avec quantité supérieure au stock et lignes cadeaux. Vérifier les propriétés dans le checkout et l’aperçu de notification. Ne pas envoyer de commande de test payante ni d’e-mail client sans demande.

Le catalogue possède aussi des exceptions historiques `delai-long` sur certaines fiches ; elles n’ont pas été effacées en masse. Cette correction porte sur le panier, la transmission au checkout et la confirmation. Le délai natif interne et certaines surfaces Shopify (Shop, comptes clients, autres notifications) doivent être audités séparément avant de promettre une uniformité totale.

## Frais de livraison — 24 septembre 2026

Décision de Cyril : plus de livraison offerte, quel que soit le montant (l'ancien seuil de 1 500 € est
supprimé, articles remisés compris). Shopify applique une seule méthode, « Livraison standard », à 50 €
pour toute commande livrée en Belgique. Le panier, le tiroir et les CGV (version du 24/09/2026) l'annoncent.

Cible validée : une grille selon le poids de la commande (6,90 € jusqu'à 2 kg, 9,90 € de 2 à 10 kg,
19,90 € de 10 à 30 kg, 70 € de 30 à 70 kg, 120 € au-delà). Elle n'est pas encore activée : au
24 septembre, 2 663 produits actifs sur 4 290 (8 548 variantes) n'ont aucun poids dans Shopify,
dont 135 canapés et 518 éléments de canapé. Activer la grille avant de compléter ces poids ferait
livrer des meubles au tarif de 0 kg. L'abonnement Basic ne permet pas les tarifs calculés par un
transporteur ; la grille de poids native est la voie retenue.

## Délais par marque — 11 octobre 2026 (ADR 0015)

Le délai hors stock n'est plus uniforme : le site le résout par fiche depuis `data/lead-times.json` (délai de la marque vers Mikado observé par Cyril, plus une marge de 3–4 jours ouvrés ou d'une semaine ; marque, puis famille ou sous-catégorie) et les exceptions de la fiche (`custom.lead_time`, tag `delai-long`). Jusqu'à 15 jours ouvrés le délai s'affiche en jours ouvrés (« 5–7 jours ouvrés »), au-delà en semaines. Le défaut reste « 3–4 semaines » pour une marque sans règle. Le panier annonce le plus long des articles hors stock ; le stock Mikado reste « 1–2 jours ». Le modèle d'e-mail `notifications/delivery-estimate.liquid` affiche désormais n'importe quel libellé : à recoller dans Shopify → Notifications → Confirmation de commande. Le métachamp `custom.lead_time` d'une fiche (écrit par l'importateur) porte le **délai de la marque vers Mikado** en texte libre (« 6-10 semaines », « 10 jours ouvrés ») ; le site y ajoute 2–3 jours ouvrés de réception et d'envoi (`margin.metafieldDays`), le délai de la marque comprenant déjà la livraison jusqu'à la boutique ; en semaines, seule la borne haute peut monter d'une semaine (« 6-10 semaines » → « 6–11 semaines ») ; « sur demande » est affiché tel quel (décision de Cyril du 14/10/2026).

## Articles en stock — 12 octobre 2026

Décision de Cyril : un article en stock chez Mikado annonce **« livraison 2–3 jours »** (préparation + poste ; l'ancien « 1–2 jours » du 22 septembre est abandonné) et **« en boutique sous 24 h »** pour le retrait. La carte et la fiche disent « En stock · livraison 2–3 jours » (la fiche ajoute « en boutique sous 24 h » et l'itinéraire) ; le panier, le checkout (attribut « Délai estimé ») et l'e-mail disent « 2–3 jours ». À mettre à jour dans Shopify par Cyril : le contenu français du checkout (« En stock : 1–2 jours… ») et le modèle d'e-mail (`notifications/delivery-estimate.liquid`).

## Noël — 13 octobre 2026 (ADR 0016)

Aucune date limite globale n'est annoncée (le stock est faible, la promesse ne serait pas tenable). **Décision de Cyril du 13 octobre : le repère « Livré avant Noël » reste ÉTEINT** (`deliveryBadge: false`) tant que le stock n'est pas fiable ; la saison démarre le **19 octobre 2026**. S'il est rallumé, le repère se calcule article par article : délai haut de l'article (stock Mikado = 2–3 jours, sinon le délai de la marque, ADR 0015) plus deux jours de marge, arrivée au plus tard le 24 décembre. Il disparaît de lui-même : stock jusqu'au 19 décembre, HAY vers le 5 décembre, Vitra fin novembre ; jamais pour un « délai sur demande ». Saison du 19 octobre au 24 décembre 18 h 30 (bloc `noel` de `data/campaigns.json`) : section de l'accueil et texte de saison de la page Idées cadeaux (depuis le 20 octobre : ni message dans la barre d'annonce, ni emballage cadeau offert). Échange ou avoir en boutique jusqu'au 31 janvier pour les achats depuis le 15 novembre, sur présentation du ticket ou de la confirmation de commande, hors promotions ; la rétractation légale de 14 jours en ligne reste inchangée.

## Retrait en boutique — 17 octobre 2026 (ADR 0019)

Le point de retrait Shopify dit « prêt sous 24 heures » pour tout le magasin ; le site suit le stock. En stock : « Retrait en boutique : prêt sous 24 h ». À commander : le même délai que la livraison (« Livraison ou retrait en boutique · 6–11 semaines »). Délai sur demande : « délai confirmé après commande ». Au panier, la commande suit l'article le plus long ; le retrait est écrit dans les attributs et la note de la commande Shopify.
