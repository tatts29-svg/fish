// Author: Andrew Fisher. v8.66 Finance handover checks, read-only against the live record (every write is aborted by open_page).
//   PAGE=build/GC500_v8.66/GC500_Delivery_Control_hosted.html [MOB=1] node v8.66_finance_handover_DRAFT/tests/test_handover866.cjs
const {open} = require('../../toolchain/harness/open_page');
(async () => { const MOB = !!process.env.MOB, R = []; const ok = (name, pass, detail) => R.push({name, pass: !!pass, detail});
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000}); await p.waitForTimeout(2500);
  await p.evaluate(() => go('costs')); await p.waitForFunction(() => { try { return moneySummary().charge.labour >= 0; } catch (e) { return false; } }, null, {timeout: 30000}); await p.waitForTimeout(1500);
  const nav = await p.evaluate(() => [...document.querySelectorAll('#pane-costs [data-finance857]')].map(b => b.textContent.trim()));
  ok('Costs & P&L has five buttons, Finance handover once', nav.length === 5 && nav.filter(t => t === 'Finance handover').length === 1, nav);
  await p.evaluate(() => { const b = document.querySelector('[data-finance857="handover"]'); if (b) b.click(); }); await p.waitForTimeout(1500);
  const near = (a, b, eps = 0.005) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < eps;
  const M = await p.evaluate(() => holdAssets(() => { const r2 = v => Math.round((v + Number.EPSILON) * 100) / 100;
    const H = fh866Model(), X = cj764Model(), LP = labourPlan(), money = moneySummary(), pos = poAll(); const sec = document.getElementById('handover866');
    const demobSlots = r2(LP.slots.filter(sl => sl.key === 'demob' && sl.state !== 'charged' && sl.value != null).reduce((s, sl) => s + sl.value, 0));
    const rows = sec ? [...sec.querySelectorAll('tr[data-fh866-row]')].map(tr => tr.dataset.fh866Row) : [];
    const statusWords = sec ? [...sec.querySelectorAll('tr[data-fh866-row] .fh866-b')].map(b => b.textContent.trim()) : [];
    const today = todayIso(); const days = Math.round((Date.parse('2026-10-31T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000);
    const txt = sec ? sec.innerText : '';
    return {present: !!sec, head: (document.querySelector('#finance857-section .panehead') || {}).textContent || '', poN: pos.length, rows, statusWords, poSum: H.poSum, poSumModel: r2(pos.reduce((s, o) => s + (Number(o.amount) || 0), 0)),
      costJob: H.costTotal.job, plJob: r2((X.job || 0) + (X.wages.job || 0)), costCheck: H.costCheck, theJobRows: H.costs.filter(r => r.branch === 'the job').map(r => r.needs.some(n => /branch not recorded/.test(n))),
      fencingRow: H.costs.find(r => r.kind === 'fencing'), demobCharge: r2(H.demobCharge.reduce((s, d) => s + d.amount, 0)), demobSlots, demobRows: H.demob.length, demobTotal: H.demobTotal, demobSum: r2(H.demob.reduce((s, d) => s + (d.forecast || 0), 0)),
      invOn: H.invTotal.onRecord, revRecord: money.charge.total, invJob: H.invTotal.job, revJob: X.revenue.job, invCheck: H.invCheck, days, daysModel: H.daysLeft,
      hasDeadline: /Invoice by Sat 31 Oct 2026/.test(txt), notYetBilled: H.invTotal.unbilled, csv: fh866Csv(H).split('\r\n'), text: fh866Text(H), txt: txt.slice(0, 20000),
      fencingPos: pos.filter(poFencing866).length}; }));
  ok('Finance handover mounts, with its own heading', M.present && /^Finance handover — /.test(M.head), {head: M.head});
  ok('one row per purchase order on the record', M.rows.length === M.poN && M.rows.length > 0, {rows: M.rows.length, poN: M.poN});
  ok('every PO row says whether it is receipted', M.statusWords.length === M.poN && M.statusWords.every(w => /^(Receipted in full|Part receipted|Not receipted|Receipting not confirmed)$/.test(w)), M.statusWords.slice(0, 4));
  ok('PO values add to the record’s purchase orders', near(M.poSum, M.poSumModel), {poSum: M.poSum, model: M.poSumModel});
  ok('fencing cost stream carries every fencing PO and the fencing branch', !!M.fencingRow && M.fencingRow.pos.length === M.fencingPos && M.fencingRow.branch === M.fencingRow.revenueWords, M.fencingRow && {pos: M.fencingRow.pos.length, branch: M.fencingRow.branch, rev: M.fencingRow.revenueWords});
  ok('costs to Finance add to To job end’s costs + wages priced, to the cent', near(M.costJob, M.plJob) && M.costCheck, {costJob: M.costJob, plJob: M.plJob});
  ok('every cost on "the job" is flagged: branch not recorded', M.theJobRows.length > 0 && M.theJobRows.every(Boolean), {rows: M.theJobRows.length});
  ok('demob labour we charge, by branch, equals the labour plan’s demob slots still to tick', near(M.demobCharge, M.demobSlots), {byBranch: M.demobCharge, slots: M.demobSlots});
  ok('demob forecast total is the sum of its rows', near(M.demobTotal, M.demobSum) && M.demobRows >= 4, {rows: M.demobRows, total: M.demobTotal});
  ok('invoice block: branches add to Revenue on the record', near(M.invOn, M.revRecord) && M.invCheck.record, {invOn: M.invOn, revRecord: M.revRecord});
  ok('invoice block: branches add to Revenue to job end', near(M.invJob, M.revJob) && M.invCheck.job, {invJob: M.invJob, revJob: M.revJob});
  ok('invoice block: the 31 Oct deadline and the days to it', M.hasDeadline && M.daysModel === M.days, {days: M.daysModel});
  const csvCell = l => l.replace(/^"/, '').replace(/"(,|$).*$/s, '');
  ok('CSV carries the four sections and the author', csvCell(M.csv[0]) === 'Author: Andrew Fisher' && ['1. Purchase orders', '2. Costs to Finance', '3. Demob by branch', '4. Invoice by 2026-10-31'].every(h => M.csv.some(l => csvCell(l) === h)), {lines: M.csv.length, first: M.csv[0]});
  ok('Copy text opens with the handover and closes with the author', /Finance handover, as at/.test(M.text) && /Author: Andrew Fisher$/.test(M.text.trim()), {});
  ok('no person’s phone number or email on the page', !/\b0[45]\d{2}[ -]?\d{3}[ -]?\d{3}\b/.test(M.txt) && !/@/.test(M.txt), {});
  /* a non-fencing purchase order added in memory (no save) stays out of the fencing card, the fencing trace and the fencing accrual, and shows here */
  const N = await p.evaluate(() => holdAssets(() => { S.purchaseOrders = S.purchaseOrders || {}; S.purchaseOrders['9999001'] = {number: '9999001', stream: 'transport', supplier_name: 'Test carrier', branch: 'NOIS', revenue_branch: 'KINP', amount: 1234.5, receipted: 'part', receipted_amount: 1000, by: 'test', at: '2026-10-06T00:00:00Z'};
    try { RENDER_MEMO.clear(); } catch (e) {}
    const all = poAll(), here = all.find(o => o.number === '9999001'), fencing = all.filter(poFencing866).map(o => o.number);
    const H = fh866Model(), row = H.pos.find(o => o.number === '9999001'); const card = typeof poCard === 'function' ? poCard([]) : ''; const A = acc761Model('2026-10');
    const out = {inAll: !!here, inFencing: fencing.includes('9999001'), inCard: /9999001/.test(card), inAccrual: (A.invoiceRecords || []).some(r => r.number === '9999001'), row: row && {stream: row.stream, costed: row.costedBranch, rev: row.revenueBranch, mismatch: row.mismatch, receipt: row.receipt.words}, transportPos: (H.costs.find(r => r.kind === 'transport') || {}).pos};
    delete S.purchaseOrders['9999001']; try { RENDER_MEMO.clear(); } catch (e) {} return out; }));
  ok('a non-fencing PO is listed here with its branches, and flagged when costed to a branch the revenue is not in', N.inAll && N.row && N.row.stream === 'transport' && N.row.costed === 'NOIS' && N.row.rev === 'KINP' && N.row.mismatch && /Part receipted — \$1,000\.00 of \$1,234\.50/.test(N.row.receipt) && (N.transportPos || []).includes('9999001'), N);
  ok('a non-fencing PO stays out of the fencing PO card and the fencing accrual', !N.inFencing && !N.inCard && !N.inAccrual, N);
  /* a view-only link cannot save: the button says so and nothing is sent */
  const before = s.counts.blocked;
  const V = await p.evaluate(() => { const b = document.querySelector('#handover866 [data-fh866-save]'); if (!b) return {none: true}; const was = JSON.stringify(S.purchaseOrders || {}); b.click(); return {same: JSON.stringify(S.purchaseOrders || {}) === was, flash: (document.querySelector('.flash, #flash, [role="status"]') || {}).textContent || ''}; });
  await p.waitForTimeout(600);
  ok('Save on a view-only link changes nothing and sends nothing', !V.none && V.same && s.counts.blocked === before, Object.assign({blockedBefore: before, blockedAfter: s.counts.blocked}, V));
  /* back to the summary, untouched */
  await p.evaluate(() => { const b = document.querySelector('[data-finance857="summary"]'); if (b) b.click(); }); await p.waitForTimeout(1200);
  const back = await p.evaluate(() => ({glance: !!document.getElementById('costs765'), labour: !!document.getElementById('labour865'), handover: !!document.getElementById('handover866')}));
  ok('P&L summary comes back whole, the handover put away', back.glance && back.labour && !back.handover, back);
  ok('no page errors', s.errors.length === 0, s.errors.slice(0, 4));
  ok('no writes attempted', s.counts.blocked === 0, s.counts);
  R.forEach(r => console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : '  ' + JSON.stringify(r.detail).slice(0, 600)}`));
  const fails = R.filter(r => !r.pass).length; console.log(`${MOB ? 'phone' : 'desktop'}: ${R.length - fails}/${R.length} pass`); await s.browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('TEST FAIL', e); process.exit(2); });
