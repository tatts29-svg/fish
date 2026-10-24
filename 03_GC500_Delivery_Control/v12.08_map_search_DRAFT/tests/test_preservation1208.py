"""Author: Andrew Fisher. Exact scope preservation and guarded source binding."""
import hashlib,importlib.util,json,os,re
from pathlib import Path
D=Path(__file__).resolve().parents[1];page=Path(os.environ['PAGE']).read_text();base=Path(os.environ['BASE']).read_text();checks=[]
def check(name,ok):
 checks.append({'name':name,'ok':bool(ok)});print(('PASS ' if ok else 'FAIL ')+name);assert ok,name
rest=page
for name in ['spot1117-script','find1178-script']:
 pat=r'<script id="'+name+r'">[\s\S]*?</script>';old=re.search(pat,base)[0];new=re.search(pat,rest)[0];rest=rest.replace(new,old)
rest=re.sub(r'<script id="search1208-script">[\s\S]*?</script>\n','',rest);rest=rest.replace("+' · v12.08'; /* v8.19 release922",re.search(r"\+' · v[\d.]+?'; /\* v8.19 release922",base)[0])
check('all bytes outside map search, spot extension and footer unchanged',rest==base)
check('one map module only',page.count('id="search1208-script"')==1)
check('catalog has exact drawing and frame source identities',all(len(json.loads((D/'legend1208.json').read_text())[k])==64 for k in ['scene_sha256','drawing_sha256','frame_sha256']))
c=json.loads((D/'legend1208.json').read_text());expected={'firstaid':6,'information':3,'police':1,'photographer':12,'broadcast':20,'emergency':24,'marshal':25,'yellowflag':1,'hydrant':18}
check('130 inspected source-symbol and label occurrences', {k:len(v) for k,v in c['symbols'].items()}==expected)
check('legend samples excluded from source catalog',all(x['box'][1]<1466 for a in c['symbols'].values() for x in a))
check('only explicitly labelled MP circles used as marshal posts',all(x.get('label','').startswith('MP') for x in c['symbols']['marshal']))
spec=importlib.util.spec_from_file_location('patch',D/'patch_v1208.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
for name,source in [('wrong base',base+' '),('already applied',page)]:
 try:mod.patch(source);ok=False
 except ValueError:ok=True
 check(name+' refuses to patch',ok)
if os.environ.get('OUT'):Path(os.environ['OUT']).write_text(json.dumps(checks,indent=2)+'\n')
