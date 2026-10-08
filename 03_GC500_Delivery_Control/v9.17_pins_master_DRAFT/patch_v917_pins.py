# Author: Andrew Fisher. v9.17 - every navigation pin exact to the 2 Oct master (D001-26003-03).
#
# The project manager, 8 Oct 2026: pin locations "needs to be 100% accurate ... working off the new master sheet we need to
# pin things right to where things need to go" and "needs to be 10/10". The audit of every pin against the 2 Oct master is
# finished; this release is its result. Draft until he says yes; the publisher sets the footer.
#
# PART 1 - 23 pins move onto the unit the master draws (single unit = its centre, group = the middle of its footprint):
#   MASTER_LOC[ref].ll, .pt, .how and .img (two close-ups re-made with the ring on the unit) for exactly the 23 below.
#   Each point was re-derived from the PDF (tests/derive917.py -> evidence/derive917.json, ll within 0.2 m and pt within
#   0.3 pt of the point listed here); the pictures are tests/make_thumbs917.py -> evidence/thumbs917.json.
# PART 2 - one point per reference: the drop email's "Sat nav" line and button, the drawer's satellite panel (Approx.
#   position, Copy, Street View, Google Earth, From Coates Kingston), the drawer's "Where it is" links and the map pin /
#   search spot read the point Navigate uses (dest782) instead of the drawing callout (aerialPointFor) or their own pin.
#   After the 8 Oct review, the rest of it too: the printed drop sheet's "Sat nav" and its pictures, the driver card's
#   "Ground position", the drop email's "Pinned on site" (no second, unverified master position for the big screens), and
#   every picture or map pin that rings the point (Today's day cards, the banner map, the drop email and driver page
#   pictures, the search aerial, the drawer's satellite window, the 3D fly-to, the gate bearing in the two mail-outs) -
#   through aerialNav917(a), the callout's frame point with Navigate's point put in its place.
#   No Navigate point changes because of this part.
# PART 3 - wording: the 23 map-layer items labelled "Entry point" read "Emergency egress point (E.P)", as the master's
#   legend says ("E.P = EMERGENCY EGRESS POINTS"). Their buttons are unchanged.
# Media: +46 / -46 pictures; the media manifest is rewritten and written beside the page (media_manifest_v917.json).
# Not touched: every other pin, the record, the footer, money. No record writes.
#
#   toolchain/build.sh v917_pins v9.17_pins_master_DRAFT/patch_v917_pins.py
import hashlib, json, math, re, sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep

p = Path(sys.argv[1]); raw = p.read_bytes(); bom = raw.startswith(b'\xef\xbb\xbf'); s = raw.decode('utf-8-sig')
if 'function navPoint917(' in s:
    sys.exit('v9.17 is already applied to this page - stopping')

# THE ASK: the 23 references and their points (ll; pt in the page's MASTER_LOC frame)
MOVES = {
 'CP1': ([-27.997497, 153.428419], [0.90691, 0.74989]), 'WC09': ([-27.984717, 153.428026], [0.28309, 0.36190]),
 'WC81': ([-27.997509, 153.428455], [0.90777, 0.74687]), 'WC24': ([-27.991038, 153.429656], [0.69952, 0.22861]),
 'WC35': ([-27.981799, 153.427761], [0.09098, 0.38321]), 'WC65': ([-27.981478, 153.426408], [0.06965, 0.49494]),
 'T0243': ([-27.987534, 153.428271], [0.46865, 0.34230]), 'WC26': ([-27.988803, 153.429594], [0.55233, 0.23323]),
 'WC68': ([-27.981498, 153.424438], [0.07069, 0.65768]), 'WC86': ([-27.987704, 153.428229], [0.47980, 0.34581]),
 'WC25': ([-27.990061, 153.428838], [0.63504, 0.29600]), 'WC34': ([-27.982306, 153.425877], [0.12406, 0.53895]),
 'WC70': ([-27.981659, 153.424041], [0.08120, 0.69052]), 'WC19': ([-27.988240, 153.428267], [0.51508, 0.34275]),
 'WC16': ([-27.985938, 153.427692], [0.36349, 0.38981]), 'WC17': ([-27.986529, 153.428095], [0.40243, 0.35660]),
 'WC44': ([-27.988968, 153.428254], [0.56304, 0.34401]), 'WC39': ([-27.983626, 153.423993], [0.21069, 0.69494]),
 'WC62': ([-27.981667, 153.429218], [0.08252, 0.26278]), 'WC04': ([-27.983857, 153.426516], [0.22627, 0.48648]),
 'WC02': ([-27.983618, 153.425700], [0.21045, 0.55392]), 'WC28': ([-27.983401, 153.429161], [0.19664, 0.26785]),
 'WC50': ([-27.989786, 153.429821], [0.61709, 0.21476])}
assert len(MOVES) == 23

DER = json.loads((here / 'evidence' / 'derive917.json').read_text())
TH = json.loads((here / 'evidence' / 'thumbs917.json').read_text())
assert DER['pdf_sha256'].startswith('8753d875') and TH['pdf_sha256'] == DER['pdf_sha256'], 'the evidence must come from the 2 Oct master'
assert not DER['fails'] and set(DER['rows']) == set(MOVES) == set(TH['pins']), 'the PDF re-derivation must pass for exactly the 23'
for ref, (ll, pt) in MOVES.items():
    r = DER['rows'][ref]
    assert r['listed_ll'] == ll and r['listed_pt'] == pt and r['within_tolerance'], ref + ': the listed point is not the one the PDF re-derivation checked'
    assert r['listed_vs_derived_m'] <= 0.2 and r['listed_vs_derived_pt'] <= 0.3, ref + ': outside tolerance'
assert len(TH['media']) == 46

# what each pin now says about itself (MASTER_LOC.how; the drawer reads it after "Read off the master plan D001-26003-03:")
KIND = {'toilet': ('toilet', 'toilets'), 'accessible': ('accessible toilet', 'accessible toilets'), 'block': ('toilet block', 'toilet blocks'), 'pee': ('pee panel', 'pee panels')}
def how_for(ref, r):
    k = r['unit_kinds']; n = r['n_parts']; tag = '' if r['tag_to_unit_m'] is None or r['tag_to_unit_m'] < 1.5 else \
        '; its %s tag is printed about %d m from it' % (ref, max(1, round(r['tag_to_unit_m'])))
    if ref == 'CP1':  # CP1 is P68, the Signevent crib room; the master tags the building P68 in its Cypress car park inset
        return ('the P68 building drawn on the master D001 issued 2 Oct, in its Cypress car park inset, at its centre'
                ' — the older D022 rev 02 callout CP1 ends about %d m %s of it' % (round(r['moves_m']), OPP[r['moves_dir']]))
    if ref == 'T0243':  # WC-TV on the schedule; the master prints WC on the same block
        return ('the WC-TV toilet block drawn on the master D001 issued 2 Oct, at its centre; the master prints WC on it'
                ' — the older D023 rev 02 callout WCTV ends about %d m %s of it' % (round(r['moves_m']), OPP[r['moves_dir']]))
    if ref == 'WC09':
        return ('the middle of the compound drawn on the master D001 issued 2 Oct, between its two toilet blocks: 2 toilet blocks, '
                '4 toilets and 6 pee panels' + tag)
    if n == 1:
        (kind, _), = [(KIND[x], 1) for x in k]
        return 'the %s drawn on the master D001 issued 2 Oct, at its centre%s' % (kind[0], tag)
    (kind, cnt), = k.items()
    extra = ' (it moved about 9 m from the 17 Sep issue)' if ref == 'WC39' else ''
    return 'the middle of the %d %s drawn on the master D001 issued 2 Oct%s%s' % (cnt, KIND[kind][1], extra, tag)
OPP = {'north': 'south', 'north-east': 'south-west', 'east': 'west', 'south-east': 'north-west', 'south': 'north', 'south-west': 'north-east', 'west': 'east', 'north-west': 'south-east'}

# 1. MASTER_LOC: the 23, nothing else
m = re.search(r'const MASTER_LOC = ', s); assert m and s.count('const MASTER_LOC = ') == 1
ML, end = json.JSONDecoder().raw_decode(s[m.end():]); orig = s[m.end():m.end() + end]
fmt = next((f for f in (dict(ensure_ascii=a, separators=sep) for a in (True, False) for sep in ((',', ':'), (', ', ': '))) if json.dumps(ML, **f) == orig), None)
assert fmt, 'MASTER_LOC must round-trip exactly - stopping'
OLD_ML = json.loads(orig)
for ref, (ll, pt) in MOVES.items():
    v = ML[ref]; r = DER['rows'][ref]
    # the base must be the page the audit read: each pin exactly where the audit found it
    assert v['ll'] == r['page_now_ll'] and v['pt'] == r['page_now_pt'] and v['img'] == TH['pins'][ref]['old_img'], ref + ': the base pin is not as audited - stopping'
    assert 'pts' not in v and not v.get('confirmed') and not v.get('unverified'), ref + ': unexpected fields'
    v['ll'] = list(ll); v['pt'] = list(pt); v['how'] = how_for(ref, r); v['img'] = list(TH['pins'][ref]['img'])
    assert not re.search(r'^[^—]*\(.*rev 02', v['how']), ref + ': a bracket before the dash would cut the drawer\'s "Drawings differ" line'
s = s[:m.end()] + json.dumps(ML, **fmt) + s[m.end() + end:]
assert {k: v for k, v in ML.items() if k not in MOVES} == {k: v for k, v in OLD_ML.items() if k not in MOVES}

# 2. MASTER_LAYERS: the 23 "Entry point" labels (Part 3); their layer, face, note, position and buttons are unchanged
m = re.search(r'const MASTER_LAYERS = ', s); assert m and s.count('const MASTER_LAYERS = ') == 1
LAY, end = json.JSONDecoder().raw_decode(s[m.end():]); orig = s[m.end():m.end() + end]
fmt2 = next((f for f in (dict(ensure_ascii=a, separators=sep) for a in (True, False) for sep in ((',', ':'), (', ', ': '))) if json.dumps(LAY, **f) == orig), None)
assert fmt2, 'MASTER_LAYERS must round-trip exactly - stopping'
ep = [x for x in LAY if x.get('label') == 'Entry point']
assert len(ep) == 23 and all(x['layer'] == 'ep' and x['face'] == 'EP' for x in ep), 'expected the 23 E.P items'
for x in ep: x['label'] = 'Emergency egress point (E.P)'
s = s[:m.end()] + json.dumps(LAY, **fmt2) + s[m.end() + end:]

# 3. DATA: media +46 / -46 and the manifest; nothing else in DATA changes
m = re.search(r'const DATA = (\{.*?\});\n', s); assert m
D = json.loads(m.group(1)); assert json.dumps(D, ensure_ascii=False, separators=(',', ':')) == m.group(1), 'DATA must round-trip exactly - stopping'
ORIG_KEYS = {k: json.dumps(v, ensure_ascii=False, sort_keys=True) for k, v in D.items() if k not in ('media', 'hostedMedia')}
def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)
def manifest_of(D):
    assets = sorted(({k: x[k] for k in ('bytes', 'file', 'scope', 'sha256', 'type')} for x in D['media'].values()), key=lambda x: x['file'])
    body = {'schema': 'gc500-media-v1', 'assets': assets}
    return dict(body, sha256=hashlib.sha256(canonical(body).encode('utf-8')).hexdigest())
assert manifest_of(D)['sha256'] == D['hostedMedia']['manifest'], "the base page's manifest is not the canonical digest of its own media - stopping"
n0 = len(D['media']); dropped = []
for ref in MOVES:
    for sha in OLD_ML[ref]['img']:
        assert sha in D['media'] and s.count(sha) == 3, ref + ': old picture ' + sha[:12] + ' is still used elsewhere - stopping'
        D['media'].pop(sha); dropped.append(sha)
for x in TH['media']:
    assert x['sha256'] not in D['media'] and x['file'] == x['sha256'] + '.webp'
    D['media'][x['sha256']] = {k: x[k] for k in ('file', 'sha256', 'type', 'bytes', 'scope')}
assert len(dropped) == 46 and len(D['media']) == n0
MAN = manifest_of(D); D['hostedMedia']['manifest'] = MAN['sha256']
assert {k: json.dumps(v, ensure_ascii=False, sort_keys=True) for k, v in D.items() if k not in ('media', 'hostedMedia')} == ORIG_KEYS
s = s[:m.start(1)] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[m.end(1):]
(p.parent / 'media_manifest_v917.json').write_text(json.dumps(MAN, ensure_ascii=False, separators=(',', ':')))

# 4. Part 2 code: one point per reference
s = rep(s, "function destOwn782(a){", """/* v9.17 - one point per reference (Author: Andrew Fisher). Every surface that hands somebody a point to drive or walk to
   reads the one Navigate uses: dest782. The drop email's Sat nav line and button, the drawer's satellite panel and its
   "Where it is" links, and the map pin / search spot used to read the drawing callout (aerialPointFor, the older rev 02
   sheets) or their own pin, so the same reference could carry two points. */
function navPoint917(a){ let D = null; try { D = dest782(a); } catch (e) { D = null; } return D && D.ll && Number.isFinite(D.ll.lat) && Number.isFinite(D.ll.lon) ? D : null; }
function navOwn917(D){ return !!D && (D.kind === 'report' || D.kind === 'desc'); }
/* v9.17 - the same point on the aerial photograph, for every picture and map pin that rings "where it goes": the
   drawing callout's frame point with Navigate's point put in its place. Only where the picture already had a point (a
   reference with no callout keeps no picture); the pit lane (no drop-off set) is where the driver reports, not where
   the thing goes, so a picture of it keeps the drawn spot; Navigate's point off the photograph gives no picture. */
function aerialNav917(a){
 let pt = null; try { pt = aerialPointFor(a); } catch (e) { pt = null; }
 if (!pt) return null;
 const D = navPoint917(a); if (!D || D.kind === 'report') return pt;
 const f = frameOf(D.ll.lat, D.ll.lon);
 if (!f || !(f.ax >= 0 && f.ax <= 1 && f.ay >= 0 && f.ay <= 1)) return null;
 return Object.assign({}, pt, {ax: f.ax, ay: f.ay, fromArrow: false, nav917: D});
}
function destOwn782(a){""", 'v9.17 helper', str(p))
# the drop email: Sat nav line, From Coates Kingston and the button
s = rep(s, "const pt = aerialPointFor(a), ll = pt ? lonLatOf(pt.ax, pt.ay) : null;\n const op = pt ? null : offPlanFor(a);",
        " const D917 = navPoint917(a), pt = aerialNav917(a), ll = D917 ? D917.ll : pt ? lonLatOf(pt.ax, pt.ay) : null; /* v9.17 - Navigate's point */\n const op = pt ? null : offPlanFor(a);",
        'drop email point', str(p))
s = rep(s, "<span style=\"color:${MUTE}\">— it drops you at the area, not on the spot.</span>",
        "<span style=\"color:${MUTE}\">— ${D917 ? 'the same point as the button below (' + e(D917.sms) + '); a satnav stops at the nearest road' : 'it drops you at the area, not on the spot'}.</span>",
        'drop email Sat nav words', str(p))
s = rep(s, "const to = pf && pf.lat != null ? {lat: pf.lat, lon: pf.lon} : ll;",
        " const to = D917 ? D917.ll : pf && pf.lat != null ? {lat: pf.lat, lon: pf.lon} : ll, pinned917 = !navOwn917(D917) && pf && pf.lat != null;",
        'drop email button point', str(p))
s = rep(s, "${pf && pf.lat != null ? 'Open the pinned spot in maps' : 'Open it in maps'}",
        "${pinned917 ? 'Open the pinned spot in maps' : 'Open it in maps'}", 'drop email button words', str(p))
# the drawer's satellite panel: Approx. position, Copy, Street View, Google Earth, From Coates Kingston (Navigate already reads dest782)
s = rep(s, "${(() => { const ll = lonLatOf(pt.ax, pt.ay); const g = DATA.georef; return ll ? `<p class=\"satcap pos\">",
        " ${(() => { const D917 = navPoint917(a), ll = D917 ? D917.ll : lonLatOf(pt.ax, pt.ay); const g = DATA.georef; return ll ? `<p class=\"satcap pos\">",
        'satellite panel point', str(p))
s = rep(s, "<span class=\"sub\">— the callout's spot on the drawing through a ±${esc(String(g.fit_worst_m))} m registration:",
        " <span class=\"sub\">— ${D917 ? 'the same point as Navigate (' + esc(D917.label) + ')' : 'the callout\\'s spot on the drawing through a ±' + esc(String(g.fit_worst_m)) + ' m registration'}:",
        'satellite panel words', str(p))
# the drawer's "Where it is - master plan" links (where Navigate goes elsewhere - the pit lane for the big screens - they follow it and say so)
s = rep(s, "if (mu) { const ll = {lat: mu.ll[0], lon: mu.ll[1]}, others = (mu.pts || []).filter(p => p[0] !== mu.ll[0] || p[1] !== mu.ll[1]);",
        " if (mu) { const D917 = navPoint917(a), ll = D917 ? {lat: D917.ll.lat, lon: D917.ll.lon} : {lat: mu.ll[0], lon: mu.ll[1]}, others = (mu.pts || []).filter(p => p[0] !== mu.ll[0] || p[1] !== mu.ll[1]);\n"
        "  const away917 = D917 ? haversineKm(ll, {lat: mu.ll[0], lon: mu.ll[1]}) * 1000 : 0;",
        'drawer master links point', str(p))
s = rep(s, "<div class=\"pinwhat\"><span class=\"mono\">${ll.lat.toFixed(6)}, ${ll.lon.toFixed(6)}</span>\n <span class=\"pinacts\">",
        " <div class=\"pinwhat\"><span class=\"mono\">${mu.ll[0].toFixed(6)}, ${mu.ll[1].toFixed(6)}</span>\n"
        " ${away917 > 0.5 ? `<span class=\"w\">Drive there, Walk to it and Earth go where Navigate goes: ${esc(D917.nav || D917.sms || D917.label)}.</span>` : ''}\n <span class=\"pinacts\">",
        'drawer master links words', str(p))
# the map pin menu / search view spot
s = rep(s, """function spotOf(a){
 if (!a) return null;
 const t = navTargetFor(a); if (!t || !t.ll) return null;
 const words = t.pinned ? 'the pin ' + ((t.fix && t.fix.by) || 'somebody') + ' took standing at it' + (t.fix && t.fix.at ? ' (' + fmtStamp(t.fix.at) + ')' : '')
 : t.placed ? 'the position ' + ((t.place && t.place.by) || 'somebody') + ' placed for it — nobody has stood at it yet'
 : 'the drawing\\'s area for it — a callout registered to the ground, not a survey';
 return {a, t, lat: t.ll.lat, lon: t.ll.lon, words};
}""", """function spotOf(a){
 if (!a) return null;
 const t0 = navTargetFor(a), D917 = navPoint917(a); /* v9.17 - Navigate's point */
 if (!D917 && (!t0 || !t0.ll)) return null;
 const ll = D917 ? D917.ll : t0.ll, t = t0 && t0.ll ? t0 : {ll: ll, pinned: false, key: a.key, fix: null};
 const words = navOwn917(D917) || !(t0 && t0.ll) ? (D917.nav || D917.sms || D917.label)
 : t.pinned ? 'the pin ' + ((t.fix && t.fix.by) || 'somebody') + ' took standing at it' + (t.fix && t.fix.at ? ' (' + fmtStamp(t.fix.at) + ')' : '')
 : t.placed ? 'the position ' + ((t.place && t.place.by) || 'somebody') + ' placed for it — nobody has stood at it yet'
 : 'the drawing\\'s area for it — a callout registered to the ground, not a survey';
 return {a, t, lat: ll.lat, lon: ll.lon, words};
}""", 'map pin spot', str(p))
assert 'function haversineKm(' in s and 'function frameOf(' in s

# 5. Part 2, the rest of it (review of 8 Oct 2026): every remaining surface that prints a point, or rings one on a picture
#    or a map, reads Navigate's point too.
# 5a. the printed drop sheet: "Sat nav" and the steps' bearing from the gate; its pictures (below) ring the same point
s = rep(s, """function dropSteps(a, pt){
 const acc = DATA.access || {}, rules_c = DATA.driver_rules || {};
 const gate = heavyGate();
 const ll = pt ? lonLatOf(pt.ax, pt.ay) : null;""", """function dropSteps(a, pt){
 const acc = DATA.access || {}, rules_c = DATA.driver_rules || {};
 const gate = heavyGate();
 const D917 = navPoint917(a), ll = D917 ? D917.ll : pt ? lonLatOf(pt.ax, pt.ay) : null; /* v9.17 - the drop sheet: Navigate's point */""",
        'drop sheet point', str(p))
s = rep(s, """ll ? ` <b>Sat nav:</b> <span class="mono">${esc(ll.text)}</span> — it drops you at the area, not on the spot.` : ''}</div>` : ''}""",
        """ll ? ` <b>Sat nav:</b> <span class="mono">${esc(ll.text)}</span> — ${D917 ? 'the same point as Navigate (' + esc(D917.sms || D917.label) + ')' : 'it drops you at the area, not on the spot'}.` : ''}</div>` : ''}""",
        'drop sheet words', str(p))
s = rep(s, "${dropSteps(a, aerialPointFor(a))}", "${dropSteps(a, aerialNav917(a))}", 'drop sheet steps point', str(p))
# 5b. the drop sheet's four pictures (the ring and the bearing) and its words where there is no picture but there is a point
s = rep(s, "const pt = aerialPointFor(a);\n const onGround = pt && DATA.aerial_hi;",
        "const pt = aerialNav917(a); /* v9.17 - the ring is on Navigate's point */\n const onGround = pt && DATA.aerial_hi;", 'drop sheet pictures', str(p))
s = rep(s, "No aerial photo and no sat nav point for this one.</b> ${esc(offPlanWords(op))}",
        "${navPoint917(a) ? 'No aerial photo for this one.</b> ' + esc(offPlanWords(op)) + ' The Sat nav point below is the one Navigate uses (' + esc(navPoint917(a).label) + ').' : 'No aerial photo and no sat nav point for this one.</b> ' + esc(offPlanWords(op))}",
        'drop sheet no-photo words', str(p))
# and where the callout is off the main plan (CP1, in the Cypress inset) but Navigate has the master's point, the steps say
# which point the Sat nav line is instead of "the spot on the ground is not on it" (the drop sheet and the drop email)
s = rep(s, "' The drawing on this page is the callout; the spot on the ground is not on it.'",
        "(D917 ? ' The Sat nav point above is the one Navigate uses (' + esc(D917.label) + ').' : ' The drawing on this page is the callout; the spot on the ground is not on it.')",
        'drop sheet off-plan words', str(p))
s = rep(s, "steps.push(['Ring the supervisor before you leave the yard.', op ? e(offPlanWords(op)) :",
        "steps.push(['Ring the supervisor before you leave the yard.', op ? e(offPlanWords(op)) + (D917 ? ' The Sat nav point above is the one Navigate uses (' + e(D917.label) + ').' : '') :",
        'drop email off-plan words', str(p))
# 5c. the drawer's driver card: Ground position
U = chr(92) + 'u2014'
s = rep(s, """<tr><td>Ground position</td><td>${(() => { const g = pt && lonLatOf(pt.ax, pt.ay);
 return g ? esc(g.text) + ' """ + U + """ read off the drawing through the photograph, not surveyed'""",
        """<tr><td>Ground position</td><td>${(() => { const D917 = navPoint917(a), g = D917 ? D917.ll : pt && lonLatOf(pt.ax, pt.ay);
 return g ? esc(g.text) + (D917 ? ' """ + U + """ the same point as Navigate (' + esc(D917.label) + ')' : ' """ + U + """ read off the drawing through the photograph, not surveyed')""",
        'driver card ground position', str(p))
# 5d. the drop email's "Pinned on site": a master-plan position that is not where Navigate goes (the 13 big screens, whose
#     master position is not verified, go to the pit lane) is not a pin taken on site and is not offered as a second place
#     to drive or walk to; one line says so, without a second coordinate (the drawer keeps it, with its note)
s = rep(s, "(() => { const fx = [a.key].concat(pinUnits(a).map(u => fixKey(a.key, u))).map(k => [k, fixOf(k)]).filter(x => x[1] && x[1].lat != null);\n",
        "(() => { const fx0 = [a.key].concat(pinUnits(a).map(u => fixKey(a.key, u))).map(k => [k, fixOf(k)]).filter(x => x[1] && x[1].lat != null);\n"
        " const away917 = x => !!(D917 && x[1].master && haversineKm({lat: x[1].lat, lon: x[1].lon}, D917.ll) * 1000 > 0.5), fx = fx0.filter(x => !away917(x)), aside917 = fx0.filter(away917); /* v9.17 */\n"
        " const note917 = aside917.length ? '<br><br><span style=\"color:' + MUTE + '\">' + aside917.map(([k, f]) => e(fixParse(k).ref)).join(', ') + ' also has a drawing position that is not verified on the master plan, so it is not offered here: the Sat nav line and the button go to ' + e(D917.nav || D917.sms || D917.label) + '.</span>' : '';\n",
        'drop email pins', str(p))
s = rep(s, "return fx.length ? '<br><br><b>Pinned on site'", "return note917 + (fx.length ? '<br><br><b>Pinned on site'", 'drop email pins start', str(p))
s = rep(s, "goes to the pin itself, which is the one that puts you on the spot.</span>' : ''; })()}", " goes to the pin itself, which is the one that puts you on the spot.</span>' : ''); })()}",
        'drop email pins end', str(p))
# 5e. the pictures and map pins that ring the point elsewhere: Today's day card map and pictures, the banner map pins, the
#     drop email's and driver page's pictures, the search's aerial, the drawer's satellite window, the 3D fly-to, and the
#     bearing from the gate in the two mail-outs
s = rep(s, "let pt = null; try { pt = aerialPointFor(a); } catch (e) { pt = null; }\n if (!pt) return '';",
        "let pt = null; try { pt = aerialNav917(a); } catch (e) { pt = null; } /* v9.17 */\n if (!pt) return '';", 'day card map', str(p))
s = rep(s, "title=\"the satellite, centred on ${esc(a.key)}'s point on the plan - a drawing callout, not a surveyed position\"",
        " title=\"the satellite, centred on ${esc(a.key)}'s point on the plan - ${pt.nav917 ? 'the same point as Navigate (' + esc(pt.nav917.label) + ')' : 'a drawing callout'}, not a surveyed position\"",
        'day card map words', str(p))
s = rep(s, "let pt = null; try { pt = aerialPointFor(a); } catch (e) { pt = null; }\n const air = (DATA.sheets",
        "let pt = null; try { pt = aerialNav917(a); } catch (e) { pt = null; } /* v9.17 */\n const air = (DATA.sheets", 'day card pictures', str(p))
s = rep(s, "'the registered aerial at the callout’s point — where the drawing says it goes, not a surveyed position'",
        "(pt.nav917 ? 'the registered aerial at the same point as Navigate (' + pt.nav917.label + ') — not a surveyed position' : 'the registered aerial at the callout’s point — where the drawing says it goes, not a surveyed position')",
        'day card pictures words', str(p))
s = rep(s, "let pt = null; try { pt = aerialPointFor(a); } catch (e) { pt = null; }\n if (!pt) { missing.push(a.key); continue; }",
        "let pt = null; try { pt = aerialNav917(a); } catch (e) { pt = null; } /* v9.17 */\n if (!pt) { missing.push(a.key); continue; }", 'banner map pins', str(p))
s = rep(s, "function dropPics(a){\n const pt = aerialPointFor(a);", "function dropPics(a){\n const pt = aerialNav917(a); /* v9.17 */", 'drop email pictures', str(p))
s = rep(s, "pt: as.length ? aerialPointFor(as[0]) : null}", "pt: as.length ? aerialNav917(as[0]) : null}", 'driver page picture (typed drop)', str(p))
s = rep(s, "basis: 'the drawing callout for ' + a.key + ' — a drawing position, not a survey', pt: aerialPointFor(a)};",
        "basis: (aerialNav917(a) || {}).nav917 ? 'the same point as Navigate for ' + a.key + ' (' + aerialNav917(a).nav917.label + ')' : 'the drawing callout for ' + a.key + ' — a drawing position, not a survey', pt: aerialNav917(a)}; /* v9.17 */",
        'driver page picture', str(p))
s = rep(s, "const pt = aerialPointFor(a); if (!pt || !DATA.aerial_hi) { box.innerHTML = ''; return; }",
        "const pt = aerialNav917(a); if (!pt || !DATA.aerial_hi) { box.innerHTML = ''; return; } /* v9.17 */\n const at917 = pt.nav917 ? 'the same point as Navigate (' + esc(pt.nav917.label) + ')' : 'callout ' + esc(pt.label);",
        'search aerial', str(p))
s = rep(s, '<div class="satbox fvaer"><img src="${DATA.aerial_hi}" alt="Aerial photograph centred on callout ${esc(pt.label)}"',
        '<div class="satbox fvaer"><img src="${DATA.aerial_hi}" alt="Aerial photograph centred on ${at917}"', 'search aerial alt', str(p))
s = rep(s, "— the Queensland aerial photograph centred on callout ${esc(pt.label)}${pt.sheet && pt.sheet.sheet_id ? ' on ' + esc(pt.sheet.sheet_id) : ''}: the drawing registered to the photograph, a callout's place and not a survey.",
        " — the Queensland aerial photograph centred on ${at917}${!pt.nav917 && pt.sheet && pt.sheet.sheet_id ? ' on ' + esc(pt.sheet.sheet_id) : ''}: ${pt.nav917 ? 'a registered photograph, not a survey' : 'the drawing registered to the photograph, a callout\\'s place and not a survey'}.",
        'search aerial words', str(p))
s = rep(s, "state.satPt = aerialPointFor(a);", "state.satPt = aerialNav917(a); /* v9.17 */", 'drawer satellite window', str(p))
s = rep(s, "if (a) { const pt = aerialPointFor(a); const ll = pt && lonLatOf(pt.ax, pt.ay); if (ll) return {lat: ll.lat, lon: ll.lon, key: f.key",
        "if (a) { const pt = aerialNav917(a); const ll = pt && (pt.nav917 ? pt.nav917.ll : lonLatOf(pt.ax, pt.ay)); if (ll) return {lat: ll.lat, lon: ll.lon, key: f.key",
        '3D fly-to', str(p))
s = rep(s, "const gate = heavyGate(), pt = a ? aerialPointFor(a) : null;", "const gate = heavyGate(), pt = a ? aerialNav917(a) : null; /* v9.17 */", 'breakdown mail bearing', str(p))
s = rep(s, "const pt = aerialPointFor(a), link = (a.drawing_links || [])[0], gate = heavyGate();",
        "const pt = aerialNav917(a), link = (a.drawing_links || [])[0], gate = heavyGate(); /* v9.17 */", 'reference mail bearing', str(p))
p.write_bytes((b'\xef\xbb\xbf' if bom else b'') + s.encode('utf-8'))
print('v9.17 pins: MASTER_LOC 23 moved (ll, pt, how, img) | layers 23 E.P labels | media +46/-46 (%d) manifest %s | Part 2: drop email, drop sheet, driver card, satellite panel, drawer links, map spot, pictures -> dest782 | footer unchanged'
      % (len(D['media']), MAN['sha256'][:16]))
