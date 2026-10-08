// Routes HTML : fiche produit, collections, catalogue, pages statiques servies avec le chrome.
// Extrait de server.js (phase 1 du plan d'architecture, octobre 2026) — code déplacé, pas réécrit.
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { isCatalogLanding, landing: catalogLanding, renderCatalogLanding } = require('../lib/catalog-landing');
const { brandName } = require('../lib/collection-brand');
const { brandHero: getBrandHero, collectionHero: getCollectionHero, imageAtWidth, injectCollectionHero, photoStyle } = require('../lib/editorial-media');
const { PAGE_SIZE: FAMILY_PAGE_SIZE, families, renderFamilyPage, renderSeatingPage, seatingIcons } = require('../lib/family-pages');
const { CATALOGUE: CATALOGUE_SCOPE, filterScope } = require('../lib/filter-scopes');
const { productJsonLd } = require('../lib/product-jsonld');
const { shopifyFetch } = require('../lib/shopify/client');
const { isOutdoor, isTable } = require('../lib/table-collections');
const { selectInitialVariant } = require('../v3/product-variant');
const { cached } = require('../lib/cache');
const { BRAND_COLLECTION_ALIASES, BRAND_HERO_REVIEW, CAMPAIGN_COLLECTIONS, COLLECTION_ALIASES, COLLECTION_TEXTS, FAMILLES_RICHES, INTERNAL_COLLECTION, OG_DEFAULT, ORIGIN, resolveSsrRel } = require('../lib/config');
const { renderPage } = require('../lib/render/layout');
const { pageTitle, productTitle } = require('../lib/render/seo');
const { getDesigners } = require('../lib/designers');
const { V3_DIR } = require('../lib/paths');
const { htmlToMarkdown, sendMarkdown, wantsMarkdown } = require('../lib/render/agents');
const { chromeReady, injectChrome, send404Shell, sendProduitTemplate, sendProduitsTemplate } = require('../lib/render/chrome');
const { brandBanner, canRenderInitialGrid, contentPageTrail, injectNavigation, listingNavigation, listingPagination, nav, navigationReady, plpCardSsr } = require('../lib/render/navigation');
const { absUrl, ogCache, ogDesc, ogEscape, renderWithOg, temporaryUnavailable } = require('../lib/render/og');
const { activeDesignerSlugs, designerHeroSsr, injectBrandsIndex, injectDesignersIndex, injectHomeRails, injectNuancier, pdpServed, pdpSsrBlock, sendScopeCatalog, sendSearchPage } = require('../lib/render/pages');
const { collectionProductsFor, getCollectionProducts, getCollections, getHomeRails, getProductByHandle, getProductsPage } = require('../lib/services/catalog');

// ─── SEO · 301 /products/<handle> → /produit.html?handle=<handle> ─────────────
// Les pages de l'online store Shopify (shop.mikadodeco.be) canonisent vers le domaine
// primaire en gardant LEUR structure d'URL Shopify : www.mikadodeco.be/products/<handle>.
// Or ce site headless sert les fiches sur /produit.html?handle=<handle> → sans cette
// redirection, la canonique tombe sur un 404 = cul-de-sac SEO (le shop est noindex ET sa
// cible canonique est morte). On redirige en UN SEUL saut vers la vraie fiche, handle
// préservé. Un handle inexistant → 301 → /produit.html qui renvoie un VRAI 404
// (send404Shell), donc pas de soft-404. Redirect RELATIF (fonctionne sur www + Preview).
// Placé AVANT le catch-all app.get(/.*/). Les collections Shopify canonisent déjà vers
// /collections/<handle> qui EXISTE ici (route ci-dessous) → rien à faire pour elles.
router.get('/products/:handle', async (req, res) => {
  await navigationReady;
  const handle = String(req.params.handle || '');
  res.redirect(301, nav.navigation.productHref({ handle }, nav.navigation.sourceSelection(new URL(req.originalUrl, ORIGIN)), req.query.variant) || '/produits.html');
});
// ─── Fiche produit : /produit.html?handle=<handle> (B7) ─
router.get('/produit.html', async (req, res) => {
  const handle = req.query.handle;
  if (!handle && req.query.id) {
    await navigationReady;
    const id = String(req.query.id).match(/^(?:gid:\/\/shopify\/Product\/)?([0-9]+)$/)?.[1];
    if (!id) return send404Shell(res, 'produit.html');
    try {
      const data = await cached('product-handle:' + id, () => shopifyFetch(
        'query ProductHandle($id: ID!) { node(id: $id) { ... on Product { handle } } }',
        { id: 'gid://shopify/Product/' + id }
      ));
      if (!data.node?.handle) return send404Shell(res, 'produit.html');
      return res.redirect(301, nav.navigation.productHref({ handle: data.node.handle }, nav.navigation.sourceSelection(new URL(req.originalUrl, ORIGIN)), req.query.variant));
    } catch (error) { return temporaryUnavailable(res).send('Cette fiche est momentanément indisponible. Veuillez réessayer.'); }
  }
  if (!handle) return send404Shell(res, 'produit.html');   // aucune fiche demandée
  try {
    await Promise.all([chromeReady, navigationReady]);
    const product = await getProductByHandle(handle);
    // Miss stable (produit inexistant/dépublié) : on cache aussi le repli pour
    // ne pas ré-invoquer la fonction à chaque bot. (Les erreurs Shopify partent
    // dans le catch ci-dessous, sans cache.)
    if (!product) { return send404Shell(res, 'produit.html'); }

    const name     = product.name || 'Produit';
    const brand    = product.brand || '';
    const designer = product.designer || '';
    const title = productTitle(product);                      // title_tag Shopify, sinon « Nom — Marque | Mikado Deco »
    const description = ogDesc(product.seoDescription || product.description ||
      `${name}${brand ? ' — ' + brand : ''}. `
      + (designer ? `Dessiné par ${designer}. ` : '')
      + 'Pièce design à voir en boutique à Uccle, livraison en Belgique.');
    // Première image produit NON redimensionnée (firstImageRaw), en absolu, en
    // ajoutant &width=1200 → JPEG (pas de format=webp : meilleur support og:image
    // par les scrapers sociaux). images[] est désormais en webp pour la galerie,
    // donc on ne le réutilise plus ici. Repli og-default.
    const raw = product.firstImageRaw || '';
    const image = raw ? raw + (raw.includes('?') ? '&' : '?') + 'width=1200' : OG_DEFAULT;
    const url = ORIGIN + '/produit.html?handle=' + encodeURIComponent(handle);

    const html = renderPage('produit.html', { title, description, image, url });
    // SEO · Product JSON-LD en SSR (remplace l'IIFE JS de produit.html) — un seul
    // schéma, visible des crawlers sans exécution JS. Prix/dispo depuis le produit.
    // L'offre décrit la variante affichée (URL ?variant= ou photo de couverture),
    // comme le bloc SSR : même prix, même prix barré et même disponibilité.
    const ldVariant = selectInitialVariant(product.variants, { requestedId: new URL(req.originalUrl, ORIGIN).searchParams.get('variant'), coverUrl: product.image || product.firstImageRaw, fallback: false });
    const ld = productJsonLd(product, ldVariant, { url, image, seller: 'Mikado Deco' });
    const ldTag = `<script type="application/ld+json">` + JSON.stringify(ld).replace(/</g, '\\u003c') + `</script>`
      ;
    let out = html.replace('</head>', ldTag + '\n</head>');
    out = injectNavigation(out, nav.navigation.productTrail(product, new URL(req.originalUrl, ORIGIN), nav.navigationRules), url, nav.navigation.sourceSelection(new URL(req.originalUrl, ORIGIN)));
    // SSR lot 1 · contenu produit (nom/prix/dispo) à la place du squelette → crawlable sans JS.
    const sourceURL = new URL(req.originalUrl, ORIGIN);
    const served = pdpServed(product, sourceURL);
    if (served) {
      const ssrKey = handle + '|' + (sourceURL.searchParams.get('variant') || '');
      out = out.replace('<div data-pdp>', () => `<div data-pdp data-ssr="${ogEscape(ssrKey)}">`)
        .replace(/<!--PDP-SSR-START-->[\s\S]*?<!--PDP-SSR-END-->/, () => served.html)
        .replace('</body>', () => '<script type="application/json" id="product-initial">' + JSON.stringify(served.data).replace(/</g, '\\u003c') + '</script>\n</body>');
    } else {
      out = out.replace(/<!--PDP-SSR-START-->[\s\S]*?<!--PDP-SSR-END-->/, () => pdpSsrBlock(product, sourceURL));
    }
    // SSR chantier 5 · recos « Complétez avec » / « Vous aimerez aussi » crawlables
    // (maillage interne ; piloté par les métafields Search & Discovery — jamais hardcodé).
    const recoSsr = (list, grid, wrap) => {
      const cards = (list || []).map(plpCardSsr).filter(Boolean).join('');
      if (!cards) return;
      out = out.replace('<div class="pgrid" ' + grid + '></div>', () => '<div class="pgrid" ' + grid + '>' + cards + '</div>');
      out = out.replace('<section class="section" ' + wrap + ' style="display:none">', () => '<section class="section" ' + wrap + '>');
    };
    recoSsr(product.complementary, 'data-complementary', 'data-complementary-wrap');
    recoSsr(product.related, 'data-related', 'data-related-wrap');
    out = injectChrome(out, 'produit.html');     // ← non-hero → header solide
    ogCache(res);
    return res.send(out);
  } catch (err) {
    console.warn('[og-produit]', err.message);
    return sendProduitTemplate(temporaryUnavailable(res));
  }
});
// ─── Collection / marque : /collections/<handle> ───────
// Nom + description + image via getCollections() (caché). Image par priorité :
// bandeau de marque qualifié → image Shopify de la collection →
// og-default. Collection inconnue → template générique inchangé (jamais 500).
router.get('/collections/:handle', async (req, res) => {
  const handle = String(req.params.handle || '').toLowerCase();
  if (INTERNAL_COLLECTION.test(handle)) return send404Shell(res, 'produits.html');
  if (Object.hasOwn(BRAND_COLLECTION_ALIASES, handle)) {
    const query = req.originalUrl.indexOf('?');
    return res.redirect(301, '/collections/' + BRAND_COLLECTION_ALIASES[handle] + (query < 0 ? '' : req.originalUrl.slice(query)));
  }
  if (!req.query.coll) {
    await navigationReady;
    const scope = filterScope(handle);
    // Sans index disponible, familles, Canapés et tables reprennent leur liste d'origine.
    if (scope && scope.basePath === '/collections/' + handle) {
      if (await sendScopeCatalog(req, res, scope)) return;
      res.locals.scopeFallback = true;
    }
  }
  if (COLLECTION_ALIASES.has(handle)) {
    await navigationReady;
    return res.redirect(301, nav.navigation.selectionURL(req.originalUrl) || '/produits.html');
  }
  const brand = typeof req.query.brand === 'string' ? req.query.brand.trim().toLowerCase() : '';
  // Page famille riche (Jardin/Outdoor…) : sert le template dédié + chrome SSR.
  if (FAMILLES_RICHES[handle] && !brand) {
    try {
      await Promise.all([chromeReady, navigationReady]);
      res.set('Content-Type', 'text/html; charset=utf-8');
      let html = renderPage(FAMILLES_RICHES[handle]);
      if (handle === 'sieges') {
        // Une fiche dépubliée ou en panne ne bloque pas la sélection restante.
        const results = await Promise.allSettled(seatingIcons.handles.map(getProductByHandle));
        const items = results.flatMap(result => result.status === 'fulfilled' && result.value ? [result.value] : []);
        html = renderSeatingPage(html, items, items.map(p => plpCardSsr(p, req.originalUrl)).filter(Boolean).join(''));
        if (results.some(result => result.status === 'rejected')) res.set('Cache-Control', 'no-store');
        else ogCache(res);
      }
      return res.send(injectChrome(listingNavigation(html, req), FAMILLES_RICHES[handle]));
    } catch (e) { /* repli sur le template générique ci-dessous */ }
  }
  if (Object.hasOwn(families, handle) && !brand) {
    await Promise.all([chromeReady, navigationReady]);
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : '';
    const featuredPromise = Promise.allSettled((families[handle].featured?.handles || []).map(getProductByHandle));
    let payload = null;
    let failed = false;
    try {
      payload = await getCollectionProducts(handle, FAMILY_PAGE_SIZE, cursor || null);
      failed = !payload;
    } catch (error) {
      failed = true;
      console.warn('[family-products]', handle, error.message);
    }
    const items = payload?.items || [];
    const featuredResults = await featuredPromise;
    const featuredItems = featuredResults.flatMap(result => result.status === 'fulfilled' && result.value && isTable(result.value) && !isOutdoor(result.value) ? [result.value] : []);
    let html = renderFamilyPage(renderPage('family-page.html'), handle, {
      items, pageInfo: payload?.pageInfo || {}, cursor, failed,
      cards: items.map(p => plpCardSsr(p, req.originalUrl)).filter(Boolean).join(''),
      featuredItems, featuredCards: featuredItems.map(p => plpCardSsr(p, req.originalUrl)).filter(Boolean).join(''),
    });
    html = listingNavigation(html, req);
    res.set('Content-Type', 'text/html; charset=utf-8');
    // Ne pas conserver une panne de Shopify dans le cache de la page.
    if (failed) temporaryUnavailable(res);
    else if (featuredResults.some(result => result.status === 'rejected')) res.set('Cache-Control', 'no-store');
    else ogCache(res);
    return res.send(injectChrome(html, 'family-page.html'));
  }
  try {
    await Promise.all([chromeReady, navigationReady]);
    const richFamilies = {
      sieges: { title: 'Assises', hero: '/images/familles/assises/hero.webp' },
      outdoor: { title: 'Jardin', hero: '/images/familles/jardin/1.webp' },
    };
    const campaign = CAMPAIGN_COLLECTIONS[handle] || null;
    const pageText = campaign || (Object.hasOwn(COLLECTION_TEXTS, handle) ? COLLECTION_TEXTS[handle] : null);
    const family = Object.hasOwn(families, handle) ? families[handle] : Object.hasOwn(richFamilies, handle) ? richFamilies[handle] : null;
    const col = family ? { name: family.title, description: family.description } : (await getCollections()).find(c => c.handle === handle) || campaign;
    // Miss stable (handle hors catalogue, ex. /collections/all) : repli cachable.
    if (!col) return send404Shell(res, 'produits.html');

    const tag = typeof req.query.tag === 'string' ? req.query.tag : null;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : null;
    let cp = null, failed = false;
    try { cp = await collectionProductsFor(handle, 24, cursor, tag, brand); }
    catch (error) { failed = true; console.warn('[collection-selection]', error.message); }
    if (!cp && campaign && !brand && !tag && !cursor) cp = { items: [], pageInfo: { hasNextPage: false, endCursor: null } };
    const brandLabel = cp?.brand?.name || brandName(brand);
    const brandPhoto = family?.brands?.find(item => item.slug === brand);
    // Le bandeau Luminaires montre déjà une scène Artek large, adaptée à ce format.
    const useFamilyPhoto = handle === 'luminaires' && brand === 'artek';
    const legacyPhotos = {
      sieges: { 'carl-hansen-son': 'assises/brand-carlhansen', artek: 'assises/brand-artek', vitra: 'assises/brand-vitra', hay: 'assises/brand-hay' },
      outdoor: { fermob: 'jardin/20', hay: 'jardin/21', fatboy: 'jardin/22', tradition: 'jardin/23' },
    };
    const legacyBrandPhoto = Object.hasOwn(legacyPhotos, handle) && Object.hasOwn(legacyPhotos[handle], brand) ? legacyPhotos[handle][brand] : null;
    const familyImage = family ? imageAtWidth((useFamilyPhoto ? family.hero : brandPhoto?.image) || (legacyBrandPhoto ? '/images/familles/' + legacyBrandPhoto + '.webp' : family.hero), 2000) : null;
    const collectionHero = family ? {
      brand: false, editorial: true, img: familyImage, srcset: familyImage,
      alt: brandPhoto || legacyBrandPhoto ? family.title + ' · ' + brandLabel : family.heroAlt || family.title,
      style: photoStyle(!useFamilyPhoto && brandPhoto ? { position: brandPhoto.heroPosition || brandPhoto.position, mobilePosition: brandPhoto.mobilePosition } : legacyBrandPhoto ? {} : { position: family.heroPosition, mobilePosition: family.heroMobilePosition }),
    } : campaign ? {
      brand: false, editorial: true, img: campaign.image, srcset: campaign.image,
      alt: campaign.imageAlt, style: '',
    } : getBrandHero(handle, { includeCandidates: BRAND_HERO_REVIEW }) || getCollectionHero(handle);
    const collectionName = nav.navigationRules.collections[handle]?.label || col.name || 'Catalogue';
    const name = collectionName + (brand ? ' · ' + brandLabel : '');
    const title = pageTitle(name);
    const description = ogDesc(
      brand ? `Les créations ${brandLabel} de notre sélection « ${collectionName} ».` : pageText ? pageText.description : col.description && col.description.trim()
        ? col.description
        : `${name} chez Mikado Deco — sélection design. Retrait à Uccle, livraison en Belgique.`
    );
    const bodyDescription = pageText && !brand ? pageText.heroDescription : description;
    const image = collectionHero ? absUrl(collectionHero.img) : (col.image ? absUrl(col.image) : OG_DEFAULT);
    const collectionUrl = '/collections/' + encodeURIComponent(handle);
    const url = ORIGIN + collectionUrl + (brand ? '?brand=' + encodeURIComponent(brand) : '');

    let html = renderPage('produits.html', { title, description, image, url });
    html = brandBanner(injectCollectionHero(html, collectionHero), handle);
    if (campaign) html = html.replace('<section class="subhero subhero--editorial"', '<section class="subhero subhero--editorial subhero--campaign"');
    html = listingNavigation(html, req, { title: collectionName, brandName: brandLabel });
    if (campaign) {
      // Les produits d'abord ; les conditions suivent la grille.
      const terms = `<section class="section wrap" aria-labelledby="campaign-terms-title"><h2 class="serif catalogue-head" id="campaign-terms-title">Conditions de l’offre</h2><ul class="campaign-terms">${campaign.terms.map(term => `<li>${ogEscape(term)}</li>`).join('')}</ul></section>`;
      html = html.replace('<nav class="plp-pagination" data-pagination aria-label="Pagination" hidden></nav>\n  </section>', match => match + terms);
    }
    if (brand || pageText) {
      const context = { handle, collectionName, title: name, description: bodyDescription };
      if (brand) context.brand = { slug: brand, name: brandLabel };
      if (pageText?.gridTitle) context.gridTitle = pageText.gridTitle;
      if (campaign) context.pendingMessage = 'Les configurations seront disponibles ici dès leur publication pour le lancement de l’offre.';
      html = html.replace('id="collection-context-initial">null</script>', () => 'id="collection-context-initial">' + JSON.stringify(context).replace(/</g, '\\u003c') + '</script>');

    }
    // SSR lot 2 · H1 + sous-titre = nom/description de la collection (crawlable sans JS ;
    // le script inline vide ces génériques pour les users → zéro régression de flash).
    html = html.replace('<h1 data-plp-title>Le catalogue</h1>', () => '<h1 data-plp-title' + (brand || pageText ? ' data-context' : '') + '>' + ogEscape(name) + '</h1>');
    html = html.replace('<p data-plp-sub>Mobilier de design, choisi pièce par pièce.</p>', () => '<p data-plp-sub>' + ogEscape(bodyDescription) + '</p>');
    // SSR chantier 3 · grille de la collection (catégorie OU marque = collection Shopify) crawlable.
    try {
      if (!cp) throw new Error('Collection unavailable');
      const gi = (cp && cp.items) || [];
      if (gi.length && canRenderInitialGrid(req)) {
        const cards = gi.map(product => plpCardSsr(product, req.originalUrl)).filter(Boolean).join('');
        html = html.replace('<div class="pgrid" data-grid></div>', () => '<div class="pgrid" data-grid data-ssr="1">' + cards + '</div>');
      }
      if (brand) {
        if (!gi.length) html = html.replace('<div class="pgrid" data-grid></div>', () => `<div class="pgrid" data-grid data-ssr="1"><p class="plp-empty">Aucun produit pour cette marque dans cette catégorie. <a href="${collectionUrl}">Revenir à ${ogEscape(collectionName)}</a>.</p></div>`);
      }
      if (campaign && !gi.length) {
        html = html.replace('<div class="pgrid" data-grid></div>', '<div class="pgrid" data-grid data-ssr="1"><p class="plp-empty">Les configurations seront disponibles ici dès leur publication pour le lancement de l’offre.</p></div>');
      }
      html = listingPagination(html, req, cp.pageInfo);
      // Une collection vide reste accessible au client, mais hors de l’index.
      // Une panne ne doit jamais déclencher ce signal : elle passe en 503.
      if (!gi.length && !cursor && !brand && !tag && col.hasProducts === false) {
        res.set('X-Robots-Tag', 'noindex, follow');
        html = html.replace('</head>', '<meta name="robots" content="noindex,follow" />\n</head>');
      }
    } catch (e) {
      failed = true;
      html = html.replace('<div class="pgrid" data-grid></div>', '<div class="pgrid" data-grid><p class="plp-empty">Impossible de charger cette sélection. Veuillez réessayer.</p></div>');
      console.warn('[coll-grid-ssr]', e.message);
    }
    html = injectChrome(html, 'produits.html', Boolean(collectionHero));
    if (failed) temporaryUnavailable(res);
    else ogCache(res);
    return res.send(html);
  } catch (err) {
    console.warn('[og-collection]', err.message);
    return sendProduitsTemplate(temporaryUnavailable(res));
  }
});
// ─── Créateur : /produits.html?designer=<slug> ─────────
// Nom + bio + portrait via designers-data.json (caché). Sans ?designer (ou
// modes catalogue / ?cats= / ?brand=) → template générique. Designer inconnu →
// template générique. ~29 créateurs sans photo → repli og-default.
router.get('/produits.html', async (req, res) => {
  if (typeof req.query.q === 'string' && req.query.q.trim() && Object.keys(req.query).every(key => ['q','omit','page','sort'].includes(key))) return sendSearchPage(req,res);
  if (typeof req.query.coll === 'string' && /^[a-z0-9-]+$/.test(req.query.coll) && req.query.coll !== 'all') {
    const query = new URLSearchParams(Object.entries(req.query).filter(([key, value]) => key !== 'coll' && typeof value === 'string'));
    return res.redirect(302, '/collections/' + req.query.coll + (query.size ? '?' + query : ''));
  }
  const slug = req.query.designer ? String(req.query.designer).toLowerCase() : '';
  // Ancienne écriture d'un créateur (doublon unifié, duo inversé) : un seul saut vers sa fiche.
  if (slug) {
    await navigationReady;
    const canonical = nav.navigation.designerSlug(slug, getDesigners());
    if (canonical && canonical !== slug) {
      const query = new URLSearchParams(Object.entries(req.query).filter(([, value]) => typeof value === 'string'));
      query.set('designer', canonical);
      return res.redirect(301, '/produits.html?' + query);
    }
  }
  // Catalogue complet filtrable (demande du 24 septembre) ; liste d'origine en secours.
  // Catalogue complet et pages créateurs filtrables ; liste d'origine en secours.
  const listScope = slug ? filterScope('designer:' + slug) : CATALOGUE_SCOPE;
  if (listScope) {
    if (await sendScopeCatalog(req, res, listScope)) return;
    res.locals.scopeFallback = true;
  }
  if (!slug) {
    // Catalogue de base (lot 4) : SSR de la 1re page de grille (24 produits) → liens
    // produit crawlables dans le HTML (maillage interne + découverte, complète le sitemap).
    // Le module remplace ensuite la grille (garde data-ssr côté produits.html) : 0 doublon/flash.
    const brand = typeof req.query.brand === 'string' ? req.query.brand.trim().toLowerCase() : '';
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    let html = renderPage('produits.html');
    const landingRequest = isCatalogLanding(req.query);
    // Quatre choix explicites chargés en parallèle de la grille. Une fiche
    // indisponible n'est jamais remplacée par une meilleure vente arbitraire.
    const iconsPromise = Promise.allSettled((landingRequest ? catalogLanding.icons.handles : []).map(getProductByHandle));
    let failed = false, gridFailed = false, brandItems = [], pageInfo = {};
    try {
      await Promise.all([chromeReady, navigationReady]);
      const page = await getProductsPage(24, req.query.cursor || null, req.query.tag ? [req.query.tag] : null, req.query.cats, brand, q);
      const { items } = page;
      pageInfo = page.pageInfo;
      brandItems = items;
      if (items && items.length && canRenderInitialGrid(req)) {
        const cards = items.map(product => plpCardSsr(product, req.originalUrl)).filter(Boolean).join('');
        html = html.replace('<div class="pgrid" data-grid></div>', () => '<div class="pgrid" data-grid data-ssr="1">' + cards + '</div>');
      } else if (brand) {
        html = html.replace('<div class="pgrid" data-grid></div>', '<div class="pgrid" data-grid data-ssr="1"><p class="plp-empty">Aucun produit pour cette sélection.</p></div>');
      }
    } catch (e) {
      failed = true;
      gridFailed = true;
      html = html.replace('<div class="pgrid" data-grid></div>', '<div class="pgrid" data-grid><p class="plp-empty">Impossible de charger cette sélection. Veuillez réessayer.</p></div>');
      console.warn('[plp-ssr]', e.message);
    }
    if (landingRequest) {
      const results = await iconsPromise;
      const iconItems = results.flatMap(result => result.status === 'fulfilled' && result.value ? [result.value] : []);
      if (results.some(result => result.status === 'rejected')) failed = true;
      html = renderCatalogLanding(html, {
        iconItems, iconCards: iconItems.map(p => plpCardSsr(p, req.originalUrl)).filter(Boolean).join(''),
        discoveryHidden: Boolean(req.query.cats || req.query.tag || Number(req.query.page) > 1),
        continuation: Number.parseInt(req.query.page, 10) > 1,
      });
      html = renderWithOg(html, {
        title: pageTitle('Mobilier & objets de design'), description: catalogLanding.description,
        image: catalogLanding.hero.image, url: ORIGIN + '/produits.html',
      });
    }
    if (brand) {
      const name = brandName(brand, brandItems.map(product => ({ name: product.brand })));
      const title = q ? `Résultats pour « ${q} » · ${name}` : name;
      const description = `Toutes les pièces ${name} de notre catalogue.`;
      const url = ORIGIN + '/produits.html?' + new URLSearchParams(Object.entries(req.query).filter(([, value]) => typeof value === 'string'));
      html = renderWithOg(html, { title: pageTitle(title), description, image: OG_DEFAULT, url });
      html = html.replace('id="collection-context-initial">null</script>', () => 'id="collection-context-initial">' + JSON.stringify({ brand: { slug: brand, name } }).replace(/</g, '\\u003c') + '</script>');
      html = html.replace('<h1 data-plp-title>Le catalogue</h1>', () => '<h1 data-plp-title data-context>' + ogEscape(title) + '</h1>');
      html = html.replace('<p data-plp-sub>Mobilier de design, choisi pièce par pièce.</p>', () => '<p data-plp-sub>' + ogEscape(description) + '</p>');
    }
    html = listingPagination(html, req, pageInfo);
    if (gridFailed) temporaryUnavailable(res);
    else if (failed) res.set('Cache-Control', 'no-store');
    else ogCache(res);
    html = listingNavigation(html, req, { brandName: brandItems.find(p => nav.navigation.navigationSlug(p.brand) === brand)?.brand || brandName(brand) });
    return res.send(injectChrome(html, 'produits.html'));
  }
  try {
    await Promise.all([chromeReady, navigationReady]);
    const designer = getDesigners().find((d) => String(d.slug || '').toLowerCase() === slug && !d.hidden);
    // Miss stable (slug inconnu) : repli cachable.
    if (!designer) { return send404Shell(res, 'produits.html'); }

    const name = designer.name || 'Créateur';
    const title = pageTitle(name);
    const description = ogDesc(
      designer.bio && designer.bio.trim()
        ? designer.bio
        : `Les pièces signées ${name} chez Mikado Deco. Retrait à Uccle, livraison en Belgique.`
    );
    const image = designer.photo ? absUrl(designer.photo) : OG_DEFAULT;
    const url = ORIGIN + '/produits.html?designer=' + encodeURIComponent(designer.slug || slug);

    let html = renderPage('produits.html', { title, description, image, url });
    html = listingNavigation(html, req);
    // SSR lot 3 · classe créateur (masque le subhero « Le catalogue » → un seul H1) +
    // hero nom/bio/portrait injecté (crawlable sans JS ; le module le remplace ensuite).
    html = html.replace('<html lang="fr">', '<html lang="fr" class="plp-designer">');
    html = html.replace('<div class="wrap" data-designer-hero></div>', () => '<div class="wrap" data-designer-hero>' + designerHeroSsr(designer) + '</div>');
    // SSR chantier 3 · grille des pièces du créateur (tags designer) crawlable.
    try {
      const dp = await getProductsPage(24, req.query.cursor || null, designer.tags || [], null, req.query.brand || null, req.query.q || null);
      const gi = (dp && dp.items) || [];
      if (gi.length && canRenderInitialGrid(req)) {
        const cards = gi.map(p => plpCardSsr(p, req.originalUrl)).filter(Boolean).join('');
        html = html.replace('<div class="pgrid" data-grid></div>', () => '<div class="pgrid" data-grid data-ssr="1">' + cards + '</div>');
      }
      html = listingPagination(html, req, dp.pageInfo);
    } catch (e) {
      console.warn('[designer-grid-ssr]', e.message);
      return sendProduitsTemplate(temporaryUnavailable(res));
    }
    html = injectChrome(html, 'produits.html');
    ogCache(res);
    return res.send(html);
  } catch (err) {
    console.warn('[og-designer]', err.message);
    return sendProduitsTemplate(temporaryUnavailable(res));
  }
});
// Les anciens liens du répertoire par famille reviennent à la famille.
// Le clic sur une carte marque mène directement au catalogue à deux filtres.
router.get('/marques.html', (req, res, next) => {
  if (!Object.hasOwn(req.query, 'collection')) return next();
  const handle = req.query.collection;
  return res.redirect(302, typeof handle === 'string' && /^[a-z0-9-]+$/.test(handle)
    ? '/collections/' + handle : '/marques.html');
});
// URL sans extension (/studio, /journal/fermob, /produits) : l'ancienne configuration Vercel
// servait le gabarit brut v3/<chemin>.html (sans chrome). Depuis l'ADR 0009, toute URL inconnue
// arrive ici : 301 vers la page .html quand elle existe, 404 sinon.
function htmlTwin(p) {
  const m = /^\/((?:journal\/)?[a-z0-9][a-z0-9-]*)\/?$/.exec(p);
  if (!m) return null;
  const rel = m[1] + '.html';
  if (!resolveSsrRel('/' + rel) && rel !== 'produit.html' && rel !== 'produits.html') return null;
  return fs.existsSync(path.join(V3_DIR, rel)) ? '/' + rel : null;
}
router.get(/.*/, async (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/_vercel/')) return next();
  const rel = resolveSsrRel(req.path);
  if (!rel) {                                           // pas une page SSR → static/api gèrent
    const twin = htmlTwin(req.path);
    if (!twin) return next();
    const q = req.originalUrl.indexOf('?');
    return res.redirect(301, twin + (q >= 0 ? req.originalUrl.slice(q) : ''));
  }
  const root = V3_DIR;
  const file = path.join(root, rel);
  if (!file.startsWith(root + path.sep)) return next(); // anti path-traversal
  let raw;
  try { raw = renderPage(rel); }                        // fragment + layout unique (ADR 0012)
  catch { return next(); }                              // inexistant → 404 normal
  if (!/id="site-header"/.test(raw)) return next();     // page hors-shell → ne pas toucher
  await Promise.all([chromeReady, navigationReady]);
  // SSR des rails produits de l'accueil (liens crawlables + fin des squelettes au 1er paint).
  if (rel === 'index.html') {
    try {
      raw = injectHomeRails(raw, await getHomeRails());
    } catch (e) { console.warn('[home-rails]', e.message); }
  }
  if (rel === 'marques.html') {
    try { raw = await injectBrandsIndex(raw); } catch (e) { console.warn('[brands-index]', e.message); }
  }
  if (rel === 'designers.html') {
    try { raw = injectDesignersIndex(raw, await activeDesignerSlugs()); } catch (e) { console.warn('[designers-index]', e.message); }
  }
  if (rel === 'nuancier-fermob.html') {
    try { raw = await injectNuancier(raw); } catch (e) { console.warn('[nuancier]', e.message); }
  }
  if (['marques.html', 'designers.html'].includes(rel)) raw = listingNavigation(raw, req);
  const contentTrail = contentPageTrail(rel, raw);
  if (contentTrail) raw = injectNavigation(raw, contentTrail, req.path);
  res.set('Cache-Control', 'public, max-age=0, must-revalidate');
  res.vary('Accept');
  // Agents demandant text/markdown : extrait markdown du contenu de page (AVANT
  // injectChrome → sans nav/pied/panier). Navigateurs : HTML inchangé.
  if (wantsMarkdown(req)) return sendMarkdown(res, htmlToMarkdown(raw, ORIGIN + req.path));
  res.set('Content-Type', 'text/html; charset=utf-8');
  return res.send(injectChrome(raw, rel));
});

module.exports = router;
