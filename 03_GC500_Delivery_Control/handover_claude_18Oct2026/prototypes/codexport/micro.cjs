/* Read-only micro-measures of the two wrappers that run on every poll / drawer change:
   (1) syncFooter() x20 cost; (2) with a building drawer open, 20 drawer-subtree mutations (each fires the align
   observer's rAF) cost; (3) 20 s idle with the drawer open (profile busy). env PAGE, LINES, TAG, MOB, CPU */
const {open} = require('./open2.cjs'); const fs = require('fs');
(async () => { const MOB = process.env.MOB === '1', CPU = +(process.env.CPU || 0), TAG = process.env.TAG;
 const s = await open({pageFile: process.env.PAGE, cpu: CPU, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})}); const p = s.page, cdp = s.cdp; const out = {tag: TAG};
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000, polling: 500});
  await p.waitForTimeout(MOB ? 30000 : 10000);
  out.footer = await p.evaluate(() => { const r = []; for (let j = 0; j < 3; j++) { const t = performance.now(); for (let i = 0; i < 20; i++) syncFooter(); r.push(+(performance.now() - t).toFixed(1)); } return r; });
  out.key = await p.evaluate(() => { const a = allAssets().find(a => a.discipline === 'Portable buildings' && !a._cancelled); return a && a.key; });
  await p.evaluate(k => openAsset(k), out.key); await p.waitForTimeout(3000);
  out.drawerOn = await p.evaluate(() => document.getElementById('drawer').classList.contains('on'));
  out.mut = await p.evaluate(async () => { const db = document.getElementById('drawer'); let busy = 0; for (let i = 0; i < 20; i++) { const n = document.createElement('span'); n.className = 'perfprobe'; db.appendChild(n);
     const t = await new Promise(r => requestAnimationFrame(() => { const t0 = performance.now(); setTimeout(() => r(0), 0); })); n.remove(); await new Promise(r => setTimeout(r, 60)); }
    return 'done'; });
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval: 500}); await cdp.send('Profiler.start');
  const t0 = Date.now(); await p.evaluate(async () => { const db = document.getElementById('drawer'); for (let i = 0; i < 20; i++) { const n = document.createElement('span'); db.appendChild(n); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0))); n.remove(); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0))); } });
  const {profile: pm} = await cdp.send('Profiler.stop');
  const busy = (pr, name) => { const nodes = new Map(pr.nodes.map(n => [n.id, n])); const parent = new Map(); pr.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id))); const self = new Map(); for (let i = 0; i < pr.samples.length; i++) self.set(pr.samples[i], (self.get(pr.samples[i]) || 0) + (pr.timeDeltas[i + 1] || 0) / 1000);
   let b = 0; const t = {}; for (const [id, ms] of self) { const f = nodes.get(id).callFrame.functionName; if (!/^\((idle|program|garbage collector)\)$/.test(f)) b += ms; const seen = new Set(); let x = id; while (x !== undefined) { const fn = nodes.get(x).callFrame.functionName; if (/^(buildAllAssets|holdAssets|drawer|costs|syncFooter|scan)$/.test(fn) && !seen.has(fn)) { seen.add(fn); t[fn] = (t[fn] || 0) + ms; } x = parent.get(x); } }
   return {busy: +b.toFixed(1), t: Object.fromEntries(Object.entries(t).map(([k, v]) => [k, +v.toFixed(1)]))}; };
  out.drawerMutations = busy(pm);
  await cdp.send('Profiler.start'); await p.waitForTimeout(20000); const {profile: pi} = await cdp.send('Profiler.stop'); out.drawerIdle20s = busy(pi);
  out.errors = s.errors; out.blocked = s.counts.blocked;
 } catch (e) { out.err = String(e && e.stack || e).slice(0, 600); }
 fs.writeFileSync('runs/' + TAG + '.json', JSON.stringify(out, null, 1)); console.log(JSON.stringify(out)); await s.browser.close(); })();
