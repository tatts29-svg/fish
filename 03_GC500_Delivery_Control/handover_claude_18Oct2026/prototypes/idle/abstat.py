"""Medians across A/B runs. usage: abstat.py TAG [variants...]"""
import json, sys, glob, statistics as st, os, re, collections, bisect
D = '/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perf/idle-sync/'
tag = sys.argv[1]; variants = sys.argv[2:] or ['base', 'proto']
def prof_buckets(path):
    if not path or not os.path.exists(path): return {}
    p = json.load(open(path)); nodes = {n['id']: n for n in p['nodes']}; parent = {}
    for n in p['nodes']:
        for c in n.get('children', []): parent[c] = n['id']
    t = collections.Counter()
    for i, s in enumerate(p['samples']): t[s] += (p['timeDeltas'][i + 1] if i + 1 < len(p['timeDeltas']) else 0) / 1000
    out = collections.Counter()
    for nid, ms in t.items():
        fn = nodes[nid]['callFrame']['functionName']
        if fn == '(idle)': out['idle'] += ms; continue
        out['busy'] += ms
        if fn in ('(program)', '(garbage collector)'): out[fn] += ms; continue
        chain = []; x = nid
        while x is not None: chain.append(nodes[x]['callFrame']['functionName']); x = parent.get(x)
        if 'mount' in chain and 'schedule' not in chain and any(c == 'mount' for c in chain) and 'syncFooter' not in chain and 'render' not in chain and 'tpodTick' not in chain: pass
        if 'syncFooter' in chain: out['syncFooter chain'] += ms
        elif 'tpodTick' in chain or 'tpodPaint' in chain: out['clock'] += ms
        elif 'render' in chain or 'redraw' in chain: out['render'] += ms
        elif 'mount' in chain: out['mount (rAF)'] += ms
        else: out['other js'] += ms
    return out
rows = collections.defaultdict(lambda: collections.defaultdict(list))
for v in variants:
    for f in sorted(x for x in glob.glob(D + 'runs/%s_%s_*.json' % (tag, v)) if re.fullmatch(r'%s_%s_\d+\.json' % (tag, v), os.path.basename(x))):
        o = json.load(open(f))
        if o.get('err'): print('ERR', f, o['err'][:200]); continue
        for w in o['windows']:
            k = rows[(v, w['tab'])]
            for m in ('busyPct', 'task', 'script', 'layout', 'style', 'layoutN', 'styleN'): k[m].append(w[m])
            k['lt_n'].append(w['lt']['n']); k['lt_total'].append(w['lt']['total']); k['lt_max'].append(w['lt']['max'])
            pb = prof_buckets(w.get('profile'))
            for b in ('busy', '(program)', '(garbage collector)', 'syncFooter chain', 'clock', 'mount (rAF)', 'render', 'other js'): k['prof ' + b].append(round(pb.get(b, 0)))
            r = w.get('refresh')
            if r:
                k['refresh task'].append(r['task']); lt = r['lt']; k['refresh lt max'].append(max([x[1] for x in lt] or [0])); k['refresh lt total'].append(sum(x[1] for x in lt))
med = lambda L: st.median(L) if L else None
metrics = ['busyPct', 'task', 'script', 'layout', 'style', 'layoutN', 'styleN', 'lt_n', 'lt_total', 'lt_max', 'prof busy', 'prof (program)', 'prof (garbage collector)', 'prof syncFooter chain', 'prof clock', 'prof mount (rAF)', 'prof render', 'prof other js', 'refresh task', 'refresh lt max', 'refresh lt total']
for tab in ('today', 'plant'):
    print('=== %s (median of runs; values per 60 s idle window; refresh = 30 s after one re-delivery)' % tab)
    print('%-26s' % 'metric' + ''.join('%-30s' % v for v in variants))
    for m in metrics:
        print('%-26s' % m + ''.join('%-30s' % ('%s  %s' % (med(rows[(v, tab)][m]), rows[(v, tab)][m])) for v in variants))
