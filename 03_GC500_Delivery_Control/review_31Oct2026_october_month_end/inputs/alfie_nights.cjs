// Author: Andrew Fisher. Read-only: Alfie Harris's accommodation lines (priced and unpriced) and the salary allowance's record window.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    const r = await p.evaluate(() => holdAssets(() => {
      const acc = ourCosts().filter(c => c.kind === 'accommodation');
      const alfie = acc.filter(c => c.person === 'Alfie Harris').map(c => ({d: c.date, amt: c.amount == null || c.amount === '' ? null : Number(c.amount), id: c.id}));
      const unpriced = acc.filter(c => c.amount == null || c.amount === '').map(c => ({d: c.date, who: c.person, id: c.id}));
      let allow = null; try { allow = labourAllowance858(); } catch (e) { allow = {err: e.message}; }
      const meals = ourCosts().filter(c => ['meals', 'misc'].includes(c.kind) && /^2026-11/.test(String(c.date))).map(c => ({k: c.kind, d: c.date, amt: c.amount, who: c.person, what: c.what || c.note || c.category}));
      return {alfie, unpriced, allow: JSON.parse(JSON.stringify(allow, (k, v) => typeof v === 'string' && v.length > 200 ? v.slice(0, 200) : v)), meals};
    }));
    console.log(JSON.stringify(r));
  } catch (e) { console.error('FAILED', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
