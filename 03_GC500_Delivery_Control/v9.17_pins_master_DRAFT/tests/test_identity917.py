# Author: Andrew Fisher. v9.17 identity: the candidate differs from its base only where the release says it does.
#   python3 tests/test_identity917.py <base page> <candidate page> [media_manifest_v917.json]
#   - DATA: identical except media (+46 / -46: the 23 pins' old pictures out, the 46 re-made pictures in) and
#     hostedMedia.manifest, which must be the canonical digest of the page's own media, before and after, and equal the
#     manifest file written beside the page;
#   - MASTER_LOC: identical except the 23, and for them only ll, pt, how and img, each equal to the release's list;
#   - MASTER_LAYERS: identical except the 23 "Entry point" labels, now "Emergency egress point (E.P)";
#   - every other byte: identical except the Part 2 code (the navPoint917 helper and the five surfaces that read it),
#     printed in full to evidence/identity917_code.diff;
#   - the footer is unchanged.
import difflib, hashlib, json, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
BASE, CAND = sys.argv[1:3]
MANI = Path(sys.argv[3]) if len(sys.argv) > 3 else Path(CAND).parent / 'media_manifest_v917.json'
DER = json.loads((here.parent / 'evidence' / 'derive917.json').read_text())
TH = json.loads((here.parent / 'evidence' / 'thumbs917.json').read_text())
fails = []
def check(c, what):
    if not c: fails.append(what)
    return c
def blobs(s):
    out = {}
    m = re.search(r'const DATA = (\{.*?\});\n', s); out['DATA'] = (m.start(1), m.end(1), json.loads(m.group(1)))
    for name in ('MASTER_LOC', 'MASTER_LAYERS'):
        m = re.search(r'const ' + name + r' = ', s); v, e = json.JSONDecoder().raw_decode(s[m.end():]); out[name] = (m.end(), m.end() + e, v)
    return out
b = Path(BASE).read_text(encoding='utf-8'); c = Path(CAND).read_text(encoding='utf-8')
B, C = blobs(b), blobs(c)
# DATA
BD, CD = B['DATA'][2], C['DATA'][2]
check(set(BD) == set(CD), 'DATA keys changed')
for k in BD:
    if k in ('media', 'hostedMedia'): continue
    check(BD[k] == CD.get(k), 'DATA.' + k + ' changed')
check({k: v for k, v in BD['hostedMedia'].items() if k != 'manifest'} == {k: v for k, v in CD['hostedMedia'].items() if k != 'manifest'}, 'hostedMedia changed beyond its manifest')
def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)
def manifest(D):
    assets = sorted(({k: x[k] for k in ('bytes', 'file', 'scope', 'sha256', 'type')} for x in D['media'].values()), key=lambda x: x['file'])
    body = {'schema': 'gc500-media-v1', 'assets': assets}; return dict(body, sha256=hashlib.sha256(canonical(body).encode('utf-8')).hexdigest())
check(manifest(BD)['sha256'] == BD['hostedMedia']['manifest'], 'base manifest is not the digest of its media')
MC = manifest(CD)
check(MC['sha256'] == CD['hostedMedia']['manifest'], 'candidate manifest is not the digest of its media')
MF = json.loads(MANI.read_text()) if MANI.exists() else None
check(MF == MC, 'media_manifest_v917.json is not the candidate media list and digest')
added = set(CD['media']) - set(BD['media']); removed = set(BD['media']) - set(CD['media'])
old_imgs = {x for ref in TH['pins'] for x in TH['pins'][ref]['old_img']}; new_imgs = {x['sha256'] for x in TH['media']}
check(len(added) == 46 and added == new_imgs, 'media added is not the 46 re-made pictures')
check(len(removed) == 46 and removed == old_imgs, 'media removed is not the 23 pins\' 92... old pictures (46)')
check(all(BD['media'][k] == CD['media'][k] for k in set(BD['media']) & set(CD['media'])), 'an existing media entry changed')
check(all(CD['media'][x['sha256']] == {k: x[k] for k in ('file', 'sha256', 'type', 'bytes', 'scope')} for x in TH['media']), 'a new media entry differs from thumbs917.json')
check(all(c.count(sha) == 0 for sha in removed), 'a removed picture is still named on the page')
# MASTER_LOC
BL, CL = B['MASTER_LOC'][2], C['MASTER_LOC'][2]
MOV = DER['rows']
check(set(BL) == set(CL), 'MASTER_LOC keys changed')
changed = {k for k in BL if BL[k] != CL.get(k)}
check(changed == set(MOV), 'MASTER_LOC changed outside the 23: ' + str(sorted(changed ^ set(MOV))))
for k in MOV:
    bk, ck = BL[k], CL[k]
    check({x for x in set(bk) | set(ck) if bk.get(x) != ck.get(x)} <= {'ll', 'pt', 'how', 'img'}, k + ': a field other than ll/pt/how/img changed')
    check(ck['ll'] == MOV[k]['listed_ll'] and ck['pt'] == MOV[k]['listed_pt'], k + ': ll/pt is not the listed point')
    check(ck['img'] == TH['pins'][k]['img'] and bk['img'] == TH['pins'][k]['old_img'], k + ': pictures not as made')
    check(bk['ll'] == MOV[k]['page_now_ll'], k + ': base ll is not what the audit read')
# MASTER_LAYERS
BY, CY = B['MASTER_LAYERS'][2], C['MASTER_LAYERS'][2]
check(len(BY) == len(CY), 'MASTER_LAYERS length changed')
diff_lay = [(i, x, y) for i, (x, y) in enumerate(zip(BY, CY)) if x != y]
check(len(diff_lay) == 23 and all(x['label'] == 'Entry point' and y['label'] == 'Emergency egress point (E.P)' and {k: v for k, v in x.items() if k != 'label'} == {k: v for k, v in y.items() if k != 'label'} for _, x, y in diff_lay), 'MASTER_LAYERS changed beyond the 23 E.P labels')
check(sum(1 for y in CY if y['label'] == 'Entry point') == 0, 'an "Entry point" label is left')
# every other byte: mask the three data blobs and diff the code
def masked(s, X):
    parts = sorted((X[n][0], X[n][1], n) for n in X); out, i = [], 0
    for a, e, n in parts: out.append(s[i:a]); out.append('<<' + n + '>>'); i = e
    out.append(s[i:]); return ''.join(out)
mb, mc = masked(b, B), masked(c, C)
bl, cl = mb.split('\n'), mc.split('\n')
d = list(difflib.unified_diff(bl, cl, 'base', 'candidate', n=0, lineterm=''))
(here.parent / 'evidence' / 'identity917_code.diff').write_text('\n'.join(x[:2000] for x in d) + '\n')
minus = [x[1:] for x in d if x.startswith('-') and not x.startswith('---')]
plus = [x[1:] for x in d if x.startswith('+') and not x.startswith('+++')]
EXPECT_OLD = ["const pt = aerialPointFor(a), ll = pt ? lonLatOf(pt.ax, pt.ay) : null;", "— it drops you at the area, not on the spot.",
              "const to = pf && pf.lat != null ? {lat: pf.lat, lon: pf.lon} : ll;", "'Open the pinned spot in maps' : 'Open it in maps'",
              "const ll = lonLatOf(pt.ax, pt.ay); const g = DATA.georef;", "the callout's spot on the drawing through a",
              "if (mu) { const ll = {lat: mu.ll[0], lon: mu.ll[1]}", "<div class=\"pinwhat\"><span class=\"mono\">${ll.lat.toFixed(6)}",
              "const t = navTargetFor(a); if (!t || !t.ll) return null;", "const words = t.pinned ?", "return {a, t, lat: t.ll.lat, lon: t.ll.lon, words};"]
check(all(any(e in x for e in EXPECT_OLD) for x in minus), 'a base line changed that Part 2 does not name: ' + str([x[:120] for x in minus if not any(e in x for e in EXPECT_OLD)][:3]))
check(all(any(e in x for x in minus) for e in EXPECT_OLD), 'a Part 2 change is missing: ' + str([e for e in EXPECT_OLD if not any(e in x for x in minus)]))
check(len(minus) == 11, 'expected 11 base lines changed, found %d' % len(minus))
ALLOWED_PLUS = (": t.pinned ? 'the pin '", "return {a, t, lat: ll.lat, lon: ll.lon, words};", "reads the one Navigate uses: dest782.",
                '"Where it is" links, and the map pin / search spot', 'sheets) or their own pin, so the same reference',
                '/* v9.17 - one point per reference', '<div class="pinwhat"><span class="mono">${mu.ll[0].toFixed(6)}, ${mu.ll[1].toFixed(6)}</span>')
check(all('917' in x or x.strip().startswith(ALLOWED_PLUS) for x in plus), 'an added line is not part of v9.17: ' + str([x[:120] for x in plus if '917' not in x and not x.strip().startswith(ALLOWED_PLUS)][:6]))
check(len(plus) == 22, 'expected 22 candidate lines, found %d' % len(plus))
fb, fc = re.findall(r' · v9\.\d+', b), re.findall(r' · v9\.\d+', c)
check(fb == fc, 'the footer changed')
print(('FAIL ' + '; '.join(fails)) if fails else
      'PASS identity: DATA only media +%d/-%d and the manifest (%s, %d assets, = media_manifest_v917.json); MASTER_LOC only the 23 (ll, pt, how, img); '
      'MASTER_LAYERS only the 23 E.P labels; code: %d lines out, %d in, all Part 2; footer %s unchanged'
      % (len(added), len(removed), MC['sha256'][:16], len(MC['assets']), len(minus), len(plus), fc[-1] if fc else None))
sys.exit(1 if fails else 0)
