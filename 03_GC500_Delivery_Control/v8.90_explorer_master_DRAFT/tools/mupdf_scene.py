# Author: Andrew Fisher. The Map explorer's drawing scene, rebuilt from a PDF.
#
# The explorer's scene (assets/drawing-scene.bin, gzip JSON) is MuPDF's SVG rendering of the sheet cut into records:
#   r[i]  = [x0, y0, x1, y1, contextIndex, styleIndex, d]   (styleIndex -1: a raw <image> element)
#   s[j]  = [attributes without d, mergeable, defIds]        mergeable: stroke-only without stroke-opacity
#   c[k]  = [open tags, close tags, defIds]                  one context per run of records under the same <g> stack
#   d[id] = [svg, depIds]                                    clipPath and mask definitions
#   grid/broad/cell/nx/ny/w/h                                64 pt cells; a record spanning more than 24 cells is "broad"
#   labels, meta
# PyMuPDF's page.get_svg_image(text_as_path=True) is the same MuPDF SVG device the live scene was cut from (17 Sep issue:
# 253,697 paths, 619 images, 1,293 clips, 617 masks reproduce record for record; see README).
import re, math, json

ATTR = re.compile(r'([\w:-]+)="([^"]*)"')
TOK = re.compile(r'[MLHVCSQTAZmlhvcsqtaz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE]-?\d+)?')
URL = re.compile(r'url\(#([^)]+)\)')
CELL, BROAD_CELLS = 64, 24


def matrix_of(s):
    m = re.search(r'matrix\(([^)]*)\)', s or '')
    if m: return [float(x) for x in m.group(1).split(',')]
    m = re.search(r'translate\(([^)]*)\)', s or '')
    if m:
        v = [float(x) for x in re.split(r'[ ,]+', m.group(1).strip())]; return [1, 0, 0, 1, v[0], v[1] if len(v) > 1 else 0]
    return [1, 0, 0, 1, 0, 0]


def mul(A, B):
    """A after B (apply B first)."""
    a, b, c, d, e, f = A; a2, b2, c2, d2, e2, f2 = B
    return [a * a2 + c * b2, b * a2 + d * b2, a * c2 + c * d2, b * c2 + d * d2, a * e2 + c * f2 + e, b * e2 + d * f2 + f]


def apply(M, x, y): return (M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5])


def path_points(d):
    """Every coordinate the path names (anchors and control points), absolute."""
    pts = []; x = y = 0.0; sx = sy = 0.0; cmd = None; nums = []
    def flush():
        nonlocal x, y, sx, sy, nums
        if not cmd or not nums and cmd not in 'Zz': nums = []; return
        rel = cmd.islower(); C = cmd.upper()
        if C in 'ML' or C == 'T':
            for j in range(0, len(nums) - 1, 2):
                px, py = nums[j], nums[j + 1]
                if rel: px += x; py += y
                x, y = px, py; pts.append((x, y))
                if C == 'M' and j == 0: sx, sy = x, y
        elif C == 'H':
            for v in nums: x = x + v if rel else v; pts.append((x, y))
        elif C == 'V':
            for v in nums: y = y + v if rel else v; pts.append((x, y))
        elif C == 'C':
            for j in range(0, len(nums) - 5, 6):
                q = nums[j:j + 6]
                if rel: q = [q[0] + x, q[1] + y, q[2] + x, q[3] + y, q[4] + x, q[5] + y]
                pts.append((q[0], q[1])); pts.append((q[2], q[3])); x, y = q[4], q[5]; pts.append((x, y))
        elif C in 'SQ':
            for j in range(0, len(nums) - 3, 4):
                q = nums[j:j + 4]
                if rel: q = [q[0] + x, q[1] + y, q[2] + x, q[3] + y]
                pts.append((q[0], q[1])); x, y = q[2], q[3]; pts.append((x, y))
        elif C == 'A':
            for j in range(0, len(nums) - 6, 7):
                px, py = nums[j + 5], nums[j + 6]
                if rel: px += x; py += y
                x, y = px, py; pts.append((x, y))
        nums = []
    for t in TOK.findall(d):
        if t.isalpha():
            flush()
            if t in 'Zz': x, y = sx, sy
            cmd = t
        else: nums.append(float(t))
    flush()
    return pts


def transformed_bbox(pts, M):
    """The axis-aligned box of the points in their own space, carried through M by its four corners."""
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    corners = [apply(M, X, Y) for X in (min(xs), max(xs)) for Y in (min(ys), max(ys))]
    return min(c[0] for c in corners), min(c[1] for c in corners), max(c[0] for c in corners), max(c[1] for c in corners)


def pad_for(attrs, M):
    """The allowance the live scene gives a record's box: 0.23 pt, plus half the stroke width on the sheet, times the
    miter limit where the joins are mitred (a hairline with mitred joins: 0.23 + 0.03 x 10 = 0.53; with round joins 0.26)."""
    if 'stroke' not in attrs: return 0.23
    sw = float(attrs.get('stroke-width', '1'))
    scale = math.sqrt(abs(M[0] * M[3] - M[1] * M[2]))
    half = sw * scale / 2
    if attrs.get('stroke-linejoin', 'miter') == 'miter': half *= float(attrs.get('stroke-miterlimit', '4'))
    return 0.23 + round(half, 6)


def r2(v): return round(v + 0.0, 3)


def parse_svg(svg):
    """MuPDF's SVG text -> dict(defs, contexts, records, styles, w, h). Records: dict(bbox, ctx, style, d, kind, attrs)."""
    lines = svg.split('\n')
    head = lines[0]
    wm = re.search(r'width="([\d.]+)" height="([\d.]+)"', head); W, H = float(wm.group(1)), float(wm.group(2))
    i = 1
    assert lines[i].strip() == '<defs>', lines[i]
    i += 1
    defs = {}; order = []
    # ---- definitions: each starts with an opening tag carrying an id, and ends with its matching close tag
    while lines[i].strip() != '</defs>':
        line = lines[i]
        m = re.match(r'<(\w+)\s[^>]*\bid="([^"]+)"', line)
        assert m, 'unexpected def line %d: %r' % (i, line[:80])
        tag, did = m.group(1), m.group(2); depth = 0; parts = []
        while True:
            line = lines[i]
            if line.startswith('<image') and not line.rstrip().endswith('/>'):   # a data URI wrapped over several lines
                buf = [line]; i += 1
                while not lines[i].rstrip().endswith('/>'): buf.append(lines[i]); i += 1
                buf.append(lines[i]); line = ' '.join(buf)
            parts.append(line)
            if re.match(r'<' + tag + r'\b', line) and not line.rstrip().endswith('/>'): depth += 1
            if line.strip() == '</' + tag + '>': depth -= 1
            i += 1
            if depth == 0: break
        text = '\n'.join(parts)
        deps = [u for u in dict.fromkeys(URL.findall(text)) if u != did]
        defs[did] = [text, deps]; order.append(did)
    i += 1
    # ---- the body
    stack = []; records = []; contexts = []; ctx_key = None
    while i < len(lines):
        line = lines[i]
        if line.startswith('</svg'): break
        if line.startswith('<g'):
            stack.append(line); i += 1; continue           # a bare <g> wrapper (MuPDF 1.28 adds one) is kept out of the context text below
        if line.startswith('</g>'):
            stack.pop(); i += 1; continue
        if line.startswith('<path'):
            el = line; i += 1; kind = 'path'
        elif line.startswith('<image'):
            buf = [line]
            while not lines[i].rstrip().endswith('/>'): i += 1; buf.append(lines[i])
            i += 1; el = ' '.join(buf); kind = 'image'
        elif not line.strip():
            i += 1; continue
        else:
            raise ValueError('unexpected body line %d: %r' % (i, line[:80]))
        key = tuple(g for g in stack if g.strip() != '<g>')
        if key != ctx_key:
            ctx_key = key
            opens = ''.join(key); closes = '</g>' * len(key)
            deps = list(dict.fromkeys(URL.findall(opens)))
            contexts.append([opens, closes, deps])
        attrs = dict(ATTR.findall(el))
        M = [1, 0, 0, 1, 0, 0]
        for g in stack:
            if 'transform=' in g: M = mul(M, matrix_of(g))
        if 'transform' in attrs: M = mul(M, matrix_of(attrs['transform']))
        if kind == 'path':
            pts = path_points(attrs['d'])
            if not pts: pts = [(0, 0)]
            x0, y0, x1, y1 = transformed_bbox(pts, M)
            style = re.sub(r' d="[^"]*"', '', el[len('<path '):-2])
            if 'stroke=' in style and 'stroke-width' not in attrs:   # a PDF hairline: MuPDF 1.28 leaves the width out; the live scene (MuPDF 1.26) wrote it as one device pixel
                attrs['stroke-width'] = '1'; attrs['vector-effect'] = 'non-scaling-stroke'
                style = style.replace('" stroke-', '" stroke-width="1" stroke-', 1) + ' vector-effect="non-scaling-stroke"'
            p = pad_for(attrs, M)
            records.append({'bbox': [r2(x0 - p), r2(y0 - p), r2(x1 + p), r2(y1 + p)], 'ctx': len(contexts) - 1, 'style': style, 'd': attrs['d'], 'kind': 'path', 'attrs': attrs})
        else:
            w, h = float(attrs['width']), float(attrs['height'])
            x0, y0, x1, y1 = transformed_bbox([(0, 0), (w, h)], M); p = 0.08
            records.append({'bbox': [r2(x0 - p), r2(y0 - p), r2(x1 + p), r2(y1 + p)], 'ctx': len(contexts) - 1, 'style': None, 'd': el, 'kind': 'image', 'attrs': attrs})
    return {'w': W, 'h': H, 'defs': defs, 'def_order': order, 'contexts': contexts, 'records': records}


def mergeable(style): return 1 if 'fill="none"' in style and 'stroke-opacity' not in style else 0


def cells_of(b, cell=CELL):
    return math.floor(b[0] / cell), math.floor(b[1] / cell), math.floor(b[2] / cell), math.floor(b[3] / cell)


def build_scene(parsed, labels, meta):
    """The explorer's scene dict from a parsed SVG (records in order), with styles de-duplicated and the spatial index."""
    W, H = int(parsed['w']), int(parsed['h'])
    styles = []; sidx = {}; R = []
    for rec in parsed['records']:
        if rec['kind'] == 'image': st = -1
        else:
            s = rec['style']
            if s not in sidx:
                sidx[s] = len(styles); styles.append([s, mergeable(s), [u for u in dict.fromkeys(URL.findall(s))]])
            st = sidx[s]
        R.append(rec['bbox'] + [rec['ctx'], st, rec['d']])
    nx, ny = math.ceil(W / CELL), math.ceil(H / CELL)
    grid = [[] for _ in range(nx * ny)]; broad = []
    for i, r in enumerate(R):
        a, b, c, d = cells_of(r)
        a = max(0, min(nx - 1, a)); c = max(0, min(nx - 1, c)); b = max(0, min(ny - 1, b)); d = max(0, min(ny - 1, d))
        if (c - a + 1) * (d - b + 1) > BROAD_CELLS: broad.append(i); continue
        for iy in range(b, d + 1):
            for ix in range(a, c + 1): grid[iy * nx + ix].append(i)
    defs = {k: parsed['defs'][k] for k in parsed['def_order']}
    return {'w': W, 'h': H, 'c': parsed['contexts'], 's': styles, 'd': defs, 'r': R, 'grid': grid, 'broad': broad, 'cell': CELL, 'nx': nx, 'ny': ny, 'labels': labels, 'meta': meta}


def dumps(scene): return json.dumps(scene, separators=(',', ':'))


# ---- the search labels: the sheet's text lines, as the live scene lists them -------------------------------------
STOP = {'LP', 'FL', 'RL', 'E.P'}
MEASURE = re.compile(r'^[\d.\-/#x ]+m?$')


def label_ok(t):
    t = t.strip()
    if len(t) < 2: return False
    if MEASURE.match(t): return False
    words = t.split()
    if t in STOP or all(w in STOP for w in words): return False
    if all(MEASURE.match(w) for w in words): return False
    return True


def text_lines(page):
    """PyMuPDF text lines (spans joined), as (text, bbox, font, size, dir, blockIndex)."""
    out = []
    d = page.get_text('dict')
    for bi, b in enumerate(d['blocks']):
        if b['type'] != 0: continue
        for ln in b['lines']:
            txt = ''.join(sp['text'] for sp in ln['spans'])
            out.append((txt, ln['bbox'], ln['spans'][0]['font'], ln['spans'][0]['size'], ln['dir'], bi))
    return out
