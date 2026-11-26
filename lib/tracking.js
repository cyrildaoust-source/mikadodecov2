// Réglages de mesure (data/tracking.json) : identifiants publics transmis au navigateur dans #site-data.
// Les variables d'environnement GA4_ID, GOOGLE_ADS_ID, META_PIXEL_ID remplacent le fichier (Preview).
const file = require('../data/tracking.json');

function trackingConfig(env = process.env) {
  const ads = { ...file.googleAds, ...(env.GOOGLE_ADS_ID ? { id: env.GOOGLE_ADS_ID } : {}) };
  const cfg = {
    version: Number(file.consentVersion) || 1,
    ga4: String(env.GA4_ID || file.ga4 || '').trim(),
    googleAds: { id: String(ads.id || '').trim(), leadLabel: ads.leadLabel || '', addToCartLabel: ads.addToCartLabel || '', beginCheckoutLabel: ads.beginCheckoutLabel || '' },
    metaPixel: String(env.META_PIXEL_ID || file.metaPixel || '').trim(),
  };
  cfg.enabled = Boolean(cfg.ga4 || cfg.googleAds.id || cfg.metaPixel);
  // Préversion sans identifiants : le bandeau s'affiche pour validation, mais aucune balise n'est chargée.
  if (!cfg.enabled && env.VERCEL_ENV === 'preview') return { ...cfg, enabled: true, demo: true, ga4: 'G-DEMO', googleAds: { ...cfg.googleAds, id: 'AW-DEMO' }, metaPixel: 'DEMO' };
  return cfg;
}

module.exports = { trackingConfig };
