#!/usr/bin/env python3
"""v7.64 - Costs correct and complete, and a Costs to job end card. Andrew, 1 Oct 2026: "All costs must be correct and
accurate. And forecast as much as we can. Clean data, tidy, presentable - all in on GC500." The audit is in
costs_audit_01Oct2026/README.md. Apply after v7.60, v7.61, v7.62 and v7.63.

  C1 Transport counted every load by its docket. The P&L took the first transport figure per reference, so a reference
     that went in on two trucks (WC05, 14 Sep, dockets 26067317 and 26067323, $290+ each) lost one. Now every schedule
     row with a figure is a load, as the Accruals section already read it: 37 loads, $22,011.39, not 36 and $21,721.39.
  C2 The relocation metres on three dockets (F010, F025, F027) are charged at the card per metre but Advanced bill
     relocation by the hour - the green book. The fencing cost note says so, so the three do not read as uncosted.
  C4 An undated docket (the workbook's Week 6 row 3) is dated to its week's last day on the cost side of the Accruals
     section, as the charge side already dates it; it stops appearing as "no day to put it in".
  THE CARD. "Costs to job end" sits under the Forecast P&L: for every direct-cost stream, to date (known) · still to
     come (forecast) · job forecast · the basis, and a list of what is not priced and who can price it. The fencing
     programme's remaining weeks are carried to job end on both sides - at Advanced's rates for cost and at the 2026
     card for revenue - named as forecast; transport at the card's transport cost per reference for the loads still
     without a figure; accommodation's unpriced nights at the person's own priced rates; the toilets at the approved
     quotes; Job Connect at the running sheet's rates. The P&L's own figures do not move: the card reconciles to them.
    python3 patch_v764.py <page.html>   (needs v7.63: acc763Action; and fenceByWeek, fenceCostFor, fenceRateFor, FCOL)"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function cj764Model(' in t: sys.exit('v7.64 already applied')
for need in ['function acc763Action(', 'function fenceByWeek(', 'function fenceCostFor(', 'function fenceRateFor(', 'function fencePaidSplit(', 'const tRows = live.map(a => ({a, t: transportCostOf(a)})).filter(x => x.t);', 'function fin745Bind(){', "const date = acc762Date(d.date), amount = acc762Money(d.paid_total);"]:
    if need not in t: sys.exit('needs ' + need)

# ---- C1: every load with a figure is a load, by its docket
t = rep(t, "const tRows = live.map(a => ({a, t: transportCostOf(a)})).filter(x => x.t);",
 """/* v7.64 - EVERY LOAD BY ITS DOCKET. transportCostOf(a) gives the first transport figure on a reference; a reference that
 went in on two trucks (WC05, 14 Sep 2026, dockets 26067317 and 26067323, $290+ each) lost the second. Every schedule row
 with a transport figure is a load Coates pays for, so every row is read - the way the Accruals section reads them. */
 const tRows = []; live.forEach(a => (a.events || []).forEach(e => { const tc = e.transport_cost; if (!tc) return;
 if (tc.internal) tRows.push({a, t: {amount: null, internal: true, plus: false, as_written: tc.as_written, words: 'Internal — Coates truck', event: e}});
 else if (tc.amount != null) tRows.push({a, t: {amount: tc.amount, internal: false, plus: !!tc.plus, as_written: tc.as_written, words: money(tc.amount) + (tc.plus ? '+' : ''), event: e}});
 else if (tc.as_written) tRows.push({a, t: {amount: null, internal: false, plus: !!tc.plus, as_written: tc.as_written, words: String(tc.as_written), event: e}}); }));""",
 'transport per docket', p, True)

# ---- C2: the relocation metres are costed by the hour, through the green book
t = rep(t, ": 'Rehire and Installation — external contractors together, not split'}`);",
 ": 'Rehire and Installation — external contractors together, not split'}${cj764RelocNote()}`);", 'relocation note', p, True)

# ---- C4: an undated docket is dated to its week's last day on the cost side too
t = rep(t, "const date = acc762Date(d.date), amount = acc762Money(d.paid_total);",
 "const date = acc762Date(d.date) || cj764WeekEnd(d.week), amount = acc762Money(d.paid_total); /* v7.64: dated to its week's last day, as the charge side dates it */",
 'undated docket', p, True)

# ---- the card and its helpers
HELPERS = r"""
/* v7.64 - COSTS TO JOB END (Andrew, 1 Oct 2026: "forecast as much as we can"). For every direct-cost stream: to date
   (known - the P&L's own figure), still to come (forecast, with its basis), the job forecast, and what is not priced.
   The fencing programme's remaining weeks are carried through on both sides. Nothing here moves a P&L figure. */
function cj764WeekEnd(week){ const w = (DATA.weeks || []).find(x => x.sheet === week); return w && /^\d{4}-\d{2}-\d{2}$/.test(String(w.end || '')) ? w.end : null; }
function cj764RelocNote(){ try { const n = allDockets().filter(d => d.usable && (d.paid_unpriced || []).includes('relocation')).length; return n ? ` · the relocation metres on ${n} docket${n === 1 ? '' : 's'} are costed by the hour through the green book, not per metre` : ''; } catch (e) { return ''; } }
/* the fencing programme's weeks still to come, at Advanced's rates and at the card */
function cj764Fencing(){
 const today = todayIso(), r2 = n => Math.round(n * 100) / 100; const out = {weeks: [], cost: 0, revenue: 0, noCostRate: {}, noCardRate: {}, notRolled: [], hourly: {}, behind: []};
 let W; try { W = fenceByWeek(allDockets()); } catch (e) { return Object.assign(out, {error: String(e)}); }
 W.forEach(w => { if (!w.planWords) return; if (!w.rolled) { out.notRolled.push(w.week); return; }
 /* a week whose end has passed is not dropped: the dockets are the truth for what was DONE, and whatever the plan still
    carries undocketed is still to do - carried forward and named "behind", never silently lost (Codex's review, 1 Oct) */
 const past = !!(w.end && w.end < today);
 const row = {week: w.week, prog: w.progSheet, start: w.start, end: w.end, state: past ? 'behind — week ended, metres still on the plan' : (w.start && w.start > today ? 'to come' : 'in progress'), past, cost: 0, revenue: 0, lines: []};
 w.lines.forEach(l => { const q = l.remaining != null ? Math.max(0, l.remaining) : 0; if (!q) return; const rate = fenceRateFor(l.column), paid = fenceCostFor(l.column);
 const rev = rate && rate.value != null ? q * rate.value : null; const cost = paid && paid.value != null ? q * paid.value : null;
 if (rev != null) row.revenue += rev; else out.noCardRate[l.name] = r2((out.noCardRate[l.name] || 0) + q);
 if (cost != null) row.cost += cost; else if (paid && paid.source === 'hourly') out.hourly[l.name] = r2((out.hourly[l.name] || 0) + q); else out.noCostRate[l.name] = r2((out.noCostRate[l.name] || 0) + q);
 row.lines.push({name: l.name, unit: l.unit, q, rev, cost}); });
 /* programme types the dockets have no column for (hoarding, flat feet, WPF) */
 if (past && !row.lines.length) return; /* a past week with nothing left on the plan: done; the dockets are the truth */
 if (!past) try { const ps = ((DATA.fencing || {}).week_sheets || []).find(x => x.sheet === w.progSheet); if (ps && ps.totals) Object.entries(ps.totals).forEach(([type, q]) => { if (!q || (FCOL || []).some(c => c.programme_type === type)) return; out.noCardRate[type] = r2((out.noCardRate[type] || 0) + q); out.noCostRate[type] = r2((out.noCostRate[type] || 0) + q); }); } catch (e) {}
 row.cost = r2(row.cost); row.revenue = r2(row.revenue); out.cost = r2(out.cost + row.cost); out.revenue = r2(out.revenue + row.revenue); out.weeks.push(row);
 if (past) { out.behind.push(row.prog || row.week); out.behindCost = r2((out.behindCost || 0) + row.cost); out.behindRevenue = r2((out.behindRevenue || 0) + row.revenue); } });
 out.behindCost = out.behindCost || 0; out.behindRevenue = out.behindRevenue || 0;
 return out;
}
function cj764Model(){
 const M = moneySummary(), c = M.charge || {}, k = M.cost || {}, r2 = n => Math.round(n * 100) / 100, today = todayIso();
 const cat = key => (M.categories || []).find(x => x.key === key) || {amount: 0, known: false};
 const rows = [], gaps = []; const gap = (what, why, owner) => gaps.push({what, why, owner});
 const push = (stream, branch, toDate, toCome, basis, note) => rows.push({stream, branch, toDate, toCome, job: toDate == null && toCome == null ? null : r2((toDate || 0) + (toCome || 0)), basis, note});
 /* fencing */
 const F = cj764Fencing(); const SP = fencePaidSplit(); const fenceToDate = r2(cat('fencing').amount || 0);
 const fenceWeeks = F.weeks.map(w => `${w.prog || w.week} ${w.past ? 'behind' : w.state}`).join(', ');
 const behindWords = F.behind && F.behind.length ? ` · of which ${money0(F.behindCost)} (${money0(F.behindRevenue)} at the card) is BEHIND THE PROGRAMME: ${F.behind.join(', ')} ended with metres still on the plan and no docket for them — still to do, or done and docketed under another week; Advanced to confirm` : '';
 push('Fencing — Advanced Temporary Fencing, rehire cost', typeof pl760FencingBranch === 'function' ? pl760FencingBranch() : 'STPS', fenceToDate, F.cost,
 `to date: ${fmtNum(allDockets().filter(d => d.usable).length)} dockets at Advanced’s own sheet${SP.green ? ' + the green book ' + money0(SP.green) : ''} · to come: the 2026 fencing programme’s remaining weeks (${fenceWeeks || 'none'}) × Advanced’s rates — clean, scrim, CCB, gates${behindWords}`,
 [Object.keys(F.hourly).length ? `relocation ${Object.entries(F.hourly).map(([n, q]) => fmtNum(q) + ' m').join(', ')} is billed by the hour — hours not yet known` : '', Object.keys(F.noCostRate).length ? `no rate on Advanced’s sheet for ${Object.entries(F.noCostRate).map(([n, q]) => `${n.replace(/^Temporary Fence \(m\) — |^Crowd Control Barriers \(m\) — /, '')} ${fmtNum(q)}`).join(', ')}` : '', F.notRolled.length ? `the deconstruction weeks (${F.notRolled.join(', ')}) still carry 2025 dates — a reference, not a plan — so removal is not forecast` : ''].filter(Boolean).join(' · '));
 if (F.behind && F.behind.length) gap(`Fencing behind the programme: ${F.behind.join(', ')} ended with metres still on the plan (${money0(F.behindCost)} at Advanced’s rates, ${money0(F.behindRevenue)} at the card)`, 'carried as still to come until Advanced say whether it was done under another week or dropped', 'Andrew — Advanced’s programme manager');
 if (Object.keys(F.hourly).length || Object.keys(F.noCostRate).length) gap('Fencing still to come: relocation hours, hoarding, flat feet, WPF and removal', 'Advanced’s sheet has no per-metre rate for them; the programme has the quantities', 'Andrew — a rate or an hours estimate from Advanced');
 /* toilets */
 const rq = Number(k.rehire) || 0; push('Toilets — Event Portables, rehire cost', typeof pl760ToiletBranch === 'function' ? pl760ToiletBranch() : 'KINP', rq, 0, `the four approved quotes ex GST, counted whole on the P&L (${k.rehire_approved ? 'approved on Andrew’s word' : 'quoted'}); no invoice yet`, 'the final total may change · Q6846 has no hire dates');
 gap('Event Portables: Q6846’s hire dates; the invoice and PO', 'the quote cannot be put in a month; nothing invoiced yet', 'Andrew — Event Portables');
 if (k.subhire_lines) gap(`${fmtNum(k.subhire_lines)} sub-hired contract lines and the 5 t forklift hired in — supplier cost`, 'charged to the V8s, cost not on the record', 'Andrew — supplier quotes or invoices');
 /* transport */
 const ST = (k.transport || {}).schedule || {}; const tToDate = r2(Number(k.transport && k.transport.amount) || 0);
 const live = allAssets().filter(a => !a._cancelled && !a.rest_of); let cardCost = 0, cardRefs = 0, loadsNoFig = 0, loadsNoFigNoCard = 0;
 /* a reference whose transport cost is already on OUR typed line is known, not to come - the P&L gives that line precedence over the schedule, so this does too (Codex's review, 1 Oct) */
 let ourRefs = new Set(); try { ourRefs = new Set(ourCosts().filter(x => x.kind === 'transport' && x.usable && x.amount != null && x.ref).map(x => x.ref)); } catch (e) {}
 live.forEach(a => { if (ourRefs.has(a.key)) return; const ev = (a.events || []).filter(e => e.carrier || e.dd || e.transport_cost); if (!ev.length) return; const noFig = ev.filter(e => !(e.transport_cost && (e.transport_cost.amount != null || e.transport_cost.internal))); if (!noFig.length) return; const T = assetTotal(a); const cc = (T.lines || []).reduce((s, l) => s + ((l.transport_cost != null && l.qty != null) ? l.transport_cost * l.qty : 0), 0); if (cc) { cardCost += cc; cardRefs++; loadsNoFig += noFig.length; } else loadsNoFigNoCard += noFig.length; });
 [(((DATA.plant_lines || {}).fencing_rows_not_plant) || []), (DATA.unreferenced || [])].forEach(rs => rs.forEach(r => { const tc = r.transport_cost; if (!(tc && (tc.amount != null || tc.internal))) loadsNoFigNoCard++; }));
 const avg = ST.counted_refs ? r2(ST.counted / ST.counted_refs) : null; const avgPart = avg != null ? r2(avg * loadsNoFigNoCard) : null;
 push('Transport (cartage) — carriers’ charges', 'the job', tToDate, r2(cardCost + (avgPart || 0)),
 `to date: ${fmtNum(ST.counted_refs || 0)} loads with a figure on the schedule’s TPORT COST column${ST.plus ? ` (${fmtNum(ST.plus)} marked “and more” — a floor)` : ''}${ST.internal ? ` · ${fmtNum(ST.internal)} Coates-truck loads, no charge` : ''} · to come: the card’s transport cost for ${fmtNum(cardRefs)} reference${cardRefs === 1 ? '' : 's'} still without a figure (${money0(cardCost)})${loadsNoFigNoCard ? ` + ${fmtNum(loadsNoFigNoCard)} load${loadsNoFigNoCard === 1 ? '' : 's'} with no reference or card line at the average so far, ${avg != null ? money0(avg) : '—'} a load (${money0(avgPart || 0)})` : ''}`,
 'real carrier figures replace the card and the average as they land');
 gap(`${fmtNum(loadsNoFig + loadsNoFigNoCard)} loads with no transport figure yet`, 'September deliveries on 28 Sep and every October and November load', 'Andrew — the carriers’ figures on the schedule');
 /* accommodation, meals, expenses */
 const A = k.accommodation || {}; let unpricedNights = 0, unpricedAt = 0; const byP = {};
 try { ourCosts().filter(x => x.kind === 'accommodation' && x.usable).forEach(x => { const g = byP[x.person] = byP[x.person] || {n: 0, sum: 0, un: 0}; if (x.amount != null) { g.n++; g.sum += x.amount; } else g.un++; });
 Object.values(byP).forEach(g => { if (g.un) { unpricedNights += g.un; if (g.n) unpricedAt += g.un * (g.sum / g.n); } }); } catch (e) {}
 push('Accommodation', 'the job', r2(Number(A.amount) || 0), r2(unpricedAt), `known: every priced night on the tracker, ${fmtNum((Number(A.nights) || 0) - (Number(A.unpriced) || 0))} nights (${money0(Number(A.to_date) || 0)} to today, ${money0(Number(A.planned) || 0)} booked ahead) — the P&L’s figure · to come: ${unpricedNights ? `${fmtNum(unpricedNights)} nights with no rate at the person’s own priced rate (${money0(unpricedAt)})` : 'nothing unpriced'}`, unpricedNights ? `${fmtNum(unpricedNights)} nights still need a rate typed (${(A.unpriced_for || []).join(', ')})` : '');
 if (unpricedNights) gap(`${fmtNum(unpricedNights)} accommodation nights with no rate (${(A.unpriced_for || []).join(', ')})`, 'priced here at the person’s own average until typed', 'Andrew — the tracker');
 const meals = Number(k.meals && k.meals.amount) || 0, misc = Number(k.misc && k.misc.amount) || 0;
 push('Meals, expenses and equipment R&M', 'the job', r2(meals + misc), 0, 'to date on the tracker; not forecast (small, as they come)', '');
 /* labour wages: the running sheet at the rates on the record */
 let wToDate = 0, wToCome = 0, unpH = 0, unpToDate = 0; const unpPeople = new Set();
 try { fin745Rows(today).forEach(r => { const cost = r.status === 'confirmed' && r.actualCost != null ? r.actualCost : r.calculatedCost; const past = r.date && r.date <= today; if (cost == null) { unpH += Number(r.paid) || 0; if (past) unpToDate += Number(r.paid) || 0; unpPeople.add(r.person); } else if (past) wToDate += cost; else wToCome += cost; }); } catch (e) {}
 rows.forEach(r => { r.inPl = true; });
 push('Labour — wages (the running sheet)', 'the job', r2(wToDate), r2(wToCome), `the running sheet’s paid hours at the cost rates on the record — Job Connect’s rates; a verified actual where one is recorded`, unpH ? `${fmtNum(unpH)} h with no wage rate (${[...unpPeople].join(', ')}) — not in dollars` : 'all hours priced');
 if (unpH) gap(`${fmtNum(unpH)} labour hours with no wage rate (${[...unpPeople].join(', ')})`, 'the largest cost on the job is hours, not dollars, until a rate is set', 'Andrew — Set cost rate under Month-end control (Finance for the rates)');
 gap('The fence team of six on the event labour scope', 'charged to the V8s in the scope; their cost is not on the record', 'Andrew — who supplies them and at what rate');
 /* equipment on the P&L is inside misc (Equip R&M) - already in the line above */
 const known = r2(rows.filter(r => r.inPl).reduce((s, r) => s + (r.toDate || 0), 0)), toCome = r2(rows.filter(r => r.inPl).reduce((s, r) => s + (r.toCome || 0), 0));
 const wagesKnown = r2(rows.filter(r => !r.inPl).reduce((s, r) => s + (r.toDate || 0), 0)), wagesToCome = r2(rows.filter(r => !r.inPl).reduce((s, r) => s + (r.toCome || 0), 0));
 /* reconciliation: the P&L's known direct costs = toilets + fencing + equipment + other (accommodation priced + meals + misc + transport counted) */
 const plKnown = r2(Number(k.known) || 0);
 const plParts = r2(rq + fenceToDate + tToDate + (Number(A.amount) || 0) + meals + misc);
 /* the card's "to date" for accommodation is nights to today; the P&L counts every priced night (planned too) - the difference is the planned priced nights, shown under to come */
 const revenue = {record: r2(Number(c.total) || 0), fenceToCome: F.revenue, job: r2((Number(c.total) || 0) + F.revenue), noCardRate: F.noCardRate};
 return {asAt: today, rows, gaps, known, toCome, job: r2(known + toCome), plKnown, plParts, revenue, fencing: F, transport: {ourRefs: ourRefs.size, cardRefs, loadsNoFig, loadsNoFigNoCard}, wages: {toDate: r2(wToDate), toCome: r2(wToCome), unpricedHours: r2(unpH), known: wagesKnown, toCome2: wagesToCome, job: r2(wagesKnown + wagesToCome)}};
}
function cj764Card(){
 let X; try { X = cj764Model(); } catch (e) { return `<section id="costs764" class="fin745 cj764"><p class="fin745-eyebrow">COSTS TO JOB END</p><p>Could not be worked out from this record: ${esc(String(e && e.message || e))}</p></section>`; }
 const m = v => v == null ? '<span class="acc761-w">not priced</span>' : v === 0 ? '—' : esc(money0(v)), r2x = n => Math.round(n * 100) / 100;
 const R = X.revenue;
 return `<section id="costs764" class="fin745 cj764 nosfold" aria-labelledby="cj764Title">
 <div class="fin745-heading"><div><p class="fin745-eyebrow">COSTS TO JOB END · AUD EX GST · FORECAST</p><h2 id="cj764Title">What the job will cost, and what it will bring in, carried to the end</h2><p>The Forecast P&amp;L above is the record as it stands: revenue on the contracts, the card and the dockets so far, and the direct costs known. This carries each stream to job end — what is still to come, and on what basis — and names what is not priced yet and who can price it. As at ${esc(fmtDate(X.asAt))}. Revenue and cost are never added together.</p></div></div>
 <div class="fin745-metrics acc761-metrics">
 ${fin745Card('Direct costs known today', money0(X.known), 'the P&L’s figure · toilets approved, fencing docketed, loads with a figure, nights and expenses on the tracker')}
 ${fin745Card('Still to come — forecast', money0(X.toCome), `the fencing programme’s remaining weeks${X.fencing.behind && X.fencing.behind.length ? ` (incl. ${esc(money0(X.fencing.behindCost))} behind the programme — ended weeks with metres still on the plan)` : ''}, the loads without a figure, the nights with no rate yet`)}
 ${fin745Card('Direct costs to job end', money0(X.job), `+ wages priced ${esc(money0(X.wages.job))} (Job Connect) · before ${esc(fmtNum(X.wages.unpricedHours))} h of Coates wages and the items not priced below`)}
 ${fin745Card('Revenue to job end', money0(R.job), `${esc(money0(R.record))} on the record + ${esc(money0(R.fenceToCome))} of fencing still to come at the 2026 card`)}
 </div>
 <p class="fin745-basis">“Known today” is the P&amp;L’s direct costs known (${esc(money0(X.plKnown))}); the streams below add to it, and the streams add to it to the cent; wages sit on their own line, as the P&amp;L keeps them. “Still to come” is a forecast from the record — the 2026 fencing programme’s quantities for the weeks not yet docketed, the card’s transport cost per reference, the tracker’s planned nights, the running sheet’s planned hours — not a quote and not an invoice. Where a rate is missing the line says so and the item is listed under not priced; nothing is assumed to be free.</p>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>Direct costs — to date, to come, to job end</h3><p>What Coates pays. One line per stream; the basis says where each figure comes from.</p></div></div>
 <div class="fin745-table"><table><thead><tr><th>Cost</th><th>Branch</th><th class="num">To date</th><th class="num">Still to come</th><th class="num">Job forecast</th><th>Basis</th></tr></thead><tbody>
 ${X.rows.filter(r => r.inPl).map(r => `<tr><td><b>${esc(r.stream)}</b>${r.note ? `<br><span class="acc761-w">${esc(r.note)}</span>` : ''}</td><td>${esc(r.branch)}</td><td class="num">${m(r.toDate)}</td><td class="num">${m(r.toCome)}</td><td class="num"><b>${m(r.job)}</b></td><td class="acc761-why">${esc(r.basis)}</td></tr>`).join('')}
 <tr class="acc761-tot"><td colspan="2">Direct costs <span class="acc761-w">· the P&amp;L’s eight categories</span></td><td class="num"><b>${m(X.known)}</b></td><td class="num"><b>${m(X.toCome)}</b></td><td class="num"><b>${m(X.job)}</b></td><td class="acc761-w">known today = the P&amp;L’s direct costs known, to the cent</td></tr>
 ${X.rows.filter(r => !r.inPl).map(r => `<tr class="cj764-wages"><td><b>${esc(r.stream)}</b>${r.note ? `<br><span class="acc761-w">${esc(r.note)}</span>` : ''}</td><td>${esc(r.branch)}</td><td class="num">${m(r.toDate)}</td><td class="num">${m(r.toCome)}</td><td class="num"><b>${m(r.job)}</b></td><td class="acc761-why">${esc(r.basis)} · wages are reviewed under Month-end control and are not in the P&amp;L’s direct costs known</td></tr>`).join('')}
 <tr class="acc761-tot acc761-grand"><td colspan="2">Direct costs and the wages priced</td><td class="num"><b>${m(r2x(X.known + X.wages.known))}</b></td><td class="num"><b>${m(r2x(X.toCome + X.wages.toCome2))}</b></td><td class="num"><b>${m(r2x(X.job + X.wages.job))}</b></td><td class="acc761-w">before ${esc(fmtNum(X.wages.unpricedHours))} h of Coates wages with no rate, and the items below</td></tr>
 </tbody></table></div></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>Fencing — the programme carried to job end</h3><p>The dockets are the truth for the weeks done; the 2026 fencing programme’s quantities are the forecast for the weeks still to come, at Advanced’s rates (cost) and the 2026 card (revenue). Removal and V gates are inside the card’s metre; the deconstruction weeks still carry 2025 dates and are not forecast.</p></div></div>
 <div class="fin745-table"><table><thead><tr><th>Week</th><th>State</th><th class="num">Cost at Advanced’s rates</th><th class="num">Revenue at the 2026 card</th><th>Quantities still to come</th></tr></thead><tbody>
 ${X.fencing.weeks.length ? X.fencing.weeks.map(w => `<tr><td><b>${esc(w.prog || w.week)}</b><br><span class="acc761-w">${esc(w.start ? fmtDate(w.start) : '')}${w.end ? ' to ' + esc(fmtDate(w.end)) : ''}</span></td><td>${esc(w.state)}</td><td class="num">${m(w.cost)}</td><td class="num">${m(w.revenue)}</td><td class="acc761-why">${esc(w.lines.map(l => `${l.name.replace(/^Temporary Fence \(m\) — |^Crowd Control Barriers \(m\) — /, '')} ${fmtNum(l.q)}${l.unit === 'm' ? ' m' : ''}${l.cost == null ? ' (cost by the hour or no rate)' : ''}`).join(' · '))}</td></tr>`).join('') : '<tr><td colspan="5">Every programme week is docketed.</td></tr>'}
 <tr class="acc761-tot"><td colspan="2">Fencing still to come</td><td class="num"><b>${m(X.fencing.cost)}</b></td><td class="num"><b>${m(X.fencing.revenue)}</b></td><td class="acc761-w">${Object.keys(X.fencing.hourly).length ? 'relocation by the hour: ' + Object.entries(X.fencing.hourly).map(([n, q]) => fmtNum(q) + ' m').join(', ') + ' · ' : ''}${Object.keys(X.fencing.noCostRate).length ? 'no rate: ' + Object.entries(X.fencing.noCostRate).map(([n, q]) => `${n.replace(/^Temporary Fence \(m\) — |^Crowd Control Barriers \(m\) — /, '')} ${fmtNum(q)}`).join(', ') : ''}</td></tr>
 </tbody></table></div></div>
 <div class="fin745-block cj764-gaps"><div class="fin745-blockhead"><div><h3>Not priced yet — and who can price it</h3><p>Each of these is a hole in the forecast. None is assumed to be nothing.</p></div></div>
 <div class="fin745-table"><table><thead><tr><th>What</th><th>Why it matters</th><th>Who</th></tr></thead><tbody>${X.gaps.map(g => `<tr><td><b>${esc(g.what)}</b></td><td class="acc761-why">${esc(g.why)}</td><td>${esc(g.owner)}</td></tr>`).join('')}</tbody></table></div></div>
 <p class="fin745-basis acc761-foot">Author: Andrew Fisher · Costs to job end v7.64 · read from the record; the P&amp;L’s own figures are unchanged by this card.</p>
 </section>`;
}
"""
i = t.find('function fin745Bind(){')
t = t[:i] + HELPERS.lstrip('\n') + t[i:]
t = rep(t, "${pl752Card()}\n ${fin745Html()}", "${pl752Card()}\n ${cj764Card()}\n ${fin745Html()}", 'costs pane mount', p, True)
t = rep(t, ".acc761-foot{margin-top:14px}", ".acc761-foot{margin-top:14px}.cj764 .fin745-eyebrow{color:#2b4a8a}.cj764{border-top-color:#2b4a8a}.cj764-gaps{border-left:4px solid #9c470c}", 'card style', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
