/* Author: Andrew Fisher. v11.33 checks: the Fence closures tab (#fenceclose) lists the ten closure points as marked on the plan
   (3 black, 3 orange, 2 teal, 2 pink) with the day's fence closure at 07:00 and the windows written on the plan, a closed and
   an opened tick per point that are not pre-ticked and refuse to write on the view link, the three race days, and the
   printable sheet on #print/fenceclose/<date>; the Fencing tab's closure card no longer calls the numbers an order.
   GET only; the record is compared.
     PAGE=build/GC500_v11.33/GC500_Delivery_Control_hosted.html node tests/test_v1133.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 900))); };
const tag = (live ? 'live_' : '') + (MOB ? 'phone' : 'desktop');
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#fenceclose', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#fenceclose', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForFunction(() => { const pane = document.getElementById('pane-fenceclose'); return pane && pane.offsetHeight > 0 && pane.querySelectorAll('.f1133-point').length > 0; }, null, {timeout: 60000});
  await p.waitForTimeout(1000);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.33'));
  const tab = await p.evaluate(() => ({inTabs: TABS.some(t => t[0] === 'fenceclose' && t[1] === 'Fence closures'), shown: document.getElementById('pane-fenceclose').offsetHeight > 0, hash: location.hash}));
  check('the tab is in the list as Fence closures, #fenceclose shows it', tab.inTabs && tab.shown && /fenceclose/.test(tab.hash), tab);
  const pts = await p.evaluate(() => FenceClose1133.points().map(x => ({id: x.id, n: x.n, colour: x.colour, where: x.where})));
  const colours = pts.reduce((m, x) => (m[x.colour] = (m[x.colour] || 0) + 1, m), {});
  check('ten closure points as marked: numbers 1 to 7, 3 black, 3 orange, 2 teal, 2 pink, each with its place as read', pts.length === 10 && colours.black === 3 && colours.orange === 3 && colours.teal === 2 && colours.pink === 2 && pts.every(x => x.where.length > 8) && pts.map(x => x.n).join(',') === '1,1,2,2,3,3,4,5,6,7', {colours, pts: pts.slice(0, 4)});
  await p.evaluate(() => { document.querySelector('#pane-fenceclose [data-f1133-day="2026-10-24"]').click(); });
  const dom = await p.evaluate(() => { const pane = document.getElementById('pane-fenceclose'), txt = pane.innerText;
   return {points: pane.querySelectorAll('.f1133-point').length, dots: pane.querySelectorAll('.f1133-point .clodot').length, am: /7-7\.25am/.test(txt), pm: /5\.53pm-7pm/.test(txt), fence: /Fence closure/.test(txt) && /07:00/.test(txt) && /07:45/.test(txt), opening: /17:20/.test(txt),
    notOrder: /not the order/.test(txt), days: [...pane.querySelectorAll('[data-f1133-day]')].map(b => b.dataset.f1133Day), ticks: pane.querySelectorAll('input.f1133-tick').length, ticked: pane.querySelectorAll('input.f1133-tick:checked').length, printBtn: !!pane.querySelector('[data-f1133-print]'), overflow: document.documentElement.scrollWidth - window.innerWidth, heading: (pane.querySelector('.f1133-day h3') || {}).textContent}; });
  check('Saturday: ten points with their colour dots, the windows written on the plan (7-7.25am, 5.53pm-7pm), the 07:00 fence closure, vehicles off 07:45, the 17:20 opening lap, "not the order", three days, a print button', dom.points === 10 && dom.dots === 10 && dom.am && dom.pm && dom.fence && dom.opening && dom.notOrder && dom.days.join(',') === '2026-10-23,2026-10-24,2026-10-25' && dom.printBtn && /Saturday/.test(dom.heading), dom);
  check('nothing is pre-ticked: 22 ticks (10 closed, 10 opened, sign-off, audit), none checked; no horizontal overflow', dom.ticks === 22 && dom.ticked === 0 && dom.overflow <= 1, {ticks: dom.ticks, ticked: dom.ticked, overflow: dom.overflow});
  const fri = await p.evaluate(() => { const pane = document.getElementById('pane-fenceclose'); pane.querySelector('[data-f1133-day="2026-10-23"]').click(); const t = pane.innerText; return {am: /7-8am/.test(t), pm: /6-7pm/.test(t), lap: /08:15/.test(t) && /17:00/.test(t)}; });
  check('Friday carries its own windows (7-8am, 6-7pm) and times (closing lap 08:15, opening lap 17:00)', fri.am && fri.pm && fri.lap, fri);
  const refused = await p.evaluate(() => { const pane = document.getElementById('pane-fenceclose'); const box = pane.querySelector('input.f1133-tick[data-f1133="closed"]'); box.click(); return new Promise(r => setTimeout(() => r({checkedAfter: !!pane.querySelector('input.f1133-tick[data-f1133="closed"]').checked, anyChecked: pane.querySelectorAll('input.f1133-tick:checked').length, recs: Object.keys(S.loads || {}).filter(k => k.indexOf('fenceclose1133/') === 0).length}), 600)); });
  check('a tick on the view link is refused and springs back; nothing is written', !refused.checkedAfter && refused.anyChecked === 0 && refused.recs === 0, refused);
  await p.screenshot({path: path.join(out, 'fenceclose_tab_' + tag + '.png'), fullPage: true});
  /* the closure card sits inside a fold on the Fencing tab, so its text is read from the DOM, shown or folded */
  const fencing = await p.evaluate(() => { go('fencing'); return new Promise(r => setTimeout(() => { const t = document.getElementById('pane-fencing').textContent; r({order: /what closes, in what order|The order it closes in/.test(t), notOrder: /not the order the points close in/.test(t), marked: /The closure points as marked on the plan/.test(t), has: /clocard|Race weekend/.test(document.getElementById('pane-fencing').innerHTML)}); }, 2500)); });
  check('the Fencing tab’s closure card no longer calls the circled numbers an order', !fencing.order && fencing.notOrder && fencing.marked, fencing);
  await p.evaluate(() => { location.hash = '#print/fenceclose/2026-10-24'; });
  await p.waitForFunction(() => document.querySelector('#dayprint .ps7.f1133'), null, {timeout: 30000});
  await p.waitForTimeout(1500);
  const sheet = await p.evaluate(() => { const sec = document.querySelector('#dayprint .ps7.f1133'); const t = sec.innerText; return {rows: sec.querySelectorAll('table.f1133-t tbody tr').length, title: (sec.querySelector('h1') || {}).textContent, zoom: sec.style.zoom || '1', windows: /7-7\.25am/.test(t) && /5\.53pm-7pm/.test(t), fence: /Fence closure/.test(t), notOrder: /not the order/.test(t)}; });
  check('the closures sheet prints on #print/fenceclose/<date>: one A4 page with the ten points, the windows and the fence closure', sheet.rows === 10 && /Saturday/.test(sheet.title) && parseFloat(sheet.zoom) >= 0.8 && sheet.windows && sheet.fence && sheet.notOrder, sheet);
  await p.screenshot({path: path.join(out, 'fenceclose_sheet_' + tag + '.png'), fullPage: true});
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1133.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
