"""Author: Andrew Fisher. v11.59 - the forecast on the project manager's rulings of 23 Oct 2026.

Andrew, 23 Oct 2026: "Wages and salary we will only track hrs no hrly rate. Event portaloos we do what we know. Damage waiver
etc we dont worry about unless I tell you different when they invoice. Fix the timeline. You should know this: Alfie's 20
accommodation nights, Kyle Gover's 3 shifts without hours. No sheet for week 6: amount and dockets should be what it is. Make
it work."

What this patch does to the page (the record changes - Kyle's shifts, the week 5 sheet - went through the page's own
functions beforehand, see the record folders):
  1. Coates wages and salary are hours, not dollars: the Costs to job end model counts them as hours only (no "unpriced",
     no gap, no "set a rate"); the hired-in people stay priced at the rates on the record; every card says it that way.
  2. The gaps that are not gaps go: the card's POA work charges, CW1's prior allowances, the ended-week programme
     quantities, Event Portables' invoice/PO documents, Alfie's nights (priced at his own average, said on the line),
     the base salary cost. The fencing demob gap stays, reworded (Advanced bills relocation and removal by the hour).
  3. The damage waiver is $0 on the P&L unless the project manager says otherwise when they invoice.
  4. The fencing forecast carries only the weeks still to come: an ended week is done (the dockets and the invoice are the
     truth); its leftover programme quantities are no longer carried forward.
  5. The Timeline tie-out counts each reference's own loads, the basis the Transport side already counts on; a supplier's
     delivery of its own gear (Event Portables' receipts) is on neither side.
  6. A receipted fencing order stands at its amount: 4647508 (week 6, no sheet) at $8,992 with its 6 dockets as recorded;
     4647509 (week 5, sheet 50 cents over) at $33,670. The difference against the sheet rates is carried on Rehire and said
     on every card; the Purchase orders card gains the "receipted - the order stands" state.
  7. Footer v11.58 -> v11.59. forecast1159.js holds the order rule, the wrappers and the Questions settled.

    python3 patch_v1159.py page.html      (in place, on the live v11.58 page)
"""
import hashlib, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
RULE = 'the project manager, 23 Oct 2026'


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.59 requires the live page ' + BASE_SHA256)
    cur = re.search(r"\+' · v11\.(\d+)'; /\* v8\.19 release922", text)
    if not cur: raise ValueError('v11.59: the footer is not where v8.19 put it')
    text = rep(text, cur.group(0), "+' · v11.59'; /* v8.19 release922", 'release footer', 'page')
    R = lambda old, new, what: rep(text, old, new, what, 'page')

    # 4. the fencing forecast: an ended week is done
    text = R(""" /* a week whose end has passed is not dropped: the dockets are the truth for what was DONE, and whatever the plan still
 carries undocketed is still to do - carried forward and named "behind", never silently lost (Codex's review, 1 Oct) */""",
             """ /* v11.59 - a week whose end has passed is done: the dockets are the truth for what was done and the invoice for what it cost;
 the programme's leftover quantities are not carried forward (the project manager, 23 Oct 2026: "we charge for the works we do, we
 can't charge for things that have not been done") */""", 'cj764Fencing comment')
    text = R("""if (past && !row.lines.length) return; /* a past week with nothing left on the plan: done; the dockets are the truth */""",
             """if (past) return; /* v11.59 - an ended week is done: nothing left of it to forecast */""", 'cj764Fencing past rule')

    # 1. wages: Coates wages and salary in hours only; the hired-in people priced at the rates on the record
    text = R(""" let wToDate = 0, wToCome = 0, unpH = 0, unpToDate = 0; const unpPeople = new Set();
 try { fin745Rows(today).forEach(r => { const cost = r.status === 'confirmed' && r.actualCost != null ? r.actualCost : r.calculatedCost;const past = r.date && r.date <= today && r.status !== 'forecast'; if (cost == null) { unpH += Number(r.paid) || 0; if (past) unpToDate += Number(r.paid) || 0; unpPeople.add(r.person); } else if (past) wToDate += cost; else wToCome += cost; }); } catch (e) {}
 rows.forEach(r => { r.inPl = true; });
 push('Labour — wages (the running sheet)', 'the job', r2(wToDate), r2(wToCome), `the running sheet’s paid hours at the cost rates on the record — Job Connect’s rates; a verified actual where one is recorded`, unpH ? `${fmtNum(unpH)} h with no wage rate (${[...unpPeople].join(', ')}) — not in dollars` : 'all hours priced');
 if (unpH) gap(`${fmtNum(unpH)} labour hours with no wage rate (${[...unpPeople].join(', ')})`, 'the largest cost on the job is hours, not dollars, until a rate is set', 'Andrew — Set cost rate under Month-end control (Finance for the rates)');
if(labourAllowance858())gap('Coates salary — base salary cost', 'The salary allowance forecast does not include base salary or employer on-costs; Finance confirmation remains required.', 'Finance — aggregate salary cost');""",
             """ let wToDate = 0, wToCome = 0, unpH = 0, unpToDate = 0, hrsOnly = 0, hrsOnlyToDate = 0; const unpPeople = new Set(), hrsPeople = new Set(), hrsByType = {cna: 0, salary: 0};
 /* v11.59 - Coates wages and salary are tracked in hours only, no hourly rate on anyone (the project manager, 23 Oct 2026); the hired-in people are priced at the rates on the record */
 try { fin745Rows(today).forEach(r => { const past = r.date && r.date <= today && r.status !== 'forecast', paid = Number(r.paid) || 0; if (r.type === 'cna' || r.type === 'salary') { hrsOnly += paid; if (past) hrsOnlyToDate += paid; hrsPeople.add(r.person); hrsByType[r.type] += paid; return; } const cost = r.status === 'confirmed' && r.actualCost != null ? r.actualCost : r.calculatedCost; if (cost == null) { unpH += paid; if (past) unpToDate += paid; unpPeople.add(r.person); } else if (past) wToDate += cost; else wToCome += cost; }); } catch (e) {}
 rows.forEach(r => { r.inPl = true; });
 push('Labour hire — the running sheet', 'the job', r2(wToDate), r2(wToCome), `the running sheet’s paid hours for the hired-in people at the rates on the record — Job Connect’s people and the race crew; a verified actual where one is recorded`, `Coates wages and salary: ${fmtNum(r2(hrsOnly))} h on the running sheet (${[...hrsPeople].join(', ')}) tracked in hours only — no hourly rate goes on anyone (the project manager, 23 Oct 2026)${unpH ? ` · ${fmtNum(unpH)} h of hired-in labour with no rate (${[...unpPeople].join(', ')}) — not in dollars` : ''}`);
 if (unpH) gap(`${fmtNum(unpH)} hired-in labour hours with no rate (${[...unpPeople].join(', ')})`, 'hired-in labour is a supplier cost; the rate is on the invoice or the quote', 'Andrew — Set cost rate under Month-end control');""", 'wages block')
    text = R("""wages: {toDate: r2(wToDate), toCome: r2(wToCome + labourAllowance858()), unpricedHours: r2(unpH), known: wagesKnown,""",
             """wages: {toDate: r2(wToDate), toCome: r2(wToCome + labourAllowance858()), unpricedHours: r2(unpH), hoursOnly: r2(hrsOnly), hoursOnlyToDate: r2(hrsOnlyToDate), hoursOnlyPeople: [...hrsPeople], hoursByType: {cna: r2(hrsByType.cna), salary: r2(hrsByType.salary)}, hoursOnly1159: true, known: wagesKnown,""", 'wages model fields')

    # 2. the gaps that are not gaps
    text = R("""workPricing1007().forEach(r=>gap(r.ref+" · "+r.item+" · work charges",r.why,r.branch));""",
             """/* v11.59 - the card's POA work charges (Armorzone TL2 labour, WC100, T0258) are not forecast gaps: not charged unless the project manager says otherwise when they invoice (23 Oct 2026) */""", 'work-charge gaps')
    text = R("""if (DATA.fencing.source_review954) gap('CW1 fencing: prior task allowances awaiting review', cw1ForecastText954(), 'Andrew — confirm the current scope with John Brett / Advanced');""",
             """/* v11.59 - CW1's prior task allowances are not a forecast gap: the week is docketed and its sheet matched to the cent; nothing is charged for work not done (the project manager, 23 Oct 2026) */""", 'CW1 gap')
    text = R("""if (F.behind && F.behind.length) gap(`Fencing programme/docket differences: ${F.behind.join(', ')} — programme quantities not yet docketed (${money0(F.behindCost)} at Advanced’s rates, ${money0(F.behindRevenue)} at the card)`, 'retained in forecast pending docket matching and scope review; this is not a crew-delay finding', 'Andrew — Advanced’s programme manager');""",
             """/* v11.59 - ended weeks are done; their programme quantities are not carried (cj764Fencing) */""", 'programme/docket gap')
    text = R("""if (Object.keys(F.hourly).length || Object.keys(F.noCostRate).length) gap('Fencing still to come: relocation hours, hoarding, flat feet, WPF and removal', 'Advanced’s sheet has no per-metre rate for them; the programme has the quantities', 'Andrew — a rate or an hours estimate from Advanced');""",
             """if (Object.keys(F.hourly).length || Object.keys(F.noCostRate).length) gap('Fencing still to come — relocation and removal by the hour', 'Advanced bills relocation and removal by the hour, not by the metre: the programme has the metres, the dockets will have the hours as the event week and the demob are done', 'Advanced’s dockets as the work is done — nothing to type');""", 'fencing to-come gap')
    text = R("""gap('Event Portables — invoice and PO documents', epCostStatus1094Model().label+'. '+transport953QuoteWords()+'; reconcile invoice and PO coverage against delivered quantities. This is a documentary check, separate from the recorded supplier rates and cost estimates.', 'Andrew — Event Portables');""",
             """/* v11.59 - Event Portables at the approved quotes and the site count is what we know (the project manager, 23 Oct 2026); the invoice and PO documents are Finance's receipt, not a forecast gap */""", 'Event Portables gap')
    text = R("""if (unpricedNights) gap(`${fmtNum(unpricedNights)} accommodation nights with no rate (${(A.unpriced_for || []).join(', ')})`, 'priced here at the person’s own average until typed', 'Andrew — the tracker');""",
             """/* v11.59 - nights without a typed rate are forecast at the person's own average, said on the Accommodation line; not a gap (the project manager, 23 Oct 2026) */""", 'nights gap')
    text = R("""unpricedNights ? `${fmtNum(unpricedNights)} nights still need a rate typed (${(A.unpriced_for || []).join(', ')})` : ''""",
             """unpricedNights ? `${(A.unpriced_for || []).join(', ')}: ${fmtNum(unpricedNights)} nights at the person’s own average, ${money(unpricedAt / unpricedNights)} a night, until the invoice comes (the project manager, 23 Oct 2026)` : ''""", 'accommodation note')
    # 6. the fencing row says how the receipted orders are counted
    text = R("""dockets at Advanced’s own sheet${SP.green ? ' + the green book ' + money0(SP.green) : ''} · to come:""",
             """dockets at Advanced’s own sheet${SP.green ? ' + the green book ' + money0(SP.green) : ''}${fenceOrdersWords1159(' · ')} · to come:""", 'fencing row basis')

    # 5. the Timeline tie-out on each reference's own loads
    text = R("""let tlRefs = null; try { const s = new Set(); programmeDays().forEach(d => d.deliveries.concat(d.removals).forEach(r => { if ((r.events || []).some(e => fact(e) || e.bookingMoved801)) s.add(r.a.key); })); tlRefs = s.size; } catch (e) { tlRefs = null; }
 tie('Operational', 'References with a load on the Timeline’s days — Timeline and Transport', [part('Timeline', tlRefs), part('Transport', new Set(T.rows.filter(r => r.src === 'asset' && !r.off && r.date).map(r => r.key)).size)]);""",
             """let tlRefs = null; try { const s = new Set(); programmeDays().forEach(d => d.deliveries.concat(d.removals).forEach(r => { if (((r.a || {}).events || []).some(e => fact(e) || e.bookingMoved801)) s.add(r.a.key); })); tlRefs = s.size; } catch (e) { tlRefs = null; } /* v11.59 - each reference's own loads, the basis the Transport side counts on; a supplier delivering its own gear (Event Portables' toilets) is a receipt on the Timeline, not a load, so it is on neither side */
 tie('Operational', 'References with a load on the Timeline’s days — Timeline and Transport (each reference’s own loads; a supplier’s delivery of its own gear is on neither side)', [part('Timeline', tlRefs), part('Transport', new Set(T.rows.filter(r => r.src === 'asset' && !r.off && r.date).map(r => r.key)).size)]);""", 'Timeline tie-out')

    # 3. the damage waiver; Event Portables as known; the Rehire basis names the receipted orders
    text = R("""rev.push({key: 'waiver', code: '1015', line: 'Damage Waiver', what: 'on the hire only — never on labour, steps, cleaning, install, demob or pump-outs (the card’s rule)', now: null, job: null, optional: true, basis: 'No automatic damage waiver is applied. An agreed charge requires an explicit entry.'});""",
             """rev.push({key: 'waiver', code: '1015', line: 'Damage Waiver', what: 'not charged — unless the project manager says otherwise when they invoice (23 Oct 2026)', now: 0, job: 0, optional: true, basis: 'Not charged on this job unless the project manager says otherwise when the V8s are invoiced (23 Oct 2026). The card’s rule stands if it ever is: on the hire only — never on labour, steps, cleaning, install, demob or pump-outs.'});""", 'damage waiver line')
    text = R("""missing: 'Job-end Rehire includes calculated supplier estimates from the linked contract quantity and charge basis; these are not invoices. '+Supplier955.words()+' Other unpriced hired-in equipment remains unconfirmed.'""",
             """missing: 'Event Portables are carried at the approved quotes and the site count — what we know (the project manager, 23 Oct 2026). Job-end Rehire also includes calculated supplier estimates from the linked contract quantity and charge basis; these are not invoices. '+Supplier955.words()+' Other unpriced hired-in equipment remains unconfirmed.'""", 'Rehire missing words')
    text = R("""; the other dockets await their invoice, counted at the sheet rates)' : '')(supplierPricing1014().orders.filter(x => x.valid && x.difference === 0)))""",
             """; the other dockets await their invoice, counted at the sheet rates)' : '')(supplierPricing1014().orders.filter(x => x.valid && x.difference === 0))) + fenceOrdersWords1159(' · ')""", 'Rehire basis orders')
    text = R("""to pay Advanced’s crew — our own people’s install hours carry no wage rate (${fmtNum(n(W.unpricedHours))} h) and the fencing install sits inside the fence rate""",
             """to pay Advanced’s crew — our own people’s install hours are tracked in hours only (${fmtNum(n(W.hoursOnly || 0))} h), not priced, and the fencing install sits inside the fence rate""", 'Installation Recovery words')
    text = R("""the running sheet at the rates on the record — Job Connect’s people, Temporary Staff on the P&amp;L · ${esc(fmtNum(P.wages.unpricedHours || 0))} h of Coates people with no wage rate: Direct Staff (3210), or Installation — internal labour (2143) if charged to the install""",
             """the running sheet at the rates on the record — the hired-in people, Temporary Staff on the P&amp;L · Coates wages and salary ${esc(fmtNum(P.wages.hoursOnly || 0))} h tracked in hours only, no hourly rate (the project manager, 23 Oct 2026) — Direct Staff (3210) is Finance’s to post""", 'P&L wages row')
    text = R("""`+ wages priced ${esc(money(W.job))}: Job Connect ${esc(money(r2(W.job - (W.allowanceForecast || 0))))}${W.allowanceForecast ? ' + salary allowance forecast ' + esc(money(W.allowanceForecast)) : ''}${W.unpricedHours ? ` · ${esc(fmtNum(W.unpricedHours))} h of Coates wages not priced` : ''}`""",
             """`+ wages priced ${esc(money(W.job))}: labour hire ${esc(money(r2(W.job - (W.allowanceForecast || 0))))}${W.allowanceForecast ? ' + salary allowance forecast ' + esc(money(W.allowanceForecast)) : ''} · Coates wages and salary ${esc(fmtNum(W.hoursOnly || 0))} h, hours only — no hourly rate`""", 'At a glance wages tile')
    text = R("""`+ wages priced ${esc(money0(X.wages.job))}(priced labour and salary allowance forecast) · before ${esc(fmtNum(X.wages.unpricedHours))} h of Coates wages and the items not priced below`""",
             """`+ wages priced ${esc(money0(X.wages.job))} (labour hire and the salary allowance forecast) · Coates wages and salary ${esc(fmtNum(X.wages.hoursOnly || 0))} h, hours only · before the items not priced below`""", 'Costs to job end tile')
    text = R("""before ${esc(fmtNum(X.wages.unpricedHours))} h of Coates wages with no rate, and the items below""",
             """Coates wages and salary ${esc(fmtNum(X.wages.hoursOnly || 0))} h are hours only, not priced (the project manager, 23 Oct 2026) · before the items below""", 'Costs to job end grand row')

    # Labour - the whole job
    text = R("""const cost = costOf(r); if (cost == null) { o.unpriced += paid; o.noRate.add(r.person); } else {""",
             """const cost = costOf(r); if (r.type === 'cna' || r.type === 'salary' || cost == null) { o.unpriced += paid; o.noRate.add(r.person); } else {""", 'labour865 aggregate')
    text = R("""`${money(costNow)} to date · Job Connect ${money(ALL.priced)} + salary allowance ${money(allow)} · ${fmtNum(ALL.unpriced)} h of Coates wages still have no pay rate, so this will rise`""",
             """`${money(costNow)} to date · labour hire ${money(ALL.priced)} + salary allowance ${money(allow)} · Coates wages and salary ${fmtNum(ALL.unpriced)} h, hours only — not priced (the project manager, 23 Oct 2026)`""", 'labour865 cost tile')
    text = R("""`to job end · not a margin and not a profit until the ${fmtNum(ALL.unpriced)} unpriced hours are priced`""",
             """`to job end · not a margin and not a profit — Coates wages and salary (${fmtNum(ALL.unpriced)} h) are hours only, never priced here`""", 'labour865 difference tile')
    text = R("""The running sheet’s paid hours at the pay rates on the record. A Coates wages person with no rate yet is hours, not dollars — the biggest cost on the job stays as hours until the rates are set.""",
             """The running sheet’s paid hours: the hired-in people at the rates on the record; Coates wages and salary in hours only — no hourly rate goes on anyone (the project manager, 23 Oct 2026).""", 'labour865 block words')
    text = R("""priced ${h(R.pricedHours)} · <b>${h(R.unpriced)} with no pay rate yet</b>""", """hired-in ${h(R.pricedHours)} priced · Coates ${h(R.unpriced)} hours only""", 'labour865 race row')
    text = R("""priced ${h(O.pricedHours)} · <b>${h(O.unpriced)} with no pay rate yet</b>""", """hired-in ${h(O.pricedHours)} priced · Coates ${h(O.unpriced)} hours only""", 'labour865 build row')
    text = R("""`what the P&amp;L calls wages priced · <b>${h(ALL.unpriced)} of Coates wages still have no rate</b>${ALL.noRate.size ? ' (' + esc([...ALL.noRate].join(', ')) + ')' : ''}`""",
             """`what the P&amp;L calls wages priced · Coates wages and salary ${h(ALL.unpriced)} in hours only${ALL.noRate.size ? ' (' + esc([...ALL.noRate].join(', ')) + ')' : ''}`""", 'labour865 grand row')
    text = R("""— before ${h(ALL.unpriced)} of Coates wages are priced; not a margin and not a profit. Set the pay rates under Month-end control and this line moves at once.</p>""",
             """— Coates wages and salary (${h(ALL.unpriced)}) are tracked in hours only and never priced here (the project manager, 23 Oct 2026); not a margin and not a profit.</p>""", 'labour865 foot')

    # the Forecast P&L's wages note and Month-end control
    text = R("""function labourNote753(asOf){
 const s = fin745Summary(null, asOf), priced = s.rows.length - s.unpricedCount;
 if (!s.rows.length) return 'wages — no usable running-sheet shifts for an actual or forecast cost review';
 const pricedWords = priced ? `${priced} of ${s.rows.length} shifts priced; ${money(s.expectedCost)} ${s.complete ? 'labour outlook' : 'partial labour outlook'}` : 'no shifts priced yet';
 return `wages — ${pricedWords}; ${fmtNum(s.unpricedHours)} hours of Coates wages still unpriced. The “Actuals, forecast & Finance journals” section keeps verified costs, past estimates and forecasts apart; none of these wages are added to this P&L`;
}""",
             """function labourNote753(asOf){
 const s = fin745Summary(null, asOf), hired = s.rows.length - (s.hoursOnlyCount || 0);
 if (!s.rows.length) return 'wages — no usable running-sheet shifts for an actual or forecast cost review';
 const hiredWords = hired ? `${fmtNum(hired)} hired-in shift${hired === 1 ? '' : 's'} at the rates on the record, ${money(s.expectedCost)}${s.unpricedCount ? ` (${fmtNum(s.unpricedHours)} h with no rate)` : ''}` : 'no hired-in shifts';
 return `wages — ${hiredWords}; Coates wages and salary ${fmtNum(s.hoursOnly || 0)} h tracked in hours only, no hourly rate (the project manager, 23 Oct 2026). The “Actuals, forecast & Finance journals” section keeps verified costs, past estimates and forecasts apart; none of these wages are added to this P&L`;
}""", 'labourNote753')
    text = R("""(job.complete && !orphans.length ? 'All current hours priced' :'PARTIAL — ' + (job.missingHoursCount ? job.missingHoursCount + ' labour records missing hours' : '') + (job.missingHoursCount && job.unpricedHours ? ' · ' : '') + (job.unpricedHours ? fin745Hours(job.unpricedHours) + ' paid/allocation hours unpriced' : '')) + '; includes unresolved past estimates'""",
             """(job.complete && !orphans.length ? 'Hired-in labour priced · Coates wages and salary ' + fin745Hours(job.hoursOnly || 0) + ' in hours only' : 'PARTIAL — ' + [job.missingHoursCount ? job.missingHoursCount + ' labour records missing hours' : '', job.unpricedHours ? fin745Hours(job.unpricedHours) + ' hired-in hours with no rate' : '', orphans.length ? orphans.length + ' prior confirmation' + (orphans.length === 1 ? '' : 's') + ' with no source shift' : '', 'Coates wages and salary ' + fin745Hours(job.hoursOnly || 0) + ' in hours only'].filter(Boolean).join(' · ')) + '; includes unresolved past estimates'""", 'Month-end control outlook card')
    # month-end accruals: the Coates allocations are hours only
    text = R("""+ g.calculatedCost + ' calculated estimate; ' + g.unpricedHours + ' hours unpriced', {status,""",
             """+ g.calculatedCost + ' calculated estimate' + (g.unpricedHours ? '; ' + g.unpricedHours + (type === 'hire' ? ' hours unpriced' : ' hours in hours only — Coates wages and salary are not priced (the project manager, 23 Oct 2026)') : ''), {status,""", 'accruals labour words')
    text = R("""${r.unpriced ? esc(fin745Hours(r.unpriced)) + ' with no wage rate' : 'all priced'}""",
             """${r.unpriced ? esc(fin745Hours(r.unpriced)) + ' in hours only (Coates wages and salary)' : 'all priced'}""", 'accruals month row words')
    text = R("""${L.all.unpriced ? esc(fin745Hours(L.all.unpriced)) + ' with no wage rate — PARTIAL' : 'all priced'}""",
             """${L.all.unpriced ? esc(fin745Hours(L.all.unpriced)) + ' in hours only (Coates wages and salary) — not priced, by the project manager’s rule (23 Oct 2026)' : 'all priced'}""", 'accruals whole-job words')
    text = R("""${fmtNum(L.all.unpriced)} h with no wage rate — PARTIAL`);""", """${fmtNum(L.all.unpriced)} h in hours only (Coates wages and salary)`);""", 'accruals text export')
    text = R("""'Priced cost AUD', 'Hours with no wage rate']);""", """'Priced cost AUD', 'Hours in hours only (Coates wages and salary)']);""", 'accruals csv header')
    text = R("""fin745Hours(sum.forecastHours) + ' future work; ' + futureUnknown + ' shifts unpriced')}""",
             """fin745Hours(sum.forecastHours) + ' future work; ' + futureUnknown + ' shift' + (futureUnknown === 1 ? '' : 's') + ' in hours only, no dollars')}""", 'Month-end control future card')
    text = R("""to job end adds the nights with no rate yet, at the average of that person’s priced nights""",
             """to job end adds the nights without a typed rate, at the average of that person’s priced nights (the project manager, 23 Oct 2026)""", 'P&L overheads row words')
    text = R("""${unpricedNights ? `${fmtNum(unpricedNights)} nights with no rate at the person’s own priced rate (${money0(unpricedAt)})` : 'nothing unpriced'}""",
             """${unpricedNights ? `${fmtNum(unpricedNights)} nights without a typed rate at the person’s own average (${money0(unpricedAt)})` : 'every night typed'}""", 'accommodation basis words')
    text = R("""the loads without a figure, the nights with no rate yet`)}""", """the loads without a figure, the nights without a typed rate at the person’s own average`)}""", 'still-to-come tile words')
    text = R("""'Finance to check payroll cost and allocation to Labour Install. A missing rate is unknown cost, not zero; do not repeat an existing allocation""",
             """'Coates wages and salary are tracked in hours only here (the project manager, 23 Oct 2026); payroll cost and any allocation to Labour Install are Finance’s. Do not repeat an existing allocation""", 'accruals Coates words')
    text = R("""${g.unpricedHours ? ` · ${fmtNum(g.unpricedHours)} h with no rate` : ''}""",
             """${g.unpricedHours ? ` · ${fmtNum(g.unpricedHours)} h ${/Labour hire/.test(r.stream) ? 'with no rate' : 'in hours only, not priced'}` : ''}""", 'accruals rule words')
    # the event crew card
    text = R("""${r.unpricedHours ? `<br><span class="w">${h(r.unpricedHours)} h unpriced</span>` : ''}""",
             """${r.unpricedHours ? `<br><span class="w">${h(r.unpricedHours)} h in hours only</span>` : ''}""", 'event crew person words')
    text = R("""${h(m.unpricedHours)} hours without a calculated pay cost""", """${h(m.unpricedHours)} h of Coates wages in hours only — no hourly rate (the project manager, 23 Oct 2026)""", 'event crew summary words')
    text = R("""${m.unpricedHours} hours unpriced${m.unresolvedShifts""", """${m.unpricedHours} h of Coates wages in hours only${m.unresolvedShifts""", 'event crew fold words')
    text = R("""Edit people, pay rates and shifts there. Unknown wages and supplier prices remain unpriced.""",
             """Edit people, shifts and the hired-in rates there. Coates wages and salary are tracked in hours only.""", 'event crew sub words')

    # the Whole-job operational forecast table
    text = R("""    {label: 'Direct Staff · priced wages', recorded: P.wages.toDate, job: P.wages.job},""",
             """    {label: 'Labour hire and salary allowance · priced wages', recorded: P.wages.toDate, job: P.wages.job},
    {label: 'Coates wages and salary · hours only', text: fmtNum(P.wages.hoursOnly || 0) + ' h on the running sheet — tracked in hours, not priced (the project manager, 23 Oct 2026)'},""", 'forecast table wages rows')
    text = R("""rows.map(row => row.section ? '<tr><th colspan="4">' + esc(row.section) + '</th></tr>' :""",
             """rows.map(row => row.section ? '<tr><th colspan="4">' + esc(row.section) + '</th></tr>' : row.text ? '<tr data-pnl981-text><td>' + esc(row.label) + '</td><td colspan="3" class="acc761-w">' + esc(row.text) + '</td></tr>' :""", 'forecast table text row')
    text = R("""rows.map(row => row.section ? '<h3>' + esc(row.section) + '</h3>' :""",
             """rows.map(row => row.section ? '<h3>' + esc(row.section) + '</h3>' : row.text ? '<article class="card" style="min-width:0;margin:8px 0;padding:12px" data-pnl981-text><b>' + esc(row.label) + '</b><p class="acc761-w" style="margin:6px 0 0">' + esc(row.text) + '</p></article>' :""", 'forecast table text card')
    text = R("""'<dt>Direct Staff</dt><dd>Priced wages and salary allowance. Any journal to Installation remains a Finance allocation.</dd>'""",
             """'<dt>Labour hire and salary allowance</dt><dd>The hired-in people at the rates on the record and the typed salary allowance forecast. Coates wages and salary are tracked in hours only, no hourly rate (the project manager, 23 Oct 2026); Direct Staff and any journal to Installation remain Finance allocations.</dd>'""", 'forecast glossary wages')
    text = R("""'<dt>Difference so far</dt><dd>Revenue less all priced costs, including overheads and priced wages.</dd>'""",
             """'<dt>Difference so far</dt><dd>Revenue less all priced costs, including overheads and the wages priced (labour hire and the salary allowance); Coates wages and salary are hours, not dollars.</dd>'""", 'forecast glossary difference')

    # the Purchase orders card and the P&L categories: receipted orders stand
    text = R("""matched to the cent · ${invoiceCounts1158(pos).awaiting} not matched yet</span>""",
             """matched to the cent · ${invoiceCounts1158(pos).awaiting} not matched yet${invoiceCounts1158(pos).receipted ? ' · ' + invoiceCounts1158(pos).receipted + ' receipted — the order stands' : ''}</span>""", 'Purchase orders header')
    text = R("""Not matched means the invoice is not here yet, nothing more (the project manager, 23 Oct 2026).The order's own value""",
             """Not matched means the invoice is not here yet, nothing more (the project manager, 23 Oct 2026). A receipted order stands at its amount: with no sheet, the dockets are what they are and the receipt is the cost; with a sheet a few cents off, the receipted amount is the cost (the project manager, 23 Oct 2026). The order's own value""", 'Purchase orders note')
    text = R("""'Rehire and Installation — external contractors together, not split'}${cj764RelocNote()}`);""",
             """'Rehire and Installation — external contractors together, not split'}${cj764RelocNote()}${fenceOrdersWords1159(' · ')}`);""", 'categories fencing words')

    block = (HERE / 'forecast1159.js').read_text(encoding='utf-8').strip()
    text = rep(text, '<script id="steady1143-script">', '<script id="forecast1159-script">\n' + block + '\n</script>\n<script id="steady1143-script">', 'forecast block before steady1143', 'page')
    for needle, n in [("+' · v11.59'; /* v8.19 release922", 1), ('id="forecast1159-script"', 1), ('W.fenceOrders1159 = orders1159', 1), ("fenceOrdersWords1159(' · ')", 3), ('hoursOnly1159: true', 2),
                      ('h of Coates wages with no rate', 0), ('with no pay rate yet', 0), ('labour hours with no wage rate', 0), ('Coates salary — base salary cost', 0), ('Event Portables — invoice and PO documents', 0),
                      ('accommodation nights with no rate', 0), ('CW1 fencing: prior task allowances awaiting review', 0), ('Fencing programme/docket differences', 0), ('" · work charges"', 0), ('if (past) return;', 1),
                      ('No automatic damage waiver is applied', 0), ('receipted — the order stands', 1), ('each reference’s own loads', 1), ("row.text ?", 2), ('Direct Staff · priced wages', 0)]:
        if text.count(needle) != n: raise ValueError('v11.59 did not land cleanly: ' + needle + ' x' + str(text.count(needle)))
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1159 applied: the forecast on the six rulings of 23 Oct; footer v11.58 -> v11.59')
