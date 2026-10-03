#!/usr/bin/env python3
"""Author: Andrew Fisher. Isolated proposal only; never edits the owned draft."""
from pathlib import Path
import difflib
import hashlib
import json
import argparse

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', required=True, type=Path, help='immutable work directory')
parser.add_argument('--out', required=True, type=Path, help='isolated proposal output directory')
args = parser.parse_args()
ROOT, OUT = args.source.resolve(), args.out.resolve()
assert ROOT != OUT, 'source and proposal must be separate directories'
OUT.mkdir(parents=True, exist_ok=True)

def exactly_once(s, old, new):
    assert s.count(old) == 1, 'source drift or duplicate replacement'
    return s.replace(old, new)

changes = {}
old = (ROOT / 'mech-driveline.js').read_text()
new = exactly_once(old, '''  engaged=starting?0:Math.min(1,engaged+Math.abs(d)*1.5);
  clutchAngle+=d*engaged;''', '''  /* Integrate the take-up ramp over this crank step, including any fully clamped remainder.
     Sampling only the final engagement transfers too much turn on a longer frame. */
  if(starting)engaged=0;
  else{const travel=Math.abs(d),ramp=Math.min(travel,(1-engaged)/1.5),before=engaged;
   engaged=Math.min(1,engaged+ramp*1.5);
   clutchAngle+=Math.sign(d)*(ramp*(before+engaged)/2+(travel-ramp));}''')
changes['mech-driveline.js'] = (old,new)

old = (ROOT / 'car-app.js').read_text()
new = exactly_once(old, 'engine.animate(-drive.angle,id=>drive.engaged(extraIndex.get(id)??-1));engine.setThrottle(throttle,id=>drive.engaged(extraIndex.get(id)??-1));engine.setStarter(drive.starting,lastDt);', 'engine.setStarter(drive.starting,lastDt);engine.animate(-drive.angle,id=>drive.engaged(extraIndex.get(id)??-1));engine.setThrottle(throttle,id=>drive.engaged(extraIndex.get(id)??-1));')
changes['car-app.js'] = (old,new)

diffs, manifest = [], {}
for name,(old,new) in changes.items():
    (OUT/name).write_text(new)
    diffs.extend(difflib.unified_diff(old.splitlines(True),new.splitlines(True),fromfile='a/'+name,tofile='b/'+name))
    manifest[name] = {'base_sha256':hashlib.sha256(old.encode()).hexdigest(),'proposal_sha256':hashlib.sha256(new.encode()).hexdigest()}
(OUT/'mechanics.patch').write_text(''.join(diffs))
(OUT/'manifest.json').write_text(json.dumps({'author':'Andrew Fisher','source_commit':'ba9fff7ec48d3d49d037f461c145b1abd6f2c957','files':manifest},indent=2)+'\n')
print(json.dumps(manifest,indent=2))
