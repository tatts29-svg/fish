#!/usr/bin/env python3
"""v7.60 - Costs in Andrew's structure. Andrew, 1 Oct 2026: "I need hard focus on costs now. I need everything to make
sense. Toilets: we are sub-hiring these, why is this not under KINP? Cleaning will be classed as different, so not part
of a labour cost. Labour Installs, Steps, Levelling, Labour Demob will fall under the Labour Install code."

Three rules, applied everywhere the Costs tab reads:
  1. THE TOILETS SIT UNDER KINP. The toilets' servicing and cleaning at our pump-out rates ($85,102, Rehire Revenue on no
     contract line) and the Event Portables rehire cost ($118,575 approved) are shown against KINP - the branch that
     sub-hires the toilets - in the P&L's By branch table and in the lower By branch card, the way Advanced's fencing
     dockets already sit under STPS. The direct-cost lines name the branch too.
  2. CLEANING IS NOT LABOUR. The labour ticked per piece is split by kind: install, steps, levelling and demob are one line,
     "Labour - Install" (the Labour Install code); cleaning is its own line; a fire extinguisher is a hire charge. The
     three add to exactly what the one "Labour ticked on references" line added to.
  3. EVERYTHING RECONCILES. The By branch table now carries every stream a branch owns - its contracts by the rate and from
     the card, its Transport Revenue, the rehire it carries off the contracts, its Labour Install and Cleaning - so
     All branches + the event labour scope (the job's, on no branch) = Total revenue. Rehire cost is shown against the
     branch in its own grey column: a direct cost, never added to revenue.
No figure is invented and no total moves: the same money is shown where Andrew says it belongs.
    python3 patch_v760.py <page.html>   (needs the live v7.54+: pl752Card, pl752Rows, pl754Cell, branchCostCard)"""
import os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep  # noqa: E402
p = sys.argv[1]
t = open(p, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿')
if 'pl760Ticks' in t: sys.exit('v7.60 already applied')
for need in ['function pl752Card(){', 'function pl752Rows(){', 'function pl754Cell(', 'function branchCostCard(){', 'function servicing748(){', 'function labourRestN(']:
    if need not in t: sys.exit('needs ' + need)

def extract_function(text, key):
    if text.count(key) != 1: sys.exit(key + ': expected exactly one definition, found ' + str(text.count(key)))
    i = text.find(key); k = text.find('{', i); d = 0; instr = None; esc = False
    for e in range(k, len(text)):
        ch = text[e]
        if instr:
            if esc: esc = False
            elif ch == '\\': esc = True
            elif ch == instr: instr = None
            continue
        if ch in '\'"`': instr = ch; continue
        if ch == '{': d += 1
        elif ch == '}':
            d -= 1
            if d == 0: return i, e + 1
    sys.exit(key + ': unbalanced braces')

# ---- 1. the helpers, in front of the P&L card
HELPERS = r"""
/* v7.60 - COSTS IN ANDREW'S STRUCTURE (1 Oct 2026): the toilets under KINP, the branch that sub-hires them; cleaning
   classed as cleaning, not labour; install, steps, levelling and demob under the Labour Install code. */
const PL760_GROUP = {install: 'install', steps: 'install', levelling: 'install', demob: 'install', cleaning: 'cleaning', fire_ext: 'fire_ext'};
/* the branch that sub-hires the toilets: the one whose contracts carry the toilet lines */
function pl760ToiletBranch(){ try { const b = pl752Rows().filter(x => x.rehireLines).sort((x, y) => y.rehireLines - x.rehireLines)[0]; return b ? b.code : 'KINP'; } catch (e) { return 'KINP'; } }
/* the fencing dockets at the 2026 card, by the branch on the docket lines (the fencing contractor's branch) */
function pl760FencingByBranch(){
 const by = {}; try { allCosts().filter(c => c.usable && c.from === 'record' && /fenc/i.test(String(c.category || ''))).forEach(c => { const k = (costBranchOf(c) || {}).code || 'no branch'; by[k] = Math.round(((by[k] || 0) + (Number(c.amount) || 0)) * 100) / 100; }); } catch (e) {}
 return by;
}
function pl760FencingBranch(){ const by = pl760FencingByBranch(); const best = Object.entries(by).sort((a, b) => b[1] - a[1])[0]; return best ? best[0] : 'STPS'; }
/* the labour ticked per piece, by kind and by branch - the same arithmetic as labourMoney, tick by tick */
function pl760Ticks(){
 const mk = () => ({ticks: 0, amount: 0, unknown: 0});
 const out = {install: mk(), cleaning: mk(), fire_ext: mk(), other: mk(), byBranch: {}, total: 0, ticks: 0, unknown: 0};
 const add = (grp, br, amt) => { const g = out[grp] || out.other; g.ticks++; out.ticks++; if (amt == null) { g.unknown++; out.unknown++; } else { g.amount += amt; out.total += amt; }
 const b = out.byBranch[br] = out.byBranch[br] || {install: mk(), cleaning: mk(), fire_ext: mk(), other: mk(), amount: 0}; const bg = b[grp] || b.other; bg.ticks++; if (amt == null) bg.unknown++; else { bg.amount += amt; b.amount += amt; } };
 allAssets().filter(a => !a._cancelled && !a.rest_of).forEach(a => {
 const t = assetTotal(a); const br = (branchOf(a.key) || {}).code || 'no branch';
 (t.lines || []).forEach(l => { const lab = l.labour; if (!lab || !lab.ticked || !lab.ticked.length) return;
 if (lab.perBuilding) { const units = (lab.units || []).map(q => q.unit); const restN = labourRestN(a, l.item, units);
 (lab.units || []).forEach(q => (q.ticked || []).forEach(x => add(PL760_GROUP[x.key] || 'other', br, lab.total == null ? null : (x.rate || 0) * (q.unit === LAB_REST ? restN : 1)))); }
 else lab.ticked.forEach(x => add(PL760_GROUP[x.key] || 'other', br, lab.total == null ? null : (x.rate || 0) * (lab.qty || 0))); }); });
 const r = v => Math.round(v * 100) / 100;
 ['install', 'cleaning', 'fire_ext', 'other'].forEach(k => { out[k].amount = r(out[k].amount); }); out.total = r(out.total);
 Object.values(out.byBranch).forEach(b => { b.amount = r(b.amount); ['install', 'cleaning', 'fire_ext', 'other'].forEach(k => { b[k].amount = r(b[k].amount); }); });
 return out;
}
/* the By branch table of the P&L: every stream a branch owns, and the rehire cost it carries */
function pl760BranchTable(B, M, RH){
 const c = M.charge || {}, k = M.cost || {}, cents = n => Math.round(n * 100) / 100;
 const TB = pl760ToiletBranch(), FB = pl760FencingByBranch(), TK = pl760Ticks();
 const svc = Number(c.servicing) || 0;
 const cat = key => ((M.categories || []).find(x => x.key === key) || {});
 const fenceCost = cat('fencing').known ? cat('fencing').amount : null;
 const rehireCost = RH && RH.cost != null ? RH.cost : null;
 const showFire = TK.fire_ext.ticks > 0 || TK.other.ticks > 0;
 const rows = B.map(b => { const tk = TK.byBranch[b.code] || {install: {ticks: 0, amount: 0, unknown: 0}, cleaning: {ticks: 0, amount: 0, unknown: 0}, fire_ext: {ticks: 0, amount: 0, unknown: 0}, other: {ticks: 0, amount: 0, unknown: 0}, amount: 0};
 const off = cents((b.code === TB ? svc : 0) + (FB[b.code] || 0));
 const offWords = [b.code === TB && svc ? 'toilet servicing and cleaning at our pump-out rates ' + money0(svc) : '', FB[b.code] ? 'fencing dockets at the 2026 card ' + money0(FB[b.code]) : ''].filter(Boolean).join(' · ');
 const fire = cents(tk.fire_ext.amount + tk.other.amount);
 const revenue = cents(b.total + off + tk.install.amount + tk.cleaning.amount + fire);
 let cost = null, costWords = '';
 if (b.code === TB && rehireCost != null) { cost = rehireCost; costWords = (RH.co || 'Event Portables') + (RH.approved ? ', approved' : ', quoted, unsigned'); }
 else if (FB[b.code] && fenceCost != null) { cost = fenceCost; costWords = "Advanced's dockets at their own sheet"; }
 else if (b.plantLines || b.subLines) costWords = 'not on the record';
 return {b, tk, off, offWords, fire, revenue, cost, costWords}; });
 const sum = f => cents(rows.reduce((s, r) => s + (f(r) || 0), 0));
 const m = v => v ? esc(money0(v)) : '—';
 const tick = (g, w) => g.ticks ? `${esc(money0(g.amount))}${g.unknown ? `<br><span class="w pl-todo">${esc(fmtNum(g.unknown))} ${w || 'tick'}${g.unknown === 1 ? '' : 's'} not priced</span>` : ''}` : '—';
 const scope = c.race && c.race.scope && c.race.amount != null ? c.race.amount : (c.race && c.race.amount != null ? c.race.amount : null);
 const allRevenue = sum(r => r.revenue);
 const th = (label, title, cls) => `<th class="${cls || 'num'}"${title ? ` title="${esc(title)}"` : ''}>${label}</th>`;
 return `<h4>By branch <small>what each branch charges the V8s · the rehire it carries · the labour ticked on its references</small></h4>
 <div class="tblwrap"><table class="pl-tbl pl760"><thead><tr><th>Branch</th>${th('Lines')}${th('Hire · by the rate', 'hire lines carrying a rate the branch put on the contract (the SUB lines’ Rehire Revenue among them)')}${th('Hire · from the card', 'hire lines with no contract rate yet: the street rate card 2026, or a rate typed on Costs')}${th('Transport', 'Transport Revenue: the delivery and pickup charge lines')}${th('Rehire Revenue<br><span class="w">off the contracts</span>', 'Rehire Revenue on no contract line: the toilets’ servicing and cleaning at our pump-out rates on the branch that sub-hires the toilets; the fencing dockets at the 2026 card on the fencing contractor’s branch')}${th('Labour Install', 'install, steps, levelling and demob ticked per piece — the Labour Install code')}${th('Cleaning', 'cleaning ticked per piece — classed as cleaning, not labour')}${showFire ? th('Fire ext.', 'fire extinguishers ticked per piece — a hire charge, not labour') : ''}${th('No rate', 'lines with no rate and no card line: unknown, not nought')}${th('Revenue', 'everything this branch charges the V8s, added')}${th('Rehire cost<br><span class="w">direct cost</span>', 'what Coates pays the supplier for the rehire this branch carries — a direct cost, shown against the branch, never added to revenue', 'num pl-cost')}</tr></thead><tbody>
 ${rows.map(({b, tk, off, offWords, fire, revenue, cost, costWords}) => `<tr><td class="pl-br"><b>${esc(b.code)}</b>${b.decided ? ` <span class="w" title="${esc(fmtNum(b.decided) + (b.decided === 1 ? ' line' : ' lines') + ' settled by the project manager, 1 Oct 2026: no separate customer hire charge (waste tanks included in toilet-block hire; contract 9968929 for Coates’ own use)')}">· ${esc(fmtNum(b.decided))} settled</span>` : ''}</td><td class="num">${esc(fmtNum(b.lines))}</td><td class="num">${m(b.contract)}</td><td class="num">${m(b.card)}</td><td class="num">${m(b.transport)}</td><td class="num" title="${esc(offWords)}">${m(off)}</td><td class="num">${tick(tk.install)}</td><td class="num">${tick(tk.cleaning)}</td>${showFire ? `<td class="num">${fire ? esc(money0(fire)) : '—'}</td>` : ''}<td class="num">${b.none ? `<span class="pl-todo">${esc(fmtNum(b.none))}</span>` : '—'}</td><td class="num"><b>${esc(money0(revenue))}</b></td><td class="num pl-cost" title="${esc(costWords)}">${cost != null ? `${esc(money0(cost))}<br><span class="w">${esc(costWords)}</span>` : costWords ? `<span class="w">${esc(costWords)}</span>` : '—'}</td></tr>`).join('')}
 <tr class="tot"><td>All branches</td><td class="num">${esc(fmtNum(B.reduce((s, b) => s + b.lines, 0)))}</td><td class="num">${m(sum(r => r.b.contract))}</td><td class="num">${m(sum(r => r.b.card))}</td><td class="num">${m(sum(r => r.b.transport))}</td><td class="num">${m(sum(r => r.off))}</td><td class="num">${m(TK.install.amount)}</td><td class="num">${m(TK.cleaning.amount)}</td>${showFire ? `<td class="num">${m(sum(r => r.fire))}</td>` : ''}<td class="num">${B.reduce((s, b) => s + b.none, 0) ? esc(fmtNum(B.reduce((s, b) => s + b.none, 0))) : '—'}</td><td class="num"><b>${esc(money0(allRevenue))}</b></td><td class="num pl-cost">${m(sum(r => r.cost))}</td></tr>
 ${scope != null ? `<tr class="pl-scope"><td colspan="${showFire ? 10 : 9}">Event labour — the scope <span class="w">· ${esc(fmtNum(c.race.hours || 0))} h of people over the event + accommodation and travel · the job’s, on no branch</span></td><td class="num"><b>${esc(money0(scope))}</b></td><td class="pl-cost"></td></tr>` : ''}
 <tr class="tot pl-grand"><td colspan="${showFire ? 10 : 9}">Total revenue <span class="w">· the branches${scope != null ? ' plus the scope' : ''}</span></td><td class="num"><b>${esc(money0(c.total))}</b></td><td class="pl-cost"></td></tr>
 </tbody></table></div>
 <div class="pl-subloc">${B.filter(b => b.rehireLines || b.plantLines || b.subLines).map(b => `<div class="pl760-rh"><b>${esc(b.code)} · sub-hired · rehire</b> — ${pl754Cell(b, RH)}</div>`).join('')}</div>
 ${(() => { const L = pl752SubLocations(); return `<div class="pl-subloc"><b>Sub-hired on the record, by supplier.</b> ${L.length ? L.map(x => `<span class="pl-subco"><b>${esc(x.co)}</b> — ${esc(x.keys.join(', '))} (${x.keys.length} location${x.keys.length === 1 ? '' : 's'})</span>`).join(' · ') : 'no sub-hired location recorded on the page'}. These are locations, not contract lines: their hire is charged to the V8s on ${esc(TB)}’s contracts at our rates, and the supplier’s rehire cost is the ${esc(TB)} Rehire cost above and under Rehire costs in Direct costs (Event Portables: ${k.rehire_approved && k.rehire != null ? esc(money0(k.rehire)) + ', approved' : 'quoted cost awaiting approval'}).</div>`; })()}
 <p class="pl-note">Each branch’s revenue is its contracts by the rate and from the card, its Transport Revenue, the rehire it carries off the contracts (${esc(TB)} the Event Portables toilets’ servicing and cleaning at our pump-out rates; ${esc(pl760FencingBranch())} Advanced’s fencing dockets at the 2026 card) and the labour ticked on its references — install, steps, levelling and demob under the Labour Install code, cleaning on its own line. Rehire cost is what Coates pays the supplier: a direct cost against the branch that carries the rehire, never added to revenue. The event labour scope is the job’s and on no branch; the branches plus the scope are the total revenue.</p>`;
}
"""
i, _ = extract_function(t, 'function pl752Card(){')
t = t[:i] + HELPERS.lstrip('\n') + t[i:]

# ---- 2. the streams: labour by kind; the toilets and the fencing named to their branch
t = rep(t, "${c.labour_ticks ? line('Labour ticked on references', pl(c.labour_ticks, 'tick'), m0(c.labour), CONTRACT) : ''}",
 "${(() => { const TK = pl760Ticks(); if (!TK.ticks) return ''; const tl = (g, label, sub) => g.ticks ? line(label, `${pl(g.ticks, 'tick')} on references${g.unknown ? ` · ${pl(g.unknown, 'tick')} the card carries no figure for` : ''}${sub ? ' · ' + sub : ''}`, m0(g.amount), CONTRACT) : ''; return tl(TK.install, 'Labour — Install', 'install, steps, levelling and demob, per piece · the Labour Install code') + tl(TK.cleaning, 'Cleaning, per piece', 'classed as cleaning, not labour') + tl(TK.fire_ext, 'Fire extinguishers, per piece', 'a hire charge, not labour') + tl(TK.other, 'Other charges ticked per piece', ''); })()}",
 'labour by kind', p, True)
t = rep(t, "line('Toilet servicing, at our pump-out rates', 'Event Portables’ quantities on Q6844 · on no contract line yet', m0(servicing), CARD)",
 "line(`Toilet servicing and cleaning — ${esc(pl760ToiletBranch())} rehire, at our pump-out rates`, 'Event Portables’ quantities on Q6844 · Rehire Revenue on no contract line yet · servicing and cleaning are not labour', m0(servicing), CARD)",
 'servicing line', p, True)
t = rep(t, "line('Fencing — dockets at the 2026 card', `${pl(c.fencing_dockets || 0, 'docket')} · hire and installation in one card rate`",
 "line(`Fencing — ${esc(pl760FencingBranch())} rehire, dockets at the 2026 card`, `${pl(c.fencing_dockets || 0, 'docket')} · hire and installation in one card rate`",
 'fencing line', p, True)

# ---- 3. the By branch table of the P&L card, whole block
a = t.find('<h4>By branch <small>the contracts, by the rate · what each branch bills</small></h4>')
z_key = 'so they sit outside the branch table.</p>'
z = t.find(z_key, a)
if a < 0 or z < 0 or t.count('<h4>By branch <small>the contracts, by the rate') != 1 or z - a > 9000: sys.exit('branch table block not found once')
t = t[:a] + '${pl760BranchTable(B, M, RH)}' + t[z + len(z_key):]

# ---- 4. the direct-cost notes name the branch
t = rep(t, "`Event Portables toilets, rehire cost (${PL_REHIRE}), four quotes approved — ${money0(X.rq)} ex GST, the final total may change`",
 "`${pl760ToiletBranch()} · Event Portables toilets, rehire cost (${PL_REHIRE}) — the servicing and cleaning are in the quotes, not labour — four quotes approved — ${money0(X.rq)} ex GST, the final total may change`",
 'rehire cost note', p, True)
t = rep(t, "`Advanced's dockets, at their own sheet — ${money(X.fd.cost)}: ", "`${pl760FencingBranch()} · Advanced's dockets, at their own sheet — ${money(X.fd.cost)}: ", 'fencing cost note', p, True)

# ---- 5. the lower By branch card: the toilets' servicing under subhire on the toilets' branch
i, e = extract_function(t, 'function branchCostCard(){')
src = t[i:e]
old_rows = " const rows = R.branches.concat(R.none && (R.none.lines.length || R.none.costs.length || (R.none.ours && R.none.ours.lines.length)) ? [R.none] : []);"
if src.count(old_rows) != 1: sys.exit('branchCostCard rows line not found')
new_rows = old_rows.replace('const rows =', 'const rows0 =') + """
 /* v7.60 - the toilets' servicing and cleaning at our pump-out rates sit under subhire on the branch that sub-hires the toilets, as the fencing dockets do on the fencing contractor's */
 const TB760 = pl760ToiletBranch(), svc760 = Number(servicing748Total()) || 0;
 const lift760 = g => (!svc760 || g.code !== TB760) ? g : Object.assign({}, g, {kinds: Object.assign({}, g.kinds, {subhire: Object.assign({}, g.kinds.subhire, {amount: (g.kinds.subhire.amount || 0) + svc760, amount0: (g.kinds.subhire.amount0 || 0) + svc760, lines: (g.kinds.subhire.lines || 0) + 1})}), charged: (g.charged || 0) + svc760, charged0: (g.charged0 || 0) + svc760});
 const rows = rows0.map(lift760);
 const ALL = !svc760 ? R.all : Object.assign({}, R.all, {kinds: Object.assign({}, R.all.kinds, {subhire: Object.assign({}, R.all.kinds.subhire, {amount: (R.all.kinds.subhire.amount || 0) + svc760, amount0: (R.all.kinds.subhire.amount0 || 0) + svc760, lines: (R.all.kinds.subhire.lines || 0) + 1})}), charged: (R.all.charged || 0) + svc760, charged0: (R.all.charged0 || 0) + svc760});"""
src2 = src.replace(old_rows, new_rows)
head, body = src2.split(new_rows, 1)
body = body.replace('R.all.', 'ALL.')
src2 = head + new_rows + body
hint_old = "the fencing dockets at the 2026 card sit under subhire on the fencing contractor's branch."
if src2.count(hint_old) != 1: sys.exit('branchCostCard hint not found')
src2 = src2.replace(hint_old, "the fencing dockets at the 2026 card sit under subhire on the fencing contractor's branch, and the toilets' servicing and cleaning at our pump-out rates under subhire on the branch that sub-hires the toilets.")
t = t[:i] + src2 + t[e:]

# ---- 6. a little style for the grey cost column and the scope row
t = rep(t, ".ld-qr svg{display:block;width:50px;height:50px}",
 ".ld-qr svg{display:block;width:50px;height:50px} /* v7.60 */ .pl-tbl .pl-cost{color:var(--mute);font-weight:400} .pl-tbl th.pl-cost{border-left:1px solid var(--line,#ddd)} .pl-tbl td.pl-cost{border-left:1px solid var(--line,#ddd)} .pl-tbl tr.pl-scope td{color:var(--mute)} .pl-tbl tr.pl-grand td{border-top:2px solid var(--line,#ddd)} .pl760-rh{margin:4px 0;font-size:12.5px}",
 'styles', p, True)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', p)
