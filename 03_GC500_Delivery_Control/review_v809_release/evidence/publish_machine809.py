#!/usr/bin/env python3
"""Author: Andrew Fisher. Guarded publication of the frozen v8.09 machine union.

Requires the frozen manifests, work directory, stock machine_set.py and a new
private output directory outside this repository. --dry-run performs local and
GET-only preflight; without it, only reviewed machine blobs and the manifest can
be written. Operational records are never written. Use release815_verify.py
separately immediately before and after publication to prove record preservation.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import contextlib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import secrets
import sys
import urllib.parse
import urllib.request

AUTHOR = 'Andrew Fisher'
HOST = 'https://gc500-production.up.railway.app'
VIEW = 'Coates-GC500-2026'
REPO = Path(__file__).resolve().parents[3]
BASE = '65c47180502d9052ca3661e5aedd06683e8168c1e9be9297bcbcb7c2e4d9fe86'
TARGET = '7d2ff39f645696c212197f1bf0c7dfe8e4a01c232c4e3ca1dbea359b53500a1e'
BASE_FILE = '3817bdf340a1a283bdcf7eb40fa1bdb1bb39abb7d1cef20caf09d32017e176d7'
TARGET_FILE = 'b6cedf5839d005d3597608b58037d64700d586086de067d70ec87f140760a59f'
TOOL_FILE = '920fbad67167526dc9118d007c394d050f579bd97d18a8251ee8ea3994c03d73'
CHANGED = {
    'car-app.js', 'car-cockpit.js', 'car-driver.js', 'car-fit.js',
    'car-gc500.js', 'car-powertrain.js', 'car-scene.js', 'car.css',
    'cockpit-surfaces.js', 'crew.js', 'index.html', 'part-connections.js',
    'pit-garage.js', 'style.css', 'timing-drive.js',
    'vendor/addons/postprocessing/GTAOPass.js', 'view-fx.js',
}
ADDED = {
    'fx-quality.js', 'mech-brakes.js', 'mech-driveline.js', 'mech-oil.js',
    'mech-register.js', 'people-atlas.js', 'people-figure.js',
}
MAPS = {
    'explorer/explorer.js': '366897925de96b5f881485bec60c6a3a7263fd20d9b04d48231ac82d356020d0',
    'explorer/explorer-merge.js': '261238402f3c4bf3dc94a661b3dc8378bb789b01cdfd77b4cfc9810d1236b67c',
    'explorer/index.html': 'e2f0f9bfbfc9b5f707a2ead734b99cb0569c11f68bf15e0303d7021eac9e0572',
    'poc3d/index.html': '7edf7b5ac55c1cf5f60f35b72d577d8e257854e2e482b1b93796e498edcf5ac4',
}


class ReleaseError(Exception):
    """Only fixed, non-sensitive diagnostics are used with this exception."""


def require(condition, message):
    if not condition:
        raise ReleaseError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'),
                      ensure_ascii=False, allow_nan=False).encode('utf-8')


def descriptors(manifest):
    rows = manifest['files']
    result = {row['path']: row for row in rows}
    require(len(result) == len(rows), 'Duplicate manifest paths.')
    require(list(result) == sorted(result), 'Manifest paths are not canonical.')
    require(all(set(row) == {'bytes', 'path', 'sha256', 'type'} for row in rows),
            'Unexpected descriptor fields.')
    return result


def verify_union(retained, candidate):
    for manifest, digest in ((retained, BASE), (candidate, TARGET)):
        require(manifest['schema'] == 'gc500-machine-v1'
                and manifest['entry'] == 'index.html', 'Unexpected manifest schema or entry.')
        require(sha(canonical({key: manifest[key] for key in ('schema', 'entry', 'files')}))
                == manifest['sha256'] == digest, 'Frozen manifest digest differs.')
    before, after = descriptors(retained), descriptors(candidate)
    changed = {p for p in before.keys() & after.keys() if before[p] != after[p]}
    require(changed == CHANGED and after.keys() - before.keys() == ADDED
            and not before.keys() - after.keys(), 'Manifest delta differs from the frozen review.')
    require(len(before) == 219 and len(after) == 226
            and len(before.keys() - changed) == 202, 'Unexpected machine file counts.')
    require(sum(x['bytes'] for x in before.values()) == 172184133
            and sum(x['bytes'] for x in after.values()) == 172348506,
            'Unexpected machine byte totals.')
    require(all(before[p] == after[p] and after[p]['sha256'] == digest
                for p, digest in MAPS.items()), 'A retained map descriptor differs.')
    return before, after


def save_private(path, value):
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, 'O_NOFOLLOW', 0)
    fd = os.open(path, flags, 0o600)
    with os.fdopen(fd, 'w', encoding='utf-8') as stream:
        json.dump(value, stream, indent=2, ensure_ascii=False, allow_nan=False)
        stream.write('\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-manifest', type=Path, required=True)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--machine-tool', type=Path, required=True)
    parser.add_argument('--private-dir', type=Path, required=True)
    parser.add_argument('--expected-page-sha', required=True)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()
    require(re.fullmatch(r'[0-9a-f]{64}', args.expected_page_sha) is not None,
            'An exact expected public page SHA-256 is required.')
    private = args.private_dir.expanduser().resolve()
    require(private != REPO and REPO not in private.parents,
            'Private output must resolve outside the repository.')
    private.mkdir(parents=True, exist_ok=False, mode=0o700)
    report = {'author': AUTHOR, 'baseManifestSha256': BASE,
              'candidateManifestSha256': TARGET, 'expectedPageSha256': args.expected_page_sha,
              'dryRun': args.dry_run, 'registrationAttempted': False,
              'registrationAccepted': False, 'verifiedPublicFiles': 0,
              'uploadedBlobCount': 0, 'complete': False}
    try:
        require(sha(args.base_manifest.read_bytes()) == BASE_FILE,
                'Retained manifest file differs from the frozen handover.')
        require(sha(args.manifest.read_bytes()) == TARGET_FILE,
                'Candidate manifest file differs from the frozen handover.')
        require(sha(args.machine_tool.read_bytes()) == TOOL_FILE,
                'Machine tool differs from the reviewed stock helper.')
        retained = json.loads(args.base_manifest.read_text())
        candidate = json.loads(args.manifest.read_text())
        before, after = verify_union(retained, candidate)
        work = args.work.resolve()
        local_paths = set()
        for path in work.rglob('*'):
            require(not path.is_symlink(), 'Work tree contains a symlink.')
            if not path.is_file():
                continue
            name = path.relative_to(work).as_posix()
            data = path.read_bytes()
            require(name in after and sha(data) == after[name]['sha256']
                    and len(data) == after[name]['bytes'], 'A work file differs from its frozen descriptor.')
            local_paths.add(name)
        require(len(local_paths) == 63 and CHANGED | ADDED <= local_paths,
                'The complete frozen work tree is required.')
        token = os.environ.get('GC500_EDIT_TOKEN')
        require(bool(token), 'GC500_EDIT_TOKEN is required in the environment.')
        native_open = urllib.request.urlopen

        def get(path, authenticated=False):
            query = '?publication809=' + secrets.token_hex(12)
            headers = {'x-gc500-token': token if authenticated else VIEW,
                       'Cache-Control': 'no-cache, no-store, max-age=0', 'Pragma': 'no-cache'}
            request = urllib.request.Request(HOST + path + query, headers=headers, method='GET')
            with native_open(request, timeout=180) as response:
                return response.read()

        def current():
            inventory = json.loads(get('/api/admin/machine', True))
            require(isinstance(inventory.get('status'), dict)
                    and isinstance(inventory.get('blobs'), list), 'Machine inventory is incomplete.')
            return inventory

        def unchanged():
            require(current()['status'].get('sha256') == BASE,
                    'Live machine changed; rebuild and review the union before registering.')

        require(json.loads(get('/api/version', True)).get('level') == 'edit',
                'The supplied environment key does not have edit capability.')
        require(sha(get('/v/' + VIEW)) == args.expected_page_sha,
                'The public page differs from the expected release.')
        inventory = current()
        require(inventory['status'].get('sha256') == BASE,
                'Live machine differs from the reviewed base.')
        have = {entry['sha256']: entry['bytes'] for entry in inventory['blobs']}
        require(all(have.get(row['sha256']) == row['bytes']
                    for p, row in after.items() if p not in CHANGED | ADDED),
                'A preserved blob is absent from the service inventory.')
        save_private(private / 'preflight.json', {
            **report, 'localWorkFilesExact': 63, 'changed': 17, 'added': 7,
            'preserved': 202, 'removed': 0, 'mapsPreserved': 4,
            'files': 226, 'bytes': 172348506,
            'missingReviewedBlobs': sum(have.get(after[p]['sha256']) != after[p]['bytes']
                                        for p in CHANGED | ADDED)})

        spec = importlib.util.spec_from_file_location('reviewed_machine_set809', args.machine_tool)
        machine = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(machine)
        allowed_blobs = {after[p]['sha256']: after[p]['bytes'] for p in CHANGED | ADDED}

        def guarded(request, *pos, **kw):
            require(isinstance(request, urllib.request.Request), 'Unexpected machine-tool request.')
            url = urllib.parse.urlsplit(request.full_url)
            require(url.scheme + '://' + url.netloc == HOST and not url.query,
                    'Unexpected machine-tool origin or query.')
            method, path = request.get_method(), url.path
            if method == 'GET' and path == '/api/admin/machine':
                return native_open(request, *pos, **kw)
            require(not args.dry_run, 'A write was attempted during dry-run.')
            if method == 'PUT' and path.startswith('/api/admin/machine/blob/'):
                digest = path.removeprefix('/api/admin/machine/blob/')
                require(digest in allowed_blobs and sha(request.data) == digest
                        and len(request.data) == allowed_blobs[digest], 'Unreviewed blob upload attempted.')
                response = native_open(request, *pos, **kw)
                report['uploadedBlobCount'] += 1
                return response
            if method == 'POST' and path == '/api/admin/machine/manifest':
                proposed = json.loads(request.data)
                verify_union(retained, proposed)
                require(proposed == candidate, 'Registration differs from the frozen candidate manifest.')
                require(sha(get('/v/' + VIEW)) == args.expected_page_sha,
                        'Public page changed before machine registration.')
                unchanged()  # after staging blobs, immediately before shared registration
                report['registrationAttempted'] = True
                response = native_open(request, *pos, **kw)
                report['registrationAccepted'] = response.status == 200
                return response
            raise ReleaseError('Unexpected machine-tool endpoint or method.')

        command = ['machine_set.py', '--base', HOST, '--token-env', 'GC500_EDIT_TOKEN',
                   '--keep', str(args.base_manifest), '--entry', candidate['entry'],
                   '--label', candidate['label'], '--version', candidate['version'],
                   '--write-manifest', str(private / 'generated-manifest.json')]
        for name in sorted(CHANGED | ADDED):
            command += ['--add-file', str(work / name) + '=' + name]
        if args.dry_run:
            command.append('--dry-run')
        old_argv = sys.argv
        urllib.request.urlopen, sys.argv = guarded, command
        # Stock output may contain a server response. Never emit or save it.
        try:
            with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                machine.main()
        finally:
            urllib.request.urlopen, sys.argv = native_open, old_argv
        generated = json.loads((private / 'generated-manifest.json').read_text())
        verify_union(retained, generated)
        require(generated == candidate, 'Generated manifest differs from the frozen candidate.')
        if args.dry_run:
            require(not report['registrationAttempted'] and report['uploadedBlobCount'] == 0,
                    'Dry-run did not remain read-only.')
            unchanged()
            report['complete'] = True
        else:
            require(report['registrationAccepted'], 'Machine registration was not accepted.')
            require(current()['status'].get('sha256') == TARGET,
                    'Registered manifest digest readback differs.')
            def verify_asset(item):
                name, row = item
                body = get('/w/' + VIEW + '/' + name)
                require(len(body) == row['bytes'] and sha(body) == row['sha256'],
                        'A public machine file differs from its frozen descriptor.')
                return True
            with ThreadPoolExecutor(max_workers=4) as pool:
                for verified in pool.map(verify_asset, after.items()):
                    report['verifiedPublicFiles'] += int(verified)
            require(current()['status'].get('sha256') == TARGET,
                    'Machine registration changed during full public readback.')
            require(sha(get('/v/' + VIEW)) == args.expected_page_sha,
                    'Public page changed during machine publication.')
            report['complete'] = report['verifiedPublicFiles'] == 226
        save_private(private / 'result.json', report)
        print(json.dumps(report))
        return 0
    except BaseException:
        # Preserve partial-publication state even when readback fails. No response
        # body, credential, raw operational record or exception text is persisted.
        save_private(private / 'failure.json', report)
        raise


if __name__ == '__main__':
    try:
        result = main()
    except ReleaseError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
    except BaseException:
        print('Publication did not complete; inspect private aggregate outcomes before retrying.', file=sys.stderr)
        sys.exit(1)
    else:
        sys.exit(result)
