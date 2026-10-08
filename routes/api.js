// Routes /api/* de lecture : recherche, index, catalogue, produits, marques, menu, collections, promos, revalidation.
// Extrait de server.js (phase 1 du plan d'architecture, octobre 2026) — code déplacé, pas réécrit.
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { filterScope } = require('../lib/filter-scopes');
const { clearSearchCache, getSearchPage } = require('../lib/services/search');
const cache = require('../lib/cache');
const { shopifyFetch } = require('../lib/shopify/client');
const { CAMPAIGN_COLLECTIONS } = require('../lib/config');
const { navigationReady } = require('../lib/render/navigation');
const { collectionProductsFor, getActiveBrands, getCollections, getHomeRails, getMenu, getPredictive, getProductByHandle, getProducts, getProductsPage, getPromos } = require('../lib/services/catalog');
const { INDEX_PART_NAMES, buildAndStoreIndex, getScopePage, indexPart, indexStatus } = require('../lib/services/catalog-scope');
const { blobConfigured } = require('../lib/services/catalog-index-store');

router.get('/api/search',async(req,res)=>{
  res.set('Cache-Control','no-store');
  if(typeof req.query.q!=='string'||!req.query.q.trim())return res.status(400).json({error:'Indiquez votre recherche.'});
  try {res.json(await getSearchPage(req.query));}
  catch(error){console.warn('[search-api]',error.message);res.status(503).json({error:'Recherche momentanément indisponible.'});}
});
router.get('/index-catalogue/:part.json', async (req, res) => {
  // Adresses fixes, sans paramètre : personne ne peut forcer de nouvelles constructions via le CDN.
  if (!INDEX_PART_NAMES.has(req.params.part) || Object.keys(req.query).length) return res.status(404).set('Cache-Control', 'no-store').end();
  try {
    const result = await indexPart(req.params.part);
    // Index dans Blob : on y renvoie (lisible par le CDN), rien n'est construit ici.
    if (result.redirect) { res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600'); return res.redirect(302, result.redirect); }
    const { gzip, builtAt, count } = result;
    res.set({
      'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'gzip',
      // Même forme que les pages déjà gardées par le CDN (voir ogCache). 15 min puis
      // renouvellement en arrière-plan : une construction complète au plus par quart d'heure.
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=86400',
      'X-Index-Built-At': new Date(builtAt).toISOString(), 'X-Index-Products': String(count),
    });
    return res.send(gzip);
  } catch (error) {
    console.warn('[index-catalogue]', error.message);
    return res.status(503).set({ 'Cache-Control': 'no-store', 'Retry-After': '60' }).json({ error: 'index_unavailable' });
  }
});
router.get('/api/catalog/:handle',async (req,res)=>{
  await navigationReady;
  const scope = filterScope(req.params.handle);
  if (!scope) return res.status(404).json({error:'catalog_not_found'});
  // Même politique que la page qu'il complète (pagination, filtres) : 1 min à l'edge.
  try { res.set('Cache-Control','public, s-maxage=60, stale-while-revalidate=600').json(await getScopePage(scope, req.query)); }
  catch(error) { console.warn('[catalog-api]',scope.handle,error.message);res.status(503).json({error:'Cette sélection ne peut pas être chargée. Réessayez.'}); }
});
// ─── API: GET PRODUCTS ─────────────────────────────────
// Two modes:
//   GET /api/products                              → legacy array (≤ 250 products)
//     consumed by home (main.js), selection, produit, internal getPromos
//   GET /api/products?paginated=1&limit=50&cursor= → { items, pageInfo }
//     consumed by the new PLP at /produits.html
// The legacy shape is contractual — 4 callers depend on it.
router.get('/api/home-rails', async (req, res) => {
  try { res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600').json(await getHomeRails()); }
  catch (err) { console.error('Home rails error:', err.message); res.status(503).set('Cache-Control', 'no-store').json({ error: 'home_rails_unavailable' }); }
});
// Réponses API cachables à l'edge. vercel.json ne force plus `no-store` sur /api/* :
// chaque endpoint décide. s-maxage = durée servie depuis le CDN sans toucher la
// fonction ; stale-while-revalidate = fenêtre où l'edge sert l'ancienne réponse en
// la rafraîchissant en arrière-plan. Les erreurs (catch) repassent en no-store.
function apiCache(res, seconds, swr = 3600) {
  res.set('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=${swr}`);
}
router.get('/api/products', async (req, res) => {
  try {
    apiCache(res, 300);
    const { paginated, cursor, limit, tags, cats, brand, q } = req.query;
    if (paginated || cursor || limit || tags || cats || brand || q) {
      const page = await getProductsPage(limit, cursor, tags, cats, brand, q);
      return res.json(page);
    }
    const products = await getProducts();
    res.json(products);
  } catch (err) {
    console.error('Products error:', err.message);
    res.status(500).set('Cache-Control', 'no-store').json({ error: 'Impossible de charger les produits.' });
  }
});
// ─── API: GET BRANDS ───────────────────────────────────
// Derived from product.vendor — one entry per vendor, with its page (href).
router.get('/api/brands', async (req, res) => {
  try {
    apiCache(res, 1800, 86400);
    const brands = await getActiveBrands();
    res.json(brands);
  } catch (err) {
    console.error('Brands error:', err.message);
    res.status(500).set('Cache-Control', 'no-store').json({ error: 'Impossible de charger les marques.' });
  }
});
// ─── API: RECHERCHE PRÉDICTIVE (overlay instantané) ────
router.get('/api/predictive', async (req, res) => {
  try {
    const data = await getPredictive(req.query.q);
    res.set('Cache-Control', data.resultsUrl ? 'no-store' : 'public, max-age=60, s-maxage=60, stale-while-revalidate=600');
    res.json(data);
  } catch (err) {
    console.error('Predictive error:', err.message);
    res.status(503).set('Cache-Control','no-store').json({ error: 'Recherche indisponible.' });
  }
});
// ─── API: MAIN MENU ────────────────────────────────────
// Used by the nav widget (mega menu + dropdown). On upstream failure
// returns { ok: false, items: [] } — the client falls back to its
// hardcoded top-level. We never 500 on this endpoint: the nav is
// global and must not surface as a broken request.
router.get('/api/menu', async (req, res) => {
  try {
    const menu = await getMenu();
    apiCache(res, 300);
    res.json(menu);
  } catch (err) {
    console.warn('Menu fetch failed:', err.message);
    res.set('Cache-Control', 'no-store').json({ ok: false, items: [] });
  }
});
// ─── API: GET COLLECTIONS ──────────────────────────────
// Real Shopify collections (product lines: Palissade, Bistro, Luxembourg…).
router.get('/api/collections', async (req, res) => {
  try {
    apiCache(res, 300);
    const collections = await getCollections();
    res.json(collections);
  } catch (err) {
    console.error('Collections error:', err.message);
    res.status(500).set('Cache-Control', 'no-store').json({ error: 'Impossible de charger les collections.' });
  }
});
// ─── API: GET PRODUCT BY HANDLE ────────────────────────
// GET /api/product/:handle
// 404 when the handle does not exist in Shopify (or is unpublished
// on the Storefront API channel).
router.get('/api/product/:handle', async (req, res) => {
  try {
    const product = await getProductByHandle(req.params.handle);
    if (!product) return res.status(404).set('Cache-Control', 'public, s-maxage=60').json({ error: 'product_not_found' });
    apiCache(res, 300);
    res.json(product);
  } catch (err) {
    console.error('Product fetch error:', err.message);
    res.status(500).set('Cache-Control', 'no-store').json({ error: 'Impossible de charger ce produit.' });
  }
});
router.get('/api/collection/:handle/products', async (req, res) => {
  try {
    const { handle } = req.params;
    const { cursor, limit, tag, brand } = req.query;
    let payload = await collectionProductsFor(handle, limit, cursor, tag, brand);
    const campaign = CAMPAIGN_COLLECTIONS[handle];
    if (!payload && campaign && !cursor && !tag && !brand) {
      payload = {
        collection: { handle, title: campaign.name, description: campaign.heroDescription, image: campaign.image },
        items: [], pageInfo: { hasNextPage: false, endCursor: null },
      };
    }
    if (!payload) return res.status(404).set('Cache-Control', 'public, s-maxage=60').json({ error: 'collection_not_found' });
    apiCache(res, 300);
    res.json(payload);
  } catch (err) {
    console.error('Collection products error:', err.message);
    res.status(500).set('Cache-Control', 'no-store').json({ error: 'Impossible de charger la collection.' });
  }
});
// ─── API: BUILD INFO (cache busting) ───────────────────
// Exposes the current build SHA so the client can append it as a
// query-string to long-cached asset URLs (e.g. /images/brands/*.svg
// served with `Cache-Control: immutable`). Each Vercel deploy gets
// a new SHA → ?v=... changes → browser re-fetches without manual
// cache clears. Falls back to "dev" outside Vercel.
router.get('/api/build', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const raw = process.env.VERCEL_GIT_COMMIT_SHA || '';
  res.json({ sha: raw ? raw.slice(0, 7) : 'dev' });
});
// ─── AUTH REVALIDATE ───────────────────────────────────
// Accepte (a) un webhook Shopify signé (HMAC-SHA256 sur le corps brut) OU
// (b) un token porteur pour les revalidations manuelles. Sinon 401.
// Fail-closed : si aucun secret n'est configuré, toute requête tombe en 401.
function verifyShopifyHmac(req) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  const sent   = req.get('X-Shopify-Hmac-Sha256');
  if (!secret || !sent || !req.rawBody) return false;
  const digest = crypto.createHmac('sha256', secret).update(req.rawBody).digest('base64');
  const a = Buffer.from(digest);
  const b = Buffer.from(sent);
  return a.length === b.length && crypto.timingSafeEqual(a, b); // comparaison constante
}
// Jeton porteur attendu en `Authorization: Bearer <secret>` (ou ?token= si allowQuery), comparé en
// temps constant. Fail-closed : sans secret configuré, rien ne passe.
function bearerMatches(req, secret, { allowQuery = false } = {}) {
  if (!secret) return false;
  const bearer = /^Bearer\s+(\S+)$/i.exec(req.get('authorization') || '');   // le schéma Bearer est exigé
  const sent = bearer ? bearer[1] : (allowQuery ? String(req.query.token || '') : '');
  if (!sent) return false;
  const a = Buffer.from(sent);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const hasValidToken = (req) => bearerMatches(req, process.env.REVALIDATE_TOKEN, { allowQuery: true });
// ─── API: CONSTRUCTION DE L'INDEX CATALOGUE → BLOB ─────
// Appelée toutes les 30 min par .github/workflows/warm-cache.yml avec
// `Authorization: Bearer CATALOG_INDEX_SECRET` (le Cron Vercel du plan Hobby ne permet
// qu'un passage par jour). Construit l'index (dizaines d'appels Shopify, 15 à 60 s) et
// l'écrit dans Blob : les instances le lisent ensuite en un appel au lieu de le
// reconstruire dans la requête d'un visiteur (ADR 0002, étape 2). Fail-closed.
router.post('/api/cron/catalog-index', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!bearerMatches(req, process.env.CATALOG_INDEX_SECRET)) return res.status(401).json({ error: 'unauthorized' });
  if (!blobConfigured()) return res.status(503).json({ error: 'blob_not_configured' });
  try {
    const meta = await buildAndStoreIndex();
    console.log(`[catalog-index] écrit dans Blob : ${meta.count} produits, ${meta.parts} parties, ${meta.ms} ms`);
    res.json({ ok: true, builtAt: meta.builtAt, count: meta.count, parts: meta.parts, ms: meta.ms });
  } catch (error) {
    console.error('[catalog-index] construction impossible :', error.message);
    res.status(error.status || 502).json({ error: 'index_build_failed' });
  }
});

// ─── API: REVALIDATE CACHE ─────────────────────────────
// Call this from a Shopify webhook (Products/update, Collections/update)
// Setup in Shopify admin → Settings → Notifications → Webhooks
// Auth : HMAC Shopify (webhook) OU Authorization: Bearer <REVALIDATE_TOKEN> (manuel).
router.post('/api/revalidate', (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!verifyShopifyHmac(req) && !hasValidToken(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  cache.del('products');
  cache.del('brands');
  cache.del('collections');
  cache.del('promos');
  cache.del('menu');
  cache.delByPrefix('catalog:index:');
  clearSearchCache();
  console.log('Cache cleared via /api/revalidate');
  res.json({ revalidated: true });
});
// ─── API: PROMOS (variantId → discount title) ──────────
router.get('/api/promos', async (req, res) => {
  try {
    const promos = await getPromos();
    apiCache(res, 60, 600);
    res.json(promos);
  } catch (err) {
    console.error('Promos error:', err.message);
    res.status(500).set('Cache-Control', 'no-store').json({ error: 'Impossible de charger les promotions.' });
  }
});

// ─── API: HEALTH ───────────────────────────────────────
// État de la fonction pour un moniteur externe (phase 5.2) : version déployée, région,
// âge de l'index catalogue, cache mémoire, Shopify joignable (requête minimale, bornée à
// 3 s). 200 si Shopify répond, 503 sinon. Jamais caché.
router.get('/api/health', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const t0 = performance.now();
  let shopify = 'ok';
  try {
    await Promise.race([
      shopifyFetch('{ shop { name } }'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout 3 s')), 3000)),
    ]);
  } catch (error) { shopify = 'down: ' + error.message; }
  const ok = shopify === 'ok';
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    build: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || 'dev',
    region: process.env.VERCEL_REGION || null,
    uptimeS: Math.round(process.uptime()),
    shopify, shopifyMs: Math.round(performance.now() - t0),
    index: indexStatus(),
    cache: cache.stats(),
  });
});

module.exports = router;
