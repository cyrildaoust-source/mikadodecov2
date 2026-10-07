/* conditions-generales-de-vente.html · script de page (ex-inline, sorti dans ce fichier en octobre 2026 : cache navigateur,
   syntaxe vérifiée par npm run check, prêt pour une CSP sans 'unsafe-inline').
   Comportement identique : un module inline s'exécute lui aussi après l'analyse du document. */
import { initShell } from "/shared.js";
initShell({ active: "", transparentNav: false });

// Onglets Particuliers / Professionnels. Les deux panneaux sont en dur dans
// le HTML (indexables) ; le JS ne fait que basculer la visibilité. Le
// <select> (.chips-select) prend le relais sur mobile, où .chips est masqué.
const tablist = document.querySelector('.chips[role="tablist"]');
const tabs = [...tablist.querySelectorAll('[role="tab"]')];
const select = document.querySelector('[data-legal-select]');
function activate(tab) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.classList.toggle('is-active', on);
    t.setAttribute('aria-selected', on ? 'true' : 'false');
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
  if (select) select.value = tab.id.replace('tab-', '');
}
tablist.addEventListener('click', (e) => { const tab = e.target.closest('[role="tab"]'); if (tab) activate(tab); });
tablist.addEventListener('keydown', (e) => {
  const i = tabs.indexOf(document.activeElement);
  if (i < 0) return;
  let n = null;
  if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
  if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
  if (n) { e.preventDefault(); n.focus(); activate(n); }
});
select?.addEventListener('change', () => { const tab = document.getElementById('tab-' + select.value); if (tab) activate(tab); });
