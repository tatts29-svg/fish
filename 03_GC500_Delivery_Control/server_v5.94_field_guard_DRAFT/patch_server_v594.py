"""Author: Andrew Fisher. Server v5.94 on the exact running v5.93 source: delivery writes keep the fields a stale page
leaves out, the edit key reads the hourly record snapshots, and the banner says so. Nothing else changes.

    python3 patch_server_v594.py server.js      (a copy of ../server_v5.93_lock_declaration_LIVE/server.js)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE = '8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46'   # v5.93, running since 25 Oct 2026 17:45 AEST
p = Path(sys.argv[1]); raw = p.read_bytes(); s = raw.decode()
assert hashlib.sha256(raw).hexdigest() == BASE, 'Wrong server base (not v5.93, or already patched)'
assert 'keepDeliveryFields' not in s and 'RECORD_SNAP_RE' not in s, 'v5.94 is already in this file'


def change(a, b, label):
    global s
    s = rep(s, a, b, label, str(p))


# C. the banner: a v5.94 line in front, the rest as v5.93 had it
change("const BUILD = 'server v5.93 — THE SERVICING TRACKER (",
       "const BUILD = 'server v5.94 — THE DELIVERY FIELD GUARD (a delivery write that leaves out a Ready tick, booking, "
       "Emptied, timeline, loading or handling field keeps the stored one and the two unit maps merge by the page\\'s own "
       "later-stamp rule, because a page opened before those fields existed wrote 68 documents back without them at 03:59 "
       "on 27 Oct; the edit key can list and read the hourly record snapshots; Andrew Fisher, 27 Oct 2026) "
       "+ v5.93 — THE SERVICING TRACKER (", 'banner')

# A. the capability, wherever lock_declarations_version is reported
change("build: 'v5.93', crew_groups_version: 1, lock_declarations_version: 1 });",
       "build: 'v5.94', crew_groups_version: 1, lock_declarations_version: 1, delivery_field_guard_version: 1 });", 'health capability')
change('crew_groups_version: 1, lock_declarations_version: 1, days: c.tracker.days',
       'crew_groups_version: 1, lock_declarations_version: 1, delivery_field_guard_version: 1, days: c.tracker.days', 'tracker read capability')
change('epoch: trackEpoch(token), crew_groups_version: 1, lock_declarations_version: 1 });',
       'epoch: trackEpoch(token), crew_groups_version: 1, lock_declarations_version: 1, delivery_field_guard_version: 1 });', 'tracker save capability')

# A. the guard, in setDoc (the only place a document is set), after the path is checked and before the store
change("""function setDoc(coll, id, body, who) {
  if (!SEG.test(coll) || !SEG.test(id) || id === '.' || id === '..' || protoKey(coll) || protoKey(id)) return false;""",
       (HERE / 'guard594.js').read_text() + """function setDoc(coll, id, body, who) {
  if (!SEG.test(coll) || !SEG.test(id) || id === '.' || id === '..' || protoKey(coll) || protoKey(id)) return false;
  const guard = coll === 'delivery' ? keepDeliveryFields(id, body) : null;   /* v5.94 */""", 'delivery field guard')
change("logWrite({ at: state.updated, v: state.version, op: 'set', coll, id, by: (body && (body.by || body.done_by || body.recorded_by || body.date_by)) || null, who });",
       "  logWrite({ at: state.updated, v: state.version, op: 'set', coll, id, by: (body && (body.by || body.done_by || body.recorded_by || body.date_by)) || null, who });\n"
       "  if (guard) logWrite({ at: state.updated, v: state.version, what: 'delivery fields kept', coll, id, kept: guard.kept, unitsKept: guard.unitsKept });   /* v5.94 — field names and a count, never a value */",
       'guard log line')

# B. the snapshot read, beside the snapshot code and beside the other /api/admin reads
change('setInterval(snapshot, 60 * 60 * 1000).unref();',
       'setInterval(snapshot, 60 * 60 * 1000).unref();\n' + (HERE / 'snap594.js').read_text().rstrip('\n'), 'snapshot read functions')
change("if (p === '/api/admin/machine' && req.method === 'GET') {",
       """      /* v5.94 — the record snapshots, edit key only (snap594 above) */
      if (p === '/api/admin/snapshots' && req.method === 'GET') {
        if (lv !== 'edit') return send(res, 403, { error: 'edit token required' });
        return send(res, 200, await recordSnapshots());
      }
      if ((m = p.match(/^\\/api\\/admin\\/snapshot\\/([^/]+)$/)) && req.method === 'GET') {
        if (lv !== 'edit') return send(res, 403, { error: 'edit token required' });
        return sendRecordSnapshot(res, m[1]);
      }
      if (p === '/api/admin/machine' && req.method === 'GET') {""", 'snapshot routes')

out = s.encode()
p.write_bytes(out)
print('server v5.94', hashlib.sha256(out).hexdigest(), len(out), 'bytes')
