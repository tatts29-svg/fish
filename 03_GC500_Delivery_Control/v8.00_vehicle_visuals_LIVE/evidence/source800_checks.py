#!/usr/bin/env python3
"""Author: Andrew Fisher. Reproduce the official chain and isolate each visual check.

Private HTML intermediates remain outside the repository. Evidence retains hashes,
source checks and CPU results only. No browser, network or live write is performed.
"""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
FOLDER = HERE.parent
PROJECT = FOLDER.parent
BUILD = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else PROJECT / 'build/GC500_v8.00'
PRIVATE = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else Path('/workspace/private-v800-build-stages')
PRIVATE.mkdir(parents=True, exist_ok=True)
BASE = BUILD / 'base_live.html'
FINAL = BUILD / 'GC500_Delivery_Control_hosted.html'
checks = []
stages = []


def digest(value):
    return hashlib.sha256(value if isinstance(value, bytes) else value.encode()).hexdigest()


def check(name, good, detail=None):
    checks.append({'name': name, 'pass': bool(good), **({'detail': detail} if detail is not None else {})})
    assert good, name


def stage(name, text):
    file = PRIVATE / (name + '.html')
    file.write_text(text)
    stages.append({'name': name, 'path': str(file), 'sha256': digest(file.read_bytes()), 'bytes': file.stat().st_size})
    return file


def run(args, log=None, env=None):
    result = subprocess.run([str(a) for a in args], text=True, capture_output=True, env=env)
    if log:
        Path(log).write_text(result.stdout + result.stderr)
    if result.returncode:
        raise AssertionError('Command failed: ' + ' '.join(str(a) for a in args) + '\n' + result.stdout[-1500:] + result.stderr[-1500:])
    return result.stdout


def scrub(file):
    run([sys.executable, PROJECT / 'toolchain/scrub_attributions.py', file])
    return file.read_text()


sys.path.insert(0, str(FOLDER))
import patch_v800
import patch_racecar800
import patch_plant800
import patch_material800
import patch_camera800

chain = [PROJECT / 'v7.97_photo_outbox_durability_LIVE/patch_v797.py',
         PROJECT / 'v7.98_control_state_reliability_LIVE/patch_v798.py',
         PROJECT / 'v7.94_showcase_lap_cameras_LIVE/patch_v794.py']
source_files = sorted({p for folder in [x.parent for x in chain] + [FOLDER]
                       for p in folder.iterdir() if p.is_file() and (p.suffix == '.py' or '_src.' in p.name or p.suffix == '.glsl')})
source_hashes = {str(p.relative_to(PROJECT)): digest(p.read_bytes()) for p in source_files}
text = BASE.read_text()
check('fresh base is the verified live v7.96 page', digest(BASE.read_bytes()) == 'dd16fa3bd21d9e2b3f7e412e56855670dae7ebe5d5b03954b5951ba699c7f43c')
base_file = stage('00_live_v796', text)
for name, patch in zip(['01_photo797', '02_control798', '03_showcase794'], chain):
    file = stage(name, text)
    run([sys.executable, patch, file])
    text = file.read_text()
    stages[-1].update(sha256=digest(file.read_bytes()), bytes=file.stat().st_size)
showcase = text
race_file = stage('04_race800', patch_racecar800.apply(text, 'private race stage'))
plant_file = stage('05_plant800', patch_plant800.apply(race_file.read_text(), 'private plant stage'))
material_file = stage('06_material800', patch_material800.apply(plant_file.read_text(), 'private material stage'))
camera_file = stage('07_camera800', patch_camera800.apply(material_file.read_text(), 'private detail camera stage'))
release = patch_v800.metadata(camera_file.read_text(), 'private release metadata')
check('aggregate patch equals the four isolated components and final metadata', patch_v800.apply(showcase, 'aggregate replay') == release)
raw_file = stage('08_release800_raw', release)
final_file = stage('09_release800_scrubbed', release)
scrub(final_file)
stages[-1].update(sha256=digest(final_file.read_bytes()), bytes=final_file.stat().st_size)
check('exact official scrubbed rebuild matches final candidate', final_file.read_bytes() == FINAL.read_bytes())
final = FINAL.read_text()
check('one v8.00 release tag and sentinel', final.count(patch_v800.MARKER) == 1 and final.count('<meta name="gc500-release" content="v8.00">') == 1)
check('existing Showcase reports identify the final v8.00 release', "G.showcase794={version:'v8.00',paint};" in final and "return Object.assign(report,{version:'v8.00',cameraOverride:" in final)

control_clean = PRIVATE / 'control798_scrubbed.html'
control_clean.write_text((PRIVATE / '02_control798.html').read_text())
control = scrub(control_clean)
check('v7.98 stage matches its frozen independently checked build', digest(control.encode()) == '9a52ec22c794a514d44936ef84335b62a6876c2664fa54f211a35f1315666d95')
final_without_metadata = final.replace(patch_v800.METADATA, '')
core = '/* GC3D part 1 — core:'
check('entire business page before the renderer matches the declared v7.98 stage', final_without_metadata[:final_without_metadata.index(core)] == control[:control.index(core)])
data = lambda s: re.search(r'\bconst DATA\s*=\s*(.*);', s).group(1)
check('embedded operational record is byte-preserved from fresh live', data(final) == data(BASE.read_text()))
check('declared photo acknowledgement and print-note fixes remain present', all(x in final for x in ['function photoRecordAck797(', 'function drawerSync798Word(', 'dpDeliveryNotes798(g)', "style.setProperty('--dpz', '1')"]))


def region(s, a, b):
    i = s.index(a)
    return s[i:s.index(b, i)]


for label, a, b in [
    ('car driving hull and kinematic geometry', 'G.carHull=function(){', 'G.pose=function(){'),
    ('simulation, suspension, tyre marks and particle generation', 'G.step=function(dt){', '/* everything that is rebuilt'),
    ('fixed-step frame loop', 'G.frame=function(tms)', '/* deterministic still'),
    ('vehicle selection and tuning handoff', 'G.setVehicle=function(kind){', 'G.syncRaceCarQuality=function'),
    ('rigid car transform', 'G.raceCarMatrix=function(){', 'G.drawRaceCar=function'),
]:
    check(label + ' is byte-preserved', region(final, a, b) == region(control, a, b))
for name, fixture in [
    ('aggregate repeat application refuses', final),
    ('aggregate partial application refuses', race_file.read_text()),
    ('missing full-lap prerequisite refuses', showcase.replace('G.deriveCorridor794=', 'G.missingCorridor=')),
    ('missing photo prerequisite refuses', showcase.replace('function photoRecordAck797(', 'function missingAck(')),
]:
    try:
        patch_v800.apply(fixture, 'deliberate guard fixture')
    except SystemExit:
        check(name, True)
    else:
        check(name, False)

run(['node', HERE / 'racecar800_checks.cjs', PRIVATE / '03_showcase794.html', HERE / 'racecar800_integrated_checks.json', race_file], HERE / 'racecar800_integrated_checks.log')
run([sys.executable, HERE / 'racecar800_patch_checks.py', PRIVATE / '03_showcase794.html', HERE / 'racecar800_integrated_guards.json'], HERE / 'racecar800_integrated_guards.log')
run(['node', HERE / 'plant800_checks.cjs', '--base', race_file, '--page', plant_file, '--output', HERE / 'plant800_integrated_checks.json'], HERE / 'plant800_integrated_checks.log')
run(['node', HERE / 'material800_checks.cjs', plant_file, material_file, HERE / 'material800_integrated_checks.json'], HERE / 'material800_integrated_checks.log')
run(['node', HERE / 'camera800_checks.cjs', '--base', material_file, '--page', camera_file,
     '--output', HERE / 'camera800_integrated_checks.json'], HERE / 'camera800_integrated_checks.log')
run([sys.executable, PROJECT / 'toolchain/check_page.py', FINAL, '--base', BASE], HERE / 'check_page800.log')
check('component checks pass against their exact isolated stages', True)
check('official final-page static checks pass', True)
check('all source files stayed frozen throughout verification', source_hashes == {str(p.relative_to(PROJECT)): digest(p.read_bytes()) for p in source_files})
results = {name: json.loads((HERE / (name + '_integrated_checks.json')).read_text()) for name in ['racecar800', 'plant800', 'material800', 'camera800']}
result = {'author': 'Andrew Fisher', 'scope': 'Exact official chain, isolated CPU component checks and protected source; no browser or live writes',
          'baseline': {'path': str(BASE), 'sha256': digest(BASE.read_bytes())},
          'candidate': {'path': str(FINAL), 'sha256': digest(FINAL.read_bytes()), 'bytes': FINAL.stat().st_size},
          'stages': stages, 'sources': source_hashes, 'checks': checks,
          'components': {name: {'evidence': name + '_integrated_checks.json', 'sha256': digest((HERE / (name + '_integrated_checks.json')).read_bytes())} for name in results}}
(HERE / 'source800_checks.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'passed': len(checks), 'candidate': result['candidate'], 'stages': len(stages)}))
