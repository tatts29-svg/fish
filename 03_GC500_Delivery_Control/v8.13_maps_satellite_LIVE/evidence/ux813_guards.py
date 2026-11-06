"""Author: Andrew Fisher. Component source guards, no service access."""
from pathlib import Path
import hashlib, importlib.util, json, sys
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('ux813', ROOT / 'patch_ux813.py')
patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)
base, merge, output = map(Path, sys.argv[1:])
checks = []
def rejects(label, fn):
    try:
        fn()
    except SystemExit:
        checks.append({'id': label, 'pass': True})
        return
    raise AssertionError(label)
original, original_merge = base.read_text(), merge.read_text()
applied, applied_merge = patch.apply(original, 'explorer.js'), patch.apply(original_merge, 'explorer-merge.js')
rejects('duplicate explorer application', lambda: patch.apply(applied, 'explorer.js'))
rejects('duplicate merge application', lambda: patch.apply(applied_merge, 'explorer-merge.js'))
rejects('wrong explorer base', lambda: patch.apply('not the explorer', 'explorer.js'))
rejects('wrong merge base', lambda: patch.apply('not the merge source', 'explorer-merge.js'))
rejects('unowned file', lambda: patch.apply(original, 'index.html'))
rejects('changed source anchor', lambda: patch.apply(original.replace('function setAttrib() {', 'function setAttrib(){'), 'explorer.js'))
rejects('ambiguous source anchor', lambda: patch.apply(original + '\nfunction setAttrib() {}', 'explorer.js'))
sha=lambda s: hashlib.sha256(s.encode()).hexdigest()
output.write_text(json.dumps({'author':'Andrew Fisher','source':{'base':sha(original),'merge_base':sha(original_merge),'explorer':sha(applied),'merge':sha(applied_merge),'patch':sha((ROOT/'patch_ux813.py').read_text())},'checks':checks,'passed':len(checks)},indent=2)+'\n')
print(f'{len(checks)}/{len(checks)} UX source guards passed')
