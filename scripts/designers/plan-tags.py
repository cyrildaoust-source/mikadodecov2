# Plan d'ajout de tags créateur : pour chaque produit actif dont custom.designer nomme
# un créateur présent au répertoire, ajouter le slug de sa fiche (et celui des membres
# d'un duo qui ont leur propre fiche). Aucun retrait. Sortie : tag-plan.json.
import json,re,unicodedata,sys
def slug(s):
  s=s.lower(); s=unicodedata.normalize('NFD',s); s=re.sub('[̀-ͯ]','',s).replace('ø','o').replace('æ','ae')
  return re.sub('[^a-z0-9]+','-',s).strip('-')
C=json.load(open('canon.json')); P=json.load(open(sys.argv[1] if len(sys.argv)>1 else 'export-avant.json'))
D={d['slug']:d for d in json.load(open('../../v3/designers-data.json'))['designers'] if not d.get('hidden')}
tagmap={t:d['slug'] for d in D.values() for t in d['tags']}
def resolve(s): return s if s in D else tagmap.get(s)
plan=[]; unresolved={}
for p in P:
  n=(p['designer'] or '').strip()
  if not n or n in C['skip']: continue
  wanted=[]
  for s in (C['multi'].get(n) or [C['alias'].get(n) or slug(n)]) + C['extraTags'].get(n,[]):
    r=resolve(s)
    if r: wanted.append(r)
    else: unresolved.setdefault(n,0); unresolved[n]+=1
  # déjà visible si le produit porte l'un des tags de la fiche (autre écriture incluse)
  add=[t for t in dict.fromkeys(wanted) if not set(D[t]['tags'])&set(p['tags'])]
  if add: plan.append({'id':p['id'],'handle':p['handle'],'designer':n,'tagsBefore':p['tags'],'add':add,'online':'Mikado Deco Headless' in p['published']})
json.dump(plan,open('tag-plan.json','w'),ensure_ascii=False,indent=1)
print('products to tag',len(plan),'tags',sum(len(x['add']) for x in plan),'online',sum(x['online'] for x in plan))
print('unresolved',unresolved)
