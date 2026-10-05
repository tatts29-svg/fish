// quick probe: open the build, click Finance handover, report errors, model and screenshots
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const MOB = !!process.env.MOB;
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900});
  const p = s.page; const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000}); await p.waitForTimeout(2500);
  await p.evaluate(() => go('costs')); await p.waitForFunction(() => { try { return moneySummary().charge.labour >= 0; } catch (e) { return false; } }, null, {timeout: 30000}); await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = document.querySelector('[data-finance857="handover"]'); if (b) b.click(); }); await p.waitForTimeout(1500);
  const out = await p.evaluate(() => holdAssets(() => { const H = fh866Model(); const sec = document.getElementById('handover866');
    return {present: !!sec, head: (document.querySelector('#finance857-section .panehead') || {}).textContent, pos: H.pos.map(o => ({n: o.number, st: o.stream, br: o.costedBranch, rb: o.revenueBranch, amt: o.amount, rc: o.receipt.key, mm: o.mismatch})), poSum: H.poSum, counts: H.counts, notConfirmed: H.notConfirmed,
      costs: H.costs.map(r => [r.stream.slice(0, 50), r.branch, r.revenueWords.slice(0, 60), r.pos, r.toDate, r.toCome, r.job, r.needs]), costTotal: H.costTotal, costCheck: H.costCheck, plJob: H.plJob,
      demob: H.demob.map(d => [d.stream, d.branch, d.forecast, d.basis.slice(0, 120), d.needs]), demobTotal: H.demobTotal, demobCharge: H.demobCharge, inv: H.inv, invTotal: H.invTotal, invCheck: H.invCheck, rr: H.revenueRecord, rj: H.revenueJob, days: H.daysLeft, billed: H.billed,
      text: sec ? sec.innerText.slice(0, 1500) : ''}; }));
  console.log(JSON.stringify(out, null, 1)); console.log('ERRORS', JSON.stringify(errs)); console.log('WRITES', JSON.stringify(s.counts));
  const el = await p.$('#handover866'); if (el) { const bb = await el.boundingBox(); await p.screenshot({path: process.env.SHOT || '/tmp/claude-0/-home-user-fish/710a1764-23a1-5338-9fe8-299f94961e8a/scratchpad/c866/handover.png', clip: {x: 0, y: Math.max(0, bb.y), width: MOB ? 390 : 1440, height: Math.min(bb.height, 1800)}}); }
  await s.browser.close();
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });
