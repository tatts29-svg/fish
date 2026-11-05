#!/usr/bin/env python3
"""Author: Andrew Fisher. GET-only base capture and exact workshop union build."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import argparse
import contextlib
import importlib.util
import io
import json
import shutil
import sys
import urllib.parse
import urllib.request

from machine1304 import (ALLOWED, BASE, HOST, PAGE_BASE, PUBLIC_TOKEN, REQUIRED, VERSION, SCOPE_SHA256, validate_scope,
                         canonical, descriptor, sha, validate_base, validate_inputs,
                         validate_tree, validate_union)
from protected_server1304 import MACHINE_TOOL_SHA256

HERE = Path(__file__).resolve().parent
MACHINE_TOOL = HERE.parents[1] / 'satellite_explorer/tools/machine_set.py'


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError('Release requests cannot redirect')


def transport(request, *args, **kwargs):
    return urllib.request.build_opener(NoRedirect()).open(request, *args, **kwargs)


def get(path):
    request = urllib.request.Request(HOST + path, headers={
        'x-gc500-token': PUBLIC_TOKEN, 'Cache-Control': 'no-cache'}, method='GET')
    with transport(request, timeout=90) as response:
        return response.read()


def unchanged():
    status = json.loads(get('/api/machine'))
    if status.get('sha256') != BASE or status.get('files') != 245:
        raise ValueError('Live machine differs from the pinned current base')
    if sha(get('/v/' + PUBLIC_TOKEN)) != PAGE_BASE:
        raise ValueError('Live dashboard differs from the pinned v13.01 base')


def load_machine():
    if sha(MACHINE_TOOL.read_bytes()) != MACHINE_TOOL_SHA256:
        raise ValueError('Shared machine_set.py differs from the reviewed helper')
    spec = importlib.util.spec_from_file_location('shared_machine_set1304', MACHINE_TOOL)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def build_manifest(retained_path, retained, candidate_dir, expected, manifest_path):
    module = load_machine()
    if module.canonical(retained) != canonical(retained):
        raise ValueError('Shared canonical format differs')
    argv = ['machine_set.py', '--base', HOST, '--keep', str(retained_path),
            '--entry', retained['entry'], '--label', retained['label'], '--version', VERSION,
            '--write-manifest', str(manifest_path), '--dry-run']
    for path in sorted(expected):
        argv += ['--add-file', str(candidate_dir / path) + '=' + path]
    previous_argv, previous_open = sys.argv, urllib.request.urlopen
    def no_network(*args, **kwargs):
        raise ValueError('The shared dry-run builder cannot access the network')
    try:
        sys.argv = argv
        urllib.request.urlopen = no_network
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            module.main()
    finally:
        sys.argv, urllib.request.urlopen = previous_argv, previous_open
    candidate = json.loads(manifest_path.read_text())
    validate_union(retained, candidate, expected)
    return candidate


def run(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--keep', type=Path, required=True, help='Complete prior published manifest, not status metadata')
    parser.add_argument('--out', type=Path, required=True, help='Fresh private output directory outside the checkout')
    parser.add_argument('--fetch-base-only', action='store_true', help='Fetch and hash every retained public file; no candidate needed')
    parser.add_argument('--base-root', type=Path, help='Complete verified retained machine tree')
    parser.add_argument('--candidate-dir', type=Path, help='Only approved replacement/addition files are imported')
    args = parser.parse_args(argv)
    retained = json.loads(args.keep.read_text())
    old = validate_base(retained)
    if args.out.exists():
        raise ValueError('Use a fresh output directory')
    if HERE.parents[2] in args.out.resolve().parents:
        raise ValueError('Generated release evidence belongs outside the checkout')
    if not args.fetch_base_only and (not args.base_root or not args.candidate_dir):
        raise ValueError('Candidate build requires complete --base-root and --candidate-dir')
    if not args.fetch_base_only:
        validate_scope()
    unchanged()
    args.out.mkdir(parents=True, mode=0o700)
    (args.out / 'retained-manifest.json').write_text(json.dumps(retained, indent=2) + '\n')
    root = args.out / 'machine'
    root.mkdir(mode=0o700)
    if args.fetch_base_only:
        def fetch(item):
            path = item['path']
            raw = get('/w/' + PUBLIC_TOKEN + '/' + urllib.parse.quote(path) + '?verify=' + item['sha256'])
            if sha(raw) != item['sha256'] or len(raw) != item['bytes']:
                raise ValueError('Retained public bytes differ: ' + path)
            target = root / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(raw)
        with ThreadPoolExecutor(max_workers=6) as pool:
            list(pool.map(fetch, retained['files']))
        validate_tree(retained, root)
        unchanged()
        result = {'author': 'Andrew Fisher', 'baseManifestSha256': BASE,
                  'dashboardBaseSha256': PAGE_BASE, 'filesVerified': len(old),
                  'publicFilesExact': True, 'networkWrites': 0}
        (args.out / 'base-retrieval.json').write_text(json.dumps(result, indent=2) + '\n')
    else:
        validate_tree(retained, args.base_root)
        changes = {}
        for path in sorted(ALLOWED):
            source = args.candidate_dir / path
            if not source.exists():
                if path in REQUIRED:
                    raise ValueError('Missing required workshop source: ' + path)
                continue
            if source.is_symlink():
                raise ValueError('Candidate cannot be a symlink: ' + path)
            detail = descriptor(path, source.read_bytes())
            if old.get(path) == detail:
                continue
            changes[path] = {'base': old[path]['sha256'] if path in old else None,
                             'sha256': detail['sha256'], 'bytes': detail['bytes']}
        evidence = {'author': 'Andrew Fisher', 'baseManifest': BASE,
                    'dashboardBaseSha256': PAGE_BASE, 'releaseScopeSha256': SCOPE_SHA256, 'files': changes}
        expected = validate_inputs(retained, evidence, args.candidate_dir)
        evidence_path = args.out / 'source-evidence.json'
        evidence_path.write_text(json.dumps(evidence, indent=2) + '\n')
        for path in old:
            destination = root / path
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(args.base_root / path, destination)
        for path in expected:
            shutil.copyfile(args.candidate_dir / path, root / path)
        candidate = build_manifest(args.keep, retained, root, expected, args.out / 'candidate-manifest.json')
        validate_tree(candidate, root)
        validate_inputs(retained, evidence, args.candidate_dir)
        unchanged()
        result = {'author': 'Andrew Fisher', 'baseManifestSha256': BASE,
                  'dashboardBaseSha256': PAGE_BASE, 'candidateManifestSha256': candidate['sha256'],
                  'sourceEvidenceSha256': sha(evidence_path.read_bytes()),
                  'changedFiles': {p: d['sha256'] for p, d in expected.items()},
                  'retainedFiles': len(set(old) - set(expected)), 'totalFiles': len(candidate['files']),
                  'networkWrites': 0, 'browserChecksCompleted': False}
        (args.out / 'build.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
    return result


if __name__ == '__main__':
    run()
