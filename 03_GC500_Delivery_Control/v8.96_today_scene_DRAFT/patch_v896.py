# Author: Andrew Fisher. v8.96 Today scene: the selected day's weather across the Where we are plate, a faint picture of each
# group's equipment behind its card (eight WebP pictures served as hosted media), and the race-day banner and its clip parked
# in a fold at the foot of Today. Presentation only: no record, figure, money or navigation change. DATA changes only by the
# eight media entries and the media manifest the service checks the page against (register media_manifest_v896.json first).
# Needs v8.85 (the Where we are card). Runs last in the chain, after v8.89 ... v8.95 in any order:
#   toolchain/build.sh v8.96 v8.84_today_wide_layout_DRAFT/patch_v884.py v8.85_where_we_are_DRAFT/patch_v885.py \
#     v8.86_event_portables_days_DRAFT/patch_v886.py v8.87_map_explorer_DRAFT/patch_v887.py v8.88_costs_transport_DRAFT/patch_v888.py \
#     v8.89_master_map_DRAFT/patch_v889.py [v8.93] [v8.95] [v8.94] [v8.91] [v8.92] v8.96_today_scene_DRAFT/patch_v896.py
import hashlib, json, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep

p = Path(sys.argv[1]); s = p.read_text()

# the base: the Where we are card is in, and every page function this release wraps or reads is declared once
for need in ['where885-style', 'where885-script', 'function progress881Model(', 'function timeline841Lamp(', 'function todayWorkDay841(',
             'function wxfDay(', 'function wxKind(', 'WX_WMO = {', 'function wxSrcTag(', 'function wxNoneWhy(', 'function wxSig(',
             'function wxDayHtml(', 'function wxWords(', 'function dsnBoard(', 'function timeline841ModalOpen(', '(function hostedMedia(){',
             'id="drawer"', 'gc500-work-board840', 'tw846-summary']:
    assert need in s, 'v8.96 needs ' + need
for wrapped in ['renderToday_held', 'wxfPaint']:
    assert s.count('function ' + wrapped + '(') == 1, wrapped + ' must be declared exactly once'
assert s.count('const DATA = ') == 1 and s.count("'const Scene896") == 0
assert 'scene896-style' not in s and 'scene896-script' not in s and 'const Scene896 ' not in s, 'v8.96 already applied'

# 1. the release footer: the single marker of whichever release ran last (v8.89 to v8.95), exactly once
marks = re.findall(r' · v8\.(?:89|9[0-5])\b', s)
assert len(marks) == 1 and s.count(marks[0]) == 1, 'expected one footer marker once, found %r' % marks
s = rep(s, marks[0], ' · v8.96', 'release footer', str(p))

# 2. DATA: the eight pictures join the media table (the page resolves them to /m/<link>/<file> at load) and the manifest the
#    service checks the page against is worked out again in the service's own canonical form, as v8.89 and v8.93 do.
#    Nothing else in DATA changes; the identity test proves it.
A = json.loads((here / 'atlas896.json').read_text())
assert len(A['cells']) == 8 and {c['id'] for c in A['cells']} == {'buildings', 'toilets', 'fencing', 'generators', 'lighting', 'vms', 'equipment', 'yard'}
m = re.search(r'const DATA = (\{.*?\});\n', s); assert m
D = json.loads(m.group(1))
assert json.dumps(D, ensure_ascii=False, separators=(',', ':')) == m.group(1), 'DATA must round-trip exactly'
assert D.get('hostedMedia', {}).get('schema') == 'gc500-media-v1' and isinstance(D.get('media'), dict)
for c in A['cells']:
    f = here / 'assets' / c['file']
    assert f.exists(), 'missing ' + c['file'] + ' (run make_atlas896.py)'
    b = f.read_bytes()
    assert hashlib.sha256(b).hexdigest() == c['sha256'] == c['file'][:64] and len(b) == c['bytes'] and c['type'] == 'image/webp' and c['scope'] == 'view', c['id']
    entry = {k: c[k] for k in ('file', 'sha256', 'type', 'bytes', 'scope')}
    assert D['media'].get(c['sha256'], entry) == entry, 'a different file already carries ' + c['sha256'][:12]
    D['media'][c['sha256']] = entry
def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)
assets = sorted(({k: x[k] for k in ('bytes', 'file', 'scope', 'sha256', 'type')} for x in D['media'].values()), key=lambda x: x['file'])
body = {'schema': 'gc500-media-v1', 'assets': assets}
manifest = dict(body, sha256=hashlib.sha256(canonical(body).encode('utf-8')).hexdigest())
D['hostedMedia']['manifest'] = manifest['sha256']
(p.parent / 'media_manifest_v896.json').write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')))
s = s[:m.start(1)] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]

# 3. the style before </head>, the script before the LAST </body> (after every other release's, so its wrappers are outermost)
css = (here / 'scene896.css').read_text()
js = (here / 'scene896.js').read_text()
assert js.count('/*ATLAS896*/{}') == 1
js = js.replace('/*ATLAS896*/{}', json.dumps({c['id']: c['sha256'] for c in A['cells']}, separators=(',', ':')), 1)
assert '</style' not in css and '</script' not in js
for bad, what in ((r'\$\s?\d', 'a dollar figure'), (r'(?i)site\s?iq', 'SiteIQ'), (r'(?i)\b(?:codex|claude|chatgpt|openai|anthropic|gemini)\b', 'an agent name')):
    assert not re.search(bad, js + css), 'v8.96 carries ' + what
s = s.replace('</head>', '<style id="scene896-style">' + css + '</style>\n</head>', 1)
head, tag, tail = s.rpartition('</body>')
assert tag and '<script' not in tail
s = head + '<script id="scene896-script">\n' + js + '</script>\n' + tag + tail
assert s.count('const DATA = ') == 1 and s.count('const Scene896 ') == 1
p.write_text(s)
print('v8.96 applied: Today scene; footer', marks[0].strip(), '-> v8.96; media +%d (%s bytes); manifest %s (%d files) -> media_manifest_v896.json'
      % (len(A['cells']), format(A['total_bytes'], ','), manifest['sha256'][:12], len(assets)))
