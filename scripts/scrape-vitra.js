/**
 * Vitra Chair Scraper
 * Usage: node scripts/scrape-vitra.js
 * Output: data/vitra-chairs.json
 *
 * Requires: npm install -D playwright
 * First run: npx playwright install chromium
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'https://www.vitra.com/en-be';
const OUT  = path.join(__dirname, '../data/vitra-chairs.json');
const DELAY_MS = 1200; // polite delay between requests

// ── Product family pages → used to discover /details/ URLs ─────────────────
const FAMILY_PAGES = [
  `${BASE}/product/panton-chair`,
  `${BASE}/product/mikado`,
  `${BASE}/product/hal`,
  `${BASE}/product/softshell-chair`,
  `${BASE}/product/aluminium-chair-group`,
  `${BASE}/product/acx`,
  `${BASE}/product/eames-plastic-chair-re`,
  `${BASE}/product/eames-fiberglass-chair`,
  `${BASE}/product/standard-chair`,
  `${BASE}/product/slow-chair`,
  `${BASE}/product/repos`,
  `${BASE}/product/organic-chair`,
  `${BASE}/product/grand-repos`,
  `${BASE}/product/amoebe`,
  `${BASE}/product/belleville-chair`,
  `${BASE}/product/landi-chair`,
  `${BASE}/product/tip-ton-re`,
  `${BASE}/product/rookie`,
  `${BASE}/inspirations/eames-shell-chairs`,
  `${BASE}/inspirations/standard-chaise-tout-bois`,
];

// ── Slugs to skip (not chairs / not relevant) ───────────────────────────────
const SKIP_SLUGS = ['anagram-sofa', 'tyde-2-workstations', 'mynt'];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Discover /details/ URLs from a family or category page ──────────────────
async function discoverDetailUrls(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(800);
    const urls = await page.evaluate(() =>
      [...document.querySelectorAll('a[href*="/product/details/"]')]
        .map(a => a.href)
        .filter((v, i, a) => a.indexOf(v) === i)
    );
    return urls.filter(u => !SKIP_SLUGS.some(s => u.includes(s)));
  } catch (e) {
    console.warn(`  [skip] ${url}: ${e.message}`);
    return [];
  }
}

// ── Extract all product data from a /details/ page ──────────────────────────
async function scrapeProduct(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  // Wait for the Emersya configurator to inject color tiles
  await sleep(2500);

  const data = await page.evaluate(() => {
    const slug = window.location.pathname.split('/').pop();

    // Title
    const title = document.querySelector('h1')?.textContent?.trim() ?? '';

    // Designer (first h3 on page)
    const designer = document.querySelector('h3')?.textContent?.trim() ?? '';

    // Description — longest paragraphs
    const description = [...document.querySelectorAll('p')]
      .map(p => p.textContent.trim())
      .filter(t => t.length > 80)
      .slice(0, 2)
      .join('\n\n');

    // Price — "€359" or "€1.020" (European thousands separator) or "EUR 359"
    const priceRaw = document.body.innerText.match(/€\s*([\d][.\d]*\d)/) ||
                     document.body.innerText.match(/EUR\s*([\d][.\d,]*\d)/);
    let price = null;
    if (priceRaw) {
      // European format: "1.020" = 1020, "1.020,50" = 1020.50
      let s = priceRaw[1];
      if (s.includes(',')) {
        // Has decimal comma — remove thousand-separator dots, convert comma to dot
        s = s.replace(/\./g, '').replace(',', '.');
      } else {
        // No comma — dot is a thousands separator if followed by exactly 3 digits
        s = s.replace(/\.(\d{3})(?!\d)/g, '$1');
      }
      price = parseFloat(s);
    }

    // Colors — from configure section innerText, lowercase lines only
    const configureH2 = [...document.querySelectorAll('h2')]
      .find(h => h.textContent.trim() === 'Configure');
    let colours = [];
    if (configureH2) {
      let container = configureH2.parentElement;
      for (let i = 0; i < 6; i++) {
        if (container.innerText?.includes('Wishlist')) break;
        container = container.parentElement;
      }
      const IGNORE = new Set([
        'Configure', 'Wishlist', 'Add to cart', 'Zoom in', 'Zoom out',
        'Fullscreen', 'Share', 'Dimensions', 'Reset View', 'View in Room',
        'Add to wishlist',
      ]);
      colours = container.innerText
        .split('\n')
        .map(l => l.trim())
        .filter(l =>
          l.length > 0 && l.length < 50 &&
          !IGNORE.has(l) &&
          !/^\d+$/.test(l) &&       // not a number
          !/^€/.test(l) &&          // not a price
          !/^\w+day,/.test(l) &&    // not a date
          l === l.toLowerCase()     // colour names are lowercase
        )
        .filter((v, i, a) => a.indexOf(v) === i); // unique
    }

    // Images — Vitra CDN, deduplicated, skip tiny/base64
    const images = [...document.querySelectorAll('img[src*="static.vitra.com"]')]
      .map(img => ({ src: img.src, alt: img.alt }))
      .filter(img => !img.src.includes('media-resized') && img.alt && img.alt.length > 5)
      .filter((v, i, a) => a.findIndex(x => x.src === v.src) === i)
      .slice(0, 5);

    // Fallback: include resized images if no direct images found
    const allImages = images.length > 0 ? images :
      [...document.querySelectorAll('img[src*="static.vitra.com"]')]
        .map(img => ({ src: img.src, alt: img.alt }))
        .filter(img => img.alt && img.alt.length > 5)
        .filter((v, i, a) => a.findIndex(x => x.src === v.src) === i)
        .slice(0, 5);

    // Dimensions — look for a section mentioning mm or cm
    const allText = document.body.innerText;
    const dimMatch = allText.match(/(\d+\s*[xX×]\s*\d+[\d\s×xXmmc]+mm[^\n]*)/);
    const dimensions = dimMatch ? dimMatch[1].trim() : '';

    // Vitra product URL
    const productUrl = window.location.href;

    return { slug, title, designer, description, price, colours, images: allImages, dimensions, productUrl };
  });

  return data;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\nVitra Chair Scraper');
  console.log('===================');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-GB',
  });
  const page = await context.newPage();

  // Accept cookies on first page load
  await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  const acceptBtn = page.locator('button[data-testid="uc-accept-all-button"]');
  if (await acceptBtn.count() > 0) {
    await acceptBtn.click();
    await sleep(500);
    console.log('  Cookies accepted.');
  }

  // Discover all detail URLs
  console.log('\n[1] Discovering product URLs...');
  const allDetailUrls = new Set();

  for (const familyUrl of FAMILY_PAGES) {
    const found = await discoverDetailUrls(page, familyUrl);
    found.forEach(u => allDetailUrls.add(u));
    console.log(`  ${familyUrl.split('/').pop()}: +${found.length} products`);
    await sleep(DELAY_MS);
  }

  // Also scrape the lounge-chairs and office-chairs category pages
  for (const catSlug of ['lounge-chairs', 'office-chairs', 'chaise-longues', 'stools-benches-and-ottomans']) {
    const found = await discoverDetailUrls(page, `${BASE}/product/category/${catSlug}`);
    found.forEach(u => allDetailUrls.add(u));
    console.log(`  category/${catSlug}: +${found.length} products`);
    await sleep(DELAY_MS);
  }

  const urls = [...allDetailUrls];
  console.log(`\n  Total unique product pages: ${urls.length}`);

  // Scrape each product detail page
  console.log('\n[2] Scraping product detail pages...');
  const products = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const slug = url.split('/').pop();
    process.stdout.write(`  [${i + 1}/${urls.length}] ${slug}... `);
    try {
      const data = await scrapeProduct(page, url);
      products.push(data);
      console.log(`OK  €${data.price ?? '?'}  ${data.colours.length} colours`);
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
    }
    await sleep(DELAY_MS);
  }

  await browser.close();

  // Save
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const output = {
    scraped_at: new Date().toISOString(),
    count: products.length,
    products,
  };
  fs.writeFileSync(OUT, JSON.stringify(output, null, 2));
  console.log(`\n[3] Saved ${products.length} products to ${OUT}`);
  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
