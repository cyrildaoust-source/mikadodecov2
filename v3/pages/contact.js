/* contact.html · script de page (ex-inline, sorti dans ce fichier en octobre 2026 : cache navigateur,
   syntaxe vérifiée par npm run check, prêt pour une CSP sans 'unsafe-inline').
   Comportement identique : un module inline s'exécute lui aussi après l'analyse du document. */
import { initShell } from "/shared.js";
initShell({ active: "", transparentNav: false });

const form = document.querySelector("[data-contact-form]");
const errEl = document.querySelector("[data-error]");
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errEl.style.display = "none";
  const f = Object.fromEntries(new FormData(form).entries());
  if (!f.name?.trim()) return fail("Indiquez votre nom.");
  if (!isEmail(f.email || "")) return fail("Indiquez un e-mail valide.");
  if ((f.message || "").trim().length < 4) return fail("Votre message est un peu court.");
  const btn = document.querySelector("[data-submit]");
  btn.disabled = true; btn.textContent = "Envoi…";
  try {
    const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, source: "v3-contact" }) });
    if (res.status === 429) throw new Error("rate_limit");
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "server");
    document.querySelector("[data-form-wrap]").style.display = "none";
    document.querySelector("[data-success]").style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (e2) { fail(e2.message === "rate_limit" ? "Trop de tentatives. Patientez quelques minutes avant de réessayer." : "L'envoi a échoué. Réessayez ou écrivez à shop@mikadodeco.be."); btn.disabled = false; btn.textContent = "Envoyer"; console.warn(e2); }
});
function fail(msg) { errEl.textContent = msg; errEl.style.display = "block"; }
