"""Author: Andrew Fisher. Exact bounded-source and refusal checks; no network."""
import hashlib
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))
from patch_v1233 import BASE, OLD, NEW, apply

base_bytes = Path(os.environ['BASE']).read_bytes()
page_bytes = Path(os.environ['PAGE']).read_bytes()
base, page = base_bytes.decode('utf-8'), page_bytes.decode('utf-8')
checks = 0


def check(label, value):
    global checks
    assert value, label
    checks += 1
    print('PASS', label)


check('Exact verified base bytes', hashlib.sha256(base_bytes).hexdigest() == BASE)
check('Two existing renderer functions have one exact replacement', base.count(OLD) == 1 and page.count(NEW) == 1)
old_footer, new_footer = "+' · v12.32'; /* v8.19 release922", "+' · v12.33'; /* v8.19 release922"
check('Footer advances once', base.count(old_footer) == 1 and page.count(new_footer) == 1 and old_footer not in page)
restored = page.replace(NEW, OLD, 1).replace(new_footer, old_footer, 1)
check('Every other byte of data, models, styles, records and flows is preserved', restored.encode('utf-8') == base_bytes)
for label, text in [('Wrong base', base + '\n'), ('Repeated application', page)]:
    try:
        apply(text)
    except SystemExit:
        check(label + ' is refused', True)
    else:
        raise AssertionError(label + ' was accepted')
print('PASS', checks, 'source preservation checks')
