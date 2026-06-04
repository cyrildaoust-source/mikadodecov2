#!/usr/bin/env node
/**
 * Génère le jeu complet de favicons à partir de logomikado.svg.
 *
 * Le logo est un logotype « Mikado. » (serif) trop large pour être lisible à
 * 16-32 px. On en extrait donc le monogramme « M. » — la lettre « M » (deux
 * sous-tracés) suivie du point final du logo (dernier sous-tracé, ramené
 * juste après le M) — posé dans le noir du site (--ink #1a1916, la couleur
 * du logo dans le header) sur un carré crème arrondi (--paper #f8f5ef).
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
const INK = '#1a1916';     // --ink (brun-noir chaud, couleur du logo dans le header)

// 1. Extraire la lettre « M » du logotype ------------------------------------
const logo = fs.readFileSync(path.join(DIR, 'logomikado.svg'), 'utf8');
const dMatch = logo.match(/<path d="([^"]+)"/);
if (!dMatch) throw new Error('path introuvable dans logomikado.svg');
const fullD = dMatch[1];

// Le path est une suite de sous-tracés, chacun ouvert par un « moveto »
// absolu (M<nombre>). On les sépare pour isoler les glyphes.
const subs = fullD.split(/(?=M-?\d)/).filter(Boolean);
// Les deux premiers = la lettre « M » ; le dernier = le point final « . ».
const mPath = (subs[0] + subs[1]).trim();
const dotPath = subs[subs.length - 1].trim();
if (!/^M65\./.test(dotPath)) throw new Error('point final introuvable — le logo a changé ?');

// Boîte du « M » ≈ 0..18.3 (x) ; le point natif est à x≈64.6 → on le ramène
// juste après le M (bord gauche à 19.4) en le translatant de -45.2.
const DOT_DX = 19.4 - 64.6;      // ≈ -45.2
// Boîte combinée « M. » ≈ 0..22.1 (x) x 0..17.7 (y). Pour la caler dans un
// carré de 64 avec ~8 px de marge : échelle 48/22.1 ≈ 2.17, centrée.
const SCALE = 2.17;
const TX = (64 - 22.1 * SCALE) / 2;   // ≈ 8.0
const TY = (64 - 17.7 * SCALE) / 2;   // ≈ 12.8

// 2. Construire favicon.svg ---------------------------------------------------
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="${CREAM}"/>
  <g transform="translate(${TX.toFixed(2)} ${TY.toFixed(2)}) scale(${SCALE})" fill="${INK}">
    <path d="${mPath}"/>
    <path transform="translate(${DOT_DX.toFixed(2)} 0)" d="${dotPath}"/>
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
