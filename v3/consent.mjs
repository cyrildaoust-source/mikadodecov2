/* Bandeau de consentement aux cookies (session marketing, test publicitaire de décembre 2026).
   - Rien n'est déposé ni chargé avant un choix : les balises Google et Meta attendent l'accord (tracking.mjs).
   - Refuser est aussi simple qu'accepter (même bouton, même place) ; « Personnaliser » sépare la mesure
     d'audience (Google Analytics) et la publicité (Google Ads, Meta).
   - Le choix est gardé 6 mois dans le navigateur (localStorage, aucun cookie) ; « Gérer les cookies » en pied
     de page rouvre le bandeau. Retirer un accord efface les cookies Google/Meta du site et recharge la page.
   - Sans identifiant configuré (data/tracking.json), le bandeau n'existe pas. */
import { siteData } from "./site-data.mjs";

const KEY = "mikado_consent";
const MAX_AGE = 182 * 24 * 3600 * 1000;   // 6 mois
const listeners = new Set();

export function trackingSettings() {
  const t = siteData("tracking");
  return t && t.enabled ? t : null;
}

// Choix enregistré, ou null s'il n'y en a pas (ou s'il est périmé / d'une autre version).
export function storedConsent() {
  const t = trackingSettings();
  if (!t) return null;
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!c || c.v !== t.version || !c.at || Date.now() - c.at > MAX_AGE) return null;
    return { analytics: c.analytics === true, ads: c.ads === true };
  } catch { return null; }
}

export function onConsent(fn) { listeners.add(fn); return () => listeners.delete(fn); }

const TRACKING_COOKIES = /^(_ga|_ga_.*|_gid|_gat.*|_gcl_.*|_fbp|_fbc)$/;
function clearTrackingCookies() {
  const host = location.hostname, parts = host.split(".");
  const domains = ["", host, "." + host, parts.length > 2 ? "." + parts.slice(-2).join(".") : ""].filter((d, i, a) => a.indexOf(d) === i);
  for (const pair of document.cookie.split(";")) {
    const name = pair.split("=")[0].trim();
    if (!TRACKING_COOKIES.test(name)) continue;
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/${d ? "; domain=" + d : ""}`;
  }
}

function save(choice) {
  const t = trackingSettings();
  const before = storedConsent();
  try { localStorage.setItem(KEY, JSON.stringify({ v: t.version, at: Date.now(), analytics: !!choice.analytics, ads: !!choice.ads })); } catch {}
  close();
  // Un accord retiré : les balises déjà chargées ne se déchargent pas, la page repart propre.
  if (before && ((before.analytics && !choice.analytics) || (before.ads && !choice.ads))) { clearTrackingCookies(); location.reload(); return; }
  listeners.forEach((fn) => { try { fn({ analytics: !!choice.analytics, ads: !!choice.ads }); } catch (e) { console.warn("[consent]", e); } });
  document.dispatchEvent(new CustomEvent("consent:change", { detail: choice }));
}

let root = null;
function close() { if (root) { root.remove(); root = null; document.documentElement.classList.remove("consent-open"); } }

export function openConsent({ details = false } = {}) {
  const t = trackingSettings();
  if (!t) return;
  close();
  const current = storedConsent() || { analytics: false, ads: false };
  const hasAnalytics = !!t.ga4, hasAds = !!(t.googleAds?.id || t.metaPixel);
  root = document.createElement("section");
  root.className = "consent";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "false");
  root.setAttribute("aria-labelledby", "consent-title");
  root.innerHTML = `
    <div class="consent__in wrap">
      <div class="consent__txt">
        <h2 class="consent__title" id="consent-title">Cookies</h2>
        <p>Avec votre accord, nous mesurons la fréquentation du site${hasAds ? " et l’efficacité de nos publicités (Google, Meta)" : ""}. Sans accord, rien n’est déposé. <a href="/politique-cookies.html">En savoir plus</a></p>
        <div class="consent__details"${details ? "" : " hidden"} data-consent-details>
          ${hasAnalytics ? `<label class="consent__opt"><input type="checkbox" data-consent-analytics${current.analytics ? " checked" : ""}> <span><b>Mesure d’audience</b> — Google Analytics : pages vues, parcours, origine des visites.</span></label>` : ""}
          ${hasAds ? `<label class="consent__opt"><input type="checkbox" data-consent-ads${current.ads ? " checked" : ""}> <span><b>Publicité</b> — Google Ads et Meta : savoir quelles annonces mènent à une visite ou à une commande.</span></label>` : ""}
        </div>
      </div>
      <div class="consent__btns">
        <button type="button" class="consent__btn" data-consent-refuse>Tout refuser</button>
        <button type="button" class="consent__btn" data-consent-accept>Tout accepter</button>
        <button type="button" class="consent__link" data-consent-custom${details ? " hidden" : ""}>Personnaliser</button>
        <button type="button" class="consent__btn consent__btn--save" data-consent-save${details ? "" : " hidden"}>Enregistrer mes choix</button>
      </div>
    </div>`;
  document.body.appendChild(root);
  document.documentElement.classList.add("consent-open");
  root.querySelector("[data-consent-refuse]").addEventListener("click", () => save({ analytics: false, ads: false }));
  root.querySelector("[data-consent-accept]").addEventListener("click", () => save({ analytics: hasAnalytics, ads: hasAds }));
  root.querySelector("[data-consent-custom]").addEventListener("click", (e) => {
    root.querySelector("[data-consent-details]").hidden = false;
    e.currentTarget.hidden = true;
    root.querySelector("[data-consent-save]").hidden = false;
    root.querySelector("[data-consent-details] input")?.focus();
  });
  root.querySelector("[data-consent-save]").addEventListener("click", () => save({
    analytics: !!root.querySelector("[data-consent-analytics]")?.checked,
    ads: !!root.querySelector("[data-consent-ads]")?.checked,
  }));
}

// Lien « Gérer les cookies » à côté du lien Cookies du pied de page (seulement quand la mesure existe).
function addFooterLink() {
  const cookies = document.querySelector('#site-footer a[href="/politique-cookies.html"]');
  if (!cookies || document.querySelector("[data-consent-open]")) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "footer__consent";
  btn.setAttribute("data-consent-open", "");
  btn.textContent = "Gérer les cookies";
  btn.addEventListener("click", () => openConsent({ details: true }));
  cookies.insertAdjacentElement("afterend", btn);
}

// Au chargement : le bandeau tant qu'aucun choix n'est fait. Renvoie true s'il est affiché.
export function initConsent() {
  if (!trackingSettings()) return false;
  addFooterLink();
  if (storedConsent()) return false;
  openConsent();
  return true;
}
