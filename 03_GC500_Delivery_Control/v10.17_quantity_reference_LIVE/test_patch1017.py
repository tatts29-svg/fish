"""Author: Andrew Fisher. Exact source, preserved evidence and repeated-build guards."""
from pathlib import Path
import hashlib
import re
import sys
import patch_v1017 as patch

base = Path(sys.argv[1]).read_text()
out = patch.apply(base)
checks = {}
checks['exact base'] = hashlib.sha256(base.encode()).hexdigest() == patch.BASE_SHA
checks['one new release footer'] = out.count("+ ' · v10.17'") == 1 and "+ ' · v10.16'" not in out

def embedded_source(text):
    return re.search(r'const DATA = (\{.*?\});\r?\n', text, re.S).group(1)

checks['embedded source data preserved'] = embedded_source(out) == embedded_source(base)
for label, changed in [('repeat', out), ('changed source', base + '\n')]:
    try:
        patch.apply(changed)
    except ValueError:
        checks[label + ' refused'] = True
    else:
        checks[label + ' refused'] = False
for folder, part in patch.PARTS:
    checks[part + ' source exists'] = (patch.HERE / folder / ('patch_' + part + '1017.py')).is_file()
assert all(checks.values()), checks
print({'author': 'Andrew Fisher', 'pass': True, 'checks': len(checks)})
