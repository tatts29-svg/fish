// Author: Andrew Fisher. Isolated inherited suite; original source remains unchanged.
__dirname = "/workspace/gc500-showcase-full-lap/03_GC500_Delivery_Control/v7.99_today_faster_fuller_LIVE/evidence";
require = require("node:module").createRequire("/workspace/gc500-showcase-full-lap/03_GC500_Delivery_Control/v7.99_today_faster_fuller_LIVE/evidence/same_figures.js");
// v7.99: every tab that shows money reads word for word as live (folds opened). Author: Andrew Fisher. Read-only.
//   BASE=<live page> PAGE=<built page> node same_figures.js
const {open} = require('../../toolchain/harness/open_page');
const TABS = ['today', 'costs', 'fencing', 'questions', 'coatesway', 'runsheet', 'plant'];
const grab = async file => { const s = await open({pageFile: file, W: 1440, H: 900, gl: false}), p = s.page, out = {};
  await p.waitForFunction(() => SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000}); await new Promise(r => setTimeout(r, 2000));
  for (const t of TABS) { await p.evaluate(t => go(t), t); await new Promise(r => setTimeout(r, 1500));
    await p.evaluate(t => document.querySelectorAll('#pane-' + t + ' details').forEach(d => { d.open = true; }), t); await new Promise(r => setTimeout(r, 1500));
    out[t] = await p.evaluate(t => { document.querySelectorAll('#pane-' + t + ' details').forEach(d => { d.open = true; });
      if (t === 'today') { const removed = /^(?:Map|Documents|Fencing|Your records|Next programme day|Programme|Also on the schedule.*|Roads between.*)$/;
        document.querySelectorAll('#pane-today > .hub > .card, #pane-today > .todaycols .card').forEach(c => { const h=c.querySelector('h3'); if(h && removed.test(h.textContent.trim())) c.remove(); }); }
      return document.getElementById('pane-' + t).innerText.replace(/last confirmed \d\d:\d\d/g, '').replace(/[ \t]+/g, ' '); }, t); }
  await s.browser.close(); return out; };
(async () => { const a = await grab(process.env.BASE), b = await grab(process.env.PAGE); let all = true;
  for (const t of TABS) { const A = a[t].split('\n').map(x => x.trim()).filter(Boolean).sort(), B = b[t].split('\n').map(x => x.trim()).filter(Boolean).sort();
    const onlyA = A.filter(x => !B.includes(x)), onlyB = B.filter(x => !A.includes(x)); const same = !onlyA.length && !onlyB.length; all = all && same;
    console.log((same ? 'SAME ' : 'DIFF ') + t + ` (${A.length} lines)` + (same ? '' : '  live only: ' + JSON.stringify(onlyA.slice(0, 4)) + '  v7.99 only: ' + JSON.stringify(onlyB.slice(0, 4)))); }
  console.log(all ? 'every line on every tab matches live' : 'differences above'); })();
