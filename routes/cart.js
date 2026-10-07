// Routes panier : aperçu, livraison, création du checkout Shopify.
// Extrait de server.js (phase 1 du plan d'architecture, octobre 2026) — code déplacé, pas réécrit.
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { getDeliveryEstimate, normalizeItems, realProject } = require('../lib/delivery-estimate');
const { shopifyFetch } = require('../lib/shopify/client');
const { CART_CREATE_MUTATION, CART_PREVIEW_MUTATION } = require('../lib/shopify/queries');

const cartLimiter = rateLimit({
  windowMs: 60 * 1000,                // 1 min
  max: 30,                            // 30 calculs panier / IP / min (le front debounce déjà)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});
// ─── API: CART PREVIEW (totals + discounts) ────────────
// Body: { items: [{ variantId, qty }] }
// Returns: { subtotal, total, discount, discounts: [{title, amount}], lines: [{variantId, qty, subtotal, total, discount}] }
// NOTE: every call creates an orphan Shopify cart that auto-expires after
// ~10 days. Debounce on the client to keep volume sane.
router.post('/api/cart/preview', cartLimiter, async (req, res) => {
  res.set('Cache-Control', 'no-store');
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
    // Éligibilité « offre cadeau » par ligne : miroir de la collection Shopify
    // « Catalogue — paliers cadeaux » (gid 694454944073) : prix > 0 SAUF tag
    // `exclu-paliers` (03/09 : chaise Panton sortie du calcul — son 5+1 est
    // financé par Vitra et ne doit pas être remplacé par les cadeaux Mikado).
    const GIFT_EXCLUDE_TAGS = new Set(['exclu-paliers']);
    const isEligible = (tags) => !(tags || []).some((t) => GIFT_EXCLUDE_TAGS.has(String(t).toLowerCase()));
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
        const agg = byVariant.get(vid) || { subtotal: 0, total: 0, discount: 0, qty: 0, titles: new Set(), tags: (n.merchandise?.product?.tags) || [] };
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
        return { variantId: item.variantId, qty, subtotal: 0, total: 0, discount: 0, discountPct: 0, discountTitles: [], eligible: false };
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
        eligible:       isEligible(agg.tags),
      };
    });
    // Cart cost totals (post-discount, pre-shipping/tax)
    const subtotalDisplayed = parseFloat(cart.cost.subtotalAmount.amount) + discount; // pre-discount, for "Sous-total"
    const total             = parseFloat(cart.cost.totalAmount.amount);
    res.json({ subtotal: subtotalDisplayed, total, discount, discounts, lineDiscounts, lines: linesOut });
  } catch (err) {
    console.error('Cart preview error:', err.message);
    res.status(500).set('Cache-Control', 'no-store').json({ error: 'Erreur lors du calcul du panier.' });
  }
});
// Fresh availability for the exact variants and total quantities in the cart.
router.post('/api/cart/delivery', cartLimiter, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const items = normalizeItems(req.body?.items);
    res.json(await getDeliveryEstimate(items, shopifyFetch));
  } catch (err) {
    res.status(400).json({ error: 'Impossible de vérifier le délai. Réessayez avant de payer.' });
  }
});
// ─── API: CREATE CART → SHOPIFY CHECKOUT ───────────────
// Body: { items: [{ variantId, qty }], customer: { prenom, nom, email, telephone, projet, message } }
// Returns: { checkoutUrl } — redirect the browser to this URL
router.post('/api/cart/create', cartLimiter, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const { customer } = req.body;
    const items = normalizeItems(req.body?.items);
    const delivery = await getDeliveryEstimate(items, shopifyFetch);
    const project = realProject(customer?.projet);
    const checkedAt = new Date().toISOString();

    const lines = items.map(item => ({
      merchandiseId: item.variantId,
      quantity:      item.qty,
      // Ligne cadeau (offre Panton) : marquée par un attribut _gift (préfixe _
      // = masqué au client) — retrouvable dans la commande côté admin.
      attributes: [
        ...(item.gift ? [{ key: '_gift', value: String(item.gift).slice(0, 40) }] : []),
        ...(delivery.lines.find(l => l.variantId === item.variantId)?.label
          ? [{ key: 'Délai estimé', value: delivery.lines.find(l => l.variantId === item.variantId).label }] : []),
      ],
    }));

    // Pass customer context as cart note + attributes
    // (visible in Shopify admin → Orders → Notes / Attributes)
    const noteParts = delivery.label ? [`Délai estimé de la commande : ${delivery.label} (envoi groupé).`, 'Mode de réception : voir le mode choisi au paiement dans la commande Shopify.'] : [];
    if (customer?.prenom || customer?.nom) {
      noteParts.push(`Client: ${[customer.prenom, customer.nom].filter(Boolean).join(' ')}`);
    }
    if (customer?.telephone) noteParts.push(`Tel: ${customer.telephone}`);
    if (project) noteParts.push(`Projet: ${project}`);
    if (customer?.message)   noteParts.push(`Message: ${customer.message.substring(0, 500)}`);

    const attributes = delivery.label ? [{ key: 'Délai estimé', value: delivery.label }, { key: 'Stock vérifié le', value: checkedAt }] : [];
    if (customer?.prenom)    attributes.push({ key: 'Prenom',    value: customer.prenom });
    if (customer?.nom)       attributes.push({ key: 'Nom',       value: customer.nom });
    if (customer?.email)     attributes.push({ key: 'Email',     value: customer.email });
    if (customer?.telephone) attributes.push({ key: 'Telephone', value: customer.telephone });
    if (project) attributes.push({ key: 'Projet', value: project });

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
    res.status(500).set('Cache-Control', 'no-store').json({ error: err.message || 'Erreur lors de la creation du panier.' });
  }
});

module.exports = router;
