"""Author: Andrew Fisher. Exact page scope and source guards."""
import hashlib,importlib.util,json,os,re
from pathlib import Path
D=Path(__file__).resolve().parents[1];page=Path(os.environ['PAGE']).read_text();base=Path(os.environ['BASE']).read_text();checks=[]
def check(name,ok):
 checks.append({'name':name,'ok':bool(ok)});print(('PASS ' if ok else 'FAIL ')+name);assert ok,name
rest=page
for kind,file in [('CLARITY','clarity1209_src.js'),('SMOOTH','smooth1209_src.js')]:
 old=next(m[2] for m in re.finditer(r'<script([^>]*)>([\s\S]*?)</script>',base) if hashlib.sha256(m[2].encode()).hexdigest()==(D/(kind+'_SHA256')).read_text().strip());rest=rest.replace((D/file).read_text(),old)
rest=rest.replace("+' · v12.09'; /* v8.19 release922",re.search(r"\+' · v[\d.]+?'; /\* v8.19 release922",base)[0]);check('all other page bytes including models, records and map unchanged',rest==base)
check('one release marker',page.count('root.ShowcaseDisplay1209=')==1)
check('preparation phase updates exist',all(x in page for x in ['Building the circuit…','Preparing buildings and fences…','Preparing grandstands…','Finishing the scene…']))
spec=importlib.util.spec_from_file_location('patch',D/'patch_v1209.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
for name,source in [('wrong base',base+' '),('already applied',page)]:
 try:mod.patch(source);ok=False
 except ValueError:ok=True
 check(name+' refuses to patch',ok)
if os.environ.get('OUT'):Path(os.environ['OUT']).write_text(json.dumps(checks,indent=2)+'\n')
