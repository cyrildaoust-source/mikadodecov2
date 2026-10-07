// Politique de sécurité du contenu (CSP) — Mikado Deco
// ------------------------------------------------------
// Avant : un en-tête global dans vercel.json avec `script-src 'unsafe-inline'`, imposé
// par les scripts inline des pages et les gestionnaires `onload`/`onerror` dans le HTML.
// Une injection HTML (XSS) pouvait donc exécuter du script.
//
// Maintenant : l'en-tête est posé par le serveur pour chaque page HTML, avec un NONCE
// propre à la réponse. Seuls les scripts qui portent ce nonce (ajouté par injectChrome
// sur les scripts inline légitimes : gardes anti-flash, petits modules, données) et les
// scripts servis par le site (ou unpkg pour Leaflet) s'exécutent. Plus de 'unsafe-inline'
// pour les scripts ; les styles le gardent (attributs style= et blocs <style> des pages).
//
// Les hôtes autorisés reprennent exactement l'ancien en-tête de vercel.json.
const crypto = require('crypto');

const DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", 'https://unpkg.com'],               // + 'nonce-…' par requête
  'style-src': ["'self'", "'unsafe-inline'", 'https://use.typekit.net', 'https://p.typekit.net', 'https://unpkg.com'],
  'img-src': ["'self'", 'data:', 'https://cdn.shopify.com', 'https://www.fermob.com', 'https://use.typekit.net', 'https://p.typekit.net', 'https://unpkg.com', 'https://tile.openstreetmap.org'],
  'font-src': ["'self'", 'data:', 'https://use.typekit.net'],
  'connect-src': ["'self'", 'https://use.typekit.net', 'https://p.typekit.net'],
  'frame-ancestors': ["'self'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
};

function newNonce() {
  return crypto.randomBytes(16).toString('base64');
}

function cspHeader(nonce) {
  return Object.entries(DIRECTIVES).map(([name, values]) => {
    const list = name === 'script-src' && nonce ? [...values, `'nonce-${nonce}'`] : values;
    return `${name} ${list.join(' ')}`;
  }).join('; ');
}

// Pose le nonce sur chaque <script> exécutable sans src (les blocs JSON et JSON-LD ne
// s'exécutent pas et n'en ont pas besoin ; les scripts avec src sont couverts par 'self').
// Idempotent : un script déjà pourvu d'un nonce n'est pas touché.
const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)(?![^>]*\bnonce=)(?![^>]*type="application\/(?:ld\+)?json")([^>]*)>/g;
function addNonce(html, nonce) {
  return html.replace(INLINE_SCRIPT, (_m, attrs) => `<script nonce="${nonce}"${attrs}>`);
}

module.exports = { DIRECTIVES, newNonce, cspHeader, addNonce };
