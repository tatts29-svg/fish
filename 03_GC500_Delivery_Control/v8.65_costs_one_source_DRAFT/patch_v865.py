# Author: Andrew Fisher. v8.65 Costs & P&L: one labour forecast, cents that reconcile, and the glance says what it carries.
import hashlib, os, sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep as replace
p = Path(sys.argv[1])
BASES = {'d725d9acd069a208be3e3ecc757f3b914c9b98bff67a5432475dde6e2ae7a7d2': 'v8.64'}  # live v8.64
h = hashlib.sha256(p.read_bytes()).hexdigest()
assert h in BASES, 'Wrong live base ' + h
s = p.read_text(encoding='utf-8-sig')
assert 'v8.65' not in s.split('</style>')[0] or True
def rep(a, b, what):
    global s
    s = replace(s, a, b, what, str(p))

# C1. ONE RULE FOR A RELOCATION, IN BOTH LABOUR FORECASTS. labourRevenue858 (the P&L's Installation to job end) counted
# install AND demob on a relocation task (T0159: 5 VMS moved, $884.85); labourPlan (the Accruals card and the month-end
# words) left relocations out altogether. So the same forecast read $71,318.91 on one card and $70,434.06 on the next.
# The rule now, in both: a relocation re-installs the plant, so its install, steps and levelling are forecast; its demob is
# not, because the plant is demobbed once, on the reference it came from.
rep("for(const item of info.lines.filter(x=>keys.has(x.key))){",
    "for(const item of info.lines.filter(x=>keys.has(x.key)&&!(a.relocation&&x.key==='demob'))){ /* v8.65 - a relocation is re-installed, not demobbed twice */",
    'C1a labourRevenue858 relocation rule')
rep("     sums[item.key]+=qty*item.rate;", "     sums[item.key]+=Math.round(qty*item.rate*100)/100; /* v8.65 - cents, as labourMoney rounds */", 'C2d labourRevenue858 cents')
rep("allAssets().filter(a => !a._cancelled && !a.relocation && !movedAway(a.key)).forEach(a => {\n const br = branchOf(a.key) || {}, code = br.code || '', on = !!onMap.get(a.key), units = labourUnits(a);",
    "allAssets().filter(a => !a._cancelled && !a.rest_of && !movedAway(a.key)).forEach(a => { /* v8.65 - the same references as labourRevenue858: relocations in, their demob out (below) */\n const br = branchOf(a.key) || {}, code = br.code || '', on = !!onMap.get(a.key), units = labourUnits(a);",
    'C1b labourPlan references')
rep(" info.lines.forEach(L => {\n const n = u === LAB_REST ? restN : 1;",
    " info.lines.forEach(L => {\n if (a.relocation && L.key === 'demob') return; /* v8.65 - a relocation is re-installed, not demobbed twice */\n const n = u === LAB_REST ? restN : 1;",
    'C1c labourPlan relocation rule')

rep(" const zero = () => ({charged: 0, expected: 0, tocome: 0, later: 0, n: {charged: 0, expected: 0, tocome: 0, later: 0}, unpriced: 0});",
    """ /* v8.65 - cents by the one rule (labourCents865): per card line and labour line, rate × pieces to the cent; the ticked pieces
    first, the forecast is the rest, so the Accruals card adds to the P&L's charge and to labourRevenue858 exactly */
 { const r2 = v => Math.round(v * 100) / 100, groups = new Map();
 slots.forEach(sl => { if (sl.value == null) return; const g = [sl.ref, sl.disc, sl.item, sl.key].join('|'); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(sl); });
 groups.forEach(G => { const rate = G[0].rate, nAll = G.reduce((n, sl) => n + (sl.qty || 0), 0), nT = G.filter(sl => sl.state === 'charged').reduce((n, sl) => n + (sl.qty || 0), 0);
 const F = r2(rate * nAll), C = r2(rate * nT), share = (list, total) => { let acc = 0; list.forEach((sl, i) => { sl.value = i === list.length - 1 ? r2(total - acc) : r2(rate * (sl.qty || 0)); acc = r2(acc + sl.value); }); };
 share(G.filter(sl => sl.state === 'charged'), C); share(G.filter(sl => sl.state !== 'charged'), r2(F - C)); }); }
 const zero = () => ({charged: 0, expected: 0, tocome: 0, later: 0, n: {charged: 0, expected: 0, tocome: 0, later: 0}, unpriced: 0});""", 'C2e labourPlan cents')

rep("function labourMoney(ref, l, key, asset){",
    "/* v8.65 - ONE ROUNDING RULE FOR LABOUR MONEY. A card line's labour is its rate × the pieces ticked (or, for a forecast, the pieces on\n   the reference), rounded to the cent once per labour line; the labour lines add. labourMoney, pl760Ticks, labourRevenue858 and\n   labourPlan all use it, so the P&L, the Accruals card and the Pricing tab add to the same cent. */\nfunction labourCents865(parts){ const by = new Map(); parts.forEach(q => { const k = by.get(q.key) || {rate: q.rate, n: 0}; k.n += q.n; by.set(q.key, k); });\n return Math.round([...by.values()].reduce((s, k) => s + Math.round(k.rate * k.n * 100) / 100, 0) * 100) / 100; }\nfunction labourMoney(ref, l, key, asset){", 'C2 helper')
# C2. MONEY IS CENTS. Half-cent card rates (a VMS install is $88.485, half of $176.97) left a line's labour total at a half
# cent, so two sums of the same ticks landed a cent apart (charge.labour $19,825.85, pl760Ticks $19,825.84) and labourPlan
# invented a 'Relocated or moved units · $0.01' row to make them meet. Every line's labour total is now rounded to the
# cent where it is made, and pl760Ticks shares each line's total across its ticks so the two add to the cent by construction.
rep(" return {total: ticked.reduce((s, x) => s + (x.rate || 0) * qty, 0), ticked: ticked, info: info, blocked: false, qty: qty, units: []};",
    " return {total: Math.round(ticked.reduce((s, x) => s + Math.round((x.rate || 0) * qty * 100) / 100, 0) * 100) / 100, ticked: ticked, info: info, blocked: false, qty: qty, units: []}; /* v8.65 - each card line's labour is rate × pieces, to the cent */",
    'C2a labourMoney cents (one building)')
rep(" return {total: per.reduce((s, p) => s + p.ticked.reduce((t, x) => t + (x.rate || 0), 0) * (p.unit === LAB_REST ? restN : 1), 0), ticked: allTicked, info: info,\n blocked: false, qty: qty, units: per, perBuilding: true};",
    " return {total: labourCents865(per.flatMap(p => p.ticked.map(x => ({key: x.key, rate: x.rate || 0, n: p.unit === LAB_REST ? restN : 1})))), ticked: allTicked, info: info,\n blocked: false, qty: qty, units: per, perBuilding: true}; /* v8.65 - each card line's labour is rate × pieces, to the cent */",
    'C2b labourMoney cents (per building)')
rep(""" (t.lines || []).forEach(l => { const lab = l.labour; if (!lab || !lab.ticked || !lab.ticked.length) return;
 if (lab.perBuilding) { const units = (lab.units || []).map(q => q.unit); const restN = labourRestN(a, l.item, units);
 (lab.units || []).forEach(q => (q.ticked || []).forEach(x => add(PL760_GROUP[x.key] || 'other', br, lab.total == null ? null : (x.rate || 0) * (q.unit === LAB_REST ? restN : 1)))); }
 else lab.ticked.forEach(x => add(PL760_GROUP[x.key] || 'other', br, lab.total == null ? null : (x.rate || 0) * (lab.qty || 0))); }); });""",
    """ (t.lines || []).forEach(l => { const lab = l.labour; if (!lab || !lab.ticked || !lab.ticked.length) return;
 /* v8.65 - the same rule as labourMoney: per card line, rate × pieces ticked, to the cent; every tick is still counted */
 const by = new Map(), put = (x, n) => { const k = by.get(x.key) || {grp: PL760_GROUP[x.key] || 'other', rate: x.rate || 0, n: 0, ticks: 0}; k.n += n; k.ticks++; by.set(x.key, k); };
 if (lab.perBuilding) { const units = (lab.units || []).map(q => q.unit); const restN = labourRestN(a, l.item, units); (lab.units || []).forEach(q => (q.ticked || []).forEach(x => put(x, q.unit === LAB_REST ? restN : 1))); }
 else lab.ticked.forEach(x => put(x, lab.qty || 0));
 by.forEach(k => { const amt = lab.total == null ? null : Math.round(k.rate * k.n * 100) / 100; for (let i = 0; i < k.ticks; i++) add(k.grp, br, amt == null ? null : i === 0 ? amt : 0); }); }); });""",
    'C2c pl760Ticks shares the line total')

# C3. THE GLANCE SAYS WHAT IT CARRIES. Revenue to job end has included the labour still to tick since v8.58, but the tile
# said it was "not carried"; the wages note called the whole $49,249.83 "Job Connect" when $14,700 of it is the salary
# allowance forecast. And the two figures Andrew asked for - labour ticked so far, and labour if every line were ticked -
# get a tile of their own.
rep("provisional transport pending branch entry · labour still to tick is not carried`)}",
    "provisional transport pending branch entry + ${esc(money(R.labourToCome))} of labour per piece still to tick, at the 2026 card`)}",
    'C3a revenue tile note')
rep("`+ wages priced ${esc(money(W.job))} (Job Connect)${W.unpricedHours ? ` · ${esc(fmtNum(W.unpricedHours))} h of Coates wages not priced` : ''}`)}",
    "`+ wages priced ${esc(money(W.job))}: Job Connect ${esc(money(r2(W.job - (W.allowanceForecast || 0))))}${W.allowanceForecast ? ' + salary allowance forecast ' + esc(money(W.allowanceForecast)) : ''}${W.unpricedHours ? ` · ${esc(fmtNum(W.unpricedHours))} h of Coates wages not priced` : ''}`)}\n ${(() => { let L, T, race; try { L = labourRevenue858(); T = pl760Ticks(); race = (M.charge || {}).race || {}; } catch (e) { return ''; } const ppl = Number(race.people_amount) || 0, now = r2(L.recorded + ppl), job = r2(L.job + ppl); return tile('Labour we charge', m0(now), 'charged so far', m0(job), 'forecast to job end', `per piece ${esc(money(L.recorded))} ticked (${esc(fmtNum(T.ticks))} ticks) + the race weekend people ${esc(money(ppl))} · ${esc(money(L.remaining))} of per-piece labour still to tick · what the labour costs us is in Labour, the whole job, below`); })()}",
    'C3b wages note + Labour tile')
rep("if(notes[0])notes[0].textContent='Contracts, card rates and recorded dockets. Job end includes the remaining fencing programme; labour still to tick is excluded.';",
    "if(notes[0]){const R865=cj764Model().revenue;notes[0].textContent='Contracts, card rates and recorded dockets. Job end adds the remaining fencing programme at the 2026 card, the provisional transport and '+money(R865.labourToCome)+' of labour per piece still to tick at the card.';} /* v8.65 - it IS carried */",
    'C3e adapter revenue note')
rep("const labels=pane.querySelectorAll('.cj765-tile>span');if(labels[2])labels[2].textContent='Difference so far';",
    "pane.querySelectorAll('.cj765-tile>span').forEach(l=>{if(l.textContent.trim()==='Difference')l.textContent='Difference so far';}); /* v8.65 - by its name, not its place */",
    'C3f adapter difference label')
rep("""  pane.querySelectorAll('.cj765-tile').forEach((tile,i)=>{
   const note=tile.querySelector('.cj765-note');if(!note)return;
   if(i===1){
    const W=cj764Model().wages;note.textContent='Priced wages: '+money(W.job)+'. '+fmtNum(W.unpricedHours||0)+' h remain unpriced. Job-end difference deducts priced wages.';
   }
   if(i!==2 && i!==1)fold(note,i===3?'Finance proposal details':'Revenue basis','headline-'+i);
  });""",
    """  pane.querySelectorAll('.cj765-tile').forEach((tile,i)=>{ /* v8.65 - each tile by its name, so a new tile does not take another's words */
   const note=tile.querySelector('.cj765-note');if(!note)return;const label=((tile.querySelector('span')||{}).textContent||'').trim();
   if(label==='Direct costs'){
    const W=cj764Model().wages,jc=Math.round((W.job-(W.allowanceForecast||0))*100)/100;note.textContent='Priced wages: '+money(W.job)+' — Job Connect '+money(jc)+(W.allowanceForecast?' + salary allowance forecast '+money(W.allowanceForecast):'')+'. '+fmtNum(W.unpricedHours||0)+' h of Coates wages remain unpriced. The job-end difference deducts priced wages.';return;
   }
   if(label==='Revenue')fold(note,'Revenue basis','headline-'+i);else if(label==='Month-end for Finance')fold(note,'Finance proposal details','headline-'+i);
  });""", 'C3g adapter notes by label')
rep(".cj765-tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}",
    ".cj765-tiles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}", 'C3c five tiles')
rep(".cj765-tiles{grid-template-columns:repeat(4,1fr);gap:1.5mm}",
    ".cj765-tiles{grid-template-columns:repeat(5,1fr);gap:1.5mm}", 'C3d five tiles in print')

# C4. TWO "DIFFERENCE" FIGURES, ONE NAME EACH. The P&L card showed "Difference before overheads" (61%) beside "Difference
# so far" (58%): the first is the ledger's gross margin before travel, accommodation, meals and wages; it now says so.
rep("${fin745Card('Difference before overheads — to job end', `${money(P.gm.job)} · ${pc(P.gm.pcJob)}`, `${esc(money(P.gm.now))} · ${pc(P.gm.pcNow)} on the record · revenue less the ledger’s direct lines · the P&L’s Gross Margin once the costs are complete — not a margin yet: before wages, the supplier costs not on the record and the loads and hours not priced`)}",
    "${fin745Card('Ledger gross margin — to job end, before travel, accommodation, meals and wages', `${money(P.gm.job)} · ${pc(P.gm.pcJob)}`, `${esc(money(P.gm.now))} · ${pc(P.gm.pcNow)} on the record · revenue less the ledger’s direct lines only — the P&L’s Gross Margin once the costs are complete, not a margin yet: before wages, the supplier costs not on the record and the loads and hours not priced · the Difference beside it, and At a glance, take the travel, accommodation and meals off too`)}",
    'C4 ledger gross margin label')

# C5. THE FINANCE SUB-VIEWS ARE NAMED AS THEIR BUTTONS ARE. The hidden heading read "runsheet — …" (the internal key) and
# "Pricing — …" under a button that says Customer rates & charges.
rep("function paneHeadingHtml(tab){\n const label = (TABS.find(([key]) => key === tab) || [tab, tab])[1];",
    "function paneHeadingHtml(tab){\n const FIN865 = {pricing: 'Customer rates & charges', runsheet: 'Workforce costs'}; /* v8.65 - the Costs & P&L buttons' own words */\n const label = FIN865[tab] || (TABS.find(([key]) => key === tab) || [tab, tab])[1];",
    'C5 sub-view headings')


# C7. LABOUR, THE WHOLE JOB, BOTH SIDES, ONCE. Andrew: "we also have the costs for race weekend. For labour so we need to be
# clear on total forecast for labour." One card under the glance: what we charge for labour (per piece + the race weekend
# people) and what the labour costs us (the running sheet, race weekend and the rest, the salary allowance), each to job end.
rep("function cj765Fold(key, title, sub, inner){",
    """function labourWholeJob865(){
 let L, T, M, X, A, rows; try { L = labourRevenue858(); T = pl760Ticks(); M = moneySummary(); X = cj764Model(); A = acc761Labour(); rows = fin745Rows(todayIso()); } catch (e) { return ''; }
 const r2 = v => Math.round((v + Number.EPSILON) * 100) / 100, n = v => Number(v) || 0, m = v => v == null ? '<span class="acc761-w">—</span>' : esc(money(v)), h = v => esc(fmtNum(v)) + ' h';
 const race = M.charge.race || {}, people = n(race.people_amount), at = n(race.at), ev = new Set(EVENT_DAYS || []), td = todayIso();
 const costOf = r => r.status === 'confirmed' && r.actualCost != null ? r.actualCost : r.calculatedCost;
 const agg = list => { const o = {shifts: 0, paid: 0, priced: 0, pricedHours: 0, unpriced: 0, toDate: 0, toCome: 0, people: new Set(), noRate: new Set()}; list.forEach(r => { o.shifts++; const paid = n(r.paid); o.paid += paid; const cost = costOf(r); if (cost == null) { o.unpriced += paid; o.noRate.add(r.person); } else { o.priced += cost; o.pricedHours += paid; if (r.date && r.date <= td && r.status !== 'forecast') o.toDate += cost; else o.toCome += cost; } o.people.add(r.person); }); ['paid', 'priced', 'pricedHours', 'unpriced', 'toDate', 'toCome'].forEach(k => { o[k] = r2(o[k]); }); return o; };
 const R = agg(rows.filter(r => ev.has(r.date))), O = agg(rows.filter(r => !ev.has(r.date))), ALL = agg(rows), allow = labourAllowance858();
 const chargeNow = r2(L.recorded + people), chargeJob = r2(L.job + people), costJob = r2(ALL.priced + allow), costNow = ALL.toDate;
 const row = (what, a, b, c, basis, cls) => `<tr${cls ? ` class="${cls}"` : ''}><td>${what}</td><td class="num">${a}</td><td class="num">${b}</td><td class="num"><b>${c}</b></td><td class="acc761-why">${basis}</td></tr>`;
 const evWords = ev.size ? `${esc(fmtDate(EVENT_DAYS[0]))} to ${esc(fmtDate(EVENT_DAYS[EVENT_DAYS.length - 1]))}` : 'the race weekend';
 return `<section id="labour865" class="card fin745 nosfold" aria-labelledby="labour865Title">
 <div class="fin745-heading"><div><p class="fin745-eyebrow">LABOUR · THE WHOLE JOB · AUD EX GST · AS AT ${esc(fmtDate(X.asAt).toUpperCase())}</p><h2 id="labour865Title">Labour — what we charge, and what it costs us</h2>
 <p>Every labour figure on the job, once, both sides. The first table is what Coates charges the V8s for labour; the second is what the people cost us. The two are never added together.</p></div></div>
 <div class="fin745-metrics acc761-metrics">
 ${fin745Card('Total labour we will charge, to job end', money(chargeJob), `${money(chargeNow)} charged so far + ${money(L.remaining)} still to tick · per piece from the card ${money(L.job)} + the race weekend people ${money(people)}`)}
 ${fin745Card('What the labour costs us, priced to job end', money(costJob), `${money(costNow)} to date · Job Connect ${money(ALL.priced)} + salary allowance ${money(allow)} · ${fmtNum(ALL.unpriced)} h of Coates wages still have no pay rate, so this will rise`)}
 ${fin745Card('Labour charged less labour cost priced', money(r2(chargeJob - costJob)), `to job end · not a margin and not a profit until the ${fmtNum(ALL.unpriced)} unpriced hours are priced`)}
 </div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>What we charge for labour</h3><p>Per piece of equipment from the 2026 card, ticked as the work is done, plus the people over the race weekend by the hour from the event labour scope.</p></div></div>
 <div class="tblwrap"><table class="acc761-tbl"><thead><tr><th>Labour we charge</th><th class="num">Charged so far</th><th class="num">Still to come</th><th class="num">Forecast to job end</th><th>Basis</th></tr></thead><tbody>
 ${row('Labour per piece — install, steps, levelling, demob', m(L.recorded), m(L.remaining), m(L.job), `${esc(fmtNum(T.ticks))} ticks so far at the card’s per-piece rates · the forecast is every priced labour line on every live reference · a relocation is re-installed, not demobbed twice`)}
 ${row(`Race weekend — the people, ${evWords}`, m(people), m(0), m(people), `${h(n(race.hours))} of people over the three race days at the scope’s rates (${esc(race.document || 'the event labour scope')})${race.provisional ? ' · provisional until the access plan is final' : ''}`)}
 ${row('<b>Total labour we charge</b>', `<b>${m(chargeNow)}</b>`, `<b>${m(L.remaining)}</b>`, m(chargeJob), 'the P&amp;L’s Installation line (1047), to the cent', 'acc761-grand')}
 </tbody></table></div>
 <p class="acc761-w">Kept apart, not labour: accommodation and travel in the scope ${esc(money(at))} · cleaning ${esc(money(A.groups.cleaning.total))} (at the end) · fire extinguishers ${esc(money(A.groups.fire_ext.total))} (a hire charge).</p></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>What the labour costs us</h3><p>The running sheet’s paid hours at the pay rates on the record. A Coates wages person with no rate yet is hours, not dollars — the biggest cost on the job stays as hours until the rates are set.</p></div></div>
 <div class="tblwrap"><table class="acc761-tbl"><thead><tr><th>Labour cost</th><th class="num">To date</th><th class="num">To come</th><th class="num">Forecast to job end</th><th>Basis</th></tr></thead><tbody>
 ${row(`Race weekend — ${evWords}`, m(R.toDate), m(R.toCome), m(R.priced), `${esc(fmtNum(R.shifts))} shifts, ${h(R.paid)} paid, ${esc(fmtNum(R.people.size))} people · priced ${h(R.pricedHours)} · <b>${h(R.unpriced)} with no pay rate yet</b>`)}
 ${row('The rest of the job — build and demob', m(O.toDate), m(O.toCome), m(O.priced), `${esc(fmtNum(O.shifts))} shifts, ${h(O.paid)} paid · priced ${h(O.pricedHours)} · <b>${h(O.unpriced)} with no pay rate yet</b>`)}
 ${row('Salary allowance — forecast', m(0), m(allow), m(allow), 'living-away and uplift allowance, whole job, once · base salary and on-costs are not in it')}
 ${row('<b>Total labour cost priced</b>', `<b>${m(costNow)}</b>`, `<b>${m(r2(costJob - costNow))}</b>`, m(costJob), `what the P&amp;L calls wages priced · <b>${h(ALL.unpriced)} of Coates wages still have no rate</b>${ALL.noRate.size ? ' (' + esc([...ALL.noRate].join(', ')) + ')' : ''}`, 'acc761-grand')}
 </tbody></table></div>
 <p class="acc761-w"><b>Labour charged less labour cost priced, to job end: ${esc(money(r2(chargeJob - costJob)))}</b> — before ${h(ALL.unpriced)} of Coates wages are priced; not a margin and not a profit. Set the pay rates under Month-end control and this line moves at once.</p></div>
 </section>`;
}
function cj765Fold(key, title, sub, inner){""", 'C7 labour whole-job card')
rep("${cj765Glance()}\n ${pl752Card()}", "${cj765Glance()}\n ${labourWholeJob865()}\n ${pl752Card()}", 'C7 card under the glance')

# C8. PLAIN WORDS ON THE FOLDS. The six folded sections say what question each answers.
rep("['pl752','Revenue and Direct costs by branch','Contract lines, card rates, dockets and known job costs','Partial costs'],",
    "['pl752','By branch — who bills what, and what each branch’s costs are','Contract lines at the rate, the card, the dockets and the costs known','Partial costs'],", 'C8 pl752 title')
rep("['pl770','P&L account lines and recovery','The business’s ledger lines, with the source and scope of each figure','Finance review'],",
    "['pl770','On Finance’s P&L lines — the same money on the account codes','With the ledger gross margin and the recovery ratios the business reads','Finance review'],", 'C8 pl770 title')
rep("['costs764','Forecast to job end and missing costs','Remaining programme, estimates and the items still needing a rate','Forecast'],",
    "['costs764','To job end — what is still to come, and what has no price yet','The remaining fencing programme, the transport estimate and every item still needing a rate','Forecast'],", 'C8 costs764 title')
rep("['rehire766','Rehire by branch','Supplier costs, what we charge and whether known costs are covered','Cost gaps'],",
    "['rehire766','Hired-in gear — what it costs us and what we charge for it','Toilets, fencing and the sub-hired plant, by branch','Cost gaps'],", 'C8 rehire766 title')
rep("['accruals761','Accruals for Finance','Work-month evidence, people, hours and the Finance review export','Review first'],",
    "['accruals761','Month-end — what Finance should accrue for the work month','Revenue earned but not billed, costs incurred but not invoiced, and the export for Finance','Review first'],", 'C8 accruals761 title')
rep("['finance745','Actuals, forecast and journals','Confirmed costs, forecast costs and external posting references','Record controls']",
    "['finance745','Actual hours and costs — confirmed, pending and forecast','Pay rates, the billing months and the Finance journal requests','Record controls']", 'C8 finance745 title')

# C6. ONE PLACE FOR EACH HEADLINE FIGURE. Revenue on the record ($612,654) was printed eight times down the Costs page, direct
# costs known four times, the difference four times: At a glance, then again as the Forecast P&L's header tiles and its
# "Difference so far" line, then again as three metric cards on the P&L-lines card. The glance is the one place now; the
# Forecast P&L keeps its by-branch table and totals, the P&L-lines card keeps its ledger lines, their totals, and the one
# figure no other card has (the ledger gross margin). Presentation only, in the same way as the v8.54 clarity pass.
rep('</script>\n<style id="flicker863">',
    """
/* v8.65 one place for each headline figure START */
(function(){
 function once865(){
  const pane=document.getElementById('pane-costs'); if(!pane||!pane.querySelector('#costs765'))return;
  pane.querySelectorAll('#pl752 .pl-kpis').forEach(n=>n.remove());
  pane.querySelectorAll('#pl752 .pl-ln.diff').forEach(n=>n.remove());
  pane.querySelectorAll('#pl770 .fin745-metrics .fin745-metric').forEach(c=>{const l=((c.querySelector('span')||{}).textContent||'').trim();if(!/^Ledger gross margin/.test(l))c.remove();});
  /* the wages sentence stood under the Forecast P&L's cost total AND as the first "Not in it yet" bullet: once is enough */
  pane.querySelectorAll('#pl752 .pl-ln small').forEach(n=>{if(/^wages — /.test(n.textContent.trim()))n.remove();});
  /* the Event crew card is a planned roster for the race days; the costs are in Labour, the whole job. It goes with the people, in the working */
  const ev=pane.querySelector('details[data-sfold="costs765|event833"]'),cats=pane.querySelector('details[data-sfold="costs765|cats"]');if(ev&&cats&&!cats.contains(ev))cats.append(ev);
 }
 const prev=renderCosts; renderCosts=function(){const r=prev.apply(this,arguments);once865();return r;};
 const prevD=window.costsAuditDecorate; window.costsAuditDecorate=function(){if(prevD)prevD.apply(this,arguments);once865();};
 window.gc500CostsOnce865=true;
})();
/* v8.65 one place for each headline figure END */
</script>
<style id="flicker863">
/* v8.65 - a phone never breaks a dollar figure across two lines: the two figures stack, at a size that fits */
@media(max-width:640px){.cj765-tile{grid-template-columns:1fr!important}.cj765-now,.cj765-end{font-size:24px;line-height:1.1;white-space:nowrap}.cj765-now small,.cj765-end small{white-space:normal}}""", 'C6 one place for each headline figure')
rep('· ' + BASES[h], '· v8.65', 'footer version')
p.write_text(s, encoding='utf-8-sig')
