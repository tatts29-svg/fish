// the explorer's own-window snapshot: gc500PlanItems() from the dashboard page, over the live record (GET only)
const {open} = require('./lh2'); const fs = require('fs');
(async () => { const s = await open({pageFile: process.env.PAGE, gl: false}); const p = s.page;
  await p.waitForFunction(() => typeof gc500PlanItems === 'function' && typeof DATA === 'object', null, {timeout: 120000}); await p.waitForTimeout(8000);
  const snap = await p.evaluate(() => Object.assign(gc500PlanItems(), {taken: new Date().toISOString(), note: 'Snapshot of the master plan, for Plan on satellite opened in its own window. Opened from the dashboard it reads the live record instead.'}));
  fs.writeFileSync(process.env.OUTF, JSON.stringify(snap)); console.log('trades', snap.trades.map(t => t.name + ' ' + t.count).join(' | '), '· items', snap.items.length, '· layers', snap.layers.length, '· errors', s.errors.length);
  await s.browser.close(); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
