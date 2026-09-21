const { splitDimensionMedia } = require('../dimension-media');
const { selectInitialVariant } = require('../../v3/product-variant');

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
  const { photos, dimensions: dimensionImages } = splitDimensionMedia(node);
  const meta = {};
  (node.metafields || []).filter(Boolean).forEach(m => { if (m) meta[m.key] = m.value; });
  const variant = selectInitialVariant((node.variants?.edges || []).map(e => e.node), {
    coverUrl: node.featuredImage?.url || node.images?.edges?.[0]?.node?.url,
  });
  // `price` is the selected variant's price (what gets stored in the cart when
  // adding from a product card). `priceMin` / `priceMax` come from Shopify's
  // priceRange and cover every variant. The front-end shows "À partir de"
  // when priceMin < priceMax.
  const price    = parseFloat(variant?.price?.amount || node.priceRange.minVariantPrice.amount);
  const priceMin = parseFloat(node.priceRange.minVariantPrice.amount);
  const priceMax = parseFloat(node.priceRange.maxVariantPrice?.amount || node.priceRange.minVariantPrice.amount);
  const _caMin = parseFloat(node.compareAtPriceRange?.minVariantPrice?.amount || 0);
  const compareAt = _caMin > priceMin + 0.5 ? _caMin : null;
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
    material:    meta.material    || meta.materiaux || '',
    dimensions:  meta.dimensions  || '',
    ...(full ? { dimensionImages: dimensionImages.map(i => ({ url: shopifyResize(i.url, PDP_IMAGE_WIDTH), alt: i.altText || 'Dessin de dimensions' })) } : {}),
    // Caractéristiques PDP additionnelles (métafields custom.* — vides tant que
    // l'importer Shopify n'a pas créé+rempli les définitions ; lues seulement par
    // PRODUCT_QUERY → s'affichent toutes seules une fois remplies, sans déploiement).
    usage:       meta.usage       || '',
    entretien:   meta.entretien   || '',
    origin:      meta.origin      || '',
    weight:      meta.weight      || '',
    warranty:    meta.warranty    || '',
    lightingType:            meta.lighting_type            || '',
    lightSourceType:         meta.light_source_type         || '',
    ledType:                 meta.led_type                  || '',
    power:                   meta.power_w                   || '',
    voltage:                 meta.voltage_v                 || '',
    colorTemperature:        meta.color_temperature_k       || '',
    dimming:                 meta.dimming                   || '',
    batteryRuntime:          meta.battery_runtime           || '',
    chargingTime:            meta.charging_time             || '',
    cableDetails:            meta.cable_details             || '',
    ipRating:                meta.ip_rating                 || '',
    safetyClass:             meta.safety_class              || '',
    energyLabel:             meta.energy_label              || '',
    lightSourceReplaceable:  meta.light_source_replaceable  || '',
    constructionMaterials:   meta.construction_materials    || '',
    infosElectriques:        meta.infos_electriques          || '',
    price,
    priceMin,
    priceMax,
    compareAt,
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
      const imgs = photos.map(i => i.url);
      const second = imgs.find(u => u !== featured) || imgs[1] || null;
      return second ? shopifyResize(second, CARD_IMAGE_WIDTH) : null;
    })(),
    // images = ordered list for the PDP gallery main image — resized webp. Stays
    // index-parallel to thumbs[] below (same source/order/filter) so the front
    // maps a clicked thumbnail back to its full-width image by index.
    images:      photos.map(i => shopifyResize(i.url, PDP_IMAGE_WIDTH)),
    // thumbs[] (gallery strip, ~8 urls/produit) n'est lu que par la PDP → gated
    // derrière `full` pour ne pas alourdir les réponses liste (PLP/accueil/collections).
    ...(full ? { thumbs: photos.map(i => shopifyResize(i.url, PDP_THUMB_WIDTH)) } : {}),
    ...(full ? { seoTitle: node.seo?.title || '', seoDescription: node.seo?.description || '' } : {}),
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
      compareAtPrice: parseFloat(v.compareAtPrice?.amount) || null,
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
  const _caMinR = parseFloat(n.compareAtPriceRange?.minVariantPrice?.amount || 0);
  const compareAt = _caMinR > priceMin + 0.5 ? _caMinR : null;
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
    compareAt,
    image:     shopifyResize(featured || '', CARD_IMAGE_WIDTH),
    image2:    second ? shopifyResize(second, CARD_IMAGE_WIDTH) : null,
    badge:     tags.find(t => t.startsWith('badge:'))?.replace('badge:', '') || null,
    inStock:   (typeof n.totalInventory === 'number') && n.totalInventory > 0,
    longDelay,
    leadTimeLabel: longDelay ? DELIVERY_LONG : DELIVERY_DEFAULT,
    available: n.availableForSale && (v?.availableForSale ?? true),
  };
}


module.exports = { mapProduct, mapProductRef, shopifyResize, CARD_IMAGE_WIDTH };
