#!/usr/bin/env python3
"""Author: Andrew Fisher. GC500 servicing sheets: the laminated print pack the crews carry (A4 PDF).

Andrew, 18 Oct 2026: "Carried by crews" · "Just times" · "Waste tanks too" · "We can have multiple printed off for each.
I can even laminate them" · "Remember must show a percentage complete off that area" · "Lets have qr code for pinned
location. The asset numbers associated with that refernce. And a picture of location on the master map. With a circle
around the area. And even a master map with a print of the different areas" · "There is a compmetion qr code for their
refernece. They scan. It whe all done. And click tap. This only alows them to complete the refernce qr code" · "must
state. Reference number and how many in each one" · "each refernce needs to have 3 ticks Water fillled. Pumped out
Restock/Cleaned With correct termellogogy with wording ... Waste tanks is only a pump out ... Sunday night will need a
extra. locked and confirmed empty. No water will be needed".

What it prints, from ../tracker_data.json (the one data file the tracker uses) and maps/maps.json (render_maps.cjs):
  1. MASTER MAP (A4 landscape): the D001 master plan with the 13 areas outlined and numbered, legend with counts.
  2. Each area: a cover sheet (number, name, locations, units, jobs a night, an area map with every location circled
     and labelled, the list of locations) followed by its locations, two to a page.
  3. Each location (reference): the reference big, its area, how many of each, the asset numbers, its jobs for each
     night in the tracker's own words, a master-plan crop with a circle round it, a LOCATION QR (Google Maps pin) and a
     COMPLETION QR (opens the tracker for that reference only).
Every page: "Track only - nothing here ticks the job record or changes a charge" and the NO TWIN-STEER TRUCKS short form.

The completion links exist only once the live tracker card is made on the edit link, so they are read from a urls
file {REF: url}. The draft uses urls.json, placeholders pointing at a test token, and prints DRAFT on every page.

    python3 -I make_sheets.py                                  # the draft: urls.json placeholders -> GC500_servicing_sheets_DRAFT.pdf
    python3 -I make_sheets.py --placeholder                    # (re)write urls.json with the placeholders
    python3 -I make_sheets.py --links /private/tracker_links.json --out /private/GC500_servicing_sheets.pdf
    python3 -I make_sheets.py --urls /private/urls_live.json --out /private/GC500_servicing_sheets.pdf
--links takes {"token": "<card token>", "links": {"REF": "<sig>", ...}} as the edit link's answer gives them.
The live QR text must never go into the repository (see README): a live run refuses to write inside it.
"""
import argparse, collections, datetime, hashlib, json, math, re, subprocess, sys
from pathlib import Path

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader, simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

HERE = Path(__file__).resolve().parent
BASE = 'https://gc500-production.up.railway.app'
TEST_TOKEN = 'TEST-TOKEN-NOT-LIVE'
URL_RE = re.compile(r'^https://gc500-production\.up\.railway\.app/d/([A-Za-z0-9_-]{16,64})#r=([A-Za-z0-9]+)\.([A-Za-z0-9_-]{4,64})$')
TRACK_ONLY = 'Track only - nothing here ticks the job record or changes a charge'
TWIN_STEER = ('NO TWIN-STEER TRUCKS: not on the track, the Esplanade or inside Macintosh Island Park. Week 3, Week 2, '
              'Week 1, Race Week and demob. A twin-steer has nowhere to park or unload and may not be able to unload at all.')
AUTHOR = 'Author: Andrew Fisher'

INK = colors.HexColor('#1d1d1b'); MUTE = colors.HexColor('#5f6368'); LINE = colors.HexColor('#c9c4b8')
ORANGE = colors.HexColor('#E8641B'); BLUE = colors.HexColor('#1565c0'); PAPER = colors.HexColor('#f6f3ee'); RED = colors.HexColor('#b3261e')
GROUP_COL = {'pump': ORANGE, 'clean': BLUE}   # the Pump out code orange, the Clean & restock code blue
DONE = colors.HexColor('#16803a'); WHITE = colors.white
GREYED = colors.HexColor('#a3a3a3')   # the other areas on an area's own master map
AREA_COLOUR = {1: '#c62828', 2: '#1565c0', 3: '#2e7d32', 4: '#6a1b9a', 5: '#ad1457', 6: '#5d4037', 7: '#e65100',
               8: '#00838f', 9: '#827717', 10: '#283593', 11: '#00695c', 12: '#37474f', 13: '#757575', 0: '#757575', 14: '#f9a825'}
def acol(n): return colors.HexColor(AREA_COLOUR.get(n, '#757575'))

# ---------------------------------------------------------------- fonts (Liberation Sans / Carlito; Helvetica if missing)
F = {'sans': 'Helvetica', 'bold': 'Helvetica-Bold', 'narrow': 'Helvetica', 'narrowb': 'Helvetica-Bold'}
def setup_fonts():
    cands = {'sans': ['/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'],
             'bold': ['/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'],
             'narrow': ['/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf'],
             'narrowb': ['/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf']}
    for k, paths in cands.items():
        for p in paths:
            if Path(p).exists():
                try:
                    pdfmetrics.registerFont(TTFont('GC' + k, p)); F[k] = 'GC' + k; break
                except Exception:
                    pass
    if F['narrow'] == 'Helvetica': F['narrow'] = F['sans']
    if F['narrowb'] == 'Helvetica-Bold' or F['narrowb'] == 'Helvetica': F['narrowb'] = F['bold']

SUBST = {'≈': '~', '→': '->', '–': '-', '—': '-', '×': 'x', '·': '-', '©': '(c)'}
def safe(s, font):
    """Helvetica (the fallback) cannot show every character; a TTF can. Swap only what the font lacks."""
    if font.startswith('GC'):
        face = pdfmetrics.getFont(font).face
        cmap = getattr(face, 'charToGlyph', None)
        if cmap:
            return ''.join(ch if ord(ch) in cmap or ch in ' \n' else SUBST.get(ch, '?') for ch in s)
        return s
    return ''.join(ch if ord(ch) < 256 and ch not in '\u0080\u0081' else SUBST.get(ch, '?') for ch in s)

def sw(s, font, size): return pdfmetrics.stringWidth(safe(s, F[font]), F[font], size)
def txt(c, x, y, s, font='sans', size=9, col=INK, anchor='l'):
    f = F[font]; s = safe(s, f); c.setFont(f, size); c.setFillColor(col)
    if anchor == 'c': c.drawCentredString(x, y, s)
    elif anchor == 'r': c.drawRightString(x, y, s)
    else: c.drawString(x, y, s)
def wrap(s, font, size, width): return simpleSplit(safe(s, F[font]), F[font], size, width)
def fit(s, font, size, width, smallest=5):
    while size > smallest and sw(s, font, size) > width: size -= 0.25
    return size

def legend_cell(name, meta, width):
    """Fit full name/counts into three lines; keep the more legible of the two allocations."""
    choices = []
    for name_limit in (2, 1):
        fitted = []
        for text, font, size, limit in ((name, 'narrowb', 7.6, name_limit), (meta, 'narrow', 7, 3 - name_limit)):
            lines = wrap(text, font, size, width)
            while len(lines) > limit and size > 4:
                size = round(size - 0.2, 1); lines = wrap(text, font, size, width)
            fitted.append((lines, size))
        choices.append(fitted)
    return max(choices, key=lambda x: (min(x[0][1], x[1][1]), x[0][1] + x[1][1]))

# ---------------------------------------------------------------- data
def natural(ref):
    m = re.match(r'([A-Z]+)(\d+)', ref)
    return (m.group(1), int(m.group(2))) if m else (ref, 0)

class Data:
    def __init__(self, path=None, raw=None):
        raw = Path(path).read_bytes() if raw is None else raw; d = json.loads(raw)
        self.sha = hashlib.sha256(raw).hexdigest(); self.version = d.get('version', '')
        self.tasks, self.plans, self.areas = d['tasks'], d['plans'], d['areas']
        self.days = [x for x in d['days'] if not x.get('practice')]   # practice days (Andrew, 20 Oct 2026) are on the phone, never on paper
        # v2, Andrew 20 Oct 2026: a Pump out QR and a Clean & restock QR per reference; Refilled is ticked, never counted
        self.extras, self.groups = d.get('extras', []), d.get('groups', {})
        self.refs = [r for a in self.areas for r in a['refs']]
        self.area_of = {r['ref']: a for a in self.areas for r in a['refs']}
        for r in self.refs:
            for l in r['lines']:
                if l['kind'] not in self.plans: sys.exit(f"{r['ref']} line {l['id']}: kind {l['kind']} has no plan in tracker_data.json")
                for plan in {d['plan'] for d in self.days}:
                    for t in self.plans[l['kind']][plan]:
                        if t not in self.tasks: sys.exit(f"plan {l['kind']}.{plan}: task {t} has no wording")
        if len({r['ref'] for r in self.refs}) != len(self.refs): sys.exit('a reference appears twice in tracker_data.json')
    def plan_days(self):
        out = collections.OrderedDict()
        for d in self.days: out.setdefault(d['plan'], []).append(d)
        return out
    def jobs(self, refs, plan): return sum(l['qty'] * len([t for t in self.plans[l['kind']][plan] if t not in self.extras]) for r in refs for l in r['lines'])
    def ref_tasks(self, r):
        out = []
        for l in r['lines']:
            for d in self.days:
                for t in self.plans[l['kind']][d['plan']]:
                    if t not in out: out.append(t)
        return out
    def groups_for(self, r):
        """the job QR codes this reference gets: only the groups it has a job in (a waste tank alone: Pump out only)"""
        ts = self.ref_tasks(r)
        return [g for g, v in self.groups.items() if any(t in ts for t in v['tasks'])] or [None]
    def units(self, refs): return sum(l['qty'] for r in refs for l in r['lines'])
    @staticmethod
    def thing(label):
        """'2 × Toilet block 6 m' -> 'Toilet block 6 m' (the data's own words)"""
        return re.sub(r'^\s*\d+\s*×\s*', '', label).strip()
    def breakdown(self, refs):
        c = collections.OrderedDict()
        for r in refs:
            for l in r['lines']: c[self.thing(l['label'])] = c.get(self.thing(l['label']), 0) + l['qty']
        return c

def day_word(d, plan):
    return d['label'] + (' (if needed)' if d.get('ifNeeded') else '')
def days_phrase(ds):
    w = [day_word(d, d['plan']) for d in ds]
    return w[0] if len(w) == 1 else ', '.join(w[:-1]) + ' and ' + w[-1]
def jobs_phrase(data, refs):
    """'34 a night on Thu 22 (if needed), Fri 23 and Sat 24; 36 on Sun 25 night'"""
    out = []
    for plan, ds in data.plan_days().items():
        n = data.jobs(refs, plan)
        out.append(f'{n} a night on {days_phrase(ds)}' if len(ds) > 1 else f'{n} on {days_phrase(ds)} night')
    return '; '.join(out)

# ---------------------------------------------------------------- urls
def load_urls(args, data):
    if args.links:
        j = json.loads(Path(args.links).read_text())
        token, links = j['token'], j['links']
        urls = {ref: f'{BASE}/d/{token}#r={ref}.{sig}' for ref, sig in links.items()}
    else:
        urls = json.loads(Path(args.urls).read_text())
    refs = [r['ref'] for r in data.refs]
    missing = [r for r in refs if r not in urls]; extra = [r for r in urls if r not in refs and not r.startswith('_')]
    if missing: sys.exit('completion links missing for: ' + ' '.join(missing))
    if extra: sys.exit('completion links for references the tracker does not have: ' + ' '.join(extra))
    tokens = set()
    for ref in refs:
        m = URL_RE.match(urls[ref])
        if not m: sys.exit(f'{ref}: not a tracker card link (/d/<token>#r=REF.sig on the service); never /e/ or /v/')
        if m.group(2) != ref: sys.exit(f'{ref}: its link names {m.group(2)}')
        tokens.add(m.group(1))
    if len(tokens) != 1: sys.exit('the links name more than one card')
    token = tokens.pop(); draft = token == TEST_TOKEN
    if not draft:
        bad = [r for r in refs if len(URL_RE.match(urls[r]).group(3)) != 16]
        if bad: sys.exit('a live completion code is 16 characters after the dot; wrong for: ' + ' '.join(bad))
    return {r: urls[r] for r in refs}, draft

def pack_readiness(args, data, urls, placeholder):
    """Signed links alone prove neither a real tracker nor completed pre-flight checks."""
    mode = args.mode or ('draft' if placeholder else 'test')
    name, phone = args.contact_name.strip(), args.contact_phone.strip()
    if bool(name) != bool(phone): sys.exit('provide both servicing contact name and phone')
    if len(name) > 80 or (phone and (not re.fullmatch(r'[+0-9 ()-]{6,32}', phone) or len(re.sub(r'\D', '', phone)) < 8)):
        sys.exit('servicing contact is too long or the phone is not a phone number')
    contact = {'name': name, 'phone': phone} if name else None
    if placeholder and mode != 'draft': sys.exit('placeholder codes cannot make a TEST or real tracker pack')
    if not placeholder and mode == 'draft': sys.exit('signed tracker codes must use TEST or real mode')
    if mode == 'real':
        if not contact: sys.exit('real sheets need the confirmed servicing contact name and phone')
        if not args.readiness: sys.exit('real sheets need a private readiness receipt; signed codes alone are not a live read-back')
        root = repo_root(HERE)
        if root and Path(args.readiness).resolve().is_relative_to(root):
            sys.exit('the readiness receipt holds the tracker token and must stay outside the repository')
        receipt = json.loads(Path(args.readiness).read_text())
        token = URL_RE.match(next(iter(urls.values()))).group(1)
        required = ('test_checks_passed', 'real_tracker_read_back', 'iphone_paper_scan', 'android_paper_scan')
        if receipt.get('token') != token or receipt.get('data_sha256') != data.sha or any(receipt.get(k) is not True for k in required):
            sys.exit('real sheets need matching token/data and completed TEST, read-back and paper scan checks')
        if receipt.get('contact') != contact: sys.exit('servicing contact must match the private readiness receipt')
    return mode, contact

def load_pack_data(args):
    """The downloaded link bundle carries the exact published days and contact, including rehearsals."""
    bundle = json.loads(Path(args.links).read_text()) if args.links else {}
    raw = bundle.get('data_json')
    if raw is not None:
        if not isinstance(raw, str): sys.exit('the QR bundle has unreadable published data')
        if args.data and json.loads(Path(args.data).read_text()) != json.loads(raw):
            sys.exit('the supplied print data does not match the published QR bundle')
        data = Data(raw=raw.encode('utf-8'))
        if bundle.get('mode') == 'test' and args.mode == 'real': sys.exit('a TEST tracker bundle cannot make real sheets')
        contact = bundle.get('contact') or {}
        if args.contact_name or args.contact_phone:
            if {'name':args.contact_name.strip(),'phone':args.contact_phone.strip()} != contact:
                sys.exit('the print contact does not match the published QR bundle')
        else:
            args.contact_name, args.contact_phone = contact.get('name',''), contact.get('phone','')
        return data
    return Data(args.data or HERE.parent / 'tracker_data.json')

def write_placeholder(path, data):
    out = {'_about': 'Author: Andrew Fisher. DRAFT placeholders: the completion QR links for the printed servicing sheets. '
                     'The real links exist only once the live tracker card is made on the edit link; they are kept outside '
                     'the repository (README). TEST-TOKEN-NOT-LIVE opens nothing.'}
    out.update({r['ref']: f"{BASE}/d/{TEST_TOKEN}#r={r['ref']}.0000" for r in data.refs})
    Path(path).write_text(json.dumps(out, indent=1, ensure_ascii=False) + '\n')

def maps_url(pin): return f'https://www.google.com/maps/search/?api=1&query={pin[0]},{pin[1]}'

def repo_root(p):
    for q in [Path(p).resolve()] + list(Path(p).resolve().parents):
        if (q / '.git').exists(): return q
    return None

# ---------------------------------------------------------------- drawing helpers
def qr(c, value, x, y, size):
    w = QrCodeWidget(value, barLevel='M', barBorder=4)
    b = w.getBounds(); bw, bh = b[2] - b[0], b[3] - b[1]
    d = Drawing(size, size, transform=[size / bw, 0, 0, size / bh, 0, 0]); d.add(w)
    c.setFillColor(WHITE); c.rect(x, y, size, size, stroke=0, fill=1)
    renderPDF.draw(d, c, x, y)

def ring(c, x, y, r, col=ORANGE, w=2.2):
    """a circle that shows on a busy plan: white halo, dark edge, colour"""
    c.saveState(); c.setFillAlpha(0); c.setStrokeAlpha(1)
    c.setStrokeColor(WHITE); c.setLineWidth(w + 3.2); c.circle(x, y, r, stroke=1, fill=0)
    c.setStrokeColor(INK); c.setLineWidth(w + 1.2); c.circle(x, y, r, stroke=1, fill=0)
    c.setStrokeColor(col); c.setLineWidth(w); c.circle(x, y, r, stroke=1, fill=0)
    c.restoreState()

def tag(c, x, y, s, font='bold', size=8, col=INK, bg=WHITE, edge=None, pad=1.1 * mm, anchor='l'):
    w = sw(s, font, size) + 2 * pad; h = size * 1.25 + 0.6 * mm
    x0 = x if anchor == 'l' else x - w / 2 if anchor == 'c' else x - w
    c.setFillColor(bg); c.setStrokeColor(edge or bg); c.setLineWidth(0.6)
    c.roundRect(x0, y - h / 2, w, h, 1.2 * mm, stroke=1 if edge else 0, fill=1)
    txt(c, x0 + pad, y - size * 0.36, s, font, size, col)
    return (x0, y - h / 2, x0 + w, y + h / 2)

def north_arrow(c, x, y, north, size=7 * mm):
    """north_on_sheet is in sheet units (y down); the page's y is up"""
    nx, ny = north['x'], -north['y']; l = math.hypot(nx, ny) or 1; nx, ny = nx / l, ny / l
    px, py = -ny, nx
    tip = (x + nx * size / 2, y + ny * size / 2); tail = (x - nx * size / 2, y - ny * size / 2)
    c.setFillColor(WHITE); c.setStrokeColor(INK); c.setLineWidth(0.5); c.circle(x, y, size * 0.72, stroke=1, fill=1)
    p = c.beginPath(); p.moveTo(*tip); p.lineTo(tail[0] + px * size * 0.28, tail[1] + py * size * 0.28)
    p.lineTo(x - nx * size * 0.18, y - ny * size * 0.18); p.lineTo(tail[0] - px * size * 0.28, tail[1] - py * size * 0.28); p.close()
    c.setFillColor(INK); c.drawPath(p, stroke=0, fill=1)
    lx, ly = x + nx * size * 0.98, y + ny * size * 0.98
    c.setFillColor(WHITE); c.circle(lx, ly, 2 * mm, stroke=0, fill=1)
    txt(c, lx, ly - 1.1 * mm, 'N', 'bold', 7.5, INK, 'c')

def scale_bar(c, x, y, mm_per_m, max_w=30 * mm):
    """bottom-right anchored at (x, y): the right end of the bar"""
    best = None
    for m in (5, 10, 20, 25, 50, 100, 200, 250, 500):
        if m * mm_per_m <= max_w: best = m
    if not best: return
    w = best * mm_per_m; x0 = x - w
    c.setFillColor(WHITE); c.roundRect(x0 - 2 * mm, y - 1.6 * mm, w + 4 * mm, 6.2 * mm, 1 * mm, stroke=0, fill=1)
    c.setFillColor(INK); c.rect(x0, y, w / 2, 1.2 * mm, stroke=0, fill=1)
    c.setStrokeColor(INK); c.setLineWidth(0.5); c.rect(x0, y, w, 1.2 * mm, stroke=1, fill=0)
    txt(c, x0 + w / 2, y + 1.9 * mm, f'about {best} m', 'sans', 6, INK, 'c')

def credit(c, x, y, text):
    w = sw(text, 'sans', 6) + 2.4 * mm
    c.setFillColor(WHITE); c.roundRect(x, y, w, 4 * mm, 0.8 * mm, stroke=0, fill=1)
    txt(c, x + 1.2 * mm, y + 1.2 * mm, text, 'sans', 6, INK)

def hull(points):
    pts = sorted(set(points))
    if len(pts) <= 2: return pts
    def cross(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, up = [], []
    for p in pts:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(up) >= 2 and cross(up[-2], up[-1], p) <= 0: up.pop()
        up.append(p)
    return lo[:-1] + up[:-1]

def boxes_hit(a, b, gap=0.6 * mm):
    return not (a[2] + gap < b[0] or b[2] + gap < a[0] or a[3] + gap < b[1] or b[3] + gap < a[1])

class MapBox:
    """one master-plan picture placed on the page; sheet units -> page points"""
    def __init__(self, maps, key, x, y, w, h):
        self.im = maps['images'][key]; self.maps = maps
        self.x, self.y, self.w, self.h = x, y, w, h
        x0, y0, x1, y1 = self.im['rect']; self.rect = (x0, y0, x1, y1)
        ra, ba = (x1 - x0) / (y1 - y0), w / h            # keep the picture's shape inside the box
        if abs(ra - ba) > 0.01:
            if ra > ba: nh = w / ra; self.y += (h - nh) / 2; self.h = nh
            else: nw = h * ra; self.x += (w - nw) / 2; self.w = nw
        self.mm_per_m = (self.w / mm) / ((x1 - x0) * maps['m_per_unit']) * mm
    def at(self, sx, sy):
        x0, y0, x1, y1 = self.rect
        return self.x + (sx - x0) / (x1 - x0) * self.w, self.y + self.h - (sy - y0) / (y1 - y0) * self.h
    def inside(self, px, py, pad=0): return self.x + pad <= px <= self.x + self.w - pad and self.y + pad <= py <= self.y + self.h - pad
    def draw(self, c, folder, frame=True):
        c.saveState(); p = c.beginPath(); p.roundRect(self.x, self.y, self.w, self.h, 2 * mm); c.clipPath(p, stroke=0, fill=0)
        c.drawImage(ImageReader(str(folder / self.im['file'])), self.x, self.y, self.w, self.h)
        c.restoreState()
        if frame: c.setStrokeColor(INK); c.setLineWidth(0.8); c.roundRect(self.x, self.y, self.w, self.h, 2 * mm, stroke=1, fill=0)
    def furniture(self, c, scale=True, north=True, small=False):
        credit(c, self.x + 1.5 * mm, self.y + 1.5 * mm, self.maps['credit'])
        if scale: scale_bar(c, self.x + self.w - 3 * mm, self.y + (2.6 if self.w > 100 * mm else 8.0) * mm, self.mm_per_m, max_w=min(30 * mm, self.w / 4))
        if north: north_arrow(c, self.x + self.w - 7 * mm, self.y + self.h - 7 * mm, self.maps['north_on_sheet'], size=(5 if small else 7) * mm)

def no_pin_panel(c, x, y, w, h, big='No pin', small='No pin on the record and no place on the master plan - ask on site.'):
    c.setFillColor(PAPER); c.setStrokeColor(LINE); c.setLineWidth(0.8); c.roundRect(x, y, w, h, 2 * mm, stroke=1, fill=1)
    txt(c, x + w / 2, y + h / 2 + 2 * mm, big, 'bold', 22 if h > 30 * mm else 14, MUTE, 'c')
    lines = wrap(small, 'sans', 9, w - 10 * mm)
    for i, s in enumerate(lines): txt(c, x + w / 2, y + h / 2 - 5 * mm - i * 4 * mm, s, 'sans', 9, MUTE, 'c')

SHORT = {'FWF': 'FWF', 'FWF Trailer': 'FWF trailer', 'Trailer Toilet': 'trailer toilet', 'Accessible Toilet': 'accessible', 'Toilet Block 6m': 'block',
         'Waste tank': 'tank', '16Pan Block': '16-pan'}
def what_here(refs):
    """'4 FWF', '1 block · 1 tank', '2 16-pan · 1 accessible' - what stands at a spot, in plain words (Andrew, 20 Oct
    2026: "all toilets are on map with the correct icons. Clearly marked. Easy to understand")"""
    n = collections.OrderedDict()
    for r in refs:
        for l in r['lines']:
            k = SHORT.get(l['type'], l['type']); n[k] = n.get(k, 0) + l['qty']
    return ' · '.join(f'{q} {k}' for k, q in n.items())
SYMBOL_LABELS = collections.OrderedDict((('toilet', 'Toilet'), ('block', 'Toilet block'),
    ('pee', 'Pee panel'), ('pan16', '16-pan block'), ('accessible', 'Accessible'), ('tank', 'Waste tank')))

def symbol_kind(line):
    """Use the equipment type, not its servicing tasks or quantities, to choose its symbol."""
    name = re.sub(r'[^a-z0-9]', '', str(line.get('type', '')).lower())
    if name in ('accessibletoilet', 'disabledtoilet', 'dda'): return 'accessible'
    if name in ('16panblock', '16pantoiletblock'): return 'pan16'
    if name in ('peepanel', 'peepanels', 'urinal', 'urinalpanel'): return 'pee'
    if name in ('wastetank', 'holdingtank'): return 'tank'
    if name in ('toiletblock', 'toiletblock6m'): return 'block'
    if name in ('fwf', 'fwftrailer', 'trailertoilet', 'toilet', 'portabletoilet'): return 'toilet'
    # Kind is a fallback only where no equipment type was supplied. An unknown named
    # type stays unknown; its service plan must not relabel it as a toilet.
    if not name:
        return {'fwf':'toilet', 'access':'accessible', 'pan16':'pan16', 'block':'block',
                'sewer':'block', 'tank':'tank', 'pee':'pee'}.get(line.get('kind'), 'unknown')
    return 'unknown'

def symbol_kinds(lines):
    return list(dict.fromkeys(symbol_kind(line) for line in lines))

def equipment_icon(c, x, y, r, kind, fill=ORANGE):
    """Print-safe vector silhouettes: recognisable without relying on colour or emoji fonts."""
    c.saveState(); c.translate(x, y); c.scale(r, r)
    c.setFillColor(WHITE); c.circle(0, 0, 1 + 0.5 * mm / r, stroke=0, fill=1)
    c.setFillColor(fill); c.setStrokeColor(INK); c.setLineWidth(0.5 / r); c.circle(0, 0, 1, stroke=1, fill=1)
    c.setFillColor(WHITE); c.setStrokeColor(WHITE); c.setLineWidth(0.13); c.setLineCap(1); c.setLineJoin(1)
    if kind == 'toilet':
        c.roundRect(-.42, .12, .84, .34, .07, stroke=0, fill=1)
        p = c.beginPath(); p.moveTo(-.49, .02); p.lineTo(.49, .02)
        p.curveTo(.49, -.37, .21, -.47, .12, -.49); p.lineTo(-.12, -.49)
        p.curveTo(-.21, -.47, -.49, -.37, -.49, .02); p.close(); c.drawPath(p, stroke=0, fill=1)
        c.rect(-.19, -.65, .38, .19, stroke=0, fill=1)
    elif kind in ('block', 'pan16'):
        c.rect(-.65, -.49, 1.3, .92, stroke=0, fill=1)
        c.rect(-.72, .43, 1.44, .15, stroke=0, fill=1)
        c.setFillColor(fill)
        for dx in (-.49, -.13, .23): c.rect(dx, -.49, .26, .57 if kind == 'block' else .28, stroke=0, fill=1)
        if kind == 'pan16':
            c.setFont('Helvetica-Bold', .87); c.drawCentredString(0, -.04, '16')
    elif kind == 'pee':
        # Upright privacy panel with two wall-mounted urinal bowls.
        c.line(-.63, -.55, -.63, .52); c.line(.63, -.55, .63, .52); c.line(0, -.55, 0, .52)
        for dx in (-.32, .32):
            c.roundRect(dx - .19, -.05, .38, .47, .06, stroke=0, fill=1)
            p = c.beginPath(); p.moveTo(dx - .22, .05); p.lineTo(dx + .22, .05)
            p.curveTo(dx + .22, -.4, dx - .22, -.4, dx - .22, .05); p.close(); c.drawPath(p, stroke=0, fill=1)
    elif kind == 'accessible':
        c.circle(.03, .56, .16, stroke=0, fill=1)
        c.arc(-.61, -.64, .22, .18, startAng=60, extent=300)
        p = c.beginPath(); p.moveTo(-.03, .31); p.lineTo(.03, -.13); p.lineTo(.4, -.13)
        p.lineTo(.61, -.53); p.lineTo(.76, -.45); c.drawPath(p, stroke=1, fill=0)
        c.line(0, .13, .36, .13)
    elif kind == 'tank':
        c.roundRect(-.65, -.4, 1.3, .76, .2, stroke=0, fill=1)
        c.rect(-.16, .36, .32, .19, stroke=0, fill=1)
        c.rect(-.47, -.57, .19, .22, stroke=0, fill=1); c.rect(.28, -.57, .19, .22, stroke=0, fill=1)
        c.setStrokeColor(fill); c.setLineWidth(.08)
        for dx in (-.29, .29): c.line(dx, -.28, dx, .24)
    else:
        c.setFont('Helvetica-Bold', 1.3); c.drawCentredString(0, -.46, '?')
    c.restoreState()

def equipment_marker(c, x, y, r, lines):
    """One capsule centred on the recorded spot; one badge per distinct type, not per unit."""
    kinds = symbol_kinds(lines) or ['unknown']
    step = 2 * r + .5 * mm; half = (len(kinds) - 1) * step / 2
    bounds = (x - half - r - .5 * mm, y - r - .5 * mm, x + half + r + .5 * mm, y + r + .5 * mm)
    if len(kinds) > 1:
        c.saveState(); c.setFillColor(WHITE); c.setStrokeColor(INK); c.setLineWidth(.6)
        c.roundRect(bounds[0], bounds[1], bounds[2] - bounds[0], bounds[3] - bounds[1], r, stroke=1, fill=1)
        c.restoreState()
    for i, kind in enumerate(kinds): equipment_icon(c, x - half + i * step, y, r, kind)
    return bounds

def icon_legend(c, x, y, size=7.2):
    for kind, label in SYMBOL_LABELS.items():
        equipment_icon(c, x + 2.2 * mm, y + 1.2 * mm, 2 * mm, kind)
        txt(c, x + 5 * mm, y + .2 * mm, label, 'bold', size, INK)
        x += 8 * mm + sw(label, 'bold', size)

def place_labels(c, mb, groups, rr, font_size=8, footprints=None):
    """groups: [(label, px, py)] circles of radius rr; labels placed so they do not overlap each other or the circles"""
    taken = list(footprints) if footprints else [(px - rr, py - rr, px + rr, py + rr) for _, px, py in groups]
    dirs = [(1, 0.35), (-1, 0.35), (1, -0.35), (-1, -0.35), (0, 1), (0, -1), (0.75, 0.9), (-0.75, 0.9), (0.75, -0.9), (-0.75, -0.9)]
    for index, (label, px, py) in enumerate(groups):
        radius = max(rr, max(abs(footprints[index][0] - px), abs(footprints[index][2] - px),
                             abs(footprints[index][1] - py), abs(footprints[index][3] - py))) if footprints else rr
        size = fit(label, 'bold', font_size, mb.w - 4.2 * mm, 5.5)
        w = sw(label, 'bold', size) + 2.2 * mm; h = size * 1.25 + 0.6 * mm; done = None
        for k in (1.0, 1.8, 2.8, 4.0):
            for dx, dy in dirs:
                d = radius + 1.6 * mm * k
                cx = px + dx * d + (w / 2 if dx > 0.2 else -w / 2 if dx < -0.2 else 0); cy = py + dy * d + (h / 2 * (1 if dy > 0 else -1) if abs(dx) <= 0.2 else 0)
                # Edge pins still need a readable label inside the map. Clamp each
                # candidate, then apply the same collision checks to its real box.
                cx = min(max(cx, mb.x + mm + w / 2), mb.x + mb.w - mm - w / 2)
                cy = min(max(cy, mb.y + 6 * mm + h / 2), mb.y + mb.h - mm - h / 2)
                bx = (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)
                if bx[0] < mb.x + 1 * mm or bx[2] > mb.x + mb.w - 1 * mm or bx[1] < mb.y + 6 * mm or bx[3] > mb.y + mb.h - 1 * mm: continue
                if boxes_hit(bx, (mb.x + mb.w - 14 * mm, mb.y + mb.h - 14 * mm, mb.x + mb.w, mb.y + mb.h)): continue   # the north arrow
                if any(boxes_hit(bx, t) for t in taken): continue
                done = (cx, cy, bx); break
            if done: break
        if not done:
            cx = min(max(px, mb.x + mm + w / 2), mb.x + mb.w - mm - w / 2)
            cy = min(max(py + radius + h, mb.y + 6 * mm + h / 2), mb.y + mb.h - mm - h / 2)
            done = (cx, cy, (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2))
        cx, cy, bx = done; taken.append(bx)
        # leader from the circle edge to the label
        ang = math.atan2(cy - py, cx - px)
        edge = radius
        if footprints:
            x0, y0, x1, y1 = footprints[index]
            vx, vy = math.cos(ang), math.sin(ang)
            edge = min((x1 - px if vx > 0 else px - x0) / abs(vx) if abs(vx) > 1e-8 else math.inf,
                       (y1 - py if vy > 0 else py - y0) / abs(vy) if abs(vy) > 1e-8 else math.inf)
        ex, ey = px + edge * math.cos(ang), py + edge * math.sin(ang)
        nx, ny = min(max(ex, bx[0]), bx[2]), min(max(ey, bx[1]), bx[3])
        if math.hypot(nx - ex, ny - ey) > 0.8 * mm:
            c.setStrokeColor(WHITE); c.setLineWidth(2.2); c.line(ex, ey, nx, ny)
            c.setStrokeColor(INK); c.setLineWidth(0.7); c.line(ex, ey, nx, ny)
        tag(c, cx, cy, label, 'bold', size, INK, WHITE, INK, anchor='c')

# ---------------------------------------------------------------- reference pages
HALF_H = (A4[1] - 7 * mm - 20 * mm - 6 * mm) / 2      # one reference block: half a portrait page
def ref_too_tall(data, r, map_w_mm=100):
    """True when a reference's left column (how many, asset numbers, jobs) cannot fit half a page even at the tightest
    spacing - it then gets a page of its own (WC05: block + tank + FWF)"""
    import io
    p = Pack.__new__(Pack); p.d = data; p._scratch = None
    lw = A4[0] - 18 * mm - map_w_mm * mm - 8.5 * mm
    return -p.left_col(canvas.Canvas(io.BytesIO(), pagesize=A4), r, 0, lw, 0, 0.7) > HALF_H - 26 * mm

def pair_refs(refs, tall):
    """two references to a page, in order; one that is too tall for half a page gets a whole page"""
    out, held = [], []
    for r in refs:
        if tall(r):
            if held: out.append(('refs', held)); held = []
            out.append(('ref_full', [r]))
        else:
            held.append(r)
            if len(held) == 2: out.append(('refs', held)); held = []
    if held: out.append(('refs', held))
    return out

# ---------------------------------------------------------------- the pack
class Pack:
    def __init__(self, data, maps, maps_dir, urls, draft, printed, mode="draft", contact=None):
        self.d, self.maps, self.maps_dir, self.urls, self.draft, self.printed = data, maps, maps_dir, urls, draft, printed
        self.mode = mode; self.contact = contact or {}
        self.pages = []; self.ref_page = {}
        self.pos = maps['positions']
        missing = [r['ref'] for r in data.refs if r['ref'] not in self.pos]
        if missing: sys.exit('maps/maps.json has no entry for ' + ' '.join(missing) + ' - run render_maps.cjs again')
        for r in data.refs:
            if self.pos[r['ref']] and r['ref'] not in maps['ref_image']: sys.exit(f"maps.json: no picture for {r['ref']}")
            if self.pos[r['ref']] and maps['ref_image'][r['ref']] not in maps['images']: sys.exit(f"maps.json: picture for {r['ref']} did not render")
        for a in data.areas:   # the pictures were cut for these areas; a reference moved since means render again
            A = maps['areas'].get(str(a['n']))
            drawn = set(A['unplaced']) | set(A['main']['refs'] if A['main'] else []) | {x for f in A['far'] for x in f['refs']} if A else set()
            if drawn != {r['ref'] for r in a['refs']}: sys.exit(f"maps.json was cut for a different area {a['n']} - run render_maps.cjs again")
            for k in ([A['main']['key']] if A['main'] else []) + [f['key'] for f in A['far']]:
                if k not in maps['images']: sys.exit(f'maps.json: picture {k} did not render')
        self.plan()

    def plan(self):
        self.pages.append(('master', None, None))
        for a in self.d.areas:
            self.pages.append(('cover', a, None))
            if a['n']: self.pages.append(('master', a, None))   # Andrew, 19 Oct 2026: "Each 13 sheets should have a master map"
            mw = self.maps['layout']['ref_map']['w']
            for kind, chunk in pair_refs(a['refs'], lambda r: ref_too_tall(self.d, r, mw)):
                self.pages.append((kind, a, chunk))
                for r in chunk: self.ref_page[r['ref']] = len(self.pages)

    # ------------------------------------------------------------ page furniture
    def frame(self, c, size, n):
        W, H = size
        if self.draft:
            c.setFillColor(RED); c.rect(0, H - 6.5 * mm, W, 6.5 * mm, stroke=0, fill=1)
            banner = ('DRAFT - TEST QR CODES (TEST-TOKEN-NOT-LIVE) - NOT LIVE - DO NOT LAMINATE OR HAND OUT' if self.mode == 'draft' else
                      'SCAN CHECK - SIGNED TRACKER CODES - DO NOT SAVE TEST COMPLETIONS - DO NOT LAMINATE OR HAND OUT')
            txt(c, W / 2, H - 4.6 * mm, banner, 'bold', fit(banner, 'bold', 8.5, W - 18 * mm), WHITE, 'c')
        # footer
        x0, x1 = 9 * mm, W - 9 * mm
        c.setStrokeColor(INK); c.setLineWidth(0.6); c.line(x0, 18.1 * mm, x1, 18.1 * mm)
        contact = ('Servicing contact: ' + self.contact['name'] + ' · ' + self.contact['phone']) if self.contact else 'Servicing contact not confirmed: check with the site supervisor before the run.'
        txt(c, x0, 15.3 * mm, contact, 'bold', fit(contact, 'bold', 7.5, x1 - x0), INK)
        txt(c, x0, 11.9 * mm, TRACK_ONLY, 'bold', 8, INK)
        txt(c, x1, 11.9 * mm, f'Page {n} of {len(self.pages)}', 'bold', 8, INK, 'r')
        size_t = 6.6; lines = wrap(TWIN_STEER, 'bold', size_t, x1 - x0)
        if len(lines) > 2: size_t = 6.0; lines = wrap(TWIN_STEER, 'bold', size_t, x1 - x0)
        for i, s in enumerate(lines[:2]): txt(c, x0, (8.4 - i * 2.9) * mm, s, 'bold', size_t, RED)
        meta = (f"GC500 servicing sheets · {AUTHOR} · printed {self.printed} AEST · data: {self.d.version} ({self.d.sha[:8]}) · "
                f"maps from the live page {self.maps['page']['version'] or ''} ({self.maps['page']['sha256'][:8]}), {self.maps['rendered_at'][:10]}")
        txt(c, x0, 2.6 * mm, meta, 'sans', fit(meta, 'sans', 5.6, x1 - x0, 4), MUTE)
        if self.draft:   # see-through, so the page underneath (and its QR codes) still reads
            c.saveState(); c.translate(W / 2, H / 2); c.rotate(math.degrees(math.atan2(H, W)))
            mark = 'DRAFT' if self.mode == 'draft' else 'SCAN CHECK'
            txt(c, 0, -20 * mm, mark, 'bold', fit(mark, 'bold', 150, math.hypot(W, H) * 0.72), colors.Color(0.70, 0.15, 0.12, alpha=0.09), 'c')
            txt(c, 0, -38 * mm, 'TEST QR CODES - NOT LIVE' if self.mode == 'draft' else 'SIGNED TRACKER CODES', 'bold', 26, colors.Color(0.70, 0.15, 0.12, alpha=0.14), 'c'); c.restoreState()

    # ------------------------------------------------------------ master map
    def master(self, c, hi=None):
        """the master map; with hi (an area) it is that area's own copy: the area in colour, the others greyed"""
        W, H = landscape(A4); d = self.d; top = H - 9 * mm
        located = [a for a in d.areas if self.maps['areas'].get(str(a['n']), {}).get('main')]
        n_areas = len([a for a in d.areas if a['n']])
        if hi is None:
            title = f'GC500 SERVICING · MASTER MAP · {n_areas} AREAS'; refs = d.refs
            sub = f'Each service day runs 08:00 to 08:00 (Gold Coast time). Jobs: {jobs_phrase(d, refs)}. A job is one task on one unit; the phone shows % complete for each area and for everything.'
        else:
            title = f'AREA {hi["n"]} · {hi["name"]} · WHERE IT IS ON THE SITE'; refs = hi['refs']
            sub = (f'The master map of all {n_areas} areas with area {hi["n"]} in colour. Its own map, with every location circled, is on the area cover sheet.' if hi in located else
                   f'The master map of all {n_areas} areas. Area {hi["n"]} is not on the master plan, so it is not marked - ask on site. Its locations are listed on the area cover sheet.')
        txt(c, 9 * mm, top - 6 * mm, title, 'narrowb', fit(title, 'narrowb', 22, W - 90 * mm), acol(hi['n']) if hi else INK)
        units = d.units(refs)
        right = (f'Area {hi["n"]}: ' if hi else '') + f'{len(refs)} location{"s" if len(refs) != 1 else ""} · {units} unit{"s" if units != 1 else ""}'
        txt(c, W - 9 * mm, top - 6 * mm, right, 'narrowb', 16, INK, 'r')
        pd = d.plan_days()
        txt(c, 9 * mm, top - 11.5 * mm, sub, 'sans', fit(sub, 'sans', 8.6, W - 18 * mm), RED if hi and hi not in located else MUTE)
        mm_box = self.maps.get('layout', {}).get('master_map') or {'w': 279, 'h': 150}
        bh = mm_box['h'] - 5   # 5 mm off the map (it keeps its shape) so the legend's second row clears the footer
        mb = MapBox(self.maps, 'master', 9 * mm, top - 14 * mm - bh * mm, mm_box['w'] * mm, bh * mm)
        mb.draw(c, self.maps_dir)
        badges = []
        R = 4.2 * mm
        for a in sorted(located, key=lambda x: x is hi):   # the highlighted area last, so it sits on top
            A = self.maps['areas'][str(a['n'])]; lit = hi is None or a is hi
            col = acol(a['n']) if lit else GREYED
            line = ((4.2, WHITE, 0.9), (1.9, col, 1)) if hi is None else ((6.0, WHITE, 0.95), (3.2, col, 1)) if lit else ((2.4, WHITE, 0.6), (0.9, col, 0.9))
            for cl in [A['main']] + A['far']:
                pts = [mb.at(self.pos[r]['x'], self.pos[r]['y']) for r in cl['refs']]
                ring_pts = [(px + R * math.cos(t * math.pi / 12), py + R * math.sin(t * math.pi / 12)) for px, py in pts for t in range(24)]
                hp = hull(ring_pts)
                if len(hp) >= 3:
                    for wdt, colr, alpha in line:
                        c.saveState(); c.setStrokeColor(colr); c.setStrokeAlpha(alpha); c.setLineWidth(wdt); c.setLineJoin(1)
                        p = c.beginPath(); p.moveTo(*hp[0]); [p.lineTo(*q) for q in hp[1:]]; p.close(); c.drawPath(p, stroke=1, fill=0); c.restoreState()
                    c.saveState(); c.setFillColor(col); c.setFillAlpha(0.10 if hi is None else 0.24 if lit else 0.04); p = c.beginPath(); p.moveTo(*hp[0]); [p.lineTo(*q) for q in hp[1:]]; p.close(); c.drawPath(p, stroke=0, fill=1); c.restoreState()
                for px, py in pts:
                    c.setFillColor(col); c.setStrokeColor(WHITE); c.setLineWidth(0.6); c.circle(px, py, (1.1 if lit else 0.8) * mm, stroke=1, fill=1)
                xs = [q[0] for q in hp] or [pts[0][0]]; ys = [q[1] for q in hp] or [pts[0][1]]
                bx0, bx1, by0, by1 = min(xs), max(xs), min(ys), max(ys); cx, cy = (bx0 + bx1) / 2, (by0 + by1) / 2
                rb = 4.4 * mm; spot = None
                for (qx, qy) in [(cx, by1 + rb + 1), (cx, by0 - rb - 1), (bx0 - rb - 1, cy), (bx1 + rb + 1, cy), (bx0 - rb, by1 + rb), (bx1 + rb, by1 + rb), (bx0 - rb, by0 - rb), (bx1 + rb, by0 - rb), (cx, by1 + 3 * rb), (cx, by0 - 3 * rb)]:
                    if not mb.inside(qx, qy, rb + 1 * mm) or qy < mb.y + 8 * mm: continue
                    if any(math.hypot(qx - u, qy - v) < 2 * rb + 1 * mm for u, v in badges): continue
                    spot = (qx, qy); break
                spot = spot or (cx, cy); badges.append(spot)
                c.setFillColor(col); c.setStrokeColor(WHITE); c.setLineWidth(1.6); c.circle(spot[0], spot[1], rb, stroke=1, fill=1)
                txt(c, spot[0], spot[1] - 2.6 * mm, str(a['n']), 'bold', 12.5 if a['n'] < 10 else 11, WHITE, 'c')
        if hi is not None and hi not in located:
            tag(c, mb.x + mb.w / 2, mb.y + mb.h / 2, f'Area {hi["n"]} is not on the master plan - ask on site', 'bold', 14, RED, WHITE, RED, pad=2.5 * mm, anchor='c')
        mb.furniture(c)
        # legend: every area, with its counts
        y0 = mb.y - 1.6 * mm; cols = max(7, math.ceil(len(d.areas) / 2)); cw =(W - 18 * mm) / cols; ch = 9.3 * mm
        for i, a in enumerate(d.areas):
            x = 9 * mm + (i % cols) * cw; y = y0 - (i // cols + 1) * ch
            col = acol(a['n']); onmap = a in located
            if a is hi:
                c.setStrokeColor(col); c.setLineWidth(1.6); c.roundRect(x + 0.2 * mm, y + 0.2 * mm, cw - 1.2 * mm, ch - 0.4 * mm, 1.5 * mm, stroke=1, fill=0)
            c.setFillColor(col if onmap else WHITE); c.setStrokeColor(col); c.setLineWidth(1)
            c.circle(x + 3.4 * mm, y + ch - 3.6 * mm, 3 * mm, stroke=1, fill=1)
            txt(c, x + 3.4 * mm, y + ch - 5.0 * mm, str(a['n']), 'bold', 9, WHITE if onmap else col, 'c')
            n_loc = len(a['refs']); n_u = d.units(a['refs'])
            meta = f'{n_loc} location{"s" if n_loc != 1 else ""} · {n_u} unit{"s" if n_u != 1 else ""}' + ('' if onmap else ' · not on the map')
            (name, name_size), (meta_lines, meta_size) = legend_cell(a['name'], meta, cw - 8.5 * mm)
            for k, s in enumerate(name): txt(c, x + 7.6 * mm, y + ch - 2.9 * mm - k * 2.8 * mm, s, 'narrowb', name_size, INK)
            for k, s in enumerate(meta_lines):
                txt(c, x + 7.6 * mm, y + ch - 2.9 * mm - (len(name) + k) * 2.8 * mm - 0.2 * mm, s, 'narrow', meta_size, MUTE)

    # ------------------------------------------------------------ area cover
    def cover(self, c, a):
        W, H = A4; d = self.d; top = H - 9 * mm; col = acol(a['n']); n = a['n']
        A = self.maps['areas'].get(str(n), {}); refs = a['refs']
        c.setFillColor(col); c.roundRect(9 * mm, top - 24 * mm, 24 * mm, 24 * mm, 2.5 * mm, stroke=0, fill=1)
        txt(c, 21 * mm, top - 17.5 * mm, str(n) if n else '–', 'bold', 40 if n < 10 else 34, WHITE, 'c')
        title = f'AREA {n}' if n else 'NO AREA YET'
        txt(c, 37 * mm, top - 6.5 * mm, title, 'bold', 10, col)
        txt(c, 37 * mm, top - 15 * mm, a['name'], 'narrowb', fit(a['name'], 'narrowb', 26, W - 46 * mm), INK)
        units = d.units(refs); bd = d.breakdown(refs)
        line2 = f'{len(refs)} location{"s" if len(refs) != 1 else ""} · {units} unit{"s" if units != 1 else ""}: ' + ' · '.join(f'{q} × {k}' for k, q in bd.items())
        txt(c, 37 * mm, top - 21 * mm, line2, 'bold', fit(line2, 'bold', 10.5, W - 46 * mm), INK)
        pd = d.plan_days()
        line3 = f'Jobs: {jobs_phrase(d, refs)}. The phone shows this area\'s % complete and the overall %.'
        txt(c, 37 * mm, top - 26 * mm, line3, 'sans', fit(line3, 'sans', 8.8, W - 46 * mm), MUTE)
        # which code is whose (Andrew, 20 Oct 2026: crews by role, never by name; no one is allocated an area)
        c.setFillColor(PAPER); c.roundRect(9 * mm, top - 35.2 * mm, W - 18 * mm, 6.6 * mm, 1.6 * mm, stroke=0, fill=1)
        xx = 12 * mm; yy = top - 32.9 * mm
        bits = (('Pump trucks: scan the ', INK), ('orange PUMP OUT code', ORANGE), ('   ·   Cleaners: scan the ', INK), ('blue CLEAN & RESTOCK code', BLUE), ('   ·   Water truck: tap ', INK), ('Refilled', INK))
        fs = 9
        while fs > 6 and sum(sw(w, 'bold', fs) for w, _ in bits) > W - 24 * mm: fs = round(fs - 0.2, 1)
        for words, colr in bits:
            txt(c, xx, yy, words, 'bold', fs, colr); xx += sw(words, 'bold', fs)
        y = top - 37 * mm
        box_full, box_split, box_far = (self.maps['layout'][k] for k in ('area_map_full', 'area_map_split', 'area_map_far'))
        if A.get('main'):
            split = bool(A['far']); bx = box_split if split else box_full
            mh_ = bx['h'] - 7   # 7 mm back for the crew line above (the map keeps its shape)
            if not split:   # a long table: give the How to use box room for all five steps by taking it off the map
                spare = (y - mh_ * mm - 6.5 * mm) - self.table_height(a) - 19 * mm - 2 * mm
                if spare < 31 * mm: mh_ -= (31 * mm - spare) / mm
            mb = MapBox(self.maps, A['main']['key'], 9 * mm, y - mh_ * mm, bx['w'] * mm, mh_ * mm)
            mb.draw(c, self.maps_dir); self.circles(c, mb, A['main']['refs'], 3.4 * mm); mb.furniture(c)
            icon_legend(c, 9 * mm, mb.y - 4.6 * mm, 7)
            y = mb.y - 6.5 * mm
            if split:
                fx = 9 * mm
                for far in A['far']:
                    fb = MapBox(self.maps, far['key'], fx, y - 5 * mm - box_far['h'] * mm, box_far['w'] * mm, box_far['h'] * mm)
                    who = ' · '.join(far['refs'])
                    cap = f'{who} · ' + self.distance(far['refs'], A['main']['refs'])
                    txt(c, fx, y - 3.4 * mm, cap, 'bold', fit(cap, 'bold', 8, box_far['w'] * mm + 60 * mm), INK)
                    fb.draw(c, self.maps_dir); self.circles(c, fb, far['refs'], 3.4 * mm); fb.furniture(c, scale=True, north=True, small=True)
                    fx += box_far['w'] * mm + 4 * mm
                self.howto(c, fx, y - 5 * mm - box_far['h'] * mm, W - 9 * mm - fx, box_far['h'] * mm)
                y = y - 5 * mm - box_far['h'] * mm - 3 * mm
            if A.get('unplaced'):
                s = 'Not on the map (no pin, no place on the master plan) - ask on site: ' + ', '.join(A['unplaced'])
                txt(c, 9 * mm, y - 3 * mm, s, 'bold', fit(s, 'bold', 8.5, W - 18 * mm), RED); y -= 5.5 * mm
        else:
            h = 70 * mm
            pinned = [r['ref'] for r in refs if r['pin']]; unpinned = [r['ref'] for r in refs if not r['pin']]
            if pinned:
                no_pin_panel(c, 9 * mm, y - h, W - 18 * mm, h, 'Off the plan',
                             'These locations are not on the master plan drawing. ' + ', '.join(pinned) + (' has' if len(pinned) == 1 else ' have') +
                             ' a Google Maps pin: scan its "Scan for directions" QR.' + (' ' + ', '.join(unpinned) + (' has' if len(unpinned) == 1 else ' have') + ' no pin yet - ask on site.' if unpinned else ''))
            else:
                no_pin_panel(c, 9 * mm, y - h, W - 18 * mm, h, 'No pin',
                             ('No location given yet. ' if n == 0 else 'None of these locations has a pin on the record or a place on the master plan yet. ') +
                             'Ask on site; each sheet still has its asset numbers, its jobs and its completion QR.')
            y -= h + 3 * mm
        # the locations
        y = self.table(c, a, y)
        if not A.get('far'):
            hh = min(36 * mm, y - 19 * mm)
            if hh > 22 * mm: self.howto(c, 9 * mm, y - hh - 2 * mm, W - 18 * mm, hh)

    def distance(self, far_refs, main_refs):
        """how far a far group is from the rest of its area: by the pins where both sides have one, else by the plan"""
        def pin(r): return next((x['pin'] for x in self.d.refs if x['ref'] == r and x['pin']), None)
        ins = self.maps.get('inset_region')
        inset = bool(ins) and any(ins[0] <= self.pos[r]['x'] <= ins[2] and ins[1] <= self.pos[r]['y'] <= ins[3] for r in far_refs)
        where = ' (drawn in the plan\'s inset)' if inset else ''
        fp = [pin(r) for r in far_refs if pin(r)]; mp = [pin(r) for r in main_refs if pin(r)]
        if fp and mp:
            def hav(p, q):
                R = 6371000; a1, a2 = math.radians(p[0]), math.radians(q[0]); dl = math.radians(q[1] - p[1]); dp = a2 - a1
                return 2 * R * math.asin(math.sqrt(math.sin(dp / 2) ** 2 + math.cos(a1) * math.cos(a2) * math.sin(dl / 2) ** 2))
            m = min(hav(p, q) for p in fp for q in mp); how = ''
        else:  # no pin on one side: the plan's own distance (image registration, not survey); an inset is drawn away from where it is
            if inset: return 'away from the rest of this area' + where
            m = min(math.hypot(self.pos[a]['x'] - self.pos[b]['x'], self.pos[a]['y'] - self.pos[b]['y']) for a in far_refs for b in main_refs) * self.maps['m_per_unit']
            how = 'drawn '
        d = f'about {m / 1000:.1f} km' if m >= 1000 else f'about {int(round(m / 10.0) * 10)} m'
        return f'{how}{d} from the rest of this area{where}'

    def circles(self, c, mb, refs, rr):
        """One type-specific marker per spot, labelled 'REF — what is there'. Units at different pins
        (T0024: EVL and the Coates office, Andrew 20 Oct 2026) gets one icon per spot, each naming its own units."""
        spots = self.maps.get('line_spots', {}); byref = {x['ref']: x for x in self.d.refs}; order = [x['ref'] for x in self.d.refs]
        items = []   # (sheet x, sheet y, ref, lines, where)
        for r in refs:
            own = [l for l in byref[r]['lines'] if l['id'] in spots]
            rest = [l for l in byref[r]['lines'] if l['id'] not in spots]
            for l in own:
                at = l['label'].split(' at ', 1)[1] if ' at ' in l['label'] else ''
                at = (at + ' · ' if at else '') + 'asset ' + ', '.join(l['nos']) if l.get('nos') else at   # Andrew: "mention all asset numbers too"
                items.append((spots[l['id']]['x'], spots[l['id']]['y'], r, [l], at))
            if rest: items.append((self.pos[r]['x'], self.pos[r]['y'], r, rest, ''))
        groups = collections.OrderedDict()
        for sx, sy, r, ls, at in items:
            px, py = mb.at(sx, sy); k = (round(px / 0.4), round(py / 0.4))
            groups.setdefault(k, [px, py, []])[2].append((r, ls, at))
        ir = max(2.2 * mm, rr * 0.72)
        footprints = [equipment_marker(c, px, py, ir, [l for _, ls, _ in its for l in ls]) for px, py, its in groups.values()]
        def label(its):
            its = sorted(its, key=lambda t: order.index(t[0]))
            what = what_here([{'lines': ls} for _, ls, _ in its]); at = ', '.join(a for _, _, a in its if a)
            return ' · '.join(dict.fromkeys(r for r, _, _ in its)) + ' — ' + what + (' (' + at + ')' if at else '')
        place_labels(c, mb, [(label(its), px, py) for px, py, its in groups.values()], ir + 0.6 * mm, 7.6, footprints)

    def table_height(self, a):
        """what table() will use, without drawing: the heading, the header row and every row"""
        d = self.d; h = 6 * mm + 5.4 * mm + 2 * mm
        for r in a['refs']:
            how = ' + '.join(l['label'] for l in r['lines'])
            where = ' · '.join(x for x in [r['title'] if r['title'] != r['ref'] else '', r['where'], ('drop point: ' + r['drop']) if r['drop'] else ''] if x)
            h += max(len(wrap(where or '-', 'sans', 8, 82 * mm)[:2]), len(wrap(how, 'bold', 8.5, 49 * mm)[:2])) * 3.6 * mm + 2.4 * mm
        return h

    def table(self, c, a, y):
        W, H = A4; x0, x1 = 9 * mm, W - 9 * mm; d = self.d
        cols = [('Ref', 18 * mm), ('How many', 52 * mm), ('Where / drop point', 85 * mm), ('Pin', 14 * mm), ('Sheet', 23 * mm)]
        txt(c, x0, y - 4 * mm, 'LOCATIONS IN THIS AREA', 'bold', 8, MUTE); y -= 6 * mm
        c.setFillColor(PAPER); c.rect(x0, y - 5.4 * mm, x1 - x0, 5.4 * mm, stroke=0, fill=1)
        cx = x0
        for name, w in cols: txt(c, cx + 1.5 * mm, y - 3.9 * mm, name, 'bold', 7.5, MUTE); cx += w
        y -= 5.4 * mm
        for r in a['refs']:
            how = ' + '.join(l['label'] for l in r['lines'])
            where = ' · '.join(x for x in [r['title'] if r['title'] != r['ref'] else '', r['where'], ('drop point: ' + r['drop']) if r['drop'] else ''] if x)
            wl = wrap(where or '-', 'sans', 8, cols[2][1] - 3 * mm)[:2]; hl = wrap(how, 'bold', 8.5, cols[1][1] - 3 * mm)[:2]
            rh = max(len(wl), len(hl)) * 3.6 * mm + 2.4 * mm
            cx = x0
            txt(c, cx + 1.5 * mm, y - 4.4 * mm, r['ref'], 'bold', fit(r['ref'], 'bold', 10.5, cols[0][1] - 3 * mm), INK); cx += cols[0][1]
            for i, s in enumerate(hl): txt(c, cx + 1.5 * mm, y - 4.2 * mm - i * 3.6 * mm, s, 'bold', 8.5, INK)
            cx += cols[1][1]
            for i, s in enumerate(wl): txt(c, cx + 1.5 * mm, y - 4.2 * mm - i * 3.6 * mm, s, 'sans', 8, INK)
            cx += cols[2][1]
            txt(c, cx + 1.5 * mm, y - 4.2 * mm, 'yes' if r['pin'] else 'no', 'sans', 8, INK if r['pin'] else RED); cx += cols[3][1]
            txt(c, cx + 1.5 * mm, y - 4.2 * mm, f'page {self.ref_page[r["ref"]]}', 'sans', 8, INK)
            y -= rh; c.setStrokeColor(LINE); c.setLineWidth(0.4); c.line(x0, y, x1, y)
        return y - 2 * mm

    def howto(self, c, x, y, w, h):
        c.setFillColor(PAPER); c.setStrokeColor(LINE); c.setLineWidth(0.6); c.roundRect(x, y, w, h, 2 * mm, stroke=1, fill=1)
        steps = ['Before the run, open any sheet with signal. Wait for Ready for offline scans. Later scans work offline on that phone; waiting ticks send when signal returns.',
                 'LOCATION QR: scan for directions (Google Maps). No pin: ask on site.',
                 'When a job is done, scan that location\'s PUMP OUT or CLEAN & RESTOCK code, tap Complete (the phone records the time), then Save & close. It only ticks that location. Refilled is a tick of its own and does not count in the %.',
                 'The phone shows each job, area and overall progress. Wait for Saved before treating a tap as received; Waiting ticks are still on this phone.',
                 'A service day runs 08:00 to 08:00 (Gold Coast time); the phone picks the day.']
        txt(c, x + 3 * mm, y + h - 5 * mm, 'HOW TO USE', 'bold', 8, MUTE)
        yy = y + h - 9 * mm; size = 8 if w > 100 * mm else 7.2
        need = lambda sz: 9 * mm + sum(len(wrap(s, 'sans', sz, w - 11 * mm)) * sz * 0.42 * mm + 1.3 * mm for s in steps)
        while size > 6 and need(size) > h - 1.5 * mm: size = round(size - 0.2, 1)   # all five steps, smaller if needed - never drop one
        for i, s in enumerate(steps):
            ls = wrap(s, 'sans', size, w - 11 * mm)
            if yy - len(ls) * size * 0.42 * mm < y + 1.5 * mm: break
            txt(c, x + 3 * mm, yy, f'{i + 1}', 'bold', size, ORANGE)
            for k, s2 in enumerate(ls): txt(c, x + 7 * mm, yy - k * size * 0.42 * mm, s2, 'sans', size, INK)
            yy -= len(ls) * size * 0.42 * mm + 1.3 * mm

    # ------------------------------------------------------------ one reference
    def ref_block(self, c, a, r, x, y, w, h):
        d = self.d; col = acol(a['n']); ref = r['ref']; top = y + h
        i, n = a['refs'].index(r) + 1, len(a['refs'])
        # band
        c.setFillColor(col); c.roundRect(x, top - 17 * mm, 3 * mm, 17 * mm, 1 * mm, stroke=0, fill=1)
        size = fit(ref, 'narrowb', 40, 48 * mm, 24)
        txt(c, x + 5 * mm, top - 13.5 * mm, ref, 'narrowb', size, INK)
        rx = x + 7 * mm + sw(ref, 'narrowb', size)
        area_line = f'Area {a["n"]} · {a["name"]}' if a['n'] else a['name']
        txt(c, rx + 1 * mm, top - 6.6 * mm, area_line, 'bold', fit(area_line, 'bold', 11, x + w - rx - 30 * mm), col)
        where = ' · '.join(s for s in [r['title'] if r['title'] != ref else '', r['where'], ('drop point: ' + r['drop']) if r['drop'] else ''] if s)
        if where: txt(c, rx + 1 * mm, top - 12.4 * mm, where, 'sans', fit(where, 'sans', 9, x + w - rx - 4 * mm), INK)
        txt(c, x + w, top - 6.6 * mm, f'location {i} of {n}', 'sans', 8, MUTE, 'r')
        c.setStrokeColor(INK); c.setLineWidth(0.8); c.line(x, top - 18.5 * mm, x + w, top - 18.5 * mm)
        # right column: map, then the two QR codes
        lay = self.maps['layout']['ref_map']; mw, mh = lay['w'] * mm, lay['h'] * mm
        mx, my = x + w - mw, top - 20.5 * mm - mh
        if self.pos[ref]:
            mb = MapBox(self.maps, self.maps['ref_image'][ref], mx, my, mw, mh); mb.draw(c, self.maps_dir)
            others = [k for k, v in self.maps['ref_image'].items() if v == self.maps['ref_image'][ref] and k != ref]
            if any(l['id'] in self.maps.get('line_spots', {}) for l in r['lines']):
                self.circles(c, mb, [ref], 3.4 * mm)
                note = 'Markers show the units at each recorded location.'
            else:
                px, py = mb.at(self.pos[ref]['x'], self.pos[ref]['y'])
                marker_radius = 2.6 * mm
                ring_radius = max(8 * mm, (len(symbol_kinds(r['lines'])) - 1) * (2 * marker_radius + .5 * mm) / 2 + marker_radius + mm)
                ring(c, px, py, ring_radius, ORANGE, 2.6); equipment_marker(c, px, py, marker_radius, r['lines'])
                place_labels(c, mb, [(ref + ' — ' + what_here([r]) + (' (shared spot)' if others else ''), px, py)], ring_radius + .6 * mm, 8.5)
                note = 'Circled servicing location' + ('' if r['pin'] else ' (no GPS pin on the record)') + '.'
                if others: note = f'Circled servicing location: one spot for {", ".join([ref] + others)}' + ('' if r['pin'] else '; no GPS pin') + '.'
            mb.furniture(c)
            txt(c, mx, my - 3.2 * mm, note, 'sans', fit(note, 'sans', 7, mw), MUTE)
        elif r['pin']:   # pinned, but off the master plan drawing (WC85 at the Seaway): the directions QR is the way there
            no_pin_panel(c, mx, my, mw, mh, 'Off the plan', 'Not on the master plan drawing. Scan "Scan for directions" for its Google Maps pin.')
        else:
            no_pin_panel(c, mx, my, mw, mh)
        # v2 (Andrew, 20 Oct 2026: "each refernce will have a Pump out QR code and a Clean and Restock barcode. you scan it.
        # and click complete and it logs a time it was done. then push a button to save and close"): one card per job
        # code this reference has (a sewer-connected block has no pump out), then the LOCATION card, side by side
        ctop = my - 5.2 * mm; cbot = max(y + 0.8 * mm, ctop - 62 * mm); ch = ctop - cbot
        groups = d.groups_for(r); gap = 2.2 * mm; loc_w = 27 * mm
        job_w = (mw - loc_w - gap * len(groups)) / len(groups)
        qs = min(32 * mm, job_w - 4 * mm, ch - (18 if self.draft else 14.5) * mm)
        gx = mx; mine = d.ref_tasks(r)
        for g in groups:
            colr = GROUP_COL.get(g, ORANGE); label = (d.groups[g]['label'] if g else 'Completion').upper()
            c.setFillColor(WHITE); c.setStrokeColor(colr); c.setLineWidth(2); c.roundRect(gx, cbot, job_w, ch, 2.2 * mm, stroke=1, fill=1)
            c.setFillColor(colr); c.roundRect(gx, ctop - 6.2 * mm, job_w, 6.2 * mm, 2.2 * mm, stroke=0, fill=1); c.rect(gx, ctop - 6.2 * mm, job_w, 3 * mm, stroke=0, fill=1)
            txt(c, gx + job_w / 2, ctop - 4.5 * mm, label, 'bold', fit(label, 'bold', 10, job_w - 3 * mm), WHITE, 'c')
            qr(c, self.job_url(ref, g), gx + (job_w - qs) / 2, ctop - 7.4 * mm - qs, qs)
            cy = ctop - 7.4 * mm - qs - 3.8 * mm
            s1 = 'Scan - tap Complete - Save & close'
            txt(c, gx + job_w / 2, cy, s1, 'bold', fit(s1, 'bold', 7.8, job_w - 2.5 * mm), INK, 'c')
            names = [d.tasks[t] + (' (not in %)' if t in d.extras else '') for t in (d.groups[g]['tasks'] if g else mine) if t in mine]
            s2 = 'Jobs: ' + ' · '.join(names)
            for k2, ln in enumerate(wrap(s2, 'sans', 6.2, job_w - 2.5 * mm)[:2]): txt(c, gx + job_w / 2, cy - 3.2 * mm - k2 * 2.7 * mm, ln, 'sans', 6.2, MUTE, 'c')
            if self.draft:
                code_label = 'TEST CODE - NOT LIVE' if self.mode == 'draft' else 'SIGNED TRACKER CODE'
                txt(c, gx + job_w / 2, cbot + 1.6 * mm, code_label, 'bold', fit(code_label, 'bold', 6.6, job_w - 2 * mm), RED, 'c')
            gx += job_w + gap
        lx = gx; ls = min(22 * mm, loc_w - 4 * mm, ch - 13.5 * mm)
        c.setStrokeColor(LINE); c.setLineWidth(0.8); c.roundRect(lx, cbot, loc_w, ch, 2.2 * mm, stroke=1, fill=0)
        txt(c, lx + loc_w / 2, ctop - 4.5 * mm, 'LOCATION', 'bold', 8, MUTE, 'c')
        qx = lx + (loc_w - ls) / 2; qy = ctop - 7.4 * mm - ls
        if r['pin']:
            qr(c, maps_url(r['pin']), qx, qy, ls)
            txt(c, lx + loc_w / 2, qy - 3.8 * mm, 'Scan for directions', 'bold', fit('Scan for directions', 'bold', 7.6, loc_w - 2 * mm), INK, 'c')
            for k2, ln in enumerate([f'{r["pin"][0]:.5f},', f'{r["pin"][1]:.5f}']): txt(c, lx + loc_w / 2, qy - 6.8 * mm - k2 * 2.6 * mm, ln, 'sans', 5.8, MUTE, 'c')
        else:
            c.setFillColor(PAPER); c.roundRect(qx, qy, ls, ls, 2 * mm, stroke=0, fill=1)
            txt(c, qx + ls / 2, qy + ls / 2 - 1 * mm, 'No pin', 'bold', 12, MUTE, 'c')
            for k2, ln in enumerate(wrap('No pin - ask on site', 'bold', 7, loc_w - 2 * mm)[:2]): txt(c, lx + loc_w / 2, qy - 3.8 * mm - k2 * 2.8 * mm, ln, 'bold', 7, INK, 'c')
        # left column: how many, the asset numbers, the jobs - closer spacing when a reference has many lines (WC05 has
        # three: block, tank, FWF), measured first on a scratch page so nothing ever runs off its half page
        lx0, lw = x + 4.5 * mm, mx - x - 8.5 * mm
        k = 1.0
        while k > 0.7 and self.left_col(self.scratch(), r, lx0, lw, top - 24 * mm, k) < y + 2 * mm: k = round(k - 0.05, 2)
        yy = self.left_col(c, r, lx0, lw, top - 24 * mm, k)
        if yy < y + 2 * mm: print(f'warning: {ref} block runs {((y + 2 * mm) - yy) / mm:.1f} mm long', file=sys.stderr)
        # what to do, where there is room
        codes = ' or '.join(d.groups[g]['label'].upper() for g in d.groups_for(r) if g) or 'COMPLETION'
        steps = ['Do tonight\'s jobs (the dots above).',
                 f'Scan the {codes} code for the job you did. It opens {ref} only.',
                 'Tap Complete on each job, then Save & close. The phone keeps the time.']
        bh = 6.5 * mm + len(steps) * 4.3 * mm
        if yy - bh - 2 * mm > y + 0.8 * mm:
            by = y + 0.8 * mm
            c.setFillColor(PAPER); c.setStrokeColor(LINE); c.setLineWidth(0.6); c.roundRect(lx0, by, lw, bh, 2 * mm, stroke=1, fill=1)
            txt(c, lx0 + 2.5 * mm, by + bh - 4.4 * mm, 'WHEN THE JOBS ARE DONE', 'bold', 7.2, MUTE)
            for k, s in enumerate(steps):
                txt(c, lx0 + 2.5 * mm, by + bh - 9 * mm - k * 4.3 * mm, str(k + 1), 'bold', 8.4, ORANGE)
                txt(c, lx0 + 6.5 * mm, by + bh - 9 * mm - k * 4.3 * mm, s, 'sans', fit(s, 'sans', 8.4, lw - 8.5 * mm), INK)

    def job_url(self, ref, group):
        """the reference's signed link plus its job group (#r=REF.sig~pump): the card shows only that code's jobs"""
        return self.urls[ref] + ('~' + group if group else '')

    def scratch(self):
        if not getattr(self, '_scratch', None):
            import io
            self._scratch = canvas.Canvas(io.BytesIO(), pagesize=A4)
        return self._scratch

    def left_col(self, c, r, lx0, lw, yy, k=1.0):
        txt(c, lx0, yy, 'HOW MANY', 'bold', 7.5, MUTE); yy -= 6.6 * mm * k
        for l in r['lines']:
            txt(c, lx0, yy, l['label'], 'bold', fit(l['label'], 'bold', 15 if k >= 0.9 else 13, lw), INK); yy -= 4.4 * mm * k
            nos = l['nos']
            if nos:
                s = 'Asset no' + ('s' if len(nos) > 1 else '') + ': ' + '  '.join(nos)
                for ln in wrap(s, 'sans', 8.6, lw): txt(c, lx0, yy, ln, 'sans', 8.6, INK); yy -= 3.7 * mm * max(k, 0.9)
            else:
                txt(c, lx0, yy, 'No asset numbers on the record', 'sans', 8.6, MUTE); yy -= 3.7 * mm * max(k, 0.9)
            yy -= 1.6 * mm * k
        yy -= 1 * mm * k
        txt(c, lx0, yy, 'JOBS EACH SERVICE DAY (08:00 to 08:00)', 'bold', 7.5, MUTE); yy -= 2.2 * mm
        groups = collections.OrderedDict()
        for l in r['lines']: groups.setdefault(l['kind'], []).append(l)
        for kind, ls in groups.items():
            yy = self.jobs_grid(c, lx0, yy, lw, kind, ls if len(groups) > 1 else None, k) - 2 * mm * k
        return yy

    def jobs_grid(self, c, x, y, w, kind, lines, k=1.0):
        d = self.d; days = d.days; plan = d.plans[kind]
        tasks = []
        for dd in days:
            for t in plan[dd['plan']]:
                if t not in tasks: tasks.append(t)
        tasks.sort(key=lambda t: list(d.tasks).index(t))
        colw = 9.6 * mm; name_w = w - len(days) * colw; rowh = 4.6 * mm * max(k, 0.8)
        if lines:
            s = ' + '.join(l['label'] for l in lines)
            txt(c, x, y - 3.4 * mm, s, 'bold', fit(s, 'bold', 8.2, w), INK); y -= 4.4 * mm * max(k, 0.85)
        # header
        c.setFillColor(PAPER); c.rect(x, y - 6.6 * mm, w, 6.6 * mm, stroke=0, fill=1)
        for k, dd in enumerate(days):
            cx = x + name_w + k * colw + colw / 2
            txt(c, cx, y - 2.9 * mm, dd['label'], 'bold', 7.6, INK, 'c')
            sub = 'if needed' if dd.get('ifNeeded') else 'last night' if dd['plan'] == 'final' else ''
            if sub: txt(c, cx, y - 5.7 * mm, sub, 'sans', 5.6, MUTE, 'c')
        y -= 6.6 * mm
        for t in tasks:
            tl = d.tasks[t] + (' (not in %)' if t in d.extras else '')
            txt(c, x + 1 * mm, y - rowh / 2 - 1.1 * mm, tl, 'bold', fit(tl, 'bold', 8.4 if k >= 0.9 else 7.8, name_w - 2 * mm), MUTE if t in d.extras else INK)
            for k, dd in enumerate(days):
                cx = x + name_w + k * colw + colw / 2; cy = y - rowh / 2
                if t in plan[dd['plan']]:
                    c.setFillColor(INK); c.circle(cx, cy, 1.25 * mm, stroke=0, fill=1)
                else:
                    c.setStrokeColor(MUTE); c.setLineWidth(0.8); c.line(cx - 1.4 * mm, cy, cx + 1.4 * mm, cy)
            y -= rowh; c.setStrokeColor(LINE); c.setLineWidth(0.35); c.line(x, y, x + w, y)
        # what changes on the last night, in words (Andrew: "Sunday night will need a extra ... No water will be needed")
        night, final = plan.get('night', []), plan.get('final', [])
        gone = [t for t in night if t not in final]; extra = [d.tasks[t] for t in final if t not in night]
        last = next((dd for dd in days if dd['plan'] == 'final'), None)
        if last and (gone or extra):
            if len(final) == 1 and extra: s = f'{last["label"]} night: one job - {d.tasks[final[0]]}.'   # FWF, accessible, 16-pan
            else: s = f'{last["label"]} night: ' + ' · '.join(([f'extra: {", ".join(extra)}'] if extra else []) + ['no ' + d.tasks[t].lower() for t in gone if t not in d.extras]) + '.'
            txt(c, x, y - 3.4 * mm, s, 'bold', fit(s, 'bold', 7.6, w), INK); y -= 4.2 * mm * max(k, 0.85)
        return y

    # ------------------------------------------------------------ render
    def render(self, out):
        c = canvas.Canvas(str(out), pagesize=A4)
        c.setAuthor('Andrew Fisher'); c.setTitle('GC500 servicing sheets' + (' (' + self.mode.upper() + ')' if self.draft else ''))
        c.setSubject(TRACK_ONLY); c.setCreator('make_sheets.py')
        for n, (kind, a, refs) in enumerate(self.pages, 1):
            size = landscape(A4) if kind == 'master' else A4
            c.setPageSize(size)
            if kind == 'master': self.master(c, a)
            elif kind == 'cover': self.cover(c, a)
            elif kind == 'ref_full':
                W, H = A4; self.ref_block(c, a, refs[0], 9 * mm, 20 * mm, W - 18 * mm, 2 * HALF_H + 6 * mm)
            else:
                W, H = A4; bh = (H - 7 * mm - 20 * mm - 6 * mm) / 2
                self.ref_block(c, a, refs[0], 9 * mm, 20 * mm + bh + 6 * mm, W - 18 * mm, bh)
                c.setStrokeColor(LINE); c.setDash(2, 2); c.setLineWidth(0.5); c.line(9 * mm, 20 * mm + bh + 3 * mm, W - 9 * mm, 20 * mm + bh + 3 * mm); c.setDash()
                if len(refs) > 1: self.ref_block(c, a, refs[1], 9 * mm, 20 * mm, W - 18 * mm, bh)
            self.frame(c, size, n)
            c.showPage()
        c.save()

def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--data', help='defaults to the published QR bundle data, otherwise tracker_data.json')
    ap.add_argument('--maps', default=str(HERE / 'maps'))
    ap.add_argument('--urls', default=str(HERE / 'urls.json'))
    ap.add_argument('--links', help='{"token":..., "links":{REF: sig}} from the edit link (kept outside the repo)')
    ap.add_argument('--out')
    ap.add_argument('--mode', choices=['draft', 'test', 'real'], help='default draft for placeholders, test (scan-check copy) for signed links; real needs a readiness receipt')
    ap.add_argument('--contact-name', default='')
    ap.add_argument('--contact-phone', default='')
    ap.add_argument('--readiness', help='private JSON confirming TEST checks and real tracker read-back; required for real sheets')
    ap.add_argument('--placeholder', action='store_true', help='(re)write urls.json with the DRAFT placeholders, then build')
    args = ap.parse_args()
    setup_fonts()
    data = load_pack_data(args)
    if args.placeholder or (not args.links and args.urls == str(HERE / 'urls.json') and not Path(args.urls).exists()):
        write_placeholder(HERE / 'urls.json', data); args.urls = str(HERE / 'urls.json'); print('wrote', HERE / 'urls.json', '(placeholders)')
    urls, placeholder = load_urls(args, data)
    mode, contact = pack_readiness(args, data, urls, placeholder)
    draft = mode != 'real'
    out = Path(args.out) if args.out else HERE / ('GC500_servicing_sheets_' + mode.upper() + '.pdf' if draft else 'GC500_servicing_sheets.pdf')
    if not placeholder:
        root = repo_root(HERE)
        for what, p in (('the PDF', out), ('the links file', Path(args.links or args.urls))):
            if root and str(p.resolve()).startswith(str(root) + '/'):
                sys.exit(f'refused: {what} holds the live QR codes and must stay outside the repository ({p})')
    maps_dir = Path(args.maps); maps = json.loads((maps_dir / 'maps.json').read_text())
    maps['layout'] = json.loads((HERE / 'layout.json').read_text())
    printed = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=10))).strftime('%-d %b %Y %H:%M')
    pack = Pack(data, maps, maps_dir, urls, draft, printed, mode, contact)
    pack.render(out)
    print(f'wrote {out} · {len(pack.pages)} pages · {len(data.refs)} locations · {mode.upper()} QR codes')
    print('  data sha256:', data.sha)
    # page ranges, for printing one area's pack several times (Andrew: "We can have multiple printed off for each")
    for a in data.areas:
        pages = [n for n, (k, ar, _) in enumerate(pack.pages, 1) if ar is a]
        print(f"  area {a['n']:>2} {a['name']}: pages {pages[0]}-{pages[-1]}")
    print('  master map: page 1 (and each area\'s own copy straight after its cover)')

if __name__ == '__main__':
    main()
