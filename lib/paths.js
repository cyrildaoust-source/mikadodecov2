// Chemins du dépôt, résolus une fois : les modules de lib/ et routes/ ne font plus
// de `path.join(__dirname, 'v3', …)` chacun à leur profondeur.
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const V3_DIR = path.join(ROOT_DIR, 'v3');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'templates');
const DATA_DIR = path.join(ROOT_DIR, 'data');

module.exports = { ROOT_DIR, V3_DIR, TEMPLATES_DIR, DATA_DIR };
