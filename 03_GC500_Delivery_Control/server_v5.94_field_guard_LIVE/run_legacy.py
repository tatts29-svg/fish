#!/usr/bin/env python3
"""Author: Andrew Fisher. Run the retained suites on server v5.94, in disposable local folders (127.0.0.1 only).

1. The five original v5.90 HTTP suites (tracker, tracker590, delivery, mms_sender, mms), exactly as v5.93's
   run_legacy.py ran them: original fixture, original assertions, the v5.87 rollback file for test_tracker's checks
   73-76. Only build-label literals are adapted: 'v5.90' becomes 'v5.94' (plain and regex forms), and test_tracker
   check 64's banner pattern also expects the new v5.94 line in front of the v5.93 one.
2. v5.93's own focused suite (test_declarations.cjs, 50 checks) against v5.94, in a temporary copy of the repo layout
   it expects (fake_clock.js and the v5.92 rollback file beside it). Only its first check's build label changes.

Every test process gets an explicit environment (PATH, TMPDIR, GC500_ROLLBACK_SERVER) and nothing else from the caller.
    python3 run_legacy.py            (optionally name some of the suites to run only those)
"""
from pathlib import Path
import hashlib, json, os, subprocess, tempfile, sys
HERE = Path(__file__).resolve().parent
CTRL = HERE.parent
OLD = CTRL / 'server_v5.90_servicing_tracker_DRAFT'
V593 = CTRL / 'server_v5.93_lock_declaration_LIVE'
ROLLBACK = os.environ.get('GC500_ROLLBACK_SERVER') or str(CTRL / 'server_v5.87_pictures_from_shared_number_LIVE' / 'server.js')
assert Path(ROLLBACK).is_file(), 'the v5.87 rollback server is needed for test_tracker checks 73-76'
root = Path(tempfile.mkdtemp(prefix='gc500-legacy594-')); suite = root / 'suite'; suite.mkdir()
fixture = root / 'servicing_tracker_DRAFT'; fixture.mkdir()
# The original HTTP contract suites require their original fixture, not the current event roster.
fixture.joinpath('tracker_data.json').write_bytes(subprocess.check_output(['git', 'show', '4b106c0138e3d5706d58f274f8b966df3757db67:03_GC500_Delivery_Control/servicing_tracker_DRAFT/tracker_data.json'], cwd=HERE))
server = (HERE / 'server.js').read_bytes()
(suite / 'server.js').write_bytes(server)
(suite / 'fake_clock.js').write_bytes((OLD / 'fake_clock.js').read_bytes())
(suite / 'tracker_sw.js').write_bytes((OLD / 'tracker_sw.js').read_bytes())
# v5.93's focused suite, in the layout it resolves: <root>/focused593/{server.js,test}, ../server_v5.90_…/fake_clock.js, ../server_v5.92_…/server.js
focused = root / 'focused593'; focused.mkdir()
(focused / 'server.js').write_bytes(server)
(root / 'server_v5.90_servicing_tracker_DRAFT').mkdir(); (root / 'server_v5.90_servicing_tracker_DRAFT' / 'fake_clock.js').write_bytes((OLD / 'fake_clock.js').read_bytes())
(root / 'server_v5.92_crew_groups_LIVE').mkdir(); (root / 'server_v5.92_crew_groups_LIVE' / 'server.js').write_bytes((CTRL / 'server_v5.92_crew_groups_LIVE' / 'server.js').read_bytes())

BANNER_OLD = r'/server v5\.94 — THE SERVICING TRACKER/'
BANNER_NEW = r'/server v5\.94 — THE DELIVERY FIELD GUARD \(.*\) \+ v5\.93 — THE SERVICING TRACKER/'


def adapt(name, source):
    if name == 'test_declarations.cjs':
        assert source.count("health.build==='v5.93'") == 1
        return source.replace("health.build==='v5.93'", "health.build==='v5.94'"), focused
    out = source.replace('v5.90', 'v5.94').replace(r'v5\.90', r'v5\.94')
    if name == 'test_tracker.js':
        assert out.count(BANNER_OLD) == 1, 'check 64 banner pattern not found once'
        out = out.replace(BANNER_OLD, BANNER_NEW)
    return out, suite


checks = ['test_tracker.js', 'test_tracker590.js', 'test_delivery_v586_on_v590.js', 'test_mms_sender_v587_on_v590.js', 'test_mms_v585_on_v590.js', 'test_declarations.cjs']
if len(sys.argv) > 1:
    selected = sys.argv[1:]; assert set(selected) <= set(checks); checks = selected
env = {'PATH': os.environ.get('PATH', '/usr/bin:/bin'), 'TMPDIR': os.environ.get('TMPDIR', tempfile.gettempdir()), 'GC500_ROLLBACK_SERVER': ROLLBACK}
results = []
for name in checks:
    source = ((V593 if name == 'test_declarations.cjs' else OLD) / name).read_text()
    adapted, where = adapt(name, source)
    (where / name).write_text(adapted)
    log = root / (name + '.log')
    with log.open('w') as f:
        run = subprocess.run(['node', str(where / name)], stdout=f, stderr=subprocess.STDOUT, timeout=300, env=env, cwd=str(where))
    lines = log.read_text().splitlines(); passed = sum(s.startswith('PASS ') for s in lines)
    entry = {'test': name, 'original_sha256': hashlib.sha256(source.encode()).hexdigest(), 'adapted_sha256': hashlib.sha256(adapted.encode()).hexdigest(), 'passed': passed, 'exit_code': run.returncode}
    results.append(entry); print(json.dumps(entry), flush=True)
    if run.returncode: print('\n'.join(lines[-15:])); raise SystemExit(run.returncode)
print(json.dumps({'author': 'Andrew Fisher', 'server_sha256': hashlib.sha256(server).hexdigest(), 'passed': sum(x['passed'] for x in results), 'failed': 0, 'local_only': True, 'suites': results}), flush=True)
