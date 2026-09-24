// Pure presentation helpers shared by server and browser.
/* ---------- formatting ---------- */
export const euro = (n) =>
  n || n === 0
    ? new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2 }).format(n)
    : "";

// Public stock counts stay precise up to 10; purchase checks use the real stock.
export const stockLabel = (quantity) => quantity > 10 ? "10+" : String(quantity);

// Card / PDP price label. Returns "À partir de X €" when the product has a
// variant price range; otherwise the plain price. Falls back to p.price when
// priceMin/priceMax aren't on the object (older feeds / safety).
export const priceLabel = (p) => {
  const min = p?.priceIsExact ? p.price : p?.priceMin ?? p?.price;
  const max = p?.priceIsExact ? p.price : p?.priceMax ?? p?.price;
  const was = p?.compareAt;
  if (was != null && min != null && was > min) return `<span class="price-was">${euro(was)}</span><span class="price-now price-now--sale">${euro(min)}</span>`;
  if (min != null && max != null && max - min > 0.5) return `À partir de ${euro(min)}`;
  return euro(min);
};

export const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const slugify = (s) =>
  String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ø/g, "o").replace(/æ/g, "ae").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
