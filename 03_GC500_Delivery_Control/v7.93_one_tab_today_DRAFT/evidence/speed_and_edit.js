// v7.93 - how long Today takes to draw, live v7.92 against v7.93, and what an editing link shows. Read only.
//   PAGE=<page> TAG=<name> node speed_and_edit.js
const path = require('path');
const {open} = require(path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page.js'));
(async () => { const s = await open({pageFile: process.env.PAGE, W: 1440, H: 900}), p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000}); await new Promise(r => setTimeout(r, 4000));
  const t = await p.evaluate(async () => { const out = {today: [], progress: []};
    for (let i = 0; i < 6; i++) { go('timeline'); await new Promise(r => setTimeout(r, 400)); let a = performance.now(); go('today'); out.today.push(Math.round(performance.now() - a)); await new Promise(r => setTimeout(r, 400)); }
    for (let i = 0; i < 6; i++) { go('timeline'); await new Promise(r => setTimeout(r, 400)); let a = performance.now(); go('progress'); out.progress.push(Math.round(performance.now() - a)); await new Promise(r => setTimeout(r, 400)); }
    const med = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
    return {todayMedianMs: med(out.today), progressMedianMs: med(out.progress), raw: out}; });
  const edit = await p.evaluate(async () => { window.capability = () => 'edit'; window.mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit';
    document.body.classList.remove('viewonly'); go('timeline'); await new Promise(r => setTimeout(r, 500)); go('today'); await new Promise(r => setTimeout(r, 1200));
    const T = document.getElementById('pane-today'), vis = e => !!e && e.getClientRects().length > 0;
    return {yourRecords: [...T.querySelectorAll('.hub > .card')].some(c => vis(c) && /Your records/.test(c.textContent)), recordingAs: vis(T.querySelector(':scope > .hubhead .hubwho')),
      dateLineHidden: !vis(T.querySelector(':scope > .hubhead h2')), embedded: document.getElementById('pane-progress').parentElement === T}; });
  console.log(process.env.TAG, JSON.stringify({speed: t, edit}));
  await s.browser.close(); })();
