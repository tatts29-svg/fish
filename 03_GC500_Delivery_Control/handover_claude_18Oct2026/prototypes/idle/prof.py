"""Summarise a .cpuprofile: self time and inclusive time per function, located to inline script and patch.
usage: prof.py page.html file.cpuprofile [topN] [--incl] [--filter substr]"""
import sys, json, re, bisect, collections
html = open(sys.argv[1], encoding='utf-8').read()
prof = json.load(open(sys.argv[2]))
top = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3].isdigit() else 40
starts = [0] + [m.end() for m in re.finditer('\n', html)]
scripts = [(m.start(2), m.end(2), (re.search(r'id="([^"]+)"', m.group(1)) or [None, ''])[1], i) for i, m in enumerate(re.finditer(r'<script([^>]*)>(.*?)</script>', html, re.S))]
sstarts = [s[0] for s in scripts]
def loc(cf):
    url = cf.get('url', '')
    if 'railway.app/v/' not in url: return (url.split('/')[-1][:30] or '')
    off = starts[cf['lineNumber']] + cf['columnNumber'] if cf['lineNumber'] >= 0 else -1
    i = bisect.bisect_right(sstarts, off) - 1
    if i >= 0 and scripts[i][0] <= off < scripts[i][1]: return '%03d%s' % (scripts[i][3], (' ' + scripts[i][2][:28]) if scripts[i][2] else '')
    return 'html'
nodes = {n['id']: n for n in prof['nodes']}
parent = {}
for n in prof['nodes']:
    for c in n.get('children', []): parent[c] = n['id']
# sample time deltas
dt = collections.Counter()
samples, deltas = prof['samples'], prof['timeDeltas']
for i, s in enumerate(samples):
    d = deltas[i + 1] if i + 1 < len(deltas) else 0
    dt[s] += d / 1000.0
total = sum(dt.values())
selfs = collections.Counter(); incl = collections.Counter(); script_self = collections.Counter()
def key(n):
    cf = n['callFrame']; return '%s | %s:%d' % (cf['functionName'] or '(anon)', loc(cf), cf['lineNumber'] + 1)
for nid, t in dt.items():
    n = nodes[nid]; selfs[key(n)] += t; script_self[loc(n['callFrame']) or n['callFrame']['functionName']] += t
    seen = set(); x = nid
    while x is not None:
        k = key(nodes[x])
        if k not in seen: incl[k] += t; seen.add(k)
        x = parent.get(x)
print('total sampled ms %.0f' % total)
print('--- self by script')
for k, v in script_self.most_common(25): print('%8.0f  %s' % (v, k))
print('--- self by function')
for k, v in selfs.most_common(top): print('%8.0f  %s' % (v, k))
if '--incl' in sys.argv:
    print('--- inclusive')
    flt = sys.argv[sys.argv.index('--filter') + 1] if '--filter' in sys.argv else None
    for k, v in incl.most_common(top * 3):
        if flt and flt not in k: continue
        print('%8.0f  %s' % (v, k))
