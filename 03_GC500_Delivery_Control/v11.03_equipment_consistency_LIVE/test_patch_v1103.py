"""Author: Andrew Fisher. Exact-base and protected-source release checks."""
import contextlib
import hashlib
import io
import re
import sys
from pathlib import Path

from patch_v1103 import BASE_SHA256, NATIVE_STATUS_GUARD, NATIVE_STATUS_FALLBACK, patch

base = Path(sys.argv[1]).read_text()
assert hashlib.sha256(base.encode()).hexdigest() == BASE_SHA256
with contextlib.redirect_stdout(io.StringIO()):
    out = patch(base)
checks = 1
for bad in (base + '\n', out):
    try:
        patch(bad)
    except ValueError:
        checks += 1
    else:
        raise AssertionError('wrong-base or repeat patch was accepted')

def between(value, start, end):
    i = value.index(start)
    return value[i:value.index(end, i)]

for start, end in [
    ('function allAssets(){', 'function holdAssets(fn){'),
    ('function recordFor(key){', 'function inventoryProjection(I,c){'),
    ('var SvcState =', 'module.exports = SvcState;'),
    ('var SVC1067_DATA=', '/* Author: Andrew Fisher. Deliberate edit-only tracker publication;'),
    ('var SVC1099_MAP_DATA=', '/* Author: Andrew Fisher. Saved servicing progress'),
]:
    assert between(base, start, end) == between(out, start, end), start
    checks += 1
writer_bounds = ('function write(pos, patch, what){', '/* --------------------------------------------------------------------------------------------------------- the tab */')
writer = between(out, *writer_bounds)
assert writer.count(NATIVE_STATUS_GUARD) == 1
assert writer.count(NATIVE_STATUS_FALLBACK) == 1
assert writer.replace('\n' + NATIVE_STATUS_GUARD, '').replace(NATIVE_STATUS_FALLBACK, '') == between(base, *writer_bounds)
checks += 3
expected_writer = between(base, *writer_bounds).replace(
    ' if (!board(pos)) return false;',
    ' if (!board(pos)) return false;\n' + NATIVE_STATUS_GUARD,
).replace(
    'W.VMSArrival1098.recordFor(board(pos).board || board(pos).default_board));',
    'W.VMSArrival1098.recordFor(board(pos).board || board(pos).default_board)' + NATIVE_STATUS_FALLBACK + ');',
)
assert writer == expected_writer, 'reviewed writer deltas must remain at their exact call sites'
checks += 1
completion_bounds = ('function setComplete(pos,done){', 'const api={dayOf,evidence')
completion_normalized = between(out, *completion_bounds).replace(
    "\nconst b=root.VMS1024?.board(pos);if(!b||b.canonicalIdentityConflict1103||typeof done!=='boolean'||!(b.board||b.default_board))return false;",
    "\n const b=root.VMS1024?.board(pos);if(!b||typeof done!=='boolean'||!(b.board||b.default_board))return false;",
)
assert completion_normalized == between(base, *completion_bounds)
checks += 1
for old, new in [
    ('function prepare(patch,who,now,old,shared){', 'function prepare(patch,who,now,old,shared,confirmedStatus){'),
    ('if(done&&(!arriving?.on||!arriving.installed))return null;', 'if(done&&!(arriving?arriving.on&&arriving.installed:confirmedStatus?.on===true&&confirmedStatus.installed===true))return null;'),
    ("if(own(p,'complete1101')||closing&&prior?.done){", "if(own(p,'complete1101')||closing&&(prior?prior.done:confirmedStatus?.done===true)){"),
    ('finished=here&&(saved?saved.done:!!r.done),', 'finished=here&&(e?.inPlace===false?false:saved?saved.done:!!r.done),'),
    ('installed=here&&(e?.inPlace===false?false:finished||!!(e&&e.installed));', 'installed=here&&(e?.inPlace===false?false:finished||!!(e&&e.installed)||!e&&!!r.done);'),
]:
    assert base.count(old) == 1 and out.count(new) == 1
    checks += 1
# The writer calls prepare(), so protect its entire validation/history builder,
# not only the presence of the approved fallback expression. rep() consumes the
# approved conditional's two leading spaces; restore only that exact line here.
prepare_base = between(base, 'function prepare(patch,who,now,old,shared){',
                       '/* Input rows are physical register boards.')
prepare_out = between(out, 'function prepare(patch,who,now,old,shared,confirmedStatus){',
                      '/* Input rows are physical register boards.')
prepare_normalized = prepare_out.replace(
    'function prepare(patch,who,now,old,shared,confirmedStatus){',
    'function prepare(patch,who,now,old,shared){',
).replace(
    "if(own(p,'complete1101')||closing&&(prior?prior.done:confirmedStatus?.done===true)){",
    "if(own(p,'complete1101')||closing&&prior?.done){",
).replace(
    '\nif(done&&!(arriving?arriving.on&&arriving.installed:confirmedStatus?.on===true&&confirmedStatus.installed===true))return null;',
    '\n  if(done&&(!arriving?.on||!arriving.installed))return null;',
)
assert prepare_normalized == prepare_base, 'unreviewed native preparation or history change'
checks += 1
project_bounds = ('function project(input,day,soon){', 'function recordFor(key){')
project_normalized = between(out, *project_bounds).replace(
    'finished=here&&(e?.inPlace===false?false:saved?saved.done:!!r.done),',
    'finished=here&&(saved?saved.done:!!r.done),',
).replace(
    'installed=here&&(e?.inPlace===false?false:finished||!!(e&&e.installed)||!e&&!!r.done);',
    'installed=here&&(e?.inPlace===false?false:finished||!!(e&&e.installed));',
)
assert project_normalized == between(base, *project_bounds), 'unreviewed native physical-board projection change'
checks += 1
assert out.count("function boardName1103(b){const key=b.board||b.default_board||'';const physical=typeof vms913Boards==='function'?vms913Boards().find(row=>row.key===key):null;return physical?.name||key;}") == 1
assert out.count("${esc(boardName1103(b) || '—')}${id.co ? ' · ' + esc(id.co) : ''}") == 1
assert out.count("${esc(boardName1103(b) || '')}${id.co ? ' · ' + esc(id.co) : ''}") == 1
checks += 3
assert len(re.findall(r'<script\b', out)) == len(re.findall(r'<script\b', base))
checks += 1
assert "+' · v11.03'; /* v8.19 release922" in out
checks += 1
assert 'As at the last update of this page: <b>${cs.items_recorded_as_supplied' not in out
checks += 1
print(f'{checks} patch and protected-source checks passed')
