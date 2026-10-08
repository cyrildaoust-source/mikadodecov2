const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { renderPage, loadFragment } = require('../lib/render/layout');
const { journalReady, articleSlugs } = require('../lib/render/journal');
const manifest = require('../data/pages.manifest.json');

// Layout unique (ADR 0012) : une enveloppe, des fragments. Ces tests figent le contrat.
const ROOT = join(__dirname, '..');

test('chaque page et gabarit est un fragment complet : titre et description, un <main>, ni document HTML ni style inline', async () => {
  await journalReady;
  for (const p of manifest.pages.filter((p) => p.role !== 'stub')) {
    const { meta, body } = loadFragment(p.file);
    assert.ok(meta.title && (meta.description || meta.robots), `${p.file} : titre ou description manquants dans <!--page {…}--> (une page noindex peut s'en passer)`);
    assert.match(body, /<main[\s>]/, `${p.file} : pas de <main>`);
    assert.doesNotMatch(body, /<!DOCTYPE|<html lang|<\/head>|<body[\s>]|id="site-header"|^\s*<style[\s>]/m, `${p.file} : document complet ou <style> inline`);
  }
  for (const slug of articleSlugs()) {
    const { meta, body } = loadFragment(`journal/${slug}.html`);
    assert.ok(meta.title && meta.description && meta.ogType === 'article', `journal/${slug} : en-tête incomplet`);
    assert.match(body, /<main[\s>]/, `journal/${slug} : pas de <main>`);
  }
});

test('renderPage assemble le layout : document, balises communes, valeurs de la page, extras data-head', () => {
  const html = renderPage('contact.html');
  assert.match(html, /^<!DOCTYPE html>\n<html lang="fr">/);
  assert.match(html, /<title>Contact · Mikado Deco<\/title>/);
  assert.match(html, /<meta name="description" content="Boutique Mikado Deco à Uccle/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.mikadodeco\.be\/contact\.html" \/>/);
  assert.match(html, /<meta property="og:image" content="https:\/\/www\.mikadodeco\.be\/images\/og-default\.jpg" \/>\n\s+<meta property="og:image:width" content="1200"/, 'dimensions pour l’image par défaut');
  assert.match(html, /"@type": "FurnitureStore"/, 'JSON-LD propre à la page (data-head) présent');
  for (const must of ['id="mikado-head"', 'cormorant-garamond-latin-600', 'href="/styles.css"', 'use.typekit.net/gqc3ska.css']) assert.ok(html.includes(must), must);
  assert.match(html, /<div id="site-header"><\/div>[\s\S]*<main[\s\S]*<div id="site-footer"><\/div>/);
  assert.doesNotMatch(html, /\{\{\w+\}\}/, 'aucun jeton non remplacé');
  assert.doesNotMatch(html, /<template data-head>|<!--page/, 'les marqueurs de fragment ne sortent pas');
  assert.equal((html.match(/<title>/g) || []).length, 1); assert.equal((html.match(/<link rel="canonical"/g) || []).length, 1);
});

test('overrides : titre, description, image, url, robots ; pas de dimensions pour une image produit ; « $& » inoffensif', () => {
  const html = renderPage('produit.html', { title: 'Chaise « A » & co', description: 'Prix 50$& — "test"', image: 'https://cdn.shopify.com/x.jpg?width=1200', url: 'https://www.mikadodeco.be/produit.html?handle=x' });
  assert.match(html, /<title>Chaise « A » &amp; co<\/title>/);
  assert.match(html, /content="Prix 50\$&amp; — &quot;test&quot;"/);
  assert.match(html, /<meta property="og:image" content="https:\/\/cdn\.shopify\.com\/x\.jpg\?width=1200" \/>\n\s+<meta name="twitter:card"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.mikadodeco\.be\/produit\.html\?handle=x" \/>/);
  assert.doesNotMatch(html, /name="robots"/);
  const soft404 = renderPage('produit.html', { robots: 'noindex,follow' });   // coquille 404 d'une fiche inexistante
  assert.match(soft404, /<meta name="robots" content="noindex,follow" \/>/);
  assert.doesNotMatch(soft404, /<link rel="canonical"/, 'une page noindex ne déclare pas de canonical (le script inline de la fiche en parle, lui)');
  assert.doesNotMatch(renderPage('contact.html'), /name="robots"/);
  assert.match(renderPage('404.html'), /<meta name="robots" content="noindex" \/>/, 'robots déclaré par la page');
  assert.doesNotMatch(renderPage('404.html'), /<link rel="canonical"/, 'une page noindex ne déclare pas de canonical');
});

test('renderWithOg (cas tardifs des listes) fonctionne sur la page assemblée, sans doublon de canonical', () => {
  const { renderWithOg } = require('../lib/render/og');
  const html = renderWithOg(renderPage('produits.html'), { title: 'Vitra · Mikado Deco', description: 'D', image: 'https://cdn.shopify.com/v.jpg', url: 'https://www.mikadodeco.be/collections/vitra' });
  assert.match(html, /<title>Vitra · Mikado Deco<\/title>/);
  assert.match(html, /canonical" href="https:\/\/www\.mikadodeco\.be\/collections\/vitra"/);
  assert.equal((html.match(/<link rel="canonical"/g) || []).length, 1);
  assert.doesNotMatch(html, /og:image:width/, 'dimensions retirées pour une image de collection');
});
