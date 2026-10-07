# Author: Andrew Fisher. v8.93 changes only what the aligned master needs: the D001 picture, the media list, the three inset
# pins' drawing positions and the pins' pictures. Everything else in DATA and MASTER_LOC is identical to the v8.89 page, and
# no navigation pin (ll) moves at all.
#   python3 test_identity893.py <v8.89 page> <v8.93 page>
import hashlib, json, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
C = json.loads((here.parent / 'changes893.json').read_text())
def read(p):
    s = Path(p).read_text()
    D = json.loads(re.search(r'const DATA = (\{.*?\});\n', s).group(1))
    m = re.search(r'(const|var|let)\s+MASTER_LOC\s*=\s*', s); ML, _ = json.JSONDecoder().raw_decode(s[m.end():])
    return D, ML, s
(B, BL, bs), (N, NL, ns) = read(sys.argv[1]), read(sys.argv[2])
fails = []
def check(cond, what):
    if not cond: fails.append(what)
for k in B:
    if k in ('media', 'sheets', 'hostedMedia'): continue
    check(B[k] == N[k], 'DATA.' + k + ' changed')
check(set(N) == set(B), 'DATA keys changed')
check({k: v for k, v in B['hostedMedia'].items() if k != 'manifest'} == {k: v for k, v in N['hostedMedia'].items() if k != 'manifest'}, 'hostedMedia changed beyond its manifest')
def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)
def mhash(D): return hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': sorted(({k: x[k] for k in ('bytes', 'file', 'scope', 'sha256', 'type')} for x in D['media'].values()), key=lambda x: x['file'])}).encode('utf-8')).hexdigest()
check(mhash(N) == N['hostedMedia']['manifest'], 'candidate manifest does not match its media')
check([s for s in B['sheets'] if s['key'] != 'D001'] == [s for s in N['sheets'] if s['key'] != 'D001'], 'another sheet changed')
b1, n1 = (next(s for s in X['sheets'] if s['key'] == 'D001') for X in (B, N))
check({k: v for k, v in b1.items() if k != 'src'} == {k: v for k, v in n1.items() if k != 'src'}, 'D001 changed beyond its picture')
check(n1['src'] == {'media': C['sheet_media']['sha256']} and b1['src'] == {'media': C['previous_sheet_sha256']}, 'D001 picture is not the v8.93 one')
added = set(N['media']) - set(B['media']); removed = set(B['media']) - set(N['media'])
check(added == {m['sha256'] for m in C['media']}, 'unexpected media added')
check(all(B['media'][k] == N['media'][k] for k in set(B['media']) & set(N['media'])), 'an existing media entry changed')
allowed_removed = {C['previous_sheet_sha256']} | {x for ch in C['master_loc'].values() for x in (ch.get('img_was') or [])}
for k in removed: check(k in allowed_removed, 'removed media still in use: ' + k)
for k in allowed_removed - removed: check(ns.count(k) > 3, 'old picture kept in the media list although nothing uses it: ' + k)
check(set(BL) == set(NL), 'a pin was added or removed')
for k, v in BL.items():
    n = NL.get(k, {}); ch = C['master_loc'].get(k, {})
    want = dict(v)
    if 'pt' in ch: want['pt'] = ch['pt']
    if 'img' in ch: want['img'] = ch['img']
    check(n == want, 'pin %s differs from the change list' % k)
    check(n.get('ll') == v.get('ll') and n.get('pts') == v.get('pts'), 'navigation pin %s moved' % k)
check(all(NL[k]['pt'] == ch['pt'] for k, ch in C['master_loc'].items() if 'pt' in ch), 'an inset pin is not back on its 17 Sep position')
check(len(re.findall(r' · v8\.93\b', ns)) == 1 and not re.search(r' · v8\.(?:89|91|92)\b', ns), 'release footer')
if fails:
    print('FAIL', '; '.join(fails[:12])); sys.exit(1)
print('PASS only the D001 picture, the media list (+%d/-%d), %d inset pins (pt) and %d pins\' pictures changed; every navigation pin as in v8.89' % (len(added), len(removed), sum(1 for ch in C['master_loc'].values() if 'pt' in ch), sum(1 for ch in C['master_loc'].values() if 'img' in ch)))
