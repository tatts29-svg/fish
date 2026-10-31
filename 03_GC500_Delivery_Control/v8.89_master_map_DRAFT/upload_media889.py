#!/usr/bin/env python3
"""v8.89 media step, run BEFORE uploading the v8.89 page: put the new master picture and pin thumbnails on the service and
register the page's media manifest. The page is refused until its manifest is registered, so the order is fixed:

    python3 upload_media889.py <media folder> <build>/media_manifest_v889.json --dry-run    # checks the key, lists what would go
    python3 upload_media889.py <media folder> <build>/media_manifest_v889.json             # uploads, then registers
    python3 ../toolchain/upload_page.py <build>/GC500_Delivery_Control_hosted.html          # then the page, as usual

<media folder> holds the files from media889.zip.enc (decrypt with the papers password). Only files the service does not
already hold are sent; each is checked against its SHA-256 name first. The edit key comes from GC500_EDIT_TOKEN or the
host-scoped credential proxy (--credential-proxy), exactly as upload_page.py; it is never printed or written anywhere.
Author: Andrew Fisher."""
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
    if len(a) != 2: sys.exit(__doc__)
    folder, manifest_path = Path(a[0]), Path(a[1]); dry = '--dry-run' in sys.argv
    manifest = json.loads(manifest_path.read_text())
    assert manifest.get('schema') == 'gc500-media-v1' and len(manifest.get('sha256', '')) == 64 and manifest.get('assets')
    code, body = curl('GET', '/api/version'); print('service:', code, body[:120])
    if code != 200 or json.loads(body).get('level') != 'edit': sys.exit('that key is not the edit key - stopping before anything is written')
    code, body = curl('GET', '/api/admin/media')
    if code != 200: sys.exit('cannot read the media list: %d %s' % (code, body[:160]))
    held = {f['file']: f for f in json.loads(body)['files']}
    todo = [x for x in manifest['assets'] if not (x['file'] in held and held[x['file']]['sha256'] == x['sha256'] and held[x['file']]['bytes'] == x['bytes'])]
    print('manifest', manifest['sha256'][:16], '|', len(manifest['assets']), 'files |', len(todo), 'not yet on the service')
    for x in todo:
        f = folder / x['file']
        if not f.exists(): sys.exit('missing ' + x['file'] + ' - decrypt media889.zip.enc into ' + str(folder))
        b = f.read_bytes()
        if hashlib.sha256(b).hexdigest() != x['sha256'] or len(b) != x['bytes']: sys.exit(x['file'] + ' does not match the manifest')
    if dry: print('dry run: the key is the edit key; would upload', [x['file'][:16] for x in todo], 'then register the manifest; nothing written'); return
    for x in todo:
        code, body = curl('PUT', '/api/admin/media/' + x['file'], data=folder / x['file'], ctype=x['type'])
        print('media', x['file'][:16], code, body[:100])
        if code != 200: sys.exit('media refused - stopping; nothing else sent. Rerun to resume (saved files are skipped).')
    code, body = curl('POST', '/api/admin/media/manifest', data=manifest_path, ctype='application/json')
    print('manifest:', code, body[:200])
    if code != 200: sys.exit('manifest refused - the page would be refused too; do not upload it')
    print('media ready: upload the v8.89 page next with toolchain/upload_page.py')

if __name__ == '__main__':
    main()
