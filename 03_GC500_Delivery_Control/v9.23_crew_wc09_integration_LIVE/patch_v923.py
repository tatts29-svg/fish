#!/usr/bin/env python3
"""Author: Andrew Fisher. Fencing crew, race call, WC09 units and VMS plan notes."""
import pathlib, runpy, sys
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
page = pathlib.Path(sys.argv[1])
base = page.read_text(encoding='utf-8')
if " · v9.23'" in base:
    raise SystemExit('v9.23 already applied')
if " · v9.22'" not in base or 'release922' not in base:
    raise SystemExit('v9.23 requires the approved v9.22 release')
for script in ('crew', 'broadcast', 'split', 'lines', 'vms'):
    runpy.run_path(str(HERE / ('patch_v900_' + script + '.py')), run_name='__main__')
text = page.read_text(encoding='utf-8')
text = rep(text, " · v9.22'", " · v9.23'", 'release footer', str(page))
page.write_text(text, encoding='utf-8')
