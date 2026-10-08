// Routes SEO : sitemaps.
// Extrait de server.js (phase 1 du plan d'architecture, octobre 2026) — code déplacé, pas réécrit.
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { families } = require('../lib/family-pages');
const { shopifyFetch } = require('../lib/shopify/client');
const { SITEMAP_PRODUCTS_QUERY } = require('../lib/shopify/queries');
const { cached } = require('../lib/cache');
const { BRAND_COLLECTION_ALIASES, FAMILLES_RICHES, INTERNAL_COLLECTION, ORIGIN } = require('../lib/config');
const { getDesigners } = require('../lib/designers');
const { V3_DIR } = require('../lib/paths');
const { activeDesignerSlugs } = require('../lib/render/pages');
const { articleSlugs, journalReady } = require('../lib/render/journal');
const { getCollections } = require('../lib/services/catalog');

// ─── SEO: sitemap = INDEX instantané → pages (statique) + produits (walk) ──
// /sitemap.xml était UN fichier généré par un walk paginé de tout le catalogue
// Shopify (~3 300 URLs). À froid (cache serverless vide) ce walk dépasse le
// budget de la fonction → connexion coupée (curl : http=000), et crawlers/agents
// concluent « pas de sitemap ». On sert désormais un sitemapindex qui répond
// immédiatement et pointe vers deux sitemaps : les pages (statique, avec
// lastmod) et les produits/collections (walk caché 6 h). Aucune URL perdue ;
// les 3 chemins sont routés vers la fonction dans vercel.json.
const SM_ESC = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Une date de démarrage serveur ne constitue pas une date de modification.
const SM_STATIC = [
  ['/', '1.0'], ['/produits.html', '0.9'], ['/marques.html', '0.8'],
  ['/designers.html', '0.7'], ['/materiaux.html', '0.7'], ['/selection.html', '0.6'],
  ['/studio.html', '0.6'], ['/rendez-vous.html', '0.7'], ['/contact.html', '0.6'],
  ['/journal.html', '0.6'], ['/nuancier-fermob.html', '0.6'],
  ['/mentions-legales.html', '0.3'], ['/conditions-generales-de-vente.html', '0.3'],
  ['/politique-et-vie-privee.html', '0.3'], ['/politique-cookies.html', '0.3'],
];
// Date de dernière modification Shopify (AAAA-MM-JJ) ; absente plutôt qu'inventée.
const smDate = (iso) => (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : '');
const smUrl = (loc, priority, lastmod) =>
  `  <url><loc>${SM_ESC(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<priority>${priority}</priority></url>`;
const smUrlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?>\n`
  + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` + urls.join('\n') + `\n</urlset>\n`;
function sendXml(res, xml) {
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.set('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
  return res.send(xml);
}
router.get('/sitemap.xml', (req, res) => sendXml(res,
  `<?xml version="1.0" encoding="UTF-8"?>\n`
  + `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + `  <sitemap><loc>${ORIGIN}/sitemap-pages.xml</loc></sitemap>\n`
  + `  <sitemap><loc>${ORIGIN}/sitemap-products.xml</loc></sitemap>\n`
  + `</sitemapindex>\n`));
// Pages statiques + créateurs indexables + articles : aucun appel Shopify → instantané.
router.get('/sitemap-pages.xml', async (req, res) => {
  const urls = [];
  SM_STATIC.forEach(([p, pr]) => urls.push(smUrl(ORIGIN + p, pr)));
  // Créateurs visibles et portant au moins un produit publié.
  // Si l'index est inaccessible, la liste reste complète plutôt que de retirer des pages valides.
  const active = await activeDesignerSlugs({ patient: true });
  getDesigners().forEach((d) => {
    if (!d || !d.slug || d.hidden) return;
    if (active && !active.has(d.slug)) return;
    urls.push(smUrl(ORIGIN + '/produits.html?designer=' + encodeURIComponent(d.slug), '0.5'));
  });
  // Articles du journal (rendus depuis leur source, ADR 0013)
  await journalReady;
  articleSlugs().forEach((slug) => urls.push(smUrl(ORIGIN + '/journal/' + slug + '.html', '0.5')));
  return sendXml(res, smUrlset(urls));
});
// Le sitemap ne lit que les handles : les champs de carte et les 250 variantes
// par produit rendent le parcours complet trop lent lors d'un démarrage à froid.


// Toutes les fiches visibles par le canal Storefront + collections.
// URLs canoniques (seulement ?handle=). Caché 6 h.
router.get('/sitemap-products.xml', async (req, res) => {
  try {
    const xml = await cached('sitemap:products', async () => {
      const urls = [];
      let after = null;
      for (let i = 0; i < 60; i++) { // garde-fou
        const { nodes, pageInfo } = (await shopifyFetch(SITEMAP_PRODUCTS_QUERY, { after })).products;
        (nodes || []).forEach((prod) => {
          if (prod.handle) urls.push(smUrl(ORIGIN + '/produit.html?handle=' + encodeURIComponent(prod.handle), '0.8', smDate(prod.updatedAt)));
        });
        if (!pageInfo || !pageInfo.hasNextPage) break;
        if (i === 59) throw new Error('Catalogue trop grand pour le sitemap actuel');
        if (!pageInfo.endCursor) throw new Error('Curseur Shopify manquant pendant le parcours du sitemap');
        after = pageInfo.endCursor;
      }
      (await getCollections()).forEach((c) => {
        // Les familles éditoriales et les sélections composites ont leurs propres sources.
        if (Object.hasOwn(BRAND_COLLECTION_ALIASES, c.handle) || INTERNAL_COLLECTION.test(c.handle)) return;
        const composed = Object.hasOwn(families, c.handle) || Object.hasOwn(FAMILLES_RICHES, c.handle) || ['chaises', 'tables-outdoor', 'promotions'].includes(c.handle);
        if (c.handle && (c.hasProducts !== false || composed)) urls.push(smUrl(ORIGIN + '/collections/' + encodeURIComponent(c.handle), '0.6', smDate(c.updatedAt)));
      });
      return smUrlset(urls);
    }, 6 * 60 * 60 * 1000); // cache 6 h
    return sendXml(res, xml);
  } catch (err) {
    console.warn('[sitemap-products]', err.message);
    return res.status(500).send('');
  }
});

module.exports = router;
