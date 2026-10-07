// Lectures Shopify mises en cache : produits, marques, collections, menu, promotions, recherche prédictive.
// Extrait de server.js (phase 1 du plan d'architecture, octobre 2026) — code déplacé, pas réécrit.
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('../paths');
const { brandCollectionPage } = require('../collection-brand');
const { pickBestSellers, pickNewArrivals } = require('../home-rails');
const { recommendationSearchTerm, sceneSearchQueries, selectProductRecommendations, selectRangeCollections, universeSearchQueries } = require('../product-recommendations');
const { promotionVariantCard } = require('../promotion-variants');
const { parseSearch } = require('../search-intent');
const { shopifyFetch } = require('../shopify/client');
const { mapProduct, mapProductRef } = require('../shopify/product-mapper');
const { CART_PREVIEW_MUTATION, COLLECTIONS_QUERY, COLLECTION_PRODUCTS_QUERY, MENU_QUERY, PREDICTIVE_QUERY, PRODUCTS_QUERY, PRODUCT_QUERY, PRODUCT_RECOMMENDATIONS_QUERY, SEARCH_FALLBACK_QUERY, SEARCH_QUERY, VENDORS_QUERY } = require('../shopify/queries');
const { tablePage, tableSources } = require('../table-collections');
const { getSearchPage } = require('./search');
const { cached } = require('../cache');
const { HOME_STORIES_PROMOTION, homeStoriesPromotionActive } = require('../config');
const { nav, navigationReady } = require('../render/navigation');

// Mêmes produits pour le rendu serveur et /api/home-rails (le navigateur ne change rien).
async function getHomeRails() {
  return cached('home-rails-v1', async () => {
    const [arrivals, best] = await Promise.all([
      (async () => {
        // Toute la collection (≈ 230 produits, lots de 100) : un import massif d'une marque
        // ne doit pas masquer les autres nouveautés plus anciennes de quelques jours.
        const all = [];
        let after = null;
        for (let i = 0; i < 5; i++) {
          const page = await getCollectionProducts('nouveautes', 100, after);
          all.push(...(page?.items || []));
          if (!page?.pageInfo?.hasNextPage) break;
          after = page.pageInfo.endCursor;
        }
        return { items: all };
      })().catch(() => null),
      getProductsPage(24, null, null, null, null, null),
    ]);
    const nouveautes = pickNewArrivals(arrivals?.items || []);
    return { nouveautes, best: pickBestSellers(best?.items || [], nouveautes) };
  });
}
// ─── SHOPIFY: SEARCH QUERY (page « tous les résultats » /produits.html?q=) ──
// Recherche plein-texte NATIVE Shopify (tolérante aux fautes, préfixe sur le
// dernier mot). Réutilise EXACTEMENT le fragment ProductCardFields → mapProduct
// lit les mêmes champs que pour le catalogue. `search.pageInfo.endCursor` est un
// vrai curseur Shopify → repassé tel quel en ?cursor= par le front (transparent).


// Filet de sécurité de la page ?q= : `search` (plein-texte) est parfois MOINS
// tolérant aux fautes que `predictiveSearch` (ex. transposition « fermbo » →
// « fermob » : l'overlay matche, `search` renvoie 0). Quand `search` rend une 1re
// page VIDE, on récupère par ID EXACT (nodes) les produits que l'overlay a su
// matcher → la page de résultats n'est jamais « Aucun résultat » sur une faute que
// l'overlay a corrigée (cohérence overlay ↔ page). Réutilise ProductCardFields
// → cartes complètes. (PREDICTIVE_QUERY est défini plus bas, avec la route.)


// Boutique-de-quartier delivery promise: a single, honest baseline applies
// to anything that has to be ordered from a supplier (which is most of the
// catalog). Items physically in stock at the boutique are flagged via the
// Shopify inventory and shipped fast. Anything genuinely outside this
// promise (Fermob peak season, Kriptonite, Charolles, Treku, etc.) gets a
// `delai-long` product tag in Shopify → we fall back to a generic
// "délai sur demande" line and confirm by mail/phone after the order.
// Legacy: returns up to 250 products as a flat array. Kept untouched
// because home/selection/produit pages + getBrands/getPromos all read
// this shape directly. The new paginated mode lives in getProductsPage.
async function getProducts() {
  return cached('products', async () => {
    const data = await shopifyFetch(PRODUCTS_QUERY, { first: 250, after: null, query: null });
    return data.products.edges.map(({ node }) => mapProduct(node));
  });
}
// Paginated catalog used by the PLP. Cached per (first, after, tags)
// so each "Voir plus" click is sub-5ms after the first warm-up.
// `tags` (comma-separated) becomes a Shopify GraphQL query string
// `tag:foo OR tag:bar OR ...` — used by /produits.html?designer=<slug>
// to filter on a list of historical tag variants.
// Category panel (/produits.html) — handle → Shopify query clause, hardcoded
// from chantiers/filtrage-catalogue/data/category-filters.json (36 categories,
// alphabetical). `cats` (comma-separated handles) becomes the OR of the
// clauses below — same mechanism as `tags`. Unknown handles are ignored.
// Filtres catégorie : data/category-filters.json (source unique, voir sa _note).
const CATEGORY_FILTERS = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'category-filters.json'), 'utf8')).filters;
async function getProductsPage(first, after, tags, cats, brand, q) {
  const f   = Math.max(1, Math.min(100, parseInt(first) || 50));
  const a   = after || null;
  const tagList = Array.isArray(tags)
    ? tags
    : (tags ? String(tags).split(',').map((s) => s.trim()).filter(Boolean) : []);
  const catList = Array.isArray(cats)
    ? cats
    : (cats ? String(cats).split(',').map((s) => s.trim()).filter(Boolean) : []);
  // Map category handles → their hardcoded clause; drop unknown handles.
  const catClauses = catList.map((h) => CATEGORY_FILTERS[h]).filter(Boolean);
  const sortedTags = [...tagList].sort();
  const sortedCats = catList.filter((h) => CATEGORY_FILTERS[h]).sort();
  const tagQuery = tagList.length ? tagList.map((t) => `tag:${t}`).join(' OR ') : '';
  const catQuery = catClauses.length ? catClauses.join(' OR ') : '';
  // Filtre MARQUE : slug (?brand=<slug>) → vendor exact via getActiveBrands (déjà en cache)
  // → clause vendor:"…". Rend la page marque rapide (le serveur ne renvoie QUE la marque).
  const brandSlug = brand ? String(brand).trim() : '';
  let vendorClause = '';
  if (brandSlug) {
    const match = (await getActiveBrands()).find((b) => b.slug === brandSlug);
    if (!match) return { items: [], pageInfo: { hasNextPage: false, endCursor: null } };
    vendorClause = `vendor:"${match.name.replace(/["\\]/g, '')}"`;
  }
  // tags (designer), cats (catalog panel) et vendor (marque) — indépendants ;
  // s'ils coexistent, on les intersecte (AND).
  const parts = [];
  if (tagQuery)     parts.push(`(${tagQuery})`);
  if (catQuery)     parts.push(`(${catQuery})`);
  if (vendorClause) parts.push(vendorClause);
  // ── RECHERCHE (native Shopify `search`, plein-texte, tolérante aux fautes) ──
  // Remplace l'ancien moteur maison (tokenizer/re-rank/fenêtre) : la recherche
  // native gère préfixes courts, fautes de frappe et pertinence. `after` = curseur
  // Shopify opaque (repassé par le front en ?cursor=). Cache par (terme, curseur,
  // taille de page) — chaque chunk du walk front est mémorisé séparément.
  const term = q ? String(q).replace(/["\\]/g, ' ').trim().slice(0, 120) : '';
  if (term) {
    if (brandSlug) {
      return brandCollectionPage({ first: f, after: a, brand: brandSlug, tag: term }, async (size, cursor) => ({
        collection: {}, ...await getProductsPage(size, cursor, tags, cats, null, term),
      }));
    }
    return cached(`search:${term.toLowerCase()}:${a || 'first'}:${f}`, async () => {
      const data = await shopifyFetch(SEARCH_QUERY, { q: term, first: f, after: a });
      let items = (data.search.edges || []).map(({ node }) => mapProduct(node));
      let pageInfo = data.search.pageInfo;
      // 1re page vide ? → filet predictive (cf. SEARCH_FALLBACK_QUERY) : on récupère
      // par ID exact les produits que l'overlay a su matcher (faute que `search`
      // ne corrige pas, ex. « fermbo »). Predictive n'est pas paginable → 1 page.
      if (!a && items.length === 0) {
        const ps = (await shopifyFetch(PREDICTIVE_QUERY, { q: term })).predictiveSearch;
        const ids = [...new Set((ps.products || []).map((p) => p.id).filter(Boolean))];
        if (ids.length) {
          const fb = await shopifyFetch(SEARCH_FALLBACK_QUERY, { ids });
          items = (fb.nodes || []).filter(Boolean).map((node) => mapProduct(node));
          pageInfo = { hasNextPage: false, endCursor: null };
        }
      }
      return { items, pageInfo };
    });
  }

  // ── CATALOGUE (best-selling, curseur Shopify) ─────────────────────────────
  const query = parts.length ? parts.join(' AND ') : null;
  const key = `products:page:${f}:${a || 'first'}`
            + (sortedTags.length ? ':tags-' + sortedTags.join(',') : '')
            + (sortedCats.length ? ':cats-' + sortedCats.join(',') : '')
            + (vendorClause ? ':brand-' + brandSlug : '');
  return cached(key, async () => {
    const data  = await shopifyFetch(PRODUCTS_QUERY, { first: f, after: a, query, sortKey: 'BEST_SELLING' });
    const items = data.products.edges.map(({ node }) => mapProduct(node));
    return { items, pageInfo: data.products.pageInfo };
  });
}
// ─── BRANDS: DERIVED FROM product.vendor ───────────────
// Brands are inferred from the vendor field on each product (HAY, Vitra, &Tradition…).
// To enrich a brand with metadata (country, founded, tagline, logo, website, color),
// create a Shopify Page named "brand:<vendor>" — not implemented yet, see TODO below.
async function getBrands() {
  return cached('brands', async () => {
    const products = await getProducts();
    const byVendor = new Map();
    for (const p of products) {
      const key = p.brand?.trim();
      if (!key) continue;
      const slug = key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const entry = byVendor.get(key) || {
        id:          `brand:${slug}`,
        brandKey:    key,
        name:        key,
        country:     '',
        city:        '',
        founded:     null,
        tagline:     '',
        description: '',
        website:     '',
        logo:        null,
        color:       '#d4c5b0',
        featured:    false,
        productCount: 0,
      };
      entry.productCount += 1;
      byVendor.set(key, entry);
    }
    return [...byVendor.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((b, i) => ({ ...b, order: i }));
  });
}
// ─── MARQUES DYNAMIQUES ────────────────────────────────
// Liste dérivée du vendor de TOUS les produits publiés (le Storefront ne renvoie
// que les produits publiés online). Requête LÉGÈRE (vendor seul) → contourne le
// plafond 250 de getProducts(). Une marque apparaît dès qu'elle a des produits
// publiés, disparaît sinon. Cache 30 min (le walk = ~24 requêtes légères).


async function getActiveBrands() {
  return cached('brands:active', async () => {
    const counts = new Map();
    let after = null;
    for (let guard = 0; guard < 80; guard++) {          // borne dure (80×250 = 20000 produits max)
      const data = await shopifyFetch(VENDORS_QUERY, { first: 250, after });
      for (const { node } of (data?.products?.edges || [])) {
        const v = (node.vendor || '').trim();
        if (v) counts.set(v, (counts.get(v) || 0) + 1);
      }
      if (!data?.products?.pageInfo?.hasNextPage) break;
      after = data.products.pageInfo.endCursor;
    }
    await navigationReady;
    return [...counts.entries()]
      .map(([name, productCount]) => ({
        name,
        slug: nav.navigation.navigationSlug(name),
        href: nav.navigation.brandHref(name, nav.navigationRules),
        productCount,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  }, 1_800_000);   // TTL 30 min — les marques changent rarement
}
// ─── SHOPIFY: COLLECTIONS QUERY ────────────────────────
// Real Shopify collections (product lines like Palissade, Bistro, Luxembourg…).
// Optional metafields: custom.country, custom.city, custom.founded, custom.website,
// custom.tagline, custom.color, custom.featured

function mapCollection(node, index) {
  const meta = {};
  (node.metafields || []).filter(Boolean).forEach(m => { if (m) meta[m.key] = m.value; });
  const slug = node.id.split('/').pop().toLowerCase();
  return {
    id:          node.id,
    handle:      node.handle || '',
    slug,
    key:         node.title,
    name:        node.title,
    country:     meta.country   || '',
    city:        meta.city      || '',
    founded:     meta.founded   ? parseInt(meta.founded) : null,
    tagline:     meta.tagline   || '',
    description: node.description || '',
    updatedAt:   node.updatedAt || null,
    hasProducts: node.products ? node.products.edges.length > 0 : null,
    website:     meta.website   || '',
    image:       node.image?.url || null,
    color:       meta.color     || '#d4c5b0',
    featured:    meta.featured  === 'true',
    order:       index,
  };
}
async function getCollections() {
  return cached('collections', async () => {
    const edges = [], seen = new Set();
    let after = null;
    do {
      const data = await shopifyFetch(COLLECTIONS_QUERY, { first: 250, after });
      edges.push(...data.collections.edges);
      if (!data.collections.pageInfo?.hasNextPage) break;
      after = data.collections.pageInfo.endCursor;
      if (!after || seen.has(after)) throw new Error('Curseur collections Shopify invalide');
      seen.add(after);
    } while (true);
    return edges
      .map(({ node }, i) => mapCollection(node, i))
      // Exclude Shopify's built-in "All" / "Home page" collections
      .filter(c => !['all', 'frontpage'].includes(c.handle));
  });
}
// ─── SHOPIFY: PREDICTIVE SEARCH (overlay instantané, dès la 1re lettre) ──
// searchableFields laissé PAR DÉFAUT (TITLE, PRODUCT_TYPE, VARIANT_TITLE,
// VENDOR) — ne pas le passer explicitement (sinon on écrase le set par défaut →
// vendor/product_type cassent). Pas de `types` sur products/collections (aucune
// suggestion « QUERY » côté store). Produits + collections en 1 appel.


// Les nœuds predictiveSearch.products n'ont PAS la forme de PRODUCTS_QUERY (pas
// de variants/metafields) → mapper léger dédié (ne PAS réutiliser mapProduct).
// price = priceMin = priceMax → priceLabel() n'affiche jamais « À partir de ».
function mapPredictiveProduct(n) {
  const amt = parseFloat(n.priceRange?.minVariantPrice?.amount || 0);
  return {
    handle: n.handle || '', name: n.title || '', brand: n.vendor || '',
    productType: (n.productType || '').toLowerCase(),
    image: n.featuredImage?.url || '',
    price: amt, priceMin: amt, priceMax: amt, compareAt: null,
  };
}
async function getPredictive(q) {
  // Les débuts de mots et les noms seuls gardent l'autocomplétion native légère.
  // Dès qu'une demande comporte des critères, toute la sélection est vérifiée.
  if (typeof q === 'string' && q.trim().length >= 2 && parseSearch(q).criteria.some(c=>!['text','brand'].includes(c.kind))) {
    const {items,...data}=await getSearchPage({q});
    return {...data,products:items.slice(0,8),brands:[],categories:[],resultsUrl:data.resultsUrl+'#grille'};
  }
  const term = String(q || '').replace(/["\\]/g, ' ').trim().slice(0, 80);
  if (!term) return { products: [], brands: [], categories: [] };
  return cached('predictive:' + term.toLowerCase(), async () => {
    const ps = (await shopifyFetch(PREDICTIVE_QUERY, { q: term })).predictiveSearch;
    // Une collection est une MARQUE si son handle/titre matche un vendor actif.
    // On renvoie alors l'objet MARQUE canonique {name, slug, href} de getActiveBrands
    // (pas le handle brut : le store publie p.ex. 2 collections « Fermob »
    // fermob + fermob-1) + on DÉDUPLIQUE par slug → une seule chip par marque.
    const brandsRef = await getActiveBrands();                 // [{name, slug, href, productCount}]
    const bySlug = new Map(brandsRef.map((b) => [b.slug, b]));
    const byName = new Map(brandsRef.map((b) => [b.name.toLowerCase(), b]));
    const seen = new Set();
    const brands = [], categories = [];
    for (const c of (ps.collections || [])) {
      const b = bySlug.get(c.handle) || byName.get((c.title || '').toLowerCase());
      if (b) { if (!seen.has(b.slug)) { seen.add(b.slug); brands.push({ name: b.name, slug: b.slug, href: b.href }); } }
      else   { categories.push({ handle: c.handle, name: c.title }); }
    }
    return { products: (ps.products || []).map(mapPredictiveProduct), brands, categories };
  }, 120_000);   // TTL court (2 min)
}
// ─── SHOPIFY: MAIN MENU QUERY ──────────────────────────
// Drives the site nav top-level + the Mobilier mega menu sub-items
// + the Marques dropdown. Handle "main-menu" is the default Shopify
// "Menu principal" (Online Store → Navigation). Cyril edits libellés
// / ordre / sub-items from the Shopify admin; the site picks it up
// at the next /api/menu cache refresh (5 min TTL).


// Shopify returns absolute URLs on the *primary* domain
// (shop.mikadodeco.be/...). Rewrite to bare paths so the front
// uses them directly and the JSON works on any environment.
function rewriteMenuUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    return u.pathname + u.search + u.hash;
  } catch { return url; }
}
function mapMenuItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((it) => ({
    title: it.title || '',
    url:   rewriteMenuUrl(it.url),
    items: mapMenuItems(it.items),
  }));
}
// Le menu Shopify reste la source de l'ordre ; le registre du site ajoute à chaque
// famille les sous-catégories qui n'y figurent pas encore (ex. Poufs sous Assises).
function completeMenu(items, nav) {
  const handleOf = url => String(url || '').match(/^\/collections\/([a-z0-9-]+)$/)?.[1];
  return items.map(item => {
    const family = handleOf(item.url);
    const children = item.items || [];
    const present = new Set(children.map(child => handleOf(child.url)));
    const missing = family && nav.collections[family]?.kind === 'family'
      ? Object.entries(nav.collections).filter(([handle, entry]) => entry.kind === 'subcategory' && entry.parent === family && !present.has(handle))
        .map(([handle, entry]) => ({ title: entry.label, url: '/collections/' + handle, items: [] }))
      : [];
    return { ...item, items: completeMenu([...children, ...missing], nav) };
  });
}
async function getMenu() {
  return cached('menu', async () => {
    const data = await shopifyFetch(MENU_QUERY);
    await navigationReady;
    const items = completeMenu(mapMenuItems(data?.menu?.items || []), nav.navigationRules);
    return { ok: true, items };
  });
}
// ─── SHOPIFY: COLLECTION PRODUCTS QUERY ────────────────
// Drives /collections/<handle> pages. We query Shopify directly by
// handle so the products are pre-filtered server-side — the V1 bug
// (PLP grid empty on most collections) came from client-side filtering
// a too-small 250-product window.


async function getCollectionChunk(handle, first, after, tag) {
  const f   = Math.max(1, Math.min(100, parseInt(first) || 50));
  const a   = after || null;
  const t   = (tag || '').trim() || null;
  const key = `collection:${handle}:${t ? `tag-${t}:` : ''}${f}:${a || 'first'}`;
  return cached(key, async () => {
    // Shopify's ProductFilter list — empty = no filter, [{ tag }] =
    // server-side tag filtering. Caching by tag prevents the V2 issue
    // where "Voir plus" on a tag had to scroll past unrelated products.
    const filters = t ? [{ tag: t }] : [];
    const data = await shopifyFetch(COLLECTION_PRODUCTS_QUERY, { handle, first: f, after: a, filters });
    const c = data.collection;
    if (!c) return null;
    const items = c.products.edges.map(({ node }) => mapProduct(node));
    return {
      collection: {
        handle,
        title:       c.title || '',
        description: c.description || '',
        image:       c.image?.url || null,
      },
      items,
      edges: c.products.edges.map((edge, index) => ({ cursor: edge.cursor, product: items[index] })),
      pageInfo: c.products.pageInfo,
    };
  });
}
async function getCollectionProducts(handle, first, after, tag) {
  if (tableSources(handle)) {
    const limit = Math.max(1, Math.min(100, parseInt(first) || 50));
    return cached(`table-scope-v1:${handle}:${limit}:${after || ''}:${tag || ''}`, () =>
      tablePage({ handle, first: limit, after }, (source, size, cursor) => getCollectionChunk(source, size, cursor, tag)));
  }
  const chunk = await getCollectionChunk(handle, first, after, tag);
  if (!chunk) return null;
  const { edges, ...payload } = chunk;
  return payload;
}
// ─── SHOPIFY: SINGLE PRODUCT BY HANDLE ─────────────────
// Used by the PDP at /produit?handle=<h>. Before this endpoint the
// PDP could only render products from /api/products (capped at 250)
// — anything beyond the cap rendered "introuvable". This query goes
// straight to Shopify by handle, so the catalog cap no longer gates
// individual product pages.


async function getProductByHandle(handle) {
  const h = String(handle || '').trim();
  if (!h) return null;
  return cached(`product:${h}`, async () => {
    const data = await shopifyFetch(PRODUCT_QUERY, { handle: h });
    const node = data.product;
    if (!node) return null;
    const product = mapProduct(node, { full: true });
    const toCards = nodes => (nodes || []).map(mapProductRef).filter(Boolean);
    const curatedComplementary = toCards(node.complementary?.references?.nodes);
    const curatedRelated = toCards(node.related?.references?.nodes);
    const recommendationProduct = {
      ...product,
      collectionRefs: (node.collections?.edges || []).map(edge => edge?.node).filter(Boolean),
    };
    let candidates = {};
    try {
      const ranges = selectRangeCollections(recommendationProduct);
      const sceneQueries = sceneSearchQueries(recommendationProduct);
      const universeQueries = universeSearchQueries(recommendationProduct);
      const recos = await shopifyFetch(PRODUCT_RECOMMENDATIONS_QUERY, {
        id: node.id,
        query: recommendationSearchTerm(recommendationProduct) || '__mikado_aucune_gamme__',
        collectionIds: ranges.map(collection => collection.id),
        sameTypeQuery: universeQueries.sameType,
        sameUniverseQuery: universeQueries.sameUniverse,
        ...sceneQueries,
      });
      candidates = {
        automaticComplementary: toCards(recos.complementary),
        automaticRelated: toCards(recos.related),
        range: (recos.rangeCollections || []).flatMap(collection =>
          toCards(collection?.products?.nodes).map(card => ({
            ...card,
            recommendationCollectionIds: [collection.id],
          }))),
        searched: toCards(recos.search?.nodes),
        universe: toCards([...(recos.sameType?.nodes || []), ...(recos.sameUniverse?.nodes || [])]),
        scene: {
          seating: toCards(recos.sceneSeating?.nodes),
          dishware: toCards(recos.sceneDishware?.nodes),
          drinkware: toCards(recos.sceneDrinkware?.nodes),
          textiles: toCards(recos.sceneTextiles?.nodes),
          lighting: toCards(recos.sceneLighting?.nodes),
        },
      };
    } catch (error) {
      // La fiche et les choix manuels restent disponibles si le moteur de repli
      // Shopify est momentanément indisponible ou non pris en charge.
      console.warn('[product-recommendations]', h, error.message);
    }
    ({ complementary: product.complementary, related: product.related } = selectProductRecommendations({
      product: recommendationProduct,
      curatedComplementary,
      curatedRelated,
      ...candidates,
    }));
    return product;
  });
}
// ─── API: GET COLLECTION PRODUCTS ──────────────────────
// GET /api/collection/:handle/products?cursor=...&limit=50&tag=<tag>
// Returns { collection: { title, description, image }, items, pageInfo }
// `tag` is an optional Shopify ProductFilter — when present, only
// products carrying that tag are returned (paginated server-side).
// 404 when the handle does not exist in Shopify.
// Page « Promotions » vivante : fusionne la collection Shopify « promotions »
// (curation manuelle, prioritaire) avec les produits portant une remise
// automatique ACTIVE (sonde getPromos). Chaque produit est estampillé du handle
// « promotions » (le PLP re-filtre par p.collections côté client). Pagination :
// la fusion ne concerne que la 1re page (les offres actives sont peu nombreuses).
async function getPromotionsProducts(first, after) {
  const base = await getCollectionProducts('promotions', first, after);
  const stamp = (p) => ({ ...promotionVariantCard(p), collections: [...new Set([...(p.collections || []), 'promotions'])] });
  if (after) return base && { ...base, items: base.items.map(stamp) };
  let promoItems = [];
  let campaignItems = [];
  try {
    // Sonde bornée : à froid elle peut prendre ~10 s (un panier-test par
    // variante) — on sert la page vite et on la laisse finir en arrière-plan.
    const promosBounded = Promise.race([getPromos(), new Promise((r) => setTimeout(r, 2500, null))]);
    const [promos, products] = await Promise.all([promosBounded, getProducts()]);
    if (promos) promoItems = products.filter((p) => p.variantId && promos[p.variantId]);
    else console.warn('[promotions-page] sonde froide — page servie sans fusion (cache en chauffe)');
  } catch (e) { console.warn('[promotions-page]', e.message); }
  if (homeStoriesPromotionActive()) {
    try {
      campaignItems = ((await getCollectionProducts(HOME_STORIES_PROMOTION.handle, 100)) || {}).items || [];
    } catch (e) { console.warn('[promotions-page] Home Stories:', e.message); }
  }
  const items = (base?.items || []).map(stamp);
  const seen = new Set(items.map((p) => p.id));
  for (const p of [...promoItems, ...campaignItems]) if (!seen.has(p.id)) { seen.add(p.id); items.push(stamp(p)); }
  return {
    collection: base?.collection || { handle: 'promotions', title: 'Promotions', description: '', image: null },
    items,
    pageInfo: (base?.items || []).length ? base.pageInfo : { hasNextPage: false, endCursor: null },
  };
}
const collectionProductsFor = (handle, first, after, tag, brand) => {
  const fetchPage = (size, cursor, source = handle) => source === 'promotions'
    ? getPromotionsProducts(size, cursor) : getCollectionProducts(source, size, cursor, tag);
  const slug = typeof brand === 'string' ? brand.trim().toLowerCase() : '';
  return slug ? brandCollectionPage({ handle, first, after, brand: slug, tag: tag || '' }, fetchPage) : fetchPage(first, after);
};
// ─── SHOPIFY: CART CREATE MUTATION ─────────────────────


// ─── SHOPIFY: CART PREVIEW (totals + discount allocations) ─────────
// Same shape as CartCreate, but we ask for cost + discountAllocations so
// the front-end can show Shopify's actual price after automatic discounts
// (e.g. "Buy 5 get 1 free") before the customer hits checkout.


// ─── PROMO DISCOVERY ────────────────────────────────────
// Probes each variant with a "test cart" of qty=100 to surface any Shopify
// automatic discount that applies. Used by /api/promos to drive the red
// promo badge on product cards and on the PDP.
async function fetchPromoForVariant(variantId) {
  try {
    const data = await shopifyFetch(CART_PREVIEW_MUTATION, {
      lines: [{ merchandiseId: variantId, quantity: 100 }],
    });
    const cart = data.cartCreate?.cart;
    if (!cart) return null;
    const titleOf = (d) => d.title || d.code;
    const cartLevel = (cart.discountAllocations || []).map(titleOf);
    const lineLevel = (cart.lines?.edges || []).flatMap((e) =>
      (e.node.discountAllocations || []).map(titleOf)
    );
    return [...cartLevel, ...lineLevel].find(Boolean) || null;
  } catch (e) {
    console.warn('[promo] probe failed for', variantId, e.message);
    return null;
  }
}
// Parallel probe with bounded concurrency. ~12 in-flight requests is well
// under Shopify's Storefront rate limit and finishes a 200-product probe in
// roughly 2-4 seconds on cold cache. Result cached as 'promos' (5 min TTL).
async function getPromos() {
  return cached('promos', async () => {
    const products = await getProducts();
    // La sonde couvre le top ~250 (getProducts) — un produit remisé hors de ce
    // cap n'aurait JAMAIS de badge (constaté 02/09 : les −10 % Junior/Classic/
    // Amoebe/Visiona). On sonde donc AUSSI la collection « promotions »
    // (curation par tag neutre offre-en-cours) : y taguer un produit lui donne
    // badge + place dans l'onglet, même hors meilleures ventes.
    let curated = [];
    try { curated = ((await getCollectionProducts('promotions', 100)) || {}).items || []; }
    catch (e) { /* collection absente → sonde standard seule */ }
    let campaign = [];
    if (homeStoriesPromotionActive()) {
      try { campaign = ((await getCollectionProducts(HOME_STORIES_PROMOTION.handle, 100)) || {}).items || []; }
      catch (e) { /* campagne indisponible → sonde standard seule */ }
    }
    const variantIds = [...new Set([...products, ...curated, ...campaign].map((p) => p.variantId).filter(Boolean))];
    const map = {};
    let i = 0;
    const concurrency = 12;
    async function worker() {
      while (i < variantIds.length) {
        const vid = variantIds[i++];
        const title = await fetchPromoForVariant(vid);
        if (title) map[vid] = title;
      }
    }
    await Promise.all(Array(Math.min(concurrency, variantIds.length)).fill(0).map(worker));
    return map;
  });
}

module.exports = { collectionProductsFor, getActiveBrands, getCollectionProducts, getCollections, getHomeRails, getMenu, getPredictive, getProductByHandle, getProducts, getProductsPage, getPromos };
