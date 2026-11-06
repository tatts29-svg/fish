// CPU profile of wheel zoom (and fencing idle) in the embedded explorer; prints self-time by function.
const {open} = require('./xembed');
(async () => { const s = await open({pageFile: process.env.PAGE, W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000}); await p.waitForTimeout(2500);
  await p.evaluate(() => go('map')); const fh = await p.waitForSelector('#pane-map iframe'); const f = await fh.contentFrame();
  await f.waitForFunction(() => window.GC500Explorer && GC500Explorer.state && GC500Explorer.state.ready, null, {timeout: 90000}); await p.waitForTimeout(3000);
  if (process.env.FENCE) { await f.evaluate(() => document.getElementById('fenceMode').click()); await p.waitForTimeout(2000); }
  const cdp = await p.context().newCDPSession(p); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval: 200}); await cdp.send('Profiler.start');
  const fb = await fh.boundingBox(); const box = await f.evaluate(() => { const b = document.getElementById('stage').getBoundingClientRect(); return {x: b.left + b.width / 2, y: b.top + b.height / 2}; });
  if (process.env.IDLE) await p.waitForTimeout(+process.env.IDLE);
  else { for (let i = 0; i < 10; i++) { await p.mouse.move(fb.x + box.x, fb.y + box.y); await p.mouse.wheel(0, -120); await p.waitForTimeout(90); } for (let i = 0; i < 10; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(90); } await p.waitForTimeout(1500); }
  const {profile} = await cdp.send('Profiler.stop');
  const self = new Map(), byId = new Map(profile.nodes.map(n => [n.id, n])); const dt = profile.timeDeltas; const cnt = new Map();
  profile.samples.forEach((id, i) => cnt.set(id, (cnt.get(id) || 0) + (dt[i] || 0)));
  for (const [id, us] of cnt) { const n = byId.get(id); const cf = n.callFrame; const k = (cf.functionName || '(anon)') + ' ' + (cf.url.split('/').pop().split('?')[0]) + ':' + (cf.lineNumber + 1); self.set(k, (self.get(k) || 0) + us); }
  const top = [...self].sort((a, b) => b[1] - a[1]).slice(0, 28); for (const [k, us] of top) console.log((us / 1000).toFixed(0).padStart(6) + ' ms  ' + k);
  await s.browser.close(); })().catch(e => { console.error('FAIL', e.stack); process.exit(1); });
