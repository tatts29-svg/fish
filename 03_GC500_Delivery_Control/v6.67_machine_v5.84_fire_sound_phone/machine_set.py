#!/usr/bin/env python3
"""Builds, uploads and registers a GC500 machine set (server 'gc500-machine-v1').

The set is the union of an existing manifest's files (kept as they are, blobs already on the volume) and local
folders added under a path prefix. Every blob is uploaded under its SHA-256 (the server checks the bytes), the
manifest digest is computed the way the server computes it, then the set is registered in one write.

  python3 machine_set.py --base https://host --token-env GC500_EDIT_TOKEN \
      --keep handover/machine-manifest.json --add sat/explorer=explorer --add sat/poc3d=poc3d \
      --add-file server.js=server/gc500-server.js --entry index.html --label "..." --version v5.79 [--dry-run]
"""
import argparse, hashlib, json, os, re, sys, urllib.request, urllib.error

TYPES = {'html': 'text/html; charset=utf-8', 'css': 'text/css; charset=utf-8', 'js': 'text/javascript; charset=utf-8', 'mjs': 'text/javascript; charset=utf-8',
         'json': 'application/json; charset=utf-8', 'csv': 'text/csv; charset=utf-8', 'md': 'text/plain; charset=utf-8', 'txt': 'text/plain; charset=utf-8',
         'glb': 'model/gltf-binary', 'gltf': 'model/gltf+json', 'bin': 'application/octet-stream', 'hdr': 'image/vnd.radiance', 'ktx2': 'image/ktx2',
         'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'webp': 'image/webp', 'svg': 'image/svg+xml', 'ico': 'image/x-icon',
         'mp3': 'audio/mpeg', 'ogg': 'audio/ogg', 'wav': 'audio/wav', 'm4a': 'audio/mp4', 'woff2': 'font/woff2', 'woff': 'font/woff', 'wasm': 'application/wasm'}
SEG = re.compile(r'^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,99}$')
MAX_FILE, MAX_TOTAL, MAX_FILES = 48 * 1024 * 1024, 192 * 1024 * 1024, 600

def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)

def path_ok(p):
    segs = p.split('/')
    return 0 < len(p) <= 400 and len(segs) <= 8 and all(SEG.match(s) for s in segs) and p.rsplit('.', 1)[-1].lower() in TYPES

def sha(b): return hashlib.sha256(b).hexdigest()

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--base', required=True); ap.add_argument('--token-env', default='GC500_EDIT_TOKEN'); ap.add_argument('--keep'); ap.add_argument('--keep-dir', help='folder holding the kept files, so they can be uploaded where the volume lacks them')
    ap.add_argument('--add', action='append', default=[], help='localdir=prefix'); ap.add_argument('--add-file', action='append', default=[], help='localfile=path')
    ap.add_argument('--skip', action='append', default=[], help='regex of local relative paths to leave out'); ap.add_argument('--entry', default='index.html')
    ap.add_argument('--label', default='The Coates Way machine'); ap.add_argument('--version', default=None); ap.add_argument('--built', default=None)
    ap.add_argument('--dry-run', action='store_true'); ap.add_argument('--write-manifest', default=None); a = ap.parse_args()
    tok = os.environ.get(a.token_env, '');
    if not tok and not a.dry_run: sys.exit('no token in ' + a.token_env)
    files, local = {}, {}
    if a.keep:
        k = json.load(open(a.keep))
        for f in k['files']:
            files[f['path']] = {'bytes': f['bytes'], 'sha256': f['sha256'], 'type': f['type']}
            if a.keep_dir and os.path.exists(os.path.join(a.keep_dir, f['path'])): local[f['path']] = os.path.join(a.keep_dir, f['path'])
        print('kept', len(k['files']), 'files from', a.keep)
    skips = [re.compile(x) for x in a.skip]
    def add_local(fp, rel):
        if not path_ok(rel): sys.exit('path not allowed by the service: ' + rel)
        b = open(fp, 'rb').read()
        if not b or len(b) > MAX_FILE: sys.exit('file empty or over 48 MB: ' + rel)
        files[rel] = {'bytes': len(b), 'sha256': sha(b), 'type': TYPES[rel.rsplit('.', 1)[-1].lower()]}; local[rel] = fp
    for spec in a.add:
        d, prefix = spec.split('='); d = os.path.abspath(d)
        for root, dirs, names in os.walk(d):
            dirs.sort()
            for n in sorted(names):
                fp = os.path.join(root, n); rel = os.path.relpath(fp, d).replace(os.sep, '/')
                if any(s.search(rel) for s in skips) or os.path.islink(fp): continue
                add_local(fp, (prefix + '/' + rel) if prefix else rel)
    for spec in a.add_file:
        fp, rel = spec.split('='); add_local(fp, rel)
    if a.entry not in files: sys.exit('entry not in the set: ' + a.entry)
    total = sum(f['bytes'] for f in files.values())
    if len(files) > MAX_FILES or total > MAX_TOTAL: sys.exit(f'set too large: {len(files)} files, {total/1048576:.1f} MB')
    arr = [{'bytes': files[p]['bytes'], 'path': p, 'sha256': files[p]['sha256'], 'type': files[p]['type']} for p in sorted(files)]
    digest = sha(canonical({'schema': 'gc500-machine-v1', 'entry': a.entry, 'files': arr}).encode('utf-8'))
    manifest = {'schema': 'gc500-machine-v1', 'entry': a.entry, 'label': a.label, 'version': a.version or digest[:12], 'built': a.built, 'files': arr, 'sha256': digest}
    if not a.built: del manifest['built']
    print(f'set: {len(arr)} files, {total/1048576:.1f} MB, digest {digest[:12]}, {len(local)} local files to offer')
    if a.write_manifest: json.dump(manifest, open(a.write_manifest, 'w'), indent=1); print('manifest written', a.write_manifest)
    if a.dry_run: return
    def call(method, path, body=None, ctype='application/json'):
        req = urllib.request.Request(a.base + path, data=body, method=method, headers={'x-gc500-token': tok, 'Content-Type': ctype})
        try:
            with urllib.request.urlopen(req, timeout=600) as r: return r.status, json.loads(r.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            try: return e.code, json.loads(e.read().decode('utf-8'))
            except Exception: return e.code, {'error': 'http ' + str(e.code)}
    st, inv = call('GET', '/api/admin/machine')
    if st != 200 or 'blobs' not in inv: sys.exit('cannot read the machine inventory: ' + str(inv))
    have = {b['sha256']: b['bytes'] for b in inv['blobs']}; sent = skipped = 0
    for i, f in enumerate(arr):
        if have.get(f['sha256']) == f['bytes']: skipped += 1; continue
        if f['path'] not in local: sys.exit('blob missing on the volume and not local: ' + f['path'])
        st, j = call('PUT', '/api/admin/machine/blob/' + f['sha256'], open(local[f['path']], 'rb').read(), 'application/octet-stream')
        if st != 200: sys.exit(f"upload refused for {f['path']}: {st} {j}")
        sent += 1; have[f['sha256']] = f['bytes']
        if sent % 10 == 0: print(f'  uploaded {sent} (of {len(arr)} listed, {skipped} already there)…')
    print(f'blobs: {sent} uploaded, {skipped} already on the volume')
    st, j = call('POST', '/api/admin/machine/manifest', json.dumps(manifest).encode('utf-8'))
    print('register:', st, j)
    if st != 200: sys.exit(1)

if __name__ == '__main__': main()
