# Author: Andrew Fisher. Where did the 2 Oct issue move on the paper? Measured from the vectors, region by region.
#   python3 analyse_shift.py <17 Sep PDF> <2 Oct PDF> <out json>   (the first look; build_scene890.py carries the same measurement)
import sys, os, json, re, collections, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mupdf_scene as MS
import pymupdf as fitz
OLD = fitz.open(sys.argv[1])[0].get_svg_image(text_as_path=True); NEW = fitz.open(sys.argv[2])[0].get_svg_image(text_as_path=True)
po, pn = MS.parse_svg(OLD), MS.parse_svg(NEW)
print('records old/new', len(po['records']), len(pn['records']))


def region_of(parsed):
    """main (L-shaped viewport), inset (its rectangle), legend strip, border, icon (small square clips) or masked image."""
    out = []
    for ctx in parsed['contexts']:
        clip = next((d for d in ctx[2] if d.startswith('clip')), None)
        geom = re.search(r' d="([^"]+)"', parsed['defs'][clip][0]).group(1) if clip else ''
        if geom.startswith('M24244'): reg = 'main'
        elif geom.startswith('M38667'): reg = 'inset'
        elif geom.startswith('M591 2'): reg = 'legend'
        elif geom.startswith('M42'): reg = 'border'
        elif 'matrix(1,0,0,-1,0,1684)' in parsed['defs'][clip][0]: reg = 'icon'
        else: reg = 'other:' + geom[:30]
        out.append(reg)
    return out


ro, rn = region_of(po), region_of(pn)
print('old contexts by region', collections.Counter(ro)); print('new contexts by region', collections.Counter(rn))
NUM = re.compile(r'-?(?:\d+\.?\d*|\.\d+)')


def signature(rec, ctxs):
    """what a record is, independent of where it sits: style without its translation, path relative to its first point."""
    st = rec['style'] if rec['kind'] == 'path' else re.sub(r'xlink:href="[^"]*"', '', rec['d'])[:200]
    if rec['kind'] == 'path':
        st = re.sub(r'matrix\(([^,]+),([^,]+),([^,]+),([^,]+),[^,]+,[^)]+\)', r'matrix(\1,\2,\3,\4)', st)
        nums = NUM.findall(rec['d'])
        if len(nums) >= 2:
            x0, y0 = float(nums[0]), float(nums[1])
            # relative path: shift every x/y by the first point; H and V take only one coordinate
            pts = MS.path_points(rec['d']); rel = tuple((round(x - x0, 3), round(y - y0, 3)) for x, y in pts)
            return (st, rel)
        return (st, rec['d'])
    g = ctxs[rec['ctx']][0]
    return (st, re.sub(r'matrix\(([^,]+),([^,]+),([^,]+),([^,]+),[^,]+,[^)]+\)', r'matrix(\1,\2,\3,\4)', g))


def anchor(rec, ctxs):
    """the record's first point carried to the sheet (pt), or the image's origin"""
    M = [1, 0, 0, 1, 0, 0]
    for g in ctxs[rec['ctx']][0].split('><'):
        if 'transform=' in g: M = MS.mul(M, MS.matrix_of(g))
    if rec['kind'] == 'path':
        if 'transform' in rec['attrs']: M = MS.mul(M, MS.matrix_of(rec['attrs']['transform']))
        pts = MS.path_points(rec['d']); return MS.apply(M, pts[0][0], pts[0][1])
    return MS.apply(M, 0, 0)


def index(parsed, regs):
    idx = collections.defaultdict(list)
    for i, rec in enumerate(parsed['records']):
        idx[(regs[rec['ctx']], signature(rec, parsed['contexts']))].append(i)
    return idx


io, inn = index(po, ro), index(pn, rn)
offsets = collections.defaultdict(list); unmatched_old = []; unmatched_new = set(range(len(pn['records'])))
for key, olds in io.items():
    news = inn.get(key)
    if not news or len(news) != len(olds):
        unmatched_old.extend(olds); continue
    # same count: pair in order (records keep their drawing order), accept the pairing if offsets agree
    offs = []
    for a, b in zip(olds, news):
        pa, pb = anchor(po['records'][a], po['contexts']), anchor(pn['records'][b], pn['contexts']); offs.append((pb[0] - pa[0], pb[1] - pa[1]))
    for a, b, o in zip(olds, news, offs):
        offsets[key[0]].append((round(o[0], 2), round(o[1], 2), a, b)); unmatched_new.discard(b)
print('matched records', sum(len(v) for v in offsets.values()), 'unmatched old', len(unmatched_old), 'unmatched new', len(unmatched_new))
for reg, lst in offsets.items():
    c = collections.Counter((o[0], o[1]) for o in lst)
    print(reg, len(lst), 'top offsets (dx, dy): count', c.most_common(8))
# where are the main-region records that did NOT move by the main shift? cluster by position
main_mode = collections.Counter((o[0], o[1]) for o in offsets['main']).most_common(1)[0][0]
print('main shift mode', main_mode)
odd = [(o, po['records'][o[2]]['bbox']) for o in offsets['main'] if abs(o[0] - main_mode[0]) > 0.2 or abs(o[1] - main_mode[1]) > 0.2]
print('main records with a different offset', len(odd))
cl = collections.Counter((round(b[0] / 50) * 50, round(b[1] / 50) * 50, o[0], o[1]) for o, b in odd)
for k, v in cl.most_common(25): print('  ', v, 'near sheet', k[:2], 'offset', k[2:])
# unmatched clusters (old and new) by 50 pt cells
cu = collections.Counter((round(po['records'][i]['bbox'][0] / 50) * 50, round(po['records'][i]['bbox'][1] / 50) * 50, ro[po['records'][i]['ctx']]) for i in unmatched_old)
print('unmatched OLD clusters:'); [print('  ', v, k) for k, v in cu.most_common(40)]
cn = collections.Counter((round(pn['records'][i]['bbox'][0] / 50) * 50, round(pn['records'][i]['bbox'][1] / 50) * 50, rn[pn['records'][i]['ctx']]) for i in unmatched_new)
print('unmatched NEW clusters:'); [print('  ', v, k) for k, v in cn.most_common(40)]
json.dump({'offsets': {k: collections.Counter((o[0], o[1]) for o in v).most_common(10) for k, v in offsets.items()},
           'unmatched_old': unmatched_old, 'unmatched_new': sorted(unmatched_new)},
          open(sys.argv[3], 'w'))
