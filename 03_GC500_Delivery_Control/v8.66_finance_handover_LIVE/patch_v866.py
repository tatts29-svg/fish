# Author: Andrew Fisher. v8.66 Finance handover: every purchase order with its branch and receipting, every cost stream with
# its PO and branch, the demob forecast by branch, and invoice-by-31-Oct by branch - the five things Finance asked for
# after GC500 2025. Builds on the v8.65 candidate (not on live v8.64): run as
#   toolchain/build.sh v8.66 v8.65_costs_one_source_DRAFT/patch_v865.py v8.66_finance_handover_DRAFT/patch_v866.py
import hashlib, os, sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep as replace
p = Path(sys.argv[1])
BASES = {'4ad46aa4da2acf270bfb013d25817312ff9b74f554e6c562dbf83de9112f4ebf': 'v8.65'}  # the v8.65 candidate (patch_v865.py on live v8.64)
h = hashlib.sha256(p.read_bytes()).hexdigest()
assert h in BASES, 'Wrong base ' + h + ' - apply patch_v865.py first'
s = p.read_text(encoding='utf-8-sig')
def rep(a, b, what):
    global s
    s = replace(s, a, b, what, str(p))

# H1. A PURCHASE ORDER CARRIES WHAT FINANCE ASK FOR. Last year's feedback: a cost reaches the P&L only when its PO is
# receipted; every cost sent to Finance needs the PO number and the branch it is costed to; temp labour and transport
# should be costed to the branch the revenue is in. The PO row on the record gains: what it is for (stream), the branch
# the revenue sits in, and whether it is receipted in Coates' system (full / part + amount / not). Typed by an editor,
# saved through setPo like every other PO field. Non-fencing orders can now be recorded too, so they are kept OUT of
# the fencing PO card, the fencing trace and the fencing accrual, which read Advanced's orders only.
rep(" ['supplier_code', 'supplier_name', 'branch', 'period', 'programme_sheet', 'invoice_no', 'amount', 'note', 'by', 'at', 'updated_at', 'updated_by'].forEach(f => { if (r[f] != null && r[f] !== '') m[f] = r[f]; });",
    " ['supplier_code', 'supplier_name', 'branch', 'period', 'programme_sheet', 'invoice_no', 'amount', 'note', 'by', 'at', 'updated_at', 'updated_by', 'stream', 'revenue_branch', 'receipted', 'receipted_amount', 'what'].forEach(f => { if (r[f] != null && r[f] !== '') m[f] = r[f]; }); /* v8.66 - what Finance ask for */",
    'H1a poAll carries the handover fields')
rep("function poOf(no){ return poAll().find(o => o.number === String(no)) || null; }",
    "function poOf(no){ return poAll().find(o => o.number === String(no)) || null; }\n/* v8.66 - the fencing contractor's orders: the ones the fencing card, the fencing trace and the fencing accrual read */\nfunction poFencing866(o){ return !o || !o.stream || o.stream === 'fencing'; }",
    'H1b poFencing866')
rep("function poCard(byWeek){\n const pos = poAll();", "function poCard(byWeek){\n const pos = poAll().filter(poFencing866); /* v8.66 - Advanced's orders only */", 'H1c fencing PO card')
rep("purchaseOrders:poAll(),canonical:fenceReviewCanonical836});", "purchaseOrders:poAll().filter(poFencing866),canonical:fenceReviewCanonical836});", 'H1d fencing trace')
rep(" poAll().filter(o => o.confirmed && o.invoice_no && o.amount != null).forEach(o => {",
    " poAll().filter(poFencing866).filter(o => o.confirmed && o.invoice_no && o.amount != null).forEach(o => { /* v8.66 - the fencing invoices only */", 'H1e fencing accrual invoices')
rep(" const open = poAll().filter(o => !(o.confirmed && o.invoice_no && o.amount != null) && acc763PoDate(o) && acc763PoDate(o).slice(0, 7) === month);",
    " const open = poAll().filter(poFencing866).filter(o => !(o.confirmed && o.invoice_no && o.amount != null) && acc763PoDate(o) && acc763PoDate(o).slice(0, 7) === month);", 'H1f fencing accrual open POs')

# H2. THE VIEW. A fifth Costs & P&L button, Finance handover, mounted the way the other sub-views are.
rep('<button class="btn" data-finance857="runsheet">Workforce costs</button></nav>',
    '<button class="btn" data-finance857="runsheet">Workforce costs</button><button class="btn" data-finance857="handover">Finance handover</button></nav>', 'H2a button')
rep("  const view=state.financeView857;\nif(!['pricing','fencing','runsheet'].includes(view))return false;",
    "  const view=state.financeView857;\n  if(view==='handover'){ /* v8.66 - drawn fresh each time from the record */\n    const costs=document.getElementById('pane-costs');\n    costs.innerHTML=paneHeadingHtml('costs')+financeLinks857()+'<div id=\"finance857-section\">'+paneHeadingHtml('handover')+fh866Html()+'</div>';\n    fh866Bind(); return true; }\nif(!['pricing','fencing','runsheet'].includes(view))return false;", 'H2b mount')
rep(" const FIN865 = {pricing: 'Customer rates & charges', runsheet: 'Workforce costs'};", " const FIN865 = {pricing: 'Customer rates & charges', runsheet: 'Workforce costs', handover: 'Finance handover'};", 'H2c heading')

# H3. THE MODEL AND THE PAGE. Every figure is a cut, by branch, of one the Costs tab already carries (cj764Model, labourPlan,
# pl752Rows, pl760Ticks, the quotes, the running sheet); nothing is added to the P&L and nothing is invented. The branch comes
# from the hire contracts (branchOf): fencing on the fencing branch, toilets on the toilets branch, transport by each reference's
# branch, the people's costs by the labour per piece on each branch. Numbers, one basis line per table, no notes (Andrew, 6 Oct).
rep("function financeLinks857() {", r"""/* v8.66 FINANCE HANDOVER - purchase orders, costs, the demob and the invoicing, by branch, from the record */
const FH866_STREAMS = [['fencing', 'Fencing — sub-hire'], ['toilets', 'Toilets — sub-hire'], ['transport', 'Transport — carriers'], ['labour', 'Labour hire'], ['other', 'Other']];
const FH866_RECEIPT = {full: 'Receipted in full', part: 'Part receipted', none: 'Not receipted', unknown: 'Not confirmed'};
const FH866_DEADLINE = '2026-10-31';
function fh866StreamName(k){ const f = FH866_STREAMS.find(x => x[0] === k); return f ? f[1] : (k || '—'); }
function fh866Branches(){ const s = new Set((BRANCHES.branches || []).map(b => b.code)); try { branchesUsed().forEach(b => s.add(b.code)); } catch (e) {} s.add('NOIS'); poAll().forEach(o => { if (o.branch) s.add(o.branch); if (o.revenue_branch) s.add(normBranch(o.revenue_branch)); }); return [...s].filter(Boolean).sort(); }
function fh866RevenueBranch(o){
 if (o.revenue_branch) return normBranch(o.revenue_branch);
 const st = o.stream || 'fencing';
 return st === 'fencing' ? pl760FencingBranch() : st === 'toilets' ? pl760ToiletBranch() : null;
}
function fh866Receipt(o){
 const amt = Number(o.amount), r = ['full', 'part', 'none'].includes(o.receipted) ? o.receipted : 'unknown';
 const ra = o.receipted_amount != null && o.receipted_amount !== '' && Number.isFinite(Number(o.receipted_amount)) ? Number(o.receipted_amount) : null;
 return {key: r, words: FH866_RECEIPT[r] + (r === 'part' && ra != null ? ' ' + money(ra) : ''), amount: r === 'full' ? (Number.isFinite(amt) ? amt : null) : r === 'part' ? ra : r === 'none' ? 0 : null};
}
/* split a total across branches by weight, in cents that add back to the total; nothing to weigh by goes to '—' (no branch) */
function fh866Split(total, weights){
 const r2 = n => Math.round((n + Number.EPSILON) * 100) / 100, out = {}; total = r2(total || 0);
 const keys = Object.keys(weights || {}).filter(k => (weights[k] || 0) > 0), sum = keys.reduce((s, k) => s + weights[k], 0);
 if (!total) return out;
 if (!keys.length || !sum) { out['—'] = total; return out; }
 let acc = 0, top = keys[0]; keys.forEach(k => { out[k] = r2(total * weights[k] / sum); acc = r2(acc + out[k]); if (weights[k] > weights[top]) top = k; });
 out[top] = r2(out[top] + (total - acc)); return out;
}
function fh866Model(){
 const today = todayIso(), r2 = n => Math.round((n + Number.EPSILON) * 100) / 100, near = (a, b) => Math.abs(a - b) < 0.005;
 const X = cj764Model(), LP = labourPlan(), B = pl752Rows(), M = moneySummary(), c = M.charge || {}, W = X.wages || {};
 const FBR = pl760FencingBranch(), TBR = pl760ToiletBranch();
 /* 1. the purchase orders */
 const pos = poAll().map(o => { const rb = fh866RevenueBranch(o), rc = fh866Receipt(o), costed = o.branch || null;
 return Object.assign({}, o, {stream: o.stream || 'fencing', costedBranch: costed, revenueBranch: rb, receipt: rc, mismatch: !!(costed && rb && costed !== rb), noValue: !(Number(o.amount) > 0)}); });
 const poSum = r2(pos.reduce((s, o) => s + (Number(o.amount) || 0), 0)), receiptedSum = r2(pos.reduce((s, o) => s + (o.receipt.amount || 0), 0));
 const counts = {full: 0, part: 0, none: 0, unknown: 0}; pos.forEach(o => counts[o.receipt.key]++); const noValue = pos.filter(o => o.noValue).length;
 const notConfirmed = r2(pos.reduce((s, o) => s + Math.max(0, (Number(o.amount) || 0) - (Number(o.receipt.amount) || 0)), 0)); /* Codex: include the unreceipted balance of a part-receipted PO */
 /* the branches, in the order the By branch table uses; the contracts put the branch on every reference */
 const live = allAssets().filter(a => !a._cancelled && !a.rest_of);
 const order = B.map(b => b.code).filter(k => k && k !== 'no branch'); [FBR, TBR].forEach(k => { if (k && !order.includes(k)) order.push(k); });
 /* the weights: transport by each reference's contract branch; people by the labour per piece on each branch */
 let ourRefs = new Set(); try { ourRefs = new Set(ourCosts().filter(x => x.kind === 'transport' && x.usable && x.amount != null && x.ref).map(x => x.ref)); } catch (e) {}
 const tBy = {}, cardBy = {}; let tNone = 0;
 const bump = (o, k, v) => { o[k] = r2((o[k] || 0) + v); };
 live.forEach(a => { const b = (branchOf(a.key) || {}).code; if (!ourRefs.has(a.key)) (a.events || []).forEach(e => { const tc = e.transport_cost; if (!tc || tc.internal || tc.amount == null) return; if (b) bump(tBy, b, tc.amount); else tNone = r2(tNone + tc.amount); });
 if (ourRefs.has(a.key)) return; const ev = (a.events || []).filter(e => e.carrier || e.dd || e.transport_cost); if (!ev.length || !ev.some(e => !(e.transport_cost && (e.transport_cost.amount != null || e.transport_cost.internal)))) return;
 const T = assetTotal(a), cc = (T.lines || []).reduce((s, l) => s + ((l.transport_cost != null && l.qty != null) ? l.transport_cost * l.qty : 0), 0); if (cc && b) bump(cardBy, b, cc); });
 try { ourCosts().filter(x => x.kind === 'transport' && x.usable && x.amount != null).forEach(x => { const b = (costBranchOf(x) || {}).code; if (b) bump(tBy, b, x.amount); else tNone = r2(tNone + x.amount); }); } catch (e) {}
 const LAB_KEYS = new Set(['install', 'steps', 'levelling', 'demob']); const labBy = {};
 LP.slots.forEach(sl => { if (!LAB_KEYS.has(sl.key) || sl.value == null) return; const g = labBy[sl.branch || '—'] = labBy[sl.branch || '—'] || {charged: 0, toCome: 0}; if (sl.state === 'charged') g.charged = r2(g.charged + sl.value); else g.toCome = r2(g.toCome + sl.value); });
 const labW = {}; Object.entries(labBy).forEach(([b, g]) => { if (b !== '—') labW[b] = r2(g.charged + g.toCome); });
 const labTotal = r2(Object.values(labW).reduce((s, v) => s + v, 0)), labShare = Object.fromEntries(Object.entries(labW).map(([b, v]) => [b, labTotal ? Math.round(100 * v / labTotal) : 0]));
 Object.keys(tBy).concat(Object.keys(cardBy), Object.keys(labW)).forEach(k => { if (k && k !== '—' && !order.includes(k)) order.push(k); });
 /* 2. every cost stream, by branch */
 const streamOf = s => /^Fencing/.test(s) ? 'fencing' : /^Toilets/.test(s) ? 'toilets' : /^Transport/.test(s) ? 'transport' : /^Labour/.test(s) ? 'labour' : 'expenses';
 const splitFor = (st, toDate, toCome) => {
 if (st === 'fencing') return {toDate: fh866Split(toDate, {[FBR]: 1}), toCome: fh866Split(toCome, {[FBR]: 1})};
 if (st === 'toilets') return {toDate: fh866Split(toDate, {[TBR]: 1}), toCome: fh866Split(toCome, {[TBR]: 1})};
 if (st === 'transport') return {toDate: fh866Split(toDate, Object.keys(tBy).length ? tBy : labW), toCome: fh866Split(toCome, Object.keys(cardBy).length ? cardBy : (Object.keys(tBy).length ? tBy : labW))};
 return {toDate: fh866Split(toDate, labW), toCome: fh866Split(toCome, labW)};
 };
 const rowsIn = X.rows.map(r => ({stream: r.stream, kind: streamOf(r.stream), toDate: r.toDate || 0, toCome: r.toCome || 0}));
 if (W.allowanceForecast) rowsIn.push({stream: 'Salary allowance', kind: 'labour', toDate: 0, toCome: r2(W.allowanceForecast)});
 const costs = rowsIn.map(r => { const sp = splitFor(r.kind, r.toDate, r.toCome), by = {}; Object.entries(sp.toDate).forEach(([b, v]) => bump(by, b, v)); Object.entries(sp.toCome).forEach(([b, v]) => bump(by, b, v));
 const po = pos.filter(o => o.stream === r.kind).map(o => o.number);
 return {stream: r.stream.replace(/ — .*$/, ''), kind: r.kind, pos: po, toDate: r2(r.toDate), toCome: r2(r.toCome), job: r2(r.toDate + r.toCome), by}; });
 const colSum = (rows, b) => r2(rows.reduce((s, r) => s + (r.by[b] || 0), 0));
 const costTotal = {toDate: r2(costs.reduce((s, r) => s + r.toDate, 0)), toCome: r2(costs.reduce((s, r) => s + r.toCome, 0)), job: r2(costs.reduce((s, r) => s + r.job, 0)), by: {}};
 const anyNone = costs.some(r => r.by['—']); const cols = order.slice(); if (anyNone) cols.push('—');
 cols.forEach(b => costTotal.by[b] = colSum(costs, b));
 const costCheck = near(costTotal.job, r2((X.job || 0) + (W.job || 0))) && costs.every(r => near(r.job, r2(Object.values(r.by).reduce((s, v) => s + v, 0))));
 /* 3. the demob, by branch - a cut of the figures above */
 const ev = eventWindow(), evEnd = ev ? ev.to : null, F = X.fencing || {weeks: [], notRolled: []};
 const decon = (F.weeks || []).filter(w => /demob|decon/i.test(String(w.prog || w.week || ''))), deconCost = r2(decon.reduce((s, w) => s + (w.cost || 0), 0));
 const tdBy = {}; let tdNoBasis = 0;
 live.forEach(a => { const ds = (a.events || []).filter(e => /demob/i.test(String(e.phase || '')) || /demob/i.test(String(e.sheet || ''))); if (!ds.length) return; const b = (branchOf(a.key) || {}).code || '—'; let noFig = 0;
 ds.forEach(e => { const tc = e.transport_cost; if (tc && tc.internal) return; if (tc && tc.amount != null) bump(tdBy, b, tc.amount); else noFig++; });
 if (!noFig || ourRefs.has(a.key)) return; const T = assetTotal(a), cc = (T.lines || []).reduce((s, l) => s + ((l.transport_cost != null && l.qty != null) ? l.transport_cost * l.qty : 0), 0); if (cc) bump(tdBy, b, cc); else tdNoBasis += noFig; });
 let ldCost = 0, ldUnp = 0; try { fin745Rows(today).forEach(r => { if (!evEnd || !r.date || r.date <= evEnd) return; const cost = r.status === 'confirmed' && r.actualCost != null ? r.actualCost : r.calculatedCost; if (cost == null) ldUnp += Number(r.paid) || 0; else ldCost += cost; }); } catch (e) {}
 const Q = ((DATA.rehire_quotes || {}).quotes || []), pick = r2(Q.reduce((s, q) => s + (Number(q.pickup) || 0), 0));
 const demob = [
 {stream: 'Fencing removal', by: decon.length ? fh866Split(deconCost, {[FBR]: 1}) : null},
 {stream: 'Transport — demob loads', by: tdBy},
 {stream: 'Wages after the race weekend', by: fh866Split(r2(ldCost), labW)},
 {stream: 'Toilets — pickup', by: fh866Split(pick, {[TBR]: 1})}
 ].map(d => Object.assign(d, {total: d.by ? r2(Object.values(d.by).reduce((s, v) => s + v, 0)) : null}));
 const demobTotal = r2(demob.reduce((s, d) => s + (d.total || 0), 0)), demobBy = {}; demob.forEach(d => Object.entries(d.by || {}).forEach(([b, v]) => bump(demobBy, b, v)));
 Object.keys(demobBy).forEach(k => { if (k !== '—' && !cols.includes(k)) cols.push(k); }); if (demobBy['—'] && !cols.includes('—')) cols.push('—');
 const ldRev = {}; LP.slots.forEach(sl => { if (sl.key !== 'demob' || sl.state === 'charged' || sl.value == null) return; bump(ldRev, sl.branch || '—', sl.value); });
 const demobCharge = Object.entries(ldRev).sort((x, y) => y[1] - x[1]).map(([branch, amount]) => ({branch, amount}));
 /* 4. invoice by 31 Oct - revenue by branch, and the contract export's billed column */
 const daysLeft = Math.round((Date.parse(FH866_DEADLINE + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000);
 const TK = pl760Ticks(), FB = pl760FencingByBranch(), svc = Number(c.servicing) || 0;
 const billedBy = {}; let supplied = null, billedLines = 0, contractLines = 0;
 try { (typeof ONHIRE_ROWS !== 'undefined' ? ONHIRE_ROWS : []).forEach(r => { const b = r.branch_code || '—'; contractLines++; if (Number(r.billed_amount) > 0) billedLines++; bump(billedBy, b, Number(r.billed_amount) || 0); }); supplied = typeof ONHIRE !== 'undefined' && ONHIRE ? ONHIRE.supplied_on || null : null; } catch (e) {}
 const inv = B.filter(b => b.code && b.code !== 'no branch').map(b => { const tk = TK.byBranch[b.code] || {install: {amount: 0}, cleaning: {amount: 0}, fire_ext: {amount: 0}, other: {amount: 0}};
 const off = r2((b.code === TBR ? svc : 0) + (FB[b.code] || 0)), onRecord = r2(b.total + off + tk.install.amount + tk.cleaning.amount + tk.fire_ext.amount + tk.other.amount);
 const lab = labBy[b.code] || {toCome: 0}, toCome = r2((b.code === FBR ? (X.revenue.fenceToCome || 0) : 0) + lab.toCome);
 return {branch: b.code, onRecord, toCome, job: r2(onRecord + toCome), billed: r2(billedBy[b.code] || 0), unbilled: r2(onRecord - (billedBy[b.code] || 0))}; });
 const scope = c.race && c.race.amount != null ? r2(c.race.amount) : 0;
 inv.push({branch: 'Event labour scope', onRecord: scope, toCome: 0, job: scope, billed: 0, unbilled: scope});
 if (X.revenue.transportToCome) inv.push({branch: 'Transport — provisional', onRecord: 0, toCome: r2(X.revenue.transportToCome), job: r2(X.revenue.transportToCome), billed: 0, unbilled: 0});
 const sumOn = r2(inv.reduce((s, r) => s + r.onRecord, 0)), rest = r2((Number(c.total) || 0) - sumOn), restCome = r2((X.revenue.job || 0) - (Number(c.total) || 0) - inv.reduce((s, r) => s + r.toCome, 0));
 if (Math.abs(rest) >= 0.01 || Math.abs(restCome) >= 0.01) inv.push({branch: 'No branch', onRecord: rest, toCome: restCome, job: r2(rest + restCome), billed: 0, unbilled: rest});
 const invTotal = {onRecord: r2(inv.reduce((s, r) => s + r.onRecord, 0)), toCome: r2(inv.reduce((s, r) => s + r.toCome, 0)), job: r2(inv.reduce((s, r) => s + r.job, 0)), billed: r2(inv.reduce((s, r) => s + r.billed, 0)), unbilled: r2(inv.reduce((s, r) => s + r.unbilled, 0))};
 const invCheck = {record: near(invTotal.onRecord, Number(c.total) || 0), job: near(invTotal.job, X.revenue.job || 0)};
 return {asAt: today, pos, poSum, receiptedSum, notConfirmed, counts, noValue, cols, FBR, TBR, labShare, costs, costTotal, costCheck, plJob: r2((X.job || 0) + (W.job || 0)),
 demob, demobTotal, demobBy, demobCharge, demobNotForecast: demob.filter(d => d.by == null).length, demobLoadsNoFigure: tdNoBasis, wagesUnpricedAfterEvent: r2(ldUnp),
 inv, invTotal, invCheck, revenueRecord: r2(Number(c.total) || 0), revenueJob: r2(X.revenue.job || 0), deadline: FH866_DEADLINE, daysLeft, billed: {lines: billedLines, of: contractLines, supplied}};
}
function fh866Html(){
 let H; try { H = fh866Model(); } catch (e) { return `<section id="handover866" class="fin745 nosfold"><p class="fin745-eyebrow">FINANCE HANDOVER</p><p>The handover could not be worked out from this record: ${esc(String(e && e.message || e))}</p></section>`; }
 const m0 = v => v == null ? '<span class="pl-todo">—</span>' : esc(money0(v)), cell = v => v ? esc(money0(v)) : '—';
 const opt = (list, cur, blank) => (blank ? `<option value=""${!cur ? ' selected' : ''}>${esc(blank)}</option>` : '') + list.map(([v, w]) => `<option value="${esc(v)}"${String(cur || '') === String(v) ? ' selected' : ''}>${esc(w)}</option>`).join('');
 const branches = fh866Branches().map(b => [b, b]);
 const badge = (k, w) => `<span class="fh866-b fh866-b-${esc(k)}">${esc(w)}</span>`;
 const colName = b => b === '—' ? 'No branch' : b;
 const poRow = o => `<tr data-fh866-row="${esc(o.number)}">
 <td><b class="mono">${esc(o.number)}</b><br><span class="w fh866-mute">${esc(o.supplier_name || '')}</span></td>
 <td><select data-fh866="stream" aria-label="what PO ${esc(o.number)} is for">${opt(FH866_STREAMS, o.stream)}</select><input data-fh866="what" value="${esc(o.what || o.period || '')}" maxlength="80" placeholder="description" aria-label="description of PO ${esc(o.number)}"></td>
 <td><select data-fh866="branch" aria-label="branch PO ${esc(o.number)} is costed to">${opt(branches, o.costedBranch, '—')}</select></td>
 <td><select data-fh866="revenue_branch" aria-label="branch the revenue for PO ${esc(o.number)} sits in">${opt(branches, o.revenue_branch ? normBranch(o.revenue_branch) : '', o.revenueBranch || '—')}</select>${o.mismatch ? `<div class="w">${badge('none', 'Branch differs')}</div>` : ''}</td>
 <td class="num"><input data-fh866="amount" type="number" min="0" step="0.01" inputmode="decimal" value="${o.amount != null ? esc(o.amount) : ''}" placeholder="0.00" aria-label="value of PO ${esc(o.number)}"></td>
 <td><input data-fh866="invoice_no" value="${esc(o.invoice_no || '')}" placeholder="—" inputmode="numeric" aria-label="receipt ID for PO ${esc(o.number)}"></td>
 <td><select data-fh866="receipted" aria-label="receipting of PO ${esc(o.number)}">${opt([['full', 'Receipted in full'], ['part', 'Part receipted'], ['none', 'Not receipted']], o.receipt.key === 'unknown' ? '' : o.receipt.key, 'Not confirmed')}</select><input data-fh866="receipted_amount" type="number" min="0" step="0.01" inputmode="decimal" value="${o.receipted_amount != null && o.receipted_amount !== '' ? esc(o.receipted_amount) : ''}" placeholder="amount receipted" aria-label="amount receipted on PO ${esc(o.number)}"${o.receipt.key === 'part' ? '' : ' hidden'}><div class="w">${badge(o.receipt.key, o.receipt.words)}</div></td>
 <td><div class="acts"><button class="btn" data-fh866-save="${esc(o.number)}">Save</button></div></td></tr>`;
 const costRow = r => `<tr><td><b>${esc(r.stream)}</b></td><td>${r.pos.length ? r.pos.map(n => `<span class="mono">${esc(n)}</span>`).join(', ') : '—'}</td>${H.cols.map(b => `<td class="num">${cell(r.by[b])}</td>`).join('')}<td class="num">${cell(r.toDate)}</td><td class="num"><b>${m0(r.job)}</b></td></tr>`;
 const demobRow = d => `<tr><td><b>${esc(d.stream)}</b></td>${H.cols.map(b => `<td class="num">${d.by ? cell(d.by[b]) : '—'}</td>`).join('')}<td class="num"><b>${d.total == null ? '—' : m0(d.total)}</b></td></tr>`;
 const invRow = r => `<tr><td><b>${esc(r.branch)}</b></td><td class="num">${m0(r.onRecord)}</td><td class="num">${cell(r.toCome)}</td><td class="num"><b>${m0(r.job)}</b></td><td class="num">${cell(r.billed)}</td><td class="num"><b>${m0(r.unbilled)}</b></td></tr>`;
 const due = H.daysLeft > 0 ? `${fmtNum(H.daysLeft)} day${H.daysLeft === 1 ? '' : 's'}` : H.daysLeft === 0 ? 'today' : `${fmtNum(-H.daysLeft)} day${H.daysLeft === -1 ? '' : 's'} past`;
 const shares = Object.entries(H.labShare).sort((x, y) => y[1] - x[1]).map(([b, p]) => `${b} ${p}%`).join(' · ');
 return `<section id="handover866" class="fin745 nosfold" aria-labelledby="fh866Title">
 <div class="fin745-heading"><div><p class="fin745-eyebrow">FINANCE HANDOVER · AS AT ${esc(fmtDate(H.asAt).toUpperCase())} · AUD EX GST</p><h2 id="fh866Title">Purchase orders, costs and revenue by branch</h2>
 <p>Each figure is a cut of the Costs &amp; P&amp;L figures by the branch on the hire contracts. Nothing here is added to the P&amp;L.</p></div>
 <div class="fin745-tools"><div><button type="button" class="btn ghost sm" data-fh866-act="copy">Copy for Finance</button><button type="button" class="btn ghost sm" data-fh866-act="csv">Export handover CSV</button></div></div></div>
 <div class="fin745-metrics fh866-metrics">
 ${fin745Card('Purchase orders receipted', `${fmtNum(H.counts.full + H.counts.part)} of ${fmtNum(H.pos.length)}`, `${fmtNum(H.counts.full)} in full · ${fmtNum(H.counts.part)} part · ${fmtNum(H.counts.none)} not receipted · ${fmtNum(H.counts.unknown)} not confirmed`)}
 ${fin745Card('PO value not confirmed receipted', money0(H.notConfirmed), `of ${money0(H.poSum)} on ${fmtNum(H.pos.length)} purchase order${H.pos.length === 1 ? '' : 's'}${H.noValue ? ` · ${fmtNum(H.noValue)} without a value` : ''}`)}
 ${fin745Card('Demob forecast', money0(H.demobTotal), H.cols.filter(b => H.demobBy[b]).map(b => `${colName(b)} ${money0(H.demobBy[b])}`).join(' · ') || 'nothing forecast')}
 ${fin745Card(`Invoice by ${fmtDate(H.deadline)}`, due, `${money0(H.invTotal.unbilled)} not yet billed`)}
 </div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>1. Purchase orders</h3></div></div>
 <div class="fin745-table fh866-table"><table><thead><tr><th>PO</th><th>For</th><th>Branch costed</th><th>Branch of revenue</th><th class="num">PO value</th><th>Receipt ID</th><th>Receipted</th><th></th></tr></thead><tbody>
 ${H.pos.length ? H.pos.map(poRow).join('') : '<tr><td colspan="8">No purchase order on the record.</td></tr>'}
 <tr class="acc761-tot"><td colspan="4">Total</td><td class="num"><b>${m0(H.poSum)}</b></td><td></td><td><b>${m0(H.receiptedSum)}</b> receipted</td><td></td></tr>
 <tr class="fh866-add"><td><input id="fh866New" inputmode="numeric" placeholder="PO number" aria-label="new purchase order number" maxlength="12"><input data-fh866="supplier_name" value="" placeholder="supplier" aria-label="supplier for the new purchase order" maxlength="60"></td>
 <td><select data-fh866="stream" aria-label="what the new PO is for">${opt(FH866_STREAMS, 'other')}</select><input data-fh866="what" value="" maxlength="80" placeholder="description" aria-label="description of the new PO"></td>
 <td><select data-fh866="branch" aria-label="branch the new PO is costed to">${opt(branches, '', '—')}</select></td><td><select data-fh866="revenue_branch" aria-label="branch the revenue sits in">${opt(branches, '', '—')}</select></td>
 <td class="num"><input data-fh866="amount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00" aria-label="value of the new PO"></td><td><input data-fh866="invoice_no" placeholder="—" inputmode="numeric" aria-label="receipt ID for the new PO"></td>
 <td><select data-fh866="receipted" aria-label="receipting of the new PO">${opt([['full', 'Receipted in full'], ['part', 'Part receipted'], ['none', 'Not receipted']], '', 'Not confirmed')}</select><input data-fh866="receipted_amount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="amount receipted" aria-label="amount receipted on the new PO" hidden></td>
 <td><div class="acts"><button class="btn" data-fh866-add="1">Add PO</button></div></td></tr>
 </tbody></table></div></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>2. Costs by branch, to job end</h3></div></div>
 <div class="fin745-table fh866-table"><table><thead><tr><th>Cost</th><th>PO</th>${H.cols.map(b => `<th class="num">${esc(colName(b))}</th>`).join('')}<th class="num">Of which to date</th><th class="num">To job end</th></tr></thead><tbody>
 ${H.costs.map(costRow).join('')}
 <tr class="acc761-tot"><td colspan="2">Total</td>${H.cols.map(b => `<td class="num"><b>${cell(H.costTotal.by[b])}</b></td>`).join('')}<td class="num"><b>${m0(H.costTotal.toDate)}</b></td><td class="num"><b>${m0(H.costTotal.job)}</b></td></tr>
 </tbody></table></div>
 <p class="fin745-basis">Fencing on ${esc(H.FBR)}; toilets on ${esc(H.TBR)}; transport by each reference’s contract branch; wages, salary allowance, accommodation and meals by the labour per piece on each branch (${esc(shares)}).${H.costCheck ? '' : ` <span class="fh866-todo">Does not match To job end (${esc(money0(H.plJob))}).</span>`}</p></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>3. Demob forecast by branch</h3></div></div>
 <div class="fin745-table fh866-table"><table><thead><tr><th>Demob cost</th>${H.cols.map(b => `<th class="num">${esc(colName(b))}</th>`).join('')}<th class="num">Total</th></tr></thead><tbody>
 ${H.demob.map(demobRow).join('')}
 <tr class="acc761-tot"><td>Total</td>${H.cols.map(b => `<td class="num"><b>${cell(H.demobBy[b])}</b></td>`).join('')}<td class="num"><b>${m0(H.demobTotal)}</b></td></tr>
 </tbody></table></div>
 <p class="fin745-basis">Inside the costs above, not additional. Fencing removal: no dated removal programme yet.${H.demobLoadsNoFigure ? ` ${esc(fmtNum(H.demobLoadsNoFigure))} demob loads carry no transport figure yet.` : ''}${H.wagesUnpricedAfterEvent ? ` ${esc(fmtNum(H.wagesUnpricedAfterEvent))} h of wages after the race weekend are not yet priced.` : ''} Demob labour charged per piece, still to tick: ${H.demobCharge.length ? H.demobCharge.map(d => `${esc(colName(d.branch))} ${esc(money0(d.amount))}`).join(' · ') : 'none'} (revenue).</p></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>4. Invoice by ${esc(fmtDate(H.deadline))} — by branch</h3></div></div>
 <div class="fin745-table fh866-table"><table><thead><tr><th>Branch</th><th class="num">Revenue on the record</th><th class="num">Still to come</th><th class="num">To job end</th><th class="num">Billed</th><th class="num">Not yet billed</th></tr></thead><tbody>
 ${H.inv.map(invRow).join('')}
 <tr class="acc761-tot"><td>Total</td><td class="num"><b>${m0(H.invTotal.onRecord)}</b></td><td class="num"><b>${m0(H.invTotal.toCome)}</b></td><td class="num"><b>${m0(H.invTotal.job)}</b></td><td class="num"><b>${cell(H.invTotal.billed)}</b></td><td class="num"><b>${m0(H.invTotal.unbilled)}</b></td></tr>
 </tbody></table></div>
 <p class="fin745-basis">Billed per the contract export${H.billed.supplied ? ' of ' + esc(fmtDate(H.billed.supplied)) : ''} (${esc(fmtNum(H.billed.lines))} of ${esc(fmtNum(H.billed.of))} lines). Not yet billed is the accrual by branch if the invoices are not out by ${esc(fmtDate(H.deadline))}.${H.invCheck.record && H.invCheck.job ? '' : ` <span class="fh866-todo">Does not match the P&amp;L (record ${esc(money(H.revenueRecord))}, job end ${esc(money(H.revenueJob))}).</span>`}</p></div>
 </section>`;
}
function fh866Patch(row){
 const v = f => { const el = row.querySelector(`[data-fh866="${f}"]`); return el ? String(el.value || '').trim() : ''; };
 const num = f => { const t = v(f); if (t === '') return null; const n = Number(t); return Number.isFinite(n) ? n : null; };
 const patch = {stream: v('stream') || 'other', what: v('what') || null, branch: normBranch(v('branch')) || null, revenue_branch: normBranch(v('revenue_branch')) || null, amount: num('amount'), invoice_no: v('invoice_no').replace(/[^0-9A-Za-z-]/g, '') || null, receipted: ['full', 'part', 'none'].includes(v('receipted')) ? v('receipted') : null, receipted_amount: v('receipted') === 'part' ? num('receipted_amount') : null};
 const sup = row.querySelector('[data-fh866="supplier_name"]'); if (sup && sup.value.trim()) patch.supplier_name = sup.value.trim().slice(0, 60);
 return patch;
}
function fh866Bind(){
 const root = document.getElementById('handover866'); if (!root) return;
 root.querySelectorAll('[data-fh866="receipted"]').forEach(sel => sel.onchange = () => { const amt = sel.parentElement.querySelector('[data-fh866="receipted_amount"]'); if (amt) amt.hidden = sel.value !== 'part'; });
 root.querySelectorAll('[data-fh866-save]').forEach(b => b.onclick = () => { const row = b.closest('tr'); if (!row) return; if (setPo(b.dataset.fh866Save, fh866Patch(row))) { flash(`PO ${b.dataset.fh866Save} saved.`); render(); } });
 const add = root.querySelector('[data-fh866-add]'); if (add) add.onclick = () => { const row = add.closest('tr'), no = String((root.querySelector('#fh866New') || {}).value || '').replace(/\D/g, '');
 if (!/^\d{4,12}$/.test(no)) { flash('A purchase order number is 4 to 12 digits.'); return; }
 if (poOf(no)) { flash(`PO ${no} is already on the record — change it on its own row.`); return; }
 const patch = fh866Patch(row); if (!patch.supplier_name) { flash('Name the supplier the purchase order is to.'); return; }
 if (setPo(no, patch)) { flash(`PO ${no} added.`); render(); } };
 root.querySelectorAll('[data-fh866-act]').forEach(b => b.onclick = () => {
 const H = fh866Model();
 if (b.dataset.fh866Act === 'csv') return fin745Download('GC500_Finance_handover_' + H.asAt + '.csv', '﻿' + fh866Csv(H), 'text/csv;charset=utf-8');
 const text = fh866Text(H), done = () => { try { flash('Copied for Finance — paste it into your email or note.'); } catch (e) {} };
 const fallback = () => { const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); if (ok) done(); else { try { flash('Could not copy — use Export handover CSV instead.'); } catch (e) {} } };
 if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback(); });
}
function fh866Csv(H){
 const cn = b => b === '—' ? 'No branch' : b;
 const rows = [['Author: Andrew Fisher'], [`${DATA.event.name} — Finance handover — by purchase order and by branch`], ['As at', H.asAt], ['Invoice by', H.deadline], [],
 ['1. Purchase orders', 'PO', 'Supplier', 'For', 'Description', 'Branch costed', 'Branch of revenue', 'PO value AUD ex GST', 'Receipt ID', 'Receipted', 'Amount receipted']];
 H.pos.forEach(o => rows.push(['Purchase order', o.number, o.supplier_name || '', fh866StreamName(o.stream), o.what || o.period || '', o.costedBranch || '', o.revenueBranch || '', o.amount, o.invoice_no || '', FH866_RECEIPT[o.receipt.key], o.receipt.amount]));
 rows.push(['Purchase orders total', '', '', '', '', '', '', H.poSum, '', '', H.receiptedSum], []);
 rows.push(['2. Costs by branch, to job end', 'Cost', 'PO'].concat(H.cols.map(cn), ['Of which to date', 'To job end']));
 H.costs.forEach(r => rows.push(['Cost', r.stream, r.pos.join(' ')].concat(H.cols.map(b => r.by[b] || 0), [r.toDate, r.job])));
 rows.push(['Costs total', '', ''].concat(H.cols.map(b => H.costTotal.by[b] || 0), [H.costTotal.toDate, H.costTotal.job]), []);
 rows.push(['3. Demob forecast by branch', 'Demob cost'].concat(H.cols.map(cn), ['Total']));
 H.demob.forEach(d => rows.push(['Demob', d.stream].concat(H.cols.map(b => d.by ? (d.by[b] || 0) : ''), [d.total == null ? '' : d.total])));
 rows.push(['Demob total', ''].concat(H.cols.map(b => H.demobBy[b] || 0), [H.demobTotal]), []);
 rows.push([`4. Invoice by ${H.deadline}`, 'Branch', 'Revenue on the record', 'Still to come', 'To job end', 'Billed', 'Not yet billed']);
 H.inv.forEach(r => rows.push(['Invoice', r.branch, r.onRecord, r.toCome, r.job, r.billed, r.unbilled]));
 rows.push(['Invoice total', '', H.invTotal.onRecord, H.invTotal.toCome, H.invTotal.job, H.invTotal.billed, H.invTotal.unbilled]);
 return rows.map(r => r.map(v => fin745CsvCell(v == null ? '' : v)).join(',')).join('\r\n');
}
function fh866Text(H){
 const cn = b => b === '—' ? 'No branch' : b, L = [];
 L.push(`${DATA.event.name} — Finance handover, as at ${fmtDate(H.asAt)} (AUD ex GST)`);
 L.push(''); L.push(`1. Purchase orders: ${H.counts.full + H.counts.part} of ${H.pos.length} receipted; ${money(H.notConfirmed)} of ${money(H.poSum)} not confirmed receipted.`);
 H.pos.forEach(o => L.push(`  PO ${o.number} — ${o.supplier_name || ''} — ${fh866StreamName(o.stream)} — costed to ${o.costedBranch || '—'}, revenue ${o.revenueBranch || '—'} — ${o.amount != null ? money(o.amount) : '—'} — receipt ID ${o.invoice_no || '—'} — ${o.receipt.words}`));
 L.push(''); L.push(`2. Costs by branch, to job end ${money(H.costTotal.job)}: ${H.cols.map(b => `${cn(b)} ${money(H.costTotal.by[b] || 0)}`).join(' · ')}`);
 H.costs.forEach(r => L.push(`  ${r.stream} — ${H.cols.filter(b => r.by[b]).map(b => `${cn(b)} ${money(r.by[b])}`).join(' · ') || '—'} — ${money(r.job)}`));
 L.push(''); L.push(`3. Demob forecast by branch ${money(H.demobTotal)}: ${H.cols.filter(b => H.demobBy[b]).map(b => `${cn(b)} ${money(H.demobBy[b])}`).join(' · ')}`);
 H.demob.forEach(d => L.push(`  ${d.stream} — ${d.total == null ? 'not forecast' : money(d.total)}`));
 L.push(''); L.push(`4. Invoice by ${fmtDate(H.deadline)} (${H.daysLeft} days): not yet billed ${money(H.invTotal.unbilled)}`);
 H.inv.forEach(r => L.push(`  ${r.branch} — on the record ${money(r.onRecord)}, to job end ${money(r.job)}, billed ${money(r.billed)}, not yet billed ${money(r.unbilled)}`));
 L.push(''); L.push('Author: Andrew Fisher');
 return L.join('\n');
}
/* v8.66 FINANCE HANDOVER END */
function financeLinks857() {""", 'H3 the model, the page, the save, the export')

# H4. THE LOOK: the same cards and tables as the month-end page; inputs sized for a phone; a view-only link cannot type.
rep('<style id="flicker863">', """<style id="handover866css">
/* v8.66 Finance handover */
#handover866 .fh866-table table{min-width:980px}
#handover866 .fh866-table input,#handover866 .fh866-table select{font:inherit;font-size:12.5px;padding:4px 6px;border:1px solid var(--line,#cfd6dc);border-radius:6px;max-width:150px;width:100%;margin:2px 0;background:#fff}
#handover866 .fh866-table td{vertical-align:top}
#handover866 .fh866-mute{font-size:11.5px;color:var(--mute,#6b7681)}
#handover866 .fh866-todo{font-size:11.5px;color:#b42318;font-weight:700}
#handover866 .fh866-ok{font-size:11.5px;color:#1d6b3a;font-weight:700}
#handover866 .fh866-why{font-size:12px;color:var(--mute,#6b7681)}
#handover866 .fh866-needs{margin:0;padding-left:16px;font-size:12px;color:#7a4b0e}
#handover866 tr.fh866-warn td{background:#fff7f3}
#handover866 tr.fh866-add td{background:#f6f8fa}
#handover866 .fh866-b{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:999px;white-space:nowrap}
#handover866 .fh866-b-full{background:#dff3e4;color:#1d6b3a}
#handover866 .fh866-b-part{background:#fff4d8;color:#655223}
#handover866 .fh866-b-none{background:#fde3df;color:#b42318}
#handover866 .fh866-b-unknown{background:#e8edf0;color:#52636e}
body.viewonly #handover866 [data-fh866],body.viewonly #handover866 #fh866New,body.viewonly #handover866 [data-fh866-save],body.viewonly #handover866 [data-fh866-add]{pointer-events:none;opacity:.6}
@media(max-width:640px){#handover866 .fin745-metrics{grid-template-columns:1fr}}
</style>
<style id="flicker863">""", 'H4 style')
rep('· v8.65', '· v8.66', 'footer version')
p.write_text(s, encoding='utf-8-sig')
