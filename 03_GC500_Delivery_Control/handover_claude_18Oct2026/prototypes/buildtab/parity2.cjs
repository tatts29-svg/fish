/* Parity, deeper: the Build tab opened on many days (each day's panel), and the drawer of many references.
   Read only. env: PAGE, MOB, OUT */
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs');
(async () => {
  const MOB = process.env.MOB === '1';
  const s = await open({pageFile: process.env.PAGE, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})});
  const p = s.page; const out = {days: {}, drawers: {}};
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000, polling: 500});
    await p.waitForTimeout(MOB ? 20000 : 8000);
    out.version = await p.evaluate(() => SYNC.db.readVersion821());
    await p.evaluate(() => go('plant')); await p.waitForTimeout(MOB ? 6000 : 3000);
    out.plant = await p.evaluate(() => { try { if (PLANT_REST.flush) PLANT_REST.flush(); } catch (e) {} const pane = document.getElementById('pane-plant'); const c = pane.cloneNode(true); c.querySelectorAll('style,script').forEach(x => x.remove()); return {text: pane.innerText, full: c.textContent.replace(/\s+/g, ' ')}; });
    await p.evaluate(() => go('timeline')); await p.waitForTimeout(MOB ? 8000 : 4000);
    const days = await p.evaluate(() => [...document.querySelectorAll('#pane-timeline .bc984-day')].map(c => c.dataset.day));
    for (const d of days.filter((x, i) => i % 3 === 0)) {
      await p.evaluate(d => { const b = document.querySelector('#pane-timeline .bc984-day[data-day="' + d + '"]'); if (b) b.click(); }, d);
      await p.waitForTimeout(MOB ? 1500 : 500);
      out.days[d] = await p.evaluate(() => { const pane = document.getElementById('pane-timeline'); const c = pane.cloneNode(true); c.querySelectorAll('style,script,.daystrip').forEach(x => x.remove()); return c.textContent.replace(/\s+/g, ' '); });
    }
    const keys = await p.evaluate(() => allAssets().map(a => a.key));
    for (const k of keys.filter((x, i) => i % 6 === 0)) {
      await p.evaluate(k => openAsset(k), k); await p.waitForTimeout(MOB ? 900 : 350);
      out.drawers[k] = await p.evaluate(() => { const d = document.getElementById('drawer'); const c = d.cloneNode(true); c.querySelectorAll('style,script').forEach(x => x.remove()); return c.textContent.replace(/\s+/g, ' '); });
    }
    out.version2 = await p.evaluate(() => SYNC.db.readVersion821());
    out.errors = s.errors;
  } catch (e) { out.err = String(e && e.stack || e).slice(0, 800); }
  fs.writeFileSync(process.env.OUT, JSON.stringify(out));
  console.log(JSON.stringify({out: process.env.OUT, version: out.version, v2: out.version2, days: Object.keys(out.days).length, drawers: Object.keys(out.drawers).length, err: out.err, errors: out.errors}));
  await s.browser.close();
})();
