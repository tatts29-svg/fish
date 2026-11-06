const {open} = require('/tmp/claude-0/stage18/lh18au'); const fs = require('fs');
(async () => { const s = await open({pageFile: process.env.PAGE, hash: '#today', W: 1440, H: 900, gl: false}); const p = s.page;
 await p.route('**/*', r => r.request().method() === 'GET' ? r.fallback() : r.abort());
 await p.waitForFunction(() => typeof labourUnits === 'function' && typeof moneySummary === 'function', null, {timeout: 150000}); await p.waitForTimeout(6000);
 const R = await p.evaluate(() => { const o = {}; allAssets().forEach(a => chargeLines(a).forEach(l => { const m = labourMoney(a.key, l, a.key); o[a.key + '|' + l.item] = [m.total, labourUnits(a, l.item).length]; }));
  const P = labourPlan(); const M = moneySummary(); return {o, plan: P.all, labour: M.charge.labour, charge: M.charge.total}; });
 fs.writeFileSync(process.env.OUT, JSON.stringify(R)); await s.browser.close(); })();
