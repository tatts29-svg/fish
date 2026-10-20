#!/usr/bin/env python3
"""Author: Andrew Fisher. Verify the composed release preserves source data and unrelated controls."""
import hashlib, json, pathlib, re, sys
base, candidate = [pathlib.Path(x).read_text(encoding='utf-8') for x in sys.argv[1:3]]
checks = []
def same(label, pattern):
    a, b = re.search(pattern, base, re.S), re.search(pattern, candidate, re.S)
    assert a and b and a.group(0) == b.group(0), label
    checks.append(label)
for name, opener, closer in [('DATA', r'\{', r'\}'), ('MASTER_LOC', r'\{', r'\}'), ('MASTER_LAYERS', r'\[', r'\]')]:
    same(name + ' byte identity', 'const ' + name + ' = (' + opener + '.*?' + closer + r');\n')
for name in ('staff910-script', 'drops911-script', 'flow891-script', 'today907-script', 'timeline908-script', 'scene896-script', 'map897-script'):
    same(name + ' byte identity', r'<script id="' + name + r'">.*?</script>')
for marker in ('BC.player918', 'showStability918', 'photoTrack920'):
    assert candidate.count(marker) == base.count(marker) > 0, marker
    checks.append(marker + ' retained')
assert " · v9.21'" in base and " · v9.22'" in candidate
assert 'release922' in candidate and 'function fire914Of(' in candidate and 'function vms913Mount(' in candidate and 'flow909-script' in candidate
checks.append('all approved parts and release footer present')
print(json.dumps({'author': 'Andrew Fisher', 'base': hashlib.sha256(base.encode()).hexdigest(), 'candidate': hashlib.sha256(candidate.encode()).hexdigest(), 'passed': len(checks), 'checks': checks}, indent=2))
