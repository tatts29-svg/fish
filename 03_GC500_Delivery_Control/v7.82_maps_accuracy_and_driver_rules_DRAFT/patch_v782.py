#!/usr/bin/env python3
r"""v7.82 - maps accuracy and driver rules. Author: Andrew Fisher. Apply to the live page (v7.80 or later).

Andrew, 2 Oct 2026: "you have picked locations that don't exist. Example GN21 - where did you get that location
from? If we go to the generator map we can then find the correct location." And: if a location is not on the master,
go back to the unit's own map, find it, and add it to the master; never make one up.

  1. Generators on the master (GN21 and eleven more). The 27 Sep trace (locations_from_master_27sep/trace.py) followed the wrong leader line from
     callout 021 on D024, where it crosses 012's, and put GN21 by Gate 2 / Commodore Dr, 423 m away. D024's own 021
     arrow lands beside 020's at the west end of the pit lane (evidence/D024_gn20_21.jpg). GN21 now reads that arrow.
     Every other master position was compared with its own drawing (evidence/crosscheck_master_vs_own_drawing.json, README): none else is wrong.
  2. Driver rules, in the Text it message, its Full details and the asset drawer:
     - Main Beach Pde entry by side (Andrew's marked map, evidence/andrew_main_beach_entry_route_02Oct2026.jpg):
       a seaside drop comes in at the Seaworld Dr roundabout (north) end and drives south; a land-side drop
       (e.g. S08) enters from the Surfers Paradise (south) end and drives north, the way the race cars go.
       The side is worked out from the drop's position against Main Beach Pde's line (TomTom, evidence/).
     - Delivery order: waste tank before the toilet block that sits on it; P03, then P01, then P05; P05 only after
       WC05 (tank, then toilet block) is in; P04 after WC05; GN21 (60 kVA, tight spot) before GN20 (350 kVA).
     - Stagger arrivals: the site is congested every Supercars event week.
     - Parks: watch for wildlife and low branches; very tight in places; escorted (the existing rule).
  No record writes. The rules are the project manager's, stated as his.
    python3 patch_v782.py <page.html>"""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
HERE = os.path.dirname(os.path.abspath(__file__))
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function mbpSide782(' in t: sys.exit('v7.82 already applied')
if 'function dropSmsText(' not in t or 'const MASTER_LOC = ' not in t: sys.exit('v7.82 needs the live v7.79+ page')

# 1. Generators on the master: every one now sits on its own orange generator symbol on the master D001 (Andrew,
# 2 Oct: "you can see an orange mark that looks like a generator ... go to where the arrow is"). The 27 Sep trace used the
# end of each D024 arrow, which lands beside the symbol (on the road, the fence line or the next building), and for GN21
# it followed the wrong arrow altogether (423 m away by Gate 2). Positions: evidence/generators_on_their_master_symbol.json,
# read off D001 and turned into latitude and longitude through the 12 nearest unit tags (worst fit 0.1 m).
GEN = json.load(open(os.path.join(HERE, 'evidence', 'generators_on_their_master_symbol.json')))
start = t.index('const MASTER_LOC = ')
for ref, g in GEN.items():
    k = t.index('"' + ref + '":{', start); obj_at = k + len('"' + ref + '":')
    old, end = json.JSONDecoder().raw_decode(t, obj_at)
    if not str(old.get('how', '')).startswith('leader line from callout'): sys.exit(ref + ' on the master is not the 27 Sep arrow reading - review before applying')
    new = dict(old)
    new['ll'] = g['ll']; new['pt'] = g['pt']
    new['how'] = ('the orange generator symbol on the master D001, at the end of callout ' + old['how'].split('callout ')[1].split(' ')[0] + "'s line on D024"
                  + (' (corrected 2 Oct 2026: the 27 Sep trace had followed the wrong line to Gate 2, 423 m away)' if ref == 'GN21' else ' (corrected 2 Oct 2026: it was ' + str(g['moved_m']) + ' m off, at the arrow\'s end)' if g['moved_m'] >= 2 else ''))
    if ref == 'GN21': new['near'] = ['S13 (~45 m)', 'Pit Lane (~60 m)']; new['beside'] = ['GN20']; new['sec'] = 'S13'
    if g['moved_m'] >= 2: new.pop('img', None)  # the old close/wide pictures were centred on the wrong spot
    t = t[:obj_at] + json.dumps(new, ensure_ascii=False, separators=(',', ':')) + t[end:]

# 1b. P47 (QPS Amenities Crib Room, due 6 Oct). Andrew, 2 Oct: "is this location correct?" The current master (D001 rev 03)
# does not draw P47 anywhere; its compound by Gate 2 / Commodore Park shows P46 (QPS Command Post), P08, OP14 and GEM. D022
# (rev 02) callout 047 points into that compound. The 27 Sep reading put P47 on the compound's west fence line, beside P46,
# beside P46. Andrew, 2 Oct 2026, on seeing it: "P47 looks good" - so the spot stands, as his confirmation, and says so.
k = t.index('"P47":{', start); obj_at = k + len('"P47":')
old, end = json.JSONDecoder().raw_decode(t, obj_at)
if old.get('how') != 'leader line from callout 047 on D022': sys.exit('P47 on the master changed - review before applying')
new = dict(old)
new['how'] = 'the QPS compound by Gate 2 / Commodore Park, beside P46 (QPS Command Post): D022 rev 02 callout 047 points into it; the current master (rev 03) does not draw P47 - the spot confirmed by the project manager, 2 Oct 2026'
new['confirmed'] = 'the project manager, 2 Oct 2026'
new.pop('img', None)
t = t[:obj_at] + json.dumps(new, ensure_ascii=False, separators=(',', ':')) + t[end:]

# 1c. The light towers LTC01-LTC14 were read off blue fans on D024; the master has no light-tower symbol to check them
# against, and several sit in a traffic lane (README, map accuracy). They keep their position for review, marked unverified.
for k in ['LTC%02d' % i for i in range(1, 15)]:
    at = t.find('"' + k + '":{', start)
    if at < 0: continue
    obj_at = at + len('"' + k + '":'); old, end = json.JSONDecoder().raw_decode(t, obj_at)
    if not str(old.get('how', '')).startswith('leader line from callout'): sys.exit(k + ' on the master changed - review before applying')
    new = dict(old); new['unverified'] = 'read off a blue fan on D024 - the master has no light-tower symbol to check it against; check it on site (map review, 2 Oct 2026)'
    t = t[:obj_at] + json.dumps(new, ensure_ascii=False, separators=(',', ':')) + t[end:]

# one source label for a master-held position, used by the text, Navigate, the pin record and the driver sheet alike
t = rep(t, "function text747Where(a){", """/* v7.82 - where a master-held position came from, in the same words on every surface */
function locSrc782(ref){
 const m = (typeof MASTER_LOC !== 'undefined' && MASTER_LOC[ref]) || null; if (!m) return null;
 if (m.confirmed) return {kind: 'confirmed', sms: 'confirmed by the project manager', nav: 'the spot the project manager confirmed for ' + ref + ' (' + m.confirmed.replace(/^the project manager, /, '') + ')', by: 'the project manager (' + m.confirmed.replace(/^the project manager, /, '') + ')', took: 'confirmed by the project manager', label: 'Confirmed position', line: 'Confirmed by the project manager · not a phone pin'};
 if (m.unverified) return {kind: 'unverified', sms: 'drawing arrow, not checked on site', nav: 'where an arrow on drawing D024 puts ' + ref + ' - not verified, check it on site', by: 'drawing D024 arrow (not verified)', took: 'read off a drawing arrow - not verified', label: 'Drawing position - not verified', line: 'From an arrow on D024 · check it on site'};
 return null;
}
function text747Where(a){""", 'one provenance label', p, True)
t = rep(t, " const src = nt.pinned && nt.fix && nt.fix.master ? 'master plan'",
        " const L782 = nt.pinned && nt.fix && nt.fix.master ? locSrc782(a.key) : null; /* v7.82 */\n const src = L782 ? L782.sms : nt.pinned && nt.fix && nt.fix.master ? 'master plan'",
        'a confirmed or unverified spot says so', p, True)
t = rep(t, "if (t && t.pinned && t.fix && t.fix.master) return 'Opens your maps app with driving directions to where the master plan D001-26003-03 puts '",
        "if (t && t.pinned && t.fix && t.fix.master && locSrc782(a && a.key)) return 'Opens your maps app with driving directions to ' + locSrc782(a.key).nav + '.'; /* v7.82 */\nif (t && t.pinned && t.fix && t.fix.master) return 'Opens your maps app with driving directions to where the master plan D001-26003-03 puts '",
        'Navigate says the same source', p, True)
t = rep(t, " return {lat: m.ll[0], lon: m.ll[1], acc: null, at: '2026-09-27T00:00:00.000Z', by: 'master plan D001-26003-03',",
        " const L782 = locSrc782(ref); /* v7.82 */\n return {lat: m.ll[0], lon: m.ll[1], acc: null, at: '2026-09-27T00:00:00.000Z', by: L782 ? L782.by : 'master plan D001-26003-03', src782: L782 ? L782.kind : null,",
        'the pin record says the same source', p, True)
t = rep(t, " ref: ref, unit: null, n: 0, took: 'read off the master plan', master: true, how: m.how}; }",
        " ref: ref, unit: null, n: 0, took: L782 ? L782.took : 'read off the master plan', master: true, how: m.how}; }",
        'the pin record says how', p, True)
t = rep(t, " if (P.kind === 'master') return {label: 'Master-plan position', ll, line: 'From master plan D001 · not a phone pin'};",
        " if (P.kind === 'master' && P.src) return {label: P.src.label, ll, line: P.src.line}; /* v7.82 */\n if (P.kind === 'master') return {label: 'Master-plan position', ll, line: 'From master plan D001 · not a phone pin'};",
        'the driver sheet says the same source', p, True)

# 2. driver rules
line = json.load(open(os.path.join(HERE, 'evidence', 'main_beach_pde_tomtom.json')))['lonlat']
rules_js = r"""
/* v7.82 - DRIVER RULES, the project manager's (2 Oct 2026), on every message and drawer that sends a truck. */
const MBP782 = %s; /* Main Beach Pde, Seaworld Dr roundabout (north) to Surfers Paradise (south), TomTom, 2 Oct 2026 */
/* which side of Main Beach Pde a drop is on: within 70 m of the road and between its two ends, or null */
function mbpSide782(ll){
 if (!ll || ll.lat == null) return null;
 const k = 111320 * Math.cos(-27.98 * Math.PI / 180), xy = (lon, lat) => [lon * k, lat * 110574], q = xy(ll.lon, ll.lat);
 let best = null;
 for (let i = 0; i < MBP782.length - 1; i++) {
  const a = xy(MBP782[i][0], MBP782[i][1]), b = xy(MBP782[i + 1][0], MBP782[i + 1][1]), dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1e-9;
  const t = ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / L2, tc = Math.max(0, Math.min(1, t)), c = [a[0] + tc * dx, a[1] + tc * dy];
  const d = Math.hypot(q[0] - c[0], q[1] - c[1]), cross = dx * (q[1] - a[1]) - dy * (q[0] - a[0]);
  const past = (i === 0 && t < 0) || (i === MBP782.length - 2 && t > 1);
  if (!best || d < best.d) best = {d, cross, past};
 }
 if (!best || best.past || best.d > 70) return null;
 /* heading south along the line, the left hand is the ocean side */
 return {side: best.d <= 6 ? 'on the road' : best.cross > 0 ? 'seaside' : 'land side', m: Math.round(best.d)};
}
function entry782(a){
 const nt = navTargetFor(a); const s = nt ? mbpSide782(nt.ll) : null; if (!s) return null;
 if (s.side === 'seaside') return {side: s.side, sms: 'ENTRY: seaside - in at the Seaworld Dr roundabout end of Main Beach Pde, drive south.',
  words: 'Seaside of Main Beach Pde: come in at the Seaworld Dr roundabout (north) end and drive south to the drop - the route the project manager marked.'};
 return {side: s.side, sms: 'ENTRY: ' + (s.side === 'on the road' ? 'on the road' : 'land side') + ' - in from the Surfers end of Main Beach Pde, drive north (race direction).',
  words: (s.side === 'on the road' ? 'On Main Beach Pde itself' : 'Land side of Main Beach Pde (like S08)') + ': enter from the Surfers Paradise (south) end and drive north, the way the race cars go.'};
}
/* the order things go in. A later item must not arrive before the one it waits for is in place. */
const ORDER782 = [
 /* the Macintosh Island sequence, the project manager, 2 Oct 2026: P03, P01, P05, WC05 waste tank, WC05 toilet block, P04 -
    trucks arrive in this order, staggered; a truck out of order is refused entry and waits */
 {ref: 'P03', seq: true, sms: 'ORDER: truck 1 of 6 (P03, P01, P05, WC05 tank, WC05 toilet, P04). Out of order = no entry.'},
 {ref: 'P01', seq: true, after: ['P03'], sms: 'ORDER: truck 2 of 6 - only after P03 is in. Out of order = no entry.'},
 {ref: 'P05', seq: true, after: ['P01'], sms: 'ORDER: truck 3 of 6 - only after P01 is in. Out of order = no entry.'},
 {ref: 'WC05', seq: true, tank: true, after: ['P05'], sms: 'ORDER: trucks 4-5 of 6: tank, toilet, after P05. Out of order = no entry.'},
 {ref: 'P04', seq: true, after: ['WC05'], sms: 'ORDER: truck 6 of 6 - only after the WC05 toilet block is in. Out of order = no entry.'},
 {ref: 'GN21', sms: 'ORDER: GN21 60kVA first - tight spot. GN20 350kVA after it.'},
 {ref: 'GN20', after: ['GN21'], sms: 'ORDER: only after GN21 60kVA is placed (tight spot).'}
];
const SEQ782 = 'The sequence: 1 P03 > 2 P01 > 3 P05 > 4 WC05 waste tank > 5 WC05 toilet block > 6 P04. One truck at a time, staggered. A truck out of this order is refused entry and waits - waiting delays apply.';

/* LOADING at Kingston (the project manager, 2 Oct 2026): loads done by 05:00 so trucks reach the Gold Coast in time, and in
   the delivery order - you would not load a waste tank after 09:00 with the toilet block first. No travel to the Gold
   Coast 07:00-09:00 or 16:00-18:00 (the project manager, 2 Oct 2026: they cannot travel then). Schedule load times are
   Kingston load times; the run to site is the page's planning figure (transport.kingston_run, about 70 min). */
const LOAD782 = 'LOAD: for a morning delivery (on site before 07:00), loaded and away from Kingston by 05:00. Load in the delivery order - about 70 min to site. NO travel to the Gold Coast 07:00-09:00 or 16:00-18:00. A delivery with a time asked for gets one leave-by time that meets all of these.';
const LOAD_BY782 = 5 * 60;
const LOAD_SMS782 = 'LOAD: Kingston by 05:00, in order.';
const PEAKS782 = [[7 * 60, 9 * 60], [16 * 60, 18 * 60]];
function hhmm782(s){ const m = /^\s*(\d{1,2}):?(\d{2})\s*$/.exec(String(s || '')); if (!m) return null; const h = +m[1], mi = +m[2]; return h < 24 && mi < 60 ? h * 60 + mi : null; }
/* times are minutes from 1 Jan 1970 (UTC calendar days, so a day is always 1,440 minutes); a clock is always 00:00-23:59 */
function clock782(n){ n = ((Math.round(n) %% 1440) + 1440) %% 1440; return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n %% 60).padStart(2, '0'); }
function day782(iso){ const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 60000 : null; }
/* a time as a clock, naming the day when it is not the delivery's own */
function when782(n, base){ const c = clock782(n); if (base == null) return c; const dd = Math.floor((n - base) / 1440);
 return dd === 0 ? c : c + (dd === -1 ? ' the day before' : dd === 1 ? ' the next day' : dd < 0 ? ' (' + -dd + ' days before)' : ' (' + dd + ' days after)'); }
function run782(){ const kr = (DATA.transport || {}).kingston_run || {}; return Math.round(kr.minutes_rounded || kr.minutes || 70); }
function due782(a){ let eff = null; try { eff = effectiveDates(a); } catch (e) {} return day782((eff && eff.in) || (a && a.first_date)); }
function loads782(a){
 const run = run782(), due = due782(a);
 return (a.events || []).filter(e => e.movement !== 'remove').map(e => { const m = hhmm782(e.load_time); if (m == null) return null;
  const d = day782(e.date), base = d != null ? d : due != null ? due : 0;
  return {item: e.item || '', date: e.date, tod: m, base, at: base + m, arrive: base + m + run, run}; }).filter(Boolean);
}
/* the no-travel window (absolute start and end) that a run from s to e touches, on any day; null when it touches none */
function ban782(s, e){ for (let k = Math.floor(s / 1440) - 1; k <= Math.floor(e / 1440); k++) for (const [ps, pe] of PEAKS782) { const A = k * 1440 + ps, B = k * 1440 + pe; if (s < B && e > A) return [A, B]; } return null; }
/* a unit already on site has nothing left to load - the check is for what is still to come. A delivery with a time asked
   for is planned from that time alone (timeCheck782); this general check covers the deliveries without one. */
function loadCheck782(a){
 const out = [], L = inPlace782(a.key) ? [] : loads782(a);
 const timed = hhmm782((deliveryOf(a.key) || {}).eta) != null;
 if (!timed) L.forEach(l => { const p = ban782(l.at, l.arrive), late = l.tod > LOAD_BY782; if (!p && !late) return;
  out.push((l.item ? l.item + ': ' : '') + 'load ' + clock782(l.at) + (late ? ' - away from Kingston after 05:00' : '') + (p ? (late ? ' and puts' : ' puts') + ' the truck on the road ' + clock782(l.at) + '-' + clock782(l.arrive) + ', inside the ' + clock782(p[0]) + '-' + clock782(p[1]) + ' no-travel window' : '')); });
 const tank = L.find(l => /waste tank/i.test(l.item)), block = L.find(l => /toilet block/i.test(l.item));
 if (tank && block && tank.at >= block.at) out.push('the waste tank loads at ' + when782(tank.at, block.base) + ', not before the toilet block (' + clock782(block.at) + ') - load the tank first');
 const o = ORDER782.find(x => x.ref === a.key);
 (o && o.after || []).forEach(f => { const fa = assetOf(f), fl = fa ? loads782(fa) : []; if (!fl.length || !L.length) return;
  const mine = L.reduce((x, l) => l.at < x.at ? l : x), theirs = fl.reduce((x, l) => l.at > x.at ? l : x);
  if (mine.at <= theirs.at) out.push('loads at ' + clock782(mine.at) + ', not after ' + f + ' (' + when782(theirs.at, mine.base) + ') - load in the delivery order, staggered'); });
 return out;
}
const ORDER782_BY = 'the project manager, 2 Oct 2026';
function hasTank782(a){ return /waste tank/i.test(((a && (a.item_types || a.asked_for)) || []).join(' ')); }
function order782(a){
 if (!a) return null;
 const r = ORDER782.find(x => x.ref === a.key);
 if (r) return r;
 if (hasTank782(a)) return {ref: a.key, tank: true, sms: 'ORDER: waste tank first - no toilet block before the tank is in.'};
 return null;
}
/* is a reference in place yet: on site on the record */
function inPlace782(ref){ const d = deliveryOf(ref); return !!(d && d.state === 'on site'); }
function onSiteAt782(ref){
 const d = deliveryOf(ref); if (!d || d.state !== 'on site') return null;
 const h = (d.history || []).filter(x => x.state === 'on site').map(x => x.at || x.set_at).filter(Boolean).sort();
 return h[0] || d.set_at || null;
}
/* the record against the order, for everything the rules name: done in order, out of order, or still to come */
function orderCheck782(){
 const out = [];
 ORDER782.forEach(r => (r.after || []).forEach(first => {
  const a = onSiteAt782(first), b = onSiteAt782(r.ref);
  out.push({first, then: r.ref, a, b, state: !b ? (a ? 'ready' : 'waiting') : !a ? 'out of order' : a <= b ? 'in order' : 'out of order'});
 }));
 return out;
}
function park782(a){
 const m = (typeof masterLoc === 'function' && masterLoc(a.key)) || null;
 const words = ((m && [].concat(m.near || [], m.next || [])) || []).join(' ');
 const e = typeof entryOf === 'function' ? entryOf(a.key) : null;
 return /Macintosh|Helen|Park|Island/i.test(words) || !!(e && e.took === 'the pit lane rule');
}
const PARK782 = 'PARK: wildlife and low branches - very tight. Escort only.';
const STAGGER782 = 'Stagger arrivals - the site is congested every Supercars week.';
function rules782Sms(a){
 const L = []; const o = order782(a); if (o) L.push(o.sms);
 const e = entry782(a); if (e) L.push(e.sms);
 return L;
}
function rules782Optional(a){ const o = order782(a); return [o && o.seq ? LOAD_SMS782 : '', park782(a) ? PARK782 : '', STAGGER782].filter(Boolean); }
/* park fits if it stays inside three texts; stagger only if it adds no text (it is on every message's long form) */
function rules782Fits(L, o){ const now = smsShape(text747Plain(L.join('\n'))), next = smsShape(text747Plain(L.concat(o).join('\n'))); return next.units <= TEXT747_MAX && (o !== STAGGER782 || next.parts === now.parts); }
/* the long form: Full details and the drawer */
function rules782Long(a){
 const L = ['DRIVER RULES (' + ORDER782_BY + '):'];
 const o = order782(a);
 if (o) { L.push(o.sms);
  (o.after || []).forEach(f => L.push('  ' + f + ': ' + (inPlace782(f) ? 'in place on the record' : 'NOT in place yet - do not send ' + a.key + ' until it is'))); }
 if (o && o.seq) L.push(SEQ782);
 L.push(LOAD782);
 loadCheck782(a).forEach(w => L.push('CHECK THE LOAD: ' + w + '.'));
 const e = entry782(a); if (e) L.push(e.words);
 if (park782(a)) L.push('Park access: watch for wildlife and low branches; some spots have no room to spare. ' + ((DATA.driver_rules || {}).escort || '') + ' Event days (D007 Track Access Details): contractor access to Macintosh Park only from 21:30 Fri 23, 22:15 Sat 24 and 19:00 Sun 25 Oct.');
 L.push(STAGGER782 + ' Bring things in the order above.');
 L.push('Event week (D007 Track Access Details): circuit closed to local traffic, one-way anti-clockwise (race direction) from 05:00 Mon 19 Oct; roads reopen 17:00 Mon 26 Oct. D007 General Note 1 gives different dates - the drawing conflicts, confirm with site. 40 km/h on track · 10 km/h in Macintosh Park.');
 return inPlace782(a.key) ? L.filter(x => !/^(TIME|DISPATCH|LOAD|DIRECTIONS[A-Z ]*|CHECK THE (TIME|LOAD)):/.test(x)) : L; /* delivered: its record, not a plan */
}
"""
rules_js = rules_js % json.dumps(line, separators=(',', ':'))
t = rep(t, "/* the text itself: what, where, how in - always; then the day and the pictures while it stays inside three texts */",
        rules_js + "/* the text itself: what, where, how in - always; then the day and the pictures while it stays inside three texts */",
        'driver rules module', p, True)

# the short text: order and entry always; the day, the link, then park and stagger while it stays inside three texts
t = rep(t, """ const way = text747WayIn(a); if (way) L.push(way);
 const link = text747Link(a);
 [text747When(a),link ? 'Delivery details: ' + link : ''].filter(Boolean).forEach(o => {""",
        """ const way = text747WayIn(a); if (way) L.push(way);
 rules782Sms(a).forEach(x => L.push(x)); /* v7.82 - the order and the way in are never trimmed */
 const link = text747Link(a);
 [text747When(a),link ? 'Delivery details: ' + link : ''].filter(Boolean).forEach(o => {""",
        'short text carries the rules', p, True)

t = rep(t, """ if (smsShape(text747Plain(L.concat(o).join('\\n'))).units <= TEXT747_MAX) L.push(o);
 });
 return text747Plain(L.join('\\n'));
}
/* the Text box""", """ if (smsShape(text747Plain(L.concat(o).join('\\n'))).units <= TEXT747_MAX) L.push(o);
 });
 rules782Optional(a).forEach(o => { if (rules782Fits(L, o)) L.push(o); }); /* v7.82 - park and stagger where they fit */
 return text747Plain(L.join('\\n'));
}
/* the Text box""", 'park and stagger where they fit', p, True)

# the long text (Full details)
t = rep(t, """ return dropText(a, {link});
}""", """ return dropText(a, {link}) + '\\n\\n' + rules782Long(a).join('\\n');
}""", 'Full details carries the rules', p, True)

# 3. the drawer: a Driver rules box above "Where it is"
t = rep(t, " ${givenRefBlock(a)}\n ${pinBlock(a)}", " ${givenRefBlock(a)}\n ${rules782Html(a)}\n ${pinBlock(a)}", 'drawer carries the rules', p, True)
t = rep(t, "/* the text itself: what, where, how in - always; then the day and the pictures while it stays inside three texts */",
        """function rules782Html(a){
 const o = order782(a), e = entry782(a), pk = park782(a), lw = loadCheck782(a); if (!o && !e && !pk && !lw.length) return '';
 const row = (k, v) => `<li><b>${esc(k)}</b> ${v}</li>`;
 const L = [];
 if (o) { L.push(row('Order', esc(o.sms.replace(/^ORDER: /, ''))));
  if (o.seq) L.push(row('Sequence', esc(SEQ782.replace(/^The sequence: /, ''))));
  (o.after || []).forEach(f => L.push(row(f, inPlace782(f) ? '<span class="ok782">in place on the record</span>' : '<span class="no782">not in place yet - hold ' + esc(a.key) + '</span>'))); }
 if (e) L.push(row('Way in', esc(e.words)));
 if (pk) L.push(row('Park', 'Watch for wildlife and low branches - very tight in places. ' + esc((DATA.driver_rules || {}).escort || '')));
 L.push(row('Arrivals', 'Stagger them - the site is congested every Supercars week.'));
 if (!inPlace782(a.key)) L.push(row('Loading', esc(LOAD782.replace(/^LOAD: f/, 'F'))));
 loadCheck782(a).forEach(w => L.push(row('Check the load', '<span class="no782">' + esc(w) + '</span>')));
 return `<div class="rules782"><div class="sect">Driver rules</div><ul>${L.join('')}</ul><p class="sub">Set by ${esc(ORDER782_BY)}. In every text and in Full details.</p></div>`;
}
/* the text itself: what, where, how in - always; then the day and the pictures while it stays inside three texts */""",
        'drawer rules box', p, True)

# 4. DONE on the map: the tick on a finished unit beats twice, then rests; the explorer gets the finished list
t = rep(t, ".okx{position:absolute;right:-6px;bottom:-7px;width:14px;height:14px;", """/* v7.82 - DONE: the green tick on a finished unit beats twice, then rests. Nothing else on the map moves like it. */
@keyframes done782{0%{box-shadow:0 0 0 1px rgba(0,0,0,.35),0 0 0 0 rgba(43,212,107,.9)}12%{box-shadow:0 0 0 1px rgba(0,0,0,.35),0 0 0 8px rgba(43,212,107,0)}13%{box-shadow:0 0 0 1px rgba(0,0,0,.35),0 0 0 0 rgba(43,212,107,.9)}27%{box-shadow:0 0 0 1px rgba(0,0,0,.35),0 0 0 11px rgba(43,212,107,0)}100%{box-shadow:0 0 0 1px rgba(0,0,0,.35),0 0 0 11px rgba(43,212,107,0)}}
.mk[data-complete="1"] .okx{animation:done782 3.2s ease-out infinite}
@media (prefers-reduced-motion:reduce){.mk[data-complete="1"] .okx{animation:none}}
html[data-motion="off"] .mk[data-complete="1"] .okx{animation:none}
.rules782{margin:10px 0;padding:10px 12px;border:1.5px solid var(--orange,#ff6a13);border-radius:10px;background:rgba(255,106,19,.06)}
.rules782 ul{margin:6px 0 4px;padding-left:18px}.rules782 li{margin:3px 0}.rules782 .ok782{color:#0f7a3d;font-weight:700}.rules782 .no782{color:#b42318;font-weight:700}
.okx{position:absolute;right:-6px;bottom:-7px;width:14px;height:14px;""", 'done tick pulse', p, True)
t = rep(t, "window.gc500PlanItems = function(){", """/* v7.82 - the finished list for the explorer's Done layer (read every few seconds; a tick shows up without a reload) */
window.gc500DoneKeys = function(){ try { return allAssets().filter(a => !a._cancelled && deliveryOf(a.key).done).map(a => a.key); } catch (e) { return null; } };
window.gc500PlanItems = function(){""", 'done list for the explorer', p, True)

# 5. THE TIME IS AN UNLOADED-BY TIME (the project manager, 2 Oct 2026): "When requests are made or a time frame on site, it
#    means it needs to be off loaded by a certain time, not arrive right on that time ... Multiple work fronts operate. If
#    we hold up or have delays we then delay all other work fronts ... If we miss times we miss access into areas, closed
#    off by concrete barriers, or no traffic controllers. Time frames must be adhered to."
t = rep(t, "const ORDER782_BY = 'the project manager, 2 Oct 2026';", """/* v7.82 - the planned time on a delivery is when the truck must be UNLOADED by, not when it arrives (the project
   manager, 2 Oct 2026). Miss it and the other work fronts wait, or the area is shut (barriers in, no traffic control). */
const UNLOAD_MIN782 = 30; /* the project manager, 2 Oct 2026: unloading takes at least 30 min */
const TIME782 = 'TIME: the time given is when you must be UNLOADED by - not when you arrive. Unloading takes at least 30 min, so be on site 30 min before it - and no travel to the Gold Coast 07:00-09:00 or 16:00-18:00, so a run that would hit those hours comes in before them. Miss it and the other crews wait, or the area is closed (barriers in, no traffic control). Time frames must be kept.';
/* work back from the unloaded-by time (absolute minutes): 30 min to unload, then the run - and the run may not touch a
   no-travel window, so a time that would put the truck on the road 07:00-09:00 (or 16:00-18:00) brings it in before the
   window instead. This is the one plan for a timed delivery: the text, Full details, the drawer and the checks all read it. */
function plan782(by){
 const run = run782(); let onBy = by - UNLOAD_MIN782, ban = null, morning = false;
 for (let i = 0; i < 6; i++) { const b = ban782(onBy - run, onBy); if (!b) break; ban = b; onBy = b[0]; }
 let leaveBy = onBy - run;
 /* a morning run (on site before 07:00) is loaded and away from Kingston by 05:00 - the general rule applies here too */
 const day = Math.floor(onBy / 1440) * 1440;
 if (onBy <= day + 7 * 60 && leaveBy > day + LOAD_BY782) { leaveBy = day + LOAD_BY782; onBy = leaveBy + run; morning = true; }
 return {by, onBy, leaveBy, run, ban, morning};
}
function planWords782(P){ const w = [P.ban ? 'no travel ' + clock782(P.ban[0]) + '-' + clock782(P.ban[1]) + ', so in before ' + clock782(P.ban[0]) : '', P.morning ? 'a morning run leaves Kingston by 05:00' : ''].filter(Boolean); return w.length ? ' (' + w.join('; ') + ')' : ''; }
/* the plan for a delivery still to come with a time asked for, on its own due day; null otherwise */
function planFor782(a){
 const d = deliveryOf(a.key) || {}, m = hhmm782(d.eta); if (m == null || d.state === 'on site') return null;
 const base = due782(a), b0 = base != null ? base : 0; return Object.assign(plan782(b0 + m), {base: base != null ? base : null, eta: d.eta});
}
function timeCheck782(a){
 if (inPlace782(a.key)) return [];
 const P = planFor782(a); if (!P) return [];
 const out = [], L = loads782(a), w = n => when782(n, P.base);
 if (!L.length) return ['no load time on the schedule - to be unloaded by ' + w(P.by) + ': on site by ' + w(P.onBy) + planWords782(P) + ', so leave Kingston by ' + w(P.leaveBy) + ', loaded before then (' + P.run + ' min run, at least ' + UNLOAD_MIN782 + ' min to unload)'];
 L.forEach(l => { const spare = P.by - l.arrive, hit = ban782(l.at, l.arrive);
  out.push((l.item ? l.item + ': ' : '') + 'load ' + w(l.at) + ', on site about ' + w(l.arrive)
   + (hit ? ' - on the road in the ' + clock782(hit[0]) + '-' + clock782(hit[1]) + ' no-travel window. Leave Kingston by ' + w(P.leaveBy) + ', loaded before then.'
   : spare < 0 ? ' - AFTER ' + w(P.by) + ', when it must already be unloaded. Leave Kingston by ' + w(P.leaveBy) + ', loaded before then.'
   : spare < UNLOAD_MIN782 ? ' - only ' + spare + ' min to unload before ' + w(P.by) + ' (at least ' + UNLOAD_MIN782 + ' needed). Leave Kingston by ' + w(P.leaveBy) + ', loaded before then.'
   : l.at > P.leaveBy ? ' - leaves Kingston after its leave-by time' + planWords782(P) + '. Leave Kingston by ' + w(P.leaveBy) + ', loaded before then.'
   : ' - ' + spare + ' min to unload before ' + w(P.by) + '.')); });
 return out;
}
const ORDER782_BY = 'the project manager, 2 Oct 2026';""", 'unloaded-by check', p, True)
t = rep(t, " L.push(LOAD782);\n loadCheck782(a).forEach(w => L.push('CHECK THE LOAD: ' + w + '.'));",
        " L.push(TIME782);\n timeCheck782(a).forEach(w => L.push('CHECK THE TIME: ' + w));\n L.push(LOAD782);\n loadCheck782(a).forEach(w => L.push('CHECK THE LOAD: ' + w + '.'));", 'time in Full details', p, True)
t = rep(t, " const o = order782(a), e = entry782(a), pk = park782(a), lw = loadCheck782(a); if (!o && !e && !pk && !lw.length) return '';",
        " const o = order782(a), e = entry782(a), pk = park782(a), lw = loadCheck782(a), tw = timeCheck782(a); if (!o && !e && !pk && !lw.length && !tw.length) return '';", 'drawer shows for a time warning', p, True)
t = rep(t, " if (!inPlace782(a.key)) L.push(row('Loading', esc(LOAD782.replace(/^LOAD: f/, 'F'))));",
        " if (!inPlace782(a.key)) { const P = planFor782(a), w = n => when782(n, P && P.base); L.push(row('Time', P ? 'Unloaded by <b>' + esc(w(P.by)) + '</b> - so on site by <b>' + esc(w(P.onBy)) + '</b>' + esc(planWords782(P)) + ', leave Kingston by <b>' + esc(w(P.leaveBy)) + '</b>, loaded before then (unloading takes at least ' + UNLOAD_MIN782 + ' min). Miss it and the other crews wait, or the area is closed.' : 'The time given is when the truck must be unloaded by - be on site at least ' + UNLOAD_MIN782 + ' min before it.')); }\n tw.forEach(w => L.push(row('Check the time', /AFTER|only [0-9]+ min|no-travel|leaves Kingston after/.test(w) ? '<span class=\"no782\">' + esc(w) + '</span>' : esc(w))));\n if (!inPlace782(a.key)) L.push(row('Loading', esc(LOAD782.replace(/^LOAD: f/, 'F'))));", 'drawer time row', p, True)
# the words everywhere the time shows: unloaded by, not "on site"
t = rep(t, "return 'Due ' + fmtDate(day) + (d.eta ? ', on site ' + d.eta : '');", "return 'Due ' + fmtDate(day) + (d.eta ? (d.state === 'on site' ? ', on site ' + d.eta : (P => P ? ', on site by ' + when782(P.onBy, P.base) + ', unloaded by ' + d.eta : ', unloaded by ' + d.eta)(planFor782(a))) : ''); /* v7.82 - the time is an unloaded-by time (a delivered record keeps its words) */", 'text: unloaded by', p, True)
t = rep(t, "${d.eta ? ' · planned on site ' + d.eta : ''}${ev.load_time", "${d.eta ? (d.state === 'on site' ? ' · planned on site ' + d.eta : (P => P ? ' · on site by ' + when782(P.onBy, P.base) + planWords782(P) + ', unloaded by ' + d.eta + ' - leave Kingston by ' + when782(P.leaveBy, P.base) + ', loaded (at least ' + UNLOAD_MIN782 + ' min to unload)' : ' · unloaded by ' + d.eta)(planFor782(a))) : ''}${ev.load_time", 'Full details: unloaded by', p, True)
t = rep(t, "dv.eta ? ' · planned on site ' + esc(dv.eta) : ''}</span>`", "dv.eta ? (dv.state === 'on site' ? ' · planned on site ' : ' · unloaded by ') + esc(dv.eta) : ''}</span>`", 'card: unloaded by', p, True)
t = rep(t, "<span class=\"rs-sup\">planned on site — no load time in the schedule</span>", "<span class=\"rs-sup\">${dv.state === 'on site' ? 'planned on site' : 'unloaded by'} — no load time in the schedule</span>", 'running sheet: unloaded by', p, True)
t = rep(t, "color:#b9b2ab\">on site ${e(dv.eta)}</td>", "color:#b9b2ab\">${dv.state === 'on site' ? 'on site' : 'unloaded by'} ${e(dv.eta)}</td>", 'print card: unloaded by', p, True)
t = rep(t, ">Planned time to site</label>", ">${deliveryOf(a.key).state === 'on site' ? 'Planned time to site' : 'Unloaded by (the time asked for)'}</label>", 'drawer field label', p, True)
t = rep(t, "<div class=\"hint\">${d.eta ? (d.eta_where === 'local' ? LW() : 'shared record') : ''}</div></div>",
        "<div class=\"hint\">${d.eta ? (d.eta_where === 'local' ? LW() : 'shared record') + (deliveryOf(a.key).state === 'on site' ? '' : ' · ') : ''}${deliveryOf(a.key).state === 'on site' ? '' : 'the truck is unloaded by then - on site at least 30 min before'}</div></div>", 'drawer field hint', p, True)

# 6. FIRM INSTRUCTIONS BEFORE ANYONE LEAVES (the project manager, 2 Oct 2026): "No drivers should leave the pick up point until
#    they have firm instructions on where they are going. Every item has a map drop off location and a direction point
#    they need to head to."
t = rep(t, "const ORDER782_BY = 'the project manager, 2 Oct 2026';", """/* v7.82 - nobody leaves the pick-up point without firm instructions: the drop-off location on the map AND the point to head
   for (the way in: a pinned turn-in, the pit lane rule, or the Main Beach Pde entry end). Either missing = hold the truck. */
const DISPATCH782 = 'DISPATCH: no driver leaves the pick-up point without firm instructions - the drop-off location on the map AND the direction point to head for (the way in). If either is missing, the truck holds until the site team gives it.';
/* directions only: a verified drop-off and a way in. The order and time checks are separate and say so themselves. A
   position the map review left unverified (MASTER_LOC .unverified) is shown for review but does not count as a drop-off. */
function dirs782(a){
 { const R = report782(a); if (R) { const dir = !!(R.a && (entryOf(R.ref) || entry782(R.a))); return {drop: false, dir, ok: dir, report: R.ref, missing: dir ? [] : ['no way in to the pit lane'], unverified: false, located: true}; } }
 const nt = navTargetFor(a), m = (typeof MASTER_LOC !== 'undefined' && MASTER_LOC[a.key]) || null;
 const unv = !!(nt && nt.pinned && nt.fix && nt.fix.master && m && m.unverified);
 const drop = (!!(nt && (nt.pinned || nt.placed)) && !unv) || !!descLoc782(a), dir = !!(entryOf(a.key) || entry782(a));
 const missing = [drop ? '' : unv ? 'drop-off not verified (a drawing arrow only - check it on site)' : 'no drop-off location on the map', dir ? '' : 'no direction point (way in) set'].filter(Boolean);
 return {drop, dir, ok: drop && dir, missing, unverified: unv, located: !!nt || !!descLoc782(a)};
}
function ready782(a){ return !a || inPlace782(a.key) ? null : dirs782(a); }
const ORDER782_BY = 'the project manager, 2 Oct 2026';""", 'dispatch readiness', p, True)
# the text: a drop with a location but no way in says HOLD (no location already says "contact the site team before departure")
t = rep(t, "function rules782Sms(a){\n const L = []; const o = order782(a); if (o) L.push(o.sms);",
        "function rules782Sms(a){\n const L = []; const r = ready782(a); if (r && r.located && !r.ok) L.push('HOLD: ' + (r.drop ? 'way in not set' : r.unverified ? 'drop-off not verified' : 'exact drop-off not set') + ' - do not leave until site gives it.');\n const o = order782(a); if (o) L.push(o.sms);", 'text: hold without a way in', p, True)
t = rep(t, " L.push(TIME782);\n", " { const r = ready782(a); L.push(DISPATCH782); if (r) L.push(r.ok && r.report ? 'DIRECTIONS SET: no drop-off yet - report to the pit lane; site directs the driver from there. Set the drop-off in Edit when it is known.' : r.ok ? 'DIRECTIONS SET: drop-off location and direction point (way in). The order and time checks still apply.' : 'DIRECTIONS MISSING: ' + r.missing.join('; ') + '. Hold the truck.'); }\n L.push(TIME782);\n", 'dispatch in Full details', p, True)
t = rep(t, "lw = loadCheck782(a), tw = timeCheck782(a); if (!o && !e && !pk && !lw.length && !tw.length) return '';",
        "lw = loadCheck782(a), tw = timeCheck782(a), rd = ready782(a); if (!o && !e && !pk && !lw.length && !tw.length && !(rd && !rd.ok)) return '';", 'drawer shows when not ready', p, True)
t = rep(t, " if (!inPlace782(a.key)) { const P = planFor782(a), w = n => when782(n, P && P.base);",
        " if (rd) L.push(row('Directions', rd.ok && rd.report ? '<span class=\"ok782\">Report to the pit lane</span> - no drop-off yet; the driver goes to the pit lane and site directs them. Set the drop-off when it is known.' : rd.ok ? '<span class=\"ok782\">Set</span> - drop-off location and direction point (way in).' : '<span class=\"no782\">MISSING - ' + esc(rd.missing.join('; ')) + '.</span> No driver leaves until both are set' + (rd.dir ? '' : ' (Pin the way in, below)') + '.'));\n if (!inPlace782(a.key)) { const P = planFor782(a), w = n => when782(n, P && P.base);", 'drawer dispatch row', p, True)
window_line = "window.gc500DoneKeys = function(){"
t = rep(t, window_line, "/* v7.82 - deliveries still to come that are not ready to send (no drop-off location, or no direction point) */\nwindow.gc500NotReady = function(){ try { return allAssets().filter(a => !a._cancelled).map(a => ({key: a.key, r: ready782(a)})).filter(x => x.r && !x.r.ok).map(x => ({key: x.key, missing: x.r.missing})); } catch (e) { return null; } };\n" + window_line, 'not-ready list', p, True)

# 7. BEFORE THE DRIVER SHEETS ARE PRINTED (the project manager, 2 Oct 2026): "The transport team will download these and give
#    them to the drivers. What would be cool is prompts before they print, ensuring the process is followed - putting
#    responsibility back on whoever prints them. Not a do-your-job. Neatly: the Coates Way, the Life Saving Rules way, the
#    positive communication way. Tidy, neat, dummy it down, don't over complicate."
t = rep(t, "function dpWirePlate(pane){", r"""/* v7.82 - a short check before driver sheets go out: the page shows what it knows for the loads being printed (drop-off
   pin and way in), the person ticks four plain checks and puts their name on it. The name prints on every sheet. */
const DRV782_CSS = '#drv782{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;background:rgba(12,14,16,.55)}'
 + '#drv782 .box{width:min(520px,100%);max-height:calc(100vh - 32px);overflow:auto;background:var(--card,#fff);color:var(--ink,#15181a);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.35);padding:18px 18px 14px;border-top:6px solid var(--orange,#ff6a13);font:400 14px/1.45 Inter,system-ui,sans-serif}'
 + '#drv782 h2{margin:0 0 4px;font:800 20px/1.2 "Barlow Condensed",Inter,sans-serif;letter-spacing:.01em}#drv782 .lead{margin:0 0 12px;color:var(--mute,#5d6468)}'
 + '#drv782 .facts{margin:0 0 12px;padding:10px 12px;border-radius:10px;background:rgba(31,174,87,.09)}#drv782 .facts.bad{background:rgba(180,35,24,.08)}#drv782 .facts b.f-ok{color:#0f7a3d}#drv782 .facts b.f-no{color:#b42318}#drv782 .facts ul{margin:6px 0 0;padding-left:18px}#drv782 .fx782{all:unset;cursor:pointer;display:inline}#drv782 .fx782 u{color:#b42318;font-weight:700;white-space:nowrap}#drv782 .fx782:focus-visible{outline:2px solid var(--orange,#ff6a13)}'
 + '#drv782 label.ck{display:flex;gap:10px;align-items:flex-start;padding:8px 2px;border-bottom:1px solid rgba(0,0,0,.08);cursor:pointer}#drv782 label.ck input{width:20px;height:20px;flex:none;margin-top:1px;accent-color:var(--orange,#ff6a13)}'
 + '#drv782 .dw782{display:grid;gap:4px;margin:12px 0 4px}#drv782 .dw782 input{font:inherit;padding:9px 10px;border-radius:8px;border:1.5px solid rgba(0,0,0,.2)}#drv782 .dw782 small{color:var(--mute,#5d6468)}'
 + '#drv782 .row{display:flex;gap:10px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap}#drv782 .row button{font:700 15px Inter,sans-serif;padding:10px 16px;border-radius:10px;border:0;cursor:pointer}'
 + '#drv782 .b-go{background:var(--orange,#ff6a13);color:#fff}#drv782 .b-go:disabled{opacity:.45;cursor:not-allowed}#drv782 .b-no{background:transparent;color:inherit;border:1.5px solid rgba(0,0,0,.2)!important}'
 + '#drv782 .chg{margin:0 0 10px;padding:8px 10px;border-radius:8px;background:rgba(180,35,24,.08);color:#b42318;font-weight:700}'
 + '#drv782 .tag{margin:12px 0 0;font-size:12px;color:var(--mute,#5d6468);text-align:center}#drv782 .facts.rep{background:rgba(255,106,19,.09)}#drv782 .facts.rep u{color:#b45309}#drv782 .pl-note{margin:0 0 8px;padding:8px 10px;border-left:4px solid #15181a;background:rgba(0,0,0,.04);font-size:13px}'
 + '.dp-page{position:relative}.dp782{position:absolute;right:3mm;bottom:1.6mm;z-index:2;padding:.4mm 1.6mm;background:#fff;border:.25mm solid #d7dbde;border-radius:1mm;font:600 6.6pt/1.2 Inter,sans-serif;color:#15181a}';
let DRV782_OK = null; /* {iso, by, at, t, snaps}: the check behind the sheets being laid out now - bound to the loads it
   covered and to what they said when it was done (Codex review): another load, or a changed location, way in or time,
   needs a fresh check */
/* what a load's sheet depends on, as one string. Codex review 2: the VALUES the check covers, not only that each is filled
   in - where each item goes (the exact point), the way in (the exact point), the times, the plan and the order - and the
   sheet's own instruction sections and location signs as they print. One complete value changed to another voids the
   check, the same as one cleared. */
function drvLoadSnap782(g, d){
 const rows = (g.rows || []).map(r => { const a = r.a; if (!a) return null;
  const P = dpPos(a), dr = dirs782(a), dl = deliveryOf(a.key) || {}, nt = navTargetFor(a), R = report782(a), E = entryOf(R ? R.ref : a.key), Z = R ? (R.a ? entry782(R.a) : null) : entry782(a), D = descLoc782(a), o = order782(a);
  return [a.key, P, dr, nt ? nt.ll : null, R ? R.ref : null, E || null, Z ? Z.words : null, D ? D.ll : null, dl.eta || '', dl.date || '', dl.note || '',
   (r.events || []).map(e => [e.load_time || '', e.carrier || '', e.note || '']), (a.events || []).map(e => e.load_time || '').join(','), timeCheck782(a), planFor782(a), o ? o.sms : null]; });
 let sheet = ''; try { sheet = dpTruck(g, 'drv') + dpWhere(g, 'drv', a => dpPos(a)) + (d ? pl782Pages(d, g, 0, 0) : ''); } catch (e) { sheet = 'unreadable: ' + String(e && e.message || e); }
 return JSON.stringify({time: g.time || '', raw: g.timeRaw || '', carrier: g.carrier || '', rows, sheet});
}
function drvSnaps782(iso, only){
 const d = programmeDays().find(x => x.iso === iso); if (!d) return null;
 const loads = dpLoads(d), pick = only != null && loads[only] ? [only] : loads.map((g, i) => i), out = {};
 pick.forEach(i => { out[i] = drvLoadSnap782(loads[i], d); }); return out;
}
/* is there a fresh check, by name, for exactly these loads as they stand now */
function drvValid782(iso, pick){
 if (!DRV782_OK || DRV782_OK.iso !== iso || Date.now() - DRV782_OK.t > 900000) return false;
 const d = programmeDays().find(x => x.iso === iso); if (!d) return false;
 const loads = dpLoads(d);
 return (pick || []).every(i => loads[i] && DRV782_OK.snaps[i] != null && DRV782_OK.snaps[i] === drvLoadSnap782(loads[i], d));
}
function drvFacts782(iso, only){
 const d = programmeDays().find(x => x.iso === iso); if (!d) return null;
 const loads = dpLoads(d), pick = only != null && loads[only] ? [only] : loads.map((g, i) => i), bad = [], rep = [];
 let n = 0;
 pick.forEach(i => (loads[i].rows || []).forEach(r => { const a = r.a; if (!a) return; n++;
  const dr = dirs782(a);
  if (dr.ok && dr.report) rep.push({key: a.key, line: 'Load ' + (i + 1) + ' · ' + a.key});
  if (!dr.ok) bad.push({key: a.key, line: 'Load ' + (i + 1) + ' · ' + a.key + ' - ' + [dr.drop ? '' : dr.unverified ? 'drop-off not verified' : 'no drop-off pin', dr.dir ? '' : 'no way in'].filter(Boolean).join(', ')});
  timeCheck782(a).filter(w => /AFTER|only [0-9]+ min|no-travel|leaves Kingston after/.test(w)).forEach(w => bad.push({key: a.key, line: 'Load ' + (i + 1) + ' · ' + a.key + ' - time: ' + w})); }));
 return {loads: pick.length, items: n, bad, rep};
}
/* the project's own time (Brisbane, AEST), whatever the device is set to */
function drvStamp782(){
 try { const P = Object.fromEntries(new Intl.DateTimeFormat('en-AU', {timeZone: 'Australia/Brisbane', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(new Date()).map(x => [x.type, x.value]));
  return P.day + ' ' + P.month.replace('.', '') + ' ' + P.year + ', ' + P.hour + ':' + P.minute + ' AEST'; }
 catch (e) { const d = new Date(Date.now() + 10 * 3600000), z = x => String(x).padStart(2, '0'), M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return z(d.getUTCDate()) + ' ' + M[d.getUTCMonth()] + ' ' + d.getUTCFullYear() + ', ' + z(d.getUTCHours()) + ':' + z(d.getUTCMinutes()) + ' AEST'; } }
function drvCheck782(iso, only, go, changed){
 document.querySelectorAll('#drv782').forEach(e => e.remove());
 if (!document.getElementById('drv782css')) { const st = document.createElement('style'); st.id = 'drv782css'; st.textContent = DRV782_CSS; document.head.appendChild(st); }
 const F = drvFacts782(iso, only); if (!F) { go(); return; }
 const snaps0 = drvSnaps782(iso, only);
 let name = ''; try { name = localStorage.getItem('gc500.printedBy') || ''; } catch (e) {}
 const facts = F.bad.length
  ? `<div class="facts bad"><b class="f-no">${F.bad.length} item${F.bad.length === 1 ? '' : 's'} not ready to send</b> - no firm instructions yet. Set them here at the branch in Edit (the drop-off on the map, and the way in) - the sheets update with them.<ul>${F.bad.slice(0, 8).map(x => '<li><button type="button" class="fx782" data-k="' + esc(x.key) + '">' + esc(x.line) + ' <u>Fix in Edit ›</u></button></li>').join('')}${F.bad.length > 8 ? '<li>and ' + (F.bad.length - 8) + ' more</li>' : ''}</ul></div>`
  : `<div class="facts"><b class="f-ok">✓ Every item has firm directions${F.rep.length ? '' : ' - a drop-off pin and a way in'}.</b></div>`;
 const repBox = F.rep.length ? `<div class="facts rep"><b>${F.rep.length} item${F.rep.length === 1 ? '' : 's'} with no drop-off yet</b> - the driver reports to the pit lane and site directs them. Set the drop-off in Edit when you know it.<ul>${F.rep.slice(0, 6).map(x => '<li><button type="button" class="fx782" data-k="' + esc(x.key) + '">' + esc(x.line) + ' <u>Set it in Edit ›</u></button></li>').join('')}${F.rep.length > 6 ? '<li>and ' + (F.rep.length - 6) + ' more</li>' : ''}</ul></div>` : '';
 const C = [
  F.bad.length ? 'Anything in red is fixed in Edit first - or it stays in the yard until it is.' : 'Every driver has a drop-off pin and a way in.',
  'Leave times work: in before 07:00, or on the road after 09:00. No travel 07:00-09:00 or 16:00-18:00.',
  'Loads go in order. Waste tanks before toilet blocks.',
  'I have talked each driver through their sheet. If anything looks wrong on the day, they stop and call site.'];
 const box = document.createElement('div'); box.id = 'drv782'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'drv782h');
 box.innerHTML = `<div class="box"><h2 id="drv782h">Before these go to the drivers</h2>
  <p class="lead">A quick check - about 30 seconds. You're the last set of eyes before a truck leaves the yard. Thanks for getting it right first time.</p>${changed ? '<p class="chg">Something changed since you opened this (a location, a way in or a time) - here it is as it stands now.</p>' : ''}
  ${facts}${repBox}<p class="pl-note">Each driver sheet comes with an A4 location sign for every item on it. Laminate it and fix it to the item, so it shows where the item goes when it arrives.</p>${C.map((c, i) => `<label class="ck"><input type="checkbox" data-c="${i}"><span>${esc(c)}</span></label>`).join('')}
  <div class="dw782"><label for="drv782n"><b>Checked by</b></label><input id="drv782n" autocomplete="name" placeholder="Your name" value="${esc(name)}"><small>Your name and the time print at the foot of every sheet.</small></div>
  <div class="row"><button type="button" class="b-no">Not yet</button><button type="button" class="b-go" disabled>Checked - get the sheets</button></div>
  <p class="tag">Safe, clear, on time. If in doubt, stop and ask.</p></div>`;
 document.body.appendChild(box);
 const goB = box.querySelector('.b-go'), nm = box.querySelector('#drv782n'), cks = [...box.querySelectorAll('input[type=checkbox]')];
 const sync = () => { goB.disabled = !(cks.every(c => c.checked) && nm.value.trim().length >= 2); };
 cks.forEach(c => c.addEventListener('change', sync)); nm.addEventListener('input', sync); sync();
 const close = () => box.remove();
 box.querySelector('.b-no').onclick = close;
 box.querySelectorAll('.fx782').forEach(b => b.onclick = () => { close(); location.hash = '#asset/' + b.dataset.k; }); /* straight to that item's drawer: drop-off and Pin the way in */
 box.addEventListener('click', e => { if (e.target === box) close(); });
 box.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
 goB.onclick = () => { const by = nm.value.trim().slice(0, 60); try { localStorage.setItem('gc500.printedBy', by); } catch (e) {}
  const now = drvSnaps782(iso, only); if (JSON.stringify(now) !== JSON.stringify(snaps0)) { close(); drvCheck782(iso, only, go, true); return; } /* checked against what it says now */
  DRV782_OK = {iso, by, at: drvStamp782(), bad: F.bad.length, t: Date.now(), snaps: now}; close(); go(); };
 setTimeout(() => (cks[0] || nm).focus(), 30);
}
function dpWirePlate(pane){""", 'driver print check', p, True)
t = rep(t, "pane.querySelectorAll('[data-print-drv]').forEach(n => n.onclick = () => dpPrint(n.dataset.printDrv, 'drv'));",
        "pane.querySelectorAll('[data-print-drv]').forEach(n => n.onclick = () => drvCheck782(n.dataset.printDrv, null, () => dpPrint(n.dataset.printDrv, 'drv'))); /* v7.82 - the check first */", 'print button checks first', p, True)
t = rep(t, " pdf7Open(b.dataset.pdf7, b.dataset.iso, b.dataset.only != null && b.dataset.only !== '' ? +b.dataset.only : null, b.dataset.mail === '1');",
        " const open7 = () => pdf7Open(b.dataset.pdf7, b.dataset.iso, b.dataset.only != null && b.dataset.only !== '' ? +b.dataset.only : null, b.dataset.mail === '1');\n if (b.dataset.pdf7 === 'drivers') drvCheck782(b.dataset.iso, b.dataset.only != null && b.dataset.only !== '' ? +b.dataset.only : null, open7); else open7(); /* v7.82 - driver PDFs: the check first */", 'driver PDFs check first', p, True)
t = rep(t, " wrap.innerHTML = pages.join(''); wrap.classList.remove('ps7wrap'); wrap.classList.add('dpwrap'); wrap.dataset.dpReady = '';",
        " wrap.innerHTML = pages.join(''); wrap.classList.remove('ps7wrap'); wrap.classList.add('dpwrap'); wrap.dataset.dpReady = '';\n if (doc === 'drv' && drvValid782(iso, pick)) { if (!document.getElementById('drv782css')) { const s7 = document.createElement('style'); s7.id = 'drv782css'; s7.textContent = DRV782_CSS; document.head.appendChild(s7); }\n  wrap.querySelectorAll('.dp-page').forEach(pg => { const f = document.createElement('div'); f.className = 'dp782'; f.textContent = 'Checked by ' + DRV782_OK.by + ' · ' + DRV782_OK.at + ' · drop-off, way in, times and order'; pg.appendChild(f); }); } /* v7.82 */", 'checked-by on every sheet', p, True)
t = rep(t, "else dpPrint(iso, kind === 'install' ? 'ins' : 'drv', {link: true, only});",
        "else if (kind === 'install') dpPrint(iso, 'ins', {link: true, only}); else drvCheck782(iso, only, () => dpPrint(iso, 'drv', {link: true, only})); /* v7.82 - a direct link checks first too */",
        'direct print links check first', p, True)
t = rep(t, " T.lib = performance.now() - T.t0;\n if (!alive()) return null;",
        " T.lib = performance.now() - T.t0;\n if (!alive()) return null;\n if (kind === 'drivers' && !drvValid782(iso, pick)) throw new Error('something changed since the check (a location, a way in or a time) - press Drivers again and check it'); /* v7.82 - checked against the synced record */",
        'the PDF maker checks again after syncing', p, True)

# 7b. A drop-off placed at the branch reaches the driver sheet (the project manager, 2 Oct 2026: "drop off locations can be done at
#     the branch via Edit - if they update it, the run sheet locations update"). The sheet put a master-plan AREA ahead of a
#     placed position, so a branch placement changed the text but not the sheet. Now: a pin, a master-plan unit position, a
#     placed position, and only then an area - the same order the text and Navigate use.
t = rep(t, """ const m = masterLoc(a.key);
 if (m && m.ll) return {kind: m.prec === 'unit' ? 'master' : 'area', lat: m.ll[0], lon: m.ll[1], pt: fr(m.ll[0], m.ll[1]), how: m.how};
 let t = null; try { t = navTargetFor(a); } catch (e) { t = null; }
 if (t && t.ll) {
 if (t.placed) return {kind: 'placed', lat: t.ll.lat, lon: t.ll.lon, pt: fr(t.ll.lat, t.ll.lon), place: t.place};""", """ const m = masterLoc(a.key);
 if (m && m.ll && m.prec === 'unit') return {kind: 'master', lat: m.ll[0], lon: m.ll[1], pt: fr(m.ll[0], m.ll[1]), how: m.how, src: locSrc782(a.key)};
 let t = null; try { t = navTargetFor(a); } catch (e) { t = null; }
 if (t && t.ll && t.placed) return {kind: 'placed', lat: t.ll.lat, lon: t.ll.lon, pt: fr(t.ll.lat, t.ll.lon), place: t.place}; /* v7.82 - the branch's placement beats an area */
 { const D = descLoc782(a); if (D) return {kind: 'desc', lat: D.ll.lat, lon: D.ll.lon, pt: fr(D.ll.lat, D.ll.lon), how: D.src}; } /* v7.82 - water barriers */
 if (m && m.ll) return {kind: 'area', lat: m.ll[0], lon: m.ll[1], pt: fr(m.ll[0], m.ll[1]), how: m.how};
 if (t && t.ll) {
 if (t.placed) return {kind: 'placed', lat: t.ll.lat, lon: t.ll.lon, pt: fr(t.ll.lat, t.ll.lon), place: t.place};""", 'placed beats area on the driver sheet', p, True)

# 8. NO DROP-OFF YET: REPORT TO P33 (the project manager, 2 Oct 2026: "if no location, let's direct drivers to the pit lane
#    where P33 is"). Anything without an exact drop-off (none, an area only, or a position the map review left unverified)
#    sends the driver to P33 in the pit lane, where site directs them. The text, the driver sheet and the checks say so.
t = rep(t, "function text747Where(a){", """/* v7.82 - no exact drop-off yet: the driver reports to the pit lane (the spot by P33 that drivers know; the reference is
   never shown - it is only where the point is taken from) */
const REPORT_REF782 = 'P33';
function reportTo782(){ const m = (typeof MASTER_LOC !== 'undefined' && MASTER_LOC[REPORT_REF782]) || null; if (!m || !m.ll) return null;
 return {ref: REPORT_REF782, a: assetOf(REPORT_REF782), ll: {lat: m.ll[0], lon: m.ll[1], text: m.ll[0].toFixed(6) + ', ' + m.ll[1].toFixed(6)}}; }
function noDrop782(a){
 if (!a || a.key === REPORT_REF782) return false;
 if (descLoc782(a)) return false;
 let nt = null; try { nt = navTargetFor(a); } catch (e) {}
 if (nt && nt.placed) return false;
 if (nt && nt.pinned) return !!(nt.fix && nt.fix.master && MASTER_LOC[a.key] && MASTER_LOC[a.key].unverified);
 return true;
}
function report782(a){ return a && !movedFor(a) && noDrop782(a) ? reportTo782() : null; }
/* v7.82 - water barriers: the description names the spot. Twelve have it marked on the master (the label or marker the
   master puts at the place the description names); three the master does not mark were looked up from the description
   (evidence/water_barriers_from_description.json). */
const WB_DESC782 = {"WB01":{"ll":[-27.982069,153.423912],"src":"Gold Coast Hwy at the Tedder Ave intersection (from the description)"},"WB05":{"ll":[-27.982059,153.42347],"src":"Main Beach light rail station, Gold Coast Hwy (from the description)"},"WB06":{"ll":[-27.985905,153.426834],"src":"Gold Coast Hwy at the Macintosh Park turning lane (from the description - approximate, check on site)"}};
function descLoc782(a){
 if (!a || !/^WB\\d/.test(a.key)) return null;
 let nt = null; try { nt = navTargetFor(a); } catch (e) {}
 if (nt && (nt.placed || (nt.pinned && !(nt.fix && nt.fix.master)))) return null; /* a pin or a placement wins */
 const m = MASTER_LOC[a.key];
 if (m && m.ll) return {ll: {lat: m.ll[0], lon: m.ll[1], text: m.ll[0].toFixed(6) + ', ' + m.ll[1].toFixed(6)}, src: 'the spot the description names - ' + m.how};
 const w = WB_DESC782[a.key];
 return w ? {ll: {lat: w.ll[0], lon: w.ll[1], text: w.ll[0].toFixed(6) + ', ' + w.ll[1].toFixed(6)}, src: w.src} : null;
}
function text747Where(a){
 { const D = descLoc782(a); if (D && !movedFor(a)) return ['GPS: ' + D.ll.text + ' (water barriers: the spot the description names)', 'Navigate: ' + navUrl(D.ll)]; }
 { const R = report782(a); if (R) return ['No drop-off yet: report to the pit lane.', 'GPS: ' + R.ll.text + ' (pit lane)', 'Navigate: ' + navUrl(R.ll)]; }""", 'text: report to P33', p, True)
t = rep(t, "function text747WayIn(a){\n const e = entryOf(a.key); if (!e) return '';",
        "function text747WayIn(a){\n { const R = report782(a); if (R && R.a) return text747WayIn(R.a); } /* v7.82 - the way in to P33 */\n const e = entryOf(a.key); if (!e) return '';", 'text: the way in to P33', p, True)
t = rep(t, "function dpPos(a){\n const fr = (lat, lon) => { const p = frameOf(lat, lon); return dpInFrame(p) ? {ax: p.ax, ay: p.ay} : null; };",
        "function dpPos(a){\n const fr = (lat, lon) => { const p = frameOf(lat, lon); return dpInFrame(p) ? {ax: p.ax, ay: p.ay} : null; };\n { const R = report782(a); if (R) return {kind: 'report', lat: R.ll.lat, lon: R.ll.lon, pt: fr(R.ll.lat, R.ll.lon), ref: R.ref}; } /* v7.82 */", 'sheet: report to P33', p, True)
t = rep(t, " if (P.kind === 'master' && P.src) return {label: P.src.label, ll, line: P.src.line}; /* v7.82 */",
        " if (P.kind === 'desc') return {label: 'Where the description says', ll, line: P.how}; /* v7.82 */\n if (P.kind === 'report') return {label: 'Report to the pit lane', ll, line: 'No drop-off set yet · site directs you from there'}; /* v7.82 */\n if (P.kind === 'master' && P.src) return {label: P.src.label, ll, line: P.src.line}; /* v7.82 */", 'sheet: report words', p, True)

# 9. AN A4 LOCATION SIGN FOR EVERY ITEM (the project manager, 2 Oct 2026: "when sheets are done it also prints off a very
#    large reference number of the location, bordered, looking really nice in black and white, to be laminated and placed
#    on the delivery item ... so when things turn up it has a reference to where it goes"). Each driver sheet is followed,
#    in the same PDF and the same print, by one A4 sign per item it carries (deliveries only).
t = rep(t, "function dpPage(d, g, doc, i, n){", r"""/* v7.82 - the location sign: one A4 per item on a delivery load, black and white, for laminating */
const PL782_CSS = '.dp-page.pl782{justify-content:space-between;gap:0;padding:7mm;border:2.6mm solid #000;outline-offset:0;background:#fff;color:#000;font-family:Inter,Arial,sans-serif}'
 + '.pl782 .pl-top{display:flex;justify-content:space-between;align-items:center;border-bottom:.8mm solid #000;padding-bottom:3mm;font:800 13pt/1.1 "Barlow Condensed",Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase}'
 + '.pl782 .pl-k{margin-top:5mm;font:800 15pt/1 "Barlow Condensed",Inter,sans-serif;letter-spacing:.2em;text-transform:uppercase;text-align:center}'
 + '.pl782 .pl-ref{font:800 var(--plz,220pt)/.86 "Barlow Condensed",Inter,sans-serif;letter-spacing:-.01em;text-align:center;margin:6mm 0 5mm;white-space:nowrap}'
 + '.pl782 .pl-what{text-align:center;font:700 22pt/1.15 Inter,sans-serif;border-top:.5mm solid #000;border-bottom:.5mm solid #000;padding:3mm 0}'
 + '.pl782 .pl-where{margin-top:5mm;padding:4mm 5mm;border:.8mm solid #000;font:600 15pt/1.3 Inter,sans-serif}.pl782 .pl-where b{display:block;font:800 12pt/1 "Barlow Condensed",Inter,sans-serif;letter-spacing:.18em;margin-bottom:2mm}'
 + '.pl782 .pl-where.rep{border-width:1.6mm;font-weight:800}'
 + '.pl782 .pl-grid{display:grid;grid-template-columns:repeat(3,1fr);margin-top:5mm;border:.5mm solid #000}.pl782 .pl-grid div{padding:2.5mm 3mm;border-left:.5mm solid #000;font:700 14pt/1.15 Inter,sans-serif}.pl782 .pl-grid div:first-child{border-left:0}.pl782 .pl-grid span{display:block;font:700 9pt/1 Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase;margin-bottom:1.5mm}'
 + '.pl782 .pl-foot{margin-top:5mm;padding-top:3mm;border-top:.8mm solid #000;font:700 12pt/1.3 Inter,sans-serif;text-align:center}';
function pl782Pages(d, g, i, n){
 if (g.kind === 'removals') return '';
 const out = [], items = [];
 g.rows.forEach(r => { const a = r.a; if (!a) return; const evs = (r.events || []).filter(e => e.movement !== 'remove');
  (evs.length ? evs : [{item: (a.item_types || a.asked_for || []).join(', ')}]).forEach(e => items.push({a, item: String(e.item || '').trim()})); });
 items.forEach((x, k) => { const a = x.a, m = masterLoc(a.key) || {}, R = report782(a), w = whereText(a);
  const clean = xs => (xs || []).map(v => String(v).replace(/\s*\(~[^)]*\)\s*$/, '')).filter(Boolean);
  const bits = [m.sec ? 'Section ' + m.sec : '', clean(m.near).slice(0, 2).length ? 'near ' + clean(m.near).slice(0, 2).join(', ') : '', clean([].concat(m.beside || [], m.next || [])).slice(0, 3).length ? 'beside ' + clean([].concat(m.beside || [], m.next || [])).slice(0, 3).join(', ') : ''].filter(Boolean);
  const where = R ? '<div class="pl-where rep"><b>DROP-OFF</b>No drop-off set yet. Report to the pit lane - site will direct you.</div>'
   : '<div class="pl-where"><b>GOES TO</b>' + esc(w.main || bits.join(' · ') || 'See the driver sheet') + (w.main && bits.length ? '<br><span style="font-weight:500">' + esc(bits.join(' · ')) + '</span>' : '') + '</div>';
  const L = String(a.key).length, z = L <= 3 ? 330 : L === 4 ? 265 : L === 5 ? 215 : L === 6 ? 180 : 140;
  out.push(`<section class="dp-page pl782" data-load="${i}" data-pl="${esc(a.key)}"><div><div class="pl-top"><span>Coates · GC500 2026</span><span>Delivery location</span></div>
   <div class="pl-k">Location reference</div><div class="pl-ref" style="--plz:${z}pt">${esc(a.key)}</div>
   <div class="pl-what">${esc(x.item || 'Delivery item')}</div>${where}
   <div class="pl-grid"><div><span>Due on site</span>${esc(fmtDate(d.iso))}</div><div><span>Load</span>${i} of ${n}</div><div><span>Item</span>${k + 1} of ${items.length}</div></div></div>
   <div class="pl-foot">Laminate this sign and fix it to the item where it can be seen.<br>Leave it on until the item is in its place.</div></section>`); });
 return out.join('');
}
function dpPage(d, g, doc, i, n){""", 'location signs', p, True)
t = rep(t, "const pages = pick.map(i => dpPage(d, loads[i], doc, i + 1, loads.length));",
        "const pages = pick.map(i => dpPage(d, loads[i], doc, i + 1, loads.length) + (doc === 'drv' ? pl782Pages(d, loads[i], i + 1, loads.length) : '')); /* v7.82 - each driver sheet, then its location signs */\n if (doc === 'drv' && !document.getElementById('pl782css')) { const s9 = document.createElement('style'); s9.id = 'pl782css'; s9.textContent = PL782_CSS; document.head.appendChild(s9); }",
        'signs follow each driver sheet', p, True)
# the PDFs: a load's file holds its sheet and its signs; "all loads" holds every page
t = rep(t, "const shots = [];", "const shots = [], grp782 = []; /* v7.82 - pages per load: a sheet, then its signs */", 'pages grouped per load', p, True)
t = rep(t, "shots.push(sh);\n }", "shots.push(sh);\n if (!grp782.length || !(nodes[i].classList && nodes[i].classList.contains('pl782'))) grp782.push([]); grp782[grp782.length - 1].push(sh);\n }", 'group the pages', p, True)
t = rep(t, "pdf7Put(D, shots[k], true, m); file(D, pdf7Name(kind, iso, g, li, n), 'load', 1, 'Load ' + (li + 1) + ' · ' + refs, li);",
        "const G = grp782[k] || [shots[k]]; G.forEach((sh, j) => pdf7Put(D, sh, j === 0, m)); file(D, pdf7Name(kind, iso, g, li, n), 'load', G.length, 'Load ' + (li + 1) + ' · ' + refs + (G.length > 1 ? ' · ' + (G.length - 1) + ' location sign' + (G.length === 2 ? '' : 's') : ''), li);",
        'a load file carries its signs', p, True)

# 10. INVENTORY: EVERY LOCATION STILL TO COME, CLICKABLE (the project manager, 2 Oct 2026: "in inventory, you know how it says
#     still to come - let's mention all locations that still need to be done. You can click on the location and it also
#     shows you where it is, so everything clickable"). Under the inventory table: every location with something still to
#     come (the table's own "Still to come" count, by the same trade filter), grouped by due day. The reference opens the
#     item; Map shows where it goes.
t = rep(t, "function invHtml(ro){", r"""/* v7.82 - every location still to come, grouped by due day; the reference opens the item, Map shows where it goes */
function togo782Html(I){
 const rows = I.list.filter(r => INV.disc === '*' || r.disc === INV.disc), by = new Map();
 rows.forEach(r => Object.values(r.refs || {}).forEach(x => { const n = x.asked - x.on; if (n <= 0) return;
  const e = by.get(x.key) || {key: x.key, items: [], short: !!x.onsite}; e.items.push(n + ' × ' + r.item); by.set(x.key, e); }));
 /* and every other location not on site yet - the ones with no priced line are still deliveries to do */
 allAssets().filter(a => !a._cancelled && !a.relocation && !movedAway(a.key) && !by.has(a.key) && !inPlace782(a.key)).forEach(a => {
  let d = ''; try { d = invTypeDisc(invTypeOf(a) || ''); } catch (e) {}
  if (INV.disc !== '*' && d !== INV.disc) return;
  const w = (a.item_types || a.asked_for || []).filter(Boolean).join(', ') || a.name || '';
  by.set(a.key, {key: a.key, items: [w || 'not priced on the schedule'], short: false}); });
 const list = [...by.values()].map(e => { const a = assetOf(e.key); return Object.assign(e, {a, due: (a && effectiveDates(a).in) || ''}); }).filter(e => e.a)
  .sort((p, q) => String(p.due || '9').localeCompare(String(q.due || '9')) || p.key.localeCompare(q.key, undefined, {numeric: true}));
 if (!list.length) return `<div class="tg782"><h3 class="invh">Still to come - every location</h3><p class="norate">Nothing still to come${INV.disc !== '*' ? ' in ' + esc(INV.disc) : ''}.</p></div>`;
 const days = new Map(); list.forEach(e => { const k = e.due || ''; if (!days.has(k)) days.set(k, []); days.get(k).push(e); });
 const line = e => { const a = e.a, w = whereText(a), m = masterLoc(a.key) || {}, dr = typeof dirs782 === 'function' && !inPlace782(a.key) ? dirs782(a) : null;
  const clean = xs => (xs || []).map(v => String(v).replace(/\s*\(~[^)]*\)\s*$/, '')).filter(Boolean), nb = clean(m.near).slice(0, 2), bs = clean([].concat(m.beside || [], m.next || [])).slice(0, 3);
  const D = typeof descLoc782 === 'function' ? descLoc782(a) : null;
  const loc = [m.sec ? 'Section ' + m.sec : '', nb.length ? 'near ' + nb.join(', ') : '', bs.length ? 'beside ' + bs.join(', ') : ''].filter(Boolean).join(' · ')
   || (D ? 'the spot the description names' : dr && dr.report ? 'no drop-off yet - report to the pit lane' : 'no location on the map yet');
  const where = a.name || w.main || a.key;
  const tag = !dr ? '' : dr.ok && dr.report ? '<span class="tg-t tg-r">set the drop-off in Edit</span>' : dr.ok ? '<span class="tg-t tg-ok">directions set</span>' : '<span class="tg-t tg-no">' + esc(dr.missing.join(', ')) + '</span>';
  return `<li><button type="button" class="tg-ref" data-open="${esc(a.key)}" title="Open ${esc(a.key)}">${refPlate(a.key, 18)}</button>
   <div class="tg-w"><b>${esc(where)}</b><span class="tg-loc">${esc(loc)}</span><span>${esc(e.items.join(' · '))}${e.short ? ' · short - the rest still to come' : ''}</span>${tag}</div>
   ${mapPlaceFor(a) || mapSheetFor(a) ? `<button type="button" class="btn sm tg-map" data-map="${esc(a.key)}" title="Show ${esc(a.key)} on the map">Map ›</button>` : `<button type="button" class="btn sm ghost tg-map" data-open="${esc(a.key)}" title="No spot on the map yet - open ${esc(a.key)} to place it">Set in Edit ›</button>`}</li>`; };
 return `<div class="tg782" id="tg782"><h3 class="invh">Still to come - every location (${list.length})</h3>
  <p class="hint">Everything ordered that is not on site yet${INV.disc !== '*' ? ' in ' + esc(INV.disc) : ''}, by the day it is due. Press a reference to open it, or Map to see where it goes.</p>
  <div class="tg-box">${[...days.entries()].map(([d, es]) => `<div class="tg-day"><div class="tg-dh">${d ? esc(fmtDate(d)) : 'No date yet'} <span class="w">· ${es.length} location${es.length === 1 ? '' : 's'}</span></div><ul>${es.map(line).join('')}</ul></div>`).join('')}</div></div>`;
}
function invHtml(ro){""", 'inventory: every location still to come', p, True)
t = rep(t, " ${invDrillHtml(I)}\n<div class=\"hint\">Press any number", " ${invDrillHtml(I)}\n${togo782Html(I)}\n<div class=\"hint\">Press any number", 'the list under the table', p, True)
t = rep(t, "function invBind(pane){\n const q = s => pane.querySelector(s);", """function invBind(pane){
 const q = s => pane.querySelector(s);
 pane.querySelectorAll('#tg782 [data-open]').forEach(b => b.onclick = () => openAsset(b.dataset.open)); /* v7.82 */
 pane.querySelectorAll('#tg782 [data-map]').forEach(b => b.onclick = () => showOnMap(b.dataset.map));""", 'the list is clickable', p, True)
t = rep(t, ".rules782{margin:10px 0;", """.tg782{margin:14px 0 6px}.tg782 .tg-box{max-height:560px;overflow:auto;border:1px solid var(--line,rgba(0,0,0,.12));border-radius:10px;padding:4px 10px}
.tg782 .tg-dh{position:sticky;top:0;background:var(--card,#fff);padding:8px 0 4px;font-weight:800;border-bottom:1px solid var(--line,rgba(0,0,0,.12));z-index:1}
.tg782 ul{list-style:none;margin:0;padding:0}.tg782 li{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:7px 0;border-bottom:1px dashed var(--line,rgba(0,0,0,.1))}
.tg782 .tg-ref{all:unset;cursor:pointer}.tg782 .tg-ref:focus-visible{outline:2px solid var(--orange,#ff6a13)}.tg782 .tg-w{min-width:0;display:flex;flex-direction:column;gap:2px}.tg782 .tg-w b{overflow-wrap:anywhere}.tg782 .tg-w span{color:var(--mute,#5d6468);font-size:13px}
.tg782 .tg-w .tg-loc{color:var(--ink,#15181a);font-size:13.5px}.tg782 .tg-w .tg-t{font-size:12px;font-weight:700}.tg782 .tg-w .tg-ok{color:#1f9d55}.tg782 .tg-w .tg-no{color:#d93d2f}.tg782 .tg-w .tg-r{color:#d97706}
.rules782{margin:10px 0;""", 'list styles', p, True)

# 11. EVERY LOCATION HAS ITS WAY IN (the project manager, 2 Oct 2026: "the pit lane is the entry point for anything in the
#     Macintosh Island area. Main Beach seaside: entry from the north end. The other side of the road on Main Beach: entry
#     from the south end of Main Beach Rd as you come around the track. Everything over the pedestrian bridge from the island
#     to the Main Beach Rd area: from the south end of Main Beach, coming around the race track. We should know all entry
#     points for everything now - don't flag them"). Zones read off the master D001 (evidence/entry_zones_D001.json and
#     entry_zones_on_master_D001.jpg). Gate 1 / Helen Park and Gate 2 / Commodore Park use D007's own entry points (the Tedder
#     Ave access point - heavy vehicle entry; Gate 2 at the GC Hwy underpass via Commodore Dr), for the project manager to
#     confirm. Turn 2 / Ferny Ave and Admiralty Dr are not covered by either and stay flagged until he says.
ZJ = json.load(open(os.path.join(HERE, 'evidence', 'entry_zones_D001.json')))
t = rep(t, "function entry782(a){\n const nt = navTargetFor(a); const s = nt ? mbpSide782(nt.ll) : null; if (!s) return null;",
        "/* v7.82 - the way in by area, read off the master D001 */\nconst ZONES782 = " + json.dumps(ZJ['zones'], separators=(',', ':')) + ", ROAD782 = " + json.dumps(ZJ['mbp_esplanade_road'], separators=(',', ':')) + """;
let PTFIT782 = null;
/* a position on the master sheet: the master's own point, else from latitude and longitude through a fit of every master unit */
function ptOf782(a, ll){
 const m = MASTER_LOC[a.key]; if (m && m.pt) return m.pt;
 if (!ll) return null;
 if (!PTFIT782) { const S = [[0,0,0],[0,0,0],[0,0,0]], bx = [0,0,0], by = [0,0,0];
  Object.values(MASTER_LOC).forEach(v => { if (!v.ll || !v.pt || v.prec !== 'unit') return; const r = [v.ll[1], v.ll[0], 1];
   for (let i = 0; i < 3; i++) { for (let j = 0; j < 3; j++) S[i][j] += r[i] * r[j]; bx[i] += r[i] * v.pt[0]; by[i] += r[i] * v.pt[1]; } });
  const solve = (M, b) => { const A = M.map((r, i) => r.concat([b[i]])); for (let c = 0; c < 3; c++) { let p = c; for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < 3; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 4; k++) A[r][k] -= f * A[c][k]; } } return A.map((r, i) => r[3] / r[i]); };
  PTFIT782 = {x: solve(S, bx), y: solve(S, by)}; }
 const r = [ll.lon, ll.lat, 1], f = PTFIT782; return [r[0] * f.x[0] + r[1] * f.x[1] + f.x[2], r[0] * f.y[0] + r[1] * f.y[1] + f.y[2]];
}
function inPoly782(p, P){ let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if (((yi > p[1]) !== (yj > p[1])) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
function roadY782(x){ for (let i = 1; i < ROAD782.length; i++) if (x <= ROAD782[i][0]) { const [x0, y0] = ROAD782[i - 1], [x1, y1] = ROAD782[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); } return ROAD782[ROAD782.length - 1][1]; }
function zoneEntry782(a){
 if (!a || inPlace782(a.key)) return null;
 let nt = null; try { nt = navTargetFor(a); } catch (e) {}
 const D = typeof descLoc782 === 'function' ? descLoc782(a) : null, ll = nt ? nt.ll : D ? D.ll : null, pt = ptOf782(a, ll); if (!pt) return null;
 if (inPoly782(pt, ZONES782.island)) return {side: 'pit lane', zone: 'island', sms: 'ENTRY: Macintosh Island area - in via the pit lane.', words: 'Macintosh Island area: the pit lane is the way in (the project manager, 2 Oct 2026).'};
 if (inPoly782(pt, ZONES782.mbp) || inPoly782(pt, ZONES782.surfers)) {
  if (pt[1] < roadY782(pt[0]) - 0.004) return {side: 'seaside', zone: 'main beach', sms: 'ENTRY: seaside - in at the Seaworld Dr roundabout end of Main Beach Pde, drive south.', words: 'Seaside of Main Beach Pde / The Esplanade: come in at the Seaworld Dr roundabout (north) end and drive south (the project manager, 2 Oct 2026).'};
  return {side: 'land side', zone: 'main beach', sms: 'ENTRY: land side - in from the Surfers end of Main Beach Pde, drive north (race direction).', words: 'Land side of Main Beach Pde, and everything over the pedestrian bridge from the island: come in at the south end of Main Beach Pde and follow the track around (the project manager, 2 Oct 2026).'};
 }
 if (inPoly782(pt, ZONES782.gate1)) return {side: 'Tedder Ave', zone: 'gate 1', sms: 'ENTRY: in at the Tedder Ave access point (heavy vehicle entry, D007).', words: 'Gate 1 / Helen Park / The Hill: in at the Tedder Ave access point - D007 marks it heavy vehicle entry only.'};
 if (inPoly782(pt, ZONES782.gate2)) return {side: 'Gate 2', zone: 'gate 2', sms: 'ENTRY: in at Gate 2, the GC Hwy underpass, via Commodore Dr (D007).', words: 'Gate 2 / Commodore Park: in at Gate 2, the Gold Coast Hwy underpass, via Commodore Dr (D007).'};
 return null;
}
function entry782(a){
 const nt = navTargetFor(a); const s = nt ? mbpSide782(nt.ll) : null; if (!s) return zoneEntry782(a);""", 'way in by area', p, True)

# 12. ONE DESTINATION, READ THE SAME EVERYWHERE (Codex recheck, 2 Oct 2026). The text, Full details, the Navigate button
#     (its label, its spoken text and its tooltip), the load and drop-card QR codes, the sheet and the way in each worked out
#     the destination for themselves, so an item with no drop-off could be texted to the pit lane while the button sent the
#     driver to its unverified drawing spot, and the text could pair the pit lane with an ENTRY line worked out from the
#     item's own spot. dest782() is now the one answer they all read: the spot the description names (water barriers), then
#     the pit lane when there is no drop-off, then the position on the record - with its provenance, said the same way on
#     every surface, and an approximate spot that says so even in the short text. The due date and the time asked for are
#     always in the text; only the link and the extras give way when it is long.
t = rep(t, "function report782(a){ return a && !movedFor(a) && noDrop782(a) ? reportTo782() : null; }",
        r"""function report782(a){ return a && !movedFor(a) && noDrop782(a) ? reportTo782() : null; }
/* v7.82 - ONE DESTINATION for an item, read by every surface that sends a driver (Codex recheck) */
function dest782(a){
 if (!a) return null;
 if (!movedFor(a)) {
  const D = descLoc782(a);
  if (D) { const ap = /approximate/i.test(D.src || ''); return {kind: 'desc', ll: D.ll, a, approx: ap, label: 'description',
   sms: 'water barriers: the spot the description names' + (ap ? ', approximate - check on site' : ''),
   spoken: 'to the spot the description names' + (ap ? ' (approximate - check on site)' : '') + ' for', nav: 'the spot the description names for ' + a.key + ' - ' + D.src}; }
  const R = report782(a);
  if (R) return {kind: 'report', ll: R.ll, a: R.a || a, approx: false, label: 'pit lane', sms: 'pit lane',
   spoken: 'to the pit lane (no drop-off yet) for', nav: 'the pit lane - no drop-off is set for ' + a.key + ' yet; the driver reports there and site directs them'};
 }
 const nt = navTargetFor(a); if (!nt || !nt.ll) return null;
 const L = nt.pinned && nt.fix && nt.fix.master ? locSrc782(a.key) : null;
 if (L) return {kind: L.kind, ll: nt.ll, a, nt, approx: L.kind === 'unverified', label: L.kind === 'confirmed' ? 'confirmed' : 'not verified', sms: L.sms,
  spoken: L.kind === 'confirmed' ? 'to the spot the project manager confirmed for' : 'to a drawing position (not verified - check it on site) for', nav: L.nav};
 if (nt.pinned && nt.fix && nt.fix.master) return {kind: 'master', ll: nt.ll, a, nt, approx: false, label: 'master plan', sms: 'master plan', spoken: 'to the spot on the master plan for'};
 if (nt.pinned) return {kind: 'pinned', ll: nt.ll, a, nt, approx: false, label: 'pinned', sms: 'pinned on site' + (nt.fix && nt.fix.acc != null ? ', within ' + Math.max(1, Math.round(nt.fix.acc)) + ' m' : ''), spoken: 'to the spot pinned on site for'};
 if (nt.placed) return {kind: 'placed', ll: nt.ll, a, nt, approx: true, label: 'placed', sms: 'placed on the map, not yet checked on site', spoken: 'to the spot placed on the map (not yet checked on site) for'};
 return {kind: 'area', ll: nt.ll, a, nt, approx: true, label: 'area', sms: 'the area, not the exact spot', spoken: 'to the planned area (not the exact spot) for'};
}
/* the fallbacks the text names on its own (the pit lane, the description) - every other surface reads these the same way */
function destOwn782(a){ const d = dest782(a); return d && (d.kind === 'report' || d.kind === 'desc') ? d : null; }""", 'one destination', p, True)

# the short text: where, from the one destination
i0 = t.find('function text747Where(a){'); i1 = t.find('function text747WayIn(a){')
assert i0 > 0 and i1 > i0 and t.count('function text747Where(a){') == 1, 'text747Where'
t = t[:i0] + r"""function text747Where(a){
 const D7 = dest782(a); /* v7.82 - the one destination (Codex recheck) */
 if (!D7) return [movedFor(a) ? 'Location changed. Please confirm the new location before departure.' : 'Location not yet confirmed. Please contact the site team before departure.'];
 if (D7.kind === 'report') return ['No drop-off yet: report to the pit lane.', 'GPS: ' + D7.ll.text + ' (pit lane)', 'Navigate: ' + navUrl(D7.ll)];
 return ['GPS: ' + D7.ll.lat.toFixed(6) + ', ' + D7.ll.lon.toFixed(6) + ' (' + D7.sms + ')', 'Navigate: ' + navUrl(D7.ll)];
}
""" + t[i1:]
# the due date and the time asked for always go; only the link and the extras give way
t = rep(t, """ const link = text747Link(a);
 [text747When(a),link ? 'Delivery details: ' + link : ''].filter(Boolean).forEach(o => {""",
        """ { const w = text747When(a); if (w) L.push(w); } /* v7.82 - the due date and the time asked for always go (Codex recheck) */
 const link = text747Link(a);
 [link ? 'Delivery details: ' + link : ''].filter(Boolean).forEach(o => {""", 'text: the time always goes', p, True)
# the way in: from the destination - the pit lane's own when the driver reports there, never the item's
t = rep(t, "function entry782(a){\n const nt = navTargetFor(a); const s = nt ? mbpSide782(nt.ll) : null; if (!s) return zoneEntry782(a);",
        "function entry782(a){\n { const R = report782(a); if (R) return R.a && R.a.key !== a.key ? entry782(R.a) : null; } /* v7.82 - the pit lane's way in, never the item's own (Codex recheck) */\n const D7 = dest782(a); const s = D7 ? mbpSide782(D7.ll) : null; if (!s) return zoneEntry782(a);", 'way in from the destination', p, True)
t = rep(t, """function zoneEntry782(a){
 if (!a || inPlace782(a.key)) return null;
 let nt = null; try { nt = navTargetFor(a); } catch (e) {}
 const D = typeof descLoc782 === 'function' ? descLoc782(a) : null, ll = nt ? nt.ll : D ? D.ll : null, pt = ptOf782(a, ll); if (!pt) return null;""",
        """function zoneEntry782(a){
 if (!a || inPlace782(a.key)) return null;
 { const R = report782(a); if (R) return R.a && R.a.key !== a.key ? zoneEntry782(R.a) : null; } /* v7.82 - the pit lane's own */
 const D7 = dest782(a), ll = D7 ? D7.ll : null, pt = D7 && D7.kind === 'desc' && !(MASTER_LOC[a.key] && MASTER_LOC[a.key].pt) ? ptOf782({key: ''}, ll) : ptOf782(a, ll); if (!pt) return null;""", 'zone way in from the destination', p, True)
# the Navigate button: where it goes, its label, its spoken words and its tooltip all from the one destination
t = rep(t, "function navPointFor(a){ const t = navTargetFor(a); return t ? t.ll : null; }",
        "function navPointFor(a){ const d = dest782(a); return d ? d.ll : null; } /* v7.82 - the one destination */", 'navigate: the one destination', p, True)
t = rep(t, "function navSays(a){\n const t = navTargetFor(a);",
        "function navSays(a){\n { const D7 = dest782(a); if (D7 && (D7.kind === 'report' || D7.kind === 'desc' || D7.kind === 'confirmed' || D7.kind === 'unverified')) return 'Opens your maps app with driving directions to ' + D7.nav + '.'; } /* v7.82 */\n const t = navTargetFor(a);", 'navigate: tooltip', p, True)
t = rep(t, """ title="${esc(navSays(a))}"${(navTargetFor(a) || {}).pinned ? ' data-pinned="1"' : ''}>${NAV_PIN}<span>Navigate</span>${(navTargetFor(a) || {}).pinned ?'<span class="navpinned" aria-hidden="true">' + (masterUnit(a && a.key) ? 'master plan' : 'pinned') + '</span>' : ''}<span class="vh"> ${(navTargetFor(a) || {}).pinned ? (masterUnit(a && a.key) ? 'to the spot on the master plan for' : 'to the spot pinned on site for') : 'to the planned area for'} ${esc((a && a.key) || 'this drop')}, opens your maps app</span></a>`;""",
        """ title="${esc(navSays(a))}"${D7n && D7n.kind !== 'area' && D7n.kind !== 'placed' ? ' data-pinned="1"' : ''}>${NAV_PIN}<span>Navigate</span>${D7n && D7n.kind !== 'area' ? '<span class="navpinned" aria-hidden="true">' + esc(D7n.label) + '</span>' : ''}<span class="vh"> ${esc(D7n ? D7n.spoken : 'to the planned area for')} ${esc((a && a.key) || 'this drop')}, opens your maps app</span></a>`; /* v7.82 - label, spoken words and tooltip from one destination */""", 'navigate: label and spoken words', p, True)
t = rep(t, "function navBtn(a, opts){\n const o = opts || {};\n const ll = o.ll || navPointFor(a);",
        "function navBtn(a, opts){\n const o = opts || {};\n const D7n = dest782(a), ll = o.ll || (D7n ? D7n.ll : null);", 'navigate: button', p, True)
# Full details: the same destination
t = rep(t, " const nt = navTargetFor(a), ll = nt ? nt.ll : null;\n if (ll && nt.pinned) {",
        " const D7f = destOwn782(a), nt = navTargetFor(a), ll = D7f ? D7f.ll : nt ? nt.ll : null; /* v7.82 - the one destination */\n if (D7f) {\n L.push(`Directions: ${navUrl(ll)}`);\n L.push(`Or key in: ${ll.text} — ${D7f.nav}.`);\n } else if (ll && nt.pinned) {", 'full details: the one destination', p, True)
# the load's go button and QR, and the drop card
t = rep(t, " let t = null; try { t = navTargetFor(r.a); } catch (e) { t = null; }\n if (t && t.ll) return {t, a: r.a, more: g.rows.length > 1};",
        " let t = null; try { const D7 = dest782(r.a); t = D7 ? Object.assign({}, D7.nt || {}, {ll: D7.ll, D7}) : null; } catch (e) { t = null; } /* v7.82 - the one destination */\n if (t && t.ll) return {t, a: r.a, more: g.rows.length > 1};", 'load go: the one destination', p, True)
t = rep(t, "function ldGoWord751(t){\n", "function ldGoWord751(t){\n if (t.D7) return t.D7.sms; /* v7.82 - said the same way as the text */\n", 'load go: words', p, True)
t = rep(t, "const qrT = navTargetFor(a), qr = qrT ?", "const qrT = dest782(a), qr = qrT ?", 'drop picture QR: the one destination', p, True)
t = rep(t, " const pinT = (as.length === 1 ? navTargetFor(as[0]) : null);",
        " const D7c = as.length === 1 ? destOwn782(as[0]) : null, pinT = D7c ? {pinned: true, ll: D7c.ll, D7: D7c} : (as.length === 1 ? navTargetFor(as[0]) : null); /* v7.82 - the one destination */", 'drop card: the one destination', p, True)
t = rep(t, "${ll ? `<p class=\"fine\">Satnav: <b class=\"mono\">${cardEsc(ll.text)}</b> — the drawing's spot for this reference, good to within a metre or so. It is a drawing position, not a surveyed one: drive to it, then take the spot from the supervisor.</p>` : ''}",
        "${ll ? `<p class=\"fine\">Satnav: <b class=\"mono\">${cardEsc(ll.text)}</b> — ${pinT && pinT.D7 ? cardEsc(pinT.D7.nav) + '.' : 'the drawing\\'s spot for this reference, good to within a metre or so. It is a drawing position, not a surveyed one: drive to it, then take the spot from the supervisor.'}</p>` : ''}", 'drop card: satnav words', p, True)
t = rep(t, "${pinT && pinT.pinned ? 'Navigate to the pinned spot' : 'Navigate to the drop area'}",
        "${pinT && pinT.D7 ? (pinT.D7.kind === 'report' ? 'Navigate to the pit lane' : 'Navigate to the spot the description names') : pinT && pinT.pinned ? 'Navigate to the pinned spot' : 'Navigate to the drop area'}", 'drop card: button words', p, True)
# the satellite block's Navigate and the day table's drive link
t = rep(t, "${(() => { const t = navTargetFor(a); return t && t.pinned\n ? `<a class=\"btn ghost tiny out\" href=\"${esc(navUrl(t.ll))}\" target=\"_blank\" rel=\"noopener\" title=\"${esc(navSays(a))}\">Navigate ↗ <span class=\"navpinned\">pinned</span></a>`",
        "${(() => { const D7s = destOwn782(a), t = D7s ? {pinned: true, ll: D7s.ll, D7: D7s} : navTargetFor(a); return t && t.pinned\n ? `<a class=\"btn ghost tiny out\" href=\"${esc(navUrl(t.ll))}\" target=\"_blank\" rel=\"noopener\" title=\"${esc(navSays(a))}\">Navigate ↗ <span class=\"navpinned\">${esc(t.D7 ? t.D7.label : (dest782(a) || {}).label || 'pinned')}</span></a>`", 'satellite block: the one destination', p, True)
t = rep(t, "function dayPinCell(a){\n if (!a || !isRef(a.key)) return '';",
        "function dayPinCell(a){\n if (!a || !isRef(a.key)) return '';\n { const D7 = destOwn782(a); if (D7) return `<br><span class=\"chip ref\" title=\"${esc(D7.nav)}\">${esc(D7.label)}</span>\n <a class=\"linkish\" href=\"${navUrl(D7.ll)}\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"driving directions to ${esc(D7.nav)}\">drive</a>\n <a class=\"linkish\" href=\"${walkUrl(D7.ll)}\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"walking directions to ${esc(D7.nav)}\">walk to it</a>`; } /* v7.82 - the one destination */", 'day table: the one destination', p, True)
# the sheet: the description's spot is named as the description, as the text names it
t = rep(t, " { const R = report782(a); if (R) return {kind: 'report', lat: R.ll.lat, lon: R.ll.lon, pt: fr(R.ll.lat, R.ll.lon), ref: R.ref}; } /* v7.82 */",
        " { const R = report782(a); if (R) return {kind: 'report', lat: R.ll.lat, lon: R.ll.lon, pt: fr(R.ll.lat, R.ll.lon), ref: R.ref}; } /* v7.82 */\n { const D7 = dest782(a); if (D7 && D7.kind === 'desc') return {kind: 'desc', lat: D7.ll.lat, lon: D7.ll.lon, pt: fr(D7.ll.lat, D7.ll.lon), how: descLoc782(a).src}; } /* v7.82 - as the text names it */", 'sheet: the one destination', p, True)

t = t.replace('/* v7.80 - a save empties', '/* v7.82 - GN21 read off D024 correctly; driver rules (entry by side of Main Beach Pde, delivery order, stagger, parks, loading at Kingston, the time is an unloaded-by time, firm instructions before dispatch, a check before driver sheets print, location signs, the pit lane when there is no drop-off, water barriers from their description, every location still to come in Inventory). */\n/* v7.80 - a save empties', 1)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.82 applied: GN21 corrected on the master; driver rules on Text it and Full details')
