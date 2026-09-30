#!/usr/bin/env python3
"""v7.54 - every branch shows its rehire. The project manager, 1 Oct 2026: "Make sure all branches show subhired.
KINP you have subhired at 1400 - what about all the Event Portables portaloos?"

The v7.52 branch table's Sub-hired cell read only the SUB flag the rental system puts on a line - one refrigerated
container on KINP (ROY002, $1,428) and one forklift attachment on MEAD (QUE011, $9.30). The Event Portables toilets
were not on any branch row: the rental system books the toilet lines on KINP's contract 9968955 as KINP fleet, yet
the page's own rule since v5.83 (the toilets stream: "Event Portables rehire - revenue at our rates - rehire cost,
paid to Event Portables") treats every toilet line as the Event Portables rehire, charged to the V8s at Coates's
rates with Event Portables paid for it. So the cell now carries both, on every branch:
  - Rehire on the branch's contracts: the toilet lines (132 lines, 251 units on KINP), their Rehire Revenue at our
    rates, and beside it the servicing at the card (on no contract line) and the rehire cost the four approved
    quotes carry ($118,575) - the cost is shown, never added to the revenue; how many of the lines carry a Coates
    plant number (31) and how many locations are marked as Event Portables gear on the page (4) are stated as facts,
    because the record does not say which unit is whose.
  - SUB lines the rental system itself books as sub-hired, with their Rehire Revenue and supplier code, as before.
  - none, when a branch has neither.
The branch totals do not move: the toilet lines were always in KINP's hire by the rate. Nothing else changes.
    python3 patch_v754.py <page.html>   (after patch_v752.py - needs pl752Rows and pl752Card)"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'rehireLines' in t: sys.exit('v7.54 already applied')
if 'function pl752Rows(' not in t or 'function pl752Card(' not in t: sys.exit('needs v7.52 (pl752Rows, pl752Card) applied first')

# 1. the row builder counts the rehire on each branch's contracts (the page's toilets-stream rule: family toilet)
t = rep(t, "transport: 0, rehire: 0, subLines: 0, suppliers: []};\n const ch = contractCharge(r); b.lines++;",
 "transport: 0, rehire: 0, subLines: 0, suppliers: [], rehireLines: 0, rehireUnits: 0, rehireCharge: 0, rehireCoatesNos: 0, rehireUnrated: 0, plantLines: 0, plantCharge: 0, plantUnrated: 0, plantWhat: []};\n const ch = contractCharge(r); b.lines++;\n"
 " /* v7.54 - the rehire on the branch's own contracts: the toilet lines are the Event Portables rehire (the toilets stream's rule), charged at our rates;\n"
 " and the plant the project manager marked as hired in (subhired_machine: the 5 t forklift with tynes, 12 Sep) - Andrew, 1 Oct: 'some forklifts are subhired' */\n"
 " if (r.family === 'toilet' && !r.subhired) { b.rehireLines++; b.rehireUnits += Number(r.quantity) || 0; if (r.asset_no_is_plant_number) b.rehireCoatesNos++; if (typeof ch.amount === 'number') b.rehireCharge = cents(b.rehireCharge + ch.amount); else b.rehireUnrated++; }\n"
 " else if (r.subhired_machine && !r.subhired) { b.plantLines++; if (typeof ch.amount === 'number') b.plantCharge = cents(b.plantCharge + ch.amount); else b.plantUnrated++; const w = (r.subhire && r.subhire.reads_as) || (r.what || r.description || 'plant'); if (!b.plantWhat.includes(w)) b.plantWhat.push(w); }",
 'rows', p, True)

# 2. the column head says what the cell holds
t = rep(t, '<th title="the SUB lines the rental system books as sub-hired, and their Rehire Revenue">Sub-hired</th>',
 '<th title="the rehire on the branch’s contracts (Event Portables toilets, charged to the V8s at our rates, the supplier paid), and the SUB lines the rental system itself books as sub-hired">Sub-hired · rehire</th>',
 'head', p, True)

# 3. the cell: rehire on the contracts, then the SUB lines, else none
OLD_CELL = ("<td class=\"pl-sub\" title=\"${b.subLines ? esc(pl(b.subLines, 'SUB line') + ' from ' + (b.suppliers.join(', ') || 'a supplier not named') + ' · Rehire Revenue ' + money0(b.rehire) + ' · the rehire cost is not on the record') : 'no line on this branch\\u2019s contracts is booked as sub-hired'}\">"
 "${b.subLines ? `<b>${esc(fmtNum(b.subLines))} line${b.subLines === 1 ? '' : 's'}</b> · ${esc(money0(b.rehire))}<br><span class=\"w\">${esc(b.suppliers.join(', ') || 'supplier not named')} · cost not on record</span>` : '<span class=\"pl-none\">none</span>'}</td>")
NEW_CELL = ("<td class=\"pl-sub\" title=\"${esc(pl754Title(b))}\">${pl754Cell(b, RH)}</td>")
t = rep(t, OLD_CELL, NEW_CELL, 'cell', p, True)

# 4. the total row's cell
OLD_TOT = "<td class=\"pl-sub\"><b>${esc(fmtNum(B.reduce((s, b) => s + b.subLines, 0)))} lines</b> · ${esc(money0(B.reduce((s, b) => s + b.rehire, 0)))}</td>"
NEW_TOT = ("<td class=\"pl-sub\">${(() => { const rl = B.reduce((s, b) => s + b.rehireLines, 0), rc = B.reduce((s, b) => s + b.rehireCharge, 0), pl2 = B.reduce((s, b) => s + b.plantLines, 0), pc = B.reduce((s, b) => s + b.plantCharge, 0), sl = B.reduce((s, b) => s + b.subLines, 0), sr = B.reduce((s, b) => s + b.rehire, 0);"
 " return `${rl ? `<b>Rehire ${esc(fmtNum(rl))} toilet line${rl === 1 ? '' : 's'}</b> · ${esc(money0(rc))}<br>` : ''}${pl2 ? `<b>Rehire ${esc(fmtNum(pl2))} plant line${pl2 === 1 ? '' : 's'}</b> · ${esc(money0(pc))}<br>` : ''}<span class=\"w\">${esc(fmtNum(sl))} SUB line${sl === 1 ? '' : 's'} · ${esc(money0(sr))}</span>`; })()}</td>")
t = rep(t, OLD_TOT, NEW_TOT, 'total', p, True)

# 5. the helpers, beside pl752Rows; RH is worked out once per card (the servicing at the card and the approved rehire cost are whole-job figures)
HELPERS = r"""
/* v7.54 - the Sub-hired · rehire cell, on every branch: the rehire on its own contracts, then the SUB lines the rental
 system books, else none. The cost is shown beside the revenue and never added to it. */
function pl754Title(b){
 const parts = [];
 if (b.rehireLines) parts.push(fmtNum(b.rehireLines) + ' toilet line' + (b.rehireLines === 1 ? '' : 's') + ' (' + fmtNum(b.rehireUnits) + ' units) on this branch’s contracts are the Event Portables rehire: charged to the V8s at our rates, Event Portables paid for them. ' + fmtNum(b.rehireCoatesNos) + ' of the lines carry a Coates plant number; the record does not say which unit is whose.');
 if (b.plantLines) parts.push(fmtNum(b.plantLines) + ' plant line' + (b.plantLines === 1 ? '' : 's') + ' the project manager marked as hired in (' + b.plantWhat.join('; ') + '): charged to the V8s at our rates; the supplier and the rehire cost are not on the record.');
 if (b.subLines) parts.push(fmtNum(b.subLines) + ' SUB line' + (b.subLines === 1 ? '' : 's') + ' from ' + (b.suppliers.join(', ') || 'a supplier not named') + ' · Rehire Revenue ' + money0(b.rehire) + ' · the rehire cost is not on the record');
 return parts.length ? parts.join(' ') : 'no line on this branch’s contracts is booked as sub-hired, and none is rehire';
}
function pl754Cell(b, RH){
 const out = [];
 if (b.rehireLines) {
 const marked = RH && RH.marked ? RH.marked : 0;
 out.push(`<b>Rehire · ${esc(RH && RH.co || 'Event Portables')}</b> · ${esc(fmtNum(b.rehireLines))} toilet line${b.rehireLines === 1 ? '' : 's'} · ${esc(fmtNum(b.rehireUnits))} units · <b>${esc(money0(b.rehireCharge))}</b> at our rates${b.rehireUnrated ? ` <span class="pl-todo">+ ${esc(fmtNum(b.rehireUnrated))} unrated</span>` : ''}`);
 out.push(`<span class="w">${RH && RH.servicing ? `+ servicing ${esc(money0(RH.servicing))} at the card, on no contract line · ` : ''}${RH && RH.cost != null ? `rehire cost ${esc(money0(RH.cost))}${RH.approved ? ' approved' : ' quoted, unsigned'} — shown, not added` : 'rehire cost not on the record'}</span>`);
 out.push(`<span class="w">${esc(fmtNum(b.rehireCoatesNos))} line${b.rehireCoatesNos === 1 ? '' : 's'} carry a Coates plant number · ${esc(fmtNum(marked))} location${marked === 1 ? '' : 's'} marked ${esc(RH && RH.co || 'Event Portables')} gear on the page</span>`);
 }
 if (b.plantLines) out.push(`<b>Rehire · plant</b> · ${esc(fmtNum(b.plantLines))} line${b.plantLines === 1 ? '' : 's'} · <b>${esc(money0(b.plantCharge))}</b> at our rates${b.plantUnrated ? ` <span class="pl-todo">+ ${esc(fmtNum(b.plantUnrated))} unrated</span>` : ''}<br><span class="w">${esc(b.plantWhat.join('; '))} · marked hired in by the project manager · supplier and cost not on record</span>`);
 if (b.subLines) out.push(`<span class="w"><b>${esc(fmtNum(b.subLines))} SUB line${b.subLines === 1 ? '' : 's'}</b> the rental system books · ${esc(money0(b.rehire))} · ${esc(b.suppliers.join(', ') || 'supplier not named')} · cost not on record</span>`);
 return out.length ? out.join('<br>') : '<span class="pl-none">none</span>';
}
function pl754Rehire(M){
 const k = M.cost || {}, c = M.charge || {};
 const Q = (typeof DATA !== 'undefined' && DATA.rehire_quotes) || {};
 let marked = 0; try { allAssets().forEach(a => { const s = subhireOf(a.key); if (s && /event portables/i.test(s.co || '')) marked++; }); } catch (e) {}
 return {co: (Q.supplier && Q.supplier.name ? Q.supplier.name.replace(/\s+Australia$/i, '') : 'Event Portables'), servicing: c.servicing || 0, cost: k.rehire != null ? k.rehire : (k.rehire_quoted != null ? k.rehire_quoted : null), approved: !!k.rehire_approved, marked};
}
function pl752Rows(){"""
t = rep(t, "\nfunction pl752Rows(){", HELPERS, 'helpers', p, True)
t = rep(t, " const B = pl752Rows();\n const cardTotal", " const B = pl752Rows(), RH = pl754Rehire(M);\n const cardTotal", 'RH', p, True)

# 6. the cell wraps now that it says more
CSS = "\n/* v7.54 */ .pl752 .pl-sub{white-space:normal;max-width:38ch;line-height:1.35}.pl752 .pl-sub .w{display:block;font-size:10.5px;color:#7b8590}.pl752 .pl-sub .pl-todo{font-size:10.5px}\n"
k = t.find('</style>'); t = t[:k] + CSS + t[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
