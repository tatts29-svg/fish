/* Author: Andrew Fisher. v8.88 Transport: the Costs & P&L Transport view, and the "Everything reconciles" line on the P&L summary.
 * Every figure here is read from transport888Core / transport888View / recon888Model - the same model the Forecast P&L,
 * Costs to job end and the Finance handover read - so nothing is worked out twice. Facts only on the loads; a figure the
 * record does not carry stays "unconfirmed". The page already shows prices, so money is shown; nothing is typed here. */
const TR888_FILTERS = [['all', 'All'], ['figure', 'With a figure'], ['internal', 'Coates truck'], ['nofig', 'No figure yet'], ['inbound', 'Inbound'], ['demob', 'Demob'], ['unconfirmed', 'Branch unconfirmed']];
function tr888Filter(){ return state.tr888Filter || 'all'; }
function tr888Keep(r, f){
 if (f === 'all') return true; if (f === 'figure') return !!r.counted; if (f === 'internal') return !!(r.t && r.t.internal); if (f === 'nofig') return !r.t && !r.byOurLine;
 if (f === 'inbound') return r.leg === 'inbound'; if (f === 'demob') return r.leg === 'demob'; if (f === 'unconfirmed') return !r.branch; return r.branch === f;
}
function tr888Flags(r){
 const out = []; const a = r.a;
 if (a) { try { const w = crew883Transport(a); if (/oversize/i.test(w)) out.push({k: 'over', w: 'Oversize transport planning'}); else if (/sewage tank/i.test(w)) out.push({k: 'std', w: 'Standard-size item · sewage tank'}); } catch (e) {} }
 if (a && r.key && !r.standin) { try { const h = handling875Record(a); if (h && h.method) out.push({k: 'lift', w: handling875Words(h.method) + (h.source ? ' · from the schedule' : '')}); } catch (e) {} }
 else if (r.handlingSource && r.handlingSource.method) { try { out.push({k: 'lift', w: handling875Words(r.handlingSource.method) + ' · from the schedule'}); } catch (e) {} }
 if (r.key && !r.standin) { try { const d = loading872Record(r.key) || {}; const sides = [...new Set(Object.values(d).map(x => x && x.side).filter(Boolean))]; if (sides.length) out.push({k: 'door', w: sides.map(loading872Words).join(' · ')}); } catch (e) {} }
 if (r.key && r.date) { try { const plan = (S.loads || {})[crew883Key(r.date, r.key)]; if (plan && plan.people && plan.people.length) out.push({k: 'crew', w: plan.people.length + ' crew planned' + (plan.order ? ' · order ' + plan.order : '')}); } catch (e) {} }
 if (r.booking) { const b = r.booking; if (b.departure_order != null) out.push({k: 'dd', w: 'DD departure order ' + b.departure_order}); if ((b.loads || []).length > 1) out.push({k: 'dd', w: (b.loads || []).length + ' trucks booked'}); }
 if (r.time && r.time < '06:00') out.push({k: 'early', w: 'loads before 06:00'});
 if (r.e && r.e.date_correction) out.push({k: 'note', w: 'day corrected at the source'});
 if (r.off) out.push({k: 'off', w: 'taken off its day'});
 if (r.doubleCounted) out.push({k: 'bad', w: 'counted twice — see Everything reconciles'});
 return out;
}
function tr888LoadCell(r){
 if (r.src === 'fencing') return `<b>Fencing semi</b> <span class="acc761-w">${esc(r.location || 'Phillip Park')} · the fencing contractor’s gear, Coates organises the truck</span>`;
 const what = [r.qty ? r.qty + ' ×' : '', r.item].filter(Boolean).join(' ');
 if (r.key && r.a && !r.standin) return `<button class="linkish tr888-ref" data-open="${esc(r.key)}"><b>${esc(r.key)}</b></button>${what ? ` <span class="acc761-w">${esc(what)}</span>` : ''}`;
 const nums = (r.nums || (r.a && r.a.asset_numbers) || []).map(String);
 return `${r.key && r.a ? `<button class="linkish tr888-ref" data-open="${esc(r.key)}"><b>${esc(r.task || r.key)}</b></button>` : `<b class="mono">${esc(r.task)}</b>`} <span class="acc761-w">schedule row, no GC500 reference${what ? ' · ' + esc(what) : ''}${nums.length ? ' · ' + esc(nums.join(', ')) : ''}</span>`;
}
function tr888ChargeCell(r){
 if (r.byOurLine) return `<span class="acc761-w">our typed line stands in</span>`;
 if (!r.t) return `<span class="pl-todo" title="no TPORT COST on the schedule row yet">—</span>`;
 if (r.t.internal) return `<span class="tr888-int">Internal</span><br><span class="acc761-w">Coates truck, no carrier charge</span>`;
 if (r.t.amount == null) return `<span class="acc761-w">${esc(r.t.words)}</span>`;
 return `<b>${esc(money(r.t.amount))}</b>${r.t.plus ? ' <span class="tr888-plus" title="the workbook writes a plus after it: the figure and more, ex GST">+</span>' : ''}${r.counted ? '' : '<br><span class="acc761-w">not counted</span>'}`;
}
function tr888ForecastCell(r){
 const f = r.forecast || {kind: 'none'};
 if (f.kind === 'card') return f.amount ? `<b>${esc(money(f.amount))}</b><br><span class="acc761-w">the card’s transport cost, once a reference${f.loads > 1 ? ` · covers ${esc(fmtNum(f.loads))} loads` : ''}</span>` : `<span class="acc761-w">in the reference’s card figure</span>`;
 if (f.kind === 'average') return `<b>${esc(money(f.amount))}</b><br><span class="acc761-w">the average of the loads with a figure</span>`;
 if (f.kind === 'nonload') return `<span class="acc761-w">no basis — a non-equipment task</span>`;
 if (f.kind === 'planned') return `<span class="acc761-w">not forecast in the P&amp;L${r.demobCard ? ` · the card’s leg would be ${esc(money(r.demobCard))}` : ''}</span>`;
 return '—';
}
function tr888Html(){
 let V, R, DP; try { V = transport888View(); R = recon888Model(); DP = transport888DemobPlan(); } catch (e) { return `<section id="transport888" class="fin745 tr888 nosfold"><p class="fin745-eyebrow">TRANSPORT</p><p>Transport could not be worked out from this record: ${esc(String(e && e.message || e))}</p></section>`; }
 const T = V.T, tot = V.tot, m = v => v == null ? '—' : v === 0 ? '—' : esc(money(v)), m0 = v => v == null ? '—' : v === 0 ? '—' : esc(money0(v)), n = v => esc(fmtNum(v || 0));
 const cn = c => c === '—' ? 'Branch unconfirmed' : c;
 const trans = R.ties.filter(t => t.group === 'Transport'), transBad = trans.filter(t => !t.ok).length;
 const live = T.rows.filter(r => !r.cancelled), f = tr888Filter(), shown = live.filter(r => tr888Keep(r, f));
 const spread = (V.byBranch.find(b => b.code === '—') || {}).job || 0;
 const days = []; shown.forEach(r => { const k = r.date || 'no date'; let d = days.find(x => x.iso === k); if (!d) { d = {iso: k, rows: []}; days.push(d); } d.rows.push(r); });
 const dayHead = d => { const fig = d.rows.filter(r => r.counted).length, sum = d.rows.reduce((s, r) => s + (r.counted ? r.actual : 0), 0);
  return `<tr class="tr888-day"><th colspan="9"><span>${d.iso === 'no date' ? 'No date on the row' : esc(fmtDate(d.iso))}</span> <span class="acc761-w">· ${n(d.rows.length)} load${d.rows.length === 1 ? '' : 's'}${fig ? ` · ${n(fig)} with a figure, ${esc(money0(sum))}` : ''}</span>${d.iso !== 'no date' ? ` <button class="linkish" data-tr888-day="${esc(d.iso)}">Timeline</button>` : ''}</th></tr>`; };
 const row = r => { const fl = tr888Flags(r);
  return `<tr class="tr888-row${r.counted ? '' : ' tr888-nofig'}" data-tr888-row="${esc(r.id)}">
  <td data-l="Time"><div class="tr888-v">${r.time ? `<b>${esc(r.time)}</b>` : r.loadTime ? `<span class="acc761-w" title="as written on the schedule">${esc(r.loadTime)}</span>` : '—'}${r.time && r.loadTime && r.loadTime !== r.time ? `<br><span class="acc761-w">${esc(r.loadTime)}</span>` : ''}</div></td>
  <td data-l="Load"><div class="tr888-v">${tr888LoadCell(r)}</div></td>
  <td data-l="Leg"><div class="tr888-v">${r.leg === 'demob' ? 'Demob' : r.leg === 'event' ? 'Event' : 'Inbound'}<br><span class="acc761-w">${esc([r.phase, r.sheet].filter(Boolean).join(' · '))}</span></div></td>
  <td data-l="Carrier"><div class="tr888-v">${r.carrierText ? `<b>${esc(r.carriers.join(' / ') || r.carrierText)}</b>${r.carriers.join(' / ').toUpperCase() !== String(r.carrierText).toUpperCase() ? `<br><span class="acc761-w">${esc(r.carrierText)}</span>` : ''}` : r.t && r.t.internal ? 'Coates truck' : '<span class="pl-todo">not stated</span>'}</div></td>
  <td data-l="Docket"><div class="tr888-v">${r.dockets.length ? r.dockets.map(d => `<span class="mono">${esc(d)}</span>`).join('<br>') : '—'}${r.dd && !/^\d{8}$/.test(String(r.dd).trim()) && !/DD#\d{8}/i.test(String(r.dd)) ? `<br><span class="acc761-w">${esc(r.dd)}</span>` : ''}</div></td>
  <td data-l="Branch"><div class="tr888-v">${r.branch ? `<span class="chip ref mono" title="${esc(r.branchWhere === 'local' ? 'recorded on the page' : r.branchWhere === 'rental' ? 'the hire contract’s branch code' : r.branchWhere || '')}">${esc(r.branch)}</span>` : '<span class="pl-todo" title="no reference carries a branch for this load; it is not guessed">unconfirmed</span>'}</div></td>
  <td data-l="Flags"><div class="tr888-v">${fl.length ? fl.map(x => `<span class="tr888-flag tr888-flag-${esc(x.k)}">${esc(x.w)}</span>`).join(' ') : '<span class="acc761-w">—</span>'}</div></td>
  <td data-l="Charge" class="num"><div class="tr888-v">${tr888ChargeCell(r)}</div></td>
  <td data-l="Forecast" class="num"><div class="tr888-v">${tr888ForecastCell(r)}</div></td></tr>`; };
 const filters = TR888_FILTERS.concat(V.codes.map(c => [c, c])).map(([k, l]) => { const c = live.filter(r => tr888Keep(r, k)).length; return `<button class="btn tiny" data-tr888f="${esc(k)}" aria-pressed="${f === k}">${esc(l)} <span class="acc761-w">${n(c)}</span></button>`; }).join(' ');
 const planned = T.planned || [], plannedDemob = planned.filter(r => r.leg === 'demob'), plannedIn = planned.filter(r => r.leg !== 'demob');
 const notIn = T.demob.notInPl;
 return `<section id="transport888" class="fin745 tr888 nosfold" aria-labelledby="tr888Title">
 <div class="fin745-heading"><div><p class="fin745-eyebrow">TRANSPORT · AS AT ${esc(fmtDate(todayIso()).toUpperCase())} · AUD EX GST</p><h2 id="tr888Title">Every load, carrier, docket and charge — down to the branch</h2>
 <p>Every truck movement the schedule carries, with what Coates pays the carrier (Transport (cartage), a direct cost) and what is charged on (Transport Revenue, the contracts’ delivery and pickup lines). The figures are the Forecast P&amp;L’s, read from one model; the loads are the Timeline’s; the references are Equipment’s. A fact the record does not carry stays unconfirmed.</p></div>
 <div class="fin745-tools"><div><button type="button" class="btn ghost sm" data-tr888-act="csv">Export transport CSV</button><button type="button" class="btn ghost sm" data-tr888-go="summary">P&amp;L summary</button><button type="button" class="btn ghost sm" data-tr888-go="handover">Finance handover</button></div></div></div>
 <div class="fin745-metrics tr888-metrics">
 ${fin745Card('Transport (cartage) to date', money(tot.actual), `${n(tot.figure)} loads with a figure${T.schedT.plus ? ` (${n(T.schedT.plus)} written with a plus — the figure and more)` : ''} · ${n(tot.internal)} on a Coates truck · ${n(tot.noFig)} with no figure yet · the P&L’s direct cost`)}
 ${fin745Card('Still to come — forecast', money(tot.toCome), `the card’s transport cost once a reference for ${n(T.forecast.cardRefs)} references (${esc(money0(Math.round(T.forecast.cardCost * 100) / 100))}) + ${n(T.forecast.loadsNoFigNoCard)} loads with no reference or card line at the average so far${T.forecast.avg != null ? `, ${esc(money0(T.forecast.avg))} a load` : ''} · the Costs to job end figure`)}
 ${fin745Card('Transport Revenue on the contracts', money(V.revenueTotal), `${n(V.lines.length)} delivery and pickup charge lines · + ${esc(money0(V.provisionalTotal))} provisional transport to come, pending branch entry · 1030 · 1031`)}
 ${fin745Card('Loads on the schedule', n(tot.loads), `${n(tot.inbound)} inbound · ${n(tot.demob)} demob · ${n(V.byCarrier.filter(c => c.name !== 'Not stated' && c.name !== 'Coates truck').length)} carriers · ${n(plannedDemob.length)} demob legs and ${n(plannedIn.length)} other movements still to book`)}
 </div>
 <p class="fin745-basis">${transBad ? `<span class="fh866-todo">${esc(fmtNum(transBad))} of ${esc(fmtNum(trans.length))} transport tie-outs do not tie — see Everything reconciles on the P&amp;L summary.</span>` : `<span class="fh866-ok">Ties to the Forecast P&amp;L, Costs to job end, the business’s lines and the Finance handover — ${esc(fmtNum(trans.length))} tie-outs, all tied.</span>`} To date: every schedule row with a TPORT COST figure, at the figure written; Internal is a Coates truck; a reference with our own typed transport line uses that line. To come: the card’s transport cost once a reference where a load has no figure, the average for a load with no reference or card line. Branch: the branch on the load’s reference (the hire contracts put it on; a person’s record wins); a schedule row with no reference carries the branch recorded on its stand-in; otherwise unconfirmed, never guessed.</p>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>1. By branch</h3><p>What each branch’s loads carry — to date, to come and to job end — against the Finance handover’s split and the branch’s Transport Revenue. The branches and the unconfirmed loads add to the P&amp;L.</p></div></div>
 <div class="fin745-table tr888-table"><table class="tr888-stack"><thead><tr><th>Branch</th><th class="num">Loads</th><th class="num">With a figure</th><th class="num">Coates truck</th><th class="num">No figure</th><th class="num">To date</th><th class="num">Still to come</th><th class="num">To job end</th><th class="num">Handover split</th><th class="num">Transport Revenue</th><th class="num">Provisional to come</th></tr></thead><tbody>
 ${V.byBranch.map(b => `<tr><td data-l="Branch"><div class="tr888-v"><b>${esc(cn(b.code))}</b>${b.code === '—' ? '<br><span class="acc761-w">the fencing semis and the schedule rows with no reference or recorded branch</span>' : ''}</div></td><td data-l="Loads" class="num"><div class="tr888-v">${n(b.loads)}</div></td><td data-l="With a figure" class="num"><div class="tr888-v">${n(b.figure)}</div></td><td data-l="Coates truck" class="num"><div class="tr888-v">${n(b.internal)}</div></td><td data-l="No figure" class="num"><div class="tr888-v">${n(b.noFig)}</div></td><td data-l="To date" class="num"><div class="tr888-v">${m(b.actual)}</div></td><td data-l="Still to come" class="num"><div class="tr888-v">${m(b.toCome)}</div></td><td data-l="To job end" class="num"><div class="tr888-v"><b>${m(b.job)}</b></div></td><td data-l="Handover split" class="num"><div class="tr888-v">${b.handover == null ? '<span class="acc761-w">spread over the branches</span>' : m(b.handover)}</div></td><td data-l="Transport Revenue" class="num"><div class="tr888-v">${m(b.revenue)}</div></td><td data-l="Provisional to come" class="num"><div class="tr888-v">${m(b.provisional)}</div></td></tr>`).join('')}
 <tr class="acc761-tot"><td>Total</td><td class="num"><b>${n(tot.loads)}</b></td><td class="num"><b>${n(tot.figure)}</b></td><td class="num"><b>${n(tot.internal)}</b></td><td class="num"><b>${n(tot.noFig)}</b></td><td class="num"><b>${m(tot.actual)}</b></td><td class="num"><b>${m(tot.toCome)}</b></td><td class="num"><b>${m(tot.job)}</b></td><td class="num"><b>${m(tot.handover)}</b></td><td class="num"><b>${m(tot.revenue)}</b></td><td class="num"><b>${m(tot.provisional)}</b></td></tr>
 </tbody></table></div>
 <p class="fin745-basis">To date and to come are the P&amp;L’s Transport (cartage) figures${V.checks.toDate && V.checks.toCome ? ' to the cent' : ' — <span class="fh866-todo">they do not match today</span>'}. ${spread ? `The Finance handover spreads the ${esc(money0(spread))} on loads with no branch over the branches in proportion to the loads that have one, so its branch figures are higher by that share; the loads themselves are listed below as branch unconfirmed.` : 'Every load carries a branch, so the Finance handover’s split is the loads’ own.'} Transport Revenue is the contracts’ delivery and pickup lines by the branch on the contract; the provisional revenue to come is the Additional transport forecast on Costs to job end, by branch.</p></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>2. By carrier</h3><p>Who carried what, as the schedule names them. A figure written with a plus is the figure and more.</p></div></div>
 <div class="fin745-table tr888-table"><table class="tr888-stack"><thead><tr><th>Carrier</th><th class="num">Loads</th><th class="num">With a figure</th><th class="num">To date</th><th class="num">Written with a plus</th><th class="num">Coates truck</th><th class="num">No figure</th><th>First · last load</th><th>Branches</th><th>As the schedule writes it</th></tr></thead><tbody>
 ${V.byCarrier.map(c => `<tr><td data-l="Carrier"><div class="tr888-v"><b>${esc(c.name)}</b></div></td><td data-l="Loads" class="num"><div class="tr888-v">${n(c.loads)}</div></td><td data-l="With a figure" class="num"><div class="tr888-v">${n(c.figure)}</div></td><td data-l="To date" class="num"><div class="tr888-v"><b>${m(c.amount)}</b></div></td><td data-l="Written with a plus" class="num"><div class="tr888-v">${c.plus ? n(c.plus) : '—'}</div></td><td data-l="Coates truck" class="num"><div class="tr888-v">${c.internal ? n(c.internal) : '—'}</div></td><td data-l="No figure" class="num"><div class="tr888-v">${c.noFig ? n(c.noFig) : '—'}</div></td><td data-l="First · last load"><div class="tr888-v">${c.first ? esc(fmtDate(c.first)) + (c.last && c.last !== c.first ? ' · ' + esc(fmtDate(c.last)) : '') : '—'}</div></td><td data-l="Branches"><div class="tr888-v">${c.branches.length ? c.branches.map(b => `<span class="chip ref mono">${esc(b)}</span>`).join(' ') : '—'}</div></td><td data-l="As written" class="acc761-w">${esc(c.asWritten.join(', ') || '—')}</td></tr>`).join('')}
 <tr class="acc761-tot"><td>Total</td><td class="num"><b>${n(tot.loads)}</b></td><td class="num"><b>${n(tot.figure)}</b></td><td class="num"><b>${m(tot.actual)}</b></td><td class="num"><b>${T.schedT.plus ? n(T.schedT.plus) : '—'}</b></td><td class="num"><b>${n(tot.internal)}</b></td><td class="num"><b>${n(tot.noFig)}</b></td><td colspan="3"></td></tr>
 </tbody></table></div></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>3. Every load</h3><p>One row per schedule row with a carrier, a docket, a load time or a transport figure — the P&amp;L’s loads. Open the reference for its drawer; Timeline opens the day.</p></div></div>
 <div class="tr888-filters" role="group" aria-label="Filter the loads">${filters}</div>
 <div class="fin745-table tr888-table"><table class="tr888-register tr888-stack"><thead><tr><th>Time</th><th>Load</th><th>Leg</th><th>Carrier</th><th>Docket</th><th>Branch</th><th>Flags</th><th class="num">Charge as written</th><th class="num">Forecast</th></tr></thead><tbody>
 ${days.length ? days.map(d => dayHead(d) + d.rows.map(row).join('')).join('') : '<tr><td colspan="9">No load matches this filter.</td></tr>'}
 <tr class="acc761-tot"><td colspan="7">${f === 'all' ? 'Every load' : 'The loads shown'} <span class="acc761-w">· ${n(shown.length)} of ${n(live.length)}</span></td><td class="num"><b>${m(shown.reduce((s, r) => s + (r.counted ? r.actual : 0), 0))}</b></td><td class="num"><b>${m(shown.reduce((s, r) => s + ((r.forecast && (r.forecast.kind === 'card' || r.forecast.kind === 'average')) ? r.forecast.amount : 0), 0))}</b></td></tr>
 </tbody></table></div>
 <p class="fin745-basis">Times are load times at Coates Kingston, not arrivals on site; on the ground a truck is on the Gold Coast after ${esc((((DATA.transport || {}).arrival) || {}).after || '07:00')}, whatever its load time. Flags are the record’s own: the oversize planning category from crew planning, the unloading method and door side recorded on the reference, the crew planned for the day, the supplied DD departure order. ${T.OCL.length ? `${n(T.OCL.length)} transport line${T.OCL.length === 1 ? '' : 's'} of ours typed on Costs (${esc(money(T.OCL.filter(c => c.amount != null && !c.awaiting).reduce((s, c) => s + c.amount, 0)))}) ${T.OCL.length === 1 ? 'is' : 'are'} in the to-date figure beside the schedule’s loads.` : 'No transport line of ours is typed on Costs; every figure is the schedule’s.'}</p></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>4. Transport Revenue — the contracts’ delivery and pickup lines</h3><p>What is charged on, by the branch on the contract. ${V.provisionalTotal ? `A further ${esc(money0(V.provisionalTotal))} is provisional transport revenue to come, pending branch entry: ${V.byBranch.filter(b => b.provisional).map(b => `${esc(cn(b.code))} ${esc(money0(b.provisional))}`).join(' · ')} — <button class="linkish" data-tr888-go="forecast">the Additional transport forecast</button>.` : ''}</p></div></div>
 <div class="fin745-table tr888-table"><table class="tr888-stack"><thead><tr><th>Contract · line</th><th>Branch</th><th>What</th><th class="num">Qty</th><th class="num">Charge</th><th>Docket</th><th>Covers</th></tr></thead><tbody>
 ${V.lines.length ? V.lines.map(l => `<tr><td data-l="Contract · line"><div class="tr888-v"><b class="mono">${esc(l.contract)}</b> <span class="acc761-w">line ${esc(String(l.line))}</span></div></td><td data-l="Branch"><div class="tr888-v"><span class="chip ref mono">${esc(l.branch)}</span></div></td><td data-l="What"><div class="tr888-v">${esc(l.description)}</div></td><td data-l="Qty" class="num"><div class="tr888-v">${l.qty != null ? esc(fmtNum(l.qty)) : '—'}</div></td><td data-l="Charge" class="num"><div class="tr888-v"><b>${m(l.charge)}</b></div></td><td data-l="Docket"><div class="tr888-v">${l.docket ? `<span class="mono">${esc(String(l.docket))}</span>` : '—'}</div></td><td data-l="Covers" class="acc761-w">${l.covers.length ? l.covers.map(esc).join(', ') : 'not yet allocated to a reference — held in the forecast'}</td></tr>`).join('') : '<tr><td colspan="7">No transport charge line on the contracts yet.</td></tr>'}
 <tr class="acc761-tot"><td colspan="4">Transport Revenue on the record</td><td class="num"><b>${m(V.revenueTotal)}</b></td><td colspan="2" class="acc761-w">${V.checks.revenue ? 'the Forecast P&amp;L’s figure, to the cent' : '<span class="fh866-todo">does not equal the Forecast P&amp;L’s Transport Revenue</span>'}</td></tr>
 </tbody></table></div></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>5. Demob</h3><p>The demob legs the schedule carries, what the P&amp;L holds for them, and the Demob tab’s truck plan.</p></div></div>
 <ul class="tr888-list">
 <li><b>In the P&amp;L:</b> ${T.demob.total ? `${esc(money(T.demob.total))} of demob transport — ${n(tot.demob)} demob load${tot.demob === 1 ? '' : 's'} with a transport fact${Object.keys(T.demob.by).length ? ' (' + Object.entries(T.demob.by).map(([b, v]) => esc(cn(b)) + ' ' + esc(money0(v))).join(' · ') + ')' : ''}; the Finance handover’s demob forecast carries the same figure${Object.keys(T.demob.byKnown).length ? '' : ', spread over the branches in proportion'}.` : 'no demob leg carries a figure or a forecast yet.'}</li>
 <li><b>Not in the P&amp;L:</b> ${notIn.legs ? `${n(notIn.legs)} demob leg${notIn.legs === 1 ? '' : 's'} on ${n(notIn.refs)} reference${notIn.refs === 1 ? '' : 's'} carry no carrier, docket or figure and are not forecast. At the card’s transport cost, once a reference, they would be ${esc(money(notIn.total))}${Object.keys(notIn.by).length ? ' (' + Object.entries(notIn.by).map(([b, v]) => esc(cn(b)) + ' ' + esc(money0(v))).join(' · ') + ')' : ''} — named here and on Costs to job end, never added until Andrew says so.` : 'every demob leg is in the forecast.'}</li>
 <li><b>The Demob tab’s truck plan:</b> ${DP ? `${n(DP.trucks)} truck movements over ${n(DP.days.length)} days — ${n(DP.days.reduce((s, d) => s + d.supplier, 0))} sub-hire pick-ups, ${n(DP.days.reduce((s, d) => s + d.toilets, 0))} Coates toilet runs, ${n(DP.days.reduce((s, d) => s + d.branch, 0))} branch loads${DP.days.some(d => d.oversize) ? `, ${n(DP.days.reduce((s, d) => s + d.oversize, 0))} flagged oversize on this device` : ''} · a plan of movements, not a carrier booking and not a figure` : 'could not be read'} — <button class="linkish" data-tr888-go="demob">open Demob</button>.</li>
 </ul></div>
 <details class="plfold765 tr888-fold" data-sfold="costs765|tr888plan"${SFOLD_OPEN.has('costs765|tr888plan') ? ' open' : ''}><summary>The carrier plan of ${esc(((DATA.transport || {}).carrier || {}).received || '7 Sep 2026')}<small>${n(V.plan.length)} loads · ${n(V.plan.filter(p => p.keys.length).length)} paired to a reference on the record · load times at Kingston</small></summary>
 <div class="fin745-table tr888-table"><table class="tr888-stack"><thead><tr><th>Load</th><th>Date</th><th>Load time</th><th>What</th><th>Paired reference</th><th>Recorded by</th></tr></thead><tbody>
 ${V.plan.map(p => `<tr><td data-l="Load"><div class="tr888-v"><b>${esc(String(p.n))}</b></div></td><td data-l="Date"><div class="tr888-v">${esc(fmtDate(p.date))} <button class="linkish" data-tr888-day="${esc(p.date)}">Timeline</button></div></td><td data-l="Load time"><div class="tr888-v">${esc(p.time)}${p.early ? ' <span class="tr888-flag tr888-flag-early">before 06:00</span>' : ''}</div></td><td data-l="What"><div class="tr888-v">${esc(p.item)}</div></td><td data-l="Paired reference"><div class="tr888-v">${p.keys.length ? p.keys.map(k => `<button class="linkish tr888-ref" data-open="${esc(k)}"><b>${esc(k)}</b></button>`).join(' ') : '<span class="pl-todo">not paired</span>'}</div></td><td data-l="Recorded by" class="acc761-w">${esc(p.by || '—')}</td></tr>`).join('')}
 </tbody></table></div>
 <p class="fin745-basis">${(((DATA.transport || {}).carrier) || {}).authority ? esc(DATA.transport.carrier.authority) + ' ' : ''}${(((DATA.transport || {}).arrival) || {}).means ? esc(DATA.transport.arrival.means) : ''}</p></details>
 <details class="plfold765 tr888-fold" data-sfold="costs765|tr888rules"${SFOLD_OPEN.has('costs765|tr888rules') ? ' open' : ''}><summary>Rules, documents and purchase orders<small>load times, the Kingston run, the driver rules, the transport documents and any transport PO</small></summary>
 <ul class="tr888-list">
 <li>${loadTimesLine()}</li>
 ${(DATA.driver_rules || {}).escort ? `<li><b>Driver rules</b> (${esc((DATA.driver_rules || {}).issued_by || 'the project manager')}): ${esc(DATA.driver_rules.escort)}${(DATA.driver_rules.ppe || []).length ? ' PPE: ' + esc(DATA.driver_rules.ppe.join(', ')) + '.' : ''}</li>` : ''}
 <li><b>Oversize planning</b>: buildings and toilet blocks are flagged for oversize transport planning and sewage tanks as standard-size items — a planning category only. The loaded vehicle’s dimensions, mass and the current access conditions are confirmed before any load is called compliant.</li>
 <li><b>Transport documents</b>: ${transportDocsLine(true) || 'none on the page'}.</li>
 <li><b>Purchase orders for transport</b>: ${V.pos.length ? V.pos.map(o => `<span class="mono">${esc(o.number)}</span> ${esc(o.supplier_name || '')}${o.branch ? ' · ' + esc(o.branch) : ''}${o.amount != null ? ' · ' + esc(money(Number(o.amount))) : ''}`).join('; ') : 'none on the record — a carrier’s PO is added on the Finance handover'}.</li>
 </ul></details>
 <p class="fin745-basis acc761-foot">Author: Andrew Fisher · Transport v8.88 · read from the record; the P&amp;L’s own figures are unchanged by this view.</p>
 </section>`;
}
function tr888Csv(){
 const V = transport888View(), cn = c => c === '—' ? 'Branch unconfirmed' : c, live = V.T.rows.filter(r => !r.cancelled);
 const rows = [['Author: Andrew Fisher'], [`${DATA.event.name} — Transport — every load, by branch and by carrier`], ['As at', todayIso()], [],
  ['1. By branch', 'Branch', 'Loads', 'With a figure', 'Coates truck', 'No figure', 'To date AUD ex GST', 'Still to come', 'To job end', 'Finance handover', 'Transport Revenue', 'Provisional revenue to come']];
 V.byBranch.forEach(b => rows.push(['Branch', cn(b.code), b.loads, b.figure, b.internal, b.noFig, b.actual, b.toCome, b.job, b.handover == null ? '' : b.handover, b.revenue, b.provisional]));
 rows.push(['Branch total', '', V.tot.loads, V.tot.figure, V.tot.internal, V.tot.noFig, V.tot.actual, V.tot.toCome, V.tot.job, V.tot.handover, V.tot.revenue, V.tot.provisional], []);
 rows.push(['2. By carrier', 'Carrier', 'Loads', 'With a figure', 'To date AUD ex GST', 'Written with a plus', 'Coates truck', 'No figure', 'First load', 'Last load', 'Branches', 'As written']);
 V.byCarrier.forEach(c => rows.push(['Carrier', c.name, c.loads, c.figure, c.amount, c.plus, c.internal, c.noFig, c.first || '', c.last || '', c.branches.join(' '), c.asWritten.join('; ')]));
 rows.push([], ['3. Every load', 'Date', 'Load time', 'Reference or row', 'Item', 'Qty', 'Leg', 'Phase', 'Sheet', 'Carrier', 'Dockets', 'Branch', 'Charge as written', 'Counted AUD ex GST', 'Forecast kind', 'Forecast AUD ex GST', 'Flags']);
 live.forEach(r => rows.push(['Load', r.date || '', r.loadTime || '', r.key || r.task, r.item, r.qty, r.leg, r.phase || '', r.sheet || '', r.carrierText, r.dockets.join(' '), r.branch || 'unconfirmed', r.t ? r.t.words : '', r.counted ? r.actual : '', (r.forecast || {}).kind || '', r.forecast && (r.forecast.kind === 'card' || r.forecast.kind === 'average') ? r.forecast.amount : '', tr888Flags(r).map(x => x.w).join('; ')]));
 rows.push([], ['4. Transport Revenue', 'Contract', 'Line', 'Branch', 'What', 'Qty', 'Charge AUD ex GST', 'Docket', 'Covers']);
 V.lines.forEach(l => rows.push(['Charge line', l.contract, l.line, l.branch, l.description, l.qty, l.charge, l.docket || '', l.covers.join(' ')]));
 rows.push(['Transport Revenue total', '', '', '', '', '', V.revenueTotal]);
 return rows.map(r => r.map(v => fin745CsvCell(v == null ? '' : v)).join(',')).join('\r\n');
}
function tr888Bind(){
 const root = document.getElementById('transport888'); if (!root) return;
 root.querySelectorAll('[data-tr888f]').forEach(b => b.onclick = () => { state.tr888Filter = b.dataset.tr888f; render(); });
 root.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openAsset(b.dataset.open));
 root.querySelectorAll('[data-tr888-day]').forEach(b => b.onclick = () => { location.hash = '#day/' + b.dataset.tr888Day; });
 root.querySelectorAll('[data-tr888-go]').forEach(b => b.onclick = () => { const to = b.dataset.tr888Go;
  if (to === 'demob') return go('demob');
  financeHome857(); state.financeView857 = to === 'handover' ? 'handover' : 'summary'; render();
  if (to === 'forecast' || to === 'summary') { const id = to === 'forecast' ? 'buildingTransport831' : 'costs765'; const el = document.getElementById(id); if (el) el.scrollIntoView({behavior: 'smooth', block: 'start'}); } });
 const csv = root.querySelector('[data-tr888-act="csv"]'); if (csv) csv.onclick = () => fin745Download('GC500_Transport_' + todayIso() + '.csv', '﻿' + tr888Csv(), 'text/csv;charset=utf-8');
}
/* the one line on the P&L summary that says whether every figure talks to every other, with the tie-outs folded under it */
function recon888Html(){
 let R; try { R = recon888Model(); } catch (e) { R = {ties: [], ok: false, bad: 1, count: 0, error: String(e && e.message || e)}; }
 const m = v => v == null ? '<span class="pl-todo">—</span>' : esc(money(v)), groups = ['P&L', 'Transport', 'Operational'], gname = {'P&L': 'Revenue and direct costs', 'Transport': 'Transport', 'Operational': 'Equipment, Timeline and Today read the same loads'};
 const row = t => `<tr class="${t.ok ? 'recon888-ok' : 'recon888-bad'}" data-recon888="${esc(t.what)}"><td><b>${esc(t.what)}</b></td><td>${t.parts.map(p => `<span class="recon888-part"><span class="acc761-w">${esc(p.where)}</span> ${t.group === 'Operational' ? (p.v == null ? '—' : esc(fmtNum(p.v))) : m(p.v)}</span>`).join('')}</td><td class="recon888-state">${t.ok ? '<span class="fh866-ok">tied</span>' : '<span class="fh866-todo">does not tie</span>'}</td></tr>`;
 const summary = R.error ? `Everything reconciles could not be worked out: ${esc(R.error)}` : R.ok ? `Everything reconciles <small>${esc(fmtNum(R.count))} tie-outs across At a glance, the Forecast P&amp;L, the business’s lines, Costs to job end, the Finance handover, Transport, Equipment and the Timeline — all tied</small>` : `<span class="fh866-todo">${esc(fmtNum(R.bad))} of ${esc(fmtNum(R.count))} tie-outs do not tie</span> <small>open to see which figure disagrees with which</small>`;
 return `<details class="plfold765 recon888${R.ok ? '' : ' recon888-flag'}" id="recon888" data-sfold="costs765|recon888"${SFOLD_OPEN.has('costs765|recon888') || !R.ok ? ' open' : ''}><summary>${summary}</summary>
 <div class="card recon888-card"><p class="acc761-w">Each line is one figure read where it is shown and where else it is shown. The figures come from the same model functions as the cards, so a line that does not tie is a fault to fix, never a rounding to explain away. Money to the cent; the operational lines are counts.</p>
 ${groups.map(g => { const ts = R.ties.filter(t => t.group === g); if (!ts.length) return ''; return `<h4 class="fh868-h">${esc(gname[g])}</h4><div class="fin745-table recon888-table"><table><thead><tr><th>Figure</th><th>Where it is shown</th><th>State</th></tr></thead><tbody>${ts.map(row).join('')}</tbody></table></div>`; }).join('')}
 <p class="acc761-w">Transport, every load and its branch: <button class="linkish" data-recon888-go="transport">open the Transport view</button>.</p></div></details>`;
}
/* the Transport button on the Costs & P&L nav: a sixth section drawn fresh from the record, like the Finance handover */
document.addEventListener('click', e => {
 const b = e.target.closest('[data-finance888], [data-recon888-go]'); if (!b) return;
 e.preventDefault(); e.stopPropagation();
 financeHome857(); state.financeView857 = 'transport';
 if (state.tab !== 'costs') go776Held('costs'); else render();
}, true);
