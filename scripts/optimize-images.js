/**
 * Local image optimizer — Mikado Deco
 * ------------------------------------
 * Generates responsive WebP variants of the LOCAL images in v3/images/ so the
 * site can serve right-sized, modern-format pictures (the front uses <picture>
 * with a WebP <source> + the original JPEG as fallback). Run LOCALLY; the .webp
 * outputs are committed. Vercel stays a pure static host — this is NOT a Vercel
 * build step. Shopify product images are handled separately (server-side CDN
 * params, étape 02) and are out of scope here.
 *
 * Source JPEGs are never modified or deleted. Outputs are named
 * `<basename>-<width>.webp` (e.g. hero-home-960.webp). Widths are capped to the
 * source's native width (no upscaling) and de-duplicated.
 *
 * Idempotent: a variant is skipped when it already exists and is newer than its
 * source. Pass --force to regenerate everything.
 *
 * Usage:
 *   npm run images
 *   node scripts/optimize-images.js --force
 *
 * Only dependency: sharp (devDependency).
 */

const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');

const FORCE   = process.argv.includes('--force');
const QUALITY = 78; // WebP quality — sweet spot for these photographic sources
const IMG_DIR = path.join(__dirname, '..', 'v3', 'images');

// Hero LCP images: full-bleed, need the widest ladder.
const HERO_WIDTHS = [640, 960, 1280, 1920, 2600];
// Below-the-fold editorial / lookbook photos: ~half-to-full column.
const CONTENT_WIDTHS = [800, 1280];
// Category tiles: small, ~1/4 → 1/2 viewport.
const TILE_WIDTHS = [480, 800];
// Designer portraits: single ~640px card thumbnail (capped to native).
const DESIGNER_WIDTH = 640;

// ── Build the job list ────────────────────────────────────────────────────
// Each job: { src: absolute path, widths: [target px], label } — `widths`
// gets capped to the native width inside generate().
const jobs = [];
const add = (file, widths, label) => jobs.push({ src: path.join(IMG_DIR, file), widths, label });

// 3.1/3.2 — the three heros (multi-width)
['hero-home.jpg', 'produits-hero.jpg', 'marques-hero.jpg'].forEach(f => add(f, HERO_WIDTHS, 'hero'));

// 3.4 — accueil editorial / lookbook photos
['feat-store.jpg', 'journal-patine.jpg', 'feat-visit.jpg',
 'lookbook-recevoir.jpg', 'salon-quilton.jpg', 'dehors-thorvald.jpg']
  .forEach(f => add(f, CONTENT_WIDTHS, 'content'));

// 3.4 — the six homepage category tiles
['assises.jpg', 'tables.jpg', 'luminaires.jpg', 'rangements.jpg', 'objets.jpg', 'exterieur.jpg']
  .forEach(f => add(f, TILE_WIDTHS, 'tile'));

// 3.5 — only the ~29 designer portraits actually referenced in designers-data.json.
// The v3/images/designers/ folder also holds ~160 scraped-but-unreferenced
// portraits (a separate in-progress chantier) — we must NOT touch those.
try {
  const data = require(path.join(__dirname, '..', 'v3', 'designers-data.json'));
  (data.designers || []).forEach(d => {
    if (typeof d.photo === 'string' && d.photo.startsWith('/images/')) {
      add(d.photo.replace(/^\/images\//, ''), [DESIGNER_WIDTH], 'designer');
    }
  });
} catch (e) {
  console.warn('⚠  designers-data.json unreadable — skipping designer portraits:', e.message);
}

// ── Width capping: never upscale, always keep one variant at/under native ───
function capWidths(targets, native) {
  const out = targets.filter(w => w < native);
  if (out.length === 0 || native <= Math.max(...targets)) out.push(native);
  return [...new Set(out)].sort((a, b) => a - b);
}

const fmtKB = bytes => `${(bytes / 1024).toFixed(0)} KB`;

async function generate() {
  let made = 0, skipped = 0, missing = 0;
  const heroReport = [];

  for (const job of jobs) {
    if (!fs.existsSync(job.src)) {
      console.warn(`⚠  source missing, skipped: ${path.relative(process.cwd(), job.src)}`);
      missing++;
      continue;
    }
    const srcStat = fs.statSync(job.src);
    const meta = await sharp(job.src).metadata();
    const dir  = path.dirname(job.src);
    const base = path.basename(job.src, path.extname(job.src));
    const widths = capWidths(job.widths, meta.width);

    for (const w of widths) {
      const out = path.join(dir, `${base}-${w}.webp`);
      const fresh = fs.existsSync(out) && fs.statSync(out).mtimeMs >= srcStat.mtimeMs;
      if (fresh && !FORCE) {
        skipped++;
        if (job.label === 'hero') heroReport.push([path.basename(out), fs.statSync(out).size]);
        continue;
      }
      await sharp(job.src)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(out);
      const size = fs.statSync(out).size;
      made++;
      if (job.label === 'hero') heroReport.push([path.basename(out), size]);
      console.log(`✓ ${job.label.padEnd(8)} ${path.basename(out).padEnd(28)} ${String(w).padStart(4)}w  ${fmtKB(size)}`);
    }
  }

  console.log('\n── Hero variants (LCP-critical) ──');
  heroReport.sort((a, b) => a[0].localeCompare(b[0])).forEach(([name, size]) =>
    console.log(`   ${name.padEnd(28)} ${fmtKB(size)}`));

  console.log(`\nDone. ${made} generated, ${skipped} up-to-date${missing ? `, ${missing} missing` : ''}. WebP q=${QUALITY}.`);
}

generate().catch(err => { console.error('Image optimization failed:', err); process.exit(1); });
