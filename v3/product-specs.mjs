const hasValue = (value) => value != null && String(value).trim() !== "";

export function buildProductSpecGroups(product = {}) {
  const row = (label, value) => (hasValue(value) ? [[label, value]] : []);
  const text = hasValue(product.description) ? String(product.description) : "";

  return [
    { key: "description", label: "Description", text },
    {
      key: "dimensions",
      label: "Dimensions",
      images: Array.isArray(product.dimensionImages) ? product.dimensionImages : [],
      rows: [
        ...row("Dimensions", product.dimensions),
        ...row("Poids", product.weight),
      ],
    },
    {
      key: "materiaux",
      label: "Matériaux & entretien",
      rows: [
        ...row("Matériaux / Finitions", product.material || product.constructionMaterials),
        ...row("Résistance à l’abrasion", product.martindale),
        ...row("Entretien", product.entretien),
      ],
    },
    {
      key: "technique",
      label: "Caractéristiques techniques",
      // La Référence (SKU) est PAR VARIANTE → ajoutée dans produit.html, pas ici.
      rows: [
        ...row("Usage", product.usage),
        ...row("Capacité", product.capacity),
        ...row("Infos électriques", product.infosElectriques),
        ...row("Type de luminaire", product.lightingType),
        ...row("Source lumineuse", product.lightSourceType || product.ledType),
        ...row("Puissance", product.power),
        ...row("Alimentation / Voltage", product.voltage),
        ...row("Température de couleur", product.colorTemperature),
        ...row("Variation", product.dimming),
        ...row("Autonomie", product.batteryRuntime),
        ...row("Temps de charge", product.chargingTime),
        ...row("Câble fourni", product.cableDetails),
        ...row("Indice de protection", product.ipRating),
        ...row("Classe électrique", product.safetyClass),
        ...row("Étiquette énergétique", product.energyLabel),
        ...row("Éléments remplaçables", product.lightSourceReplaceable),
      ],
    },
    {
      key: "conception",
      label: "Conception & fabrication",
      // Designer volontairement absent : déjà affiché sous le titre (pas de doublon).
      // « Fabricant » masqué s'il est identique au vendor (évite de répéter la marque).
      rows: [
        ...row("Année / Édition", product.year),
        ...row("Collection", product.collection),
        ...row("Fabricant", product.manufacturer && product.manufacturer !== product.brand ? product.manufacturer : ""),
        ...row("Fabrication / Origine", product.origin),
      ],
    },
    {
      key: "documents",
      label: "Documents & conformité",
      rows: [
        ...row("Garantie", product.warranty),
        ...row("Certifications", product.certifications),
        ...row("Tests & normes", product.testsAndStandards),
      ],
    },
  ];
}

// Shared by server rendering and the hydrated PDP. Images stay in Dimensions,
// including when no textual measurement has been supplied yet.
export function renderDimensionImages(group, escapeHtml) {
  if (group.key !== "dimensions") return "";
  return (group.images || []).filter(image => {
    try { const u = new URL(image.url); return u.protocol === "https:" && u.hostname === "cdn.shopify.com"; }
    catch { return false; }
  }).map(image => `<figure class="pdp-dimension-image"><a data-dimension-image href="${escapeHtml(image.url)}" target="_blank" rel="noopener" aria-label="Agrandir le dessin de dimensions"><img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt || "Dessin de dimensions")}" loading="lazy" decoding="async" /></a></figure>`).join("");
}
