#!/usr/bin/env python3
from holding943 import HOLDING, TURN
"""Author: Andrew Fisher. Wed 14 Oct 2026 Esplanade arrival plan: two clean maps from OpenStreetMap data and tiles.
A muted tile background, crisp roads drawn from the OSM ways, then the route, the holding strip, the truck slots and the
drop area on top. Writes maps.json."""
import base64, io, json, math, os
from PIL import Image, ImageEnhance

HERE = os.path.dirname(os.path.abspath(__file__))
OSM = json.load(open(os.path.join(HERE, 'osm.json')))
W = {e['id']: e for e in OSM['elements'] if e['type'] == 'way'}
TS = 256
ORANGE, INK = '#ff6a13', '#13272f'

def merc(lat, lon, z):
    n = 2 ** z
    return (lon + 180) / 360 * n * TS, (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n * TS

class Map:
    def __init__(self, z, la1, lo1, la2, lo2, out_w):
        x1, y1 = merc(la2, lo1, z); x2, y2 = merc(la1, lo2, z)
        tx1, ty1, tx2, ty2 = int(x1 // TS), int(y1 // TS), int(x2 // TS), int(y2 // TS)
        big = Image.new('RGB', ((tx2 - tx1 + 1) * TS, (ty2 - ty1 + 1) * TS), 'white')
        for tx in range(tx1, tx2 + 1):
            for ty in range(ty1, ty2 + 1):
                big.paste(Image.open(os.path.join(HERE, 'tiles', f'{z}_{tx}_{ty}.png')).convert('RGB'), ((tx - tx1) * TS, (ty - ty1) * TS))
        crop = big.crop((int(x1 - tx1 * TS), int(y1 - ty1 * TS), int(x2 - tx1 * TS), int(y2 - ty1 * TS)))
        self.s = out_w / crop.width; self.w = out_w; self.h = round(crop.height * self.s)
        crop = crop.resize((self.w, self.h), Image.LANCZOS)
        crop = ImageEnhance.Color(crop).enhance(0.45); crop = ImageEnhance.Contrast(crop).enhance(0.75)
        crop = Image.blend(crop, Image.new('RGB', crop.size, 'white'), 0.42)
        buf = io.BytesIO(); crop.save(buf, 'JPEG', quality=84, optimize=True)
        self.b64 = base64.b64encode(buf.getvalue()).decode(); self.z = z; self.x1, self.y1 = x1, y1
        self.mpp = 156543.03392 * math.cos(math.radians((la1 + la2) / 2)) / 2 ** z / self.s
        self.parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" class="map" preserveAspectRatio="xMidYMid meet">',
                      f'<image href="data:image/jpeg;base64,{self.b64}" x="0" y="0" width="{self.w}" height="{self.h}"/>']
        self.bbox = (la1, lo1, la2, lo2)
    def P(self, lat, lon):
        x, y = merc(lat, lon, self.z)
        return round((x - self.x1) * self.s, 1), round((y - self.y1) * self.s, 1)
    def d(self, pts):
        return 'M' + ' L'.join('%s,%s' % self.P(a, b) for a, b in pts)
    def add(self, s): self.parts.append(s)
    def svg(self): return ''.join(self.parts) + '</svg>'
    def inside(self, pts):
        la1, lo1, la2, lo2 = self.bbox; m = 0.002
        return any(la1 - m <= a <= la2 + m and lo1 - m <= b <= lo2 + m for a, b in pts)

def geom(i): return [(p['lat'], p['lon']) for p in W[i]['geometry']]

def chain(ids):
    pts = []
    for i in ids:
        g = geom(i)
        if pts:
            if math.dist(pts[-1], g[-1]) < math.dist(pts[-1], g[0]): g = g[::-1]
            if math.dist(pts[-1], g[0]) > 0.0004: raise SystemExit(f'gap before way {i}')
            g = g[1:]
        pts += g
    return pts

# The route Andrew gave on 9 Oct 2026: over the Sundale Bridge, left at Waterways Drive, MacArthur Parade, Main Beach
# Parade, then the Esplanade holding strip. Way ids are OpenStreetMap's; every one-way piece is checked below.
APPROACH = [612620844, 424007971]
BRIDGE = [22915183]
AFTER = [22915185, 578657328]
WATERWAYS = [22915213, 519818856, 790470158, 115940236, 115940234, 115940238, 424045865, 22915174, 22915171]
MACARTHUR = [1452178840, 1452178839, 424068910, 22915145, 570794172, 570794173]
MAINBEACH = [670483889, 27768096, 1452178841, 1452178842]
ESPLANADE = [115940239]
ROUTE = APPROACH + BRIDGE + AFTER + WATERWAYS + MACARTHUR + MAINBEACH + ESPLANADE

def oneway_against(ids, pts):
    bad = []
    for i in ids:
        if W[i]['tags'].get('oneway') != 'yes': continue
        g = geom(i)
        ia = min(range(len(pts)), key=lambda k: math.dist(pts[k], g[0])); ib = min(range(len(pts)), key=lambda k: math.dist(pts[k], g[-1]))
        if ia > ib: bad.append(i)
    return bad

route = chain(ROUTE[:-1]) + TURN; assert not oneway_against(ROUTE[:-1], route)
esp = chain(ESPLANADE)

def mpd(lat): return 111320.0, 111320.0 * math.cos(math.radians(lat))
def seglen(a, b):
    my, mx = mpd(a[0]); return math.hypot((b[0] - a[0]) * my, (b[1] - a[1]) * mx)
def length_m(pts): return sum(seglen(pts[i], pts[i + 1]) for i in range(len(pts) - 1))
def at_m(pts, d):
    for i in range(len(pts) - 1):
        s = seglen(pts[i], pts[i + 1])
        if d <= s or i == len(pts) - 2:
            t = d / s if s else 0
            return (pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t), i
        d -= s
def sub_m(pts, a, b):
    out = [at_m(pts, a)[0]]; acc = 0
    for i in range(len(pts) - 1):
        acc += seglen(pts[i], pts[i + 1])
        if a < acc < b: out.append(pts[i + 1])
    out.append(at_m(pts, b)[0]); return out
def offset(pts, m):
    out = []
    for i, (la, lo) in enumerate(pts):
        a = pts[max(0, i - 1)]; b = pts[min(len(pts) - 1, i + 1)]; my, mx = mpd(la)
        dy, dx = (b[0] - a[0]) * my, (b[1] - a[1]) * mx; n = math.hypot(dx, dy) or 1
        out.append((la + (-dx / n) * m / my, lo + (dy / n) * m / mx))
    return out

ROAD_M = {'motorway': 12, 'trunk': 10, 'primary': 9, 'secondary': 8, 'tertiary': 8, 'unclassified': 6.5, 'residential': 6.5, 'living_street': 5, 'service': 4, 'trunk_link': 6}
def roads(M, min_px):
    """crisp road network: grey casing, white fill, widths in metres scaled to the map, never thinner than min_px"""
    cas, fil = [], []
    for e in W.values():
        h = e.get('tags', {}).get('highway')
        if h not in ROAD_M: continue
        g = geom(e['id'])
        if not M.inside(g): continue
        if h == 'service' and M.mpp > 1: continue
        w = max(min_px, ROAD_M[h] / M.mpp)
        d = M.d(g)
        cas.append(f'<path d="{d}" stroke-width="{w + 2.4:.1f}"/>'); fil.append(f'<path d="{d}" stroke-width="{w:.1f}"/>')
    M.add('<g fill="none" stroke="#a9b8bc" stroke-linecap="round" stroke-linejoin="round">' + ''.join(cas) + '</g>')
    M.add('<g fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round">' + ''.join(fil) + '</g>')

def road_label(M, way_ids, text, frac=0.5, cls='t-road', dy=0):
    pts = chain(way_ids); (la, lo), i = at_m(pts, length_m(pts) * frac)
    x, y = M.P(la, lo); x2, y2 = M.P(*pts[i + 1]); x0, y0 = M.P(*pts[i])
    a = math.degrees(math.atan2(y2 - y0, x2 - x0))
    if a > 90: a -= 180
    if a < -90: a += 180
    M.add(f'<text x="{x:.1f}" y="{y + dy:.1f}" text-anchor="middle" class="{cls}" transform="rotate({a:.1f} {x:.1f} {y:.1f})">{text}</text>')

def north(M):
    M.add(f'<g transform="translate({M.w - 40},{44})"><circle r="25" fill="#fff" stroke="{INK}" stroke-width="2.5"/><path d="M0,-17 L7,7 L0,2 L-7,7 Z" fill="{INK}"/><text y="21" text-anchor="middle" class="t-n">N</text></g>')
def scale(M, metres, label):
    bar = metres / M.mpp
    M.add(f'<g transform="translate(20,{M.h - 22})"><rect x="-8" y="-25" width="{bar + 16:.1f}" height="38" rx="5" fill="#ffffffe6"/><rect x="0" y="0" width="{bar:.1f}" height="7" fill="{INK}"/><rect x="{bar / 2:.1f}" y="0" width="{bar / 2:.1f}" height="7" fill="#fff" stroke="{INK}" stroke-width="1.6"/><text x="0" y="-7" class="t-sc">0</text><text x="{bar:.1f}" y="-7" text-anchor="end" class="t-sc">{label}</text></g>')
def chevrons(M, pts, metres_list, size, colour, sw):
    for d in metres_list:
        (la, lo), i = at_m(pts, d); x, y = M.P(la, lo); x2, y2 = M.P(*pts[i + 1]); x0, y0 = M.P(*pts[i])
        a = math.degrees(math.atan2(y2 - y0, x2 - x0))
        M.add(f'<path d="M{-size},{-size * .8} L{size * .6},0 L{-size},{size * .8}" transform="translate({x:.1f},{y:.1f}) rotate({a:.1f})" fill="none" stroke="{colour}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>')

def callout(M, x, y, n, text, side, fs):
    tw = 0.58 * fs * len(text) + 22; h = fs + 16
    bx = x + 26 if side == 'r' else x - 26 - tw
    if bx + tw > M.w - 6: bx = x - 26 - tw
    if bx < 6: bx = x + 26
    M.add(f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{bx + (0 if bx > x else tw):.1f}" y2="{y:.1f}" stroke="{INK}" stroke-width="2.5"/>')
    M.add(f'<rect x="{bx:.1f}" y="{y - h / 2:.1f}" width="{tw:.1f}" height="{h}" rx="7" fill="#fff" stroke="{INK}" stroke-width="2.5"/><text x="{bx + 11:.1f}" y="{y + fs * .36:.1f}" class="t-step" style="font-size:{fs}px">{text}</text>')
    M.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="17" fill="{INK}" stroke="#fff" stroke-width="4"/><text x="{x:.1f}" y="{y + 7.5:.1f}" text-anchor="middle" class="t-num">{n}</text>')

# ---------- overview: the bridge to Narrowneck ----------
O = Map(16, -27.99290, 153.41170, -27.97120, 153.43590, 660)
roads(O, 1.6)
rd = O.d(route)
O.add(f'<path d="{rd}" fill="none" stroke="#fff" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>')
O.add(f'<path d="{rd}" fill="none" stroke="{ORANGE}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>')
RL = length_m(route)
chevrons(O, route, [RL * f for f in (0.06, 0.27, 0.40, 0.55, 0.70, 0.85)], 6, '#fff', 3)
ex, ey = O.P(*HOLDING[-1]); sx, sy = O.P(*HOLDING[0])
# The overview uses the same marked island edge as the close-up and aerial, not the full road segment.
O.add(f'<path d="{O.d(HOLDING)}" fill="none" stroke="{ORANGE}" stroke-width="12" stroke-opacity=".45" stroke-linecap="butt"/>')
for txt, la, lo, a in [('SOUTHPORT', -27.97290, 153.41500, 0), ('MAIN BEACH', -27.98000, 153.42620, 0), ('NARROWNECK', -27.98880, 153.42380, 0), ('Broadwater', -27.97260, 153.42520, 0), ('Nerang River', -27.98380, 153.41940, -60), ('Pacific Ocean', -27.98250, 153.43400, -84)]:
    x, y = O.P(la, lo); O.add(f'<text x="{x:.1f}" y="{y:.1f}" class="t-place" transform="rotate({a} {x:.1f} {y:.1f})">{txt}</text>')
def near(la, lo): return min(route, key=lambda p: math.dist(p, (la, lo)))
for n, (la, lo), txt, side in [(1, (-27.97680, 153.42115), 'Sundale Bridge', 'l'), (2, (-27.97951, 153.42211), 'LEFT · Waterways Dr', 'l'),
                               (3, (-27.97385, 153.42753), 'MacArthur Pde', 'l'), (4, (-27.98400, 153.42930), 'Main Beach Pde south', 'l'),
                               (5, (-27.99006, 153.42975), 'Keep LEFT · Esplanade', 'l')]:
    x, y = O.P(*near(la, lo)); callout(O, x, y, n, txt, side, 21)
O.add(f'<text x="{ex + 22:.1f}" y="{ey + 8:.1f}" class="t-hold">HOLD</text>')
north(O); scale(O, 500, '500 m')

# ---------- close-up: the holding strip and the drop ----------
C = Map(19, -27.99192, 153.42868, -27.98968, 153.43122, 700)
roads(C, 3)
C.add(f'<path d="{C.d(esp)}" fill="none" stroke="#a9b8bc" stroke-width="{11 / C.mpp + 2.4:.1f}" stroke-linecap="round"/><path d="{C.d(esp)}" fill="none" stroke="#fff" stroke-width="{11 / C.mpp:.1f}" stroke-linecap="round"/>')
L = length_m(esp)
strip = HOLDING
SL = length_m(strip)
lane_w = 3.0 / C.mpp
sd = C.d(strip)
C.add(f'<defs><pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="#ffe3d1"/><line x1="0" y1="0" x2="0" y2="12" stroke="{ORANGE}" stroke-width="4" stroke-opacity=".55"/></pattern></defs>')
C.add(f'<path d="{sd}" fill="none" stroke="{ORANGE}" stroke-width="{lane_w + 8:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')
C.add(f'<path d="{sd}" fill="none" stroke="url(#hatch)" stroke-width="{lane_w:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')
# Queue-order markers only: no invented truck footprint or capacity assertion.
for n,f in enumerate([0.88,0.64,0.40,0.16],1):
    cx,cy=C.P(*at_m(strip,SL*f)[0])
    C.add(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="16" fill="#fff" stroke="{ORANGE}" stroke-width="4"/><text x="{cx:.1f}" y="{cy + 7:.1f}" text-anchor="middle" class="t-slot">{n}</text>')
chevrons(C, strip, [1], 9, INK, 4.5)
DROP = [('P25', -27.991486, 153.430428), ('P66', -27.991452, 153.430425), ('P65', -27.991376, 153.430418), ('P67', -27.991346, 153.430415)]
xs = [C.P(la, lo) for _, la, lo in DROP]
mx, my = sum(x for x, _ in xs) / 4, sum(y for _, y in xs) / 4
C.add(f'<ellipse cx="{mx:.1f}" cy="{my:.1f}" rx="{12 / C.mpp:.1f}" ry="{15 / C.mpp:.1f}" fill="{INK}" fill-opacity=".08" stroke="{INK}" stroke-width="3" stroke-dasharray="9 6"/>')
for x, y in xs: C.add(f'<rect x="{x - 6:.1f}" y="{y - 6:.1f}" width="12" height="12" rx="2" fill="{ORANGE}" stroke="#fff" stroke-width="2"/>')
bw = 176; bx = min(C.w - bw - 8, mx + 12 / C.mpp + 10)
if bx + bw > C.w - 8 or bx < mx: bx = mx - 12 / C.mpp - bw - 10
C.add(f'<g transform="translate({bx:.1f},{my - 64:.1f})"><rect width="{bw}" height="62" rx="8" fill="#fff" stroke="{INK}" stroke-width="2.5"/><text x="12" y="27" class="t-box">DROP AREA</text><text x="12" y="50" class="t-boxs">P25 · P66 · P65 · P67</text></g>')
(hla, hlo), _ = at_m(strip, SL * 0.45); hx, hy = C.P(hla, hlo)
C.add(f'<g transform="translate({hx - 300:.1f},{hy + 10:.1f})"><rect width="222" height="66" rx="8" fill="{ORANGE}"/><text x="12" y="29" class="t-boxw">HOLDING STRIP</text><text x="12" y="53" class="t-boxws">trucks 1 → 4 · front at Higman St</text></g>')
road_label(C, [1452178842, 1452178843], 'Main Beach Pde', 0.30, dy=-16)
road_label(C, [27768094], 'Higman St', 0.40, dy=-14)
road_label(C, [115940223], 'Esplanade', 0.30, dy=-15)
road_label(C, [1452193841, 1452193842], 'Main Beach Pde', 0.55, dy=-15)
north(C); scale(C, 25, '25 m')

json.dump({'overview': {'svg': O.svg(), 'w': O.w, 'h': O.h, 'route_m': round(RL)},
           'closeup': {'svg': C.svg(), 'w': C.w, 'h': C.h, 'strip_m': round(SL), 'esplanade_m': round(L)},
           'route_ways': ROUTE}, open(os.path.join(HERE, 'maps.json'), 'w'))
print('route', round(RL), 'm; Esplanade one-way', round(L), 'm; holding strip', round(SL), 'm; queue markers show order only, not truck dimensions',
      '| overview', O.w, 'x', O.h, 'close-up', C.w, 'x', C.h)
