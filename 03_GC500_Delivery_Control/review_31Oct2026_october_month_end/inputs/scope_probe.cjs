// Author: Andrew Fisher. Read-only: the event labour scope's allocation by branch and contract, and who the page rosters against each event role.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    const r = await p.evaluate(() => holdAssets(() => {
      const out = {};
      try { out.scope = JSON.parse(JSON.stringify(scopeBranchAllocation978(), (k, x) => typeof x === 'string' && x.length > 220 ? x.slice(0, 220) + '…' : x)); } catch (e) { out.scopeErr = e.message; }
      try { const R = roster859 ? roster859() : null; out.rosterKeys = R ? Object.keys(R) : null; } catch (e) { out.rosterErr = e.message; }
      return out;
    }));
    require('fs').writeFileSync('/tmp/gc500-scratch/progress/scope_probe.json', JSON.stringify(r, null, 1));
    console.log('ok');
  } catch (e) { console.error('FAILED', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
