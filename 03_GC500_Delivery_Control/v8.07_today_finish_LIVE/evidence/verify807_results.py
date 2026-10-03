#!/usr/bin/env python3
"""Author: Andrew Fisher. Summarise exact-candidate read-only release checks."""
from pathlib import Path
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGE = Path(sys.argv[1])
BASE = Path(sys.argv[2])
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
candidate = sha(PAGE)
evidence = ROOT / 'evidence'
checks, suites = [], {}
def ck(name, condition): checks.append({'name': name, 'pass': bool(condition)})
for name, key in [('source807_checks', 'checks'), ('focus807_desktop', 'results'),
                  ('focus807_phone', 'results'), ('integration807_browser', 'checks')]:
    report = json.loads((evidence / (name + '.json')).read_text())
    results = report[key]
    ck(name + ' is bound to final candidate and fresh base', report['candidateSha256'] == candidate and report['baseSha256'] == sha(BASE))
    ck(name + ' passes every assertion', bool(results) and all(r['pass'] for r in results))
    suites[name] = {'passed': sum(r['pass'] for r in results), 'total': len(results),
                    'reportSha256': sha(evidence / (name + '.json'))}
for device in ['desktop', 'phone']:
    file = evidence / ('sweep807_' + device + '.json')
    report = json.loads(file.read_text())
    ck(device + ' sweep covers all 21 tabs and seven links', len(report['tabs']) == 21 and len(report['hashes']) == 7)
    ck(device + ' sweep has no page, console or navigation errors', not report['allErrors'] and not report['cons'] and not any(v['goerr'] for v in report['tabs'].values()))
    suites['sweep_' + device] = {'tabs': len(report['tabs']), 'links': len(report['hashes']), 'pageErrors': len(report['allErrors']), 'consoleErrors': len(report['cons']), 'reportSha256': sha(file)}
    capture = json.loads((evidence / ('by_group807_' + device + '.json')).read_text())
    ck(device + ' final sweep and body captures are hash-bound with no errors or write attempts', capture['candidateSha256'] == candidate and not capture['errors'] and capture['requests']['blocked'] == 0)
    ck(device + ' changed-body images still match their capture hashes', all(sha(x['path']) == x['sha256'] for x in capture['screenshots']))
for name in ['independent807_source_review', 'navigation807_summary']:
    report = json.loads((evidence / (name + '.json')).read_text())
    ck(name + ' passes on the final candidate', report['candidateSha256'] == candidate and report['passed'] == report['total'] and report['total'] > 0)
    suites[name] = {'passed': report['passed'], 'total': report['total'], 'reportSha256': sha(evidence / (name + '.json'))}
standing = json.loads((evidence / 'standing807_browser.json').read_text())
ck('Standing browser suites are bound to the final candidate and fresh base', standing['candidateSha256'] == candidate and standing['baseSha256'] == sha(BASE))
ck('All six required standing browser runs pass', len(standing['runs']) == 6 and all(r['pass'] for r in standing['runs']))
suites['standing_browser'] = {r['name']: {'passed': r['passed'], 'total': r['total']} for r in standing['runs']}
report = {'author': 'Andrew Fisher', 'baseSha256': sha(BASE), 'candidateSha256': candidate,
          'candidateBytes': PAGE.stat().st_size, 'suites': suites, 'checks': checks,
          'passed': sum(c['pass'] for c in checks), 'total': len(checks),
          'publication': 'Not performed by these tests; parent release owner decides after independent review.'}
(evidence / 'verification807.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
raise SystemExit(0 if all(c['pass'] for c in checks) else 1)
