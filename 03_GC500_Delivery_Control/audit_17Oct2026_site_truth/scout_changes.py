"""Author: Andrew Fisher. Every existing record document that a record operation (15-17 Oct reports) changed or removed.
    python3 -I audit_17Oct2026_site_truth/scout_changes.py > audit_17Oct2026_site_truth/changes.json
"""
import json, glob, os, sys
out = []
for rep in sorted(glob.glob('record_*/report*.json') + glob.glob('record_*/po_report*.json')):
    try: r = json.load(open(rep))
    except Exception as e: print('skip', rep, e, file=sys.stderr); continue
    if r.get('mode') not in (None, 'apply'): continue
    docs = r.get('docs') or {}
    before, after = docs.get('before') or {}, docs.get('after') or {}
    whys = [{k: s.get(k) for k in ('op', 'ref', 'no', 'why', 'result', 'key', 'line') if k in s} for s in (r.get('stage') or []) if isinstance(s, dict)]
    for k, b in before.items():
        if b is None: continue
        a = after.get(k, None)
        if a == b: continue
        strip = lambda x: {kk: vv for kk, vv in x.items() if kk not in ('history',)} if isinstance(x, dict) else x
        out.append({'folder': os.path.dirname(rep), 'report': os.path.basename(rep), 'key': k,
                    'before': json.dumps(strip(b))[:600], 'after': json.dumps(strip(a))[:600] if a is not None else None,
                    'removed': a is None})
    if not before and r.get('writes'):
        out.append({'folder': os.path.dirname(rep), 'report': os.path.basename(rep), 'key': '(no before docs in report)', 'writes': len(r['writes'])})
    for o in out:
        if o['report'] == os.path.basename(rep) and o['folder'] == os.path.dirname(rep): o['opsWhy'] = whys[:60]
print(json.dumps(out, indent=1))
