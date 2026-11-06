#!/usr/bin/env python3
"""Author: Andrew Fisher. Guarded three-file map publication; default is a no-write preparation."""
from pathlib import Path
import argparse
import contextlib
import importlib.util
import io
import json
import os
import sys
import urllib.parse
import urllib.request

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from machine1065 import BASE, HOST, PUBLIC_TOKEN, REPLACED, canonical, digest, sha, validate_inputs, validate_union, validate_server, validate_inventory, validate_inventory_stable, MACHINE_TOOL_SHA256, SERVER_BUILD, SERVER_BLOBS


def load_machine(path):
    spec = importlib.util.spec_from_file_location('shared_machine_set1065', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--keep', required=True, type=Path)
    parser.add_argument('--candidate-dir', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--evidence', required=True, type=Path)
    parser.add_argument('--expected-base', required=True)
    parser.add_argument('--machine-tool', required=True, type=Path)
    parser.add_argument('--base', default=HOST)
    parser.add_argument('--publish', action='store_true', help='Explicitly stage three reviewed blobs and register the retained union')
    parser.add_argument('--preflight', action='store_true', help='Read-only authenticated server and full inventory readiness checks; no writes unless --publish')
    args = parser.parse_args(argv)
    if args.base.rstrip('/') != HOST:
        raise ValueError('Publication is restricted to the established GC500 host')
    if args.out.exists() and (not args.out.is_dir() or any(args.out.iterdir())):
        raise ValueError('Use a fresh empty output directory; never reuse a prior publication receipt')
    retained = json.loads(args.keep.read_text())
    evidence = json.loads(args.evidence.read_text())
    expected = validate_inputs(retained, evidence, args.candidate_dir, args.expected_base)
    if sha(args.machine_tool.read_bytes()) != MACHINE_TOOL_SHA256:
        raise ValueError('Shared machine_set.py differs from the reviewed tool')
    machine = load_machine(args.machine_tool)
    if machine.canonical(retained) != canonical(retained):
        raise ValueError('Shared machine canonical format differs')
    original_urlopen = urllib.request.urlopen
    secret = os.environ.get('GC500_EDIT_TOKEN', '') if (args.publish or args.preflight) else ''
    registered = False
    staged = set()

    def read_json(path, token=PUBLIC_TOKEN):
        request = urllib.request.Request(HOST + path, headers={'x-gc500-token': token})
        with original_urlopen(request, timeout=45) as response:
            return json.load(response)

    def unchanged():
        value = read_json('/api/machine')
        status = value.get('status', value)
        if status.get('sha256') != BASE or status.get('files') != 236:
            raise ValueError('Live machine changed; rebuild the retained union')

    unchanged()
    baseline_inventory = None
    if args.publish or args.preflight:
        if not secret:
            raise ValueError('GC500_EDIT_TOKEN required for authenticated preflight or publication')
        if read_json('/api/version', secret).get('level') != 'edit':
            raise ValueError('Service has not confirmed edit access')
        validate_server(read_json('/health'))
        baseline_inventory = validate_inventory(read_json('/api/admin/machine', secret), retained, expected)
    args.out.mkdir(parents=True, exist_ok=True)
    manifest_path = args.out / 'candidate-manifest.json'
    tool_argv = ['machine_set.py', '--base', HOST, '--keep', str(args.keep), '--entry', retained['entry'],
                 '--label', retained.get('label', 'The Coates Way machine and GC500 Map explorer'),
                 '--version', 'v10.65-map-navigation', '--write-manifest', str(manifest_path)]
    for path in sorted(REPLACED):
        tool_argv += ['--add-file', str(args.candidate_dir / path) + '=' + path]
    if not args.publish:
        tool_argv.append('--dry-run')

    def guarded(request, *call_args, **kwargs):
        nonlocal registered
        method = request.get_method() if isinstance(request, urllib.request.Request) else 'GET'
        if args.publish and method == 'GET' and request.full_url == HOST + '/api/admin/machine':
            # The shared publisher's inventory read is the last step before its uploads.
            response = original_urlopen(request, *call_args, **kwargs)
            with response:
                raw = response.read()
            current = validate_inventory(json.loads(raw), retained, expected)
            validate_inventory_stable(baseline_inventory, current, expected, staged)
            replay = io.BytesIO(raw)
            replay.status = 200
            return replay
        if method not in ('GET', 'HEAD'):
            if not args.publish:
                raise ValueError('Dry run cannot send network writes')
            url = request.full_url
            if method == 'PUT' and url.startswith(HOST + '/api/admin/machine/blob/'):
                blob_sha = url.removeprefix(HOST + '/api/admin/machine/blob/')
                candidates = [item for item in expected.values() if item['sha256'] == blob_sha]
                raw = request.data or b''
                if registered or blob_sha in staged:
                    raise ValueError('Blob may only be staged once, before manifest registration')
                if not candidates or sha(raw) != blob_sha or len(raw) != candidates[0]['bytes']:
                    raise ValueError('Refusing an unreviewed blob upload')
                response = original_urlopen(request, *call_args, **kwargs)
                if response.status == 200:
                    staged.add(blob_sha)
                return response
            elif method == 'POST' and url == HOST + '/api/admin/machine/manifest':
                if registered:
                    raise ValueError('Manifest may only be registered once')
                proposed = json.loads(request.data)
                validate_union(retained, proposed, expected)
                if proposed.get('version') != 'v10.65-map-navigation' or proposed.get('label') != retained.get('label', 'The Coates Way machine and GC500 Map explorer'):
                    raise ValueError('Unexpected manifest metadata')
                # Reject changed source/evidence/candidate after the initial review.
                if json.loads(args.keep.read_text()) != retained or json.loads(args.evidence.read_text()) != evidence:
                    raise ValueError('Publication inputs changed during staging')
                validate_inputs(retained, evidence, args.candidate_dir, args.expected_base)
                if sha(args.machine_tool.read_bytes()) != MACHINE_TOOL_SHA256:
                    raise ValueError('Shared publisher changed during staging')
                validate_server(read_json('/health'))
                final_inventory = validate_inventory(read_json('/api/admin/machine', secret), retained, expected)
                validate_inventory_stable(baseline_inventory, final_inventory, expected, staged)
                if any(final_inventory.get(item['sha256']) != item['bytes'] for item in expected.values()):
                    raise ValueError('A reviewed candidate blob is missing before registration')
                # This narrows, but cannot eliminate, the GET-to-POST race. One coordinated publisher is required.
                unchanged()  # Last operation before the single active-manifest write.
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
        log = output.getvalue()
        print(log.replace(secret, '[REDACTED]') if secret else log, end='')
    candidate = json.loads(manifest_path.read_text())
    kept = validate_union(retained, candidate, expected)
    result = {'author': 'Andrew Fisher', 'baseManifestSha256': BASE,
              'candidateManifestSha256': candidate['sha256'],
              'changedFiles': {path: expected[path]['sha256'] for path in sorted(REPLACED)},
              'addedFiles': {}, 'stagedBlobs': len(staged), 'otherFilesPreserved': kept,
              'totalFiles': len(candidate['files']), 'published': args.publish, 'recordWrites': 0,
              'serverPreflightPassed': baseline_inventory is not None}
    if args.publish:
        if not registered:
            raise ValueError('Publication requested but no manifest was registered')
        value = read_json('/api/machine')
        status = value.get('status', value)
        if status.get('sha256') != candidate['sha256'] or status.get('files') != 236:
            raise ValueError('Registered manifest readback differs')
        for path, detail in expected.items():
            url = HOST + '/w/' + PUBLIC_TOKEN + '/' + urllib.parse.quote(path) + '?verify=' + detail['sha256'][:12]
            with original_urlopen(url, timeout=60) as response:
                raw = response.read()
            if sha(raw) != detail['sha256'] or len(raw) != detail['bytes']:
                raise ValueError('Public bytes differ: ' + path)
        result['publicAssetsExact'] = True
        result['reviewedServerBuild'] = SERVER_BUILD
        result['inventoryStableBeforeRegistration'] = True
        result['protectedBlobsFromHandover'] = sorted(SERVER_BLOBS)
        # The active manifest now differs, so validate full inventory directly. No unknown unlisted blobs survive.
        from machine1065 import inventory_map
        actual = inventory_map(read_json('/api/admin/machine', secret))
        wanted = {item['sha256']: item['bytes'] for item in candidate['files']}
        wanted.update(SERVER_BLOBS)
        if actual != wanted:
            raise ValueError('Post-registration inventory differs from candidate plus handover-protected server blobs')
        validate_server(read_json('/health'))
        result['postRegistrationInventoryExact'] = True
    (args.out / ('publication.json' if args.publish else 'preparation.json')).write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
    return result


if __name__ == '__main__':
    run()
