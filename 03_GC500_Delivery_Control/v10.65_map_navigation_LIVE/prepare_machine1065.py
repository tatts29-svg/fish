"""Author: Andrew Fisher. Prepare the three reviewed map files from an exact base."""
from pathlib import Path
import argparse
import hashlib
import json
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / 'camera'))
sys.path.insert(0, str(HERE / 'lifecycle'))
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from patch_camera1065 import apply as camera
from patch_hidden1065 import apply as hidden
from rep import rep

BASE = {
    'explorer.js': 'c096837cb410bce216876ab8b49a9bf10c54ba4e4749bbb337979b71fb367f9d',
    'explorer-merge.js': '97a4087210f34b891a83de69aee2929b21c3b284b52a9635971f9e52fbb76d15',
    'index.html': 'b5f7c16560f12ebcea6a84bfa7697e603ee46580c3950414e79bc31308d02843',
}

def prepare(source, out):
    original = {}
    for name, expected in BASE.items():
        b = (source / 'explorer' / name).read_bytes()
        if hashlib.sha256(b).hexdigest() != expected:
            raise ValueError('Wrong source: ' + name)
        original[name] = b.decode()
    updated = {'explorer.js': camera(original['explorer.js']),
               'explorer-merge.js': hidden(original['explorer-merge.js'])}
    index = original['index.html']
    for name, value in updated.items():
        sha = hashlib.sha256(value.encode()).hexdigest()
        index = rep(index, name + '?v=' + BASE[name][:12], name + '?v=' + sha[:12], 'script pin ' + name, 'index.html')
    updated['index.html'] = index
    evidence = {'author': 'Andrew Fisher', 'baseManifest': '1348bf1bbcf69400aab0e510e7239d68dac567d40d103898323bf9abdef7bf6f', 'files': {}}
    (out / 'explorer').mkdir(parents=True, exist_ok=True)
    for name, value in updated.items():
        b = value.encode(); (out / 'explorer' / name).write_bytes(b)
        evidence['files']['explorer/' + name] = {'base': BASE[name], 'sha256': hashlib.sha256(b).hexdigest(), 'bytes': len(b)}
    (out / 'source-bound.json').write_text(json.dumps(evidence, indent=2) + '\n')
    print(json.dumps(evidence, indent=2))

if __name__ == '__main__':
    p = argparse.ArgumentParser(); p.add_argument('source', type=Path); p.add_argument('out', type=Path)
    a = p.parse_args(); prepare(a.source, a.out)
