// v7.86 - a Fence blocks line. Author: Andrew Fisher. Read-only: GETs only, writes aborted by the harness; synthetic dockets live in this browser only.
//   PAGE=<built page> BASE=<live page> [MOB=1] [OUT=<json>] node fence_blocks_tests.js
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs');
const ready = p => p.waitForFunction(() => typeof allDockets === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
const totals = p => p.evaluate(() => { try { RENDER_MEMO.clear(); } catch (e) {} return allDockets().map(d => [d.id, d.docket_no, d.cost_total, d.paid_total]); });
(async () => {
  const MOB = !!process.env.MOB, view = MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 1000};
  const T = [], ok = (name, pass, detail) => T.push({name, pass: !!pass, detail: String(detail)});
  const b = await open(Object.assign({pageFile: process.env.BASE}, view)); await ready(b.page); const before = await totals(b.page); await b.browser.close();
  const s = await open(Object.assign({pageFile: process.env.PAGE}, view)), p = s.page; await ready(p);
  const after = await totals(p);
  const R = await p.evaluate(() => {
    const c = FCOL.find(x => x.key === 'fence_blocks'), r = fenceRateFor('fence_blocks'), pr = fenceCostFor('fence_blocks');
    const form = paperCols().map(x => x.key);
    const d = {id: 'F-TEST-36566', date: '2026-09-30', week: (weekOf('2026-09-30') || {}).sheet || null, docket_no: '36566', crew: 'Advanced Temporary Fencing', location: 'Rear of pit building / rear of Puppet Theatre', quantities: {fence_blocks: 216}, components: {base: 216, clamp: 216, brace: 108}, note: 'synthetic', recorded_by: 'Test Person', recorded_on: '2026-10-02'};
    const cd = costDocket(d);
    const keep = S.fenceDockets; S.fenceDockets = (keep || []).concat([d]); try { RENDER_MEMO.clear(); } catch (e) {}
    let rendered = null, rateRow = false, err = null;
    try { location.hash = '#fencing'; render(); const root = document.body.textContent; rendered = /Fence blocks/.test(root); rateRow = /Fence Blocks\( per block\)|Fence blocks/.test(root); } catch (e) { err = String(e.message || e); }
    const inAll = allDockets().find(x => x.id === 'F-TEST-36566');
    S.fenceDockets = keep; try { RENDER_MEMO.clear(); render(); } catch (e) {}
    let qs = []; try { qs = (questionsList_751() || []).map(q => JSON.stringify(q)).filter(q => /fence.?blocks/i.test(q)); } catch (e) { qs = ['questions not readable: ' + e.message]; }
    return {col: c && {unit: c.unit, card_line: c.card_line, rate: c.rate}, rate: {value: r.value, source: r.source}, paid: {value: pr.value, source: pr.source}, form: form.includes('fence_blocks'),
      cost: cd.cost_total, paidTotal: cd.paid_total, paidUnpriced: cd.paid_unpriced, lines: cd.lines.map(l => [l.column, l.qty, l.rate, l.cost]), inAll: inAll && {cost: inAll.cost_total, usable: inAll.usable, problems: inAll.problems}, rendered, rateRow, err, qs};
  });
  ok('B1 a Fence blocks line at the 2026 card\'s $3.02 a block, counted each', R.col && R.col.unit === 'each' && R.col.card_line === 'Fence Blocks( per block)' && R.rate.value === 3.02 && R.rate.source === 'card', JSON.stringify({col: R.col, rate: R.rate}));
  ok('B2 36566 as used - 216 blocks - is charged $652.32', R.cost === 652.32 && R.lines.length === 1, JSON.stringify({cost: R.cost, lines: R.lines}));
  ok('B3 what Advanced bill for blocks is not known and is not estimated (paid side left for their invoice)', R.paid.value == null && R.paidTotal === 0 && (R.paidUnpriced || []).includes('fence_blocks'), JSON.stringify({paid: R.paid, paidTotal: R.paidTotal, paidUnpriced: R.paidUnpriced}));
  ok('B4 the record-a-paper form offers the Fence blocks line', R.form, String(R.form));
  ok('B5 the docket counts on the Fencing tab as usable, and the tab draws with the line on it', R.inAll && R.inAll.cost === 652.32 && R.inAll.usable && R.rendered && !R.err, JSON.stringify({inAll: R.inAll, rendered: R.rendered, err: R.err}));
  const moved = before.filter(x => { const y = after.find(z => z[0] === x[0]); return !y || y[2] !== x[2] || y[3] !== x[3]; });
  ok('B6 no existing docket\'s charge or paid figure moves (' + before.length + ' dockets)', before.length > 50 && after.length === before.length && !moved.length, JSON.stringify(moved.slice(0, 8)));
  ok('B7 the settled line is not raised as an open rate question', !R.qs.length, JSON.stringify(R.qs));
  ok('E1 no page errors', !s.errors.length, JSON.stringify(s.errors).slice(0, 200));
  const passed = T.filter(t => t.pass).length;
  T.forEach(t => console.log((t.pass ? 'PASS ' : 'FAIL ') + t.name + ' — ' + t.detail.slice(0, 400)));
  console.log(passed + '/' + T.length + ' ' + (MOB ? 'phone' : 'desktop'));
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({page: process.env.PAGE, passed, of: T.length, tests: T}, null, 1));
  await s.browser.close(); process.exit(passed === T.length ? 0 : 1);
})();
