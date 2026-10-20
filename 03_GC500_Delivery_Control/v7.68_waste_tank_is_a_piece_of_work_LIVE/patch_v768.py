#!/usr/bin/env python3
"""v7.68 - A waste tank is a piece of work. Andrew, 1 Oct 2026, 15:30 AEST: "WC60 has 2 waste tanks, I told you this.
This needs to have a level cost and install cost." Apply on the live v7.67 (8,626,587 bytes).

  The page charges labour per piece of equipment, on the reference's charge lines. WC60's schedule row named the two
  toilet blocks only, so the page had nothing to tick the tanks' install and levelling against - while the contract
  (9968955, lines 94 and 95) carries a sewage holding tank line for each tank, and the card prices a waste tank's
  install ($145.74) and levelling ($104.10) per piece. WC05, WC20 and WC27 carry their Waste tank line from the
  schedule already and their tanks tick as pieces of work; WC60 did not.

  The rule: where the contract carries sewage holding tank lines for a reference and the schedule gave it no waste-tank
  line, the line is added from the contract - one Waste tank line, quantity = the contract's tank lines, named with the
  contract and its line numbers - so the tanks' install and levelling can be ticked and charged the same as everywhere
  else. Hire on the line is included in the toilet-block price (the 1 Oct contract treatment); the line is here for the
  labour. Nothing is ticked by this patch: the ticks are a record write (Andrew in the drawer, or the hand-over script).
    python3 patch_v768.py <page.html>   (needs the v7.17 building rule in buildAllAssets and the ONHIRE_ROWS block)"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'tank768LinesFor' in t: sys.exit('v7.68 already applied')
for need in ["const ONHIRE_ROWS = ONHIRE ? ONHIRE.rows : [];",
 " return Object.assign({}, a, {\n name: desc || a.name || null,\n item_types: itemTypes,\n charge_lines: chargeLinesOut,"]:
    if need not in t: sys.exit('needs ' + need)

# 1. the contract's sewage holding tank lines, by reference - built once, read by the asset builder
t = rep(t, "const ONHIRE_ROWS = ONHIRE ? ONHIRE.rows : [];",
 """const ONHIRE_ROWS = ONHIRE ? ONHIRE.rows : [];
/* v7.68 - THE CONTRACT'S SEWAGE HOLDING TANK LINES, BY REFERENCE. A tank line names its reference first in the
 description ("WC60 Sewage Holding Tank 6.0M x 2.4M"), or the build matched it to the reference by asset number
 (WC05's 1328978). Built once; read by the asset builder to give a tank-mounted toilet location its Waste tank line. */
let TANK768_BY_REF = null;
function tank768LinesFor(key){
 if (!TANK768_BY_REF) { TANK768_BY_REF = new Map();
 ONHIRE_ROWS.forEach(r => {
 if (!(/^waste tank$/i.test(String(r.register_type || '')) || /holding tank|waste tank/i.test(String(r.what || r.description || '')))) return;
 const m = /^\\s*([A-Z]{1,4}\\d{1,3}[A-Z]?)\\b/.exec(String(r.description || ''));
 const k = (r.match && r.match.to === 'asset' && r.match.key) || (m && m[1]) || null; if (!k) return;
 if (!TANK768_BY_REF.has(k)) TANK768_BY_REF.set(k, []); TANK768_BY_REF.get(k).push(r); }); }
 return TANK768_BY_REF.get(String(key || '')) || [];
}""", 'tank lines by reference', p, True)

# 2. the asset builder: a Waste tank line from the contract where the schedule gave none
t = rep(t, " return Object.assign({}, a, {\n name: desc || a.name || null,\n item_types: itemTypes,\n charge_lines: chargeLinesOut,",
 """ /* v7.68 - A WASTE TANK IS A PIECE OF WORK (Andrew, 1 Oct 2026: "WC60 has 2 waste tanks, I told you this. This needs to
 have a level cost and install cost"). The schedule's row for a tank-mounted toilet location can name the toilet blocks
 only, while the contract carries a sewage holding tank line for each tank, and the card prices a tank's install and
 levelling per piece (WC05, WC20 and WC27 carry the line from the schedule already). So where the contract carries
 holding-tank lines for the reference and the schedule gave it no waste-tank line, the line is added from the contract:
 one Waste tank line, quantity = the contract's tank lines, unticked until somebody ticks the install and the levelling.
 Hire on it is included in the toilet-block price (the contract treatment of 1 Oct) - the line is here for the labour. */
 if (!a.relocation && !gone && !a._added) { const tk = tank768LinesFor(a.key);
 if (tk.length && !(itemTypes || []).some(it => /waste tank|holding tank/i.test(String(it || ''))) && !(chargeLinesOut || []).some(l => /waste tank|holding tank/i.test(String(l.item || '')))) {
 const q = tk.reduce((s, r) => s + (Number(r.quantity) || 1), 0);
 itemTypes = (itemTypes || []).concat(['Waste tank']);
 chargeLinesOut = (chargeLinesOut || []).concat([{item: 'Waste tank', discipline: a.discipline || 'Toilets & amenities', quantity: q, priceable: true, quantity_auto: true,
 quantity_state: `from the contract — ${tk[0].rental_contract} line${tk.length > 1 ? 's' : ''} ${tk.map(r => r.line).join(', ')}: ${q} sewage holding tank${q === 1 ? '' : 's'} on this reference; the schedule row named the toilet blocks only`,
 rate_per_week: null, rate_state: 'no rate supplied — hire is included in the toilet-block price', line_total: null,
 _tank768: {contract: tk[0].rental_contract, lines: tk.map(r => r.line)}}]);
 } }
 return Object.assign({}, a, {
 name: desc || a.name || null,
 item_types: itemTypes,
 charge_lines: chargeLinesOut,""", 'waste tank line from the contract', p, True)

# 3. which numbers are the tanks: the ones the delivery note names as a waste tank (Codex-style review, 1 Oct: the pieces must
#    never depend on the order the numbers sit in; a tank recorded as a unit named "Waste tank" must keep its piece)
t = rep(t, """ return TANK768_BY_REF.get(String(key || '')) || [];
}""",
""" return TANK768_BY_REF.get(String(key || '')) || [];
}
/* v7.68 - the numbers the delivery note names as a waste tank ("toilet block 1119489 with waste tank 1328980; toilet block
 1087500 with waste tank 1328981" - Andrew, 1 Oct 2026), so the tank line's pieces are the tanks whatever order the numbers sit in */
function tank768NotedNumbers(key){
 try { const d = typeof deliveryOf === 'function' ? deliveryOf(key) : null; const s = String((d && d.note) || '');
 return [...new Set([...s.matchAll(/(?:waste|holding)\\s+tank\\s*#?\\s*(\\d{5,8})/gi)].map(m => m[1]))]; } catch (e) { return []; }
}""", 'noted tank numbers', p, True)
t = rep(t, """ /* the rest, by room: what turned up where it was counted, else the order */
 const room = L.map((l, i) => {""",
""" /* v7.68 - a number the delivery note names as a waste tank is the tank's: it goes to the Waste tank line before the rest
 are dealt out by room, so the pieces never depend on the order the numbers sit in */
 const noted768 = tank768NotedNumbers(a.key); if (noted768.length) L.filter(l => /waste tank|holding tank/i.test(String(l.item || ''))).forEach(l => noted768.forEach(n => { if (nums.includes(n) && !taken.has(n)) { out[l.item].push(n); taken.add(n); } }));
 /* the rest, by room: what turned up where it was counted, else the order */
 const room = L.map((l, i) => {""", 'noted numbers go to the tank line', p, True)
t = rep(t, """function labourUnits(a, item){
 /* v5.59 — the BUILDINGS, never the things inside them: a fridge is not a place to fit stairs */""",
"""function labourUnits(a, item){
 /* v7.68 - a waste tank line's pieces are the tanks: the numbers the note names as tanks, the units recorded as a waste
 tank, and what the line was dealt - whether or not they count as buildings (a tank recorded as a unit is contents by
 the v5.59 rule, and would otherwise drop its piece and its ticks). Keep even one numbered piece and the unnumbered
 remainder, so existing unit ticks stay visible and a partly numbered order can be recorded one piece at a time.
 Reference-level ticks still count through labourTicked's existing fallback. */
 if (/waste tank|holding tank/i.test(String(item || ''))) {
 const m = lineNumbersOf(a); const fromLine = m ? (m[item] || []) : []; const noted = tank768NotedNumbers(a.key);
 const asUnits = unitsOf(a.key).filter(u => /waste tank|holding tank/i.test(String(u.label || '')) && u.asset_no).map(u => String(u.asset_no).trim());
 const all = [...new Set(fromLine.concat(noted, asUnits).map(String).filter(Boolean))]; const q = labourLineQty(a, item);
 let us = q != null && all.length > q ? labourKeep(a, all, q) : all;
 if (q != null && us.length && us.length < q) us = us.concat([LAB_REST]);
 return us; }
 /* v5.59 — the BUILDINGS, never the things inside them: a fridge is not a place to fit stairs */""", 'tank pieces for labour', p, True)

open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print("v7.68 applied: a tank-mounted toilet location gets its Waste tank line from the contract, so the tanks' install and levelling can be ticked and charged; the tanks are the pieces the note names")
