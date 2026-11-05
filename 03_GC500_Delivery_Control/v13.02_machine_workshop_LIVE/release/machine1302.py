"""Author: Andrew Fisher. Pure, bounded guards for the v13.02 workshop set."""
from pathlib import Path
import hashlib
import json
import re

BASE = '674404701b251917625f8589420d33896fbbf13d018da2a20591b3d31eb4e90a'
PAGE_BASE = '2f6bc154b896a33252f21b1b438593b2d7453b79bb47ef3ff01abb0721624e7b'
HOST = 'https://gc500-production.up.railway.app'
PUBLIC_TOKEN = 'Coates-GC500-2026'
VERSION = 'v13.02-coates-workshop'
REQUIRED = frozenset({'car-app.js', 'workshop-ui.js', 'engine-lift-preview.js',
                      'workshop-finish.js', 'crew-polish.js', 'workshop-learning.js'})
ALLOWED = REQUIRED | {'index.html'}
HEX = re.compile(r'^[0-9a-f]{64}$')
SEG = re.compile(r'^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,99}$')


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def canonical(value):
    if isinstance(value, list):
        return '[' + ','.join(canonical(x) for x in value) + ']'
    if isinstance(value, dict):
        return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(value[k])
                              for k in sorted(value)) + '}'
    return json.dumps(value, ensure_ascii=False)


def digest(manifest):
    return sha(canonical({key: manifest[key] for key in ('schema', 'entry', 'files')}).encode())


def file_map(manifest):
    rows = manifest.get('files')
    if not isinstance(rows, list) or not rows:
        raise ValueError('A complete file descriptor array is required')
    paths = []
    for row in rows:
        if not isinstance(row, dict) or set(row) != {'path', 'sha256', 'bytes', 'type'}:
            raise ValueError('Unexpected file descriptor fields')
        path = row['path']
        if (not isinstance(path, str) or len(path) > 400 or len(path.split('/')) > 8
                or not all(SEG.fullmatch(s) for s in path.split('/'))
                or not isinstance(row['sha256'], str) or not HEX.fullmatch(row['sha256'])
                or type(row['bytes']) is not int or not 0 < row['bytes'] <= 48 * 1024 * 1024
                or not isinstance(row['type'], str)):
            raise ValueError('Invalid machine file descriptor')
        paths.append(path)
    if paths != sorted(set(paths)) or len(paths) > 600 or sum(row['bytes'] for row in rows) > 192 * 1024 * 1024:
        raise ValueError('Manifest files must be unique, sorted and within service limits')
    return {row['path']: row for row in rows}


def validate_base(manifest):
    rows = file_map(manifest)
    if (manifest.get('schema') != 'gc500-machine-v1' or manifest.get('entry') != 'index.html'
            or len(rows) != 236 or not {'car-app.js', 'explorer/explorer.js', 'poc3d/index.html'} <= rows.keys()
            or digest(manifest) != BASE or manifest.get('sha256') != BASE):
        raise ValueError('Complete retained manifest differs from the pinned 236-file live base')
    return rows


def descriptor(path, raw):
    return {'path': path, 'sha256': sha(raw), 'bytes': len(raw),
            'type': 'text/html; charset=utf-8' if path.endswith('.html') else 'text/javascript; charset=utf-8'}


def validate_inputs(retained, evidence, candidate_dir):
    old = validate_base(retained)
    changes = evidence.get('files')
    if (evidence.get('baseManifest') != BASE or evidence.get('dashboardBaseSha256') != PAGE_BASE
            or not isinstance(changes, dict) or not REQUIRED <= changes.keys() <= ALLOWED):
        raise ValueError('Expected exact-base workshop-only evidence with every required module')
    expected = {}
    for path, detail in sorted(changes.items()):
        if not isinstance(detail, dict) or set(detail) != {'base', 'sha256', 'bytes'}:
            raise ValueError('Unexpected source evidence fields: ' + path)
        previous = old.get(path)
        if detail['base'] != (previous['sha256'] if previous else None):
            raise ValueError('Replacement/addition source differs from retained descriptor: ' + path)
        local = Path(candidate_dir) / path
        if local.is_symlink():
            raise ValueError('Candidate cannot be a symlink: ' + path)
        current = descriptor(path, local.read_bytes())
        if (detail['sha256'] != current['sha256'] or detail['bytes'] != current['bytes']
                or type(detail['bytes']) is not int or not 0 < detail['bytes'] <= 48 * 1024 * 1024
                or previous and current == previous):
            raise ValueError('Candidate changed since source binding or is unchanged: ' + path)
        expected[path] = current
    return expected


def validate_union(before, after, expected):
    old, new = validate_base(before), file_map(after)
    if not REQUIRED <= expected.keys() <= ALLOWED or set(new) != set(old) | set(expected):
        raise ValueError('The union must retain all old paths and only allowlisted additions')
    wanted = dict(old)
    wanted.update(expected)
    if new != wanted:
        raise ValueError('A retained file or reviewed replacement differs')
    if (after.get('schema') != before['schema'] or after.get('entry') != before['entry']
            or after.get('label') != before.get('label') or after.get('version') != VERSION
            or digest(after) != after.get('sha256')):
        raise ValueError('Unexpected candidate manifest identity or metadata')
    return len(set(old) - set(expected))


def validate_tree(manifest, root):
    for path, detail in file_map(manifest).items():
        local = Path(root) / path
        if local.is_symlink():
            raise ValueError('Machine source cannot be a symlink: ' + path)
        raw = local.read_bytes()
        if sha(raw) != detail['sha256'] or len(raw) != detail['bytes']:
            raise ValueError('Full machine tree differs: ' + path)


def validate_inventory(body, retained, expected):
    from protected_server1302 import SERVER_BLOBS, inventory_map
    status = body.get('status', {})
    if status.get('sha256') != BASE or status.get('files') != 236:
        raise ValueError('Machine inventory belongs to a different live base')
    actual = inventory_map(body)
    required = dict(SERVER_BLOBS)
    required.update({item['sha256']: item['bytes'] for item in retained['files']})
    candidates = {item['sha256']: item['bytes'] for item in expected.values()}
    if any(actual.get(key) != size for key, size in required.items()):
        raise ValueError('Retained or protected server blob missing or changed')
    if set(actual) - (set(required) | set(candidates)):
        raise ValueError('Unreviewed unlisted blob in inventory; coordinate before registration')
    if any(actual[key] != size for key, size in candidates.items() if key in actual):
        raise ValueError('Candidate inventory size differs from reviewed input')
    return actual


def validate_inventory_stable(before, after, expected, staged):
    wanted = dict(before)
    candidates = {item['sha256']: item['bytes'] for item in expected.values()}
    for key in staged:
        if key not in candidates:
            raise ValueError('Unknown staged blob')
        wanted[key] = candidates[key]
    if after != wanted:
        raise ValueError('Full inventory changed during staging')
