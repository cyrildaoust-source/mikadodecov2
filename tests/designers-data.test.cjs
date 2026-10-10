// Répertoire des créateurs (v3/designers-data.json) : fiches, tags Shopify et portraits.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const { designers } = require('../v3/designers-data.json');
const photos = require('../data/designer-photos.json').designers;
const brands = require('../v3/mega-menu-brands.json').brands;
const slug = value => String(value).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

test('une fiche par créateur : slug unique, tag propre et marques du registre', () => {
  const owners = new Map();
  for (const d of designers) {
    assert.match(d.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, d.name);
    assert.ok(d.tags.includes(d.slug), d.slug + ' porte son propre tag');
    for (const tag of d.tags) {
      assert.ok(!owners.has(tag), `${tag} appartient à ${owners.get(tag)} et ${d.slug}`);
      owners.set(tag, d.slug);
    }
    assert.ok(!('brandHrefs' in d), d.slug + ' : les liens de marque sont calculés par brandHref()');
  }
  // Un tag de créateur égal au tag d'une marque afficherait tout son catalogue — sauf quand la marque
  // porte le nom du créateur et ne vend que ses dessins (Kay Bojesen Denmark) : là, c'est voulu.
  const SAME_PERSON_BRANDS = new Set(['kay-bojesen']);
  for (const b of brands) if (!SAME_PERSON_BRANDS.has(slug(b.name))) assert.ok(!owners.has(slug(b.name)), `${slug(b.name)} est une marque`);
});

test('chaque portrait existe avec sa version 640 et sa source', () => {
  for (const d of designers.filter(d => d.photo)) {
    const file = path.join(root, 'v3', d.photo);
    assert.ok(fs.existsSync(file), d.photo);
    assert.ok(fs.existsSync(file.replace(/\.jpg$/, '-640.webp')), d.photo + ' -640.webp');
  }
  // Chaque portrait affiché a une source officielle enregistrée.
  for (const d of designers.filter(d => d.photo)) assert.ok(photos[d.slug], d.slug + ' : source du portrait');
  for (const [s, source] of Object.entries(photos)) {
    const d = designers.find(x => x.slug === s);
    assert.equal(d?.photo, `/images/designers/${s}.jpg`, s);
    assert.match(source.sourcePage, /^https:\/\//, s);
    assert.match(source.imageUrl, /^https?:\/\//, s);
  }
});
