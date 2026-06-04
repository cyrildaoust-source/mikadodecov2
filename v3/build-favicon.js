#!/usr/bin/env node
/**
 * Génère le jeu complet de favicons à partir de logomikado.svg.
 *
 * Le logo est un logotype « Mikado » (serif) trop large pour être lisible à
 * 16-32 px. On en extrait donc la seule lettre « M » (deux sous-tracés du
 * path original), posée en bleu roi (--accent #38529F) sur un carré crème
 * arrondi (--paper #f8f5ef) — la signature de la DA.
 *
 * Sorties (à la racine de v3/, servies en /<fichier> par vercel.json) :
 *   - favicon.svg            onglets modernes (vectoriel)
 *   - favicon.ico (32x32)    fallback Google / vieux navigateurs (PNG dans ICO)
 *   - apple-touch-icon.png   180x180, marges de sécurité
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = __dirname;
const CREAM = '#f8f5ef';   // --paper
const BLUE = '#38529F';    // --accent (bleu roi)

// 1. Extraire la lettre « M » du logotype ------------------------------------
const logo = fs.readFileSync(path.join(DIR, 'logomikado.svg'), 'utf8');
const dMatch = logo.match(/<path d="([^"]+)"/);
if (!dMatch) throw new Error('path introuvable dans logomikado.svg');
const fullD = dMatch[1];

// Les lettres suivantes commencent au « M20.1182 » (le « i »). Tout ce qui
// précède = la lettre « M » (ses deux sous-tracés). Boîte ≈ 0..18.3 x 0..17.7.
const cut = fullD.indexOf('M20.1182');
if (cut === -1) throw new Error('séparation M/i introuvable — le logo a changé ?');
const mPath = fullD.slice(0, cut).trim();

// 2. Construire favicon.svg ---------------------------------------------------
// M natif ~18.3 x 17.7 → scale 2.4 ⇒ ~44 x 42.5, centré dans 64 (marges ~10).
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="${CREAM}"/>
  <g transform="translate(10 10.9) scale(2.4)" fill="${BLUE}">
    <path d="${mPath}"/>
  </g>
</svg>
`;
fs.writeFileSync(path.join(DIR, 'favicon.svg'), faviconSvg);
console.log('✓ favicon.svg');

const svgBuf = Buffer.from(faviconSvg);

(async () => {
  // 3. apple-touch-icon.png 180x180 (carré plein, marges déjà dans le SVG) ----
  await sharp(svgBuf, { density: 384 })
    .resize(180, 180, { fit: 'contain', background: CREAM })
    .png()
    .toFile(path.join(DIR, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png (180x180)');

  // 4. favicon.ico 32x32 : PNG 32x32 encapsulé dans un conteneur ICO ----------
  const png32 = await sharp(svgBuf, { density: 384 })
    .resize(32, 32, { fit: 'contain', background: CREAM })
    .png()
    .toBuffer();

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);   // reserved
  header.writeUInt16LE(1, 2);   // type 1 = icon
  header.writeUInt16LE(1, 4);   // 1 image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0);              // width
  entry.writeUInt8(32, 1);              // height
  entry.writeUInt8(0, 2);               // palette
  entry.writeUInt8(0, 3);               // reserved
  entry.writeUInt16LE(1, 4);            // color planes
  entry.writeUInt16LE(32, 6);           // bits per pixel
  entry.writeUInt32LE(png32.length, 8); // taille des données
  entry.writeUInt32LE(22, 12);          // offset (6 + 16)

  fs.writeFileSync(path.join(DIR, 'favicon.ico'), Buffer.concat([header, entry, png32]));
  console.log('✓ favicon.ico (32x32, PNG-in-ICO)');
})().catch((e) => { console.error(e); process.exit(1); });
