"""Author: Andrew Fisher. Exact-source guards for v10.19: refuses a wrong base and a repeat, applies once, every anchor
found exactly once, the footer moves to v10.19 and the untouched writers stay byte for byte.

    python3 tests/test_patch1019.py /path/to/live_v10.18.html
"""
import hashlib
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from patch_v1019 import apply, BASE_SHA, INSERT_BEFORE, REPLACEMENTS, SOURCE

source = Path(sys.argv[1]).read_text()
checks = []


def ck(name, ok):
    assert ok, name
    checks.append(name)


ck('input is the exact live v10.18 page', hashlib.sha256(source.encode()).hexdigest() == BASE_SHA)
# every anchor is in the source exactly once (plain text; rep() is whitespace-tolerant, so this is the stricter test)
ck('source anchor found once', source.count(INSERT_BEFORE) == 1)
for label, old, new in REPLACEMENTS:
    ck(label + ': anchor found once', source.count(old) == 1)
    ck(label + ': replacement not already there', new not in source)

patched = apply(source)
ck('source inserted once', all(patched.count('function ' + f + '(') == 1 for f in ['personWords1019', 'poParseMoney1019', 'poCheckedBlock1019', 'poCheckButton1019']))
ck('actions column (Save / Confirm) untouched', source.count("""<td><div class="acts"><button class="btn" data-po-save="${esc(o.number)}">${o.confirmed || !o.period ? 'Save' : 'Confirm'}</button></div></td>""") == 1 and patched.count("""<td><div class="acts"><button class="btn" data-po-save="${esc(o.number)}">${o.confirmed || !o.period ? 'Save' : 'Confirm'}</button></div></td>""") == 1)
ck('source inserted immediately above the v10.14 label function', patched.index('function personWords1019(') < patched.index(INSERT_BEFORE))
ck('source first line carries the author', patched.count(SOURCE.read_text().split('\n')[0]) == 1)
for label, old, new in REPLACEMENTS:
    ck(label + ': applied once', patched.count(new) == 1)
ck('footer says v10.19', "+ ' · v10.19'" in patched and "+ ' · v10.18'" not in patched)
ck('Finance handover P/O row untouched (shows no person)', re.search(r'const poRow = o => `<tr data-fh866-row="\$\{esc\(o\.number\)\}">\n<td><b class="mono">\$\{poLabel1014\(o\.number\)\}</b>\$\{poSupplierBlock1014\(o\.number\)\}<br>', patched) is not None)

for label, value in [('repeat application', patched), ('changed live source', source + '\n')]:
    try:
        apply(value)
        raise AssertionError(label + ' was not refused')
    except ValueError:
        checks.append(label + ' refused')

# The native writer, the record layering (bar the one new field name) and the supplier reconciliation stay as they were.
def section(s, start, end):
    i = s.index(start)
    return s[i:s.index(end, i)]


ck('setPo unchanged', section(source, 'function setPo(no, patch){', '/* Everything a branch carries') == section(patched, 'function setPo(no, patch){', '/* Everything a branch carries'))
# rep() takes a line's leading space with the match (as in every earlier release), so compare with whitespace folded
fold = lambda s: ' '.join(s.split())
ck('poAll changed only by the checked field', fold(section(source, 'function poAll(){', 'function poOf(no)').replace("'supplier_pricing']", "'supplier_pricing', 'checked']")) == fold(section(patched, 'function poAll(){', 'function poOf(no)')))
ck('poSupplierBlock1014 unchanged', section(source, 'function poSupplierBlock1014(number){', 'if(typeof sharedCache975') == section(patched, 'function poSupplierBlock1014(number){', 'if(typeof sharedCache975'))
ck('Finance amount editor unchanged', re.findall(r'<input[^>]*data-fh866="amount"[^>]*>', source) == re.findall(r'<input[^>]*data-fh866="amount"[^>]*>', patched))
ck('only one P/O value editor and it is a text field', len(re.findall(r'<input[^>]*data-po-amt=[^>]*>', patched)) == 1 and 'type="text" inputmode="decimal"' in re.findall(r'<input[^>]*data-po-amt=[^>]*>', patched)[0])
ck('no AI model names in the page source', not re.search(r'\b(Codex|Claude|Argon|Gemini)\b', SOURCE.read_text()))

print(json.dumps({'author': 'Andrew Fisher', 'pass': True, 'checks': len(checks), 'names': checks, 'sourceSha256': hashlib.sha256(source.encode()).hexdigest(), 'candidateSha256': hashlib.sha256(patched.encode()).hexdigest(), 'candidateBytes': len(patched.encode())}))
