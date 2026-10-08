/* ══════════ OFFRE CADEAU « Mois Verner Panton » — moteur v4 (familles de tissus) ══════
   Règles (seuils, handles, dates) dans gift-rules.mjs. Ici : fiches cadeaux, sélection
   tissu/coloris, réconciliation du panier, rendu de l'encart et liaisons d'événements.
   Le palier 2 = une FAMILLE : le sélecteur gère DEUX niveaux (Tissu → produit,
   Coloris → variante) et n'ajoute qu'une fois la variante précise choisie.
   Modèle « le cadeau s'élève » : garder un cadeau inférieur reste valide (sa remise
   s'applique toujours) → montée en gamme PROPOSÉE (« Échanger »), jamais forcée ;
   un cadeau au-dessus du palier (redescente) ou hors offre (legacy VP9+VP11 de
   l'ancienne structure, ancien handle tabouret-visiona) → retiré + message, avec
   la vérification du 0 € réel en filet. Montant éligible = sous-total hors produits
   cadeaux (la collection de calcul = tout le catalogue prix > 0 ; preview.lines[].
   eligible reste le miroir si une exclusion revient). Offres jamais cumulables
   (loi Shopify BXGY) → footnote permanente. Jamais d'ajout automatique. */
import { euro, escapeHtml } from "./format.mjs";
import { GIFT_OFFER, GIFT_HANDLES, giftTierIdx, giftActive } from "./gift-rules.mjs";
import { readCart, writeCart, setCartQty, removeFromCart } from "./cart.mjs";

/* Fiches cadeaux depuis /api/product — source unique (nom/prix/image/variantes). */
let _giftMeta = null, _giftMetaStarted = false;
function loadGiftMeta() {
  if (_giftMetaStarted) return; _giftMetaStarted = true;
  const jobs = [];
  GIFT_OFFER.tiers.forEach((t, ti) => t.gifts.forEach((handle) => jobs.push({ handle, tier: t, ti })));
  Promise.all(jobs.map(async ({ handle, tier, ti }) => {
    try {
      const r = await fetch(`/api/product/${encodeURIComponent(handle)}`);
      if (!r.ok) return null;
      const p = await r.json();
      const basePrice = p.priceMin || 0;
      const variants = (p.variants || [])
        .filter((v) => {
          if (!v || !v.id || v.available === false) return false;
          if (tier.variants !== "all" && (v.qty || 0) <= 0) return false;
          const pr = parseFloat((v.price && v.price.amount) != null ? v.price.amount : v.price);
          return !(pr > basePrice + 0.01);
        })
        .map((v) => ({ id: v.id, title: v.title || "", qty: v.qty }))
        .sort((a, b) => ((b.qty > 0) ? 1 : 0) - ((a.qty > 0) ? 1 : 0));
      if (!variants.length) return null;
      // Libellé du tissu = le nom produit sans le préfixe de la famille
      // (« Tabouret Visiona Volo » → « Volo ») ; repli = nom complet.
      const fabric = (p.name || "").replace(tier.label, "").trim() || p.name || handle;
      return { handle, ti, name: p.name || handle, fabric, brand: p.brand || "", price: p.priceMin || 0, image: p.image || "", variants };
    } catch (e) { return null; }
  })).then((metas) => {
    _giftMeta = metas.filter(Boolean);
    document.dispatchEvent(new CustomEvent("gift:meta"));
  });
}
const metaFor = (h) => (_giftMeta || []).find((m) => m.handle === h) || null;
const tierMetas = (ti) => (_giftMeta || []).filter((m) => m.ti === ti);
/* Tissu sélectionné par palier (persiste entre re-rendus) — 1er produit par défaut. */
const _fabricChoice = {};
function tierChoice(ti) {
  const metas = tierMetas(ti);
  if (!metas.length) return null;
  return metas.find((m) => m.handle === _fabricChoice[ti]) || metas[0];
}
const _giftMsg = { text: "", at: 0 };
function setGiftMsg(text) { _giftMsg.text = text; _giftMsg.at = Date.now(); }
/* Seules les lignes AJOUTÉES PAR LE MODULE (flag gift) sont retirables par lui. */
const flaggedGiftLines = (cart) => cart.filter((i) => i.gift === GIFT_OFFER.id).sort((a, b) => (a.giftOrder || 0) - (b.giftOrder || 0));
const takenGiftLines   = (cart) => cart.filter((i) => i.gift === GIFT_OFFER.id || GIFT_HANDLES.has(i.handle));
export function giftContext(preview) {
  const cart = readCart();
  const pl = preview && Array.isArray(preview.lines) ? preview.lines : null;
  let sum = 0;
  for (const i of cart) {
    if (i.gift === GIFT_OFFER.id || GIFT_HANDLES.has(i.handle)) continue;
    const p = pl ? pl.find((l) => l.variantId === i.variantId) : null;
    if (p && p.eligible === false) continue;
    sum += (i.price || 0) * (i.qty || 1);
  }
  let tierIdx = -1;
  GIFT_OFFER.tiers.forEach((t, i) => { if (sum >= t.threshold) tierIdx = i; });
  const nextTier = GIFT_OFFER.tiers.find((t) => sum < t.threshold) || null;
  return { cart, sum, tierIdx, nextTier, taken: takenGiftLines(cart), flagged: flaggedGiftLines(cart) };
}
let _giftReconciling = false;
export function giftReconcile(preview) {
  if (_giftReconciling || !giftActive()) return;
  _giftReconciling = true;
  try {
    const { cart, tierIdx, flagged } = giftContext(preview);
    for (const g of flagged) if ((g.qty || 1) !== 1) setCartQty(g.variantId, 1);
    // Cadeau AU-DESSUS du palier (redescente) ou HORS offre (legacy) → retiré.
    // Un cadeau EN-DESSOUS reste légitime (sa remise à lui s'applique toujours).
    const illegit = flagged.filter((g) => {
      const gi = giftTierIdx(g.handle);
      return gi < 0 || gi > tierIdx;
    });
    if (illegit.length) {
      illegit.forEach((g) => removeFromCart(g.variantId));
      const th = illegit.map((g) => giftTierIdx(g.handle)).filter((i) => i >= 0).map((i) => GIFT_OFFER.tiers[i].threshold);
      setGiftMsg(th.length
        ? `Votre panier est repassé sous ${euro(Math.min(...th))} — le cadeau a été retiré.`
        : `Cette pièce ne fait plus partie de l'offre — elle a été retirée de vos cadeaux.`);
      return;
    }
    // Vérification du 0 € RÉEL (preview frais uniquement) — filet de sécurité.
    if (preview && Array.isArray(preview.lines) && flagged.length) {
      const cartIds = new Set(cart.map((i) => i.variantId));
      const prevIds = new Set(preview.lines.map((l) => l.variantId));
      const fresh = cartIds.size === prevIds.size && [...cartIds].every((id) => prevIds.has(id));
      if (fresh) {
        const notFree = flagged.filter((g) => {
          const p = preview.lines.find((l) => l.variantId === g.variantId);
          return p && p.subtotal > 0 && (p.discountPct || 0) < 99;
        });
        if (notFree.length) {
          notFree.forEach((g) => removeFromCart(g.variantId));
          setGiftMsg((preview.discounts || []).length > 0
            ? "Une autre offre plus avantageuse s'applique déjà à votre panier — les offres ne se cumulent pas."
            : "L'offre n'a pas pu être appliquée — le cadeau a été retiré. Écrivez-nous si le souci persiste.");
        }
      }
    }
  } finally { _giftReconciling = false; }
}
export function giftOfferHTML(preview) {
  if (!giftActive()) return "";
  loadGiftMeta();
  if (!_giftMeta || !_giftMeta.length) return "";
  const { cart, sum, tierIdx, taken } = giftContext(preview);
  if (!cart.length) return "";
  const msg = _giftMsg.text && (Date.now() - _giftMsg.at < 8000)
    ? `<p class="gifto__msg">${escapeHtml(_giftMsg.text)}</p>` : "";
  const bar = (target) => {
    const gap = Math.max(0, Math.ceil(target - sum));
    const pct = Math.max(0, Math.min(100, (sum / target) * 100));
    return { gap, html: `<div class="gifto__bar" role="progressbar" aria-label="Progression vers votre cadeau" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${Math.min(Math.round(sum), target)}"><span class="gifto__fill" style="width:${pct}%"></span></div>` };
  };
  // Tuile d'un palier : tissu (si famille) → coloris → bouton. Image + nom
  // cliquables vers la fiche. La sélection de tissu persiste (_fabricChoice).
  const tierTile = (ti, opts = {}) => {
    const t = GIFT_OFFER.tiers[ti];
    const metas = tierMetas(ti);
    const m = tierChoice(ti);
    if (!m) return "";
    const locked = !!opts.locked;
    const pdp = `/produit.html?handle=${encodeURIComponent(m.handle)}`;
    const fabricSel = metas.length > 1 && !locked
      ? `<select class="gifto__sel" data-gift-fabric="${ti}" aria-label="Tissu — ${escapeHtml(t.label)}">${metas.map((x) => `<option value="${escapeHtml(x.handle)}"${x.handle === m.handle ? " selected" : ""}>${escapeHtml(x.fabric)}${x.price !== m.price ? " · " + euro(x.price) : ""}</option>`).join("")}</select>` : "";
    const colorSel = m.variants.length > 1 && !locked
      ? `<select class="gifto__sel" data-gift-variant="${escapeHtml(m.handle)}" aria-label="Coloris — ${escapeHtml(m.name)}">${m.variants.map((v) => `<option value="${escapeHtml(v.id)}">${escapeHtml(v.title || m.name)}</option>`).join("")}</select>` : "";
    return `<div class="gifto__tile${locked ? " is-locked" : ""}"${locked ? ' aria-disabled="true"' : ""}>
        <a href="${pdp}" tabindex="-1" aria-hidden="true"><img class="gifto__img" src="${escapeHtml(m.image || "")}" alt="" loading="lazy" /></a>
        <div class="gifto__tinfo">
          <a class="gifto__tname" href="${pdp}">${escapeHtml(m.name)}</a>
          <span class="gifto__tvalue">Valeur ${euro(m.price)}</span>
          ${fabricSel}
          ${colorSel}
          ${locked ? "" : `<button type="button" class="gifto__btn" data-gift-add="${escapeHtml(m.handle)}">${escapeHtml(opts.cta || "Ajouter")}</button>`}
        </div>
      </div>`;
  };
  const ladder = (fromIdx) => {
    const ups = GIFT_OFFER.tiers.slice(fromIdx).map((t) => `${escapeHtml(t.label)} dès ${euro(t.threshold)}`);
    return ups.length ? `<p class="gifto__teaser">Votre cadeau s'élève : ${ups.join(" · ")}.</p>` : "";
  };
  const bestTakenIdx = taken.reduce((mx, i) => Math.max(mx, giftTierIdx(i.handle)), -1);
  let body = "";
  if (tierIdx < 0) {                                              // Sous le 1er palier
    const t0 = GIFT_OFFER.tiers[0];
    const b = bar(t0.threshold);
    body = `<p class="gifto__lead">Plus que <strong>${euro(b.gap)}</strong> et votre ${escapeHtml(t0.label)} est offert${t0.fem ? "e" : ""}</p>${b.html}
      ${tierTile(0, { locked: true })}${ladder(1)}`;
  } else if (bestTakenIdx < 0) {                                   // Palier atteint, rien de pris
    const t = GIFT_OFFER.tiers[tierIdx];
    body = `<p class="gifto__lead">${escapeHtml(t.label)} vous est offert${t.fem ? "e" : ""} — <strong>ajoutez-${t.fem ? "la" : "le"}</strong></p>
      ${tierTile(tierIdx)}${ladder(tierIdx + 1)}`;
  } else if (bestTakenIdx < tierIdx) {                             // Montée en gamme possible
    const t = GIFT_OFFER.tiers[tierIdx];
    const cur = GIFT_OFFER.tiers[bestTakenIdx];
    body = `<p class="gifto__lead">Votre cadeau peut s'élever : ${escapeHtml(t.label)} au lieu de ${escapeHtml(cur.label)}</p>
      ${tierTile(tierIdx, { cta: "Échanger" })}`;
  } else {                                                          // Cadeau du palier pris
    const cur = GIFT_OFFER.tiers[bestTakenIdx];
    const next = GIFT_OFFER.tiers[tierIdx + 1] || null;
    if (next) {
      const b = bar(next.threshold);
      body = `<p class="gifto__lead">${escapeHtml(cur.label)} offert${cur.fem ? "e" : ""}</p>
        <p class="gifto__lead">Plus que <strong>${euro(b.gap)}</strong> et il s'élève : ${escapeHtml(next.label)}</p>${b.html}`;
    } else {
      body = `<p class="gifto__lead">${escapeHtml(cur.label)} — le cadeau le plus haut de l'offre — est dans votre panier.</p>`;
    }
  }
  return `<section class="gifto" aria-label="Offre cadeau du Mois Verner Panton">
      <div aria-live="polite">${msg}${body}</div>
      <p class="gifto__foot">Mois Verner Panton, jusqu'au 30 septembre. Offres non cumulables entre elles — la plus avantageuse s'applique automatiquement.</p>
    </section>`;
}
let _giftBound = false;
export function giftBind() {
  if (_giftBound || !giftActive()) return; _giftBound = true;
  loadGiftMeta();
  document.addEventListener("cart:change", () => giftReconcile(null));
  // Changement de tissu → mémorise + re-rend (les hôtes écoutent gift:meta).
  document.addEventListener("change", (e) => {
    const f = e.target.closest("[data-gift-fabric]");
    if (!f) return;
    _fabricChoice[parseInt(f.getAttribute("data-gift-fabric"), 10)] = f.value;
    document.dispatchEvent(new CustomEvent("gift:meta"));
  });
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-gift-add]");
    if (!add) return;
    const m = metaFor(add.getAttribute("data-gift-add"));
    if (!m) return;
    const sel = add.closest(".gifto__tile")?.querySelector("[data-gift-variant]");
    const variantId = (sel && sel.value) || m.variants[0].id;
    const cart = readCart();
    if (cart.some((i) => i.variantId === variantId && i.gift === GIFT_OFFER.id)) return;
    add.disabled = true;                       // anti double-clic (le re-render suit)
    // « Échanger »/re-choix : tout cadeau marqué d'un palier ≤ sort dans la MÊME
    // écriture (un seul recalcul, pas d'état intermédiaire).
    const kept = cart.filter((i) => !(i.gift === GIFT_OFFER.id && giftTierIdx(i.handle) <= giftTierIdx(m.handle)));
    kept.push({ variantId, handle: m.handle, name: m.name, brand: m.brand, price: m.price, image: m.image, qty: 1, gift: GIFT_OFFER.id, giftOrder: Date.now() });
    writeCart(kept);
  });
}
