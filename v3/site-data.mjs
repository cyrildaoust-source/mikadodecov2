/* Données du site écrites par le serveur dans chaque page (#site-data) : menu,
   marques actives, promotions, réglages du méga menu, version. Lues sans appel
   réseau ; chaque appelant garde son appel en secours si la valeur manque. */
let _siteData;
export function siteData(key) {
  if (_siteData === undefined) {
    try { _siteData = JSON.parse(document.getElementById("site-data")?.textContent || "null") || {}; }
    catch { _siteData = {}; }
  }
  return _siteData[key];
}

/* ---------- build SHA / cache busting des images ----------
   Vercel sert /images/* en `Cache-Control: immutable` : un logo mis à jour reste
   invisible pour les visiteurs qui l'ont en cache. On ajoute le SHA du build aux
   URL d'images longuement cachées : chaque déploiement → nouveau SHA → ?v= change.
   buildShaReady() se résout dès que la version est connue (page, ou /api/build). */
let _buildSha = siteData("build") || "";
const _buildShaPromise = _buildSha ? Promise.resolve() : fetch("/api/build", { cache: "no-store" })
  .then((r) => (r.ok ? r.json() : null))
  .then((d) => { _buildSha = (d && d.sha) || ""; })
  .catch(() => { _buildSha = ""; });
export const buildShaReady = () => _buildShaPromise;
export const versionedImg = (path) => {
  if (!_buildSha) return path;
  return path + (path.includes("?") ? "&" : "?") + "v=" + _buildSha;
};
