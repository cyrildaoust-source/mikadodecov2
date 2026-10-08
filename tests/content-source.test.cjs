const { test } = require('node:test');
const assert = require('node:assert/strict');
const legal = require('../lib/render/legal');
const journal = require('../lib/render/journal');
const { renderPage, generatorFor } = require('../lib/render/layout');

// Contenu rendu depuis sa source (ADR 0013) : pages légales (docs/legal/*.md) et articles du journal
// (v3/journal/articles.data.mjs), sans HTML généré commité.
test('les 4 pages légales se rendent depuis les sources markdown : en-tête de page, H1, prose, et CGV à deux onglets', () => {
  assert.deepEqual(legal.legalPages().sort(), ['conditions-generales-de-vente.html', 'mentions-legales.html', 'politique-cookies.html', 'politique-et-vie-privee.html']);
  for (const rel of legal.legalPages()) {
    const f = legal.legalFragment(rel);
    assert.match(f, /^<!--page \{"title":"[^"]+ · Mikado Deco","description":"[^"]+","canonical":"\/[a-z-]+\.html"\} -->/, rel);
    assert.match(f, /<h1 class="serif">[^<]+<\/h1>/, rel);
    assert.match(f, /class="prose"/, rel);
    assert.doesNotMatch(f, /\[DATE/, `${rel} : un [DATE…] non remplacé`);
    assert.doesNotMatch(f, /⚠️|note interne|note technique|brouillon|a valider/i, `${rel} : une note interne a fui`);
    assert.equal(generatorFor(rel), 'legal');
    const page = renderPage(rel);
    assert.match(page, /<link rel="canonical" href="https:\/\/www\.mikadodeco\.be\/[a-z-]+\.html" \/>/);
  }
  const cgv = legal.legalFragment('conditions-generales-de-vente.html');
  assert.equal((cgv.match(/role="tabpanel"/g) || []).length, 2, 'Particuliers + Professionnels');
  assert.match(cgv, /id="panel-particuliers" aria-labelledby="tab-particuliers">/);
  assert.match(cgv, /id="panel-professionnels" aria-labelledby="tab-professionnels" hidden>/);
  assert.match(cgv, /Version applicable à partir du 24\/09\/2026/, 'la date des CGV vient de data/legal-pages.json');
  assert.match(legal.legalFragment('mentions-legales.html'), /Dernière mise à jour : 10\/06\/2026/);
});

test('convertisseur markdown : titres, listes, tableau, liens réécrits, gras/italique, notes internes retirées', () => {
  const md = ['# Titre ignoré', '', '*Brouillon à valider*', '', '## Section', 'Un **gras**, un *italique*, un [lien](politique-cookies.md) et `shop.mikadodeco.be`.', '', '- a', '- b', '', '1. un', '2. deux', '', '| A | B |', '|---|---|', '| 1 | 2 |', '', '> ⚠️ Note technique à retirer', '> suite', '', '---', '', '> Modèle conservé'].join('\n');
  const html = legal.mdToHtml(legal.clean(md));
  assert.doesNotMatch(html, /Titre ignoré|Brouillon|Note technique/);
  assert.match(html, /<h2>Section<\/h2>/);
  assert.match(html, /<strong>gras<\/strong>, un <em>italique<\/em>, un <a href="\/politique-cookies\.html">lien<\/a> et shop\.mikadodeco\.be\./);
  assert.match(html, /<ul><li>a<\/li><li>b<\/li><\/ul>/); assert.match(html, /<ol><li>un<\/li><li>deux<\/li><\/ol>/);
  assert.match(html, /<table><thead><tr><th>A<\/th><th>B<\/th><\/tr><\/thead><tbody><tr><td>1<\/td><td>2<\/td><\/tr><\/tbody><\/table>/);
  assert.match(html, /<blockquote><p>Modèle conservé<\/p><\/blockquote>/);
  assert.doesNotMatch(html, /<hr \/>/, 'le --- qui suivait l’encadré retiré disparaît avec lui');
});

test('les articles du journal se rendent depuis articles.data.mjs : titre, lead, JSON-LD Article, appel à l’action', async () => {
  await journal.journalReady;
  const slugs = journal.articleSlugs();
  assert.ok(slugs.length >= 8, `${slugs.length} articles`);
  for (const slug of slugs) {
    const a = journal.getArticle(slug);
    const f = journal.articleFragment(slug);
    assert.match(f, /^<!--page \{"title":"[^"]+ · Mikado Deco","description":"[^"]+","canonical":"\/journal\/[a-z0-9-]+\.html","image":"https:\/\/[^"]+","ogType":"article"\} -->/, slug);
    assert.ok(f.includes(`<h1 class="article__title">${a.title.replace(/&/g, '&amp;')}</h1>`), `${slug} : H1`);
    assert.match(f, /"@type":"Article"/, slug);
    assert.match(f, /class="btn btn--blue"/, `${slug} : CTA`);
    assert.equal(generatorFor(`journal/${slug}.html`), 'journal');
    const page = renderPage(`journal/${slug}.html`);
    assert.match(page, /<meta property="og:type" content="article" \/>/);
    assert.match(page, new RegExp(`<link rel="canonical" href="https://www\\.mikadodeco\\.be/journal/${slug}\\.html" />`));
  }
  assert.equal(journal.articleFragment('article-inconnu'), null);
  assert.throws(() => renderPage('journal/article-inconnu.html'), /article inconnu/);
});

test('un article mal formé est refusé avec un message qui nomme le slug', () => {
  assert.throws(() => journal.validate('test', { title: 'T', meta: '3 min', lead: 'L' }), /Article "test" : champ "img"/);
  assert.throws(() => journal.validate('test', { title: 'T', meta: '3 min', lead: 'L', img: '/x.jpg', body: [] }), /"body"/);
  assert.equal(journal.readTime('Conseil · 6 min'), '6 min de lecture');
});
