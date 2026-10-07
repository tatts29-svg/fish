# Author: Andrew Fisher. v8.89 changes only what the new master needs: media, the D001 sheet, the register entry and the
# pins it moves. Everything else in DATA and MASTER_LOC is identical to the base.
#   python3 test_identity889.py <base page> <candidate page>
import json, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
C = json.loads((here.parent / 'changes889.json').read_text())
def read(p):
    s = Path(p).read_text()
    D = json.loads(re.search(r'const DATA = (\{.*?\});\n', s).group(1))
    m = re.search(r'(const|var|let)\s+MASTER_LOC\s*=\s*', s); ML, _ = json.JSONDecoder().raw_decode(s[m.end():])
    return D, ML
(B, BL), (N, NL) = read(sys.argv[1]), read(sys.argv[2])
fails = []
def check(cond, what):
    if not cond: fails.append(what)
# the register entry may live under docs; compare docs with the entry masked
def mask(o):
    if isinstance(o, dict):
        if o.get('id') == 'D001-26003-03-MASTER.pdf' and o.get('kind') == 'map': return 'REGISTER'
        return {k: mask(v) for k, v in o.items()}
    if isinstance(o, list): return [mask(v) for v in o]
    return o
for k in B:
    if k in ('media', 'sheets', 'hostedMedia'): continue
    check(mask(B[k]) == mask(N[k]), 'DATA.' + k + ' changed outside the register entry')
# the media manifest: only its hash moves, and it must be the hash of exactly the page's media list
check({k: v for k, v in B['hostedMedia'].items() if k != 'manifest'} == {k: v for k, v in N['hostedMedia'].items() if k != 'manifest'}, 'hostedMedia changed beyond its manifest')
import hashlib
def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)
def mhash(D): return hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': sorted(({k: x[k] for k in ('bytes', 'file', 'scope', 'sha256', 'type')} for x in D['media'].values()), key=lambda x: x['file'])}).encode('utf-8')).hexdigest()
check(mhash(B) == B['hostedMedia']['manifest'], 'base manifest does not match its media')
check(mhash(N) == N['hostedMedia']['manifest'], 'candidate manifest does not match its media')
check([s for s in B['sheets'] if s['key'] != 'D001'] == [s for s in N['sheets'] if s['key'] != 'D001'], 'another sheet changed')
b1, n1 = (next(s for s in X['sheets'] if s['key'] == 'D001') for X in (B, N))
check({k: v for k, v in b1.items() if k not in ('src', 'subtitle')} == {k: v for k, v in n1.items() if k not in ('src', 'subtitle')}, 'D001 changed beyond its picture and subtitle')
added = set(N['media']) - set(B['media']); removed = set(B['media']) - set(N['media'])
check(added == {m['sha256'] for m in C['media']}, 'unexpected media added')
check(all(B['media'][k] == N['media'][k] for k in set(B['media']) & set(N['media'])), 'an existing media entry changed')
for k in removed:
    check(k == 'd0df399ee0f4adb179772cddaec164db1be0c026aac10473883d1211a5afc567' or any(k in (BL.get(r, {}).get('img') or []) for r in C['master_loc']), 'removed media still in use: ' + k)
check({k: v for k, v in BL.items() if k not in C['master_loc']} == {k: v for k, v in NL.items() if k not in C['master_loc']}, 'a pin outside the change list moved')
check(all(NL[k] == v for k, v in C['master_loc'].items()), 'a changed pin differs from the change list')
# Andrew, 8 Oct 2026: "All navigation pin points are correct." No existing navigation pin (ll) may move.
check(all(NL[k].get('ll') == v.get('ll') for k, v in BL.items() if k in NL), 'an existing navigation pin moved')
if fails:
    print('FAIL', '; '.join(fails)); sys.exit(1)
print('PASS only the master picture, its register entry, the media list and the', len(C['master_loc']), 'listed pins changed (+%d/-%d media)' % (len(added), len(removed)))
