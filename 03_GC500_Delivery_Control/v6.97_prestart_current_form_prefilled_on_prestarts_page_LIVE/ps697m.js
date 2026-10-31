const {open} = require('./lh2');
(async () => { const s = await open({pageFile: process.env.PAGE, hash: '#prestarts', gl: false}); const p = s.page;
  await p.waitForFunction(() => typeof ps7Print === 'function' && typeof programmeDays === 'function' && document.querySelector('#pane-prestarts .ps7box'), null, {timeout: 120000}); await p.waitForTimeout(2000);
  await p.evaluate(() => { window.print = () => {}; }); await p.evaluate(() => ps7Print('2026-09-28')); await p.waitForTimeout(800);
  await p.emulateMedia({media: 'print'});
  const r = await p.evaluate(() => { const sec = document.querySelector('#dayprint .ps7'); const w = document.getElementById('dayprint');
    const kids = [...sec.children].map(c => [c.tagName + '.' + (c.className || '').split(' ')[0], Math.round(c.getBoundingClientRect().height)]);
    return {sec: Math.round(sec.getBoundingClientRect().height), wrapW: Math.round(w.getBoundingClientRect().width), fen: sec.classList.contains('fen'), font: getComputedStyle(sec).fontSize, hzp: getComputedStyle(sec.querySelector('.hz p')).fontSize, kids}; });
  console.log(JSON.stringify(r)); await s.browser.close(); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
