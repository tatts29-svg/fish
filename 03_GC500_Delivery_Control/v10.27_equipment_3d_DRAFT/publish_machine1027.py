#!/usr/bin/env python3
"""Author: Andrew Fisher. Prepare, or explicitly publish, the reviewed retained 3D map set."""
from pathlib import Path
import argparse
import contextlib
import hashlib
import importlib.util
import io
import json
import os
import re
import sys
import urllib.parse
import urllib.request

REPLACED = frozenset({
    'poc3d/index.html', 'explorer/explorer-merge.js', 'explorer/index.html',
})
ADDED = frozenset({
    'poc3d/equipment_geometry1027.js', 'poc3d/equipment_viewer1027.js',
    'poc3d/equipment_layout1027.js',
})
ALLOWED = REPLACED | ADDED
PUBLIC_TOKEN = 'Coates-GC500-2026'
HEX_SHA = re.compile(r'^[0-9a-f]{64}$')


def sha(value):
    return hashlib.sha256(value).hexdigest()


def file_map(manifest):
    rows = manifest['files']
    mapped = {row['path']: row for row in rows}
    if len(mapped) != len(rows):
        raise ValueError('Duplicate manifest path')
    return mapped


def validate_union(before, after, expected):
    """Reject any removal or unreviewed descriptor change, including retained MIME/size."""
    old, new = file_map(before), file_map(after)
    if set(expected) != ALLOWED:
        raise ValueError('Expected exactly the six reviewed 3D map files')
    if not REPLACED <= old.keys() or ADDED & old.keys():
        raise ValueError('Reviewed base must contain the three replacements and no new 3D modules')
    if new.keys() - old.keys() != ADDED or old.keys() - new.keys():
        raise ValueError('Machine paths added or removed outside the three reviewed modules')
    changed = {path for path in old if old[path] != new[path]}
    if changed != REPLACED:
        raise ValueError('Manifest changed outside the exact three reviewed replacements')
    for path, detail in expected.items():
        row = new[path]
        if row['sha256'] != detail['sha256'] or row['bytes'] != detail['bytes']:
            raise ValueError('Unexpected candidate digest or byte count: ' + path)
        mime = 'text/html; charset=utf-8' if path.endswith('.html') else 'text/javascript; charset=utf-8'
        if row['type'] != mime:
            raise ValueError('Unexpected candidate content type: ' + path)
    if after['entry'] != before['entry'] or after['schema'] != before['schema']:
        raise ValueError('Machine entry or schema changed')
    return len(old) - len(REPLACED)


def validate_inputs(retained, source_evidence, candidate_dir, expected_base, canonical):
    old = file_map(retained)
    digest = sha(canonical({key: retained[key] for key in ('schema', 'entry', 'files')}).encode())
    if digest != retained['sha256'] or digest != expected_base:
        raise ValueError('Retained manifest differs from the reviewed current base')
    rows = source_evidence['files']
    if set(rows) != ALLOWED:
        raise ValueError('Expected exactly the six reviewed source-bound files')
    expected = {}
    for path, detail in rows.items():
        if path in ADDED:
            if detail['base'] is not None or path in old:
                raise ValueError('New 3D module must have base=null and be absent from retained set: ' + path)
        elif path not in old or detail['base'] != old[path]['sha256']:
            raise ValueError('Map input changed since source audit: ' + path)
        if not isinstance(detail['sha256'], str) or not HEX_SHA.fullmatch(detail['sha256']):
            raise ValueError('Invalid reviewed candidate digest: ' + path)
        if type(detail['bytes']) is not int or detail['bytes'] <= 0:
            raise ValueError('Invalid reviewed candidate byte count: ' + path)
        raw = (candidate_dir / path).read_bytes()
        if sha(raw) != detail['sha256'] or len(raw) != detail['bytes']:
            raise ValueError('Candidate changed since source review: ' + path)
        if path in REPLACED and detail['sha256'] == detail['base']:
            raise ValueError('Reviewed replacement is unchanged: ' + path)
        expected[path] = {'sha256': detail['sha256'], 'bytes': detail['bytes']}
    return digest, expected


def run(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--keep', required=True, type=Path)
    parser.add_argument('--candidate-dir', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--evidence', required=True, type=Path, help='Reviewed source-bound.json')
    parser.add_argument('--expected-base', required=True, help='Exact reviewed current manifest SHA-256')
    parser.add_argument('--machine-tool', required=True, type=Path)
    parser.add_argument('--base', default='https://gc500-production.up.railway.app')
    parser.add_argument('--publish', action='store_true', help='Explicitly stage six reviewed files and register the retained union')
    args = parser.parse_args(argv)
    retained = json.loads(args.keep.read_text())
    source_evidence = json.loads(args.evidence.read_text())
    spec = importlib.util.spec_from_file_location('machine_set1027', args.machine_tool)
    machine = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(machine)
    digest, expected = validate_inputs(retained, source_evidence, args.candidate_dir, args.expected_base, machine.canonical)
    original_urlopen = urllib.request.urlopen
    base = args.base.rstrip('/')

    def current():
        request = urllib.request.Request(base + '/api/machine', headers={'x-gc500-token': PUBLIC_TOKEN})
        with original_urlopen(request, timeout=45) as response:
            status = json.load(response)
        return status.get('status', status)

    def unchanged():
        status = current()
        if status.get('sha256') != digest or status.get('files') != len(retained['files']):
            raise ValueError('Live machine changed; rebuild the retained union')

    unchanged()
    secret = os.environ.get('GC500_EDIT_TOKEN', '') if args.publish else ''
    if args.publish and not secret:
        raise ValueError('GC500_EDIT_TOKEN required for explicit publication')
    args.out.mkdir(parents=True, exist_ok=True)
    manifest_path = args.out / 'candidate-manifest.json'
    tool_argv = ['machine_set.py', '--base', base, '--keep', str(args.keep), '--entry', retained['entry'],
                 '--label', retained.get('label', 'The Coates Way machine and GC500 Map explorer'),
                 '--version', 'v10.27-equipment-3d', '--write-manifest', str(manifest_path)]
    for path in sorted(expected):
        tool_argv += ['--add-file', str(args.candidate_dir / path) + '=' + path]
    if not args.publish:
        tool_argv.append('--dry-run')
    registered = False

    def guarded(request, *call_args, **kwargs):
        nonlocal registered
        method = request.get_method() if isinstance(request, urllib.request.Request) else 'GET'
        if method not in ('GET', 'HEAD'):
            if not args.publish:
                raise ValueError('Dry run cannot send network writes')
            url = request.full_url
            if method == 'PUT' and url.startswith(base + '/api/admin/machine/blob/'):
                blob_sha = url.removeprefix(base + '/api/admin/machine/blob/')
                candidates = [item for item in expected.values() if item['sha256'] == blob_sha]
                raw = request.data or b''
                if not candidates or sha(raw) != blob_sha or len(raw) != candidates[0]['bytes']:
                    raise ValueError('Refusing an unreviewed blob upload')
            elif method == 'POST' and url == base + '/api/admin/machine/manifest':
                if registered:
                    raise ValueError('Manifest may only be registered once')
                proposed = json.loads(request.data)
                validate_union(retained, proposed, expected)
                calculated = sha(machine.canonical({key: proposed[key] for key in ('schema', 'entry', 'files')}).encode())
                if proposed['sha256'] != calculated:
                    raise ValueError('Candidate manifest digest does not match its contents')
                unchanged()  # After all blob staging; immediately before the one manifest registration.
                registered = True
            else:
                raise ValueError('Refusing an unexpected network write')
        return original_urlopen(request, *call_args, **kwargs)

    previous_argv = sys.argv
    output = io.StringIO()
    sys.argv = tool_argv
    urllib.request.urlopen = guarded
    try:
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            machine.main()
    except (Exception, SystemExit) as error:
        if secret and secret in str(error):
            raise RuntimeError(str(error).replace(secret, '[REDACTED]')) from None
        raise
    finally:
        sys.argv = previous_argv
        urllib.request.urlopen = original_urlopen
        # The report never contains credentials, including tool diagnostics on a failure.
        log = output.getvalue()
        print(log.replace(secret, '[REDACTED]') if secret else log, end='')
    candidate = json.loads(manifest_path.read_text())
    kept = validate_union(retained, candidate, expected)
    calculated = sha(machine.canonical({key: candidate[key] for key in ('schema', 'entry', 'files')}).encode())
    if candidate['sha256'] != calculated:
        raise ValueError('Candidate manifest digest does not match its contents')
    result = {'author': 'Andrew Fisher', 'baseManifestSha256': digest,
              'candidateManifestSha256': candidate['sha256'], 'changedFiles': {p: expected[p]['sha256'] for p in sorted(REPLACED)},
              'addedFiles': {p: expected[p]['sha256'] for p in sorted(ADDED)},
              'otherFilesPreserved': kept, 'totalFiles': len(candidate['files']),
              'published': args.publish, 'recordWrites': 0}
    if args.publish:
        if not registered:
            raise ValueError('Publication requested but no manifest was registered')
        status = current()
        if status.get('sha256') != candidate['sha256'] or status.get('files') != len(candidate['files']):
            raise ValueError('Registered manifest readback differs')
        for path, detail in expected.items():
            url = base + '/w/' + PUBLIC_TOKEN + '/' + urllib.parse.quote(path) + '?verify=' + detail['sha256'][:12]
            with original_urlopen(url, timeout=60) as response:
                raw = response.read()
            if sha(raw) != detail['sha256'] or len(raw) != detail['bytes']:
                raise ValueError('Public bytes differ: ' + path)
        result['publicAssetsExact'] = True
    (args.out / ('publication.json' if args.publish else 'preparation.json')).write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
    return result


if __name__ == '__main__':
    run()
