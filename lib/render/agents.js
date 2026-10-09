// Réponses pour agents et outils : markdown, 404 texte, extraction markdown d'une page.
// Extrait de server.js (phase 1 du plan d'architecture, octobre 2026) — code déplacé, pas réécrit.
const { ORIGIN } = require('../config');
const { absUrl } = require('./og');

// ─── AGENT READINESS · négociation text/markdown + 404 lisibles par les agents ──
// Les agents IA (ChatGPT, Claude, Perplexity…) demandent souvent `Accept:
// text/markdown` (convention acceptmarkdown.com) et n'annoncent pas text/html.
// On leur sert alors une version markdown sobre de la page (titre, description,
// titres, paragraphes, liens absolus) ; les navigateurs, qui annoncent
// explicitement text/html, reçoivent l'HTML inchangé. `Vary: Accept` est
// OBLIGATOIRE dès qu'une URL varie selon Accept, sinon le CDN Vercel peut
// servir la variante HTML en cache à un agent (ou l'inverse). res.vary() AJOUTE
// la valeur (ne remplace pas le `Vary: Origin` posé par cors).
const AGENT_LINKS = `\n\n---\n\n- Sitemap : ${ORIGIN}/sitemap.xml\n- Guide agents : ${ORIGIN}/llms.txt\n`
  + `- Catalogue : ${ORIGIN}/produits.html\n- Marques : ${ORIGIN}/marques.html\n- Contact : ${ORIGIN}/contact.html\n`;
// Préférence EXPLICITE pour le markdown (q > text/html, ou text/html absent).
// `*/*` seul (curl, monitoring) reste sur l'HTML : on ne change rien pour eux.
const wantsMarkdown = (req) => req.accepts(['text/html', 'text/markdown']) === 'text/markdown';
// 404 : un navigateur annonce toujours text/html en clair ; un agent ou un
// outil envoie `*/*` (ou rien) → corps markdown court avec des liens de reprise.
const acceptsHtmlExplicitly = (req) => /text\/html/i.test(String(req.headers.accept || ''));
function sendMarkdown(res, md) {
  res.vary('Accept');
  res.set('Content-Type', 'text/markdown; charset=utf-8');
  return res.send(md);
}
const markdown404 = (reqPath) =>
  `# 404 — Page introuvable\n\nAucune page à l'adresse ${String(reqPath).replace(/[`\n\r]/g, '')} sur ${ORIGIN}.\n\n`
  + `Où chercher ensuite :${AGENT_LINKS}`;
// 410 : fiche retirée pour de bon (table des redirections de l'importateur, ADR 0014).
const markdown410 = (reqPath) =>
  `# 410 — Cette pièce n'est plus proposée\n\nLa page ${String(reqPath).replace(/[`\n\r]/g, '')} sur ${ORIGIN} a été retirée définitivement.\n\n`
  + `Où chercher ensuite :${AGENT_LINKS}`;
// Conversion HTML → markdown sans dépendance : on part du <main> de la page
// AVANT injection du chrome (nav/pied/panier exclus), scripts/styles retirés,
// titres/listes/gras/liens convertis, entités décodées. Pas de rendu de nœuds
// imbriqués complexes : c'est un extrait fidèle, pas un rendu exhaustif.
function htmlToMarkdown(html, url) {
  const grp = (re) => { const m = html.match(re); return m ? m[1] : ''; };
  const dec = (s) => String(s || '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
  const title = dec(grp(/<title[^>]*>([\s\S]*?)<\/title>/i)).replace(/\s+/g, ' ').trim();
  const desc  = dec(grp(/<meta\s+name="description"\s+content="([^"]*)"/i)).trim();
  let body = grp(/<main[^>]*>([\s\S]*?)<\/main>/i) || grp(/<body[^>]*>([\s\S]*?)<\/body>/i) || html;
  body = body
    .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<img\b[^>]*\balt="([^"]*)"[^>]*>/gi, (_, a) => (a ? ` ${a} ` : ''))
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    // Titre sur UNE ligne : un <br> ou un retour dans le <h1> casserait l'en-tête markdown.
    .replace(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, h, t) => `\n\n${'#'.repeat(+h[1])} ${t.replace(/<br\s*\/?>|\s+/gi, ' ').trim()}\n\n`)
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, '_$2_')
    .replace(/<a\b[^>]*\bhref="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, t) => {
      const label = t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      return label ? `[${label}](${absUrl(href)})` : '';
    })
    .replace(/<\/(p|div|section|article|header|footer|ul|ol|tr|blockquote|figure|figcaption)>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ');
  body = dec(body).replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return `# ${title || 'Mikado Deco'}\n\n${desc ? '> ' + desc + '\n\n' : ''}Source : ${url}\n\n${body}${AGENT_LINKS}`;
}

module.exports = { acceptsHtmlExplicitly, htmlToMarkdown, markdown404, markdown410, sendMarkdown, wantsMarkdown };
