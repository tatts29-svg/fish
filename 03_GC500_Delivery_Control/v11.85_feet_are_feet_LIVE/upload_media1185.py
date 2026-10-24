#!/usr/bin/env python3
"""v11.85 media step, run BEFORE uploading the v11.85 page: put the cut race-call take for turn 30 on the service and register the page's
media manifest. The service refuses a page whose manifest it does not hold, so the order is fixed:

    python3 upload_media1185.py <build>/media_manifest_v1185.json <build>/media_v1185 --dry-run   # checks the key, lists what would go
    python3 upload_media1185.py <build>/media_manifest_v1185.json <build>/media_v1185             # uploads, then registers
    python3 ../toolchain/upload_page.py <build>/GC500_Delivery_Control_hosted.html                # then the page, as usual

The manifest patch_v1185.py writes covers EVERY media file the page names (the pictures, clips and fonts the
service already holds plus the one new take), so only the new take is sent, each checked against its SHA-256 name first.
The take it replaces stays on the service's disk (a registered manifest is never unregistered) but no page names it.
The edit key comes from GC500_EDIT_TOKEN or the host-scoped credential proxy (--credential-proxy), exactly as
upload_page.py; it is never printed or written anywhere. Same code as v10.34's upload_media1034.py. Author: Andrew Fisher."""
import hashlib, json, os, subprocess, sys
from pathlib import Path

BASE = 'https://gc500-production.up.railway.app'


def curl(method, path, data=None, ctype=None):
    tok = os.environ.get('GC500_EDIT_TOKEN', '')
    if not tok and '--credential-proxy' not in sys.argv: raise RuntimeError('Upload credential is not configured')
    cmd = ['curl', '-sS', '--max-time', '300', '-o', '-', '-w', '\n%{http_code}', '-X', method, '-H', '@-', BASE + path]
    if ctype: cmd += ['-H', 'Content-Type: ' + ctype]
    if data is not None: cmd += ['--data-binary', '@' + str(data)]
    r = subprocess.run(cmd, input=(('x-gc500-token: ' + tok + '\n') if tok else '').encode(), capture_output=True)
    out = r.stdout.decode('utf-8', 'replace'); body, _, code = out.rpartition('\n')
    return int(code or 0), (body.replace(tok, '[key]') if tok else body)


def main():
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    if len(a) < 2: sys.exit(__doc__)
    manifest_path, folders = Path(a[0]), [Path(x) for x in a[1:]]; dry = '--dry-run' in sys.argv
    manifest = json.loads(manifest_path.read_text())
    assert manifest.get('schema') == 'gc500-media-v1' and len(manifest.get('sha256', '')) == 64 and manifest.get('assets')
    code, body = curl('GET', '/api/version'); print('service:', code, body[:120])
    if code != 200 or json.loads(body).get('level') != 'edit': sys.exit('that key is not the edit key - stopping before anything is written')
    code, body = curl('GET', '/api/admin/media')
    if code != 200: sys.exit('cannot read the media list: %d %s' % (code, body[:160]))
    held = {f['file']: f for f in json.loads(body)['files']}
    todo = [x for x in manifest['assets'] if not (x['file'] in held and held[x['file']]['sha256'] == x['sha256'] and held[x['file']]['bytes'] == x['bytes'])]
    print('manifest', manifest['sha256'][:16], '|', len(manifest['assets']), 'files |', len(todo), 'not yet on the service')
    where = {}
    for x in todo:
        f = next((d / x['file'] for d in folders if (d / x['file']).exists()), None)
        if f is None: sys.exit('missing ' + x['file'] + ' - not in ' + ', '.join(str(d) for d in folders) + ' (this release: media_v1185/)')
        b = f.read_bytes()
        if hashlib.sha256(b).hexdigest() != x['sha256'] or len(b) != x['bytes']: sys.exit(x['file'] + ' does not match the manifest')
        where[x['file']] = f
    if dry: print('dry run: the key is the edit key; would upload', [x['file'][:16] for x in todo], 'then register the manifest; nothing written'); return
    for x in todo:
        code, body = curl('PUT', '/api/admin/media/' + x['file'], data=where[x['file']], ctype=x['type'])
        print('media', x['file'][:16], code, body[:100])
        if code != 200: sys.exit('media refused - stopping; nothing else sent. Rerun to resume (saved files are skipped).')
    code, body = curl('POST', '/api/admin/media/manifest', data=manifest_path, ctype='application/json')
    print('manifest:', code, body[:200])
    if code != 200: sys.exit('manifest refused - the page would be refused too; do not upload it')
    print('media ready: upload the v11.85 page next with toolchain/upload_page.py')


if __name__ == '__main__':
    main()
