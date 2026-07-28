const hasValue = (value) => value != null && String(value).trim() !== "";

export function buildProductSpecRows(product = {}) {
  const rows = [];
  const add = (label, value) => {
    if (hasValue(value)) rows.push([label, value]);
  };

  add("Dimensions", product.dimensions);
  add(
    "Matériaux / Finitions",
    product.material || product.constructionMaterials,
  );
  add("Usage", product.usage);
  add("Entretien", product.entretien);
  add("Designer", product.designer);
  add("Année / Édition", product.year);
  add("Fabrication / Origine", product.origin);
  add("Poids", product.weight);

  add("Type de luminaire", product.lightingType);
  add("Source lumineuse", product.lightSourceType || product.ledType);
  add("Puissance", product.power);
  add("Alimentation / Voltage", product.voltage);
  add("Température de couleur", product.colorTemperature);
  add("Variation", product.dimming);
  add("Autonomie", product.batteryRuntime);
  add("Temps de charge", product.chargingTime);
  add("Câble fourni", product.cableDetails);
  add("Indice de protection", product.ipRating);
  add("Classe électrique", product.safetyClass);
  add("Étiquette énergétique", product.energyLabel);
  add("Éléments remplaçables", product.lightSourceReplaceable);

  add("Garantie", product.warranty);
  return rows;
}

/**
 * Source UNIQUE du regroupement des specs de la PDP (accordéon 6 groupes).
 * Aucune valeur produit n'est codée en dur : tout vient de `product`. Les champs
 * futurs (collection, manufacturer, certifications, testsAndStandards…) sont
 * référencés par nom : absents ⇒ ligne omise, groupe potentiellement vide.
 *
 * Retourne TOUJOURS les 6 groupes dans l'ordre. Un groupe « rows/text » peut
 * être vide : c'est l'appelant (produit.html) qui décide s'il l'affiche —
 * notamment le groupe « technique », qui s'affiche aussi quand une Référence
 * (SKU par variante) existe, celle-ci étant ajoutée côté page (hors mapping).
 */
export function buildProductSpecGroups(product = {}) {
  const row = (label, value) => (hasValue(value) ? [[label, value]] : []);
  const text = hasValue(product.description) ? String(product.description) : "";

  return [
    { key: "description", label: "Description", text },
    {
      key: "dimensions",
      label: "Dimensions",
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
        ...row("Entretien", product.entretien),
      ],
    },
    {
      key: "technique",
      label: "Caractéristiques techniques",
      // La Référence (SKU) est PAR VARIANTE → ajoutée dans produit.html, pas ici.
      rows: [
        ...row("Usage", product.usage),
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
