#!/usr/bin/env python3
"""Author: Andrew Fisher. Register reviewed map assets while retaining the exact shared machine set."""
from pathlib import Path
import hashlib
import importlib.util
import json
import os
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT.parent
HOST = 'https://gc500-production.up.railway.app'
ALLOWED = {'explorer/explorer.js', 'explorer/index.html', 'explorer/explorer-merge.js', 'poc3d/index.html'}
sha = lambda b: hashlib.sha256(b).hexdigest()

def run():
    if len(sys.argv) != 4 or sys.argv[1] not in ('prepare', 'publish'):
        raise SystemExit('Use prepare|publish RETAINED_MANIFEST PRIVATE_OUTPUT_DIRECTORY')
    mode, keep, private = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3])
    private.mkdir(parents=True, exist_ok=True)
    reviewed = json.loads((ROOT / 'evidence/ready813.json').read_text())
    retained = json.loads(keep.read_text())
    spec = importlib.util.spec_from_file_location('machine_set', PROJECT / 'satellite_explorer/tools/machine_set.py')
    machine = importlib.util.module_from_spec(spec); spec.loader.exec_module(machine)
    digest = sha(machine.canonical({k: retained[k] for k in ('schema', 'entry', 'files')}).encode())
    assert digest == retained['sha256'] == reviewed['baseManifestSha256'], 'Retained manifest differs from reviewed base'
    files = reviewed['machineFiles']
    assert files and set(files) <= ALLOWED, 'Unexpected machine path'
    for name, expected in files.items():
        assert sha((ROOT / 'release' / name).read_bytes()) == expected, 'Candidate changed: ' + name
    original = urllib.request.urlopen
    token = os.environ.get('GC500_EDIT_TOKEN')
    assert token, 'GC500_EDIT_TOKEN is required'

    def current():
        req = urllib.request.Request(HOST + '/api/admin/machine', headers={'x-gc500-token': token})
        with original(req, timeout=120) as response:
            return json.load(response)['status']

    def unchanged():
        assert current()['sha256'] == digest, 'Live machine changed: rebuild the union before registering'

    unchanged()
    args = ['machine_set.py', '--base', HOST, '--keep', str(keep), '--entry', retained['entry'],
            '--label', retained['label'], '--version', 'v8.13-maps-satellite',
            '--write-manifest', str(private / 'candidate-manifest.json')]
    for name in sorted(files):
        args += ['--add-file', str(ROOT / 'release' / name) + '=' + name]
    if mode == 'prepare': args.append('--dry-run')

    def guarded(req, *a, **kw):
        if isinstance(req, urllib.request.Request) and req.get_method() == 'POST' and req.full_url.endswith('/api/admin/machine/manifest'):
            unchanged()  # after staging blobs, immediately before the shared registration
            proposed = json.loads(req.data)
            before = {f['path']: f for f in retained['files']}
            after = {f['path']: f for f in proposed['files']}
            assert before.keys() == after.keys(), 'No machine files may be added or removed in this release'
            diff = sorted(k for k in before if before[k] != after[k])
            assert diff == sorted(files), 'Manifest differs outside the reviewed map paths'
        return original(req, *a, **kw)

    urllib.request.urlopen = guarded
    sys.argv = args
    try: machine.main()
    finally: urllib.request.urlopen = original
    candidate = json.loads((private / 'candidate-manifest.json').read_text())
    before = {f['path']: f for f in retained['files']}
    after = {f['path']: f for f in candidate['files']}
    assert before.keys() == after.keys()
    assert sorted(k for k in before if before[k] != after[k]) == sorted(files)
    result = {'author': 'Andrew Fisher', 'baseManifestSha256': digest, 'candidateManifestSha256': candidate['sha256'],
              'changedFiles': files, 'otherFilesPreserved': len(before) - len(files), 'published': mode == 'publish'}
    if mode == 'publish':
        assert current()['sha256'] == candidate['sha256'], 'Registered manifest readback differs'
        for name, expected in files.items():
            with original(HOST + '/w/Coates-GC500-2026/' + name + '?verify=' + expected[:12], timeout=180) as response:
                assert sha(response.read()) == expected, 'Public asset differs: ' + name
        result['publicAssetsExact'] = True
    (private / ('publication.json' if mode == 'publish' else 'preparation.json')).write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))

if __name__ == '__main__': run()
