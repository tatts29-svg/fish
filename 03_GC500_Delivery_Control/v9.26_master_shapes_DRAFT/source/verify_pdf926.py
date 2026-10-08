# Author: Andrew Fisher. v9.26 independent re-read of the 2 Oct master for the shapes test.
# For every part in shapes_v915.json whose source is "master" it opens the PDF afresh, takes the drawing(s) the part names
# (checking each drawing's sequence number), and writes that drawing's own corner points and their centroid in PDF points.
# Barrier lines (9 Oct): every piece's own corner points, and the mid points of every pair of the run's own PDF points less
# than 1.3 pt apart (a piece end is 0.5-0.7 m = 0.7-1.0 pt wide; a piece is 2 m = 2.8 pt long), so the test can prove each line vertex is a piece-end mid point.
# Door swings: the first cubic's four points (8 Oct parts) and the arc's two end points (every part).
# The node test (tests/test_shapes915.cjs) compares the page's shapes, moved back from the MASTER_LOC frame, against these.
#   python3 -I evidence/verify_pdf.py <master.pdf> > evidence/pdf_check.json
import sys, json, hashlib, math
from pathlib import Path
import pymupdf
here = Path(__file__).resolve().parent
pdf = sys.argv[1]
sha = hashlib.sha256(open(pdf, 'rb').read()).hexdigest()
J = json.loads((here / 'shapes_v915.json').read_text())
assert sha == J['meta']['master']['sha256'], 'not the 2 Oct master'
page = pymupdf.open(pdf)[0]; drs = page.get_drawings()

def pts(d):
    out = []
    for it in d['items']:
        if it[0] == 're':
            r = it[1]; out += [(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1)]
        elif it[0] == 'qu':
            q = it[1]; out += [(q.ul.x, q.ul.y), (q.ur.x, q.ur.y), (q.lr.x, q.lr.y), (q.ll.x, q.ll.y)]
        else:
            out += [(v.x, v.y) for v in it[1:] if isinstance(v, pymupdf.Point)]
    return out

def hull(P):
    P = sorted(set((round(x, 4), round(y, 4)) for x, y in P))
    cr = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, up = [], []
    for p in P:
        while len(lo) >= 2 and cr(lo[-2], lo[-1], p) <= 1e-9: lo.pop()
        lo.append(p)
    for p in reversed(P):
        while len(up) >= 2 and cr(up[-2], up[-1], p) <= 1e-9: up.pop()
        up.append(p)
    return lo[:-1] + up[:-1]

def centroid(poly):
    A = cx = cy = 0.0
    for i in range(len(poly)):
        x0, y0 = poly[i]; x1, y1 = poly[(i + 1) % len(poly)]; c = x0 * y1 - x1 * y0
        A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    A /= 2
    return [cx / (6 * A), cy / (6 * A)]

R = lambda P: [[round(x, 4), round(y, 4)] for x, y in P]
out = {'master_sha256': sha, 'drawings_on_page': len(drs), 'refs': {}}
for ref, e in J['refs'].items():
    sh = e['shape']
    if not sh:
        continue
    rows = []
    for c in sh['components']:
        if c.get('source') != 'master':
            rows.append(None)
            continue
        ids = c['pdf'].get('drawings') or [c['pdf']['drawing']]
        seqs = c['pdf'].get('seqnos') or [c['pdf']['seqno']]
        ok = all(drs[i]['seqno'] == s for i, s in zip(ids, seqs))
        P = [q for i in ids for q in pts(drs[i])]
        row = {'kind': c['kind'], 'geometry': c.get('geometry', 'polygon'), 'drawings': ids, 'seq_ok': ok, 'inset': c['inset']}
        if c.get('geometry') == 'polyline':
            pieces = []
            for mk in c['marks']:
                if mk['type'] != 'piece': continue
                di = mk['pdf'].get('drawings') or [mk['pdf']['drawing']]; ds = mk['pdf'].get('seqnos') or [mk['pdf']['seqno']]
                pieces.append({'drawings': di, 'seq_ok': all(drs[i]['seqno'] == q for i, q in zip(di, ds)), 'colour': mk['colour'],
                               'points_pt': R(sorted(set((round(x, 4), round(y, 4)) for i in di for x, y in pts(drs[i]))))})
            U = sorted(set((round(x, 4), round(y, 4)) for x, y in P))
            mids = []
            for a in range(len(U)):
                for b in range(a + 1, len(U)):
                    if abs(U[b][0] - U[a][0]) > 1.3: break
                    if math.hypot(U[b][0] - U[a][0], U[b][1] - U[a][1]) < 1.3:
                        mids.append([round((U[a][0] + U[b][0]) / 2, 4), round((U[a][1] + U[b][1]) / 2, 4)])
            row.update({'points_pt': R(U), 'end_mids_pt': mids, 'pieces': pieces})
        else:
            H = hull(P)
            verr = max(min(math.hypot(v[0] - q[0], v[1] - q[1]) for q in P) for v in c['poly_pt'])
            row.update({'corners_pt': R(H), 'centroid_pt': [round(v, 4) for v in centroid(H)], 'vertex_err_pt': round(verr, 5)})
        doors = []
        for d in c['doors']:
            a = drs[d['pdf']['arc_drawing']]; l = drs[d['pdf']['leaf_drawing']]
            cs = [it for it in a['items'] if it[0] == 'c']
            doors.append({'arc_seq_ok': a['seqno'] == d['pdf']['arc_seqno'] and l['seqno'] == d['pdf']['leaf_seqno'],
                          'arc_pt': [[round(v.x, 4), round(v.y, 4)] for v in cs[0][1:5]],
                          'arc_segments_pt': [[[round(v.x,4),round(v.y,4)] for v in curve[1:5]] for curve in cs],
                          'leaf_segments_pt': [[[round(v.x,4),round(v.y,4)] for v in line[1:3]] for line in l['items'] if line[0]=='l'],
                          'arc_ends_pt': [[round(cs[0][1].x, 4), round(cs[0][1].y, 4)], [round(cs[-1][4].x, 4), round(cs[-1][4].y, 4)]],
                          'cubics': len(cs), 'leaf_pt': R(pts(l))})
        row['doors'] = doors
        rows.append(row)
    out['refs'][ref] = rows
print(json.dumps(out, separators=(',', ':')))
