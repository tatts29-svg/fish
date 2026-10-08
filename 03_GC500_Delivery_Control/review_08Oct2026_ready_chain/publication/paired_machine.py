#!/usr/bin/env python3
"""Author: Andrew Fisher. Stage exact machine blobs separately from guarded publication.

No page, media or operational-record endpoint is implemented. --stage-only never
registers a manifest; --publish refuses missing blobs before using the reviewed
v8.93 publisher's registration and public-readback procedure.
"""
import argparse
import contextlib
import copy
import fcntl
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import sys
import tempfile

CONTROL = Path(__file__).resolve().parents[2]
HEX = re.compile(r'^[a-f0-9]{64}$')


class GuardError(Exception):
    pass


def require(condition, message):
    if not condition:
        raise GuardError(message)


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def parse(raw):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            require(key not in result, 'Duplicate JSON key')
            result[key] = value
        return result
    try:
        return json.loads(raw, object_pairs_hook=unique)
    except (ValueError, UnicodeError):
        raise GuardError('Invalid JSON input or response') from None


def load_publisher(path):
    spec = importlib.util.spec_from_file_location('reviewed_machine893', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def prepare(args, publisher, planner=None):
    """Pure local preparation; every returned payload is immutable reviewed bytes."""
    planner = planner or publisher.plan
    frozen_raw = Path(args.frozen_manifest).read_bytes()
    base_raw = Path(args.base_manifest).read_bytes()
    require(HEX.fullmatch(args.expect_manifest_file) and sha(frozen_raw) == args.expect_manifest_file,
            'Frozen manifest file differs from the reviewed file SHA-256')
    frozen, before = parse(frozen_raw), parse(base_raw)
    require(HEX.fullmatch(args.expect_candidate) and frozen.get('sha256') == args.expect_candidate,
            'Frozen machine digest differs from --expect-candidate')
    for manifest, name in ((frozen, 'Frozen'), (before, 'Base')):
        require(manifest.get('schema') == 'gc500-machine-v1' and isinstance(manifest.get('files'), list),
                name + ' manifest schema is invalid')
        require(publisher.digest_of(manifest.get('entry'), manifest['files']) == manifest.get('sha256'),
                name + ' manifest canonical digest is invalid')
        paths = [row.get('path') for row in manifest['files']]
        require(all(isinstance(path, str) for path in paths) and paths == sorted(set(paths)),
                name + ' manifest paths are not unique and sorted')
    require(isinstance(frozen.get('version'), str) and isinstance(frozen.get('label'), str),
            'Frozen machine version and label are required')
    publisher.VERSION, publisher.LABEL = frozen['version'], frozen['label']
    try:
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            base, candidate, local, delta = planner(args.base_manifest, args.code, args.assets,
                                                  args.over, args.readme)
    except SystemExit:
        raise GuardError('Reviewed publisher rejected the local machine plan') from None
    require(base == before and candidate == frozen,
            'Computed machine plan differs from the full frozen manifest, including metadata')
    descriptors = {row['path']: row for row in frozen['files']}
    payloads = {}
    for path, body in local.items():
        row = descriptors.get(path)
        require(row is not None and isinstance(body, bytes) and len(body) == row['bytes'] and sha(body) == row['sha256'],
                'Local machine payload differs from the frozen manifest')
        payloads[row['sha256']] = body
    return {'base': before, 'manifest': frozen, 'local': local, 'delta': delta, 'payloads': payloads,
            'frozen_file_sha256': sha(frozen_raw), 'base_file_sha256': sha(base_raw)}


def inventory(value):
    require(isinstance(value, dict) and isinstance(value.get('blobs'), list), 'Machine inventory is missing')
    result = {}
    for row in value['blobs']:
        digest, size = row.get('sha256'), row.get('bytes')
        require(isinstance(digest, str) and HEX.fullmatch(digest) and type(size) is int and size > 0 and digest not in result,
                'Machine inventory contains an invalid or duplicate blob')
        result[digest] = size
    return result


class GuardedTransport:
    def __init__(self, transport, package, mode, report, save, verify_inputs):
        self.transport, self.package, self.mode = transport, package, mode
        self.report, self.save, self.verify_inputs = report, save, verify_inputs

    def call(self, method, path, body=None, ctype='application/json', token=None, timeout=600):
        allowed_get = path in ('/api/version', '/api/admin/machine', '/api/machine') or path.startswith('/w/Coates-GC500-2026/')
        require(method == 'GET' and allowed_get or method in ('PUT', 'POST'), 'Request is outside machine publication scope')
        if method == 'PUT':
            require(self.mode == 'stage-only' and re.fullmatch(r'/api/admin/machine/blob/[a-f0-9]{64}', path),
                    'Blob PUT is forbidden in this phase')
            digest = path.rsplit('/', 1)[-1]
            require(body == self.package['payloads'].get(digest) and sha(body) == digest,
                    'Outgoing staged blob is not a frozen payload')
        if method == 'POST':
            require(self.mode == 'publish' and path == '/api/admin/machine/manifest',
                    'Manifest registration is forbidden in this phase')
            require(self.report['post_attempts'] == 0, 'A manifest POST was already attempted; no automatic retry')
            require(parse(body) == self.package['manifest'], 'Outgoing manifest differs from the full frozen manifest')
            self.verify_inputs()
            self.check_base(token, require_complete=True)
            self.report['post_attempts'] = 1
            self.report['state'] = 'registration-attempted-outcome-unconfirmed'
            self.save()
        self.report['requests'].append({'method': method, 'path': path})
        try:
            return self.transport(method, path, body, ctype, token, timeout)
        except Exception:
            raise GuardError(method + ' transport failed; inspect current machine state before retrying') from None

    def get(self, path, token):
        status, raw = self.call('GET', path, token=token)
        require(status == 200, 'Required machine GET did not return HTTP 200')
        return parse(raw)

    def check_base(self, token, require_complete=False):
        value = self.get('/api/admin/machine', token)
        require((value.get('status') or {}).get('sha256') == self.package['base']['sha256'],
                'Live machine base changed; nothing further may be registered')
        have = inventory(value)
        missing = {row['sha256']: row['bytes'] for row in self.package['manifest']['files']
                   if have.get(row['sha256']) != row['bytes']}
        require(all(digest in self.package['payloads'] for digest in missing),
                'A retained machine blob is absent; no staging or publication permitted')
        if require_complete:
            require(not missing, 'Machine blobs are not fully staged; --publish never uploads blobs')
        return have, missing


def execute(args, publisher, mode, token, save=lambda: None, report=None):
    """Local preparation followed by a denylisted phase; injectable transport for offline tests."""
    report = report if report is not None else {}
    report.update(author='Andrew Fisher', mode=mode, state='preflight', requests=[], uploads=[], post_attempts=0)
    planner, raw_call = publisher.plan, publisher.call
    package = prepare(args, publisher, planner)
    report.update(machine_sha256=package['manifest']['sha256'], manifest_file_sha256=package['frozen_file_sha256'],
                  base_sha256=package['base']['sha256'], version=package['manifest']['version'])

    def verify_inputs():
        current = prepare(args, publisher, planner)
        require(current == package, 'Machine inputs changed after preparation')

    client = GuardedTransport(raw_call, package, mode, report, save, verify_inputs)
    require(client.get('/api/version', token).get('level') == 'edit', 'Service has not confirmed edit access')
    have, missing = client.check_base(token, require_complete=mode == 'publish')
    report['pending_blobs'] = len(missing)
    save()
    if mode == 'dry-run':
        verify_inputs()
        client.check_base(token)
        report['state'] = 'dry-run-complete-no-writes'
        save()
        return report
    if mode == 'stage-only':
        for digest, size in sorted(missing.items()):
            current, _ = client.check_base(token)
            require(current == have, 'Machine inventory changed during staging')
            status, _ = client.call('PUT', '/api/admin/machine/blob/' + digest,
                                    package['payloads'][digest], 'application/octet-stream', token)
            require(status == 200, 'Blob staging refused; active manifest has not been registered')
            have[digest] = size
            # Inventory is authoritative; do not depend on an undocumented PUT
            # acknowledgement shape or treat HTTP success alone as byte proof.
            observed, _ = client.check_base(token)
            require(observed == have, 'Staged blob or unchanged inventory was not confirmed')
            report['uploads'].append({'sha256': digest, 'bytes': size})
            report['state'] = 'blobs-staging-active-manifest-unchanged'
            save()
        verify_inputs()
        current, _ = client.check_base(token, require_complete=True)
        require(current == have, 'Machine inventory changed at final staging verification')
        report['state'] = 'blobs-staged-active-manifest-unchanged'
        save()
        return report
    require(mode == 'publish', 'Unknown publication phase')
    # Existing main re-plans. Bind that call to the already reviewed immutable
    # tuple, while re-reading original input files to reject intervening changes.
    def frozen_plan(*_args, **_kwargs):
        verify_inputs()
        return copy.deepcopy((package['base'], package['manifest'], package['local'], package['delta']))

    publisher.plan, publisher.call = frozen_plan, client.call
    original_argv = sys.argv
    try:
        # The upstream proof file belongs beside its --over directory. Keep it
        # private regardless of where the caller's real source overlay resides.
        with tempfile.TemporaryDirectory(prefix='machine-readback-', dir=Path(args.report).parent) as private:
            over = Path(private) / 'over'
            over.mkdir()
            sys.argv = [str(args.publisher), '--base-manifest', str(args.base_manifest), '--code', str(args.code),
                        '--assets', str(args.assets), '--over', str(over), '--expect-candidate', args.expect_candidate]
            if args.readme:
                sys.argv += ['--readme', str(args.readme)]
            try:
                # Upstream response bodies are neither printed nor persisted.
                with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                    publisher.main()
            except SystemExit:
                raise GuardError('Upstream publication/readback stopped; inspect registration before any retry') from None
            proof = parse((Path(private) / 'publication893.json').read_bytes())
            require(proof.get('candidateSet') == package['manifest']['sha256'] and proof.get('publicAssetsExact') is True,
                    'Upstream exact public readback is not confirmed')
            verify_inputs()
            public = client.get('/api/machine', token)
            require(all(public.get(key) == package['manifest'][key] for key in ('sha256', 'version', 'label')),
                    'Public machine digest or metadata differs from the frozen manifest')
            report['public_assets_exact'] = True
            report['state'] = 'registered-and-public-readback-verified'
            save()
            return report
    finally:
        publisher.plan, publisher.call, sys.argv = planner, raw_call, original_argv


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    mode = ap.add_mutually_exclusive_group(required=True)
    for flag in ('dry-run', 'stage-only', 'publish'):
        mode.add_argument('--' + flag, action='store_true')
    ap.add_argument('--publisher', type=Path, default=CONTROL / 'v8.93_maps_aligned_DRAFT/tools/publish_machine893.py')
    for name in ('base-manifest', 'frozen-manifest', 'code', 'assets', 'over', 'report'):
        ap.add_argument('--' + name, type=Path, required=True)
    ap.add_argument('--readme', type=Path)
    ap.add_argument('--expect-candidate', required=True)
    ap.add_argument('--expect-manifest-file', required=True)
    args = ap.parse_args(argv)
    report = {}
    try:
        token = os.environ.get('GC500_EDIT_TOKEN', '')
        require(bool(token), 'GC500_EDIT_TOKEN is not configured; nothing requested')
        output = args.report.resolve()
        require(not any((p / '.git').is_file() or (p / '.git/HEAD').is_file() for p in (output.parent, *output.parents)),
                'Report must stay outside every Git checkout')
        require(not args.report.is_symlink() and not output.exists(), 'Use a fresh private report path; never replay a prior phase blindly')
        output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        os.close(fd)
        def save():
            # Structured fields only: no HTTP bodies, credentials or exception text.
            output.write_text(json.dumps(report, indent=2) + '\n')
        publisher = load_publisher(args.publisher)
        phase = 'dry-run' if args.dry_run else 'stage-only' if args.stage_only else 'publish'
        with open('/tmp/gc500-machine-publisher.lock', 'a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            execute(args, publisher, phase, token, save, report)
        print(json.dumps({key: report[key] for key in ('state', 'machine_sha256', 'version', 'post_attempts')}))
        return 0
    except BaseException as exc:
        if 'save' in locals():
            report['state'] = 'stopped-outcome-must-be-checked' if report.get('post_attempts') else 'stopped-without-registration'
            save()
        # Only locally constructed guard messages are safe; upstream exceptions
        # and server bodies can contain unapproved content or credentials.
        print('STOP: ' + (str(exc) if isinstance(exc, GuardError) else 'Phase interrupted or failed; inspect the private structured report'), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
