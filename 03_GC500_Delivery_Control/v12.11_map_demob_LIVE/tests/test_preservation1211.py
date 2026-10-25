"""Author: Andrew Fisher. Unrelated scripts, tracker payloads, business data and page structure stay exact."""
import hashlib,importlib.util,json,os,re
from pathlib import Path
D=Path(__file__).resolve().parents[1];page=Path(os.environ['PAGE']).read_text();base=Path(os.environ['BASE']).read_text();checks=[]
def check(name,ok):
 checks.append({'name':name,'ok':bool(ok)});print(('PASS ' if ok else 'FAIL ')+name);assert ok,name
pat=r'<script\b([^>]*)>([\s\S]*?)</script>'
a=list(re.finditer(pat,base));b=[m for m in re.finditer(pat,page) if 'id="demob1211-script"' not in m[1]]
check('exactly one new module and no missing source script',len(a)==len(b) and page.count('id="demob1211-script"')==1)
allowed={'spot1117-script','units925-script','demob-weather996-source','inventory960-script','projection938-script','vms-completion1101-script'}
unchanged=0
for x,y in zip(a,b):
 assert x[1]==y[1], 'script identity changed'
 sid=re.search(r'id="([^"]+)"',x[1]);key=sid[1] if sid else ''
 if key not in allowed and 'function setLight(key, state, collection996)' not in x[2]:
  assert x[2]==y[2],key or 'unchanged unnamed script';unchanged+=1
check('all '+str(unchanged)+' unrelated scripts unchanged, including Servicing and crew card',True)
for sid in ['teams1187-script','who1189-script']:
 check(sid+' preserved exactly',next(m[2] for m in a if 'id="'+sid+'"' in m[1])==next(m[2] for m in b if 'id="'+sid+'"' in m[1]))
data=r'^const DATA = (\{.*\});?$'
check('embedded operational/business source data unchanged',re.search(data,base,re.M)[1]==re.search(data,page,re.M)[1])
rest=page
for x,y in reversed(list(zip(a,b))):rest=rest.replace(y[0],x[0],1)
rest=re.sub(r'<script id="demob1211-script">[\s\S]*?</script>\n','',rest)
check('page structure and styles outside changed scripts unchanged',rest==base)
spec=importlib.util.spec_from_file_location('patch',D/'patch_v1211.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
for name,source in [('wrong base',base+' '),('already applied',page)]:
 try:mod.patch(source);ok=False
 except ValueError:ok=True
 check(name+' refuses to patch',ok)
if os.environ.get('OUT'):Path(os.environ['OUT']).write_text(json.dumps(checks,indent=2)+'\n')
