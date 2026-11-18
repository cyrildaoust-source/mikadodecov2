import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildProductEssentials } from '../v3/product-specs.mjs';

test('« L’essentiel » reprend les faits de la fiche, sans rien inventer, cinq lignes au plus', () => {
  const rows = buildProductEssentials({ dimensions: 'L 42 × P 50 × H 82 cm', material: 'Acier', usage: 'Intérieur / Extérieur', origin: 'Fabriqué en France', year: '1889', warranty: '10 ans, garantie fabricant Vitra (usage privé)', capacity: '' });
  assert.deepEqual(rows.map(r => r[0]), ['Dimensions', 'Matériaux', 'Usage', 'Fabrication', 'Création']);
  assert.deepEqual(buildProductEssentials({ warranty: '10 ans, garantie fabricant' }), [['Garantie', '10 ans']]);
  assert.deepEqual(buildProductEssentials({}), []);
});
