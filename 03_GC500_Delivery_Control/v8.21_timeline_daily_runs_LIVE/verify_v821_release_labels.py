#!/usr/bin/env python3
"""Author: Andrew Fisher. Prove the release wrapper changed only the two inert version labels."""
from pathlib import Path
import hashlib, json, re, sys

def digest(text): return hashlib.sha256(text.encode()).hexdigest()
if len(sys.argv) != 3:
    raise SystemExit('Usage: verify_v821_release_labels.py tested_before.html release_after.html')
before, after = [Path(p).read_text() for p in sys.argv[1:]]
expected = before
old = '<meta name="gc500-release" content="v8.19">'
assert expected.count(old) == 1, 'expected one base release marker'
expected = expected.replace(old, '<meta name="gc500-release" content="v8.21">')
matches = list(re.finditer(r"\$\('#footL'\)\.textContent\s*=\s*[^;\n]+\+ ' · v8\.19';", expected))
assert len(matches) == 1, 'expected one base footer label'
m = matches[0]
expected = expected[:m.start()] + m.group().replace(" + ' · v8.19';", " + ' · v8.21';") + expected[m.end():]
assert expected == after, 'release differs beyond the two version labels'
assert before.count('const DAILY821 =') == after.count('const DAILY821 =') == 1
assert before.count(':not(:where(.ep819 *))') == after.count(':not(:where(.ep819 *))') == 90
print(json.dumps({'author':'Andrew Fisher','pass':True,'before':digest(before),'after':digest(after),'only_changes':['meta gc500-release v8.19 → v8.21','existing footer final label v8.19 → v8.21'],'runtime_source_unchanged_except_inert_footer_label':True,'supplier_scoped_selectors':90},indent=2))
