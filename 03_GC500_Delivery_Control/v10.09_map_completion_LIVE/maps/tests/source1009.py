#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact map source guards, geometry and retained behaviour."""
from pathlib import Path
import hashlib
import importlib.util
import json
import shutil
import sys
import tempfile
HERE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('patch',HERE/'patch_maps1009.py');patch=importlib.util.module_from_spec(spec);spec.loader.exec_module(patch)
source,candidate=map(Path,sys.argv[1:3]);old=(source/'explorer.js').read_text();new=(candidate/'explorer.js').read_text();checks=[]
def check(name,ok):
    assert ok,name
    checks.append({'name':name,'pass':True})
def block(text,start,end):
    i=text.index(start);return text[i:text.index(end,i)]
for start,end,name in [
    ('function sheetToDevice(', 'function currentView(', 'Sheet transform and inverse'),
    ('function currentView(', 'function applyDpr(', 'Camera view calculation'),
    ('function itemAt887(', '/* search on the drawing', 'Native hit targets')]:
    check(name+' retained byte-for-byte',block(old,start,end)==block(new,start,end))
check('Region coordinates retained',block(old,'const regions = [','$(\'jumps\')')==block(new,'const regions = [','$(\'jumps\')'))
check('No new repeating timers',new.count('setInterval(')==old.count('setInterval(') and new.count('setTimeout(')==old.count('setTimeout('))
check('Raw unverified Done API removed',"typeof w.gc500DoneKeys" not in new)
check('Verified status populates optional Done layer','DONE782=new Set(COMPLETE897)' in new)
check('Marked references excluded from duplicate Done overlay','marks.some(m=>m.it.code===it.code)' in new)
check('Selection highlight explicitly orange',"r: r / dpr+4, c: '#ff821f'" in new)
check('No status geometry added to native hit targets','mapStatus1009' not in block(new,'function itemAt887(','/* search on the drawing'))
check('Parent provider is read once per existing loop','done782Pull(); /* v10.09: one verified status snapshot */' in new)
check('Motion Off and reduced motion stop pulse children','html.d782still #pulse *' in new and '@media(prefers-reduced-motion:reduce)' in new)
check('Accessible selected status has polite live region',"el.setAttribute('aria-live','polite')" in new)
mergeold=(source/'explorer-merge.js').read_text();mergenew=(candidate/'explorer-merge.js').read_text()
check('Merge has only one existing-refresh hook',mergenew.replace("\n    if(typeof complete897Pull==='function')complete897Pull();",'',1)==mergeold)
evidence=json.loads((HERE/'evidence/source-bound.json').read_text())
for name,meta in evidence['changedFiles'].items():
    raw=(candidate/Path(name).name).read_bytes()
    check(name+' matches reviewed bytes',hashlib.sha256(raw).hexdigest()==meta['candidate'] and len(raw)==meta['bytes'])
index=(candidate/'index.html').read_text()
for name in ['explorer.js','explorer-merge.js']:
    check(name+' query binds candidate SHA',name+'?v='+hashlib.sha256((candidate/name).read_bytes()).hexdigest()[:12] in index)
with tempfile.TemporaryDirectory(prefix='map1009-test-') as temp:
    temp=Path(temp)
    patch.apply(source,temp/'rebuilt')
    check('Exact reproducible output',all((temp/'rebuilt'/name).read_bytes()==(candidate/name).read_bytes() for name in patch.BASE))
    try:patch.apply(candidate,temp/'repeat');raise AssertionError('Repeat accepted')
    except ValueError:check('Already patched base rejected',True)
    bad=temp/'bad';shutil.copytree(source,bad);(bad/'explorer.js').write_bytes((bad/'explorer.js').read_bytes()+b'\n')
    try:patch.apply(bad,temp/'wrong');raise AssertionError('Wrong base accepted')
    except ValueError:check('Modified base rejected',True)
report={'author':'Andrew Fisher','pass':True,'checks':checks}
(HERE/'evidence/source-controls.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'pass':True,'checks':len(checks)}))
