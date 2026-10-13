#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact source, existing geometry and no-record-write guards."""
from pathlib import Path
import hashlib,importlib.util,json,sys,tempfile
HERE=Path(__file__).resolve().parents[1]
def module(name):
 spec=importlib.util.spec_from_file_location(name,HERE/(name+'.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
maps=module('patch_maps1010');parent=module('patch_quantity1010');source,candidate,base=map(Path,sys.argv[1:4]);checks=[]
def check(name,result):
 assert result,name
 checks.append({'name':name,'pass':True})
old=(source/'explorer.js').read_text();new=(candidate/'explorer.js').read_text()
def block(s,start,end):
 i=s.index(start);return s[i:s.index(end,i)]
for start,end,name in [('function badge1009(', 'function label1009(', 'Status symbols'),('function drawMarks(', 'const gradCache887', 'Map marker position and drawing'),('function itemAt887(', '/* search on the drawing', 'Native hit targets'),('function done782List(', 'let done782At', 'Verified optional Done layer')]:
 check(name+' unchanged',block(old,start,end)==block(new,start,end))
timers_unchanged=all(old.count(token)==new.count(token) for token in ['setTimeout(','setInterval('])
check('No extra timers',timers_unchanged)
check('Canvas quantity lines capped at three', 'q.lines.slice(0,3)' in new)
check('Canvas quantity text constrained to viewport','Math.min(300*dpr,canvas.width-8*dpr)' in new)
check('Quantity-only update enters existing refresh signature','quantity:row.quantity||null' in new)
merge=(candidate/'explorer-merge.js').read_text()
check('Quantity disclosure stays as the user left it during refresh','nextQuantity.open=quantityOpen' in merge and 'quantityOpen=quantities?quantities.open:null' in merge)
check('Focused quantity summary remains focused during refresh',"if(quantityFocus)nextQuantity.querySelector('summary').focus({preventScroll:true})" in merge)
for name,meta in json.loads((HERE/'evidence/source-bound.json').read_text())['changedFiles'].items():
 raw=(candidate/Path(name).name).read_bytes();check(name+' matches reviewed bytes',hashlib.sha256(raw).hexdigest()==meta['candidate'] and len(raw)==meta['bytes'])
with tempfile.TemporaryDirectory(prefix='quantity1010-source-') as temp:
 out=Path(temp)/'output';maps.apply(source,out);check('Exact map rebuild',all((candidate/n).read_bytes()==(out/n).read_bytes() for n in maps.BASE))
 try:maps.apply(candidate,Path(temp)/'repeat');raise AssertionError('repeat accepted')
 except ValueError:check('Map repeat/wrong base rejected',True)
 original=base.read_text();patched=parent.apply(original)
 check('Parent native data untouched',block(original,'const DATA =','\n')==block(patched,'const DATA =','\n'))
 check('Native completion classifier untouched',block(original,'function mapStatus1009Classify(', 'window.gc500MapStatus1009')==block(patched,'function mapStatus1009Classify(', '/* Author: Andrew Fisher. Typed reference quantities'))
 try:parent.apply(patched);raise AssertionError('repeat accepted')
 except ValueError:check('Parent repeat rejected',True)
report={'author':'Andrew Fisher','pass':True,'checks':checks};(HERE/'evidence/source-controls.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'pass':True,'checks':len(checks)}))
