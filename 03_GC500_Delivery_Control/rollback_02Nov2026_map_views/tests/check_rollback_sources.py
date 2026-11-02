"""Author: Andrew Fisher. Read-only, independent rollback source verification.

Inputs are authorised private captures; this writes only an optional evidence report.
It never publishes a page, registers a machine or changes a shared record.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import tempfile

PARENT = '3b17c3de36c8c3f2d99042b0c83dfd9fdc110ccb9db7a1c21ef6c9f72704a85b'
REJECTED = '10eeb707df306b79c9ee5e870dab64b3037e39806bdd8147e665bc789c01ceff'
MACHINE = '8256bce609ce48d30fd319ac56bce74729cfe8a980ad051228379d09b06a15e6'
FILES = {
    'explorer/explorer-merge.js': ('7c276bb181541e506e983356fb746cd4233c77c6c973c178c7da27d458ad66c4', 32311),
    'explorer/explorer.js': ('e175ec073b2d30c89c075f5bfe6ab823385c8f23cd50d07fa13ef10b5e2e6b5a', 170853),
    'explorer/index.html': ('91e0ae84b59235c963eeb93ff79e9263844b333565b6b7c3726a62a918fd6d20', 28813),
    'poc3d/index.html': ('f8403834a1336ce15e9e296f46413bbf3dfd132bc5011a02a49813340c694efb', 46200),
}
sha = lambda raw: hashlib.sha256(raw).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--parent', required=True)
    parser.add_argument('--children', required=True)
    parser.add_argument('--original-manifest', required=True)
    parser.add_argument('--current-manifest', required=True)
    parser.add_argument('--rejected-parent', required=True)
    parser.add_argument('--out')
    args = parser.parse_args()
    checks = []

    def check(name, condition):
        if not condition:
            raise AssertionError(name)
        checks.append(name)

    parent = Path(args.parent).read_bytes()
    rejected = Path(args.rejected_parent).read_bytes()
    check('restored parent is the exact verified v12.81 bytes', sha(parent) == PARENT)
    check('rollback comparison starts at the exact rejected v12.83 bytes', sha(rejected) == REJECTED)
    original = json.loads(Path(args.original_manifest).read_text())
    current = json.loads(Path(args.current_manifest).read_text())
    canonical = json.dumps({k: original[k] for k in ['schema', 'entry', 'files']}, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()
    check('original manifest digest is the retained 8256 bundle', sha(canonical) == original['sha256'] == MACHINE)
    old = {r['path']: r for r in original['files']}
    now = {r['path']: r for r in current['files']}
    check('both manifests retain every one of the 236 unique paths', len(old) == len(original['files']) == len(now) == len(current['files']) == 236 and old.keys() == now.keys())
    check('exactly the four reviewed map descriptors differ', {p for p in old if old[p] != now[p]} == set(FILES))
    texts = {}
    for name, (digest, size) in FILES.items():
        raw = (Path(args.children) / name).read_bytes()
        check(name + ' exact historical descriptor', old[name]['sha256'] == digest and old[name]['bytes'] == size)
        check(name + ' exact restored bytes', sha(raw) == digest and len(raw) == size)
        texts[name] = raw.decode()
    p = parent.decode()
    check('parent exposes satellite map selection', "['sat', 'VMS, generators & gates']" in p)
    check('parent exposes the separate 3D page', "items.push(['proof3d', 'The 3D proof'])" in p)
    check('parent 3D action retains its native mode and flush', 'function expOpen3d(key){ EXP.mode3d = true;' in p and 'renderMap(); expFlush3d(); return true;' in p)
    check('parent has no 2026-only policy override', 'map2026Only1283' not in p and 'gotoLatLon1283' not in p)
    index, explorer, merge, proof = (texts[k] for k in ['explorer/index.html', 'explorer/explorer.js', 'explorer/explorer-merge.js', 'poc3d/index.html'])
    check('Explorer has all three 2D view buttons', all('data-mode="' + m + '"' in index for m in ['original', 'hybrid', 'satellite']))
    check('Explorer exposes its actual setMode API', 'window.GC500Explorer = {' in explorer and ', setMode, render:' in explorer)
    check('satellite provider session and tiles remain connected', 'v1/createSession?key=' in explorer and 'v1/2dtiles/' in explorer and 'mapbox.satellite/' in explorer)
    check('Explorer 3D action still enters and leaves the real child', 'G.mode3d = on => (on ? enter3d() : exit3d());' in merge and 'G.is3d = () => in3d;' in merge)
    check('3D page exposes its native API and provider tileset', 'window.GC500_3D = {' in proof and "Cesium.Cesium3DTileset.fromUrl('https://tile.googleapis.com/v1/3dtiles/root.json?key='" in proof)
    # Reproduce the rejected page from the historical parent using the bounded
    # map patch plus the same scrub. Exact equality accounts for the entire delta.
    delivery = Path(__file__).resolve().parents[2]
    patchfile = delivery / 'v12.83_maps_2026_only_DRAFT/patch_v1283.py'
    spec = importlib.util.spec_from_file_location('map_patch1283', patchfile)
    patch = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(patch)
    with tempfile.TemporaryDirectory() as temp:
        produced = Path(temp) / 'reproduced.html'
        produced.write_text(patch.apply(p))
        subprocess.run(['python3', str(delivery / 'toolchain/scrub_attributions.py'), str(produced)], stdout=subprocess.DEVNULL, check=True)
        check('the entire rejected-parent delta is the bounded map patch', produced.read_bytes() == rejected)
    data = lambda text: json.JSONDecoder().raw_decode(text.split('const DATA = ', 1)[1])[0]
    check('all embedded source, operational and financial DATA is unchanged', data(p) == data(rejected.decode()))
    block = lambda text: re.search(r'<script id="plf1272-script">[\s\S]*?</script>', text).group(0)
    check('the complete P&L block is byte-identical', block(p) == block(rejected.decode()))
    result = {'author':'Andrew Fisher', 'pass':len(checks), 'checks':checks, 'parent':PARENT, 'machine':MACHINE,
              'restoredFiles':{k:{'sha256':v[0], 'bytes':v[1]} for k,v in FILES.items()},
              'limits':'Local source/API checks only; no claim of live provider rendering or 2026 capture dates.', 'writes':0}
    if args.out:
        Path(args.out).write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'pass':len(checks), 'parent':PARENT, 'machine':MACHINE, 'writes':0}))


if __name__ == '__main__':
    main()
