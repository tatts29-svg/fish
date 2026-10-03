#!/usr/bin/env python3
"""Author: Andrew Fisher. Reproduce the four map assets from their exact live sources."""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys

ROOT = Path(__file__).resolve().parent
EXPECTED = {
    'explorer.js': 'ad9ab5e488d690444c59730f8ad286b2df60ab0353cd1d21dabc40e398a3b5a4',
    'index.html': 'dd4b44d2169f38ef46d056d488d9bfaa39fa6942233ad3f98a9750af8e9ef25f',
    'explorer-merge.js': None,
    'poc3d/index.html': '0a060bed5acfdd970cc04c209b2163cba3199728575c84ac8196a10014b861f7',
}
sha = lambda b: hashlib.sha256(b).hexdigest()

def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / (name + '.py'))
    obj = importlib.util.module_from_spec(spec); spec.loader.exec_module(obj)
    return obj

def build(source, retained):
    files = {f['path']: f for f in json.loads(retained.read_text())['files']}
    EXPECTED['explorer-merge.js'] = files['explorer/explorer-merge.js']['sha256']
    live = {}
    for name, digest in EXPECTED.items():
        data = (source / name).read_bytes()
        assert sha(data) == digest, 'Live source changed: ' + name
        hosted = name if name.startswith('poc3d/') else 'explorer/' + name
        assert files[hosted]['sha256'] == digest, 'Retained manifest/source mismatch: ' + name
        live[name] = data.decode()
    perf, ux, entry, scene = [module(n) for n in ('patch_performance813','patch_ux813','patch_entry813','patch_satellite3d813')]
    built = {
        'explorer/explorer.js': ux.apply_explorer(perf.apply(live['explorer.js'])),
        'explorer/explorer-merge.js': scene.apply_merge(ux.apply_merge(live['explorer-merge.js'])),
        'poc3d/index.html': scene.apply_poc(live['poc3d/index.html']),
    }
    html = entry.apply(live['index.html'])
    for old, name in [('explorer.js?v=ad9ab5e488d6', 'explorer/explorer.js'), ('explorer-merge.js', 'explorer/explorer-merge.js')]:
        anchor = '<script src="' + old + '"></script>'
        assert html.count(anchor) == 1
        fresh = Path(name).name + '?v=' + sha(built[name].encode())[:12]
        html = html.replace(anchor, '<script src="' + fresh + '"></script>')
    built['explorer/index.html'] = html
    report = {'author': 'Andrew Fisher', 'baseFiles': EXPECTED.copy(), 'files': {}}
    for name, text in built.items():
        target = ROOT / 'release' / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text)
        report['files'][name] = {'sha256': sha(target.read_bytes()), 'bytes': target.stat().st_size}
    (ROOT / 'evidence/assets813_build.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report['files'], indent=2))

if __name__ == '__main__':
    if len(sys.argv) != 3: raise SystemExit('Use SOURCE_DIRECTORY RETAINED_MANIFEST')
    build(Path(sys.argv[1]), Path(sys.argv[2]))
