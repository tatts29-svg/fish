"""Author: Andrew Fisher. Bounded PDF/map export change, no business or collection model rewrite."""
import hashlib,importlib.util,re,sys,json
from pathlib import Path
here=Path(__file__).resolve().parent.parent;base=Path(sys.argv[1]).read_text();page=Path(sys.argv[2]).read_text();checks={}
checks['exact_live_base']=hashlib.sha256(base.encode()).hexdigest()=='d01878c99c7d8972beb8c6b76e16775d7c53f20551c4c3d41f422404d1616a67'
normal=base.replace("+' · v12.12'; /* v8.19 release922","+' · v12.13'; /* v8.19 release922")
pat=r'<script\b[^>]*>[\s\S]*?</script>';a=re.findall(pat,normal);b=re.findall(pat,page);changed=[(x,y) for x,y in zip(a,b) if x!=y]
checks['only_two_scripts_changed']=len(a)==len(b)==196 and len(changed)==2 and all('id="demob1211-script"' in x or 'id="spot1117-script"' in x for x,y in changed)
checks['outside_scripts_exact']=re.sub(pat,'SCRIPT',normal)==re.sub(pat,'SCRIPT',page)
for old,new in changed:
 if 'id="demob1211-script"' in old:
  marker='/* Author: Andrew Fisher. Coates-style driver pickup sheets:'
  checks['departure_selection_and_transport_models_exact']=old.split(marker)[0]==new.split('/* Author: Andrew Fisher. Read-only contents and photographs')[0]
 else:
  start='function demobFrame1211(){';end='  demobFrame1211();'
  checks['other_map_modules_exact']=old[old.index(end):]==new[new.index(end):] and old[:old.index('function areaFrame1206(){')]==new[:new.index('function areaFrame1206(){')]
  for first,last in [('function selected(){','function consent()'),('function selectedSnapshot','function assertFresh('),('function download(','async function send(')]:checks[first.split('(')[0]]=old[old.index(first,old.index(start)):old.index(last,old.index(start))]==new[new.index(first,new.index(start)):new.index(last,new.index(start))]
  checks['original_area_picture_exact']=old[old.index(' async function picture(s){'):old.index(' function render(){',old.index(' async function picture(s){'))]==new[new.index(' async function picture(s){'):new.index(' function render(){',new.index(' async function picture(s){'))]
checks['global_twinsteer_rules_exact']=next(x for x in a if 'id="twinsteer1053-script"' in x)==next(x for x in b if 'id="twinsteer1053-script"' in x)
spec=importlib.util.spec_from_file_location('patch',here/'patch_v1213.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
for name,value in [('second_application_refused',page),('wrong_base_refused',base+'\n')]:
 try:mod.patch(value);checks[name]=False
 except ValueError:checks[name]=True
print(json.dumps(checks,indent=2));assert all(checks.values())
