"""Author: Andrew Fisher. Native data and all unrelated scripts stay byte-identical."""
import json,re,sys,hashlib
from pathlib import Path
base,page=[Path(p).read_text() for p in sys.argv[1:3]];checks=[]
def check(name,ok):
 checks.append({'name':name,'ok':bool(ok)});assert ok,name
scripts=lambda s:re.findall(r'<script\b[^>]*>([\s\S]*?)</script>',s,re.I)
a,b=scripts(base),scripts(page)
check('one viewport module appended',len(b)==len(a)+1 and 'MapViewport1203' in b[-1])
changed=[i for i in range(len(a)) if a[i]!=b[i]]
check('only the native height call and footer change in existing scripts',changed==[4])
check('embedded DATA byte identical',re.search(r'const DATA = (.*);',base)[1]==re.search(r'const DATA = (.*);',page)[1])
for name in ['ShowcaseIncident1195','ShowcaseTruck1192','Map1188','Gates1156','PL1194','Loading1200','cards1197','svcNight1202']:
 matches=[i for i,s in enumerate(a) if name in s]
 if not matches:continue
 check(name+' retained exactly',all(a[i]==b[i] for i in matches))
check('servicing IIFE retained exactly',a[123]==b[123])
font=next(i for i,s in enumerate(a) if "s.id='fonts1066'" in s)
check('fonts1066 loader retained exactly',a[font]==b[font])
for id in ['ontime1057-script']:
 pattern=r'<(?:style|script)\b[^>]*id=[\"\u0027]'+id+r'[\"\u0027][^>]*>[\s\S]*?</(?:style|script)>'
 x=re.search(pattern,base);y=re.search(pattern,page);check(id+' retained exactly',x and y and x[0]==y[0])
check('original map style blocks retained',all(s in page for s in re.findall(r'<style\b[^>]*>[\s\S]*?</style>',base,re.I)))
print(json.dumps({'author':'Andrew Fisher','base_sha256':hashlib.sha256(base.encode()).hexdigest(),'candidate_sha256':hashlib.sha256(page.encode()).hexdigest(),'checks':checks,'passed':len(checks)}))
