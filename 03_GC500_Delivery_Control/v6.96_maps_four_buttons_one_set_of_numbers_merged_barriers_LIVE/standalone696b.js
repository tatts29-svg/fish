const {open} = require('./lh2');
(async () => { const s = await open({pageFile: process.env.PAGE, gl: true}); const p = s.page;
  await p.goto('https://gc500-production.up.railway.app/w/Coates-GC500-2026/explorer/index.html', {waitUntil: 'load', timeout: 180000});
  await p.waitForFunction(() => window.__ready, null, {timeout: 240000});
  const r = await p.evaluate(() => ({title: document.querySelector('#findCard h3').textContent, chips: [...document.querySelectorAll('#chips .chip')].map(b => b.textContent.replace(/\s+/g, ' ').trim())}));
  r.wb = await p.evaluate(() => { const b = [...document.querySelectorAll('#chips .chip')].find(x => /Water-filled/.test(x.textContent)); b.click(); return {head: document.querySelector('#findList .rh').textContent, marks: window.__marksCount().marks, rows: document.querySelectorAll('#findList button').length}; }); r.errors = s.errors; console.log(JSON.stringify(r)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
