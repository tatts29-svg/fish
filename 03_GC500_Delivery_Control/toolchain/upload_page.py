#!/usr/bin/env python3
"""Put a built page LIVE, the way the admin page does it, then prove the live page is the build byte for byte.

The edit key comes from the private GC500_EDIT_TOKEN binding, or a host-scoped credential proxy with --credential-proxy. It is never printed, never
written to a file and never put in a command someone could read back. No private binding or explicit credential-proxy option: nothing happens. The service must confirm edit access before a write.

The media (the 2,000-odd pictures and sounds) is already on the service. The service checks every page against the
media it holds and refuses a page whose media differs, with the reason - so a normal release sends the page alone.

    python3 upload_page.py build/GC500_v7.44/GC500_Delivery_Control_hosted.html            # uploads
    python3 upload_page.py build/GC500_v7.44/GC500_Delivery_Control_hosted.html --dry-run  # checks the key only

It refuses to upload if the live page has changed since the build started (base_live.html, written by build.sh):
that means the other agent put a release live in the meantime. --force overrides, and should only ever be used on
Andrew's say-so.
"""
import hashlib, json, os, subprocess, sys, time, urllib.request
from pathlib import Path

BASE = 'https://gc500-production.up.railway.app'
VIEW = BASE + '/v/Coates-GC500-2026'

def curl(method, path, data=None, ctype=None):
    tok = os.environ.get('GC500_EDIT_TOKEN', '')
    if not tok and '--credential-proxy' not in sys.argv:
        raise RuntimeError('Upload credential is not configured')
    # the key goes to curl on its standard input as a header file, so it never appears in the process list
    cmd = ['curl', '-sS', '--max-time', '300', '-o', '-', '-w', '\n%{http_code}', '-X', method, '-H', '@-', BASE + path]
    if ctype: cmd += ['-H', 'Content-Type: ' + ctype]
    if data is not None: cmd += ['--data-binary', '@' + data]
    r = subprocess.run(cmd, input=(('x-gc500-token: ' + tok + '\n') if tok else '').encode(), capture_output=True)
    out = r.stdout.decode('utf-8', 'replace'); body, _, code = out.rpartition('\n')
    return int(code or 0), body.replace(tok, '[key]') if tok else body

def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = a[0]; dry = '--dry-run' in a
    if not os.environ.get('GC500_EDIT_TOKEN') and '--credential-proxy' not in a: sys.exit('GC500_EDIT_TOKEN is not set in the environment - nothing uploaded')
    # TWO BUILDERS, ONE LIVE PAGE. The build started from base_live.html. If the live page is no longer that, somebody
    # else (Claude or Codex) has put a release live since - uploading now would wipe their work. Rebuild on the new live.
    base = os.path.join(os.path.dirname(os.path.abspath(page)), 'base_live.html')
    if not os.path.exists(base) and '--force' not in a: sys.exit('no base_live.html beside the build - build it with toolchain/build.sh')
    if os.path.exists(base):
        live = urllib.request.urlopen(VIEW, timeout=180).read()
        if live != Path(base).read_bytes():
            if '--force' in a: print('WARNING: the live page changed since this build started - --force given, going ahead')
            else: sys.exit('STOP: the live page has changed since this build started (another release went live). '
                           'Pull the repo, read STATUS.md, rebuild with toolchain/build.sh, retest, then upload.')
        else: print('live page unchanged since the build started - safe to upload')
    code, body = curl('GET', '/api/version')
    print('service:', code, body[:120])
    if code != 200 or json.loads(body).get('level') != 'edit': sys.exit('that key is not the edit key - stopping before anything is written')
    if dry: print('dry run: the key is the edit key; nothing uploaded'); return
    want = Path(page).read_bytes()
    code, body = curl('POST', '/api/admin/app', data=page, ctype='text/html')
    print('page:', code, body[:200])
    if code != 200: sys.exit('page refused - it is NOT live')
    for i in range(6):
        time.sleep(3)
        got = urllib.request.urlopen(VIEW, timeout=120).read()
        if got == want: break
    if got != want: sys.exit('uploaded, but the view link does not serve these bytes yet - check before saying it is live')
    stamp = time.strftime('%d %b %Y %H:%M', time.gmtime(time.time() + 10 * 3600))
    print(f'LIVE {stamp} AEST - the view link serves the build byte for byte ({len(want):,} bytes, sha256 {hashlib.sha256(want).hexdigest()[:16]})')

if __name__ == '__main__':
    main()
