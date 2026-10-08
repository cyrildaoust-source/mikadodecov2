/* Vercel Web Analytics — mesure d'audience SANS cookie (pas de bandeau de
   consentement requis, la politique cookies reste inchangée). Chargé une seule
   fois pour TOUT le site depuis initShell (shell.mjs), point d'injection unique du
   chrome (toutes les pages l'appellent, dont l'accueil via main.js et les articles
   pré-rendus). Snippet officiel Vercel « HTML / autre framework » : on amorce la
   file window.va puis on charge le script de mesure en defer. Tant que Web
   Analytics n'est pas activé sur le projet (dashboard Vercel), /_vercel/insights
   répond 404 et le tag reste inoffensif. */
export function ensureVercelAnalytics() {
  if (window.__vaInjected) return;
  window.__vaInjected = true;
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  const s = document.createElement("script");
  s.defer = true;
  s.src = "/_vercel/insights/script.js";
  document.head.appendChild(s);
}
