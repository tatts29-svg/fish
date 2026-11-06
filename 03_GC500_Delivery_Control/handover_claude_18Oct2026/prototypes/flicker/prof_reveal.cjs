/* CPU profile (CDP Profiler) of the phone load, then self time by function inside a window measured from the
   record's reveal (data-refresh904 = ready). env PAGE, CPU (4), WIN0/WIN1 ms after ready (default 0..8000), OUT json. */
const {chromium, devices} = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const {curlFetch} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/curlfetch.js');
const PAGE = process.env.PAGE, CPU = +(process.env.CPU || 4), W0 = +(process.env.WIN0 || 0), W1 = +(process.env.WIN1 || 8000);
(async () => {
  const browser = await chromium.launch({args: ['--no-sandbox', '--lang=en-AU']});
  const ctx = await browser.newContext(Object.assign({...devices['iPhone 13'], viewport: {width: 390, height: 844}, deviceScaleFactor: 2}, {locale: 'en-AU', timezoneId: 'Australia/Brisbane'}));
  await ctx.route('**/*', async route => { const r = route.request(), u = r.url();
    if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (r.method() === 'GET' && /^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(\?.*)?$/.test(u.split('#')[0])) return route.fulfill({status: 200, headers: {'content-type': 'text/html; charset=utf-8'}, body: fs.readFileSync(PAGE)});
    if (r.method() !== 'GET' && !(r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession'))) return route.abort();
    try { return await route.fulfill(await curlFetch(u, r.headers(), r.method(), r.postData())); } catch (e) { try { await route.abort('failed'); } catch (_) {} } });
  await ctx.addInitScript(() => { const sa = Element.prototype.setAttribute; window.__ready = null; Element.prototype.setAttribute = function (n, v) { if (n === 'data-refresh904' && v === 'ready' && window.__ready == null) window.__ready = performance.now(); return sa.apply(this, arguments); }; });
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: CPU});
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval: 1000});
  await page.goto('https://gc500-production.up.railway.app/v/Coates-GC500-2026/', {waitUntil: 'commit', timeout: 180000});
  await cdp.send('Profiler.start');
  const t = await cdp.send('Runtime.evaluate', {expression: 'performance.now()', returnByValue: true});
  const perfAtStart = t.result.value;
  await page.waitForFunction(() => window.__ready != null, null, {timeout: 240000, polling: 500});
  const ready = await page.evaluate(() => window.__ready);
  await page.waitForTimeout(W1 + 2000);
  const {profile} = await cdp.send('Profiler.stop');
  // timeline of samples in page performance.now() terms
  const byId = new Map(profile.nodes.map(n => [n.id, n])); let tt = 0; const self = new Map(); const parentOf = new Map();
  profile.nodes.forEach(n => (n.children || []).forEach(c => parentOf.set(c, n.id)));
  const stackKey = id => { const out = []; for (let x = id, d = 0; x && d < 40; x = parentOf.get(x), d++) { const cf = byId.get(x).callFrame; if (cf.functionName || cf.url) out.push((cf.functionName || '(anon)') + ':' + cf.lineNumber); } return out; };
  const incl = new Map(); let total = 0, idle = 0;
  for (let i = 0; i < profile.samples.length; i++) { tt += profile.timeDeltas[i]; const ms = perfAtStart + tt / 1000; const rel = ms - ready; if (rel < W0 || rel > W1) continue;
    const n = byId.get(profile.samples[i]); const cf = n.callFrame; const name = cf.functionName || '(anon)'; const dt = (profile.timeDeltas[i + 1] || 1000) / 1000;
    if (name === '(idle)' || name === '(program)' || name === '(garbage collector)') { if (name === '(idle)') idle += dt; else total += dt; const k = name; self.set(k, (self.get(k) || 0) + dt); continue; }
    total += dt; const k = name + ' L' + (cf.lineNumber + 1) + ' C' + cf.columnNumber; self.set(k, (self.get(k) || 0) + dt);
    const seen = new Set(); for (const s of stackKey(n.id)) { if (seen.has(s)) continue; seen.add(s); incl.set(s, (incl.get(s) || 0) + dt); } }
  const top = m => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k, v]) => [k, Math.round(v)]);
  const out = {ready: Math.round(ready), window: [W0, W1], busyMs: Math.round(total), idleMs: Math.round(idle), self: top(self), inclusive: top(incl)};
  console.log(JSON.stringify(out, null, 1));
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
