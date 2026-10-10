// node montage.cjs out.jpg src1 x,y,w,h [src2] x,y,w,h — deux bandes 2:5 côte à côte → 1200×1500
const sharp=require('/home/vercel-sandbox/mikadodecov2/node_modules/sharp');
const a=process.argv.slice(2); const out=a[0];
const parts = a.length===4 ? [[a[1],a[2]],[a[1],a[3]]] : [[a[1],a[2]],[a[3],a[4]]];
(async()=>{
  const bufs=[]; for (const [src,box] of parts){const [x,y,w,h]=box.split(',').map(Number);
    bufs.push(await sharp(src).flatten({background:'#ffffff'}).extract({left:x,top:y,width:w,height:h}).resize(600,1500,{fit:'cover'}).toBuffer());}
  await sharp({create:{width:1200,height:1500,channels:3,background:'#ffffff'}})
    .composite([{input:bufs[0],left:0,top:0},{input:bufs[1],left:600,top:0}]).jpeg({quality:92}).toFile(out);
  console.log(out);
})();
