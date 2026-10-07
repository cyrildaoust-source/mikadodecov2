// Journal structuré — Mikado Deco
// --------------------------------
// Une ligne JSON par événement, lisible et filtrable dans les logs Vercel
// (et par un futur log drain). `logEvent('error', { msg, path })` écrit sur
// stderr ; les autres niveaux sur stdout. Aucune dépendance.
//
// Champs toujours présents : ts (ISO), level. Le reste vient de l'appelant
// (route, status, ms, requestId…). Les valeurs non sérialisables sont ignorées.

function logEvent(level, fields = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, ...fields }, (_key, value) => {
    if (value instanceof Error) return { message: value.message, stack: shortStack(value) };
    return value;
  });
  (level === 'error' || level === 'warn' ? console.error : console.log)(line);
}

// Les 4 premières lignes de la pile suffisent à localiser une erreur ; au-delà,
// c'est du bruit dans les logs (et du volume facturé par un drain).
function shortStack(error, lines = 4) {
  return String(error?.stack || '').split('\n').slice(0, lines).join('\n');
}

module.exports = { logEvent, shortStack };
