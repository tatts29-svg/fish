/* Parity capture: open a page (read-only), visit every tab, record each pane's innerText plus the Build tab's card
   attributes and a few money/progress figures. env: PAGE, MOB=1, OUT=file. */
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs');
(async () => {
  const MOB = process.env.MOB === '1';
  const s = await open({pageFile: process.env.PAGE, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})});
  const p = s.page; const out = {tabs: {}, extra: {}};
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000, polling: 500});
    await p.waitForTimeout(MOB ? 20000 : 8000);
    out.version = await p.evaluate(() => SYNC.db.readVersion821());
    const tabs = await p.evaluate(() => TABS.map(t => t[0]).filter(k => !TABS_OFF.has(k)));
    // freeze the clocks so the header text does not move between captures
    for (const k of tabs.concat(['timeline'])) {
      await p.evaluate(k => go(k), k);
      await p.waitForTimeout(k === 'timeline' ? (MOB ? 9000 : 6000) : (MOB ? 2500 : 1200));
      const r = await p.evaluate(k => { const pane = document.getElementById('pane-' + k); if (!pane) return {text: null, n: 0}; const c = pane.cloneNode(true); c.querySelectorAll('style,script').forEach(x => x.remove()); return {text: pane.innerText, n: pane.getElementsByTagName('*').length, full: c.textContent.replace(/\s+/g, ' ')}; }, k);
      out.tabs[k + (out.tabs[k] ? '#2' : '')] = r;
    }
    out.extra.timelineCards = await p.evaluate(() => [...document.querySelectorAll('#pane-timeline .bc984-day')].map(c => [c.dataset.day, c.dataset.buildProgress, c.getAttribute('aria-label'), c.innerText]));
    out.extra.version2 = await p.evaluate(() => SYNC.db.readVersion821());
    out.errors = s.errors; out.blocked = s.counts.blocked;
  } catch (e) { out.err = String(e && e.stack || e).slice(0, 800); }
  fs.writeFileSync(process.env.OUT, JSON.stringify(out));
  console.log(JSON.stringify({out: process.env.OUT, version: out.version, v2: out.extra.version2, tabs: Object.keys(out.tabs).length, err: out.err, errors: out.errors}));
  await s.browser.close();
})();
