/**
 * Générateur des pages légales — Mikado Deco
 * ------------------------------------------
 * Pré-rend 4 pages légales statiques dans v3/ à partir des sources markdown
 * de docs/legal/ (rédigées par l'avocate + Cyril). Le contenu juridique est
 * NETTOYÉ (notes internes / encadrés « à retirer » / en-têtes de brouillon),
 * converti md→HTML, puis assemblé dans le gabarit de la DA (même <head> que
 * contact.html, mêmes classes .pagehead/.eyebrow/.prose, header/footer injectés
 * par shared.js). Modèle calqué sur build-journal.mjs.
 *
 *   mentions-legales.md ............. → v3/mentions-legales.html
 *   cgv-b2c.md (Particuliers)  ┐
 *   cgv-b2b.md (Professionnels)┘ ..... → v3/conditions-generales-de-vente.html (onglets)
 *   politique-confidentialite.md .... → v3/politique-et-vie-privee.html
 *   politique-cookies.md ............ → v3/politique-cookies.html
 *
 * Ne lit JAMAIS 00-NOTES-avocate-et-cyril.md ni le .docx.
 * Workflow : éditer les .md → `npm run build:legal` → commit. Idempotent.
 *
 * Garde-fous (cf. build-journal) : esc()/attrEsc(), validate() qui throw AVANT
 * toute écriture si une source manque ou si une page est vide, interpolation par
 * template literal uniquement (jamais String.replace pour injecter du contenu —
 * les remplacements regex internes utilisent des FONCTIONS, donc aucun motif
 * $$/$&/$`/$' n'est jamais interprété).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, '..', 'docs', 'legal');
const OUT_DIR = join(__dirname, '..', 'v3');
const ORIGIN = 'https://www.mikadodeco.be';
const OG_IMAGE = ORIGIN + '/images/og-default.jpg';
const PUBLISH_DATE = '10/06/2026';

// Échappement identique à build-journal (contenu texte) + variante attribut.
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const attrEsc = (s) => esc(s).replace(/"/g, '&quot;');

// Normalisation insensible casse/accents — pour la détection des MARQUEURS de
// nettoyage (jamais piloté par n° de ligne).
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/* ------------------------------------------------------------------ *
 *  RÉÉCRITURE DES LIENS INTERNES (Règle D) — md/.html → .html racine. *
 * ------------------------------------------------------------------ */
const LINK_MAP = {
  'conditions-generales-de-vente.html': '/conditions-generales-de-vente.html',
  'conditions-generales-b2b.html': '/conditions-generales-de-vente.html', // pas de page B2B séparée
  'politique-confidentialite.md': '/politique-et-vie-privee.html',
  'politique-cookies.md': '/politique-cookies.html',
};
const rewriteHref = (url) => LINK_MAP[url.trim()] || url.trim();

/* ------------------------------------------------------------------ *
 *  NETTOYAGE — déterministe, piloté par MARQUEUR.                     *
 * ------------------------------------------------------------------ */

// Règle A : un blockquote est SUPPRIMÉ si sa 1re ligne contient un de ces
// marqueurs (le « ⚠️ » est testé sur le texte brut, les autres normalisés).
// Tout autre blockquote (ex. le modèle de rétractation) est CONSERVÉ.
const BLOCKQUOTE_MARKERS = ['a retirer', 'note technique', 'note de traitement', 'note interne', 'note de veille', 'note :', 'brouillon'];
function isBlockquoteToRemove(firstInner) {
  if (firstInner.includes('⚠️')) return true;
  const n = norm(firstInner);
  return BLOCKQUOTE_MARKERS.some((m) => n.includes(m));
}

// Règles b1 + b2 : une ligne ENTIÈREMENT en italique (`*…*`, pas `**…**`) est
// supprimée si elle contient un marqueur d'en-tête de brouillon ou de note de
// veille/vérification. Les lignes italiques légitimes (— « Version applicable à
// partir du … », l'intro du modèle de rétractation —) ne contiennent aucun
// marqueur et sont donc CONSERVÉES.
const ITALIC_MARKERS = ['brouillon', 'a valider', 'donnees verifiees', 'banque-carrefour', 'note de veille', 'note de verification', 'plateforme europeenne', 'odr/rll'];
function isFullyItalic(t) {
  return t.length > 2 && t.startsWith('*') && !t.startsWith('**') && t.endsWith('*') && !t.endsWith('**');
}
function isItalicNoteToRemove(t) {
  if (!isFullyItalic(t)) return false;
  const n = norm(t);
  return ITALIC_MARKERS.some((m) => n.includes(m));
}

function clean(md) {
  // Pré-passes lignes (Règles C + D + retrait suffixe cgv-b2c).
  let lines = md.split('\n').map((l) =>
    l
      .replace(/\[DATE[^\]]*\]/g, PUBLISH_DATE) // Règle C : tout [DATE…] → date de publication
      .replace(/\s*—\s*adaptée à la vente en ligne/g, '') // cgv-b2c : retrait du suffixe interne
      // Règle D : réécriture des liens markdown internes (fonction → aucun $ interprété)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, txt, url) => `[${txt}](${rewriteHref(url)})`)
  );

  // Suppressions au niveau bloc.
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    // Règle A : blockquote (run contigu de lignes « > »).
    if (t.startsWith('>')) {
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith('>')) j++;
      const firstInner = lines[i].replace(/^\s*>\s?/, '');
      if (isBlockquoteToRemove(firstInner)) {
        i = j;
        // b3 : un « --- » résiduel qui suivait l'encadré supprimé est retiré.
        let k = i;
        while (k < lines.length && lines[k].trim() === '') k++;
        if (k < lines.length && /^-{3,}$/.test(lines[k].trim())) i = k + 1;
        continue;
      }
      for (let x = i; x < j; x++) out.push(lines[x]); // blockquote conservé
      i = j;
      continue;
    }

    // b1 + b2 : ligne italique d'en-tête de brouillon / note de veille.
    if (isItalicNoteToRemove(t)) {
      i++;
      continue;
    }

    out.push(line);
    i++;
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------ *
 *  CONVERSION md → HTML (mini-convertisseur maison).                  *
 *  Gère : H1 ignoré, ## → h2, ### → h3, paragraphes (sauts de ligne   *
 *  simples → <br>), listes - et 1., tableaux, blockquotes, --- → hr,  *
 *  gras **…**, italique *…*, liens [..](..). UTF-8 préservé.          *
 * ------------------------------------------------------------------ */

// Inline : on échappe le texte AVANT, puis on insère les balises via des
// fonctions de remplacement (jamais de chaîne avec $… → aucun motif interprété).
function inline(s) {
  let r = esc(s);
  // Code inline `…` : on retire les backticks (pur balisage). Les seules
  // occurrences sont le sous-domaine « shop.mikadodeco.be », qui se lit très
  // bien en texte courant ; un <code> monospace jurerait avec la DA serif.
  r = r.replace(/`([^`]+)`/g, (m, g) => g);
  r = r.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, txt, url) => `<a href="${attrEsc(rewriteHref(url))}">${txt}</a>`);
  r = r.replace(/\*\*([^*]+)\*\*/g, (m, g) => `<strong>${g}</strong>`);
  r = r.replace(/\*([^*]+)\*/g, (m, g) => `<em>${g}</em>`);
  return r;
}

const isHeading = (t) => /^#{1,6}\s/.test(t);
const isHr = (t) => /^(-{3,}|\*{3,}|_{3,})$/.test(t);
const isBlockquote = (l) => l.trimStart().startsWith('>');
const isUl = (t) => /^-\s/.test(t);
const isOl = (t) => /^\d+\.\s/.test(t);

function isTableSep(t) {
  if (!t.includes('|')) return false;
  const parts = t.split('|').map((c) => c.trim()).filter((c) => c !== '');
  return parts.length > 0 && parts.every((c) => /^:?-+:?$/.test(c));
}
function cells(row) {
  let s = row.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}
function isParaBreak(line) {
  const t = line.trim();
  return t === '' || isHeading(t) || isHr(t) || isUl(t) || isOl(t) || isBlockquote(line) || isTableSep(t);
}

function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (t === '') { i++; continue; }

    if (isHr(t)) { out.push('<hr />'); i++; continue; }

    if (isHeading(t)) {
      const m = t.match(/^(#{1,6})\s+(.*)$/);
      const level = m[1].length;
      if (level === 1) { i++; continue; } // H1 non rendu (il va dans .pagehead)
      const tag = level === 2 ? 'h2' : 'h3';
      out.push(`<${tag}>${inline(m[2])}</${tag}>`);
      i++;
      continue;
    }

    if (isBlockquote(line)) {
      let j = i;
      while (j < lines.length && isBlockquote(lines[j])) j++;
      const inner = lines.slice(i, j).map((l) => l.replace(/^\s*>\s?/, '')).join('\n');
      out.push(`<blockquote>${mdToHtml(inner)}</blockquote>`);
      i = j;
      continue;
    }

    // Tableau : ligne avec « | » suivie d'une ligne séparatrice.
    if (t.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1].trim())) {
      const header = cells(line).map((c) => `<th>${inline(c)}</th>`).join('');
      let j = i + 2;
      const rows = [];
      while (j < lines.length && lines[j].trim() !== '' && lines[j].includes('|')) {
        rows.push(`<tr>${cells(lines[j]).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`);
        j++;
      }
      out.push(`<table><thead><tr>${header}</tr></thead><tbody>${rows.join('')}</tbody></table>`);
      i = j;
      continue;
    }

    if (isUl(t)) {
      const items = [];
      while (i < lines.length && isUl(lines[i].trim())) {
        items.push(`<li>${inline(lines[i].trim().replace(/^-\s+/, ''))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (isOl(t)) {
      const items = [];
      while (i < lines.length && isOl(lines[i].trim())) {
        items.push(`<li>${inline(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Paragraphe : lignes contiguës jusqu'à une rupture ; sauts de ligne
    // simples → <br> (préserve les blocs d'adresse / d'identité).
    const para = [inline(t)];
    i++;
    while (i < lines.length && !isParaBreak(lines[i])) {
      para.push(inline(lines[i].trim()));
      i++;
    }
    out.push(`<p>${para.join('<br>\n')}</p>`);
  }
  return out.join('\n');
}

// Conversion d'une source → HTML de corps. `stripHeader` retire la 1re ligne
// italique d'en-tête sous le H1 (pages génériques : la date est réinjectée par
// le gabarit ; CGV : on garde la ligne « Version applicable à partir du … »).
function bodyFromSource(file, { stripHeader }) {
  const path = join(SRC_DIR, file);
  if (!existsSync(path)) throw new Error(`Page légale : source manquante « docs/legal/${file} ».`);
  let md = clean(readFileSync(path, 'utf8'));
  if (stripHeader) {
    // Retire la 1re ligne entièrement italique (en-tête de brouillon) si elle a
    // survécu au nettoyage — sécurité (les marqueurs b1 l'ont déjà retirée).
    md = md.replace(/^(#.*\n+)\*[^*].*\*\s*$/m, (m, h1) => h1.trimEnd());
  }
  return mdToHtml(md);
}

/* ------------------------------------------------------------------ *
 *  GABARIT — <head> conforme à contact.html, séparateur « · ».        *
 * ------------------------------------------------------------------ */
function head(cfg, out) {
  const canonical = `${ORIGIN}/${out}`;
  return `  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" href="/favicon.ico" sizes="32x32" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <title>${esc(cfg.title)}</title>
  <!-- Open Graph / Twitter Cards (aperçu au partage social — statique) -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Mikadodeco" />
  <meta property="og:locale" content="fr_BE" />
  <meta property="og:title" content="${attrEsc(cfg.title)}" />
  <meta property="og:description" content="${attrEsc(cfg.desc)}" />
  <meta property="og:url" content="${attrEsc(canonical)}" />
  <meta property="og:image" content="${OG_IMAGE}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${attrEsc(cfg.title)}" />
  <meta name="twitter:description" content="${attrEsc(cfg.desc)}" />
  <meta name="twitter:image" content="${OG_IMAGE}" />
  <meta name="description" content="${attrEsc(cfg.desc)}" />
  <link rel="canonical" href="${attrEsc(canonical)}" />
  <link rel="preconnect" href="https://use.typekit.net" />
  <link rel="preconnect" href="https://p.typekit.net" crossorigin />
  <link rel="stylesheet" href="https://use.typekit.net/gqc3ska.css" media="print" onload="this.media='all'" />
  <noscript><link rel="stylesheet" href="https://use.typekit.net/gqc3ska.css" /></noscript>
  <link rel="stylesheet" href="/styles.css" />`;
}

const pagehead = (cfg) => `    <div class="pagehead">
      <span class="eyebrow">Informations légales</span>
      <h1 class="serif">${esc(cfg.h1)}</h1>
      <p>${esc(cfg.intro)}</p>
    </div>`;

// Page simple (mentions, confidentialité, cookies).
function renderSimple(cfg, out) {
  const body = bodyFromSource(cfg.sources[0], { stripHeader: true });
  if (!body.trim()) throw new Error(`Page « ${out} » : contenu vide après conversion.`);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
${head(cfg, out)}
</head>
<body>
  <div id="site-header"></div>
  <main class="page wrap">
${pagehead(cfg)}
    <div class="prose">
      <p class="legal-updated"><em>${esc(cfg.updated)}</em></p>
${body}
    </div>
  </main>
  <div id="site-footer"></div>
  <script type="module">
    import { initShell } from "/shared.js";
    initShell({ active: "", transparentNav: false });
  </script>
</body>
</html>
`;
}

// Page CGV à onglets (deux panneaux statiques indexables).
function renderTabs(cfg, out) {
  const panels = cfg.panels.map((p) => {
    const body = bodyFromSource(p.source, { stripHeader: false });
    if (!body.trim()) throw new Error(`Page « ${out} », panneau « ${p.label} » : contenu vide.`);
    return { ...p, body };
  });
  const tabBtns = panels
    .map((p, idx) => {
      const on = idx === 0;
      return `        <button class="chip${on ? ' is-active' : ''}" role="tab" id="tab-${p.id}" aria-controls="panel-${p.id}" aria-selected="${on ? 'true' : 'false'}"${on ? '' : ' tabindex="-1"'}>${esc(p.label)}</button>`;
    })
    .join('\n');
  const options = panels
    .map((p, idx) => `        <option value="${attrEsc(p.id)}"${idx === 0 ? ' selected' : ''}>${esc(p.label)}</option>`)
    .join('\n');
  const sections = panels
    .map((p, idx) =>
      `    <section class="prose" role="tabpanel" id="panel-${p.id}" aria-labelledby="tab-${p.id}"${idx === 0 ? '' : ' hidden'}>
${p.body}
    </section>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
${head(cfg, out)}
</head>
<body>
  <div id="site-header"></div>
  <main class="page wrap">
${pagehead(cfg)}
    <div class="chips" role="tablist" aria-label="Type de client">
${tabBtns}
    </div>
    <select class="chips-select" data-legal-select aria-label="Type de client">
${options}
    </select>
${sections}
  </main>
  <div id="site-footer"></div>
  <script type="module">
    import { initShell } from "/shared.js";
    initShell({ active: "", transparentNav: false });

    // Onglets Particuliers / Professionnels. Les deux panneaux sont en dur dans
    // le HTML (indexables) ; le JS ne fait que basculer la visibilité. Le
    // <select> (.chips-select) prend le relais sur mobile, où .chips est masqué.
    const tablist = document.querySelector('.chips[role="tablist"]');
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const select = document.querySelector('[data-legal-select]');
    function activate(tab) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (select) select.value = tab.id.replace('tab-', '');
    }
    tablist.addEventListener('click', (e) => { const tab = e.target.closest('[role="tab"]'); if (tab) activate(tab); });
    tablist.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let n = null;
      if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (n) { e.preventDefault(); n.focus(); activate(n); }
    });
    select?.addEventListener('change', () => { const tab = document.getElementById('tab-' + select.value); if (tab) activate(tab); });
  </script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ *
 *  CONFIG DES PAGES.                                                  *
 * ------------------------------------------------------------------ */
const PAGES = {
  'mentions-legales.html': {
    layout: 'simple',
    sources: ['mentions-legales.md'],
    h1: 'Mentions légales',
    intro: "Informations sur l'éditeur du site, l'hébergement et la propriété intellectuelle.",
    title: 'Mentions légales · Mikadodeco',
    desc: 'Mentions légales du site édité par MIKADO M-O-A SRL (Uccle) : éditeur, hébergement, propriété intellectuelle, médiation.',
    updated: `Dernière mise à jour : ${PUBLISH_DATE}`,
  },
  'conditions-generales-de-vente.html': {
    layout: 'tabs',
    h1: 'Conditions générales de vente',
    intro: 'Les règles qui encadrent nos ventes, pour les particuliers comme pour les professionnels.',
    title: 'Conditions générales de vente · Mikadodeco',
    desc: 'CGV de MIKADO M-O-A SRL : rétractation, prix, livraison en Belgique, garanties. Volets Particuliers et Professionnels.',
    panels: [
      { id: 'particuliers', label: 'Particuliers', source: 'cgv-b2c.md' },
      { id: 'professionnels', label: 'Professionnels', source: 'cgv-b2b.md' },
    ],
  },
  'politique-et-vie-privee.html': {
    layout: 'simple',
    sources: ['politique-confidentialite.md'],
    h1: 'Politique de confidentialité',
    intro: 'Comment nous collectons, utilisons et protégeons vos données personnelles.',
    title: 'Politique de confidentialité · Mikadodeco',
    desc: 'Comment MIKADO M-O-A SRL traite vos données : finalités, bases RGPD, sous-traitants, durées, droits.',
    updated: `Dernière mise à jour : ${PUBLISH_DATE}`,
  },
  'politique-cookies.html': {
    layout: 'simple',
    sources: ['politique-cookies.md'],
    h1: 'Politique cookies',
    intro: "Le site mikadodeco.be ne dépose aucun cookie de traçage, de mesure d'audience ni de publicité.",
    title: 'Politique cookies · Mikadodeco',
    desc: 'Le site mikadodeco.be ne dépose aucun cookie de traçage/mesure/publicité ; seuls des cookies strictement nécessaires sont utilisés. Cadre légal et gestion.',
    updated: `Dernière mise à jour : ${PUBLISH_DATE}`,
  },
};

/* ------------------------------------------------------------------ *
 *  BUILD : valider + rendre TOUT en mémoire (throw avant écriture),   *
 *  puis écrire. Aucun build partiel.                                  *
 * ------------------------------------------------------------------ */
const rendered = {};
for (const [out, cfg] of Object.entries(PAGES)) {
  rendered[out] = cfg.layout === 'tabs' ? renderTabs(cfg, out) : renderSimple(cfg, out);
}

const written = [];
for (const [out, htmlDoc] of Object.entries(rendered)) {
  writeFileSync(join(OUT_DIR, out), htmlDoc, 'utf8');
  written.push(`v3/${out}`);
}
console.log(`✓ build-legal — ${written.length} page(s) légale(s) générée(s) :`);
for (const f of written) console.log('  ' + f);
