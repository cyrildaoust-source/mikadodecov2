// Shopify alt text carries the reviewed role; filenames may name a finish even
// when the asset is a dimension drawing. Never infer the role from its colour.
// The main importer exports the reserved readable prefix for every brand.
// Legacy labels remain accepted only for the reviewed AndTradition assets.
function splitDimensionMedia(node) {
  const images = (node.images?.edges || []).map(e => e?.node).filter(i => i?.url);
  const brand = String(node.vendor || '').toLowerCase().replace(/[^a-z]/g, '');
  const legacyAndTradition = ['tradition', 'andtradition'].includes(brand);
  const isDrawing = image => (image.altText || '').startsWith('Dessin de dimensions — ') || (legacyAndTradition && /\b(?:dessin technique|sch[eé]ma (?:de )?dimensions|dimension(?:al)? drawing)\b/i.test(image.altText || ''));
  const drawingUrls = new Set(images.filter(isDrawing).map(i => i.url.split('?')[0]));
  const seen = new Set();
  return {
    photos: images.filter(i => !drawingUrls.has(i.url.split('?')[0])),
    dimensions: images.filter(i => drawingUrls.has(i.url.split('?')[0]) && !seen.has(i.url.split('?')[0]) && seen.add(i.url.split('?')[0])),
  };
}
module.exports = { splitDimensionMedia };
