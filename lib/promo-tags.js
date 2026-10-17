// Balises de raison d'une réduction (contrat « Prix et promotions », décision de Cyril du 16 octobre 2026) :
// un produit est « en promotion » si et seulement s'il porte l'une d'elles ; il est éligible au code de
// bienvenue si et seulement s'il n'en porte aucune. Le prix barré ne décide plus l'appartenance : il vaut le
// prix normal sur tout le catalogue et ne s'affiche barré que s'il est strictement supérieur au prix.
const PROMO_TAGS = ['promotion', 'alignement-concurrent', 'promo-marque-alignee', 'fin-de-serie-marque'];
const isPromoTagged = tags => (tags || []).some(tag => PROMO_TAGS.includes(String(tag).toLowerCase()));
module.exports = { PROMO_TAGS, isPromoTagged };
