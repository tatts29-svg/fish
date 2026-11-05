#!/usr/bin/env python3
"""Author: Andrew Fisher. Guarded workshop-only publication; default is a no-write preparation.

The default is GET-only preparation. Publication retains the dashboard byte for byte.
All 236 prior machine paths remain; only the approved workshop modules may change.
The service has no proven atomic expected-old registration: one coordinated publisher
is required; the wrapper rechecks page and machine immediately before registration.
"""
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

DASHBOARD_BASE_SHA256 = '2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b'
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from machine1302 import BASE, HOST, PUBLIC_TOKEN, VERSION, canonical, digest, sha, validate_inputs, validate_union, validate_tree, validate_inventory, validate_inventory_stable
from protected_server1302 import validate_server, MACHINE_TOOL_SHA256, SERVER_BUILD, SERVER_BLOBS, inventory_map
from build1302 import transport


def load_machine(path):
    spec = importlib.util.spec_from_file_location('shared_machine_set1302', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def validate_browser_checks(args, expected, candidate):
    if len(args.check) != 4 or len({p.resolve() for p in args.check}) != 4:
        raise ValueError('Publication requires four distinct desktop/phone machine/dashboard browser receipts')
    seen = set()
    for path in args.check:
        value = json.loads(path.read_text())
        identity = (value.get('suite'), value.get('viewport'))
        if identity in seen or identity not in {
                ('machine1302', 'desktop'), ('machine1302', 'phone'),
                ('dashboard1302', 'desktop'), ('dashboard1302', 'phone')}:
            raise ValueError('Unexpected or duplicate browser suite')
        seen.add(identity)
        if (value.get('passed') is not True or value.get('errors') != []
                or value.get('consoleErrors') != [] or value.get('recordWrites') != 0
                or value.get('machineFiles') != {p: d['sha256'] for p, d in expected.items()}
                or value.get('machineManifestSha256') != candidate['sha256']
                or value.get('dashboardSha256') != DASHBOARD_BASE_SHA256):
            raise ValueError('Browser evidence is incomplete or belongs to different candidate bytes')
    return {str(path.resolve()): sha(path.read_bytes()) for path in args.check}


def _run(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--keep', required=True, type=Path)
    parser.add_argument('--candidate-dir', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--evidence', required=True, type=Path)
    parser.add_argument('--expected-base', required=True)
    parser.add_argument('--machine-tool', required=True, type=Path)
    parser.add_argument('--base', default=HOST)
    parser.add_argument('--publish', action='store_true', help='Explicitly stage only reviewed workshop blobs and register the retained union')
    parser.add_argument('--manifest', required=True, type=Path, help='Exact final manifest used by browser checks')
    parser.add_argument('--check', action='append', type=Path, default=[])
    parser.add_argument('--preflight', action='store_true', help='Read-only authenticated server and full inventory readiness checks; no writes unless --publish')
    args = parser.parse_args(argv)
    if args.base.rstrip('/') != HOST:
        raise ValueError('Publication is restricted to the established GC500 host')
    if args.out.exists() and (not args.out.is_dir() or any(args.out.iterdir())):
        raise ValueError('Use a fresh empty output directory; never reuse a prior publication receipt')
    if HERE.parents[2] in args.out.resolve().parents:
        raise ValueError('Publication receipts belong outside the checkout')
    retained = json.loads(args.keep.read_text())
    evidence = json.loads(args.evidence.read_text())
    if args.expected_base != BASE:
        raise ValueError('Expected old manifest must equal the pinned current machine')
    expected = validate_inputs(retained, evidence, args.candidate_dir)
    candidate = json.loads(args.manifest.read_text())
    validate_union(retained, candidate, expected)
    validate_tree(candidate, args.candidate_dir)
    if sha(args.machine_tool.read_bytes()) != MACHINE_TOOL_SHA256:
        raise ValueError('Shared machine_set.py differs from the reviewed tool')
    machine = load_machine(args.machine_tool)
    if machine.canonical(retained) != canonical(retained):
        raise ValueError('Shared machine canonical format differs')
    checks = validate_browser_checks(args, expected, candidate) if args.publish else None
    original_urlopen = transport
    secret = os.environ.get('GC500_EDIT_TOKEN', '') if (args.publish or args.preflight) else ''
    if any(ord(character) < 32 or ord(character) == 127 for character in secret):
        raise ValueError('Configured edit credential contains invalid control characters')
    registered = False
    staged = set()

    def read_json(path, token=PUBLIC_TOKEN):
        request = urllib.request.Request(HOST + path, headers={'x-gc500-token': token})
        with original_urlopen(request, timeout=45) as response:
            return json.load(response)

    def unchanged():
        req = urllib.request.Request(HOST + '/v/' + PUBLIC_TOKEN, headers={'Cache-Control': 'no-store'})
        with original_urlopen(req, timeout=45) as response:
            if sha(response.read()) != DASHBOARD_BASE_SHA256:
                raise ValueError('Live dashboard changed from the reviewed v13.01 base')
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
    args.out.mkdir(parents=True, exist_ok=True, mode=0o700)
    def journal(state):
        if args.publish:
            value = {'author': 'Andrew Fisher', 'state': state, 'baseManifestSha256': BASE,
                     'candidateManifestSha256': candidate['sha256'], 'stagedBlobs': sorted(staged),
                     'dashboardBaseSha256': DASHBOARD_BASE_SHA256, 'recordWrites': 0}
            temporary = args.out / 'publication-attempt.tmp'
            temporary.write_text(json.dumps(value, indent=2) + '\n')
            temporary.replace(args.out / 'publication-attempt.json')
    journal('preflight-complete')
    manifest_path = args.out / 'candidate-manifest.json'
    tool_argv = ['machine_set.py', '--base', HOST, '--keep', str(args.keep), '--entry', retained['entry'],
                 '--label', retained.get('label', 'The Coates Way machine and GC500 Map explorer'),
                 '--version', VERSION, '--write-manifest', str(manifest_path)]
    for path in sorted(expected):
        tool_argv += ['--add-file', str(args.candidate_dir / path) + '=' + path]
    if not args.publish:
        tool_argv.append('--dry-run')

    def guarded(request, *call_args, **kwargs):
        nonlocal registered
        # urlopen(url, data=...) is a POST, including when data is positional.
        # urlopen(Request, data) can also replace Request.data before dispatch.
        supplied_data = kwargs.get('data', call_args[0] if call_args else None)
        is_request = isinstance(request, urllib.request.Request)
        raw_data = supplied_data if supplied_data is not None else (request.data if is_request else None)
        url = request.full_url if is_request else request
        method = getattr(request, 'method', None) if is_request else None
        method = method or ('POST' if raw_data is not None else 'GET')
        if urllib.parse.urlsplit(url).netloc != urllib.parse.urlsplit(HOST).netloc or not url.startswith(HOST + '/'):
            raise ValueError('Shared publisher cannot access another origin')
        if args.publish and method == 'GET' and url == HOST + '/api/admin/machine':
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
            if method == 'PUT' and url.startswith(HOST + '/api/admin/machine/blob/'):
                blob_sha = url.removeprefix(HOST + '/api/admin/machine/blob/')
                candidates = [item for item in expected.values() if item['sha256'] == blob_sha]
                raw = raw_data or b''
                if registered or blob_sha in staged:
                    raise ValueError('Blob may only be staged once, before manifest registration')
                if not candidates or sha(raw) != blob_sha or len(raw) != candidates[0]['bytes']:
                    raise ValueError('Refusing an unreviewed blob upload')
                response = original_urlopen(request, *call_args, **kwargs)
                if response.status == 200:
                    staged.add(blob_sha)
                    journal('staging-reviewed-blobs')
                return response
            elif method == 'POST' and url == HOST + '/api/admin/machine/manifest':
                if registered:
                    raise ValueError('Manifest may only be registered once')
                proposed = json.loads(raw_data)
                validate_union(retained, proposed, expected)
                if proposed != candidate:
                    raise ValueError('Proposed manifest differs from the tested candidate')
                # Reject changed source/evidence/candidate after the initial review.
                if json.loads(args.keep.read_text()) != retained or json.loads(args.evidence.read_text()) != evidence:
                    raise ValueError('Publication inputs changed during staging')
                validate_inputs(retained, evidence, args.candidate_dir)
                validate_tree(candidate, args.candidate_dir)
                if json.loads(args.manifest.read_text()) != candidate:
                    raise ValueError('Frozen candidate manifest changed during staging')
                if validate_browser_checks(args, expected, candidate) != checks:
                    raise ValueError('Completed browser evidence changed during staging')
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
                journal('registration-outcome-pending')
                response = original_urlopen(request, *call_args, **kwargs)
                with response:
                    raw = response.read()
                    status = response.status
                if status == 200:
                    acknowledgment = json.loads(raw)
                    if acknowledgment.get('sha256') != candidate['sha256'] or acknowledgment.get('files') != len(candidate['files']):
                        journal('registration-response-unexpected')
                        raise ValueError('Registration response differs from the frozen candidate; inspect live state')
                    journal('registered-awaiting-public-verification')
                else:
                    journal('registration-refused')
                replay = io.BytesIO(raw)
                replay.status = status
                return replay
            else:
                raise ValueError('Refusing an unexpected network write')
        return original_urlopen(request, *call_args, **kwargs)

    previous_argv = sys.argv
    previous_urlopen = urllib.request.urlopen
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
        urllib.request.urlopen = previous_urlopen
        log = output.getvalue()
        print(log.replace(secret, '[REDACTED]') if secret else log, end='')
    generated = json.loads(manifest_path.read_text())
    if generated != candidate:
        raise ValueError('Shared publisher manifest differs from the tested candidate')
    kept = validate_union(retained, candidate, expected)
    result = {'author': 'Andrew Fisher', 'baseManifestSha256': BASE,
              'candidateManifestSha256': candidate['sha256'],
              'changedFiles': {path: expected[path]['sha256'] for path in sorted(expected)},
              'addedFiles': {path: expected[path]['sha256'] for path in sorted(expected) if path not in {row['path'] for row in retained['files']}}, 'stagedBlobs': len(staged), 'otherFilesPreserved': kept,
              'totalFiles': len(candidate['files']), 'published': args.publish, 'recordWrites': 0,
              'serverPreflightPassed': baseline_inventory is not None, 'dashboardBaseSha256': DASHBOARD_BASE_SHA256, 'testedDashboardSha256': DASHBOARD_BASE_SHA256 if checks else None, 'atomicCompareAndSwap': False}
    if args.publish:
        if not registered:
            raise ValueError('Publication requested but no manifest was registered')
        value = read_json('/api/machine')
        status = value.get('status', value)
        if status.get('sha256') != candidate['sha256'] or status.get('files') != len(candidate['files']):
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
        actual = inventory_map(read_json('/api/admin/machine', secret))
        wanted = {item['sha256']: item['bytes'] for item in candidate['files']}
        wanted.update(SERVER_BLOBS)
        if actual != wanted:
            raise ValueError('Post-registration inventory differs from candidate plus handover-protected server blobs')
        validate_server(read_json('/health'))
        result['postRegistrationInventoryExact'] = True
        req = urllib.request.Request(HOST + '/v/' + PUBLIC_TOKEN, headers={'Cache-Control': 'no-cache'})
        with original_urlopen(req, timeout=60) as response:
            if sha(response.read()) != DASHBOARD_BASE_SHA256:
                raise ValueError('Dashboard changed during machine publication')
        final_status = read_json('/api/machine')
        final_status = final_status.get('status', final_status)
        if final_status.get('sha256') != candidate['sha256'] or final_status.get('files') != len(candidate['files']):
            raise ValueError('Active manifest changed during public verification')
        result['dashboardUnchanged'] = True
        result['expectedOldCheckedImmediatelyBeforeRegistration'] = True
        journal('registered-and-publicly-verified')
    (args.out / ('publication.json' if args.publish else 'preparation.json')).write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
    return result


def run(argv=None):
    """Redact credential-bearing errors from every phase, including preflight/read-back."""
    secret = os.environ.get('GC500_EDIT_TOKEN', '')
    try:
        return _run(argv)
    except (Exception, SystemExit) as error:
        if secret and secret in str(error):
            raise RuntimeError(str(error).replace(secret, '[REDACTED]')) from None
        raise


if __name__ == '__main__':
    run()
