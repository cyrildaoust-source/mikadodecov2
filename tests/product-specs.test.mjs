import assert from "node:assert/strict";
import test from "node:test";

import { buildProductSpecRows, buildProductSpecGroups } from "../v3/product-specs.mjs";

test("builds ordered general and technical characteristics", () => {
  const rows = buildProductSpecRows({
    dimensions: "Ø 11 × H 25,5 cm",
    material: "Chêne et aluminium",
    usage: "Intérieur",
    designer: "Teruhiro Yanagihara",
    year: 2026,
    origin: "Édité par &Tradition",
    weight: "0,7 kg",
    lightingType: "Lampe portable rechargeable",
    lightSourceType: "LED intégrée variable",
    ledType: "LED intégrée",
    power: "3,5 W",
    voltage: "Recharge 5 V / 2 A",
    dimming: "3 niveaux : 100 % / 50 % / 20 %",
    batteryRuntime: "Jusqu'à 10 heures",
    chargingTime: "Environ 8 heures",
    cableDetails: "Câble magnétique USB-A, 200 cm",
    ipRating: "IP44",
    safetyClass: "Classe II",
    lightSourceReplaceable: "Batterie et module LED remplaçables",
  });

  assert.deepEqual(rows.slice(0, 3), [
    ["Dimensions", "Ø 11 × H 25,5 cm"],
    ["Matériaux / Finitions", "Chêne et aluminium"],
    ["Usage", "Intérieur"],
  ]);
  assert.ok(rows.some(([label, value]) => (
    label === "Autonomie" && value === "Jusqu'à 10 heures"
  )));
  assert.ok(rows.some(([label, value]) => (
    label === "Indice de protection" && value === "IP44"
  )));
  assert.equal(
    rows.filter(([label]) => label === "Source lumineuse").length,
    1,
  );
});

test("omits empty rows and uses construction materials as fallback", () => {
  assert.deepEqual(buildProductSpecRows({
    constructionMaterials: "Acier inoxydable",
    warranty: "",
  }), [
    ["Matériaux / Finitions", "Acier inoxydable"],
  ]);
});

// ── buildProductSpecGroups (accordéon PDP) ──────────────────────────────────
const KEYS = ["description", "dimensions", "materiaux", "technique", "conception", "documents"];

test("always returns the 6 groups in the fixed order", () => {
  const groups = buildProductSpecGroups({});
  assert.deepEqual(groups.map((g) => g.key), KEYS);
  // Description porte `text`, les autres portent `rows`.
  assert.equal(groups[0].text, "");
  for (const g of groups.slice(1)) assert.ok(Array.isArray(g.rows));
});

test("routes fields into the right groups", () => {
  const groups = buildProductSpecGroups({
    description: "Une lampe portable.",
    dimensions: "Ø395×H1200mm",
    weight: "0,7 kg",
    material: "Chêne et aluminium",
    entretien: "Chiffon doux",
    usage: "Intérieur",
    lightingType: "Lampe portable rechargeable",
    ipRating: "IP44",
    year: 2026,
    origin: "Édité par &Tradition",
    warranty: "2 ans",
  });
  const by = Object.fromEntries(groups.map((g) => [g.key, g]));
  assert.equal(by.description.text, "Une lampe portable.");
  assert.deepEqual(by.dimensions.rows, [["Dimensions", "Ø395×H1200mm"], ["Poids", "0,7 kg"]]);
  assert.deepEqual(by.materiaux.rows, [["Matériaux / Finitions", "Chêne et aluminium"], ["Entretien", "Chiffon doux"]]);
  assert.ok(by.technique.rows.some(([l, v]) => l === "Usage" && v === "Intérieur"));
  assert.ok(by.technique.rows.some(([l, v]) => l === "Indice de protection" && v === "IP44"));
  assert.ok(by.conception.rows.some(([l, v]) => l === "Année / Édition" && v === 2026));
  assert.ok(by.conception.rows.some(([l, v]) => l === "Fabrication / Origine"));
  assert.deepEqual(by.documents.rows, [["Garantie", "2 ans"]]);
});

test("empty product yields empty groups (masking is caller's job)", () => {
  const groups = buildProductSpecGroups({});
  assert.equal(groups.find((g) => g.key === "description").text, "");
  for (const g of groups.filter((g) => g.key !== "description")) {
    assert.equal(g.rows.length, 0);
  }
});

test("never emits the per-variant SKU / Référence row (handled in produit.html)", () => {
  const groups = buildProductSpecGroups({ usage: "Intérieur", dimensions: "Ø395×H1200mm" });
  const labels = groups.flatMap((g) => (g.rows || []).map(([l]) => l));
  assert.ok(!labels.includes("Référence"));
});

test("uses constructionMaterials fallback and hides Fabricant when equal to vendor", () => {
  const groups = buildProductSpecGroups({
    constructionMaterials: "Acier inoxydable",
    manufacturer: "Vitra",
    brand: "Vitra",
  });
  const by = Object.fromEntries(groups.map((g) => [g.key, g]));
  assert.deepEqual(by.materiaux.rows, [["Matériaux / Finitions", "Acier inoxydable"]]);
  assert.ok(!by.conception.rows.some(([l]) => l === "Fabricant"));
});

test("shows Fabricant only when distinct from vendor", () => {
  const groups = buildProductSpecGroups({ manufacturer: "Artek", brand: "Vitra" });
  const conception = groups.find((g) => g.key === "conception");
  assert.ok(conception.rows.some(([l, v]) => l === "Fabricant" && v === "Artek"));
});
