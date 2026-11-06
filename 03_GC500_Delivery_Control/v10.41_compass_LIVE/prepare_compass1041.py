"""Author: Andrew Fisher. Contain the rotating compass without moving map controls."""
from pathlib import Path
import hashlib
import json
import sys

BASE = '86eb69168f5e08b369ff1a41758140fabf36fc28fcc81fb705605322b128fcc3'
FILES = ('poc3d/index.html', 'poc3d/equipment_viewer1027.js',
         'poc3d/equipment_geometry1027.js', 'poc3d/equipment_layout1027.js',
         'explorer/explorer-merge.js', 'explorer/index.html')


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def replace(text, before, after):
    if text.count(before) != 1:
        raise ValueError('Expected one source anchor: ' + before[:100])
    return text.replace(before, after)


def prepare(source, target, manifest_path):
    manifest = json.loads(manifest_path.read_text())
    if manifest['sha256'] != BASE:
        raise ValueError('Unexpected map base; reconcile before preparing')
    rows = {row['path']: row for row in manifest['files']}
    files = {}
    for name in FILES:
        raw = (source / name).read_bytes()
        if sha(raw) != rows[name]['sha256'] or len(raw) != rows[name]['bytes']:
            raise ValueError('Source differs from retained manifest: ' + name)
        files[name] = raw.decode()
    viewer = 'poc3d/equipment_viewer1027.js'
    anchor = 'body.equipment1027 .rose3d{top:auto;bottom:62px}'
    files[viewer] = replace(files[viewer], anchor,
        'body.equipment1027 .dialwrap{overflow:hidden}' + anchor)
    index = 'poc3d/index.html'
    files[index] = replace(files[index],
        'equipment_viewer1027.js?v=' + rows[viewer]['sha256'][:12],
        'equipment_viewer1027.js?v=' + sha(files[viewer].encode())[:12])
    bridge = 'explorer/explorer-merge.js'
    files[bridge] = replace(files[bridge],
        '../poc3d/index.html?v=' + rows[index]['sha256'][:12],
        '../poc3d/index.html?v=' + sha(files[index].encode())[:12])
    files['explorer/index.html'] = replace(files['explorer/index.html'],
        'explorer-merge.js?v=' + rows[bridge]['sha256'][:12],
        'explorer-merge.js?v=' + sha(files[bridge].encode())[:12])
    evidence = {'author': 'Andrew Fisher', 'baseManifest': BASE, 'files': {}}
    for name, text in files.items():
        raw = text.encode()
        out = target / name
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(raw)
        evidence['files'][name] = {'base': rows[name]['sha256'],
            'sha256': sha(raw), 'bytes': len(raw)}
    (target / 'source-bound.json').write_text(json.dumps(evidence, indent=2) + '\n')
    print('Prepared four replacements; geometry and layout unchanged')


if __name__ == '__main__':
    prepare(*map(Path, sys.argv[1:4]))
