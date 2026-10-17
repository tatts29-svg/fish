"""Author: Andrew Fisher. Pure guards for the two-file v10.64 map refinement."""
from pathlib import Path
import hashlib
import json
import re

BASE = '43c59fc5ea41cfabe9941d72cead4d4a61b6c2e86ec883e5b0f2b067f2962f7c'
HOST = 'https://gc500-production.up.railway.app'
PUBLIC_TOKEN = 'Coates-GC500-2026'
REPLACED = frozenset({'explorer/explorer.js', 'explorer/index.html'})
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
        raise ValueError('Expected exactly the two source-bound replacements')
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
        raise ValueError('Exactly two replacements must retain all 236 paths')
    if {path for path in old if old[path] != new[path]} != REPLACED:
        raise ValueError('Only the exact two reviewed descriptors may change')
    if after.get('schema') != before['schema'] or after.get('entry') != before['entry']:
        raise ValueError('Machine schema and entry must remain unchanged')
    for path, detail in expected.items():
        mime = 'text/html; charset=utf-8' if path.endswith('.html') else 'text/javascript; charset=utf-8'
        if new[path] != {'path': path, **detail, 'type': mime}:
            raise ValueError('Unexpected replacement descriptor: ' + path)
    if digest(after) != after.get('sha256'):
        raise ValueError('Candidate manifest digest does not match its contents')
    return 234
