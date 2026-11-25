/* Mesure publicitaire (test Google Recherche + Meta, décembre 2026) — chargée après accord seulement.
   - Google : gtag.js (GA4 si « mesure d'audience », Google Ads si « publicité »), mode de consentement v2 de base :
     la balise n'est pas chargée sans accord.
   - Meta : pixel (navigateur) + API Conversions (serveur, /api/track) avec le même identifiant d'événement pour
     le dédoublonnage ; seulement avec l'accord « publicité ».
   - Événements du site : view_item, add_to_cart, begin_checkout, generate_lead (rendez-vous, devis). L'achat a
     lieu chez Shopify (shop.mikadodeco.be) : il est mesuré par les applications Google et Meta de Shopify.
   - UTM : gardés pour la session (sessionStorage, sans identifiant personnel) et transmis au paiement Shopify. */
import { onConsent, storedConsent, trackingSettings } from "./consent.mjs";

const UTM_KEY = "mikado_utm";
const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
let consent = { analytics: false, ads: false };
let gtagLoaded = false, fbqLoaded = false;

// ── UTM : la dernière campagne de la session, jusqu'au paiement ──
export function captureUtm() {
  try {
    const params = new URLSearchParams(location.search);
    const found = Object.fromEntries(UTM_FIELDS.filter((k) => params.get(k)).map((k) => [k, params.get(k).slice(0, 100)]));
    if (found.utm_source || found.utm_campaign) sessionStorage.setItem(UTM_KEY, JSON.stringify(found));
  } catch {}
}
export function getUtm() {
  try { return JSON.parse(sessionStorage.getItem(UTM_KEY) || "null") || {}; } catch { return {}; }
}

function loadScript(src) {
  const s = document.createElement("script");
  s.async = true; s.src = src;
  document.head.appendChild(s);
}

function startGoogle(t) {
  const wantGa = consent.analytics && t.ga4, wantAds = consent.ads && t.googleAds?.id;
  if (!wantGa && !wantAds) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  if (!gtagLoaded) {
    gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    gtag("js", new Date());
    loadScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(wantGa ? t.ga4 : t.googleAds.id));
    gtagLoaded = true;
  }
  const g = consent.analytics ? "granted" : "denied", a = consent.ads ? "granted" : "denied";
  gtag("consent", "update", { analytics_storage: g, ad_storage: a, ad_user_data: a, ad_personalization: a });
  if (wantGa && !startGoogle.ga) { gtag("config", t.ga4, { linker: { domains: ["mikadodeco.be", "shop.mikadodeco.be"] } }); startGoogle.ga = true; }
  if (wantAds && !startGoogle.ads) { gtag("config", t.googleAds.id, { linker: { domains: ["mikadodeco.be", "shop.mikadodeco.be"] } }); startGoogle.ads = true; }
}

function startMeta(t) {
  if (!consent.ads || !t.metaPixel || fbqLoaded) return;
  /* Amorce officielle du pixel (file d'attente fbq), sans script inline. */
  const n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
  if (!window._fbq) window._fbq = n;
  n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
  loadScript("https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", t.metaPixel);
  fbqLoaded = true;
  const id = eventId();
  fbq("track", "PageView", {}, { eventID: id });
  sendCapi("PageView", id, {});
}

function eventId() {
  return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
}

// API Conversions Meta (serveur) : même event_id que le pixel pour le dédoublonnage.
function sendCapi(name, id, customData) {
  try {
    fetch("/api/track", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: name, event_id: id, url: location.href, custom_data: customData }) }).catch(() => {});
  } catch {}
}

const META_NAMES = { view_item: "ViewContent", add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", generate_lead: "Lead" };
const ADS_LABELS = { generate_lead: "leadLabel", add_to_cart: "addToCartLabel", begin_checkout: "beginCheckoutLabel" };

/* Un événement du site. `data` : { value, items: [{ id, name, brand, price, quantity }], form }.
   Renvoie une promesse résolue quand Google a reçu l'envoi (ou après 600 ms au plus) : utile avant une redirection. */
export function track(name, data = {}) {
  const t = trackingSettings();
  if (!t || t.demo || (!consent.analytics && !consent.ads)) return Promise.resolve();
  const items = (data.items || []).map((it) => ({ item_id: String(it.id || ""), item_name: it.name || "", item_brand: it.brand || "", price: Number(it.price) || 0, quantity: Number(it.quantity) || 1 }));
  const value = Number(data.value ?? items.reduce((s, it) => s + it.price * it.quantity, 0)) || 0;
  let done;
  const sent = new Promise((resolve) => { done = resolve; setTimeout(resolve, 600); });
  if (window.gtag && (startGoogle.ga || startGoogle.ads)) {
    const params = { currency: "EUR", value, ...(items.length ? { items } : {}), ...(data.form ? { form_name: data.form } : {}), event_callback: () => done() };
    gtag("event", name, params);
    const label = t.googleAds?.[ADS_LABELS[name]];
    if (consent.ads && t.googleAds?.id && label) gtag("event", "conversion", { send_to: `${t.googleAds.id}/${label}`, value, currency: "EUR" });
  } else done();
  if (consent.ads && window.fbq && META_NAMES[name]) {
    const id = eventId();
    const custom = { currency: "EUR", value, ...(items.length ? { content_ids: items.map((i) => i.item_id), content_type: "product", contents: items.map((i) => ({ id: i.item_id, quantity: i.quantity, item_price: i.price })), num_items: items.reduce((s, i) => s + i.quantity, 0) } : {}) };
    fbq("track", META_NAMES[name], custom, { eventID: id });
    sendCapi(META_NAMES[name], id, custom);
  }
  return sent;
}

function apply(choice) {
  consent = choice;
  const t = trackingSettings();
  if (!t || t.demo) return;   // préversion de démonstration : aucune balise
  startGoogle(t);
  startMeta(t);
}

export function initTracking() {
  captureUtm();
  if (!trackingSettings()) return;
  const c = storedConsent();
  if (c) apply(c);
  onConsent(apply);
}
