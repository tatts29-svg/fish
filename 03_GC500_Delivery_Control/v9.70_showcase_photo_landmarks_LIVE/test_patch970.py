#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact source preservation and strict patch guards."""
from pathlib import Path
import importlib.util,sys,hashlib,subprocess,tempfile
here=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('patch970',here/'patch_v970.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
b=Path(sys.argv[1]).read_text();n=m.patch(b);checks=0
def ok(v,msg):
 global checks
 assert v,msg
 checks+=1
start=b.index(' /* 7. v6.65 - the overhead bridge on the main straight');end=b.index(' stats.corners=corners.map',start)
helper=(here/'landmarks970.js').read_text()
r=n.replace(helper+'\n','',1).replace('const g=DRESS_FONT[ch]||DRESS_FONT[ch.toUpperCase()];if(!g)return;','const g=DRESS_FONT[ch];if(!g)return;',1).replace(' /* 7. v9.70 - source-anchored photographic bridge and advertising span. */\n G.photoLandmarks970.build(S,{dquad,ed,H,text,panel},stats);\n ',b[start:end]+' ',1).replace("+ ' · v9.70'","+ ' · v9.69'",1)
ok(r==b,'all non-whitelisted source bytes unchanged')
for value in [n,b+' ',b.replace("+ ' · v9.69'","+ ' · v9.68'")]:
 try:m.patch(value)
 except ValueError:checks+=1
 else:raise AssertionError('wrong/stale/reapplied source accepted')
ok(n.count('G.photoLandmarks970=')==1,'single helper');ok(' /* 7. v6.65 - the overhead bridge on the main straight' not in n,'generic heuristic bridge replaced');ok(n.count("+ ' · v9.70'")==1,'version970');ok('const s=(S.gridS+(S.tune.carS||3.4)*.9)%CL.L' in n,'actual starting gantry retained')
for key in ['G.pose=function','G.step=function','G.setView=function','G.camStep=function','G.report=function','G.units=function','G.defaultTune=function']:
 p=b.index(key);q=b.index('\n};',p)+3;ok(b[p:q] in n,'unchanged '+key)
print(f'{checks} strict/preservation checks passed')
