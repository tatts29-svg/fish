"""Author: Andrew Fisher. Exact three-file union and reversible registration guards."""
from pathlib import Path
import copy,hashlib,importlib.util,json,os
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('publisher1017',HERE.parent/'publish_maps1017.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
private=Path(os.environ.get('MAP_EVIDENCE','/workspace/private-gc500-recheck14Oct2026/maps'))
before=json.loads((private/'retained-manifest.json').read_text());after=json.loads((private/'prepared/candidate-manifest.json').read_text());binding=json.loads((HERE.parent/'evidence/source-bound.json').read_text())['changedFiles']
expected={k:v['candidate'] for k,v in binding.items()};original={k:v['base'] for k,v in binding.items()}
digest=lambda manifest:hashlib.sha256(json.dumps({k:manifest[k] for k in ('schema','entry','files')},ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
assert digest(before)==before['sha256']
assert digest(after)==after['sha256']
assert m.validate_union(before,after,expected)==230
assert m.validate_union(after,before,original)==230
broken=copy.deepcopy(after);next(x for x in broken['files'] if x['path']=='explorer/assets/georeferencing.json')['sha256']='0'*64
try:m.validate_union(before,broken,expected)
except ValueError:pass
else:raise AssertionError('Unrelated geometry change was accepted')
for name,hash_ in original.items():assert hashlib.sha256((private/'public'/name).read_bytes()).hexdigest()==hash_
for name,hash_ in expected.items():assert hashlib.sha256((private/'candidate'/Path(name).name).read_bytes()).hexdigest()==hash_
print(json.dumps({'author':'Andrew Fisher','checks':7,'passed':True,'retainedFiles':230,'reversibleManifest':True}))
