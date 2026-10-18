/* measure the record-string cost and a few sizes in the page (read only) */
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
(async () => {
  const MOB = process.env.MOB === '1';
  const s = await open({pageFile: process.env.PAGE, cpu: +(process.env.CPU || 0), ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})});
  const p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000, polling: 500});
  await p.waitForTimeout(5000);
  const r = await p.evaluate(() => {
    const t0 = performance.now(); const j = JSON.stringify(S); const t1 = performance.now();
    const sizes = Object.fromEntries(Object.keys(S).map(k => { let n = 0; try { n = JSON.stringify(S[k]).length; } catch (e) {} return [k, n]; }).sort((a, b) => b[1] - a[1]).slice(0, 12));
    const loads = Object.keys(S.loads || {}).length;
    const h0 = performance.now(); const hz = getComputedStyle(document.querySelector('header.top')).getPropertyValue('--hzcar'); const h1 = performance.now();
    const t2 = performance.now(); JSON.stringify(todayWorkHealth840()); const t3 = performance.now();
    return {sLen: j.length, stringifyMs: +(t1 - t0).toFixed(1), sizes, loads, hzLen: hz.length, hzReadMs: +(h1 - h0).toFixed(1), healthMs: +(t3 - t2).toFixed(1), assets: allAssets().length, days: calendarDays().length};
  });
  console.log(JSON.stringify(r));
  await s.browser.close();
})();
