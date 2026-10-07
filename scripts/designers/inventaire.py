import json,re,unicodedata,collections,csv,subprocess
def slug(s):
  s=s.lower(); s=unicodedata.normalize('NFD',s); s=re.sub('[̀-ͯ]','',s).replace('ø','o').replace('æ','ae')
  return re.sub('[^a-z0-9]+','-',s).strip('-')
ROOT='/home/vercel-sandbox/mikadodecov2'
C=json.load(open('canon.json'))
before={p['id']:p for p in json.load(open('releve-avant-tags.json'))}
P=json.load(open('releve-apres-tags.json'))
OLD={d['slug']:d for d in json.loads(subprocess.check_output(['git','-C',ROOT,'show','HEAD:v3/designers-data.json']))['designers']}
NEW={d['slug']:d for d in json.load(open(f'{ROOT}/v3/designers-data.json'))['designers']}
photos=json.load(open(f'{ROOT}/data/designer-photos.json'))['designers']
dec=json.load(open('decisions.json'))
R={}
for f in __import__('glob').glob('research/*.json'):
  for e in json.load(open(f)): R[e['slug']]=e
newtag={t:d['slug'] for d in NEW.values() for t in d['tags']}
oldtag={t:d['slug'] for d in OLD.values() for t in d['tags']}
rows=collections.OrderedDict()
for p in P:
  n=(p['designer'] or '').strip()
  if not n: continue
  online='Mikado Deco Headless' in p['published']
  if n in C['skip']:
    key='skip:'+n; r=rows.setdefault(key,{'nom':n,'slug':'','valeurs':collections.Counter(),'marques':set(),'actifs':0,'en_ligne':0,'vis_av':0,'vis_ap':0,'tags':collections.Counter(),'statut':'non traité : '+C['skip'][n]})
    r['valeurs'][n]+=1; r['marques'].add(p['vendor']); r['actifs']+=1; r['en_ligne']+=online; continue
  for t in (C['multi'].get(n) or [C['alias'].get(n) or slug(n)]):
    s=t if t in NEW else newtag.get(t)
    key=s or 'sans-fiche:'+t
    d=NEW.get(s)
    r=rows.setdefault(key,{'nom':d['name'] if d else n,'slug':s or t,'valeurs':collections.Counter(),'marques':set(),'actifs':0,'en_ligne':0,'vis_av':0,'vis_ap':0,'tags':collections.Counter(),'statut':''})
    r['valeurs'][n]+=1; r['marques'].add(p['vendor']); r['actifs']+=1; r['en_ligne']+=online
    if d:
      ot=set(OLD[s]['tags']) if s in OLD else set()
      if online and ot&set(before[p['id']]['tags']): r['vis_av']+=1
      if online and set(d['tags'])&set(p['tags']): r['vis_ap']+=1
      for x in set(d['tags'])&set(p['tags']): r['tags'][x]+=1
    elif not s: r['statut']='aucun produit sur le site : fiche non créée'
out=open('inventaire.csv','w',newline='',encoding='utf-8')
w=csv.writer(out)
w.writerow(['nom_normalise','slug','valeurs_du_metachamp','marques','produits_actifs','produits_en_ligne','produits_en_ligne_sur_sa_page_avant','produits_en_ligne_sur_sa_page_apres','tags_trouves','fiche_avant','fiche_apres','photo_avant','photo_apres','source_photo','remarque'])
for k,r in sorted(rows.items(), key=lambda x:(-x[1]['en_ligne'],x[1]['nom'])):
  s=r['slug']; d=NEW.get(s); o=OLD.get(s)
  note=r['statut']
  if d and not d.get('photo'):
    why=dec['rejectPhoto'].get(s) or (R.get(s) or {}).get('photoMissingReason') or ''
    note=(note+' ; ' if note else '')+'sans photo : '+why[:220]
  if d and (R.get(s) or {}).get('bioConfidence')=='faible': note=(note+' ; ' if note else '')+'bio courte, sources minces'
  w.writerow([r['nom'],s if d else '',' | '.join(f'{v} ({c})' for v,c in r['valeurs'].items()),', '.join(sorted(r['marques'])),r['actifs'],r['en_ligne'],r['vis_av'] if d else '',r['vis_ap'] if d else '',' '.join(f'{t}({c})' for t,c in r['tags'].items()),
    'oui' if o else 'non','oui' if d else 'non','oui' if o and o.get('photo') else 'non','oui' if d and d.get('photo') else 'non',(photos.get(s) or {}).get('sourcePage',''),note])
out.close()
vals=collections.Counter()
for r in rows.values():
  if NEW.get(r['slug']) and r['en_ligne']: vals['avec_fiche_en_ligne']+=1; vals['photo']+= bool(NEW[r['slug']].get('photo'))
print(len(rows),'lignes',dict(vals), 'noms distincts', len({(p['designer'] or '').strip() for p in P if p['designer']}))
