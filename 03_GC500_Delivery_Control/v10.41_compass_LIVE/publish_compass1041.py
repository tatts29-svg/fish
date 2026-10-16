#!/usr/bin/env python3
"""Author: Andrew Fisher. Prepare, or explicitly publish, the bounded v10.41 compass refinement."""
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

EXPECTED_BASE = '86eb69168f5e08b369ff1a41758140fabf36fc28fcc81fb705605322b128fcc3'
REPLACED = frozenset({
    'poc3d/index.html', 'explorer/explorer-merge.js', 'explorer/index.html',
    'poc3d/equipment_viewer1027.js',
})
PROTECTED = frozenset({'poc3d/equipment_geometry1027.js', 'poc3d/equipment_layout1027.js'})
REVIEWED = REPLACED | PROTECTED
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
    """Exactly four reviewed descriptor changes; all 232 others stay identical."""
    old, new = file_map(before), file_map(after)
    if len(old) != 236 or not REVIEWED <= old.keys():
        raise ValueError('Expected the current 236-file equipment map set')
    if set(expected) != REPLACED:
        raise ValueError('Expected exactly the four reviewed refinement files')
    if old.keys() != new.keys():
        raise ValueError('Refinement cannot add or remove machine paths')
    changed = {path for path in old if old[path] != new[path]}
    if changed != REPLACED:
        raise ValueError('Refinement changed outside the exact four reviewed replacements')
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
    if digest != retained['sha256'] or digest != expected_base or digest != EXPECTED_BASE:
        raise ValueError('Retained manifest differs from the pinned current v10.27 base')
    if len(old) != 236 or not REVIEWED <= old.keys():
        raise ValueError('Expected the current 236-file equipment map set')
    rows = source_evidence['files']
    if set(rows) != REVIEWED:
        raise ValueError('Expected exactly the six reviewed source-bound files')
    expected = {}
    for path, detail in rows.items():
        # source-bound.base records the original build lineage. The explicit,
        # hash-pinned retained manifest above is the base for this refinement.
        if not isinstance(detail['sha256'], str) or not HEX_SHA.fullmatch(detail['sha256']):
            raise ValueError('Invalid reviewed candidate digest: ' + path)
        if type(detail['bytes']) is not int or detail['bytes'] <= 0:
            raise ValueError('Invalid reviewed candidate byte count: ' + path)
        raw = (candidate_dir / path).read_bytes()
        if sha(raw) != detail['sha256'] or len(raw) != detail['bytes']:
            raise ValueError('Candidate changed since source review: ' + path)
        same = detail['sha256'] == old[path]['sha256'] and detail['bytes'] == old[path]['bytes']
        if path in PROTECTED:
            if not same:
                raise ValueError('Geometry and layout must remain unchanged: ' + path)
        else:
            if same or detail['sha256'] == old[path]['sha256']:
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
    parser.add_argument('--publish', action='store_true', help='Explicitly stage the four reviewed replacements and preserve all other files')
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
                 '--version', 'v10.41-compass-containment', '--write-manifest', str(manifest_path)]
    for path in sorted(expected):
        tool_argv += ['--add-file', str(args.candidate_dir / path) + '=' + path]
    if not args.publish:
        tool_argv.append('--dry-run')
    registered = False
    staged = set()

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
                if registered or blob_sha in staged:
                    raise ValueError('Blob may only be staged once, before manifest registration')
                raw = request.data or b''
                if not candidates or sha(raw) != blob_sha or len(raw) != candidates[0]['bytes']:
                    raise ValueError('Refusing an unreviewed blob upload')
                staged.add(blob_sha)
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
              'addedFiles': {}, 'protectedFiles': {p: file_map(retained)[p]['sha256'] for p in sorted(PROTECTED)},
              'stagedBlobs': len(staged),
              'otherFilesPreserved': kept, 'totalFiles': len(candidate['files']),
              'published': args.publish, 'recordWrites': 0}
    if args.publish:
        if not registered:
            raise ValueError('Publication requested but no manifest was registered')
        status = current()
        if status.get('sha256') != candidate['sha256'] or status.get('files') != len(candidate['files']):
            raise ValueError('Registered manifest readback differs')
        public_files = {**expected, **{p: file_map(retained)[p] for p in PROTECTED}}
        for path, detail in public_files.items():
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
