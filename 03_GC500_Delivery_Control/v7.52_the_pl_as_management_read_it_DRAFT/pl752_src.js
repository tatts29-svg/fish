/* v7.52 - THE P&L, AS MANAGEMENT READ IT. The project manager, 1 Oct 2026: "We need this to look professional, almost
 like a P&L but in a way it's easy to understand. Does each branch layout correct? Is the total the whole forecast?
 Business is wanting to see numbers now."

 One statement at the head of the Costs tab, read top to bottom the way a P&L reads: REVENUE (charged to the V8s) by
 line, then by branch; DIRECT COSTS (what Coates pays) against the eight categories management expect; DIFFERENCE SO
 FAR - not a margin yet - with what is not in it named. Every figure is the same figure the working below it holds
 (moneySummary), so the statement and the working can never disagree. Three words on every revenue line say where it
 stands: ON THE CONTRACTS (a rate the branch put on the line), FROM THE CARD (our rate, an estimate until the branch
 puts it on the contract) or NOT PRICED. The forecast total is the revenue in the statement; what is not yet in it is
 listed under it, never added. */
function pl752Rows(){
 const cents = n => Math.round(n * 100) / 100;
 const by = {};
 ONHIRE_ROWS.forEach(r => { const b = by[r.branch_code || 'no branch'] = by[r.branch_code || 'no branch'] || {code: r.branch_code || 'no branch', lines: 0, contract: 0, card: 0, cardLines: 0, none: 0, decided: 0, transport: 0, rehire: 0, subLines: 0, suppliers: []};
 const ch = contractCharge(r); b.lines++;
 if (r.subhired) { b.subLines++; if (r.supplier_sub_rental && !b.suppliers.includes(r.supplier_sub_rental)) b.suppliers.push(r.supplier_sub_rental); }
 if (typeof ch.amount !== 'number') { b.none++; return; }
 if (r.subhired) { b.rehire = cents(b.rehire + ch.amount); return; }
 if (r.charge_line) { b.transport = cents(b.transport + ch.amount); return; }
 if (ch.filled === 'card') { b.card = cents(b.card + ch.amount); b.cardLines++; }
 else if (typeof contractTreatment747 === 'function' && contractTreatment747(r)) { b.decided++; }
 else b.contract = cents(b.contract + ch.amount); });
 const all = Object.values(by).map(b => Object.assign(b, {total: cents(b.contract + b.card + b.transport + b.rehire)}));
 return all.sort((a, b) => b.total - a.total);
}
/* the sub-hired locations recorded on the page (v7.43/v7.44), by supplier - on no branch contract of their own */
function pl752SubLocations(){
 if (typeof subhireOf !== 'function') return [];
 const by = {};
 allAssets().forEach(a => { const s = subhireOf(a.key); if (!s) return; const co = (s && s.co) || 'supplier not named'; (by[co] = by[co] || []).push(a.key); });
 return Object.entries(by).map(([co, keys]) => ({co, keys: keys.sort()}));
}
function pl752Card(){
 const M = moneySummary(), c = M.charge, k = M.cost;
 const m0 = v => v == null ? '<span class="pl-todo">—</span>' : esc(money0(v));
 const sd = v => v == null ? '<span class="pl-todo">—</span>' : `<b class="${v < 0 ? 'neg' : 'pos'}">${v < 0 ? '−' + esc(money0(-v)) : esc(money0(v))}</b>`;
 const pl = (n, w) => `${fmtNum(n)} ${w}${n === 1 ? '' : 's'}`;
 const B = pl752Rows();
 const cardTotal = B.reduce((s, b) => s + b.card, 0), cardLines = B.reduce((s, b) => s + b.cardLines, 0), noRate = B.reduce((s, b) => s + b.none, 0);
 const servicing = c.servicing || 0;
 const onContracts = cents2(c.contracts - cardTotal);
 const SP = typeof fencePaidSplit === 'function' ? fencePaidSplit() : {clean: false};
 const tag = (w, cls) => `<i class="pl-tag ${cls}">${w}</i>`;
 const CONTRACT = tag('on the contracts', 'ok'), CARD = tag('from the card', 'est'), NONE = tag('not priced', 'none'), DOCKET = tag('dockets', 'ok'), SCOPE = tag('the scope', 'ok');
 const line = (label, sub, amt, tg, cls) => `<div class="pl-ln${cls ? ' ' + cls : ''}"><span class="pl-lb">${label}${sub ? `<small>${sub}</small>` : ''}</span><span class="pl-tg">${tg || ''}</span><span class="pl-amt">${amt}</span></div>`;
 const cats = M.categories || [];
 const catLine = x => line(esc(x.category), esc((x.parts || []).join(' · ')), x.known ? esc(money0(x.amount)) : (x.hours ? esc(fmtNum(x.hours)) + ' h' : '<span class="pl-todo">nothing recorded</span>'), x.known ? '' : (x.hours ? tag('hours only', 'est') : NONE), x.known ? '' : 'faint');
 const missing = (M.missing || []).slice();
 return `<section class="card pl752" id="pl752" aria-label="Profit and loss statement, forecast">
 <header class="pl-head"><div><div class="pl-kicker">Coates Industrial Solutions · GC500 2026</div><h3>Forecast P&amp;L</h3>
 <div class="pl-sub">as at ${esc(fmtDate(M.as_at))} · AUD ex GST · every figure traces to a contract line, a card rate, a docket or a quote</div></div>
 <div class="pl-kpis"><div class="pl-kpi"><em>Revenue</em><b>${m0(c.total)}</b></div><div class="pl-kpi"><em>Direct costs known</em><b>${m0(k.known)}</b></div><div class="pl-kpi ${M.difference0 < 0 ? 'neg' : ''}"><em>Difference so far</em><b>${m0(M.difference0)}</b><small>not a margin yet</small></div></div></header>
 <div class="pl-cols">
 <div class="pl-col">
 <h4>Revenue <small>charged to the V8s · all hire is revenue</small></h4>
 ${line('Hire on the contracts, by the rate', `${pl(c.contracts_lines - cardLines, 'line')} carrying a rate${c.subhire ? ` · including Rehire Revenue ${esc(money0(c.subhire))}` : ''}${c.delivery ? ` and Transport Revenue ${esc(money0(c.delivery))}` : ''}`, m0(onContracts), CONTRACT)}
 ${cardLines ? line('Hire with no contract rate yet, at the card', `${pl(cardLines, 'line')} · the street rate card 2026 · until the branch puts a rate on the line`, m0(cardTotal), CARD) : ''}
 ${servicing ? line('Toilet servicing, at our pump-out rates', 'Event Portables’ quantities on Q6844 · on no contract line yet', m0(servicing), CARD) : ''}
 ${line('Fencing — dockets at the 2026 card', `${pl(c.fencing_dockets || 0, 'docket')} · hire and installation in one card rate`, c.fencing ? m0(c.fencing) : '<span class="pl-todo">—</span>', c.fencing ? DOCKET : NONE)}
 ${c.race.scope ? line('Event labour — the scope', `${esc(fmtNum(c.race.hours))} h of people over the event + accommodation and travel`, m0(c.race.amount), SCOPE) : line('Labour over the race weekend', c.race.hours ? `${esc(fmtNum(c.race.hours))} h` : '', c.race.amount != null ? m0(c.race.amount) : '<span class="pl-todo">—</span>', c.race.amount != null ? CONTRACT : NONE)}
 ${c.labour_ticks ? line('Labour ticked on references', pl(c.labour_ticks, 'tick'), m0(c.labour), CONTRACT) : ''}
 ${c.other_lines ? line('Other charge lines', pl(c.other_lines, 'line'), m0(c.other), CONTRACT) : ''}
 ${noRate ? line('Contract lines with no rate and no card line', `${pl(noRate, 'line')} · unknown, not nought`, '<span class="pl-todo">—</span>', NONE, 'faint') : ''}
 ${line('Total revenue', '', m0(c.total), '', 'total')}
 <h4 class="pl-h4b">By branch <small>the contracts, by the rate · what each branch bills</small></h4>
 <div class="tblwrap"><table class="pl-tbl"><thead><tr><th>Branch</th><th class="num">Lines</th><th class="num">Hire, by the rate</th><th class="num">Hire, from the card</th><th class="num">Transport Revenue</th><th>Sub-hired <span class="w">(Rehire Revenue)</span></th><th class="num">No rate</th><th class="num">Total</th></tr></thead><tbody>
 ${B.map(b => `<tr><td><b>${esc(b.code)}</b>${b.decided ? `<br><span class="w">${pl(b.decided, 'line')} settled: no separate charge</span>` : ''}</td><td class="num">${esc(fmtNum(b.lines))}</td><td class="num">${b.contract ? esc(money0(b.contract)) : '—'}</td><td class="num">${b.card ? esc(money0(b.card)) : '—'}</td><td class="num">${b.transport ? esc(money0(b.transport)) : '—'}</td><td class="pl-sub">${b.subLines ? `<b>${esc(fmtNum(b.subLines))} line${b.subLines === 1 ? '' : 's'}</b> · ${esc(money0(b.rehire))}${b.suppliers.length ? `<br><span class="w">from ${esc(b.suppliers.join(', '))} · rehire cost not on the record</span>` : ''}` : '<span class="pl-none">none sub-hired</span>'}</td><td class="num">${b.none ? `<span class="pl-todo">${esc(fmtNum(b.none))}</span>` : '—'}</td><td class="num"><b>${esc(money0(b.total))}</b></td></tr>`).join('')}
 <tr class="tot"><td>The contracts</td><td class="num">${esc(fmtNum(B.reduce((s, b) => s + b.lines, 0)))}</td><td class="num">${esc(money0(B.reduce((s, b) => s + b.contract, 0)))}</td><td class="num">${esc(money0(cardTotal))}</td><td class="num">${esc(money0(B.reduce((s, b) => s + b.transport, 0)))}</td><td class="pl-sub"><b>${esc(fmtNum(B.reduce((s, b) => s + b.subLines, 0)))} lines</b> · ${esc(money0(B.reduce((s, b) => s + b.rehire, 0)))}</td><td class="num">${noRate ? esc(fmtNum(noRate)) : '—'}</td><td class="num"><b>${esc(money0(B.reduce((s, b) => s + b.total, 0)))}</b></td></tr>
 </tbody></table></div>
 ${(() => { const L = pl752SubLocations(); return `<div class="pl-subloc"><b>Sub-hired on the record, by supplier.</b> ${L.length ? L.map(x => `<span class="pl-subco"><b>${esc(x.co)}</b> — ${esc(x.keys.join(', '))} (${x.keys.length} location${x.keys.length === 1 ? '' : 's'})</span>`).join(' · ') : 'no sub-hired location recorded on the page'}. These are locations, not contract lines: their hire is charged to the V8s on the branch's contracts at our rates, and the supplier's rehire cost sits under Rehire costs on the right (Event Portables: ${esc(money0(k.rehire || 0))}, approved). A branch's SUB lines above are the items the rental system itself books as sub-hired.</div>`; })()}
 <p class="pl-note">The branch total is the contracts line above, to the dollar: hire by the rate, hire from the card, plus the Transport Revenue and Rehire Revenue charge lines on the same contracts. Fencing, toilet servicing and event labour are charged off dockets, a quote and the scope, not contract lines, so they sit outside the branch table.</p>
 </div>
 <div class="pl-col">
 <h4>Direct costs <small>what Coates pays · the eight categories management expect · never added to revenue</small></h4>
 ${cats.map(catLine).join('')}
 ${line('Total direct costs known so far', k.labour && k.labour.hours ? `plus ${esc(fmtNum(Math.round((k.labour.hours + (k.race_hours || 0)) * 10) / 10))} h of wages with no rate` : '', m0(k.known), '', 'total')}
 ${line('Difference so far', 'revenue less the direct costs known · not a margin yet', sd(M.difference0), '', 'total diff' + (M.difference0 < 0 ? ' neg' : ''))}
 <h4 class="pl-h4b">Not in it yet <small>named, never added</small></h4>
 <ul class="pl-missing">${missing.map(x => `<li>${esc(x)}</li>`).join('')}${(M.caveats || []).map(x => `<li class="prov">Provisional: ${esc(x)}</li>`).join('')}</ul>
 <p class="pl-note">Charged windows: forklifts, VMS and water barriers from when they go in; everything else over the event (23–25 Oct). Labour is charged per piece of equipment; the only hourly labour charged is over the event. A rate typed on Costs → From the Street Rate Card 2026 replaces a card estimate and shows here at once.</p>
 </div>
 </div>
 <footer class="pl-foot"><span>Author: ${esc((DATA.brand || {}).author || 'Andrew Fisher')} · Events Project Manager</span><span>The working behind every figure is under <b>Are we making money?</b> below · Print and Email the summary are above</span></footer>
 </section>`;
}
function cents2(n){ return Math.round(n * 100) / 100; }
