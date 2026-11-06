#!/usr/bin/env python3
"""Author: Andrew Fisher. Freeze seven reviewed inspection files without mutating source.

Offline preparation only. The subsequent release/build1305.py verifies the live
base and dashboard before building the complete retained machine set.
"""
from pathlib import Path
import argparse
import json
import re
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / 'release'))
from machine1305 import (BASE, PAGE_BASE, REQUIRED, REPLACEMENTS, ADDITIONS,
                         SCOPE_SHA256, sha, validate_base, validate_scope, validate_tree)

IMPORT = re.compile(r'''(?:\bfrom\s*|\bimport\s*)['"]\./([^'"]+)['"]''')


def imports(raw):
    return IMPORT.findall(raw.decode('utf-8'))


def validate_import_boundaries(files):
    index = files['index.html'].decode('utf-8')
    script_sources = re.findall(r'''<script\b[^>]*\bsrc\s*=\s*['"]([^'"]+)['"]''', index, re.I)
    app_sources = [value for value in script_sources if value.split('?')[0] in ('car-app.js', './car-app.js')]
    if app_sources != ['./car-app.js?v=13.05'] or index.count('Workshop v13.05') != 1:
        raise ValueError('index.html must identify v13.05 and load exactly one versioned car-app.js')
    edges = {name: imports(raw) for name, raw in files.items() if name.endswith('.js')}
    for parent, target in [('car-app.js', 'workshop-ui.js'), ('workshop-ui.js', 'workshop-learning.js')]:
        found = [value for value in edges[parent] if value.split('?')[0] == target]
        if found != [target + '?v=13.05']:
            raise ValueError(parent + ' must load the changed ' + target + ' with exactly one v13.05 query')
    # New paths do not require a query, but each must be reachable from the app's
    # module graph. This catches a staged yet unused implementation.
    reachable, pending = set(), ['car-app.js']
    while pending:
        name = pending.pop()
        if name in reachable:
            continue
        reachable.add(name)
        pending.extend(value.split('?')[0] for value in edges.get(name, [])
                       if value.split('?')[0] in files)
    if not (REQUIRED - {'index.html'}) <= reachable:
        raise ValueError('A changed inspection module is unreachable from car-app.js')


def run(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--keep', required=True, type=Path)
    parser.add_argument('--base-root', required=True, type=Path)
    parser.add_argument('--source', type=Path, default=HERE)
    parser.add_argument('--out', required=True, type=Path)
    args = parser.parse_args(argv)
    validate_scope()
    if args.out.exists():
        raise ValueError('Use a fresh private output directory')
    if HERE.parents[1] in args.out.resolve().parents:
        raise ValueError('Preparation output belongs outside the checkout')
    retained = json.loads(args.keep.read_text())
    old = validate_base(retained)
    validate_tree(retained, args.base_root)
    files = {}
    for name in sorted(REQUIRED):
        path = args.source / name
        if path.is_symlink():
            raise ValueError('Reviewed source cannot be a symlink: ' + name)
        raw = path.read_bytes()
        if not raw or len(raw) > 48 * 1024 * 1024:
            raise ValueError('Invalid reviewed source size: ' + name)
        raw.decode('utf-8')
        if name in REPLACEMENTS and sha(raw) == old[name]['sha256']:
            raise ValueError('Required replacement is unchanged: ' + name)
        files[name] = raw
    validate_import_boundaries(files)
    args.out.mkdir(parents=True, mode=0o700)
    for name, raw in files.items():
        (args.out / name).write_bytes(raw)
    # Re-read original inputs to avoid declaring a mixed source snapshot ready.
    for name, raw in files.items():
        if (args.source / name).read_bytes() != raw:
            raise ValueError('Source changed during preparation: ' + name)
    validate_scope()
    result = {'author': 'Andrew Fisher', 'baseManifestSha256': BASE,
              'dashboardBaseSha256': PAGE_BASE, 'releaseScopeSha256': SCOPE_SHA256,
              'sourceFiles': {name: {'sha256': sha(raw), 'bytes': len(raw)} for name, raw in files.items()},
              'sourceMutated': False, 'networkWrites': 0, 'browserChecksCompleted': False}
    (args.out / 'prepared.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
    return result


if __name__ == '__main__':
    run()
