// CPU profile the page's load and each heavy tab; report the functions that eat the time (self and total), with line numbers
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const ctx = await browser.newContext({viewport: {width: 1280, height: 800}}); const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval: 200});
  const summarise = (prof, label) => {
    const nodes = new Map(prof.nodes.map(n => [n.id, n])), self = new Map(), dt = prof.timeDeltas; const counts = new Map();
    prof.samples.forEach((id, i) => counts.set(id, (counts.get(id) || 0) + (dt[i] || 0)));
    const parent = new Map(); for (const n of prof.nodes) for (const c of n.children || []) parent.set(c, n.id);
    const total = new Map();
    for (const [id, us] of counts) { const n = nodes.get(id), k = (n.callFrame.functionName || '(anon)') + ':' + n.callFrame.lineNumber; self.set(k, (self.get(k) || 0) + us);
      const seen = new Set(); let cur = id; while (cur != null) { const m = nodes.get(cur), kk = (m.callFrame.functionName || '(anon)') + ':' + m.callFrame.lineNumber; if (!seen.has(kk)) { seen.add(kk); total.set(kk, (total.get(kk) || 0) + us); } cur = parent.get(cur); } }
    const top = (m, n) => [...m].filter(([k]) => !/^\((program|idle|root|garbage collector)\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => k + ' ' + Math.round(v / 1000) + 'ms');
    console.log('==', label, '\n self:', top(self, 14).join(' | '), '\n total:', top(total, 22).join(' | '));
  };
  await cdp.send('Profiler.start');
  await page.goto(process.argv[2], {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(2500);
  summarise((await cdp.send('Profiler.stop')).profile, 'LOAD');
  for (const t of (process.argv[3] || 'plant,progress,timeline').split(',')) {
    await cdp.send('Profiler.start');
    await page.evaluate(t => document.querySelector(`#tabs [data-tab="${t}"]`).click(), t); await page.waitForTimeout(2500);
    summarise((await cdp.send('Profiler.stop')).profile, 'TAB ' + t);
  }
  await browser.close(); })();
