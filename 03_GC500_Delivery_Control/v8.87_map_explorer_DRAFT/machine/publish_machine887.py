#!/usr/bin/env python3
"""Author: Andrew Fisher. v8.87 machine part: register the seven prepared Map explorer files while keeping every other file of the
machine set exactly as it is. Guarded, and GET-only unless asked to publish.

    python3 publish_machine887.py --explorer <prepared explorer folder> --dry-run      # local checks and a GET-only preflight
    python3 publish_machine887.py --explorer <prepared explorer folder>                # uploads the seven blobs, registers, reads back

What it does, in the admin page's order (server v5.87, gc500-machine-v1):
  1. checks the seven prepared files against the hashes recorded in this script;
  2. loads the retained manifest of the live set b469a99c (231 files, proven: its canonical digest equals the registered digest and
     every descriptor was confirmed by ETag and length on 8 Oct 2026), replaces the five changed descriptors and adds two, and
     computes the candidate digest the way the server does;
  3. GET /api/version must say the key is the edit key; GET /api/admin/machine must say the live set is still b469a99c and every
     preserved blob is on the volume - otherwise it stops;
  4. (publish only) PUT each of the seven blobs under its SHA-256, POST the manifest, then read back /api/machine (the registered
     digest) and GET each changed public asset to prove the bytes, and write a private publication.json beside the explorer folder.
The edit key is read from GC500_EDIT_TOKEN and never printed, logged or written. No operational record is touched: the machine
set is a separate store from the page and the shared record. The dashboard page is uploaded separately with toolchain/upload_page.py.
"""
import argparse, hashlib, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
HOST = 'https://gc500-production.up.railway.app'
VIEW = 'Coates-GC500-2026'
RETAINED = HERE / 'retained_manifest_v864_b469a99c.json'
BASE_SET = 'b469a99c43a30a6d165ce126c4983d0c92204c8f548f0636a008f43de60e95d8'
VERSION, LABEL = 'v8.87-map-explorer', 'The Coates Way machine and GC500 Map explorer'
TYPES = {'html': 'text/html; charset=utf-8', 'css': 'text/css; charset=utf-8', 'js': 'text/javascript; charset=utf-8'}
# the seven prepared files (patch_explorer887.py output); hashes are asserted so nothing else can be registered by this script
PREPARED = json.loads((HERE / 'prepared887.json').read_text())
sha = lambda b: hashlib.sha256(b).hexdigest()


def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)


def digest_of(entry, files): return sha(canonical({'schema': 'gc500-machine-v1', 'entry': entry, 'files': files}).encode('utf-8'))


def call(method, path, body=None, ctype='application/json', token=None, timeout=600):
    req = urllib.request.Request(HOST + path, data=body, method=method, headers={'x-gc500-token': token or VIEW, 'Cache-Control': 'no-store', **({'Content-Type': ctype} if body is not None else {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r: return r.status, r.read()
    except urllib.error.HTTPError as e: return e.code, e.read()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--explorer', type=Path, required=True, help='the prepared explorer folder (patch_explorer887.py output)')
    ap.add_argument('--dry-run', action='store_true'); ap.add_argument('--private-dir', type=Path, default=None, help='where publication.json goes (default: beside the explorer folder)')
    a = ap.parse_args()
    token = os.environ.get('GC500_EDIT_TOKEN', '')
    if not token: sys.exit('GC500_EDIT_TOKEN is not set in the environment - nothing done')
    # 1. the prepared files
    local = {}
    for name, want in PREPARED.items():
        b = (a.explorer / name).read_bytes()
        if sha(b) != want['sha256'] or len(b) != want['bytes']: sys.exit(f'{name} is not the reviewed candidate ({sha(b)[:12]}, {len(b)} bytes)')
        local['explorer/' + name] = b
    # 2. the manifest: everything retained, seven descriptors changed or added
    retained = json.loads(RETAINED.read_text())
    if digest_of(retained['entry'], retained['files']) != BASE_SET or retained['sha256'] != BASE_SET: sys.exit('the retained manifest does not reproduce the live set digest')
    files = {f['path']: dict(f) for f in retained['files']}
    for path, b in local.items(): files[path] = {'bytes': len(b), 'path': path, 'sha256': sha(b), 'type': TYPES[path.rsplit('.', 1)[-1]]}
    arr = [files[p] for p in sorted(files)]
    changed = sorted(p for p in local if any(f['path'] == p for f in retained['files']) and files[p] != next(f for f in retained['files'] if f['path'] == p))
    added = sorted(p for p in local if not any(f['path'] == p for f in retained['files']))
    if len(changed) != 5 or len(added) != 2 or len(arr) != 233: sys.exit(f'unexpected delta: changed {changed} added {added} files {len(arr)}')
    digest = digest_of(retained['entry'], arr)
    manifest = {'schema': 'gc500-machine-v1', 'entry': retained['entry'], 'label': LABEL, 'version': VERSION, 'files': arr, 'sha256': digest}
    print(f'candidate set: {len(arr)} files, {sum(f["bytes"] for f in arr):,} bytes, digest {digest}')
    print('changed:', ', '.join(changed)); print('added:  ', ', '.join(added))
    # 3. GET-only preflight
    st, body = call('GET', '/api/version', token=token)
    if st != 200 or json.loads(body).get('level') != 'edit': sys.exit('that key is not the edit key - stopping before anything is written')
    st, body = call('GET', '/api/admin/machine', token=token)
    if st != 200: sys.exit(f'cannot read the machine inventory ({st})')
    inv = json.loads(body); live = (inv.get('status') or {}).get('sha256')
    if live != BASE_SET: sys.exit(f'STOP: the live machine set is {str(live)[:12]}, not the reviewed base {BASE_SET[:12]} - rebuild the retained manifest from the live set first')
    have = {x['sha256']: x['bytes'] for x in inv.get('blobs', [])}
    missing = [f['path'] for f in arr if f['path'] not in local and have.get(f['sha256']) != f['bytes']]
    if missing: sys.exit('a preserved blob is absent from the volume: ' + ', '.join(missing[:5]))
    print(f'preflight: edit key confirmed, live set is {BASE_SET[:12]}, {len(arr) - len(local)} preserved blobs on the volume, {sum(1 for p in local if have.get(files[p]["sha256"]) == files[p]["bytes"])} of {len(local)} new blobs already there')
    if a.dry_run: print('dry run: nothing uploaded or registered'); return
    # 4. publish: blobs, then one registration, then readback
    sent = 0
    for path, b in local.items():
        h = files[path]['sha256']
        if have.get(h) == len(b): continue
        st, body = call('PUT', '/api/admin/machine/blob/' + h, b, 'application/octet-stream', token)
        if st != 200: sys.exit(f'upload refused for {path}: {st} {body[:200]!r}')
        sent += 1
    print(f'blobs: {sent} uploaded, {len(local) - sent} already on the volume')
    st, body = call('GET', '/api/admin/machine', token=token)
    if st != 200 or (json.loads(body).get('status') or {}).get('sha256') != BASE_SET: sys.exit('STOP: the live set changed while the blobs went up - nothing registered')
    st, body = call('POST', '/api/admin/machine/manifest', json.dumps(manifest).encode('utf-8'), 'application/json', token)
    print('register:', st, body[:200].decode('utf-8', 'replace'))
    if st != 200: sys.exit('registration refused - the set is NOT live')
    for i in range(6):
        time.sleep(2); st, body = call('GET', '/api/machine')
        if st == 200 and json.loads(body).get('sha256') == digest: break
    else: sys.exit('registered, but /api/machine does not read back the candidate digest yet - check before saying it is live')
    exact = []
    for path, b in local.items():
        st, got = call('GET', '/w/' + VIEW + '/' + path + '?verify=' + files[path]['sha256'][:12])
        exact.append(st == 200 and sha(got) == files[path]['sha256'])
    stamp = time.strftime('%d %b %Y %H:%M', time.gmtime(time.time() + 10 * 3600))
    out = {'author': 'Andrew Fisher', 'baseSet': BASE_SET, 'candidateSet': digest, 'files': len(arr), 'changed': changed, 'added': added, 'publicAssetsExact': all(exact), 'liveAt': stamp + ' AEST'}
    priv = (a.private_dir or a.explorer.parent) / 'publication887.json'; priv.write_text(json.dumps(out, indent=2) + '\n')
    print(f'LIVE {stamp} AEST - machine set {digest[:12]} registered, public assets exact: {all(exact)} (written to {priv})')
    if not all(exact): sys.exit(1)


if __name__ == '__main__': main()
