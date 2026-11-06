const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const INIT = `window.__cv = []; document.addEventListener('contentvisibilityautostatechange', e => window.__cv.push([Math.round(performance.now()), e.target.id || e.target.className, e.skipped]), true);`;
(async () => {
 const s = await open({pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true, init: INIT}); const p = s.page;
 await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 300000}); await sleep(10000);
 await p.evaluate(() => go('plant')); await sleep(15000);
 console.log(JSON.stringify(await p.evaluate(() => ({cv: window.__cv.slice(-20), ncv: window.__cv.length,
  cards: [...document.querySelectorAll('#pane-plant > .card.has-table')].map(c => [c.className, getComputedStyle(c).contentVisibility, Math.round(c.getBoundingClientRect().top), c.querySelectorAll('.complete1008-ring').length]),
  ringParents: [...new Set([...document.querySelectorAll('.complete1008-ring')].filter(r => r.getAnimations().length).map(r => { const c = r.closest('.card'); return c ? c.className + '|' + (c.parentElement && c.parentElement.id) : 'nocard'; }))],
  closed: [...document.querySelectorAll('.complete1008-ring')].filter(r => r.getAnimations().length).map(r => { const d = r.closest('details:not([open])'); const inSum = d && [...d.children].find(c => c.tagName === 'SUMMARY')?.contains(r); return d ? ('closed' + (inSum ? '-summary' : '') + ':' + (d.className || d.id || '').slice(0, 30)) : 'open'; }).reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {}),
  states: [...document.querySelectorAll('.complete1008-ring')].filter(r => r.getAnimations().length).map(r => r.getAnimations()[0].playState + ':' + getComputedStyle(r).animationPlayState).slice(0, 5)}))));
 await s.browser.close();
})();
