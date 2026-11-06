"""Author: Andrew Fisher. Persist explicit door-lock declarations on the exact running v5.92 source."""
import hashlib,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode()
assert hashlib.sha256(raw).hexdigest()=='bdb058ffe1d7e269be978546581383a85f11bd7fc7078f569d41de33b6efe396','Wrong server base'
def change(a,b,label):
 global s
 s=rep(s,a,b,label,str(p))
change("const BUILD = 'server v5.92", "const BUILD = 'server v5.93",'build')
change("build: 'v5.92', crew_groups_version: 1", "build: 'v5.93', crew_groups_version: 1, lock_declarations_version: 1",'health capability')
change('function trackOut(t) { return Object.assign(trackCrewField(t), {', (HERE/'lock593.js').read_text()+'\nfunction trackOut(t) { return Object.assign(trackCrewField(t), trackLockField(t), {','read declaration')
change('if (ev.crew_group != null && !trackCrewValid(ev.crew_group)) return false;', 'if (ev.crew_group != null && !trackCrewValid(ev.crew_group)) return false;\n  if (!trackLockValid(ev)) return false;','validate stored declarations')
change('function trackSame(a, b) {', 'function trackSame(a, b) {\n  if (!trackLockSame(a, b)) return false;','immutable declaration identity')
change('crew_groups_version: 1, days: c.tracker.days', 'crew_groups_version: 1, lock_declarations_version: 1, days: c.tracker.days','read capability')
change('const crew = trackCrewField(t);', "if (!trackLockValid(t)) return refuse(400, 'lock_declaration', i, t, 'a door-lock declaration needs its version, one name, crew and covered unit count');\n    const crew = Object.assign(trackCrewField(t), trackLockField(t));",'input declaration validation')
change('saved.push(Object.assign(trackCrewField(prior), {', 'saved.push(Object.assign(trackCrewField(prior), trackLockField(prior), {','retry echo')
change('if (!day) return refuse(400,', "if (t.lock_declaration && t.lock_declaration.units !== line.qty) return refuse(400, 'lock_units', i, t, 'the declaration must cover this completion line exactly');\n    if (!day) return refuse(400,",'exact covered units')
change('epoch: trackEpoch(token), crew_groups_version: 1 });', 'epoch: trackEpoch(token), crew_groups_version: 1, lock_declarations_version: 1 });','save capability')
p.write_text(s)
