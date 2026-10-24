/* Author: Andrew Fisher. v10.73 check (read-only): every milestone headline on Today reads in the area's unit count, and
   VMS boards reads "16 of 20 boards complete" (20 on drawing D025 rev 04, 16 on site); footer v10.73; no page errors.   PAGE=... [MOB=1] node test_v1073.cjs */
const {open} = require('../toolchain/harness/open_page');
(async () => {
  const MOB = !!process.env.MOB;
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900});
  const p = s.page, errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live', null, {timeout: 240000}); await p.waitForTimeout(3000);
  await p.evaluate(() => go('today')); await p.waitForTimeout(7000);
  const r = await p.evaluate(() => {
    const facts = holdAssets(() => MS1025.allFacts()), fails = [], rows = [];
    document.querySelectorAll('#pane-today details.ms1025-area summary').forEach(sm => { const t = sm.innerText.replace(/\s+/g, ' ').trim(); rows.push(t);
      const f = facts.find(x => t.startsWith(x.name)); if (!f) return;
      const want = f.units && f.units.total ? f.units.done + ' of ' + f.units.total + (f.unit ? ' ' + f.unit : '') + ' complete' : f.complete + ' of ' + f.total + ' complete';
      if (!t.includes(want)) fails.push(f.name + ': "' + t + '" lacks "' + want + '"'); });
    const vms = rows.find(t => /^VMS boards/.test(t)); if (!vms || !/16 of 20 boards complete/.test(vms)) fails.push('VMS headline: ' + vms);
    const foot = (document.getElementById('footL') || {}).textContent || ''; if (!/v10\.73$/.test(foot.trim())) fails.push('footer ' + foot.slice(-12));
    return {rows, fails}; });
  if (errs.length) r.fails.push('page errors: ' + errs.join(' | '));
  console.log(JSON.stringify({device: MOB ? 'phone' : 'desktop', pass: !r.fails.length, ...r}, null, 1));
  try { if (s.browser) await s.browser.close(); } catch (e) {} process.exit(r.fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
