#!/usr/bin/env python3
"""v7.65 - The Costs tab in one flow. Andrew, 1 Oct 2026: "All costs must be correct and accurate. And forecast as much
as we can. Clean data, tidy, presentable - all in on GC500." The audit (costs_audit_01Oct2026/README.md, section 3)
found the tab ran twenty blocks with four saying the same thing twice. Apply after v7.60 to v7.64.

  THE FLOW. At a glance (new) -> Forecast P&L by branch (v7.60) -> Costs to job end (v7.64) -> Month-end for Finance:
     Accruals (v7.63) then the journals and controls (v7.45) -> The working, folded: the eight categories with our
     transport lines and the people; revenue by branch with the 2026 card; the charge lines on the record.
  AT A GLANCE. Four tiles, each a figure on the record today and the same figure carried to job end: revenue, direct
     costs, the difference (never called a margin), and the work month for Finance. Every figure is read from the same
     functions the cards below use (moneySummary, cj764Model, acc761Model) so the glance can never disagree with them.
  GONE FROM THE TAB. The v5.83 ledger ("Are we making money?") - its streams, branches and categories are all in the
     Forecast P&L and the Costs to job end card now; the by-branch revenue card and the eight-categories card are folded
     under The working rather than shown a second time. The functions stay; nothing else on the page calls them less.
  FOLDS REMEMBER. A fold opened stays open through a re-render (a filter press, a saved line), the way the page's other
     folds do; the charge lines open themselves when a filter or a search is on. Print opens every fold first and closes
     it after, so paper carries the detail.
    python3 patch_v765.py <page.html>   (needs v7.64: cj764Model, cj764Card; v7.63: acc763Sums, acc763Future)"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'function cj765Glance(' in t: sys.exit('v7.65 already applied')
for need in ['function cj764Model(){', 'function cj764Card(', 'function acc763Sums(', 'function acc763Future(', 'function pl752Card(', 'function acc761Html(', 'function fin745Html(', "${pl752Card()}\n ${cj764Card()}\n ${fin745Html()}\n ${acc761Html()}", '.cj764-gaps{border-left:4px solid #9c470c}', "$('#printCosts').onclick = printCosts;", 'const SFOLD_OPEN = new Set();']:
    if need not in t: sys.exit('needs ' + need)

# ---- the pane, in one flow
t = rep(t, """${pl752Card()}
 ${cj764Card()}
 ${fin745Html()}
 ${acc761Html()}
 <details class="plfold752"><summary>Are we making money? — the working behind every figure<small>streams, the two sides of the ledger, the sources</small></summary>${marginCard()}</details>
<h3 class="sec" style="margin-top:6px">Direct costs — known so far <span>by the eight categories management expect every cost recorded against</span></h3>
 ${costCategoryCard(expect)}
 ${ourTransportCard()}
 ${workforceCard()}
 <h3 class="sec" style="margin-top:6px">Revenue — charged to the V8s <span>by branch — the contracts by the rate, and the charge lines on the record</span></h3>
 ${branchCostCard()}
 ${card748Html()}
 <div class="card">
 <div class="hubtitle"><h3>Charge lines on the record""",
 """${cj765Glance()}
 ${pl752Card()}
 ${cj764Card()}
 <h3 class="sec cj765-sec" id="cj765monthend">Month-end — for Finance <span>what to accrue for the work month first, then the journals and the month-end controls</span></h3>
 ${acc761Html()}
 ${fin745Html()}
 <h3 class="sec cj765-sec" id="cj765detail">The working <span>what every figure above is worked out from — folded; open what you need, it stays open</span></h3>
 ${cj765Fold('cats', 'Direct costs by the eight categories, our transport lines, and the people', 'what Coates pays, line by line, and where a line is typed', costCategoryCard(expect) + ourTransportCard() + workforceCard())}
 ${cj765Fold('branch', 'Revenue by branch, and the 2026 card', 'the contracts by the rate; a card rate is changed here', branchCostCard() + card748Html())}
 <details class="plfold765" data-sfold="costs765|lines"${(filt !== 'all' || q || SFOLD_OPEN.has('costs765|lines')) ? ' open' : ''}><summary>Charge lines on the record<small>${shown.length}${shown.length !== all.length ? ' of ' + all.length : ''} line${all.length === 1 ? '' : 's'} · every one revenue · filter by category</small></summary>
 <div class="card">
 <div class="hubtitle"><h3>Charge lines on the record""", 'costs pane flow', p, True)

t = rep(t, """</p>
 </div>
 <p class="maphint">Every line in that table is revenue — what Coates charges the V8s — and names its category, where it came from and, where it helps, the asset or fencing area it was for. The direct costs are above it, under the eight categories. Nothing is typed on this tab:
 a line fills in from the record, or is given to the build. Print gives the money summary, the direct costs by the eight categories, the branches and the lines shown, in landscape; Email sends the summary as text.</p>`;""",
 """</p>
 </div></details>
 <p class="maphint">Everything on this tab is read from the record — the contracts, the 2026 card, the dockets, the schedule, the tracker and the running sheet; nothing is typed here except a rate on the card or a line under The working. Print gives the glance, the Forecast P&amp;L, the costs to job end and every fold opened, in landscape; Email sends the summary as text.</p>`;""", 'costs pane foot', p, True)

t = rep(t, "$('#printCosts').onclick = printCosts;",
 """$('#printCosts').onclick = printCosts;
 pane.querySelectorAll('[data-jump765]').forEach(b => b.onclick = () => { const el = document.getElementById(b.dataset.jump765); if (!el) return; if (el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({behavior: 'smooth', block: 'start'}); });""", 'jump bindings', p, True)

# ---- print opens the folds first and closes them after
t = rep(t, "document.head.appendChild(st); document.body.classList.add('printing-costs');",
 """document.head.appendChild(st); document.body.classList.add('printing-costs');
 const folds765 = [...document.querySelectorAll('#pane-costs details.plfold765:not([open])')]; folds765.forEach(d => { d.open = true; }); /* v7.65 - paper carries the working */""", 'print opens folds', p, True)
t = rep(t, "const done = () => { st.remove(); document.body.classList.remove('printing-costs'); };",
 "const done = () => { st.remove(); document.body.classList.remove('printing-costs'); folds765.forEach(d => { d.open = false; }); };", 'print closes folds', p, True)

# ---- the glance and the fold helper
JS = r"""/* v7.65 - THE COSTS TAB IN ONE FLOW. At a glance first: four tiles, each the figure on the record today and the same
 figure carried to job end, read from the very functions the cards below are drawn from, so the glance can never say
 something different. Then the Forecast P&L, the costs to job end, month-end for Finance, and the working folded. */
function cj765Fold(key, title, sub, inner){
 return `<details class="plfold765" data-sfold="costs765|${esc(key)}"${SFOLD_OPEN.has('costs765|' + key) ? ' open' : ''}><summary>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</summary>${inner}</details>`;
}
function cj765Glance(){
 let M, X, A, S, fut; try { M = moneySummary(); X = cj764Model(); A = acc761Model(acc761Month()); S = acc763Sums(A); fut = acc763Future(A); } catch (e) { return `<section id="costs765" class="card cj765 nosfold"><p class="fin745-eyebrow">AT A GLANCE</p><p>Could not be worked out from this record: ${esc(String(e && e.message || e))}</p></section>`; }
 const c = M.charge || {}, k = M.cost || {}, R = X.revenue, W = X.wages, r2 = n => Math.round(n * 100) / 100;
 const m0 = v => v == null || !Number.isFinite(Number(v)) ? '<span class="pl-todo">—</span>' : esc(money0(v));
 const sd = v => v == null ? '<span class="pl-todo">—</span>' : `<b class="${v < 0 ? 'neg' : 'pos'}">${v < 0 ? '−' + esc(money0(-v)) : esc(money0(v))}</b>`;
 const diffNow = M.difference0 != null ? M.difference0 : r2((Number(c.total) || 0) - (Number(k.known) || 0));
 const diffEnd = r2(R.job - X.job - W.job);
 const tile = (label, now, nowSub, end, endSub, note, extra) => `<div class="cj765-tile${extra ? ' ' + extra : ''}"><span>${label}</span><div class="cj765-now">${now}<small>${nowSub}</small></div>${end != null ? `<div class="cj765-end">${end}<small>${endSub}</small></div>` : ''}<p class="cj765-note">${note}</p></div>`;
 return `<section class="card cj765 nosfold" id="costs765" aria-labelledby="cj765Title">
 <div class="cj765-head"><p class="fin745-eyebrow">AT A GLANCE · AUD EX GST · AS AT ${esc(fmtDate(X.asAt).toUpperCase())}</p><h3 id="cj765Title">Where the job stands on money</h3>
 <p class="cj765-lead">Revenue is what Coates charges the V8s; a direct cost is what Coates pays for the job. Each tile is the record today, then the same figure carried to job end. The two sides are never added together, and nothing here is a result until the branches have billed and the invoices are in.</p></div>
 <div class="cj765-tiles">
 ${tile('Revenue', m0(R.record), 'on the record today', m0(R.job), 'to job end', `${esc(money0(R.record))} on the contracts, the card and the dockets so far + ${esc(money0(R.fenceToCome))} of fencing still to come at the 2026 card`)}
 ${tile('Direct costs', m0(X.known), 'known today', m0(X.job), 'to job end', `+ wages priced ${esc(money0(W.job))} (Job Connect)${W.unpricedHours ? ` · ${esc(fmtNum(W.unpricedHours))} h of Coates wages not priced` : ''}`)}
 ${tile('Difference', sd(diffNow), 'so far — revenue less direct costs known', sd(diffEnd), 'to job end, after priced wages', `not a margin and not a profit — ${esc(fmtNum(X.gaps.length))} item${X.gaps.length === 1 ? '' : 's'} not priced yet, listed under Costs to job end`, diffNow < 0 || diffEnd < 0 ? 'cj765-neg' : '')}
 ${tile('Month-end for Finance', m0(A.revenueTotal), `${esc(A.label)} — revenue ${fut ? 'due, planned' : 'earned, not yet billed'}`, S.toAccrue || S.decide ? m0(S.toAccrue) : null, 'costs to accrue — proposal', `${fut ? 'nothing to accrue until the month is worked' : 'accrue the revenue; costs stay in their month'}${S.decide ? ` · ${esc(money0(S.decide))} for Finance’s call` : ''}${S.unallocated ? ` · ${esc(fmtNum(S.unallocated))} line${S.unallocated === 1 ? '' : 's'} with no day to put ${S.unallocated === 1 ? 'it' : 'them'} in` : ''}`)}
 </div>
 <ol class="cj765-flow"><li><button class="linkish" data-jump765="pl752">Forecast P&amp;L by branch</button> — the record as it stands</li><li><button class="linkish" data-jump765="costs764">Costs to job end</button> — what is still to come, and what is not priced</li><li><button class="linkish" data-jump765="accruals761">Month-end for Finance</button> — the accruals, then the journals</li><li><button class="linkish" data-jump765="cj765detail">The working</button> — the categories, the branches and every charge line, folded</li></ol>
 </section>`;
}
/* a fold opened stays open through a re-render, as the page's other folds do */
document.addEventListener('toggle', e => { const d = e.target; if (d && d.matches && d.matches('details.plfold765[data-sfold]')) { if (d.open) SFOLD_OPEN.add(d.dataset.sfold); else SFOLD_OPEN.delete(d.dataset.sfold); } }, true);
"""
t = rep(t, "function cj764Model(){", JS + "function cj764Model(){", 'glance code', p, True)

# ---- styles
CSS = (".cj765{padding:18px 22px 16px;border-top:4px solid #f47721;font-variant-numeric:tabular-nums}.cj765 h3{margin:0 0 6px;font-size:22px;line-height:1.15}"
 ".cj765-lead{color:#5a6670;font-size:13px;margin:0 0 14px;max-width:88ch;line-height:1.4}"
 ".cj765-tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}"
 ".cj765-tile{border:1px solid #d2dce1;border-radius:10px;background:#fff;padding:14px 16px;display:flex;flex-direction:column;gap:7px;min-width:0}"
 ".cj765-tile>span{font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#5a6670}"
 ".cj765-now{font-size:26px;font-weight:800;line-height:1.05;color:#17272e;overflow-wrap:anywhere}.cj765-now small,.cj765-end small{display:block;font-size:11px;font-weight:600;color:#6b7681;line-height:1.3;margin-top:3px}"
 ".cj765-end{font-size:17px;font-weight:800;color:#2b4a8a;padding-top:7px;border-top:1px dashed #d9dde2;line-height:1.1;overflow-wrap:anywhere}"
 ".cj765-tile .pos{color:#1d6b3a}.cj765-tile .neg{color:#b42318}.cj765-neg{border-color:#e4b2a8}.cj765 .pl-todo{color:#6b7681;font-weight:500}"
 ".cj765-note{font-size:11.5px;color:#6b7681;line-height:1.35;margin:auto 0 0}"
 ".cj765-flow{margin:14px 0 0;padding:0 0 0 20px;font-size:13px;color:#3d4852;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 18px}.cj765-flow button.linkish{font-weight:700}"
 ".cj765-sec{margin-top:22px}"
 ".plfold765{margin:0 0 12px}.plfold765>summary{cursor:pointer;font-weight:700;padding:10px 14px;border:1px dashed #d9dde2;border-radius:10px;color:#3d4852;list-style:revert}.plfold765>summary small{font-weight:500;color:#6b7681;margin-left:8px}.plfold765[open]>summary{border-style:solid;margin-bottom:8px;background:#f7f9fa}"
 "@media(max-width:1000px){.cj765-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}}"
 "@media(max-width:600px){.cj765{padding:14px 12px 12px}.cj765 h3{font-size:19px}.cj765-tiles{grid-template-columns:1fr 1fr;gap:8px}.cj765-tile{padding:10px}.cj765-now{font-size:20px}.cj765-end{font-size:15px}.cj765-flow{grid-template-columns:1fr}.plfold765>summary{padding:9px 10px}.plfold765>summary small{display:block;margin:2px 0 0}}"
 "@media print{#pane-costs .cj765{padding:2mm 3mm;border:1px solid #bbb}#pane-costs .cj765-tiles{grid-template-columns:repeat(4,1fr);gap:1.5mm}#pane-costs .cj765-tile{padding:1mm 2mm;border:1px solid #bbb;gap:1mm}#pane-costs .cj765-now{font-size:14px}#pane-costs .cj765-end{font-size:11px}#pane-costs .cj765-note{font-size:6.5px}#pane-costs .cj765-lead,#pane-costs .cj765-flow,#pane-costs .cj765-sec span{display:none}.plfold765>summary{display:none}}")
t = rep(t, ".cj764-gaps{border-left:4px solid #9c470c}", ".cj764-gaps{border-left:4px solid #9c470c}" + CSS, 'glance style', p, True)

open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t)
print('v7.65 applied: the Costs tab in one flow — the glance, the P&L, costs to job end, month-end, the working folded')
