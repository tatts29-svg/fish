#!/usr/bin/env python3
"""Author: Andrew Fisher. Private visual assembly and exact source/CPU proof.

Usage: source802_checks.py BASE801_HTML [EXISTING_FINAL802_HTML] [--reference ACCEPTED_VISUAL_HTML]
Without the second argument, assemble a private candidate for graphics review.
This does not fetch, publish, launch a browser or write any live record.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
FOLDER = HERE.parent
PROJECT = FOLDER.parent
VEHICLE = PROJECT / 'v8.00_vehicle_visuals_LIVE'
args = argparse.ArgumentParser(description=__doc__)
args.add_argument('base', type=Path)
args.add_argument('expected', type=Path, nargs='?')
args.add_argument('--output', type=Path, default=Path('/workspace/private-v802-final-visual.html'))
args.add_argument('--stage-dir', type=Path, default=Path('/workspace/private-v802-build-stages'))
args.add_argument('--reference', type=Path)
args = args.parse_args()
PRIVATE = args.stage_dir.resolve()
PRIVATE.mkdir(exist_ok=True)
BASE = args.base.resolve()
EXPECTED = args.expected.resolve() if args.expected else None
OUT = args.output.resolve()
sys.path[:0] = [str(FOLDER), str(VEHICLE)]
import patch_v802
import patch_v800
import patch_racecar800
import patch_plant800
import patch_material800
import patch_camera800
import patch_aa802

checks, stages = [], []
sha = lambda data: hashlib.sha256(data if isinstance(data, bytes) else data.encode()).hexdigest()


def check(name, good):
    checks.append({'name': name, 'pass': bool(good)})
    assert good, name


def stage(name, text):
    path = PRIVATE / (name + '.html')
    path.write_text(text)
    stages.append({'name': name, 'path': str(path), 'sha256': sha(path.read_bytes()), 'bytes': path.stat().st_size})
    return path


def run(args, log):
    r = subprocess.run([str(x) for x in args], capture_output=True, text=True)
    (HERE / log).write_text(r.stdout + r.stderr)
    assert r.returncode == 0, log + '\n' + (r.stdout + r.stderr)[-2500:]


folders = [FOLDER, VEHICLE, PROJECT / 'v7.94_showcase_lap_cameras_LIVE']
files = sorted(p for f in folders for p in f.iterdir() if p.is_file() and (p.suffix == '.py' or '_src.' in p.name or p.suffix == '.glsl'))
sources = {str(p.relative_to(PROJECT)): sha(p.read_bytes()) for p in files}
base = BASE.read_text()
check('base is the complete v8.01 booking and reliability release', all(s in base for s in ['function bookingOrder801(', 'function photoRecordAck797(', 'function drawerSync798Word(', '<meta name="gc500-release" content="v8.01">']))
base_copy = stage('00_base801', base)
text = base.replace('<meta name="gc500-release" content="v8.01">\n', '')
showcase = stage('01_showcase794', patch_v802.patch_v794.apply(text, 'private 802 showcase'))
text = showcase.read_text()
for name, component in [('02_race800', patch_racecar800), ('03_plant800', patch_plant800),
                        ('04_material800', patch_material800), ('05_camera800', patch_camera800)]:
    text = component.apply(text, 'private 802 component')
    stage(name, text)
text = patch_v800.metadata(text, 'private component metadata')
metadata800 = stage('06_metadata800', text)
text = patch_aa802.apply(text, 'private AA component')
aa = stage('07_aa802', text)
text = text.replace('<meta name="gc500-release" content="v8.00">', patch_v802.MARKER + '\n<meta name="gc500-release" content="v8.02">')
text = text.replace("G.showcase794={version:'v8.00',paint};", "G.showcase794={version:'v8.02',paint};")
text = text.replace("return Object.assign(report,{version:'v8.00',cameraOverride:", "return Object.assign(report,{version:'v8.02',cameraOverride:")
check('root aggregate equals the exact isolated components and metadata', text == patch_v802.apply(base, 'private aggregate equality'))
stage('08_release802_raw', text)
# Scrub the temporary reconstruction first, so a repeated verification may reuse
# identical final bytes without briefly rewriting an accepted graphics candidate.
scrubbed = PRIVATE / 'candidate_scrubbed.html'
scrubbed.write_text(text)
run([sys.executable, PROJECT / 'toolchain/scrub_attributions.py', scrubbed], 'scrub802.log')
if OUT.exists() and OUT.read_bytes() != scrubbed.read_bytes():
    raise SystemExit('Refusing to overwrite a different private candidate; choose --output')
if not OUT.exists():
    OUT.write_bytes(scrubbed.read_bytes())
final = OUT.read_text()
if EXPECTED:
    check('private reconstruction equals the supplied official final bytes', OUT.read_bytes() == EXPECTED.read_bytes())
check('final metadata names v8.02 exactly once', final.count('<meta name="gc500-release" content="v8.02">') == 1)
data = lambda s: re.search(r'\bconst DATA\s*=\s*(.*);', s).group(1)
check('all embedded operational records and booking quantities are byte-preserved', data(base) == data(final))
scripts = lambda s: re.findall(r'<script\b[^>]*>([\s\S]*?)</script>', s, re.I)
business_scripts = lambda s: [x for x in scripts(s) if re.search(r'\bconst DATA\s*=', x)]
check('the complete business inline script is byte-preserved', len(business_scripts(base)) == 1 and business_scripts(base) == business_scripts(final))
def clean_metadata(s):
    for marker in [patch_v800.MARKER, patch_v802.MARKER]:
        s = s.replace(marker + '\n', '')
    return re.sub(r'<meta name="gc500-release" content="[^"]+">\n', '', s)
core = '/* GC3D part 1 — core:'
check('all business source before the renderer is byte-preserved', clean_metadata(base[:base.index(core)]) == clean_metadata(final[:final.index(core)]))
def region(s, a, b):
    i = s.index(a)
    return s[i:s.index(b, i)]
for name, a, b in [
    ('driving hull', 'G.carHull=function(){', 'G.pose=function(){'),
    ('physics, suspension, marks and particle generation', 'G.step=function(dt){', '/* everything that is rebuilt'),
    ('fixed-step frame loop', 'G.frame=function(tms)', '/* deterministic still'),
    ('selection and tuning', 'G.setVehicle=function(kind){', 'G.syncRaceCarQuality=function'),
    ('rigid vehicle transform', 'G.raceCarMatrix=function(){', 'G.drawRaceCar=function'),
]:
    check(name + ' is byte-preserved', region(base, a, b) == region(final, a, b))
reference = None
if args.reference:
    ref = args.reference.read_text()
    # Excluding only the identified business script binds every renderer extension,
    # including foliage and camera helpers, plus the unchanged vendor libraries.
    visual_scripts = lambda s: [x for x in scripts(s) if not re.search(r'\bconst DATA\s*=', x)]
    accepted, current = visual_scripts(ref), visual_scripts(final)
    check('all non-business inline scripts exactly match the accepted GPU candidate', len(business_scripts(ref)) == 1 and bool(accepted) and accepted == current)
    reference = {'path': str(args.reference.resolve()), 'sha256': sha(args.reference.read_bytes()),
                 'nonBusinessInlineScripts': [sha(s) for s in accepted]}
print(json.dumps({'candidate': str(OUT), 'sha256': sha(OUT.read_bytes()), 'bytes': OUT.stat().st_size, 'stage': 'assembled; CPU checks running'}), flush=True)
v = VEHICLE / 'evidence'
run(['node', v / 'racecar800_checks.cjs', showcase, HERE / 'race802_checks.json', PRIVATE / '02_race800.html'], 'race802_checks.log')
run(['node', v / 'plant800_checks.cjs', '--base', PRIVATE / '02_race800.html', '--page', PRIVATE / '03_plant800.html', '--output', HERE / 'plant802_checks.json'], 'plant802_checks.log')
run(['node', v / 'material800_checks.cjs', PRIVATE / '03_plant800.html', PRIVATE / '04_material800.html', HERE / 'material802_checks.json'], 'material802_checks.log')
run(['node', v / 'camera800_checks.cjs', '--base', PRIVATE / '04_material800.html', '--page', PRIVATE / '05_camera800.html', '--output', HERE / 'camera802_checks.json'], 'camera802_checks.log')
run(['node', HERE / 'aa802_checks.cjs', metadata800, aa, HERE / 'aa802_integrated_checks.json'], 'aa802_integrated_checks.log')
run([sys.executable, HERE / 'aa802_patch_checks.py', metadata800, HERE / 'aa802_integrated_guards.json'], 'aa802_integrated_guards.log')
run([sys.executable, PROJECT / 'toolchain/check_page.py', OUT, '--base', base_copy], 'check_page802.log')
check('all five component suites, AA guards and final static check pass', True)
check('all product sources stayed frozen throughout verification', sources == {str(p.relative_to(PROJECT)): sha(p.read_bytes()) for p in files})
result = {'author': 'Andrew Fisher', 'scope': 'Private exact component assembly, protected source and CPU proof; no browser or live writes',
          'base': {'path': str(BASE), 'sha256': sha(BASE.read_bytes())},
          'candidate': {'path': str(OUT), 'sha256': sha(OUT.read_bytes()), 'bytes': OUT.stat().st_size},
          'checkedOfficialFinal': str(EXPECTED) if EXPECTED else None, 'acceptedVisualReference': reference,
          'sources': sources, 'stages': stages, 'checks': checks}
(HERE / 'source802_checks.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'passed': len(checks), 'candidate': result['candidate']}), flush=True)
