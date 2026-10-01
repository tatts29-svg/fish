/* v7.63 - ACCRUALS FOR FINANCE, IN ANDREW'S WORDS (1 Oct 2026). The display layer over Codex's v7.62 model: the same
   figures, status (planned / to review), unknowns kept as unknowns, Brisbane-day stamps, the unallocated lists and the
   people-days-hours table - said plainly, with the three things Finance act on: accrue, check, or decide. A "to accrue"
   figure here is a proposal for Finance, never a posting; the caveat is said once, under the tiles, not on every row. */
function acc762FmtMoney(n){ return typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('en-AU', {style: 'currency', currency: 'AUD', minimumFractionDigits: 2, maximumFractionDigits: 2}) : 'Not confirmed'; }
function acc762RowStatus(r){ return r.extra && r.extra.status || 'review'; }
function acc762RowAmount(r){ return r.candidate != null ? r.candidate : r.amount; }
function acc762People(L, month){ return (L.people || []).filter(p => p.month === month); }
/* money the way the page says it elsewhere: whole dollars, a dash for nothing, "not priced" for unknown */
function acc763M(n){ return n == null ? 'not priced' : n === 0 ? '—' : money0(n); }
function acc763Future(X){ return X.month > X.asAt.slice(0, 7); }
/* what Finance does with a row: the one word, and the sentence */
function acc763Action(r, X){
 const st = acc762RowStatus(r), e = r.extra || {}, amt = r.kind === 'revenue' ? r.amount : r.candidate, fa = Number(e.forecastAmount) || 0;
 if (st === 'forecast' || (acc763Future(X) && st !== 'confirmed') || (fa > 0 && amt != null && fa >= amt - 0.01)) return {key: 'planned', badge: 'Planned', toDate: 0, planned: amt || 0, words: /Revenue/.test(r.stream) ? 'Due when the branch bills it; nothing to accrue yet' : 'Planned, not yet incurred; nothing to accrue yet'};
 const act = acc763ActionNow(r, X, st, e); if (fa > 0 && amt != null) { act.toDate = Math.round((amt - fa) * 100) / 100; act.planned = Math.round(fa * 100) / 100; act.words = `${money0(act.toDate)} to date, ${money0(act.planned)} still planned — ${act.words.charAt(0).toLowerCase()}${act.words.slice(1)}`; act.part = true; } else { act.toDate = amt || 0; act.planned = 0; }
 return act;
}
function acc763ActionNow(r, X, st, e){
 if (r.kind === 'revenue') return {key: 'accrue', badge: 'Accrue', words: 'Accrue as unbilled revenue until the branch bills it'};
 const prov = e.provisionalAllocation || (e.sources || []).some(s => s.provisionalAllocation);
 if (prov) return {key: 'decide', badge: 'Finance’s call', words: `Accrue the ${X.label} share, or hold the whole quote to the event’s month with its revenue`};
 if (e.labourType === 'cna' || e.labourType === 'salary') return {key: 'none', badge: 'Payroll', words: 'Already through payroll; an allocation to the job only if Finance want it. No wage rate on the record yet, so hours not dollars'};
 if (e.labourType === 'hire') return {key: 'check', badge: 'Check the invoice', words: 'Accrue the weeks Job Connect’s invoice has not covered by cut-off'};
 if (/^Fencing/.test(r.stream) || /green book/.test(r.stream)) return r.accrue ? {key: 'accrue', badge: 'Accrue', words: `Accrue ${money0(r.accrue)} — dockets in hand, invoice still to come (a proposal; Finance match it to what is already posted)`} : (r.invoiced && r.invoiced >= (r.candidate || 0) ? {key: 'none', badge: 'Invoiced', words: 'Invoiced in full for the month — nothing to accrue'} : {key: 'check', badge: 'Check the invoice', words: 'Match Advanced’s invoices to the dockets before accruing'});
 if (/Transport/.test(r.stream)) return {key: 'check', badge: 'Check the invoice', words: 'Accrue any load whose carrier invoice is not in by cut-off'};
 return {key: 'check', badge: 'Check', words: 'Accrue anything not on a card statement or claim by cut-off'};
}
/* a short basis for a grouped row: how many lines, the first few names, the rule */
function acc763Basis(r, X){
 const e = r.extra || {}, S = e.sources || [], n = e.sourceCount || S.length || 0;
 const names = [...new Set(S.map(s => s.description || s.ref || s.id || s.quote || '').filter(Boolean))];
 const few = names.slice(0, 4).join(', ') + (names.length > 4 ? ', …' : '');
 const kind = /hours/.test(r.stream) ? null : /green book/.test(r.stream) ? 'service note' : /Toilets/.test(r.stream) ? 'quote' : /docket/i.test(r.stream) ? 'docket' : /load|Transport —/.test(r.stream) ? 'load' : /tick|per-piece/i.test(r.stream) ? 'tick' : /tracker/.test(r.stream) ? 'line' : /Event scope|Toilet servicing/.test(r.stream) ? null : 'contract line';
 const lines = n && kind ? `${fmtNum(n)} ${kind}${n === 1 ? '' : 's'}` : '';
 let rule = '';
 if (/daily contract/.test(r.stream)) rule = `the rate a day × the days on hire in ${X.label}`;
 else if (/event allocation|event forecast/.test(r.stream)) rule = 'the whole-event rate, in the event’s month';
 else if (/Transport Revenue/.test(r.stream)) rule = 'the price on the line, in the month it went in';
 else if (/Fencing Revenue/.test(r.stream)) rule = 'dockets at the 2026 card · hire and installation in one card rate';
 else if (/per-piece/.test(r.stream)) rule = 'the card’s per-piece rates · dated by the day the reference went in';
 else if (/Fencing — supplier/.test(r.stream)) rule = 'Advanced’s dockets at their own sheet · a cost worked out from the dockets, not their invoice';
 else if (/green book/.test(r.stream)) rule = 'Advanced’s labour and truck hours, dated by the service notes · inside the fencing card rate on the revenue side';
 else if (/Toilets/.test(r.stream)) rule = (S[0] && S[0].basis) || 'the quote, day-share by the hire dates';
 else if (/Transport —/.test(r.stream)) rule = 'the schedule’s TPORT COST column' + (S.some(s => s.lowerBound) ? ' · some marked “and more” — a floor' : '');
 else if (/Labour hire|allocation —/.test(r.stream)) { const g = e.labour || {}; rule = `${fmtNum(g.paid || 0)} paid hours across ${fmtNum(g.rows || 0)} shift${g.rows === 1 ? '' : 's'}${g.unpricedHours ? ` · ${fmtNum(g.unpricedHours)} h with no rate` : ''}${g.actualCost ? ` · ${money0(g.actualCost)} verified` : ''}`; }
 else if (/tracker/.test(r.stream)) rule = 'cards and expense claims';
 else if (/Event scope/.test(r.stream)) rule = `${fmtNum((e.hours || (S[0] && S[0].hours)) || 0)} h of people over the three race days + accommodation and travel`;
 else rule = (S[0] && S[0].basis) || r.basis || '';
 const unpriced = e.unpricedCount && !/hours/.test(r.stream) ? ` · ${fmtNum(e.unpricedCount)} not priced` : '';
 return [lines, few && !/hours|tracker|Event scope|Toilet servicing|Toilets/.test(r.stream) ? `(${few})` : '', rule].filter(Boolean).join(' ') + unpriced;
}
/* the plain name of a stream */
function acc763Name(stream){
 return stream.replace(' — daily contract allocation', ' from the day it goes in').replace(' — event allocation', ' over the three race days').replace(' — contract allocation', ' — the delivery and transport lines')
 .replace('Toilet Rehire Revenue', 'Toilets — Event Portables rehire at our rates').replace('Fencing Revenue — dated docket estimate', 'Fencing — Rehire Revenue, dockets at the 2026 card').replace(' — recorded per-piece work', ' ticked per piece')
 .replace('Toilet servicing — event forecast', 'Toilet servicing and cleaning — Rehire Revenue at our pump-out rates').replace('Event scope — people, accommodation and travel', 'Event labour — the scope')
 .replace('Fencing — supplier docket estimate', 'Fencing — Advanced Temporary Fencing, rehire cost').replace('Installation — external contractors, green book', 'Fencing — Advanced’s labour and truck hours (the green book)')
 .replace('Toilets — supplier quote, provisional day-share', 'Toilets — Event Portables, rehire cost').replace('Transport — schedule estimate', 'Transport (cartage) — carriers’ charges').replace('Transport — typed cost', 'Transport (cartage) — our own lines')
 .replace(' — tracker source', ' — on the tracker').replace('Coates CNA allocation — ', 'Coates CNA — ').replace('Coates salary allocation — ', 'Coates salary — ').replace('Labour hire — ', 'Labour hire (Job Connect) — ');
}
function acc763Rows(X){
 X.revenue.forEach(r => { r.kind = 'revenue'; }); X.costs.forEach(r => { r.kind = 'cost'; });
 return {rev: X.revenue.map(r => Object.assign({}, r, {name: acc763Name(r.stream), act: acc763Action(r, X), why: acc763Basis(r, X)})),
 cost: X.costs.map(r => Object.assign({}, r, {name: acc763Name(r.stream), act: acc763Action(r, X), why: acc763Basis(r, X)}))};
}
function acc763Sums(X){
 const R = acc763Rows(X), r2 = n => Math.round(n * 100) / 100;
 const revAccrue = r2(R.rev.filter(r => r.act.key === 'accrue').reduce((s, r) => s + (r.act.toDate || 0), 0)), revPlanned = r2(R.rev.reduce((s, r) => s + (r.act.planned || 0), 0));
 const toAccrue = r2(R.cost.filter(r => r.act.key === 'accrue' || r.act.key === 'check').reduce((s, r) => s + (r.accrue != null ? Math.max(0, r.accrue - (r.act.planned || 0)) : (r.act.toDate || 0)), 0));
 const decide = r2(R.cost.filter(r => r.act.key === 'decide').reduce((s, r) => s + (r.act.toDate || 0), 0));
 const planned = r2(R.cost.reduce((s, r) => s + (r.act.planned || 0), 0));
 const decisions = R.cost.filter(r => r.act.key === 'decide').length + (X.wip || []).length;
 return {R, revAccrue, revPlanned, toAccrue, decide, planned, decisions, unallocated: (X.unallocatedRevenue || []).length + (X.unallocatedCosts || []).length};
}
function acc761Text(X){
 const L = acc761Labour(), S = acc763Sums(X), fut = acc763Future(X);
 const T = [`${DATA.event.name} · Accruals for Finance · work month ${X.label} · as at ${fmtDate(X.asAt)} · AUD ex GST`, 'Author: Andrew Fisher · from the GC500 record; proposals for Finance, nothing posted — Finance check each line against what is already in the ledger. No automatic accrual.', ''];
 if (X.baseplan && X.baseplan.n) T.push(`Baseplan billing columns (export ${X.baseplan.supplied_on ? fmtDate(X.baseplan.supplied_on) : 'date not supplied'}): ${fmtNum(X.baseplan.billed)} of ${fmtNum(X.baseplan.n)} contract lines billed${X.baseplan.billed ? '' : ' — no branch had billed at that date'}.`, '');
 T.push(`1. REVENUE ${fut ? 'DUE IN' : 'EARNED IN'} THE MONTH, NOT YET BILLED — ${money0(X.revenueTotal)}${S.revPlanned ? ` (of which planned ${money0(S.revPlanned)})` : ''}`);
 S.R.rev.forEach(r => T.push(` • ${r.name} · ${r.branch} · ${acc763M(r.amount)} · ${r.act.badge} — ${r.why}. ${r.act.words}.`));
 if (!S.R.rev.length) T.push(' • nothing in this month on the record');
 T.push('', `2. COSTS ${fut ? 'PLANNED FOR' : 'INCURRED IN'} THE MONTH — INVOICE IN, OR STILL TO COME`);
 S.R.cost.forEach(r => T.push(` • ${r.name} · ${r.branch} · ${r.candidate == null ? 'hours only, no rate' : money0(r.candidate)}${r.invoiced ? ' · invoices recorded ' + money0(r.invoiced) : ''}${r.accrue ? ' · to accrue ' + money0(r.accrue) : ''} · ${r.act.badge} — ${r.why}. ${r.act.words}.`));
 T.push(` To accrue (a proposal): ${money0(S.toAccrue)}${S.decide ? ` · Finance’s call: ${money0(S.decide)}` : ''}${S.planned ? ` · planned, not yet incurred: ${money0(S.planned)}` : ''} · supplier invoices recorded for the month: ${money0(X.invoiced)}`);
 T.push(' Accrual to post: not confirmed until Finance have matched these to the invoices, payments and postings already in the ledger.');
 const UA = (X.unallocatedRevenue || []).concat(X.unallocatedCosts || []);
 if (UA.length) { T.push('', '3. ON THE RECORD WITH NO DAY TO PUT IT IN'); UA.forEach(r => T.push(` • ${acc763Name(r.stream || r.what || '')} · ${r.branch || 'the job'} · ${acc763M(acc762RowAmount(r))} — ${r.basis || r.evidence || ''}`)); }
 if (X.wip && X.wip.length) { T.push('', `${UA.length ? 4 : 3}. PAID AHEAD OF THE REVENUE — THE WIP QUESTION`); X.wip.forEach(w => T.push(` • ${w.what}. ${w.words}.`)); }
 T.push('', 'LABOUR — THE FORECAST, BOTH SIDES (whole job)');
 const g = (n, x) => ` • ${n}: ticked so far ${money0(x.charged)} · expected on site, not ticked ${money0(x.expected)} · to come ${money0(x.tocome)} · later (demob, cleaning) ${money0(x.later)} · forecast ${money0(x.total)}${x.unpriced ? ` · ${fmtNum(x.unpriced)} lines not priced — partial` : ''}`;
 T.push(g('Labour Install (install, steps, levelling, demob)', L.groups.install), g('Cleaning (not labour)', L.groups.cleaning), g('Fire extinguishers (a hire charge)', L.groups.fire_ext), g('Per piece, from the card', L.per));
 T.push(` • Event labour — the scope: people ${acc763M(L.scopePeople)} for ${fmtNum(L.scopeHours || 0)} h over the three race days + accommodation and travel ${acc763M(L.scopeSupport)} = ${acc763M(L.scope)}`);
 T.push(` Labour-only forecast: ${money0(L.labourOnlyTotal)} (Labour Install + the event people)${L.labourOnlyComplete ? '' : ' — partial'} · everything we charge for labour, cleaning, fire extinguishers and the scope: ${money0(L.packageTotal)}${L.packageComplete ? '' : ' — partial'}`);
 T.push(` Labour cost — hours on the running sheet: ${Object.keys(L.months).sort().map(mo => { const r = L.months[mo]; return `${fin745MonthLabel(mo)} ${fmtNum(r.hours)} h (confirmed ${fmtNum(r.confirmedPaidHours)}, awaiting ${fmtNum(r.pendingPaidHours)}, planned ${fmtNum(r.forecastPaidHours)})${r.cost ? ', priced ' + money0(r.cost) : ''}`; }).join(' · ')} · whole job ${fmtNum(L.all.hours)} h, priced ${money0(L.all.cost)} (labour hire only), ${fmtNum(L.all.unpriced)} h with no wage rate — PARTIAL`);
 T.push('', `PEOPLE, DAYS AND HOURS — ${X.label}`);
 acc762People(L, X.month).forEach(p => T.push(` • ${p.person} (${FIN745_WORDS[p.type] || p.type}) · ${fmtNum(p.dayCount)} day${p.dayCount === 1 ? '' : 's'} · ${fmtNum(p.grossHours)} h before breaks, ${fmtNum(p.hours)} h paid · confirmed ${fmtNum(p.confirmedPaidHours)} / awaiting ${fmtNum(p.pendingPaidHours)} / planned ${fmtNum(p.forecastPaidHours)} · cost ${p.unpricedCount === p.shifts && p.shifts > 0 ? 'no wage rate on the record' : money0(p.cost) + (p.unpriced ? ` (+ ${fmtNum(p.unpriced)} h unpriced)` : '')}`));
 T.push('', 'Terms: accrual = book it in the month the work happened, invoice to follow · unbilled revenue / WIP = work done, not yet invoiced to the customer · deferral / prepayment = paid now, belongs to a later month · reclass / allocation = move a cost to the right branch or code · reversing accrual = booked now, unwound when the invoice posts · cut-off = the month-end line. Planned = a future month, forecast only.');
 return T.join('\n');
}
function acc761Csv(X){
 const L = acc761Labour(), S = acc763Sums(X);
 const rows = [['Author: Andrew Fisher'], [`${DATA.event.name} — Accruals for Finance — proposals for Finance, nothing posted; no automatic accrual`], ['Work month', X.month], ['As at', X.asAt], ['Baseplan contract lines billed', X.baseplan ? X.baseplan.billed : '', 'of', X.baseplan ? X.baseplan.n : '', 'export', X.baseplan ? X.baseplan.supplied_on : ''], [],
 ['Section', 'Stream', 'Branch', 'Amount AUD ex GST', 'Invoices recorded AUD', 'To accrue (proposal) AUD', 'What Finance does', 'How it is worked out', 'Status']];
 S.R.rev.forEach(r => rows.push(['Revenue earned, not yet billed', r.name, r.branch, r.amount, '', r.act.key === 'accrue' ? r.amount : '', r.act.badge + ' — ' + r.act.words, r.why, acc762RowStatus(r)]));
 S.R.cost.forEach(r => rows.push(['Cost incurred', r.name, r.branch, r.candidate, r.invoiced, r.accrue != null ? r.accrue : (r.act.key === 'check' ? r.candidate : ''), r.act.badge + ' — ' + r.act.words, r.why, acc762RowStatus(r)]));
 (X.unallocatedRevenue || []).forEach(r => rows.push(['On the record, no day to put it in', acc763Name(r.stream || ''), r.branch, acc762RowAmount(r), '', '', 'Confirm the day before it goes in a month', r.basis || r.evidence || '', 'unallocated']));
 (X.unallocatedCosts || []).forEach(r => rows.push(['On the record, no day to put it in', acc763Name(r.stream || ''), r.branch, acc762RowAmount(r), '', '', 'Confirm the day before it goes in a month', r.evidence || r.basis || '', 'unallocated']));
 (X.wip || []).forEach(w => rows.push(['Paid ahead of the revenue', w.what, '', '', '', '', w.words, '', 'review']));
 rows.push([], ['Revenue earned, not yet billed', '', '', X.revenueTotal], ['Costs to accrue (proposal)', '', '', '', '', S.toAccrue], ['Costs for Finance’s decision', '', '', '', '', S.decide], ['Supplier invoices recorded for the month', '', '', '', X.invoiced], ['Accrual to post', 'Not confirmed until Finance match these to the ledger']);
 rows.push([], ['Labour to charge — forecast', 'Kind', '', 'Ticked so far', 'Expected on site', 'To come', 'Later (demob, cleaning)', 'Forecast', 'Lines not priced']);
 [['Labour Install', L.groups.install], ['Cleaning', L.groups.cleaning], ['Fire extinguishers', L.groups.fire_ext], ['Per piece, from the card', L.per]].forEach(([n, x]) => rows.push(['Labour to charge — forecast', n, '', x.charged, x.expected, x.tocome, x.later, x.total, x.unpriced]));
 rows.push(['Labour to charge — forecast', 'Event people', 'the job', '', '', L.scopePeople, '', L.scopePeople], ['Labour to charge — forecast', 'Event accommodation and travel', 'the job', '', '', L.scopeSupport, '', L.scopeSupport], ['Labour to charge — forecast', 'Labour only (Labour Install + event people)', '', '', '', '', '', L.labourOnlyTotal, L.labourOnlyComplete ? '' : 'partial'], ['Labour to charge — forecast', 'All listed charges', '', '', '', '', '', L.packageTotal, L.packageComplete ? '' : 'partial']);
 rows.push([], ['Labour cost — hours', 'Month', 'Paid hours', 'Confirmed paid hours', 'Awaiting confirmation paid hours', 'Forecast paid hours', 'Priced cost AUD', 'Hours with no wage rate']);
 Object.keys(L.months).sort().forEach(mo => { const r = L.months[mo]; rows.push(['Labour cost — hours', mo, r.hours, r.confirmedPaidHours, r.pendingPaidHours, r.forecastPaidHours, r.cost, r.unpriced]); });
 rows.push(['Labour cost — hours', 'whole job', L.all.hours, L.all.confirmedPaidHours, L.all.pendingPaidHours, L.all.forecastPaidHours, L.all.cost, L.all.unpriced]);
 rows.push([], ['Work month', 'Person', 'Type', 'Dates entered', 'Days entered', 'Hours before breaks', 'Paid hours', 'Confirmed paid hours', 'Awaiting confirmation paid hours', 'Forecast paid hours', 'Cost outlook AUD', 'Unpriced paid hours']);
 (L.people || []).forEach(p => rows.push([p.month, p.person, FIN745_WORDS[p.type] || p.type, p.dates.join('; '), p.dayCount, p.grossHours, p.hours, p.confirmedPaidHours, p.pendingPaidHours, p.forecastPaidHours, p.unpricedCount === p.shifts && p.shifts > 0 ? null : p.cost, p.unpriced]));
 return rows.map(r => r.map(v => fin745CsvCell(v == null ? '' : v)).join(',')).join('\r\n');
}
function acc761Html(){
 let X, L; try { X = acc761Model(acc761Month()); L = acc761Labour(); } catch (e) { return `<section id="accruals761" class="fin745 acc761"><p class="fin745-eyebrow">ACCRUALS FOR FINANCE</p><p>The accrual schedule could not be worked out from this record: ${esc(String(e && e.message || e))}</p></section>`; }
 const S = acc763Sums(X), fut = acc763Future(X), months = acc761Months(), m = v => esc(acc763M(v)), h = v => esc(fin745Hours(v || 0));
 const badge = a => `<span class="acc761-b acc761-b-${a.key === 'planned' ? 'planned' : a.key === 'none' ? 'none' : a.key}">${esc(a.badge)}</span>`;
 const UA = (X.unallocatedRevenue || []).concat(X.unallocatedCosts || []);
 const people = acc762People(L, X.month);
 const row = (label, g, sub) => `<tr><td><b>${label}</b>${sub ? `<br><span class="acc761-w">${sub}</span>` : ''}${g.unpriced ? `<br><span class="acc761-w">${esc(fmtNum(g.unpriced))} line${g.unpriced === 1 ? '' : 's'} not priced · partial</span>` : ''}</td><td class="num">${m(g.charged)}</td><td class="num">${m(g.expected)}</td><td class="num">${m(g.tocome)}</td><td class="num">${m(g.later)}</td><td class="num"><b>${m(g.total)}</b></td></tr>`;
 return `<section id="accruals761" class="fin745 acc761 nosfold" aria-labelledby="acc761Title">
 <div class="fin745-heading"><div><p class="fin745-eyebrow">ACCRUALS FOR FINANCE · ${esc(X.label.toUpperCase())} · AUD EX GST</p><h2 id="acc761Title">${fut ? `What is due in ${esc(X.label)} and what it will cost` : `What belongs in ${esc(X.label)} but has not been billed or invoiced yet`}</h2><p>${fut ? 'A month still to come: everything here is planned, from the schedule, the contracts and the running sheet. Nothing to accrue yet.' : 'Revenue the job has earned that no branch has billed, costs we have incurred whose invoice is in or still to come, and the one WIP question'} — from the record as at ${esc(fmtDate(X.asAt))}. Proposals for Finance; nothing is posted from here, and Finance match every line to what is already in the ledger first.</p></div>
 <div class="fin745-tools"><label for="acc761Month">Work month</label><select id="acc761Month" data-ro title="Pick the work month — this changes nothing on the record">${months.map(v => `<option value="${esc(v)}"${v === X.month ? ' selected' : ''}>${esc(fin745MonthLabel(v))}</option>`).join('')}</select><div><button type="button" class="btn ghost sm" data-a761="copy">Copy for Finance</button><button type="button" class="btn ghost sm" data-a761="csv">Export review CSV</button></div></div></div>
 <div class="fin745-metrics acc761-metrics">
 ${fin745Card(fut ? 'Revenue due, planned' : 'Revenue earned, not yet billed', money0(X.revenueTotal), S.R.rev.length ? `${fmtNum(S.R.rev.length)} stream${S.R.rev.length === 1 ? '' : 's'} · ${fut ? 'from the contracts and the schedule' : 'accrued revenue / WIP until the branches bill'}` : 'nothing in this month on the record')}
 ${fin745Card(fut ? 'Costs planned' : 'Costs incurred, invoice still to come', money0(fut ? S.planned : S.toAccrue), fut ? 'from the quotes, the schedule and the running sheet' : 'to accrue — a proposal · dockets, loads, hours and expenses in the month, less the supplier invoices recorded')}
 ${fin745Card('Supplier invoices recorded for the month', money0(X.invoiced), 'on the purchase orders · an invoice on the record, not proof of payment')}
 ${fin745Card('For Finance’s decision', S.decisions ? `${fmtNum(S.decisions)} item${S.decisions === 1 ? '' : 's'}` : 'none', S.decide ? `${money0(S.decide)} of cost where the month split is Finance’s call` : 'the WIP question and any month split are Finance’s call')}
 </div>
 <p class="fin745-basis">Revenue and cost are never added together. Hire is pro rata by the days on hire in the month at the contract or card rate; the fencing is its dockets at the 2026 card; labour is what is ticked per piece, dated by the day the reference went in; the hire over the three race days, the toilets’ servicing and the event labour scope sit in the event’s month. Added across every month the revenue is the P&amp;L’s Revenue to the cent. A “to accrue” figure is a proposal: Finance match it to the invoices, payments and postings already in the ledger before anything is booked — no automatic accrual, and a paid cost is never accrued twice.${X.baseplan && X.baseplan.n ? ` Baseplan’s own billing columns (export of ${esc(X.baseplan.supplied_on ? fmtDate(X.baseplan.supplied_on) : 'date not supplied')}): <b>${esc(fmtNum(X.baseplan.billed))} of ${esc(fmtNum(X.baseplan.n))} contract lines billed</b>${X.baseplan.billed ? '' : ' — no branch had billed at that date'}; that is a snapshot, not today’s unbilled balance.` : ''}</p>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>1. Revenue ${fut ? 'due' : 'earned'} in ${esc(X.label)}, not yet billed</h3><p>Accrued revenue, or WIP — Finance’s name for work done that no invoice has gone out for. Each line names the branch that will bill it.</p></div></div>
 <div class="fin745-table"><table><thead><tr><th>Stream</th><th>Branch</th><th class="num">${fut ? 'Due' : 'Earned'} · ex GST</th><th>How it is worked out</th><th>What Finance does</th></tr></thead><tbody>
 ${S.R.rev.length ? S.R.rev.map(r => `<tr><td><b>${esc(r.name)}</b></td><td>${esc(r.branch)}</td><td class="num">${m(r.amount)}</td><td class="acc761-why">${esc(r.why)}</td><td>${badge(r.act)} <span class="acc761-w">${esc(r.act.words)}</span></td></tr>`).join('') : `<tr><td colspan="5">Nothing in ${esc(X.label)} on the record.</td></tr>`}
 ${S.R.rev.length ? `<tr class="acc761-tot"><td colspan="2">Revenue ${fut ? 'due' : 'earned, not yet billed'}</td><td class="num"><b>${m(X.revenueTotal)}</b></td><td colspan="2"></td></tr>` : ''}
 </tbody></table></div></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>2. Costs ${fut ? 'planned for' : 'incurred in'} ${esc(X.label)} — invoice in, or still to come</h3><p>An accrued expense is a cost we have had the benefit of whose supplier invoice is not in yet. Incurred less the invoices recorded is the proposal to accrue; where the month split is not on the record, the line says so and leaves it to Finance. An invoice missing here may still be in Finance’s hands — match first.</p></div></div>
 <div class="fin745-table"><table><thead><tr><th>Cost</th><th>Branch</th><th class="num">${fut ? 'Planned' : 'Incurred'}</th><th class="num">Invoices recorded</th><th class="num">To accrue</th><th>Evidence</th><th>What Finance does</th></tr></thead><tbody>
 ${S.R.cost.length ? S.R.cost.map(r => `<tr${r.act.key === 'decide' ? ' class="acc761-dec"' : ''}><td><b>${esc(r.name)}</b></td><td>${esc(r.branch)}</td><td class="num">${r.candidate == null ? '<span class="acc761-w">hours only, no rate</span>' : m(r.candidate)}${r.extra && r.extra.unpricedCount && r.candidate != null ? '<br><span class="acc761-w">partial · some not priced</span>' : ''}</td><td class="num">${r.invoiced ? m(r.invoiced) : '<span class="acc761-w">none on the record</span>'}</td><td class="num">${r.act.key === 'accrue' || r.act.key === 'check' ? m(r.accrue != null ? Math.max(0, r.accrue - (r.act.planned || 0)) : r.act.toDate) : r.act.key === 'decide' ? `<span class="acc761-w">${m(r.act.toDate)} if accrued</span>` : '—'}${r.act.part ? `<br><span class="acc761-w">+ ${m(r.act.planned)} planned</span>` : ''}</td><td class="acc761-why">${esc(r.why)}</td><td>${badge(r.act)} <span class="acc761-w">${esc(r.act.words)}</span></td></tr>`).join('') : `<tr><td colspan="7">No cost dated in ${esc(X.label)} on the record.</td></tr>`}
 ${S.R.cost.length ? `<tr class="acc761-tot"><td colspan="3">${fut ? 'Planned, not yet incurred' : 'To accrue — a proposal'}${S.decide ? ' · and for Finance’s decision' : ''}</td><td class="num">${m(X.invoiced)}</td><td class="num"><b>${m(fut ? S.planned : S.toAccrue)}</b>${S.decide ? `<br><span class="acc761-w">+ ${m(S.decide)} Finance’s call</span>` : ''}</td><td colspan="2"><span class="acc761-w">Accrual to post: not confirmed until Finance have matched these to the ledger.</span></td></tr>` : ''}
 </tbody></table></div></div>
 ${UA.length ? `<div class="fin745-block acc761-ua"><div class="fin745-blockhead"><div><h3>${fut || !(X.wip && X.wip.length) ? 3 : 3}. On the record, with no day to put it in <span class="acc761-w">· ${esc(fmtNum(UA.length))}</span></h3><p>Work or cost that is on the record but carries no date the page can trust: the time a tick was entered is not a confirmed work date, and a quote or docket with no day stays here until one is confirmed. Kept visible so nothing is lost between the months.</p></div></div>
 <div class="fin745-table"><table><thead><tr><th>What</th><th>Branch</th><th class="num">Amount</th><th>What is missing</th></tr></thead><tbody>${UA.map(r => `<tr><td><b>${esc(acc763Name(r.stream || r.what || ''))}</b></td><td>${esc(r.branch || 'the job')}</td><td class="num">${m(acc762RowAmount(r))}</td><td class="acc761-why">${esc(r.basis || r.evidence || r.words || 'Confirm the day')}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
 ${X.wip && X.wip.length ? `<div class="fin745-block acc761-wip"><div class="fin745-blockhead"><div><h3>${UA.length ? 4 : 3}. Paid ahead of the revenue — the WIP question</h3><p>Where we have paid a supplier before the branch has billed the V8s, the month shows the cost without its revenue unless Finance either accrue the revenue or hold the cost as WIP. Finance confirm the paid amount and where it is already posted; the page does not know what has been paid, only what has been invoiced on the record.</p></div></div>
 ${X.wip.map(w => `<p class="acc761-wipline"><b>${esc(w.what)}.</b> ${esc(w.words)}.</p>`).join('')}</div>` : ''}
 <div class="fin745-block acc761-labour"><div class="fin745-blockhead"><div><h3>Labour — the forecast, both sides</h3><p>What we will charge for labour (per piece from the card, ticked as it is done, plus the hourly scope over the event) and what the labour costs us (the running sheet’s hours, priced only where a rate is on the record). Whole job, not one month; the month chosen above is highlighted in the hours.</p></div></div>
 <h4 class="acc761-h4">Labour to charge — the forecast</h4>
 <div class="fin745-table"><table><thead><tr><th>Labour</th><th class="num">Ticked so far</th><th class="num">Expected on site, not ticked</th><th class="num">To come</th><th class="num">Later — demob, cleaning</th><th class="num">Forecast</th></tr></thead><tbody>
 ${row('Labour Install', L.groups.install, `install, steps, levelling and demob — the Labour Install code${L.demob && L.demob.total ? ` · demob ${esc(money0(L.demob.total))} of it${L.demob.complete ? '' : ' (partial)'}` : ''}`)}
 ${row('Cleaning', L.groups.cleaning, 'classed as cleaning, not labour')}
 ${row('Fire extinguishers', L.groups.fire_ext, 'a hire charge per piece')}
 ${L.groups.other && L.groups.other.n ? row('Other', L.groups.other, '') : ''}
 <tr class="acc761-tot"><td>Per piece, from the card <span class="acc761-w">· ${esc(fmtNum(L.per.n))} lines${L.per.unpriced ? ` · ${esc(fmtNum(L.per.unpriced))} not priced` : ''}</span></td><td class="num">${m(L.per.charged)}</td><td class="num">${m(L.per.expected)}</td><td class="num">${m(L.per.tocome)}</td><td class="num">${m(L.per.later)}</td><td class="num"><b>${m(L.per.total)}</b></td></tr>
 <tr><td><b>Event labour — the people</b><br><span class="acc761-w">${esc(fmtNum(L.scopeHours || 0))} h over the three race days · hourly, the only hourly labour charged</span></td><td class="num">—</td><td class="num">—</td><td class="num">${m(L.scopePeople)}</td><td class="num">—</td><td class="num"><b>${m(L.scopePeople)}</b></td></tr>
 <tr><td><b>Event labour — accommodation and travel</b><br><span class="acc761-w">in the scope, not labour</span></td><td class="num">—</td><td class="num">—</td><td class="num">${m(L.scopeSupport)}</td><td class="num">—</td><td class="num"><b>${m(L.scopeSupport)}</b></td></tr>
 <tr class="acc761-tot acc761-grand"><td colspan="5">Labour-only forecast <span class="acc761-w">· Labour Install + the event people${L.labourOnlyComplete ? '' : ' · partial'}</span></td><td class="num"><b>${m(L.labourOnlyTotal)}</b></td></tr>
 <tr class="acc761-tot"><td colspan="5">Everything we charge for labour, cleaning, fire extinguishers and the scope${L.packageComplete ? '' : ' <span class="acc761-w">· partial, unpriced lines remain</span>'}</td><td class="num"><b>${m(L.packageTotal)}</b></td></tr>
 </tbody></table></div>
 <h4 class="acc761-h4">People, days and hours — ${esc(X.label)}</h4>
 <div class="fin745-table"><table><thead><tr><th>Person</th><th class="num">Days</th><th class="num">Before breaks</th><th class="num">Paid</th><th class="num">Confirmed</th><th class="num">Awaiting confirmation</th><th class="num">Planned</th><th class="num">Cost</th></tr></thead><tbody>
 ${people.length ? people.map(p => `<tr><td><b>${esc(p.person)}</b><br><span class="acc761-w">${esc(FIN745_WORDS[p.type] || p.type)} · ${p.dates.map(d => esc(d.slice(8))).join(', ')} ${esc(fin745MonthLabel(p.month))}</span></td><td class="num">${esc(fmtNum(p.dayCount))}</td><td class="num">${h(p.grossHours)}</td><td class="num">${h(p.hours)}</td><td class="num">${h(p.confirmedPaidHours)}</td><td class="num">${h(p.pendingPaidHours)}</td><td class="num">${h(p.forecastPaidHours)}</td><td class="num">${p.unpricedCount === p.shifts && p.shifts > 0 ? '<span class="acc761-w">no wage rate</span>' : m(p.cost)}${p.unpriced && !(p.unpricedCount === p.shifts) ? `<br><span class="acc761-w">${h(p.unpriced)} unpriced</span>` : ''}</td></tr>`).join('') : `<tr><td colspan="8">No running-sheet entries in ${esc(X.label)}.</td></tr>`}
 </tbody></table></div>
 <p class="fin745-basis">Days are person-days entered on the running sheet. Paid hours apply the break rules; they are not confirmed actuals until the timesheet review is done — the Confirmed / Awaiting confirmation / Planned columns say where each hour sits. The cost uses a verified actual where one is recorded, else the person’s cost rate.</p>
 <h4 class="acc761-h4">Labour cost — the running sheet’s hours, by month</h4>
 <div class="fin745-table"><table><thead><tr><th>Month</th><th class="num">Paid hours</th><th class="num">Confirmed</th><th class="num">Awaiting confirmation</th><th class="num">Planned</th><th class="num">Priced cost</th><th>Not priced</th></tr></thead><tbody>
 ${Object.keys(L.months).sort().map(mo => { const r = L.months[mo]; return `<tr${mo === X.month ? ' class="acc761-sel"' : ''}><td><b>${esc(fin745MonthLabel(mo))}</b></td><td class="num"><b>${h(r.hours)}</b></td><td class="num">${h(r.confirmedPaidHours)}</td><td class="num">${h(r.pendingPaidHours)}</td><td class="num">${h(r.forecastPaidHours)}</td><td class="num">${r.cost ? m(r.cost) : '—'}</td><td class="acc761-w">${r.unpriced ? esc(fin745Hours(r.unpriced)) + ' with no wage rate' : 'all priced'}</td></tr>`; }).join('')}
 <tr class="acc761-tot"><td>Whole job <span class="acc761-w">· ${esc(fmtNum(L.all.shifts))} shifts · ${h(L.raceHours)} of them over the race weekend</span></td><td class="num"><b>${h(L.all.hours)}</b></td><td class="num">${h(L.all.confirmedPaidHours)}</td><td class="num">${h(L.all.pendingPaidHours)}</td><td class="num">${h(L.all.forecastPaidHours)}</td><td class="num"><b>${L.all.cost ? m(L.all.cost) : '—'}</b></td><td class="acc761-w">${L.all.unpriced ? esc(fin745Hours(L.all.unpriced)) + ' with no wage rate — PARTIAL' : 'all priced'}</td></tr>
 </tbody></table></div>
 <p class="fin745-basis">The priced cost is the labour hire at the running sheet’s hourly pay rates. ${L.unpricedPeople && L.unpricedPeople.length ? `No wage rate is on the record for ${esc(L.unpricedPeople.join(', '))}, so the Coates people’s cost cannot be forecast until one is set (Set cost rate, above). Unpriced hours are excluded, so the outlook is partial while they remain.` : ''} Labour to charge and labour cost are two sides of the ledger and are never added together.</p></div>
 <details class="acc761-gloss"><summary>The words Finance use, in plain English</summary><dl>
 <dt>Accrual</dt><dd>Book the cost or revenue in the month the work happened; the invoice catches up later. “Please accrue it in September.” Finance reconcile the work, the invoices and what is already posted before they do.</dd>
 <dt>Unbilled revenue · WIP</dt><dd>Work we have done that no invoice has gone out for yet. Held as work in progress until the branch bills.</dd>
 <dt>Accrued expense</dt><dd>A cost we have had the benefit of whose supplier invoice is not in yet — Advanced’s dockets before their invoice, a carrier’s load before their bill.</dd>
 <dt>Deferral · prepayment</dt><dd>Paid or invoiced now, but the work belongs to a later month, so it is carried forward. Paying before the customer is billed does not by itself make a cost WIP; that is Finance’s call.</dd>
 <dt>Reclass · allocation</dt><dd>Moving a cost already booked to the right branch, job or code — the toilets to KINP, the fencing to STPS, the crew’s wages onto the job — without creating the cost twice.</dd>
 <dt>Reversing accrual · cut-off · planned</dt><dd>An accrual Finance unwind when the real invoice posts; cut-off is the month-end line — anything after it goes in the next month; planned is a future month, forecast only.</dd>
 </dl></details>
 <p class="fin745-basis acc761-foot">Author: Andrew Fisher · Accruals for Finance v7.63 · read from the record; decisions are recorded in the Finance journal proposals above. No ledger entries are posted by this view.</p>
 </section>`;
}
