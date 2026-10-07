// Lecture mémorisée de v3/designers-data.json.
// Extrait de server.js (phase 1 du plan d'architecture, octobre 2026) — code déplacé, pas réécrit.
const fs = require('fs');
const path = require('path');
const { V3_DIR } = require('./paths');

// designers-data.json mis en cache module — on ne mémorise QUE le succès non
// vide : un échec de lecture transitoire (cold start, bundle partiel) renvoie
// [] sans être figé, et la lecture suivante réessaie (≠ d'un [] collant).
let _designers = null;
function getDesigners() {
  if (_designers) return _designers;
  try {
    const data = JSON.parse(fs.readFileSync(path.join(V3_DIR, 'designers-data.json'), 'utf8'));
    const arr = Array.isArray(data) ? data : (data.designers || []);
    if (arr.length) _designers = arr;
    return arr;
  } catch (e) {
    return [];
  }
}

module.exports = { getDesigners };
