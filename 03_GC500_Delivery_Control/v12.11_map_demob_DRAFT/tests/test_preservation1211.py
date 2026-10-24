"""Author: Andrew Fisher. Exact preservation of all other functionality and source guards."""
import hashlib,importlib.util,json,os,re
from pathlib import Path
D=Path(__file__).resolve().parents[1];page=Path(os.environ['PAGE']).read_text();base=Path(os.environ['BASE']).read_text();checks=[]
def check(name,ok):
 checks.append({'name':name,'ok':bool(ok)});print(('PASS ' if ok else 'FAIL ')+name);assert ok,name
rest=page
pat=r'<script id="spot1117-script">[\s\S]*?</script>';rest=rest.replace(re.search(pat,rest)[0],re.search(pat,base)[0])
rest=re.sub(r'<script id="demob1211-script">[\s\S]*?</script>\n','',rest);rest=rest.replace("+' · v12.11'; /* v8.19 release922",re.search(r"\+' · v[\d.]+?'; /\* v8.19 release922",base)[0])
check('every byte outside map pickup, frame and footer unchanged',rest==base)
check('one pickup module only',page.count('id="demob1211-script"')==1)
spec=importlib.util.spec_from_file_location('patch',D/'patch_v1211.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
for name,source in [('wrong base',base+' '),('already applied',page)]:
 try:mod.patch(source);ok=False
 except ValueError:ok=True
 check(name+' refuses to patch',ok)
if os.environ.get('OUT'):Path(os.environ['OUT']).write_text(json.dumps(checks,indent=2)+'\n')
