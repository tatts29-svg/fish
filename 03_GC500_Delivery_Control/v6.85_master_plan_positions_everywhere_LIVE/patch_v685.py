#!/usr/bin/env python3
"""v6.85 - POSITIONS FROM THE MASTER PLAN, EVERYWHERE (Andrew, 27 Sep 2026: "if you have the correct coordinates, remove
what I have done and use these for everything … I will only add what we don't know … remove the option for me to pin
things if you have this available").

Every reference the master plan D001-26003-03 places on the unit (139: the tag printed on the unit, or a callout's leader
line followed to its arrow) now takes its position from the master: the map pins, Navigate / Walk / Earth, the drop's
live map, the sheets' marks and the day list all read it. The pins taken on site for those references are no longer
used - they stay in the shared record untouched (nothing is deleted, so it can be undone) - and the pin buttons are gone
for them. A reference the master places only by area (23) or not at all keeps its pin buttons, for Andrew to add.

Applied after patch_v684.py.   python3 patch_v685.py <page.html> <master_loc.json>
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402


def patch(path, locfile, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    loc = open(locfile, encoding='utf-8').read().strip()
    JS = """/* v6.85 - POSITIONS FROM THE MASTER PLAN (Andrew, 27 Sep 2026). Read off D001-26003-03: the tag printed on the unit,
 or a callout on D022-D025 followed along its leader line to the arrow; converted to GPS with the plan's satellite
 registration. prec 'unit' = on the unit; 'area' = only the area its own line names. */
const MASTER_LOC = """ + loc + """;
function masterLoc(ref){ return MASTER_LOC[ref] || null; }
function masterUnit(ref){ const m = MASTER_LOC[ref]; return m && m.prec === 'unit' ? m : null; }
function masterWords(m){ if (!m) return ''; const b = [];
 if (m.next && m.next.length) b.push('next to ' + m.next.join(', '));
 if (m.beside && m.beside.length) b.push('beside ' + m.beside.join(', '));
 if (m.near && m.near.length) b.push(m.near.join(' · '));
 return b.join(' — '); }
function masterFixFor(ref){ const m = masterUnit(ref); if (!m) return null;
 const fr = frameOf(m.ll[0], m.ll[1]), on = !!fr && fr.ax >= -0.25 && fr.ax <= 1.25 && fr.ay >= -0.25 && fr.ay <= 1.25;
 return {lat: m.ll[0], lon: m.ll[1], acc: null, at: '2026-09-27T00:00:00.000Z', by: 'master plan D001-26003-03',
 ax: on ? fr.ax : null, ay: on ? fr.ay : null, off: null, outside: on ? null : 'outside the area the drawings cover', away_m: null,
 ref: ref, unit: null, n: 0, took: 'read off the master plan', master: true, how: m.how}; }
/* the positions every map and button reads: the master's for every reference it places on the unit, and the pins
 taken on site for everything else. Pins on a master-placed reference stay in S.fixes, unused. */
function pinsNow(){
 if (RENDER_MEMO.has('pinsNow')) return RENDER_MEMO.get('pinsNow');
 const out = {};
 Object.entries(S.fixes || {}).forEach(([k, f]) => { if (!masterUnit(fixParse(k).ref)) out[k] = f; });
 Object.keys(MASTER_LOC).forEach(r => { const f = masterFixFor(r); if (f) out[r] = f; });
 RENDER_MEMO.set('pinsNow', out);
 return out;
}
function fixOf(key){"""
    t = R("""function fixOf(key){ return (S.fixes || {})[key] || null; }""", JS + """ return pinsNow()[key] || null; }""", 'fixOf')
    t = R("""const all = Object.entries(S.fixes || {}).filter(([k, f]) => f && f.lat != null)""",
          """const all = Object.entries(pinsNow()).filter(([k, f]) => f && f.lat != null)""", 'satBoardPins')
    t = R("""const pins = !SHOW_FIXES ? '' : Object.entries(S.fixes || {}).map(([k, f]) => {""",
          """const pins = !SHOW_FIXES ? '' : Object.entries(pinsNow()).map(([k, f]) => {""", 'renderMap pins')
    t = R("""const others = Object.keys(S.fixes || {}).filter(k => {
 const q = fixParse(k); return q.ref === pk.ref && q.unit && (S.fixes[k] || {}).lat != null;""",
          """const PN = pinsNow(), others = Object.keys(PN).filter(k => {
 const q = fixParse(k); return q.ref === pk.ref && q.unit && (PN[k] || {}).lat != null;""", 'pinTag')
    t = R("""const mine = Object.keys(S.fixes || {}).filter(k => fixParse(k).ref === a.key && S.fixes[k] && S.fixes[k].lat != null).map(k => Object.assign({key: k}, S.fixes[k]));""",
          """const PN = pinsNow(), mine = Object.keys(PN).filter(k => fixParse(k).ref === a.key && PN[k] && PN[k].lat != null).map(k => Object.assign({key: k}, PN[k]));""", 'live map mine')
    t = R("""Object.keys(S.fixes || {}).forEach(k => {
 const f = S.fixes[k]; if (fixParse(k).ref === a.key || !f || f.lat == null) return;""",
          """Object.keys(PN).forEach(k => {
 const f = PN[k]; if (fixParse(k).ref === a.key || !f || f.lat == null) return;""", 'live map others')
    # no pinning a reference the master places
    t = R("""function pinMyLocation(key, done){
 if (!mayWrite('a recorded position')) return;""", """function pinMyLocation(key, done){
 if (masterUnit(fixParse(key).ref)) { flash(fixParse(key).ref + ' takes its position from the master plan — nothing to pin.'); return; }
 if (!mayWrite('a recorded position')) return;""", 'pin guard')
    # the day list
    t = R("""function dayPinCell(a){
 if (!a || !isRef(a.key)) return '';""", """function dayPinCell(a){
 if (!a || !isRef(a.key)) return '';
 const mu = masterUnit(a.key);
 if (mu) { const ll = {lat: mu.ll[0], lon: mu.ll[1]};
 return `<br><span class="chip ref" title="${esc('From the master plan D001-26003-03: ' + (masterWords(mu) || mu.how))}">master plan</span>
 <a class="linkish" href="${navUrl(ll)}" target="_blank" rel="noopener noreferrer" title="driving directions — a truck route, which ends at the nearest road">drive</a>
 <a class="linkish" href="${walkUrl(ll)}" target="_blank" rel="noopener noreferrer" title="walking directions to the spot on the master plan">walk to it</a>`; }""", 'day cell')
    # the drawer
    t = R("""function pinBlock(a){
 const units = pinUnits(a);""", """function pinBlock(a){
 const mu = masterUnit(a.key), ma = masterLoc(a.key);
 if (mu) { const ll = {lat: mu.ll[0], lon: mu.ll[1]}, others = (mu.pts || []).filter(p => p[0] !== mu.ll[0] || p[1] !== mu.ll[1]);
 return `<div class="pinblock">
 <div class="sect">Where it is — master plan</div>
 <p class="sub">Read off the master plan D001-26003-03: ${esc(mu.how)}. ${masterWords(mu) ? esc(masterWords(mu)) + '.' : ''} No pin is needed.</p>
 <div class="pinrow on"><div class="pinwho"><b>${esc(a.key)}</b><span class="w">${esc(a.name || '')}</span></div>
 <div class="pinwhat"><span class="mono">${ll.lat.toFixed(6)}, ${ll.lon.toFixed(6)}</span>
 <span class="pinacts">
 <a class="btn ghost" href="${navUrl(ll)}" target="_blank" rel="noopener noreferrer" title="Driving directions — ends at the nearest road.">Drive there</a>
 <a class="btn ghost" href="${walkUrl(ll)}" target="_blank" rel="noopener noreferrer" title="Walking directions to the spot on the master plan.">Walk to it</a>
 <a class="btn ghost" href="${earthUrl(ll)}" target="_blank" rel="noopener noreferrer" title="Google Earth, tilted over the spot.">Earth</a></span>
 ${others.length ? `<span class="w">The master also tags ${esc(a.key)} at ${others.map(p => p[0].toFixed(6) + ', ' + p[1].toFixed(6)).join(' and ')}.</span>` : ''}
 </div></div>
 ${entryRow(a)}
 </div>`; }
 const units = pinUnits(a);""", 'drawer master')
    t = R(""" <p class="sub">Standing at it, press the button. It watches the satellite fix""",
          """ ${ma ? `<p class="sub"><b>Master plan:</b> ${esc(ma.how)}${masterWords(ma) ? ' — ' + esc(masterWords(ma)) : ''}. Area only, so pin it when you are there.</p>` : ''}
 <p class="sub">Standing at it, press the button. It watches the satellite fix""", 'drawer area')
    # the words beside the drop, wherever it is printed
    t = R("""return {main: w.known ? w.text : '', also: w.also, w: w};""",
          """const ml = masterLoc(a.key), mw = ml ? masterWords(ml) : '';
 return {main: w.known ? w.text : '', also: [w.also, mw ? (ml.prec === 'unit' ? 'master plan: ' : 'master plan, area: ') + mw : ''].filter(Boolean).join(' · '), w: w};""", 'whereText')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], sys.argv[2], True)
