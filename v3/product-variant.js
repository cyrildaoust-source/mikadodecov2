// Shared by the CommonJS server and the browser module, without product-specific rules.
(function (root) {
  function imageIdentity(image) {
    const raw = typeof image === 'string' ? image : image?.url;
    if (!raw || typeof raw !== 'string') return '';
    try {
      const url = new URL(raw, 'https://local.invalid');
      url.hash = '';
      if (url.hostname === 'cdn.shopify.com') {
        for (const key of ['v', 'width', 'height', 'crop', 'format', 'quality', 'pad']) url.searchParams.delete(key);
        url.searchParams.sort();
      }
      return url.href;
    } catch { return ''; }
  }

  // Disponibilité portée par le mapper (available) ou par Shopify (availableForSale).
  const isAvailable = v => (v.available ?? v.availableForSale) !== false;

  // Une variante demandée explicitement est toujours respectée. Sinon, la fiche ne
  // s'ouvre jamais sur une variante indisponible quand une autre est disponible.
  function selectInitialVariant(variants, { requestedId, coverUrl, defaultId, fallback = true } = {}) {
    const choices = Array.isArray(variants) ? variants.filter(v => v?.id) : [];
    const requested = requestedId && choices.find(v => String(v.id) === String(requestedId)
      || (/^\d+$/.test(String(requestedId)) && String(v.id).split('/').pop() === String(requestedId)));
    if (requested) return requested;
    const firstAvailable = choices.find(isAvailable);
    const cover = imageIdentity(coverUrl);
    const matches = cover ? choices.filter(v => imageIdentity(v.image) === cover) : [];
    if (matches.length === 1) return isAvailable(matches[0]) || !firstAvailable ? matches[0] : firstAvailable;
    if (!fallback) return null;
    const preferred = choices.find(v => v.id === defaultId);
    return (preferred && (isAvailable(preferred) || !firstAvailable) ? preferred : firstAvailable) || preferred || choices[0] || null;
  }

  // Keep image, label, price and cart identity together until the latest image is ready.
  function latestVariantSelection(prepare, commit) {
    let request = 0;
    return async function (variant) {
      if (!variant?.id) return false;
      const ownRequest = ++request;
      try { await prepare(variant); } catch { return false; }
      if (ownRequest !== request) return false;
      commit(variant);
      return true;
    };
  }

  const api = { imageIdentity, selectInitialVariant, latestVariantSelection };
  // Le global est toujours posé : regroupé par esbuild (ADR 0010), le module est enveloppé en CommonJS
  // (`module` existe) alors que le navigateur attend `globalThis.MikadoProductVariant`.
  root.MikadoProductVariant = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(globalThis);
