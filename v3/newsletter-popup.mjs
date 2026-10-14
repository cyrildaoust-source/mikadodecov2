/* Popup d'inscription à la newsletter (ADR 0017).
   Réglages : data/newsletter.json (lu dans #site-data). Discrète et haut de gamme : jamais tout de suite,
   une seule fois par visite, jamais sur le panier ni les pages légales, silence 30 jours après une
   fermeture et pour toujours après une inscription. Même appel que le formulaire du pied de page
   (POST /api/newsletter, origine « popup »). Aucune bibliothèque, chargée après le reste de la page. */
import { lockBodyScroll } from "./scroll-lock.mjs";

export const STORE_KEY = "mikado_nl_popup";       // localStorage : { subscribed: true } ou { closedAt: ms }
export const SESSION_KEY = "mikado_nl_session";   // sessionStorage : { views: n, shown: true|false }
const DAY = 86_400_000;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ── Décisions pures (testables sans navigateur) ──────────────────────────────
// La popup a-t-elle le droit de s'ouvrir sur cette page, pour ce visiteur ?
export function popupAllowed({ path = "/", search = "", memory = null, config = {}, now = Date.now(), webdriver = false, force = false } = {}) {
  if (force) return { allowed: true, reason: "forcée" };
  if (webdriver) return { allowed: false, reason: "navigateur automatisé" };
  if (config.enabled === false) return { allowed: false, reason: "désactivée" };
  const params = new URLSearchParams(search);
  if (params.get("utm_medium") === "email-bienvenue") return { allowed: false, reason: "arrivée depuis le mail de bienvenue", remember: { subscribed: true } };
  if ((config.excludedPaths || []).includes(path) || (config.excludedPrefixes || []).some((p) => path.startsWith(p))) return { allowed: false, reason: "page exclue" };
  if (memory?.subscribed) return { allowed: false, reason: "déjà inscrit" };
  if (memory?.closedAt && now - memory.closedAt < (config.closedDays ?? 30) * DAY) return { allowed: false, reason: "fermée récemment" };
  return { allowed: true, reason: "" };
}
// Compteur de pages de la visite : la popup s'ouvre à la N-ième page, ou après le délai, au premier des deux.
export function nextSession(session = null, config = {}) {
  const views = (Number(session?.views) || 0) + 1;
  const shown = Boolean(session?.shown);
  return { views, shown, trigger: shown ? null : views >= (config.pageViews ?? 2) ? "page" : "delay" };
}

// ── Navigateur ───────────────────────────────────────────────────────────────
const read = (store, key) => { try { return JSON.parse(store.getItem(key) || "null"); } catch { return null; } };
const write = (store, key, value) => { try { store.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
const track = (action) => { try { window.va?.("event", { name: "newsletter_popup", data: { action } }); } catch { /* mesure facultative */ } };

function popupHTML(config) {
  const offer = String(config.offer || "").trim();
  const photo = esc(config.photo || ""), mobile = esc(config.photoMobile || config.photo || "");
  return `<div class="nlp__backdrop" data-nlp-close></div>
  <div class="nlp__box" role="dialog" aria-modal="true" aria-labelledby="nlp-title">
    <button class="nlp__close" type="button" data-nlp-close aria-label="Fermer">&times;</button>
    <picture class="nlp__pic"><source media="(max-width: 760px)" srcset="${mobile}" /><img class="nlp__photo" src="${photo}" alt="${esc(config.photoAlt || "")}" decoding="async" /></picture>
    <div class="nlp__body">
      <form class="nlp__form" data-nlp-form novalidate>
        <h2 class="nlp__title serif" id="nlp-title">Restons en contact</h2>
        ${offer ? `<p class="nlp__text">Et recevez <strong>${esc(offer)}</strong> sur votre première commande en ligne.</p>` : ""}
        <label class="sr-only" for="nlp-email">Votre adresse e-mail</label>
        <input id="nlp-email" type="email" name="email" placeholder="Votre adresse e-mail" autocomplete="email" required />
        <input class="nlp__hp" type="text" name="hp_field" tabindex="-1" autocomplete="off" aria-hidden="true" />
        <button class="btn btn--blue btn--block" type="submit">Je m'inscris</button>
        ${offer ? `<p class="nlp__fine">Sur les articles, une fois par client.</p>` : ""}
        <p class="nlp__status" data-nlp-status role="status" aria-live="polite"></p>
      </form>
      <p class="nlp__done serif" data-nlp-done hidden>Merci&nbsp;! Votre code arrive par e-mail.</p>
    </div>
  </div>`;
}
// Un tiroir ouvert (panier, menu, recherche) : on attend plutôt que de s'empiler dessus.
const busy = () => Boolean(document.querySelector("[data-cart-drawer].open, [data-drawer].open, [data-search]:not([hidden]), .nlp"));

export function initNewsletterPopup(config = {}) {
  if (!config || config.enabled === false) return;
  const force = new URLSearchParams(location.search).get("newsletter") === "1";
  const memory = read(localStorage, STORE_KEY);
  if (memory === null && !write(localStorage, STORE_KEY, {})) return;   // stockage illisible : on ne s'affiche pas
  const verdict = popupAllowed({ path: location.pathname, search: location.search, memory, config, webdriver: Boolean(navigator.webdriver), force });
  if (verdict.remember) write(localStorage, STORE_KEY, verdict.remember);
  if (!verdict.allowed) return;
  const session = nextSession(read(sessionStorage, SESSION_KEY), config);
  write(sessionStorage, SESSION_KEY, { views: session.views, shown: session.shown });
  if (!force && !session.trigger) return;                                // déjà montrée pendant cette visite

  // Une seule ouverture par visite : une fois montrée (puis fermée), ni le délai, ni la 2e page, ni la sortie de la
  // souris ne la rouvrent (constat de Cyril du 13 octobre : elle revenait après l'inscription).
  let root = null, lastFocus = null, timers = [], shownOnce = false, subscribed = false;
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const remember = (value) => write(localStorage, STORE_KEY, value);
  const onLeave = (e) => { if (e.clientY <= 0 && Date.now() - since >= (config.exitIntentSeconds ?? 10) * 1000) open(); };
  const since = Date.now();

  function close(reason = subscribed ? "inscription" : "fermeture") {
    if (!root) return;
    clear();
    document.removeEventListener("keydown", onKey, true);
    root.remove(); root = null;
    lockBodyScroll(false);
    // Une inscription n'est jamais écrasée par une fermeture (croix pendant le « Merci »).
    if (reason === "fermeture" && !subscribed) { remember({ closedAt: Date.now() }); track("fermeture"); }
    // Le focus revient d'où il venait ; sinon au début du contenu, pour que la touche Tab reprenne dans la page
    // (et non sur le lien d'évitement « Aller au contenu », placé avant la navigation).
    if (lastFocus && lastFocus !== document.body && document.contains(lastFocus)) lastFocus.focus();
    else { const main = document.getElementById("contenu"); if (main) { if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1"); main.focus({ preventScroll: true }); } }
  }
  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab" || !root) return;
    const list = [...root.querySelectorAll("button, input, [href]")].filter((el) => el.offsetParent !== null && !el.disabled);
    if (!list.length) return;
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget, status = form.querySelector("[data-nlp-status]"), input = form.querySelector("input[name=email]"), btn = form.querySelector("button[type=submit]");
    const email = (input.value || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { status.textContent = "Indiquez un e-mail valide."; status.className = "nlp__status is-error"; input.focus(); return; }
    btn.disabled = true; const label = btn.textContent; btn.textContent = "…"; status.textContent = "";
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, source: "popup", hp_field: form.querySelector("input[name=hp_field]").value }) });
      if (res.status === 429) throw new Error("rate_limit");
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "server");
      subscribed = true;
      remember({ subscribed: true, at: Date.now(), saved: data.saved });
      track("inscription");
      form.hidden = true;
      root.querySelector(".nlp__box")?.classList.add("nlp__box--done");   // la phrase seule, sur une ligne
      const done = root.querySelector("[data-nlp-done]");
      // Le code de bienvenue ne part que pour une NOUVELLE inscription : on ne le promet pas à qui est déjà inscrit.
      if (data.saved === "already") done.textContent = "Vous êtes déjà inscrit·e. Merci !";
      else if (!(["created", "subscribed"].includes(data.saved))) done.textContent = "Merci ! Votre demande a été transmise.";
      // Le message reste affiché, avec sa croix, jusqu'à ce que le visiteur ferme (décision de Cyril du 13 octobre).
      done.hidden = false;
      root.querySelector(".nlp__close")?.focus({ preventScroll: true });
    } catch (err) {
      status.textContent = err.message === "rate_limit" ? "Trop de tentatives. Patientez quelques minutes." : "L'inscription n'a pas pu être enregistrée. Réessayez ou écrivez-nous à shop@mikadodeco.be.";
      status.className = "nlp__status is-error";
      btn.disabled = false; btn.textContent = label;
    }
  }
  function open() {
    if (root || shownOnce) return;
    if (busy() && !force) { timers.push(setTimeout(open, 5000)); return; }
    clear();
    shownOnce = true;
    document.documentElement.removeEventListener("mouseleave", onLeave);
    root = document.createElement("div");
    root.className = "nlp"; root.setAttribute("data-nlp", "");
    root.innerHTML = popupHTML(config);
    document.body.appendChild(root);
    lastFocus = document.activeElement;
    lockBodyScroll(true);
    write(sessionStorage, SESSION_KEY, { views: session.views, shown: true });
    track("vue");
    root.querySelectorAll("[data-nlp-close]").forEach((el) => el.addEventListener("click", () => close()));
    root.querySelector("[data-nlp-form]").addEventListener("submit", submit);
    document.addEventListener("keydown", onKey, true);
    requestAnimationFrame(() => root?.querySelector("input[name=email]")?.focus({ preventScroll: true }));
  }

  if (force) { open(); return; }
  if (session.trigger === "page") timers.push(setTimeout(open, 1500));
  else timers.push(setTimeout(open, (config.delaySeconds ?? 25) * 1000));
  // Ordinateur : la souris quitte la fenêtre vers le haut (le visiteur s'apprête à partir), jamais avant 10 s.
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) document.documentElement.addEventListener("mouseleave", onLeave);
}
