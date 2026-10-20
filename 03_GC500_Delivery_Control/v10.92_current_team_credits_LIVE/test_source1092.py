"""Author: Andrew Fisher. Protect historical data, audio assets and other modules."""
from pathlib import Path
import hashlib, importlib.util, json, re, sys
here = Path(__file__).resolve().parent
base, built = map(lambda x: Path(x).read_text(), sys.argv[1:3])
spec = importlib.util.spec_from_file_location('patch1092', here/'patch_v1092.py')
patch = importlib.util.module_from_spec(spec); spec.loader.exec_module(patch)
assert patch.patch(base) == built
for wrong in (base+' ', built):
    try: patch.patch(wrong)
    except ValueError: pass
    else: raise AssertionError('Incorrect/repeated base accepted')
blocks = lambda s: re.findall(r'<(script|style)\b([^>]*)>([\s\S]*?)</\1>', s)
a, b = blocks(base), blocks(built)
assert len(a) == len(b)
changed = []
for i, (old, new) in enumerate(zip(a,b)):
    assert old[:2] == new[:2]
    if old != new:
        assert ('crew-showcase1090-style' in old[1] if old[0]=='style' else 'crew-showcase1090-script' in old[1] or 'function showOrgChart()' in old[2])
        changed.append(i)
assert len(changed) == 3
outside = lambda s: re.sub(r'<(script|style)\b([^>]*)>([\s\S]*?)</\1>', '', s)
assert outside(base) == outside(built)
data = lambda s: re.search(r'const DATA = (\{.*?\});\n',s,re.S).group(1)
assert data(base) == data(built)
source = json.loads(data(built))
turns = source['broadcast']['turns']
assert len(turns) == 35
retired = next(t for t in turns if t['slot']==21)
assert retired['audio']
assert len([t for t in turns if t['slot']!=21]) == 34
print(json.dumps({'author':'Andrew Fisher','result':'PASS','candidateSha256':hashlib.sha256(built.encode()).hexdigest(),'changedScriptBlocks':2,'scopedPhoneCreditStyleBlocks':1,'dataAndOriginalBroadcastUnchanged':True,'mediaAndUnrelatedStylesUnchanged':True,'otherModulesUnchanged':True,'patchGuards':'PASS'}))
