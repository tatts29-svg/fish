#!/usr/bin/env python3
"""Author: Andrew Fisher. v8.90 machine part: register the Map explorer's 2 Oct drawing (scene, pyramid, labels, underlay,
small assets) and the patched explorer code, keeping every other file of the machine set exactly as it is. Guarded, and
GET-only unless asked to publish. Composes with v8.87: the explorer code it registers is whatever folder --code names,
which is meant to be patch_explorer890.py's output over the v8.87 prepared files (or over the live files if v8.87 is not
going up).

    python3 publish_machine890.py --base-manifest <json of the set that is live now> --code <patched explorer code folder>
        --assets <v8.90 assets folder> [--readme <explorer README.md>] [--review <alignment json>] --dry-run      # local checks + GET-only preflight
    ... the same without --dry-run                                                                                # uploads the new blobs, registers, reads back

In the admin page's order (server v5.87, gc500-machine-v1):
  1. loads the base manifest (the retained live set, or v8.87's candidate manifest once that is live) and proves its canonical
     digest is the digest it claims;
  2. replaces the explorer code descriptors with the --code files, drops every old explorer/assets/** descriptor and adds the
     --assets files (vt/boot.json excluded: a build intermediate), adds the README and the review note, and computes the
     candidate digest the way the server does; the set must stay under 600 files and 192 MB;
  3. GET /api/version must say the key is the edit key; GET /api/admin/machine must say the live set is still the base set and
     every preserved blob is on the volume - otherwise it stops;
  4. (publish only) PUT each new blob under its SHA-256, POST the manifest, read back /api/machine and GET each changed public
     asset to prove the bytes; writes a private publication890.json beside --assets.
The edit key is read from GC500_EDIT_TOKEN and never printed, logged or written. No operational record is touched.
"""
import argparse, hashlib, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path

HOST = 'https://gc500-production.up.railway.app'; VIEW = 'Coates-GC500-2026'
VERSION, LABEL = 'v8.90-master-02oct', 'The Coates Way machine and GC500 Map explorer'
TYPES = {'html': 'text/html; charset=utf-8', 'css': 'text/css; charset=utf-8', 'js': 'text/javascript; charset=utf-8', 'json': 'application/json; charset=utf-8',
         'md': 'text/plain; charset=utf-8', 'bin': 'application/octet-stream', 'webp': 'image/webp', 'png': 'image/png', 'jpg': 'image/jpeg'}
MAX_FILE, MAX_TOTAL, MAX_FILES = 48 * 1024 * 1024, 192 * 1024 * 1024, 600
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


def plan(base_manifest, code, assets, readme=None, review=None):
    """the candidate manifest and the local bytes of every new blob; pure, no network"""
    base = json.loads(Path(base_manifest).read_text())
    if digest_of(base['entry'], base['files']) != base['sha256']: sys.exit('the base manifest does not reproduce its own digest')
    files = {f['path']: dict(f) for f in base['files']}; local = {}
    def put(rel, data):
        ext = rel.rsplit('.', 1)[-1].lower()
        if ext not in TYPES: sys.exit('type not allowed by the service: ' + rel)
        if not data or len(data) > MAX_FILE: sys.exit('empty or over 48 MB: ' + rel)
        files[rel] = {'bytes': len(data), 'path': rel, 'sha256': sha(data), 'type': TYPES[ext]}; local[rel] = data
    code_files = sorted(p for p in Path(code).iterdir() if p.is_file() and p.name != 'prepared890.json')
    for p in code_files: put('explorer/' + p.name, p.read_bytes())
    for rel in [r for r in files if r.startswith('explorer/assets/')]: del files[rel]
    for p in sorted(Path(assets).rglob('*')):
        if p.is_file() and p.name != 'boot.json': put('explorer/assets/' + p.relative_to(assets).as_posix(), p.read_bytes())
    if readme: put('explorer/README.md', Path(readme).read_bytes())
    if review: put('explorer/review/' + Path(review).name, Path(review).read_bytes())
    arr = [files[p] for p in sorted(files)]
    total = sum(f['bytes'] for f in arr)
    if len(arr) > MAX_FILES or total > MAX_TOTAL: sys.exit(f'set too large: {len(arr)} files, {total / 1048576:.1f} MB')
    before = {f['path']: f for f in base['files']}
    changed = sorted(p for p in local if p in before and before[p]['sha256'] != files[p]['sha256'])
    added = sorted(p for p in local if p not in before)
    removed = sorted(p for p in before if p not in files)
    unchanged_local = sorted(p for p in local if p in before and before[p]['sha256'] == files[p]['sha256'])
    manifest = {'schema': 'gc500-machine-v1', 'entry': base['entry'], 'label': LABEL, 'version': VERSION, 'files': arr, 'sha256': digest_of(base['entry'], arr)}
    return base, manifest, local, {'changed': changed, 'added': added, 'removed': removed, 'same_bytes': unchanged_local, 'files': len(arr), 'bytes': total}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--base-manifest', required=True); ap.add_argument('--code', required=True); ap.add_argument('--assets', required=True)
    ap.add_argument('--readme'); ap.add_argument('--review'); ap.add_argument('--dry-run', action='store_true'); ap.add_argument('--write-manifest')
    ap.add_argument('--offline', action='store_true', help='plan only: no network at all')
    a = ap.parse_args()
    base, manifest, local, delta = plan(a.base_manifest, a.code, a.assets, a.readme, a.review)
    print(f"base set {base['sha256'][:12]} ({len(base['files'])} files) -> candidate {manifest['sha256'][:12]}: {delta['files']} files, {delta['bytes']:,} bytes")
    print(f"  changed {len(delta['changed'])}, added {len(delta['added'])}, removed {len(delta['removed'])}, same bytes {len(delta['same_bytes'])}; new blobs to send: {len([p for p in local if p in delta['changed'] or p in delta['added']])}")
    if a.write_manifest: Path(a.write_manifest).write_text(json.dumps(manifest, indent=1)); print('candidate manifest written', a.write_manifest)
    if a.offline: return
    token = os.environ.get('GC500_EDIT_TOKEN', '')
    if not token: sys.exit('GC500_EDIT_TOKEN is not set in the environment - nothing done')
    st, body = call('GET', '/api/version', token=token)
    if st != 200 or json.loads(body).get('level') != 'edit': sys.exit('that key is not the edit key - stopping before anything is written')
    st, body = call('GET', '/api/admin/machine', token=token)
    if st != 200: sys.exit(f'cannot read the machine inventory ({st})')
    inv = json.loads(body); live = (inv.get('status') or {}).get('sha256')
    if live != base['sha256']: sys.exit(f"STOP: the live machine set is {str(live)[:12]}, not the base {base['sha256'][:12]} - point --base-manifest at the set that is live now")
    have = {x['sha256']: x['bytes'] for x in inv.get('blobs', [])}
    missing = [f['path'] for f in manifest['files'] if f['path'] not in local and have.get(f['sha256']) != f['bytes']]
    if missing: sys.exit('a preserved blob is absent from the volume: ' + ', '.join(missing[:5]))
    tosend = [p for p in local if have.get(manifest_sha(manifest, p)) != len(local[p])]
    print(f"preflight: edit key confirmed, live set is {base['sha256'][:12]}, preserved blobs on the volume, {len(tosend)} blobs to upload ({sum(len(local[p]) for p in tosend):,} bytes)")
    if a.dry_run: print('dry run: nothing uploaded or registered'); return
    sent = 0
    for p in tosend:
        st, body = call('PUT', '/api/admin/machine/blob/' + manifest_sha(manifest, p), local[p], 'application/octet-stream', token)
        if st != 200: sys.exit(f'upload refused for {p}: {st} {body[:200]!r}')
        sent += 1
        if sent % 10 == 0: print(f'  uploaded {sent} of {len(tosend)}')
    st, body = call('GET', '/api/admin/machine', token=token)
    if st != 200 or (json.loads(body).get('status') or {}).get('sha256') != base['sha256']: sys.exit('STOP: the live set changed while the blobs went up - nothing registered')
    st, body = call('POST', '/api/admin/machine/manifest', json.dumps(manifest).encode('utf-8'), 'application/json', token)
    print('register:', st, body[:200].decode('utf-8', 'replace'))
    if st != 200: sys.exit('registration refused - the set is NOT live')
    for _ in range(6):
        time.sleep(2); st, body = call('GET', '/api/machine')
        if st == 200 and json.loads(body).get('sha256') == manifest['sha256']: break
    else: sys.exit('registered, but /api/machine does not read back the candidate digest yet - check before saying it is live')
    exact = []
    for p in delta['changed'] + delta['added']:
        st, got = call('GET', '/w/' + VIEW + '/' + p + '?verify=' + manifest_sha(manifest, p)[:12]); exact.append(st == 200 and sha(got) == manifest_sha(manifest, p))
    stamp = time.strftime('%d %b %Y %H:%M', time.gmtime(time.time() + 10 * 3600))
    out = {'author': 'Andrew Fisher', 'baseSet': base['sha256'], 'candidateSet': manifest['sha256'], 'files': delta['files'], 'changed': delta['changed'], 'added': delta['added'], 'removed': delta['removed'], 'publicAssetsExact': all(exact), 'liveAt': stamp + ' AEST'}
    priv = Path(a.assets).parent / 'publication890.json'; priv.write_text(json.dumps(out, indent=2) + '\n')
    print(f"LIVE {stamp} AEST - machine set {manifest['sha256'][:12]} registered, public assets exact: {all(exact)} (written to {priv})")
    if not all(exact): sys.exit(1)


def manifest_sha(manifest, path): return next(f['sha256'] for f in manifest['files'] if f['path'] == path)


if __name__ == '__main__': main()
