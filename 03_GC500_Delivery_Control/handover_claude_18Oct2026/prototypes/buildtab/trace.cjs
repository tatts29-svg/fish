/* Trace one tab switch (read only): every style recalc and layout in the 3 s after go(TAB), with the JS that forced it.
   env: PAGE, LINES, MOB, CPU, TAB, OUT, TAG */
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const fs = require('fs'), path = require('path');
const LINES = JSON.parse(fs.readFileSync(process.env.LINES, 'utf8'));
const scriptOf = ln => { for (const [i, id, s, e] of LINES) if (ln >= s && ln <= e) return i + ':' + id.replace(/-script$/, ''); return '?'; };
(async () => {
  const MOB = process.env.MOB === '1', CPU = +(process.env.CPU || 0), TAB = process.env.TAB || 'timeline', OUT = process.env.OUT || '.', TAG = process.env.TAG || 'trace';
  const s = await open({pageFile: process.env.PAGE, cpu: CPU, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})});
  const p = s.page; const cdp = await p.context().newCDPSession(p);
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000, polling: 500});
  await p.waitForTimeout(MOB ? 60000 : 12000);
  const events = [];
  cdp.on('Tracing.dataCollected', d => events.push(...d.value));
  const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', {traceConfig: {includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack', 'blink.user_timing', 'v8.execute'], recordMode: 'recordAsMuchAsPossible'}, transferMode: 'ReportEvents'});
  await p.evaluate(k => { performance.mark('go-start'); go(k); performance.mark('go-end'); }, TAB);
  await p.waitForTimeout(3000);
  await cdp.send('Tracing.end'); await done;
  const tl = events.filter(e => (e.name === 'Layout' || e.name === 'UpdateLayoutTree' || e.name === 'Paint' || e.name === 'PrePaint' || e.name === 'Layerize' || e.name === 'ParseHTML' || e.name === 'EvaluateScript' || e.name === 'FunctionCall') && e.ph === 'X');
  const sum = {}; const forced = {};
  for (const e of tl) { const ms = (e.dur || 0) / 1000; sum[e.name] = sum[e.name] || {n: 0, ms: 0}; sum[e.name].n++; sum[e.name].ms += ms;
    const st = e.args && e.args.beginData && e.args.beginData.stackTrace; if ((e.name === 'Layout' || e.name === 'UpdateLayoutTree') && st && st.length) {
      const f = st[0]; const k = e.name + ' < ' + (f.functionName || '(anon)') + '@' + scriptOf(f.lineNumber) + ':' + f.lineNumber + (st[1] ? ' < ' + (st[1].functionName || '(anon)') + '@' + scriptOf(st[1].lineNumber) : '');
      forced[k] = forced[k] || {n: 0, ms: 0}; forced[k].n++; forced[k].ms += ms; } }
  const r = o => Object.fromEntries(Object.entries(o).sort((a, b) => b[1].ms - a[1].ms).map(([k, v]) => [k, {n: v.n, ms: +v.ms.toFixed(1)}]));
  const big = tl.filter(e => e.name === 'UpdateLayoutTree' || e.name === 'Layout').sort((a, b) => (b.dur || 0) - (a.dur || 0)).slice(0, 14).map(e => { const st = (e.args && e.args.beginData && e.args.beginData.stackTrace) || []; return [e.name, +((e.dur || 0) / 1000).toFixed(1), (e.args && e.args.elementCount) || (e.args && e.args.beginData && e.args.beginData.dirtyObjects) || '', st.slice(0, 3).map(f => (f.functionName || '(anon)') + '@' + scriptOf(f.lineNumber) + ':' + f.lineNumber).join(' < ')]; });
  const t0 = Math.min(...tl.map(e => e.ts));
  const seq = tl.filter(e => (e.name === 'UpdateLayoutTree' || e.name === 'Layout') && (e.dur || 0) > 5000).map(e => [Math.round((e.ts - t0) / 1000), e.name, +((e.dur || 0) / 1000).toFixed(1), (((e.args && e.args.beginData && e.args.beginData.stackTrace) || [])[0] || {}).functionName || '']);
  const sched = events.filter(e => /ScheduleStyleRecalculation|InvalidateLayout|ScheduleStyleInvalidationTracking|StyleInvalidatorInvalidationTracking/.test(e.name)).map(e => { const st = (e.args && e.args.data && e.args.data.stackTrace) || (e.args && e.args.beginData && e.args.beginData.stackTrace) || []; return [Math.round((e.ts - t0) / 1000), e.name, st.slice(0, 3).map(f => (f.functionName || '(anon)') + '@' + scriptOf(f.lineNumber) + ':' + f.lineNumber).join(' < ')]; });
  const schedAgg = {}; sched.forEach(x => { const k = x[1] + ' ' + x[2]; schedAgg[k] = (schedAgg[k] || 0) + 1; });
  const out = {tag: TAG, totals: r(sum), forced: r(forced), big, seq, sched: sched.filter(x => x[2]).slice(0, 400), schedAgg};
  fs.writeFileSync(path.join(OUT, TAG + '_trace.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify({totals: out.totals, forced: out.forced, big: out.big, seq: out.seq}));
  await s.browser.close();
})();
