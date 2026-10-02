#!/usr/bin/env python3
"""Author: Andrew Fisher. Require complete evidence for the exact release bytes."""
import hashlib
import json
from pathlib import Path
import sys

here = Path(__file__).resolve().parent
page = Path(sys.argv[1])
sha = hashlib.sha256(page.read_bytes()).hexdigest()
preview = page.with_name('full_lap_preview.html')
preview_sha = hashlib.sha256(preview.read_bytes()).hexdigest()
read = lambda name: json.loads((here / name).read_text())
full = read('full-lap-checks.json')
assert full['complete'] and not full['errors'] and not full['externalRequests']
assert all(c['pass'] for c in full['checks'])
assert full['files']['page']['sha256'] == sha
assert full['files']['preview']['sha256'] == preview_sha
integrated = read('full-page-checks.json')
assert integrated['complete'] and not integrated['errors'] and not integrated['blockedWrites']
assert integrated['candidate'] == sha and all(c['pass'] for c in integrated['checks'])
smooth = read('smoothness_browser792.json')
assert smooth['complete'] and not smooth['errors']
assert all(c['pass'] for c in smooth['checks'])
assert smooth['files']['hosted']['sha256'] == sha
assert smooth['files']['candidate']['sha256'] == preview_sha
protected = read('protected_source_checks.json')
assert protected['pass'] and protected['candidate']['sha256'] == sha
for device in ['desktop', 'phone']:
    sweep = read('sweep_' + device + '.json')
    assert len(sweep['tabs']) == 21 and len(sweep['hashes']) == 7
    assert not sweep['allErrors'] and not sweep['cons']
    read_only_hidden = {'register', 'journal', 'breakdowns', 'variances', 'edit', 'add'}
    assert all(not t['goerr'] and (t['shown'] or name in read_only_hidden)
               for name, t in sweep['tabs'].items())
print(json.dumps({'author': 'Andrew Fisher', 'pass': True, 'pageSha256': sha,
                  'previewSha256': preview_sha,
                  'fullLapChecks': len(full['checks']),
                  'integrationChecks': len(integrated['checks']),
                  'smoothnessChecks': len(smooth['checks']),
                  'sweeps': '21 tabs and 7 links on both devices; zero errors'}))
