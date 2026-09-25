const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const {
  brandHero,
  brandHeroManifest,
  injectCollectionHero,
} = require('../lib/editorial-media');

const root = path.join(__dirname, '..');
const activeHandles = [
  'tradition', 'alessi', 'anglepoise', 'artek', 'avolt', 'blomus',
  'carl-hansen-son', 'compagnie-de-provence', 'esteban', 'ester-erik',
  'fatboy', 'ferm-living', 'fermob', 'hay', 'hkliving', 'ichendorf-milano',
  'iittala', 'lind-dna', 'marimekko', 'moustache', 'muuto', 'pols-potten',
  'relaxound', 'serax', 'stoff-nagel', 'string-furniture', 'tiptoe', 'vitra',
  'volta-mobiles',
];

test('brand hero manifest covers every active Shopify vendor without silently qualifying candidates', () => {
  assert.equal(brandHeroManifest.schema, 'mikado.site-brand-heroes@1');
  assert.deepEqual(
    Object.entries(brandHeroManifest.heroes).filter(([, photo]) => photo.active !== false).map(([handle]) => handle).sort(),
    activeHandles.sort(),
  );
  assert.deepEqual(
    Object.entries(brandHeroManifest.heroes).filter(([, photo]) => photo.active === false).map(([handle]) => handle).sort(),
    ['airborne', 'assouline'],
  );
  for (const [handle, photo] of Object.entries(brandHeroManifest.heroes)) {
    assert.match(handle, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(photo.alt.length >= 8 && photo.alt.length <= 180, handle);
    assert.match(photo.position, /^(100|\d{1,2})% (100|\d{1,2})%$/);
    assert.match(photo.mobilePosition, /^(100|\d{1,2})% (100|\d{1,2})%$/);
    assert.ok(Number.isInteger(photo.width) && photo.width > 0, handle);
    assert.ok(Number.isInteger(photo.height) && photo.height > 0, handle);
    if (photo.status === 'candidate') {
      assert.equal(photo.kind, 'shopify');
      assert.equal(new URL(photo.image).hostname, 'cdn.shopify.com');
      assert.ok(photo.blockers.includes('visual_review_required'), handle);
      assert.equal(Boolean(photo.sourceProduct) + Boolean(photo.sourceCollection), 1, handle);
      assert.equal(brandHero(handle), null, handle);
      assert.equal(brandHero(handle, { includeCandidates: true }).candidate, true, handle);
    } else {
      assert.equal(photo.status, 'qualified');
      assert.equal(photo.kind, 'local');
      assert.equal(photo.width, 2400);
      assert.equal(photo.height, 800);
      assert.equal(brandHero(handle).candidate, false, handle);
    }
  }
});

test('every qualified local hero has the exact responsive files expected by the page', async () => {
  for (const [handle, photo] of Object.entries(brandHeroManifest.heroes)) {
    if (photo.status !== 'qualified') continue;
    const expected = [
      [`${handle}.jpg`, 2400, 800],
      [`${handle}-1280.webp`, 1280, 427],
      [`${handle}-1920.webp`, 1920, 640],
      [`${handle}-2400.webp`, 2400, 800],
      [`${handle}-1920.jpg`, 1920, 640],
    ];
    for (const [filename, width, height] of expected) {
      const file = path.join(root, 'v3', 'images', 'brands', 'headers', filename);
      assert.equal(fs.existsSync(file), true, `${handle}: ${filename}`);
      const metadata = await sharp(file).metadata();
      assert.deepEqual([metadata.width, metadata.height], [width, height], filename);
    }
  }
});

test('Moustache uses the same server payload for visible hero, social image and no-JS fallback', () => {
  const hero = brandHero('moustache');
  assert.equal(hero.img, '/images/brands/headers/moustache-1920.jpg');
  assert.match(hero.srcset, /moustache-1280\.webp 1280w/);
  assert.match(hero.srcset, /moustache-2400\.webp 2400w/);
  assert.match(hero.alt, /Moustache/);
  const template = '<section class="subhero"><script type="application/json" id="collection-hero-initial">null</script><!-- COLLECTION_HERO_NOSCRIPT --><noscript>generic</noscript>';
  const html = injectCollectionHero(template, hero);
  assert.ok(html.includes(JSON.stringify(hero)));
  assert.ok(html.includes('moustache-1920.jpg'));
  assert.ok(html.includes('width="2400" height="800"'));
  assert.ok(html.includes(hero.alt));
});

test('unknown or prototype handles never resolve to a hero', () => {
  assert.equal(brandHero('unknown'), null);
  assert.equal(brandHero('__proto__', { includeCandidates: true }), null);
});
