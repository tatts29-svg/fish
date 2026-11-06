#!/usr/bin/env python3
"""Author: Andrew Fisher. Default read-only preparation; guarded retained-manifest map publication."""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os
import sys
import urllib.request

HERE = Path(__file__).resolve().parent
ALLOWED = {'explorer/explorer.js', 'explorer/explorer-merge.js', 'explorer/index.html'}
sha = lambda value: hashlib.sha256(value).hexdigest()


def validate_union(before, after, expected):
    old = {f['path']: f for f in before['files']}
    new = {f['path']: f for f in after['files']}
    if len(old) != len(before['files']) or len(new) != len(after['files']):
        raise ValueError('Duplicate manifest path')
    if old.keys() != new.keys():
        raise ValueError('Machine paths added or removed')
    changed = {key for key in old if old[key] != new[key]}
    if changed != ALLOWED or set(expected) != ALLOWED:
        raise ValueError('Manifest changed outside the exact three reviewed map files')
    for key, digest in expected.items():
        if new[key]['sha256'] != digest:
            raise ValueError('Unexpected candidate digest: ' + key)
    if after['entry'] != before['entry'] or after['schema'] != before['schema']:
        raise ValueError('Machine entry or schema changed')
    return len(old) - len(changed)


def run():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--keep', required=True, type=Path)
    ap.add_argument('--candidate-dir', required=True, type=Path)
    ap.add_argument('--out', required=True, type=Path)
    ap.add_argument('--expected-base', required=True, help='Exact current manifest SHA reviewed by the release owner')
    ap.add_argument('--machine-tool', required=True, type=Path)
    ap.add_argument('--base', default='https://gc500-production.up.railway.app')
    ap.add_argument('--publish', action='store_true', help='Explicitly stage and register the reviewed three-file union')
    a = ap.parse_args()
    a.out.mkdir(parents=True, exist_ok=True)
    retained = json.loads(a.keep.read_text())
    evidence = json.loads((HERE / 'evidence/source-bound.json').read_text())
    expected = {name: item['candidate'] for name, item in evidence['changedFiles'].items()}
    if set(expected) != ALLOWED: raise ValueError('Unexpected reviewed file set')
    spec = importlib.util.spec_from_file_location('machine_set1010', a.machine_tool)
    machine = importlib.util.module_from_spec(spec); spec.loader.exec_module(machine)
    digest = sha(machine.canonical({key: retained[key] for key in ('schema', 'entry', 'files')}).encode())
    if digest != retained['sha256'] or digest != a.expected_base:
        raise ValueError('Retained manifest differs from the reviewed current base')
    old = {item['path']: item for item in retained['files']}
    for name, detail in evidence['changedFiles'].items():
        if old[name]['sha256'] != detail['base']:
            raise ValueError('Map input changed since source audit: ' + name)
        raw = (a.candidate_dir / Path(name).name).read_bytes()
        if sha(raw) != detail['candidate'] or len(raw) != detail['bytes']:
            raise ValueError('Candidate changed since source review: ' + name)
    original_urlopen = urllib.request.urlopen

    def current():
        request = urllib.request.Request(a.base.rstrip('/') + '/api/machine', headers={'x-gc500-token': 'Coates-GC500-2026'})
        with original_urlopen(request, timeout=45) as response:
            status = json.load(response)
        return status.get('status', status)

    def unchanged():
        status = current()
        if status.get('sha256') != digest or status.get('files') != len(retained['files']):
            raise ValueError('Live machine changed; rebuild the retained union')

    unchanged()
    if a.publish and not os.environ.get('GC500_EDIT_TOKEN'):
        raise ValueError('GC500_EDIT_TOKEN required for explicit publication')
    manifest_path = a.out / 'candidate-manifest.json'
    argv = ['machine_set.py', '--base', a.base, '--keep', str(a.keep), '--entry', retained['entry'],
            '--label', retained.get('label', 'The Coates Way machine and GC500 Map explorer'),
            '--version', 'v10.10-map-quantities', '--write-manifest', str(manifest_path)]
    for name in sorted(expected):
        argv += ['--add-file', str(a.candidate_dir / Path(name).name) + '=' + name]
    if not a.publish: argv.append('--dry-run')

    def guarded(request, *args, **kwargs):
        if isinstance(request, urllib.request.Request) and request.get_method() == 'POST' and request.full_url.endswith('/api/admin/machine/manifest'):
            proposed = json.loads(request.data)
            validate_union(retained, proposed, expected)
            unchanged()  # Repeat after staging blobs, immediately before registering the shared manifest.
        return original_urlopen(request, *args, **kwargs)

    previous_argv = sys.argv
    sys.argv = argv
    urllib.request.urlopen = guarded
    try: machine.main()
    finally:
        sys.argv = previous_argv
        urllib.request.urlopen = original_urlopen
    candidate = json.loads(manifest_path.read_text())
    kept = validate_union(retained, candidate, expected)
    result = {'author': 'Andrew Fisher', 'baseManifestSha256': digest, 'candidateManifestSha256': candidate['sha256'],
              'changedFiles': expected, 'otherFilesPreserved': kept, 'published': a.publish, 'recordWrites': 0}
    if a.publish:
        if current().get('sha256') != candidate['sha256']: raise ValueError('Registered manifest readback differs')
        for name, expected_digest in expected.items():
            url = a.base.rstrip('/') + '/w/Coates-GC500-2026/' + name + '?verify=' + expected_digest[:12]
            with original_urlopen(url, timeout=60) as response: raw = response.read()
            if sha(raw) != expected_digest: raise ValueError('Public bytes differ: ' + name)
        result['publicAssetsExact'] = True
    (a.out / ('publication.json' if a.publish else 'preparation.json')).write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))


if __name__ == '__main__': run()
