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
