"""Author: Andrew Fisher. Exact source, candidate, retained manifest and rollback checks."""
from pathlib import Path
import hashlib,importlib.util,json,tempfile
HERE=Path(__file__).resolve().parents[1]
PRIVATE=Path('/tmp/private-gc500-visual1018/map')
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
p=module('map_patch1018',HERE/'patch_maps1018.py');pub=module('map_publish1018',HERE/'publish_maps1018.py')
out=p.patch(PRIVATE/'source');binding=json.loads((HERE/'evidence/source-bound.json').read_text())['changedFiles']
assert len(out)==3
for name,s in out.items():
 assert s==(PRIVATE/'candidate'/name).read_text()
 assert hashlib.sha256(s.encode()).hexdigest()==binding['explorer/'+name]['candidate']
with tempfile.TemporaryDirectory(dir='/tmp') as tmp:
 folder=Path(tmp)
 for name,s in out.items():(folder/name).write_text(s)
 try:p.patch(folder)
 except ValueError:pass
 else:raise AssertionError('Repeat candidate accepted')
 for name in out:(folder/name).write_text((PRIVATE/'source'/name).read_text())
 (folder/'explorer.js').write_text((folder/'explorer.js').read_text()+'\n')
 try:p.patch(folder)
 except ValueError:pass
 else:raise AssertionError('Unknown source accepted')
before=json.loads((PRIVATE/'source/retained-manifest.json').read_text());after=json.loads((PRIVATE/'prepared/candidate-manifest.json').read_text())
digest=lambda m:hashlib.sha256(json.dumps({k:m[k] for k in ['schema','entry','files']},ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
assert digest(before)==before['sha256']
assert digest(after)==after['sha256']
assert pub.validate_union(before,after,{k:v['candidate'] for k,v in binding.items()})==230
assert pub.validate_union(after,before,{k:v['base'] for k,v in binding.items()})==230
print(json.dumps({'author':'Andrew Fisher','checks':9,'passed':True,'preservedFiles':230,'rollbackVerified':True}))
