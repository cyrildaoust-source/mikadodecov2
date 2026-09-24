// Fiche produit : un seul balisage pour le serveur et le navigateur (demande du
// 24 septembre : pages complètes dès l'arrivée, sans reconstruction). Le serveur
// envoie la fiche entière ; le navigateur garde ce balisage et branche seulement
// les interactions (produit.html). Code repris tel quel du rendu navigateur.
import { escapeHtml, priceLabel, stockLabel, slugify } from './format.mjs';
import { buildProductSpecGroups, renderDimensionImages } from './product-specs.mjs';

export function pdpView(p, { requestedVariant = null, selectInitialVariant, brandHref = '', designerLink = false }) {
  const imgs = (p.images && p.images.length ? p.images : [p.image, p.image2]).filter(Boolean);
  // Thumbnail-strip sources: small-width versions, index-parallel to `imgs`.
  // Falls back to `imgs` when the API didn't supply thumbs[] (older payload).
  const thumbSrcs = (p.thumbs && p.thumbs.length ? p.thumbs : imgs);
  // Responsive-image helpers. shopifyResize URLs carry `width=<n>`; swapping
  // that number yields any size from the same base. Because thumbnails match
  // on the QUERY-STRIPPED base URL, different widths never break the active /
  // variant highlight. widthVariant rewrites the width; srcsetFor builds a
  // density ladder for the main image; MAIN_SIZES tells the browser the
  // displayed width (gallery col ≈ 53% desktop, near-full <=760px single-col).
  // Non-Shopify/local images get no srcset (returned untouched).
  const widthVariant = (url, w) => (url && /[?&]width=\d+/.test(url)) ? url.replace(/([?&]width=)\d+/, `$1${w}`) : url;
  const srcsetFor = (url) => (url && url.includes("cdn.shopify.com") && /[?&]width=\d+/.test(url))
    ? [800, 1280, 2048].map((w) => `${widthVariant(url, w)} ${w}w`).join(", ") : "";
  const MAIN_SIZES = "(max-width: 760px) 92vw, 53vw";
  const variants = Array.isArray(p.variants) ? p.variants : [];
  const initialSelection = selectInitialVariant(variants, { requestedId: requestedVariant, coverUrl: p.image || p.firstImageRaw, fallback: false });
  let current = selectInitialVariant(variants, { requestedId: requestedVariant, coverUrl: p.image || p.firstImageRaw, defaultId: p.variantId }) || { id: p.variantId, price: p.price, image: p.image, title: "", available: true, sku: "", qty: null };

  // Galerie = AMBIANCES uniquement (photos en situation), pas les packshots.
  // Règle donnée : un packshot = un variant.image. Donc ambiances = imgs privé
  // de toutes les variants[].image (normalisation URL sans query, comme
  // syncActiveThumb). L'image PRINCIPALE reste le packshot de la variante
  // (current.image, change via applyVariant) ; le rail/dots/miniatures/showThumb/
  // préchargement ne montrent QUE les ambiances. Si vide → aucun strip.
  const norm = (u) => (u || "").split("?")[0];
  const variantUrls = new Set(variants.map((v) => norm(v.image)).filter(Boolean));
  const ambIdx = imgs.map((_s, i) => i).filter((i) => !variantUrls.has(norm(imgs[i])));
  const ambiances = ambIdx.map((i) => imgs[i]);
  const ambThumbs = ambIdx.map((i) => thumbSrcs[i] || imgs[i]);

  // Walk every variant to collect the option axis NAMES — used only to label
  // the variant drawer/trigger dynamically. The drawer lists a FLAT grid of
  // variants[] (one tile per variant = full combo for multi-axis products),
  // so per-axis value maps are no longer needed.
  const optionNames = [];
  const _seenAxes = new Set();
  for (const v of variants) for (const o of (v.options || [])) {
    if (o?.name && !_seenAxes.has(o.name)) { _seenAxes.add(o.name); optionNames.push(o.name); }
  }
  // Libellé DYNAMIQUE du sélecteur : 1 axe « Couleur » → « Coloris » ; 1 autre
  // axe → le nom de l'axe ; plusieurs axes → « Variantes ».
  const singleAxis = optionNames.length === 1 ? optionNames[0] : "";
  const isColorAxis = /^couleur$/i.test(singleAxis);
  const axisLabel = optionNames.length === 1 ? (isColorAxis ? "Coloris" : singleAxis) : "Variantes";
  const axisLabelLower = optionNames.length === 1 ? (isColorAxis ? "coloris" : singleAxis.toLowerCase()) : "variantes";
  const moreCount = variants.length - 1;
  const moreWord = /s$/.test(axisLabelLower) ? axisLabelLower : axisLabelLower + (moreCount > 1 ? "s" : "");

  // Image d'une variante (avec repli produit) à la largeur voulue.
  const variantImg = (v, w) => widthVariant((v && v.image) || p.image || imgs[0] || "", w);
  // Dispo HONNÊTE PAR VARIANTE — 3 états sur le VRAI stock (v.qty = quantityAvailable),
  // PAS sur availableForSale (= true partout en oversell inventoryPolicy:CONTINUE).
  //   available===false → "unavailable" · qty>0 → "instock" · sinon → "order".
  // Fallback : si qty revient null (scope Storefront non exposé), qty n'est PAS un
  // nombre → jamais "instock" : on n'affirme aucune dispo non vérifiable.
  const variantState = (v) => {
    if (!v || v.available === false) return "unavailable";
    if (typeof v.qty === "number" && v.qty > 0) return "instock";
    return "order";
  };
  // Badge dot+texte (grille tiroir, aperçu, bloc coloris buy-box) — texte ambre
  // partout ; SEUL le point change : vert --stock (en stock) / ambre --order.
  // En stock → nombre exact jusqu'à 10, puis « 10+ » : version pleine
  // « Disponible · X en stock » (aperçu + buy-box) ou compacte « Dispo · X » (vignette).
  // « Sur commande »/« Indisponible » : jamais de nombre.
  const availInline = (v, compact) => {
    const s = variantState(v);
    if (s === "instock")     return `<span class="pcard__dot pcard__dot--stock" aria-hidden="true"></span>${compact ? `Dispo · ${stockLabel(v.qty)}` : `Disponible · ${stockLabel(v.qty)} en stock`}`;
    if (s === "unavailable") return `<span class="pcard__dot pcard__dot--order" aria-hidden="true"></span>Indisponible`;
    return `<span class="pcard__dot pcard__dot--order" aria-hidden="true"></span>Sur commande`;
  };
  // Ligne dispo PRODUIT (.pdp__avail) — reflète la VARIANTE sélectionnée (plus de
  // gating p.inStock produit, qui rendait toute variante « À voir en boutique ») :
  //   en stock → « À voir en boutique » (+ lien Maps) · indispo → « Indisponible »
  //   · sinon → « Sur commande » (delai-long) / « Livraison · leadTimeLabel ».
  const SHOWROOM_MAPS = "https://www.google.com/maps/dir/?api=1&destination=75%20Rue%20du%20Doyenn%C3%A9%2C%201180%20Uccle";
  const availStore = (v) => {
    const s = variantState(v || current);
    if (s === "instock")     return `<span class="pcard__dot pcard__dot--stock" aria-hidden="true"></span><strong>À voir en boutique</strong> · <a href="${SHOWROOM_MAPS}" target="_blank" rel="noopener">75 Rue du Doyenné, 1180 Uccle</a>`;
    if (s === "unavailable") return `<span class="pcard__dot pcard__dot--order" aria-hidden="true"></span><strong>Indisponible</strong>`;
    return p.longDelay
      ? `<span class="pcard__dot pcard__dot--order" aria-hidden="true"></span><strong>Sur commande</strong> · délai sur demande`
      : `<span class="pcard__dot pcard__dot--order" aria-hidden="true"></span><strong>Livraison</strong> · ${escapeHtml(p.leadTimeLabel || "3-4 semaines")}`;
  };

  // Accordéon Description + Caractéristiques (6 groupes, single-open) — le
  // mapping vit dans product-specs.mjs (source unique, rien de hardcodé). Un
  // groupe ne s'affiche que s'il porte ≥1 info ; « technique » s'affiche aussi
  // s'il existe une Référence (SKU) — celle-ci est PAR VARIANTE (data-spec-sku,
  // mis à jour dans applyVariant). Panneaux TOUJOURS dans le DOM, repliés via
  // l'attribut natif `hidden` (préserve SEO, arbre a11y et le hook SKU).
  // Majoritairement vide tant que les métafields custom.* ne sont pas remplis
  // côté Shopify (import Conductor) : ce n'est PAS un bug de code.
  const specGroups = buildProductSpecGroups(p);
  const hasSku = variants.some((v) => v && v.sku);
  const specPanelBody = (g) =>
    g.key === "description"
      ? `<p class="pdp-desc">${escapeHtml(g.text)}</p>`
      : `<dl class="pdp-specs">${g.rows.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(String(v))}</dd></div>`).join("")}${g.key === "technique" && hasSku ? `<div><dt>Référence</dt><dd data-spec-sku>${escapeHtml(current.sku || "—")}</dd></div>` : ""}</dl>${renderDimensionImages(g, escapeHtml)}`;
  const specShown = specGroups.filter((g) =>
    g.key === "description" ? !!g.text
    : g.key === "technique" ? (g.rows.length > 0 || hasSku)
    : (g.rows.length > 0 || g.images?.length > 0));
  const specAccordionHTML = specShown.length
    ? `<section class="section pdp-section pdp-acc" data-accordion>${specShown.map((g, i) => `<div class="pdp-acc__item">
        <h2 class="catalogue-head serif pdp-acc__head"><button type="button" class="pdp-acc__btn" id="pdp-acc-btn-${g.key}" aria-controls="pdp-acc-panel-${g.key}" aria-expanded="${i === 0 ? "true" : "false"}"><span class="pdp-acc__label">${escapeHtml(g.label)}</span><span class="pdp-acc__chevron" aria-hidden="true">▾</span></button></h2>
        <div class="pdp-acc__panel" id="pdp-acc-panel-${g.key}" role="region" aria-labelledby="pdp-acc-btn-${g.key}"${i === 0 ? "" : " hidden"}>${specPanelBody(g)}</div>
      </div>`).join("")}</section>`
    : "";

  const dslug = p.designer ? slugify(p.designer) : "";
  const designerHTML = !p.designer ? ""
    : designerLink
      ? `<a class="pdp__designer pdp__designer--link" href="/produits.html?designer=${encodeURIComponent(dslug)}">${escapeHtml(p.designer)}</a>`
      : `<span class="pdp__designer">${escapeHtml(p.designer)}</span>`;
  const html = `
    <div class="pdp">
      <div class="pdp__gallery">
        <span class="pdp__promo" data-promo hidden></span>
        <div class="pdp__main-wrap">
          <img class="pdp__main" data-main src="${escapeHtml(current.image || imgs[0] || "")}" srcset="${escapeHtml(srcsetFor(current.image || imgs[0] || ""))}" sizes="${MAIN_SIZES}" alt="${escapeHtml(p.name)}" fetchpriority="high" decoding="async" role="button" tabindex="0" aria-label="Agrandir la photo" />
        </div>
        ${ambiances.length ? `<div class="pdp__rail" data-rail>${ambiances.map((_src, i) => `<img class="pdp__rail-img" data-rail-img="${i}" src="${escapeHtml(ambiances[i])}" srcset="${escapeHtml(srcsetFor(ambiances[i]))}" sizes="92vw" alt="${escapeHtml(p.name + " — ambiance " + (i + 1))}" loading="lazy" decoding="async" role="button" tabindex="0" aria-label="${escapeHtml("Agrandir la photo d'ambiance " + (i + 1))}" />`).join("")}</div>` : ""}
        ${ambiances.length > 1 ? `<div class="pdp__dots" data-dots role="group" aria-label="Navigation des photos d'ambiance">${ambiances.map((_s, i) => `<button class="pdp__dot-btn${i === 0 ? " is-active" : ""}" data-dot="${i}" type="button" aria-label="Aller à la photo ${i + 1}"></button>`).join("")}</div>` : ""}
        ${ambiances.length ? `<div class="pdp__amb" data-amb-grid>${ambiances.map((_src, i) => `<img class="pdp__amb-img" data-amb="${i}" src="${escapeHtml(ambiances[i])}" srcset="${escapeHtml(srcsetFor(ambiances[i]))}" sizes="(max-width: 760px) 92vw, 26vw" alt="${escapeHtml(p.name + " — ambiance " + (i + 1))}" loading="lazy" decoding="async" role="button" tabindex="0" aria-label="${escapeHtml("Agrandir la photo d'ambiance " + (i + 1))}" />`).join("")}</div>` : ""}
      </div>
      <div class="pdp__info">
        <a class="pdp__brand" href="${brandHref}">${escapeHtml(p.brand || "")}</a>
        <h1 class="pdp__name">${escapeHtml(p.name)}</h1>
        ${designerHTML}
        <div class="pdp__price" data-price-el>${priceLabel(initialSelection ? {...p,price:current.price,priceMin:current.price,priceMax:current.price,compareAt:current.compareAtPrice} : p)}</div>
        ${variants.length > 1 ? `
        <div class="pdp__variant-pick">
          <span class="label">${escapeHtml(axisLabel)}</span>
          <button class="pdp__variant-bar" type="button" data-vard-open aria-haspopup="dialog">
            <img class="pdp__variant-img" data-coloris-img src="${escapeHtml(variantImg(current, 200))}" alt="" loading="lazy" decoding="async" />
            <span class="pdp__variant-meta">
              <span class="pdp__variant-name" data-coloris-name>${escapeHtml(current.title || "")}</span>
              <span class="pdp__variant-avail" data-coloris-avail role="status" aria-live="polite">${availInline(current)}</span>
            </span>
            <span class="pdp__variant-count">+${moreCount}&nbsp;${escapeHtml(moreWord)}</span>
            <span class="pdp__variant-bar-arrow" aria-hidden="true">→</span>
          </button>
        </div>` : ""}
        <div class="pdp__buy">
          <button class="pdp__qty-open" type="button" data-qtyd-open aria-haspopup="dialog">Quantité : <span data-qty-label>1</span> <span aria-hidden="true">▾</span></button>
          <button class="btn btn--blue pdp__cta" data-add>Ajouter au panier</button>
        </div>
        <p class="pdp__cart-status" data-cart-status></p>
        <div class="pdp__reassure">
          <p class="pdp__avail" data-avail role="status" aria-live="polite">${availStore(current)}</p>
          <ul class="trust-list" aria-label="Nos garanties"><li><svg class="trust-list__i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.2-2.8 7.6-7 9-4.2-1.4-7-4.8-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>Paiement 100&nbsp;% sécurisé</li><li><svg class="trust-list__i" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v4h4"/></svg>Retour sous 14&nbsp;jours</li><li><svg class="trust-list__i" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 7h12v8H2z"/><path d="M14 10h4l3 3v2h-7z"/><circle cx="6.5" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/></svg>Livraison en Belgique</li><li><svg class="trust-list__i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>Un conseil&nbsp;? <a href="tel:+32493837983">+32&nbsp;493&nbsp;83&nbsp;79&nbsp;83</a></li></ul>
          <p class="pdp__contact"><a href="/contact.html">Une question ? Écrivez-nous <span aria-hidden="true">→</span></a></p>
        </div>
      </div>
    </div>
    ${specAccordionHTML}`;

  return { html, imgs, thumbSrcs, widthVariant, srcsetFor, MAIN_SIZES, variants, initialSelection, current, norm, ambiances, ambThumbs,
    optionNames, isColorAxis, axisLabel, axisLabelLower, moreCount, moreWord, variantImg, variantState, availInline, availStore, hasSku };
}
