// Author: Andrew Fisher. The Map explorer's own-window snapshot of the master plan: gc500PlanItems() from the dashboard
// page (the v8.93 build: the 2 Oct pins, the three inset pins back on their 17 Sep positions), read over the live record
// with GET only, as v6.96's plansnap did.
//   PAGE=<built page> OUTF=<plan_items.json> node plansnap893.cjs
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page'); const fs = require('fs');
(async () => { const s = await open({pageFile: process.env.PAGE}); const p = s.page;
  await p.waitForFunction(() => typeof gc500PlanItems === 'function' && typeof DATA === 'object', null, {timeout: 120000}); await p.waitForTimeout(8000);
  const snap = await p.evaluate(() => Object.assign(gc500PlanItems(), {taken: new Date().toISOString(), note: 'Snapshot of the master plan, for Plan on satellite opened in its own window. Opened from the dashboard it reads the live record instead.'}));
  fs.writeFileSync(process.env.OUTF, JSON.stringify(snap));
  const find = k => (snap.items || []).find(i => i.key === k);
  console.log('trades', snap.trades.map(t => t.name + ' ' + t.count).join(' | '), '· items', snap.items.length, '· unplaced', (snap.unplaced || []).length, '· layers', snap.layers.length, '· errors', s.errors.length, '· blocked', s.counts.blocked);
  for (const k of ['P45', 'WC10', 'WC32', 'WC51', 'WC38', 'WC39', 'WC69', 'WC40', 'CP1', 'WC81', 'T0265']) { const it = find(k); console.log(k, it ? JSON.stringify(it.pt) + ' ' + (it.sec || '') : 'not placed'); }
  await s.browser.close(); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
