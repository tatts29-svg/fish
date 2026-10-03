#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact reversal proves all non-presentation bytes preserved."""
import hashlib, importlib.util, json, re, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('patch808',root/'patch_v808.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
basepath,candidatepath=map(Path,sys.argv[1:3]);base=basepath.read_text();candidate=candidatepath.read_text();checks=[]
def check(name,result):
 checks.append({'name':name,'pass':bool(result)})
 if not result: raise AssertionError(name)
check('candidate is exact guarded patch output',m.apply(base)==candidate)
src=(root/'sheet_remaining808_src.js').read_text().rstrip()+'\n'
check('helper source embedded exactly once',candidate.count(src)==1)
r=candidate.replace(src,'',1)
reversals=[
 ("const lab = doc === 'drv' ? (col ? 'Collect' : 'Planned delivery') : (col ? 'Remove' : 'Planned installation');", " const lab = doc === 'drv' ? (col ? 'Collect' : 'Deliver') : (col ? 'Remove' : 'Install');"),
 ("dpSec(g.kind === 'deliveries' ? 'Planned equipment and current supply' : 'On the truck', dpTruck(g, doc))", "dpSec('On the truck', dpTruck(g, doc))"),
 ("g.kind === 'removals' ? 'Removal list' : 'Installation checks'", "g.kind === 'removals' ? 'Removal list' : 'Install list'"),
 ("<th>What</th><th>${g.kind === 'deliveries' ? 'Booked / recorded numbers' : 'Asset no.'}</th>",'<th>What</th><th>Asset no.</th>'),
 ("<td>${g.kind === 'deliveries' ? sheet808What(r) : `<b>${what ? esc(what) : ''}</b>${what ? '' : dpWr()}`}<span>${esc([r.a.name, r.a.discipline].filter(Boolean).join(' · '))}</span></td>","<td><b>${what ? esc(what) : ''}</b>${what ? '' : dpWr()}<span>${esc([r.a.name, r.a.discipline].filter(Boolean).join(' · '))}</span></td>"),
 ('const sh = sheet808Sub(r.a), shn = new Set(sh.map(x => String(x.no)).filter(Boolean)), own = nums.filter(x => !shn.has(String(x)));',' const sh = subOf(r.a.key), shn = new Set(sh.map(x => String(x.no)).filter(Boolean)), own = nums.filter(x => !shn.has(String(x)));'),
 ('<meta name="gc500-release" content="v8.08">',re.search(r'<meta name="gc500-release" content="[^"]+">',base).group(0))
]
for old,new in reversals:
 check('reverse anchor '+str(len(checks)),r.count(old)==1);r=r.replace(old,new,1)
check('exact reversal to entire original page',r==base)
for name,body in [('repeat',candidate),('wrong version',base.replace('content="v8.07"','content="v0.00"').replace('content="v8.05"','content="v0.00"')),('changed print component',base.replace("dpSec('On the truck', dpTruck(g, doc))","dpSec('Changed', dpTruck(g, doc))"))]:
 refused=False
 try:m.apply(body)
 except SystemExit:refused=True
 check(name+' refuses without output mutation',refused)
print(json.dumps({'author':'Andrew Fisher','base_sha256':hashlib.sha256(basepath.read_bytes()).hexdigest(),'candidate_sha256':hashlib.sha256(candidatepath.read_bytes()).hexdigest(),'checks':checks},indent=2))
