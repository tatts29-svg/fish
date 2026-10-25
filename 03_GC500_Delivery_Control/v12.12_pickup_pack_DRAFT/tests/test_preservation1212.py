"""Author: Andrew Fisher. Bound this presentation change to the PDF and its native export handoff."""
import hashlib,importlib.util,re,sys,json
from pathlib import Path
here=Path(__file__).resolve().parent.parent
base=Path(sys.argv[1]).read_text();page=Path(sys.argv[2]).read_text();checks={}
checks['exact_v1211_base']=hashlib.sha256(base.encode()).hexdigest()=='3b51c50a7766f2f37d222f49c2cad18c03eb868356c8019ce600581eac46915d'
base=base.replace("+' · v12.11'; /* v8.19 release922","+' · v12.12'; /* v8.19 release922")
pattern=r'<script\b[^>]*>[\s\S]*?</script>'
a=re.findall(pattern,base);b=re.findall(pattern,page)
changed=[(n,x,y) for n,(x,y) in enumerate(zip(a,b)) if x!=y]
checks['only_two_scripts_changed']=len(a)==len(b)==196 and len(changed)==2 and all('id="demob1211-script"' in x or 'id="spot1117-script"' in x for _,x,_ in changed)
checks['only_footer_outside_scripts']=re.sub(pattern,'SCRIPT',base).replace("+' · v12.11'; /* v8.19 release922","+' · v12.12'; /* v8.19 release922")==re.sub(pattern,'SCRIPT',page)
for _,old,new in changed:
 if 'id="demob1211-script"' in old:
  checks['departure_and_pickup_models_exact']=old.split('/* Author: Andrew Fisher. Native text')[0]==new.split('/* Author: Andrew Fisher. Coates-style')[0]
 else:
  start=old.index('function demobFrame1211()');end=old.index('  demobFrame1211();',start)
  ns=new.index('function demobFrame1211()');ne=new.index('  demobFrame1211();',ns)
  checks['all_other_map_behaviour_exact']=old[:start]==new[:ns] and old[end:]==new[ne:]
  old=old[start:end];new=new[ns:ne]
  checks['driver_only_no_departure_shortcut']='data-record-departure' not in new and 'parent.Departure1211.open' not in new
  # These core operational and stale/selection controls must remain byte-exact.
  for first,last in [('function selected(){','function open('),('function selectedSnapshot','async function send(')]:
   checks[first.split('(')[0]]=old[old.index(first):old.index(last)].rstrip()==new[new.index(first):new.index(last)].rstrip()
spec=importlib.util.spec_from_file_location('patch',here/'patch_v1212.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
for key,value in [('second_application_refused',page),('wrong_base_refused',base+'\n')]:
 try:mod.patch(value);checks[key]=False
 except ValueError:checks[key]=True
print(json.dumps(checks,indent=2));assert all(checks.values())
