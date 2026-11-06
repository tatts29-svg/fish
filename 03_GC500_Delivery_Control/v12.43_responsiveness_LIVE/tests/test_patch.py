"""Author: Andrew Fisher. Fail closed on stale/repeated inputs; preserve styling."""
import hashlib,importlib.util,os,re
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'patch_v1243.py'
spec=importlib.util.spec_from_file_location('release',p);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
base=Path(os.environ['BASE']).read_text();sha=hashlib.sha256(base.encode()).hexdigest()
new=mod.patch(base,'fixture',sha)
def refuses(t,h):
 try:mod.patch(t,'fixture',h)
 except ValueError:return
 raise AssertionError('unsafe input accepted')
refuses(base,'');refuses(base,'0'*64);refuses(new,hashlib.sha256(new.encode()).hexdigest())
broken=base.replace(' if (changed) countUpFigures(tab); /* v5.92 */','')
refuses(broken,hashlib.sha256(broken.encode()).hexdigest())
assert re.findall(r'<style\b[^>]*>[\s\S]*?</style>',base)==re.findall(r'<style\b[^>]*>[\s\S]*?</style>',new)
assert " if (changed) countUpFigures(tab);" not in new
assert "+' · v12.43';" in new
assert 'id="charge1239-script"' not in new
print('8/8 release boundary and stylesheet checks passed')
