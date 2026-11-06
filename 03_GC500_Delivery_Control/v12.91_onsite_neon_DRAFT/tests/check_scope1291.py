"""Author: Andrew Fisher. Verify an additive presentation change only."""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys

base, candidate = (Path(p).read_text() for p in sys.argv[1:3])
release = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('patch1291', release / 'patch_v1291.py')
patch = importlib.util.module_from_spec(spec);spec.loader.exec_module(patch)
assert patch.apply(base) == candidate
addition = '  stillOnSite1290();\n' + (release / 'neon1291_src.js').read_text() + '\n  onsiteNeon1291();'
assert candidate.count(addition) == 1
restored = candidate.replace(addition, '  stillOnSite1290();').replace("+' · v12.91';", "+' · v12.90';")
assert restored == base, 'Any change to existing code or content must be separately reviewed'
for text in [candidate, base+'\n']:
    try: patch.apply(text)
    except (ValueError, SystemExit): pass
    else: raise AssertionError('Patch accepted a wrong or already patched base')
print(json.dumps({'author':'Andrew Fisher','passed':True,'candidateSha256':hashlib.sha256(candidate.encode()).hexdigest(),'bytes':len(candidate.encode()),'scope':'one additive map presentation function and footer; all existing code/content unchanged','guards':2}))
