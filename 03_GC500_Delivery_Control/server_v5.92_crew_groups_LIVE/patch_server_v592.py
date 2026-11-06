"""Author: Andrew Fisher. Optional crew attribution without rewriting older ticks."""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
p = Path(sys.argv[1]); raw = p.read_bytes(); s = raw.decode()
assert hashlib.sha256(raw).hexdigest() == 'c1b8bf9c999d4e548384b682592409507dbaf8bb7c4c62c590b62127b69c89b7', 'Wrong server base'
def change(a, b, label):
    global s
    s = rep(s, a, b, label, str(p))
change("const BUILD = 'server v5.91", "const BUILD = 'server v5.92", 'build')
change('no names, an append-only store', 'optional validated crew-group IDs, an append-only store', 'build attribution')
change("build: 'v5.91'", "build: 'v5.92', crew_groups_version: 1", 'health capability')
change('function trackOut(t) { return {', "function trackCrewValid(v) { return typeof v === 'string' && /^(cleaners|pump1|pump2|pump3|water)$/.test(v); }\nfunction trackCrewField(t) { return t.crew_group == null ? {} : { crew_group: t.crew_group }; }\nfunction trackOut(t) { return Object.assign(trackCrewField(t), {", 'group output helper')
change('tapped_at: t.tapped_at }; }', 'tapped_at: t.tapped_at }); }', 'output group')
change("if (ev.e !== 'tick') return false;", "if (ev.e !== 'tick') return false;\n  if (ev.crew_group != null && !trackCrewValid(ev.crew_group)) return false;", 'store validation')
change('function trackSame(a, b) {', 'function trackSame(a, b) {\n  if ((a.crew_group || null) !== (b.crew_group || null)) return false;', 'retry identity')
change('days: c.tracker.days, ticks: page.list.map(trackOut)', 'crew_groups_version: 1, days: c.tracker.days, ticks: page.list.map(trackOut)', 'read capability')
change('const prior = batch.get(t.id) || (box && box.byId.get(t.id));', "if (t.crew_group != null && !trackCrewValid(t.crew_group)) return refuse(400, 'crew_group', i, t, 'choose a valid crew group');\n    const crew = trackCrewField(t);\n    const prior = batch.get(t.id) || (box && box.byId.get(t.id));", 'input validation')
change('trackSame(prior, { ref, line: t.line, task: t.task, day: t.day, done: t.done, undoes })', 'trackSame(prior, Object.assign({ ref, line: t.line, task: t.task, day: t.day, done: t.done, undoes }, crew))', 'retry group')
change('saved.push(Object.assign({ id: t.id, seq: prior.seq, at: prior.at, already: true },', 'saved.push(Object.assign(trackCrewField(prior), { id: t.id, seq: prior.seq, at: prior.at, already: true },', 'retry acknowledgement')
change('fresh.push(ev); batch.set(t.id, ev);', 'Object.assign(ev, crew);\n    fresh.push(ev); batch.set(t.id, ev);', 'persist group')
change('saved.push({ id: t.id, seq: ev.seq, at, already: false });', 'saved.push(Object.assign({ id: t.id, seq: ev.seq, at, already: false }, crew));', 'group acknowledgement')
change('return send(res, 200, { saved, now: at, epoch: trackEpoch(token) });', 'return send(res, 200, { saved, now: at, epoch: trackEpoch(token), crew_groups_version: 1 });', 'post capability')
p.write_text(s)
