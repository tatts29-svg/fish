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
t = rep(t, " const src = nt.pinned && nt.fix && nt.fix.master ? 'master plan'",
        " const conf782 = nt.pinned && nt.fix && nt.fix.master && typeof masterLoc === 'function' && masterLoc(a.key) && masterLoc(a.key).confirmed; /* v7.82 */\n const src = conf782 ? 'confirmed by the project manager' : nt.pinned && nt.fix && nt.fix.master ? 'master plan'",
        'a spot the project manager confirmed says so', p, True)

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
   the delivery order - you would not load a waste tank after 09:00 with the toilet block first. Peak windows as he
   supplied them: heavy and oversize loads under permit face daytime travel restrictions on the M1 and arterials toward
   the Gold Coast 07:00-09:00 and 16:00-18:00 - every driver checks their own permit's conditions. Schedule load times are
   Kingston load times; the run to site is the page's planning figure (transport.kingston_run, about 70 min). */
const LOAD782 = 'LOAD at Kingston by 05:00, in the delivery order - about 70 min to site. Keep off the M1 into the Gold Coast 07:00-09:00 and 16:00-18:00 (heavy/oversize permit loads: check your permit).';
const LOAD_BY782 = 5 * 60;
const LOAD_SMS782 = 'LOAD: Kingston by 05:00, in order.';
const PEAKS782 = [[7 * 60, 9 * 60], [16 * 60, 18 * 60]];
function hhmm782(s){ const m = /^\s*(\d{1,2}):?(\d{2})\s*$/.exec(String(s || '')); if (!m) return null; const h = +m[1], mi = +m[2]; return h < 24 && mi < 60 ? h * 60 + mi : null; }
function clock782(n){ return String(Math.floor(n / 60) %% 24).padStart(2, '0') + ':' + String(n %% 60).padStart(2, '0'); }
function loads782(a){
 const kr = (DATA.transport || {}).kingston_run || {}, run = Math.round(kr.minutes_rounded || kr.minutes || 70);
 return (a.events || []).filter(e => e.movement !== 'remove').map(e => { const m = hhmm782(e.load_time); return m == null ? null : {item: e.item || '', date: e.date, at: m, arrive: m + run, run}; }).filter(Boolean);
}
/* a unit already on site has nothing left to load - the check is for what is still to come */
function loadCheck782(a){
 const out = [], L = inPlace782(a.key) ? [] : loads782(a);
 L.forEach(l => { const p = PEAKS782.find(([s, e]) => l.at < e && l.arrive > s), late = l.at > LOAD_BY782; if (!p && !late) return;
  out.push((l.item ? l.item + ': ' : '') + 'load ' + clock782(l.at) + (late ? ' is after 05:00' : '') + (p ? (late ? ' and puts' : ' puts') + ' the truck on the road ' + clock782(l.at) + '-' + clock782(l.arrive) + ', inside the ' + clock782(p[0]) + '-' + clock782(p[1]) + ' peak' : '')); });
 const tank = L.find(l => /waste tank/i.test(l.item)), block = L.find(l => /toilet block/i.test(l.item));
 if (tank && block && tank.at >= block.at) out.push('the waste tank loads at ' + clock782(tank.at) + ', not before the toilet block (' + clock782(block.at) + ') - load the tank first');
 const o = ORDER782.find(x => x.ref === a.key);
 (o && o.after || []).forEach(f => { const fa = assetOf(f), fl = fa ? loads782(fa) : []; if (!fl.length || !L.length) return;
  const mine = Math.min(...L.map(l => l.at)), theirs = Math.max(...fl.map(l => l.at));
  if (mine <= theirs) out.push('loads at ' + clock782(mine) + ', not after ' + f + ' (' + clock782(theirs) + ') - load in the delivery order, staggered'); });
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
 if (park782(a)) L.push('Park access: watch for wildlife and low branches; some spots have no room to spare. ' + ((DATA.driver_rules || {}).escort || ''));
 L.push(STAGGER782 + ' Bring things in the order above.');
 L.push('Event week (D007): circuit traffic one-way counter-clockwise 00:00 Mon 20 Oct to 17:00 Mon 27 Oct · 40 km/h on track · 10 km/h in Macintosh Park.');
 return L;
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
 L.push(row('Loading', esc(LOAD782.replace(/^LOAD /, 'Load '))));
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
const TIME782 = 'TIME: the time given is when you must be UNLOADED by - not when you arrive. Get there early. Miss it and the other crews wait, or the area is closed (barriers in, no traffic control). Time frames must be kept.';
function timeCheck782(a){
 const d = deliveryOf(a.key) || {}, by = hhmm782(d.eta); if (by == null || inPlace782(a.key)) return [];
 const kr = (DATA.transport || {}).kingston_run || {}, run = Math.round(kr.minutes_rounded || kr.minutes || 70), out = [];
 const L = loads782(a);
 if (!L.length) return ['no load time on the schedule - to be unloaded by ' + clock782(by) + ' it must leave Kingston before ' + clock782(by - run) + ' (' + run + ' min run), earlier by the time unloading takes'];
 L.forEach(l => { const spare = by - l.arrive;
  out.push((l.item ? l.item + ': ' : '') + 'load ' + clock782(l.at) + ', on site about ' + clock782(l.arrive) + (spare < 0 ? ' - AFTER ' + clock782(by) + ', when it must already be unloaded. Load earlier.' : ' - ' + spare + ' min to unload before ' + clock782(by) + (spare === 0 ? '. No time to unload: load earlier.' : '.'))); });
 return out;
}
const ORDER782_BY = 'the project manager, 2 Oct 2026';""", 'unloaded-by check', p, True)
t = rep(t, " L.push(LOAD782);\n loadCheck782(a).forEach(w => L.push('CHECK THE LOAD: ' + w + '.'));",
        " L.push(TIME782);\n timeCheck782(a).forEach(w => L.push('CHECK THE TIME: ' + w));\n L.push(LOAD782);\n loadCheck782(a).forEach(w => L.push('CHECK THE LOAD: ' + w + '.'));", 'time in Full details', p, True)
t = rep(t, " const o = order782(a), e = entry782(a), pk = park782(a), lw = loadCheck782(a); if (!o && !e && !pk && !lw.length) return '';",
        " const o = order782(a), e = entry782(a), pk = park782(a), lw = loadCheck782(a), tw = timeCheck782(a); if (!o && !e && !pk && !lw.length && !tw.length) return '';", 'drawer shows for a time warning', p, True)
t = rep(t, " L.push(row('Loading', esc(LOAD782.replace(/^LOAD /, 'Load '))));",
        " { const by = (deliveryOf(a.key) || {}).eta; L.push(row('Time', by ? 'Unloaded by <b>' + esc(by) + '</b> - not arriving at ' + esc(by) + '. Get there early: miss it and the other crews wait, or the area is closed.' : 'The time given is when the truck must be unloaded by - get there early.')); }\n tw.forEach(w => L.push(row('Check the time', /AFTER|No time/.test(w) ? '<span class=\"no782\">' + esc(w) + '</span>' : esc(w))));\n L.push(row('Loading', esc(LOAD782.replace(/^LOAD /, 'Load '))));", 'drawer time row', p, True)
# the words everywhere the time shows: unloaded by, not "on site"
t = rep(t, "return 'Due ' + fmtDate(day) + (d.eta ? ', on site ' + d.eta : '');", "return 'Due ' + fmtDate(day) + (d.eta ? (d.state === 'on site' ? ', on site ' : ', unloaded by ') + d.eta : ''); /* v7.82 - the time is an unloaded-by time (a delivered record keeps its words) */", 'text: unloaded by', p, True)
t = rep(t, "${d.eta ? ' · planned on site ' + d.eta : ''}${ev.load_time", "${d.eta ? (d.state === 'on site' ? ' · planned on site ' + d.eta : ' · unloaded by ' + d.eta + ' (get there early)') : ''}${ev.load_time", 'Full details: unloaded by', p, True)
t = rep(t, "dv.eta ? ' · planned on site ' + esc(dv.eta) : ''}</span>`", "dv.eta ? (dv.state === 'on site' ? ' · planned on site ' : ' · unloaded by ') + esc(dv.eta) : ''}</span>`", 'card: unloaded by', p, True)
t = rep(t, "<span class=\"rs-sup\">planned on site — no load time in the schedule</span>", "<span class=\"rs-sup\">${dv.state === 'on site' ? 'planned on site' : 'unloaded by'} — no load time in the schedule</span>", 'running sheet: unloaded by', p, True)
t = rep(t, "color:#b9b2ab\">on site ${e(dv.eta)}</td>", "color:#b9b2ab\">${dv.state === 'on site' ? 'on site' : 'unloaded by'} ${e(dv.eta)}</td>", 'print card: unloaded by', p, True)
t = rep(t, ">Planned time to site</label>", ">Unloaded by (the time asked for)</label>", 'drawer field label', p, True)
t = rep(t, "<div class=\"hint\">${d.eta ? (d.eta_where === 'local' ? LW() : 'shared record') : ''}</div></div>",
        "<div class=\"hint\">${d.eta ? (d.eta_where === 'local' ? LW() : 'shared record') + ' · ' : ''}the truck is unloaded by then - it arrives early</div></div>", 'drawer field hint', p, True)

t = t.replace('/* v7.80 - a save empties', '/* v7.82 - GN21 read off D024 correctly; driver rules (entry by side of Main Beach Pde, delivery order, stagger, parks, loading at Kingston, the time is an unloaded-by time). */\n/* v7.80 - a save empties', 1)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.82 applied: GN21 corrected on the master; driver rules on Text it and Full details')
