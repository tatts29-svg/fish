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
   the delivery order - you would not load a waste tank after 09:00 with the toilet block first. No travel to the Gold
   Coast 07:00-09:00 or 16:00-18:00 (the project manager, 2 Oct 2026: they cannot travel then). Schedule load times are
   Kingston load times; the run to site is the page's planning figure (transport.kingston_run, about 70 min). */
const LOAD782 = 'LOAD: loaded and away from Kingston by 05:00, in the delivery order - about 70 min to site. NO travel to the Gold Coast 07:00-09:00 or 16:00-18:00 - be in before 07:00, or travel after 09:00.';
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
 const timed = hhmm782((deliveryOf(a.key) || {}).eta) != null; /* a timed delivery gets the no-travel call in its time check */
 L.forEach(l => { const p = !timed && PEAKS782.find(([s, e]) => l.at < e && l.arrive > s), late = l.at > LOAD_BY782; if (!p && !late) return;
  out.push((l.item ? l.item + ': ' : '') + 'load ' + clock782(l.at) + (late ? ' - away from Kingston after 05:00' : '') + (p ? (late ? ' and puts' : ' puts') + ' the truck on the road ' + clock782(l.at) + '-' + clock782(l.arrive) + ', inside the ' + clock782(p[0]) + '-' + clock782(p[1]) + ' no-travel window' : '')); });
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
 L.push(row('Loading', esc(LOAD782.replace(/^LOAD: l/, 'L'))));
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
function run782(){ const kr = (DATA.transport || {}).kingston_run || {}; return Math.round(kr.minutes_rounded || kr.minutes || 70); }
/* work back from the unloaded-by time: 30 min to unload, then the run - and the run may not touch a no-travel window,
   so a time that would put the truck on the road 07:00-09:00 (or 16:00-18:00) brings it in before the window instead */
function plan782(by){
 const run = run782(); let onBy = by - UNLOAD_MIN782, ban = null;
 for (let i = 0; i < 4; i++) { const b = PEAKS782.find(([s, e]) => onBy - run < e && onBy > s); if (!b) break; ban = b; onBy = b[0]; }
 return {by, onBy, leaveBy: onBy - run, run, ban};
}
function planWords782(P){ return P.ban ? ' (no travel ' + clock782(P.ban[0]) + '-' + clock782(P.ban[1]) + ', so in before ' + clock782(P.ban[0]) + ')' : ''; }
function timeCheck782(a){
 const d = deliveryOf(a.key) || {}, by = hhmm782(d.eta); if (by == null || inPlace782(a.key)) return [];
 const P = plan782(by), out = [], L = loads782(a);
 if (!L.length) return ['no load time on the schedule - to be unloaded by ' + clock782(by) + ': on site by ' + clock782(P.onBy) + planWords782(P) + ', so leave Kingston by ' + clock782(P.leaveBy) + ', loaded before then (' + P.run + ' min run, at least ' + UNLOAD_MIN782 + ' min to unload)'];
 L.forEach(l => { const spare = by - l.arrive, hit = PEAKS782.find(([s, e]) => l.at < e && l.arrive > s);
  out.push((l.item ? l.item + ': ' : '') + 'load ' + clock782(l.at) + ', on site about ' + clock782(l.arrive)
   + (hit ? ' - on the road in the ' + clock782(hit[0]) + '-' + clock782(hit[1]) + ' no-travel window. Leave Kingston by ' + clock782(P.leaveBy) + ', loaded before then.'
   : spare < 0 ? ' - AFTER ' + clock782(by) + ', when it must already be unloaded. Leave Kingston by ' + clock782(P.leaveBy) + ', loaded before then.'
   : spare < UNLOAD_MIN782 ? ' - only ' + spare + ' min to unload before ' + clock782(by) + ' (at least ' + UNLOAD_MIN782 + ' needed). Leave Kingston by ' + clock782(P.leaveBy) + ', loaded before then.'
   : ' - ' + spare + ' min to unload before ' + clock782(by) + '.')); });
 return out;
}
const ORDER782_BY = 'the project manager, 2 Oct 2026';""", 'unloaded-by check', p, True)
t = rep(t, " L.push(LOAD782);\n loadCheck782(a).forEach(w => L.push('CHECK THE LOAD: ' + w + '.'));",
        " L.push(TIME782);\n timeCheck782(a).forEach(w => L.push('CHECK THE TIME: ' + w));\n L.push(LOAD782);\n loadCheck782(a).forEach(w => L.push('CHECK THE LOAD: ' + w + '.'));", 'time in Full details', p, True)
t = rep(t, " const o = order782(a), e = entry782(a), pk = park782(a), lw = loadCheck782(a); if (!o && !e && !pk && !lw.length) return '';",
        " const o = order782(a), e = entry782(a), pk = park782(a), lw = loadCheck782(a), tw = timeCheck782(a); if (!o && !e && !pk && !lw.length && !tw.length) return '';", 'drawer shows for a time warning', p, True)
t = rep(t, " L.push(row('Loading', esc(LOAD782.replace(/^LOAD: l/, 'L'))));",
        " { const by = (deliveryOf(a.key) || {}).eta, m = hhmm782(by); const P = m != null ? plan782(m) : null; L.push(row('Time', P ? 'Unloaded by <b>' + esc(by) + '</b> - so on site by <b>' + clock782(P.onBy) + '</b>' + esc(planWords782(P)) + ', leave Kingston by <b>' + clock782(P.leaveBy) + '</b>, loaded before then (unloading takes at least ' + UNLOAD_MIN782 + ' min). Miss it and the other crews wait, or the area is closed.' : 'The time given is when the truck must be unloaded by - be on site at least ' + UNLOAD_MIN782 + ' min before it.')); }\n tw.forEach(w => L.push(row('Check the time', /AFTER|only [0-9]+ min|no-travel/.test(w) ? '<span class=\"no782\">' + esc(w) + '</span>' : esc(w))));\n L.push(row('Loading', esc(LOAD782.replace(/^LOAD: l/, 'L'))));", 'drawer time row', p, True)
# the words everywhere the time shows: unloaded by, not "on site"
t = rep(t, "return 'Due ' + fmtDate(day) + (d.eta ? ', on site ' + d.eta : '');", "return 'Due ' + fmtDate(day) + (d.eta ? (d.state === 'on site' ? ', on site ' + d.eta : ', on site by ' + clock782(plan782(hhmm782(d.eta)).onBy) + ', unloaded by ' + d.eta) : ''); /* v7.82 - the time is an unloaded-by time (a delivered record keeps its words) */", 'text: unloaded by', p, True)
t = rep(t, "${d.eta ? ' · planned on site ' + d.eta : ''}${ev.load_time", "${d.eta ? (d.state === 'on site' ? ' · planned on site ' + d.eta : (P => ' · on site by ' + clock782(P.onBy) + planWords782(P) + ', unloaded by ' + d.eta + ' - leave Kingston by ' + clock782(P.leaveBy) + ', loaded (at least ' + UNLOAD_MIN782 + ' min to unload)')(plan782(hhmm782(d.eta)))) : ''}${ev.load_time", 'Full details: unloaded by', p, True)
t = rep(t, "dv.eta ? ' · planned on site ' + esc(dv.eta) : ''}</span>`", "dv.eta ? (dv.state === 'on site' ? ' · planned on site ' : ' · unloaded by ') + esc(dv.eta) : ''}</span>`", 'card: unloaded by', p, True)
t = rep(t, "<span class=\"rs-sup\">planned on site — no load time in the schedule</span>", "<span class=\"rs-sup\">${dv.state === 'on site' ? 'planned on site' : 'unloaded by'} — no load time in the schedule</span>", 'running sheet: unloaded by', p, True)
t = rep(t, "color:#b9b2ab\">on site ${e(dv.eta)}</td>", "color:#b9b2ab\">${dv.state === 'on site' ? 'on site' : 'unloaded by'} ${e(dv.eta)}</td>", 'print card: unloaded by', p, True)
t = rep(t, ">Planned time to site</label>", ">Unloaded by (the time asked for)</label>", 'drawer field label', p, True)
t = rep(t, "<div class=\"hint\">${d.eta ? (d.eta_where === 'local' ? LW() : 'shared record') : ''}</div></div>",
        "<div class=\"hint\">${d.eta ? (d.eta_where === 'local' ? LW() : 'shared record') + ' · ' : ''}the truck is unloaded by then - on site at least 30 min before</div></div>", 'drawer field hint', p, True)

# 6. FIRM INSTRUCTIONS BEFORE ANYONE LEAVES (the project manager, 2 Oct 2026): "No drivers should leave the pick up point until
#    they have firm instructions on where they are going. Every item has a map drop off location and a direction point
#    they need to head to."
t = rep(t, "const ORDER782_BY = 'the project manager, 2 Oct 2026';", """/* v7.82 - nobody leaves the pick-up point without firm instructions: the drop-off location on the map AND the point to head
   for (the way in: a pinned turn-in, the pit lane rule, or the Main Beach Pde entry end). Either missing = hold the truck. */
const DISPATCH782 = 'DISPATCH: no driver leaves the pick-up point without firm instructions - the drop-off location on the map AND the direction point to head for (the way in). If either is missing, the truck holds until the site team gives it.';
function ready782(a){
 if (!a || inPlace782(a.key)) return null;
 const nt = navTargetFor(a), drop = !!(nt && (nt.pinned || nt.placed)), dir = !!(entryOf(a.key) || entry782(a));
 const missing = [drop ? '' : 'no drop-off location on the map', dir ? '' : 'no direction point (way in) set'].filter(Boolean);
 return {drop, dir, ok: drop && dir, missing};
}
const ORDER782_BY = 'the project manager, 2 Oct 2026';""", 'dispatch readiness', p, True)
# the text: a drop with a location but no way in says HOLD (no location already says "contact the site team before departure")
t = rep(t, "function rules782Sms(a){\n const L = []; const o = order782(a); if (o) L.push(o.sms);",
        "function rules782Sms(a){\n const L = []; const r = ready782(a); if (r && r.drop && !r.dir) L.push('HOLD: way in not set - do not leave until site gives it.');\n const o = order782(a); if (o) L.push(o.sms);", 'text: hold without a way in', p, True)
t = rep(t, " L.push(TIME782);\n", " { const r = ready782(a); L.push(DISPATCH782); if (r) L.push(r.ok ? 'READY TO SEND: drop-off location and direction point both set.' : 'NOT READY TO SEND: ' + r.missing.join('; ') + '. Hold the truck.'); }\n L.push(TIME782);\n", 'dispatch in Full details', p, True)
t = rep(t, "lw = loadCheck782(a), tw = timeCheck782(a); if (!o && !e && !pk && !lw.length && !tw.length) return '';",
        "lw = loadCheck782(a), tw = timeCheck782(a), rd = ready782(a); if (!o && !e && !pk && !lw.length && !tw.length && !(rd && !rd.ok)) return '';", 'drawer shows when not ready', p, True)
t = rep(t, " { const by = (deliveryOf(a.key) || {}).eta, m = hhmm782(by);",
        " if (rd) L.push(row('Dispatch', rd.ok ? '<span class=\"ok782\">Ready to send</span> - drop-off location and direction point both set.' : '<span class=\"no782\">NOT READY TO SEND - ' + esc(rd.missing.join('; ')) + '.</span> No driver leaves until both are set' + (rd.dir ? '' : ' (Pin the way in, below)') + '.'));\n { const by = (deliveryOf(a.key) || {}).eta, m = hhmm782(by);", 'drawer dispatch row', p, True)
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
 + '#drv782 .tag{margin:12px 0 0;font-size:12px;color:var(--mute,#5d6468);text-align:center}'
 + '.dp-page{position:relative}.dp782{position:absolute;right:3mm;bottom:1.6mm;z-index:2;padding:.4mm 1.6mm;background:#fff;border:.25mm solid #d7dbde;border-radius:1mm;font:600 6.6pt/1.2 Inter,sans-serif;color:#15181a}';
let DRV782_OK = null; /* {iso, by, at}: the check behind the sheets being laid out now */
function drvFacts782(iso, only){
 const d = programmeDays().find(x => x.iso === iso); if (!d) return null;
 const loads = dpLoads(d), pick = only != null && loads[only] ? [only] : loads.map((g, i) => i), bad = [];
 let n = 0;
 pick.forEach(i => (loads[i].rows || []).forEach(r => { const a = r.a; if (!a) return; n++;
  const nt = navTargetFor(a), drop = !!(nt && (nt.pinned || nt.placed)), dir = !!(entryOf(a.key) || entry782(a));
  if (!drop || !dir) bad.push({key: a.key, line: 'Load ' + (i + 1) + ' · ' + a.key + ' - ' + [drop ? '' : 'no drop-off pin', dir ? '' : 'no way in'].filter(Boolean).join(', ')}); }));
 return {loads: pick.length, items: n, bad};
}
function drvStamp782(){ const z = x => String(x).padStart(2, '0'), d = new Date(), M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 return z(d.getDate()) + ' ' + M[d.getMonth()] + ' ' + d.getFullYear() + ', ' + z(d.getHours()) + ':' + z(d.getMinutes()); }
function drvCheck782(iso, only, go){
 document.querySelectorAll('#drv782').forEach(e => e.remove());
 if (!document.getElementById('drv782css')) { const st = document.createElement('style'); st.id = 'drv782css'; st.textContent = DRV782_CSS; document.head.appendChild(st); }
 const F = drvFacts782(iso, only); if (!F) { go(); return; }
 let name = ''; try { name = localStorage.getItem('gc500.printedBy') || ''; } catch (e) {}
 const facts = F.bad.length
  ? `<div class="facts bad"><b class="f-no">${F.bad.length} item${F.bad.length === 1 ? '' : 's'} not ready to send</b> - no firm instructions yet. Set them here at the branch in Edit (the drop-off on the map, and the way in) - the sheets update with them.<ul>${F.bad.slice(0, 8).map(x => '<li><button type="button" class="fx782" data-k="' + esc(x.key) + '">' + esc(x.line) + ' <u>Fix in Edit ›</u></button></li>').join('')}${F.bad.length > 8 ? '<li>and ' + (F.bad.length - 8) + ' more</li>' : ''}</ul></div>`
  : `<div class="facts"><b class="f-ok">✓ All ${F.items} item${F.items === 1 ? '' : 's'} have a drop-off pin and a way in.</b></div>`;
 const C = [
  F.bad.length ? 'Anything in red is fixed in Edit first - or it stays in the yard until it is.' : 'Every driver has a drop-off pin and a way in.',
  'Leave times work: in before 07:00, or on the road after 09:00. No travel 07:00-09:00 or 16:00-18:00.',
  'Loads go in order. Waste tanks before toilet blocks.',
  'I have talked each driver through their sheet. If anything looks wrong on the day, they stop and call site.'];
 const box = document.createElement('div'); box.id = 'drv782'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'drv782h');
 box.innerHTML = `<div class="box"><h2 id="drv782h">Before these go to the drivers</h2>
  <p class="lead">A quick check - about 30 seconds. You're the last set of eyes before a truck leaves the yard. Thanks for getting it right first time.</p>
  ${facts}${C.map((c, i) => `<label class="ck"><input type="checkbox" data-c="${i}"><span>${esc(c)}</span></label>`).join('')}
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
  DRV782_OK = {iso, by, at: drvStamp782(), bad: F.bad.length, t: Date.now()}; close(); go(); };
 setTimeout(() => (cks[0] || nm).focus(), 30);
}
function dpWirePlate(pane){""", 'driver print check', p, True)
t = rep(t, "pane.querySelectorAll('[data-print-drv]').forEach(n => n.onclick = () => dpPrint(n.dataset.printDrv, 'drv'));",
        "pane.querySelectorAll('[data-print-drv]').forEach(n => n.onclick = () => drvCheck782(n.dataset.printDrv, null, () => dpPrint(n.dataset.printDrv, 'drv'))); /* v7.82 - the check first */", 'print button checks first', p, True)
t = rep(t, " pdf7Open(b.dataset.pdf7, b.dataset.iso, b.dataset.only != null && b.dataset.only !== '' ? +b.dataset.only : null, b.dataset.mail === '1');",
        " const open7 = () => pdf7Open(b.dataset.pdf7, b.dataset.iso, b.dataset.only != null && b.dataset.only !== '' ? +b.dataset.only : null, b.dataset.mail === '1');\n if (b.dataset.pdf7 === 'drivers') drvCheck782(b.dataset.iso, b.dataset.only != null && b.dataset.only !== '' ? +b.dataset.only : null, open7); else open7(); /* v7.82 - driver PDFs: the check first */", 'driver PDFs check first', p, True)
t = rep(t, " wrap.innerHTML = pages.join(''); wrap.classList.remove('ps7wrap'); wrap.classList.add('dpwrap'); wrap.dataset.dpReady = '';",
        " wrap.innerHTML = pages.join(''); wrap.classList.remove('ps7wrap'); wrap.classList.add('dpwrap'); wrap.dataset.dpReady = '';\n if (doc === 'drv' && DRV782_OK && DRV782_OK.iso === iso && Date.now() - DRV782_OK.t < 900000) { if (!document.getElementById('drv782css')) { const s7 = document.createElement('style'); s7.id = 'drv782css'; s7.textContent = DRV782_CSS; document.head.appendChild(s7); }\n  wrap.querySelectorAll('.dp-page').forEach(pg => { const f = document.createElement('div'); f.className = 'dp782'; f.textContent = 'Checked by ' + DRV782_OK.by + ' · ' + DRV782_OK.at + ' · drop-off, way in, times and order'; pg.appendChild(f); }); } /* v7.82 */", 'checked-by on every sheet', p, True)

# 7b. A drop-off placed at the branch reaches the driver sheet (the project manager, 2 Oct 2026: "drop off locations can be done at
#     the branch via Edit - if they update it, the run sheet locations update"). The sheet put a master-plan AREA ahead of a
#     placed position, so a branch placement changed the text but not the sheet. Now: a pin, a master-plan unit position, a
#     placed position, and only then an area - the same order the text and Navigate use.
t = rep(t, """ const m = masterLoc(a.key);
 if (m && m.ll) return {kind: m.prec === 'unit' ? 'master' : 'area', lat: m.ll[0], lon: m.ll[1], pt: fr(m.ll[0], m.ll[1]), how: m.how};
 let t = null; try { t = navTargetFor(a); } catch (e) { t = null; }
 if (t && t.ll) {
 if (t.placed) return {kind: 'placed', lat: t.ll.lat, lon: t.ll.lon, pt: fr(t.ll.lat, t.ll.lon), place: t.place};""", """ const m = masterLoc(a.key);
 if (m && m.ll && m.prec === 'unit') return {kind: 'master', lat: m.ll[0], lon: m.ll[1], pt: fr(m.ll[0], m.ll[1]), how: m.how};
 let t = null; try { t = navTargetFor(a); } catch (e) { t = null; }
 if (t && t.ll && t.placed) return {kind: 'placed', lat: t.ll.lat, lon: t.ll.lon, pt: fr(t.ll.lat, t.ll.lon), place: t.place}; /* v7.82 - the branch's placement beats an area */
 if (m && m.ll) return {kind: 'area', lat: m.ll[0], lon: m.ll[1], pt: fr(m.ll[0], m.ll[1]), how: m.how};
 if (t && t.ll) {
 if (t.placed) return {kind: 'placed', lat: t.ll.lat, lon: t.ll.lon, pt: fr(t.ll.lat, t.ll.lon), place: t.place};""", 'placed beats area on the driver sheet', p, True)

t = t.replace('/* v7.80 - a save empties', '/* v7.82 - GN21 read off D024 correctly; driver rules (entry by side of Main Beach Pde, delivery order, stagger, parks, loading at Kingston, the time is an unloaded-by time, firm instructions before dispatch, a check before driver sheets print). */\n/* v7.80 - a save empties', 1)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.82 applied: GN21 corrected on the master; driver rules on Text it and Full details')
