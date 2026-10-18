/* frames the main thread produces while idle on a tab, before and after pausing one named animation */
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
 const s = await open({pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true, cpu: +(process.env.CPU || 0)}); const p = s.page; const cdp = await p.context().newCDPSession(p);
 await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000}); await sleep(+(process.env.WAIT || 20000));
 await p.evaluate(k => go(k), process.env.TAB || 'plant'); await sleep(+(process.env.WAIT2 || 20000)); await p.waitForFunction(() => typeof PLANT_REST === 'undefined' || !PLANT_REST.flush, null, {timeout: 300000, polling: 1000}); await sleep(5000);
 console.log('anims', JSON.stringify(await p.evaluate(() => { const a = document.getAnimations(); return {all: a.length, running: a.filter(x => x.playState === 'running').length}; })));
 const count = async secs => { const ev = []; cdp.on('Tracing.dataCollected', d => ev.push(...d.value)); const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', {traceConfig: {includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'cc', 'blink']}, transferMode: 'ReportEvents'}); await sleep(secs * 1000); await cdp.send('Tracing.end'); await done; cdp.removeAllListeners('Tracing.dataCollected');
  const tn = {}; ev.filter(e => e.name === 'thread_name').forEach(e => tn[e.pid + ':' + e.tid] = e.args.name); const main = new Set(Object.keys(tn).filter(k => tn[k] === 'CrRendererMain'));
  const m = ev.filter(e => main.has(e.pid + ':' + e.tid) && e.ph === 'X'); const sum = n => +(m.filter(e => e.name === n).reduce((a, e) => a + e.dur, 0) / 1000).toFixed(0);
  return {commits: m.filter(e => e.name === 'Commit').length, bmf: m.filter(e => e.name === 'ProxyMain::BeginMainFrame').length, bmfMs: sum('ProxyMain::BeginMainFrame'), commitMs: sum('Commit'), paintMs: sum('Paint'), tasksMs: sum('ThreadControllerImpl::RunTask')}; };
 console.log('asis', JSON.stringify(await count(10)));
 const info = await p.evaluate(n => { const a = document.getAnimations(); const g = a.filter(x => x.animationName === n); g.forEach(x => x.pause()); return {all: a.length, running: a.filter(x => x.playState === 'running').length, paused: g.length, names: [...new Set(a.filter(x => x.playState === 'running').map(x => x.animationName))]}; }, process.env.ANIM || 'complete1008-glow');
 console.log('paused', JSON.stringify(info));
 console.log('after', JSON.stringify(await count(10)));
 await s.browser.close();
})();
