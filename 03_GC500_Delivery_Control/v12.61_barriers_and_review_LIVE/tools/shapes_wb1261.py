"""Author: Andrew Fisher. v12.61 - the explorer's water barrier shapes rebuilt from the drawn runs.

The page's MASTER_SHAPES926_DATA.shapes holds one entry per reference in site-frame coordinates: components with a
line of piece centres ("p"), the pieces themselves as quads ("m", alternating yellow and white), the run's centre,
length, width and angle. This builds the same shape for a WB reference from the runs wfb1261.json carries, so the
Map explorer draws the barriers where the K sheets put them. Frame units are not square: one frame x unit is the
aerial's ground width, one y unit its ground height (DATA.georef.frame_m_ground), so the pieces are laid out in metres
and converted back.
"""
import math

FRAME_M = (1620.1017897439551, 1013.1639680992049)   # DATA.georef.frame_m_ground
PIECE_M, WIDTH_M = 2.0, 0.52
LEGEND = 'water-filled barrier line (white-and-yellow pieces, legend "WATER-FILLED BARRIER")'

def to_m(p): return (p[0] * FRAME_M[0], p[1] * FRAME_M[1])
def to_f(m): return [round(m[0] / FRAME_M[0], 7), round(m[1] / FRAME_M[1], 7)]

def resample(path_m, step):
    """points every `step` metres along a polyline (metres), always including the ends"""
    if len(path_m) == 1: return [path_m[0]]
    seg = [(path_m[i], path_m[i + 1], math.dist(path_m[i], path_m[i + 1])) for i in range(len(path_m) - 1)]
    total = sum(s[2] for s in seg)
    if total < step: return [path_m[0], path_m[-1]]
    n = max(1, int(round(total / step)))
    out, d = [], 0.0
    for k in range(n + 1):
        target = min(total, k * total / n)
        acc = 0.0
        for a, b, L in seg:
            if acc + L >= target - 1e-9 and L > 0:
                t = (target - acc) / L
                out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)); break
            acc += L
    return out

def component(frame_pts):
    path = [to_m(p) for p in frame_pts]
    if len(path) >= 2:
        centres = resample(path, PIECE_M)          # one point per piece
    else:
        centres = [path[0], (path[0][0] + PIECE_M, path[0][1])]
    # pieces: between consecutive centres, a rectangle PIECE_M long and WIDTH_M wide, colours alternating
    pieces = []
    for i in range(len(centres) - 1):
        a, b = centres[i], centres[i + 1]
        dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1.0
        ux, uy = dx / L, dy / L; nx, ny = -uy * WIDTH_M / 2, ux * WIDTH_M / 2
        quad = [(a[0] + nx, a[1] + ny), (b[0] + nx, b[1] + ny), (b[0] - nx, b[1] - ny), (a[0] - nx, a[1] - ny)]
        pieces.append({'y': 'piece', 'p': [to_f(q) for q in quad], 'co': 'y' if i % 2 == 0 else 'w'})
    length = sum(math.dist(centres[i], centres[i + 1]) for i in range(len(centres) - 1))
    cx = sum(p[0] for p in centres) / len(centres); cy = sum(p[1] for p in centres) / len(centres)
    a0, a1 = centres[0], centres[-1]
    angle = math.degrees(math.atan2(a1[1] - a0[1], a1[0] - a0[0])) % 360
    return {'k': 'water_barrier', 'l': LEGEND, 'p': [to_f(c) for c in centres], 'c': to_f((cx, cy)),
            'z': [round(length, 2), WIDTH_M], 'a': round(angle, 2), 'd': [], 'di': -1, 'n': 35, 'm': pieces,
            'u': [], 'g': 'l', 'pl': PIECE_M, 'pw': WIDTH_M, 'mc': 'k'}

def shape_entry(rec):
    comps = [component(r['frame']) for r in rec['runs'] if r.get('frame')]
    if not comps: return None
    return {'c': comps, 'k': [round(rec['frame'][0], 7), round(rec['frame'][1], 7)], 's': 'no door drawn', 'x': None, 'u': []}
