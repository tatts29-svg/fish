# Author: Andrew Fisher
from pathlib import Path
import sys
H=Path(__file__).resolve().parent
sys.path.insert(0,str(H.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'function transport953Reconcile' not in s, 'v9.53 is already applied'
assert 'function charges952Html' in s and " · v9.52'; /* v8.19" in s, 'Requires v9.52 base'
def change(old,new,label):
 global s
 s=rep(s,old,new,label,str(p))
change('function transport888ViewBuild(){',(H/'transport953.js').read_text()+'\nfunction transport888ViewBuild(){','single transport forecast reconciliation')
change('T.rows.forEach(r => { if (r.branch && !codes.includes(r.branch)) codes.push(r.branch); });','T.rows.concat(T.planned).forEach(r => { if (r.branch && !codes.includes(r.branch)) codes.push(r.branch); });','planned branch coverage')
change("'the final total may change · Q6846 has no hire dates'","'the final total may change · '+transport953QuoteWords()",'known Q6846 dates')
change("gap('Event Portables: Q6846’s hire dates; the invoice and PO', 'the quote cannot be put in a month; nothing invoiced yet', 'Andrew — Event Portables');","gap('Event Portables — invoice and PO reconciliation', transport953QuoteWords()+'; approved quotes remain provisional. Confirm invoice and PO coverage against the delivered quantities.', 'Andrew — Event Portables');\n transport953SupplierGap(gap);",'supplier gaps and quote dates')
a=s.index(" push('Transport (cartage) — carriers’ charges', 'the job', tToDate",s.index('function cj764Model776Held'))
b=s.index(' if (nonLoadTasks834)',a)
change(s[a:b],''' push('Transport (cartage) — carriers’ charges', 'the job', tToDate, F888.total,
 `to date: ${fmtNum(ST.counted_refs || 0)} schedule figures${ST.plus ? ` · ${fmtNum(ST.plus)} marked “and more” (a floor)` : ''}${ST.internal ? ` · ${fmtNum(ST.internal)} Coates-truck loads, no carrier bill` : ''} · to come: ${fmtNum(F888.cardLoads953)} existing transport rows plus ${fmtNum(F888.plannedAllowances953)} planned movements at the card’s explicit item and quantity (${money0(cardCost)})${loadsNoFigNoCard ? ` + ${fmtNum(loadsNoFigNoCard)} existing average allowances (${money0(avgPart || 0)})` : ''}`,
 'Planned allowances are not booked loads or invoices. Real carrier figures replace them. Supplier delivery and pickup already in approved quotes are not added again; '+fmtNum(F888.heldLoads928)+' movements still need a rate or allocation.');
 gap('Transport — final carrier figures and bookings', 'Forecast allowances are estimates, not confirmed carrier charges. Figures marked “and more” remain a floor; Internal means a Coates truck, not a free movement.', 'Andrew — carrier figures and internal truck costs');
 if(F888.heldPlanned953)gap(`${fmtNum(F888.heldPlanned953)} planned transport movements — rate or scope to confirm`, 'The Transport card lists every planned movement and its reason. Unknown or POA rates, uncertain quantities and partial supplier quote coverage are not converted to zero-priced work.', 'Andrew — confirm the rate or supplier scope');
 if (T888.demob.notInPl.legs) gap(`${fmtNum(T888.demob.notInPl.legs)} demob movements still unpriced`, 'Numeric, uniquely scoped card allowances are now in the forecast. These remaining movements need an item, quantity, cost rate or supplier coverage confirmed; no extra average is invented.', 'Andrew — demob rate and scope');
''','costs to job end explanation')
change("const f = r.forecast || {kind: 'none'};\n if (f.kind === 'card'", "const f = r.forecast || {kind: 'none'};\n if(f.kind==='quote953'||f.kind==='represented953')return `<span class=\"acc761-w\">${esc(f.reason953)}</span>`;\n if(f.review953)return `<b>${esc(money(f.amount))}</b><br><span class=\"acc761-w\">${esc(f.review953)} Existing allowance retained pending review.</span>`;\n if (f.kind === 'card'",'forecast coverage labels')
a=s.index(' <li><b>In the P&amp;L:</b> ${T.demob.total');b=s.index(' <li><b>The Demob tab',a)
change(s[a:b],''' <li><b>In the P&amp;L:</b> ${esc(money(T.demob.total))} of demob carrier costs and allowances, including ${n(T.forecast.plannedDemob953)} unbooked planned movements. This is a cut of the transport forecast, not an additional charge; Finance reads the same figure.</li>
 <li><b>Supplier pickup:</b> ${n(T.demob.covered953)} demob movements have explicit supplier allocation covered by approved quote pickup. No extra carrier allowance is added.</li>
 <li><b>Still unpriced:</b> ${n(notIn.legs)} demob movements on ${n(notIn.refs)} references need an item, quantity, cost rate or supplier scope confirmed. Unknown does not mean free.</li>
''','demob forecast semantics')
change(' <details class="plfold765 tr888-fold" data-sfold="costs765|tr888plan"',' ${transport953PlanHtml(T)}\n <details class="plfold765 tr888-fold" data-sfold="costs765|tr888plan"','planned detail table')
change("rows.push(['Transport Revenue total', '', '', '', '', '', V.revenueTotal]);", "rows.push(['Transport Revenue total', '', '', '', '', '', V.revenueTotal]);\n transport953Csv(rows,V.T);",'planned CSV section')
change('costMissing: groups.filter(g => g.cost == null).length, lines:', 'costMissing: groups.filter(g => g.cost == null).length, forecastMissing: groups.filter(g => g.costJob == null).length, lines:', 'actual versus forecast missing counts')
change('costJob: 0, costMissing: 0}; b.groups++;','costJob: 0, costMissing: 0, forecastMissing:0}; b.groups++;','branch missing counters')
change('if (g.cost == null) b.costMissing++; });','if (g.cost == null) b.costMissing++; if(g.costJob==null)b.forecastMissing++; });','branch forecast gaps')
a=s.index("${fin745Card('Rehire cost — to job end'",s.index('function rh766Card'))
b=s.index(' <div class="fin745-block">',a)
change(s[a:b],s[a:b].replace('T.costMissing','T.forecastMissing').replace('b.costMissing','b.forecastMissing').replace('not on the record','without a source forecast'),'job end counts only unresolved forecasts')
change('the card’s transport cost for each confirmed load item and quantity across ${n(T.forecast.cardRefs)} references', 'the card’s transport cost for explicit equipment quantities across ${n(T.forecast.cardRefs)} references, including ${n(T.forecast.plannedAllowances953)} unbooked planned movements', 'forecast tile scope')
change("'Forecast AUD ex GST', 'Flags'", "'Forecast AUD ex GST', 'Flags', 'Forecast basis / coverage review'", 'CSV basis heading')
change("tr888Flags(r).map(x => x.w).join('; ')]));", "tr888Flags(r).map(x => x.w).join('; '), (r.forecast || {}).review953 || (r.forecast || {}).reason953 || (r.forecast || {}).reason928 || '']));", 'CSV quote and review basis')
change(" · v9.52'; /* v8.19"," · v9.53'; /* v8.19",'footer')
assert 'const DATA = {' in s
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
