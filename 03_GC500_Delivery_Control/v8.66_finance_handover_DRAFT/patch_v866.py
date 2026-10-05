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

# H3. THE MODEL AND THE PAGE. Every figure is a cut of one the Costs tab already carries (cj764Model, labourPlan, pl752Rows,
# pl760Ticks, the quotes, the running sheet); nothing is added to the P&L and nothing is invented. Where the record does
# not hold what Finance need, the row says so and names who supplies it.
rep("function financeLinks857() {", r"""/* v8.66 FINANCE HANDOVER - what Finance asked for after GC500 2025, from the record, by PO and by branch */
const FH866_STREAMS = [['fencing', 'Fencing — sub-hire'], ['toilets', 'Toilets — sub-hire'], ['transport', 'Transport — carriers'], ['labour', 'Labour hire'], ['other', 'Other']];
const FH866_RECEIPT = {full: 'Receipted in full', part: 'Part receipted', none: 'Not receipted', unknown: 'Receipting not confirmed'};
const FH866_DEADLINE = '2026-10-31';
function fh866StreamName(k){ const f = FH866_STREAMS.find(x => x[0] === k); return f ? f[1] : (k || '—'); }
function fh866Branches(){ const s = new Set((BRANCHES.branches || []).map(b => b.code)); try { branchesUsed().forEach(b => s.add(b.code)); } catch (e) {} s.add('NOIS'); poAll().forEach(o => { if (o.branch) s.add(o.branch); if (o.revenue_branch) s.add(normBranch(o.revenue_branch)); }); return [...s].filter(Boolean).sort(); }
function fh866RevenueBranch(o){
 if (o.revenue_branch) return {code: normBranch(o.revenue_branch), why: 'typed here'};
 const st = o.stream || 'fencing';
 if (st === 'fencing') return {code: pl760FencingBranch(), why: 'the fencing dockets are charged on this branch'};
 if (st === 'toilets') return {code: pl760ToiletBranch(), why: 'the toilets are on this branch’s contracts'};
 return {code: null, why: 'not recorded — pick the branch whose contract carries the revenue'};
}
function fh866Receipt(o){
 const amt = Number(o.amount), r = ['full', 'part', 'none'].includes(o.receipted) ? o.receipted : 'unknown';
 const ra = o.receipted_amount != null && o.receipted_amount !== '' && Number.isFinite(Number(o.receipted_amount)) ? Number(o.receipted_amount) : null;
 let words = FH866_RECEIPT[r];
 if (r === 'part') words += ra != null ? ` — ${money(ra)}${Number.isFinite(amt) ? ' of ' + money(amt) : ''}` : ' — amount not typed';
 if (r === 'none') words += ' — will not reach the P&L until it is';
 if (r === 'unknown') words += o.invoice_no ? ' — a receipt ID is recorded, receipting in the system is not' : '';
 return {key: r, words, amount: r === 'full' ? (Number.isFinite(amt) ? amt : null) : r === 'part' ? ra : r === 'none' ? 0 : null};
}
function fh866Model(){
 const today = todayIso(), r2 = n => Math.round((n + Number.EPSILON) * 100) / 100, near = (a, b) => Math.abs(a - b) < 0.005;
 /* 1. the purchase orders */
 const pos = poAll().map(o => { const rb = fh866RevenueBranch(o), rc = fh866Receipt(o), costed = o.branch || null;
 return Object.assign({}, o, {stream: o.stream || 'fencing', costedBranch: costed, revenueBranch: rb.code, revenueWhy: rb.why, receipt: rc,
 mismatch: !!(costed && rb.code && costed !== rb.code), noBranch: !costed, noValue: !(Number(o.amount) > 0), noReceiptId: !o.invoice_no}); });
 const poSum = r2(pos.reduce((s, o) => s + (Number(o.amount) || 0), 0)), receiptedSum = r2(pos.reduce((s, o) => s + (o.receipt.amount || 0), 0));
 const counts = {full: 0, part: 0, none: 0, unknown: 0}; pos.forEach(o => counts[o.receipt.key]++); const noValue = pos.filter(o => o.noValue).length;
 const notConfirmed = r2(pos.filter(o => o.receipt.key === 'unknown' || o.receipt.key === 'none').reduce((s, o) => s + (Number(o.amount) || 0), 0));
 /* 2. every cost stream to Finance, with its PO and its branch */
 const X = cj764Model(), LP = labourPlan(), B = pl752Rows(), M = moneySummary(), c = M.charge || {};
 const FBR = pl760FencingBranch(), TBR = pl760ToiletBranch();
 const streamOf = s => /^Fencing/.test(s) ? 'fencing' : /^Toilets/.test(s) ? 'toilets' : /^Transport/.test(s) ? 'transport' : /^Labour/.test(s) ? 'labour' : 'expenses';
 const live = allAssets().filter(a => !a._cancelled && !a.rest_of);
 let ourRefs = new Set(); try { ourRefs = new Set(ourCosts().filter(x => x.kind === 'transport' && x.usable && x.amount != null && x.ref).map(x => x.ref)); } catch (e) {}
 const tBy = {}; let tNoBranch = 0;
 live.forEach(a => { if (ourRefs.has(a.key)) return; (a.events || []).forEach(e => { const tc = e.transport_cost; if (!tc || tc.internal || tc.amount == null) return; const b = (branchOf(a.key) || {}).code; if (b) tBy[b] = r2((tBy[b] || 0) + tc.amount); else tNoBranch = r2(tNoBranch + tc.amount); }); });
 try { ourCosts().filter(x => x.kind === 'transport' && x.usable && x.amount != null).forEach(x => { const b = (costBranchOf(x) || {}).code; if (b) tBy[b] = r2((tBy[b] || 0) + x.amount); else tNoBranch = r2(tNoBranch + x.amount); }); } catch (e) {}
 /* labour per piece by branch, on the P&L's own keys (install, steps, levelling, demob): what is ticked, and what is still to tick */
 const LAB_KEYS = new Set(['install', 'steps', 'levelling', 'demob']); const labBy = {};
 LP.slots.forEach(sl => { if (!LAB_KEYS.has(sl.key)) return; const g = labBy[sl.branch || 'no branch'] = labBy[sl.branch || 'no branch'] || {charged: 0, toCome: 0, unpriced: 0}; if (sl.value == null) { g.unpriced++; return; } if (sl.state === 'charged') g.charged = r2(g.charged + sl.value); else g.toCome = r2(g.toCome + sl.value); });
 const byWords = o => Object.entries(o).sort((x, y) => y[1] - x[1]).map(([b, v]) => `${b} ${money0(v)}`).join(' · ');
 const transportWords = (Object.keys(tBy).length || tNoBranch) ? 'the loads’ references are on ' + byWords(tBy) + (tNoBranch ? `${Object.keys(tBy).length ? ' · ' : ''}no branch ${money0(tNoBranch)}` : '') + ' (the cost to date, by reference)' : 'not recorded';
 const labourWords = Object.keys(labBy).length ? 'the labour per piece is charged on ' + byWords(Object.fromEntries(Object.entries(labBy).map(([b, g]) => [b, r2(g.charged + g.toCome)]))) : 'not recorded';
 const costs = X.rows.map(r => { const st = streamOf(r.stream), po = pos.filter(o => o.stream === st), rb = st === 'fencing' ? FBR : st === 'toilets' ? TBR : null;
 const needs = [];
 if (!po.length) needs.push(st === 'expenses' ? 'no purchase order — the tracker’s own lines' : 'no purchase order on the record');
 else { const un = po.filter(o => o.receipt.key !== 'full' && o.receipt.key !== 'part'); if (un.length) needs.push(`${fmtNum(un.length)} PO${un.length === 1 ? '' : 's'} not confirmed receipted`); }
 if (r.branch === 'the job') needs.push('branch not recorded — Finance need the branch the revenue is in');
 else if (rb && r.branch !== rb) needs.push(`costed to ${r.branch}, revenue in ${rb}`);
 return {stream: r.stream, kind: st, branch: r.branch, revenueWords: st === 'transport' ? (transportWords || '—') : st === 'labour' ? (labourWords || '—') : (rb || '—'), pos: po.map(o => o.number), toDate: r.toDate, toCome: r.toCome, job: r.job, basis: r.basis, needs, inPl: r.inPl !== false}; });
 const W = X.wages || {};
 if (W.allowanceForecast) costs.push({stream: 'Salary allowance — forecast', kind: 'labour', branch: 'the job', revenueWords: labourWords || '—', pos: [], toDate: 0, toCome: r2(W.allowanceForecast), job: r2(W.allowanceForecast), basis: 'Andrew’s living-away and uplift allowance for the whole job', needs: ['no purchase order — payroll, not a supplier', 'branch not recorded — Finance need the branch the revenue is in'], inPl: false});
 const costTotal = {toDate: r2(costs.reduce((s, r) => s + (r.toDate || 0), 0)), toCome: r2(costs.reduce((s, r) => s + (r.toCome || 0), 0)), job: r2(costs.reduce((s, r) => s + (r.job || 0), 0))};
 const costCheck = near(costTotal.job, r2((X.job || 0) + (W.job || 0)));
 /* 3. the demob, by branch - a cut of figures already in To job end, never added to it */
 const ev = eventWindow(), evEnd = ev ? ev.to : null, F = X.fencing || {weeks: [], notRolled: []};
 const demob = [];
 const decon = (F.weeks || []).filter(w => /demob|decon/i.test(String(w.prog || w.week || ''))), deconCost = r2(decon.reduce((s, w) => s + (w.cost || 0), 0));
 demob.push({stream: 'Sub-hire fencing — removal', branch: FBR, forecast: decon.length ? deconCost : null,
 basis: decon.length ? `${decon.map(w => w.prog || w.week).join(', ')} at the supplier’s rates` : (F.notRolled && F.notRolled.length ? `the deconstruction weeks (${F.notRolled.join(', ')}) in the programme file are not dated for 2026, so removal is not forecast` : 'no deconstruction week in the programme'),
 needs: decon.length ? [] : ['Andrew — the fencing contractor’s dated removal programme and rates']});
 const tdCard = {}, tdKnown = {}; let tdLoads = 0, tdRefsCard = 0, tdNoBasis = 0;
 live.forEach(a => { const ds = (a.events || []).filter(e => /demob/i.test(String(e.phase || '')) || /demob/i.test(String(e.sheet || ''))); if (!ds.length) return;
 const b = (branchOf(a.key) || {}).code || 'no branch'; let noFig = 0;
 ds.forEach(e => { const tc = e.transport_cost; if (tc && tc.internal) return; tdLoads++; if (tc && tc.amount != null) tdKnown[b] = r2((tdKnown[b] || 0) + tc.amount); else noFig++; });
 if (!noFig || ourRefs.has(a.key)) return;
 const T = assetTotal(a), cc = (T.lines || []).reduce((s, l) => s + ((l.transport_cost != null && l.qty != null) ? l.transport_cost * l.qty : 0), 0);
 if (cc) { tdCard[b] = r2((tdCard[b] || 0) + cc); tdRefsCard++; } else tdNoBasis += noFig; });
 [...new Set([...Object.keys(tdKnown), ...Object.keys(tdCard)])].sort().forEach(b => demob.push({stream: 'Transport — the demob loads', branch: b, forecast: r2((tdKnown[b] || 0) + (tdCard[b] || 0)),
 basis: [tdKnown[b] ? `carrier figures on the schedule ${money0(tdKnown[b])}` : '', tdCard[b] ? `the card’s transport cost, once a reference, ${money0(tdCard[b])}` : ''].filter(Boolean).join(' + '), needs: tdCard[b] ? ['Andrew — the carriers’ figures for the demob loads'] : []}));
 if (tdNoBasis) demob.push({stream: 'Transport — the demob loads', branch: 'no basis', forecast: null, basis: `${fmtNum(tdNoBasis)} demob load${tdNoBasis === 1 ? '' : 's'} with no carrier figure and no card line`, needs: ['Andrew — the carriers’ figures']});
 let ldCost = 0, ldHours = 0, ldUnp = 0, ldShifts = 0; const ldPeople = new Set();
 try { fin745Rows(today).forEach(r => { if (!evEnd || !r.date || r.date <= evEnd) return; ldShifts++; const cost = r.status === 'confirmed' && r.actualCost != null ? r.actualCost : r.calculatedCost; ldHours += Number(r.paid) || 0; if (cost == null) { ldUnp += Number(r.paid) || 0; ldPeople.add(r.person); } else ldCost += cost; }); } catch (e) {}
 demob.push({stream: 'Labour — wages after the race weekend (the running sheet)', branch: 'the job', forecast: r2(ldCost), basis: `${fmtNum(ldShifts)} shift${ldShifts === 1 ? '' : 's'}, ${fmtNum(r2(ldHours))} h paid after ${evEnd ? fmtDate(evEnd) : 'the event'}, at the rates on the record`,
 needs: [ldUnp ? `${fmtNum(r2(ldUnp))} h with no pay rate (${[...ldPeople].join(', ')})` : '', 'branch not recorded — Finance need the branch the revenue is in'].filter(Boolean)});
 const ldRev = {}; let ldRevUnp = 0; LP.slots.forEach(sl => { if (sl.key !== 'demob' || sl.state === 'charged') return; if (sl.value == null) { ldRevUnp++; return; } const b = sl.branch || 'no branch'; ldRev[b] = r2((ldRev[b] || 0) + sl.value); });
 const demobCharge = Object.entries(ldRev).sort((x, y) => y[1] - x[1]).map(([branch, amount]) => ({branch, amount}));
 const Q = ((DATA.rehire_quotes || {}).quotes || []), pickQ = Q.filter(q => q.pickup != null), pick = r2(pickQ.reduce((s, q) => s + (Number(q.pickup) || 0), 0));
 if (Q.length) demob.push({stream: 'Toilets — the supplier’s pickup', branch: TBR, forecast: pickQ.length ? pick : null, basis: pickQ.length ? `the quotes’ pickup charges (${pickQ.map(q => q.quote).join(', ')}) — inside the rehire cost the P&L already counts` : 'no pickup charge on the quotes', needs: ['the supplier’s PO and invoice']});
 const demobTotal = r2(demob.reduce((s, d) => s + (d.forecast || 0), 0)), demobUnforecast = demob.filter(d => d.forecast == null).length;
 /* 4. invoice by 31 Oct - revenue by branch, what the contract export says is billed, and what is not */
 const daysLeft = Math.round((Date.parse(FH866_DEADLINE + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000);
 const TK = pl760Ticks(), FB = pl760FencingByBranch(), svc = Number(c.servicing) || 0;
 const billedBy = {}; let supplied = null, billedLines = 0, contractLines = 0;
 try { (typeof ONHIRE_ROWS !== 'undefined' ? ONHIRE_ROWS : []).forEach(r => { const b = r.branch_code || 'no branch'; contractLines++; if (Number(r.billed_amount) > 0) billedLines++; billedBy[b] = r2((billedBy[b] || 0) + (Number(r.billed_amount) || 0)); }); supplied = typeof ONHIRE !== 'undefined' && ONHIRE ? ONHIRE.supplied_on || null : null; } catch (e) {}
 const inv = B.map(b => { const tk = TK.byBranch[b.code] || {install: {amount: 0}, cleaning: {amount: 0}, fire_ext: {amount: 0}, other: {amount: 0}};
 const off = r2((b.code === TBR ? svc : 0) + (FB[b.code] || 0)), onRecord = r2(b.total + off + tk.install.amount + tk.cleaning.amount + tk.fire_ext.amount + tk.other.amount);
 const lab = labBy[b.code] || {toCome: 0, unpriced: 0}, toCome = r2((b.code === FBR ? (X.revenue.fenceToCome || 0) : 0) + lab.toCome);
 return {branch: b.code, onRecord, toCome, job: r2(onRecord + toCome), billed: r2(billedBy[b.code] || 0), unbilled: r2(onRecord - (billedBy[b.code] || 0)), labourUnpriced: lab.unpriced, words: [b.code === FBR && X.revenue.fenceToCome ? 'the remaining fencing programme at the card' : '', lab.toCome ? 'labour per piece still to tick' : ''].filter(Boolean).join(' · ')}; });
 const scope = c.race && c.race.amount != null ? r2(c.race.amount) : 0;
 inv.push({branch: 'the job', onRecord: scope, toCome: r2(X.revenue.transportToCome || 0), job: r2(scope + (X.revenue.transportToCome || 0)), billed: 0, unbilled: scope, labourUnpriced: 0, words: 'the event labour scope and the provisional transport to come sit on no branch'});
 const sumOn = r2(inv.reduce((s, r) => s + r.onRecord, 0)), rest = r2((Number(c.total) || 0) - sumOn), restCome = r2((X.revenue.job || 0) - (Number(c.total) || 0) - inv.reduce((s, r) => s + r.toCome, 0));
 if (Math.abs(rest) >= 0.01 || Math.abs(restCome) >= 0.01) inv.push({branch: 'no branch', onRecord: rest, toCome: restCome, job: r2(rest + restCome), billed: 0, unbilled: rest, labourUnpriced: 0, words: 'on no branch — ticks on relocated or moved units, lines with no branch, and the cents between the labour forecast and its lines'});
 const invTotal = {onRecord: r2(inv.reduce((s, r) => s + r.onRecord, 0)), toCome: r2(inv.reduce((s, r) => s + r.toCome, 0)), job: r2(inv.reduce((s, r) => s + r.job, 0)), billed: r2(inv.reduce((s, r) => s + r.billed, 0)), unbilled: r2(inv.reduce((s, r) => s + r.unbilled, 0))};
 const invCheck = {record: near(invTotal.onRecord, Number(c.total) || 0), job: near(invTotal.job, X.revenue.job || 0)};
 return {asAt: today, pos, poSum, receiptedSum, notConfirmed, counts, noValue, costs, costTotal, costCheck, plJob: r2((X.job || 0) + (W.job || 0)), demob, demobTotal, demobUnforecast, demobCharge, demobChargeUnpriced: ldRevUnp,
 inv, invTotal, invCheck, revenueRecord: r2(Number(c.total) || 0), revenueJob: r2(X.revenue.job || 0), deadline: FH866_DEADLINE, daysLeft, billed: {lines: billedLines, of: contractLines, supplied}};
}
function fh866Html(){
 let H; try { H = fh866Model(); } catch (e) { return `<section id="handover866" class="fin745 nosfold"><p class="fin745-eyebrow">FINANCE HANDOVER</p><p>The handover could not be worked out from this record: ${esc(String(e && e.message || e))}</p></section>`; }
 const m = v => v == null ? '<span class="pl-todo">—</span>' : esc(money(v)), m0 = v => v == null ? '<span class="pl-todo">—</span>' : esc(money0(v));
 const opt = (list, cur, blank) => (blank ? `<option value=""${!cur ? ' selected' : ''}>${esc(blank)}</option>` : '') + list.map(([v, w]) => `<option value="${esc(v)}"${String(cur || '') === String(v) ? ' selected' : ''}>${esc(w)}</option>`).join('');
 const branches = fh866Branches().map(b => [b, b]);
 const badge = (k, w) => `<span class="fh866-b fh866-b-${esc(k)}">${esc(w)}</span>`;
 const needs = list => list.length ? `<ul class="fh866-needs">${list.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : '<span class="fh866-ok">nothing missing</span>';
 const poRow = o => `<tr data-fh866-row="${esc(o.number)}" class="${o.mismatch ? 'fh866-warn' : ''}">
 <td><b class="mono">${esc(o.number)}</b>${o._local && !o._src ? '<br><span class="chip act">added here</span>' : ''}<br><span class="w fh866-mute">${esc(o.supplier_name || '')}</span></td>
 <td><select data-fh866="stream" aria-label="what PO ${esc(o.number)} is for">${opt(FH866_STREAMS, o.stream)}</select>${o.period ? `<div class="w fh866-mute">${esc(o.period)}</div>` : ''}<input data-fh866="what" value="${esc(o.what || '')}" maxlength="80" placeholder="what for (optional)" aria-label="what PO ${esc(o.number)} covers"></td>
 <td><select data-fh866="branch" aria-label="branch PO ${esc(o.number)} is costed to">${opt(branches, o.costedBranch, '- pick -')}</select>${o.noBranch ? '<div class="w fh866-todo">no branch on the PO</div>' : ''}</td>
 <td><select data-fh866="revenue_branch" aria-label="branch the revenue for PO ${esc(o.number)} sits in">${opt(branches, o.revenue_branch ? normBranch(o.revenue_branch) : '', o.revenueBranch ? `${o.revenueBranch} — ${o.revenueWhy}` : '- pick -')}</select>${o.mismatch ? `<div class="w fh866-todo">costed to ${esc(o.costedBranch)}, revenue in ${esc(o.revenueBranch)}</div>` : ''}</td>
 <td class="num"><input data-fh866="amount" type="number" min="0" step="0.01" inputmode="decimal" value="${o.amount != null ? esc(o.amount) : ''}" placeholder="PO value" aria-label="value of PO ${esc(o.number)}"></td>
 <td><input data-fh866="invoice_no" value="${esc(o.invoice_no || '')}" placeholder="receipt ID no." inputmode="numeric" aria-label="receipt ID for PO ${esc(o.number)}"></td>
 <td><select data-fh866="receipted" aria-label="receipting of PO ${esc(o.number)}">${opt([['full', 'Receipted in full'], ['part', 'Part receipted'], ['none', 'Not receipted']], o.receipt.key === 'unknown' ? '' : o.receipt.key, 'Not confirmed')}</select><input data-fh866="receipted_amount" type="number" min="0" step="0.01" inputmode="decimal" value="${o.receipted_amount != null && o.receipted_amount !== '' ? esc(o.receipted_amount) : ''}" placeholder="part amount" aria-label="amount receipted on PO ${esc(o.number)}"${o.receipt.key === 'part' ? '' : ' hidden'}><div class="w">${badge(o.receipt.key, FH866_RECEIPT[o.receipt.key])}</div></td>
 <td><div class="acts"><button class="btn" data-fh866-save="${esc(o.number)}">Save</button></div></td></tr>`;
 const costRow = r => `<tr><td><b>${esc(r.stream)}</b><br><span class="w fh866-mute">${esc(r.basis || '')}</span></td><td>${esc(r.branch)}</td><td>${esc(r.revenueWords)}</td><td>${r.pos.length ? r.pos.map(n => `<span class="mono">${esc(n)}</span>`).join(', ') : '<span class="pl-todo">none</span>'}</td><td class="num">${m0(r.toDate)}</td><td class="num">${m0(r.toCome)}</td><td class="num"><b>${m0(r.job)}</b></td><td>${needs(r.needs)}</td></tr>`;
 const demobRow = d => `<tr><td><b>${esc(d.stream)}</b></td><td>${esc(d.branch)}</td><td class="num">${d.forecast == null ? '<span class="pl-todo">not forecast</span>' : `<b>${m0(d.forecast)}</b>`}</td><td class="fh866-why">${esc(d.basis)}</td><td>${needs(d.needs)}</td></tr>`;
 const invRow = r => `<tr><td><b>${esc(r.branch)}</b>${r.words ? `<br><span class="w fh866-mute">${esc(r.words)}</span>` : ''}</td><td class="num">${m0(r.onRecord)}</td><td class="num">${m0(r.toCome)}</td><td class="num"><b>${m0(r.job)}</b></td><td class="num">${r.billed ? m0(r.billed) : '<span class="pl-todo">—</span>'}</td><td class="num"><b>${m0(r.unbilled)}</b>${r.labourUnpriced ? `<br><span class="w fh866-todo">${esc(fmtNum(r.labourUnpriced))} labour line${r.labourUnpriced === 1 ? '' : 's'} not priced</span>` : ''}</td></tr>`;
 const due = H.daysLeft > 0 ? `${fmtNum(H.daysLeft)} day${H.daysLeft === 1 ? '' : 's'} to go` : H.daysLeft === 0 ? 'today' : `${fmtNum(-H.daysLeft)} day${H.daysLeft === -1 ? '' : 's'} past`;
 return `<section id="handover866" class="fin745 nosfold" aria-labelledby="fh866Title">
 <div class="fin745-heading"><div><p class="fin745-eyebrow">FINANCE HANDOVER · AS AT ${esc(fmtDate(H.asAt).toUpperCase())} · AUD EX GST</p><h2 id="fh866Title">What Finance need from us — by purchase order and by branch</h2>
 <p>After GC500 2025 Finance asked for five things: a cost reaches the P&amp;L only when its purchase order is receipted; every cost sent to them carries its PO number and the branch it is costed to; temp labour and transport are costed to the branch the revenue is in; the demob is forecast by branch so it can sit in October with the revenue; and the invoices are out by ${esc(fmtDate(H.deadline))}, or Finance are told what to accrue for which branch. This page answers each from the record. Every figure is a cut of one already on Costs &amp; P&amp;L; nothing here is added to the P&amp;L.</p></div>
 <div class="fin745-tools"><div><button type="button" class="btn ghost sm" data-fh866-act="copy">Copy for Finance</button><button type="button" class="btn ghost sm" data-fh866-act="csv">Export handover CSV</button></div></div></div>
 <div class="fin745-metrics fh866-metrics">
 ${fin745Card('Purchase orders receipted', `${fmtNum(H.counts.full + H.counts.part)} of ${fmtNum(H.pos.length)}`, `${fmtNum(H.counts.full)} in full · ${fmtNum(H.counts.part)} part · ${fmtNum(H.counts.none)} not receipted · ${fmtNum(H.counts.unknown)} not confirmed`)}
 ${fin745Card('PO value not confirmed receipted', money0(H.notConfirmed), `of ${money0(H.poSum)} typed on ${fmtNum(H.pos.length)} purchase order${H.pos.length === 1 ? '' : 's'}${H.noValue ? ` · ${fmtNum(H.noValue)} with no value typed yet` : ''} — cost that will not reach the P&L until it is receipted`)}
 ${fin745Card('Demob forecast, by branch', money0(H.demobTotal), H.demobUnforecast ? `${fmtNum(H.demobUnforecast)} line${H.demobUnforecast === 1 ? '' : 's'} not forecast yet — named below` : 'every demob line has a figure')}
 ${fin745Card(`Invoice by ${fmtDate(H.deadline)}`, due, `${money0(H.invTotal.unbilled)} on the record not yet billed per the contract export${H.billed.supplied ? ' of ' + fmtDate(H.billed.supplied) : ''} — what Finance accrue by branch if the invoices are not out`)}
 </div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>1. Purchase orders — receipted, and on which branch</h3><p>Every PO on the record. Type what it is for, the branch it is costed to, the branch the revenue sits in, its value, the receipt ID and whether it is receipted in Coates’ system. A PO costed to a branch the revenue is not in is marked. Add a purchase order for any supplier below; the fencing contractor’s orders also stay on Fencing costs &amp; dockets.</p></div></div>
 <div class="fin745-table fh866-table"><table><thead><tr><th>PO</th><th>For</th><th>Branch costed</th><th>Branch the revenue is in</th><th class="num">PO value</th><th>Receipt ID</th><th>Receipted in the system?</th><th></th></tr></thead><tbody>
 ${H.pos.length ? H.pos.map(poRow).join('') : '<tr><td colspan="8">No purchase order on the record yet.</td></tr>'}
 <tr class="acc761-tot"><td colspan="4">All purchase orders</td><td class="num"><b>${m0(H.poSum)}</b></td><td></td><td>${m0(H.receiptedSum)} confirmed receipted</td><td></td></tr>
 <tr class="fh866-add"><td><input id="fh866New" inputmode="numeric" placeholder="PO number" aria-label="new purchase order number" maxlength="12"><br><input data-fh866="supplier_name" value="" placeholder="supplier" aria-label="supplier for the new purchase order" maxlength="60"></td>
 <td><select data-fh866="stream" aria-label="what the new PO is for">${opt(FH866_STREAMS, 'other')}</select><input data-fh866="what" value="" maxlength="80" placeholder="what for (optional)" aria-label="what the new PO covers"></td>
 <td><select data-fh866="branch" aria-label="branch the new PO is costed to">${opt(branches, '', '- pick -')}</select></td><td><select data-fh866="revenue_branch" aria-label="branch the revenue sits in">${opt(branches, '', '- pick -')}</select></td>
 <td class="num"><input data-fh866="amount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="PO value" aria-label="value of the new PO"></td><td><input data-fh866="invoice_no" placeholder="receipt ID no." inputmode="numeric" aria-label="receipt ID for the new PO"></td>
 <td><select data-fh866="receipted" aria-label="receipting of the new PO">${opt([['full', 'Receipted in full'], ['part', 'Part receipted'], ['none', 'Not receipted']], '', 'Not confirmed')}</select><input data-fh866="receipted_amount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="part amount" aria-label="amount receipted on the new PO" hidden></td>
 <td><div class="acts"><button class="btn" data-fh866-add="1">Add PO</button></div></td></tr>
 </tbody></table></div></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>2. Every cost to Finance — with its PO and its branch</h3><p>The cost streams from <b>To job end</b>, each with the branch it is costed to, the branch the revenue sits in, the purchase orders recorded for it and what Finance still need before it can be sent. Cost to date is what the record knows; to come is the forecast; the two add to the P&amp;L’s costs to job end and the wages priced.</p></div></div>
 <div class="fin745-table fh866-table"><table><thead><tr><th>Cost stream</th><th>Branch costed</th><th>Branch the revenue is in</th><th>Purchase orders</th><th class="num">To date</th><th class="num">To come</th><th class="num">To job end</th><th>What Finance still need</th></tr></thead><tbody>
 ${H.costs.map(costRow).join('')}
 <tr class="acc761-tot"><td colspan="4">All direct costs and wages priced, to job end</td><td class="num"><b>${m0(H.costTotal.toDate)}</b></td><td class="num"><b>${m0(H.costTotal.toCome)}</b></td><td class="num"><b>${m0(H.costTotal.job)}</b></td><td>${H.costCheck ? '<span class="fh866-ok">= To job end’s costs + wages priced</span>' : `<span class="fh866-todo">does not match To job end (${esc(money0(H.plJob))})</span>`}</td></tr>
 </tbody></table></div></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>3. Demob — the forecast, by branch</h3><p>What the demob will cost us, cut by branch, so Finance can put it in October with the revenue. Each line is the demob share of a figure <b>To job end</b> already carries; it is not added to anything. Where the record cannot forecast a line it says so and names who supplies the figure.</p></div></div>
 <div class="fin745-table fh866-table"><table><thead><tr><th>Demob cost</th><th>Branch</th><th class="num">Forecast</th><th>How it is worked out</th><th>What is still needed</th></tr></thead><tbody>
 ${H.demob.map(demobRow).join('')}
 <tr class="acc761-tot"><td colspan="2">Demob cost forecast, every branch</td><td class="num"><b>${m0(H.demobTotal)}</b></td><td colspan="2">${H.demobUnforecast ? `${fmtNum(H.demobUnforecast)} line${H.demobUnforecast === 1 ? '' : 's'} not forecast` : 'every line forecast'}</td></tr>
 </tbody></table></div>
 <p class="fin745-basis">On the other side, the demob labour we <b>charge</b> per piece, still to tick: ${H.demobCharge.length ? H.demobCharge.map(d => `${esc(d.branch)} ${esc(money0(d.amount))}`).join(' · ') : 'nothing left to tick'}${H.demobChargeUnpriced ? ` · ${esc(fmtNum(H.demobChargeUnpriced))} demob line${H.demobChargeUnpriced === 1 ? '' : 's'} with no card rate` : ''}. Revenue, not cost; it is inside Revenue to job end.</p></div>
 <div class="fin745-block"><div class="fin745-blockhead"><div><h3>4. Invoice by ${esc(fmtDate(H.deadline))} — by branch, and what to accrue if not</h3><p>What each branch charges the V8s, on the record and to job end, against what the contract export says the branch has billed${H.billed.supplied ? ` (export of ${esc(fmtDate(H.billed.supplied))}: ${esc(fmtNum(H.billed.lines))} of ${esc(fmtNum(H.billed.of))} contract lines billed)` : ''}. <b>Not yet billed</b> is the figure Finance accrue for that branch if its invoices are not out by the deadline — a proposal, matched to the ledger by Finance before anything is booked. Who owns each branch’s invoicing is not on the record; Andrew to name them.</p></div></div>
 <div class="fin745-table fh866-table"><table><thead><tr><th>Branch</th><th class="num">Revenue on the record</th><th class="num">Still to come</th><th class="num">To job end</th><th class="num">Billed per the export</th><th class="num">Not yet billed</th></tr></thead><tbody>
 ${H.inv.map(invRow).join('')}
 <tr class="acc761-tot"><td>All branches and the job</td><td class="num"><b>${m0(H.invTotal.onRecord)}</b></td><td class="num"><b>${m0(H.invTotal.toCome)}</b></td><td class="num"><b>${m0(H.invTotal.job)}</b></td><td class="num"><b>${m0(H.invTotal.billed)}</b></td><td class="num"><b>${m0(H.invTotal.unbilled)}</b></td></tr>
 </tbody></table></div>
 <p class="fin745-basis">${H.invCheck.record && H.invCheck.job ? 'The branches add to the P&amp;L’s Revenue on the record and to job end, to the cent.' : `<span class="fh866-todo">The branches do not add to the P&amp;L (record ${esc(money(H.revenueRecord))}, job end ${esc(money(H.revenueJob))}) — read the figures with care.</span>`} Getting the admin right first — the PO receipted, the branch on every cost, the invoice out — is what keeps the accrual small.</p></div>
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
 const rows = [['Author: Andrew Fisher'], [`${DATA.event.name} — Finance handover — by purchase order and by branch — proposals for Finance, nothing posted`], ['As at', H.asAt], ['Invoice by', H.deadline], [],
 ['1. Purchase orders', 'PO', 'Supplier', 'For', 'What', 'Branch costed', 'Branch the revenue is in', 'PO value AUD ex GST', 'Receipt ID', 'Receipted in the system', 'Amount receipted', 'Flag']];
 H.pos.forEach(o => rows.push(['Purchase order', o.number, o.supplier_name || '', fh866StreamName(o.stream), o.what || o.period || '', o.costedBranch || '', o.revenueBranch || '', o.amount, o.invoice_no || '', FH866_RECEIPT[o.receipt.key], o.receipt.amount, o.mismatch ? `costed to ${o.costedBranch}, revenue in ${o.revenueBranch}` : o.noBranch ? 'no branch' : '']));
 rows.push(['Purchase orders total', '', '', '', '', '', '', H.poSum, '', 'confirmed receipted', H.receiptedSum, `${H.notConfirmed} not confirmed receipted`], []);
 rows.push(['2. Costs to Finance', 'Cost stream', 'Branch costed', 'Branch the revenue is in', 'Purchase orders', 'To date AUD', 'To come AUD', 'To job end AUD', 'What Finance still need', 'How it is worked out']);
 H.costs.forEach(r => rows.push(['Cost', r.stream, r.branch, r.revenueWords, r.pos.join(' '), r.toDate, r.toCome, r.job, r.needs.join('; '), r.basis]));
 rows.push(['Costs total', '', '', '', '', H.costTotal.toDate, H.costTotal.toCome, H.costTotal.job, H.costCheck ? 'equals To job end + wages priced' : 'does not match To job end'], []);
 rows.push(['3. Demob by branch', 'Demob cost', 'Branch', 'Forecast AUD', 'How it is worked out', 'What is still needed']);
 H.demob.forEach(d => rows.push(['Demob', d.stream, d.branch, d.forecast, d.basis, d.needs.join('; ')]));
 rows.push(['Demob total', '', '', H.demobTotal, `${H.demobUnforecast} lines not forecast`], []);
 rows.push(['Demob labour we charge, still to tick', 'Branch', 'AUD']); H.demobCharge.forEach(d => rows.push(['Demob charge', d.branch, d.amount])); rows.push([]);
 rows.push([`4. Invoice by ${H.deadline}`, 'Branch', 'Revenue on the record AUD', 'Still to come AUD', 'To job end AUD', 'Billed per the contract export AUD', 'Not yet billed AUD (accrue if not invoiced)', 'Note']);
 H.inv.forEach(r => rows.push(['Invoice', r.branch, r.onRecord, r.toCome, r.job, r.billed, r.unbilled, r.words || '']));
 rows.push(['Invoice total', '', H.invTotal.onRecord, H.invTotal.toCome, H.invTotal.job, H.invTotal.billed, H.invTotal.unbilled, H.invCheck.record && H.invCheck.job ? 'adds to the P&L' : 'does not add to the P&L']);
 return rows.map(r => r.map(v => fin745CsvCell(v == null ? '' : v)).join(',')).join('\r\n');
}
function fh866Text(H){
 const L = [];
 L.push(`${DATA.event.name} — Finance handover, as at ${fmtDate(H.asAt)} (AUD ex GST). Proposals for Finance; nothing is posted from here.`);
 L.push(''); L.push(`1. Purchase orders: ${H.counts.full + H.counts.part} of ${H.pos.length} receipted (${H.counts.full} in full, ${H.counts.part} part, ${H.counts.none} not, ${H.counts.unknown} not confirmed). ${money(H.notConfirmed)} of ${money(H.poSum)} not confirmed receipted.`);
 H.pos.forEach(o => L.push(`  PO ${o.number} — ${o.supplier_name || 'supplier not named'} — ${fh866StreamName(o.stream)} — costed to ${o.costedBranch || 'no branch'}, revenue in ${o.revenueBranch || 'not recorded'} — ${o.amount != null ? money(o.amount) : 'no value'} — receipt ID ${o.invoice_no || 'none'} — ${o.receipt.words}${o.mismatch ? ' — BRANCH DIFFERS' : ''}`));
 L.push(''); L.push(`2. Costs to Finance, to job end ${money(H.costTotal.job)} (${money(H.costTotal.toDate)} to date):`);
 H.costs.forEach(r => L.push(`  ${r.stream} — costed to ${r.branch}; revenue in ${r.revenueWords} — PO ${r.pos.join(', ') || 'none'} — ${money(r.job)} to job end${r.needs.length ? ' — still need: ' + r.needs.join('; ') : ''}`));
 L.push(''); L.push(`3. Demob forecast by branch, ${money(H.demobTotal)}${H.demobUnforecast ? ` (${H.demobUnforecast} lines not forecast)` : ''}:`);
 H.demob.forEach(d => L.push(`  ${d.stream} — ${d.branch} — ${d.forecast == null ? 'not forecast' : money(d.forecast)} — ${d.basis}${d.needs.length ? ' — still need: ' + d.needs.join('; ') : ''}`));
 L.push(''); L.push(`4. Invoice by ${fmtDate(H.deadline)} (${H.daysLeft} days): not yet billed per the contract export ${money(H.invTotal.unbilled)} — what Finance accrue by branch if the invoices are not out:`);
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
