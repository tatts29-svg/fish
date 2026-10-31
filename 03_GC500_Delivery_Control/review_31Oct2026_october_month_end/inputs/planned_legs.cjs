// Author: Andrew Fisher. Read-only: the transport legs still to come (planned) with their dates and the cost the page forecasts for each.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    const r = await p.evaluate(() => holdAssets(() => {
      const T = transport888Core();
      const pl = (T.planned || []).map(x => ({id: x.id, src: x.src, key: x.key, date: x.date, leg: x.leg, movement: x.movement, item: x.item, qty: x.qty, branch: x.branch, inPl: x.inPl, counted: x.counted, actual: x.actual, forecast: x.forecast, cancelled: x.cancelled, standin: x.standin, off: x.off, carrier: x.carrierText, phase: x.phase}));
      const fig = (T.tFig || []).map(x => ({date: x.event && x.event.date, task: x.event && x.event.task_id, item: x.event && x.event.item, amount: x.amount, internal: x.internal, plus: x.plus, words: x.words}));
      return {pl, fig, toDate: T.toDate, forecast: T.forecast};
    }));
    require('fs').writeFileSync('/tmp/gc500-scratch/progress/planned_legs.json', JSON.stringify(r, null, 1));
    console.log('ok');
  } catch (e) { console.error('FAILED', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
