const {open} = require('./lh2'); const fs = require('fs');
(async () => { const s = await open({pageFile: '/tmp/claude-0/stage4/live_page_697.html', hash: '#prestarts', gl: false}); const p = s.page;
  await p.waitForFunction(() => typeof ps7Print === 'function' && document.querySelector('#pane-prestarts .ps7box'), null, {timeout: 150000});
  await p.waitForTimeout(2000); const rows = await p.evaluate(() => [...document.querySelectorAll('.ps7row .pretitle')].map(x => x.firstChild.textContent.trim()));
  await p.evaluate(() => { window.print = () => {}; }); await p.evaluate(() => ps7Print('2026-09-28')); await p.waitForTimeout(1200);
  const pdf = await p.pdf({preferCSSPageSize: true, printBackground: true}); fs.writeFileSync('/tmp/claude-0/stage4/shots/LIVE_Prestart_Coates_2026-09-28.pdf', pdf);
  console.log(JSON.stringify({rows, errors: s.errors})); await s.browser.close(); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
