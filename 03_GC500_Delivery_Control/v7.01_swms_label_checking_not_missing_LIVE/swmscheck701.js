const {open} = require('./lh2');
(async () => { const s = await open({pageFile: '/tmp/claude-0/stage4/t701.html', hash: '#prestarts', gl: false}); const p = s.page;
  await p.waitForFunction(() => document.querySelector('#pane-prestarts .preswms'), null, {timeout: 120000}); await p.waitForTimeout(3000);
  const a = await p.evaluate(() => [...document.querySelectorAll('#pane-prestarts .preswms')].map(e => e.innerText.replace(/\s+/g, ' ').trim()));
  await p.waitForTimeout(12000);
  const b = await p.evaluate(() => [...document.querySelectorAll('#pane-prestarts .preswms')].map(e => e.innerText.replace(/\s+/g, ' ').trim() + ' | href: ' + ((e.querySelector('a') || {}).href || '-').replace(/\/f\/[^/]+\//, '/f/<tok>/')));
  console.log(JSON.stringify({first: a, after15s: b, errors: s.errors})); await s.browser.close(); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
