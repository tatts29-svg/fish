"""Author: Andrew Fisher. Immutable guards for the explicitly approved 2 November map-view restoration."""
from pathlib import Path
import hashlib
import json
import re

BASE = '1744a9f1a2fb3fc39c8aaae8c91c7e94e9a9c3a463c868eb6d2ea41504069c6a'
RESTORE_TARGET = '8256bce609ce48d30fd319ac56bce74729cfe8a980ad051228379d09b06a15e6'
CURRENT_FILES = {'explorer/explorer.js': {'sha256': '2818b0d881a723ee10aaef0900b7937b3aa6657cb1ef4175e47b9a7a1477f94b', 'bytes': 170647}, 'explorer/index.html': {'sha256': '931e05ddbb852582824f1208d9b57559fdc3bd2672f5301cf7c123aaffaffcf8', 'bytes': 28420}, 'explorer/explorer-merge.js': {'sha256': 'b56afddb6bed4db4da03619a0d903ae2f460c2c7a8c57a828cb70d1f196b647f', 'bytes': 33384}, 'poc3d/index.html': {'sha256': '31b672d1c8bb826d056118702702a6306b9fa6d00c1bb0a01211202bc088855c', 'bytes': 758}}
RESTORE_FILES = {'explorer/explorer.js': {'sha256': 'e175ec073b2d30c89c075f5bfe6ab823385c8f23cd50d07fa13ef10b5e2e6b5a', 'bytes': 170853}, 'explorer/index.html': {'sha256': '91e0ae84b59235c963eeb93ff79e9263844b333565b6b7c3726a62a918fd6d20', 'bytes': 28813}, 'explorer/explorer-merge.js': {'sha256': '7c276bb181541e506e983356fb746cd4233c77c6c973c178c7da27d458ad66c4', 'bytes': 32311}, 'poc3d/index.html': {'sha256': 'f8403834a1336ce15e9e296f46413bbf3dfd132bc5011a02a49813340c694efb', 'bytes': 46200}}
HOST = 'https://gc500-production.up.railway.app'
PUBLIC_TOKEN = 'Coates-GC500-2026'
REPLACED = frozenset({'explorer/explorer.js', 'explorer/explorer-merge.js', 'explorer/index.html', 'poc3d/index.html'})
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
    if any({k: rows[p][k] for k in ('sha256','bytes')} != v for p,v in CURRENT_FILES.items()):
        raise ValueError('Current four files differ from the pinned v12.83 release')
    return rows


def validate_inputs(retained, evidence, candidate_dir, expected_base=None):
    expected_base = BASE if expected_base is None else expected_base
    old = validate_base(retained, expected_base)
    if evidence.get('baseManifest') != expected_base or set(evidence.get('files', {})) != REPLACED:
        raise ValueError('Expected exactly the four source-bound replacements')
    expected = {}
    for path in sorted(REPLACED):
        detail = evidence['files'][path]
        if detail.get('base') != old[path]['sha256']:
            raise ValueError('Replacement source differs from the retained descriptor: ' + path)
        value, size = detail.get('sha256'), detail.get('bytes')
        if {'sha256': value, 'bytes': size} != RESTORE_FILES[path]:
            raise ValueError('Only the exact previously live original may be restored: ' + path)
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
        raise ValueError('Exactly four replacements must retain all 236 paths')
    if {path for path in old if old[path] != new[path]} != REPLACED:
        raise ValueError('Only the exact four reviewed descriptors may change')
    if after.get('schema') != before['schema'] or after.get('entry') != before['entry']:
        raise ValueError('Machine schema and entry must remain unchanged')
    for path, detail in expected.items():
        mime = 'text/html; charset=utf-8' if path.endswith('.html') else 'text/javascript; charset=utf-8'
        if new[path] != {'path': path, **detail, 'type': mime}:
            raise ValueError('Unexpected replacement descriptor: ' + path)
    if digest(after) != after.get('sha256'):
        raise ValueError('Candidate manifest digest does not match its contents')
    if after.get('sha256') != RESTORE_TARGET:
        raise ValueError('Restoration must reproduce the exact previous 8256 machine union')
    return 232


# Public v5.89 deployment handover: PR #1 comment 6241517868 and STATUS.md.
# Inventory proves presence/size, not the running process's environment protection.
# These exact allowlisted blobs rely on that reviewed SERVER_FILE/KEEP handover.
SERVER_BUILD = 'v5.94'
# Current running server and all predecessors protected by server_v5.94_switch/README.md.
# Source bytes independently hashed against this repository; no keep-list is altered here.
SERVER_BLOBS = {
    '55a19453304406e9fcf0891ae6151e8516357e83e22987fc334e2bf9428ad0ec': 289090,
    'c1b8bf9c999d4e548384b682592409507dbaf8bb7c4c62c590b62127b69c89b7': 292090,
    'bdb058ffe1d7e269be978546581383a85f11bd7fc7078f569d41de33b6efe396': 292810,
    '8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46': 294310,
    '9857a9786c875e6f2ffe75bc0f09e0c05500712188222fcb86b9fccc4a6d4b98': 307975,
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
        raise ValueError('Server readiness differs from the reviewed v5.94 protection handover')
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
