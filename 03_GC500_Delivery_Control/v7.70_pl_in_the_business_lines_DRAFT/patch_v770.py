#!/usr/bin/env python3
r"""v7.70 - The Forecast P&L in the business's lines. Andrew, 1 Oct 2026, 16:18 AEST: "maybe we can use this data to better
present the forecast correct, with correct terminology, as well as P&L"; about 16:25: "I don't wanna see last year's";
16:50, with the Street Rate Card 2026 beside the page: "this info is literally trying to help us come up with correct
logic on how things are getting priced ... and split things into the correct kitty"; 16:51: "I have management looking
at GC500 tonight ... no bugs, it's clean and tidy and easy to understand."
Apply after v7.69 (on the live v7.67 build: v7.68, v7.69, then v7.70).

  One new card under the Forecast P&L: the same figures on the lines the Coates P&L posts them to (the lines and codes
  of the July 2026 P&L), with the direct costs against them and the recovery ratios the business reads. Every figure is
  read from moneySummary(), cj764Model(), rh766Model(), servicing748(), pl760Ticks() and fencePaidSplit() - a view
  across the cards, never a new total - and the card checks itself: the revenue lines add to the P&L's revenue and the
  cost lines to its direct costs known, to the cent, on the record and to job end.
    1. pl770Model() and pl770Card(), placed before the Rehire by branch block.
    2. The card drawn in renderCosts between the Forecast P&L and Costs to job end; a line in the At a glance flow.
    3. Two CSS rules.
  Nothing existing changes; this patch only inserts. Nothing from any other year is on the card.
    python3 patch_v770.py <page.html>"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'pl770Model' in t: sys.exit('v7.70 already applied')
if 'rh769Cover' not in t: sys.exit('needs v7.69 first')

# 1. the model and the card
t = rep(t, "/* v7.66 - REHIRE BY BRANCH. Andrew, 1 Oct 2026:", r"""/* v7.70 - THE FORECAST P&L IN THE BUSINESS'S LINES. Andrew, 1 Oct 2026, 16:18: "use this data to better present the
 forecast correct, with correct terminology, as well as P&L"; 16:50, with the Street Rate Card 2026: "split things into the
 correct kitty". Every figure here is the Forecast P&L's or the Costs to job end card's, put on the line the Coates P&L
 posts it to (the lines and codes of the July 2026 P&L; the 2026 card's columns say which kitty each charge is: the hire
 is hire, the labour per piece is Installation, the pump-outs are Toilet Pumpouts, the water is Consumables). A view
 across the cards, never a new total: the revenue lines add to the P&L's revenue and the cost lines to its direct costs
 known, to the cent, and the card says so. Nothing from any other year is on it. */
function pl770Model(){
 const M = moneySummary(), c = M.charge || {}, k = M.cost || {}, X = cj764Model(), R = rh766Model(), r2 = v => Math.round(v * 100) / 100;
 const sv = typeof servicing748 === 'function' ? servicing748() : null, TK = pl760Ticks(), SP = typeof fencePaidSplit === 'function' ? fencePaidSplit() : {clean: false};
 const F = X.fencing || {cost: 0, revenue: 0};
 const xrow = re => (X.rows || []).find(r => re.test(r.stream)) || {toDate: 0, toCome: 0};
 const n = v => Number(v) || 0;
 /* REVENUE. The rehire on the contract lines: every rehire group but the fence, less the servicing the toilets group carries */
 const rehireLines = r2((R.groups || []).filter(g => !/^Fencing/.test(g.what)).reduce((s, g) => s + n(g.rev), 0) - n(c.servicing));
 const water = (sv && sv.at_cost) || [];
 const isPump = l => /truck|pre ?-?fill/i.test(l.description || '');
 const waterPump = r2(water.filter(isPump).reduce((s, l) => s + n(l.amount), 0)), waterCons = r2(water.filter(l => !isPump(l)).reduce((s, l) => s + n(l.amount), 0));
 const hire = r2(n(c.contracts) - n(c.delivery) - rehireLines), fence = r2(n(c.fencing)), pump = r2((sv ? n(sv.card_total) : 0) + waterPump);
 const race = n(c.race && c.race.amount), labour = n(c.labour), install = r2(labour + race), ticks = n(c.labour_ticks);
 const rev = [
  {key: 'hire', code: '1005', line: 'Hire Revenue', what: 'Coates’s own gear on the contracts: Rate 1 once for the event, the card where a line has none', now: hire, job: hire,
   basis: `the contracts by the rate and from the card, less the hired-in lines and the delivery lines below${TK.fire_ext.amount ? ' · fire extinguishers ticked per piece ' + money0(TK.fire_ext.amount) + ', a hire charge' : ''}`},
  {key: 'rehire', code: '1010', line: 'Rehire Revenue', what: 'gear hired in and charged to the V8s at our rates', now: r2(rehireLines + fence), job: r2(rehireLines + fence + n(F.revenue)),
   basis: `the Event Portables toilet lines, the SUB lines and the sub-hired forklifts ${money0(rehireLines)} · Advanced’s fencing dockets at the 2026 card ${money0(fence)}${n(F.revenue) ? ' · to job end + the fencing programme to come at the card ' + money0(F.revenue) : ''} · the fence rate carries hire and installation in one figure; the split for 1047 is Advanced’s to give`},
  {key: 'transport', code: '1030 · 1031', line: 'Transport Revenue', what: 'delivery and pickup charged on the contracts', now: r2(n(c.delivery)), job: r2(n(c.delivery)), basis: 'the delivery and pickup lines on the contracts — cartage internal and external'},
  {key: 'pump', code: '1032', line: 'Toilet Pumpouts', what: 'servicing at our pump-out rates; the water truck and the pre-fill at what we are charged', now: pump, job: pump,
   basis: sv ? `Event Portables’ quantities on Q6844 at the card’s pump-out rates ${money0(sv.card_total)} + the water truck and the pre-fill at cost ${money0(waterPump)} · on no contract line yet: the branch adds the lines when it bills` : 'no servicing on the record'},
  {key: 'cons', code: '1020', line: 'Consumables', what: 'water deliveries and the drinking-water tank at what we are charged', now: waterCons, job: waterCons, basis: 'Q6846’s lines at cost — the line Finance posts water to'},
  {key: 'install', code: '1047', line: 'Installation', what: 'labour ticked per piece, and the event labour scope', now: install, job: install,
   basis: `Labour Install ticked per piece ${money0(labour)} (${fmtNum(ticks)} tick${ticks === 1 ? '' : 's'}: install, steps, levelling and demob${TK.cleaning.amount ? ', cleaning ' + money0(TK.cleaning.amount) : ''}) + the event labour scope ${money0(race)} (${fmtNum(n(c.race && c.race.hours))} h of people over the event, with accommodation and travel) · the fencing install sits inside the fence rate above`},
  {key: 'waiver', code: '1015', line: 'Damage Waiver', what: 'on the hire only — never on labour, steps, cleaning, install, demob or pump-outs (the card)', now: null, job: null, basis: 'not on the 2026 contracts yet — the branch’s rate'},
 ];
 if (n(c.other)) rev.push({key: 'other', code: '—', line: 'Other charge lines on the record', what: 'charge lines typed on Costs', now: r2(n(c.other)), job: r2(n(c.other)), basis: `${fmtNum(n(c.other_lines))} line${n(c.other_lines) === 1 ? '' : 's'} — each on its own line`});
 const revNow = r2(rev.reduce((s, l) => s + n(l.now), 0)), revJob = r2(rev.reduce((s, l) => s + n(l.job), 0));
 /* DIRECT COSTS. The four Event Portables quotes by what each line is - the toilet hire with their delivery and pickup is
    Rehire; the service visits, the pump-outs, the block cleans, the water truck and the pre-fill are Toilet Pumpout Costs;
    the water deliveries and the tank are Consumables - then Advanced, the carriers and the tracker. */
 const Q = (DATA.rehire_quotes && DATA.rehire_quotes.quotes) || [];
 const kit = d => /service|pump ?out|cleaning|water truck|pre ?-?fill/i.test(d || '') ? 'pump' : /water deliver|drinking water|water tank/i.test(d || '') ? 'cons' : 'rehire';
 const qk = {pump: 0, cons: 0, rehire: 0}, qWords = {pump: [], cons: [], rehire: []};
 const rqOn = !!k.rehire_approved && k.rehire != null, rqAll = r2(n(k.rehire));
 if (rqOn) Q.forEach(q => { const by = {pump: 0, cons: 0, rehire: 0}; (q.groups || []).forEach(g => (g.lines || []).forEach(l => { by[kit(l.description)] += n(l.total_price); }));
  const main = Object.keys(by).sort((a, b) => by[b] - by[a])[0]; by[main] += n(q.delivery_charge) + n(q.pickup);
  Object.keys(by).forEach(x => { if (by[x]) { qk[x] = r2(qk[x] + by[x]); if (!qWords[x].includes(q.quote)) qWords[x].push(q.quote); } }); });
 const qClean = rqOn && Math.abs(r2(qk.pump + qk.cons + qk.rehire) - rqAll) < 0.015;
 const fenceGear = SP.clean ? r2(n(SP.gear)) : r2(n(k.fencing_paid)), fenceInst = SP.clean ? r2(n(SP.installation)) : r2(n(SP.green));
 const tr = xrow(/^Transport/), ac = xrow(/^Accommodation/);
 const transport = r2(n(k.transport && k.transport.amount));
 const inside = rqOn ? 'inside the Rehire figure above' : 'not counted until the quotes are approved';
 const cost = [
  {key: 'rehire', code: '2126 · 2127', line: 'Rehire', what: 'what we pay for the gear hired in', now: r2((qClean ? qk.rehire : rqAll) + fenceGear), job: r2((qClean ? qk.rehire : rqAll) + fenceGear + n(F.cost)),
   basis: `Event Portables’ ${qClean ? qWords.rehire.join(' and ') + ' (the toilet hire, with their delivery and pickup) ' + money0(qk.rehire) : 'four quotes ' + money0(rqAll) + ' whole'}${rqOn ? ', approved — the final total may change' : ' — quoted, unsigned, not counted'} · Advanced’s gear on the dockets at their own sheet ${money0(fenceGear)}${n(F.cost) ? ' · to job end + the fencing programme to come at Advanced’s rates ' + money0(F.cost) : ''}`,
   missing: 'the SUB lines’ and the sub-hired forklifts’ supplier costs'},
  {key: 'pump', code: '3325', line: 'Toilet Pumpout Costs', what: 'what Event Portables charge us for the servicing', now: qClean ? qk.pump : 0, job: qClean ? qk.pump : 0, basis: qClean ? `${qWords.pump.join(' and ')}: the service visits, the tank pump-outs, the block cleans, the water truck and the pre-fill` : inside},
  {key: 'cons', code: '2144', line: 'Consumables', what: 'the water deliveries and the tank', now: qClean ? qk.cons : 0, job: qClean ? qk.cons : 0, basis: qClean ? `${qWords.cons.join(' and ')}: the water deliveries and the drinking-water tank, with their delivery and pickup` : inside},
  {key: 'transport', code: '2120', line: 'Transport', what: 'the carriers’ charges', now: transport, job: r2(transport + n(tr.toCome)), basis: `the schedule’s TPORT COST figures and our own lines — only the loads with a figure${n(tr.toCome) ? ' · to job end + the loads without one at the card and the average so far ' + money0(tr.toCome) : ''}`},
  {key: 'install', code: '2142', line: 'Installation — external contractors', what: 'Advanced’s crew', now: fenceInst, job: fenceInst, basis: SP.clean ? `their crew on the dockets ${money0(n(SP.docket_labour))}${n(SP.green) ? ' + the green book ' + money0(SP.green) : ''} · the relocation hours to come are not priced` : 'the green book only — the dockets are not split on the record'},
 ];
 const direct = r2(cost.reduce((s, l) => s + n(l.now), 0)), directJob = r2(cost.reduce((s, l) => s + n(l.job), 0));
 const over = r2(n(k.accommodation && k.accommodation.amount) + n(k.meals && k.meals.amount) + n(k.misc && k.misc.amount)), overJob = r2(over + n(ac.toCome));
 const costNow = r2(direct + over), costJob = r2(directJob + overJob);
 const W = X.wages || {toDate: 0, job: 0, unpricedHours: 0};
 const gm = {now: r2(revNow - direct), job: r2(revJob - directJob)}; gm.pcNow = revNow ? gm.now / revNow : null; gm.pcJob = revJob ? gm.job / revJob : null;
 const diff = {now: r2(revNow - costNow), job: r2(revJob - costJob - n(W.job))};
 const L = (arr, key) => arr.find(x => x.key === key) || {now: 0, job: 0}, rv = key => L(rev, key), co = key => L(cost, key);
 const ratio = (a, b) => b ? a / b : null;
 const cartage = ratio(rv('transport').now, co('transport').now);
 const rec = [
  {name: 'Rehire Recovery', what: 'Rehire Revenue ÷ Rehire cost', now: ratio(rv('rehire').now, co('rehire').now), job: ratio(rv('rehire').job, co('rehire').job), words: `${money0(rv('rehire').job)} charged against ${money0(co('rehire').job)} paid, to job end · before the supplier costs not on the record`},
  {name: 'Transport Recovery', what: 'Transport Revenue and Toilet Pumpouts ÷ Transport and Toilet Pumpout Costs — the P&L groups them together', now: ratio(rv('transport').now + rv('pump').now, co('transport').now + co('pump').now), job: ratio(rv('transport').job + rv('pump').job, co('transport').job + co('pump').job), words: `cartage alone: ${money0(rv('transport').now)} of delivery and pickup on the contracts against ${money0(co('transport').now)} paid to carriers so far${cartage != null ? ' (×' + cartage.toFixed(2) + ')' : ''} — the transport charge lines are the branch’s to add to the contracts`},
  {name: 'Consumables Recovery', what: 'Consumables ÷ Consumables cost', now: ratio(rv('cons').now, co('cons').now), job: ratio(rv('cons').job, co('cons').job), words: co('cons').now > rv('cons').now ? `the water is charged on at the quote’s line figures; the quote’s delivery and pickup (${money0(r2(co('cons').now - rv('cons').now))}) are not charged on yet` : 'the water charged on at what we are charged'},
  {name: 'Installation Recovery', what: 'Installation ÷ Installation — external contractors', now: null, job: null, words: `not readable yet: ${money0(rv('install').now)} charged against ${money0(co('install').now)} paid to Advanced’s crew — our own people’s install hours carry no wage rate (${fmtNum(n(W.unpricedHours))} h) and the fencing install sits inside the fence rate`},
 ];
 const near = (a, b) => a != null && b != null && Math.abs(a - b) < 0.015;
 return {asAt: X.asAt || todayIso(), rev, cost, over, overJob, revNow, revJob, direct, directJob, costNow, costJob, gm, diff, rec, wages: W, qk, qWords, qClean,
  checks: {revenue: near(revNow, n(c.total)), revenueJob: X.revenue ? near(revJob, n(X.revenue.job)) : null, costs: near(costNow, n(k.known)), costsJob: near(costJob, n(X.job)), quotes: qClean}};
}
function pl770Card(){
 let P; try { P = pl770Model(); } catch (e) { return `<section id="pl770" class="fin745 pl770"><p class="fin745-eyebrow">THE FORECAST P&amp;L IN THE BUSINESS’S LINES</p><p>Could not be worked out from this record: ${esc(String(e && e.message || e))}</p></section>`; }
 const m = v => v == null ? '<span class="acc761-w">—</span>' : v === 0 ? '—' : esc(money0(v)), pc = v => v == null ? '—' : Math.round(v * 100) + '%', x = v => v == null ? '<span class="acc761-w">not readable yet</span>' : '×' + v.toFixed(2);
 const row = (l, cls) => `<tr${cls ? ` class="${cls}"` : ''}><td><span class="chip ref mono">${esc(l.code)}</span></td><td><b>${esc(l.line)}</b><br><span class="acc761-w">${esc(l.what)}</span></td><td class="num">${m(l.now)}</td><td class="num"><b>${m(l.job)}</b></td><td class="acc761-why">${esc(l.basis)}${l.missing ? `<br><span class="rh766-miss">Not on the record: ${esc(l.missing)}</span>` : ''}</td></tr>`;
 const ok = Object.values(P.checks).every(v => v !== false);
 const head = '<thead><tr><th>Line</th><th>What</th><th class="num">On the record</th><th class="num">To job end</th><th>Basis</th></tr></thead>';
 return `<section id="pl770" class="fin745 pl770 nosfold" aria-labelledby="pl770Title">
 <div class="fin745-heading"><div><p class="fin745-eyebrow">THE FORECAST P&amp;L IN THE BUSINESS’S LINES · AUD EX GST · AS AT ${esc(fmtDate(P.asAt).toUpperCase())}</p><h2 id="pl770Title">The same figures, on the lines Finance posts them to</h2><p>Every charge in its kitty: the Forecast P&amp;L above, line for line, on the Coates P&amp;L’s own lines — Hire Revenue, Rehire Revenue, Transport, Toilet Pumpouts, Consumables, Installation — with the direct costs against them and the recovery ratios the business reads. Nothing is counted twice and nothing is new: the revenue lines add to the P&amp;L’s revenue and the cost lines to its direct costs known, to the cent${ok ? '' : ' (a line does not reconcile today — the totals say which)'}. Each is on the record today, then carried to job end as the Costs to job end card carries it. Revenue and cost are never added together.</p></div></div>
 <div class="fin745-metrics acc761-metrics">
 ${fin745Card('Revenue — to job end', money0(P.revJob), `${esc(money0(P.revNow))} on the record today`)}
 ${fin745Card('Direct costs — to job end', money0(P.directJob), `${esc(money0(P.direct))} on the record today · the ledger’s direct cost lines`)}
 ${fin745Card('Gross margin — to job end', `${money0(P.gm.job)} · ${pc(P.gm.pcJob)}`, `${esc(money0(P.gm.now))} · ${pc(P.gm.pcNow)} on the record · before wages, travel and accommodation — not a result until the branches have billed`)}
 ${fin745Card('Difference — to job end', money0(P.diff.job), `after travel, accommodation, meals and the wages priced (${esc(money0(P.wages.job))}) — the At a glance figure · ${esc(money0(P.diff.now))} so far`)}
 </div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>Revenue — charged to the V8s</h3><p>By the P&amp;L line. All hire is revenue; the labour per piece and the servicing are their own lines, as the 2026 card prices them.</p></div></div>
 <div class="tblwrap"><table class="acc761-tbl pl770-tbl">${head}<tbody>
 ${P.rev.map(l => row(l)).join('')}
 <tr class="acc761-grand"><td></td><td><b>Total revenue</b></td><td class="num"><b>${m(P.revNow)}</b></td><td class="num"><b>${m(P.revJob)}</b></td><td class="acc761-w">${P.checks.revenue ? 'the Forecast P&amp;L’s revenue, to the cent' : 'does not equal the Forecast P&amp;L’s revenue — a charge above is on no line'}${P.checks.revenueJob === false ? ' · to job end differs from the Costs to job end card' : P.checks.revenueJob ? ' · to job end the Costs to job end card’s figure' : ''}</td></tr>
 </tbody></table></div></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>Direct costs — what Coates pays</h3><p>By the P&amp;L line. Never added to revenue. The Event Portables quotes are split by what each line is; Advanced’s dockets by gear and crew.</p></div></div>
 <div class="tblwrap"><table class="acc761-tbl pl770-tbl">${head}<tbody>
 ${P.cost.map(l => row(l)).join('')}
 <tr class="acc761-tot"><td></td><td><b>Direct costs — the ledger’s lines</b></td><td class="num"><b>${m(P.direct)}</b></td><td class="num"><b>${m(P.directJob)}</b></td><td class="acc761-w">the five lines above</td></tr>
 <tr class="pl770-over"><td><span class="chip ref mono">3520 · 2357 · 3501</span></td><td><b>Travel and accommodation, meals, R&amp;M, printing</b><br><span class="acc761-w">job costs the P&amp;L carries below the direct lines</span></td><td class="num">${m(P.over)}</td><td class="num"><b>${m(P.overJob)}</b></td><td class="acc761-why">the tracker’s nights, meals and expenses · to job end + the nights with no rate at the person’s own rate</td></tr>
 <tr class="acc761-grand"><td></td><td><b>Direct costs known — the Forecast P&amp;L’s figure</b></td><td class="num"><b>${m(P.costNow)}</b></td><td class="num"><b>${m(P.costJob)}</b></td><td class="acc761-w">${P.checks.costs ? 'to the cent' : 'does not equal the Forecast P&amp;L’s direct costs known'}${P.checks.costsJob === false ? ' · to job end differs from the Costs to job end card' : P.checks.costsJob ? ' · to job end the Costs to job end card’s figure' : ''}</td></tr>
 <tr class="cj764-wages"><td><span class="chip ref mono">3210 · 2143</span></td><td><b>Wages</b><br><span class="acc761-w">beside, never added — Finance says which line</span></td><td class="num">${m(P.wages.toDate)}</td><td class="num"><b>${m(P.wages.job)}</b></td><td class="acc761-why">the running sheet at the rates on the record · ${esc(fmtNum(P.wages.unpricedHours || 0))} h with no wage rate · Direct Staff (3210), or Installation — internal labour (2143) if charged to the install</td></tr>
 </tbody></table></div></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>Recovery — the ratios the business reads</h3><p>For every dollar we pay, what we charge on. On the record, then to job end.</p></div></div>
 <div class="tblwrap"><table class="acc761-tbl pl770-tbl"><thead><tr><th>Ratio</th><th>What</th><th class="num">On the record</th><th class="num">To job end</th><th>Reading</th></tr></thead><tbody>
 ${P.rec.map(r => `<tr><td><b>${esc(r.name)}</b></td><td class="acc761-w">${esc(r.what)}</td><td class="num">${x(r.now)}</td><td class="num"><b>${x(r.job)}</b></td><td class="acc761-why">${esc(r.words)}</td></tr>`).join('')}
 </tbody></table></div></div>
 <p class="fin745-basis acc761-foot">Author: Andrew Fisher · in the business’s lines v7.70 · the lines and their codes are the Coates P&amp;L’s; the kitty each charge goes to is the 2026 street card’s column for it · read from the record; the P&amp;L’s own figures are unchanged by this card.</p>
 </section>`;
}
/* v7.66 - REHIRE BY BRANCH. Andrew, 1 Oct 2026:""", 'pl770 model and card', p, True)

# 2. drawn under the Forecast P&L, before Costs to job end; a line in the At a glance flow
t = rep(t, """ ${pl752Card()}
${cj764Card()}""", """ ${pl752Card()}
${pl770Card()}
${cj764Card()}""", 'renderCosts', p, True)
t = rep(t, """<li><button class="linkish" data-jump765="costs764">Costs to job end</button>""",
 """<li><button class="linkish" data-jump765="pl770">In the business’s lines</button> — the same figures on the P&amp;L’s own lines, with the recovery ratios</li><li><button class="linkish" data-jump765="costs764">Costs to job end</button>""", 'glance flow', p, True)

# 3. two CSS rules
t = rep(t, ".rh766-miss{color:#9c470c;font-weight:600}", ".rh766-miss{color:#9c470c;font-weight:600}.pl770-tbl td:first-child{white-space:nowrap}.pl770-over td,.pl770-over td b{color:var(--mute)}", 'css', p, True)

open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print("v7.70 applied: the Forecast P&L in the business's lines - one card, every figure read from the cards already on the page, self-checked to the cent")
