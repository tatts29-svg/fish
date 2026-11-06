#!/usr/bin/env python3
"""Author: Andrew Fisher. Prepare the exact tile-recovery script and its script URL."""
from pathlib import Path
import argparse
import importlib.util
import json
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from machine1064 import BASE, REPLACED, sha, validate_base


def apply_tiles(text, path):
    spec = importlib.util.spec_from_file_location('tile_recovery1064', HERE.parent / 'tile_recovery' / 'patch_tiles1064.py')
    transformer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(transformer)
    return transformer.apply(text, path)


def prepare(source, target, manifest_path):
    manifest = json.loads(Path(manifest_path).read_text())
    rows = validate_base(manifest)
    original = {}
    for path in sorted(REPLACED):
        raw = (Path(source) / path).read_bytes()
        if sha(raw) != rows[path]['sha256'] or len(raw) != rows[path]['bytes']:
            raise ValueError('Source bytes differ from the retained manifest: ' + path)
        original[path] = raw.decode('utf-8')
    script = 'explorer/explorer.js'
    prepared = {script: apply_tiles(original[script], script).encode('utf-8')}
    index = 'explorer/index.html'
    old_url = 'explorer.js?v=' + rows[script]['sha256'][:12]
    new_url = 'explorer.js?v=' + sha(prepared[script])[:12]
    if original[index].count(old_url) != 1:
        raise ValueError('Expected exactly one pinned explorer script in the current index')
    prepared[index] = original[index].replace(old_url, new_url).encode('utf-8')
    evidence = {'author': 'Andrew Fisher', 'baseManifest': BASE, 'files': {}}
    # Every source and transformation is checked before any candidate is written.
    for path, raw in prepared.items():
        output = Path(target) / path
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(raw)
        evidence['files'][path] = {'base': rows[path]['sha256'], 'sha256': sha(raw), 'bytes': len(raw)}
    (Path(target) / 'source-bound.json').write_text(json.dumps(evidence, indent=2) + '\n')
    return evidence


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True, help='Directory containing explorer/explorer.js and explorer/index.html')
    parser.add_argument('--target', type=Path, required=True)
    parser.add_argument('--manifest', type=Path, required=True)
    args = parser.parse_args(argv)
    print(json.dumps(prepare(args.source, args.target, args.manifest)))


if __name__ == '__main__':
    main()
