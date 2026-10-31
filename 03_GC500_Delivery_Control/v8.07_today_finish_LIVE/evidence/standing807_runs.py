#!/usr/bin/env python3
"""Author: Andrew Fisher. Run required inherited browser suites sequentially and read-only."""
from pathlib import Path
import hashlib
import json
import os
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT.parent
PAGE, BASE = map(lambda p: Path(p).resolve(), sys.argv[1:3])
OUT = Path('/workspace/private-v807-final-35024d43/standing')
OUT.mkdir(parents=True, exist_ok=True)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
report = {'author': 'Andrew Fisher', 'candidateSha256': sha(PAGE), 'baseSha256': sha(BASE),
          'method': 'Unchanged source-owner suites, sequential browsers. View-link harness blocks service writes; simulated saves remain in the test page.', 'runs': []}
specs = [
    ('packed_desktop', 'v7.95_today_packed_DRAFT/evidence/packed_tests.js', False),
    ('packed_phone', 'v7.95_today_packed_DRAFT/evidence/packed_tests.js', True),
    ('equipment_desktop', 'v7.96_equipment_tab_LIVE/evidence/equipment_tests.js', False),
    ('equipment_phone', 'v7.96_equipment_tab_LIVE/evidence/equipment_tests.js', True),
    ('rules', 'v7.84_ways_in_from_andrew_LIVE/evidence/rules_tests.js', False),
    ('fresh_after_save', 'v7.75_fresh_after_a_save_LIVE/evidence/fresh_after_save_tests.js', False),
]
for name, source, mobile in specs:
    result, log = OUT / (name + '.json'), OUT / (name + '.log')
    env = dict(os.environ, PAGE=str(PAGE), BASE=str(BASE), CHROMIUM_PATH='/usr/bin/chromium',
               OUT=str(result), GC500807_RESULT=str(result))
    env.pop('MOB', None)
    if mobile: env['MOB'] = '1'
    cmd = ['node', '--require', str(ROOT / 'evidence/standing807_output.cjs'), str(PROJECT / source)]
    with log.open('w') as stream:
        run = subprocess.run(cmd, cwd=PROJECT, env=env, stdout=stream, stderr=subprocess.STDOUT)
    raw = json.loads(result.read_text()) if result.exists() else {}
    tests = raw if isinstance(raw, list) else raw.get('tests', [])
    errors = [] if isinstance(raw, list) else raw.get('errors', [])
    passed = sum(bool(c.get('pass')) for c in tests)
    item = {'name': name, 'source': source, 'sourceSha256': sha(PROJECT / source),
            'exitCode': run.returncode, 'passed': passed, 'total': len(tests),
            'pass': run.returncode == 0 and bool(tests) and passed == len(tests) and not errors,
            'pageErrors': errors, 'privateRawReport': str(result), 'privateLog': str(log),
            'reportSha256': sha(result) if result.exists() else None,
            'checks': [{k: c[k] for k in ['name', 'pass'] if k in c} for c in tests]}
    report['runs'].append(item)
    (ROOT / 'evidence/standing807_browser.json').write_text(json.dumps(report, indent=2) + '\n')
    print(name, str(passed) + '/' + str(len(tests)), 'PASS' if item['pass'] else 'FAIL', flush=True)
    if not item['pass']: raise SystemExit(1)
print('All required browser suites pass; navigation CPU proof is recorded separately.', flush=True)
