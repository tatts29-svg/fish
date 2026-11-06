const {open} = require('./popen.cjs');
const INIT = `(() => { const L = window.__hl = []; const t = () => Math.round(performance.now());
 for (const m of ['pushState', 'replaceState']) { const o = History.prototype[m]; History.prototype[m] = function (s, ti, u) { L.push([t(), m, String(u).replace(/^.*#/, '#'), document.readyState, (new Error().stack || '').split('\\n').slice(2, 22).map(x => x.trim().replace(/https?:[^)]*:(\\d+):\\d+/, 'L$1')).join(' < ')]); return o.apply(this, arguments); }; }
 addEventListener('hashchange', () => L.push([t(), 'hashchange', location.hash, document.readyState]));
 document.addEventListener('DOMContentLoaded', () => L.push([t(), 'DCL', location.hash]));
})();`;
(async () => { const s = await open({pageFile: process.env.PAGE, init: INIT}); await s.page.waitForTimeout(12000);
 const r = await s.page.evaluate(() => ({h: window.__hl, tab: state.tab, hash: location.hash, first: [...SYNC.first]}));
 r.h.forEach(x => console.log(JSON.stringify(x).slice(0, 400))); console.log('tab', r.tab, r.hash); await s.browser.close(); })();
