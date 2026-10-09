// Regression sweep: open every tab and a set of deep links on a build, and report page errors and console errors.
//   PAGE=build/GC500_v7.44/GC500_Delivery_Control_hosted.html node harness/sweep.js > sweep_desktop.json
//   MOB=1 PAGE=... node harness/sweep.js > sweep_phone.json
// Pass: 21 tabs, allErrors empty, cons empty. Read-only: every write the page tries is aborted.
const {open} = require('./open_page');
(async () => { const MOB = !!process.env.MOB; const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900}); const p = s.page; const R = {tabs: {}, hashes: {}, cons: []};
  p.on('console', m => { if (m.type() === 'error') R.cons.push(m.text().slice(0, 160) + ((m.location() || {}).url ? ' @ ' + m.location().url.slice(0, 160) : '')); });
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000}); await p.waitForTimeout(3000);
  const tabs = await p.evaluate(() => TABS.map(t => t[0]));
  for (const t of tabs) { const e0 = s.errors.length, c0 = R.cons.length;
    await p.evaluate(k => { try { go(k); } catch (e) { window.__goerr = k + ': ' + e.message; } }, t); await p.waitForTimeout(t === 'map' ? 6000 : 1600);
    R.tabs[t] = await p.evaluate(k => { const pane = document.getElementById('pane-' + k); const on = pane && !pane.hidden && pane.offsetHeight > 0;
      return {shown: !!on, h: pane ? pane.offsetHeight : 0, txt: pane ? pane.innerText.trim().length : 0, hash: location.hash, active: (document.querySelector('[aria-selected="true"], .tabs .on, nav .on') || {}).textContent || null, goerr: window.__goerr || null}; }, t);
    R.tabs[t].errors = s.errors.slice(e0); R.tabs[t].console = R.cons.slice(c0); }
  for (const h of ['#timeline', '#day/2026-09-28', '#change/2026-09-28', '#print/drivers/2026-09-28', '#sheet/__satellite3d', '#plant', '#today']) { const e0 = s.errors.length;
    await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(h.startsWith('#print') ? 9000 : 2500);
    R.hashes[h] = await p.evaluate(() => ({hash: location.hash, pane: (document.querySelector('main .pane:not([hidden])') || {}).id || null, bar: !!document.getElementById('dpbar')}));
    R.hashes[h].errors = s.errors.slice(e0);
    await p.evaluate(() => { const x = document.querySelector('#dpbar [data-dpbar-x]'); if (x) x.click(); }); await p.waitForTimeout(800); }
  // back/forward
  await p.evaluate(() => go('plant')); await p.waitForTimeout(1000); await p.evaluate(() => go('timeline')); await p.waitForTimeout(1000);
  await p.goBack().catch(() => {}); await p.waitForTimeout(1500); R.back = await p.evaluate(() => ({hash: location.hash, pane: (document.querySelector('main .pane:not([hidden])') || {}).id}));
  R.allErrors = s.errors; R.counts = s.counts; console.log(JSON.stringify(R)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
