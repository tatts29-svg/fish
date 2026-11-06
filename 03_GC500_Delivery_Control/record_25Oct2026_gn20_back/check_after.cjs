// Author: Andrew Fisher. 25 Oct 2026 - read back GN20-A and EQ0006 on a fresh load of the live page (read only: the
// harness serves the page file and aborts every write): Today's groups, their rows, the quantity scopes.
//   PAGE=<live page file> node check_after.cjs
'use strict';
const {open} = require('../toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#plant', W: 1280, H: 900});
  const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
    await p.waitForTimeout(2500);
    const out = await p.evaluate(() => {
      const day = todayIso(), sum = todayWorkSummary848(day), groups = {};
      for (const id in sum.byId) if (id !== 'fencing') groups[id] = sum.byId[id].done + '/' + sum.byId[id].total;
      const rows = []; for (const area of todayWorkMetrics840(day)) for (const r of (area.rows || [])) if (['GN20-A', 'EQ0006'].includes(r.key)) rows.push(area.id + ' ' + r.key + ': ' + r.status);
      const sc = ['GN20-A', 'EQ0006'].map(k => { const a = assetOf(k); if (!a) return k + ': not on the page'; const r = Scope1017.record(a); const d = deliveryOf(k); return k + ': ' + (r ? r.items.map(i => (Scope1017.read(a, i.item, d, day) || {}).status).join(', ') : 'no scope') + ' · light ' + d.state + ', complete ' + !!d.done + ' · numbers ' + JSON.stringify(assetNumbersOf(a)) + ' · drawing ' + JSON.stringify((a.drawing_links || []).map(x => x.sheet + ' ' + x.label)); });
      return {version: SYNC.version, groups, rows, sc};
    });
    console.log(JSON.stringify(out, null, 1), 'errors', s.errors.length, 'blocked', s.counts.blocked);
  } catch (e) { console.log('ERR', String(e).slice(0, 300)); }
  await s.browser.close();
})();
