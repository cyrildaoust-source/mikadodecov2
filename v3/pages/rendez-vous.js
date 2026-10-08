/* rendez-vous.html · script de page (ex-inline, sorti dans ce fichier en octobre 2026 : cache navigateur,
   syntaxe vérifiée par npm run check, prêt pour une CSP sans 'unsafe-inline').
   Comportement identique : un module inline s'exécute lui aussi après l'analyse du document. */
import { initShell } from "/shell.mjs";
initShell({ active: "", transparentNav: true });

const form = document.querySelector("[data-rdv-form]");
const errEl = form.querySelector("[data-error]");
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const fail = (m) => { errEl.textContent = m; errEl.style.display = "block"; };

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errEl.style.display = "none";
  const f = Object.fromEntries(new FormData(form).entries());
  if (!f.name?.trim()) return fail("Indiquez votre nom.");
  if (!isEmail(f.email || "")) return fail("Indiquez un e-mail valide.");
  const btn = form.querySelector("[data-submit]");
  btn.disabled = true; btn.textContent = "Envoi…";
  const message = `Demande de rendez-vous showroom.\nDate souhaitée: ${f.date || "à convenir"} · ${f.slot}\n${f.projet_msg || ""}`.trim();
  try {
    const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: f.name, email: f.email, telephone: f.telephone, projet: "Prise de rendez-vous showroom", message, source: "v3-rendez-vous" }) });
    if (res.status === 429) throw new Error("rate_limit");
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "server");
    document.querySelector("[data-form-wrap]").style.display = "none";
    document.querySelector("[data-success]").style.display = "block";
  } catch (e2) { fail(e2.message === "rate_limit" ? "Trop de tentatives. Patientez quelques minutes avant de réessayer." : "L'envoi a échoué. Réessayez ou écrivez à shop@mikadodeco.be."); btn.disabled = false; btn.textContent = "Demander ce rendez-vous"; console.warn(e2); }
});
