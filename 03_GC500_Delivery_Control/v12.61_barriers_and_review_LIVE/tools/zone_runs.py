"""Read the water barrier runs off the K-sheets (yellow pieces), place them on the master, the frame and the ground.
Inputs: the drawing PDF (private, scratchpad), words.json (pdftotext), kreg_zone_to_master.json, k220_pt_to_frame.json.
Output: zone_runs.json with every run: sheet, zone, pieces, length, label nearby, polyline in lat/lon + centre."""
import json, math, re, sys, os, collections
import pymupdf
# The drawing PDF and its pdftotext words stay private: point GC500_WFB_IN at the folder holding k220_k231.pdf and words.json.
IN = os.environ.get('GC500_WFB_IN', '/tmp/gc500-scratch/wfb_in/k/').rstrip('/') + '/'
HERE = os.path.dirname(os.path.abspath(__file__)) + '/'
doc = pymupdf.open(IN + 'k220_k231.pdf')
W = json.load(open(IN + 'words.json'))
REG = {int(k): v for k, v in json.load(open(HERE + 'kreg_zone_to_master.json')).items()}
AF = json.load(open(HERE + 'k220_pt_to_frame.json'))
G = {"frame_px": [4760, 2994], "A": [[0.0010859837328660441, -0.38321597589039774, 17079982.19084447], [-0.3854343345049615, -0.0008656214347303572, -3246543.9438186516]]}

def ctr(w): return ((w[0] + w[2]) / 2, (w[1] + w[3]) / 2)

def two_point(pg, labels):
    """similarity fit from two labels unique on the sheet and on the master"""
    m = {w[4]: ctr(w) for w in W['1'] if w[4] in labels and ctr(w)[1] < 1480 and not (ctr(w)[0] > 1450 and ctr(w)[1] > 865)}
    k = {w[4]: ctr(w) for w in W[str(pg)] if w[4] in labels and ctr(w)[1] < 1480}
    a, b = labels
    if a not in m or b not in m or a not in k or b not in k: return None
    dk = math.dist(k[a], k[b]); dm = math.dist(m[a], m[b]); s = dm / dk
    ang = math.atan2(m[b][1] - m[a][1], m[b][0] - m[a][0]) - math.atan2(k[b][1] - k[a][1], k[b][0] - k[a][0])
    return {'s': s, 'rot': ang, 'ka': k[a], 'ma': m[a], 'n': 2, 'tags': labels}

def to_master(pg, p):
    R = REG.get(pg)
    if R and 'rot' not in R: return (R['s'] * p[0] + R['tx'], R['s'] * p[1] + R['ty'])
    if R and 'rot' in R:
        dx, dy = p[0] - R['ka'][0], p[1] - R['ka'][1]; c, s_ = math.cos(R['rot']), math.sin(R['rot'])
        return (R['ma'][0] + R['s'] * (c * dx - s_ * dy), R['ma'][1] + R['s'] * (s_ * dx + c * dy))
    return None

def to_frame(mp): return (AF['fx'][0] * mp[0] + AF['fx'][1] * mp[1] + AF['fx'][2], AF['fy'][0] * mp[0] + AF['fy'][1] * mp[1] + AF['fy'][2])

def to_ll(fr):
    u = fr[0] * G['frame_px'][0]; v = fr[1] * G['frame_px'][1]; A = G['A']
    x = A[0][0] * u + A[0][1] * v + A[0][2]; y = A[1][0] * u + A[1][1] * v + A[1][2]
    R = 6378137; lon = x / R * 180 / math.pi; lat = (2 * math.atan(math.exp(y / R)) - math.pi / 2) * 180 / math.pi
    return (round(lat, 6), round(lon, 6))

# two-point registrations for the sheets the label fit could not do
for pg, labs in ((11, ('T2', 'T3')), (12, ('T9', 'T10'))):
    r = two_point(pg, labs)
    if r: REG[pg] = r; print('two-point fit page', pg, 'scale %.4f rot %.3f' % (r['s'], r['rot']))

MPT_PER_M = 2384 / 1620.1  # master K220 pt per metre, from the frame's ground size (1:2000 -> 1 m = 1.417 pt at A1)
def pieces_on(pg):
    page = doc[pg - 1]
    R = REG.get(pg); s = R['s'] if R else 1
    piece_pt = 2.0 * (MPT_PER_M / s)   # a 2 m piece in this sheet's points
    out = []
    for d in page.get_drawings():
        f = d.get('fill')
        if not f: continue
        r = d['rect']
        if r.y1 > 1480: continue
        if pg == 1 and r.x0 > 1450 and r.y0 > 865: continue
        wdt, hgt = r.width, r.height
        long_, short = max(wdt, hgt), min(wdt, hgt)
        yellow = f[0] > 0.85 and 0.55 < f[1] < 0.9 and f[2] < 0.3
        if not yellow: continue
        if not (0.35 * piece_pt < long_ < 2.5 * piece_pt and short < 1.2 * piece_pt): continue
        out.append(((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, long_, short))
    return out, piece_pt

def runs_from(pieces, gap):
    n = len(pieces); par = list(range(n))
    def f(a):
        while par[a] != a: par[a] = par[par[a]]; a = par[a]
        return a
    for i in range(n):
        for j in range(i + 1, n):
            if math.dist(pieces[i][:2], pieces[j][:2]) < gap: par[f(i)] = f(j)
    groups = collections.defaultdict(list)
    for i in range(n): groups[f(i)].append(pieces[i])
    runs = []
    for mem in groups.values():
        pts = [(p[0], p[1]) for p in mem]
        cx = sum(p[0] for p in pts) / len(pts); cy = sum(p[1] for p in pts) / len(pts)
        # principal axis
        sxx = sum((p[0] - cx) ** 2 for p in pts); syy = sum((p[1] - cy) ** 2 for p in pts); sxy = sum((p[0] - cx) * (p[1] - cy) for p in pts)
        ang = 0.5 * math.atan2(2 * sxy, sxx - syy)
        order = sorted(pts, key=lambda p: (p[0] - cx) * math.cos(ang) + (p[1] - cy) * math.sin(ang))
        runs.append({'pieces': len(pts), 'centre': (cx, cy), 'poly': order})
    return runs

def labels_on(pg):
    ws = W[str(pg)]
    lines = collections.defaultdict(list)
    for w in ws: lines[round(w[1] / 6)].append(w)
    labs = []
    for lw in lines.values():
        lw.sort(key=lambda w: w[0]); txt = ' '.join(w[4] for w in lw)
        for m in re.finditer(r'(\d+)x? (COATES )?WFB', txt):
            # position: the words of the match
            idx = txt[:m.start()].count(' ')
            w0 = lw[min(idx, len(lw) - 1)]
            labs.append({'n': int(m.group(1)), 'text': m.group(0), 'pos': ctr(w0)})
        if 'MOVED TO FERNY' in txt: labs.append({'n': 10, 'text': txt[:60], 'pos': ctr(lw[0])})
    return labs

ZONE = {2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9, 11: 10, 12: 11}
result = []
for pg in [2, 3, 7, 9, 10, 11, 12]:
    if pg not in REG: print('page', pg, 'no registration, skipped'); continue
    pieces, piece_pt = pieces_on(pg)
    runs = runs_from(pieces, gap=3.2 * piece_pt)
    labs = labels_on(pg)
    s = REG[pg]['s']
    for r in runs:
        if r['pieces'] < 2: continue
        near = sorted(labs, key=lambda L: math.dist(L['pos'], r['centre']))
        mp = [to_master(pg, p) for p in r['poly']]
        ll = [to_ll(to_frame(m)) for m in mp]
        c = to_ll(to_frame(to_master(pg, r['centre'])))
        length_m = sum(math.dist(mp[i], mp[i + 1]) for i in range(len(mp) - 1)) / MPT_PER_M if len(mp) > 1 else 0
        result.append({'sheet': 'K%d' % (219 + pg), 'zone': ZONE[pg], 'page': pg, 'pieces_yellow': r['pieces'], 'length_m': round(length_m, 1),
                       'label': near[0]['text'] if near else None, 'label_dist_m': round(math.dist(near[0]['pos'], r['centre']) * s / MPT_PER_M, 1) if near else None,
                       'centre_ll': c, 'poly_ll': ll, 'centre_frame': to_frame(to_master(pg, r['centre'])), 'poly_frame': [to_frame(m) for m in mp]})
    print('page', pg, 'zone', ZONE[pg], 'yellow pieces', len(pieces), 'runs', len([r for r in runs if r['pieces'] >= 2]), 'labels', [(L['n'], L['text'][:28]) for L in labs])
json.dump(result, open(os.environ.get('GC500_WFB_OUT', IN + 'zone_runs.json'), 'w'), indent=1)
for r in sorted(result, key=lambda r: (r['zone'], -r['pieces_yellow'])):
    print(r['sheet'], 'zone', r['zone'], '| yellow', r['pieces_yellow'], '| ~%s m' % r['length_m'], '| label', r['label'], '(%s m)' % r['label_dist_m'], '| centre', r['centre_ll'])
