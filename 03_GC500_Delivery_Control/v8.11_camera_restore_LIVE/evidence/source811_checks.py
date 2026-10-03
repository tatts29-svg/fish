#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact camera restoration and preservation proof."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import re
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
spec = importlib.util.spec_from_file_location('patch811', HERE.parent / 'patch_v811.py')
patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(patch)
parser = argparse.ArgumentParser()
parser.add_argument('--base', required=True)
parser.add_argument('--page', required=True)
parser.add_argument('--previous', default=str(ROOT / 'build/GC500_v8.01/GC500_Delivery_Control_hosted.html'))
parser.add_argument('--output', default=str(HERE / 'source811_checks.json'))
args = parser.parse_args()
base, page, previous = (Path(p).read_text() for p in (args.base, args.page, args.previous))
sha = lambda s: hashlib.sha256(s.encode()).hexdigest()
checks = []
def check(name, passed, detail=None):
    checks.append(dict(name=name, passed=bool(passed), detail=detail))
def cut(s, start, end):
    a = s.index(start)
    return s[a:s.index(end, a)]
def rejected(s):
    try:
        patch.apply(s, 'guard fixture')
    except SystemExit:
        return True
    return False

check('exact previous live camera baseline', sha(previous) == '70ed0c49213a910ae33dd062ecd3ada5f1752a69b0c1665c19c6bb25bcea1f11')
check('candidate reproduced by frozen component', patch.apply(base) == page)
native = lambda s: cut(s, 'G.VIEWS=', '/* put the canvas in a plate')
check('entire original views/director/rigs/transitions/FOV/lean/shake/portaloo priority restored byte-for-byte', native(page) == native(previous), sha(native(page)))
get_view = lambda s: cut(s, 'function showViewGet(){', 'function showPaceGet(){')
check('original default and remembered-view getter unchanged', get_view(page) == get_view(previous))
check('no replacement camera runtime, tour insertion or fitting remains', all(x not in page for x in ('G.camera794=', 'G.vehicleCamera800=', 'G.fitDetailCamera800', "showViewGet=function()", "option.value='tour'", "Auto — circuit cameras")))
scripts = lambda s: re.findall(r'<script\b[^>]*>([\s\S]*?)</script>', s, re.I)
bs, ps = scripts(base), scripts(page)
check('only obsolete selected-vehicle camera script removed', len(bs) == 8 and len(ps) == 7)
for i, label in [(0, 'QR'), (1, 'all business/record/selection code and embedded DATA'), (3, 'compression library'), (4, 'PDF library'), (5, 'new architecture/vegetation geometry')]:
    check(label+' is byte-for-byte unchanged', bs[i] == ps[i], sha(ps[i]))
check('main renderer outside original camera block is byte-for-byte unchanged', bs[2].replace(native(base), '') == ps[2].replace(native(page), ''))
expected = bs[6]
for source in (patch.frozen('v7.94_showcase_lap_cameras_LIVE/camera794_src.js'), patch.DEFAULT_OVERRIDE, patch.CHOICE_OVERRIDE):
    assert expected.count(source) == 1
    expected = expected.replace(source, '', 1)
check('full lap playback/map/scenery/pit/corridor source retained exactly outside removed camera/menu override', expected == ps[6])
outside = lambda s: re.sub(r'<script\b[^>]*>[\s\S]*?</script>', '<script></script>', s, flags=re.I)
expected_outside = outside(base).replace('<!-- Selected vehicle camera fitting v8.00 -->\n<script></script>\n', '')
check('HTML/CSS/components/styles and release metadata unchanged', expected_outside == outside(page).replace(patch.MARKER+'\n', ''))
check('duplicate application refused', rejected(page))
check('pre-overhaul source refused', rejected(previous))
check('mutated original camera hook refused', rejected(base.replace('behind(2.50,.72,side*1.9)', 'behind(2.51,.72,side*1.9)')))
check('mutated overlay refused', rejected(base.replace("const TOUR=['chase'", "const TOUR=['hero'")))
check('missing visual prerequisite refused', rejected(base.replace('G.selectSamples802=', 'G.changedSamples802=')))
for version in ('v8.07', 'v8.08'):
    fixture = re.sub(r'(<meta name="gc500-release" content=")[^"]+', lambda m: m[1]+version, base)
    result = patch.apply(fixture)
    check('integration retains '+version+' marker', '<meta name="gc500-release" content="'+version+'">' in result)
with tempfile.TemporaryDirectory(prefix='camera811-') as folder:
    for i, source in enumerate(ps):
        filename = Path(folder) / ('inline-'+str(i)+'.js')
        filename.write_text(source)
        result = subprocess.run(['node', '--check', str(filename)], capture_output=True, text=True)
        check('inline script '+str(i)+' parses', result.returncode == 0, result.stderr or None)
report = dict(author='Andrew Fisher', scope='Source restoration component; no operational writes', baseSha256=sha(base), pageSha256=sha(page), previousSha256=sha(previous), patchSha256=sha((HERE.parent/'patch_v811.py').read_text()), passed=sum(c['passed'] for c in checks), failed=sum(not c['passed'] for c in checks), checks=checks)
Path(args.output).write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({k:report[k] for k in ('passed', 'failed', 'pageSha256')}))
raise SystemExit(bool(report['failed']))
