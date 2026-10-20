#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact byte-boundary and refusal checks for the library recovery component."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description='Read-only source preservation checks; HTML stays outside this package.')
parser.add_argument('base', type=Path)
parser.add_argument('candidate', type=Path)
parser.add_argument('--report', type=Path)
args = parser.parse_args()
base = args.base.read_text()
candidate = args.candidate.read_text()
loader = (ROOT / 'cesium_library_loader.js').read_text()
checks = []
def check(name, okay):
    checks.append({'name': name, 'pass': bool(okay)})
    assert okay, name
sha = lambda text: hashlib.sha256(text.encode()).hexdigest()
tag = '<script src="https://cdn.jsdelivr.net/npm/cesium@1.131.0/Build/Cesium/Cesium.js"></script>\n'
ddc = "const DDC = typeof Cesium === 'undefined' ? null : {base: new Cesium.DistanceDisplayCondition(0, PHONE ? 450 : 650), group: new Cesium.DistanceDisplayCondition(0, 1500), all: new Cesium.DistanceDisplayCondition(0, 1e7)};"
old_boot = "if (!window.Cesium) { bootProblem813('library'); return; }"
new_boot = "    await loadCesiumLibrary();\n    DDC = {base: new Cesium.DistanceDisplayCondition(0, PHONE ? 450 : 650), group: new Cesium.DistanceDisplayCondition(0, 1500), all: new Cesium.DistanceDisplayCondition(0, 1e7)};"
expected = base.replace(tag, '').replace("let bootPhase813 = 'library'", loader + "\nlet bootPhase813 = 'library'").replace(ddc, 'let DDC = null;').replace(old_boot, new_boot)
check('exact frozen source SHA', sha(base) == '7edf7b5ac55c1cf5f60f35b72d577d8e257854e2e482b1b93796e498edcf5ac4')
check('candidate contains exactly the four allowed text substitutions', candidate == expected)
check('inline CSS byte-identical', re.findall(r'<style\b[^>]*>[\s\S]*?</style>', base) == re.findall(r'<style\b[^>]*>[\s\S]*?</style>', candidate))
strip_scripts = lambda text: re.sub(r'<script\b[^>]*>[\s\S]*?</script>\n?', '', text)
check('all markup, CSS links, labels and document controls byte-identical', strip_scripts(base) == strip_scripts(candidate))
scripts = lambda text: re.findall(r'<script\b[^>]*>([\s\S]*?)</script>', text)
base_scripts = [s for s in scripts(base) if s.strip()]
new_scripts = [s for s in scripts(candidate) if s.strip()]
check('inline controller count unchanged', len(base_scripts) == len(new_scripts))
check('header sizing and page navigation inline scripts byte-identical', base_scripts[0] == new_scripts[0] and base_scripts[-1] == new_scripts[-1])
check('native API and pin probe byte-identical', base[base.index('window.GC500_3D ='):base.index('</script>', base.index('window.GC500_3D ='))] == candidate[candidate.index('window.GC500_3D ='):candidate.index('</script>', candidate.index('window.GC500_3D ='))])
recovery = lambda text: text[text.index("let bootPhase813 = 'library'"):text.index('/* Auto: the screen', text.index("let bootPhase813 = 'library'"))]
check('recovery, parent failure, explicit Retry and map-key timeout functions byte-identical', recovery(base) == recovery(candidate))
policy = lambda text: text[text.index('const VIEWS ='):text.index('/* Author: Andrew Fisher. Recovery')]
check('camera presets, trades, quality tiers and adaptation functions byte-identical', policy(base) == policy(candidate))
def original_boot(text):
    start = text.index('async function boot()')
    end = text.index('\nfunction perfText()', start)
    return text[start:end]
check('all post-library boot logic byte-identical', original_boot(candidate).replace(new_boot, old_boot) == original_boot(base))
check('CDN version and existing stylesheet still match', 'cesium@1.131.0/Build/Cesium/Widgets/widgets.css' in candidate and loader.count('cesium@1.131.0/Build/Cesium/Cesium.js') == 1)
spec = importlib.util.spec_from_file_location('private_loader_patch', ROOT / 'patch_loader.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
check('shared exact-match patch reproduces the candidate byte-for-byte', module.apply(base) == candidate)
for name, text in [('already patched candidate', candidate), ('wrong base bytes', base + '\n')]:
    rejected = False
    try:
        module.apply(text)
    except ValueError:
        rejected = True
    check('patch refuses ' + name, rejected)
report = {'author': 'Andrew Fisher', 'baseSha256': sha(base), 'candidateSha256': sha(candidate),
          'total': len(checks), 'passed': sum(c['pass'] for c in checks), 'checks': checks}
if args.report:
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['passed', 'total', 'candidateSha256']}))
