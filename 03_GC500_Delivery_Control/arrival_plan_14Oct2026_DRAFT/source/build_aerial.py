#!/usr/bin/env python3
"""Author: Andrew Fisher. Page 2 of the Wed 14 Oct arrival plan: where to turn and where to park, on Queensland Government
aerial imagery, turned so the trucks' direction of travel (south) is up. Writes aerial.svg."""
from holding943 import HOLDING, TURN
import base64, io, json, math, os
from PIL import Image, ImageEnhance
HERE = os.path.dirname(os.path.abspath(__file__))
A = json.load(open(os.path.join(HERE, 'aerial.json')))
OSM = json.load(open(os.path.join(HERE, 'osm.json')))
WAY = {e['id']: e for e in OSM['elements'] if e['type'] == 'way'}
x1, y1, x2, y2 = A['bbox3857']; W, H = A['W'], A['H']
img = Image.open(os.path.join(HERE, 'aerial.jpg')).convert('RGB').rotate(180)
img = ImageEnhance.Contrast(img).enhance(1.05)
buf = io.BytesIO(); img.save(buf, 'JPEG', quality=86, optimize=True); B64 = base64.b64encode(buf.getvalue()).decode()
MPP = (x2 - x1) / W * math.cos(math.radians(-27.990))
ORANGE, INK, RED = '#ff6a13', '#13272f', '#d7263d'

def P(lat, lon):
    R = 6378137.0; X = R * math.radians(lon); Y = R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    x = (X - x1) / (x2 - x1) * W; y = (y2 - Y) / (y2 - y1) * H
    return round(W - x, 1), round(H - y, 1)          # turned 180 degrees: south is up
def geom(i): return [(p['lat'], p['lon']) for p in WAY[i]['geometry']]
def mpd(lat): return 111320.0, 111320.0 * math.cos(math.radians(lat))
def seglen(a, b):
    my, mx = mpd(a[0]); return math.hypot((b[0] - a[0]) * my, (b[1] - a[1]) * mx)
def length_m(p): return sum(seglen(p[i], p[i + 1]) for i in range(len(p) - 1))
def at_m(p, d):
    for i in range(len(p) - 1):
        s = seglen(p[i], p[i + 1])
        if d <= s or i == len(p) - 2:
            t = d / s if s else 0; return (p[i][0] + (p[i + 1][0] - p[i][0]) * t, p[i][1] + (p[i + 1][1] - p[i][1]) * t), i
        d -= s
def sub_m(p, a, b):
    out = [at_m(p, a)[0]]; acc = 0
    for i in range(len(p) - 1):
        acc += seglen(p[i], p[i + 1])
        if a < acc < b: out.append(p[i + 1])
    out.append(at_m(p, b)[0]); return out
def offset(p, m):
    out = []
    for i, (la, lo) in enumerate(p):
        a = p[max(0, i - 1)]; b = p[min(len(p) - 1, i + 1)]; my, mx = mpd(la)
        dy, dx = (b[0] - a[0]) * my, (b[1] - a[1]) * mx; n = math.hypot(dx, dy) or 1
        out.append((la + (-dx / n) * m / my, lo + (dy / n) * m / mx))
    return out
def d(pts): return 'M' + ' L'.join('%s,%s' % P(a, b) for a, b in pts)

esp = geom(115940239)                 # one-way Esplanade, split -> Higman St end
mbp_in = geom(1452178841)[-6:] + geom(1452178842)[1:]   # Main Beach Pde, the last stretch before the split
mbp_on = geom(1452178843)             # Main Beach Pde straight on past the split (not this way)
L = length_m(esp)
strip=HOLDING; SL=length_m(strip)
S = []
X0 = 150; VW = round(H * 0.5053)
S.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{X0} 0 {VW} {H}" class="aer" preserveAspectRatio="xMidYMid slice">')
S.append(f'<image href="data:image/jpeg;base64,{B64}" width="{W}" height="{H}"/>')
S.append(f'<defs><marker id="ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{ORANGE}"/></marker>'
         f'<pattern id="h2" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="16" height="16" fill="{ORANGE}" fill-opacity=".30"/><line x1="0" y1="0" x2="0" y2="16" stroke="{ORANGE}" stroke-width="6" stroke-opacity=".75"/></pattern></defs>')
# approach along Main Beach Pde, then the turn onto the Esplanade
appr = mbp_in[-5:] + TURN[:1]
turn=TURN
S.append(f'<path d="{d(appr)}" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" stroke-opacity=".9"/><path d="{d(appr)}" fill="none" stroke="{ORANGE}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>')
S.append(f'<path d="{d(turn)}" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" stroke-opacity=".9"/><path d="{d(turn)}" fill="none" stroke="{ORANGE}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#ah)"/>')
# straight on along Main Beach Pde is NOT the way
nx, ny = P(*at_m(mbp_on, 78)[0])
S.append(f'<g transform="translate({nx},{ny})"><circle r="30" fill="{RED}" stroke="#fff" stroke-width="5"/><path d="M-13,-13 L13,13 M13,-13 L-13,13" stroke="#fff" stroke-width="7" stroke-linecap="round"/></g>')
S.append(f'<g transform="translate({nx + 42},{ny - 28})"><rect width="330" height="56" rx="10" fill="#fff" stroke="{RED}" stroke-width="4"/><text x="14" y="37" class="a-no">Not straight on here</text></g>')
# the holding strip and the truck slots, truck 1 at the front (Higman St end)
S.append(f'<path d="{d(strip)}" fill="none" stroke="#fff" stroke-width="{3.2 / MPP + 12:.1f}" stroke-linecap="butt" stroke-linejoin="round" stroke-opacity=".9"/>')
S.append(f'<path d="{d(strip)}" fill="none" stroke="url(#h2)" stroke-width="{3.2 / MPP:.1f}" stroke-linecap="butt" stroke-linejoin="round"/>')
# Queue-order markers only; actual truck positioning is directed by traffic control.
for k,f in enumerate([0.88,0.64,0.40,0.16]):
    cx,cy=P(*at_m(strip,SL*f)[0])
    S.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="27" fill="#fff" stroke="{ORANGE}" stroke-width="6"/><text x="{cx:.1f}" y="{cy + 11:.1f}" text-anchor="middle" class="a-slot">{k + 1}</text>')
# the drop area (master plan positions of the four buildings)
DROP = [(-27.991486, 153.430428), (-27.991452, 153.430425), (-27.991376, 153.430418), (-27.991346, 153.430415)]
pts = [P(*q) for q in DROP]; mx_ = sum(x for x, _ in pts) / 4; my_ = sum(y for _, y in pts) / 4
S.append(f'<ellipse cx="{mx_:.1f}" cy="{my_:.1f}" rx="{13 / MPP:.1f}" ry="{16 / MPP:.1f}" fill="#fff" fill-opacity=".18" stroke="#fff" stroke-width="5" stroke-dasharray="14 9"/>')
for x, y in pts: S.append(f'<rect x="{x - 9:.1f}" y="{y - 9:.1f}" width="18" height="18" rx="3" fill="{ORANGE}" stroke="#fff" stroke-width="3"/>')
# labels (all upright on the turned photo)
def box(x, y, title, sub, fill, ink, w):
    x=max(X0+10,min(x,X0+VW-w-10))
    S.append(f'<g transform="translate({x:.1f},{y:.1f})"><rect width="{w}" height="{96 if sub else 58}" rx="12" fill="{fill}" stroke="#fff" stroke-width="3"/><text x="18" y="42" class="a-t" fill="{ink}">{title}</text>' + (f'<text x="18" y="78" class="a-s" fill="{ink}">{sub}</text>' if sub else '') + '</g>')
tx, ty = P(*TURN[2])
box(tx + 22, ty + 30, 'TURN LEFT HERE', 'at the red crossing', ORANGE, '#fff', 372)
S.append(f'<line x1="{tx + 40:.1f}" y1="{ty + 60:.1f}" x2="{tx + 8:.1f}" y2="{ty + 6:.1f}" stroke="#fff" stroke-width="5"/>')
t1x, t1y = P(*at_m(strip, SL - 8)[0])
box(t1x + 90, t1y - 120, 'TRUCK 1 STOPS HERE', 'front of strip · Higman St end', INK, '#fff', 440)
S.append(f'<line x1="{t1x + 90:.1f}" y1="{t1y - 72:.1f}" x2="{t1x + 26:.1f}" y2="{t1y - 8:.1f}" stroke="{INK}" stroke-width="6"/>')
m4x, m4y = P(*at_m(strip, SL * 0.35)[0])
box(X0 + 14, m4y + 60, 'HOLDING STRIP', '2, 3, 4 close behind', '#fff', INK, 340)
S.append(f'<line x1="{X0 + 354:.1f}" y1="{m4y + 108:.1f}" x2="{m4x - 18:.1f}" y2="{m4y + 8:.1f}" stroke="#fff" stroke-width="5"/>')
box(X0 + 14, my_ - 230, 'DROP AREA', 'P25 · P66 · P65 · P67', '#fff', INK, 330)
S.append(f'<line x1="{X0 + 170:.1f}" y1="{my_ - 134:.1f}" x2="{mx_ - 10:.1f}" y2="{my_ - 16 / MPP:.1f}" stroke="#fff" stroke-width="5"/>')
for txt, way, f, dy in [('Main Beach Pde', 1452178841, 0.94, 0), ('Esplanade', 115940223, 0.55, -30)]:
    g = geom(way); (la, lo), i = at_m(g, length_m(g) * f); x, y = P(la, lo); xa, ya = P(*g[i]); xb, yb = P(*g[i + 1])
    a = math.degrees(math.atan2(yb - ya, xb - xa)); a = a - 180 if a > 90 else a + 180 if a < -90 else a
    S.append(f'<text x="{x:.1f}" y="{y + dy:.1f}" text-anchor="middle" class="a-road" transform="rotate({a:.1f} {x:.1f} {y:.1f})">{txt}</text>')
S.append(f'<g transform="translate({X0 + VW - 62},{70})"><circle r="44" fill="#fff" stroke="{INK}" stroke-width="4"/><path d="M0,20 L12,-16 L0,-9 L-12,-16 Z" fill="{INK}"/><text y="38" text-anchor="middle" class="a-n">N</text></g>')
S.append(f'<g transform="translate({X0 + 14},{H - 80})"><rect width="470" height="48" rx="10" fill="#13272fd9"/><text x="18" y="33" class="a-cap">Turned to your driving direction</text></g>')
bar = 25 / MPP
S.append(f'<g transform="translate({X0 + VW - bar - 40:.1f},{H - 56})"><rect x="-14" y="-38" width="{bar + 28:.1f}" height="60" rx="8" fill="#ffffffe6"/><rect width="{bar:.1f}" height="10" fill="{INK}"/><rect x="{bar / 2:.1f}" width="{bar / 2:.1f}" height="10" fill="#fff" stroke="{INK}" stroke-width="2"/><text y="-10" class="a-sc">0</text><text x="{bar:.1f}" y="-10" text-anchor="end" class="a-sc">25 m</text></g>')
S.append('</svg>')
open(os.path.join(HERE, 'aerial.svg'), 'w').write(''.join(S))
print('aerial.svg', W, H, 'm/px', round(MPP, 3), 'strip', round(SL), 'm')
