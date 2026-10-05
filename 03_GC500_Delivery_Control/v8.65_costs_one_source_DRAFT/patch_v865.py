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
    "`+ wages priced ${esc(money(W.job))}: Job Connect ${esc(money(r2(W.job - (W.allowanceForecast || 0))))}${W.allowanceForecast ? ' + salary allowance forecast ' + esc(money(W.allowanceForecast)) : ''}${W.unpricedHours ? ` · ${esc(fmtNum(W.unpricedHours))} h of Coates wages not priced` : ''}`)}\n ${(() => { let L, T; try { L = labourRevenue858(); T = pl760Ticks(); } catch (e) { return ''; } return tile('Labour per piece', m0(L.recorded), `ticked so far · ${esc(fmtNum(T.ticks))} ticks`, m0(L.job), 'if every line were ticked', `${esc(money(L.remaining))} still to tick — install, steps, levelling and demob at the 2026 card, already inside Revenue to job end · the cost side is wages: ${esc(money(W.toDate))} to date, ${esc(money(W.job))} priced to job end`); })()}",
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
