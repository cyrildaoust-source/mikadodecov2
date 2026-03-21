require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const stripe        = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path          = require('path');
const fs            = require('fs');
const { createClient } = require('@sanity/client');

// ─── SANITY CLIENT ────────────────────────────────────────
const SANITY_CONFIGURED =
  process.env.SANITY_PROJECT_ID &&
  process.env.SANITY_PROJECT_ID !== 'YOUR_PROJECT_ID';

const sanity = SANITY_CONFIGURED
  ? createClient({
      projectId: process.env.SANITY_PROJECT_ID,
      dataset:   process.env.SANITY_DATASET || 'production',
      apiVersion: '2024-01-01',
      useCdn:    true,
      // Add token only for private datasets or draft access:
      // token: process.env.SANITY_API_TOKEN,
    })
  : null;

if (!SANITY_CONFIGURED) {
  console.warn('⚠️  Sanity non configuré — utilisation des fichiers JSON locaux');
  console.warn('   → Ajoutez SANITY_PROJECT_ID dans .env pour activer le CMS\n');
}

// ─── SIMPLE CACHE (1 min TTL) ─────────────────────────────
const _cache = {};
async function cached(key, fetcher, ttl = 60_000) {
  const now = Date.now();
  if (_cache[key] && _cache[key].expiry > now) return _cache[key].data;
  const data = await fetcher();
  _cache[key] = { data, expiry: now + ttl };
  return data;
}

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── STATIC FILES ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── CORS ─────────────────────────────────────────────────
app.use(cors({ origin: process.env.BASE_URL || `http://localhost:${PORT}` }));

// ─── WEBHOOK must use raw body — mount BEFORE express.json() ──
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('⚠️  STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
    return res.json({ received: true });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log(`✅ Payment confirmed — session ${session.id}`);
      await handleSuccessfulOrder(session);
      break;
    }
    case 'checkout.session.expired': {
      console.log(`⏰ Session expired — ${event.data.object.id}`);
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      console.log(`❌ Payment failed — ${pi.id} — ${pi.last_payment_error?.message}`);
      break;
    }
  }

  res.json({ received: true });
});

// ─── JSON BODY for all other routes ───────────────────────
app.use(express.json());

// ─── PRODUCTS ─────────────────────────────────────────────
const PRODUCTS_QUERY = `*[_type == "product" && available == true] | order(name asc) {
  "id": _id,
  name,
  "brand": brand->name,
  designer, year, category, subcategory,
  material, dimensions, price, leadTime, description,
  "image": coalesce(image.asset->url, imageUrl),
  "gallery": gallery[].asset->url,
  badge, available, featured
}`;

async function getProducts() {
  return cached('products', async () => {
    if (sanity) {
      const results = await sanity.fetch(PRODUCTS_QUERY);
      return results;
    }
    // Fallback: local JSON
    const raw = fs.readFileSync(path.join(__dirname, 'public', 'products.json'), 'utf8');
    return JSON.parse(raw);
  });
}

// ─── BRANDS ───────────────────────────────────────────────
const BRANDS_QUERY = `*[_type == "brand"] | order(coalesce(order, 99) asc, name asc) {
  "id": _id,
  name, brandKey, country, city, founded,
  tagline, description, website,
  "logo": logo.asset->url,
  featured, order
}`;

async function getBrands() {
  return cached('brands', async () => {
    if (sanity) {
      const results = await sanity.fetch(BRANDS_QUERY);
      return results;
    }
    // Fallback: local JSON
    const raw = fs.readFileSync(path.join(__dirname, 'public', 'brands.json'), 'utf8');
    return JSON.parse(raw);
  });
}

// ─── API ENDPOINTS ────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (err) {
    console.error('Products fetch error:', err);
    res.status(500).json({ error: 'Impossible de charger les produits.' });
  }
});

app.get('/api/brands', async (req, res) => {
  try {
    const brands = await getBrands();
    res.json(brands);
  } catch (err) {
    console.error('Brands fetch error:', err);
    res.status(500).json({ error: 'Impossible de charger les marques.' });
  }
});

// Bust cache (useful after CMS edits — call from a Sanity webhook)
app.post('/api/revalidate', (req, res) => {
  delete _cache['products'];
  delete _cache['brands'];
  console.log('Cache cleared via /api/revalidate');
  res.json({ revalidated: true });
});

// ─── ODOO SYNC ────────────────────────────────────────────
// POST /api/sync-odoo  — pulls products from Odoo and upserts them into Sanity.
// Set ODOO_URL and ODOO_API_KEY in .env before calling.
app.post('/api/sync-odoo', async (req, res) => {
  const { ODOO_URL, ODOO_API_KEY } = process.env;

  if (!ODOO_URL || !ODOO_API_KEY) {
    return res.status(400).json({ error: 'ODOO_URL and ODOO_API_KEY must be set in .env' });
  }
  if (!sanity) {
    return res.status(400).json({ error: 'Sanity must be configured (SANITY_PROJECT_ID) to sync Odoo products' });
  }

  try {
    // Odoo REST API (v16+) — adjust fields to match your Odoo setup
    const odooRes = await fetch(
      `${ODOO_URL}/api/product.template?fields=id,name,list_price,description_sale,categ_id,active,default_code`,
      { headers: { 'Authorization': `Bearer ${ODOO_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    if (!odooRes.ok) throw new Error(`Odoo API ${odooRes.status}: ${odooRes.statusText}`);

    const { records } = await odooRes.json();
    let synced = 0;

    for (const item of records) {
      if (!item.active) continue; // skip archived products

      const doc = {
        _id:         `odoo-${item.id}`,
        _type:       'product',
        name:        item.name,
        price:       item.list_price || 0,
        description: item.description_sale || '',
        available:   true,
        featured:    false,
        category:    _mapOdooCategory(item.categ_id?.[1] || ''),
        subcategory: item.categ_id?.[1] || '',
      };

      // Write token is needed for mutations; use a Sanity client with the API token
      const writeClient = sanity.withConfig({ token: process.env.SANITY_API_TOKEN, useCdn: false });
      await writeClient.createOrReplace(doc);
      synced++;
    }

    delete _cache['products']; // bust cache
    console.log(`Odoo sync: ${synced} products upserted`);
    res.json({ synced });

  } catch (err) {
    console.error('Odoo sync error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function _mapOdooCategory(odooCategory) {
  const c = odooCategory.toLowerCase();
  if (c.includes('chaise') || c.includes('fauteuil') || c.includes('canapé') || c.includes('sofa') || c.includes('seat')) return 'assises';
  if (c.includes('table') || c.includes('bureau') || c.includes('desk'))  return 'tables';
  if (c.includes('lampe') || c.includes('luminaire') || c.includes('light') || c.includes('lamp')) return 'luminaires';
  if (c.includes('rangement') || c.includes('étagère') || c.includes('shelf') || c.includes('storage')) return 'rangements';
  if (c.includes('extérieur') || c.includes('outdoor') || c.includes('jardin')) return 'exterieur';
  return 'objets';
}

// ─── CREATE CHECKOUT SESSION ───────────────────────────────
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, customer } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'La sélection est vide.' });
    }

    const catalog = await getProducts();

    // Validate + build line items — prices come from the server, never trusted from client
    const line_items = [];
    for (const item of items) {
      const product = catalog.find(p => p.id === item.id);
      if (!product) return res.status(400).json({ error: `Produit introuvable : ${item.id}` });
      if (!product.available) return res.status(400).json({ error: `Produit indisponible : ${product.name}` });

      const qty = Math.max(1, Math.min(10, parseInt(item.qty) || 1));

      line_items.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${product.brand} — ${product.name}`,
            description: `${product.designer ? product.designer + ', ' : ''}${product.year || ''} · ${product.material}`,
            images: [product.image?.split('?')[0] + '?w=400&q=80'], // clean URL for Stripe
            metadata: {
              product_id: product.id,
              brand:      product.brand,
              designer:   product.designer || '',
              lead_time:  product.leadTime || '',
            },
          },
          unit_amount: Math.round(product.price * 100), // Stripe uses cents
        },
        quantity: qty,
      });
    }

    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',

      // Capture manually — allows the shop to confirm availability before charging
      // Remove this for immediate charge:
      // payment_intent_data: { capture_method: 'manual' },

      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/cancel.html`,

      customer_email: customer?.email,

      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['BE', 'FR', 'NL', 'LU', 'DE', 'GB', 'CH'],
      },

      locale: 'fr',

      metadata: {
        customer_name:  `${customer?.prenom || ''} ${customer?.nom || ''}`.trim(),
        customer_phone: customer?.telephone || '',
        project_type:   customer?.projet    || '',
        message:        (customer?.message  || '').substring(0, 500),
      },

      custom_text: {
        submit: {
          message: 'Un conseiller confirmera votre commande et les délais de livraison dans les 48h.',
        },
      },

      // Tax — enable if needed
      // automatic_tax: { enabled: true },
    });

    res.json({ url: session.url, sessionId: session.id });

  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de la création de la session de paiement.' });
  }
});

// ─── GET SESSION (for success page) ───────────────────────
app.get('/session/:id', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id, {
      expand: ['line_items', 'line_items.data.price.product'],
    });
    res.json({
      customerName:  session.metadata?.customer_name,
      customerEmail: session.customer_email || session.customer_details?.email,
      amount:        session.amount_total,
      currency:      session.currency,
      items:         session.line_items?.data?.map(li => ({
        name:     li.description || li.price?.product?.name,
        qty:      li.quantity,
        amount:   li.amount_total,
      })) || [],
    });
  } catch (err) {
    res.status(404).json({ error: 'Session introuvable.' });
  }
});

// ─── EMAIL NOTIFICATION (after successful payment) ────────
async function handleSuccessfulOrder(session) {
  if (!process.env.SMTP_HOST) return; // email not configured

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const amountFormatted = new Intl.NumberFormat('fr-BE', {
    style: 'currency', currency: session.currency?.toUpperCase() || 'EUR',
  }).format((session.amount_total || 0) / 100);

  // Notify the shop
  await transporter.sendMail({
    from:    `"Atelier Forme" <${process.env.SMTP_USER}>`,
    to:      process.env.SHOP_EMAIL,
    subject: `Nouvelle commande — ${session.metadata?.customer_name} — ${amountFormatted}`,
    html: `
      <h2>Nouvelle commande reçue</h2>
      <p><strong>Client :</strong> ${session.metadata?.customer_name}</p>
      <p><strong>Email :</strong> ${session.customer_email || session.customer_details?.email}</p>
      <p><strong>Téléphone :</strong> ${session.metadata?.customer_phone || 'N/A'}</p>
      <p><strong>Projet :</strong> ${session.metadata?.project_type || 'N/A'}</p>
      <p><strong>Message :</strong> ${session.metadata?.message || 'Aucun'}</p>
      <p><strong>Total :</strong> ${amountFormatted}</p>
      <p><strong>Session Stripe :</strong> ${session.id}</p>
      <hr />
      <p>Voir la commande complète dans le <a href="https://dashboard.stripe.com/payments">Dashboard Stripe</a>.</p>
    `,
  }).catch(e => console.error('Email shop error:', e));

  // Confirm to customer
  const customerEmail = session.customer_email || session.customer_details?.email;
  if (customerEmail) {
    await transporter.sendMail({
      from:    `"Atelier Forme" <${process.env.SMTP_USER}>`,
      to:      customerEmail,
      subject: 'Votre commande chez Atelier Forme — Confirmation',
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;color:#1a1916;">
          <h1 style="font-weight:300;font-size:32px;margin-bottom:8px;">Atelier <em>Forme</em></h1>
          <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9a9590;margin-bottom:40px;">Uccle, Bruxelles</p>
          <h2 style="font-weight:300;font-size:24px;">Merci pour votre commande</h2>
          <p style="color:#9a9590;line-height:1.8;">Bonjour ${session.metadata?.customer_name || ''},</p>
          <p style="color:#9a9590;line-height:1.8;">Nous avons bien reçu votre commande d'un montant de <strong style="color:#1a1916;">${amountFormatted}</strong>. Un conseiller de l'Atelier vous contactera dans les 48 heures pour confirmer les délais de livraison et les détails de finition.</p>
          <p style="color:#9a9590;line-height:1.8;margin-top:32px;font-size:13px;">Référence : ${session.id}</p>
          <hr style="border:none;border-top:1px solid #e0d9cf;margin:40px 0;" />
          <p style="font-size:12px;color:#9a9590;">Atelier Forme · Chaussée de Waterloo 1180 · 1180 Uccle, Bruxelles<br>+32 2 345 67 89 · bonjour@atelierforme.be</p>
        </div>
      `,
    }).catch(e => console.error('Email customer error:', e));
  }
}

// ─── CATCH-ALL (SPA fallback) ──────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── START ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✦  Atelier Forme — serveur démarré`);
  console.log(`   → http://localhost:${PORT}\n`);
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  STRIPE_SECRET_KEY manquant — copiez .env.example vers .env\n');
  }
});
