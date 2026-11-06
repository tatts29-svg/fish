// Plan on satellite: how it feels. Frame gaps during a wheel zoom burst, a drag and a turn; time until the view is sharp again.
// node perf.js before|after [phone]
const {open, settle} = require('/tmp/claude-0/stage2/tools/harness2');
const V = process.argv[2] || 'after', PHONE = process.argv[3] === 'phone';
const DIRS = V === 'before' ? ['/tmp/claude-0/stage/work/before_site'] : ['/tmp/claude-0/stage2/explorer', '/tmp/claude-0/stage/work/before_site'];
(async () => {
  process.env.GL = '1';
  const s = await open({dirs: DIRS, W: PHONE ? 390 : 1440, H: PHONE ? 844 : 900, dpr: PHONE ? 3 : 1, mobile: PHONE, hash: '#hybrid', log: () => {}});
  const p = s.page; await p.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: 120000}); await settle(p); await p.waitForTimeout(2000);
  const bb = await (await p.$('#stage')).boundingBox(); const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
  const measure = async (name, fn) => {
    await p.evaluate(() => { window.__fr = []; window.__on = true; let last = performance.now(); const f = t => { window.__fr.push(t - last); last = t; if (window.__on) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    const t0 = Date.now(); await fn(); const tAct = Date.now() - t0; const tq = Date.now(); await settle(p, 60000); const sharp = Date.now() - tq;
    const r = await p.evaluate(() => { window.__on = false; const g = window.__fr.slice(2).filter(Boolean).sort((a, b) => b - a), n = g.length; return {frames: n, p50: Math.round(g[Math.floor(n / 2)] || 0), p90: Math.round(g[Math.floor(n * .1)] || 0), worst: Math.round(g[0] || 0)}; });
    console.log(V, PHONE ? 'phone' : 'desk', name.padEnd(8), JSON.stringify({...r, actionMs: tAct, sharpAfterMs: sharp}));
  };
  await p.mouse.move(cx, cy);
  if (!PHONE) {
    await measure('zoomIn', async () => { for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, -150); await p.waitForTimeout(30); } });
    await measure('pan', async () => { await p.mouse.down(); for (let i = 0; i < 25; i++) await p.mouse.move(cx - i * 12, cy - i * 5); await p.mouse.up(); });
  } else {
    await measure('zoomIn', async () => { for (let i = 0; i < 4; i++) { await p.evaluate(() => document.getElementById('zoomIn').click()); await p.waitForTimeout(250); } });
    await measure('pan', async () => { await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 0; i < 25; i++) await p.mouse.move(cx - i * 6, cy - i * 3); await p.mouse.up(); });
  }
  await measure('north', async () => { await p.evaluate(() => (document.querySelector('[data-face="0"]') || document.getElementById('northBtn')).click()); await p.waitForTimeout(600); });
  await measure('zoomOut', async () => { for (let i = 0; i < 3; i++) { await p.evaluate(() => document.getElementById('zoomOut').click()); await p.waitForTimeout(250); } });
  console.log(V, 'errors', JSON.stringify(s.errors));
  await p.screenshot({path: `/tmp/claude-0/stage2/${V}_${PHONE ? 'phone' : 'desk'}_end.png`, timeout: 120000});
  await s.browser.close();
})();
