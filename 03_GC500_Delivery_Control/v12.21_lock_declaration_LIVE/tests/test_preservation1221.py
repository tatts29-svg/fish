"""Author: Andrew Fisher. Exact non-servicing preservation and guarded patch boundaries."""
import importlib.util,os,re
from pathlib import Path
base=Path(os.environ['BASE']).read_text();page=Path(os.environ['PAGE']).read_text()
scripts=lambda s:list(re.finditer(r'<script\b([^>]*)>(.*?)</script\s*>',s,re.S|re.I))
a=scripts(base);b=scripts(page);assert len(a)==len(b)
changed=[]
for i,(old,new) in enumerate(zip(a,b)):
 assert old[1]==new[1]
 if old[2]==new[2]:continue
 if 'svc1067-script' in old[1] or 'report1202-script' in old[1]:changed.append(old[1]);continue
 assert old[2].replace("+' · v12.19';", "+' · v12.21';").replace("+' · v12.20';", "+' · v12.21';")==new[2],f'Unexpected script change {i}'
 changed.append('release footer')
assert len(changed)==3
def outside(s):return re.sub(r'<script\b([^>]*)>(.*?)</script\s*>','<SCRIPT>',s,flags=re.S|re.I)
assert outside(base)==outside(page),'Markup outside changed scripts untouched'
p=Path(__file__).resolve().parents[1]/'patch_v1221.py';spec=importlib.util.spec_from_file_location('patch1221',p);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
for text in [page,base+'\n']:
 try:mod.patch(text)
 except AssertionError:pass
 else:raise AssertionError('Patch must reject wrong or already-patched base')
print({'checks':5,'script_count':len(a),'changed':changed,'all_other_scripts_unchanged':True})
