// deep re-audit of the dashboard: load timing, tab-switch timing, long tasks, console/page errors, axe accessibility, per tab, desk + phone
const {chromium} = require('playwright'); const fs = require('fs');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
(async () => { const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const out = {};
  for (const [w, h, tag] of [[1366, 768, 'desk'], [390, 844, 'phone']]) {
    const ctx = await b.newContext({viewport: {width: w, height: h}, isMobile: w < 500, hasTouch: w < 500}); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push('PE ' + String(e).slice(0, 180))); p.on('console', m => { if (m.type() === 'error') errs.push('CE ' + m.text().slice(0, 160)); });
    await p.addInitScript(() => { window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(Math.round(e.duration)))).observe({type: 'longtask', buffered: true}); } catch (e) {} });
    const t0 = Date.now(); await p.goto(process.argv[2] + '#today', {waitUntil: 'load'}); const tLoad = Date.now() - t0;
    await p.waitForFunction(() => document.querySelector('#pane-today') && document.querySelector('#pane-today').children.length > 1, null, {timeout: 30000}); const tToday = Date.now() - t0;
    await p.waitForTimeout(2500);
    const nav = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const pnt = performance.getEntriesByType('paint'); return {dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), fcp: Math.round((pnt.find(x => x.name === 'first-contentful-paint') || {}).startTime || 0), lt: window.__lt.slice(), heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null, dom: document.getElementsByTagName('*').length}; });
    const tabs = await p.evaluate(() => TABS.map(t => t[0]).filter(k => !TABS_OFF.has(k)));
    const tabT = {}, axe = {};
    await p.addScriptTag({content: AXE});
    for (const t of tabs) {
      const ms = await p.evaluate(t => { const s = performance.now(); go(t); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(Math.round(performance.now() - s))))); }, t);
      await p.waitForTimeout(900); tabT[t] = ms;
      if (tag === 'desk' || ['today', 'progress', 'timeline', 'plant'].includes(t)) {
        const r = await p.evaluate(async () => { const r = await axe.run(document.querySelector('.pane.on') || document, {runOnly: ['wcag2a', 'wcag2aa'], resultTypes: ['violations']}); return r.violations.map(v => [v.id, v.impact, v.nodes.length]); });
        axe[t] = r; }
    }
    const hdr = await p.evaluate(() => { const r = await_axe = null; return null; }).catch(() => null);
    const headerAxe = await p.evaluate(async () => (await axe.run(document.querySelector('header.top'), {runOnly: ['wcag2a', 'wcag2aa']})).violations.map(v => [v.id, v.impact, v.nodes.length]));
    const heap2 = await p.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null);
    out[tag] = {tLoad, tToday, nav, tabT, axe, headerAxe, heapAfterTabs: heap2, errs: errs.slice(0, 15)};
    await ctx.close(); }
  fs.writeFileSync('reaudit_out.json', JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1).slice(0, 9000));
  await b.close(); })();
