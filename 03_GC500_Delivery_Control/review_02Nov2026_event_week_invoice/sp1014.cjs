'use strict';
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#fencing', W: 1280, H: 900}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000}); await p.waitForTimeout(2500);
    const out = await p.evaluate(() => {
      let sp = null; try { sp = supplierPricing1014(); } catch (e) { return 'ERR ' + e; }
      const txt = JSON.stringify(sp);
      const pick = n => { const i = txt.indexOf('"' + n + '"'); return i < 0 ? null : txt.slice(Math.max(0, i - 300), i + 500); };
      return {keys: sp && typeof sp === 'object' ? Object.keys(sp).slice(0, 20) : typeof sp, len: txt.length, s36597: pick('36597'), s36519: pick('36519'), gate: (txt.match(/[^{}]{0,200}(v_gate|vehicle|V gate|veh)[^{}]{0,200}/i) || [null])[0], tl: (txt.match(/[^{}]{0,200}(leader)[^{}]{0,200}/i) || [null])[0]};
    });
    console.log(JSON.stringify(out, null, 1).slice(0, 6000));
  } catch (e) { console.log('ERR', String(e).slice(0, 300)); }
  await s.browser.close();
})();
