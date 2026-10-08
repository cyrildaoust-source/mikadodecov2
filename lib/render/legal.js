// Pages légales rendues depuis leurs sources — Mikado Deco (ADR 0013)
// --------------------------------------------------------------------
// Les quatre pages légales (mentions, CGV à onglets, confidentialité, cookies) sont produites à la
// demande à partir des sources markdown de docs/legal/ (rédigées par l'avocate et Cyril) et de la
// configuration data/legal-pages.json : nettoyage déterministe piloté par marqueurs (notes internes,
// encadrés « à retirer », en-têtes de brouillon), conversion md → HTML maison, puis FRAGMENT du layout
// unique (lib/render/layout.js). Rendu une fois par processus (les sources ne changent qu'avec un
// déploiement). Code déplacé de scripts/build-legal.mjs (générateur supprimé), pas réécrit.
//
// Ne lit JAMAIS 00-NOTES-avocate-et-cyril.md ni le .docx.
// Garde-fous : esc()/attrEsc(), une source manquante ou une page vide lève une erreur explicite ;
// interpolation par template literal uniquement (jamais String.replace avec une chaîne : les
// remplacements internes utilisent des FONCTIONS, aucun motif $$/$&/$`/$' n'est interprété).
const fs = require('fs');
const path = require('path');
const { ROOT_DIR } = require('../paths');

const SRC_DIR = path.join(ROOT_DIR, 'docs', 'legal');
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'data', 'legal-pages.json'), 'utf8'));
const PAGES = CONFIG.pages;
const PUBLISH_DATE = CONFIG.publishDate;   // mentions, confidentialité, cookies ; les CGV portent leur propre date (cfg.date)

// Échappement identique au journal (contenu texte) + variante attribut.
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const attrEsc = (s) => esc(s).replace(/"/g, '&quot;');
// Normalisation insensible casse/accents — pour la détection des MARQUEURS de nettoyage.
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Règle D : réécriture des liens internes (md/.html → .html racine).
const LINK_MAP = {
  'conditions-generales-de-vente.html': '/conditions-generales-de-vente.html',
  'conditions-generales-b2b.html': '/conditions-generales-de-vente.html', // pas de page B2B séparée
  'politique-confidentialite.md': '/politique-et-vie-privee.html',
  'politique-cookies.md': '/politique-cookies.html',
};
const rewriteHref = (url) => LINK_MAP[url.trim()] || url.trim();

// Règle A : un blockquote est SUPPRIMÉ si sa 1re ligne contient un de ces marqueurs
// (le « ⚠️ » est testé sur le texte brut, les autres normalisés). Tout autre blockquote
// (ex. le modèle de rétractation) est CONSERVÉ.
const BLOCKQUOTE_MARKERS = ['a retirer', 'note technique', 'note de traitement', 'note interne', 'note de veille', 'note :', 'brouillon'];
function isBlockquoteToRemove(firstInner) {
  if (firstInner.includes('⚠️')) return true;
  const n = norm(firstInner);
  return BLOCKQUOTE_MARKERS.some((m) => n.includes(m));
}
// Règles b1 + b2 : une ligne ENTIÈREMENT en italique (`*…*`, pas `**…**`) est supprimée si elle
// contient un marqueur d'en-tête de brouillon ou de note de veille. Les lignes italiques
// légitimes (« Version applicable à partir du … », intro du modèle de rétractation) restent.
const ITALIC_MARKERS = ['brouillon', 'a valider', 'donnees verifiees', 'banque-carrefour', 'note de veille', 'note de verification', 'plateforme europeenne', 'odr/rll'];
function isFullyItalic(t) {
  return t.length > 2 && t.startsWith('*') && !t.startsWith('**') && t.endsWith('*') && !t.endsWith('**');
}
function isItalicNoteToRemove(t) {
  if (!isFullyItalic(t)) return false;
  const n = norm(t);
  return ITALIC_MARKERS.some((m) => n.includes(m));
}

function clean(md, date = PUBLISH_DATE) {
  // Pré-passes lignes (Règles C + D + retrait suffixe cgv-b2c).
  const lines = md.split('\n').map((l) =>
    l
      .replace(/\[DATE[^\]]*\]/g, date) // Règle C : tout [DATE…] → date de publication (cfg.date ou PUBLISH_DATE)
      .replace(/\s*—\s*adaptée à la vente en ligne/g, '') // cgv-b2c : retrait du suffixe interne
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, txt, url) => `[${txt}](${rewriteHref(url)})`) // Règle D
  );
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
    if (isItalicNoteToRemove(t)) { i++; continue; }
    out.push(line);
    i++;
  }
  return out.join('\n');
}

// ─── Conversion md → HTML (mini-convertisseur maison) ───────────────────────────
// H1 ignoré, ## → h2, ### → h3, paragraphes (sauts simples → <br>), listes - et 1., tableaux,
// blockquotes, --- → hr, gras, italique, liens. Texte échappé AVANT l'insertion des balises.
function inline(s) {
  let r = esc(s);
  r = r.replace(/`([^`]+)`/g, (m, g) => g);   // code inline : balisage retiré (un <code> monospace jurerait avec la DA)
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
      while (i < lines.length && isUl(lines[i].trim())) { items.push(`<li>${inline(lines[i].trim().replace(/^-\s+/, ''))}</li>`); i++; }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    if (isOl(t)) {
      const items = [];
      while (i < lines.length && isOl(lines[i].trim())) { items.push(`<li>${inline(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>`); i++; }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }
    // Paragraphe : lignes contiguës jusqu'à une rupture ; sauts simples → <br>.
    const para = [inline(t)];
    i++;
    while (i < lines.length && !isParaBreak(lines[i])) { para.push(inline(lines[i].trim())); i++; }
    out.push(`<p>${para.join('<br>\n')}</p>`);
  }
  return out.join('\n');
}

// Source → HTML de corps. `stripHeader` retire la 1re ligne italique sous le H1 (pages simples :
// la date est réinjectée par le gabarit ; CGV : on garde « Version applicable à partir du … »).
function bodyFromSource(file, { stripHeader, date } = {}) {
  const p = path.join(SRC_DIR, file);
  if (!fs.existsSync(p)) throw new Error(`Page légale : source manquante « docs/legal/${file} ».`);
  let md = clean(fs.readFileSync(p, 'utf8'), date);
  if (stripHeader) md = md.replace(/^(#.*\n+)\*[^*].*\*\s*$/m, (m, h1) => h1.trimEnd());
  return mdToHtml(md);
}

const pageMeta = (cfg, out) => `<!--page ${JSON.stringify({ title: cfg.title, description: cfg.desc, canonical: `/${out}` })} -->`;
const pagehead = (cfg) => `    <div data-breadcrumb></div>
    <div class="pagehead">
      <h1 class="serif">${esc(cfg.h1)}</h1>
      <p>${esc(cfg.intro)}</p>
    </div>`;

// Page simple (mentions, confidentialité, cookies).
function renderSimple(cfg, out) {
  const body = bodyFromSource(cfg.sources[0], { stripHeader: true, date: cfg.date });
  if (!body.trim()) throw new Error(`Page « ${out} » : contenu vide après conversion.`);
  return `${pageMeta(cfg, out)}
  <main id="contenu" class="page wrap">
${pagehead(cfg)}
    <div class="prose">
      <p class="legal-updated"><em>Dernière mise à jour : ${esc(cfg.date || PUBLISH_DATE)}</em></p>
${body}
    </div>
  </main>
  <script type="module">
    import { initShell } from "/shell.mjs";
    initShell({ active: "", transparentNav: false });
  </script>
`;
}

// Page CGV à onglets (deux panneaux statiques indexables).
function renderTabs(cfg, out) {
  const panels = cfg.panels.map((p) => {
    const body = bodyFromSource(p.source, { stripHeader: false, date: cfg.date });
    if (!body.trim()) throw new Error(`Page « ${out} », panneau « ${p.label} » : contenu vide.`);
    return { ...p, body };
  });
  const tabBtns = panels.map((p, idx) => {
    const on = idx === 0;
    return `        <button class="chip${on ? ' is-active' : ''}" role="tab" id="tab-${p.id}" aria-controls="panel-${p.id}" aria-selected="${on ? 'true' : 'false'}"${on ? '' : ' tabindex="-1"'}>${esc(p.label)}</button>`;
  }).join('\n');
  const options = panels.map((p, idx) => `        <option value="${attrEsc(p.id)}"${idx === 0 ? ' selected' : ''}>${esc(p.label)}</option>`).join('\n');
  const sections = panels.map((p, idx) =>
    `    <section class="prose" role="tabpanel" id="panel-${p.id}" aria-labelledby="tab-${p.id}"${idx === 0 ? '' : ' hidden'}>
${p.body}
    </section>`).join('\n');
  return `${pageMeta(cfg, out)}
  <main id="contenu" class="page wrap">
${pagehead(cfg)}
    <div class="chips" role="tablist" aria-label="Type de client">
${tabBtns}
    </div>
    <select class="chips-select" data-legal-select aria-label="Type de client">
${options}
    </select>
${sections}
  </main>
  <script type="module" src="/pages/conditions-generales-de-vente.js"></script>
`;
}

// Fragment d'une page légale (rel = « mentions-legales.html »…), mémorisé par processus.
const _cache = new Map();
function legalFragment(rel) {
  if (_cache.has(rel)) return _cache.get(rel);
  const cfg = PAGES[rel];
  if (!cfg) throw new Error(`Page légale inconnue : ${rel}`);
  const html = cfg.layout === 'tabs' ? renderTabs(cfg, rel) : renderSimple(cfg, rel);
  _cache.set(rel, html);
  return html;
}
const legalPages = () => Object.keys(PAGES);

module.exports = { clean, legalFragment, legalPages, mdToHtml };
