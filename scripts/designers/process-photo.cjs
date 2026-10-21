// Recadre un portrait source en 4:5 (1200 × 1500 au plus, sans agrandissement).
// Usage : node process-photo.cjs <source> <slug> [gravity|x,y,w,h]
const sharp = require('/home/vercel-sandbox/mikadodecov2/node_modules/sharp');
const [src, slug, how = 'attention'] = process.argv.slice(2);
(async () => {
  const img = sharp(src).rotate();
  const { width, height } = await img.metadata();
  let pipeline = sharp(src).rotate(), w, h;
  if (how.startsWith('c:')) {
    // c:cx,cy,scale — centre (fractions de la source) et largeur relative au plus grand cadre 4:5
    const [cx, cy, sc] = how.slice(2).split(',').map(Number);
    const maxW = Math.min(width, Math.floor(height * 4 / 5));
    let cw = Math.round(maxW * sc), ch = Math.round(cw * 5 / 4);
    let left = Math.round(cx * width - cw / 2), top = Math.round(cy * height - ch / 2);
    left = Math.max(0, Math.min(width - cw, left)); top = Math.max(0, Math.min(height - ch, top));
    pipeline = pipeline.extract({ left, top, width: cw, height: ch }); w = cw; h = ch;
  } else if (/^\d+,\d+,\d+,\d+$/.test(how)) {
    const [left, top, cw, ch] = how.split(',').map(Number);
    pipeline = pipeline.extract({ left, top, width: cw, height: ch }); w = cw; h = ch;
  } else {
    // plus grand cadre 4:5 contenu dans la source
    w = Math.min(width, Math.floor(height * 4 / 5)); h = Math.floor(w * 5 / 4);
    pipeline = pipeline.resize(w, h, { fit: 'cover', position: how === 'attention' ? sharp.strategy.attention : how });
  }
  // Le site sert toujours <slug>-640.webp : au moins 640 px (agrandissement ≤ 1,18× pour les sources Fermob et Iittala).
  const outW = Math.max(640, Math.min(1200, w)), outH = Math.round(outW * 5 / 4);
  await pipeline.resize(outW, outH, { fit: 'cover' }).flatten({ background: '#ffffff' }).jpeg({ quality: 84, progressive: true, mozjpeg: true })
    .toFile(`/home/vercel-sandbox/mikadodecov2/v3/images/designers/${slug}.jpg`);
  console.log(slug, `${width}x${height}`, '→', `${outW}x${outH}`);
})().catch(e => { console.error(slug, e.message); process.exit(1); });
