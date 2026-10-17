import json, glob, statistics as st, sys
def med(xs): xs=[x for x in xs if x is not None]; return round(st.median(xs),1) if xs else None
def load(prefix, v, n):
    out=[]
    for i in range(1, n+1):
        try: out.append(json.load(open(f'runs/{prefix}_{v}_{i}.json')))
        except Exception: pass
    return out
for prefix, n in [('cmpd7_tl',3),('cmpd7_pl',3),('cmpp7_tl',3),('cmpp7_pl',1),('cmpd2r_tl',3)]:
    for v in ['base','proto_v7','proto_v2']:
        rs=load(prefix,v,n)
        if not rs: continue
        g=lambda f: [f(r) for r in rs if 'switch' in r]
        print(prefix, v, 'n=%d'%len(rs), 'go', g(lambda r:r['switch']['goMs']), 'med', med(g(lambda r:r['switch']['goMs'])),
              '| LT4s med', med(g(lambda r:r['switch']['lt']['total'])), '| style med', med(g(lambda r:r['switchMetrics']['RecalcStyleDuration'])), '| task med', med(g(lambda r:r['switchMetrics']['TaskDuration'])),
              '| idle LT15s med', med(g(lambda r:r['idle']['lt']['total'])), 'idle n', g(lambda r:r['idle']['lt']['n']), '| idle task', med(g(lambda r:r['idleMetrics']['TaskDuration'])))
for f in sorted(glob.glob('runs/swipe_p_*.json'))+sorted(glob.glob('runs/redraw_*.json')):
    d=json.load(open(f)); print(f, json.dumps({k:d[k] for k in d if k in ('steps','refresh','swipe','before','after','err')})[:900])
