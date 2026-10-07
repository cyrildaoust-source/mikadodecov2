# Fusionne les recherches dans v3/designers-data.json et data/designer-photos.json.
import json,re,unicodedata,glob,collections,os,sys
ROOT='/home/vercel-sandbox/mikadodecov2'
def slug(s):
  s=s.lower(); s=unicodedata.normalize('NFD',s); s=re.sub('[̀-ͯ]','',s).replace('ø','o').replace('æ','ae')
  return re.sub('[^a-z0-9]+','-',s).strip('-')
data=json.load(open(f'{ROOT}/v3/designers-data.json'))
D={d['slug']:d for d in data['designers']}
C=json.load(open('canon.json')); P=json.load(open('export-avant.json'))
A=json.load(open('batches/_all.json'))['items']
decisions=json.load(open('decisions.json'))   # slugs à ne pas créer, photos refusées, recadrages
R={}
for f in sorted(glob.glob('research/*.json')):
  for e in json.load(open(f)): R[e['slug']]=e
missing=set(A)-set(R)
if missing: print('SANS RECHERCHE', sorted(missing))

# 1. Doublons d'écriture déjà présents au répertoire
def merge_dup(keep, drop, name=None, bio=None):
  k,d=D[keep],D.pop(drop)
  k['tags']=list(dict.fromkeys(k['tags']+d['tags']))
  k['brands']=list(dict.fromkeys(k['brands']+d['brands']))
  if name: k['name']=name
  if bio: k['bio']=bio
for m in decisions['merge']: merge_dup(**m)

# 2. Nouvelles fiches et compléments
photos=json.load(open(f'{ROOT}/data/designer-photos.json')) if os.path.exists(f'{ROOT}/data/designer-photos.json') else {'_note':'','designers':{}}
for s,e in R.items():
  if s in decisions['noEntry']: continue
  item=A[s]
  bio=(decisions['bio'].get(s) or e.get('bio') or '').strip()
  if s not in D:
    D[s]={'name':e['name'],'slug':s,'tags':[s],'brands':item['brands'],'bio':bio,'sortKey':e.get('sortKey') or e['name']}
  elif bio and item['mode'] in ('bio','bio+photo','new'):
    D[s]['bio']=bio
  ph=e.get('photo')
  if ph and ph.get('file') and s not in decisions['rejectPhoto'] and item['mode']!='bio':
    D[s]['photo']=f'/images/designers/{s}.jpg'
    photos['designers'][s]={k:ph.get(k) for k in ('sourcePage','imageUrl','credit')}
    photos['designers'][s].update(decisions.get('photoSource',{}).get(s,{}))
    photos['designers'][s]['retrieved']='2026-09-30'

for k,v in decisions.get('sortKey',{}).items(): D[k]['sortKey']=v

# 3. Écritures du métachamp et marques réelles
tagmap={t:d['slug'] for d in D.values() for t in d['tags']}
def resolve(x): return x if x in D else tagmap.get(x)
vendors=collections.defaultdict(set)
for p in P:
  n=(p['designer'] or '').strip()
  if not n or n in C['skip']: continue
  targets=C['multi'].get(n) or [C['alias'].get(n) or slug(n)]
  for t in targets:
    r=resolve(t)
    if not r: continue
    if 'Mikado Deco Headless' in p['published']: vendors[r].add(p['vendor'])
    # l'écriture du métachamp mène à la fiche (lien de la fiche produit)
    v=slug(n)
    if v!=r and (len(targets)==1 or t==targets[0]) and v not in D[r]['tags'] and not resolve(v):
      D[r]['tags'].append(v)
for s,vs in vendors.items():
  D[s]['brands']=list(dict.fromkeys(D[s]['brands']+sorted(vs)))

# 4. Tri et écriture
order=sorted(D.values(), key=lambda d:(unicodedata.normalize('NFD',(d.get('sortKey') or d['name']).replace('Ø','O').replace('ø','o').replace('Æ','Ae').replace('æ','ae')).encode('ascii','ignore').decode().lower(), d['name'].lower()))
keys=['name','slug','tags','brands','bio','photo','sortKey','featured','hidden']
out=[{k:d[k] for k in keys if k in d} | {k:v for k,v in d.items() if k not in keys} for d in order]
data['_note']=f"{len(out)} designers — complété le 2026-09-30 à partir du métachamp custom.designer des produits Shopify (bios sourcées sur les sites des éditeurs ou des créateurs ; sources des portraits ajoutés dans data/designer-photos.json). Tri par sortKey."
data['designers']=out
json.dump(data,open(f'{ROOT}/v3/designers-data.json','w'),ensure_ascii=False,indent=2); open(f'{ROOT}/v3/designers-data.json','a').write('\n')
photos['_note']="Portraits ajoutés au répertoire des créateurs : page officielle (éditeur ou créateur) où l'image est publiée, fichier d'origine et crédit s'il est indiqué. Les portraits antérieurs au 30 septembre 2026 n'ont pas de source enregistrée."
photos['designers']=dict(sorted(photos['designers'].items()))
json.dump(photos,open(f'{ROOT}/data/designer-photos.json','w'),ensure_ascii=False,indent=2); open(f'{ROOT}/data/designer-photos.json','a').write('\n')
print('fiches',len(out),'photos enregistrées',len(photos['designers']))
