/**
 * Générateur du journal — Mikado Deco
 * -----------------------------------
 * Pré-rend chaque article de v3/journal/articles.data.mjs en fichier HTML
 * statique v3/journal/<slug>.html, SEO compris (title, description, Open Graph,
 * Twitter, canonical, JSON-LD Article) ET corps de l'article en dur dans le
 * HTML (visible sans JS). Le rendu visuel est identique à l'ancien rendu
 * client d'article.html (mêmes classes .article__*, .prose, .readbar, .btn--blue).
 *
 * Workflow d'édition : éditer articles.data.mjs → `npm run journal` → commit.
 * (Modèle identique à `npm run images`.) Idempotent : réécrit les 7 fichiers.
 */
import { ARTICLES } from '../v3/journal/articles.data.mjs';
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'v3', 'journal');
const ORIGIN = 'https://www.mikadodeco.be';
const OG_DEFAULT = ORIGIN + '/images/og-default.jpg';

// Échappement identique à article.html (contenu texte) + variante attribut
// (ajoute " → &quot;) pour les valeurs injectées dans des attributs HTML.
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const attrEsc = (s) => esc(s).replace(/"/g, '&quot;');
const absUrl = (u) => /^https?:\/\//i.test(u) ? u : ORIGIN + (u.charAt(0) === '/' ? u : '/' + u);

// Garde-fou : un article mal formé (champ manquant) doit STOPPER le build avec
// un message nommant le slug — jamais émettre src="undefined" ni un HTML cassé.
function validate(slug, a) {
  for (const k of ['title', 'meta', 'lead', 'img']) {
    if (typeof a[k] !== 'string' || !a[k]) throw new Error(`Article "${slug}" : champ "${k}" manquant ou invalide.`);
  }
  if (!Array.isArray(a.body) || a.body.length === 0) throw new Error(`Article "${slug}" : "body" doit être un tableau non vide.`);
  if (a.cta && (!a.cta.href || !a.cta.label)) throw new Error(`Article "${slug}" : "cta" incomplet (href + label requis).`);
}

// Dimensions RÉELLES de l'image OG (hints corrects) — on lit le fichier local
// pointé par l'URL absolue ; sinon on omet width/height (le scraper mesure).
// On ne fabrique JAMAIS un ratio faux (leçon B7/B8 : 1200×630 en dur ≠ image).
async function ogDimsTag(ogImageUrl) {
  if (!ogImageUrl.startsWith(ORIGIN)) return '';
  const local = join(__dirname, '..', 'v3', ogImageUrl.slice(ORIGIN.length).split('?')[0]);
  try {
    const m = await sharp(local).metadata();
    if (m.width && m.height) {
      return `\n  <meta property="og:image:width" content="${m.width}" />\n  <meta property="og:image:height" content="${m.height}" />`;
    }
  } catch (e) { /* image illisible → on omet les hints */ }
  return '';
}

// Rendu d'UN article → HTML statique complet. Interpolation par template
// literal uniquement (jamais String.replace) → aucun motif $$/$&/$`/$' n'est
// interprété, quel que soit le texte (cf. piège B8).
async function renderArticle(slug, a) {
  const canonical = `${ORIGIN}/journal/${slug}.html`;
  const metaDesc = a.lead.slice(0, 200);
  const titleFull = `${a.title} · Mikadodeco`;
  // og:image (partage social) : seules .jpg/.jpeg/.png sont fiables chez les
  // scrapers ; une image .webp (hero on-page) retombe sur og-default.
  const ogImage = /\.(jpe?g|png)$/i.test(a.img) ? absUrl(a.img) : OG_DEFAULT;
  const ogDims = await ogDimsTag(ogImage);
  // Corps : tuples [tag, texte] échappés/encadrés ; ["html", brut] tel quel
  // (contenu de confiance, rédigé à la main dans la source).
  const bodyHtml = a.body.map(([t, txt]) => (t === 'html' ? txt : `<${t}>${esc(txt)}</${t}>`)).join('');
  // CTA de fin : contextuel si l'article le définit, sinon repli catalogue.
  const endCta = a.cta
    ? `<a href="${attrEsc(a.cta.href)}" class="btn btn--blue">${esc(a.cta.label)}</a>`
    : `<a href="/produits.html" class="btn btn--blue">Voir le catalogue</a>`;
  // JSON-LD Article statique. image = la VRAIE image de l'article (.webp incluse,
  // valide pour Google) — découplée de og:image (≠ repli scraper). datePublished
  // omis (absent de la donnée). `<` → < : impossible de fermer le <script>.
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    image: absUrl(a.img),
    author: { '@type': 'Organization', name: 'Mikadodeco' },
    publisher: {
      '@type': 'Organization',
      name: 'Mikadodeco',
      logo: { '@type': 'ImageObject', url: ORIGIN + '/apple-touch-icon.png' },
    },
  }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" href="/favicon.ico" sizes="32x32" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <title>${esc(titleFull)}</title>
  <meta name="description" content="${attrEsc(metaDesc)}" />
  <!-- Open Graph / Twitter Cards (aperçu au partage social — par article, statique) -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Mikadodeco" />
  <meta property="og:locale" content="fr_BE" />
  <meta property="og:title" content="${attrEsc(titleFull)}" />
  <meta property="og:description" content="${attrEsc(metaDesc)}" />
  <meta property="og:url" content="${attrEsc(canonical)}" />
  <meta property="og:image" content="${attrEsc(ogImage)}" />${ogDims}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${attrEsc(titleFull)}" />
  <meta name="twitter:description" content="${attrEsc(metaDesc)}" />
  <meta name="twitter:image" content="${attrEsc(ogImage)}" />
  <link rel="canonical" href="${attrEsc(canonical)}" />
  <script type="application/ld+json">${jsonLd}</script>
  <link rel="preconnect" href="https://use.typekit.net" />
  <link rel="preconnect" href="https://p.typekit.net" crossorigin />
  <link rel="stylesheet" href="https://use.typekit.net/gqc3ska.css" media="print" onload="this.media='all'" />
  <noscript><link rel="stylesheet" href="https://use.typekit.net/gqc3ska.css" /></noscript>
  <link rel="preload" as="font" type="font/woff2" crossorigin
        href="https://use.typekit.net/af/912d1e/00000000000000007735bb33/31/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3" />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <div id="site-header"></div>
  <div class="readbar" data-readbar aria-hidden="true"><span class="readbar__fill" data-readbar-fill></span></div>

  <main id="contenu" class="page wrap">
    <article class="article" data-article>
      <div data-breadcrumb></div>
      <div data-body>
        <div class="article__meta">${esc(a.meta)}</div>
        <h1 class="article__title">${esc(a.title)}</h1>
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

  <div id="site-footer"></div>

  <script type="module">
    import { initShell, breadcrumbHTML } from "/shared.js";
    initShell({ active: "Le journal", transparentNav: false });

    // Fil d'Ariane (Accueil › Le journal › titre) — seul élément hydraté côté
    // client (navigationnel, non critique SEO). Le titre est baké en dur.
    const PAGE_TITLE = ${JSON.stringify(a.title)};
    const crumbEl = document.querySelector("[data-breadcrumb]");
    if (crumbEl) {
      crumbEl.innerHTML = breadcrumbHTML([
        { label: "Accueil", href: "/" },
        { label: "Le journal", href: "/journal.html" },
        { label: PAGE_TITLE },
      ]);
    }

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
</body>
</html>
`;
}

// 1. Validation (pré-passe) — un article mal formé interrompt le build AVANT
//    toute écriture (pas de build partiel/incohérent).
for (const [slug, a] of Object.entries(ARTICLES)) validate(slug, a);

mkdirSync(OUT_DIR, { recursive: true });

// 2. Purge des .html orphelins : la donnée est la seule source de vérité ; un
//    slug supprimé/renommé ne doit pas laisser traîner d'article fantôme
//    (indexable, canonical concurrent). On ne touche qu'aux .html.
const expected = new Set(Object.keys(ARTICLES).map((s) => `${s}.html`));
const removed = [];
for (const f of readdirSync(OUT_DIR)) {
  if (f.endsWith('.html') && !expected.has(f)) { unlinkSync(join(OUT_DIR, f)); removed.push(f); }
}

// 3. Écriture des 7 articles.
const written = [];
for (const [slug, a] of Object.entries(ARTICLES)) {
  const file = join(OUT_DIR, `${slug}.html`);
  writeFileSync(file, await renderArticle(slug, a), 'utf8');
  written.push(`v3/journal/${slug}.html`);
}
console.log(`✓ build-journal — ${written.length} article(s) générés :`);
for (const f of written) console.log('  ' + f);
if (removed.length) {
  console.log(`✓ ${removed.length} fichier(s) orphelin(s) supprimé(s) :`);
  for (const f of removed) console.log('  v3/journal/' + f);
}
