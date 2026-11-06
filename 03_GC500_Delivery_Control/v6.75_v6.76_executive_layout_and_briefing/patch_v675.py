#!/usr/bin/env python3
"""v6.75 - THE EXECUTIVE AUDIT, STAGE 2: THE FIRST SCREEN (audit sections 6 and 7).

  * Executive / Operations layout. The same page and the same figures, two ways of showing them. Executive (the
    default) folds the header to one row, about 110 px instead of 270: the project, its phase and day, the event
    date in calendar days, whether the record is live and when it last answered, and search. Operations is the
    full header - the clock, the countdown pod, the next delivery day - exactly as it was. Switch in Tools, or with
    ?layout=ops / ?layout=exec; the choice is kept on the device.
  * Where we are is the executive summary. "The job at a glance" leads it: one scoped sentence, four measures with
    their unit and cohort (due-delivery adherence, quantity recorded, due-work exceptions, commercial
    completeness), at most three decisions with owner and due date ("to confirm" where nobody is named), and the
    next seven days. The group and branch plates fold under it (open by default in Operations).
  * Today is the action page. The same actions and the next seven days head it. In Executive the repeated
    summaries - the banner, the lights, the dial, the programme card, the money, map and document teasers and
    the stale roads snapshot - step back behind one row of links; Operations keeps them all.
  * One word for the date: "event opens" / "days to the event", everywhere the page said race day, the LED board
    included.

  python3 patch_v675.py <page.html> [builder.py]
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402

JS = r"""/* v6.75 - EXECUTIVE / OPERATIONS (the executive audit, section 6). One page, one set of figures, two layouts.
 Executive folds the header to one row and puts the job at a glance first; Operations is the full working header.
 The choice is this device's, kept in its own storage; ?layout=ops or ?layout=exec sets it from a link. */
var LAYOUT = (() => { let v = null;
 try { const q = new URLSearchParams(location.search).get('layout'); if (q === 'ops' || q === 'exec') { v = q; localStorage.setItem('gc500.layout', q); } else v = localStorage.getItem('gc500.layout'); } catch (e) {}
 return {mode: v === 'ops' ? 'ops' : 'exec'}; })();
function layoutApply(){
 document.body.classList.toggle('exec', LAYOUT.mode === 'exec'); document.body.classList.toggle('ops', LAYOUT.mode === 'ops');
 const b = document.getElementById('layoutBtn'); if (b) { b.textContent = 'Layout: ' + (LAYOUT.mode === 'exec' ? 'Executive' : 'Operations'); b.setAttribute('aria-pressed', String(LAYOUT.mode === 'exec')); }
 const h = document.getElementById('hzsLayout'); if (h) h.textContent = LAYOUT.mode === 'exec' ? 'Full header' : 'Compact';
}
function layoutSet(m){ LAYOUT.mode = m === 'ops' ? 'ops' : 'exec'; try { localStorage.setItem('gc500.layout', LAYOUT.mode); } catch (e) {} layoutApply(); try { render(); } catch (e) {} }
try { layoutApply(); } catch (e) {}
document.addEventListener('click', e => {
 const t = e.target.closest && e.target.closest('#layoutBtn, #hzsLayout, [data-xgo]'); if (!t) return;
 if (t.id === 'layoutBtn' || t.id === 'hzsLayout') { e.preventDefault(); layoutSet(LAYOUT.mode === 'exec' ? 'ops' : 'exec'); return; }
 e.preventDefault(); go(t.dataset.xgo);
});
/* THE JOB AT A GLANCE. Every figure here is one the rest of the page already shows - the gauge, the plates, the
 money summary - read through the same functions, so the summary cannot disagree with the detail under it. */
function execFacts(asOf){
 const C = completionAsOf(asOf), P = C.P;
 const gaps = fenceGapsOf(fenceTypes(P));
 const bdOpen = allBreakdowns().filter(b => b.open), bdStop = bdOpen.filter(b => b.severity === 'stops work');
 let M = null; try { M = moneySummary(asOf); } catch (e) {}
 return {C, P, A: P.all, gaps, bdOpen, bdStop, M};
}
function execSentence(F){
 const C = F.C, A = F.A, bits = [];
 if (!C.plan) bits.push('Nothing is due on site by today');
 else bits.push(`${C.shortfall ? `${fmtNum(C.shortfall)} unit${C.shortfall === 1 ? '' : 's'} due by today ${C.shortfall === 1 ? 'is' : 'are'} not recorded on site` : 'Every unit due by today is recorded on site'} (${fmtNum(C.onDue)} of ${fmtNum(C.plan)} units; ${fmtNum(A.onsite)} of ${fmtNum(A.due)} references)`);
 bits.push(F.gaps.length ? `fencing is behind the programme on ${F.gaps.length} type${F.gaps.length === 1 ? '' : 's'}` : 'fencing is on the programme type by type');
 if (F.bdOpen.length) bits.push(`${F.bdOpen.length} breakdown${F.bdOpen.length === 1 ? ' is' : 's are'} open`);
 if (F.M && F.M.missing.length) bits.push('the commercial forecast is incomplete');
 return bits.join('; ') + '.';
}
/* at most three, in order of consequence: work stopped, work late, then the decisions the numbers wait on. The owner
 and the date are the record's when it has them and "to confirm" when it does not - never a guess. */
function execDecisions(F){
 const out = [], A = F.A, M = F.M;
 if (F.bdStop.length) out.push({what: `${F.bdStop.length} breakdown${F.bdStop.length === 1 ? '' : 's'} stopping work`, why: 'work has stopped where it stands', go: 'plant'});
 if (A.overdue) out.push({what: `${fmtNum(A.overdue)} reference${A.overdue === 1 ? '' : 's'} overdue against the programme`, why: 'due by today with nothing recorded on site', go: 'progress'});
 if (F.gaps.length) out.push({what: 'Fencing behind the 2026 programme — ' + F.gaps.map(fenceGapWords).join(' · '), why: 'due by today and not on a docket yet; early work on other types does not make it up', go: 'fencing'});
 if (M && M.charge.contracts_differs) out.push({what: `Settle ${M.charge.contracts_differs} contract line${M.charge.contracts_differs === 1 ? '' : 's'} where Baseplan's prebill differs from the rule`, why: `${money0(M.charge.differs_charge)} by the rule against ${money0(M.charge.differs_prebill)} prebilled — counted by the rule until each is settled`, go: 'costs'});
 if (M && M.breakeven_hours) out.push({what: 'Supply the wage rates for the labour tracker', why: `${fmtNum(M.breakeven_hours)} h carry no rate, so the commercial forecast cannot be completed`, go: 'costs'});
 if (!fenceQuote()) out.push({what: 'Enter Advanced Temporary Fencing’s quoted quantities', why: 'over or under the quote cannot be assessed without them', go: 'fencing'});
 return out.slice(0, 3);
}
function execDecisionsHtml(F){
 const D = execDecisions(F);
 if (!D.length) return '<p class="xnone">No decision is waiting on this record today.</p>';
 return `<ol class="xdec">${D.map(d => `<li><button type="button" class="linkish xdw" data-xgo="${esc(d.go)}">${esc(d.what)}</button>
 <span class="xwhy">${esc(d.why)}</span><span class="xown">Owner <b class="todo">to confirm</b> · Due <b class="todo">to confirm</b></span></li>`).join('')}</ol>`;
}
function execNext7(asOf){
 const days = programmeDays(), t0 = new Date(asOf + 'T00:00:00'); const end = new Date(t0); end.setDate(end.getDate() + 7);
 const endIso = end.getFullYear() + '-' + String(end.getMonth() + 1).padStart(2, '0') + '-' + String(end.getDate()).padStart(2, '0');
 const rows = days.filter(d => d.iso > asOf && d.iso <= endIso);
 const race = (DATA.race_days || [])[0] || null;
 const ms = race && race > asOf ? `<p class="xms">Next milestone: <b>event opens ${esc(fmtDay(race).dow)} ${esc(fmtDay(race).dm)}</b> · ${daysBetween(asOf, race)} days</p>` : '';
 return (rows.length ? `<table class="xn7"><tbody>${rows.map(d => `<tr><td><button type="button" class="linkish" data-xgo="timeline">${esc(fmtDay(d.iso).dow)} ${esc(fmtDay(d.iso).dm)}</button></td>
 <td class="num"><b>${d.deliveries.length}</b> in</td><td class="num"><b>${d.removals.length}</b> out</td><td class="num">${d.loads.length ? `${d.loads.length} load${d.loads.length === 1 ? '' : 's'}` : ''}</td></tr>`).join('')}</tbody></table>`
 : '<p class="xnone">Nothing on the schedule in the next seven days.</p>') + ms;
}
function execTiles(F, asOf){
 const C = F.C, A = F.A, M = F.M;
 const exc = F.gaps.length + (A.overdue ? 1 : 0) + F.bdOpen.length;
 const T = [
 {k: 'Due-delivery adherence', v: C.plan ? `${fmtNum(C.onDue)} <small>of ${fmtNum(C.plan)}</small>` : '—', u: `units due by ${fmtDay(asOf).dm} recorded on site`, s: `${fmtNum(A.onsite)} of ${fmtNum(A.due)} references`, tone: !C.plan ? 'unk' : C.shortfall ? 'bad' : 'good', w: !C.plan ? 'nothing due' : C.shortfall ? 'behind' : 'met'},
 {k: 'Quantity recorded on site', v: fmtNum(C.on), u: 'units recorded on site so far', s: C.refsNoQty ? `whole job: ${fmtNum(C.quantified)} quantified units + ${fmtNum(C.refsNoQty)} references awaiting quantity — no percentage until they are confirmed` : `of ${fmtNum(C.all)} units on the whole job`, tone: 'unk', w: C.refsNoQty ? 'provisional' : 'recorded'},
 {k: 'Due-work exceptions', v: fmtNum(exc), u: 'behind or open today', s: [F.gaps.length ? `${F.gaps.length} fencing type${F.gaps.length === 1 ? '' : 's'} behind` : 'fencing on the programme', `${fmtNum(A.overdue || 0)} overdue reference${A.overdue === 1 ? '' : 's'}`, `${F.bdOpen.length} open breakdown${F.bdOpen.length === 1 ? '' : 's'}`].join(' · '), tone: exc ? 'bad' : 'good', w: exc ? 'action' : 'none'},
 {k: 'Commercial completeness', v: M && M.missing.length ? 'Forecast incomplete' : M ? 'Complete' : '—', u: M ? (M.missing.length ? `${M.missing.length} cost or charge item${M.missing.length === 1 ? '' : 's'} not in the figures` : 'every stream has its cost and its charge') : 'not read', s: M && M.charge.contracts_differs ? `${M.charge.contracts_differs} contract lines to settle · not a margin` : 'not a margin', tone: M && M.missing.length ? 'unk' : 'good', w: ''}];
 return `<div class="xtiles">${T.map(t => `<div class="xtile ${t.tone}"><p class="xk">${esc(t.k)}</p><b class="xv">${t.v}</b><span class="xu">${esc(t.u)}</span>${t.s ? `<span class="xs">${esc(t.s)}</span>` : ''}${t.w ? `<em class="xw">${esc(t.w)}</em>` : ''}</div>`).join('')}</div>`;
}
function execSummaryHtml(asOf){
 let F; try { F = execFacts(asOf); } catch (e) { return ''; }
 const pd = programmeDay(asOf);
 return `<section class="card xsum" aria-labelledby="xsumH">
 <div class="xhead"><h3 id="xsumH">The job at a glance</h3><span class="xasof">As at ${esc(fmtDate(asOf))}${pd && pd.short ? ' · ' + esc(pd.short) : ''}</span></div>
 <p class="xline">${esc(execSentence(F))}</p>
 ${execTiles(F, asOf)}
 <div class="xcols"><div><h4>Decisions needed</h4>${execDecisionsHtml(F)}</div><div><h4>The next seven days</h4>${execNext7(asOf)}</div></div>
 <div class="xlinks"><span>The detail:</span><button type="button" class="btn sm" data-xgo="plant">Plant</button><button type="button" class="btn sm" data-xgo="fencing">Fencing</button><button type="button" class="btn sm" data-xgo="costs">Costs</button><button type="button" class="btn sm" data-xgo="docs">Documents</button></div>
 </section>`;
}
/* Today, as the action page: the same sentence, the same decisions, the same seven days */
function execTodayHtml(today){
 let F; try { F = execFacts(today); } catch (e) { return ''; }
 return `<section class="card xsum xtoday" aria-labelledby="xtodH">
 <div class="xhead"><h3 id="xtodH">Actions</h3><span class="xasof">${esc(execSentence(F))}</span></div>
 <div class="xcols"><div><h4>Decisions needed</h4>${execDecisionsHtml(F)}</div><div><h4>The next seven days</h4>${execNext7(today)}</div></div>
 <div class="xlinks xexec"><span>Summaries:</span><button type="button" class="btn sm" data-xgo="progress">Where we are</button><button type="button" class="btn sm" data-xgo="map">Map</button><button type="button" class="btn sm" data-xgo="docs">Documents</button><button type="button" class="btn sm" data-xgo="costs">Costs</button></div>
 </section>`;
}
function renderToday(){"""

SLIM = """   <!-- v6.75 - the compact header (Executive layout): phase and day, the event date in calendar days, the record -->
   <div class="hzslim" id="hzslim" role="group" aria-label="Where the job is">
     <span class="hzs-ph" id="hzsPh"></span>
     <span class="hzs-ev" id="hzsEv"></span>
     <span class="hzs-rec" id="hzsRec"><i></i><b></b><em></em></span>
     <button type="button" class="hzs-lay" id="hzsLayout" title="Switch between the compact header and the full working header">Full header</button>
   </div>
   <!-- v6.20 - THE CIRCUIT IN THE BANNER"""

CSS = """
/* v6.75 - EXECUTIVE LAYOUT: one-row header, the job at a glance, Today as the action page */
.hzslim{display:none}
body.exec .hzcluster{display:none!important}
body.exec .hbar{height:auto;min-height:0;padding-top:8px;padding-bottom:8px}
@media (min-width:1101px){ body.exec .hbar{flex-wrap:nowrap} body.exec .hbar .search{flex:1 1 260px;min-width:200px;max-width:560px} }
body.exec .rbhero{max-height:340px;overflow:hidden}
@media (min-width:1101px) and (max-width:1399px){ body.exec .hzslim{gap:10px} body.exec .hzs-rec em{display:none} body.exec .hbar .search{min-width:160px} }
body.exec .hzslim{display:flex;order:4;align-items:center;gap:14px;flex:0 1 auto;margin-left:auto;color:#f3ece6;font-size:12.5px;white-space:nowrap;min-width:0}
.hzslim b{font-weight:800;color:#fff}
.hzs-ph{letter-spacing:.08em;text-transform:uppercase;font-size:11px;color:#e6dcd3}
.hzs-rec{display:inline-flex;align-items:center;gap:6px}
.hzs-rec i{width:8px;height:8px;border-radius:50%;background:#8a8a8a;flex:0 0 auto}
.hzs-rec.view i,.hzs-rec.shared i{background:#3ecf6e}
.hzs-rec.checking i,.hzs-rec.pending i{background:#f0b43c}
.hzs-rec.offline i,.hzs-rec.local i{background:#e0483e}
.hzs-rec em{font-style:normal;color:#d2c7bd;font-size:11.5px}
.hzs-lay{background:transparent;border:1px solid rgba(255,255,255,.28);color:#f3ece6;border-radius:6px;font:inherit;font-size:11px;padding:3px 8px;cursor:pointer}
.hzs-lay:hover,.hzs-lay:focus-visible{border-color:var(--orange);color:#fff}
@media (max-width:1100px){ body.exec .hzslim{flex:1 1 100%;order:5;margin-left:0;flex-wrap:wrap;gap:4px 14px;white-space:normal} }
@media (max-width:640px){ body.exec .hzslim{font-size:11.5px} .hzs-lay{display:none} }
body.exec #pane-today .dsnband, body.exec #pane-today .inst, body.exec #pane-today .roadscard,
body.exec #pane-today .hubcard[data-go="costs"], body.exec #pane-today .hubcard[data-go="map"], body.exec #pane-today #hubDocs{display:none!important}
.xlinks.xexec{display:none} body.exec .xlinks.xexec{display:flex}
.xsum{border-top:3px solid var(--orange)}
.xhead{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:4px 14px}
.xhead h3{margin:0}
.xasof{font-size:12.5px;color:var(--mute)}
.xtoday .xasof{font-size:13.5px;color:var(--ink2);flex:1 1 420px}
.xline{font-size:15px;line-height:1.45;color:var(--ink);margin:8px 0 12px;max-width:80ch}
.xtiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.xtile{position:relative;border:1px solid var(--rule);border-left:4px solid var(--rule);border-radius:10px;padding:10px 12px 12px;background:var(--tint2);min-width:0}
.xtile.good{border-left-color:var(--green)} .xtile.bad{border-left-color:var(--red)} .xtile.unk{border-left-color:#9aa1a8;border-left-style:dashed}
.xk{margin:0 0 4px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--slate);font-weight:700}
.xv{display:block;font-size:26px;line-height:1.1;font-weight:800;color:var(--ink);font-variant-numeric:tabular-nums}
.xtile:last-child .xv{font-size:21px;line-height:1.25}
.xv small{font-size:14px;font-weight:600;color:var(--ink2)}
.xu{display:block;font-size:12.5px;color:var(--ink2);margin-top:2px}
.xs{display:block;font-size:11.5px;color:var(--mute);margin-top:4px;line-height:1.35}
.xw{display:inline-block;margin-top:7px;padding:2px 7px;border-radius:999px;background:var(--rule2);font-style:normal;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--slate)}
.xtile.bad .xw{color:var(--red)} .xtile.good .xw{color:var(--green)}
.xcols{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:18px;margin-top:14px}
.xcols h4{margin:0 0 6px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--slate)}
.xdec{margin:0;padding-left:20px}
.xdec li{margin:0 0 9px;line-height:1.35}
.xdw{font-weight:700;text-align:left;color:var(--ink)}
.xwhy{display:block;font-size:12.5px;color:var(--ink2)}
.xown{display:block;font-size:11.5px;color:var(--mute);margin-top:2px}
.xn7{width:100%;min-width:0;border-collapse:collapse;font-size:13px}
.xn7 td{padding:4px 6px;border-bottom:1px solid var(--rule2)}
.xn7 td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.xms{margin:8px 0 0;font-size:12.5px;color:var(--ink2)}
.xnone{margin:0;color:var(--mute);font-size:13px}
.xlinks{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin-top:12px;padding-top:10px;border-top:1px solid var(--rule2);font-size:12.5px;color:var(--mute)}
@media (max-width:900px){ .xtiles{grid-template-columns:repeat(2,minmax(0,1fr))} .xcols{grid-template-columns:1fr} }
@media (max-width:420px){ .xtiles{grid-template-columns:1fr} .xv{font-size:22px} }
body.viewonly .fqform{display:none}
.cworktbl{table-layout:fixed;min-width:0} .cworktbl td{overflow-wrap:anywhere}
@media print{ .hzslim,.xlinks{display:none!important} }
</style>"""


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)

    t = R("function renderToday(){", JS, 'layout + summary js')
    t = R("   <!-- v6.20 - THE CIRCUIT IN THE BANNER", SLIM, 'hzslim html')
    t = R("""<button class="btn" role="menuitem" id="motionBtn" aria-pressed="false">Motion: Subtle</button>""",
          """<button class="btn" role="menuitem" id="motionBtn" aria-pressed="false">Motion: Subtle</button>
       <button class="btn" role="menuitem" id="layoutBtn" aria-pressed="true" title="Executive: a one-row header and the job at a glance first. Operations: the full working header and every summary card.">Layout: Executive</button>""", 'layout menu')
    # the slim header is filled by the same functions as the pods
    t = R("""set('#hzcdLab', lab); set('#hzcdN', String(n)); set('#hzcdU', unit); set('#hzcdSub', sub);""",
          """set('#hzcdLab', lab); set('#hzcdN', String(n)); set('#hzcdU', unit); set('#hzcdSub', sub);
 { const pd = programmeDay(iso), s1 = $('#hzsPh'), s2 = $('#hzsEv');
 if (s1) s1.textContent = pd ? pd.short : '';
 if (s2) s2.innerHTML = race ? (iso < race ? `Event opens ${esc(fmtDay(race).dow)} ${esc(fmtDay(race).dm)} · <b>${days(iso, race)}</b> day${days(iso, race) === 1 ? '' : 's'}` : iso <= raceEnd ? '<b>The event is running</b>' : end && iso <= end ? `Demob · <b>${days(iso, end)}</b> days to the end` : 'Programme ended') : ''; }""", 'slim fill')
    t = R("""el.innerHTML = `<span class="rslamps" aria-hidden="true"><i></i><i></i><i></i></span><span class="rsw"><b>${esc(big)}</b><em>${esc(r.sub)}</em></span>`;""",
          """el.innerHTML = `<span class="rslamps" aria-hidden="true"><i></i><i></i><i></i></span><span class="rsw"><b>${esc(big)}</b><em>${esc(r.sub)}</em></span>`;
 { const s = $('#hzsRec'); if (s) { s.className = 'hzs-rec ' + r.k; s.title = r.title; s.innerHTML = `<i aria-hidden="true"></i><b>${esc(big)}</b><em>${esc(r.sub)}</em>`; } }""", 'slim record')

    # Where we are: the job at a glance first; the plates fold under it
    t = R("""+ dsnHead(asOf) + dsnHeadline(asOf, X) + dsnGroups(asOf, X) + dsnBranches(asOf, X) + dsnMoney(asOf, X) + dsnOut(asOf);""",
          """+ dsnHead(asOf) + execSummaryHtml(asOf) + dsnHeadline(asOf, X)
 + `<details class="sfold more xplates" data-sfold="progress|plates"${(LAYOUT && LAYOUT.mode === 'ops') || SFOLD_OPEN.has('progress|plates') ? ' open' : ''}><summary>Group by group, branch by branch</summary><div class="sfoldbody">` + dsnGroups(asOf, X) + dsnBranches(asOf, X) + `</div></details>`
 + dsnMoney(asOf, X) + dsnOut(asOf);""", 'dsnScreen')
    t = R("""return `${fig('On site', `${esc(fmtNum(onUnits))}<small> of ${esc(fmtNum(asked))} on the job</small>`,""",
          """return `${fig('On site', `${esc(fmtNum(onUnits))}<small> recorded · of ${esc(fmtNum(asked - noQty))} quantified${noQty ? ` + ${esc(fmtNum(noQty))} awaiting quantity` : ''}</small>`,""", 'fig on site')
    t = R("""gauge(onUnits, asked, `${esc(fmtNum(dueUnits))} due by this day`, P.all.overdue ? `<b style="color:var(--red)">${P.all.overdue} line${P.all.overdue === 1 ? '' : 's'} overdue</b>` : null))}""",
          """gauge(onUnits, asked, `${esc(fmtNum(dueUnits))} due by this day`, P.all.overdue ? `<b style="color:var(--red)">${P.all.overdue} line${P.all.overdue === 1 ? '' : 's'} overdue</b>` : noQty ? '<span title="each reference awaiting a quantity counts as one until it is confirmed">no % until quantities are confirmed</span>' : null))}""", 'fig gauge')
    t = R("""${fig('Plant on the job', `${esc(fmtNum(asked))}<small> things · ${new Set(all.map(a => a.discipline)).size} trades</small>`,""",
          """${fig('Plant on the job', `${esc(fmtNum(asked - noQty))}<small> quantified units${noQty ? ` + ${esc(fmtNum(noQty))} references awaiting quantity` : ''} · ${new Set(all.map(a => a.discipline)).size} trades</small>`,""", 'fig plant')
    t = R("""${fig('Temporary fence', `${esc(fmtNum(F.done))}<small> of ${esc(fmtNum(F.total))} m</small>`,""",
          """${fig('Fence work on dockets', `${esc(fmtNum(F.done))}<small> of ${esc(fmtNum(F.total))} m</small>`,""", 'fig fence')
    # Fencing: in a view-only link the quote-entry form is not offered at all (audit, section 6)
    t = R("""nothing here can say whether the job is over or under.'}</p>
 <div class="form" style="max-width:none">""", """nothing here can say whether the job is over or under.'}</p>
 <div class="form fqform" style="max-width:none">""", 'fq form')
    # Today: the actions first
    t = R("""<div class="dsnband">${dsnBoard(today, dsnState(today), 'video')}</div>""",
          """<div class="dsnband">${dsnBoard(today, dsnState(today), 'video')}</div>
 ${execTodayHtml(today)}""", 'today actions')

    # UI-02 - one word for the date, everywhere it is shown
    lines = t.split('\n'); cnt = 0
    for i, l in enumerate(lines):
        if l.startswith('const DATA = '): continue
        o = l
        l = l.replace('days to race day', 'days to the event').replace('days</b> to race day', 'days</b> to the event').replace("days after race day", "days after the event opened")
        l = l.replace("'<b>race day</b>'", "'<b>event opens</b>'").replace("' · <b>race day</b>'", "' · <b>event opens</b>'")
        l = l.replace("label: 'Race day'", "label: 'Event opens'").replace("m.label === 'Race day'", "m.label === 'Event opens'")
        l = l.replace("'Countdown to race day'", "'Countdown to the event'")
        l = l.replace('<span class="lab" id="hzcdLab">Race day</span>', '<span class="lab" id="hzcdLab">Event opens</span>')
        l = l.replace('aria-label="Countdown to race day"', 'aria-label="Countdown to the event"')
        l = l.replace("`${race} DAYS TO RACE DAY` : race === 0 ? 'RACE DAY'", "`${race} DAYS TO GC500` : race === 0 ? 'GC500 OPENS TODAY'")
        if l != o: cnt += 1; lines[i] = l
    t = '\n'.join(lines); print('  race-day lines', cnt)

    i = t.find('</style>')
    if i >= 0: t = t[:i] + CSS + t[i + len('</style>'):]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
    if len(sys.argv) > 2: patch(sys.argv[2], False)
