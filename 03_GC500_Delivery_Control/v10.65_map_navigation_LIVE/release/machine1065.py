"""Author: Andrew Fisher. Pure guards for the three-file v10.65 map navigation fixes."""
from pathlib import Path
import hashlib
import json
import re

BASE = '1348bf1bbcf69400aab0e510e7239d68dac567d40d103898323bf9abdef7bf6f'
HOST = 'https://gc500-production.up.railway.app'
PUBLIC_TOKEN = 'Coates-GC500-2026'
REPLACED = frozenset({'explorer/explorer.js', 'explorer/explorer-merge.js', 'explorer/index.html'})
HEX = re.compile(r'^[0-9a-f]{64}$')


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
    rows = manifest['files']
    paths = [row['path'] for row in rows]
    if paths != sorted(set(paths)):
        raise ValueError('Manifest paths must be unique and sorted')
    return {row['path']: row for row in rows}


def validate_base(manifest, expected_base=None):
    expected_base = BASE if expected_base is None else expected_base
    rows = file_map(manifest)
    if manifest.get('schema') != 'gc500-machine-v1' or manifest.get('entry') != 'index.html':
        raise ValueError('Unexpected machine schema or entry')
    if len(rows) != 236 or not REPLACED <= rows.keys():
        raise ValueError('Expected the current 236-file map set')
    if digest(manifest) != manifest.get('sha256') or manifest['sha256'] != expected_base or expected_base != BASE:
        raise ValueError('Retained manifest differs from the pinned current base')
    return rows


def validate_inputs(retained, evidence, candidate_dir, expected_base=None):
    expected_base = BASE if expected_base is None else expected_base
    old = validate_base(retained, expected_base)
    if evidence.get('baseManifest') != expected_base or set(evidence.get('files', {})) != REPLACED:
        raise ValueError('Expected exactly the three source-bound replacements')
    expected = {}
    for path in sorted(REPLACED):
        detail = evidence['files'][path]
        if detail.get('base') != old[path]['sha256']:
            raise ValueError('Replacement source differs from the retained descriptor: ' + path)
        value, size = detail.get('sha256'), detail.get('bytes')
        if not isinstance(value, str) or not HEX.fullmatch(value) or type(size) is not int or size <= 0:
            raise ValueError('Invalid reviewed replacement descriptor: ' + path)
        raw = (Path(candidate_dir) / path).read_bytes()
        if sha(raw) != value or len(raw) != size:
            raise ValueError('Candidate changed since source review: ' + path)
        if value == old[path]['sha256']:
            raise ValueError('Reviewed replacement is unchanged: ' + path)
        expected[path] = {'sha256': value, 'bytes': size}
    return expected


def validate_union(before, after, expected):
    old, new = file_map(before), file_map(after)
    if len(old) != 236 or set(expected) != REPLACED or old.keys() != new.keys():
        raise ValueError('Exactly three replacements must retain all 236 paths')
    if {path for path in old if old[path] != new[path]} != REPLACED:
        raise ValueError('Only the exact three reviewed descriptors may change')
    if after.get('schema') != before['schema'] or after.get('entry') != before['entry']:
        raise ValueError('Machine schema and entry must remain unchanged')
    for path, detail in expected.items():
        mime = 'text/html; charset=utf-8' if path.endswith('.html') else 'text/javascript; charset=utf-8'
        if new[path] != {'path': path, **detail, 'type': mime}:
            raise ValueError('Unexpected replacement descriptor: ' + path)
    if digest(after) != after.get('sha256'):
        raise ValueError('Candidate manifest digest does not match its contents')
    return 233


# Public v5.89 deployment handover: PR #1 comment 6241517868 and STATUS.md.
# Inventory proves presence/size, not the running process's environment protection.
# These exact allowlisted blobs rely on that reviewed SERVER_FILE/KEEP handover.
SERVER_BUILD = 'v5.89'
SERVER_BLOBS = {
    '264363128b6c4bc1fd86b2fd6712400dd4c367b45a6ca195b7fb2ee1c8f21a14': 216494,
    '76afbd997a9fcfd6e796eea4ead641a5249a1bad23114417c861fd1559057684': 228182,
    'b8d38b8f889baeffce25401a285f25286bbb4a6ae67f2c0f6e8a81eb214991dd': 186734,
    'cb32d00e0d4beb90870685978981b1e14541a701c7b37cb1f180d848c134019c': 283062,
    'd5a0d777da4871af1bf88804b4ef223354a29c2560213ab56f7897445b398fdc': 237432,
    'f5b9a3f7efdf880b5f10d0ee339761d35adf9b9ff5bdd3a528505215be6b6fe9': 236308,
}
MACHINE_TOOL_SHA256 = '920fbad67167526dc9118d007c394d050f579bd97d18a8251ee8ea3994c03d73'


def validate_server(health):
    if (health.get('ok') is not True or health.get('build') != SERVER_BUILD
            or health.get('record_recovered') is not None or health.get('tracker_refusing') is not None):
        raise ValueError('Server readiness differs from the reviewed v5.89 protection handover')
    return SERVER_BUILD


def inventory_map(body):
    if not isinstance(body, dict) or not isinstance(body.get('blobs'), list):
        raise ValueError('Invalid full machine inventory')
    result = {}
    for item in body['blobs']:
        key, size = item.get('sha256'), item.get('bytes')
        if (not isinstance(key, str) or not HEX.fullmatch(key) or key in result
                or type(size) is not int or size <= 0):
            raise ValueError('Invalid or duplicate inventory descriptor')
        result[key] = size
    return result


def validate_inventory(body, retained, expected):
    status = body.get('status', {})
    if status.get('sha256') != BASE or status.get('files') != 236:
        raise ValueError('Machine inventory belongs to a different live base')
    actual = inventory_map(body)
    required = dict(SERVER_BLOBS)
    for item in retained['files']:
        required[item['sha256']] = item['bytes']
    candidates = {item['sha256']: item['bytes'] for item in expected.values()}
    if any(actual.get(key) != size for key, size in required.items()):
        raise ValueError('Retained or handover-protected server blob missing or changed')
    if set(actual) - (set(required) | set(candidates)):
        raise ValueError('Unreviewed unlisted blob in inventory; coordinate its owner before publication')
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
        raise ValueError('Full inventory changed during staging; coordinate before registration')
    return True
