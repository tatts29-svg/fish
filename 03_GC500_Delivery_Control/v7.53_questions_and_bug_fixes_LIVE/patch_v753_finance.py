#!/usr/bin/env python3
"""Author: Andrew Fisher. Correct financial explanations without promoting estimates to actual costs."""
import os
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep

p = sys.argv[1]
t = Path(p).read_text(encoding='utf-8')
if 'function labourNote753(' in t:
    sys.exit('v7.53 finance already applied')
if 'function forkliftWholeHire748(' not in t or 'function fin745Summary(' not in t:
    sys.exit('needs the corrected v7.50 financial rules and monthly financial control')

def change(old, new, label):
    global t
    t = rep(t, old, new, label, p)

change('function moneySummary_(asOf){', (here / 'finance753_src.js').read_text() + '\nfunction moneySummary_(asOf){', 'current labour explanation')
change('''miss(cost.labour ? (SF ? `wages — ${fmtNum(Math.round((cost.labour.hours + cost.race_hours) * 10) / 10)} h on the tracker (${fmtNum(cost.labour.hours)} h build and demob, ${fmtNum(cost.race_hours)} h over the race weekend), no wage rate supplied, so hours only`
 : `labour — ${fmtNum(cost.labour.hours)} h on the tracker outside the race weekend, no wage rate supplied, so hours only`) : 'labour — no tracker read for this build', SF ? 'wages in hours only' : 'labour hours only');''',
       "miss(labourNote753(day), 'labour actuals and forecasts reviewed separately');", 'priced labour is not described as unrated')
change('''if (C.unknown) miss(`${C.unknown} contract line${C.unknown === 1 ? '' : 's'} with no rate yet on the charge side`, `${C.unknown} contract lines unrated`);''',
       '''if (C.unknown) miss(`${C.unknown} contract line${C.unknown === 1 ? '' : 's'} with no rate yet on the charge side`, `${C.unknown} contract lines unrated`);
 const water753 = ((DATA.toilet_servicing || {}).not_on_the_card || []);
 if (water753.length) miss(`customer revenue for ${water753.map(l => l.description).join(', ')} — no agreed customer rate or card line. The ${money(water753.reduce((sum, l) => sum + (l.their_amount || 0), 0))} supplier cost is already in the approved rehire costs; it is not a customer rate`, 'water services have no customer rate');''',
       'unpriced water revenue stays visible')
change('''servicing: DATA.toilet_servicing || null,''', '''servicing: servicing748(),''', 'servicing uses current chosen rates')
change('''if (X.cost.labour) cr.notes.push(X.charge.race.scope ? `wages: ${fmtNum(Math.round((X.cost.labour.hours + (X.cost.race_hours || 0)) * 10) / 10)} h on the tracker, no wage rate — hours only` : `wages: ${fmtNum(X.cost.labour.hours)} h outside the race weekend, no wage rate — hours only`);''',
       "if (X.cost.labour) cr.notes.push('wages are reviewed separately in Actuals, forecast & Finance journals; they are not added to this P&L');", 'stream labour explanation')
change("const internal = e => /coates/i.test(e || '');", "const internal = p => labourCategory753(p) === 'internal';", 'classify recorded labour type first')
change('''const inP = T.people.filter(p => worked(p) && internal(p.employer)), exP = T.people.filter(p => worked(p) && !internal(p.employer));''',
       '''const inP = T.people.filter(p => worked(p) && internal(p)), exP = T.people.filter(p => worked(p) && labourCategory753(p) === 'external');
 const unknownP = T.people.filter(p => worked(p) && labourCategory753(p) === 'unknown');
 if (unknownP.length) { const c = at('other'); if (c) { c.hours = Math.round(unknownP.reduce((sum, p) => sum + worked(p), 0) * 10) / 10; c.parts.push(`${fmtNum(c.hours)} h by ${unknownP.map(p => p.name).join(', ')} — labour type and employer not recorded; internal/external allocation needs review`); } }''', 'blank employer does not make CNA external')
change('''; no wage rate given, so hours only`); } }''', '''; wages are reviewed separately in Actuals, forecast & Finance journals, not added to this P&L`); } }''', 'internal labour review wording')
change('''— no hourly rate given, so hours only`); } }''', ''' — wages are reviewed separately in Actuals, forecast & Finance journals, not added to this P&L`); } }''', 'external labour review wording')
change('''Wages are not in it: ${fmtNum(M.breakeven_hours)} h with no wage rate — the difference covers them up to ${money(M.breakeven)} an hour.''',
       '''Wages are not in this P&L: ${fmtNum(M.breakeven_hours)} h — the difference divided by those hours is ${money(M.breakeven)} an hour, before the other missing costs. See Actuals, forecast & Finance journals for the priced labour outlook.''', 'export labour caveat')
change('''the biggest the crew's wages (${esc(fmtNum(M.breakeven_hours))} h with no wage rate)''',
       ''' including crew wages (${esc(fmtNum(M.breakeven_hours))} h; cost review below)''', 'headline does not claim every wage rate is missing')
change("hrs ? 'hours only — no wage rate' : 'no tracker read'", "hrs ? 'hours here; actual and forecast cost review below, outside this P&L' : 'no tracker read'", 'ledger labour review wording')
change('''The same servicing at the street card's pump-out rates: ${esc(TS.lines.map(l => `${fmtNum(l.qty)} × ${l.description} (theirs ${money(l.their_rate)}) at the card's ${l.card_line} ${money(l.card_rate)} = ${money(l.at_card)}`).join('; '))} — ${esc(money0(TS.at_card_total))} in all''',
       ''' The servicing at the rates currently selected: ${esc(TS.lines.map(l => `${fmtNum(l.qty)} × ${l.description} (theirs ${money(l.their_rate)}) at ${l.from === 'typed' ? 'the typed rate' : "the card's " + l.card_line} ${money(l.rate)} = ${money(l.amount)}`).join('; '))} — ${esc(money(TS.total))} in all''', 'servicing narrative follows editable rates')
change('''Charged in the revenue since v7.49 at these rates — see From the Street Rate Card 2026, below — and on no contract line yet.''',
       '''Included in the revenue estimate at these selected rates — see From the Street Rate Card 2026, below — and on no contract line yet.''', 'card revenue remains an estimate')
change('''${esc(fmtNum(hrs.to_date))} h worked to ${esc(fmtDay(M.as_at).dm)}''',
       ''' ${esc(fmtNum(hrs.to_date))} h scheduled through ${esc(fmtDay(M.as_at).dm)}''', 'elapsed planned hours are not confirmed actuals')
change('''No wage rate was supplied, so no dollar is put on an hour.''',
       ''' Wage rates and verified costs, where recorded, are reviewed in Actuals, forecast &amp; Finance journals; unconfirmed and future hours remain estimates.''', 'expanded labour explanation acknowledges existing rates')
change('''Nothing on either side is estimated, and the two are never added across.''',
       ''' Card-based revenue, future work and provisional quotes are estimates. Revenue and direct costs are never added together.''', 'expanded explanation identifies estimates honestly')
change('''Every line is on the Costs & charges tab (#costs) · nothing typed or estimated · dataset''',
       '''Every line is on the Costs & charges tab (#costs) · typed rates, card estimates and provisional costs are identified there · dataset''', 'email draft does not deny typed rates or estimates')
change('''h of wages on the tracker with no rate, so not in dollars''',
       ''' h of wages on the tracker; actual and forecast cost review is separate below''', 'category total acknowledges separate cost review')
change('''${h(L.to_date)} h worked, ${h(L.planned)} h planned''',
       '''${h(L.to_date)} h scheduled through today, ${h(L.planned)} h planned later''', 'tracker elapsed hours are not confirmed actuals')
change('''No dollar is put on an hour — hours only (24 Sep 2026).''',
       ''' This tracker view shows hours; the current priced labour outlook and verified costs are in Actuals, forecast &amp; Finance journals.''', 'tracker explanation points to current cost review')

Path(p).write_text(t, encoding='utf-8')
print('ok', p, 'v7.53 financial explanations and labour categories')
