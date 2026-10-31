// Log every render() call during load with its caller chain.
const {open} = require('./popen.cjs');
const INIT = `(() => { const L = window.__wr = []; const t = () => Math.round(performance.now());
 document.addEventListener('DOMContentLoaded', () => { const r0 = window.render; if (typeof r0 !== 'function') return; window.render = function () { const st = (new Error().stack || '').split('\\n').slice(2, 9).map(x => x.trim().replace(/^at /, '').replace(/\\(?https?:[^)]*:(\\d+):\\d+\\)?/, 'L$1')).join(' < '); const a = t(); try { return r0.apply(this, arguments); } finally { L.push([a, t() - a, state.tab, document.documentElement.getAttribute('data-refresh904'), st]); } }; }, {capture: true});
  const iv = setInterval(() => { if (typeof window.syncRedraw !== 'function') return; clearInterval(iv); const s0 = window.syncRedraw; window.syncRedraw = function () { L.push([t(), 0, 'syncRedraw()', document.readyState, (new Error().stack || '').split('\\n').slice(2, 8).map(x => x.trim().replace(/^at /, '').replace(/\\(?https?:[^)]*:(\\d+):\\d+\\)?/, 'L$1')).join(' < ')]); return s0.apply(this, arguments); }; }, 1);
})();`;
(async () => { const s = await open({pageFile: process.env.PAGE, init: INIT}); await s.page.waitForTimeout(+(process.env.WAIT || 15000));
 const r = await s.page.evaluate(() => window.__wr); console.log(process.env.PAGE); r.forEach(x => console.log('  ', JSON.stringify(x).slice(0, 420))); await s.browser.close(); })();
