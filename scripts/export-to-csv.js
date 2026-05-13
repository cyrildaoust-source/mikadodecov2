/**
 * Vitra → Shopify CSV Exporter
 * Converts data/vitra-chairs.json into a Shopify-compatible product CSV
 * that can be imported via Products → Import in the Shopify admin.
 *
 * Usage:
 *   node scripts/export-to-csv.js
 *
 * Output: data/vitra-shopify.csv
 */

const fs   = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/vitra-chairs.json');
const outPath  = path.join(__dirname, '../data/vitra-shopify.csv');

const { products } = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Shopify CSV columns (standard format)
const COLUMNS = [
  'Handle',
  'Title',
  'Body (HTML)',
  'Vendor',
  'Product Category',
  'Type',
  'Tags',
  'Published',
  'Option1 Name',
  'Option1 Value',
  'Variant SKU',
  'Variant Grams',
  'Variant Inventory Tracker',
  'Variant Inventory Qty',
  'Variant Inventory Policy',
  'Variant Fulfillment Service',
  'Variant Price',
  'Variant Compare At Price',
  'Variant Requires Shipping',
  'Variant Taxable',
  'Image Src',
  'Image Position',
  'Image Alt Text',
  'Gift Card',
  'SEO Title',
  'SEO Description',
  'Google Shopping / Google Product Category',
  'Google Shopping / Gender',
  'Google Shopping / Age Group',
  'Google Shopping / MPN',
  'Google Shopping / AdWords Grouping',
  'Google Shopping / AdWords Labels',
  'Google Shopping / Condition',
  'Google Shopping / Custom Product',
  'Google Shopping / Custom Label 0',
  'Google Shopping / Custom Label 1',
  'Google Shopping / Custom Label 2',
  'Google Shopping / Custom Label 3',
  'Google Shopping / Custom Label 4',
  'Variant Image',
  'Variant Weight Unit',
  'Variant Tax Code',
  'Cost per item',
  'Status',
];

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function row(cells) {
  return COLUMNS.map(col => escapeCSV(cells[col] ?? '')).join(',');
}

const lines = [COLUMNS.join(',')];

for (const p of products) {
  const handle = p.slug;
  const tags   = ['vitra', 'chaise', 'design'];
  if (p.designer) {
    const designerName = p.designer.split(',')[0].trim();
    if (designerName && !/^\d{4}/.test(designerName)) {
      tags.push(designerName.toLowerCase().replace(/\s+/g, '-'));
    }
  }

  const description = p.description
    ? p.description.replace(/\n/g, '<br>').replace(/\r/g, '')
    : '';

  const colours  = p.colours && p.colours.length > 0 ? p.colours : ['Default'];
  const images   = p.images  || [];
  const price    = (p.price || 0).toFixed(2);

  const hasColourOption = colours[0] !== 'Default';

  colours.forEach((colour, vi) => {
    const isFirstVariant = vi === 0;

    // First variant row also carries title, description, and first image
    const firstImageSrc = images[0]?.src  ?? '';
    const firstImageAlt = images[0]?.alt  ?? p.title;

    const baseRow = {
      'Handle':                     handle,
      'Title':                      isFirstVariant ? p.title : '',
      'Body (HTML)':                isFirstVariant ? description : '',
      'Vendor':                     isFirstVariant ? 'Vitra' : '',
      'Product Category':           isFirstVariant ? 'Furniture > Chairs' : '',
      'Type':                       isFirstVariant ? 'Chaise' : '',
      'Tags':                       isFirstVariant ? tags.join(', ') : '',
      'Published':                  isFirstVariant ? 'TRUE' : '',
      'Option1 Name':               isFirstVariant ? (hasColourOption ? 'Couleur' : 'Title') : '',
      'Option1 Value':              hasColourOption ? colour : 'Default Title',
      'Variant SKU':                `${handle}-${vi + 1}`,
      'Variant Grams':              '0',
      'Variant Inventory Tracker':  '',
      'Variant Inventory Qty':      '0',
      'Variant Inventory Policy':   'continue',
      'Variant Fulfillment Service':'manual',
      'Variant Price':              price,
      'Variant Compare At Price':   '',
      'Variant Requires Shipping':  'TRUE',
      'Variant Taxable':            'TRUE',
      'Image Src':                  isFirstVariant ? firstImageSrc : '',
      'Image Position':             isFirstVariant ? '1' : '',
      'Image Alt Text':             isFirstVariant ? firstImageAlt : '',
      'Gift Card':                  isFirstVariant ? 'FALSE' : '',
      'SEO Title':                  isFirstVariant ? p.title : '',
      'SEO Description':            isFirstVariant ? p.description?.slice(0, 160) ?? '' : '',
      'Variant Weight Unit':        'kg',
      'Status':                     'active',
    };

    lines.push(row(baseRow));
  });

  // Additional images (position 2+) — each gets its own row with only Handle + image cols
  images.slice(1).forEach((img, ii) => {
    const imgRow = {
      'Handle':         handle,
      'Image Src':      img.src,
      'Image Position': String(ii + 2),
      'Image Alt Text': img.alt ?? p.title,
    };
    lines.push(row(imgRow));
  });
}

fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

console.log(`Done! ${products.length} products → ${lines.length - 1} rows`);
console.log(`Saved to: ${outPath}`);
console.log('');
console.log('Next steps:');
console.log('  1. Go to your Shopify admin → Products → Import');
console.log('  2. Upload data/vitra-shopify.csv');
console.log('  3. Click "Upload and preview" then "Import products"');
