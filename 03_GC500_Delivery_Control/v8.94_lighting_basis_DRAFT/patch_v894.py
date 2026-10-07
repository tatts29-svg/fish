# Author: Andrew Fisher. v8.94: the Lighting scope counts real towers once, against the map's scope (the v8.82 source-
# classification projection, rebased), and the whole-job figure is not shown as verified unless that scope is settled.
#   - D024 drawing-only lighting symbols (LT01–LT04, LTC01–LTC12, LTC14) and source-row copies (NVLT, a copy of T0002)
#     leave the equipment register; the circuit fans become big-screen symbols (Andrew, 8 Oct 2026: "Yes they big screens
#     not light's"); their charge lines go empty; every one stays reachable (assetOf, the map, the finder, #asset/ links,
#     the drawer) with a notice saying what it is.
#   - The scope is the map (Andrew, 8 Oct 2026: "What ever the map says. If its 6 its 6"): scope_confirmed.json beside this
#     patch names the D024 keyed towers by location; each location credits what was delivered to it, up to the number D024
#     keys there; Lighting = credited ÷ towers. The build checks the file: the group scopes add up to towers, every callout
#     is a D024 keyed tower in evidence/d024_keyed_towers.json and in the page's own rows, and every record is on the page.
#   - Without the file the page stays on the unconfirmed path: Lighting over recorded scope, whole job unavailable.
#   - The Schedule (5) BOQ figure is embedded only when V882_SCHEDULE names the authorised workbook (exact hash); without it
#     the page says the reconciliation is still to be done. No number, record, DATA, hire or money changes.
# Needs v8.85 (the Where we are card). Chains after v8.89, v8.90, v8.91, v8.92 or v8.93:
#   toolchain/build.sh v8.94 <full chain …> v8.94_lighting_basis_DRAFT/patch_v894.py
import hashlib, json, os, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
for cand in (here.parent / 'toolchain', Path(os.environ.get('GC500_TOOLCHAIN', '/nonexistent'))):
    if (cand / 'rep.py').exists(): sys.path.insert(0, str(cand)); break
from rep import rep

p = Path(sys.argv[1]); s = p.read_text()
assert 'where885-script' in s and 'function progress881Model(' in s and 'function renderToday_held(' in s, 'v8.94 needs v8.85 first'
assert 'lighting894-script' not in s and 'function lighting894MapList(' not in s and '_mapContext894' not in s, 'v8.94 already applied'
assert 'lighting882' not in s, 'the v8.82 draft must not be in the base'

# 1. the release footer: whichever release this follows, exactly one marker, once
marks = re.findall(r' · v8\.(?:89|9[0-3])\b', s)
assert len(marks) == 1 and s.count(marks[0]) == 1, 'expected one footer marker once, found %r' % marks
s = rep(s, marks[0], ' · v8.94', 'release footer', str(p))

# 2. every function the script wraps is declared exactly once in the page, and the script wraps each exactly once
css = (here / 'lighting894.css').read_text(); js = (here / 'lighting894.js').read_text()
WRAPPED = ['buildAllAssets', 'assetOf', 'chargeLines', 'drawerTidy', 'todayGroupDetails841', 'todayWorkSummary848', 'progress881Model', 'renderToday_held']
READ = ['allAssets', 'deliveryOf', 'deliveryAsOf', 'assetNumbersOf', 'rentalOf', 'unitsOf', 'movedAway', 'unitsAsked', 'todayWorkDay841', 'heldMemo', 'holdAssets']
for fn in WRAPPED + READ:
    assert s.count('function ' + fn + '(') == 1, fn + ' must be declared exactly once in the page, found %d' % s.count('function ' + fn + '(')
for fn in WRAPPED:
    assert len(re.findall(r'\b' + fn + r'\s*=\s*function', js)) == 1, fn + ' must be wrapped exactly once by lighting894.js'
    assert js.count('v8.94 wrap: ' + fn) == 1, fn + ' wrap marker'
assert 'let ASSETS_HELD = null;' in s and 'let HELD_STALE775 = false;' in s, 'the held register and its stale flag are expected'

# 3. the native paths that look a reference up by key read the register's own list; a row the projection leaves out of the
#    register is still found through lighting894Context / lighting894MapList, so the map, the finder, a link and the drawer
#    still open it (with its notice). Each edit matches exactly once (rep insists).
s = rep(s, "function openAsset_held(key, opts){\n const a = allAssets().find(x => x.key === key);\n if (!a) return;",
        "function openAsset_held(key, opts){\n const a = allAssets().find(x => x.key === key) || lighting894Context(key); /* v8.94 - a drawing-only symbol or a copy still opens, with its notice */\n if (!a) return;",
        'drawer opener', str(p))
s = rep(s, "const key = m[1], a = allAssets().find(x => x.key === key);",
        "const key = m[1], a = allAssets().find(x => x.key === key) || lighting894Context(key); /* v8.94 */",
        '#asset/ link', str(p))
s = rep(s, "const hits = new Set(allAssets().filter(a => q && matches(a, q))",
        "const hits = new Set(lighting894MapList().filter(a => q && matches(a, q)) /* v8.94 - the drawing's own symbols are searchable on the sheet */",
        'map search hits', str(p))
s = rep(s, "allAssets().forEach(a => (a.drawing_links||[]).forEach(l => {\n if (l.sheet !== sh.sheet_id) return;",
        "lighting894MapList().forEach(a => (a.drawing_links||[]).forEach(l => { /* v8.94 - D024's lighting and big-screen callouts keep their link */\n if (l.sheet !== sh.sheet_id) return;",
        'map callout links', str(p))
s = rep(s, "const onSheet = sh.master ? allAssets().filter(a => MASTER_LOC[a.key] && MASTER_LOC[a.key].pt) : allAssets().filter(a => (a.drawing_links||[]).some(l => l.sheet === sh.sheet_id));",
        "const onSheet = sh.master ? lighting894MapList().filter(a => MASTER_LOC[a.key] && MASTER_LOC[a.key].pt) : lighting894MapList().filter(a => (a.drawing_links||[]).some(l => l.sheet === sh.sheet_id)); /* v8.94 - map context stays on the map */",
        'map sheet list', str(p))
s = rep(s, "function finderIndex(){\n const out = [];\n allAssets().forEach(a => {",
        "function finderIndex(){\n const out = [];\n lighting894MapList().forEach(a => { /* v8.94 - a symbol or a copy is still findable; its drawer says what it is */",
        'finder index', str(p))

# 4. the page's own rows, for the checks below (DATA is read, never changed)
start = s.index('const DATA =') + len('const DATA =')
DATA, _ = json.JSONDecoder().raw_decode(s[start:].lstrip())
rows = {a['key']: a for a in DATA['assets']}
plant = {r.get('key') for r in ((DATA.get('plant_lines') or {}).get('lines') or [])} | {r.get('task_id') for r in (DATA.get('unreferenced') or [])}
norm = lambda t: re.sub(r'[^a-z0-9]+', ' ', str(t).lower()).strip()

# 5. the confirmed state, from scope_confirmed.json beside this patch (the map is the scope); without it, the unconfirmed path
conf = None
cf = here / 'scope_confirmed.json'
if cf.exists():
    raw = json.loads(cf.read_text())
    assert isinstance(raw, dict) and set(raw) >= {'towers', 'by', 'on', 'words', 'groups'}, 'scope_confirmed.json needs towers, by, on, words and groups'
    assert isinstance(raw['towers'], int) and raw['towers'] > 0, 'towers must be a whole number above zero'
    assert re.fullmatch(r'\d{4}-\d{2}-\d{2}', str(raw['on'])), 'on must be an ISO date'
    assert all(isinstance(raw[k], str) and raw[k].strip() for k in ('by', 'words')), 'by and words must be text'
    groups = raw['groups']
    assert isinstance(groups, list) and groups, 'groups must be a non-empty list'
    assert sum(int(g['scope']) for g in groups) == raw['towers'], 'the group scopes must add up to towers: %r against %d' % ([g.get('scope') for g in groups], raw['towers'])
    keyed = {t['key']: t for t in json.loads((here / 'evidence' / 'd024_keyed_towers.json').read_text())['keyed_towers']}
    assert len(keyed) == 6 and all(t['kind'] == 'tower' for t in keyed.values()), 'evidence/d024_keyed_towers.json must hold the six D024 keyed towers'
    seen = []
    for g in groups:
        assert isinstance(g.get('name'), str) and g['name'].strip(), 'every group needs a name'
        assert isinstance(g.get('scope'), int) and g['scope'] > 0, 'every group scope must be a whole number above zero'
        assert isinstance(g.get('callouts'), list) and len(g['callouts']) == g['scope'], 'group %r must list one D024 callout per tower in its scope' % g['name']
        for k in g['callouts']:
            assert k in keyed, 'callout %s is not a D024 keyed tower in the evidence' % k
            assert norm(keyed[k]['location']) == norm(g['name']), 'callout %s is keyed to %r on D024, not to %r' % (k, keyed[k]['location'], g['name'])
            a = rows.get(k); assert a and a.get('drawing') == 'D024-26003-02' and a.get('tower_series') == 'keyed', 'callout %s is not a D024 keyed tower row on the page' % k
            assert any(l.get('tag_id') == 'tower:' + keyed[k]['label'] for l in a.get('drawing_links') or []), 'callout %s does not carry the D024 tag tower:%s' % (k, keyed[k]['label'])
            assert any(norm(loc) == norm(g['name']) for loc in a.get('locations') or []), 'callout %s is not keyed to %r on the page' % (k, g['name'])
            assert k not in seen, 'callout %s is listed twice' % k; seen.append(k)
        assert isinstance(g.get('records'), list) and g['records'], 'group %r must name the records counted against it' % g['name']
        for k in g['records']:
            assert k in rows or k in plant, 'record %s is not a row on the page' % k
    assert sorted(seen) == sorted(keyed), 'every D024 keyed tower must be in exactly one group'
    # only what the page reads goes on the page: the file's own "about" notes stay in the repo
    conf = {k: raw[k] for k in ('towers', 'by', 'on', 'words', 'groups')}
    if isinstance(raw.get('basis'), str): conf['basis'] = raw['basis']
    if isinstance(raw.get('surplus'), dict): conf['surplus'] = {k: raw['surplus'][k] for k in ('by', 'on', 'words') if k in raw['surplus']}
boq = None
if os.environ.get('V882_SCHEDULE'):
    import openpyxl
    sched = Path(os.environ['V882_SCHEDULE']); sha = hashlib.sha256(sched.read_bytes()).hexdigest()
    assert sha == '6383ebdd66b2293453de07f85fd1812398d171c7ab75b2fad22196bbca8d4761', 'V882_SCHEDULE is not the authorised Schedule (5) workbook'
    w = openpyxl.load_workbook(sched, read_only=True, data_only=True, keep_links=False)
    vals = [r[2] for r in w['BOQ'].values if str(r[0] or '').strip() == 'Light Tower' and str(r[1] or '').strip() == 'Light Tower']
    assert len(vals) == 1 and isinstance(vals[0], (int, float)) and vals[0] > 0, 'one positive Light Tower BOQ row expected'
    boq = int(vals[0]) if float(vals[0]).is_integer() else float(vals[0])
assert js.count('/*__CONFIRMED894__*/null') == 1 and js.count('/*__BOQ894__*/null') == 1
js = js.replace('/*__CONFIRMED894__*/null', '/*__CONFIRMED894__*/' + json.dumps(conf, ensure_ascii=False), 1).replace('/*__BOQ894__*/null', '/*__BOQ894__*/' + json.dumps(boq), 1)

# 6. nothing that must not be on the page, then the style and the script
assert '</style' not in css and '</script' not in js
for bad, what in ((r'\$\s?\d', 'a dollar figure'), (r'(?i)site\s?iq', 'SiteIQ'), (r'(?i)\b(?:codex|claude|chatgpt|openai|anthropic)\b', 'an agent name')):
    assert not re.search(bad, js + css), 'v8.94 carries ' + what
s = s.replace('</head>', '<style id="lighting894-style">' + css + '</style>\n</head>', 1)
head, tag, tail = s.rpartition('</body>')
assert tag and '<script' not in tail
s = head + '<script id="lighting894-script">\n' + js + '</script>\n' + tag + tail
p.write_text(s)
print('v8.94 applied: Lighting scope projection; footer', marks[0].strip(), '-> v8.94;',
      ('scope confirmed: the map\'s %d towers (%s), by %s on %s' % (conf['towers'], '; '.join('%d at the %s' % (g['scope'], g['name']) for g in conf['groups']), conf['by'], conf['on'])) if conf else 'scope unconfirmed (no scope_confirmed.json beside the patch)', ';',
      ('Schedule (5) BOQ: %s light towers from the authorised workbook' % boq) if boq is not None else 'Schedule (5) BOQ: reconciliation still to be done (no V882_SCHEDULE)')
