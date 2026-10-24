// Author: Andrew Fisher. v9.13 evidence pictures (read only): the T0103 drawer's Delivery card and Driver drop card, and the
// Drivers sheet's booked numbers cell, as drawn. Every write the page tries is aborted by the harness; none is expected.
//   PAGE=<build> [MOB=1] node tests/shots913.cjs        (pictures go to ../evidence/)
const path = require('path');
const {open} = require('../../toolchain/harness/open_page');
const MOB = process.env.MOB === '1', TAG = MOB ? 'phone' : 'laptop', EVID = path.join(__dirname, '..', 'evidence');
(async () => {
  const s = await open({pageFile: process.env.PAGE, mobile: MOB, W: MOB ? 390 : 1440, H: MOB ? 844 : 900, dpr: MOB ? 2 : 1}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof vms913Mount === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.has('vmsboard'), null, {timeout: 240000});
    await p.evaluate(() => openAsset('T0103')); await p.waitForTimeout(1500);
    const hide = () => p.evaluate(() => { const f = document.querySelector('#flash'); if (f) { f.hidden = true; f.style.display = 'none'; } });
    for (const [sel, nm] of [['#drawer [data-vms913-load]', 'deliverycard'], ['#drawer [data-vms913-pill]', 'dropcard']]) {
      /* page through the drawer until the element is drawn, opening any fold around it */
      let seen = false;
      for (let i = 0; i < 6 && !seen; i++) {
        seen = await p.evaluate(sl => { const e = document.querySelector(sl); if (!e) return false; for (let x = e.parentElement; x; x = x.parentElement) if (x.tagName === 'DETAILS') x.open = true; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }, sel);
        if (!seen) { const nx = await p.$('#drawer button:has-text("Next")'); if (!nx) break; await nx.click(); await p.waitForTimeout(700); }
      }
      if (!seen) { console.log('NOT DRAWN ' + nm); continue; }
      await p.evaluate(sl => document.querySelector(sl).scrollIntoView({block: 'center'}), sel); await p.waitForTimeout(600); await hide();
      const dollars = await p.evaluate(() => [...document.querySelectorAll('#drawer *')].filter(e => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && !e.children.length; }).some(e => /\$/.test(e.textContent)));
      if (dollars) { console.log('SKIPPED ' + nm + ': a dollar figure is in frame'); continue; }
      await p.screenshot({path: path.join(EVID, `drawer_${nm}_T0103_${TAG}.png`), animations: 'disabled'}); console.log('SHOT ' + nm);
    }
    await p.evaluate(() => { const c = document.querySelector('#dclose'); if (c) c.click(); });
    if (!MOB) { /* the Drivers sheet for T0103's load, drawn on screen the way the print lays it out (no print dialog) */
      const r = await p.evaluate(() => { const d = programmeDays().find(x => x.iso === '2026-10-08'), loads = dpLoads(d), i = loads.findIndex(x => (x.rows || []).some(r => r.a.key === 'T0103'));
        const w = document.createElement('div'); w.id = 'shot913'; w.className = 'dpwrap'; w.style.cssText = 'position:fixed;inset:0;overflow:auto;background:#fff;z-index:99999;padding:20px'; w.innerHTML = dpPage(d, loads[i], 'drv', i + 1, loads.length); document.body.appendChild(w);
        const el = w.querySelector('[data-vms913-truck]'); if (el) el.closest('table').scrollIntoView({block: 'center'}); return {has: !!el, dollars: /\$/.test(w.textContent)}; });
      await p.waitForTimeout(600); await hide();
      if (r.has && !r.dollars) { await p.screenshot({path: path.join(EVID, `drivers_sheet_T0103_${TAG}.png`)}); console.log('SHOT drivers sheet'); } else console.log('drivers sheet', JSON.stringify(r));
      await p.evaluate(() => document.getElementById('shot913').remove());
    }
    console.log('errors', JSON.stringify(s.errors), 'counts', JSON.stringify(s.counts));
  } finally { await s.browser.close(); }
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(2); });
