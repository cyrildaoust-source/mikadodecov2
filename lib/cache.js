// Cache mémoire du serveur — Mikado Deco
// --------------------------------------
// Remplace l'objet `_cache` global de server.js : mêmes clés, même sémantique
// (`cached` sert la valeur tant que `expiry` n'est pas passé, sinon recharge),
// mais BORNÉ : au-delà de MAX_ENTRIES entrées, la plus ancienne est évincée.
// Les clés par terme de recherche, curseur ou filtre ne font plus grossir la
// mémoire d'une instance chaude sans limite.
//
// Ce cache vit par instance serverless : il n'est pas partagé entre instances
// et repart vide à chaque cold start. La fraîcheur côté visiteur est assurée
// par le cache edge (en-têtes s-maxage), pas par celui-ci.
//
// API :
//   cached(key, fetcher, ttl)   valeur fraîche ou résultat de fetcher() (mémorisé ttl ms)
//   peek(key)                   entrée brute { data, expiry } même expirée, ou undefined
//   setEntry(key, entry)        pose une entrée { data, expiry } telle quelle
//   del(key) · delByPrefix(p)   invalidation ciblée (webhook /api/revalidate)
//   clear() · size() · stats()  outillage et tests

const MAX_ENTRIES = 500;
const DEFAULT_TTL = 300_000;   // 5 min, comme avant

const store = new Map();       // key → { data, expiry } ; ordre d'insertion = ordre d'éviction
const stats = { hits: 0, misses: 0, evictions: 0 };

function peek(key) {
  return store.get(key);
}

function setEntry(key, entry) {
  if (store.has(key)) store.delete(key);          // ré-insertion en fin → l'entrée redevient « récente »
  store.set(key, entry);
  while (store.size > MAX_ENTRIES) {
    store.delete(store.keys().next().value);
    stats.evictions++;
  }
  return entry;
}

async function cached(key, fetcher, ttl = DEFAULT_TTL) {
  const now = Date.now();
  const entry = store.get(key);
  if (entry && entry.expiry > now) { stats.hits++; return entry.data; }
  stats.misses++;
  const data = await fetcher();
  setEntry(key, { data, expiry: now + ttl });
  return data;
}

function del(key) { return store.delete(key); }

function delByPrefix(prefix) {
  let n = 0;
  for (const key of [...store.keys()]) if (key.startsWith(prefix)) { store.delete(key); n++; }
  return n;
}

function clear() { store.clear(); }
function size() { return store.size; }
function snapshot() { return { ...stats, size: store.size, max: MAX_ENTRIES }; }

module.exports = { cached, peek, setEntry, del, delByPrefix, clear, size, stats: snapshot, MAX_ENTRIES, DEFAULT_TTL };
