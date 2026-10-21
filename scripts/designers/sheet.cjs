// Planche contact : node sheet.cjs out.png file1 file2 ... (étiquettes = nom de fichier)
const sharp=require('/home/vercel-sandbox/mikadodecov2/node_modules/sharp');
const [out,...files]=process.argv.slice(2);const W=240,H=300,cols=6,rows=Math.ceil(files.length/cols);
(async()=>{const comps=[];for(const [i,f] of files.entries()){const x=(i%cols)*W,y=Math.floor(i/cols)*(H+24);
 comps.push({input:await sharp(f).resize(W,H,{fit:'contain',background:'#eee'}).png().toBuffer(),left:x,top:y});
 const label=require('path').basename(f).slice(0,30);comps.push({input:Buffer.from(`<svg width="${W}" height="24"><text x="4" y="17" font-size="14" font-family="sans-serif">${label}</text></svg>`),left:x,top:y+H});}
 await sharp({create:{width:cols*W,height:rows*(H+24),channels:3,background:'#fff'}}).composite(comps).png().toFile(out);})();
