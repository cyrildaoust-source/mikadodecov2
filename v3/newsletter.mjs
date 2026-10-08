/* Formulaire newsletter du pied de page ([data-newsletter]) → POST /api/newsletter. */
export function bindNewsletter() {
  const form = document.querySelector("[data-newsletter]");
  if (!form) return;
  const status = form.querySelector("[data-news-status]");
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = form.querySelector("input[name=email]");
    const email = (input.value || "").trim();
    if (!isEmail(email)) { status.textContent = "Indiquez un e-mail valide."; status.className = "footer__news-status is-error"; return; }
    const btn = form.querySelector("button");
    btn.disabled = true; const label = btn.textContent; btn.textContent = "…";
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      if (res.status === 429) throw new Error("rate_limit");
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "server");
      input.style.display = "none"; btn.style.display = "none";
      status.textContent = ["created", "subscribed"].includes(data.saved)
        ? "Merci, vous êtes inscrit·e."
        : "Votre demande a été transmise à la boutique. L’inscription sera finalisée manuellement.";
      status.className = "footer__news-status is-ok";
    } catch (e2) {
      status.textContent = e2.message === "rate_limit" ? "Trop de tentatives. Patientez quelques minutes." : "L'inscription n'a pas pu être enregistrée. Réessayez ou écrivez-nous à shop@mikadodeco.be.";
      status.className = "footer__news-status is-error";
      btn.disabled = false; btn.textContent = label; console.warn(e2);
    }
  });
}
