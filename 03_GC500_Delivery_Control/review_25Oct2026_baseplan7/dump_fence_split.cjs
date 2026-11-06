// Author: Andrew Fisher. 25 Oct 2026 - the fencing cost as the page carries it: its paid split (gear, docket labour, labour
// notes), the receipted orders' rule (fenceOrders1159) and the extras on Advanced's purchase orders. Read only (the harness
// aborts every write).
//   PAGE=<live page file> OUT=<private json> node dump_fence_split.cjs
'use strict';
const fs = require('fs');
const {open} = require('../toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#fencing', W: 1440, H: 1000});
  const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
    await p.waitForTimeout(2500);
    const out = await p.evaluate(() => {
      const flat = o => { const r = {}; for (const k of Object.keys(o || {})) { const v = o[k]; if (v == null || ['number', 'string', 'boolean'].includes(typeof v)) r[k] = v; } return r; };
      const res = {};
      try { res.split = flat(fencePaidSplit()); } catch (e) { res.split = String(e).slice(0, 150); }
      try { const O = fenceOrders1159(); res.orders = {adjustment: O.adjustment, words: O.words, orders: O.orders}; } catch (e) { res.orders = String(e).slice(0, 150); }
      try { const M = moneySummary(); res.money = flat(M); res.moneyKeys = Object.keys(M); } catch (e) { res.money = String(e).slice(0, 150); }
      try { res.extras = supplierExtras1014().map(x => ({po: x.po, date: x.date, column: x.column, name: x.name, unit: x.unit, qty: x.qty, rate: x.rate, paid: x.paid, cents: x.cents, kind: x.kind, id: x.id})); } catch (e) { res.extras = String(e).slice(0, 150); }
      return res;
    });
    fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
    console.log('ok errors', s.errors.length, 'blocked', s.counts.blocked);
  } catch (e) { console.log('ERR', String(e).slice(0, 400)); }
  await s.browser.close();
})();
