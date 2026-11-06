// Author: Andrew Fisher. Read-only: the priced accommodation lines on 23-25 Oct by person, to move Ludwig Chee's nights to NVAC.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    const r = await p.evaluate(() => holdAssets(() => {
      const acc = ourCosts().filter(c => c.kind === 'accommodation');
      const priced = acc.filter(c => c.amount != null && c.amount !== '');
      const by = {}; priced.forEach(c => { const m = String(c.date || '').slice(0, 7); by[m] = Math.round(((by[m] || 0) + Number(c.amount)) * 100) / 100; });
      return {version: (typeof SYNC !== 'undefined' && (SYNC.version || SYNC.ver)) || null, n: acc.length, priced: priced.length, byMonth: by,
              ev: priced.filter(c => /2026-10-2[2-6]/.test(String(c.date))).map(c => ({d: c.date, who: c.person, amt: Number(c.amount), id: c.id}))};
    }));
    console.log(JSON.stringify(r));
  } catch (e) { console.error('FAILED', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
