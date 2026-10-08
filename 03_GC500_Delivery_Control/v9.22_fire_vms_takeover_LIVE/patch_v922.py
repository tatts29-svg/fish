#!/usr/bin/env python3
"""Author: Andrew Fisher. Integrate the approved fire extinguisher and VMS changes."""
import pathlib, runpy, sys
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
page = pathlib.Path(sys.argv[1])
base = page.read_text(encoding='utf-8')
if 'release922' in base:
    raise SystemExit('v9.22 already applied')
if " · v9.21'" not in base or 'photoTrack920' not in base:
    raise SystemExit('v9.22 requires the published v9.21 pins and v9.20 track base')
for script in ('patch_v914_fire_ext.py', 'patch_v913_vms_rego.py', 'patch_v900_truckflow.py'):
    runpy.run_path(str(HERE / script), run_name='__main__')
text = page.read_text(encoding='utf-8')
text = rep(text, " · v9.21'; /* v8.19", " · v9.22'; /* v8.19 release922: approved fire extinguishers, VMS register and Truck flow fold. Author: Andrew Fisher. */ /* v8.19", 'release footer', str(page))
page.write_text(text, encoding='utf-8')
