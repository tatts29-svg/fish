// Author: Andrew Fisher. Read-only: the shape of the page's cost sources (forecast rows, transport legs, purchase orders, servicing) to date every cost.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    await p.waitForFunction(() => document.getElementById('pl1267'), null, {timeout: 60000});
    const r = await p.evaluate(() => holdAssets(() => {
      const short = (v, n = 3) => JSON.parse(JSON.stringify(v, (k, x) => Array.isArray(x) && x.length > n ? x.slice(0, n).concat(['…' + x.length]) : (typeof x === 'string' && x.length > 160 ? x.slice(0, 160) + '…' : x)));
      const out = {};
      const X = cj764Model(); out.Xkeys = Object.keys(X);
      out.rows = X.rows.map(r => ({stream: r.stream, branch: r.branch, toDate: r.toDate, toCome: r.toCome, keys: Object.keys(r), sample: short(r, 2)}));
      const T = transport888Core(); out.Tkeys = Object.keys(T); out.Tsample = short(T, 2);
      out.pos = poAll().map(o => short(o, 6));
      try { const S = servicing748(); out.Skeys = Object.keys(S || {}); out.Ssample = short(S, 2); } catch (e) { out.Serr = e.message; }
      return out;
    }));
    require('fs').writeFileSync('/tmp/gc500-scratch/progress/cost_sources.json', JSON.stringify(r, null, 1));
    console.log('ok');
  } catch (e) { console.error('FAILED', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
