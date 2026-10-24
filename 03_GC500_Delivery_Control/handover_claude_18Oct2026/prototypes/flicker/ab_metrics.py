"""A/B metrics from record.cjs runs: layout shift, what the screen did before the record appeared, the saved-copy
fallback, and how long the screen stayed frozen after a tab press. usage: ab_metrics.py DIR"""
import json, os, sys, statistics as st
import numpy as np
from PIL import Image
D = sys.argv[1]
def frames_diff(run, L, t0, t1, thr=0.003):
    T0 = L['timeOrigin']; out = []; prev = None
    for f in L['frames']:
        t = f['ts'] * 1000 - T0
        if t > t1: break
        try: a = np.asarray(Image.open(os.path.join(run, 'frames', f['fn'])).convert('L').resize((130, 281)), dtype=np.int16)
        except Exception: continue
        if prev is not None and t >= t0:
            frac = float((np.abs(a - prev) > 24).mean())
            if frac >= thr: out.append((round(t), round(frac, 3)))
        prev = a
    return out
def metrics(run):
    L = json.load(open(os.path.join(run, 'log.json'))); fl = L['fl']; T0 = L['timeOrigin']
    ev = fl['ev']; ls = [x for x in fl['ls'] if not x['inp']]
    ready = next((e[0] for e in ev if e[1] == 'REFRESH904' and e[2] == 'ready'), None)
    saved = next((e[0] for e in ev if e[1] == 'REFRESH904' and e[2] == 'saved'), None)
    clicks = [e for e in ev if e[1] == 'TAB-CLICK']
    m = {'run': os.path.basename(run), 'fcp': next((p[1] for p in fl['paint'] if p[0] == 'first-contentful-paint'), None),
         'ready_ms': ready, 'saved_shown_ms': saved,
         'cls_load': round(sum(x['v'] for x in ls if ready is None or x['t'] <= ready + 2000), 4),
         'cls_all': round(sum(x['v'] for x in ls), 4),
         'shifts': [(x['t'], x['v'], ','.join(s['n'] for s in x['src'])[:60]) for x in ls]}
    m['visual_changes_before_record'] = frames_diff(run, L, 0, (ready or 30000) - 1, 0.003)
    ft = [f['ts'] * 1000 - T0 for f in L['frames']]
    taps = []
    for c in clicks:
        t = c[0]; vis = next((e[0] for e in ev if e[1] == 'VIS' and e[0] > t and ('pane-' + c[2]) in e[2]), None)
        between = [x for x in ft if t <= x <= (vis or t) + 400]
        gaps = [b - a for a, b in zip([t] + between, between)] if between else []
        first = next((x for x in ft if x > t), None)
        taps.append({'tab': c[2], 'tap_to_pane_ms': round(vis - t) if vis else None, 'first_frame_ms': round(first - t) if first else None,
                     'longest_frozen_ms': round(max(gaps)) if gaps else None, 'frames_while_waiting': len(between)})
    m['taps'] = taps
    return m
runs = sorted(d for d in os.listdir(D) if os.path.isdir(os.path.join(D, d)) and os.path.exists(os.path.join(D, d, 'log.json')))
res = {r: metrics(os.path.join(D, r)) for r in runs}
json.dump(res, open(os.path.join(D, 'metrics.json'), 'w'), indent=1)
for r, m in res.items():
    print(r, 'fcp', m['fcp'], 'ready', m['ready_ms'], 'saved', m['saved_shown_ms'], 'CLS load', m['cls_load'], 'all', m['cls_all'])
    print('   shifts', m['shifts'])
    print('   visual changes before record', m['visual_changes_before_record'])
    print('   taps', m['taps'])
def med(group, f):
    v = [f(res[r]) for r in res if r.startswith(group)]; v = [x for x in v if x is not None]
    return (round(st.median(v), 4) if v else None, v)
print('\nMEDIANS')
for g in ['base_n', 'proto_n', 'base_s', 'proto_s']:
    print(g, 'CLS load', med(g, lambda m: m['cls_load']), 'saved shown', [res[r]['saved_shown_ms'] for r in res if r.startswith(g)],
          'visual changes before record', med(g, lambda m: len(m['visual_changes_before_record'])),
          'sum of change area before record', med(g, lambda m: round(sum(x[1] for x in m['visual_changes_before_record'][1:]), 3)))
    for k in range(2):
        print('   tap', k, 'tap->pane', med(g, lambda m: m['taps'][k]['tap_to_pane_ms'] if len(m['taps']) > k else None),
              'longest frozen', med(g, lambda m: m['taps'][k]['longest_frozen_ms'] if len(m['taps']) > k else None),
              'frames while waiting', med(g, lambda m: m['taps'][k]['frames_while_waiting'] if len(m['taps']) > k else None))
