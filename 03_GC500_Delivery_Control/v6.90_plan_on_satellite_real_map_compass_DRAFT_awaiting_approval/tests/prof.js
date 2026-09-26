// where a frame's time goes in Plan on satellite (trace categories summed over a wheel burst)
const {open, settle} = require('/tmp/claude-0/stage/tools/harness'); const fs = require('fs');
const V = process.argv[2] || 'after';
const DIRS = V === 'before' ? ['/tmp/claude-0/stage/work/before_site'] : ['/tmp/claude-0/stage2/explorer', '/tmp/claude-0/stage/work/before_site'];
(async () => { process.env.GL = '1';
  const s = await open({dirs: DIRS, W: 1440, H: 900, dpr: 1, hash: '#hybrid', log: () => {}}); const p = s.page;
  await p.waitForFunction(() => window.__ready || window.__bootError, null, {timeout: 120000}); await settle(p); await p.waitForTimeout(1500);
  const bb = await (await p.$('#stage')).boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await p.evaluate(() => { window.__perf.frames = 0; window.__perf.frameMs = 0; });
  await s.browser.startTracing(p, {path: '/tmp/claude-0/stage2/t.json', categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'gpu']});
  for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, -150); await p.waitForTimeout(30); }
  await p.waitForTimeout(800); await s.browser.stopTracing();
  const pf = await p.evaluate(() => ({frames: window.__perf.frames, avgDrawMs: +(window.__perf.frameMs / Math.max(1, window.__perf.frames)).toFixed(1)}));
  const ev = JSON.parse(fs.readFileSync('/tmp/claude-0/stage2/t.json')).traceEvents.filter(e => e.ph === 'X' && e.dur); const tot = {};
  for (const e of ev) tot[e.name] = (tot[e.name] || 0) + e.dur / 1000;
  console.log(V, JSON.stringify(pf)); console.log(Object.entries(tot).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, v]) => '  ' + k + ' ' + v.toFixed(0) + 'ms').join('\n'));
  await s.browser.close(); })();
