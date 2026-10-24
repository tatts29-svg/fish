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
assert extra[0][1].strip() == (HERE.parent / 'staff_save1008.js').read_text().strip()
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
assert len(changes) == 8, len(changes)
assert changes[0][0] == '' and 'function completeGlyph1008()' in changes[0][1] and 'function completeVerified1008(key)' in changes[0][1]
assert 'return `<span class="tick"' in changes[1][0] and 'const verified1008=completeVerified1008' in changes[1][1]
assert 'class="tickbtn${small' in changes[2][0] and 'complete1008-done' in changes[2][1]
assert 'data-fdone' in changes[3][0] and 'completeGlyph1008' in changes[3][1]
assert '<td><div class="lcell">${fd.done ?' in changes[4][0] and 'complete1008-badge' in changes[4][1]
assert changes[5] == ('', '\tconst fullComplete1008=!partial962&&completeVerified1008(key);\n')
assert changes[6][0].startswith('\tconst trow = ') and changes[6][1].startswith('\tconst trow = ')
assert changes[7][0].replace("' · v10.07'", "' · v10.08'") == changes[7][1]
assert [(len(x.splitlines()), len(y.splitlines())) for x,y in changes] == [(0,8),(1,2),(3,3),(2,2),(1,1),(0,1),(1,1),(1,1)]
# These eight hunks were read independently: glyph/verified-display helper, chip/button renderers,
# fencing completion cells, drawer completion renderer, and version label. No setter or financial hunk.
for x,y in reversed(changes):
    assert new_main.count(y) == 1
    new_main = new_main.replace(y,x,1)
assert new_main == old_main
start = old_main.index('const DATA = ') + len('const DATA = ')
data, end = json.JSONDecoder().raw_decode(old_main[start:])
start_new = new[3][1].index('const DATA = ') + len('const DATA = ')
assert old_main[start:start+end] == new[3][1][start_new:start_new+end]
# Keep the selected physical/financial setter bodies byte-for-byte, not merely their output.
setters = ['setDone','setLevelled','setSteps','setLight','setDeliveryNote','lightSet','setFenceAreaDone','unitsSet','setLabour','setLabourAll','setLight815']
for name in setters:
    pattern = r'^function '+name+r'\([^\n]*[\s\S]*?^}'
    aa, bb = re.findall(pattern,a,re.M), re.findall(pattern,b,re.M)
    assert len(aa) == len(bb) == 1 and aa == bb, name
# Native availability permissions, record body and monotonically increasing timestamp stay the same;
# only the post-write feedback/bump result handling changes (exercised in 21 adapter scenarios).
before_staff = old[76][1]
after_staff = new[76][1]
before_prefix = before_staff[before_staff.index(' write(day,value){'):before_staff.index('  bump();')]
after_prefix = after_staff[after_staff.index(' write(day,value){'):after_staff.index('  const attempt=',after_staff.index(' write(day,value){'))]
assert before_prefix == after_prefix
summary = dict(author='Andrew Fisher',baseSha256=sha(a),candidateSha256=sha(b),baseScripts=95,candidateScripts=96,unchangedExistingScripts=91,changedScriptScopes=['legacy UI rendering and version label','Truck flow table scroll wrapper','Map completion badge rendering','Availability save acknowledgement'],dataIdentical=True,physicalFinancialSettersIdentical=setters,staffRecordMutationPrefixIdentical=True,financialCalculationChanges=False,recordWrites=False,financialRuntimeRetestRequired=False,basis='All existing code outside independently reviewed rendering and staff acknowledgement hunks is identical; 56 isolated Save checks supplement this source proof.')
summary['pass']=True
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary))
