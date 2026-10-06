// Author: Andrew Fisher. v8.71 checks - the 6 Oct Baseplan export and Schedule 4 on the page. Read-only (open_page aborts every write).
//   PAGE=build/GC500_v8.71/GC500_Delivery_Control_hosted.html [MOB=1] node v8.71_baseplan_schedule4_DRAFT/tests/test_v871.cjs
const {open} = require('../../toolchain/harness/open_page');
(async () => { const MOB = !!process.env.MOB, R = []; const ok = (name, pass, detail) => R.push({name, pass: !!pass, detail});
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000}); await p.waitForTimeout(2500);
  await p.evaluate(() => go('costs')); await p.waitForFunction(() => { try { return moneySummary().charge.labour >= 0; } catch (e) { return false; } }, null, {timeout: 30000}); await p.waitForTimeout(1200);
  const X = await p.evaluate(() => holdAssets(() => { const row = k => ONHIRE_ROWS.find(r => r.rental_contract + '/' + r.line === k) || null; const A = k => allAssets().find(a => a.key === k) || {};
    const M = moneySummary(), C = cj764Model(), H = fh866Model();
    const fence = (DATA.plant_lines.fencing_rows_not_plant || []).map(r => r.date + ' ' + r.transport_cost_text);
    return {on: ONHIRE.supplied_on, lines: ONHIRE_ROWS.length, contracts: ONHIRE.contracts.length, mead: ONHIRE.contracts.some(c => String(c.rental_contract) === '9987005' && c.branch_code === 'MEAD'),
      gone: [row('9961265/10'), row('9961976/40')], vmsSub: ONHIRE_ROWS.filter(r => r.kind === 'vms' && r.subhired).length,
      vms13: row('9961265/13'), gn7: row('9961976/7'), gn16: row('9961976/16'), clean: ONHIRE_ROWS.filter(r => /^CLEAN/i.test(r.item || '')).map(r => [r.charge_line, r.kind]),
      zero: ONHIRE_ROWS.filter(r => r.rate_1 === 0).length, deliveredNoStart: ONHIRE_ROWS.filter(r => r.delivered && !r.start_date).length,
      gn19: A('GN19').asset_numbers, gn13: A('GN13').asset_numbers, gn18: A('GN18').asset_numbers,
      p08: (A('P08').events || []).find(e => e.sheet === 'Week 2'), wc60: (A('WC60').events || []).find(e => e.sheet === 'Week 3'),
      fence, schedT: M.cost.transport.schedule, charge: M.charge, rev: C.revenue, costCheck: H.costCheck, invCheck: H.invCheck, peopleCheck: H.peopleCheck}; }));
  ok('the contracts are the 6 Oct export: 321 lines on 11 contracts, the new MEAD contract 9987005 among them', X.on === '2026-10-06' && X.lines === 321 && X.contracts === 11 && X.mead, {on: X.on, lines: X.lines, contracts: X.contracts});
  ok('the two lines the export no longer has are off the page', X.gone.every(x => x === null));
  ok('the VMS boards on SUB items are subhired (Rehire), with their supplier', X.vmsSub >= 13 && X.vms13 && X.vms13.subhired && X.vms13.sales_analysis_code === 'KINP-SUB', {vmsSub: X.vmsSub});
  ok('generator lines follow their numbers: line 7 (1276416) is GN19, line 16 (1276507) is GN01', X.gn7.match.key === 'GN19' && X.gn16.match.key === 'GN01' && X.gn16.delivered && X.gn16.start_date === '2026-09-28');
  ok('the register carries Schedule 4\'s generator numbers', String(X.gn19) === '1276416' && String(X.gn13) === '1261271' && String(X.gn18) === '1261273', {gn19: X.gn19, gn13: X.gn13, gn18: X.gn18});
  ok('a cleaning fee is a contract charge, never transport coverage', X.clean.length === 2 && X.clean.every(([c, k]) => !c && k === 'accessory'), X.clean);
  ok('no rate of 0 (a 0 is no rate) and every delivered line is on hire from a date', X.zero === 0 && X.deliveredNoStart === 0, {zero: X.zero, dns: X.deliveredNoStart});
  ok('Schedule 4 transport on the loads: P08 $290+ on docket 26106201; WC60 $290+ + $580+', X.p08 && X.p08.transport_cost && X.p08.transport_cost.amount === 290 && X.p08.dd === '26106201' && X.wc60 && X.wc60.transport_cost.amount === 870, {p08: X.p08 && X.p08.transport_cost, wc60: X.wc60 && X.wc60.transport_cost});
  ok('the four new fencing semi loads are counted with the other semis', ['2026-09-30 $1152.62+', '2026-10-01 $1152.62+', '2026-10-02 $576.31+', '2026-10-06 $576.31+'].every(f => X.fence.includes(f)) && X.schedT.fencing.rows === 11, {fencing: X.schedT.fencing});
  ok('Finance handover still reconciles (costs, invoice, people)', X.costCheck && X.invCheck.record && X.invCheck.job && X.peopleCheck);
  ok('no page errors', s.errors.length === 0, s.errors.slice(0, 3));
  ok('no writes attempted', s.counts.blocked === 0, s.counts);
  await s.browser.close();
  R.forEach(r => console.log((r.pass ? 'PASS  ' : 'FAIL  ') + r.name + (r.pass ? '' : '  ' + JSON.stringify(r.detail))));
  console.log(`${MOB ? 'phone' : 'desktop'}: ${R.filter(r => r.pass).length}/${R.length} pass`); process.exit(R.every(r => r.pass) ? 0 : 1);
})().catch(e => { console.error('TEST FAIL', e); process.exit(1); });
