require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');                 // natif — vérif HMAC des webhooks Shopify
const rateLimit = require('express-rate-limit');   // rate-limit anti-abus (in-memory, best-effort)

// ─── SHOPIFY STOREFRONT API ────────────────────────────
const SHOPIFY_STORE   = process.env.SHOPIFY_STORE_DOMAIN;    // e.g. mystore.myshopify.com
const SHOPIFY_TOKEN   = process.env.SHOPIFY_STOREFRONT_TOKEN; // public Storefront API token
const SHOPIFY_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10';
const SHOPIFY_URL     = SHOPIFY_STORE
  ? `https://${SHOPIFY_STORE}/api/${SHOPIFY_VERSION}/graphql.json`
  : null;

if (!SHOPIFY_URL || !SHOPIFY_TOKEN) {
  console.warn('Shopify non configure — SHOPIFY_STORE_DOMAIN ou SHOPIFY_STOREFRONT_TOKEN manquant dans .env\n');
}

async function shopifyFetch(query, variables = {}) {
  if (!SHOPIFY_URL) throw new Error('Shopify non configure — verifiez SHOPIFY_STORE_DOMAIN dans .env');
  const res = await fetch(SHOPIFY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify API ${res.status}: ${res.statusText}`);
  const { data, errors } = await res.json();
  if (errors?.length) throw new Error(errors.map(e => e.message).join('; '));
  return data;
}

// ─── CACHE (5 min TTL) ─────────────────────────────────
const _cache = {};
async function cached(key, fetcher, ttl = 300_000) {
  const now = Date.now();
  if (_cache[key] && _cache[key].expiry > now) return _cache[key].data;
  const data = await fetcher();
  _cache[key] = { data, expiry: now + ttl };
  return data;
}

const app  = express();
const PORT = process.env.PORT || 4000;

// Vercel place 1 proxy devant l'app → la vraie IP client est dans X-Forwarded-For.
// Sans ça, req.ip = IP du proxy (tous les clients confondus) et express-rate-limit
// lève une erreur de validation. Indispensable pour le rate-limit ci-dessous.
app.set('trust proxy', 1);

// The Mikadodeco storefront (v3/) is served at the site root.
// Old /v3/* links 301-redirect to the clean root path for backward-compat.
app.use('/v3', (req, res) => res.redirect(301, req.url && req.url !== '/' ? req.url : '/'));
// ─── SSR OPEN GRAPH (FICHES PRODUIT · COLLECTIONS/MARQUES · CRÉATEURS) ──
// Les robots d'aperçu social (WhatsApp/iMessage/Messenger/FB…) n'exécutent
// PAS le JS — un lien partagé doit donc déjà porter, dans le <head>, le bon
// titre + la bonne image. On enrichit ici le <head> côté serveur (title,
// description, Open Graph, Twitter, canonical) à partir des données Shopify /
// designers-data.json ; le corps de la page continue de s'hydrater en JS à
// l'identique (galerie, grille, fiche créateur, panier, JSON-LD client).
// Cache edge (s-maxage) → quasi-CDN après le 1er hit. vercel.json route
// /produit.html?handle=…, /collections/<handle> et /produits.html?designer=…
// vers cette fonction ; les autres modes tombent sur le fichier statique.
const ORIGIN = 'https://www.mikadodeco.be';
const OG_DEFAULT = ORIGIN + '/images/og-default.jpg';
const PRODUIT_TEMPLATE  = path.join(__dirname, 'v3', 'produit.html');
const PRODUITS_TEMPLATE = path.join(__dirname, 'v3', 'produits.html');
// Marques disposant d'un bandeau header (miroir EXACT de la map HEADERS de
// v3/produits.html). Pour elles, l'image OG = le bandeau de marque statique.
const BRAND_HEADERS = new Set(['fatboy', 'ferm-living', 'tradition', 'vitra', 'string-furniture', 'muuto', 'blomus']);

const ogEscape = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// URL absolue (les URLs Shopify CDN le sont déjà ; les chemins /images/… non ;
// une URL protocole-relative //host/… reçoit https:).
const absUrl = (u) => {
  if (!u) return '';
  const s = String(u);
  if (/^https?:\/\//i.test(s)) return s;
  if (s.charAt(0) === '/' && s.charAt(1) === '/') return 'https:' + s;
  return ORIGIN + (s.charAt(0) === '/' ? s : '/' + s);
};
// Description OG : espaces normalisés, tronquée ~200 (échappement plus tard).
function ogDesc(s) {
  let d = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  if (d.length > 200) d = d.slice(0, 199).trimEnd() + '…';
  return d;
}
// Enrichit le <head> d'un template : title + meta description + Open Graph +
// Twitter + canonical. Échappement attribut HTML. Retire le ratio
// og:image:width/height en dur (photos produit / bandeaux / portraits ne sont
// pas en 1.91:1). Mécanisme commun aux 3 types de page partageable.
// NB : les valeurs sont injectées via une FONCTION de remplacement (pas une
// chaîne) — String.replace interprète $$, $&, $`, $' dans une chaîne de
// remplacement ; une description/bio Shopify contenant « $$ » ou « 50$&… »
// corromprait le <head>. La forme `() => …` neutralise totalement ces motifs.
function renderWithOg(templateHtml, { title, description, image, url }) {
  const T = ogEscape(title), D = ogEscape(description), I = ogEscape(image), U = ogEscape(url);
  let html = templateHtml
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${T}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, () => `<meta name="description" content="${D}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, () => `<meta property="og:title" content="${T}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, () => `<meta property="og:description" content="${D}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, () => `<meta property="og:url" content="${U}" />`)
    .replace(/<meta property="og:image" content="[^"]*"\s*\/>/, () => `<meta property="og:image" content="${I}" />`)
    // Le ratio en dur (1200×630) ne correspond pas aux visuels → on le retire.
    .replace(/\s*<meta property="og:image:width" content="[^"]*"\s*\/>/, '')
    .replace(/\s*<meta property="og:image:height" content="[^"]*"\s*\/>/, '')
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, () => `<meta name="twitter:title" content="${T}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, () => `<meta name="twitter:description" content="${D}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/, () => `<meta name="twitter:image" content="${I}" />`);
  // Canonical propre (URL sans params de filtre/from) : remplace un
  // <link rel="canonical"> statique s'il existe, sinon l'injecte juste après
  // og:url. (Les templates posent aussi le canonical en JS, qui réutilise ce
  // même tag via querySelector → jamais de double canonical.)
  if (/<link rel="canonical"[^>]*>/i.test(html)) {
    html = html.replace(/<link rel="canonical"[^>]*>/i, () => `<link rel="canonical" href="${U}" />`);
  } else {
    html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, (m) => `${m}\n  <link rel="canonical" href="${U}" />`);
  }
  return html;
}
function sendTemplate(res, file) {
  // Template générique inchangé (pas de paramètre / introuvable / erreur). Jamais 500.
  try {
    res.set('Content-Type', 'text/html; charset=utf-8');
    return res.send(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return res.sendFile(file);
  }
}
const sendProduitTemplate  = (res) => sendTemplate(res, PRODUIT_TEMPLATE);
const sendProduitsTemplate = (res) => sendTemplate(res, PRODUITS_TEMPLATE);
function ogCache(res) {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
}
// designers-data.json mis en cache module — on ne mémorise QUE le succès non
// vide : un échec de lecture transitoire (cold start, bundle partiel) renvoie
// [] sans être figé, et la lecture suivante réessaie (≠ d'un [] collant).
let _designers = null;
function getDesigners() {
  if (_designers) return _designers;
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'v3', 'designers-data.json'), 'utf8'));
    const arr = Array.isArray(data) ? data : (data.designers || []);
    if (arr.length) _designers = arr;
    return arr;
  } catch (e) {
    return [];
  }
}
// ─── Fiche produit : /produit.html?handle=<handle> (B7) ─
app.get('/produit.html', async (req, res) => {
  const handle = req.query.handle;
  if (!handle) return sendProduitTemplate(res);
  try {
    const product = await getProductByHandle(handle);
    // Miss stable (produit inexistant/dépublié) : on cache aussi le repli pour
    // ne pas ré-invoquer la fonction à chaque bot. (Les erreurs Shopify partent
    // dans le catch ci-dessous, sans cache.)
    if (!product) { ogCache(res); return sendProduitTemplate(res); }

    const name     = product.name || 'Produit';
    const brand    = product.brand || '';
    const designer = product.designer || '';
    const title = `${name} · Mikadodeco`;
    const description = ogDesc(`${name}${brand ? ' — ' + brand : ''}. `
      + (designer ? `Dessiné par ${designer}. ` : '')
      + 'Pièce design à voir en boutique à Uccle, livraison en Belgique.');
    // Première image produit NON redimensionnée (firstImageRaw), en absolu, en
    // ajoutant &width=1200 → JPEG (pas de format=webp : meilleur support og:image
    // par les scrapers sociaux). images[] est désormais en webp pour la galerie,
    // donc on ne le réutilise plus ici. Repli og-default.
    const raw = product.firstImageRaw || '';
    const image = raw ? raw + (raw.includes('?') ? '&' : '?') + 'width=1200' : OG_DEFAULT;
    const url = ORIGIN + '/produit.html?handle=' + encodeURIComponent(handle);

    const html = renderWithOg(fs.readFileSync(PRODUIT_TEMPLATE, 'utf8'), { title, description, image, url });
    // SEO · Product JSON-LD en SSR (remplace l'IIFE JS de produit.html) — un seul
    // schéma, visible des crawlers sans exécution JS. Prix/dispo depuis le produit.
    const ld = {
      "@context": "https://schema.org", "@type": "Product", "name": name,
      ...(brand ? { brand: { "@type": "Brand", "name": brand } } : {}),
      ...(image ? { image } : {}),
      "offers": {
        "@type": "Offer", "priceCurrency": "EUR",
        ...(product.priceMin != null ? { price: String(product.priceMin) } : {}),
        "availability": product.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "url": url
      }
    };
    const ldTag = `<script type="application/ld+json">` + JSON.stringify(ld).replace(/</g, '\\u003c') + `</script>`;
    const out = html.replace('</head>', ldTag + '\n</head>');
    ogCache(res);
    return res.send(out);
  } catch (err) {
    console.warn('[og-produit]', err.message);
    return sendProduitTemplate(res);
  }
});

// ─── Collection / marque : /collections/<handle> ───────
// Nom + description + image via getCollections() (caché). Image par priorité :
// bandeau de marque statique (BRAND_HEADERS) → image Shopify de la collection →
// og-default. Collection inconnue → template générique inchangé (jamais 500).
app.get('/collections/:handle', async (req, res) => {
  const handle = String(req.params.handle || '').toLowerCase();
  try {
    const collections = await getCollections();
    const col = collections.find((c) => c.handle === handle);
    // Miss stable (handle hors catalogue, ex. /collections/all) : repli cachable.
    if (!col) { ogCache(res); return sendProduitsTemplate(res); }

    const name = col.name || 'Catalogue';
    const title = `${name} — Mikadodeco Bruxelles`;
    const description = ogDesc(
      col.description && col.description.trim()
        ? col.description
        : `${name} chez Mikadodeco — sélection design. Retrait à Uccle, livraison en Belgique.`
    );
    const image = BRAND_HEADERS.has(handle)
      ? `${ORIGIN}/images/brands/headers/${handle}-1920.jpg`
      : (col.image ? absUrl(col.image) : OG_DEFAULT);
    const url = ORIGIN + '/collections/' + encodeURIComponent(handle);

    const html = renderWithOg(fs.readFileSync(PRODUITS_TEMPLATE, 'utf8'), { title, description, image, url });
    ogCache(res);
    return res.send(html);
  } catch (err) {
    console.warn('[og-collection]', err.message);
    return sendProduitsTemplate(res);
  }
});

// ─── Créateur : /produits.html?designer=<slug> ─────────
// Nom + bio + portrait via designers-data.json (caché). Sans ?designer (ou
// modes catalogue / ?cats= / ?brand=) → template générique. Designer inconnu →
// template générique. ~29 créateurs sans photo → repli og-default.
app.get('/produits.html', async (req, res) => {
  const slug = req.query.designer ? String(req.query.designer).toLowerCase() : '';
  if (!slug) return sendProduitsTemplate(res);
  try {
    const designer = getDesigners().find((d) => String(d.slug || '').toLowerCase() === slug);
    // Miss stable (slug inconnu) : repli cachable.
    if (!designer) { ogCache(res); return sendProduitsTemplate(res); }

    const name = designer.name || 'Créateur';
    const title = `${name} — Mikadodeco Bruxelles`;
    const description = ogDesc(
      designer.bio && designer.bio.trim()
        ? designer.bio
        : `Les pièces signées ${name} chez Mikadodeco. Retrait à Uccle, livraison en Belgique.`
    );
    const image = designer.photo ? absUrl(designer.photo) : OG_DEFAULT;
    const url = ORIGIN + '/produits.html?designer=' + encodeURIComponent(designer.slug || slug);

    const html = renderWithOg(fs.readFileSync(PRODUITS_TEMPLATE, 'utf8'), { title, description, image, url });
    ogCache(res);
    return res.send(html);
  } catch (err) {
    console.warn('[og-designer]', err.message);
    return sendProduitsTemplate(res);
  }
});

// ─── SEO: sitemap dynamique ────────────────────────────
// Remplace l'ancien v3/sitemap.xml statique (~24 URLs, sans produits) par un
// sitemap généré : toutes les fiches produit (walk paginé, getProducts() étant
// plafonné à 250) + collections + créateurs indexables + articles + pages
// statiques. URLs absolues et canoniques (aucun paramètre de filtre, seulement
// ?handle= et ?designer=). Caché 6 h. Routé vers la fonction dans vercel.json.
app.get('/sitemap.xml', async (req, res) => {
  try {
    const xml = await cached('sitemap:xml', async () => {
      const urls = [];
      const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const add = (loc, priority) => urls.push(`  <url><loc>${esc(loc)}</loc><priority>${priority}</priority></url>`);

      // a) Pages statiques
      const STATIC = [
        ['/', '1.0'], ['/produits.html', '0.9'], ['/marques.html', '0.8'],
        ['/designers.html', '0.7'], ['/materiaux.html', '0.7'], ['/selection.html', '0.6'],
        ['/studio.html', '0.6'], ['/rendez-vous.html', '0.7'], ['/contact.html', '0.6'],
        ['/journal.html', '0.6'], ['/nuancier-fermob.html', '0.6'],
        ['/mentions-legales.html', '0.3'], ['/conditions-generales-de-vente.html', '0.3'],
        ['/politique-et-vie-privee.html', '0.3'], ['/politique-cookies.html', '0.3'],
      ];
      STATIC.forEach(([p, pr]) => add(ORIGIN + p, pr));

      // b) TOUTES les fiches produit — walk paginé (getProducts() plafonné à 250)
      let after = null;
      for (let i = 0; i < 60; i++) { // garde-fou
        const { items, pageInfo } = await getProductsPage(100, after, null, null);
        (items || []).forEach((prod) => {
          if (prod.handle) add(ORIGIN + '/produit.html?handle=' + encodeURIComponent(prod.handle), '0.8');
        });
        if (!pageInfo || !pageInfo.hasNextPage) break;
        after = pageInfo.endCursor;
      }

      // c) Collections
      (await getCollections()).forEach((c) => {
        if (c.handle) add(ORIGIN + '/collections/' + encodeURIComponent(c.handle), '0.6');
      });

      // d) Créateurs — uniquement les indexables (champ `hidden` dans
      //    designers-data.json) pour éviter le thin content / les fiches masquées.
      getDesigners().forEach((d) => {
        if (d && d.slug && !d.hidden) add(ORIGIN + '/produits.html?designer=' + encodeURIComponent(d.slug), '0.5');
      });

      // e) Articles du journal (HTML pré-rendus)
      try {
        fs.readdirSync(path.join(__dirname, 'v3', 'journal'))
          .filter((f) => f.endsWith('.html'))
          .forEach((f) => add(ORIGIN + '/journal/' + f, '0.5'));
      } catch (e) { /* dossier absent du bundle → includeFiles v3/journal/** */ }

      return `<?xml version="1.0" encoding="UTF-8"?>\n`
           + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
           + urls.join('\n') + `\n</urlset>\n`;
    }, 6 * 60 * 60 * 1000); // cache 6 h

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
    return res.send(xml);
  } catch (err) {
    console.warn('[sitemap]', err.message);
    return res.status(500).send('');
  }
});

app.use(express.static(path.join(__dirname, 'v3')));
app.use(cors({ origin: process.env.BASE_URL || `http://localhost:${PORT}` }));
// Capture le corps brut (req.rawBody) pour la vérification HMAC des webhooks
// Shopify (calculée sur le body brut, pas le JSON parsé). Comportement JSON
// identique pour tous les autres endpoints.
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));

// ─── RATE-LIMIT ANTI-ABUS (in-memory, best-effort par instance serverless) ──
// CAVEAT serverless : sur Vercel le store est par-instance et remis à zéro à
// chaque cold start ; plusieurs instances ne partagent pas le compteur. Stoppe
// le spam naïf (matraquage d'une instance chaude), pas une attaque distribuée.
// Version distribuée (Vercel KV / Upstash) = évolution ultérieure si besoin.
const formLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,           // 10 min
  max: 5,                             // 5 soumissions / IP / fenêtre (contact, newsletter)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});
const cartLimiter = rateLimit({
  windowMs: 60 * 1000,                // 1 min
  max: 30,                            // 30 calculs panier / IP / min (le front debounce déjà)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});

// ─── SHOPIFY: PRODUCTS QUERY ───────────────────────────
// Metafields must be enabled in Shopify admin → Settings → Custom data → Products
// Namespaces used: "custom" — keys: designer, year, material, dimensions, lead_time, subcategory
const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      pageInfo { hasNextPage endCursor }
      edges {
        cursor
        node {
          id
          handle
          title
          vendor
          productType
          description
          tags
          availableForSale
          totalInventory
          collections(first: 20) {
            edges { node { handle } }
          }
          featuredImage { url altText }
          images(first: 8) {
            edges { node { url altText } }
          }
          priceRange {
            minVariantPrice { amount currencyCode }
            maxVariantPrice { amount currencyCode }
          }
          variants(first: 250) {
            edges {
              node {
                id
                title
                price { amount currencyCode }
                availableForSale
                selectedOptions { name value }
                image { url altText }
              }
            }
          }
          metafields(identifiers: [
            { namespace: "custom", key: "designer" }
            { namespace: "custom", key: "year" }
            { namespace: "custom", key: "material" }
            { namespace: "custom", key: "dimensions" }
            { namespace: "custom", key: "lead_time" }
            { namespace: "custom", key: "subcategory" }
          ]) {
            key
            value
          }
        }
      }
    }
  }
`;

// Boutique-de-quartier delivery promise: a single, honest baseline applies
// to anything that has to be ordered from a supplier (which is most of the
// catalog). Items physically in stock at the boutique are flagged via the
// Shopify inventory and shipped fast. Anything genuinely outside this
// promise (Fermob peak season, Kriptonite, Charolles, Treku, etc.) gets a
// `delai-long` product tag in Shopify → we fall back to a generic
// "délai sur demande" line and confirm by mail/phone after the order.
const DELIVERY_DEFAULT = '3-4 semaines';
const DELIVERY_LONG    = 'délai sur demande';

// Map fine-grained Shopify product types (Fermob/HAY use FR labels) to the
// 6 top-level frontend categories. Anything unmatched falls through to "objets".
const CATEGORY_MAP = {
  assises:    ['chaise', 'chaise haute', 'fauteuil', 'fauteuil à bascule', 'banc', 'tabouret', 'pouf', 'repose-pieds'],
  tables:     ['table', 'table basse', 'table à rallonge'],
  luminaires: ['applique', 'lampadaire', 'lampe baladeuse', 'lampe de bureau', 'lampe de chevet', 'lampe de table', 'lampe à pince', 'pied de lampe'],
  rangements: ['caisse de rangement', 'patère'],
  exterieur:  ['accessoires de grill extérieur', 'housse de protection', 'jardinière'],
};
const TYPE_TO_CATEGORY = Object.entries(CATEGORY_MAP).reduce((acc, [cat, types]) => {
  types.forEach(t => { acc[t] = cat; });
  return acc;
}, {});

// Shopify's CDN resizes + reformats images on the fly via URL params, but
// does NOTHING by default: it hands us the full-res original. For product
// CARDS (1:1, rendered ≈300px CSS / 600px retina) that's megabytes wasted.
// shopifyResize() appends `width=<w>&format=webp` so the CDN returns a
// card-sized WebP instead. Two gotchas baked in here:
//   1. `format=webp` is REQUIRED — `width=` alone still serves JPEG.
//   2. These URLs already carry a `?v=…` cache-buster, so we must join with
//      `&` when a query already exists (`?` otherwise), never blindly with `?`.
// Only cdn.shopify.com URLs are touched; local /images/… assets pass through
// untouched. The PDP gallery (images[]) + variant images resize to
// PDP_IMAGE_WIDTH, and the gallery thumbnail strip (thumbs[]) to PDP_THUMB_WIDTH
// — the most-visited page no longer ships multi-MB originals.
function shopifyResize(url, width) {
  if (!url || typeof url !== 'string' || !url.includes('cdn.shopify.com')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}width=${width}&format=webp`;
}

// Target width (px) for the 1:1 product-card thumbnail. ~300px CSS box on the
// PLP/home grids, doubled for retina. Bumping this is the single knob for card
// image sharpness vs. weight.
const CARD_IMAGE_WIDTH = 600;

// PDP gallery widths. PDP_IMAGE_WIDTH = the DEFAULT (src) width of the main
// product image; the front layers a srcset on top (800/1280/2048w) so large
// retina desktops stay sharp and phones stay light — this 1400px value is just
// the no-srcset fallback. Gallery images[] AND variant images resize to it (the
// front's URL matching strips the query, so any width still matches).
// PDP_THUMB_WIDTH = the 74px thumbnail strip under the main (×~3 for retina).
const PDP_IMAGE_WIDTH = 1400;
const PDP_THUMB_WIDTH = 240;

function mapProduct(node, opts = {}) {
  // `full` adds PDP-only fields (gallery thumbs[]) that list endpoints don't read,
  // so PLP/home/collection payloads stay lean. firstImageRaw stays ungated (1 url).
  const full = opts.full === true;
  const meta = {};
  (node.metafields || []).filter(Boolean).forEach(m => { if (m) meta[m.key] = m.value; });
  const variant = node.variants.edges[0]?.node;
  // `price` is the first variant's price (what gets stored in the cart when
  // adding from a product card). `priceMin` / `priceMax` come from Shopify's
  // priceRange and cover every variant. The front-end shows "À partir de"
  // when priceMin < priceMax.
  const price    = parseFloat(variant?.price?.amount || node.priceRange.minVariantPrice.amount);
  const priceMin = parseFloat(node.priceRange.minVariantPrice.amount);
  const priceMax = parseFloat(node.priceRange.maxVariantPrice?.amount || node.priceRange.minVariantPrice.amount);
  // Tags: use "badge:nouveau", "badge:limite", "badge:bestseller", "featured" conventions
  const badgeTag = node.tags.find(t => t.startsWith('badge:'))?.replace('badge:', '') || null;
  const rawType  = (node.productType || '').toLowerCase().trim();
  return {
    id:          node.id,
    handle:      node.handle || '',
    variantId:   variant?.id || null,
    name:        node.title,
    brand:       node.vendor || '',
    designer:    meta.designer    || '',
    year:        meta.year        ? parseInt(meta.year) : null,
    category:    TYPE_TO_CATEGORY[rawType] || 'objets',
    productType: rawType,
    subcategory: meta.subcategory || node.tags.find(t => t.startsWith('sub:'))?.replace('sub:', '') || '',
    material:    meta.material    || '',
    dimensions:  meta.dimensions  || '',
    // Caractéristiques PDP additionnelles (métafields custom.* — vides tant que
    // l'importer Shopify n'a pas créé+rempli les définitions ; lues seulement par
    // PRODUCT_QUERY → s'affichent toutes seules une fois remplies, sans déploiement).
    usage:       meta.usage       || '',
    entretien:   meta.entretien   || '',
    origin:      meta.origin      || '',
    weight:      meta.weight      || '',
    warranty:    meta.warranty    || '',
    price,
    priceMin,
    priceMax,
    // Availability badge — "À voir en boutique" when the article is
    // physically present (regardless of finish/colour — it's an invitation
    // to come see the model, not a real-time stock count). Anything else
    // ships from the supplier under the standard promise.
    inStock:     (typeof node.totalInventory === 'number') && node.totalInventory > 0,
    longDelay:   node.tags.some(t => /^delai[-_ ]?long$/i.test(t)),
    leadTimeLabel: node.tags.some(t => /^delai[-_ ]?long$/i.test(t)) ? DELIVERY_LONG : DELIVERY_DEFAULT,
    // Raw Shopify tags exposed so the front can react to product flags
    // (e.g. `delai-long`, `badge:nouveau`) without an extra API.
    tags:        node.tags || [],
    // Shopify collection handles this product belongs to. Lets the front
    // render true collection pages (Mobilier d'extérieur…) instead of
    // tag-filtered catalog views.
    collections: (node.collections?.edges || []).map(e => e?.node?.handle).filter(Boolean),
    // (kept for backward compat with the PDP metafield — separate from brand lead-time)
    leadTime:    meta.lead_time   || '',
    description: node.description || '',
    // Card thumbnail → card-width WebP. The full-res original still feeds the
    // PDP through images[]/variant images below (left untouched on purpose).
    image:       shopifyResize(node.featuredImage?.url || node.images?.edges?.[0]?.node?.url || '', CARD_IMAGE_WIDTH),
    // image2 = first image that isn't the featured one — used for on-hover swap.
    // Dedup runs on the RAW urls; only the chosen url is resized afterwards.
    image2:      (() => {
      const featured = node.featuredImage?.url;
      const imgs = (node.images?.edges || []).map(e => e?.node?.url).filter(Boolean);
      const second = imgs.find(u => u !== featured) || imgs[1] || null;
      return second ? shopifyResize(second, CARD_IMAGE_WIDTH) : null;
    })(),
    // images = ordered list for the PDP gallery main image — resized webp. Stays
    // index-parallel to thumbs[] below (same source/order/filter) so the front
    // maps a clicked thumbnail back to its full-width image by index.
    images:      (node.images?.edges || []).map(e => shopifyResize(e?.node?.url, PDP_IMAGE_WIDTH)).filter(Boolean),
    // thumbs[] (gallery strip, ~8 urls/produit) n'est lu que par la PDP → gated
    // derrière `full` pour ne pas alourdir les réponses liste (PLP/accueil/collections).
    ...(full ? { thumbs: (node.images?.edges || []).map(e => shopifyResize(e?.node?.url, PDP_THUMB_WIDTH)).filter(Boolean) } : {}),
    // firstImageRaw = première image NON redimensionnée (1 url, ungated). La route
    // SSR OG/JSON-LD s'en sert : elle veut un JPEG (scrapers sociaux gèrent mal le
    // WebP en og:image) à sa propre largeur — découplé de images[] (webp galerie).
    firstImageRaw: (node.images?.edges?.[0]?.node?.url) || '',
    // variants = all variants with their selected options, used by the PDP variant picker.
    // Variant image resized to PDP_IMAGE_WIDTH — SAME width as the gallery, so the
    // front's URL matching (active thumb / variant switch) keeps resolving.
    variants:    (node.variants?.edges || []).map(e => e?.node).filter(Boolean).map(v => ({
      id: v.id,
      title: v.title,
      sku: v.sku || '',
      price: parseFloat(v.price?.amount),
      available: v.availableForSale,
      // Vrai stock disponible (Storefront) — distinct de availableForSale qui reste
      // true en oversell (inventoryPolicy: CONTINUE). null si le scope ne l'expose pas.
      qty: v.quantityAvailable ?? null,
      options: (v.selectedOptions || []).map(o => ({ name: o.name, value: o.value })),
      image: shopifyResize(v.image?.url || null, PDP_IMAGE_WIDTH),
    })),
    badge:       badgeTag,
    available:   node.availableForSale && (variant?.availableForSale ?? true),
    featured:    node.tags.some(t => t.toLowerCase() === 'featured'),
  };
}

// Maps ONE product reference (from a Search & Discovery recommendation
// metafield) to the card shape productCard() expects. Lighter than mapProduct:
// only the fields a card renders (image resized to card width, price range,
// first-variant id for add-to-cart, availability). The relations themselves
// live in Shopify — nothing here is hardcoded.
function mapProductRef(n) {
  if (!n) return null;
  const v = n.variants?.nodes?.[0];
  const tags = n.tags || [];
  const longDelay = tags.some(t => /^delai[-_ ]?long$/i.test(t));
  const featured = n.featuredImage?.url;
  const imgs = (n.images?.nodes || []).map(i => i?.url).filter(Boolean);
  const second = imgs.find(u => u !== featured) || imgs[1] || null;
  const priceMin = parseFloat(n.priceRange?.minVariantPrice?.amount ?? v?.price?.amount ?? 0);
  const priceMax = parseFloat(n.priceRange?.maxVariantPrice?.amount ?? priceMin);
  // Parité visuelle avec les cartes du catalogue : on émet les MÊMES champs que
  // productCard lit via mapProduct — disponibilité/délai HONNÊTES (longDelay /
  // leadTimeLabel, sinon un article delai-long afficherait à tort « Livraison
  // 3-4 semaines »), image de survol (image2) et badge éditorial. Seul le badge
  // « X finitions » est omis : le calculer imposerait variants(first:250) ×
  // jusqu'à 24 références, un coût Storefront disproportionné pour cette section.
  return {
    id:        n.id,
    handle:    n.handle || '',
    variantId: v?.id || null,
    name:      n.title,
    brand:     n.vendor || '',
    price:     parseFloat(v?.price?.amount ?? priceMin),
    priceMin,
    priceMax,
    image:     shopifyResize(featured || '', CARD_IMAGE_WIDTH),
    image2:    second ? shopifyResize(second, CARD_IMAGE_WIDTH) : null,
    badge:     tags.find(t => t.startsWith('badge:'))?.replace('badge:', '') || null,
    inStock:   (typeof n.totalInventory === 'number') && n.totalInventory > 0,
    longDelay,
    leadTimeLabel: longDelay ? DELIVERY_LONG : DELIVERY_DEFAULT,
    available: n.availableForSale && (v?.availableForSale ?? true),
  };
}

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
const CATEGORY_FILTERS = {
  'accessoires-jardin': '(product_type:"Arrosoir" OR product_type:"Mangeoire à oiseaux")',
  'appliques': '(product_type:"Applique")',
  'bains-de-soleil-transats': '(product_type:"Bain de soleil" OR product_type:"Transat" OR product_type:"Hamac")',
  'bougeoirs-bougies-photophores': '(product_type:"Bougeoir" OR product_type:"Bougie" OR product_type:"Bougie parfumée" OR product_type:"Photophore" OR product_type:"Chandelier" OR product_type:"Petite bougie parfumée")',
  'brasero-barbecue': '(product_type:"Brasero" OR product_type:"Barbecue" OR product_type:"Gril" OR product_type:"Accessoires de grill extérieur")',
  'bureaux': '(product_type:"Bureau")',
  'cache-pots-jardinieres': '(product_type:"Cache-pot" OR product_type:"Cache-pot grand" OR product_type:"Cache-pot moyen" OR product_type:"Cache-pot petit" OR product_type:"Cache-pot stoneware" OR product_type:"Jardinière")',
  'canapes': '(product_type:"Canapé" OR product_type:"Banquette")',
  'chaises': '(product_type:"Chaise" OR product_type:"Chaise de bar" OR product_type:"Chaise enfant" OR product_type:"Chaise haute")',
  'chaises-longues': '(product_type:"Chaise longue" OR product_type:"Bain de soleil" OR product_type:"Transat")',
  'commodes-et-buffets': '(product_type:"Commode" OR product_type:"Buffet")',
  'coussins-plaids-tapis': '(product_type:"Coussin" OR product_type:"Tapis" OR product_type:"Couvre-lit" OR product_type:"Plaid")',
  'couverts': '(product_type:"Couverts" OR product_type:"Couteau" OR product_type:"Couteau de table" OR product_type:"Fourchette" OR product_type:"Fourchette de table" OR product_type:"Cuiller" OR product_type:"Cuiller de table" OR product_type:"Cuillère" OR product_type:"Cuillère de service" OR product_type:"Cuillère de table")',
  'dessertes-et-chariots': '(product_type:"Desserte" OR product_type:"Chariot")',
  'etageres-et-bibliotheques': '(vendor:"String Furniture" OR product_type:"Étagère" OR product_type:"Etagère" OR product_type:"Bibliothèque")',
  'fauteuils': '(product_type:"Fauteuil")',
  'lampadaires': '(product_type:"Lampadaire")',
  'lampes-de-bureau': '(product_type:"Lampe de bureau" OR product_type:"Lampe à pince")',
  'lampes-de-table': '(product_type:"Lampe" OR product_type:"Lampe de table" OR product_type:"Lampe de chevet")',
  'lampes-nomades': '(product_type:"Lampe baladeuse")',
  'miroirs': '(product_type:"Miroir" OR product_type:"Miroir cosmétique" OR product_type:"Miroir cosmétique LED" OR product_type:"Miroir cosmétique LED mural")',
  'mugs-tasses-cafe': '(product_type:"Mug" OR product_type:"Mug à café" OR product_type:"Mug à cappuccino" OR product_type:"Mug à latte" OR product_type:"Mug à thé" OR product_type:"Tasse" OR product_type:"Cafétière" OR product_type:"Cafétière espresso")',
  'objets-decoratifs-cadres': '(product_type:"Cadre" OR product_type:"Figurine" OR product_type:"Mobile" OR product_type:"Centre de table" OR product_type:"Cube décoratif" OR product_type:"Horloge")',
  'paniers-et-corbeilles': '(product_type:"Panier" OR product_type:"Panier de rangement" OR product_type:"Corbeille" OR product_type:"Caisse de rangement")',
  'parasols-ombrages': '(product_type:"Parasol" OR product_type:"Paravent")',
  'pateres-et-porte-manteaux': '(product_type:"Patère" OR product_type:"Patère murale" OR product_type:"Cintre" OR product_type:"Porte-manteau")',
  'sieges-de-bureau': '(product_type:"Chaise de bureau" OR product_type:"Fauteuil de bureau" OR product_type:"Siège de bureau")',
  'suspensions': '(product_type:"Suspension")',
  'tables-basses-et-tables-dappoint': '(product_type:"Table basse" OR product_type:"Table d\'appoint" OR product_type:"Table de chevet" OR product_type:"Sellette")',
  'tables-de-cafe': '(product_type:"Table de café" OR product_type:"Table de bistro" OR title:Bistro)',
  'tables-de-salle-a-manger': '(product_type:"Table à manger" OR product_type:"Table de salle à manger" OR product_type:"Mange-debout")',
  'tabourets-et-bancs': '(product_type:"Tabouret" OR product_type:"Tabouret de bar" OR product_type:"Banc" OR product_type:"Repose-pieds")',
  'ustensiles-cuisine': '(product_type:"Casserole" OR product_type:"Cocotte" OR product_type:"Faitout" OR product_type:"Bloc couteaux" OR product_type:"Coupe-fromage" OR product_type:"Plateau")',
  'vaisselle-assiettes': '(product_type:"Assiette" OR product_type:"Assiette creuse" OR product_type:"Assiette plate" OR product_type:"Assiette à dessert" OR product_type:"Bol" OR product_type:"Bol de service" OR product_type:"Plat" OR product_type:"Saladier" OR product_type:"Coupelle")',
  'vases': '(product_type:"Vase")',
  'verres-carafes': '(product_type:"Verre" OR product_type:"Carafe" OR product_type:"Carafe isotherme" OR product_type:"Pichet" OR product_type:"Pichet à eau" OR product_type:"Pichet à lait" OR product_type:"Flûte" OR product_type:"Flûte à champagne" OR product_type:"Decanter" OR product_type:"Huilier")',
};

async function getProductsPage(first, after, tags, cats) {
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
  // tags (designer) and cats (catalog panel) are independent in practice;
  // if both are ever sent, intersect them (AND). Otherwise use whichever.
  const query = (tagQuery && catQuery) ? `(${tagQuery}) AND (${catQuery})`
              : (tagQuery || catQuery || null);
  const key = `products:page:${f}:${a || 'first'}`
            + (sortedTags.length ? ':tags-' + sortedTags.join(',') : '')
            + (sortedCats.length ? ':cats-' + sortedCats.join(',') : '');
  return cached(key, async () => {
    const data  = await shopifyFetch(PRODUCTS_QUERY, { first: f, after: a, query });
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

// ─── SHOPIFY: COLLECTIONS QUERY ────────────────────────
// Real Shopify collections (product lines like Palissade, Bistro, Luxembourg…).
// Optional metafields: custom.country, custom.city, custom.founded, custom.website,
// custom.tagline, custom.color, custom.featured
const COLLECTIONS_QUERY = `
  query GetCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          image { url altText }
          metafields(identifiers: [
            { namespace: "custom", key: "country" }
            { namespace: "custom", key: "city" }
            { namespace: "custom", key: "founded" }
            { namespace: "custom", key: "website" }
            { namespace: "custom", key: "tagline" }
            { namespace: "custom", key: "color" }
            { namespace: "custom", key: "featured" }
          ]) {
            key
            value
          }
        }
      }
    }
  }
`;

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
    website:     meta.website   || '',
    image:       node.image?.url || null,
    color:       meta.color     || '#d4c5b0',
    featured:    meta.featured  === 'true',
    order:       index,
  };
}

async function getCollections() {
  return cached('collections', async () => {
    // Shopify shop currently has 147 collections; 250 leaves headroom
    // without needing pagination.
    const data = await shopifyFetch(COLLECTIONS_QUERY, { first: 250 });
    return data.collections.edges
      .map(({ node }, i) => mapCollection(node, i))
      // Exclude Shopify's built-in "All" / "Home page" collections
      .filter(c => !['all', 'frontpage'].includes(c.handle));
  });
}

// ─── API: GET PRODUCTS ─────────────────────────────────
// Two modes:
//   GET /api/products                              → legacy array (≤ 250 products)
//     consumed by home (main.js), selection, produit, internal getPromos
//   GET /api/products?paginated=1&limit=50&cursor= → { items, pageInfo }
//     consumed by the new PLP at /produits.html
// The legacy shape is contractual — 4 callers depend on it.
app.get('/api/products', async (req, res) => {
  try {
    const { paginated, cursor, limit, tags, cats } = req.query;
    if (paginated || cursor || limit || tags || cats) {
      const page = await getProductsPage(limit, cursor, tags, cats);
      return res.json(page);
    }
    const products = await getProducts();
    res.json(products);
  } catch (err) {
    console.error('Products error:', err.message);
    res.status(500).json({ error: 'Impossible de charger les produits.' });
  }
});

// ─── API: GET BRANDS ───────────────────────────────────
// Derived from product.vendor — returns one entry per unique vendor.
app.get('/api/brands', async (req, res) => {
  try {
    const brands = await getBrands();
    res.json(brands);
  } catch (err) {
    console.error('Brands error:', err.message);
    res.status(500).json({ error: 'Impossible de charger les marques.' });
  }
});

// ─── SHOPIFY: MAIN MENU QUERY ──────────────────────────
// Drives the site nav top-level + the Mobilier mega menu sub-items
// + the Marques dropdown. Handle "main-menu" is the default Shopify
// "Menu principal" (Online Store → Navigation). Cyril edits libellés
// / ordre / sub-items from the Shopify admin; the site picks it up
// at the next /api/menu cache refresh (5 min TTL).
const MENU_QUERY = `
  query GetMainMenu {
    menu(handle: "main-menu") {
      items {
        title
        url
        items {
          title
          url
          items {
            title
            url
          }
        }
      }
    }
  }
`;

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

async function getMenu() {
  return cached('menu', async () => {
    const data = await shopifyFetch(MENU_QUERY);
    const items = mapMenuItems(data?.menu?.items || []);
    return { ok: true, items };
  });
}

// ─── API: MAIN MENU ────────────────────────────────────
// Used by the nav widget (mega menu + dropdown). On upstream failure
// returns { ok: false, items: [] } — the client falls back to its
// hardcoded top-level. We never 500 on this endpoint: the nav is
// global and must not surface as a broken request.
app.get('/api/menu', async (req, res) => {
  try {
    res.json(await getMenu());
  } catch (err) {
    console.warn('Menu fetch failed:', err.message);
    res.json({ ok: false, items: [] });
  }
});

// ─── API: GET COLLECTIONS ──────────────────────────────
// Real Shopify collections (product lines: Palissade, Bistro, Luxembourg…).
app.get('/api/collections', async (req, res) => {
  try {
    const collections = await getCollections();
    res.json(collections);
  } catch (err) {
    console.error('Collections error:', err.message);
    res.status(500).json({ error: 'Impossible de charger les collections.' });
  }
});

// ─── SHOPIFY: COLLECTION PRODUCTS QUERY ────────────────
// Drives /collections/<handle> pages. We query Shopify directly by
// handle so the products are pre-filtered server-side — the V1 bug
// (PLP grid empty on most collections) came from client-side filtering
// a too-small 250-product window.
const COLLECTION_PRODUCTS_QUERY = `
  query GetCollectionProducts($handle: String!, $first: Int!, $after: String, $filters: [ProductFilter!]) {
    collection(handle: $handle) {
      title
      description
      image { url altText }
      products(first: $first, after: $after, filters: $filters) {
        pageInfo { hasNextPage endCursor }
        edges {
          cursor
          node {
            id
            handle
            title
            vendor
            productType
            description
            tags
            availableForSale
            totalInventory
            collections(first: 20) { edges { node { handle } } }
            featuredImage { url altText }
            images(first: 8) { edges { node { url altText } } }
            priceRange {
              minVariantPrice { amount currencyCode }
              maxVariantPrice { amount currencyCode }
            }
            variants(first: 250) {
              edges {
                node {
                  id
                  title
                  price { amount currencyCode }
                  availableForSale
                  selectedOptions { name value }
                  image { url altText }
                }
              }
            }
            metafields(identifiers: [
              { namespace: "custom", key: "designer" }
              { namespace: "custom", key: "year" }
              { namespace: "custom", key: "material" }
              { namespace: "custom", key: "dimensions" }
              { namespace: "custom", key: "lead_time" }
              { namespace: "custom", key: "subcategory" }
            ]) { key value }
          }
        }
      }
    }
  }
`;

async function getCollectionProducts(handle, first, after, tag) {
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
      pageInfo: c.products.pageInfo,
    };
  });
}

// ─── SHOPIFY: SINGLE PRODUCT BY HANDLE ─────────────────
// Used by the PDP at /produit?handle=<h>. Before this endpoint the
// PDP could only render products from /api/products (capped at 250)
// — anything beyond the cap rendered "introuvable". This query goes
// straight to Shopify by handle, so the catalog cap no longer gates
// individual product pages.
const PRODUCT_QUERY = `
  query GetProduct($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      vendor
      productType
      description
      tags
      availableForSale
      totalInventory
      collections(first: 20) { edges { node { handle } } }
      featuredImage { url altText }
      images(first: 30) { edges { node { url altText } } }
      priceRange {
        minVariantPrice { amount currencyCode }
        maxVariantPrice { amount currencyCode }
      }
      variants(first: 250) {
        edges {
          node {
            id
            title
            sku
            price { amount currencyCode }
            availableForSale
            quantityAvailable
            selectedOptions { name value }
            image { url altText }
          }
        }
      }
      metafields(identifiers: [
        { namespace: "custom", key: "designer" }
        { namespace: "custom", key: "year" }
        { namespace: "custom", key: "material" }
        { namespace: "custom", key: "dimensions" }
        { namespace: "custom", key: "lead_time" }
        { namespace: "custom", key: "subcategory" }
        { namespace: "custom", key: "usage" }
        { namespace: "custom", key: "entretien" }
        { namespace: "custom", key: "origin" }
        { namespace: "custom", key: "weight" }
        { namespace: "custom", key: "warranty" }
      ]) { key value }
      # Recommandations gérées côté Shopify (app Search & Discovery), stockées en
      # métafields list.product_reference et lues dynamiquement — rien de hardcodé.
      complementary: metafield(namespace: "shopify--discovery--product_recommendation", key: "complementary_products") {
        references(first: 12) { nodes { ...RecoCard } }
      }
      related: metafield(namespace: "shopify--discovery--product_recommendation", key: "related_products") {
        references(first: 12) { nodes { ...RecoCard } }
      }
    }
  }
  fragment RecoCard on Product {
    id
    handle
    title
    vendor
    availableForSale
    totalInventory
    tags
    featuredImage { url altText }
    images(first: 4) { nodes { url } }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    variants(first: 1) { nodes { id availableForSale price { amount } } }
  }
`;

async function getProductByHandle(handle) {
  const h = String(handle || '').trim();
  if (!h) return null;
  return cached(`product:${h}`, async () => {
    const data = await shopifyFetch(PRODUCT_QUERY, { handle: h });
    const node = data.product;
    if (!node) return null;
    const product = mapProduct(node, { full: true });
    // Recommandations Search & Discovery (métafields list.product_reference)
    // mappées dans la forme de carte du site. Écarte : entrées sans image, la
    // self-référence, et les doublons — y compris un produit listé À LA FOIS en
    // complémentaire et en similaire (il n'apparaît alors que dans « Complétez
    // avec »). Brouillons/dépubliés absents (la Storefront API ne renvoie que les
    // produits actifs — c'est voulu).
    const seen = new Set([node.id]);
    const toCards = (mf) => (mf?.references?.nodes || []).map(mapProductRef)
      .filter(r => r && r.image && !seen.has(r.id) && (seen.add(r.id), true));
    product.complementary = toCards(node.complementary);
    product.related       = toCards(node.related);
    return product;
  });
}

// ─── API: GET PRODUCT BY HANDLE ────────────────────────
// GET /api/product/:handle
// 404 when the handle does not exist in Shopify (or is unpublished
// on the Storefront API channel).
app.get('/api/product/:handle', async (req, res) => {
  try {
    const product = await getProductByHandle(req.params.handle);
    if (!product) return res.status(404).json({ error: 'product_not_found' });
    res.json(product);
  } catch (err) {
    console.error('Product fetch error:', err.message);
    res.status(500).json({ error: 'Impossible de charger ce produit.' });
  }
});

// ─── API: GET COLLECTION PRODUCTS ──────────────────────
// GET /api/collection/:handle/products?cursor=...&limit=50&tag=<tag>
// Returns { collection: { title, description, image }, items, pageInfo }
// `tag` is an optional Shopify ProductFilter — when present, only
// products carrying that tag are returned (paginated server-side).
// 404 when the handle does not exist in Shopify.
app.get('/api/collection/:handle/products', async (req, res) => {
  try {
    const { handle } = req.params;
    const { cursor, limit, tag } = req.query;
    const payload = await getCollectionProducts(handle, limit, cursor, tag);
    if (!payload) return res.status(404).json({ error: 'collection_not_found' });
    res.json(payload);
  } catch (err) {
    console.error('Collection products error:', err.message);
    res.status(500).json({ error: 'Impossible de charger la collection.' });
  }
});

// ─── API: VITRA CHAIRS (scraped data) ─────────────────
// Run `npm run scrape` to regenerate data/vitra-chairs.json
const VITRA_JSON = path.join(__dirname, 'data/vitra-chairs.json');

app.get('/api/vitra', (req, res) => {
  if (!fs.existsSync(VITRA_JSON)) {
    return res.status(404).json({ error: 'Vitra data not found. Run: npm run scrape' });
  }
  try {
    const raw = fs.readFileSync(VITRA_JSON, 'utf8');
    const { products, scraped_at, count } = JSON.parse(raw);

    // Optional filters
    let filtered = products;
    const { q, min, max } = req.query;
    if (q) {
      const term = q.toLowerCase();
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(term) ||
        p.designer?.toLowerCase().includes(term) ||
        p.colours?.some(c => c.includes(term))
      );
    }
    if (min) filtered = filtered.filter(p => p.price >= parseFloat(min));
    if (max) filtered = filtered.filter(p => p.price <= parseFloat(max));

    res.json({ scraped_at, total: count, count: filtered.length, products: filtered });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read Vitra data.' });
  }
});

// ─── API: BUILD INFO (cache busting) ───────────────────
// Exposes the current build SHA so the client can append it as a
// query-string to long-cached asset URLs (e.g. /images/brands/*.svg
// served with `Cache-Control: immutable`). Each Vercel deploy gets
// a new SHA → ?v=... changes → browser re-fetches without manual
// cache clears. Falls back to "dev" outside Vercel.
app.get('/api/build', (req, res) => {
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
function hasValidToken(req) {
  const token = process.env.REVALIDATE_TOKEN;
  if (!token) return false;
  const sent = (req.get('authorization') || '').replace(/^Bearer\s+/i, '') || String(req.query.token || '');
  if (!sent) return false;
  const a = Buffer.from(sent);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b); // comparaison constante
}

// ─── API: REVALIDATE CACHE ─────────────────────────────
// Call this from a Shopify webhook (Products/update, Collections/update)
// Setup in Shopify admin → Settings → Notifications → Webhooks
// Auth : HMAC Shopify (webhook) OU Authorization: Bearer <REVALIDATE_TOKEN> (manuel).
app.post('/api/revalidate', (req, res) => {
  if (!verifyShopifyHmac(req) && !hasValidToken(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  delete _cache['products'];
  delete _cache['brands'];
  delete _cache['collections'];
  delete _cache['promos'];
  delete _cache['menu'];
  console.log('Cache cleared via /api/revalidate');
  res.json({ revalidated: true });
});

// ─── SHOPIFY: CART CREATE MUTATION ─────────────────────
const CART_CREATE_MUTATION = `
  mutation CartCreate(
    $lines:      [CartLineInput!]!
    $note:       String
    $attributes: [AttributeInput!]
  ) {
    cartCreate(input: {
      lines:      $lines
      note:       $note
      attributes: $attributes
    }) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ─── SHOPIFY: CART PREVIEW (totals + discount allocations) ─────────
// Same shape as CartCreate, but we ask for cost + discountAllocations so
// the front-end can show Shopify's actual price after automatic discounts
// (e.g. "Buy 5 get 1 free") before the customer hits checkout.
const CART_PREVIEW_MUTATION = `
  mutation CartPreview($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        cost {
          subtotalAmount { amount currencyCode }
          totalAmount    { amount currencyCode }
        }
        discountAllocations {
          discountedAmount { amount currencyCode }
          ... on CartAutomaticDiscountAllocation { title }
          ... on CartCodeDiscountAllocation      { code  }
          ... on CartCustomDiscountAllocation    { title }
        }
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              cost {
                subtotalAmount { amount currencyCode }
                totalAmount    { amount currencyCode }
              }
              discountAllocations {
                discountedAmount { amount currencyCode }
                ... on CartAutomaticDiscountAllocation { title }
                ... on CartCodeDiscountAllocation      { code  }
                ... on CartCustomDiscountAllocation    { title }
              }
              merchandise { ... on ProductVariant { id } }
            }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

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
    const variantIds = [...new Set(products.map((p) => p.variantId).filter(Boolean))];
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

// ─── API: PROMOS (variantId → discount title) ──────────
app.get('/api/promos', async (req, res) => {
  try {
    res.json(await getPromos());
  } catch (err) {
    console.error('Promos error:', err.message);
    res.status(500).json({ error: 'Impossible de charger les promotions.' });
  }
});

// ─── API: CART PREVIEW (totals + discounts) ────────────
// Body: { items: [{ variantId, qty }] }
// Returns: { subtotal, total, discount, discounts: [{title, amount}], lines: [{variantId, qty, subtotal, total, discount}] }
// NOTE: every call creates an orphan Shopify cart that auto-expires after
// ~10 days. Debounce on the client to keep volume sane.
app.post('/api/cart/preview', cartLimiter, async (req, res) => {
  try {
    const items = req.body?.items;
    if (!Array.isArray(items) || items.length === 0) return res.json({ subtotal: 0, total: 0, discount: 0, discounts: [], lines: [] });
    const lines = items.map(item => ({
      merchandiseId: item.variantId,
      quantity:      Math.max(1, Math.min(99, parseInt(item.qty) || 1)),
    }));
    const data = await shopifyFetch(CART_PREVIEW_MUTATION, { lines });
    const result = data.cartCreate;
    if (result.userErrors?.length) return res.status(400).json({ error: result.userErrors[0].message });
    const cart = result.cart;
    const titleOf = (d) => d.title || d.code || 'Remise';
    // Cart-level discounts (e.g. code "WELCOME10")
    const cartDiscounts = (cart.discountAllocations || []).map(d => ({
      title:  titleOf(d),
      amount: parseFloat(d.discountedAmount.amount),
    }));
    // Shopify can split one client-side line into several internal lines
    // (e.g. a "buy 5 get 1 free" rule yields one qty=5 line + one qty=1 free
    // line for the same variantId). We aggregate the internal lines per
    // variantId so the cart UI can show one clean row per variant with the
    // exact promo title(s) and the post-discount price.
    const internalLines = (cart.lines?.edges || []).map(e => e.node);
    const lineDiscounts = {}; // variantId → total discount (legacy field)
    const allLineDiscountObjs = [];
    // Per-variant aggregation: subtotal, total, discount, discount titles, qty
    const byVariant = new Map();
    for (const n of internalLines) {
      const vid = n.merchandise?.id || null;
      const lineSub = parseFloat(n.cost.subtotalAmount.amount);
      const lineTot = parseFloat(n.cost.totalAmount.amount);
      const lineDiscount = Math.max(0, lineSub - lineTot);
      const qty = parseInt(n.quantity) || 0;
      if (vid && lineDiscount > 0) lineDiscounts[vid] = (lineDiscounts[vid] || 0) + lineDiscount;
      if (vid) {
        const agg = byVariant.get(vid) || { subtotal: 0, total: 0, discount: 0, qty: 0, titles: new Set() };
        agg.subtotal += lineSub;
        agg.total    += lineTot;
        agg.discount += lineDiscount;
        agg.qty      += qty;
        for (const d of (n.discountAllocations || [])) {
          const amt = parseFloat(d.discountedAmount.amount);
          if (amt > 0) {
            const t = titleOf(d);
            if (t) agg.titles.add(t);
          }
        }
        byVariant.set(vid, agg);
      }
      for (const d of (n.discountAllocations || [])) {
        const amt = parseFloat(d.discountedAmount.amount);
        if (amt > 0) allLineDiscountObjs.push({ title: titleOf(d), amount: amt });
      }
    }
    // Summary list, aggregated by title, used to render "Remise · X: -Y €" rows
    const byTitle = {};
    [...cartDiscounts, ...allLineDiscountObjs].forEach(d => {
      if (d.amount <= 0) return;
      byTitle[d.title] = (byTitle[d.title] || 0) + d.amount;
    });
    const discounts = Object.entries(byTitle).map(([title, amount]) => ({ title, amount }));
    const discount  = discounts.reduce((s, d) => s + d.amount, 0);
    // Per-variant payload — client renders one row per variant with the
    // original/final price split and the promo title(s) underneath.
    // discountPct is rounded to 1 decimal; the client checks ≥ 99 to flip
    // the row into the "GRATUIT" visual treatment.
    const linesOut = items.map(item => {
      const agg = byVariant.get(item.variantId);
      if (!agg) {
        const qty = Math.max(1, Math.min(99, parseInt(item.qty) || 1));
        return { variantId: item.variantId, qty, subtotal: 0, total: 0, discount: 0, discountPct: 0, discountTitles: [] };
      }
      const pct = agg.subtotal > 0 ? (agg.discount / agg.subtotal) * 100 : 0;
      return {
        variantId:      item.variantId,
        qty:            agg.qty,
        subtotal:       agg.subtotal,
        total:          agg.total,
        discount:       agg.discount,
        discountPct:    Math.round(pct * 10) / 10,
        discountTitles: [...agg.titles],
      };
    });
    // Cart cost totals (post-discount, pre-shipping/tax)
    const subtotalDisplayed = parseFloat(cart.cost.subtotalAmount.amount) + discount; // pre-discount, for "Sous-total"
    const total             = parseFloat(cart.cost.totalAmount.amount);
    res.json({ subtotal: subtotalDisplayed, total, discount, discounts, lineDiscounts, lines: linesOut });
  } catch (err) {
    console.error('Cart preview error:', err.message);
    res.status(500).json({ error: 'Erreur lors du calcul du panier.' });
  }
});

// ─── API: CREATE CART → SHOPIFY CHECKOUT ───────────────
// Body: { items: [{ variantId, qty }], customer: { prenom, nom, email, telephone, projet, message } }
// Returns: { checkoutUrl } — redirect the browser to this URL
app.post('/api/cart/create', cartLimiter, async (req, res) => {
  try {
    const { items, customer } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'La selection est vide.' });
    }

    const lines = items.map(item => ({
      merchandiseId: item.variantId,
      quantity:      Math.max(1, Math.min(10, parseInt(item.qty) || 1)),
    }));

    // Pass customer context as cart note + attributes
    // (visible in Shopify admin → Orders → Notes / Attributes)
    const noteParts = [];
    if (customer?.prenom || customer?.nom) {
      noteParts.push(`Client: ${[customer.prenom, customer.nom].filter(Boolean).join(' ')}`);
    }
    if (customer?.telephone) noteParts.push(`Tel: ${customer.telephone}`);
    if (customer?.projet)    noteParts.push(`Projet: ${customer.projet}`);
    if (customer?.message)   noteParts.push(`Message: ${customer.message.substring(0, 500)}`);

    const attributes = [];
    if (customer?.prenom)    attributes.push({ key: 'Prenom',    value: customer.prenom });
    if (customer?.nom)       attributes.push({ key: 'Nom',       value: customer.nom });
    if (customer?.email)     attributes.push({ key: 'Email',     value: customer.email });
    if (customer?.telephone) attributes.push({ key: 'Telephone', value: customer.telephone });
    if (customer?.projet)    attributes.push({ key: 'Projet',    value: customer.projet });

    const data = await shopifyFetch(CART_CREATE_MUTATION, {
      lines,
      note:       noteParts.length ? noteParts.join('\n') : undefined,
      attributes: attributes.length ? attributes : undefined,
    });

    const result = data.cartCreate;
    if (result.userErrors?.length) {
      return res.status(400).json({ error: result.userErrors[0].message });
    }

    // Shopify returns checkoutUrl on the store's *primary* domain. The headless
    // storefront owns www.mikadodeco.be (served by Vercel), so checkout must run
    // on a Shopify-pointed subdomain. If SHOPIFY_CHECKOUT_DOMAIN is set (e.g.
    // shop.mikadodeco.be → CNAME shops.myshopify.com, set as Shopify primary),
    // force the checkout host to it so the redirect lands on Shopify, not Vercel.
    let checkoutUrl = result.cart.checkoutUrl;
    if (process.env.SHOPIFY_CHECKOUT_DOMAIN) {
      try {
        const u = new URL(checkoutUrl);
        u.host = process.env.SHOPIFY_CHECKOUT_DOMAIN;
        checkoutUrl = u.toString();
      } catch (_) { /* keep Shopify's original URL on parse failure */ }
    }

    res.json({ checkoutUrl });

  } catch (err) {
    console.error('Cart create error:', err.message);
    res.status(500).json({ error: err.message || 'Erreur lors de la creation du panier.' });
  }
});

// ─── CONTACT FORM ──────────────────────────────────────
// Body: { name, email, telephone?, projet?, message }
// Validates server-side, logs structured payload, returns 200.
// Wire up nodemailer / a webhook later — the endpoint contract stays the same.
app.post('/api/contact', formLimiter, async (req, res) => {
  try {
    // Honeypot anti-bot : champ masqué qu'un humain ne remplit jamais. Si rempli
    // → faux succès silencieux (on ne révèle pas le piège, on ne traite rien).
    if (String(req.body?.hp_field || '').trim()) return res.json({ ok: true });

    const { name = '', email = '', telephone = '', projet = '', message = '', source = 'website' } = req.body || {};

    const cleanName    = String(name).trim().slice(0, 120);
    const cleanEmail   = String(email).trim().toLowerCase().slice(0, 200);
    const cleanPhone   = String(telephone).trim().slice(0, 40);
    const cleanProjet  = String(projet).trim().slice(0, 80);
    const cleanMessage = String(message).trim().slice(0, 4000);

    if (!cleanName)    return res.status(400).json({ error: 'name_required' });
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'email_invalid' });
    }
    if (!cleanMessage || cleanMessage.length < 4) {
      return res.status(400).json({ error: 'message_too_short' });
    }

    const submission = {
      ts:       new Date().toISOString(),
      name:     cleanName,
      email:    cleanEmail,
      telephone:cleanPhone || null,
      projet:   cleanProjet || null,
      message:  cleanMessage,
      source,
      ua:       String(req.headers['user-agent'] || '').slice(0, 200),
    };

    // Structured log — surfaces in Vercel logs, Heroku, journalctl, etc.
    console.log('[contact]', JSON.stringify(submission));

    // If a CONTACT_WEBHOOK_URL is set, forward (Slack, Discord, Zapier, etc.)
    if (process.env.CONTACT_WEBHOOK_URL) {
      try {
        await fetch(process.env.CONTACT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission),
        });
      } catch (e) {
        console.warn('[contact] webhook failed:', e.message);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[contact] error:', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ─── API: NEWSLETTER → SHOPIFY ─────────────────────────
// Subscribes an email to the Shopify customer list (tagged "newsletter")
// via the storefront's classic customer form handler. No Admin API needed.
// Body: { email }
app.post('/api/newsletter', formLimiter, async (req, res) => {
  try {
    if (String(req.body?.hp_field || '').trim()) return res.json({ ok: true }); // honeypot anti-bot (faux succès)

    const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 200);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'email_invalid' });
    }
    if (!SHOPIFY_STORE) {
      console.log('[newsletter] (no Shopify configured)', email);
      return res.json({ ok: true });
    }
    // Best-effort: post to Shopify's classic storefront customer form handler.
    // (Reliable customer-list signup needs the Admin API; the storefront form
    // handler is theme/online-store dependent. We never lose the lead: on any
    // failure we still log + optionally forward to a webhook.)
    let shopifyOk = false;
    try {
      const form = new URLSearchParams();
      form.set('form_type', 'customer');
      form.set('utf8', '✓');
      form.set('contact[email]', email);
      form.set('contact[tags]', 'newsletter,v3-footer');
      const r = await fetch(`https://${SHOPIFY_STORE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'mikadodeco-newsletter' },
        body: form.toString(),
        redirect: 'manual',
      });
      shopifyOk = r.status >= 200 && r.status < 400; // 302 = success
      console.log('[newsletter]', JSON.stringify({ ts: new Date().toISOString(), email, shopifyStatus: r.status, shopifyOk }));
    } catch (e) {
      console.warn('[newsletter] shopify post failed:', e.message);
    }

    // Always capture the lead, even if Shopify declined.
    if (process.env.NEWSLETTER_WEBHOOK_URL || process.env.CONTACT_WEBHOOK_URL) {
      try {
        await fetch(process.env.NEWSLETTER_WEBHOOK_URL || process.env.CONTACT_WEBHOOK_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'newsletter', email, shopifyOk, ts: new Date().toISOString() }),
        });
      } catch (e) { console.warn('[newsletter] webhook failed:', e.message); }
    }

    res.json({ ok: true, shopify: shopifyOk });
  } catch (err) {
    console.error('[newsletter] error:', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ─── START (only when run directly, not when imported by Vercel) ──
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  Mikadodeco — serveur demarre`);
    console.log(`  http://localhost:${PORT}\n`);
  });
}

module.exports = app;
