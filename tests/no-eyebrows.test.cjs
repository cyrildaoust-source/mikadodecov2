// Règle permanente (Cyril, 24 septembre 2026) : aucun surtitre (« eyebrow ») sur le site.
// Un surtitre est un petit texte, souvent en capitales espacées, placé au-dessus d'un titre
// pour l'introduire (catégorie, contexte, slogan, numéro). Voir DESIGN.md, « Surtitres ».
// Ce test bloque le retour des classes et motifs connus ; scripts/detect-eyebrows.cjs
// contrôle le rendu réel d'une preview ou de la production.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const skip=new Set(['tests/no-eyebrows.test.cjs','scripts/detect-eyebrows.cjs']);
function files(dir){
  return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>{
    const rel=path.join(dir,e.name);
    if(e.isDirectory())return /^(images|fonts|node_modules)$/.test(e.name)?[]:files(rel);
    return /\.(html|js|mjs|cjs|css|json)$/.test(e.name)&&!skip.has(rel)?[rel]:[];
  });
}
const banned=[
  [/eyebrow|kicker|overline|surtitre/i,'classe ou champ de surtitre'],
  [/class="[^"]*__eye\b/,'classe __eye'],
  [/class="jcat\b|\.jcat\b/,'étiquette de catégorie au-dessus des titres du journal'],
  [/article__meta/,'surtitre des articles'],
  [/mm-side__label|drawer__foot-label/,'étiquette au-dessus du coup de cœur du menu'],
];
test('aucun surtitre dans le code du site',()=>{
  const hits=[];
  for(const f of ['v3','lib','templates','scripts','data'].flatMap(files).concat(['server.js'])){
    fs.readFileSync(path.join(root,f),'utf8').split('\n').forEach((line,i)=>{
      for(const [re,why] of banned)if(re.test(line))hits.push(`${f}:${i+1} — ${why}`);
    });
  }
  assert.deepEqual(hits,[],'Surtitres interdits (DESIGN.md, « Surtitres ») :\n'+hits.join('\n'));
});
