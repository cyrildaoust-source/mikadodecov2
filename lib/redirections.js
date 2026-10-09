// Redirections des anciennes fiches produit — Mikado Deco (ADR 0014)
// -------------------------------------------------------------------
// data/redirections.json est produit par l'importateur (schéma mikado.redirections@2, exports/site/
// de mikado-importer) et copié tel quel dans le dépôt du site : chaque nouvelle livraison remplace la
// précédente, le site ne l'édite jamais à la main. Seul le champ `status` décide :
//
//   { "from": "ancien-handle", "to": "handle-publie" | "/collections/<handle>", "status": 301 }
//   { "from": "ancien-handle", "status": 410 }   // retirée pour de bon, aucune destination
//
// Règle d'or, posée par l'importateur : UNE FICHE PUBLIÉE PASSE TOUJOURS AVANT LA TABLE. Les routes
// cherchent d'abord la fiche dans Shopify ; la table ne s'applique qu'aux handles sans fiche publiée.
// Les sections `a_verifier`, `rules` et `incomplete` du fichier sont ignorées (Cyril tranche).
// Pas de règles dans vercel.json : 4 386 entrées dépassent sa limite (2 048) et seraient aveugles à
// la fiche publiée.
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./paths');

const SCHEMA = 'mikado.redirections@2';
const FILE = path.join(DATA_DIR, 'redirections.json');
// 301 et 410 : une fiche republiée sous un ancien handle réapparaît en une heure au plus à l'edge
// (pas de purge par URL sur Vercel), cinq minutes au plus dans un navigateur.
const CACHE_CONTROL = 'public, max-age=300, s-maxage=3600';

let table = { schema: null, generatedAt: null, counts: {}, entries: 0, error: null };
const MAP = new Map();
try {
  const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  if (raw.schema !== SCHEMA) throw new Error(`schéma ${raw.schema || 'absent'} (attendu ${SCHEMA})`);
  for (const e of raw.redirections || []) {
    if (!e || typeof e.from !== 'string' || !e.from) continue;
    if (e.status === 410) MAP.set(e.from, { status: 410 });
    else if (e.status === 301 && typeof e.to === 'string' && e.to) MAP.set(e.from, { status: 301, to: e.to });
  }
  table = { schema: raw.schema, generatedAt: raw.generated_at || null, counts: raw.counts || {}, entries: MAP.size, error: null };
} catch (e) {
  // Table absente ou invalide : le site fonctionne sans redirections (404 comme avant), et /api/health le dit.
  table = { schema: null, generatedAt: null, counts: {}, entries: 0, error: e.message };
  console.warn('[redirections] table ignorée :', e.message);
}

// Entrée de la table pour un ancien handle ; null si inconnu.
const lookupRedirect = (handle) => MAP.get(String(handle || '')) || null;
// Cible HTTP d'une entrée 301 : un chemin tel quel, ou la fiche publiée du nouveau handle.
const redirectTarget = (entry) => (entry.to.startsWith('/') ? entry.to : '/produit.html?handle=' + encodeURIComponent(entry.to));
// Pour /api/health et les tests.
const redirectionStats = () => ({ ...table });

module.exports = { CACHE_CONTROL, SCHEMA, lookupRedirect, redirectTarget, redirectionStats };
