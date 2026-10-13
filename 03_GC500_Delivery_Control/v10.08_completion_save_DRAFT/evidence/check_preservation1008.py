"""Author: Andrew Fisher. Independently bound v10.08 changes to rendering/save feedback only."""
import difflib, hashlib, json, os, re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
base = Path(os.environ.get('BASE', ROOT / 'build/GC500_v10.07/GC500_Delivery_Control_hosted.html'))
page = Path(os.environ.get('PAGE', ROOT / 'build/GC500_v10.08/GC500_Delivery_Control_hosted.html'))
out = Path(os.environ.get('OUT', HERE / 'source-preservation.json'))
a, b = base.read_text(), page.read_text()
sha = lambda s: hashlib.sha256(s.encode()).hexdigest()
blocks = lambda s: re.findall(r'(<script\b[^>]*>)(.*?)</script\s*>', s, re.S | re.I)
old, new = blocks(a), blocks(b)
extra = [x for x in new if 'staff-save1008-script' in x[0]]
assert len(extra) == 1
new = [x for x in new if 'staff-save1008-script' not in x[0]]
assert len(old) == len(new) == 95
assert [x[0] for x in old] == [x[0] for x in new]
changed = [i for i in range(95) if old[i] != new[i]]
assert changed == [3, 18, 21, 76], changed
# Existing financial, quantity, roster and native setter scripts must remain exact.
# The large legacy script also holds UI code. Whitelist only the independently reviewed presentation hunks.
old_main, new_main = old[3][1], new[3][1]
changes = []
for tag, i, j, k, l in difflib.SequenceMatcher(None, old_main.splitlines(True), new_main.splitlines(True), autojunk=False).get_opcodes():
    if tag != 'equal':
        changes.append((''.join(old_main.splitlines(True)[i:j]), ''.join(new_main.splitlines(True)[k:l])))
assert len(changes) == 7, len(changes)
assert changes[0][0] == '' and 'function completeGlyph1008()' in changes[0][1] and 'function completeVerified1008(key)' in changes[0][1]
assert 'return `<span class="tick"' in changes[1][0] and 'const verified1008=completeVerified1008' in changes[1][1]
assert 'class="tickbtn${small' in changes[2][0] and 'complete1008-done' in changes[2][1]
assert 'data-fdone' in changes[3][0] and 'completeGlyph1008' in changes[3][1]
assert '<td><div class="lcell">${fd.done ?' in changes[4][0] and 'complete1008-badge' in changes[4][1]
# SequenceMatcher groups the inserted drawer check and changed drawer renderer separately in some Python versions.
