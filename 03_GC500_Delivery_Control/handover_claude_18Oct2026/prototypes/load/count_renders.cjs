// Count full Today redraws during load (pane-today children replaced) and when the panel is revealed.
const {open} = require('./popen.cjs');
const INIT = `(() => { const R = window.__rc = {draws: [], reveal: null}; const t = () => Math.round(performance.now());
 const hook = () => { const pane = document.getElementById('pane-today'); if (!pane) return setTimeout(hook, 20);
  new MutationObserver(ms => { let big = 0; ms.forEach(m => { if (m.target === pane && m.removedNodes.length + m.addedNodes.length > 2) big++; }); if (big) R.draws.push([t(), document.documentElement.getAttribute('data-refresh904')]); }).observe(pane, {childList: true}); };
 hook(); new MutationObserver(() => { const v = document.documentElement && document.documentElement.getAttribute('data-refresh904'); if (v && v !== 'loading' && R.reveal == null) R.reveal = [t(), v]; }).observe(document, {attributes: true, subtree: true, attributeFilter: ['data-refresh904']});
})();`;
(async () => { const s = await open({pageFile: process.env.PAGE, init: INIT}); await s.page.waitForTimeout(+(process.env.WAIT || 15000));
 const r = await s.page.evaluate(() => ({rc: window.__rc, tab: state.tab, docs: DOCS.state}));
 console.log(process.env.PAGE, 'reveal', JSON.stringify(r.rc.reveal), 'today redraws', r.rc.draws.length, JSON.stringify(r.rc.draws), 'tab', r.tab); await s.browser.close(); })();
