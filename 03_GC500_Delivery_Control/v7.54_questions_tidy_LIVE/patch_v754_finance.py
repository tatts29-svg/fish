#!/usr/bin/env python3
"""Author: Andrew Fisher. Keep P&L provenance and branch details consistent with existing calculations.
Apply after the approved P&L and branch-Rehire patches. No record or total changes.
"""
import sys
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep
p = Path(sys.argv[1]); t = p.read_text()
marker = '/* v7.54 finance review — estimates stay separate from source contract rates. */'
if marker in t: sys.exit('v7.54 finance review already applied')
if 'function pl754Rehire(' not in t or 'function labourNote753(' not in t:
    sys.exit('needs approved P&L/branch Rehire and v7.53 labour explanations')
def replace(old, new, label):
    global t
    t = rep(t, old, new, label, str(p), True)
replace('function pl752Rows(){', marker + '\nfunction pl752Rows(){', 'finance review marker')
replace("if (r.subhired) { b.rehire = cents(b.rehire + ch.amount); return; }", "if (r.subhired) { b.rehire = cents(b.rehire + ch.amount); b.contract = cents(b.contract + ch.amount); return; }", 'SUB Revenue belongs in the hire column')
replace("if (ch.filled === 'card') { b.card = cents(b.card + ch.amount); b.cardLines++; }", "if (ch.filled === 'card' || ch.filled === 'typed') { b.card = cents(b.card + ch.amount); b.cardLines++; }", 'entered rates remain distinct from source contract rates')
replace('total: cents(b.contract + b.card + b.transport + b.rehire)', 'total: cents(b.contract + b.card + b.transport)', 'Rehire memorandum never added twice')
a=t.index('function pl754Title(b){'); b=t.index('function pl754Rehire(M){',a)
replace(t[a:b],(here/'finance754_src.js').read_text()+'\n','non-additive Rehire details and uncertain supplier allocation')
replace("CARD = tag('from the card', 'est')", "CARD = tag('card / entered', 'est')", 'estimate provenance tag')
replace("line('Hire with no contract rate yet, at the card', `${pl(cardLines, 'line')} · the street rate card 2026 · until the branch puts a rate on the line`", "line('Hire at card or entered rates', `${pl(cardLines, 'line')} · estimates or rates entered here; the source contract Rate 1 is retained`", 'separate entered Revenue estimates')
replace("k.labour && k.labour.hours ? `plus ${esc(fmtNum(Math.round((k.labour.hours + (k.race_hours || 0)) * 10) / 10))} h of wages with no rate` : ''", "esc(labourNote753(M.as_at))", 'current partial labour outlook instead of all-hours-unrated claim')
replace('title="hire lines carrying a rate the branch put on the contract">Hire · by the rate', 'title="source contract rates, including SUB Rehire Revenue">Hire · by the rate', 'source hire includes SUB lines')
replace('title="hire lines with no contract rate yet, at the street rate card 2026">Hire · from the card', 'title="card estimates or rates entered here; the source Rate 1 is retained">Hire · card / entered', 'branch estimate column')
replace('<th title="the rehire on the branch’s contracts (Event Portables toilets, charged to the V8s at our rates, the supplier paid), and the SUB lines the rental system itself books as sub-hired">Sub-hired · rehire</th>', '<th title="Revenue details already included in the hire columns; servicing and supplier costs are separate whole-job context">Rehire detail · included</th>', 'memorandum column heading')
replace('<b>Rehire ${esc(fmtNum(rl))} toilet line${rl === 1 ? \'\' : \'s\'}</b>', '<b>Toilet Revenue · ${esc(fmtNum(rl))} line${rl === 1 ? \'\' : \'s\'}</b>', 'toilet stream does not establish ownership')
replace('The branch total is the contracts line above, to the dollar: hire by the rate, hire from the card, plus the Transport Revenue and Rehire Revenue charge lines on the same contracts.', 'The branch total is hire by the rate (including SUB Rehire Revenue), plus hire at card or entered rates, plus Transport Revenue. Rehire detail is already included: do not add that column again. Toilet Revenue is shown as a stream; the supplier allocation remains incomplete.', 'explain additive branch totals and included Rehire detail')
replace('(Event Portables: ${esc(money0(k.rehire || 0))}, approved)', '(Event Portables: ${k.rehire_approved && k.rehire != null ? esc(money0(k.rehire)) + ", approved" : "quoted cost awaiting approval"})', 'do not label absent Rehire costs approved')
p.write_text(t); print('ok',p,'finance provenance and non-additive details')
