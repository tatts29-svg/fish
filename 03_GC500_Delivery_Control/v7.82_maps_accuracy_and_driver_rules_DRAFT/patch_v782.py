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
 {ref: 'P03', sms: 'ORDER: P03 first, then P01, then P05.'},
 {ref: 'P01', after: ['P03'], sms: 'ORDER: only after P03 is in. P05 after P01.'},
 {ref: 'WC05', tank: true, sms: 'ORDER: waste tank first, toilet block on top. P05, P04 wait for WC05.'},
 {ref: 'P05', after: ['P01', 'WC05'], sms: 'ORDER: only after P01 and WC05 (tank, then toilet) are in.'},
 {ref: 'P04', after: ['WC05'], sms: 'ORDER: only after the WC05 toilet block is in.'},
 {ref: 'GN21', sms: 'ORDER: GN21 60kVA first - tight spot. GN20 350kVA after it.'},
 {ref: 'GN20', after: ['GN21'], sms: 'ORDER: only after GN21 60kVA is placed (tight spot).'}
];
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
function rules782Optional(a){ return [park782(a) ? PARK782 : '', STAGGER782].filter(Boolean); }
/* park fits if it stays inside three texts; stagger only if it adds no text (it is on every message's long form) */
function rules782Fits(L, o){ const now = smsShape(text747Plain(L.join('\n'))), next = smsShape(text747Plain(L.concat(o).join('\n'))); return next.units <= TEXT747_MAX && (o !== STAGGER782 || next.parts === now.parts); }
/* the long form: Full details and the drawer */
function rules782Long(a){
 const L = ['DRIVER RULES (' + ORDER782_BY + '):'];
 const o = order782(a);
 if (o) { L.push(o.sms);
  (o.after || []).forEach(f => L.push('  ' + f + ': ' + (inPlace782(f) ? 'in place on the record' : 'NOT in place yet - do not send ' + a.key + ' until it is'))); }
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
 const o = order782(a), e = entry782(a), pk = park782(a); if (!o && !e && !pk) return '';
 const row = (k, v) => `<li><b>${esc(k)}</b> ${v}</li>`;
 const L = [];
 if (o) { L.push(row('Order', esc(o.sms.replace(/^ORDER: /, ''))));
  (o.after || []).forEach(f => L.push(row(f, inPlace782(f) ? '<span class="ok782">in place on the record</span>' : '<span class="no782">not in place yet - hold ' + esc(a.key) + '</span>'))); }
 if (e) L.push(row('Way in', esc(e.words)));
 if (pk) L.push(row('Park', 'Watch for wildlife and low branches - very tight in places. ' + esc((DATA.driver_rules || {}).escort || '')));
 L.push(row('Arrivals', 'Stagger them - the site is congested every Supercars week.'));
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

t = t.replace('/* v7.80 - a save empties', '/* v7.82 - GN21 read off D024 correctly; driver rules (entry by side of Main Beach Pde, delivery order, stagger, parks). */\n/* v7.80 - a save empties', 1)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.82 applied: GN21 corrected on the master; driver rules on Text it and Full details')
