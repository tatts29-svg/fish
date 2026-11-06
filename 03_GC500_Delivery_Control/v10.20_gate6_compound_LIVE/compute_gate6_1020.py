#!/usr/bin/env python3
"""Author: Andrew Fisher. Gate 6 compound, 15 Oct 2026.

New drawing positions for P60, P62, P63, WC49 and GN06 from John Brett's (iEDM)
"Gate 6 Compound" email of 14 Oct 2026, placed on the 2 Oct master D001-26003-03
(17 Sep frame, the frame every map on the page uses).

What John's email says (Andrew's photo of the email, 15 Oct 2026 00:50 AEST):
  "Attached is a screenshot of the gate 6 compound - this is I think will work and is
   hopefully a more accurate representation of what we discussed, P63 will most likely
   sit closer to the pathway. Doing it this way condenses the compound a little bit but
   if we want additional acreage at the south end then we can also absorb the council
   balance beam within the compound fencing."

How the positions were derived (a drawing position, not a survey):
  1. John's screenshot was deskewed from the phone photo and measured in pixels.
  2. Four fixed features seen in both John's screenshot and the master drawing fix the
     along-the-row scale and offset (least squares): the northern fitness pad (the tall
     grey polygon), the small square with a dot (a pole) south of it, the middle fitness
     pad (the "council balance beam" station) and the southern pad. Public satellite
     imagery (Esri World Imagery, z20) confirmed the three grey polygons on the master are
     the three blue-floored council fitness pads and that John's screenshot has the same
     orientation as the master (north to the left, the beach above).
  3. Across the row, a point is placed in proportion between two fixed lines that both
     drawings show: the tree-canopy edge (east) and the edge of The Esplanade pavement
     (west).
  4. A building is never drawn through the compound's west fence: if the proportional
     placement would, it is held 0.35 m inside the fence line.
  5. Each footprint (MASTER_SHAPES926) is moved rigidly by the same shift as its pin;
     angles and door sides are unchanged.
  6. Latitude and longitude come from the explorer's georeferencing (sheet_to_z18px),
     the same transform that produced the live pins (P60 reproduces to 1e-7 degrees).

Outputs (in this folder):
  gate6_positions_1020.json   old/new pin, shift, lat/lon, moved footprints, card text
  gate6_before_after_master.png   the master with the new layout drawn in orange
  gate6_new_on_aerial.png         the new layout on public satellite imagery

Run:  python3 compute_gate6_1020.py <live_page.html> <explorer georeferencing.json> <tiles dir> <esri dir>
Reads only. Writes only into this folder.
"""
import json, math, os, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
SHEET = (2384, 1684)          # D001 sheet in points; MASTER_LOC pt = sheet pt / SHEET
M_PER_PT = 0.705556           # from MASTER_SHAPES926_DATA
REFS = ['P60', 'P62', 'P63', 'WC49', 'GN06']

# ---- John's screenshot, measured on the deskewed crop (pixels; x to the right, y down) ----
# Fixed features (John px x -> master sheet x, pt), used for the along-the-row fit
FIXED_X = [  # (john_px, sheet_pt, what)
    (260, 2060.0, 'northern fitness pad, centre (grey polygon 2055-2065)'),
    (510, 2077.0, 'pole: small square with a dot (2075-2079)'),
    (1185, 2135.0, 'middle fitness pad, the council balance beam station (2130-2140)'),
    (1480, 2152.0, 'southern fitness pad (2148-2156)'),
]
# Two fixed lines across the row: John's px y at two x positions, and the master's sheet y there
CANOPY_JOHN = ((400, 545), (1100, 440))      # lower edge of the tree canopy band
TAN_JOHN = ((400, 790), (1100, 700))         # edge of The Esplanade pavement (tan band)
CANOPY_SHEET = ((2070.0, 247.5), (2123.0, 245.0))
TAN_SHEET = ((2070.0, 263.0), (2123.0, 262.0))
# John's new layout (px): centres of the labelled boxes; GN06 is its red tag (the symbol itself is
# not visible on the dark screenshot), so the generator is placed as a tag-to-symbol offset below
ITEMS_JOHN = {
    'P60': (400, 655), 'P62': (617, 645), 'WC49': (825, 625), 'P63': (930, 650),
    'GN06': (665, 515),
}
GN06_TAG_TO_SYMBOL_PT = 3.0   # on the master the GN06 tag sits about 3 pt (2 m) east of the symbol
FENCE_JOHN = {'north_x': 320, 'south_x': 1100, 'west_y': ((400, 690), (1100, 650)), 'east_y': ((400, 550), (1100, 430))}
OP54_JOHN = (1010, 600)       # not a Coates item; reported for the picture only
HALF_DEPTH_PT = {'P60': 1.5 / M_PER_PT, 'P62': 1.5 / M_PER_PT, 'P63': 1.5 / M_PER_PT, 'WC49': 0.6 / M_PER_PT, 'GN06': 0.6 / M_PER_PT}
INSIDE_FENCE_PT = 0.35 / M_PER_PT


def lin(p0, p1, x):
    (x0, y0), (x1, y1) = p0, p1
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0)


def fit_x():
    n = len(FIXED_X)
    sx = sum(p for p, _, _ in FIXED_X); sy = sum(s for _, s, _ in FIXED_X)
    sxx = sum(p * p for p, _, _ in FIXED_X); sxy = sum(p * s for p, s, _ in FIXED_X)
    a = (n * sxy - sx * sy) / (n * sxx - sx * sx)
    b = (sy - a * sx) / n
    res = [(w, round(b + a * p - s, 2)) for p, s, w in FIXED_X]
    return a, b, res


def john_to_sheet(px, py, a, b):
    x = b + a * px
    c_j = lin(*CANOPY_JOHN, px); t_j = lin(*TAN_JOHN, px)
    c_s = lin(*CANOPY_SHEET, x); t_s = lin(*TAN_SHEET, x)
    t = (py - c_j) / (t_j - c_j)
    return x, c_s + t * (t_s - c_s), t


def bracket(s, i):
    depth = 0; q = None; esc = False
    for j in range(i, len(s)):
        ch = s[j]
        if q:
            if esc: esc = False
            elif ch == '\\': esc = True
            elif ch == q: q = None
        else:
            if ch == '"': q = ch
            elif ch in '{[': depth += 1
            elif ch in '}]':
                depth -= 1
                if depth == 0: return j + 1
    raise ValueError('unbalanced')


def load_page(path):
    lines = open(path, encoding='utf-8').read().split('\n')
    ml = next(l for l in lines if l.startswith('const MASTER_LOC') or l.startswith('MASTER_LOC') or 'MASTER_LOC = {' in l[:40])
    i = ml.index('{'); master = json.loads(ml[i:bracket(ml, i)])
    sl = next(l for l in lines if 'MASTER_SHAPES926_DATA = {' in l[:200])
    i = sl.index('MASTER_SHAPES926_DATA = {') + len('MASTER_SHAPES926_DATA = ')
    shapes = json.loads(sl[i:bracket(sl, i)])
    return master, shapes


def translate(obj, dx, dy):
    """Move every coordinate pair of a shape record rigidly (normalised master coordinates).

    Every two-number list in a shape record is a master coordinate (polygon points p, centres c and k, door
    points m/h/q/v/arcs/leaves, mark lines l and triangles p) except 'z' (size in metres) and 'o' (a door's
    outward unit vector), which are left alone."""
    def is_pair(v):
        return isinstance(v, list) and len(v) == 2 and all(isinstance(t, (int, float)) for t in v)
    def deep(v):
        if is_pair(v): return [round(v[0] + dx, 7), round(v[1] + dy, 7)]
        if isinstance(v, list): return [deep(t) for t in v]
        if isinstance(v, dict): return {k: (t if k in ('z', 'o') else deep(t)) for k, t in v.items()}
        return v
    return deep(obj)


def georef(g):
    M = g['main']['sheet_to_z18px']; world = 512 * 2 ** 18
    def to_ll(x, y):
        px = M[0][0] * x + M[0][1] * y + M[0][2]; py = M[1][0] * x + M[1][1] * y + M[1][2]
        lon = px / world * 360 - 180
        lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * py / world))))
        return lat, lon
    def to_px(x, y):
        return (M[0][0] * x + M[0][1] * y + M[0][2], M[1][0] * x + M[1][1] * y + M[1][2])
    return to_ll, to_px


def main():
    page, georef_path, tiles, esri = sys.argv[1:5]
    master, shapes = load_page(page)
    g = json.load(open(georef_path)); to_ll, to_px = georef(g)
    a, b, res = fit_x()
    out = {'basis': 'John Brett (iEDM) email "Gate 6 Compound", 14 Oct 2026, photographed by Andrew Fisher 15 Oct 2026 00:50 AEST',
           'frame': 'D001-26003-03 (2 Oct 2026) in the 17 Sep frame; sheet 2384 x 1684 pt; 0.705556 m per pt',
           'fit_x': {'px_per_pt': round(1 / a, 3), 'residuals_pt': res, 'rms_m': round(math.sqrt(sum(r * r for _, r in res) / len(res)) * M_PER_PT, 2)},
           'refs': {}}
    # fence in sheet coordinates
    fx0 = b + a * FENCE_JOHN['north_x']; fx1 = b + a * FENCE_JOHN['south_x']
    def fence_west_y(x):
        px = (x - b) / a
        return john_to_sheet(px, lin(*FENCE_JOHN['west_y'], px), a, b)[1]
    def fence_east_y(x):
        px = (x - b) / a
        return john_to_sheet(px, lin(*FENCE_JOHN['east_y'], px), a, b)[1]
    out['fence'] = {'north_x': round(fx0, 1), 'south_x': round(fx1, 1),
                    'west_y': [round(fence_west_y(fx0), 1), round(fence_west_y(fx1), 1)],
                    'east_y': [round(fence_east_y(fx0), 1), round(fence_east_y(fx1), 1)],
                    'length_m': round((fx1 - fx0) * M_PER_PT, 1)}
    ox, oy = john_to_sheet(*OP54_JOHN, a, b)[:2]
    out['OP54_not_coates'] = {'sheet_pt': [round(ox, 1), round(oy, 1)], 'note': 'drawn for the picture only; OP54 is not a Coates item and has no pin'}
    for r in REFS:
        m = master[r]; sh = shapes['shapes'][r]
        old_pt = m['pt']; old_sheet = (old_pt[0] * SHEET[0], old_pt[1] * SHEET[1])
        anchor = sh['k']                      # shape centre (group centre for WC49)
        anchor_sheet = (anchor[0] * SHEET[0], anchor[1] * SHEET[1])
        px, py = ITEMS_JOHN[r]
        nx, ny, t = john_to_sheet(px, py, a, b)
        placed = 'proportional between the canopy edge and the pavement edge'
        if r == 'GN06':
            ny = ny + GN06_TAG_TO_SYMBOL_PT; placed = 'the red GN06 tag on John\'s screenshot, then 3 pt (2 m) west of it for the symbol, as the master draws the tag relative to the symbol'
        limit = fence_west_y(nx) - INSIDE_FENCE_PT - HALF_DEPTH_PT[r]
        held = False
        if ny > limit:
            ny = limit; held = True
        dx_pt, dy_pt = nx - anchor_sheet[0], ny - anchor_sheet[1]
        new_pt = [round(old_pt[0] + dx_pt / SHEET[0], 5), round(old_pt[1] + dy_pt / SHEET[1], 5)]
        new_sheet = (new_pt[0] * SHEET[0], new_pt[1] * SHEET[1])
        lat, lon = to_ll(*new_sheet)
        olat, olon = to_ll(*old_sheet)
        new_shape = translate(sh, dx_pt / SHEET[0], dy_pt / SHEET[1])
        out['refs'][r] = {
            'old': {'pt': old_pt, 'sheet_pt': [round(old_sheet[0], 2), round(old_sheet[1], 2)], 'll': m['ll'],
                    'll_from_georef': [round(olat, 7), round(olon, 7)], 'shape_centre_pt': anchor},
            'john_px': [px, py], 'across_fraction': round(t, 3), 'placed': placed, 'held_inside_west_fence': held,
            'new': {'pt': new_pt, 'sheet_pt': [round(new_sheet[0], 2), round(new_sheet[1], 2)], 'll': [round(lat, 6), round(lon, 6)]},
            'shift_pt': [round(dx_pt, 2), round(dy_pt, 2)],
            'shift_m': {'north': round(-dx_pt * M_PER_PT, 1), 'east': round(-dy_pt * M_PER_PT, 1)},
            'shape': new_shape,
        }
    # card text
    gate_x = 2010.0   # the G6 gate label on The Esplanade (consistent with the live "Gate 6 (~75 m)" on P62)
    def near(r):
        d = (out['refs'][r]['new']['sheet_pt'][0] - gate_x) * M_PER_PT
        return 'Gate 6 (~%d m)' % (5 * round(d / 5))
    HOW = 'tag on the unit; placed from John Brett\'s (iEDM) Gate 6 Compound email of 14 Oct 2026 (compound condensed and moved north); master D001 not yet reissued'
    text = {
        'P60': {'how': HOW, 'beside': ['P62'], 'near': [near('P60')]},
        'P62': {'how': HOW, 'beside': ['P60', 'GN06', 'WC49'], 'near': [near('P62')]},
        'P63': {'how': HOW, 'beside': ['WC49', 'OP54'], 'near': [near('P63')]},
        'WC49': {'how': 'the 3 toilets between P62 and P63; placed from John Brett\'s (iEDM) Gate 6 Compound email of 14 Oct 2026; master D001 not yet reissued', 'beside': ['P62', 'P63'], 'near': [near('WC49')]},
        'GN06': {'how': 'the generator inside the compound\'s east fence between P62 and WC49, from the GN06 tag on John Brett\'s (iEDM) Gate 6 Compound email of 14 Oct 2026 (symbol position approximate); master D001 not yet reissued', 'beside': ['P62', 'WC49'], 'near': [near('GN06')]},
    }
    for r in REFS: out['refs'][r]['text'] = text[r]
    out['details1002_WC49'] = {'destination': 'The Esplanade · Gate 6 compound · between P62 and P63', 'coordinates': '%.6f, %.6f' % tuple(out['refs']['WC49']['new']['ll'])}
    json.dump(out, open(os.path.join(HERE, 'gate6_positions_1020.json'), 'w'), indent=1)
    draw_master(out, master, shapes, tiles, to_px, esri)
    for r in REFS:
        o = out['refs'][r]
        print('%-5s old (%.1f, %.1f) -> new (%.1f, %.1f) sheet pt | shift %+.1f m north, %+.1f m east | ll %.6f, %.6f%s' % (
            r, *o['old']['sheet_pt'], *o['new']['sheet_pt'], o['shift_m']['north'], o['shift_m']['east'], *o['new']['ll'], ' | held inside west fence' if o['held_inside_west_fence'] else ''))
    print('fence', out['fence']); print('fit', out['fit_x'])


def poly_sheet(p):
    return [(x * SHEET[0], y * SHEET[1]) for x, y in p]


def draw_master(out, master, shapes, tiles, to_px, esri):
    """Figure 1: the master's vectors (explorer L3 tiles, 8 px/pt) with the new layout in orange.
    Figure 2: the new layout on Esri imagery (z20) via the georeferencing."""
    S = 8; T = 512; X0, Y0 = 30 * 64, 2 * 64
    st = Image.new('RGBA', (5 * T, 3 * T), (255, 255, 255, 255))
    for x in range(30, 35):
        for y in range(2, 5):
            p = os.path.join(tiles, '%d_%d.bin' % (x, y))
            if os.path.exists(p): st.alpha_composite(Image.open(p).convert('RGBA'), ((x - 30) * T, (y - 2) * T))
    x1, y1, x2, y2 = 2035, 225, 2175, 295
    crop = st.crop(((x1 - X0) * S, (y1 - Y0) * S, (x2 - X0) * S, (y2 - Y0) * S)).convert('RGB')
    d = ImageDraw.Draw(crop)
    def P(x, y): return ((x - x1) * S, (y - y1) * S)
    OR = (242, 98, 34)
    f = out['fence']
    fence = [P(f['north_x'], f['east_y'][0]), P(f['south_x'], f['east_y'][1]), P(f['south_x'], f['west_y'][1]), P(f['north_x'], f['west_y'][0])]
    d.polygon(fence, outline=OR); d.line(fence + [fence[0]], fill=OR, width=4)
    for r, o in out['refs'].items():
        for it in o['shape']['c']:
            pts = [P(*q) for q in poly_sheet(it['p'])]
            d.polygon(pts, outline=OR); d.line(pts + [pts[0]], fill=OR, width=3)
        cx, cy = P(*o['new']['sheet_pt']); d.text((cx - 12, cy - 40), r, fill=OR)
        ox, oy = P(*o['old']['sheet_pt']); d.line((ox, oy, cx, cy), fill=(120, 120, 120), width=1)
    ox, oy = P(*out['OP54_not_coates']['sheet_pt']); d.rectangle((ox - 8, oy - 24, ox + 8, oy + 24), outline=(90, 90, 90), width=2); d.text((ox - 14, oy - 40), 'OP54', fill=(90, 90, 90))
    d.text((8, 8), 'Master D001-26003-03 (2 Oct) · orange = new Gate 6 compound per iEDM email 14 Oct 2026 · north is to the left, beach above · grey lines = old to new', fill=(0, 0, 0))
    crop = crop.resize((crop.width // 2, crop.height // 2), Image.LANCZOS)
    crop.save(os.path.join(HERE, 'gate6_before_after_master.png'))
    # aerial
    meta = json.load(open(os.path.join(esri, 'meta.json'))); Z = meta['Z']; fz = meta['f']
    tx0, tx1, ty0, ty1 = meta['tx0'], meta['tx1'], meta['ty0'], meta['ty1']
    W = (tx1 - tx0 + 1) * 256; H = (ty1 - ty0 + 1) * 256
    aer = Image.new('RGB', (W, H))
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            aer.paste(Image.open(os.path.join(esri, '%d_%d_%d.jpg' % (Z, tx, ty))), ((tx - tx0) * 256, (ty - ty0) * 256))
    ox0, oy0 = tx0 * 256 / fz, ty0 * 256 / fz
    def C(x, y):
        px, py = to_px(x, y); return ((px - ox0) * fz, (py - oy0) * fz)
    d = ImageDraw.Draw(aer)
    fence = [C(f['north_x'], f['east_y'][0]), C(f['south_x'], f['east_y'][1]), C(f['south_x'], f['west_y'][1]), C(f['north_x'], f['west_y'][0])]
    d.line(fence + [fence[0]], fill=OR, width=3)
    for r, o in out['refs'].items():
        for it in o['shape']['c']:
            pts = [C(*q) for q in poly_sheet(it['p'])]; d.line(pts + [pts[0]], fill=OR, width=2)
        cx, cy = C(*o['new']['sheet_pt']); d.text((cx + 6, cy - 6), r, fill=(255, 255, 0))
        oxp, oyp = C(*o['old']['sheet_pt']); d.ellipse((oxp - 4, oyp - 4, oxp + 4, oyp + 4), outline=(255, 255, 255), width=1); d.line((oxp, oyp, cx, cy), fill=(255, 255, 255), width=1)
    d.text((6, 6), 'North up · Esri World Imagery z20 · orange = new Gate 6 compound (iEDM email 14 Oct 2026) · white = old pins', fill=(255, 255, 0))
    pts = [C(x1, y1), C(x2, y1), C(x1, y2), C(x2, y2)]
    bx = (int(min(p[0] for p in pts)), int(min(p[1] for p in pts)), int(max(p[0] for p in pts)), int(max(p[1] for p in pts)))
    aer.crop(bx).save(os.path.join(HERE, 'gate6_new_on_aerial.png'))


if __name__ == '__main__':
    main()
