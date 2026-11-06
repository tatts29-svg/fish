#!/usr/bin/env python3
"""Author: Andrew Fisher. Preserve operational source while packing the Today presentation."""
import importlib.util,json,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('patch907',HERE/'patch_v907.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
base=Path(sys.argv[1]).read_text();candidate=Path(sys.argv[2]).read_text();preview='--preview-existing-art' in sys.argv
expected,_=mod.patch(base,preview);assert expected==candidate,'Candidate is not reproducible'
parse=lambda text:json.loads(re.search(r'const DATA = (\{.*?\});\n',text)[1])
a,b=parse(base),parse(candidate)
if (HERE/'plates907.json').exists():
 for c in json.loads((HERE/'plates907.json').read_text())['cells']:
  entry=b['media'].pop(c['sha256']);assert entry=={k:c[k] for k in ('file','sha256','type','bytes','scope')}
 b['hostedMedia']['manifest']=a['hostedMedia']['manifest']
assert a==b,'Operational DATA differs'
scripts=lambda text:re.findall(r'<script\b[^>]*>([\s\S]*?)</script>',text,re.I)
x,y=scripts(base),scripts(candidate);assert len(y)==len(x)+1 and 'const TodayPlates907 =' in y[-1]
for i,(old,new) in enumerate(zip(x,y)):
 if old!=new:assert 'const DATA = ' in old or 'const Scene896 =' in old,'Operational JavaScript changed at script '+str(i)
for bad in [candidate,base.replace('scene896-script','scene-missing'),re.sub(r' · v9\.0[4-6]\b',' · v7.99',base)]:
 try:mod.patch(bad,preview)
 except (ValueError,AssertionError,SystemExit):pass
 else:raise AssertionError('Wrong/repeated patch accepted')
print('PASS: reproducible presentation patch; operational DATA/functions unchanged; wrong/repeated bases rejected.')
