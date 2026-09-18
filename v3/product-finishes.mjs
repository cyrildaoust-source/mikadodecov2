// Libellé de la finition représentative, commun aux cartes serveur et navigateur.
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function finishHTML(p) {
  if (!p.finishLabel) return '';
  return `<div class="pcard__finish-label" title="${escape(p.finishLabel)}">${escape(p.finishLabel)}</div>`;
}
