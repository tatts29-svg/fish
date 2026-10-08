#!/usr/bin/env python3
"""Author: Andrew Fisher. Bound the presentation patch to its exact permitted edits."""
import importlib.util,json,re,sys,tempfile,hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('patch902',HERE/'patch_v902.py'); mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
base=Path(sys.argv[1]).read_text(); candidate=Path(sys.argv[2]).read_text()
expected,manifest=mod.patch(base);assert expected==candidate,'Candidate is not the reproducible v902 patch'
parse=lambda s:json.loads(re.search(r'const DATA = (\{.*?\});\n',s)[1])
a,b=parse(base),parse(candidate);d=json.loads((HERE/'yard902.json').read_text())
assert len(b['media'])==len(a['media'])+1
assert b['media'].pop(d['sha256'])=={k:d[k] for k in ('file','sha256','type','bytes','scope')}
b['hostedMedia']['manifest']=a['hostedMedia']['manifest'];assert a==b,'Operational DATA changed'
# Every embedded function stays identical; only the Scene896 media pointer/shading is permitted to differ.
scripts=lambda s:re.findall(r'<script\b[^>]*>([\s\S]*?)</script>',s,re.I)
a_scripts,b_scripts=scripts(base),scripts(candidate);assert len(a_scripts)==len(b_scripts)
changed=[]
for i,(a,b) in enumerate(zip(a_scripts,b_scripts)):
 if a!=b:
  if 'const DATA = ' in a:continue
  assert 'const Scene896 = ' in a,'Unexpected JavaScript change at script '+str(i)
  changed.append(i)
assert len(changed)==1
# Wrong/repeated patches refuse before a file can be written.
for bad in (candidate,base.replace('scene896-script','missing-scene'),re.sub(r' · v(?:8\.99|9\.0[01])\b',' · v7.99',base)):
 try:mod.patch(bad)
 except (ValueError,SystemExit,AssertionError):pass
 else:raise AssertionError('Invalid base accepted')
print('PASS: candidate reproducible; operational DATA and all non-scene functions unchanged; one verified media addition; wrong/repeated patches rejected.')
