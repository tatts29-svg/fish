"""Author: Andrew Fisher. Exact-source guards and unchanged money/receipt logic."""
import hashlib
import json
import re
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from patch_v1014 import apply_display as apply, REPLACEMENTS
source = Path(sys.argv[1]).read_text()
patched = apply(source)
checks = []
def ck(name, ok):
    assert ok, name
    checks.append(name)
for label, old, new in REPLACEMENTS:
    ck(label, new in patched)
for label, value in [('repeat patch', patched), ('changed live source', source + '\n')]:
    try:
        apply(value)
        raise AssertionError(label)
    except ValueError:
        checks.append(label + ' refused')
# Presentation-only replacements must leave the native writer, calculations and numeric input values alone.
for start, end in [
    ('function setPo(no, patch){', '/* Everything a branch carries'),
    ('function poAll(){', 'function poOf(no)'),
    ('function fh866Model(){', 'function fh866Html(){'),
    ('function poReceiptIssue982(o){', '/* split a total across branches'),
    ('function fencePaidSplit(){', "/* the Fencing tab's card"),
]:
    def section(s): return s[s.index(start):s.index(end, s.index(start))]
    ck(start + ' unchanged', section(source) == section(patched))
for field in ['data-po-amt=', 'data-fh866="amount"']:
    pattern = r'<input[^>]*' + re.escape(field) + r'[^>]*>'
    ck(field + ' editors unchanged', re.findall(pattern, source) == re.findall(pattern, patched))
print(json.dumps({'author':'Andrew Fisher','pass':True,'checks':checks,'sourceSha256':hashlib.sha256(source.encode()).hexdigest(),'candidateSha256':hashlib.sha256(patched.encode()).hexdigest()}))
