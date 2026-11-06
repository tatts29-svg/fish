#!/usr/bin/env python3
"""v7.55 - the P&L in Andrew's words. Andrew, 1 Oct 2026: "ensure correct P&L wording is used".

The live v7.54 carries the Forecast P&L and the rehire on every branch, but the upload reworded the branch table's
rehire cell and two revenue lines away from the business words on AGENTS.md ("Rehire", "Rehire Revenue", "Rehire
cost", "the card", "charged to the V8s at our rates"): "Toilet hire Revenue ... included in hire", "Hire at card or
entered rates", "Rehire detail . included", "none recorded", "do not add that column again". This puts Andrew's
words back, keeps every figure exactly as it is, and keeps the one useful thing the rewording added - that a rate
typed on Costs counts beside the card. Nothing else on the page changes.
    python3 patch_v755.py <page.html>   (needs the live v7.54: pl754Cell)"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'pl755' in t: sys.exit('v7.55 already applied')
if 'function pl754Cell(' not in t or 'function pl752Card(' not in t: sys.exit('needs the live v7.54 (pl754Cell, pl752Card)')

def swap_function(text, name, new_src):
    """replace one whole top-level function by name (exactly one definition, brace-matched)"""
    key = 'function ' + name + '('
    if text.count(key) != 1: sys.exit(name + ': expected exactly one definition, found ' + str(text.count(key)))
    i = text.find(key); k = text.find('{', i); d = 0
    for e in range(k, len(text)):
        if text[e] == '{': d += 1
        elif text[e] == '}':
            d -= 1
            if d == 0: return text[:i] + new_src + text[e + 1:]
    sys.exit(name + ': unbalanced braces')

TITLE = r"""function pl754Title(b){ /* pl755 - Andrew's words */
 const parts = [];
 if (b.rehireLines) parts.push(fmtNum(b.rehireLines) + ' toilet line' + (b.rehireLines === 1 ? '' : 's') + ' (' + fmtNum(b.rehireUnits) + ' units) on this branch’s contracts are the Event Portables rehire: charged to the V8s at our rates, Event Portables paid for them. ' + fmtNum(b.rehireCoatesNos) + ' of the lines carry a Coates plant number; the record does not say which unit is whose. The Rehire Revenue here is already in Hire by the rate.');
 if (b.plantLines) parts.push(fmtNum(b.plantLines) + ' plant line' + (b.plantLines === 1 ? '' : 's') + ' the project manager marked as hired in (' + b.plantWhat.join('; ') + '): charged to the V8s at our rates; the supplier and the Rehire cost are not on the record.');
 if (b.subLines) parts.push(fmtNum(b.subLines) + ' SUB line' + (b.subLines === 1 ? '' : 's') + ' the rental system books as sub-hired, from ' + (b.suppliers.join(', ') || 'a supplier not named') + ' · Rehire Revenue ' + money0(b.rehire) + ' · the Rehire cost is not on the record.');
 return parts.length ? parts.join(' ') : 'no line on this branch’s contracts is booked as sub-hired, and none is rehire';
}"""
CELL = r"""function pl754Cell(b, RH){ /* pl755 - Andrew's words: Rehire, Rehire Revenue, Rehire cost, at our rates */
 const out = [], one = (n, w) => fmtNum(n) + ' ' + w + (n === 1 ? '' : 's');
 if (b.rehireLines) {
 const marked = RH && RH.marked ? RH.marked : 0, co = RH && RH.co || 'Event Portables';
 out.push(`<b>Rehire · ${esc(co)}</b> · ${esc(one(b.rehireLines, 'toilet line'))} · ${esc(fmtNum(b.rehireUnits))} units · Rehire Revenue <b>${esc(money0(b.rehireCharge))}</b> at our rates${b.rehireUnrated ? ` <span class="pl-todo">+ ${esc(one(b.rehireUnrated, 'line'))} not priced</span>` : ''}`);
 out.push(`<span class="w">${RH && RH.servicing ? `+ servicing ${esc(money0(RH.servicing))} at the card, on no contract line · ` : ''}${RH && RH.cost != null ? `Rehire cost ${esc(money0(RH.cost))}${RH.approved ? ' approved' : ' quoted, unsigned'} — shown, never added` : 'Rehire cost not on the record'}</span>`);
 out.push(`<span class="w">${esc(one(b.rehireCoatesNos, 'line'))} carry a Coates plant number · ${esc(one(marked, 'location'))} marked ${esc(co)} gear on the page</span>`);
 }
 if (b.plantLines) out.push(`<b>Rehire · plant</b> · ${esc(one(b.plantLines, 'line'))} · Rehire Revenue <b>${esc(money0(b.plantCharge))}</b> at our rates${b.plantUnrated ? ` <span class="pl-todo">+ ${esc(one(b.plantUnrated, 'line'))} not priced</span>` : ''}<br><span class="w">${esc(b.plantWhat.join('; '))} · marked hired in by the project manager · supplier and Rehire cost not on the record</span>`);
 if (b.subLines) out.push(`<span class="w"><b>${esc(one(b.subLines, 'SUB line'))}</b> the rental system books · Rehire Revenue ${esc(money0(b.rehire))} · ${esc(b.suppliers.join(', ') || 'supplier not named')} · Rehire cost not on the record</span>`);
 return out.length ? out.join('<br>') : '<span class="pl-none">none</span>';
}"""
t = swap_function(t, 'pl754Title', TITLE)
t = swap_function(t, 'pl754Cell', CELL)

# the revenue line for card and typed rates - the card's own words
t = rep(t, "line('Hire at card or entered rates', `${pl(cardLines, 'line')} · estimates or rates entered here; the source contract Rate 1 is retained`, m0(cardTotal), CARD)",
 "line('Hire with no contract rate yet — from the card, or a rate typed on Costs', `${pl(cardLines, 'line')} · the street rate card 2026, or the rate the branch gave us typed on Costs · an estimate until the branch puts a rate on the line (Rate 1 on the contract is kept)`, m0(cardTotal), CARD)", 'card line', p, True)
t = rep(t, "CARD = tag('card / entered', 'est')", "CARD = tag('from the card', 'est')", 'card tag', p, True)
# the column heads
t = rep(t, '<th class="num"title="source contract rates, including SUB Rehire Revenue">Hire · by the rate</th><th class="num"title="card estimates or rates entered here; the source Rate 1 is retained">Hire · card / entered</th>',
 '<th class="num" title="hire lines carrying a rate the branch put on the contract (the SUB lines’ Rehire Revenue among them)">Hire · by the rate</th><th class="num" title="hire lines with no contract rate yet: the street rate card 2026, or a rate typed on Costs">Hire · from the card</th>', 'heads', p, True)
t = rep(t, '<th title="Revenue details already included in the hire columns; servicing and supplier costs are separate whole-job context">Rehire detail · included</th>',
 '<th title="the rehire on the branch’s contracts (Event Portables toilets and hired-in plant, charged to the V8s at our rates, the supplier paid) and the SUB lines the rental system itself books as sub-hired. Detail of the hire columns, not another amount.">Sub-hired · rehire</th>', 'head rehire', p, True)
# the total row's cell
t = rep(t, "return `${rl ? `<b>Toilet Revenue · ${esc(fmtNum(rl))} line${rl === 1 ? '' : 's'}</b> · ${esc(money0(rc))}<br>` : ''}${pl2 ? `<b>Rehire ${esc(fmtNum(pl2))} plant line${pl2 === 1 ? '' : 's'}</b> · ${esc(money0(pc))}<br>` : ''}<span class=\"w\">${esc(fmtNum(sl))} SUB line${sl === 1 ? '' : 's'} · ${esc(money0(sr))}</span>`;",
 "return `${rl ? `<b>Rehire · toilets · ${esc(fmtNum(rl))} line${rl === 1 ? '' : 's'}</b> · Rehire Revenue ${esc(money0(rc))}<br>` : ''}${pl2 ? `<b>Rehire · plant · ${esc(fmtNum(pl2))} line${pl2 === 1 ? '' : 's'}</b> · Rehire Revenue ${esc(money0(pc))}<br>` : ''}<span class=\"w\">${esc(fmtNum(sl))} SUB line${sl === 1 ? '' : 's'} · Rehire Revenue ${esc(money0(sr))}</span>`;", 'total cell', p, True)
# the note under the table
t = rep(t, "<p class=\"pl-note\">The branch total is hire by the rate (including SUB Rehire Revenue), plus hire at card or entered rates, plus Transport Revenue. Rehire detail is already included: do not add that column again. Toilet Revenue is shown as a stream; the supplier allocation remains incomplete. Fencing, toilet servicing and event labour are charged off dockets, a quote and the scope, not contract lines, so they sit outside the branch table.</p>",
 "<p class=\"pl-note\">The branch total is the contracts line above, to the dollar: hire by the rate (the SUB lines’ Rehire Revenue among it), hire from the card or typed on Costs, plus Transport Revenue. Sub-hired · rehire is detail of those columns, not another amount. Fencing, toilet servicing and event labour are charged off dockets, a quote and the scope, not contract lines, so they sit outside the branch table.</p>", 'note', p, True)
# the author line's fallback
t = rep(t, "<footer class=\"pl-foot\"><span>Author: ${esc((DATA.brand || {}).author || 'the project manager')} · Events Project Manager</span>",
 "<footer class=\"pl-foot\"><span>Author: ${esc((DATA.brand || {}).author || 'Andrew Fisher')} · Events Project Manager</span>", 'author', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
