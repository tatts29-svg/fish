"""Author: Andrew Fisher. Independently constrain this release's source changes.

BASE and PAGE name private HTML files. The six reviewed integration changes below
are deliberately written independently of the production patch's replacement list.
No source records or monetary fixtures are copied into this test.
"""
import hashlib
import importlib.util
import os
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
BASE_SHA = '2db3457f12692ccd660de48b6c134d964827e27c3a4be976b482f12edbccc9b2'
base = Path(os.environ['BASE']).read_text(encoding='utf-8')
page = Path(os.environ['PAGE']).read_text(encoding='utf-8')
checks = 0


def check(label, ok):
    global checks
    assert ok, label
    checks += 1
    print('PASS ' + label)


check('exact reviewed live base', hashlib.sha256(base.encode()).hexdigest() == BASE_SHA)
pattern = r'<script id="vms-installation1228-script">\n([\s\S]*?)\n</script>\n'
matches = list(re.finditer(pattern, page))
check('one standalone projection script', len(matches) == 1)
check('embedded projection equals the reviewed source', matches[0].group(1) ==
      (HERE / 'vms_installation1228_src.js').read_text(encoding='utf-8').rstrip())
restored = re.sub(pattern, '', page, count=1)
changes = [
    ('labour revenue accumulator',
     ' const standalone1228=VmsInstallation1228.model();\n let labour = standalone1228.total, labourTicks = standalone1228.slots.length, labourUnknown = standalone1228.unknown, cardHire = 0, cardTransportCharge = 0, cardTransportCost = 0;',
     ' let labour = 0, labourTicks = 0, labourUnknown = 0, cardHire = 0, cardTransportCharge = 0, cardTransportCost = 0;'),
    ('installation branch totals',
     " VmsInstallation1228.model().slots.forEach(s=>add('install',s.branch,s.value));\n", ''),
    ('received work coverage', ' items.push(...VmsInstallation1228.coverageItems());\n', ''),
    ('shared labour slots', '  slots.push(...VmsInstallation1228.model().slots);\n', ''),
    ('pricing-review issue propagation',
     '.filter(Boolean)).concat(VmsInstallation1228.model().issues)', '.filter(Boolean))'),
    ('release footer', "+' · v12.28'; /* v8.19 release922", "+' · v12.27'; /* v8.19 release922"),
]
for label, changed, original in changes:
    check(label + ' occurs exactly once', restored.count(changed) == 1)
    restored = restored.replace(changed, original, 1)
check('all other source, data, media, record paths and markup preserved byte for byte', restored == base)

spec = importlib.util.spec_from_file_location('patch1228', HERE / 'patch_v1228.py')
patcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patcher)
for label, source in [('repeat application refused', page), ('different base refused', base + '\n')]:
    rejected = False
    try:
        patcher.patch(source)
    except ValueError:
        rejected = True
    check(label, rejected)
print(f'{checks}/{checks} source-preservation checks passed')
