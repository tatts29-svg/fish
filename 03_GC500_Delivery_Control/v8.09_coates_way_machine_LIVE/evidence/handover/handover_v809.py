#!/usr/bin/env python3
"""v8.09 READY handover checks. Author: Andrew Fisher. Read only: the live machine is only ever read (GET, public view token).

  python3 handover_v809.py live      # status + every base/ file and the four map files, GET + sha256, against live and base_manifest_v813.json
  python3 handover_v809.py union     # base_manifest_v813.json + work/ -> ../manifest_v809.json (digest as satellite_explorer/tools/machine_set.py)
  python3 handover_v809.py closure   # every import/fetch/url in the changed and new files, and the module graph of both entries, in the union

base_manifest_v813.json is Codex's machine813_manifest.json (branch codex/gc500-v794-lap-cameras,
v8.13_maps_satellite_LIVE/evidence/), the registered live set 65c47180... Results are written next to this file.
"""
import datetime, hashlib, json, os, posixpath, re, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DRAFT = os.path.normpath(os.path.join(HERE, '..', '..'))
WORK, BASE = os.path.join(DRAFT, 'work'), os.path.join(DRAFT, 'base')
BASE_MANIFEST, UNION = os.path.join(HERE, 'base_manifest_v813.json'), os.path.join(HERE, '..', 'manifest_v809.json')
BASE_DIGEST = '65c47180502d9052ca3661e5aedd06683e8168c1e9be9297bcbcb7c2e4d9fe86'
MAPS = ['explorer/explorer.js', 'explorer/explorer-merge.js', 'explorer/index.html', 'poc3d/index.html']
HOST, VIEW = 'https://gc500-production.up.railway.app', 'Coates-GC500-2026'
TYPES = {'html': 'text/html; charset=utf-8', 'css': 'text/css; charset=utf-8', 'js': 'text/javascript; charset=utf-8'}
sha = lambda b: hashlib.sha256(b).hexdigest()

def canonical(v):  # exactly as machine_set.py (and the service) computes the manifest digest
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)
def digest(files):
    arr = [{'bytes': f['bytes'], 'path': f['path'], 'sha256': f['sha256'], 'type': f['type']} for f in sorted(files, key=lambda f: f['path'])]
    return sha(canonical({'schema': 'gc500-machine-v1', 'entry': 'index.html', 'files': arr}).encode('utf-8'))
def tree(d): return sorted(os.path.relpath(os.path.join(r, n), d).replace(os.sep, '/') for r, _, ns in os.walk(d) for n in ns)
def get(path):
    with urllib.request.urlopen(urllib.request.Request(HOST + path, headers={'x-gc500-token': VIEW}), timeout=180) as x: return x.read()
def save(name, obj):
    json.dump(obj, open(os.path.join(HERE, name), 'w'), indent=1); print('wrote', name)
def load_base():
    m = json.load(open(BASE_MANIFEST)); assert m['sha256'] == BASE_DIGEST and digest(m['files']) == BASE_DIGEST, 'base manifest is not 65c47180'; return m

def live():
    base = load_base(); desc = {f['path']: f for f in base['files']}
    status = json.loads(get('/api/machine')); rows, bad = [], []
    for p in tree(BASE) + MAPS:
        b = get('/w/%s/%s' % (VIEW, p)); local = open(os.path.join(BASE, p), 'rb').read() if os.path.exists(os.path.join(BASE, p)) else None
        d = desc.get(p); ok = bool(d) and sha(b) == d['sha256'] and len(b) == d['bytes'] and (local is None or sha(local) == sha(b))
        rows.append({'path': p, 'liveSha256': sha(b), 'liveBytes': len(b), 'manifestSha256': d and d['sha256'], 'baseSha256': local and sha(local), 'match': ok})
        if not ok: bad.append(p)
    out = {'author': 'Andrew Fisher', 'checkedUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'liveStatus': status,
           'liveIsBase': status.get('sha256') == BASE_DIGEST, 'baseFiles': len(tree(BASE)), 'mapFiles': len(MAPS), 'mismatches': bad, 'rows': rows}
    save('live_check.json', out); print('live', status.get('sha256'), status.get('files'), 'files; mismatches', bad)
    return not bad and out['liveIsBase']

def union():
    base = load_base(); files = {f['path']: dict(f) for f in base['files']}; changed, added = [], []
    for p in tree(WORK):
        b = open(os.path.join(WORK, p), 'rb').read(); d = {'bytes': len(b), 'path': p, 'sha256': sha(b), 'type': TYPES[p.rsplit('.', 1)[1]]}
        if p in files:
            assert files[p]['type'] == d['type'], p
            if files[p]['sha256'] == d['sha256']: continue
            changed.append({'path': p, 'before': {k: files[p][k] for k in ('sha256', 'bytes')}, 'after': {k: d[k] for k in ('sha256', 'bytes')}})
        else: added.append({k: d[k] for k in ('path', 'sha256', 'bytes')})
        files[p] = d
    arr = [files[p] for p in sorted(files)]; dg = digest(arr)
    touched = {c['path'] for c in changed} | {a['path'] for a in added}
    kept = [f for f in base['files'] if f['path'] not in touched]
    assert all(files[f['path']] == f for f in kept), 'a preserved descriptor changed'
    assert all(files[m] == next(f for f in base['files'] if f['path'] == m) for m in MAPS), 'a map descriptor changed'
    manifest = {'schema': 'gc500-machine-v1', 'entry': 'index.html', 'label': base['label'], 'version': 'v8.09-coates-way-machine',
                'files': [{'bytes': f['bytes'], 'path': f['path'], 'sha256': f['sha256'], 'type': f['type']} for f in arr], 'sha256': dg}
    open(UNION, 'w').write(json.dumps(manifest, indent=1) + '\n')
    out = {'author': 'Andrew Fisher', 'base': BASE_DIGEST, 'candidate': dg, 'files': len(arr), 'bytes': sum(f['bytes'] for f in arr),
           'changed': sorted(changed, key=lambda c: c['path']), 'added': sorted(added, key=lambda a: a['path']), 'preservedDescriptors': len(kept),
           'removed': [], 'maps': {m: files[m]['sha256'] for m in MAPS}, 'mapsUnchanged': True,
           'manifestFileSha256': sha(open(UNION, 'rb').read()),
           'method': 'sha256 of canonical JSON {schema, entry, files} with files sorted by path as {bytes, path, sha256, type} and object keys sorted, no whitespace (machine_set.py canonical()/digest; reproduces 65c47180 from the v8.13 manifest)'}
    save('union_v809.json', out); print('candidate', dg, len(arr), 'files', out['bytes'], 'bytes;', len(changed), 'changed,', len(added), 'added,', len(kept), 'kept')

IMPORT = re.compile(r"""(?:\bimport\s*(?:[\w*{}\s,$]+?\s*from\s*)?|\bimport\s*\(\s*|\bexport\s*[\w*{}\s,$]+?\s*from\s*)['"]([^'"]+)['"]""")
LIT = re.compile(r"""['"`(]((?:\./|\.\./)?(?:[A-Za-z0-9_-]+/)*[A-Za-z0-9_.-]+\.(?:js|mjs|css|html|png|jpg|jpeg|webp|svg|glb|gltf|bin|hdr|ktx2|mp3|ogg|wav|json|woff2|wasm))['"`)?#]""")
def resolve(frm, spec):
    if spec == 'three': return 'vendor/three.module.js'   # index.html's import map
    if re.match(r'^[a-z]+:', spec) or spec.startswith('//'): return None
    return posixpath.normpath(posixpath.join(posixpath.dirname(frm), spec)).lstrip('./')
def closure():
    man = json.load(open(UNION)); u = {f['path'] for f in man['files']}; un = json.load(open(os.path.join(HERE, 'union_v809.json')))
    targets = [c['path'] for c in un['changed']] + [a['path'] for a in un['added']]; rows, missing, comments, external = [], [], [], set()
    for t in targets:
        src = open(os.path.join(WORK, t), encoding='utf-8').read()
        code = re.sub(r'/\*.*?\*/', '', src, flags=re.S) if t.endswith(('.js', '.css')) else src   # a path named only in a comment is not loaded
        specs = set(IMPORT.findall(src)) | {m for m in LIT.findall(src) if '/' in m or m.startswith('.')} | set(re.findall(r"""url\(\s*['"]?([^'")]+)['"]?\s*\)""", src)) | set(re.findall(r"""(?:src|href)=["']([^"'#?]+)["']""", src))
        for s in sorted(specs):
            if s.startswith('data:'): continue
            r = resolve(t, s.split('?')[0])
            if r is None: external.add(s); continue
            if r in ('', '.'): continue
            ok = r in u; rows.append({'from': t, 'spec': s, 'resolved': r, 'inUnion': ok})
            if not ok: (comments if s not in code else missing).append({'from': t, 'spec': s})
    clips = re.findall(r"'([a-z0-9-]+)'", re.search(r'CLIP_IDS\s*=\s*\[([^\]]*)\]', open(os.path.join(WORK, 'v8-audio.js')).read()).group(1))
    seen, stack, gmiss = set(), [], []
    for entry in ('index.html', 'mechanism.html'):
        h = open(os.path.join(WORK, entry), encoding='utf-8').read()
        stack += [resolve(entry, s) for s in re.findall(r"""<script[^>]*src=["']([^"']+)["']""", h) + re.findall(r"""<link[^>]*href=["']([^"'#]+\.css)["']""", h)]
        stack += [resolve(entry, s) for m in re.findall(r'<script type="?module"?>(.*?)</script>', h, re.S) for s in IMPORT.findall(m)]
    while stack:
        p = stack.pop()
        if p is None or p in seen: continue
        seen.add(p)
        if p not in u: gmiss.append(p); continue
        if p.endswith('.js') and os.path.exists(os.path.join(WORK, p)): stack += [resolve(p, s) for s in IMPORT.findall(open(os.path.join(WORK, p), encoding='utf-8').read())]
    out = {'author': 'Andrew Fisher', 'union': man['sha256'], 'filesChecked': sorted(targets), 'references': len(rows), 'resolved': sum(r['inUnion'] for r in rows),
           'missing': missing, 'namedOnlyInComments': comments, 'external': sorted(external), 'audioClips': len(clips),
           'audioClipsMissing': [c for c in clips if 'assets/audio/%s.mp3' % c not in u], 'moduleGraph': sorted(seen), 'moduleGraphMissing': gmiss, 'rows': rows}
    save('closure_v809.json', out)
    print('closure:', len(targets), 'files,', len(rows), 'references,', len(missing), 'missing,', len(comments), 'named only in comments; external', sorted(external),
          '; clips', len(clips), out['audioClipsMissing'], '; module graph', len(seen), gmiss)
    return not missing and not gmiss and not out['audioClipsMissing']

if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else ''
    if what == 'live': sys.exit(0 if live() else 1)
    if what == 'union': union(); sys.exit(0)
    if what == 'closure': sys.exit(0 if closure() else 1)
    sys.exit(__doc__)
