#!/usr/bin/env python3
"""Author: Andrew Fisher. "What you built" - the fencing crew's showpiece, GC500 2026 (six A4 pages, full bleed, no money).

Andrew, 24 Oct 2026: "We want something elite and pretty to show the fencing team ... Try again ... if we cant present it
good. Remove it ... like a show piece for these guys so must look really good please. And amazing on pdf".
One idea a page, big type, nothing technical. Every figure is the live record's own reading on 24 Oct 2026 (record 10804);
the cover is the Queensland Government 2022 aerial the record holds, with the track and the installation-plan fence runs
placed by the record's registrations (v2's make_inputs.py and map_inputs_24Oct2026.json; see the v2 README for the fits).

    python3 build_showpiece.py <aerial .webp>      -> showpiece.html, then: node render.cjs, then: python3 pdf_meta.py
"""
import base64, hashlib, io, json, math, re, sys
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
V2 = HERE.parent / 'print_24Oct2026_fencing_crew_v2'        # the map inputs and italic faces are v2's, unchanged
INP = json.loads((V2 / 'map_inputs_24Oct2026.json').read_text())
NO_INTER = lambda css: re.sub(r"@font-face\s*\{[^}]*'Inter Print'[^}]*\}", '', css)   # the first print-out's Inter is a variable font
FONTS = (NO_INTER((HERE.parent / 'print_24Oct2026_fencing_crew' / 'fonts.css').read_text()) + (V2 / 'fonts_italic.css').read_text()
         + (HERE / 'fonts_light.css').read_text() + (HERE / 'fonts_inter.css').read_text())
W0, H0 = INP['frame_px']
CROP = (0, 0, H0, round(H0 * 297 / 210))          # north-up, the whole width, cut to the A4 shape
OUT_W = 2600

WEEKS = [('WEEK 6', '9–12 SEP', 810), ('WEEK 5', '14–18 SEP', 2667.5), ('WEEK 4', '21–25 SEP', 3022.5), ('WEEK 3', '28 SEP–2 OCT', 3505),
         ('WEEK 2', '6–9 OCT', 1874.5), ('WEEK 1', '12–16 OCT', 5645), ('EVENT WEEK', '19–23 OCT', 3273)]
GEAR = [('feet', '8,235', 'Feet', 'under every panel and brace'), ('clamp', '7,977', 'Clamps', 'joining the panels'),
        ('panel', '5,223', 'Mesh panels', 'plus 41 hoarding panels'), ('ccb', '2,903', 'Crowd-control barriers', '7.3 km of them'),
        ('brace', '1,426', 'Braces', 'two feet under every one'), ('gate', '155', 'Gates', '133 vehicle · 22 pedestrian')]
CREW = ['Owen Cowell McPaul', 'Daniel Macleod', 'Cody Woods', 'Chase Hireni', 'Tahi Peni', 'Daniel Smith', 'Scott Hildebrand',
        'Hayden McAvoy', 'Alonzo McAvoy']
TOTAL_M, LAP_M = 20797.5, INP['lap_length_m']
assert abs(sum(w[2] for w in WEEKS) - TOTAL_M) < 0.01


def north_up(x, y): return H0 - 1 - y - CROP[0], x - CROP[1]


def poly(pts, close=False):
    return 'M' + ' L'.join('%.1f,%.1f' % north_up(x, y) for x, y in pts) + (' Z' if close else '')


def cover_jpeg(aerial_path):
    raw = Path(aerial_path).read_bytes()
    if hashlib.sha256(raw).hexdigest() != INP['read_from']['aerial_media']: sys.exit('that is not the aerial the record holds')
    im = Image.open(io.BytesIO(raw)).convert('RGB').rotate(-90, expand=True).crop(CROP)
    im = im.resize((OUT_W, round(OUT_W * CROP[3] / CROP[2])), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    l = np.clip(lum * 1.08, 0, 1) ** 1.55
    dark, light = np.array([3, 11, 17]) / 255, np.array([214, 204, 190]) / 255
    g = dark[None, None, :] * (1 - l[..., None]) + light[None, None, :] * l[..., None]
    g = np.clip(g * 0.9 + a * 0.07, 0, 1)
    h, w = lum.shape; yy, xx = np.mgrid[0:h, 0:w]
    vig = 1 - 0.5 * (((xx - w * 0.6) / (w * 0.72)) ** 2 + ((yy - h * 0.5) / (h * 0.74)) ** 2)
    g = np.clip(g * np.clip(vig, 0.35, 1)[..., None], 0, 1)
    buf = io.BytesIO(); Image.fromarray((g * 255).astype('uint8')).save(buf, 'JPEG', quality=88, optimize=True, progressive=True)
    return base64.b64encode(buf.getvalue()).decode(), buf.tell()


BAND = (40, 600, 4000, 2259)                       # frame pixels (north to the left): the circuit's fence runs, cut 210:88


def band_jpeg(aerial_path):
    im = Image.open(aerial_path).convert('RGB').crop(BAND)
    im = im.resize((2600, round(2600 * (BAND[3] - BAND[1]) / (BAND[2] - BAND[0]))), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    l = np.clip(lum * 1.05, 0, 1) ** 1.6
    dark, light = np.array([3, 11, 17]) / 255, np.array([205, 196, 182]) / 255
    g = np.clip((dark[None, None, :] * (1 - l[..., None]) + light[None, None, :] * l[..., None]) * 0.9 + a * 0.06, 0, 1)
    buf = io.BytesIO(); Image.fromarray((g * 255).astype('uint8')).save(buf, 'JPEG', quality=86, optimize=True, progressive=True)
    return base64.b64encode(buf.getvalue()).decode()


def band_svg():
    x0, y0, x1, y1 = BAND
    fr = lambda pts: 'M' + ' L'.join('%.1f,%.1f' % (x, y) for x, y in pts)
    track = fr(INP['track']) + ' Z'; fence = ' '.join(fr(f['pts']) for f in INP['fences'])
    return ('<svg class="bdsvg" viewBox="%d %d %d %d" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">'
            '<g fill="none" stroke-linejoin="round" stroke-linecap="round">'
            '<path d="%s" stroke="#fff" stroke-opacity=".08" stroke-width="44"/><path d="%s" stroke="#fff" stroke-opacity=".9" stroke-width="6"/>'
            '<path d="%s" stroke="#FF6B1A" stroke-opacity=".14" stroke-width="64"/><path d="%s" stroke="#FF6B1A" stroke-opacity=".3" stroke-width="30"/>'
            '<path d="%s" stroke="#FF7A2E" stroke-width="12"/><path d="%s" stroke="#FFE0C7" stroke-width="3.4"/></g></svg>'
            % (x0, y0, x1 - x0, y1 - y0, track, track, fence, fence, fence, fence))


def cover_svg():
    cw, ch = CROP[2], CROP[3]
    track = poly(INP['track'], True); fence = ' '.join(poly(f['pts']) for f in INP['fences'])
    places = {('NARROWNECK BEACH', 'beach'): -90, ('PACIFIC OCEAN', 'water'): -90, ('NERANG RIVER', 'water-wide'): 0}
    s = ['<svg class="cvsvg" viewBox="0 0 %d %d" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' % (cw, ch),
         '<g fill="none" stroke-linejoin="round" stroke-linecap="round">',
         '<path d="%s" stroke="#fff" stroke-opacity=".07" stroke-width="56"/><path d="%s" stroke="#fff" stroke-opacity=".16" stroke-width="26"/>'
         '<path d="%s" stroke="#fff" stroke-opacity=".95" stroke-width="7"/>' % (track, track, track),
         '<path d="%s" stroke="#FF6B1A" stroke-opacity=".12" stroke-width="80"/><path d="%s" stroke="#FF6B1A" stroke-opacity=".26" stroke-width="38"/>'
         '<path d="%s" stroke="#FF7A2E" stroke-opacity=".9" stroke-width="15"/><path d="%s" stroke="#FFE0C7" stroke-width="4"/>' % (fence, fence, fence, fence),
         '</g>']
    for p in INP['places']:
        rot = places.get((p['name'], p['kind']))
        if rot is None: continue
        x, y = north_up(*p['px'])
        s.append('<text class="cvpl" text-anchor="middle" transform="translate(%.0f %.0f) rotate(%d)">%s</text>' % (x, y, rot, p['name']))
    s.append('</svg>')
    return ''.join(s)


def smooth(q, k=7):
    n = len(q); out = np.empty_like(q)
    for i in range(n): out[i] = q[[(i + j) % n for j in range(-k, k + 1)]].mean(0)
    return out


def track_path(box_w, box_h, pad=0.0):
    q = smooth(np.array([north_up(x, y) for x, y in INP['track']], dtype=float))
    q -= q.min(0); sc = min((box_w - 2 * pad) / q[:, 0].max(), (box_h - 2 * pad) / q[:, 1].max()); q = q * sc
    q += (np.array([box_w, box_h]) - q.max(0)) / 2
    return 'M' + ' L'.join('%.2f,%.2f' % tuple(p) for p in q) + ' Z'


ICONS = {   # 48 x 48, drawn as line art
    'feet': '<path d="M9 37 L14 21 H34 L39 37 Z"/><path d="M19 21 V25 M29 21 V25"/><path d="M6 37 H42"/><path d="M15.5 30 H32.5" opacity=".5"/>',
    'clamp': '<circle cx="17" cy="24" r="9"/><circle cx="31" cy="24" r="9"/><path d="M24 11 V37"/><circle cx="24" cy="24" r="2.2"/>',
    'panel': '<rect x="7" y="9" width="34" height="27" rx="1.5"/><path d="M15.5 9 V36 M24 9 V36 M32.5 9 V36 M7 18 H41 M7 27 H41"/><path d="M11 36 V41 M37 36 V41"/>',
    'ccb': '<path d="M6 13 H42 M6 33 H42"/><path d="M11 13 V33 M17.5 13 V33 M24 13 V33 M30.5 13 V33 M37 13 V33"/><path d="M8 33 L5 41 M8 33 L14 41 M40 33 L34 41 M40 33 L43 41"/>',
    'brace': '<path d="M14 6 V40"/><path d="M14 10 L35 38"/><path d="M8 40 H20 M29 40 H41"/><path d="M11 6 H17" opacity=".6"/>',
    'gate': '<rect x="7" y="8" width="30" height="26" rx="1.5"/><path d="M14.5 8 V34 M22 8 V34 M29.5 8 V34 M7 21 H37"/><path d="M41 6 V40"/><circle cx="12" cy="38.5" r="3"/>',
}


def icon(kind): return '<svg class="gico" viewBox="0 0 48 48">%s</svg>' % ICONS[kind]


def week_chart():
    w, h, l, r, t, b = 1000, 600, 6, 6, 66, 92
    ch = h - t - b; n = len(WEEKS); step = (w - l - r) / n; bw = step * 0.5; mx = 6000
    y = lambda v: t + ch - v / mx * ch
    s = ['<svg class="chart" viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg"><defs>' % (w, h),
         '<radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FF6B1A" stop-opacity=".42"/><stop offset="1" stop-color="#FF6B1A" stop-opacity="0"/></radialGradient></defs>']
    for v in (2000, 4000, 6000):
        s.append('<line x1="%d" x2="%d" y1="%.1f" y2="%.1f" class="gl"/><text class="gt" x="%d" y="%.1f">%s m</text>' % (l, w - r, y(v), y(v), l, y(v) - 8, '{:,}'.format(v)))
    for i, (wk, dates, m) in enumerate(WEEKS):
        x = l + step * i + (step - bw) / 2; cx = x + bw / 2; hot = wk == 'WEEK 1'; yt, yb, r = y(m), y(0), 6
        if hot: s.append('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="url(#halo)"/>' % (cx, yt + 40, bw * 1.5, 150))
        stops = (('0', '#FFC08F'), ('.35', '#FF7A2E'), ('1', '#C64608')) if hot else (('0', '#FF8A3D'), ('1', '#B83E06'))
        s.append('<defs><linearGradient id="b%d" gradientUnits="userSpaceOnUse" x1="0" y1="%.1f" x2="0" y2="%.1f">%s</linearGradient></defs>'
                 % (i, yt, yb, ''.join('<stop offset="%s" stop-color="%s"/>' % st for st in stops)))
        s.append('<path d="M%.1f,%.1f V%.1f Q%.1f,%.1f %.1f,%.1f H%.1f Q%.1f,%.1f %.1f,%.1f V%.1f Z" fill="url(#b%d)"/>'
                 % (x, yb, yt + r, x, yt, x + r, yt, x + bw - r, x + bw, yt, x + bw, yt + r, yb, i))
        s.append('<text class="bv%s" x="%.1f" y="%.1f" text-anchor="middle">%s</text>' % (' hot' if hot else '', cx, y(m) - 14, '{:,}'.format(m).rstrip('0').rstrip('.') if m % 1 else '{:,}'.format(int(m))))
        if hot: s.append('<text class="bt" x="%.1f" y="%.1f" text-anchor="middle">BIGGEST WEEK</text>' % (cx, y(m) - 48))
        s.append('<text class="bw" x="%.1f" y="%.1f" text-anchor="middle">%s</text><text class="bd" x="%.1f" y="%.1f" text-anchor="middle">%s</text>'
                 % (cx, y(0) + 40, wk, cx, y(0) + 66, dates))
    s.append('<line x1="%d" x2="%d" y1="%.1f" y2="%.1f" class="base"/></svg>' % (l, w - r, y(0), y(0)))
    return ''.join(s)


def flag_svg():
    """A chequered flag waving across the foot of the last page (mm units), light on the folds; vector throughout."""
    W, H, top, rows, cols, sq, lam, A, B = 210, 86, 14, 6, 26, 9.0, 96.0, 3.4, 2.2
    x0, yc, half = (W - cols * sq) / 2, top + rows * sq / 2, rows * sq / 2
    th = lambda x: 2 * math.pi * x / lam + 0.9
    P = lambda x, y: (x, y + A * math.sin(th(x)) + B * (y - yc) / half * math.cos(th(x)))
    shade = lambda x: 0.5 - 0.5 * math.cos(th(x))
    pts = lambda seq: ' L'.join('%.2f,%.2f' % P(x, y) for x, y in seq)
    x1, y1, n = x0 + cols * sq, top + rows * sq, 4
    edge = ([(x0 + (x1 - x0) * k / 240, top) for k in range(241)] + [(x1, top + (y1 - top) * k / 12) for k in range(1, 13)]
            + [(x1 - (x1 - x0) * k / 240, y1) for k in range(1, 241)] + [(x0, y1 - (y1 - top) * k / 12) for k in range(1, 12)])
    outline = 'M' + pts(edge) + ' Z'
    cells = []
    for r in range(rows):
        for c in range(cols):
            if (r + c) % 2: continue
            xa, xb, ya, yb = x0 + c * sq, x0 + (c + 1) * sq, top + r * sq, top + (r + 1) * sq
            seq = ([(xa + (xb - xa) * k / n, ya) for k in range(n + 1)] + [(xb, ya + (yb - ya) * k / n) for k in range(1, n + 1)]
                   + [(xb - (xb - xa) * k / n, yb) for k in range(1, n + 1)] + [(xa, yb - (yb - ya) * k / n) for k in range(1, n)])
            cells.append('M' + pts(seq) + ' Z')
    dark = ''.join('<stop offset="%.4f" stop-color="#000" stop-opacity="%.3f"/>' % (k / W, (1 - shade(k)) * 0.46) for k in range(0, W + 1, 3))
    lite = ''.join('<stop offset="%.4f" stop-color="#fff" stop-opacity="%.3f"/>' % (k / W, max(0, shade(k) - 0.62) / 0.38 * 0.16) for k in range(0, W + 1, 3))
    return ('<svg class="flag" viewBox="0 0 %d %d" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><defs>' % (W, H)
            + '<clipPath id="fl"><path d="%s"/></clipPath>' % outline
            + '<linearGradient id="fdk" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="%d" y2="0">%s</linearGradient>' % (W, dark)
            + '<linearGradient id="flt" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="%d" y2="0">%s</linearGradient>' % (W, lite)
            + '<linearGradient id="fsd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#07090B"/><stop offset=".16" stop-color="#07090B" stop-opacity="0"/>'
              '<stop offset=".84" stop-color="#07090B" stop-opacity="0"/><stop offset="1" stop-color="#07090B"/></linearGradient>'
            + '<radialGradient id="fgl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FF6B1A" stop-opacity=".30"/><stop offset="1" stop-color="#FF6B1A" stop-opacity="0"/></radialGradient></defs>'
            + '<path d="%s" fill="#15181B"/>' % outline
            + '<path d="%s" fill="#ECE7DF"/>' % ' '.join(cells)
            + '<g clip-path="url(#fl)"><rect x="0" y="0" width="%d" height="%d" fill="url(#fdk)"/><rect x="0" y="0" width="%d" height="%d" fill="url(#flt)"/></g>' % (W, H, W, H)
            + '<path d="%s" fill="none" stroke="#F3EEE7" stroke-opacity=".22" stroke-width=".3"/>' % outline
            + '<ellipse cx="%.1f" cy="%.1f" rx="78" ry="30" fill="url(#fgl)"/>' % (W / 2, yc)
            + '<rect x="0" y="0" width="%d" height="%d" fill="url(#fsd)"/></svg>' % (W, H))


def chrome(num, name, page):
    bars = ''.join('<i class="%s"></i>' % ('on' if k == page else '') for k in range(1, 7))
    return (f'<div class="hd"><span><b>{num}</b>{name}</span><span>GC500 · 2026 build</span></div>'
            f'<div class="ft"><span>Advanced Temporary Fencing</span><span class="prog">{bars}<span>{page:02d} / 06</span></span></div>')


def build(aerial_path):
    jpg, jpg_bytes = cover_jpeg(aerial_path); band = band_jpeg(aerial_path)
    laps = TOTAL_M / LAP_M
    lp = track_path(50, 100, 3)
    lapsvg = ''.join('<svg class="lap" viewBox="0 0 50 100"><path d="%s" class="lg"/><path d="%s" class="lc"/></svg>' % (lp, lp) for _ in range(int(laps)))
    lapsvg += ('<svg class="lap" viewBox="0 0 50 100"><path d="%s" class="lghost"/><path d="%s" pathLength="100" class="lpg" stroke-dasharray="%.2f 100"/>'
               '<path d="%s" pathLength="100" class="lpc" stroke-dasharray="%.2f 100"/></svg>' % (lp, lp, (laps % 1) * 100, lp, (laps % 1) * 100))
    gear = ''.join('<div class="gi">%s<div><b>%s</b><span>%s</span><i>%s</i></div></div>' % (icon(k), n, lab, note) for k, n, lab, note in GEAR)
    crew = ''.join('<li><i></i>%s</li>' % nm for nm in CREW)
    big = track_path(100, 200, 2)
    css = (HERE / 'showpiece.css').read_text()
    html = f'''<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>What you built — GC500 2026 fencing crew</title>
<meta name="author" content="Andrew Fisher"><style>{FONTS}{css}</style></head><body>

<section class="pg cover">
 <img class="cvimg" src="data:image/jpeg;base64,{jpg}" alt="">
 {cover_svg()}
 <div class="cvtop"></div><div class="cvbot"></div><div class="cvleft"></div>
 <div class="cvhead"><p class="kick">Boost Mobile Gold Coast 500 <span>·</span> 2026 Build</p>
  <h1>What you<br><em>built.</em></h1></div>
 <div class="cvfoot">
  <div class="who"><b>Advanced Temporary Fencing</b><span>Wayne Woods and crew · 9 Sep – 23 Oct 2026</span></div>
  <div class="hall"><b>100<small>%</small></b><span>of the build</span></div>
 </div>
 <p class="cvcredit">Aerial © State of Queensland 2022, CC BY 4.0 · Track and fence runs placed from the GC500 record</p>
</section>

<section class="pg dist">
 {chrome('01', 'The distance', 2)}
 <div class="glow g1"></div>
 <div class="mega"><b>20.8</b><span>km</span></div>
 <p class="tag">Of fence and crowd control.<br>Panel by panel. By hand.</p>
 <div class="laps"><p class="lt">More than <em>seven laps</em> of the street circuit</p><div class="lrow">{lapsvg}</div></div>
 <div class="three">
  <div><b>13.3<small>km</small></b><span>Temporary fence</span><i>653 m more than planned</i></div>
  <div><b>7.3<small>km</small></b><span>Crowd-control barrier</span><i>event lines and demarcation</i></div>
  <div><b>4.4<small>km</small></b><span>Scrim</span><i>shade cloth on the fence</i></div>
 </div>
 <div class="band"><img src="data:image/jpeg;base64,{band}" alt="">{band_svg()}<div class="bandfade"></div></div>
</section>

<section class="pg gear">
 {chrome('02', 'The gear', 3)}
 <div class="glow g2"></div>
 <h2 class="t1">Every piece.<br><em>By hand.</em></h2>
 <div class="ggrid">{gear}</div>
</section>

<section class="pg weeks">
 {chrome('03', 'The build', 4)}
 <div class="glow g3"></div>
 <h2 class="t1">Seven <em>weeks.</em></h2>
 <p class="sub"><b>10 km</b> by Friday 2 October. <b>20.8 km</b> by Friday 23 October.</p>
 <div class="chartwrap">{week_chart()}</div>
 <div class="recs">
  <div><b>1,430<small>m</small></b><span>Biggest day</span><i>Mon 28 Sep · Gold Coast Hwy median</i></div>
  <div><b>1,210<small>m</small></b><span>Biggest single job</span><i>Tue 13 Oct · Cable St to Gate 8A</i></div>
  <div><b>45</b><span>Dockets in event week</span><i>19–23 Oct · 15 on the Thursday</i></div>
 </div>
 <div class="wx"><p>Built through it</p><div><b>113.6<small>mm</small></b><span>of rain</span></div><div><b>18</b><span>wet mornings</span></div>
  <div><b>15</b><span>days of gusts over 50 km/h</span></div><div><b>63<small>km/h</small></b><span>biggest gust</span></div></div>
</section>

<section class="pg crew">
 {chrome('04', 'The crew', 5)}
 <div class="glow g4"></div>
 <div class="circ"><svg class="bigtrack" viewBox="0 0 100 200"><path d="{big}" class="bt1"/><path d="{big}" class="bt2"/><path d="{big}" class="bt3"/></svg>
  <p>Surfers Paradise street circuit</p></div>
 <h2 class="t1">The <em>line-up.</em></h2>
 <div class="sup"><span>Supervisor</span><b>Wayne Woods</b></div>
 <ul class="names">{crew}</ul>
</section>

<section class="pg thanks">
 {chrome('05', 'Thank you', 6)}
 <div class="glow g5"></div>
 <h2 class="ty">Thank<br><em>you.</em></h2>
 <div class="letter">
  <p class="dear">Fellas,</p>
  <p>This is what you built. 20.8 kilometres of fence and crowd control around the Surfers Paradise street circuit: every panel, every foot and every clamp carried and stood up by hand, in the wind and the rain, and done right.</p>
  <p>You finished the build. One hundred per cent, ready for race weekend. And from the public, the residents living right beside the circuit and V8 Supercars management: nothing but positive feedback.</p>
  <p>That's how you represent a job.</p>
 </div>
 <div class="sig"><div class="ln"></div><b>Andrew Fisher</b><span>Shutdown Manager · Coates</span></div>
 <div class="flagzone">{flag_svg()}<div class="done"><b>Build complete</b><span>100% · Friday 23 October 2026</span></div></div>
 <p class="src">Author: Andrew Fisher · From the signed papers on the GC500 Delivery Control record, read 24 Oct 2026 · Weather: Bureau of Meteorology, Gold Coast Seaway, 7 Sep – 23 Oct</p>
</section>
</body></html>'''
    (HERE / 'showpiece.html').write_text(html, encoding='utf-8')
    print('showpiece.html %d bytes (cover %d bytes); laps %.3f' % (len(html), jpg_bytes, laps))


if __name__ == '__main__':
    if len(sys.argv) != 2: sys.exit(__doc__)
    build(sys.argv[1])
