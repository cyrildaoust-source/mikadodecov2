# Brief frontend — Promo Été 2026 Mikado Deco

> **Pour l'autre instance Claude qui gère le frontend de www.mikadodeco.be.**
> Ce brief contient tout ce que tu as besoin de savoir pour intégrer la promo "4ème chaise offerte" côté site internet.

## ⚙️ Stack technique

Mikado Deco est en **architecture headless** :
- Backend données : **Shopify**, accédé via **Storefront API** (GraphQL, public, lecture seule)
- Frontend : **code custom** maintenu par Cyril (framework selon ce que tu as déjà mis en place — React/Vue/Next/etc.)

→ Tu n'as donc **pas accès au thème Shopify ni à Liquid**. Toute logique d'affichage doit passer par des requêtes Storefront API et du code dans la base custom.
→ Le menu est hardcodé dans le code frontend (cf. structure plus bas), pas dans Shopify Navigation.

---

## Contexte business (en 2 lignes)

Mikado Deco lance une promo outdoor du **26 mai au 6 juin 2026** : la 4ème chaise d'extérieur est offerte (automatique, sans code). 5 marques : Fermob, HAY, Vitra, &Tradition, Fatboy.

L'objectif business est plus large que la promo : **convertir plus de visiteurs en clients**. Toute amélioration de la conversion (badge promo bien visible, mention claire au panier, page d'accueil rafraîchie, etc.) sert ce but au-delà de la promo elle-même.

## Architecture côté Shopify (déjà fait)

| Collection | Rôle | Handle | URL | Quand publier |
|------------|------|--------|-----|---------------|
| **Mobilier d'extérieur** | Vitrine permanente outdoor (590 produits) | `mobilier-exterieur` | `/collections/mobilier-exterieur` | Dès maintenant — section permanente du site |
| **Promo : 4ème chaise offerte** | Page promo dédiée (89 sièges éligibles uniquement, sert aussi de scope au BXGY) | `promo-4eme-chaise-offerte` | `/collections/promo-4eme-chaise-offerte` | Le 26 mai au matin uniquement (à dépublier après le 6 juin) |

**Tags Shopify posés sur les produits :**
- `promo-ete-2026` → sur les 590 produits outdoor (vitrine) — utilisable pour styler / filtrer
- `promo-siege-ete-2026` → sur les 89 sièges éligibles à la promo BXGY — **c'est ce tag qui détermine si une fiche doit afficher le badge "4ème chaise offerte"**

**Réduction automatique BXGY :** créée et active sur Shopify. Statut `SCHEDULED`, démarre 26/05 00:00 Bruxelles, fin 06/06 23:59. Mécanique : buy 3 from `promo-4eme-chaise-offerte`, get 1 from the same collection 100% off (cheapest item). Tout est géré côté Shopify, **pas de logique de calcul à faire côté frontend**.

## Menu actuel du site (hardcodé)

Le menu top-level actuel contient :
1. Mobilier
2. Marques
3. Mikado Studio
4. Le Journal
5. Rendez-vous
6. Panier (à part, en icône à droite probablement)

## Ce que tu dois implémenter

### 1. Menu de navigation — ajouter "Mobilier d'extérieur" (priorité ✅ critique)

**Trois options possibles selon la stratégie du site :**

**Option A — Top-level dédié (recommandé pour la saison mai-septembre)** :
Ajouter "Mobilier d'extérieur" comme **3e élément** du menu (après Mobilier et Marques) :
```js
const mainMenu = [
  { label: "Mobilier", href: "/collections/mobilier" },
  { label: "Marques", href: "/marques" },
  { label: "Mobilier d'extérieur", href: "/collections/mobilier-exterieur" }, // NEW
  { label: "Mikado Studio", href: "/mikado-studio" },
  { label: "Le Journal", href: "/journal" },
  { label: "Rendez-vous", href: "/rendez-vous" },
];
```
**Avantage** : visibilité maximale pour la saison forte outdoor (mai → septembre).
**Inconvénient** : à descendre en sous-menu en automne quand l'intérêt retombe.

**Option B — Sous-menu sous "Mobilier"** (permanent, plus discret) :
"Mobilier d'extérieur" devient un sous-menu déroulant sous "Mobilier", à côté d'autres sous-catégories (Mobilier intérieur, etc.).
**Avantage** : structure pérenne, pas à modifier saisonnièrement.
**Inconvénient** : 1 clic de plus, moins visible.

**Option C — Hybride (recommandé si tu veux les 2)** :
"Mobilier d'extérieur" à la fois en sous-menu sous "Mobilier" (permanent) **ET** en top-level dédié pendant la saison forte (mai-septembre) sous le label "Outdoor ☀️" ou simplement "Extérieur".

**Décision à prendre avec Cyril** — pour la promo de mai-juin, l'option A est la plus impactante côté conversion newsletter.

### 2. Bandeau promo sur les pages outdoor (priorité ✅ critique)

Quand l'URL contient `/collections/promo-4eme-chaise-offerte` OU `/collections/mobilier-exterieur` OU sur les fiches produit tagguées `promo-siege-ete-2026` : afficher un bandeau hero clair (au-dessus de la grille produits / au-dessus du fold) :

```
┌──────────────────────────────────────────────────────────────────┐
│   ☀️  L'ÉTÉ COMMENCE À VOTRE TABLE                                 │
│                                                                  │
│   Du 26 mai au 6 juin, achetez 3 chaises d'extérieur,            │
│   la 4ème est offerte. Automatiquement, sans code.               │
│                                                                  │
│   Fermob · HAY · Vitra · &Tradition · Fatboy                     │
│                                                                  │
│   [ Voir la sélection chaises en promo → ]                       │
└──────────────────────────────────────────────────────────────────┘
```

- Fond : beige sable `#F5EFE0` ou vert sauge clair `#E5EDE3`
- Texte sombre `#2A2A2A`
- Accent (☀️ et CTA) : ocre / terracotta `#C97D4F`
- Bouton CTA mène vers `/collections/promo-4eme-chaise-offerte`
- Si possible : grande image lifestyle de fond (table outdoor en situation)
- Mobile-friendly : titre ≥ 18px, padding 24px minimum

**Condition d'affichage temporelle** :
```js
const PROMO_START = new Date("2026-05-26T00:00:00+02:00");
const PROMO_END   = new Date("2026-06-06T23:59:59+02:00");
const isPromoActive = () => {
  const now = new Date();
  return now >= PROMO_START && now <= PROMO_END;
};
```

À retirer / cacher automatiquement après le 6 juin via cette condition.

### 3. Badge "4ème chaise offerte" sur les fiches produit éligibles (priorité ✅ critique)

Sur les fiches produit **qui ont le tag `promo-siege-ete-2026`** (89 sièges), afficher un badge à côté du prix ou en overlay sur le packshot :

```
┌─────────────────────┐
│  4ÈME CHAISE        │
│  OFFERTE  ☀️        │
└─────────────────────┘
```

Tu récupères les tags via Storefront API à la requête produit :

```graphql
query Product($handle: String!) {
  product(handle: $handle) {
    id
    title
    tags  # <-- les tags du produit
    # ... autres champs
  }
}
```

Code de condition d'affichage (framework-agnostique) :

```js
const isEligible = product.tags.includes('promo-siege-ete-2026');
const isPromoActive = () => {
  const now = new Date();
  return now >= new Date("2026-05-26T00:00:00+02:00")
      && now <= new Date("2026-06-06T23:59:59+02:00");
};

// Render
{isEligible && isPromoActive() && <PromoBadge />}
```

- Couleur : fond terracotta `#C97D4F`, texte blanc
- Position : au-dessus du prix ou en overlay haut-droit du packshot

### 4. Sur la page panier (priorité ✅ critique)

**Ne PAS afficher** de message "plus que N sièges à ajouter — la 4ème est offerte". Décision business de Cyril : un client qui prend 3 chaises et qui s'arrête là est un MEILLEUR client (meilleure marge) qu'un client qu'on pousse à en ajouter une 4ème gratuite. La promo est un hook marketing pour attirer ; on ne la "vend" pas activement dans le panier.

**Si le panier contient 4+ sièges éligibles** : Shopify a déjà appliqué la réduction (visible dans le récap natif). Pas besoin d'afficher de message additionnel — Shopify montre déjà la ligne "Réduction appliquée".

Bref : zéro logique de promo à coder côté panier. Shopify s'occupe de tout.

### 5. Page d'accueil — block teaser outdoor (priorité 🟡 moyen)

Sur la home page, un block carré ou bandeau cliquable qui pointe vers `/collections/mobilier-exterieur` avec une grande image lifestyle. Pendant la promo, ce bloc affiche également la mention "4ème chaise offerte". Sert de point d'entrée principal depuis Google.

### 6. Footer — sticky ou rappel newsletter (priorité 🟢 nice-to-have)

Capturer les visiteurs qui repartent sans acheter via un footer signup newsletter sympathique. La newsletter étant LE canal de Mikado, chaque visiteur transformé en abonné = un futur client potentiel.

---

## Données utiles (résumé)

- **Vitrine permanente** : handle `mobilier-exterieur`, URL `/collections/mobilier-exterieur`
- **Promo dédiée** : handle `promo-4eme-chaise-offerte`, URL `/collections/promo-4eme-chaise-offerte`
- **Tag vitrine** : `promo-ete-2026` (590 produits)
- **Tag BXGY** : `promo-siege-ete-2026` (89 sièges)
- **Dates actives** : 26/05/2026 00:00 → 06/06/2026 23:59 (Europe/Brussels)
- **Marques** : Fermob, HAY, Vitra, &Tradition, Fatboy

## Charte visuelle (cohérence avec newsletter + affichettes magasin)

- Fond doux : beige sable `#F5EFE0` ou vert sauge clair `#E5EDE3`
- Accent chaud : ocre / terracotta `#C97D4F`
- Vert sauge foncé pour textes secondaires : `#3B5040`
- Pas de rouge promo, pas de jaune néon — on reste élégant Mikado
- Typo : reste sur la typo du site existant

## Requêtes Storefront API utiles

### Lister les produits d'une collection (vitrine ou promo)

```graphql
query CollectionProducts($handle: String!, $first: Int = 50) {
  collection(handle: $handle) {
    id
    title
    description
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          vendor
          productType
          tags
          featuredImage { url altText }
          priceRange {
            minVariantPrice { amount currencyCode }
          }
        }
      }
    }
  }
}
```

Variables d'usage :
- Vitrine permanente : `handle = "mobilier-exterieur"`
- Promo dédiée : `handle = "promo-4eme-chaise-offerte"`

### Filtrer les produits par tag (alternative à la collection)

```graphql
query ProductsByTag($query: String!, $first: Int = 50) {
  products(first: $first, query: $query) {
    edges {
      node {
        id
        handle
        title
        tags
        # ...
      }
    }
  }
}
```

Variables : `query = "tag:promo-siege-ete-2026"` pour les 89 sièges éligibles.

### Récupérer l'article de blog Fermob (pour le lien depuis la newsletter / footer)

L'article "Comment bien choisir sa couleur Fermob" sera publié dans Shopify Admin > Articles de blog. Pour l'afficher côté site :

```graphql
query BlogArticle($blogHandle: String!, $articleHandle: String!) {
  blog(handle: $blogHandle) {
    articleByHandle(handle: $articleHandle) {
      id
      title
      handle
      excerpt
      contentHtml  # <-- le contenu HTML déjà rendu par Shopify
      seo { title description }
      publishedAt
      image { url altText }
      tags
    }
  }
}
```

Variables : `blogHandle = "conseils-et-guides"` (ou autre handle créé par Cyril dans Shopify), `articleHandle = "comment-choisir-couleur-fermob"`.

### Vérifier la réduction appliquée au panier

La réduction automatique BXGY est automatiquement appliquée par Shopify dès que le client a 4 sièges éligibles au panier. Tu la récupères dans la requête cart/checkout :

```graphql
query CartDiscounts($cartId: ID!) {
  cart(id: $cartId) {
    lines(first: 50) {
      edges {
        node {
          quantity
          discountAllocations {
            discountedAmount { amount currencyCode }
            ... on CartAutomaticDiscountAllocation {
              title
            }
          }
        }
      }
    }
    discountAllocations {
      discountedAmount { amount currencyCode }
    }
  }
}
```

→ Si `discountAllocations` contient une ligne avec title contenant "4ème chaise offerte", la promo est appliquée. **Tu n'as rien à calculer toi-même.**

---

## Ce qu'il ne faut PAS faire

- ❌ Ne pas créer un code promo type "OUTDOOR2026" — c'est une **réduction automatique**, pas de code à entrer
- ❌ Ne pas hardcoder les dates dans 10 endroits — centraliser dans une constante / variable d'environnement
- ❌ Ne pas ajouter de logique de calcul de promo côté frontend — Shopify s'occupe de toute la mécanique au niveau du panier
- ❌ Ne pas afficher le badge "4ème chaise offerte" après le 6 juin — guarder la condition de date

## Test recommandé avant lancement

1. Côté Shopify Admin, Cyril publie la collection "Mobilier d'extérieur"
2. Tu lances ta requête Storefront `collection(handle: "mobilier-exterieur")` → tu dois recevoir les produits actifs
3. Tu lances `collection(handle: "promo-4eme-chaise-offerte")` → vide tant que Cyril ne publie pas (le 26 mai au matin) ; après publication, tu dois recevoir les 89 sièges actifs
4. Tu requêtes un produit qui a le tag `promo-siege-ete-2026` → tu reçois le tag dans `product.tags`, le badge s'affiche
5. Tu ajoutes 4 chaises Bistro Fermob au panier (Storefront `cartLinesAdd`) puis tu requêtes le cart → `discountAllocations` contient bien "4ème chaise offerte" avec −100% sur l'item le moins cher

Si la promo n'apparaît pas dans le cart, c'est que :
- Soit les produits ne sont pas encore actifs (drafts dans Shopify Admin) → demander à Cyril
- Soit la date système n'est pas encore le 26 mai → la promo est SCHEDULED, elle s'active automatiquement à 00:00 Bruxelles le 26
- Soit le cart n'a pas 4 sièges éligibles → vérifier que les produits ont bien le tag `promo-siege-ete-2026`

---

## Article de blog "Comment choisir sa couleur Fermob"

Cyril a aussi rédigé un article SEO de ~2 200 mots ([../articles/fermob-comment-choisir-sa-couleur.md](../articles/fermob-comment-choisir-sa-couleur.md)) à publier sur le blog Mikado. Le flow :

1. Cyril créé un article dans Shopify Admin > Boutique en ligne > Articles de blog. Il colle le contenu HTML (converti depuis le markdown) dans l'article et renseigne le meta title / description.
2. Tu fetch l'article via Storefront API (requête plus haut) et tu l'affiches sur `/blog/comment-choisir-couleur-fermob` (ou ton routing équivalent).
3. **Important SEO** : comme tu es headless, c'est à TOI d'injecter dans le `<head>` :
   - `<title>{article.seo.title}</title>`
   - `<meta name="description" content="{article.seo.description}">`
   - `<meta property="og:image" content="{article.image.url}">`
   - Schema.org `Article` JSON-LD si possible (gros boost SEO Google)
4. Le contenu de l'article doit linker en footer vers `/collections/promo-4eme-chaise-offerte` (le bloc CTA promo en bas — déjà inclus dans le markdown).
