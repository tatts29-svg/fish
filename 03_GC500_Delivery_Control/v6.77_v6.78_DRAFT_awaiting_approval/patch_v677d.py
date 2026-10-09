#!/usr/bin/env python3
"""v6.77d (candidate) - EXPECTED LABOUR, EVERY LINE, DOWN TO THE BRANCH (Andrew, 26 Sep 2026).

"Is it worth you adding all labour charges for it as it turns up and then I tick as they are done … we still tick,
as we need to tick when complete … every line, every different charge needs to be accounted for, right down to the
branch."

Nothing is charged that was not charged before: a labour line is CHARGED only when somebody ticks it, exactly as
now. What is new is that every priced labour line on every reference is listed and valued from the start, in one of
four states:
  charged   - ticked (the only state in any charges total)
  expected  - the unit is on site and the line is not ticked yet: work to tick when it is complete
  to come   - the unit is not on site yet
  later     - demob and cleaning, which happen at the end
and each line carries its reference, item, charge type (Install, Levelling, Steps, Cleaning, Fire extinguisher,
Demob), building, rate, quantity and the branch on its reference. The Pricing tab's labour card, the Costs ledger,
each reference's panel and each branch plate on Where we are read the same list, so they cannot disagree.

  python3 patch_v677d.py <page.html> [builder.py]
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402

JS = r"""/* v6.77 - EXPECTED LABOUR. Every priced labour line on every live reference, valued the way labourMoney values a
 tick (one rate a building where the reference has several buildings, else the rate times the line's quantity), with
 its state, its charge type and the branch on its reference. Worked out once per draw. */
const LABOUR_LATER = /demob|clean/i;
function labourPlan(){
 if (RENDER_MEMO.has('labourPlan')) return RENDER_MEMO.get('labourPlan');
 const td = todayIso();
 let onMap = null; try { onMap = new Map(dsnState(td).rows.map(r => [r.a.key, !!r.on])); } catch (e) { onMap = new Map(); }
 const slots = [];
 allAssets().filter(a => !a._cancelled && !a.relocation && !movedAway(a.key)).forEach(a => {
 const br = branchOf(a.key) || {}, code = br.code || '', on = !!onMap.get(a.key), units = labourUnits(a);
 chargeLines(a).forEach(l => {
 const q = qtyOf(l);
 (units.length ? units : [null]).forEach(u => {
 const info = labourLinesFor(a.key, l.discipline, l.item, a.key, u || undefined, a);
 info.lines.forEach(L => {
 const value = typeof L.rate !== 'number' ? null : u ? L.rate : (q == null ? null : L.rate * q);
 const state = L.ticked ? 'charged' : LABOUR_LATER.test(L.name) ? 'later' : on ? 'expected' : 'tocome';
 slots.push({ref: a.key, branch: code, item: l.item, disc: l.discipline, line: L.name, key: L.key, unit: u, rate: L.rate, qty: u ? 1 : q, value, state, by: L.by, at: L.at});
 });
 });
 });
 });
 const zero = () => ({charged: 0, expected: 0, tocome: 0, later: 0, n: {charged: 0, expected: 0, tocome: 0, later: 0}, unpriced: 0});
 const add = (o, s) => { if (s.value == null) { o.unpriced++; return; } o[s.state] += s.value; o.n[s.state]++; };
 const all = zero(), byLine = new Map(), byBranch = new Map();
 slots.forEach(s => { add(all, s);
 if (!byLine.has(s.line)) byLine.set(s.line, zero()); add(byLine.get(s.line), s);
 if (!byBranch.has(s.branch)) byBranch.set(s.branch, zero()); add(byBranch.get(s.branch), s); });
 /* the charged total is the Costs tab's own figure, to the cent, so the two never differ by a rounding */
 try { const ml = moneySummary(td).charge.labour; if (typeof ml === 'number') all.charged = ml; } catch (e) {}
 const P = {slots, all, byLine, byBranch};
 RENDER_MEMO.set('labourPlan', P);
 return P;
}
const LAB_STATES = [['charged', 'Charged', 'ticked — in the charges'], ['expected', 'Expected', 'on site, to tick when complete'], ['tocome', 'To come', 'unit not on site yet'], ['later', 'Later', 'demob and cleaning, at the end']];
function labourPlanRow(label, o, strong){
 return `<tr${strong ? ' class="total"' : ''}><td>${strong ? `<b>${esc(label)}</b>` : esc(label)}</td>${LAB_STATES.map(([k]) => `<td class="num">${o[k] ? esc(money(o[k])) : '<span class="norate">—</span>'}${o.n[k] ? `<br><span class="w" style="font-size:11px;color:var(--mute)">${o.n[k]} line${o.n[k] === 1 ? '' : 's'}</span>` : ''}</td>`).join('')}<td class="num">${esc(money(o.charged + o.expected + o.tocome + o.later))}${o.unpriced ? `<br><span class="chip crit" title="lines on a reference with no readable quantity — no figure can be put on them">${o.unpriced} no qty</span>` : ''}</td></tr>`;
}
function labourPlanHtml(){
 const P = labourPlan(), A = P.all;
 const head = `<thead><tr><th></th>${LAB_STATES.map(([, n, w]) => `<th class="num" title="${esc(w)}">${esc(n)}</th>`).join('')}<th class="num">All labour</th></tr></thead>`;
 const lines = [...P.byLine.entries()].sort((x, y) => (y[1].charged + y[1].expected + y[1].tocome + y[1].later) - (x[1].charged + x[1].expected + x[1].tocome + x[1].later));
 const brs = [...P.byBranch.entries()].sort((x, y) => (x[0] ? 0 : 1) - (y[0] ? 0 : 1) || x[0].localeCompare(y[0]));
 const bname = c => c ? `${c}${(branchInfo(c) || {}).name ? ' · ' + branchInfo(c).name : ''}` : 'No branch recorded';
 return `<div class="labplan">
 <div class="kpis" style="margin:8px 0 10px">${LAB_STATES.map(([k, n, w]) => `<div class="kpi"><div class="v">${esc(money0(A[k]) || '$0')}</div><div class="l">${esc(n)}</div><div class="q">${A.n[k]} line${A.n[k] === 1 ? '' : 's'} · ${esc(w)}</div></div>`).join('')}</div>
 <p class="norate" style="margin:0 0 8px"><b>Only Charged is in the charges.</b> Every other line is listed and valued so nothing is forgotten; it becomes a charge when it is ticked as complete. Card rates, ex GST.</p>
 <div class="tblwrap"><table class="progtbl"><caption class="vh">Labour by charge type</caption>${head.replace('<th></th>', '<th>Charge type</th>')}<tbody>${lines.map(([n, o]) => labourPlanRow(n, o)).join('')}${labourPlanRow('All labour', A, true)}</tbody></table></div>
 <div class="tblwrap" style="margin-top:10px"><table class="progtbl"><caption class="vh">Labour by branch</caption>${head.replace('<th></th>', '<th>Branch</th>')}<tbody>${brs.map(([c, o]) => labourPlanRow(bname(c), o)).join('')}${labourPlanRow('All branches', A, true)}</tbody></table></div>
 <p class="norate" style="margin-top:6px">A line's branch is the branch on its reference. Labour on a reference with no branch is under "No branch recorded" until one is put on.</p>
 </div>`;
}
/* one branch's labour, as rows for its plate on Where we are */
function labourPlateRows(code){
 const o = labourPlan().byBranch.get(code || '');
 if (!o || !(o.charged + o.expected + o.tocome + o.later)) return '';
 return `<span class="hd">Labour per piece</span><b class="hd">card rates</b>
 <span>Charged <small>· ${o.n.charged} ticked</small></span><b${o.charged ? '' : ' class="none"'}>${o.charged ? esc(money0(o.charged)) : '—'}</b>
 <span>Expected <small>· on site, to tick</small></span><b class="none">${o.expected ? esc(money0(o.expected)) : '—'}</b>
 <span>To come <small>· not on site yet</small></span><b class="none">${o.tocome ? esc(money0(o.tocome)) : '—'}</b>
 <span>Later <small>· demob, cleaning</small></span><b class="none">${o.later ? esc(money0(o.later)) : '—'}</b>`;
}
function labourCard(assets){"""


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    t = R("function labourCard(assets){", JS, 'labour plan js')
    # the Pricing card: the plan first, then the tick table as before
    t = R("""The labour columns are headed <b>2025</b> on the 2026 card (and 2024 on traffic management), and they are shown as that year's rates, never as 2026.</p>""",
          """The labour columns are headed <b>2025</b> on the 2026 card (and 2024 on traffic management), and they are shown as that year's rates, never as 2026.</p>
 ${labourPlanHtml()}""", 'pricing card')
    # each reference's panel: what is still to tick on it
    t = R("""const said = m.blocked ? esc(m.why || 'ticked, and the money is not known')""",
          """const exp = labourPlan().slots.filter(s => s.ref === a.key && s.item === l.item && s.state !== 'charged' && s.value != null);
 const expWords = exp.length ? ` · still to tick: ${esc(money(exp.reduce((x, s) => x + s.value, 0)))} (${exp.length} line${exp.length === 1 ? '' : 's'}${exp.some(s => s.state === 'later') ? ', incl. demob/cleaning later' : ''})` : '';
 const said = m.blocked ? esc(m.why || 'ticked, and the money is not known')""", 'panel exp')
    t = R("""<div class="w" style="font-size:11.5px;color:var(--mute)">${said}${""", """<div class="w" style="font-size:11.5px;color:var(--mute)">${said}${expWords}${""", 'panel said')
    # the branch plates
    t = R("""${contractPlateRows(g.contract)}
 ${oursPlateRows(g)}""", """${contractPlateRows(g.contract)}
 ${labourPlateRows(g.code)}
 ${oursPlateRows(g)}""", 'branch plate rows')
    # the Costs ledger line: the ticked figure, and beside it what is still to tick
    t = R("""${ln('Labour ticked on references', c.labour_ticks ? m0(c.labour) : '<span class="todo">—</span>', c.labour_ticks ? pl(c.labour_ticks, 'tick') : 'nothing ticked yet')}""",
          """${(() => { const LP = labourPlan().all; return ln('Labour ticked on references', c.labour_ticks ? m0(c.labour) : '<span class="todo">—</span>', (c.labour_ticks ? pl(c.labour_ticks, 'tick') : 'nothing ticked yet') + ` · not in the total yet: ${money0(LP.expected)} expected on site to tick, ${money0(LP.tocome)} to come, ${money0(LP.later)} demob/cleaning later — by branch on the Pricing tab`); })()}""", 'costs ledger')
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
    if len(sys.argv) > 2: patch(sys.argv[2], False)
