// Fragment commun aux cartes serveur et navigateur. Sans JS, chaque vignette
// ouvre directement la même fiche sur la finition choisie.
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const thumbnail = src => {
  try { const u = new URL(src); if (u.protocol !== 'https:' || u.hostname !== 'cdn.shopify.com') return ''; u.searchParams.set('width','88'); return u.href; } catch { return ''; }
};
export function finishHTML(p, hrefFor) {
  if (!p.finishLabel) return '';
  const choices = Array.isArray(p.finishChoices) ? p.finishChoices : [];
  const label = `<div class="pcard__finish-label" title="${escape(p.finishLabel)}">${escape(p.finishLabel)}</div>`;
  if (choices.length < 2) return label;
  const links = choices.map(v => {
    const src = thumbnail(v.image);
    if (!src) return '';
    const selected = v.variantId === p.variantId;
    return `<a class="pcard__finish" href="${escape(hrefFor(v.variantId))}" data-card-finish="${escape(v.variantId)}" data-product-handle="${escape(p.handle)}" ${selected ? 'aria-current="true"' : ''} title="${escape(v.finishLabel)}" aria-label="${escape(p.name + ' · ' + v.finishLabel)}"><img src="${escape(src)}" alt="" loading="lazy" width="44" height="44" /></a>`;
  }).join('');
  const remaining = Math.max(0,(p.finishCount || choices.length)-choices.length);
  return label + `<div class="pcard__finishes" aria-label="Finitions de ${escape(p.name)}">${links}${remaining ? `<a class="pcard__finish-more" href="${escape(hrefFor(p.variantId))}" aria-label="Voir toutes les finitions de ${escape(p.name)}">+${remaining}</a>` : ''}</div>`;
}

export function selectCardFinish(product, variantId) {
  const choice = product.finishChoices?.find(v => v.variantId === variantId);
  return choice ? {...product,...choice} : product;
}
