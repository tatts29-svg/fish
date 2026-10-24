"""Author: Andrew Fisher. Keep non-map scripts and the embedded record byte-identical."""
import json,re,sys
from pathlib import Path
base,page=map(lambda p:Path(p).read_text(),sys.argv[1:3]);checks=[]
def check(name,ok):
    checks.append({'name':name,'ok':bool(ok)})
    assert ok,name
scripts=lambda s:re.findall(r'<script\b[^>]*>([\s\S]*?)</script>',s,re.I)
a,b=scripts(base),scripts(page)
check('one viewport module appended',len(b)==len(a)+1 and 'MapViewport1196' in b[-1])
edited=[i for i in range(len(a)) if a[i]!=b[i]]
check('only existing explorer controls and footer changed',len(edited)<=2 and all('function expTools()' in a[i] or 'release922' in a[i] for i in edited))
check('embedded site record identical',re.search(r'const DATA = (.*);',base)[1]==re.search(r'const DATA = (.*);',page)[1])
for name in ['ShowcaseIncident1195','ShowcaseTruck1192','Map1188','Gates1156']:
    i=next(i for i,s in enumerate(a) if name in s);check(name+' retained exactly',a[i]==b[i])
print(json.dumps({'author':'Andrew Fisher','checks':checks,'passed':len(checks)}))
