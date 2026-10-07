# Intègre la 2e vague (research2/) : nouvelles fiches, bios et portraits manquants des fiches existantes.
import json,glob,re,unicodedata,os
ROOT='/home/vercel-sandbox/mikadodecov2'
def slug(s):
  s=s.lower(); s=unicodedata.normalize('NFD',s); s=re.sub('[̀-ͯ]','',s).replace('ø','o').replace('æ','ae').replace('œ','oe')
  return re.sub('[^a-z0-9]+','-',s).strip('-')
data=json.load(open(f'{ROOT}/v3/designers-data.json')); D={d['slug']:d for d in data['designers']}
photos=json.load(open(f'{ROOT}/data/designer-photos.json'))
C=json.load(open('canon.json'))
brands={slug(b['name']) for b in json.load(open(f'{ROOT}/v3/mega-menu-brands.json'))['brands']}
R=[e for f in sorted(glob.glob('research2/*.json')) for e in json.load(open(f))]
B={e['slug']:e for f in glob.glob('batches2/*.json') for e in json.load(open(f))}
owned={t for d in D.values() for t in d['tags']}
bad=re.compile(r'incontournable|iconique|génie|intemporel|sublime|légendaire|mythique|—',re.I)
new=bios=ph=0; notc=[]
for e in R:
  s=e['slug']
  if e.get('notCreator'):
    notc.append(s)
    if s in D: D[s]['hidden']=True
    for v in B[s].get('metafieldValues') or [D.get(s,{}).get('name')]:
      if v: C['skip'][v]=(e.get('remarks') or 'pas un créateur')[:160]
    continue
  bio=(e.get('bio') or '').strip()
  if bio and bad.search(bio): print('MOT À REVOIR',s,bad.findall(bio))
  photo=f'/images/designers/{s}.jpg' if e.get('photo') and os.path.exists(f'{ROOT}/v3/images/designers/{s}.jpg') else None
  if s not in D:
    tags=[s]
    for v in B[s].get('metafieldValues',[]):
      t=slug(v)
      if t!=s and t not in owned and t not in brands and v not in C['multi']: tags.append(t); owned.add(t)
    owned.add(s)
    d={'name':e['name'],'slug':s,'tags':tags,'brands':B[s]['brands'],'bio':bio,'sortKey':e.get('sortKey') or e['name']}
    if photo: d['photo']=photo
    D[s]=d; new+=1
  else:
    d=D[s]
    if bio and not (d.get('bio') or '').strip(): d['bio']=bio; bios+=1
    if photo and not d.get('photo'): d['photo']=photo
  if photo and s not in photos['designers']:
    p=e['photo']; photos['designers'][s]={'sourcePage':p['sourcePage'],'imageUrl':p['imageUrl'],'credit':p.get('credit'),'note':(p.get('notes') or '')[:240],'retrieved':'2026-10-06'}; ph+=1
# variantes rattachées aux fiches existantes : leur slug devient un tag de la fiche (si libre)
for v,t in C['alias'].items():
  if t in D:
    vs=slug(v)
    if vs!=t and vs not in owned and vs not in brands: D[t]['tags'].append(vs); owned.add(vs)
data['designers']=sorted(D.values(),key=lambda d:(d.get('sortKey') or d['name']).lower())
data['_note']=f"{len(D)} designers — complété le 2026-09-30 puis le 2026-10-06 (produits actifs et brouillons) à partir du métachamp custom.designer des produits Shopify ; bios sourcées sur les sites des éditeurs ou des créateurs ; sources des portraits dans data/designer-photos.json. Tri par sortKey."
json.dump(data,open(f'{ROOT}/v3/designers-data.json','w'),ensure_ascii=False,indent=2); open(f'{ROOT}/v3/designers-data.json','a').write('\n')
json.dump(photos,open(f'{ROOT}/data/designer-photos.json','w'),ensure_ascii=False,indent=2); open(f'{ROOT}/data/designer-photos.json','a').write('\n')
json.dump(C,open('canon.json','w'),ensure_ascii=False,indent=1)
print('nouvelles fiches',new,'bios ajoutées aux fiches existantes',bios,'portraits sourcés',ph,'pas des créateurs',notc,'total',len(D))
