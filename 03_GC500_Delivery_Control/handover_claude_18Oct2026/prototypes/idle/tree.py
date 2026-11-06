"""Top-down call tree of a .cpuprofile, nodes above a threshold (ms). usage: tree.py page.html prof [minms] [maxdepth]"""
import sys, json, re, bisect, collections
html = open(sys.argv[1], encoding='utf-8').read(); prof = json.load(open(sys.argv[2]))
minms = float(sys.argv[3]) if len(sys.argv) > 3 else 30; maxd = int(sys.argv[4]) if len(sys.argv) > 4 else 30
starts = [0] + [m.end() for m in re.finditer('\n', html)]
scripts = [(m.start(2), m.end(2), (re.search(r'id="([^"]+)"', m.group(1)) or [None, ''])[1], i) for i, m in enumerate(re.finditer(r'<script([^>]*)>(.*?)</script>', html, re.S))]
sst = [s[0] for s in scripts]
def loc(cf):
    url = cf.get('url', '')
    if 'railway.app/v/' not in url: return url.split('/')[-1][:20]
    off = starts[cf['lineNumber']] + cf['columnNumber']; i = bisect.bisect_right(sst, off) - 1
    return '%03d' % scripts[i][3] if i >= 0 and scripts[i][0] <= off < scripts[i][1] else 'html'
nodes = {n['id']: n for n in prof['nodes']}
selft = collections.Counter()
for i, s in enumerate(prof['samples']):
    selft[s] += (prof['timeDeltas'][i + 1] if i + 1 < len(prof['timeDeltas']) else 0) / 1000
incl = {}
def tot(nid):
    if nid in incl: return incl[nid]
    n = nodes[nid]; t = selft[nid] + sum(tot(c) for c in n.get('children', [])); incl[nid] = t; return t
sys.setrecursionlimit(100000)
root = prof['nodes'][0]['id']; tot(root)
def show(nid, d):
    n = nodes[nid]; cf = n['callFrame']; t = incl[nid]
    if t < minms or d > maxd: return
    print('%s%6.0f %5.0f  %s %s:%d' % ('  ' * d, t, selft[nid], cf['functionName'] or '(anon)', loc(cf), cf['lineNumber'] + 1))
    for c in sorted(n.get('children', []), key=lambda c: -incl[c]): show(c, d + 1)
show(root, 0)
