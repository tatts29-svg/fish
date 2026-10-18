"""The banner's circuit map: the registered 2022 aerial cropped to the circuit, the key-plan ring drawn on it as a glowing orange
band (key plan -> metres east/north of lat0/lon0 by the registration in print/gc3d_registration.json -> EPSG:3857 -> aerial px by
the inverse of georef.basemap_px_to_epsg3857), darkened for the banner. Writes hero_out/hzmap.webp and hzmap.json (the crop)."""
import json, math, sys
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import numpy as np
page = sys.argv[1]
s = open(page, encoding='utf-8').read(); i = s.find('const DATA = '); j = s.find('\n', i); D = json.loads(s[i + len('const DATA = '):j].rstrip(';'))
reg = json.load(open('gc500/print/gc3d_registration.json'))
G = D['georef']; A = np.array(G['basemap_px_to_epsg3857'], dtype=float)   # [X;Y] = A @ [px, py, 1]
ring = D['circuit']['ring']
s_, th, t = reg['s'], math.radians(reg['th_deg']), reg['t']; lat0, lon0 = reg['lat0'], reg['lon0']
def kp_to_en(x, y):   # key plan (x, -y) -> east/north metres
    kx, ky = x, -y
    return s_ * (math.cos(th) * kx - math.sin(th) * ky) + t[0], s_ * (math.sin(th) * kx + math.cos(th) * ky) + t[1]
R = 6378137.0
def en_to_3857(e, n):
    lat = lat0 + n / 111320.0; lon = lon0 + e / (111320.0 * math.cos(math.radians(lat0)))
    return R * math.radians(lon), R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
M = A[:, :2]; c = A[:, 2]; Minv = np.linalg.inv(M)
def m3857_to_px(X, Y): v = Minv @ (np.array([X, Y]) - c); return float(v[0]), float(v[1])
def kp_to_px(x, y): e, n = kp_to_en(x, y); X, Y = en_to_3857(e, n); return m3857_to_px(X, Y)
outer = [kp_to_px(x, y) for x, y in ring['outer']]; inner = [kp_to_px(x, y) for x, y in ring['inner']]
xs = [p[0] for p in outer]; ys = [p[1] for p in outer]
print('ring on the aerial: x %.0f..%.0f y %.0f..%.0f (aerial %s)' % (min(xs), max(xs), min(ys), max(ys), G['frame_px']))
aer_file = 'kit584/GC500_v5.84_reimport/media/' + D['media'][D['aerial_hi']['media']]['file']
im = Image.open(aer_file).convert('RGB'); W, H = im.size
my = (max(ys) - min(ys)) * .05
x0, y0, x1, y1 = 0, max(0, min(ys) - my), W, min(H, max(ys) + my)   # the whole width of the aerial, the ring's height with a small margin (about 2.4:1)
crop = [int(x0), int(y0), int(x1), int(y1)]; base = im.crop(crop)
# dusk: darker, cooler, a little less saturated, a vignette
base = ImageEnhance.Brightness(base).enhance(.58); base = ImageEnhance.Color(base).enhance(.8); base = ImageEnhance.Contrast(base).enhance(1.08)
vig = Image.new('L', base.size, 0); vd = ImageDraw.Draw(vig); bw, bh = base.size
vd.ellipse([-bw * .15, -bh * .35, bw * 1.15, bh * 1.35], fill=255); vig = vig.filter(ImageFilter.GaussianBlur(bw * .08))
base = Image.composite(base, ImageEnhance.Brightness(base).enhance(.45), vig)
# the track: the ring's mid-line (each outer point to its nearest inner point, halfway), a wide soft glow under a slim
# orange line with a pale core - the way a circuit map draws the track, not the fill the key plan uses
off = lambda pts: [(p[0] - crop[0], p[1] - crop[1]) for p in pts]
def nearest(p, pts): return min(pts, key=lambda q: (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2)
mid = [((p[0] + q[0]) / 2, (p[1] + q[1]) / 2) for p in outer for q in [nearest(p, inner)]]
mid = off(mid) + [off(mid)[0]]
sc = base.width / 1600.0
def stroke(w, col, blur, alpha):
    L = Image.new('L', base.size, 0); ImageDraw.Draw(L).line(mid, fill=255, width=max(1, int(w * sc)), joint='curve')
    if blur: L = L.filter(ImageFilter.GaussianBlur(blur * sc))
    return Image.composite(Image.new('RGB', base.size, col), out, L.point(lambda v: int(v * alpha)))
out = base.copy()
out = stroke(34, (255, 106, 19), 14, .55); out = stroke(11, (255, 122, 36), 1.2, 1.0); out = stroke(4, (255, 226, 190), .6, .9)
tw = 1600; out = out.resize((tw, int(out.height * tw / out.width)), Image.LANCZOS)
out.save('hero_out/hzmap.webp', quality=82, method=6)
json.dump({'crop': crop, 'aerial_px': [W, H], 'px': [out.width, out.height], 'up_is_bearing_deg': G['up_is_bearing_deg'], 'lap_length_m': reg.get('lap_length_m')}, open('hero_out/hzmap.json', 'w'))
print('hzmap', out.size, 'crop', crop, 'bytes', len(open('hero_out/hzmap.webp', 'rb').read()))
