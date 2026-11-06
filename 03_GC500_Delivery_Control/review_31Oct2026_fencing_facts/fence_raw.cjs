// Author: Andrew Fisher. Read-only: each fencing docket's quantities exactly as recorded from the signed paper (before any pricing rule).
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    const r = await p.evaluate(() => holdAssets(() => allDockets().map(d => ({id: d.id, no: d.docket_no, date: d.date, week: d.week, usable: d.usable, location: d.location, crew: d.crew, signed_by: d.signed_by, scope: d.scope, origin: d.origin,
      quantities: d.quantities, components: d.components, note: d.note, to_be_charged: d.to_be_charged, not_charged_here: d.not_charged_here}))));
    require('fs').writeFileSync('/tmp/gc500-scratch/progress/fence_raw.json', JSON.stringify(r, null, 1));
    console.log('ok', r.length);
  } catch (e) { console.error('FAILED', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
