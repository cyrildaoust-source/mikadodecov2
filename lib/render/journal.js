// Articles du journal rendus depuis leur source — Mikado Deco (ADR 0013)
// ----------------------------------------------------------------------
// La source unique est v3/journal/articles.data.mjs (ESM : contenu rédigé à la main). Chaque
// article devient un FRAGMENT du layout unique (lib/render/layout.js) à la demande, mémorisé par
// processus : plus de fichiers HTML générés à committer. Code déplacé de scripts/build-journal.mjs
// (générateur supprimé), pas réécrit — mêmes classes .article__*, .prose, .readbar, .btn--blue.
//
// La donnée est un module ESM : son chargement est asynchrone. Les routes attendent `journalReady`
// avant de rendre un article (comme `chromeReady` pour le chrome).
const path = require('path');
const { pathToFileURL } = require('url');
const { ORIGIN } = require('../config');
const { V3_DIR } = require('../paths');

const OG_DEFAULT = ORIGIN + '/images/og-default.jpg';
// Aucune étiquette au-dessus du titre (règle de DESIGN.md) : seule la durée de lecture est
// gardée, sous le titre. « Maison · 6 min » → « 6 min de lecture ».
const readTime = (meta) => { const m = String(meta || '').match(/(\d+)\s*min/); return m ? `${m[1]} min de lecture` : ''; };
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const attrEsc = (s) => esc(s).replace(/"/g, '&quot;');
const absUrl = (u) => (/^https?:\/\//i.test(u) ? u : ORIGIN + (u.charAt(0) === '/' ? u : '/' + u));

// Garde-fou : un article mal formé (champ manquant) est refusé au chargement avec un message
// nommant le slug — jamais de src="undefined" ni de HTML cassé.
function validate(slug, a) {
  for (const k of ['title', 'meta', 'lead', 'img']) {
    if (typeof a[k] !== 'string' || !a[k]) throw new Error(`Article "${slug}" : champ "${k}" manquant ou invalide.`);
  }
  if (!Array.isArray(a.body) || a.body.length === 0) throw new Error(`Article "${slug}" : "body" doit être un tableau non vide.`);
  if (a.cta && (!a.cta.href || !a.cta.label)) throw new Error(`Article "${slug}" : "cta" incomplet (href + label requis).`);
}

let _articles = null, _loadError = null;
const journalReady = import(pathToFileURL(path.join(V3_DIR, 'journal', 'articles.data.mjs')).href)
  .then((m) => {
    for (const [slug, a] of Object.entries(m.ARTICLES)) validate(slug, a);
    _articles = m.ARTICLES;
  })
  .catch((e) => { _loadError = e; console.warn('[journal] chargement des articles impossible :', e.message); });

const articles = () => {
  if (_loadError) throw new Error(`journal indisponible : ${_loadError.message}`);
  if (!_articles) throw new Error('journal pas encore chargé : attendre journalReady');
  return _articles;
};
const articleSlugs = () => Object.keys(articles());
const getArticle = (slug) => articles()[slug] || null;

// Rendu d'UN article → fragment. Interpolation par template literal uniquement (jamais
// String.replace) → aucun motif $$/$&/$`/$' n'est interprété, quel que soit le texte.
function renderArticle(slug, a) {
  const metaDesc = a.lead.slice(0, 200);
  const titleFull = `${a.title} · Mikado Deco`;
  // og:image (partage social) : seules .jpg/.jpeg/.png sont fiables chez les scrapers ; une image
  // .webp (hero on-page) retombe sur og-default (dont le layout connaît les dimensions).
  const ogImage = /\.(jpe?g|png)$/i.test(a.img) ? absUrl(a.img) : OG_DEFAULT;
  // Corps : tuples [tag, texte] échappés/encadrés ; ["html", brut] tel quel (contenu de confiance).
  const bodyHtml = a.body.map(([t, txt]) => (t === 'html' ? txt : `<${t}>${esc(txt)}</${t}>`)).join('');
  const endCta = a.cta
    ? `<a href="${attrEsc(a.cta.href)}" class="btn btn--blue">${esc(a.cta.label)}</a>`
    : `<a href="/produits.html" class="btn btn--blue">Voir le catalogue</a>`;
  // JSON-LD Article. image = la VRAIE image de l'article (.webp incluse, valide pour Google),
  // découplée de og:image. datePublished omis (absent de la donnée). `<` → <.
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    image: absUrl(a.img),
    author: { '@type': 'Organization', name: 'Mikado Deco' },
    publisher: { '@type': 'Organization', name: 'Mikado Deco', logo: { '@type': 'ImageObject', url: ORIGIN + '/apple-touch-icon.png' } },
  }).replace(/</g, '\\u003c');
  const pageMeta = JSON.stringify({ title: titleFull, description: metaDesc, canonical: `/journal/${slug}.html`, image: ogImage, ogType: 'article' });
  return `<!--page ${pageMeta} -->
<template data-head>
  <script type="application/ld+json">${jsonLd}</script>
</template>
  <div class="readbar" data-readbar aria-hidden="true"><span class="readbar__fill" data-readbar-fill></span></div>

  <main id="contenu" class="page wrap">
    <article class="article" data-article>
      <div data-breadcrumb></div>
      <div data-body>
        <h1 class="article__title">${esc(a.title)}</h1>
        ${readTime(a.meta) ? `<p class="jread article__read">${esc(readTime(a.meta))}</p>` : ""}
        <p class="article__lead">${esc(a.lead)}</p>
        <img class="article__hero" src="${attrEsc(a.img)}" alt="" />
        <div class="prose">${bodyHtml}</div>
      </div>
    </article>

    <div class="section wrap" style="text-align:center;border-top:1px solid var(--line);margin-top:48px">
      <h2 class="serif" style="font-size:clamp(26px,2.6vw,38px);margin-bottom:16px">Une pièce vous a tapé dans l'œil ?</h2>
      ${endCta}
    </div>
  </main>

  <script type="module">
    import { initShell } from "/shell.mjs";
    initShell({ active: "Le journal", transparentNav: false });

    // Fil d'Ariane rendu par le serveur (Accueil › Le journal › titre), avec son JSON-LD.

    /* Reading progress bar — fills as the article body scrolls past;
       hidden when the article fits within one screen. Passive + rAF. */
    (function readingProgress() {
      const bar  = document.querySelector("[data-readbar]");
      const fill = document.querySelector("[data-readbar-fill]");
      const el   = document.querySelector("[data-article]");
      if (!bar || !fill || !el) return;
      const chrome = document.querySelector(".chrome");
      const place = () => { if (chrome) bar.style.top = Math.round(chrome.getBoundingClientRect().bottom) + "px"; };
      let ticking = false;
      const measure = () => {
        const total = el.offsetHeight - window.innerHeight;
        if (total <= 80) { bar.classList.remove("is-on"); fill.style.transform = "scaleX(0)"; return; }
        bar.classList.add("is-on");
        const p = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / total));
        fill.style.transform = "scaleX(" + p.toFixed(4) + ")";
      };
      const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { measure(); ticking = false; }); } };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", () => { place(); measure(); }, { passive: true });
      window.addEventListener("load", () => { place(); measure(); });
      place();
      measure();
    })();
  </script>
`;
}

// Fragment d'un article par slug (« fermob ») ; null si inconnu. Mémorisé par processus.
const _cache = new Map();
function articleFragment(slug) {
  if (_cache.has(slug)) return _cache.get(slug);
  const a = getArticle(slug);
  if (!a) return null;
  const html = renderArticle(slug, a);
  _cache.set(slug, html);
  return html;
}

module.exports = { articleFragment, articleSlugs, getArticle, journalReady, readTime, validate };
