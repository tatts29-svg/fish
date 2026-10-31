# Author: Andrew Fisher.
# Trace what the 2 Oct master D001-26003-03 draws but v9.15 missed, in v9.15's frame and component schema.
# Read only. Output: traced_new.json (ref -> [components]) + tracecrops/*.png.
#   python3 -I trace_new.py
import sys, os, json, math, hashlib, collections, importlib.util
import pymupdf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from tl import region, PDF
S = '/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad'
spec = importlib.util.spec_from_file_location('b915', S + '/shapes/b/build_shapes.py')
B = importlib.util.module_from_spec(spec); spec.loader.exec_module(B)
V915 = '/home/user/fish/03_GC500_Delivery_Control/v9.15_master_shapes_DRAFT/shapes_v915.json'
PDF_SHA = '8753d875cf90682e09afefae8c774144d9e9725ece87f726707882fb3711c56d'
M = B.M_PER_PT
in_inset, to_frame, from_frame = B.in_inset, B.to_frame, B.from_frame
dist, sub, add, mul, dot, unit = B.dist, B.sub, B.add, B.mul, B.dot, B.unit

assert B.sha(PDF) == PDF_SHA
doc = pymupdf.open(PDF); page = doc[0]
v915 = json.load(open(V915))
runs = {r['run']: r for r in json.load(open(HERE + '/wfb_runs.json'))}
used915 = set()
for k, e in v915['refs'].items():
    if e.get('shape'):
        for c in e['shape']['components']:
            used915.add(c['pdf'].get('drawing'))
            used915.update(c['pdf'].get('drawings', []))

HOW = 'traced from D001-26003-03 vector, 2 Oct 2026 issue (read 9 Oct 2026, v9.15 method)'
problems = []
excluded_pieces = []


def P(p): return (float(p[0]), float(p[1]))


def drawing_by_id(i, near):
    x, y = near
    for d in region(x - 30, y - 30, x + 30, y + 30):
        if d['i'] == i:
            return d
    raise KeyError(i)


def dpts(d):
    out = []
    for k, pp in d['items']:
        out += [P(p) for p in pp]
    return out


def uniq(pts, tol=0.03):
    u = []
    for q in pts:
        if all(dist(q, w) > tol for w in u):
            u.append(q)
    return u


def assemble(kind, label, poly, marks=None, doors=None, door_idx=None, door_note='', pdf=None, extra=None):
    cen, area = B.area_centroid(poly)
    inset = in_inset(*cen)
    L, W, ang = B.long_axis(poly)
    jc = {'kind': kind, 'label': label,
          'poly': [to_frame(p, inset) for p in poly],
          'poly_pt': [[round(p[0], 3), round(p[1], 3)] for p in poly],
          'centroid': to_frame(cen, inset), 'centroid_pt': [round(cen[0], 3), round(cen[1], 3)],
          'size_m': [round(L * M, 2), round(W * M, 2)], 'angle_deg': round(ang, 2),
          'area_m2': round(area * M ** 2, 1), 'inset': inset}
    jc['doors'] = doors or []
    jc['door'] = jc['doors'][door_idx] if door_idx is not None else None
    jc['door_note'] = door_note
    jc['marks'] = marks or []
    jc['pdf'] = pdf or {}
    if extra:
        jc.update(extra)
    return jc


# ---------------- generators (v9.15 method: orange outline group, convex hull, diagonal, dark triangle image) -------
def trace_generator(seed_i, near):
    d0 = drawing_by_id(seed_i, near)
    assert d0['stroke'] == '#ff7f00', (seed_i, d0['stroke'])
    cc = near
    group = {seed_i}; grown = True
    cand = [d for d in region(cc[0] - 8, cc[1] - 8, cc[0] + 8, cc[1] + 8) if d['stroke'] == '#ff7f00']
    byid = {d['i']: d for d in cand}; byid[seed_i] = d0
    while grown:
        grown = False
        gpts = [q for k in group for q in dpts(byid[k])]
        for d in cand:
            if d['i'] in group:
                continue
            if any(dist(q, r_) <= 0.05 for q in dpts(d) for r_ in gpts):
                group.add(d['i']); grown = True
    segs = []
    for k in sorted(group):
        for kind, ip in byid[k]['items']:
            ip = [P(p) for p in ip]
            if kind == 'l':
                segs.append((ip[0], ip[1]))
            elif kind in ('qu', 're'):
                segs += [(ip[m], ip[(m + 1) % 4]) for m in range(4)]
    allp = uniq([q for k in sorted(group) for q in dpts(byid[k])])
    poly = [tuple(p) for p in B.convex_hull(allp)]
    assert len(poly) == 4, (seed_i, poly)
    hull_edges = [(poly[m], poly[(m + 1) % 4]) for m in range(4)]
    def is_edge(a_, b_):
        return any((dist(a_, e0) < 0.05 and dist(b_, e1) < 0.05) or (dist(a_, e1) < 0.05 and dist(b_, e0) < 0.05) for e0, e1 in hull_edges)
    diag = []
    for a_, b_ in segs:
        if not is_edge(a_, b_) and dist(a_, b_) > 0.05 and not any(dist(a_, x0) < 0.05 and dist(b_, x1) < 0.05 for x0, x1 in diag):
            diag.append((a_, b_))
    verr = max(min(dist(v, q) for q in allp) for v in poly)
    tri = None; tri_pdf = None
    for info in B.IMGS(page):
        bb = info['bbox']
        ctr = ((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2)
        if info['width'] > 40 or info['height'] > 40 or not B.point_in_poly(ctr, poly):
            continue
        tri = B.triangle_from_image(doc, info)
        if tri:
            tri_pdf = {'image_xref': info['xref'], 'bbox_pt': [round(v, 3) for v in bb], 'px': [info['width'], info['height']]}
            break
    cen, _ = B.area_centroid(poly); inset = in_inset(*cen)
    marks = []
    if diag:
        marks.append({'type': 'line', 'what': 'the orange diagonal drawn across the generator box',
                      'lines': [[to_frame(a, inset), to_frame(b, inset)] for a, b in diag]})
    if tri:
        marks.append({'type': 'triangle', 'what': 'the dark triangle in the generator symbol (a small masked image on the master; '
                      'outline fitted to its mask pixels, about 0.4 pt per pixel)', 'poly': [to_frame(p, inset) for p in tri], 'pdf': tri_pdf})
    else:
        problems.append(('generator', seed_i, 'no dark triangle image inside the box'))
    pdf = {'drawings': sorted(group), 'seqnos': [byid[k]['seqno'] for k in sorted(group)], 'stroke': '#ff7f00',
           'width': round(d0['w'] or 0, 3), 'vertex_err_pt': round(verr, 4), 'drawing': seed_i, 'seqno': d0['seqno']}
    return assemble('generator', 'generator symbol (orange)', poly, marks=marks,
                    door_note='generator: the master draws a symbol (orange box with a dark triangle), no door', pdf=pdf)


# ---------------- FWF single toilet (outline quad + chevron, v9.15 rules) ----------------
def trace_toilet(qi, near):
    d = drawing_by_id(qi, near)
    assert d['stroke'] == '#000000' and len(d['items']) == 1 and d['items'][0][0] == 'qu', qi
    near = ((d['rect'][0] + d['rect'][2]) / 2, (d['rect'][1] + d['rect'][3]) / 2)
    poly = [P(p) for p in d['items'][0][1]]
    marks = []
    n = 4
    edges = [(poly[i], poly[(i + 1) % n]) for i in range(n)]
    for c in region(near[0] - 3, near[1] - 3, near[0] + 3, near[1] + 3):
        its = c['items']
        if c['stroke'] != '#000000' or len(its) != 2 or its[0][0] != 'l' or its[1][0] != 'l':
            continue
        a0, a1 = P(its[0][1][0]), P(its[0][1][1]); b0, b1 = P(its[1][1][0]), P(its[1][1][1])
        if dist(a1, b0) > 0.05:
            continue
        for ei, (a, b) in enumerate(edges):
            dh, th = B.seg_proj(a1, a, b)
            if dh < 0.2 and abs(th - 0.5) < 0.15:
                pe, ne = edges[(ei - 1) % n], edges[(ei + 1) % n]
                if all(min(B.seg_proj(e, *pe)[0], B.seg_proj(e, *ne)[0]) < 0.25 for e in (a0, b1)):
                    cen, _ = B.area_centroid(poly); inset = in_inset(*cen)
                    marks.append({'type': 'chevron', 'edge_index': ei,
                                  'what': 'FWF chevron drawn on this edge (the legend does not say what it means; not read as a door)',
                                  'lines': [[to_frame(a0, inset), to_frame(a1, inset)], [to_frame(b0, inset), to_frame(b1, inset)]],
                                  'pdf': {'drawing': c['i'], 'seqno': c['seqno']}})
    if not marks:
        problems.append(('toilet', qi, 'no chevron found'))
    pdf = {'drawing': qi, 'seqno': d['seqno'], 'type': d['type'], 'stroke': d['stroke'], 'fill': d['fill'],
           'width': round(d['w'], 3), 'vertex_err_pt': 0.0, 'outline_only': True}
    return assemble('toilet', 'toilet (1.2 m FWF symbol)', poly, marks=marks,
                    door_note='single toilet (FWF symbol): the master draws no door swing; it draws a chevron on one edge, which the '
                              'legend does not explain, so no door side is read from the drawing', pdf=pdf)


# ---------------- storage container (legend "STORAGE CONTAINERS": outline + double doors at one end) --------------
K = 0.5522847498
def trace_container(qi, near, label):
    d = drawing_by_id(qi, near)
    assert len(d['items']) == 1 and d['items'][0][0] == 'qu', qi
    near = ((d['rect'][0] + d['rect'][2]) / 2, (d['rect'][1] + d['rect'][3]) / 2)
    poly = [P(p) for p in d['items'][0][1]]
    cen, _ = B.area_centroid(poly); inset = in_inset(*cen)
    n = 4
    near_ds = [c for c in region(near[0] - 6, near[1] - 6, near[0] + 6, near[1] + 6) if qi < c['i'] <= qi + 6]
    arcs = [c for c in near_ds if all(k == 'c' for k, _ in c['items']) and len(c['items']) == 2]
    leafs = [c for c in near_ds if all(k == 'l' for k, _ in c['items'])]
    doors = []
    for a in arcs:
        c1, c2 = [[P(p) for p in pp] for _, pp in a['items']]
        p0, p6 = c1[0], c2[3]
        # hinge = the outline corner equidistant from both arc ends
        best = None
        for ci, cpt in enumerate(poly):
            r0, r1 = dist(cpt, p0), dist(cpt, p6)
            key = abs(r0 - r1)
            if best is None or key < best[0]:
                best = (key, ci, cpt, (r0 + r1) / 2)
        _, ci, hinge, rad = best
        # the end edge: the arc end lying on the outline edge through the hinge
        cand_e = []
        for ei in range(n):
            a_, b_ = poly[ei], poly[(ei + 1) % n]
            if dist(a_, hinge) > 1e-6 and dist(b_, hinge) > 1e-6:
                continue
            for pe in (p0, p6):
                dd, t = B.seg_proj(pe, a_, b_)
                cand_e.append((dd, ei, pe, t))
        cand_e.sort()
        dd, ei, closeP, tc = cand_e[0]
        openP = p6 if closeP is p0 else p0
        a_, b_ = poly[ei], poly[(ei + 1) % n]
        th = B.seg_proj(hinge, a_, b_)[1]
        at = (th + tc) / 2
        mid = add(a_, mul(sub(b_, a_), at))
        ev = unit(sub(b_, a_)); nrm = (ev[1], -ev[0])
        if dot(nrm, sub(mid, cen)) < 0:
            nrm = (-nrm[0], -nrm[1])
        # the leaf: the line from the hinge to the open end of the arc
        leaf = None
        for lf in leafs:
            for _, pp in lf['items']:
                s0, s1 = P(pp[0]), P(pp[1])
                for u0, u1 in ((s0, s1), (s1, s0)):
                    if (dist(u0, hinge) < 0.05 and dist(u1, hinge) > 0.5 * rad
                            and dot(unit(sub(u1, u0)), unit(sub(openP, hinge))) > 0.99 and abs(dist(u0, u1) - rad) < 0.4 * rad):
                        leaf = (u0, u1, lf)
        sweep = abs((math.degrees(math.atan2(p6[1] - hinge[1], p6[0] - hinge[0]) - math.atan2(p0[1] - hinge[1], p0[0] - hinge[0])) + 180) % 360 - 180)
        ok = leaf is not None and dd < 0.1 and 80 <= sweep <= 100 and dot(unit(sub(openP, hinge)), nrm) > 0.9
        if not ok:
            problems.append(('container door', qi, a['i'], round(dd, 3), round(sweep, 1), leaf is not None)); continue
        # one-cubic quarter circle through the same two end points about the same hinge (the master draws two cubics)
        tA = unit(sub(closeP, hinge)); tB = unit(sub(openP, hinge))
        sgn = 1
        P0, P3 = openP, closeP
        P1 = add(P0, mul(tA, K * rad)); P2 = add(P3, mul(tB, K * rad))
        bd = B.bearing(nrm, inset)
        bb = [min(p0[0], p6[0], hinge[0]), min(p0[1], p6[1], hinge[1]), max(p0[0], p6[0], hinge[0]), max(p0[1], p6[1], hinge[1])]
        doors.append({'edge_index': ei, 'edge': [to_frame(a_, inset), to_frame(b_, inset)], 'at': round(at, 4),
                      'mid': to_frame(mid, inset), 'outward': [round(nrm[0], 4), round(nrm[1], 4)],
                      'faces': B.compass(bd), 'bearing_deg': round(bd, 1), 'opens': 'outward',
                      'width_m': round(dist(hinge, closeP) * M, 2), 'radius_m': round(rad * M, 2),
                      'symbol': 'container double doors: two quarter-circle swings + door leaves at one end (legend "STORAGE CONTAINERS")',
                      'swing': {'hinge': to_frame(hinge, inset), 'arc': [to_frame(p, inset) for p in (P0, P1, P2, P3)],
                                'leaf': [to_frame(leaf[0], inset), to_frame(leaf[1], inset)], 'landing': None},
                      'pdf': {'arc_drawing': a['i'], 'arc_seqno': a['seqno'], 'leaf_drawing': leaf[2]['i'], 'leaf_seqno': leaf[2]['seqno'],
                              'bbox_pt': [round(v, 3) for v in bb], 'hinge_to_edge_pt': 0.0, 'sweep_deg': round(sweep, 1),
                              'radius_pt': round(rad, 3),
                              'arc_note': 'the master draws each swing as two cubics; arc here is the one-cubic quarter circle through the same end points about the same hinge'}})
    doors.sort(key=lambda z: z['at'])
    eds = set(dd_['edge_index'] for dd_ in doors)
    note = ('container: double doors drawn at one end (%d leaves on edge %s)' % (len(doors), ','.join(map(str, sorted(eds))))) if doors else 'no door drawn'
    pdf = {'drawing': qi, 'seqno': d['seqno'], 'type': d['type'], 'stroke': d['stroke'], 'fill': d['fill'],
           'width': round(d['w'], 3), 'vertex_err_pt': 0.0, 'outline_only': True}
    return assemble('container', label, poly, doors=doors, door_idx=0 if len(eds) == 1 and doors else None, door_note=note, pdf=pdf)


# ---------------- water-filled barrier runs (legend "WATER-FILLED BARRIER": alternating #ffbf00 / #fafafa pieces) -----
def piece_quad(d):
    u = uniq(dpts(d), 0.02)
    if len(u) != 4:
        return None
    # order around centre
    cx = sum(p[0] for p in u) / 4; cy = sum(p[1] for p in u) / 4
    u.sort(key=lambda p: math.atan2(p[1] - cy, p[0] - cx))
    return u


def piece_ends(q):
    e = [dist(q[k], q[(k + 1) % 4]) for k in range(4)]
    if e[0] + e[2] < e[1] + e[3]:   # edges 0,2 are the short ends
        return [((q[0][0] + q[1][0]) / 2, (q[0][1] + q[1][1]) / 2), ((q[2][0] + q[3][0]) / 2, (q[2][1] + q[3][1]) / 2)], (e[1] + e[3]) / 2, (e[0] + e[2]) / 2
    return [((q[1][0] + q[2][0]) / 2, (q[1][1] + q[2][1]) / 2), ((q[3][0] + q[0][0]) / 2, (q[3][1] + q[0][1]) / 2)], (e[0] + e[2]) / 2, (e[1] + e[3]) / 2


def trace_run(run_id):
    r = runs[run_id]
    bb = r['bbox_pdf_pt']
    ds = {d['i']: d for d in region(bb[0] - 3, bb[1] - 3, bb[2] + 3, bb[3] + 3)}
    pieces = []
    for i in r['pdf_drawings']:
        d = ds[i]
        q = piece_quad(d)
        if not q:
            problems.append(('wfb piece not a quad', run_id, i)); continue
        ends, L, W = piece_ends(q)
        if L * M < 1.5:
            excluded_pieces.append({'run': run_id, 'drawing': i, 'seqno': d['seqno'], 'fill': d['fill'], 'size_m': [round(L * M, 2), round(W * M, 2)],
                                    'why': 'not a barrier piece: %.2f x %.2f m, far from the 2 m pieces of the run (a white fill on a white ground)' % (L * M, W * M)})
            continue
        colr = 'yellow' if d['fill'] == '#ffbf00' else ('white' if d['fill'] == '#fafafa' else d['fill'])
        c = (sum(p[0] for p in q) / 4, sum(p[1] for p in q) / 4)
        pieces.append({'i': i, 'seq': d['seqno'], 'q': q, 'ends': ends, 'L': L, 'W': W, 'col': colr, 'c': c, 'inset': in_inset(*c)})
    # kerb rows: each yellow piece is drawn as two half-width strips side by side; merge each pair into one piece
    if pieces and all(p['col'] == 'yellow' for p in pieces) and sorted(p['W'] for p in pieces)[len(pieces) // 2] * M < 0.4:
        merged = []; used = set()
        for a in range(len(pieces)):
            if a in used:
                continue
            pa = pieces[a]
            best = None
            for b in range(len(pieces)):
                if b == a or b in used:
                    continue
                pb = pieces[b]
                if abs(dot(unit(sub(pa['ends'][1], pa['ends'][0])), unit(sub(pb['ends'][1], pb['ends'][0])))) < 0.97:
                    continue
                dd_ = dist(pa['c'], pb['c'])
                if dd_ < 0.6 and (best is None or dd_ < best[0]):
                    best = (dd_, b)
            used.add(a)
            if best is None:
                pa['strips'] = 1; merged.append(pa); continue
            pb = pieces[best[1]]; used.add(best[1])
            e0, e1 = pa['ends']; f0, f1 = pb['ends']
            if dist(e0, f0) + dist(e1, f1) > dist(e0, f1) + dist(e1, f0):
                f0, f1 = f1, f0
            ends = [((e0[0] + f0[0]) / 2, (e0[1] + f0[1]) / 2), ((e1[0] + f1[0]) / 2, (e1[1] + f1[1]) / 2)]
            hull = [tuple(q) for q in B.convex_hull(pa['q'] + pb['q'])]
            merged.append({'i': pa['i'], 'i2': pb['i'], 'seq': pa['seq'], 'seq2': pb['seq'], 'q': hull, 'ends': ends,
                           'L': (pa['L'] + pb['L']) / 2, 'W': pa['W'] + pb['W'], 'col': 'yellow',
                           'c': ((pa['c'][0] + pb['c'][0]) / 2, (pa['c'][1] + pb['c'][1]) / 2), 'inset': pa['inset'], 'strips': 2})
        pieces = merged
    TOL = 0.6 / M
    n = len(pieces)
    par = list(range(n))
    def f(a):
        while par[a] != a:
            par[a] = par[par[a]]; a = par[a]
        return a
    adj = collections.defaultdict(list)
    for i in range(n):
        for j in range(i + 1, n):
            if pieces[i]['inset'] != pieces[j]['inset']:
                continue
            if min(dist(a, b) for a in pieces[i]['ends'] for b in pieces[j]['ends']) < TOL:
                par[f(i)] = f(j); adj[i].append(j); adj[j].append(i)
    groups = collections.defaultdict(list)
    for i in range(n):
        groups[f(i)].append(i)
    chains = []
    for g, mem in groups.items():
        # order: greedy nearest neighbour on piece centres from the piece farthest from the group's middle
        mx = sum(pieces[i]['c'][0] for i in mem) / len(mem); my = sum(pieces[i]['c'][1] for i in mem) / len(mem)
        start = max(mem, key=lambda i: dist(pieces[i]['c'], (mx, my)))
        order = [start]; seen = {start}
        while len(order) < len(mem):
            nx = min((j for j in mem if j not in seen), key=lambda j: dist(pieces[j]['c'], pieces[order[-1]]['c']))
            order.append(nx); seen.add(nx)
        first = pieces[order[0]]
        e0, e1 = first['ends']
        if len(order) > 1:
            nxt = pieces[order[1]]
            if min(dist(e0, b) for b in nxt['ends']) < min(dist(e1, b) for b in nxt['ends']):
                e0, e1 = e1, e0
        line = [e0, e1]
        for k in order[1:]:
            a, b = pieces[k]['ends']
            if dist(a, line[-1]) > dist(b, line[-1]):
                a, b = b, a
            line.append(b)
        chains.append((order, line))
    chains.sort(key=lambda z: (pieces[z[0][0]]['c'][1], pieces[z[0][0]]['c'][0]))
    comps = []
    for ci, (order, line) in enumerate(chains):
        ps = [pieces[k] for k in order]
        inset = ps[0]['inset']
        length = sum(dist(line[k], line[k + 1]) for k in range(len(line) - 1))
        area = 0.0
        for p in ps:
            area += B.area_centroid(p['q'])[1]
        cx = sum(p['c'][0] for p in ps) / len(ps); cy = sum(p['c'][1] for p in ps) / len(ps)
        v = sub(line[-1], line[0])
        ang = math.degrees(math.atan2(v[1], v[0])) % 180.0
        Ls = sorted(p['L'] for p in ps); Ws = sorted(p['W'] for p in ps)
        Lmed = Ls[len(Ls) // 2]; Wmed = Ws[len(Ws) // 2]
        marks = [{'type': 'piece', 'colour': p['col'],
                  'what': ('one drawn barrier piece (%s)' % p['col']) if p.get('strips', 1) == 1 or 'i2' not in p
                          else 'one drawn piece (yellow), drawn as two half-width strips side by side',
                  'poly': [to_frame(q, inset) for q in p['q']],
                  'pdf': {'drawing': p['i'], 'seqno': p['seq']} if 'i2' not in p else {'drawings': [p['i'], p['i2']], 'seqnos': [p['seq'], p['seq2']]}}
                 for p in ps]
        comp = {'kind': 'water_barrier',
                'label': 'water-filled barrier line (white-and-yellow pieces, legend "WATER-FILLED BARRIER")' if any(p['col'] == 'white' for p in ps)
                         else 'barrier pieces drawn all yellow (no white alternation)',
                'geometry': 'polyline',
                'poly': [to_frame(p, inset) for p in line],
                'poly_pt': [[round(p[0], 3), round(p[1], 3)] for p in line],
                'centroid': to_frame((cx, cy), inset), 'centroid_pt': [round(cx, 3), round(cy, 3)],
                'size_m': [round(length * M, 2), round(Wmed * M, 2)], 'angle_deg': round(ang, 2),
                'area_m2': round(area * M ** 2, 1), 'inset': inset,
                'doors': [], 'door': None, 'door_note': 'barrier: no door',
                'marks': marks,
                'length_m': round(length * M, 2), 'pieces_drawn': len(ps),
                'pieces_yellow': sum(p['col'] == 'yellow' for p in ps), 'pieces_white': sum(p['col'] == 'white' for p in ps),
                'piece_len_m_drawn': round(Lmed * M, 2), 'piece_width_m_drawn': round(Wmed * M, 2),
                'tl2_piece_length': 'size to confirm: no source read gives the TL2 piece length; the drawn piece is %.2f m at 1:2000' % (Lmed * M),
                'run': run_id, 'run_part': '%d of %d' % (ci + 1, len(chains)),
                'pdf': {'drawings': [x for p in ps for x in ([p['i'], p['i2']] if 'i2' in p else [p['i']])],
                        'seqnos': [x for p in ps for x in ([p['seq'], p['seq2']] if 'i2' in p else [p['seq']])],
                        'fill': sorted(set(dsx['fill'] for dsx in (ds[p['i']] for p in ps))),
                        'vertex_note': 'line vertices are the mid points of each piece\'s short ends, computed from the piece corners (PDF path points)'}}
        comps.append(comp)
    return comps


# ---------------- crops ----------------
from PIL import Image, ImageDraw
CROPS = HERE + '/tracecrops'
os.makedirs(CROPS, exist_ok=True)
def render(name, comp, title):
    pts = [tuple(p) for p in comp['poly_pt']]
    for m in comp['marks']:
        if 'poly' in m:
            pts += [from_frame(f, comp['inset']) for f in m['poly']]
    for dd in comp['doors']:
        pts += [from_frame(f, comp['inset']) for f in dd['swing']['arc']]
    x0 = min(p[0] for p in pts); x1 = max(p[0] for p in pts); y0 = min(p[1] for p in pts); y1 = max(p[1] for p in pts)
    pad = max(6.0, 0.25 * max(x1 - x0, y1 - y0))
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad
    z = min(24.0, 1400.0 / max(x1 - x0, y1 - y0))
    pix = page.get_pixmap(matrix=pymupdf.Matrix(z, z), clip=pymupdf.Rect(x0, y0, x1, y1))
    im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    dr = ImageDraw.Draw(im)
    T = lambda p: ((p[0] - x0) * z, (p[1] - y0) * z)
    PP = [T(p) for p in pts[:len(comp['poly_pt'])]]
    if comp.get('geometry') == 'polyline':
        dr.line(PP, fill=(220, 0, 220), width=max(2, int(z * 0.15)))
        for p in PP:
            dr.ellipse([p[0] - 3, p[1] - 3, p[0] + 3, p[1] + 3], outline=(0, 0, 255))
    else:
        dr.line(PP + [PP[0]], fill=(220, 0, 220), width=max(2, int(z * 0.12)))
    for dd in comp['doors']:
        a = [T(from_frame(f, comp['inset'])) for f in dd['swing']['arc']]
        dr.line(a, fill=(0, 160, 255), width=2)
        m = T(from_frame(dd['mid'], comp['inset']))
        o = dd['outward']; dr.line([m, (m[0] + o[0] * 30, m[1] + o[1] * 30)], fill=(255, 0, 0), width=3)
    c = T(tuple(comp['centroid_pt'])); dr.ellipse([c[0] - 4, c[1] - 4, c[0] + 4, c[1] + 4], fill=(0, 200, 0))
    dr.rectangle([0, 0, im.width, 16], fill=(255, 255, 255)); dr.text((3, 2), title[:160], fill=(0, 0, 0))
    fn = '%s/%s.png' % (CROPS, name.replace('?', 'Q').replace('/', '_'))
    im.save(fn)
    return os.path.basename(fn)


# ================= what to trace =================
out = {}
unassigned = []
def put(ref, comps, match):
    for c in comps:
        c['match'] = match
    out.setdefault(ref, []).extend(comps)

# 1. GN13 / GN18 at their 2 Oct symbols (pins release in flight: "follow the master")
for ref, seed, pin in (('GN13', 162244, [0.52527, 0.19253]), ('GN18', 162600, [0.21036, 0.68031])):
    near = from_frame(pin, False)
    c = trace_generator(seed, near)
    put(ref, [c], {'confidence': 'high', 'basis': 'the 2 Oct generator symbol at the pin the release in flight moves %s to ("follow the master", the project manager); '
                   'v9.15 left it null as identity unproven' % ref})

# 2. water barriers matched to WB references (wfb_runs.json matching)
WB = collections.OrderedDict([('WB06', ['R01', 'R02']), ('WB01', ['R03']), ('WB05', ['R04']), ('WB16', ['R05']), ('WB04', ['R06']),
                              ('WB14', ['R07']), ('WB13', ['R08', 'R09']), ('WB17', ['R10', 'R11']), ('WB18', ['R12'])])
for ref, rids in WB.items():
    for rid in rids:
        r = runs[rid]
        comps = trace_run(rid)
        put(ref, comps, {'confidence': r['confidence'], 'basis': r['where'], 'run': rid,
                         'run_pieces_drawn': r['pieces_drawn'], 'run_length_m': r['length_m']})
for rid in ('R13', 'R14', 'R15', 'R16', 'R17', 'R18', 'R19', 'R20', 'R21'):
    r = runs[rid]
    for c in trace_run(rid):
        c['match'] = {'confidence': 'unmatched', 'basis': r['where'], 'run': rid}
        unassigned.append({'what': 'water-barrier run with no WB reference', 'component': c})

# 3. WC59 units 3-7: the five extra FWF of the 7-row under the WC57 tag (v9.15 WC57 components 2-6)
wc57 = v915['refs']['WC57']['shape']['components']
for k in range(2, 7):
    c0 = wc57[k]
    near = tuple(c0['centroid_pt'])
    c = trace_toilet(c0['pdf']['drawing'], near)
    assert max(dist(tuple(a), tuple(b)) for a, b in zip(c['poly_pt'], c0['poly_pt'])) < 0.001, 'WC57 re-trace differs'
    put('WC59', [c], {'confidence': 'medium', 'basis': 'v9.15 WC57 component %d re-traced: the master draws 7 FWF under the WC57 tag and 2 at '
                      'WC59; the schedule says WC57 2 / WC59 7 and the record holds 7 Event Portables numbers for WC59, so the tags look '
                      'swapped. This is the same symbol as v9.15 WC57 component %d: draw it once (as WC59 if the swap is confirmed).' % (k, k),
                      'same_symbol_as': {'ref': 'WC57', 'v915_component': k}})

# 4. containers at Helen Park (legend STORAGE CONTAINERS)
c = trace_container(162647, (110.6, 1191.5), 'storage container (labelled "iEDM" on the master)')
put('T0266', [c], {'confidence': 'low', 'basis': 'the 6 m container drawn inside the Helen Park gate compound (P53-P56), labelled "iEDM" on the '
                   'master; the schedule row T0266 says "6.0m Refrigerator Cont, Helen Park". The master does not say refrigerated; three other '
                   '6 m containers are drawn nearby (labelled SCA and BSF x2, see _unassigned). Identity to confirm.'})
c = trace_container(182402, (136.4, 1146.0), 'storage container (labelled "SCA" on the master)')
put('T0258', [c], {'confidence': 'low', 'basis': 'the only 3 m container drawn at Helen Park (3.06 x 2.43 m, beside WC69, labelled "SCA"); '
                   'the schedule row T0258 says "3.0m Cont, Helen Park". Identity to confirm.'})
for qi, near, lab in ((162096, (137.2, 1150.0), 'storage container (labelled "SCA" on the master)'),
                      (162229, (115.8, 1125.8), 'storage container (labelled "BSF" on the master)'),
                      (162234, (112.3, 1125.2), 'storage container (labelled "BSF" on the master)')):
    c = trace_container(qi, near, lab)
    c['match'] = {'confidence': 'unmatched', 'basis': '6 m container at Helen Park; alternative candidate for T0266 (6.0m Refrigerator Cont)'}
    unassigned.append({'what': '6 m storage container with no reference', 'component': c})

# 5. generator symbols with no reference (centres of their orange outlines, found by the inventory)
GEN_NEAR = {161944: (1897.65, 290.95), 161947: (1574.5, 329.6), 161952: (2116.9, 271.55), 162084: (1076.95, 314.6), 170370: (603.7, 339.25),
            188571: (1121.1, 387.35), 188675: (876.75, 369.4), 188693: (245.15, 635.9), 189694: (1444.8, 476.45)}
for seed in (161944, 161947, 161952, 162084, 170370, 188571, 188675, 188693, 189694):
    c = trace_generator(seed, GEN_NEAR[seed])
    c['match'] = {'confidence': 'unmatched', 'basis': 'orange generator symbol with no reference on the 2 Oct master; candidates GN? (Concert 200 kVA x2), '
                  'GN25, T0268 (spare 100 kVA trailer) or another party; no source ties it to one'}
    unassigned.append({'what': 'generator symbol with no reference', 'component': c})

# 6. untagged / non-schedule FWF next to references with units not drawn (candidates only)
for qi, near, why in ((119323, (131.4, 1138.0), 'under the "WC-BSF" tag (not a schedule reference); candidate for WC67 units 3-4 or WC69 units 10-12'),
                      (122593, (134.9, 1137.5), 'under the "WC-BSF" tag; candidate for WC67 units 3-4 or WC69 units 10-12'),
                      (122603, (135.0, 1135.8), 'under the "WC-BSF" tag; candidate for WC67 units 3-4 or WC69 units 10-12'),
                      (122613, (135.3, 1134.2), 'under the "WC-BSF" tag; candidate for WC67 units 3-4 or WC69 units 10-12'),
                      (119253, (122.0, 1184.9), 'untagged pair beside P55/P56 at the Helen Park gate; candidate for WC67 3-4 / WC69 10-12 / WC85 / T0176'),
                      (120686, (121.5, 1186.6), 'untagged pair beside P55/P56 at the Helen Park gate; candidate for WC67 3-4 / WC69 10-12 / WC85 / T0176')):
    c = trace_toilet(qi, near)
    c['match'] = {'confidence': 'unmatched', 'basis': why}
    unassigned.append({'what': 'FWF symbol with no schedule reference', 'component': c})

# ---- checks: nothing already used by v9.15 (except the WC59 re-trace) ----
for ref, comps in out.items():
    for c in comps:
        ids = [c['pdf'].get('drawing')] + c['pdf'].get('drawings', [])
        clash = [i for i in ids if i in used915]
        if clash and ref != 'WC59':
            problems.append(('already in v9.15', ref, clash))
for u in unassigned:
    ids = [u['component']['pdf'].get('drawing')] + u['component']['pdf'].get('drawings', [])
    if any(i in used915 for i in ids):
        problems.append(('unassigned already in v9.15', ids))

# ---- crops ----
for ref, comps in out.items():
    for k, c in enumerate(comps):
        c['crop'] = render('%s_%02d' % (ref, k), c, '%s #%d %s %s %s' % (ref, k, c['kind'], c['size_m'], c.get('run', '')))
for k, u in enumerate(unassigned):
    c = u['component']
    c['crop'] = render('_unassigned_%02d' % k, c, 'unassigned #%d %s %s %s' % (k, c['kind'], c['size_m'], c.get('run', '')))

res = {'_meta': {'author': 'Andrew Fisher', 'built': '9 Oct 2026',
                 'what': 'components the 2 Oct master draws that v9.15 has no component for (ref -> [components], v9.15 schema)',
                 'frame': v915['meta']['frame'], 'master': v915['meta']['master'], 'how': HOW,
                 'schema_additions': {'match': 'how the component was tied to the reference, with confidence',
                                      'geometry': '"polyline" for barrier lines: poly is an open line (piece end mid points), not a closed outline',
                                      'length_m / pieces_drawn / piece_len_m_drawn / tl2_piece_length / run / run_part': 'barrier lines only',
                                      'crop': 'file in tracecrops/'},
                 'problems': [list(map(str, p)) for p in problems],
                 'excluded_pieces': excluded_pieces,
                 'counts': {'refs': len(out), 'components': sum(len(v) for v in out.values()),
                            'unassigned_components': len(unassigned)}},
       '_unassigned': unassigned}
res.update(out)
json.dump(res, open(HERE + '/traced_new.json', 'w'), indent=1)
print(json.dumps(res['_meta']['counts']), 'problems:', len(problems))
for p in problems:
    print(' ', p)
for ref, comps in out.items():
    print(ref, len(comps), [(c['kind'], c['size_m'], c.get('pieces_drawn'), len(c['doors'])) for c in comps][:6])
