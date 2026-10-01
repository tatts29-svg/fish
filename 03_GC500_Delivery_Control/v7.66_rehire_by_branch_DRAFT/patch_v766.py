#!/usr/bin/env python3
"""v7.66 - Rehire by branch. Andrew, 1 Oct 2026: "ensure we know what's sub-hired, or a rough idea what branches have
sub-hire and the value and forecast - we want a forecast for the business, using correct terminology with what we do";
"sub-hired by branch is, example, the Event Portables portaloos are sub-hired from KINP; forklifts from NVAC, they are
sub-hired". Apply after v7.60 to v7.65.

  THE CARD. "Rehire by branch" sits under Costs to job end. One group per rehire on each branch: what it is, who supplies
     it, how many lines and units, Rehire Revenue (what we charge the V8s at our rates - on the record, still to come,
     to job end), Rehire cost (what we pay the supplier - on the record, still to come, to job end), the basis, and what
     is not on the record. Groups: KINP - the Event Portables toilets (every toilet line, split between MISCITEM and
     Coates plant numbers, with the servicing at the card and the four approved quotes as Rehire cost); KINP - the
     sub-hired refrigerated container (SUB-2131, supplier ROY002); NVAC - the forklifts, which Andrew says are sub-hired
     (every forklift line on the NVAC contract, the two on MISCITEM by the record's own rule and the six carrying Coates
     plant numbers on his word, to be confirmed one by one); MEAD - the sub-hired forklift extension (SUB-2527, QUE011);
     STPS - Advanced Temporary Fencing (the dockets at the card so far and the programme to come; their gear and their
     crew at their own sheet). A total line for the business: Rehire Revenue and Rehire cost to job end, the share of the
     job's revenue that is rehire, and how many suppliers' costs are missing. A note lists the other contract lines with
     no Coates plant number that are NOT counted as rehire, so Andrew can say if any of them is.
  EVERY FIGURE IS THE P&L'S. The toilets' Rehire Revenue is the By branch table's KINP rehire cell; the servicing is the
     P&L's servicing line; the Rehire cost is the P&L's approved quotes; fencing to date is the P&L's fencing revenue and
     its fencing category; fencing to come is the Costs to job end card's programme. Nothing is added to the P&L; the
     card is a view across it, and the tests hold it to the cent.
  WORDS. Rehire, Rehire Revenue, Rehire cost, Hire, Sub-hired, the card, Rate 1, contract lines, branch - AGENTS.md.
    python3 patch_v766.py <page.html>   (needs v7.65: cj765Glance; v7.64: cj764Model; pl754Rehire, pl752Rows)"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function rh766Model(' in t: sys.exit('v7.66 already applied')
for need in ['function cj765Glance(', 'function cj764Model(){', 'function pl754Rehire(', 'function pl752Rows(', 'function fin745Card(', "${cj764Card()}\n <h3 class=\"sec cj765-sec\" id=\"cj765monthend\">", '<li><button class="linkish" data-jump765="cj765detail">The working</button>', '.cj765 .pl-todo{color:#6b7681;font-weight:500}']:
    if need not in t: sys.exit('needs ' + need)

JS = r"""/* v7.66 - REHIRE BY BRANCH. Andrew, 1 Oct 2026: "ensure we know what's sub-hired ... what branches have sub-hire and the
 value and forecast ... a forecast for the business". Rehire is gear hired in from another company, charged to the V8s
 at OUR rates (Rehire Revenue) with the supplier paid for it (Rehire cost). Every figure here is read from the P&L and
 the Costs to job end card - a view across them, never a new total. */
function rh766Model(){
 const M = moneySummary(), c = M.charge || {}, k = M.cost || {}, X = cj764Model(), F = X.fencing, r2 = n => Math.round(n * 100) / 100;
 const RH = pl754Rehire(M), B = pl752Rows(), today = todayIso();
 const rows = ONHIRE_ROWS.filter(r => !r.charge_line);
 const amt = r => { const x = contractCharge(r); return typeof x.amount === 'number' ? x.amount : null; };
 const sum = rs => r2(rs.reduce((s, r) => s + (amt(r) || 0), 0)), units = rs => rs.reduce((s, r) => s + (Number(r.quantity) || 0), 0), unrated = rs => rs.filter(r => amt(r) == null).length;
 const span = rs => { const a = rs.map(r => r.start_date || r.contract_start).filter(Boolean).sort(), b = rs.map(r => r.expected_term_date || r.term_date || r.demob_date).filter(Boolean).sort(); return a.length && b.length ? `${fmtDate(a[0])} → ${fmtDate(b[b.length - 1])}` : ''; };
 const groups = [], gaps = [];
 const push = g => groups.push(Object.assign({revToCome: 0, costToCome: 0, lines: 0, units: 0, unrated: 0, notes: [], missing: []}, g, {revJob: g.rev == null && !g.revToCome ? null : r2((g.rev || 0) + (g.revToCome || 0)), costJob: g.cost == null && !g.costToCome ? null : r2((g.cost || 0) + (g.costToCome || 0))}));
 /* EVERY CONTRACT LINE LANDS IN EXACTLY ONE GROUP. take() hands out the lines not yet assigned that match, and marks
    them, so no line can be in two groups and none can fall between them (Codex's review, 1 Oct). Order: the SUB lines
    (the rental system's own word), the toilets, the NVAC forklifts, other machines marked hired in, then the rest. */
 const assigned = new Set(); const take = pred => rows.filter(r => !assigned.has(r) && pred(r)).map(r => { assigned.add(r); return r; });
 const subs = take(r => r.subhired);
 /* the toilets: Event Portables, on whichever branch carries them (KINP today) */
 const toil = take(r => r.family === 'toilet'), tMisc = toil.filter(r => !r.asset_no_is_plant_number), tPlant = toil.filter(r => r.asset_no_is_plant_number);
 const toilBranch = toil.length ? (toil.map(r => r.branch_code).sort((a, b) => toil.filter(r => r.branch_code === b).length - toil.filter(r => r.branch_code === a).length)[0]) : (typeof pl760ToiletBranch === 'function' ? pl760ToiletBranch() : 'KINP');
 const Q = (DATA.rehire_quotes && DATA.rehire_quotes.quotes) || [];
 if (toil.length) push({branch: toilBranch, what: 'Toilets — Event Portables', supplier: RH.co, lines: toil.length, units: units(toil), unrated: unrated(toil), rev: r2(sum(toil) + (RH.servicing || 0)), cost: RH.cost, costState: RH.cost == null ? 'not on the record' : (RH.approved ? 'approved — the final total may change' : 'quoted, unsigned'), rule: 'every toilet line on the contracts is Event Portables gear (the toilets stream’s rule), charged at our rates; the servicing at the card’s pump-out rates, on no contract line',
 basis: `Rehire Revenue: ${fmtNum(toil.length)} toilet lines, ${fmtNum(units(toil))} units, ${money0(sum(toil))} at our rates (whole-event rates — the job figure) + servicing ${money0(RH.servicing || 0)} at the card · Rehire cost: ${Q.length ? Q.map(q => q.quote).join(', ') : 'the quotes'} ex GST${RH.cost != null ? ', ' + money0(RH.cost) : ''}`,
 notes: [`${fmtNum(tMisc.length)} lines on MISCITEM (${fmtNum(units(tMisc))} units, ${money0(sum(tMisc))}) · ${fmtNum(tPlant.length)} lines carry a Coates plant number (${fmtNum(units(tPlant))} units, ${money0(sum(tPlant))}) — all counted as Event Portables rehire; Andrew, 1 Oct: “some of the toilets may not have MISC next to them”`, `${fmtNum(RH.marked || 0)} location${RH.marked === 1 ? '' : 's'} marked ${RH.co} gear on the page`],
 missing: RH.cost == null ? ['the Rehire cost'] : []});
 /* the SUB lines: the item code starts with SUB, the supplier is on the line */
 subs.forEach(r => { const a = amt(r); push({branch: r.branch_code, what: `Sub-hired — ${r.description || r.what || r.item}`, supplier: r.supplier_sub_rental ? `supplier code ${r.supplier_sub_rental}` : 'supplier not on the line', lines: 1, units: Number(r.quantity) || 0, unrated: a == null ? 1 : 0, rev: a, cost: null, costState: 'not on the record', rule: 'the item code starts with SUB — the rental system’s own sub-hire line',
 basis: `${r.item} on contract ${r.rental_contract}${typeof r.rate_1 === 'number' ? ` · Rate 1 ${money(r.rate_1)}${r.rate_type ? ' (' + r.rate_type + ')' : ''}` : ' · no Rate 1'}${span([r]) ? ' · ' + span([r]) : ''}${r.sales_analysis_code ? ' · sales analysis code ' + r.sales_analysis_code : ''}`,
 notes: r.sales_analysis_code && r.branch_code && !String(r.sales_analysis_code).startsWith(r.branch_code) ? [`the sales analysis code names ${String(r.sales_analysis_code).split('-')[0]}, the contract is ${r.branch_code}’s`] : [], missing: ['the supplier’s name and the Rehire cost (a quote or invoice)']}); });
 /* NVAC - the forklifts. Andrew, 1 Oct: "forklifts from NVAC, they are sub-hired" */
 const forks = take(r => r.branch_code === 'NVAC' && /forklift/.test(r.family || '')), fMisc = forks.filter(r => !r.asset_no_is_plant_number), fPlant = forks.filter(r => r.asset_no_is_plant_number), fMach = forks.filter(r => r.subhired_machine);
 if (forks.length) push({branch: 'NVAC', what: 'Forklifts and their attachments — sub-hired', supplier: 'supplier not on the record', lines: forks.length, units: units(forks), unrated: unrated(forks), rev: sum(forks), cost: null, costState: 'not on the record', rule: 'Andrew, 1 Oct 2026: the forklifts from NVAC are sub-hired; the record’s own rule marks the lines on MISCITEM and the machine he named on 12 Sep',
 basis: `${fmtNum(forks.length)} forklift lines on the NVAC contract · Rehire Revenue at the card’s day rate × the days to the term date (${span(forks) || 'dates on the lines'}) — the job figure`,
 notes: [`${fmtNum(fMisc.length)} line${fMisc.length === 1 ? '' : 's'} on MISCITEM (${money0(sum(fMisc))})${fMach.length ? ` — ${fMach.map(r => (r.subhire && r.subhire.reads_as) || r.description).join('; ')} marked hired in by the project manager` : ''} · ${fmtNum(fPlant.length)} line${fPlant.length === 1 ? '' : 's'} carry a Coates plant number (${money0(sum(fPlant))}) — counted here on Andrew’s word; confirm each one`, unrated(forks) ? `${fmtNum(unrated(forks))} attachment line${unrated(forks) === 1 ? '' : 's'} with no rate — no Rehire Revenue for ${unrated(forks) === 1 ? 'it' : 'them'} yet` : ''].filter(Boolean),
 missing: ['which of the ' + fmtNum(forks.length) + ' lines are sub-hired, the supplier, and the Rehire cost for each']});
 /* other machines the project manager marked hired in, off NVAC */
 take(r => r.subhired_machine).forEach(r => { const a = amt(r); push({branch: r.branch_code, what: `Sub-hired — ${(r.subhire && r.subhire.reads_as) || r.description}`, supplier: 'supplier not on the record', lines: 1, units: Number(r.quantity) || 0, unrated: a == null ? 1 : 0, rev: a, cost: null, costState: 'not on the record', rule: 'marked hired in by the project manager', basis: `${r.item} on contract ${r.rental_contract}`, missing: ['the supplier and the Rehire cost']}); });
 /* STPS - Advanced Temporary Fencing: the dockets so far, the programme to come */
 const fenceCat = (M.categories || []).find(x => x.key === 'fencing') || {amount: 0}; const SP = typeof fencePaidSplit === 'function' ? fencePaidSplit() : {};
 push({branch: typeof pl760FencingBranch === 'function' ? pl760FencingBranch() : 'STPS', what: 'Fencing — Advanced Temporary Fencing', supplier: 'Advanced Temporary Fencing', lines: Number(c.fencing_dockets) || (allDockets().filter(d => d.usable).length), units: null, rev: r2(Number(c.fencing) || 0), revToCome: r2(F.revenue || 0), cost: r2(Number(fenceCat.amount) || 0), costToCome: r2(F.cost || 0), costState: 'at their own sheet, docket by docket', rule: 'hire and installation in one rate at the 2026 card to the V8s; Advanced’s gear (Rehire cost) and their crew (Installation — external contractors) at their own sheet',
 basis: `on the record: ${fmtNum(Number(c.fencing_dockets) || 0)} dockets at the card (Rehire Revenue) and at Advanced’s sheet + the green book (Rehire cost) · still to come: the 2026 fencing programme’s remaining weeks (${F.weeks.map(w => w.prog || w.week).join(', ') || 'none'}) at the card and at Advanced’s rates — the Costs to job end card’s figures`,
 notes: [SP.paid != null ? `Rehire cost so far: their gear ${money0(SP.gear || 0)} · Installation — external contractors ${money0(SP.installation || 0)}${SP.green ? ' (the green book ' + money0(SP.green) + ' among it)' : ''}` : '', F.behind && F.behind.length ? `still to come includes ${money0(F.behindCost)} (${money0(F.behindRevenue)} at the card) behind the programme — ${F.behind.join(', ')} ended with metres still on the plan; Advanced to confirm` : '', Object.keys(F.noCostRate || {}).length || Object.keys(F.hourly || {}).length ? 'to come leaves out what has no rate on Advanced’s sheet (relocation by the hour, hoarding, flat feet, WPF, removal) — named on the Costs to job end card' : ''].filter(Boolean), missing: []});
 /* lines without a Coates plant number that are NOT counted as rehire - so Andrew can say if any is */
 const rest = take(r => !r.asset_no_is_plant_number); const plantNumbered = rows.filter(r => !assigned.has(r));
 const other = {}; rest.forEach(r => { const key = `${r.branch_code} · ${r.family || 'other'}`; const g = other[key] = other[key] || {branch: r.branch_code, family: r.family || 'other', n: 0, rev: 0, items: new Set()}; g.n++; g.rev = r2(g.rev + (amt(r) || 0)); if (r.item && r.item !== r.asset_no) g.items.add(r.item); else if (r.item) g.items.add(r.item); });
 const others = Object.values(other).map(g => Object.assign(g, {items: [...g.items].slice(0, 4)})).sort((a, b) => b.rev - a.rev);
 /* the business: totals */
 const T = {rev: r2(groups.reduce((s, g) => s + (g.rev || 0), 0)), revToCome: r2(groups.reduce((s, g) => s + (g.revToCome || 0), 0)), cost: r2(groups.reduce((s, g) => s + (g.cost || 0), 0)), costToCome: r2(groups.reduce((s, g) => s + (g.costToCome || 0), 0)), costMissing: groups.filter(g => g.cost == null).length, lines: groups.reduce((s, g) => s + (g.lines || 0), 0)};
 T.revJob = r2(T.rev + T.revToCome); T.costJob = r2(T.cost + T.costToCome); T.share = X.revenue && X.revenue.job ? T.revJob / X.revenue.job : null; T.shareNow = c.total ? T.rev / c.total : null;
 const byBranch = {}; groups.forEach(g => { const b = byBranch[g.branch] = byBranch[g.branch] || {branch: g.branch, groups: 0, revJob: 0, costJob: 0, costMissing: 0}; b.groups++; b.revJob = r2(b.revJob + (g.revJob || 0)); b.costJob = r2(b.costJob + (g.costJob || 0)); if (g.cost == null) b.costMissing++; });
 /* coverage: every non-charge contract line is in one group, in the "not counted" table, or carries a Coates plant number and is Coates's own hire */
 const coverage = {lines: rows.length, inGroups: groups.reduce((s, g) => s + (/Fencing/.test(g.what) ? 0 : (g.lines || 0)), 0), notCounted: rest.length, coatesOwn: plantNumbered.length};
 coverage.adds = coverage.inGroups + coverage.notCounted + coverage.coatesOwn === coverage.lines;
 return {asAt: today, groups, byBranch: Object.values(byBranch).sort((a, b) => b.revJob - a.revJob), others, totals: T, revenueJob: X.revenue ? X.revenue.job : null, revenueNow: r2(Number(c.total) || 0), coverage};
}
function rh766Card(){
 let R; try { R = rh766Model(); } catch (e) { return `<section id="rehire766" class="fin745 rh766"><p class="fin745-eyebrow">REHIRE BY BRANCH</p><p>Could not be worked out from this record: ${esc(String(e && e.message || e))}</p></section>`; }
 const m = v => v == null ? '<span class="acc761-w">not on the record</span>' : v === 0 ? '—' : esc(money0(v)), T = R.totals, pc = v => v == null ? '—' : Math.round(v * 100) + '%';
 const row = g => `<tr><td><span class="chip ref mono">${esc(g.branch)}</span></td><td><b>${esc(g.what)}</b><br><span class="acc761-w">${esc(g.supplier)}${g.lines ? ` · ${esc(fmtNum(g.lines))} ${/Fencing/.test(g.what) ? 'docket' : 'line'}${g.lines === 1 ? '' : 's'}` : ''}${g.units ? ` · ${esc(fmtNum(g.units))} unit${g.units === 1 ? '' : 's'}` : ''}${g.unrated ? ` · ${esc(fmtNum(g.unrated))} not priced` : ''}</span></td>
 <td class="num">${m(g.rev)}</td><td class="num">${g.revToCome ? m(g.revToCome) : '—'}</td><td class="num"><b>${m(g.revJob)}</b></td>
 <td class="num">${m(g.cost)}</td><td class="num">${g.costToCome ? m(g.costToCome) : '—'}</td><td class="num"><b>${m(g.costJob)}</b>${g.cost != null ? `<br><span class="acc761-w">${esc(g.costState)}</span>` : ''}</td>
 <td class="rh766-basis"><span>${esc(g.basis)}</span>${g.notes.length ? `<br><span class="acc761-w">${g.notes.map(esc).join(' · ')}</span>` : ''}${g.missing.length ? `<br><span class="rh766-miss">Not on the record: ${g.missing.map(esc).join('; ')}</span>` : ''}</td></tr>`;
 return `<section id="rehire766" class="fin745 rh766 nosfold" aria-labelledby="rh766Title">
 <div class="fin745-heading"><div><p class="fin745-eyebrow">REHIRE BY BRANCH · AUD EX GST · FORECAST</p><h2 id="rh766Title">What is sub-hired, what it brings in, and what it costs — by branch, to job end</h2><p>Rehire is gear hired in from another company and charged to the V8s at <b>our</b> rates, with the supplier paid for it. <b>Rehire Revenue</b> is what we charge; <b>Rehire cost</b> is what we pay. Each is on the record today, then carried to job end. Every figure is the Forecast P&amp;L’s or the Costs to job end card’s — this is a view across them, never a new total, and the two sides are never added together. As at ${esc(fmtDate(R.asAt))}.</p></div></div>
 <div class="fin745-metrics acc761-metrics">
 ${fin745Card('Rehire Revenue — on the record', money0(T.rev), `${pc(T.shareNow)} of the ${esc(money0(R.revenueNow))} revenue on the record is rehire`)}
 ${fin745Card('Rehire Revenue — to job end', money0(T.revJob), `+ ${esc(money0(T.revToCome))} still to come (the fencing programme) · ${pc(T.share)} of the ${esc(money0(R.revenueJob))} revenue to job end`)}
 ${fin745Card('Rehire cost — on the record', money0(T.cost), `Event Portables’ quotes and Advanced’s dockets · ${esc(fmtNum(T.costMissing))} supplier${T.costMissing === 1 ? '' : 's’'} cost${T.costMissing === 1 ? '' : 's'} not on the record`)}
 ${fin745Card('Rehire cost — to job end', money0(T.costJob), `+ ${esc(money0(T.costToCome))} still to come (the fencing programme at Advanced’s rates) · before the ${esc(fmtNum(T.costMissing))} missing`)}
 </div>
 <p class="fin745-basis">By branch, to job end: ${R.byBranch.map(b => `<b>${esc(b.branch)}</b> Rehire Revenue ${esc(money0(b.revJob))}${b.costJob ? ` · Rehire cost ${esc(money0(b.costJob))}` : ''}${b.costMissing ? ` (${esc(fmtNum(b.costMissing))} cost${b.costMissing === 1 ? '' : 's'} missing)` : ''}`).join(' · ')}. A contract line is rehire here when every toilet line is Event Portables gear (the toilets stream’s rule), when its item code starts with SUB, when the project manager marked the machine hired in, or — the NVAC forklifts — on Andrew’s word of 1 Oct 2026. Contract rates are whole-event rates (forklifts by the day to the term date), so a line’s Rehire Revenue on the record is already its job figure; only the fencing programme has a “still to come”.</p>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>Rehire by branch</h3><p>What we charge the V8s at our rates against what we pay the supplier, each on the record and to job end.</p></div></div>
 <div class="tblwrap"><table class="acc761-tbl rh766-tbl"><thead><tr><th>Branch</th><th>What · supplier</th><th class="num">Rehire Revenue<br><small>on the record</small></th><th class="num"><small>still to come</small></th><th class="num"><small>to job end</small></th><th class="num">Rehire cost<br><small>on the record</small></th><th class="num"><small>still to come</small></th><th class="num"><small>to job end</small></th><th>Basis · what is not on the record</th></tr></thead>
 <tbody>${R.groups.map(row).join('')}
 <tr class="acc761-grand"><td></td><td><b>Rehire — the business</b><br><span class="acc761-w">${esc(fmtNum(R.groups.length))} groups on ${esc(fmtNum(R.byBranch.length))} branches</span></td><td class="num"><b>${m(T.rev)}</b></td><td class="num"><b>${T.revToCome ? m(T.revToCome) : '—'}</b></td><td class="num"><b>${m(T.revJob)}</b></td><td class="num"><b>${m(T.cost)}</b></td><td class="num"><b>${T.costToCome ? m(T.costToCome) : '—'}</b></td><td class="num"><b>${m(T.costJob)}</b></td><td class="rh766-basis"><span>${esc(fmtNum(T.costMissing))} supplier cost${T.costMissing === 1 ? '' : 's'} not on the record — the Rehire cost to job end is a floor until they are</span></td></tr></tbody></table></div></div>
 ${R.others.length ? `<div class="fin745-block"><div class="fin745-blockhead"><div><h3>Not counted as rehire — contract lines with no Coates plant number</h3><p>Furniture, barriers, consumables and the like. None is counted as rehire today; say if any of them is hired in and it joins the table above.</p></div></div>
 <div class="tblwrap"><table class="acc761-tbl"><thead><tr><th>Branch</th><th>Family</th><th class="num">Lines</th><th class="num">Revenue at our rates</th><th>Item codes seen</th></tr></thead><tbody>${R.others.map(g => `<tr><td><span class="chip ref mono">${esc(g.branch)}</span></td><td>${esc(g.family)}</td><td class="num">${esc(fmtNum(g.n))}</td><td class="num">${m(g.rev)}</td><td class="acc761-w">${g.items.length ? esc(g.items.join(', ')) : 'no item code — the line names the thing'}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
 </section>`;
}
"""
t = rep(t, "function cj764Model(){", JS + "function cj764Model(){", 'rehire code', p, True)
t = rep(t, "${cj764Card()}\n <h3 class=\"sec cj765-sec\" id=\"cj765monthend\">", "${cj764Card()}\n ${rh766Card()}\n <h3 class=\"sec cj765-sec\" id=\"cj765monthend\">", 'costs pane mount', p, True)
t = rep(t, '<li><button class="linkish" data-jump765="cj765detail">The working</button>', '<li><button class="linkish" data-jump765="rehire766">Rehire by branch</button> — what is sub-hired, its Rehire Revenue and Rehire cost</li><li><button class="linkish" data-jump765="cj765detail">The working</button>', 'glance link', p, True)
CSS = ".rh766 .fin745-eyebrow{color:#5a3e8a}.rh766{border-top-color:#5a3e8a}.rh766-tbl th small{display:block;font-weight:600;font-size:10px;color:#6b7681}.rh766-basis{font-size:12px;line-height:1.35;max-width:38ch}.rh766-miss{color:#9c470c;font-weight:600}@media(max-width:760px){.rh766-basis{max-width:none}}"
t = rep(t, ".cj765 .pl-todo{color:#6b7681;font-weight:500}", ".cj765 .pl-todo{color:#6b7681;font-weight:500}" + CSS, 'rehire style', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.66 applied: Rehire by branch — what is sub-hired, Rehire Revenue and Rehire cost, on the record and to job end')
