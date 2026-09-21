// Pure shared card markup: rendered by Express and enhanced in the browser.
import {escapeHtml, priceLabel} from './format.mjs';
import {productHref} from './navigation.mjs';
import {finishHTML} from './product-finishes.mjs';

export function selectionLabel(quantity) {
  return quantity === 0 ? '+ Ajouter à la sélection' : quantity === 1 ? 'Dans la sélection' : `Dans la sélection (${quantity})`;
}

// FR plurals — overrides for option names where the naive "+ s" rule misleads.
const VARIANT_PLURALS = {
  "Couleur": "finitions",
  "Coloris": "finitions",
  "Taille": "tailles",
  "Dimensions": "dimensions",
  "Structure": "structures",
  "Coussin": "coussins",
  "Patin": "patins",
  "Assise": "assises",
  "Essence bois": "essences de bois",
  "Couleur cadre": "finitions de cadre",
  "Modèle": "modèles",
  "Finition": "finitions",
  "Forme": "formes",
  "Geste": "gestes",
};
const pluralize = (name) => VARIANT_PLURALS[name] || (name.toLowerCase().endsWith("s") ? name.toLowerCase() : name.toLowerCase() + "s");

// "25 couleurs" · "3 tailles" · "120 variantes" — empty string when the product
// has a single variant or only one distinct value on its primary option.
function variantBadge(p) {
  if (Array.isArray(p?.variantOptions)) {
    const ranked = [...p.variantOptions].sort((a,b)=>b.count-a.count);
    if (ranked[0]?.count > 1) return `${ranked[0].count} ${pluralize(ranked[0].name)}`;
    return p.variantCount > 1 ? `${p.variantCount} variantes` : '';
  }
  const vs = Array.isArray(p?.variants) ? p.variants : [];
  if (vs.length < 2) return "";
  // primary option: the one with the most distinct values; ties → first option
  const tally = {};
  for (const v of vs) for (const o of (v.options || [])) {
    if (!o?.name) continue;
    tally[o.name] = tally[o.name] || new Set();
    tally[o.name].add(o.value);
  }
  const ranked = Object.entries(tally).sort((a, b) => b[1].size - a[1].size);
  if (!ranked.length) return `${vs.length} variantes`;
  const [name, values] = ranked[0];
  if (values.size < 2) return vs.length > 1 ? `${vs.length} variantes` : "";
  return `${values.size} ${pluralize(name)}`;
}

export function productCardHTML(p, {source = '', quantity = 0, interactive = true} = {}) {
  const href = escapeHtml(productHref(p, typeof source === 'string' ? source : ''));
  const alt = p.image2 && p.image2 !== p.image ? `<img class="alt" src="${escapeHtml(p.image2)}" alt="" loading="lazy" decoding="async" />` : "";
  const tag = p.badge === "nouveau" ? `<span class="tag">Nouveau</span>`
    : p.badge === "bestseller" ? `<span class="tag">Coup de cœur</span>`
    : p.badge === "limite" ? `<span class="tag">Édition limitée</span>` : "";
  return `
    <div class="pcard">
      <a class="pcard__media" href="${href}" aria-label="${escapeHtml(p.name)}">
        <div class="pcard__tags">${tag}</div>
        <span class="pcard__promo" data-promo-slot hidden></span>
        ${p.compareAt && p.price && p.compareAt - (p.priceIsExact ? p.price : p.priceMin ?? p.price) > 0.5 ? `<span class="pcard__sale">−${Math.round((p.compareAt - (p.priceIsExact ? p.price : p.priceMin ?? p.price)) / p.compareAt * 100)}%</span>` : ""}
        <img class="main" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name + (p.finishLabel ? ' · ' + p.finishLabel : ''))}" loading="lazy" decoding="async" />
        ${alt}
      </a>
      <div class="pcard__brand">${escapeHtml(p.brand || "")}</div>
      <div class="pcard__row">
        <a class="pcard__name" href="${href}">${escapeHtml(p.name)}</a>
        ${variantBadge(p) ? `<span class="pcard__variants">${escapeHtml(variantBadge(p))}</span>` : ""}
      </div>
      ${finishHTML(p)}
      ${p.availabilityLabel
        ? `<div class="pcard__avail"><span class="pcard__dot pcard__dot--${p.inStock ? 'stock' : 'order'}" aria-hidden="true"></span>${escapeHtml(p.availabilityLabel)}</div>`
        : p.inStock
        ? `<div class="pcard__avail"><span class="pcard__dot pcard__dot--stock" aria-hidden="true"></span>À voir en boutique</div>`
        : `<div class="pcard__avail"><span class="pcard__dot pcard__dot--order" aria-hidden="true"></span>${p.longDelay ? "Sur commande · délai sur demande" : "Livraison " + escapeHtml(p.leadTimeLabel || "3-4 semaines")}</div>`}
      <div class="pcard__price">${priceLabel(p)}</div>
      ${interactive ? `<button class="btn btn--outline btn--block pcard__cta" data-add
        ${p.purchaseDisabled ? 'disabled' : ''}
        data-variant="${escapeHtml(p.variantId)}" data-handle="${escapeHtml(p.handle || p.id)}"
        data-name="${escapeHtml(p.name)}" data-brand="${escapeHtml(p.brand || "")}"
        data-price="${p.price || 0}" data-image="${escapeHtml(p.image || "")}">
        ${p.purchaseDisabled ? 'Indisponible' : selectionLabel(quantity)}
      </button>` : ''}
    </div>`;
}

