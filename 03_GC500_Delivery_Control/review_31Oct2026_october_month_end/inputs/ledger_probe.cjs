// Author: Andrew Fisher. Read-only: the shape of the page's P&L ledger and cost lines (dates, suppliers, orders) at job end.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    await p.waitForFunction(() => document.getElementById('pl1267'), null, {timeout: 60000});
    const r = await p.evaluate(() => holdAssets(() => {
      const short = v => JSON.parse(JSON.stringify(v, (k, x) => Array.isArray(x) && x.length > 4 ? x.slice(0, 4).concat(['…' + x.length]) : (typeof x === 'string' && x.length > 140 ? x.slice(0, 140) + '…' : x)));
      const out = {};
      try { const L = PL1267.ledger(); out.ledgerKeys = Object.keys(L); out.ledger = short(L); } catch (e) { out.ledgerErr = e.message; }
      try { const F = fh866Model(); out.fhKeys = Object.keys(F); out.costs = short(F.costs); } catch (e) { out.fhErr = e.message; }
      try { out.recordVersion = (typeof SYNC !== 'undefined' && (SYNC.version || SYNC.v)) || null; } catch (e) {}
      try { const cl = allCostLines ? allCostLines() : null; out.costLineKeys = cl && cl[0] ? Object.keys(cl[0]) : null; out.nCostLines = cl ? cl.length : null; } catch (e) { out.clErr = e.message; }
      return out;
    }));
    require('fs').writeFileSync('/tmp/gc500-scratch/progress/ledger_probe.json', JSON.stringify(r, null, 1));
    console.log('ok');
  } catch (e) { console.error('FAILED', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
