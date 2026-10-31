"""Author: Andrew Fisher. 25 Oct 2026 - what changed between two Baseplan exports, line by line (contract + line number),
and in the Delivery Dockets. Read-only.

    python3 -I diff67.py <old.json> <new.json> <out.json>
"""
import json, sys
a, b = json.load(open(sys.argv[1])), json.load(open(sys.argv[2]))
IGN = {'Sort Order'}
def lines(x):
    return {(c, str(l.get('Line'))): l for c, ls in x.items() if not c.startswith('_') and c != 'Delivery Dockets' for l in ls}
def dockets(x):
    return {json.dumps(d, sort_keys=True): d for d in x.get('Delivery Dockets', [])}
A, B = lines(a), lines(b)
res = {'added': [], 'gone': [], 'changed': []}
for k in sorted(set(A) | set(B)):
    if k not in A: res['added'].append({'contract': k[0], 'line': k[1], **B[k]})
    elif k not in B: res['gone'].append({'contract': k[0], 'line': k[1], **A[k]})
    else:
        d = {f: [A[k].get(f), B[k].get(f)] for f in set(A[k]) | set(B[k]) if f not in IGN and A[k].get(f) != B[k].get(f)}
        if d: res['changed'].append({'contract': k[0], 'line': k[1], 'desc': B[k].get('Description'), 'diff': d})
DA, DB = dockets(a), dockets(b)
res['dd_added'] = [DB[k] for k in DB if k not in DA]; res['dd_gone'] = [DA[k] for k in DA if k not in DB]
json.dump(res, open(sys.argv[3], 'w'), indent=1, default=str)
print({k: len(v) for k, v in res.items()})
