#!/usr/bin/env python3
"""v7.61 - Accruals for Finance, on the Costs tab. Andrew, 1 Oct 2026: "Finance will want accrual info from me. No
branches have billed for October, but we have paid for fencing. We need this clean info in the Costs section for the
finance team to look at if needed."

A new section under Month-end control - "Accruals for Finance" - works out, for a chosen work month and from the record
alone, what Finance ask a project manager for at month end:
  1. REVENUE EARNED IN THE MONTH, NOT YET BILLED (accrued revenue / WIP): hire charged from the day it goes in, pro rata by
     the days in the month; the fencing dockets dated in the month at the 2026 card (STPS Rehire Revenue); labour ticked
     per piece on references that went in during the month; the hire charged over the three race days, the toilets'
     servicing and the event labour scope in the event's month. Each row names its branch.
  2. COSTS INCURRED IN THE MONTH - SUPPLIER INVOICE IN, OR STILL TO COME (accrued expense): Advanced's dockets at their
     own sheet against the invoices recorded on the purchase orders; the Event Portables quotes (approved, no invoice, no
     PO) with a suggested day-share the page marks as Finance's call; carriers' charges on the loads dated in the month;
     Job Connect's hours at their rates; accommodation, meals and expenses on the tracker; Coates people's hours shown for
     information only (payroll, no accrual).
  3. PAID AHEAD OF THE REVENUE - the fencing invoices in hand against the fencing charge not yet billed - the WIP question,
     put to Finance in one line.
  4. Four tiles, a "Copy for Finance" button (plain text), an "Export accruals CSV", and a six-line glossary in plain words.
Nothing is written to the record and no P&L figure moves: the section reads what the page already knows.
    python3 patch_v761.py <page.html>   (needs the live v7.45+: fin745Html, fin745Bind, renderCosts, poAll, allDockets)"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'acc761Model' in t: sys.exit('v7.61 already applied')
for need in ['function fin745Bind(){', 'function renderCosts(){', 'function poAll(){', 'function allDockets(){', 'function fin745MonthLabel(', 'function fin745Download(', 'function fin745CsvCell(', 'function servicing748Total(', 'function eventWindow(){']:
    if need not in t: sys.exit('needs ' + need)

HELPERS = r"""
/* v7.61 - ACCRUALS FOR FINANCE (Andrew, 1 Oct 2026): what belongs in a work month but has not been billed or invoiced
   yet, from the record alone. Revenue and cost are never added together; every figure names where it came from. */
const ACC761_UI = {month: ''};
function acc761LastDay(month){ const y = Number(month.slice(0, 4)), m = Number(month.slice(5, 7)); return month + '-' + String(new Date(y, m, 0).getDate()).padStart(2, '0'); }
function acc761DefaultMonth(){ const t = todayIso(); let y = Number(t.slice(0, 4)), m = Number(t.slice(5, 7)) - 1; if (m < 1) { m = 12; y--; } return y + '-' + String(m).padStart(2, '0'); }
/* the days of [from, to] that fall inside the month, both ends counted (the way the page charges hire) */
function acc761DaysIn(from, to, month){ if (!from || !to) return 0; const a = from > month + '-01' ? from : month + '-01', z = to < acc761LastDay(month) ? to : acc761LastDay(month); if (z < a) return 0; return daysInclusive(a, z) || 0; }
function acc761Months(){
 const set = new Set();
 allAssets().filter(a => !a._cancelled && !a.rest_of).forEach(a => { const sp = chargeSpanOf(a); if (sp.from) set.add(sp.from.slice(0, 7)); if (sp.to) set.add(sp.to.slice(0, 7)); if (a.first_date) set.add(a.first_date.slice(0, 7)); });
 allCosts().forEach(c => { if (c.date) set.add(String(c.date).slice(0, 7)); }); try { ourCosts().forEach(c => { if (c.date) set.add(String(c.date).slice(0, 7)); }); } catch (e) {}
 set.add(acc761DefaultMonth()); set.add(todayIso().slice(0, 7));
 return [...set].filter(m => /^\d{4}-\d{2}$/.test(m)).sort();
}
function acc761Month(){ const ms = acc761Months(); const want = ACC761_UI.month || acc761DefaultMonth(); return ms.includes(want) ? want : (ms.includes(acc761DefaultMonth()) ? acc761DefaultMonth() : ms[ms.length - 1]); }
/* a purchase order's month: the programme week it names, else the day it was typed */
function acc761PoMonth(o){
 const per = String(o.period || o.programme_sheet || ''); const W = DATA.weeks || [];
 let w = null; const n = per.match(/(?:week|wk)\s*(\d)/i);
 if (/demob|decon/i.test(per)) w = W.find(x => /demob/i.test(x.phase || '') || /decon/i.test(x.sheet || ''));
 else if (/event/i.test(per)) w = W.find(x => /event/i.test(x.sheet || '') || /event/i.test(x.phase || ''));
 else if (n) w = W.find(x => String(x.sheet || '').replace(/\s+/g, ' ').toLowerCase() === 'week ' + n[1]);
 if (w && w.end) return String(w.end).slice(0, 7);
 if (o.at) return String(o.at).slice(0, 7);
 return null;
}
function acc761Model(month){
 const r2 = n => Math.round(n * 100) / 100, inM = iso => !!iso && String(iso).slice(0, 7) === month;
 const M = moneySummary(), c = M.charge || {}, k = M.cost || {};
 const ev = eventWindow(), evMonth = ev ? ev.from.slice(0, 7) : null;
 const live = allAssets().filter(a => !a._cancelled && !a.rest_of);
 const out = {month, label: fin745MonthLabel(month), asAt: todayIso(), revenue: [], costs: [], wip: [], decisions: 0, notes: []};
 /* ---- 1. revenue earned in the month, not yet billed — every Baseplan contract line priced the way the P&L prices it
    (contractCharge): a line charged by the day (VMS, forklifts, water barriers) pro rata over its days on hire; a whole-event
    rate in the event's month; a transport or delivery charge line in the month it went in; the toilet lines and the SUB
    lines named as the rehire they are. The months add back to the P&L's contracts figure to the cent. */
 const streams = {}; const putS = (stream, br, amt, n, keys, key) => { const s = streams[stream + '|' + br] = streams[stream + '|' + br] || {stream, branch: br, amount: 0, n: 0, partial: 0, keys: []}; s.amount += amt; s.n += n; if (key && s.keys.length < 6 && !s.keys.includes(key)) s.keys.push(key); };
 const noteS = {}; const rowsAll = (typeof ONHIRE_ROWS !== 'undefined' ? ONHIRE_ROWS : []);
 rowsAll.forEach(r => { const ch = contractCharge(r); if (typeof ch.amount !== 'number' || !ch.amount || ch.treatment) return; const br = r.branch_code || 'no branch'; const q = typeof r.quantity === 'number' && r.quantity > 0 ? r.quantity : 1;
 const what = String(r.what || r.description || '').replace(/\s+/g, ' ').trim().slice(0, 28);
 if (r.charge_line) { const d = r.start_date || r.booked_delivery_date || (ev && ev.from); if (inM(d)) putS('Transport Revenue — the delivery and transport lines', br, ch.amount, 1, null, what); return; }
 if (r.subhired) { if (ch.daily && ch.days) { const from = r.start_date || r.booked_delivery_date, to = r.term_date || r.expected_term_date || r.booked_pickup_date, span = daysInclusive(from, to) || ch.days, dm = acc761DaysIn(from, to, month); if (dm) putS('Rehire Revenue — the SUB lines, by the day', br, ch.amount * dm / span, 1, null, what); } else if (evMonth === month) putS('Rehire Revenue — the SUB lines', br, ch.amount, 1, null, what); return; }
 if (ch.daily && ch.days) { const from = r.start_date || r.booked_delivery_date, to = r.term_date || r.expected_term_date || r.booked_pickup_date; const span = daysInclusive(from, to) || ch.days; const dm = acc761DaysIn(from, to, month); if (!dm) return;
 const s = 'Hire charged from the day it goes in' + (ch.filled === 'card' ? ' — from the card' : ''); putS(s, br, ch.amount * dm / span, 1, null, what); if (dm < span) streams[s + '|' + br].partial++; return; }
 if (evMonth !== month) return;
 if (r.family === 'toilet') putS('Toilets — Event Portables rehire, at our rates', br, ch.amount, 1, null, what);
 else putS('Hire charged over the three race days' + (ch.filled === 'card' ? ' — from the card' : ch.filled === 'typed' ? ' — a rate typed on the Costs tab' : ''), br, ch.amount, 1, null, what); });
 Object.values(streams).sort((x, y) => y.amount - x.amount).forEach(s => { s.amount = r2(s.amount); if (!s.amount) return; const daily = /from the day/.test(s.stream); out.revenue.push({stream: s.stream, branch: s.branch, amount: s.amount, basis: `${fmtNum(s.n)} contract line${s.n === 1 ? '' : 's'} (${s.keys.join(', ')}${s.n > s.keys.length ? ', …' : ''}) · ${daily ? `the rate a day × the days on hire in ${out.label}${s.partial ? ` (${fmtNum(s.partial)} run past the month)` : ''}` : /Transport/.test(s.stream) ? 'the price on the line, in the month it went in' : /SUB/.test(s.stream) ? 'the SUB lines on the contracts, the whole-event rate' : `the whole-event rate, ${ev ? fmtDate(ev.from) + ' to ' + fmtDate(ev.to) : 'over the event'}`}`, action: 'accrue', words: /Transport/.test(s.stream) ? 'Accrue as unbilled revenue until the branch bills the delivery' : 'Accrue as unbilled revenue until the branch bills it'}); });
 /* Baseplan's own billing columns: what the export says has been billed */
 out.baseplan = {n: rowsAll.length, billed: rowsAll.filter(r => Number(r.billed_amount) > 0).length, supplied_on: (typeof ONHIRE !== 'undefined' && ONHIRE && ONHIRE.supplied_on) || null};
 /* the fencing dockets at the 2026 card, dated in the month */
 const fd = {}; let fdN = 0, fdAmt = 0;
 allCosts().filter(x => x.usable && x.from === 'record' && /fenc/i.test(String(x.category || '')) && inM(x.date)).forEach(x => { const br = (costBranchOf(x) || {}).code || 'no branch'; fd[br] = r2((fd[br] || 0) + (Number(x.amount) || 0)); fdN++; fdAmt = r2(fdAmt + (Number(x.amount) || 0)); });
 Object.entries(fd).forEach(([br, amt]) => out.revenue.push({stream: 'Fencing — Rehire Revenue, dockets at the 2026 card', branch: br, amount: amt, basis: `${fmtNum(fdN)} docket${fdN === 1 ? '' : 's'} dated in ${out.label} · hire and installation in one card rate`, action: 'accrue', words: 'Accrue as unbilled revenue until the branch bills it'}));
 /* labour ticked per piece on references that went in during the month */
 const lb = {}; let lbTicks = 0, lbUnknown = 0;
 live.filter(a => inM(a.first_date) || (!a.first_date && evMonth === month)).forEach(a => { const T = assetTotal(a); const ticks = (T.lines || []).reduce((s, l) => s + (l.labour && l.labour.ticked ? l.labour.ticked.length : 0), 0); if (!ticks) return;
 const br = (branchOf(a.key) || {}).code || 'no branch'; lb[br] = lb[br] || {amount: 0, n: 0, ticks: 0}; lb[br].n++; lb[br].ticks += ticks; lbTicks += ticks; if (T.labour == null) lbUnknown++; else lb[br].amount = r2(lb[br].amount + T.labour); });
 Object.entries(lb).sort((x, y) => y[1].amount - x[1].amount).forEach(([br, h]) => out.revenue.push({stream: 'Labour ticked per piece', branch: br, amount: h.amount, basis: `${fmtNum(h.ticks)} tick${h.ticks === 1 ? '' : 's'} on ${fmtNum(h.n)} reference${h.n === 1 ? '' : 's'} that went in during ${out.label} · the card's per-piece rates${lbUnknown ? ` · ${fmtNum(lbUnknown)} not priced` : ''}`, action: 'accrue', words: 'Accrue as unbilled revenue until the branch bills it'}));
 /* the toilets' servicing and the event labour scope belong to the event's month */
 if (evMonth === month) { const svc = Number(servicing748Total()) || 0; if (svc) out.revenue.push({stream: 'Toilet servicing and cleaning — Rehire Revenue at our pump-out rates', branch: (typeof pl760ToiletBranch === 'function') ? pl760ToiletBranch() : 'KINP', amount: r2(svc), basis: 'Event Portables’ quantities on Q6844 · runs with the event', action: 'accrue', words: 'Accrue as unbilled revenue until the branch bills it'});
 if (c.race && c.race.amount != null) out.revenue.push({stream: 'Event labour — the scope', branch: 'the job', amount: r2(c.race.amount), basis: `${fmtNum(c.race.hours || 0)} h of people over the event + accommodation and travel · ${c.race.document || 'the scope'}`, action: 'accrue', words: 'Accrue as unbilled revenue until it is billed'}); }
 out.revenueTotal = r2(out.revenue.reduce((s, r) => s + (r.amount || 0), 0));
 /* ---- 2. costs incurred in the month: supplier invoice in, or still to come */
 const dockets = allDockets().filter(d => d.usable && inM(d.date));
 const dAll = allDockets().filter(d => d.usable), dAllCost = r2(dAll.reduce((s, d) => s + (d.paid_total || 0), 0));
 const dCost = r2(dockets.reduce((s, d) => s + (d.paid_total || 0), 0));
 const fl = k.fencing_labour || {}; const flShare = dAllCost && fl.amount ? r2(fl.amount * dCost / dAllCost) : 0;
 const pos = poAll().filter(o => o.confirmed && o.invoice_no && o.amount != null && acc761PoMonth(o) === month);
 const invoiced = r2(pos.reduce((s, o) => s + (Number(o.amount) || 0), 0));
 const posOpen = poAll().filter(o => !(o.confirmed && o.invoice_no && o.amount != null) && acc761PoMonth(o) === month);
 const sup = (PO_SRC.supplier || {}).name || 'the fencing contractor'; const supBr = normBranch((PO_SRC.supplier || {}).branch_code || '') || (typeof pl760FencingBranch === 'function' ? pl760FencingBranch() : 'STPS');
 if (dockets.length || pos.length) { const incurred = r2(dCost + flShare), toAccrue = r2(Math.max(0, incurred - invoiced));
 out.costs.push({stream: `Fencing — ${sup}, rehire cost`, branch: supBr, incurred, invoiced, accrue: toAccrue, evidence: `${fmtNum(dockets.length)} docket${dockets.length === 1 ? '' : 's'} dated in ${out.label} at ${sup.split(' ')[0]}'s own sheet ${money0(dCost)}${flShare ? ` + their labour and truck hours ${money0(flShare)} (the green book, apportioned by the dockets)` : ''} · invoices recorded: ${pos.length ? pos.map(o => `${o.invoice_no} ${money0(Number(o.amount))} (PO ${o.number}${o.period ? ', ' + o.period : ''})`).join('; ') : 'none yet'}${posOpen.length ? ` · ${fmtNum(posOpen.length)} PO${posOpen.length === 1 ? '' : 's'} for the month with no invoice yet (${posOpen.map(o => o.number).join(', ')})` : ''}`,
 action: toAccrue ? 'accrue' : (invoiced > incurred ? 'decide' : 'none'), words: toAccrue ? `Accrue ${money0(toAccrue)} — dockets in hand, invoice still to come` : invoiced > incurred ? 'Invoiced ahead of the dockets — no accrual; Finance may defer the excess' : 'Invoiced in full — nothing to accrue'}); if (invoiced > incurred) out.decisions++; }
 /* the Event Portables quotes: approved, no invoice, no purchase order */
 const RQ = (DATA.rehire_quotes || {}).quotes || [];
 RQ.forEach(q => { const from = q.delivery || q.use_on, to = q.collect || q.use_on; if (!from || !to) return; const days = daysInclusive(from, to) || 1, dm = acc761DaysIn(from, to, month); if (!dm) return;
 const ex = r2((Number(q.sub_total) || 0) + (Number(q.delivery_charge) || 0) + (Number(q.pickup) || 0)); const share = r2(ex * dm / days);
 out.costs.push({stream: `Toilets — ${((DATA.rehire_quotes || {}).supplier || {}).name || 'Event Portables'} ${q.quote}, rehire cost`, branch: (typeof pl760ToiletBranch === 'function') ? pl760ToiletBranch() : 'KINP', incurred: share, invoiced: 0, accrue: share, suggested: dm < days,
 evidence: `${money0(ex)} ex GST on the quote (${q.office_use_box || 'toilet hire'}) · ${fmtDate(from)} to ${fmtDate(to)}${dm < days ? ` · ${fmtNum(dm)} of ${fmtNum(days)} days fall in ${out.label}, so ${money0(share)} is the day-share — a suggestion, not the quote's wording` : ''} · ${k.rehire_approved ? 'approved on Andrew’s word' : 'quoted, unsigned'} · no invoice and no purchase order on the record${q.invoice_no ? ' · invoice ' + q.invoice_no : ''}`,
 action: 'decide', words: dm < days ? `Finance’s call: accrue the ${out.label} share, or hold the whole quote to the event’s month with its revenue` : 'Accrue unless the supplier’s invoice is in'}); if (dm < days) out.decisions++; });
 /* the carriers' charges on the loads dated in the month (the schedule's TPORT COST column) */
 let tpN = 0, tpAmt = 0, tpInternal = 0, tpPlus = 0; const ourRefs = new Set(ourCosts().filter(x => x.kind === 'transport' && x.usable && x.amount != null && x.ref).map(x => x.ref));
 live.forEach(a => { (a.events || []).forEach(e => { const tc = e.transport_cost; if (!tc || !inM(e.date)) return; if (tc.internal) { tpInternal++; return; } if (tc.amount == null || ourRefs.has(a.key)) return; tpN++; tpAmt = r2(tpAmt + tc.amount); if (tc.plus) tpPlus++; }); });
 [(((DATA.plant_lines || {}).fencing_rows_not_plant) || []), (DATA.unreferenced || [])].forEach(rows => rows.forEach(r => { const tc = r.transport_cost; if (!tc || !inM(r.date)) return; if (tc.internal) { tpInternal++; return; } if (tc.amount == null) return; tpN++; tpAmt = r2(tpAmt + tc.amount); if (tc.plus) tpPlus++; }));
 const oursT = ourCosts().filter(x => x.kind === 'transport' && x.usable && x.amount != null && inM(x.date)); const oursAmt = r2(oursT.reduce((s, x) => s + x.amount, 0));
 if (tpN || oursT.length || tpInternal) out.costs.push({stream: 'Transport (cartage) — carriers’ charges', branch: 'the job', incurred: r2(tpAmt + oursAmt), invoiced: null, accrue: r2(tpAmt + oursAmt), evidence: `${fmtNum(tpN)} load${tpN === 1 ? '' : 's'} dated in ${out.label} with a figure on the schedule’s TPORT COST column${tpPlus ? ` (${fmtNum(tpPlus)} marked “and more”)` : ''}${oursT.length ? ` + ${fmtNum(oursT.length)} of our own transport lines ${money0(oursAmt)}` : ''}${tpInternal ? ` · ${fmtNum(tpInternal)} Coates-truck load${tpInternal === 1 ? '' : 's'}, no carrier charge` : ''} · whether each carrier has invoiced is not on the record`, action: 'check', words: 'Accrue any load whose carrier invoice is not in by cut-off'});
 /* labour hire and Coates people from the month-end model */
 const fr = fin745Rows(todayIso()).filter(r => r.month === month);
 const hire = fr.filter(r => r.type === 'hire'), hirePaid = r2(hire.reduce((s, r) => s + (r.paid || 0), 0)), hireCost = r2(hire.reduce((s, r) => s + (r.calculatedCost != null ? r.calculatedCost : 0), 0)), hireUn = hire.filter(r => r.calculatedCost == null).length;
 const hireWho = [...new Set(hire.map(r => r.person))].join(', ');
 if (hire.length) out.costs.push({stream: 'Labour hire — the hours at their rates', branch: 'the job', incurred: hireCost, invoiced: null, accrue: hireCost, evidence: `${fmtNum(hirePaid)} paid hours in ${out.label} by ${hireWho}${hireUn ? ` · ${fmtNum(hireUn)} shift${hireUn === 1 ? '' : 's'} not priced` : ''} · the running sheet’s hourly pay rates · ${fr.filter(r => r.type === 'hire' && r.status === 'confirmed').length} of ${hire.length} shifts confirmed`, action: 'check', words: 'Accrue the weeks their invoice has not covered by cut-off'});
 const own = fr.filter(r => r.type !== 'hire'), ownPaid = r2(own.reduce((s, r) => s + (r.paid || 0), 0));
 if (own.length) out.costs.push({stream: 'Coates people — wages', branch: 'the job', incurred: null, invoiced: null, accrue: null, evidence: `${fmtNum(ownPaid)} paid hours in ${out.label} by ${[...new Set(own.map(r => r.person))].join(', ')} · ${fmtNum(own.filter(r => r.status === 'confirmed').length)} of ${fmtNum(own.length)} shifts confirmed · no cost rate on the record for Coates people`, action: 'none', words: 'Payroll — no accrual; hours for information'});
 /* accommodation, meals and expenses on the tracker */
 const oc = ourCosts().filter(x => x.usable && inM(x.date) && ['accommodation', 'meals', 'misc', 'expense', 'expenses'].includes(x.kind));
 const byKind = {}; oc.forEach(x => { const g = byKind[x.kind] = byKind[x.kind] || {n: 0, amount: 0, awaiting: 0}; g.n++; if (x.amount != null) g.amount = r2(g.amount + x.amount); else g.awaiting++; });
 const KW = {accommodation: 'Accommodation', meals: 'Meals away from home', misc: 'Other expenses', expense: 'Expenses', expenses: 'Expenses'};
 Object.entries(byKind).forEach(([kind, g]) => out.costs.push({stream: `${KW[kind] || kind} — on the tracker`, branch: 'the job', incurred: g.amount, invoiced: null, accrue: g.amount, evidence: `${fmtNum(g.n)} line${g.n === 1 ? '' : 's'} dated in ${out.label}${g.awaiting ? ` · ${fmtNum(g.awaiting)} with no figure yet` : ''} · cards and expense claims`, action: 'check', words: 'Accrue any not on a card statement or claim by cut-off'}));
 out.costAccrue = r2(out.costs.reduce((s, r) => s + (r.action === 'accrue' || r.action === 'check' ? (r.accrue || 0) : 0), 0));
 out.costDecide = r2(out.costs.reduce((s, r) => s + (r.action === 'decide' ? (r.accrue || 0) : 0), 0));
 out.invoiced = r2(out.costs.reduce((s, r) => s + (r.invoiced || 0), 0));
 /* ---- 3. paid ahead of the revenue: the WIP question */
 if (invoiced && fdAmt) { out.wip.push({what: `Fencing — ${sup}’s invoices in hand ${money0(invoiced)} against the fencing charge to the V8s ${money0(fdAmt)}, none of it billed by ${supBr} yet`, words: 'Finance’s call: accrue the fencing revenue for the month (matches the cost already paid), or hold the paid cost as WIP until the branch bills'}); out.decisions++; }
 else if (invoiced && !fdAmt) { out.wip.push({what: `Fencing — ${sup}’s invoices in hand ${money0(invoiced)} with no fencing docket dated in ${out.label}`, words: 'Finance’s call: which month the invoiced work belongs to'}); out.decisions++; }
 return out;
}
function acc761Labour(){
 const r2 = n => Math.round(n * 100) / 100, G = {install: 'install', steps: 'install', levelling: 'install', demob: 'install', cleaning: 'cleaning', fire_ext: 'fire_ext'};
 const LP = labourPlan(); const mk = () => ({charged: 0, expected: 0, tocome: 0, later: 0, n: 0});
 const groups = {install: mk(), cleaning: mk(), fire_ext: mk(), other: mk()}; const demob = mk();
 (LP.slots || []).forEach(sl => { const g = groups[G[sl.key] || 'other'], st = ['charged', 'expected', 'tocome', 'later'].includes(sl.state) ? sl.state : 'tocome', v = Number(sl.value) || 0; g[st] += v; g.n++; if (sl.key === 'demob') { demob[st] += v; demob.n++; } });
 const per = mk(); ['charged', 'expected', 'tocome', 'later'].forEach(st => { per[st] = Object.values(groups).reduce((s, g) => s + g[st], 0); }); per.n = (LP.slots || []).length;
 const fin = g => { g.total = r2(g.charged + g.expected + g.tocome + g.later); ['charged', 'expected', 'tocome', 'later'].forEach(st => { g[st] = r2(g[st]); }); };
 Object.values(groups).forEach(fin); fin(demob); fin(per);
 const c = moneySummary().charge || {}, scope = c.race && c.race.amount != null ? r2(c.race.amount) : null;
 /* the cost side: the running sheet's hours by month and kind of person, priced where a rate is on the record */
 const rows = fin745Rows(todayIso()); const months = {};
 rows.forEach(r => { const m = months[r.month] = months[r.month] || {cna: 0, salary: 0, hire: 0, hours: 0, cost: 0, unpriced: 0, shifts: 0, future: 0}; const h = Number(r.paid) || 0; m[r.type === 'hire' ? 'hire' : r.type === 'salary' ? 'salary' : 'cna'] += h; m.hours = r2(m.hours + h); m.shifts++; if (r.status === 'forecast') m.future++; if (r.calculatedCost != null) m.cost = r2(m.cost + r.calculatedCost); else m.unpriced = r2(m.unpriced + h); });
 const all = {cna: 0, salary: 0, hire: 0, hours: 0, cost: 0, unpriced: 0, shifts: 0, future: 0}; Object.values(months).forEach(m => Object.keys(all).forEach(k => { all[k] = r2(all[k] + m[k]); }));
 const T = trackerFigures(todayIso()); const race = T.race || {};
 return {groups, demob, per, scope, scopeHours: c.race && c.race.hours, months, all, raceHours: race.hours || 0, unpricedPeople: [...new Set(rows.filter(r => r.calculatedCost == null).map(r => r.person))]};
}
function acc761Text(X){
 const L = [`${DATA.event.name} · Accruals for Finance · work month ${X.label} · as at ${fmtDate(X.asAt)} · AUD ex GST`, 'Author: Andrew Fisher · from the GC500 record; proposals for Finance, nothing posted', ''];
 if (X.baseplan && X.baseplan.n) L.push(`Baseplan billing columns (export ${fmtDate(X.baseplan.supplied_on || X.asAt)}): ${fmtNum(X.baseplan.billed)} of ${fmtNum(X.baseplan.n)} contract lines billed${X.baseplan.billed ? '' : ' — no branch has billed yet'}`, '');
 L.push('1. REVENUE EARNED IN THE MONTH, NOT YET BILLED (accrued revenue / WIP) — ' + money0(X.revenueTotal));
 X.revenue.forEach(r => L.push(` • ${r.stream} · ${r.branch} · ${money0(r.amount)} — ${r.basis}. ${r.words}.`));
 if (!X.revenue.length) L.push(' • nothing earned in this month on the record');
 L.push('', '2. COSTS INCURRED IN THE MONTH — INVOICE IN, OR STILL TO COME (accrued expense)');
 X.costs.forEach(r => L.push(` • ${r.stream} · ${r.branch}${r.incurred != null ? ' · incurred ' + money0(r.incurred) : ''}${r.invoiced ? ' · invoiced ' + money0(r.invoiced) : ''}${r.accrue ? ' · to accrue ' + money0(r.accrue) : ''} — ${r.evidence}. ${r.words}.`));
 L.push(` To accrue: ${money0(X.costAccrue)}${X.costDecide ? ` · Finance’s decision: ${money0(X.costDecide)}` : ''} · supplier invoices recorded for the month: ${money0(X.invoiced)}`);
 if (X.wip.length) { L.push('', '3. PAID AHEAD OF THE REVENUE — THE WIP QUESTION'); X.wip.forEach(w => L.push(` • ${w.what}. ${w.words}.`)); }
 try { const LB = acc761Labour(); L.push('', '4. LABOUR — THE FORECAST, BOTH SIDES (whole job)');
 const g = (n, x) => ` • ${n}: ticked so far ${money0(x.charged)} · expected on site, not ticked ${money0(x.expected)} · to come ${money0(x.tocome)} · later (demob, cleaning) ${money0(x.later)} · forecast ${money0(x.total)}`;
 L.push(g('Labour Install (install, steps, levelling, demob)', LB.groups.install), g('Cleaning (not labour)', LB.groups.cleaning), g('Fire extinguishers (a hire charge)', LB.groups.fire_ext), g('Per piece, from the card', LB.per));
 if (LB.scope != null) L.push(` • Event labour — the scope: ${money0(LB.scope)} for ${fmtNum(LB.scopeHours || 0)} h over the three race days`);
 L.push(` Labour to charge, all in: ${money0(LB.per.total + (LB.scope || 0))} (Labour Install + the scope ${money0(LB.groups.install.total + (LB.scope || 0))})`);
 L.push(' Labour cost — hours on the running sheet: ' + Object.keys(LB.months).sort().map(mo => `${fin745MonthLabel(mo)} ${fmtNum(LB.months[mo].hours)} h${LB.months[mo].cost ? ' (' + money0(LB.months[mo].cost) + ' priced)' : ''}`).join(' · ') + ` · whole job ${fmtNum(LB.all.hours)} h, priced ${money0(LB.all.cost)} (labour hire only), ${fmtNum(LB.all.unpriced)} h with no wage rate — PARTIAL`); } catch (e) {}
 L.push('', 'Terms: accrual = book it in the month the work happened, invoice to follow · unbilled revenue / WIP = work done, not yet invoiced to the customer · deferral / prepayment = paid now, belongs to a later month · reclass = move a cost to the right branch or code · reversing accrual = booked now, unwound when the invoice posts · cut-off = the month-end line.');
 return L.join('\n');
}
function acc761Csv(X){
 const rows = [['Author: Andrew Fisher'], [`${DATA.event.name} — Accruals for Finance — proposals only, nothing posted`], ['Work month', X.month], ['As at', X.asAt], [],
 ['Baseplan contract lines billed', X.baseplan ? X.baseplan.billed : '', 'of', X.baseplan ? X.baseplan.n : '', 'export', X.baseplan ? X.baseplan.supplied_on : ''], [],
 ['Section', 'Stream', 'Branch', 'Incurred / earned AUD ex GST', 'Supplier invoices recorded AUD', 'To accrue AUD', 'Basis / evidence', 'What Finance does']];
 X.revenue.forEach(r => rows.push(['Revenue earned, not yet billed', r.stream, r.branch, r.amount, '', r.amount, r.basis, r.words]));
 X.costs.forEach(r => rows.push(['Cost incurred', r.stream, r.branch, r.incurred, r.invoiced, r.accrue, r.evidence, r.words]));
 X.wip.forEach(w => rows.push(['Paid ahead of the revenue', w.what, '', '', '', '', '', w.words]));
 try { const LB = acc761Labour(); rows.push([], ['Labour to charge — forecast', 'Kind', '', 'Ticked so far', 'Expected on site', 'To come', 'Later (demob, cleaning)', 'Forecast']);
 [['Labour Install', LB.groups.install], ['Cleaning', LB.groups.cleaning], ['Fire extinguishers', LB.groups.fire_ext], ['Per piece, from the card', LB.per]].forEach(([n, x]) => rows.push(['Labour to charge — forecast', n, '', x.charged, x.expected, x.tocome, x.later, x.total]));
 if (LB.scope != null) rows.push(['Labour to charge — forecast', 'Event labour — the scope', 'the job', '', '', LB.scope, '', LB.scope]);
 rows.push([], ['Labour cost — hours', 'Month', 'Coates CNA h', 'Salary h', 'Labour hire h', 'All hours', 'Priced cost AUD (labour hire)', 'Hours with no wage rate']);
 Object.keys(LB.months).sort().forEach(mo => { const r = LB.months[mo]; rows.push(['Labour cost — hours', mo, r.cna, r.salary, r.hire, r.hours, r.cost, r.unpriced]); }); rows.push(['Labour cost — hours', 'whole job', LB.all.cna, LB.all.salary, LB.all.hire, LB.all.hours, LB.all.cost, LB.all.unpriced]); } catch (e) {}
 rows.push([], ['Revenue earned, not yet billed', '', '', X.revenueTotal], ['Costs to accrue', '', '', '', '', X.costAccrue], ['Costs for Finance’s decision', '', '', '', '', X.costDecide], ['Supplier invoices recorded for the month', '', '', '', X.invoiced]);
 return rows.map(r => r.map(fin745CsvCell).join(',')).join('\r\n');
}
function acc761Html(){
 let X; try { X = acc761Model(acc761Month()); } catch (e) { return `<section id="accruals761" class="fin745 acc761"><p class="fin745-eyebrow">ACCRUALS FOR FINANCE</p><p>The accrual schedule could not be worked out from this record: ${esc(String(e && e.message || e))}</p></section>`; }
 const months = acc761Months(), m = v => v == null ? '—' : esc(money0(v));
 const badge = a => a === 'accrue' ? '<span class="acc761-b acc761-b-accrue">Accrue</span>' : a === 'decide' ? '<span class="acc761-b acc761-b-decide">Finance’s call</span>' : a === 'check' ? '<span class="acc761-b acc761-b-check">Check the invoice</span>' : '<span class="acc761-b acc761-b-none">No accrual</span>';
 return `<section id="accruals761" class="fin745 acc761 nosfold" aria-labelledby="acc761Title">
 <div class="fin745-heading"><div><p class="fin745-eyebrow">ACCRUALS FOR FINANCE · ${esc(X.label.toUpperCase())} · AUD EX GST</p><h2 id="acc761Title">What belongs in ${esc(X.label)} but has not been billed or invoiced yet</h2><p>Revenue the job has earned that no branch has billed, costs we have incurred whose invoice is in or still to come, and the one WIP question — worked out from the record as at ${esc(fmtDate(X.asAt))}. Proposals for Finance; nothing is posted from here.</p></div>
 <div class="fin745-tools"><label for="acc761Month">Work month</label><select id="acc761Month" data-ro title="Pick the work month — this changes nothing on the record">${months.map(v => `<option value="${esc(v)}"${v === X.month ? ' selected' : ''}>${esc(fin745MonthLabel(v))}</option>`).join('')}</select><div><button type="button" class="btn ghost sm" data-a761="copy">Copy for Finance</button><button type="button" class="btn ghost sm" data-a761="csv">Export accruals CSV</button></div></div></div>
 <div class="fin745-metrics acc761-metrics">
 ${fin745Card('Revenue earned, not yet billed', money0(X.revenueTotal), X.revenue.length ? `${fmtNum(X.revenue.length)} stream${X.revenue.length === 1 ? '' : 's'} · accrued revenue / WIP until the branches bill` : 'nothing earned in this month on the record')}
 ${fin745Card('Costs incurred, invoice still to come', money0(X.costAccrue), 'to accrue · dockets, loads, hours and expenses in the month, less the supplier invoices recorded')}
 ${fin745Card('Supplier invoices recorded for the month', money0(X.invoiced), 'on the purchase orders · what is already in Finance’s hands')}
 ${fin745Card('For Finance’s decision', X.decisions ? `${fmtNum(X.decisions)} item${X.decisions === 1 ? '' : 's'}` : 'none', X.costDecide ? `${money0(X.costDecide)} of cost where the month split is Finance’s call` : 'the WIP question and any month split are Finance’s call')}
 </div>
 <p class="fin745-basis">Revenue and cost are never added together. Hire is pro rata by the days on hire in the month at the contract or card rate; the fencing is its dockets at the 2026 card; labour is what is ticked per piece on references that went in during the month; the hire over the three race days, the toilets’ servicing and the event labour scope sit in the event’s month. Added across every month, the revenue here is the P&amp;L’s Revenue to the cent.${X.baseplan && X.baseplan.n ? ` Baseplan’s own billing columns (export of ${esc(fmtDate(X.baseplan.supplied_on || X.asAt))}): <b>${esc(fmtNum(X.baseplan.billed))} of ${esc(fmtNum(X.baseplan.n))} contract lines billed</b>${X.baseplan.billed ? '' : ' — no branch has billed yet'}.` : ''}</p>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>1. Revenue earned in ${esc(X.label)}, not yet billed</h3><p>Accrued revenue, or WIP — Finance’s name for work done that no invoice has gone out for. Each line names the branch that will bill it.</p></div></div>
 <div class="fin745-table"><table><thead><tr><th>Stream</th><th>Branch</th><th class="num">Earned · ex GST</th><th>How it is worked out</th><th>What Finance does</th></tr></thead><tbody>
 ${X.revenue.length ? X.revenue.map(r => `<tr><td><b>${esc(r.stream)}</b></td><td>${esc(r.branch)}</td><td class="num">${m(r.amount)}</td><td class="acc761-why">${esc(r.basis)}</td><td>${badge(r.action)} <span class="acc761-w">${esc(r.words)}</span></td></tr>`).join('') : `<tr><td colspan="5">Nothing earned in ${esc(X.label)} on the record.</td></tr>`}
 ${X.revenue.length ? `<tr class="acc761-tot"><td colspan="2">Revenue earned, not yet billed</td><td class="num"><b>${m(X.revenueTotal)}</b></td><td colspan="2"></td></tr>` : ''}
 </tbody></table></div></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>2. Costs incurred in ${esc(X.label)} — invoice in, or still to come</h3><p>An accrued expense is a cost we have had the benefit of whose supplier invoice is not in yet. Incurred less invoiced is what to accrue; where the month split is not on the record, the line says so and leaves it to Finance.</p></div></div>
 <div class="fin745-table"><table><thead><tr><th>Cost</th><th>Branch</th><th class="num">Incurred</th><th class="num">Invoiced</th><th class="num">To accrue</th><th>Evidence</th><th>What Finance does</th></tr></thead><tbody>
 ${X.costs.length ? X.costs.map(r => `<tr${r.action === 'decide' ? ' class="acc761-dec"' : ''}><td><b>${esc(r.stream)}</b></td><td>${esc(r.branch)}</td><td class="num">${m(r.incurred)}</td><td class="num">${r.invoiced ? m(r.invoiced) : (r.invoiced === 0 ? '—' : '<span class="acc761-w">not on the record</span>')}</td><td class="num">${r.accrue ? m(r.accrue) : '—'}</td><td class="acc761-why">${esc(r.evidence)}</td><td>${badge(r.action)} <span class="acc761-w">${esc(r.words)}</span></td></tr>`).join('') : `<tr><td colspan="7">No cost dated in ${esc(X.label)} on the record.</td></tr>`}
 ${X.costs.length ? `<tr class="acc761-tot"><td colspan="3">To accrue${X.costDecide ? ' · and for Finance’s decision' : ''}</td><td class="num">${m(X.invoiced)}</td><td class="num"><b>${m(X.costAccrue)}</b>${X.costDecide ? `<br><span class="acc761-w">+ ${m(X.costDecide)} Finance’s call</span>` : ''}</td><td colspan="2"></td></tr>` : ''}
 </tbody></table></div></div>
 ${X.wip.length ? `<div class="fin745-block acc761-wip"><div class="fin745-blockhead"><div><h3>3. Paid ahead of the revenue — the WIP question</h3><p>Where we have paid a supplier before the branch has billed the V8s, the month shows the cost without its revenue unless Finance either accrues the revenue or holds the cost as WIP.</p></div></div>
 ${X.wip.map(w => `<p class="acc761-wipline"><b>${esc(w.what)}.</b> ${esc(w.words)}.</p>`).join('')}</div>` : ''}
 ${(() => { const L = acc761Labour(), m = v => v ? esc(money0(v)) : '—', h = v => esc(fin745Hours(v)); const sel = X.month;
 const row = (label, g, sub) => `<tr><td><b>${label}</b>${sub ? `<br><span class="acc761-w">${sub}</span>` : ''}</td><td class="num">${m(g.charged)}</td><td class="num">${m(g.expected)}</td><td class="num">${m(g.tocome)}</td><td class="num">${m(g.later)}</td><td class="num"><b>${m(g.total)}</b></td></tr>`;
 const allIn = L.per.total + (L.scope || 0), installPlusScope = L.groups.install.total + (L.scope || 0);
 return `<div class="fin745-block acc761-labour"><div class="fin745-blockhead"><div><h3>Labour — the forecast, both sides</h3><p>What we will charge for labour (per piece from the card, ticked as it is done, plus the hourly scope over the event) and what the labour costs us (the running sheet’s hours, priced only where a rate is on the record). Whole job, not one month; the month chosen above is highlighted in the hours.</p></div></div>
 <h4 class="acc761-h4">Labour to charge — the forecast</h4>
 <div class="fin745-table"><table><thead><tr><th>Labour</th><th class="num">Ticked so far</th><th class="num">Expected on site, not ticked</th><th class="num">To come</th><th class="num">Later — demob, cleaning</th><th class="num">Forecast</th></tr></thead><tbody>
 ${row('Labour Install', L.groups.install, `install, steps, levelling and demob — the Labour Install code · demob ${esc(money0(L.demob.total))} of it`)}
 ${row('Cleaning', L.groups.cleaning, 'classed as cleaning, not labour')}
 ${row('Fire extinguishers', L.groups.fire_ext, 'a hire charge per piece')}
 ${L.groups.other.n ? row('Other', L.groups.other, '') : ''}
 <tr class="acc761-tot"><td>Per piece, from the card <span class="acc761-w">· ${esc(fmtNum(L.per.n))} lines</span></td><td class="num">${m(L.per.charged)}</td><td class="num">${m(L.per.expected)}</td><td class="num">${m(L.per.tocome)}</td><td class="num">${m(L.per.later)}</td><td class="num"><b>${m(L.per.total)}</b></td></tr>
 ${L.scope != null ? `<tr><td><b>Event labour — the scope</b><br><span class="acc761-w">${esc(fmtNum(L.scopeHours || 0))} h of people over the three race days + accommodation and travel · hourly, the only hourly labour charged</span></td><td class="num">—</td><td class="num">—</td><td class="num">${m(L.scope)}</td><td class="num">—</td><td class="num"><b>${m(L.scope)}</b></td></tr>` : ''}
 <tr class="acc761-tot acc761-grand"><td colspan="5">Labour to charge, all in <span class="acc761-w">· Labour Install + the scope ${esc(money0(installPlusScope))}; cleaning and fire extinguishers are not labour under the rule</span></td><td class="num"><b>${m(allIn)}</b></td></tr>
 </tbody></table></div>
 <h4 class="acc761-h4">Labour cost — the running sheet’s hours, by month</h4>
 <div class="fin745-table"><table><thead><tr><th>Month</th><th class="num">Coates CNA</th><th class="num">Salary</th><th class="num">Labour hire</th><th class="num">All hours</th><th class="num">Priced cost</th><th>Not priced</th></tr></thead><tbody>
 ${Object.keys(L.months).sort().map(mo => { const r = L.months[mo]; return `<tr${mo === sel ? ' class="acc761-sel"' : ''}><td><b>${esc(fin745MonthLabel(mo))}</b>${r.future ? `<br><span class="acc761-w">${esc(fmtNum(r.future))} of ${esc(fmtNum(r.shifts))} shifts still to come</span>` : ''}</td><td class="num">${h(r.cna)}</td><td class="num">${h(r.salary)}</td><td class="num">${h(r.hire)}</td><td class="num"><b>${h(r.hours)}</b></td><td class="num">${r.cost ? m(r.cost) : '—'}</td><td class="acc761-w">${r.unpriced ? esc(fin745Hours(r.unpriced)) + ' with no wage rate' : 'all priced'}</td></tr>`; }).join('')}
 <tr class="acc761-tot"><td>Whole job <span class="acc761-w">· ${esc(fmtNum(L.all.shifts))} shifts · ${esc(fin745Hours(L.raceHours))} of them over the race weekend</span></td><td class="num">${h(L.all.cna)}</td><td class="num">${h(L.all.salary)}</td><td class="num">${h(L.all.hire)}</td><td class="num"><b>${h(L.all.hours)}</b></td><td class="num"><b>${L.all.cost ? m(L.all.cost) : '—'}</b></td><td class="acc761-w">${L.all.unpriced ? esc(fin745Hours(L.all.unpriced)) + ' with no wage rate — PARTIAL' : 'all priced'}</td></tr>
 </tbody></table></div>
 <p class="fin745-basis">The priced cost is the labour hire at the running sheet’s hourly pay rates. ${L.unpricedPeople.length ? `No wage rate is on the record for ${esc(L.unpricedPeople.join(', '))}, so the Coates people’s cost cannot be forecast until one is set (Set cost rate, above).` : ''} Labour to charge and labour cost are two sides of the ledger and are never added together.</p></div>`; })()}
 <details class="acc761-gloss"><summary>The words Finance use, in plain English</summary><dl>
 <dt>Accrual</dt><dd>Book the cost or revenue in the month the work happened; the invoice catches up later. “Please accrue it in September.”</dd>
 <dt>Unbilled revenue · WIP</dt><dd>Work we have done that no invoice has gone out for yet. Held as work in progress until the branch bills.</dd>
 <dt>Accrued expense</dt><dd>A cost we have had the benefit of whose supplier invoice is not in yet — Advanced’s dockets before their invoice, a carrier’s load before their bill.</dd>
 <dt>Deferral · prepayment</dt><dd>Paid or invoiced now, but the work belongs to a later month, so it is carried forward.</dd>
 <dt>Reclass · allocation</dt><dd>Moving a cost already booked to the right branch or cost code — the toilets to KINP, the fencing to STPS.</dd>
 <dt>Reversing accrual · cut-off</dt><dd>An accrual Finance unwinds when the real invoice posts; cut-off is the month-end line — anything after it goes in the next month.</dd>
 </dl></details>
 <p class="fin745-basis acc761-foot">Author: Andrew Fisher · Accruals for Finance v7.61 · read from the record; the Finance journal proposals above are where a decision is recorded.</p>
 </section>`;
}
function acc761Bind(){
 const root = document.getElementById('accruals761'); if (!root) return;
 const sel = root.querySelector('#acc761Month'); if (sel) sel.onchange = () => { if (/^\d{4}-\d{2}$/.test(sel.value)) { ACC761_UI.month = sel.value; renderCosts(); } };
 root.querySelectorAll('[data-a761]').forEach(b => b.onclick = () => {
 const X = acc761Model(acc761Month());
 if (b.dataset.a761 === 'csv') return fin745Download('GC500_Accruals_' + X.month + '.csv', '﻿' + acc761Csv(X), 'text/csv;charset=utf-8');
 if (b.dataset.a761 === 'copy') { const text = acc761Text(X); const done = () => { try { flash('Copied for Finance — paste it into your email or note.'); } catch (e) {} };
 const fallback = () => { const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); if (ok) done(); else { try { flash('Could not copy — use Export accruals CSV instead.'); } catch (e) {} } };
 if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback(); }
 });
}
"""
i = t.find('function fin745Bind(){')
t = t[:i] + HELPERS.lstrip('\n') + t[i:]

# the section sits under Month-end control on the Costs tab, and is wired when the tab is drawn
t = rep(t, "${pl752Card()}\n ${fin745Html()}", "${pl752Card()}\n ${fin745Html()}\n ${acc761Html()}", 'costs pane mount', p, True)
t = rep(t, "const result = holdAssets(renderCosts_held);\n fin745Bind();\n return result;", "const result = holdAssets(renderCosts_held);\n fin745Bind();\n acc761Bind();\n return result;", 'renderCosts bind', p, True)

# a little style: badges, the decision rows, the glossary, the phone
CSS = (".acc761 .fin745-tools select{width:100%;margin-bottom:8px;font:inherit;border:1px solid #a8b6bf;border-radius:6px;padding:9px;background:#fff;color:#17272e}"
 ".acc761-b{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:999px;white-space:nowrap;margin-right:6px}"
 ".acc761-b-accrue{background:#fde8d8;color:#9c470c}.acc761-b-decide{background:#e6ecf7;color:#2b4a8a}.acc761-b-check{background:#fff4d8;color:#655223}.acc761-b-none{background:#e8edf0;color:#52636e}"
 ".acc761-w{font-size:12px;color:#52636e}.acc761-why{font-size:12px;color:#3a4a52;line-height:1.45;max-width:420px}.acc761 td.num,.acc761 th.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}"
 ".acc761-tot td{background:#f2f5f7;font-weight:600}.acc761-dec td{background:#f7f9fd}.acc761-wip{border-left:4px solid #2b4a8a}.acc761-wipline{font-size:14px;line-height:1.55;margin:8px 0}"
 ".acc761-gloss{margin-top:16px;border:1px solid #d2dce1;border-radius:9px;background:#fff;padding:12px 16px}.acc761-gloss summary{cursor:pointer;font-weight:700;font-size:14px}.acc761-gloss dl{display:grid;grid-template-columns:minmax(140px,200px) 1fr;gap:8px 16px;margin:12px 0 4px;font-size:13px;line-height:1.5}.acc761-gloss dt{font-weight:700;color:#17272e}.acc761-gloss dd{margin:0;color:#3a4a52}"
 ".acc761-foot{margin-top:14px}.acc761-h4{font-size:14px;margin:14px 0 4px;color:#17272e}.acc761-sel td{background:#fff4d8}.acc761-grand td{border-top:2px solid #cbd3d7}"
 "@media (max-width:760px){.acc761-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.acc761 .fin745-heading{flex-direction:column}.acc761 .fin745-tools{flex:1 1 auto;width:100%}.acc761-gloss dl{grid-template-columns:1fr}.acc761-why{max-width:none}}")
t = rep(t, ".fin745-basis{font-size:12px;color:#52636e;line-height:1.5!important}", ".fin745-basis{font-size:12px;color:#52636e;line-height:1.5!important}" + CSS, 'accruals style', p, True)

open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
