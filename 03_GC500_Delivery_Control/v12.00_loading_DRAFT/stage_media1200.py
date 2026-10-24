"""Author: Andrew Fisher. Add immutable extracted media; never delete or change permissions.

Uses the shared credential-safe transport. This stages assets only, not the page.
The normal upload_page.py guard still checks the unchanged live base and manifest.
"""
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from upload_page import curl, VIEW, BASE
from patch_v1200 import canonical


def main():
    output = Path(sys.argv[1])
    base = (output / 'base_live.html').read_bytes()
    if urllib.request.urlopen(VIEW, timeout=120).read() != base:
        raise ValueError('Live base changed: rebuild before staging')
    code, body = curl('GET', '/api/version')
    if code != 200 or json.loads(body).get('level') != 'edit':
        raise ValueError('Edit access not verified')
    manifest = json.loads((output / 'media1200-manifest.json').read_text())
    digest = manifest.pop('sha256')
    if hashlib.sha256(canonical(manifest)).hexdigest() != digest:
        raise ValueError('Manifest digest mismatch')
    manifest['sha256'] = digest
    extracted = json.loads((output / 'media1200-extracted.json').read_text())
    for asset in extracted['assets']:
        path = output / 'media1200' / asset['file']
        blob = path.read_bytes()
        if len(blob) != asset['bytes'] or hashlib.sha256(blob).hexdigest() != asset['sha256']:
            raise ValueError('Extracted file changed')
        code, body = curl('PUT', '/api/admin/media/' + asset['file'], str(path), asset['type'])
        result = json.loads(body)
        if code != 200 or result.get('sha256') != asset['sha256'] or result.get('bytes') != asset['bytes']:
            raise ValueError('Immutable asset staging failed: HTTP ' + str(code))
    code, body = curl('POST', '/api/admin/media/manifest', str(output / 'media1200-manifest.json'), 'application/json')
    if code != 200 or json.loads(body).get('sha256') != digest:
        raise ValueError('Manifest registration failed: HTTP ' + str(code))
    for asset in extracted['assets']:
        readback = urllib.request.urlopen(BASE + '/m/Coates-GC500-2026/' + asset['file'], timeout=120).read()
        if len(readback) != asset['bytes'] or hashlib.sha256(readback).hexdigest() != asset['sha256']:
            raise ValueError('Public asset readback differs')
    print(json.dumps(dict(author='Andrew Fisher', staged=len(extracted['assets']),
        manifest_files=len(manifest['assets']), manifest=digest,
        exact_public_readbacks=len(extracted['assets']), page_published=False)))


if __name__ == '__main__':
    main()
