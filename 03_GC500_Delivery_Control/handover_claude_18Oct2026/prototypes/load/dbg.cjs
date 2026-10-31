const {open} = require('./popen.cjs'); const fs = require('fs');
const src = fs.readFileSync('measure.cjs', 'utf8'); const INIT = eval(src.match(/const INIT = (`[\s\S]*?`);/)[1]);
(async () => { const s = await open({pageFile: 'base.html', init: INIT}); await s.page.waitForTimeout(4000);
 console.log(await s.page.evaluate(() => JSON.stringify({m: window.__perf && window.__perf.marks, t: window.__perf && window.__perf.tabs, a: document.documentElement.getAttribute('data-refresh904')})));
 console.log(s.errors); await s.browser.close(); })();
