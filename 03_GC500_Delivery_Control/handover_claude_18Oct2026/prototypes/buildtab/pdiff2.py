import json, sys, re
a, b = (json.load(open(f)) for f in sys.argv[1:3])
norm = lambda t: re.sub(r'\b\d{1,2}:\d{2}\b', 'HH:MM', t or '')
print('versions', a.get('version'), a.get('version2'), b.get('version'), b.get('version2'), 'errors', a.get('errors'), b.get('errors'), a.get('err'), b.get('err'))
for sect in ('days', 'drawers'):
    ks = sorted(set(a[sect]) | set(b[sect])); same = [k for k in ks if norm(a[sect].get(k)) == norm(b[sect].get(k))]
    print(sect, len(same), 'of', len(ks), 'identical'); [print('  DIFF', k) for k in ks if k not in same][:10]
pa, pb = a.get('plant') or {}, b.get('plant') or {}
print('plant innerText same:', pa.get('text') == pb.get('text'), ' full text same:', norm(pa.get('full')) == norm(pb.get('full')), len(pa.get('full') or ''), len(pb.get('full') or ''))
