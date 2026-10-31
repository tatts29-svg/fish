#!/usr/bin/env python3
"""Author: Andrew Fisher. "What you built" v2 - the fencing crew's book, GC500 2026 (four A4 pages, no money).

Andrew, 24 Oct 2026, on the first print-out: "Lets do something like this as an example but 1000% better please".
Every figure is the live record's own reading on 24 Oct 2026 (record 10804), the same figures the v11.81 Advanced account and
the race call carry; sources are named on the pages. The cover map is the Queensland Government 2022 aerial the page holds,
with the track and the installation-plan fence runs placed by the record's registrations (make_inputs.py).

    python3 build_crew_book.py <aerial .webp>      -> crew_book.html (self-contained), then: node render.cjs
"""
import base64, hashlib, io, json, sys
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
INP = json.loads((HERE / 'map_inputs_24Oct2026.json').read_text())
FONTS = (HERE.parent / 'print_24Oct2026_fencing_crew' / 'fonts.css').read_text() + (HERE / 'fonts_italic.css').read_text()
W0, H0 = INP['frame_px']                       # aerial frame, north to the left
CROP = (0, 0, H0, 4340)                        # north-up crop: the whole width, Main Beach to the Esplanade's south end
OUT_W = 2300                                   # pixels across the cover map (about 300 dpi at 196 mm)

# ---- the figures (record 10804, read 24 Oct 2026) -------------------------------------------------------------------
WEEKS = [('CW6', '9–12 Sep', 810, 0, 5), ('CW5', '14–18 Sep', 2015, 652.5, 29), ('CW4', '21–25 Sep', 1302.5, 1720, 23),
         ('CW3', '28 Sep–2 Oct', 2070, 1435, 14), ('CW2', '6–9 Oct', 1695, 179.5, 23), ('CW1', '12–16 Oct', 3685, 1960, 27),
         ('EVENT', '19–23 Oct', 1692.5, 1580.5, 45)]
GEAR = [('feet', 8235, 'Feet / bases', 'feet, bases and blocks: the same thing'),
        ('clamp', 7977, 'Clamps', 'holding the panels together'),
        ('panel', 5223, 'Mesh panels', 'plus 41 hoarding panels'),
        ('ccb', 2903, 'Crowd-control barriers', '2.2 km of event lines, 5.1 km of demarcation'),
        ('brace', 1426, 'Braces', 'two feet under every one')]
CREW = ['Owen Cowell McPaul', 'Daniel Macleod', 'Cody Woods', 'Chase Hireni', 'Tahi Peni', 'Daniel Smith', 'Scott Hildebrand',
        'Hayden McAvoy', 'Alonzo McAvoy']
TOTAL_M, LAP_M = 20797.5, INP['lap_length_m']
PER_ROW = 30                                    # symbols a row in the gear pictures (each is 100)
assert abs(sum(w[2] for w in WEEKS) - 13270) < 0.01 and abs(sum(w[3] for w in WEEKS) - 7527.5) < 0.01 and sum(w[4] for w in WEEKS) == 166
assert abs(sum(w[2] + w[3] for w in WEEKS) - TOTAL_M) < 0.01

fmt = lambda n: ('{:,.1f}'.format(n) if n % 1 else '{:,.0f}'.format(n))


# ---- the cover map -------------------------------------------------------------------------------------------------
def north_up(x, y):                              # frame (north left) -> north-up crop pixels
    return H0 - 1 - y - CROP[0], x - CROP[1]


def map_jpeg(aerial_path):
    raw = Path(aerial_path).read_bytes()
    if hashlib.sha256(raw).hexdigest() != INP['read_from']['aerial_media']: sys.exit('that is not the aerial the record holds')
    im = Image.open(io.BytesIO(raw)).convert('RGB').rotate(-90, expand=True).crop(CROP)
    im = im.resize((OUT_W, round(OUT_W * (CROP[3] - CROP[1]) / (CROP[2] - CROP[0]))), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    l = np.clip(lum, 0, 1) ** 1.35
    dark, light = np.array([4, 20, 28]) / 255, np.array([225, 214, 196]) / 255
    duo = dark[None, None, :] * (1 - l[..., None]) + light[None, None, :] * l[..., None]
    g = np.clip(duo * 0.85 + a * 0.09, 0, 1)
    h, w = lum.shape; yy, xx = np.mgrid[0:h, 0:w]
    vig = 1 - 0.38 * (((xx - w * 0.56) / (w * 0.75)) ** 2 + ((yy - h * 0.52) / (h * 0.78)) ** 2)
    g = np.clip(g * np.clip(vig, 0.45, 1)[..., None], 0, 1)
    buf = io.BytesIO(); Image.fromarray((g * 255).astype('uint8')).save(buf, 'JPEG', quality=86, optimize=True, progressive=True)
    return base64.b64encode(buf.getvalue()).decode(), buf.tell()


def poly(pts, close=False):
    q = [north_up(x, y) for x, y in pts]
    return ('M' + ' L'.join('%.1f,%.1f' % p for p in q)) + (' Z' if close else '')


# the place names shown on the cover, where iEDM's master plan writes them; the two along the coast turned to run with it
COVER_PLACES = {('PARADISE WATERS', 'suburb'): 0, ('NERANG RIVER', 'water-wide'): 0, ('NARROWNECK BEACH', 'beach'): -90, ('PACIFIC OCEAN', 'water'): -90}


def map_svg():
    cw, ch = CROP[2] - CROP[0], CROP[3] - CROP[1]
    s = ['<svg class="mapsvg" viewBox="0 0 %d %d" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' % (cw, ch)]
    track = poly(INP['track'], True)
    s.append('<g fill="none" stroke-linejoin="round" stroke-linecap="round">')
    s.append('<path d="%s" stroke="#fff" stroke-opacity=".10" stroke-width="44"/><path d="%s" stroke="#fff" stroke-opacity=".22" stroke-width="22"/>'
             '<path d="%s" stroke="#fff" stroke-width="8"/>' % (track, track, track))
    fence = ' '.join(poly(f['pts']) for f in INP['fences'])
    s.append('<path d="%s" stroke="#FF6B1A" stroke-opacity=".16" stroke-width="54"/><path d="%s" stroke="#FF6B1A" stroke-opacity=".34" stroke-width="26"/>'
             '<path d="%s" stroke="#FF8A3D" stroke-width="11"/><path d="%s" stroke="#FFD2B0" stroke-width="3.2"/>' % (fence, fence, fence, fence))
    s.append('</g>')
    for p in INP['places']:
        rot = COVER_PLACES.get((p['name'], p['kind']))
        if rot is None: continue
        x, y = north_up(*p['px'])
        cls = 'pl water' if p['kind'].startswith('water') else 'pl'
        s.append('<text class="%s" text-anchor="middle" transform="translate(%.0f %.0f) rotate(%d)">%s</text>' % (cls, x, y, rot, p['name']))
    # north arrow and a 100 m scale bar out on the water (0.3404 m a crop pixel)
    bar = 100 / INP['georef']['m_per_frame_px_ground']; bx = 2930 - bar
    s.append('<g transform="translate(%.0f 2720)"><path d="M0,-110 L40,36 L0,9 L-40,36 Z" fill="#fff"/><path d="M0,-110 L0,9 L-40,36 Z" fill="#FF6B1A"/>'
             '<text class="north" y="108" text-anchor="middle">N</text></g>' % (bx + bar / 2))
    s.append('<g transform="translate(%.0f 2950)"><rect width="%.1f" height="14" fill="#fff"/><rect x="%.1f" width="%.1f" height="14" fill="#FF6B1A"/>'
             '<text class="scale" y="66">0</text><text class="scale" x="%.1f" y="66" text-anchor="end">100 m</text></g>' % (bx, bar, bar / 2, bar / 2, bar))
    s.append('</svg>')
    return ''.join(s)


# ---- small pictures ------------------------------------------------------------------------------------------------
ICONS = {
    'feet': '<path d="M3.5 19.5 L6.2 10.5 L17.8 10.5 L20.5 19.5 Z" fill="currentColor"/><rect x="8" y="12.4" width="2.4" height="2.6" rx=".5" fill="#fff"/><rect x="13.6" y="12.4" width="2.4" height="2.6" rx=".5" fill="#fff"/>',
    'clamp': '<circle cx="8.5" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="15.5" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 5.5 V18.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    'panel': '<rect x="2.5" y="4" width="19" height="15" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7.25 4v15M12 4v15M16.75 4v15M2.5 9h19M2.5 14h19" stroke="currentColor" stroke-width="1.1"/>',
    'ccb': '<path d="M3 6.5h18M3 16.5h18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M5.5 6.5v10M9 6.5v10M12.5 6.5v10M16 6.5v10M19 6.5v10" stroke="currentColor" stroke-width="1.4"/><path d="M2.5 20.5h6M15.5 20.5h6M5.5 16.5v4M18.5 16.5v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    'brace': '<path d="M5 20.5 L18.5 4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M2.5 21h8.5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M18.5 3v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
}


def icon(kind, frac=1.0):
    body = '<svg class="ic" viewBox="0 0 24 24">%s</svg>' % ICONS[kind]
    if frac >= 0.999: return body
    return '<span class="icpart" style="width:calc(var(--ic) * %.3f)">%s</span>' % (frac, body)


def isotype_row(kind, n, label, note):
    full, part = int(n // 100), (n % 100) / 100
    icons = ''.join(icon(kind) for _ in range(full)) + (icon(kind, part) if part > 0.005 else '')
    return ('<div class="iso iso-%s"><div class="isolab"><b>%s</b><span>%s</span><i>%s</i></div><div class="isoicons">%s</div></div>'
            % (kind, fmt(n), label, note, icons))


def lap_path():
    """The track the cover draws (the key-plan ring as fitted to the aerial), north-up, fitted to a 50 x 100 box."""
    q = np.array([north_up(x, y) for x, y in INP['track']], dtype=float)
    q -= q.min(0); sc = min(46 / q[:, 0].max(), 96 / q[:, 1].max()); q = q * sc
    q += (np.array([50, 100]) - q.max(0)) / 2
    return 'M' + ' L'.join('%.2f,%.2f' % tuple(p) for p in q) + ' Z'


def week_chart():
    w, h, l, r, t, b = 1000, 520, 64, 14, 44, 80
    ch, n = h - t - b, len(WEEKS); step = (w - l - r) / n; bw = step * 0.58; mx = 6000
    y = lambda v: t + ch - v / mx * ch
    s = ['<svg class="chart" viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg">' % (w, h)]
    for v in range(0, 6001, 1000):
        s.append('<line x1="%d" x2="%d" y1="%.1f" y2="%.1f" class="grid"/><text class="ax" x="%d" y="%.1f" text-anchor="end">%s</text>'
                 % (l, w - r, y(v), y(v), l - 10, y(v) + 4, '{:,} m'.format(v) if v else '0'))
    for i, (code, dates, fence, ccb, dockets) in enumerate(WEEKS):
        x = l + step * i + (step - bw) / 2; cx = x + bw / 2; big = code == 'CW1'; ev = code == 'EVENT'
        s.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" class="bf"/>' % (x, y(fence), bw, y(0) - y(fence)))
        if ccb: s.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" class="bc"/>' % (x, y(fence + ccb), bw, y(fence) - y(fence + ccb)))
        s.append('<text class="val%s" x="%.1f" y="%.1f" text-anchor="middle">%s m</text>' % (' big' if big else '', cx, y(fence + ccb) - 12, fmt(fence + ccb)))
        if big: s.append('<text class="tag" x="%.1f" y="%.1f" text-anchor="middle">BIGGEST WEEK</text>' % (cx, y(fence + ccb) - 40))
        if ev: s.append('<text class="tag dark" x="%.1f" y="%.1f" text-anchor="middle">45 DOCKETS<tspan x="%.1f" dy="15">IN 5 DAYS</tspan></text>' % (cx, y(fence + ccb) - 56, cx))
        s.append('<circle cx="%.1f" cy="%.1f" r="16" class="dkc%s"/><text class="dkn%s" x="%.1f" y="%.1f" text-anchor="middle">%d</text>'
                 % (cx, y(0) - 24, ' ev' if ev else '', ' ev' if ev else '', cx, y(0) - 19, dockets))
        s.append('<text class="wk" x="%.1f" y="%.1f" text-anchor="middle">%s</text><text class="wkd" x="%.1f" y="%.1f" text-anchor="middle">%s</text>'
                 % (cx, y(0) + 28, 'EVENT WEEK' if ev else 'WEEK %s' % code[2:], cx, y(0) + 50, dates))
    s.append('</svg>')
    return ''.join(s)


def running_strip():
    """The running total as one bar from 0 to 20.8 km, a segment for each week."""
    w, h, l, r = 1000, 104, 8, 8; y0, bh = 38, 28; span = w - l - r
    s = ['<svg class="strip" viewBox="0 0 %d %d" xmlns="http://www.w3.org/2000/svg">' % (w, h)]
    acc = 0
    for i, (code, dates, fence, ccb, dockets) in enumerate(WEEKS):
        m = fence + ccb; x = l + acc / TOTAL_M * span; wd = m / TOTAL_M * span; acc += m
        s.append('<rect x="%.1f" y="%d" width="%.1f" height="%d" class="seg s%d"/>' % (x, y0, wd - 2, bh, i % 2))
        s.append('<text class="segw" x="%.1f" y="%d" text-anchor="middle">%s</text>' % (x + wd / 2, y0 + bh + 24, 'EVENT' if code == 'EVENT' else 'W%s' % code[2:]))
        xe = l + acc / TOTAL_M * span
        if code != 'CW6':
            s.append('<line x1="%.1f" x2="%.1f" y1="%d" y2="%d" class="tick"/><text class="segk%s" x="%.1f" y="%d" text-anchor="%s">%s km</text>'
                     % (xe - 1, xe - 1, y0 - 6, y0, ' end' if code == 'EVENT' else '', xe - 1, y0 - 12, 'end' if code == 'EVENT' else 'middle', '%.1f' % (acc / 1000)))
    s.append('</svg>')
    return ''.join(s)


def chequer(cols, rows, sq, fill='#fff'):
    return ''.join('<rect x="%d" y="%d" width="%d" height="%d" fill="%s"/>' % (c * sq, r * sq, sq, sq, fill) for r in range(rows) for c in range(cols) if (r + c) % 2 == 0)


# ---- the pages -----------------------------------------------------------------------------------------------------
def build(aerial_path):
    jpg, jpg_bytes = map_jpeg(aerial_path)
    lap = lap_path(); laps = TOTAL_M / LAP_M
    lapsvg = ''.join('<svg class="lap" viewBox="0 0 50 100"><path d="%s" class="lapfull"/><text x="25" y="99" class="lapn">%d</text></svg>' % (lap, k + 1) for k in range(int(laps)))
    lapsvg += ('<svg class="lap" viewBox="0 0 50 100"><path d="%s" class="lapghost"/><path d="%s" pathLength="100" class="lappart" stroke-dasharray="%.2f 100"/>'
               '<text x="25" y="99" class="lapn part">+0.%d</text></svg>' % (lap, lap, (laps % 1) * 100, round((laps % 1) * 10)))
    iso = ''.join(isotype_row(*g) for g in GEAR)
    crew = ''.join('<li><span class="mono">%s</span><b>%s</b></li>' % (nm.split()[0][0] + nm.split()[-1][0], nm) for nm in CREW)
    css = (HERE / 'book.css').read_text()
    html = f'''<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>What you built — GC500 2026 fencing crew</title>
<meta name="author" content="Andrew Fisher"><style>{FONTS}{css}</style></head><body>

<section class="page cover">
 <div class="frame">
  <img class="mapimg" src="data:image/jpeg;base64,{jpg}" alt="The Surfers Paradise street circuit from the air, with the track and the fence runs drawn on it">
  {map_svg()}
  <div class="shade top"></div><div class="shade bottom"></div><div class="shade left"></div>
  <header class="ctitle">
   <p class="kick">Boost Mobile Gold Coast 500 · 2026 build</p>
   <h1>What you<br><em>built.</em></h1>
   <p class="who">Advanced Temporary Fencing<br>Wayne Woods and crew · Wed 9 Sep – Fri 23 Oct 2026</p>
  </header>
  <div class="hero"><b>20.8</b><span>km</span><p>of fence and crowd control around the circuit, the grandstands, the compounds and the streets beside them, panel by panel, by hand.</p></div>
  <div class="badge"><svg viewBox="0 0 120 120"><defs><pattern id="ck" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#fff"/><rect x="6" y="6" width="6" height="6" fill="#fff"/></pattern></defs>
   <circle cx="60" cy="60" r="58" fill="url(#ck)"/><circle cx="60" cy="60" r="50" fill="#FF6B1A"/></svg><div><b>100%</b><span>of the build</span></div></div>
  <footer class="cfoot">
   <div class="cstats"><div><b>13.3<small>km</small></b><span>temporary fence</span></div><div><b>7.3<small>km</small></b><span>crowd-control barrier</span></div>
    <div><b>4.4<small>km</small></b><span>scrim</span></div><div><b>233</b><span>signed papers</span></div></div>
   <div class="legend"><span><i class="lg fence"></i>Fence runs on the weekly installation plans</span><span><i class="lg track"></i>The track</span></div>
   <p class="credit">{INP['credits']['aerial_short']} · Fence runs: the weekly installation plans traced onto iEDM's master plan D001-26003-03 (selected runs, not every panel) · Track: iEDM key plan K220-K231-26003-02 · Placed by the GC500 record's registrations, not surveyed</p>
  </footer>
 </div>
</section>

<section class="page inner p2">
 <header class="ph"><p class="kick">The numbers</p><h2>Every piece, <em>carried by hand.</em></h2><div class="pnum">02</div></header>
 <div class="dist">
  <div><p class="dk">Temporary fence</p><b>13.3<small>km</small></b><p>13,270 m put in, <strong>653 m more</strong> than the programme asked for.</p></div>
  <div><p class="dk">Crowd-control barrier</p><b>7.3<small>km</small></b><p>7,257.5 m: 2.2 km on the event lines and 5.1 km of demarcation, plus <strong>270&nbsp;m of flat feet</strong>.</p></div>
  <div><p class="dk">Scrim</p><b>4.4<small>km</small></b><p>4,405 m of shade cloth: 3,977.5 m on braced fence and 427.5 m on fence already standing.</p></div>
 </div>
 <div class="laps">
  <div class="lapt"><p class="kick">End to end</p><h3>20.8 km would go round the street circuit <em>more than seven times.</em></h3>
   <p>One lap is 2.91 km on the record's registered key plan: {fmt(TOTAL_M)} m ÷ {fmt(round(LAP_M))} m = {laps:.2f} laps.</p></div>
  <div class="lapicons">{lapsvg}</div>
 </div>
 <div class="isohead"><h3>The gear, counted off the signed papers</h3><p><span class="key">{icon('feet')}</span>each symbol is <b>100</b></p></div>
 {iso}
 <div class="rest">
  <div><b>133</b><span>vehicle gates</span></div><div><b>22</b><span>pedestrian gates</span></div><div><b>41</b><span>hoarding panels</span></div>
  <div><b>117</b><span>flat-feet barriers</span></div><div><b>278</b><span>gate wheels</span></div>
 </div>
 <p class="note">Counted off the component boxes on the 166 signed hire agreements. Feet, bases and blocks are the same thing: 8,235 are written on the papers,
  and about 8,495 were used, counting the 11 papers that left the feet box blank. The dockets show two feet under every brace and one at every panel join.</p>
 <footer class="pf">From the signed papers on the GC500 Delivery Control record, read 24 Oct 2026 · No money in this document</footer>
</section>

<section class="page inner p3">
 <header class="ph"><p class="kick">Seven weeks</p><h2>The build, <em>week by week.</em></h2><div class="pnum">03</div></header>
 <div class="chartbox">
  <div class="ckey"><span><i class="sw f"></i>Temporary fence</span><span><i class="sw c"></i>Crowd control and flat feet</span><span><i class="sw d"></i>Hire agreements that week</span></div>
  {week_chart()}
 </div>
 <div class="runbox"><div class="runt"><p class="kick">The running total</p><p><b>10 km</b> by Fri 2 Oct<br><b>20.8 km</b> by Fri 23 Oct</p></div>{running_strip()}</div>
 <div class="records">
  <div class="rec hot"><p class="dk">Biggest week</p><b>5,645<small>m</small></b><p>12–16 Oct: 3,685 m of fence and 1,960 m of crowd control in five days.</p></div>
  <div class="rec"><p class="dk">Biggest day</p><b>1,430<small>m</small></b><p>Mon 28 Sep, led by the Gold Coast Hwy median strip (north).</p></div>
  <div class="rec"><p class="dk">Biggest single job</p><b>1,210<small>m</small></b><p>Docket 36603, Tue 13 Oct: eastern residents and demarcation, Cable St to Gate 8A.</p></div>
  <div class="rec"><p class="dk">Event week</p><b>45<small>dockets</small></b><p>In five days, 19–23 Oct. Thursday 22 Oct alone: 15.</p></div>
 </div>
 <div class="split">
  <div class="weather"><p class="kick">Built through it</p>
   <div class="wx"><div><b>113.6<small>mm</small></b><span>of rain</span></div><div><b>18</b><span>wet mornings</span></div>
    <div><b>15</b><span>days of gusts over 50 km/h, six in a row 14–19 Oct</span></div><div><b>63<small>km/h</small></b><span>the big gust, 7 Oct</span></div>
    <div><b>65<small>mm</small></b><span>in event week alone</span></div><div><b>12.9°<small>to</small>29.9°</b><span>coldest morning 27 Sep, hottest day 12 Oct</span></div></div>
   <p class="src">Bureau of Meteorology, Gold Coast Seaway, 7 Sep – 23 Oct 2026 (rain to 9 am).</p></div>
  <div class="twice"><p class="kick">The work you do twice</p>
   <ul><li><b>612.5 m</b><span>of fence moved when the plan moved</span></li><li><b>1,102.5 m</b><span>taken down and stacked away</span></li>
    <li><b>32.5 m</b><span>put back up after a stack-down</span></li><li><b>108.5 h</b><span>on service jobs, over 42 service notes</span></li></ul>
   <div class="papers"><b>233</b><div><strong>signed papers</strong><span>166 hire agreements · 42 service notes · 25 collection forms, over 32 working days. First in: Wed 9 Sep, Sea World Drive (36501).</span></div></div>
  </div>
 </div>
 <footer class="pf">Metres by the week the docket was written · From the signed papers on the GC500 Delivery Control record, read 24 Oct 2026</footer>
</section>

<section class="page inner p4">
 <header class="ph"><p class="kick">The crew</p><h2>The <em>line-up.</em></h2><div class="pnum">04</div></header>
 <div class="sup"><div class="supmono">WW</div><div><p class="dk">Supervisor</p><h3>Wayne Woods</h3><p>Advanced Temporary Fencing</p></div>
  <svg class="supflag" viewBox="0 0 96 64">{chequer(8, 6, 12)}</svg></div>
 <ul class="crew">{crew}</ul>
 <div class="letter">
  <p class="dear">Fellas,</p>
  <p>This is what you built. 20.8 kilometres of fence and crowd control around the Surfers Paradise street circuit: every panel, every foot and every clamp carried and stood up by hand, in the wind and the rain, and done right.</p>
  <p>You finished the build. One hundred per cent, ready for race weekend. And from the public, the residents living right beside the circuit and V8 Supercars management: nothing but positive feedback.</p>
  <p>That's how you represent a job. Thank you.</p>
  <div class="sign"><div class="line"></div><p><b>Andrew Fisher</b><span>Shutdown Manager · Coates · GC500 2026</span></p></div>
 </div>
 <div class="finish"><svg class="flag" viewBox="0 0 348 36" preserveAspectRatio="xMidYMid slice"><rect width="348" height="36" fill="#14181B"/>{chequer(29, 3, 12)}</svg>
  <div class="fin"><b>Build complete</b><span>100% · Fri 23 Oct 2026</span></div></div>
 <footer class="pf">Author: Andrew Fisher, Coates · Names and company as the crew's sign-on sheet reads · From the GC500 Delivery Control record, read 24 Oct 2026 · Map imagery © State of Queensland 2022, CC BY 4.0</footer>
</section>
</body></html>'''
    (HERE / 'crew_book.html').write_text(html, encoding='utf-8')
    print('crew_book.html %d bytes (cover map %d bytes); laps %.3f' % (len(html), jpg_bytes, laps))


if __name__ == '__main__':
    if len(sys.argv) != 2: sys.exit(__doc__)
    build(sys.argv[1])
