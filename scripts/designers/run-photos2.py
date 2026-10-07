import json,glob,re,subprocess,sys,os
over=json.load(open('crops2.json')) if os.path.exists('crops2.json') else {}
only=set(sys.argv[1:])
for f in sorted(glob.glob('research2/*.json')):
  for e in json.load(open(f)):
    ph=e.get('photo'); s=e['slug']
    if not ph or (only and s not in only): continue
    src='/home/vercel-sandbox/mikadodecov2/'+ph['file']
    how=over.get(s)
    if not how:
      m=re.search(r'(\d{1,5}),\s?(\d{1,5}),\s?(\d{3,5}),\s?(\d{3,5})',ph.get('notes') or '')
      how=','.join(m.groups()) if m else 'attention'
    r=subprocess.run(['node','process-photo.cjs',src,s,how],capture_output=True,text=True)
    print((r.stdout+r.stderr).strip()[:160], how)
